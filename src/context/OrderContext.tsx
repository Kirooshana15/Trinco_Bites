import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";

export type OrderRecord = {
  id: string; // The friendly TRC-XXXX code returned by the backend
  dbId: string; // The UUID database ID
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
  notes?: string;
  cancellationReason?: string;
  refundInitiated?: boolean;
};

type OrderContextType = {
  orders: OrderRecord[];
  latestOrder: OrderRecord | null;
  placeOrder: (order: Omit<OrderRecord, "id" | "dbId" | "createdAt" | "status">) => Promise<OrderRecord>;
  updateOrderStatus: (orderId: string, status: OrderRecord["status"]) => Promise<void>;
  fetchOrders: () => Promise<void>;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [latestOrder, setLatestOrder] = useState<OrderRecord | null>(null);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const fetched = await apiRequest<OrderRecord[]>("/orders", { token });
      setOrders(fetched);
      if (fetched.length > 0) {
        setLatestOrder(fetched[0]);
      } else {
        setLatestOrder(null);
      }
    } catch (err) {
      console.error("Failed to fetch orders from backend:", err);
    }
  };

  const fetchLatestOrder = async () => {
    if (!token || !latestOrder) return;
    try {
      // Fetch latest order from backend to poll its status
      const updated = await apiRequest<OrderRecord>(`/orders/${latestOrder.id}`, { token });
      setOrders((prev) => prev.map((o) => (o.id === latestOrder.id ? updated : o)));
      setLatestOrder(updated);
    } catch (err) {
      console.error("Failed to fetch latest order status:", err);
    }
  };

  // Load orders when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchOrders();
    } else {
      setOrders([]);
      setLatestOrder(null);
    }
  }, [isAuthenticated, token]);

  // Polling logic: if the latest order is active (not terminal), poll status every 8 seconds
  useEffect(() => {
    if (!isAuthenticated || !token || !latestOrder) return;

    const isActive =
      latestOrder.status !== "Delivered" && latestOrder.status !== "Cancelled";
    if (!isActive) return;

    const interval = setInterval(() => {
      fetchLatestOrder();
    }, 8000);

    return () => clearInterval(interval);
  }, [isAuthenticated, token, latestOrder?.id, latestOrder?.status]);

  const placeOrder: OrderContextType["placeOrder"] = async (orderData) => {
    if (!token) {
      throw new Error("User must be authenticated to place an order");
    }

    try {
      const response = await apiRequest<OrderRecord>("/orders", {
        method: "POST",
        token,
        body: orderData,
      });

      // Update state
      setOrders((prev) => [response, ...prev]);
      setLatestOrder(response);

      return response;
    } catch (err) {
      console.error("Failed to place order on backend:", err);
      throw err;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderRecord["status"]) => {
    if (!token) return;
    try {
      const updated = await apiRequest<OrderRecord>(`/orders/${orderId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });

      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (latestOrder && (latestOrder.id === orderId || latestOrder.dbId === orderId)) {
        setLatestOrder(updated);
      }
    } catch (err) {
      console.error("Failed to update order status on backend:", err);
    }
  };

  return (
    <OrderContext.Provider value={{ orders, latestOrder, placeOrder, updateOrderStatus, fetchOrders }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrders must be used within an OrderProvider");
  return context;
}
