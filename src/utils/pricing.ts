/** Sri Lanka VAT rate — 18% (Inland Revenue Act, effective Jan 2024) */
export const VAT_RATE = 0.18;

export interface MinimalCartItem {
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedExtras?: { name: string; price: number }[];
  customPrice?: number;
}

export function getCartItemPrices(item: MinimalCartItem) {
  // Total of selected extras per unit
  const extrasTotal = item.selectedExtras
    ? item.selectedExtras.reduce((sum, extra) => sum + extra.price, 0)
    : 0;

  // If a custom price is set (e.g. from an offer), it represents the unit price (with size, discount, and extras).
  let unitTotal = item.selectedSize === "Large" ? item.price * 1.5 + extrasTotal : item.price + extrasTotal;
  let basePrice = item.selectedSize === "Large" ? item.price * 1.5 : item.price;

  if (item.customPrice !== undefined) {
    unitTotal = item.customPrice;
    basePrice = unitTotal - extrasTotal;
  }

  // Quantity totals
  const totalBasePrice = basePrice * item.quantity;
  const totalExtrasPrice = extrasTotal * item.quantity;
  const itemTotal = unitTotal * item.quantity;

  return {
    basePrice,
    extrasTotal,
    unitTotal,
    totalBasePrice,
    totalExtrasPrice,
    itemTotal,
  };
}

export function formatPrice(price: number): string {
  return `Rs ${price.toLocaleString()}`;
}
