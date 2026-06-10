import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { FoodItem } from "@/utils/data/mock";
import type { Offer } from "@/context/RestaurantContext";
import { getCartItemPrices } from "@/utils/pricing";

export type CartItem = FoodItem & { 
  quantity: number; 
  restaurantId: string;
  selectedSize?: string;
  selectedExtras?: { name: string; price: number }[];
  instructions?: string;
  customPrice?: number;
  appliedOffer?: Offer;
};

type CartCtx = {
  items: CartItem[];
  total: number;
  count: number;
  add: (item: FoodItem, restaurantId: string, quantity?: number, customizations?: Partial<CartItem>) => void;
  decrement: (id: string, customizations?: Partial<CartItem>) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const add: CartCtx["add"] = (item, restaurantId, quantity = 1, customizations = {}) => {
    setItems((prev) => {
      // Find item with same ID AND same customizations
      const extrasJson = JSON.stringify(customizations.selectedExtras || []);
      const found = prev.find((p) => 
        p.id === item.id && 
        p.selectedSize === customizations.selectedSize &&
        JSON.stringify(p.selectedExtras || []) === extrasJson
      );

      if (found) {
        return prev.map((p) => (
          (p.id === item.id && 
           p.selectedSize === customizations.selectedSize &&
           JSON.stringify(p.selectedExtras || []) === extrasJson) 
          ? { ...p, quantity: p.quantity + quantity } 
          : p
        ));
      }
      return [...prev, { ...item, quantity, restaurantId, ...customizations }];
    });
  };

  const decrement: CartCtx["decrement"] = (id, customizations = {}) => {
    setItems((prev) => {
      const extrasJson = JSON.stringify(customizations.selectedExtras || []);
      const found = prev.find((p) => 
        p.id === id && 
        p.selectedSize === customizations.selectedSize &&
        JSON.stringify(p.selectedExtras || []) === extrasJson
      );
      if (!found) return prev;
      if (found.quantity <= 1) {
        return prev.filter((p) => !(
          p.id === id && 
          p.selectedSize === customizations.selectedSize &&
          JSON.stringify(p.selectedExtras || []) === extrasJson
        ));
      }
      return prev.map((p) => (
        (p.id === id && 
         p.selectedSize === customizations.selectedSize &&
         JSON.stringify(p.selectedExtras || []) === extrasJson) 
        ? { ...p, quantity: p.quantity - 1 } 
        : p
      ));
    });
  };

  const remove: CartCtx["remove"] = (id) => setItems((p) => p.filter((i) => i.id !== id));
  const setQty: CartCtx["setQty"] = (id, qty) =>
    setItems((p) => (qty <= 0 ? p.filter((i) => i.id !== id) : p.map((i) => (i.id === id ? { ...i, quantity: qty } : i))));
  const clear = () => setItems([]);

  const total = useMemo(() => items.reduce((s, i) => s + getCartItemPrices(i).itemTotal, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  return <Ctx.Provider value={{ items, total, count, add, decrement, remove, setQty, clear }}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
};
