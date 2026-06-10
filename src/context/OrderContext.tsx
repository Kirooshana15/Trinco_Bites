import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem } from "@/context/CartContext";

export type OrderRecord = {
  id: string;
  createdAt: string;
  status: "Order Received" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled";
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  orderType: "Delivery" | "Self Pickup";
  subtotal: number;
  tax: number;
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
  notes?: string; // Customer's special instructions
  cancellationReason?: string; // Why restaurant rejected the order
  refundInitiated?: boolean;   // true for card payments that were refunded
};

type OrderContextType = {
  orders: OrderRecord[];
  latestOrder: OrderRecord | null;
  placeOrder: (order: Omit<OrderRecord, "id" | "createdAt" | "status">) => OrderRecord;
  updateOrderStatus: (orderId: string, status: OrderRecord["status"]) => void;
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

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setOrders(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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

  const updateOrderStatus = (orderId: string, status: OrderRecord["status"]) => {
    setOrders((prev) => {
      const order = prev.find((o) => o.id === orderId);
      if (!order) return prev;

      // Strict transition validation
      const current = order.status;
      if (current === "Delivered" || current === "Cancelled") {
        return prev; // Terminal states cannot transition
      }

      // Validating transitions:
      // Order Received -> Preparing or Cancelled
      // Preparing -> Delivered or Cancelled (restaurant Done = food ready, no separate delivery man)
      // Out for Delivery -> Delivered or Cancelled (legacy path, kept for compatibility)
      let valid = false;
      if (current === "Order Received" && (status === "Preparing" || status === "Cancelled")) {
        valid = true;
      } else if (current === "Preparing" && (status === "Delivered" || status === "Out for Delivery" || status === "Cancelled")) {
        valid = true;
      } else if (current === "Out for Delivery" && (status === "Delivered" || status === "Cancelled")) {
        valid = true;
      } else if (status === "Cancelled") {
        valid = true;
      }

      if (!valid) return prev; // Ignore invalid transitions

      const updated = prev.map((o) => (o.id === orderId ? { ...o, status } : o));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const latestOrder = useMemo(() => orders[0] ?? null, [orders]);

  return (
    <OrderContext.Provider value={{ orders, latestOrder, placeOrder, updateOrderStatus }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrders must be used within an OrderProvider");
  return context;
}
