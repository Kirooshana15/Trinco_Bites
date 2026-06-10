import { describe, it, expect } from "vitest";
import { getCartItemPrices, MinimalCartItem } from "./pricing";

describe("Pricing Calculations & Invariant Tests", () => {
  it("should calculate correct price for a regular item with no extras", () => {
    const item: MinimalCartItem = {
      price: 1000,
      quantity: 1,
      selectedSize: "Regular",
    };
    const prices = getCartItemPrices(item);
    expect(prices.basePrice).toBe(1000);
    expect(prices.extrasTotal).toBe(0);
    expect(prices.itemTotal).toBe(1000);
  });

  it("should calculate correct price for a large item with no extras", () => {
    const item: MinimalCartItem = {
      price: 1000,
      quantity: 1,
      selectedSize: "Large",
    };
    const prices = getCartItemPrices(item);
    expect(prices.basePrice).toBe(1500); // 1000 * 1.5
    expect(prices.extrasTotal).toBe(0);
    expect(prices.itemTotal).toBe(1500);
  });

  it("should calculate correct price with extras for regular item", () => {
    const item: MinimalCartItem = {
      price: 1000,
      quantity: 1,
      selectedSize: "Regular",
      selectedExtras: [
        { name: "Extra Cheese", price: 150 },
        { name: "Bacon", price: 250 },
      ],
    };
    const prices = getCartItemPrices(item);
    expect(prices.basePrice).toBe(1000);
    expect(prices.extrasTotal).toBe(400); // 150 + 250
    expect(prices.itemTotal).toBe(1400);
  });

  it("should calculate correct price with extras for large item with quantity > 1", () => {
    const item: MinimalCartItem = {
      price: 1000,
      quantity: 2,
      selectedSize: "Large",
      selectedExtras: [
        { name: "Extra Cheese", price: 150 },
        { name: "Bacon", price: 250 },
      ],
    };
    const prices = getCartItemPrices(item);
    expect(prices.basePrice).toBe(1500);
    expect(prices.totalBasePrice).toBe(3000);
    expect(prices.extrasTotal).toBe(400);
    expect(prices.totalExtrasPrice).toBe(800);
    expect(prices.itemTotal).toBe(3800); // (1500 + 400) * 2
  });

  it("should satisfy the invariant Sum(Item Totals) = Cart Subtotal", () => {
    const items: MinimalCartItem[] = [
      {
        price: 1000,
        quantity: 2,
        selectedSize: "Large",
        selectedExtras: [
          { name: "Extra Cheese", price: 150 },
          { name: "Bacon", price: 250 },
        ],
      },
      {
        price: 850,
        quantity: 1,
        selectedSize: "Regular",
      },
      {
        price: 550,
        quantity: 3,
        selectedSize: "Regular",
        selectedExtras: [{ name: "Extra Mint", price: 50 }],
      },
    ];

    const calculatedPrices = items.map(getCartItemPrices);
    const sumItemTotals = calculatedPrices.reduce((sum, p) => sum + p.itemTotal, 0);

    // Simulated Cart Subtotal Calculation logic (same as CartContext total)
    const cartSubtotal = items.reduce((sum, item) => {
      const prices = getCartItemPrices(item);
      return sum + prices.itemTotal;
    }, 0);

    expect(sumItemTotals).toBe(cartSubtotal);
    expect(sumItemTotals).toBe(3800 + 850 + 1800); // 3800 + 850 + 1800 = 6450
  });

  it("should calculate correct price for items with customPrice (offers/discounts applied)", () => {
    // Regular price is 1000, but offer gives 50% discount -> basePrice = 500, plus extra cheese = 150.
    // So unit customPrice = 500 + 150 = 650.
    const item: MinimalCartItem = {
      price: 1000,
      quantity: 2,
      selectedSize: "Regular",
      selectedExtras: [{ name: "Extra Cheese", price: 150 }],
      customPrice: 650
    };

    const prices = getCartItemPrices(item);
    expect(prices.unitTotal).toBe(650);
    expect(prices.basePrice).toBe(500); // 650 - 150
    expect(prices.extrasTotal).toBe(150);
    expect(prices.totalBasePrice).toBe(1000); // 500 * 2
    expect(prices.totalExtrasPrice).toBe(300); // 150 * 2
    expect(prices.itemTotal).toBe(1300); // 650 * 2
  });
});
