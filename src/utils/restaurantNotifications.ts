import type { OrderRecord } from "@/context/OrderContext";
import type { Offer } from "@/context/RestaurantContext";

export type RestaurantAlertType = "orders" | "customers" | "payments" | "offers" | "security";

export type RestaurantAlert = {
  id: string;
  type: RestaurantAlertType;
  title: string;
  description: string;
  time: string;
  createdAt: string;
  read: boolean;
  orderId?: string;
};

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const dateOnly = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const daysBetween = (from: Date, to: Date) => {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((end - start) / 86_400_000);
};

export const formatAlertTime = (createdAt: string, now = new Date()) => {
  const date = new Date(createdAt);
  const diffMinutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60_000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
};

export const buildRestaurantAlerts = ({
  orders,
  offers,
  restaurantId,
  now = new Date(),
}: {
  orders: OrderRecord[];
  offers: Offer[];
  restaurantId?: string;
  now?: Date;
}): RestaurantAlert[] => {
  if (!restaurantId) return [];

  const today = dayKey(now);
  const restaurantOrders = orders.filter((order) => order.restaurantId === restaurantId);
  const todayOrders = restaurantOrders.filter((order) => order.createdAt.startsWith(today));
  const openOrders = restaurantOrders.filter((order) => !["Delivered", "Cancelled"].includes(order.status));
  const restaurantOffers = offers.filter((offer) => offer.restaurantId === restaurantId);
  const alerts: RestaurantAlert[] = [];

  restaurantOrders
    .filter((order) => order.status === "Order Received")
    .slice(0, 6)
    .forEach((order) => {
      const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
      alerts.push({
        id: `auto-order-${order.id}`,
        type: "orders",
        title: "New Order Received",
        description: `Order ${order.id} from ${order.contact.name} has ${itemCount} item${itemCount === 1 ? "" : "s"} worth LKR ${order.total.toLocaleString()}.`,
        time: formatAlertTime(order.createdAt, now),
        createdAt: order.createdAt,
        read: false,
        orderId: order.id,
      });
    });

  alerts.push({
    id: `auto-daily-${restaurantId}-${today}`,
    type: "orders",
    title: "Daily Order Update",
    description: `${todayOrders.length} order${todayOrders.length === 1 ? "" : "s"} today, ${openOrders.length} still pending, and LKR ${todayOrders.reduce((sum, order) => sum + order.total, 0).toLocaleString()} in sales.`,
    time: "Today",
    createdAt: now.toISOString(),
    read: todayOrders.length === 0 && openOrders.length === 0,
  });

  restaurantOffers
    .filter((offer) => offer.status !== "Draft")
    .map((offer) => ({ offer, daysLeft: daysBetween(now, dateOnly(offer.endDate)) }))
    .filter(({ daysLeft }) => daysLeft >= 0 && daysLeft <= 3)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .forEach(({ offer, daysLeft }) => {
      const label = daysLeft === 0 ? "today" : daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`;
      alerts.push({
        id: `auto-offer-deadline-${offer.id}-${offer.endDate}`,
        type: "offers",
        title: daysLeft === 0 ? "Offer Deadline Today" : "Offer Expiring Soon",
        description: `${offer.title} ends ${label}. Check or extend the offer before the deadline.`,
        time: daysLeft === 0 ? "Today" : label,
        createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8).toISOString(),
        read: false,
      });
    });

  return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
