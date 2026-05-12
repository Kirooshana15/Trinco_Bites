import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem } from "@/context/CartContext";

export type OrderRecord = {
  id: string;
  createdAt: string;
  status: "Order Received" | "Out for Delivery" | "Delivered";
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: "cash" | "card";
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  deliveryAddress: string;
  locationLabel: string;
};

type OrderContextType = {
  orders: OrderRecord[];
  latestOrder: OrderRecord | null;
  placeOrder: (order: Omit<OrderRecord, "id" | "createdAt" | "status">) => OrderRecord;
};

const STORAGE_KEY = "trinco_orders";

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setOrders(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const placeOrder: OrderContextType["placeOrder"] = (order) => {
    const next: OrderRecord = {
      ...order,
      id: `TRC-${Math.floor(Math.random() * 9000 + 1000)}`,
      createdAt: new Date().toISOString(),
      status: "Order Received",
    };

    setOrders((prev) => {
      const updated = [next, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    return next;
  };

  const latestOrder = useMemo(() => orders[0] ?? null, [orders]);

  return (
    <OrderContext.Provider value={{ orders, latestOrder, placeOrder }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrders must be used within an OrderProvider");
  return context;
}
