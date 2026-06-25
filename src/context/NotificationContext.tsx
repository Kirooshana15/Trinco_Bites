import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { toast } from "sonner";

export type NotificationRecord = {
  id: string;
  restaurantId?: string;
  userId?: string;
  type: "orders" | "customers" | "payments" | "offers" | "security";
  title: string;
  description: string;
  read: boolean;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
};

export interface NotificationPreference {
  key: string;
  label: string;
  enabled: boolean;
}

const INITIAL_PREFERENCES: NotificationPreference[] = [
  { key: "newOrder", label: "New Order Received", enabled: true },
  { key: "orderCancelled", label: "Order Cancelled", enabled: true },
  { key: "dailyOrderUpdate", label: "Daily Order Update", enabled: true },
  { key: "newReview", label: "New Review Received", enabled: true },
  { key: "complaintSubmitted", label: "Customer Complaint Submitted", enabled: true },
  { key: "offerExpiring", label: "Offer Expiring Soon", enabled: true },
  { key: "paymentReceived", label: "Payment Received", enabled: true },
  { key: "failedTransaction", label: "Failed Transaction", enabled: true },
  { key: "revenueSummary", label: "Daily Revenue Summary", enabled: false },
  { key: "securityAlert", label: "Account Security Alert", enabled: true },
];

type NotificationContextType = {
  notifications: NotificationRecord[];
  unreadCount: number;
  preferences: NotificationPreference[];
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearReadNotifications: () => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (newPrefs: NotificationPreference[]) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>(INITIAL_PREFERENCES);

  const fetchPreferences = async () => {
    if (!token || !isAuthenticated || user?.role !== "restaurant_admin") return;
    try {
      const fetched = await apiRequest<NotificationPreference[]>("/notifications/preferences", { token });
      if (fetched && Array.isArray(fetched)) {
        const merged = INITIAL_PREFERENCES.map(def => {
          const match = fetched.find(f => f.key === def.key);
          return match ? { ...def, enabled: match.enabled } : def;
        });
        setPreferences(merged);
      }
    } catch (err) {
      console.error("Failed to fetch preferences from backend:", err);
    }
  };

  const updatePreferences = async (newPrefs: NotificationPreference[]) => {
    if (!token) return;
    try {
      await apiRequest("/notifications/preferences", {
        method: "PUT",
        token,
        body: newPrefs,
      });
      setPreferences(newPrefs);
    } catch (err) {
      console.error("Failed to save preferences to backend:", err);
      throw err;
    }
  };

  const fetchNotifications = async () => {
    if (!token || !isAuthenticated || user?.role !== "restaurant_admin") return;
    try {
      const fetched = await apiRequest<NotificationRecord[]>("/notifications", { token });
      setNotifications(fetched);
    } catch (err) {
      console.error("Failed to fetch notifications from backend:", err);
    }
  };

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      const updated = await apiRequest<NotificationRecord>(`/notifications/${id}/read`, {
        method: "PATCH",
        token,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? updated : n))
      );
      toast.info(updated.read ? "Marked as read" : "Marked as unread");
    } catch (err) {
      console.error("Failed to toggle notification status:", err);
      toast.error("Failed to update notification");
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await apiRequest("/notifications/mark-all-read", {
        method: "PATCH",
        token,
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (id: string) => {
    if (!token) return;
    try {
      await apiRequest(`/notifications/${id}`, {
        method: "DELETE",
        token,
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification cleared");
    } catch (err) {
      console.error("Failed to delete notification:", err);
      toast.error("Failed to delete notification");
    }
  };

  const clearReadNotifications = async () => {
    if (!token) return;
    try {
      await apiRequest("/notifications/clear-read", {
        method: "DELETE",
        token,
      });
      setNotifications((prev) => prev.filter((n) => !n.read));
      toast.success("Cleared all read notifications");
    } catch (err) {
      console.error("Failed to clear read notifications:", err);
      toast.error("Failed to clear notifications");
    }
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated && token && user?.role === "restaurant_admin") {
      fetchNotifications();
      fetchPreferences();
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, token, user?.role]);

  // Polling every 8 seconds for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !token || user?.role !== "restaurant_admin") return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 8000);

    return () => clearInterval(interval);
  }, [isAuthenticated, token, user?.role]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearReadNotifications,
        fetchPreferences,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
