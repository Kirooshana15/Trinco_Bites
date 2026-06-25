import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  ShoppingBag,
  Star,
  CreditCard,
  AlertTriangle,
  Gift,
  ShieldAlert,
  Check,
  Trash2,
  X,
  Bell,
  Info,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNotifications, NotificationPreference } from "@/context/NotificationContext";
import { formatAlertTime } from "@/utils/restaurantNotifications";

// ==========================================
// 1. TYPE DEFINITIONS
// ==========================================
interface NotificationItem {
  id: string;
  type: "orders" | "customers" | "payments" | "offers" | "security";
  title: string;
  description: string;
  time: string;
  createdAt?: string;
  read: boolean;
}

// ==========================================
// 2. SAMPLE NOTIFICATIONS MOCK DATA
// ==========================================
const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "orders",
    title: "New Order Received",
    description: "Order #1245 received from a customer.",
    time: "2 minutes ago",
    read: false,
  },
  {
    id: "notif-2",
    type: "customers",
    title: "New Review Received",
    description: "A customer submitted a new review.",
    time: "15 minutes ago",
    read: false,
  },
  {
    id: "notif-3",
    type: "payments",
    title: "Payment Received",
    description: "Payment received successfully.",
    time: "30 minutes ago",
    read: true,
  },
  {
    id: "notif-4",
    type: "customers",
    title: "Customer Complaint Submitted",
    description: "A customer submitted a complaint.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "notif-5",
    type: "offers",
    title: "Offer Expiring Soon",
    description: "Weekend offer expires tomorrow.",
    time: "3 hours ago",
    read: true,
  },
  {
    id: "notif-6",
    type: "orders",
    title: "Order Cancelled",
    description: "Order #1239 was cancelled by customer due to address issues.",
    time: "4 hours ago",
    read: true,
  },
  {
    id: "notif-7",
    type: "payments",
    title: "Failed Transaction",
    description: "Failed payment attempt for Order #1241. Insufficient funds.",
    time: "5 hours ago",
    read: false,
  },
  {
    id: "notif-8",
    type: "security",
    title: "Account Security Alert",
    description: "Daily automated backup verified and stored securely.",
    time: "1 day ago",
    read: true,
  },
];

// ==========================================
// 3. SETTINGS PREFERENCES MOCK DATA
// ==========================================
const INITIAL_PREFERENCES: NotificationPreference[] = [
  { key: "newOrder", label: "New Order Received", enabled: true },
  { key: "orderCancelled", label: "Order Cancelled", enabled: true },
  { key: "dailyOrderUpdate", label: "Daily Order Update", enabled: true },
  { key: "newReview", label: "New Review Received", enabled: true },
  {
    key: "complaintSubmitted",
    label: "Customer Complaint Submitted",
    enabled: true,
  },
  { key: "offerExpiring", label: "Offer Expiring Soon", enabled: true },
  { key: "paymentReceived", label: "Payment Received", enabled: true },
  { key: "failedTransaction", label: "Failed Transaction", enabled: true },
  { key: "revenueSummary", label: "Daily Revenue Summary", enabled: false },
  { key: "securityAlert", label: "Account Security Alert", enabled: true },
];

// ==========================================
// TYPE CONFIGS WITH PREMIUM STYLING
// ==========================================
const TYPE_META: Record<
  NotificationItem["type"],
  {
    label: string;
    gradient: string;
    dot: string;
    pill: string;
    iconColor: string;
  }
> = {
  orders: {
    label: "Order",
    gradient: "from-red-500/15 via-orange-500/5 to-transparent",
    dot: "bg-red-500",
    pill: "bg-red-500/10 text-red-600 dark:text-red-400",
    iconColor: "text-red-500",
  },
  customers: {
    label: "Customer",
    gradient: "from-amber-500/15 via-yellow-500/5 to-transparent",
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    iconColor: "text-amber-500",
  },
  payments: {
    label: "Payment",
    gradient: "from-emerald-500/15 via-teal-500/5 to-transparent",
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    iconColor: "text-emerald-500",
  },
  offers: {
    label: "Offer",
    gradient: "from-purple-500/15 via-violet-500/5 to-transparent",
    dot: "bg-purple-500",
    pill: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    iconColor: "text-purple-500",
  },
  security: {
    label: "Security",
    gradient: "from-rose-500/15 via-pink-500/5 to-transparent",
    dot: "bg-rose-500",
    pill: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    iconColor: "text-rose-500",
  },
};

const TYPE_ICONS: Record<NotificationItem["type"], React.ReactNode> = {
  orders: <ShoppingBag size={16} strokeWidth={2.5} />,
  customers: <Star size={16} strokeWidth={2.5} />,
  payments: <CreditCard size={16} strokeWidth={2.5} />,
  offers: <Gift size={16} strokeWidth={2.5} />,
  security: <ShieldAlert size={16} strokeWidth={2.5} />,
};

export function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    notifications: dbNotifications,
    unreadCount,
    preferences,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<
    "all" | "orders" | "customers" | "payments" | "offers" | "security"
  >("all");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempPreferences, setTempPreferences] =
    useState<NotificationPreference[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  useEffect(() => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  }, [unreadCount, markAllAsRead]);

  const notifications = useMemo(() => {
    return dbNotifications.map((notif) => ({
      ...notif,
      time: formatAlertTime(notif.createdAt),
    }));
  }, [dbNotifications]);

  // ==========================================
  // 5. DYNAMIC CALCULATIONS & FILTERING
  // ==========================================
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (activeTab === "all") return true;
      return notif.type === activeTab;
    });
  }, [notifications, activeTab]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notifications.length };
    notifications.forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  // ==========================================
  // 6. ACTION HANDLERS
  // ==========================================
  const handleToggleRead = (id: string) => {
    markAsRead(id);
  };

  const handleDeleteNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleClearRead = () => {
    const hasRead = notifications.some((n) => n.read);
    if (!hasRead) {
      toast.error("No read notifications to clear");
      return;
    }
    setIsConfirmClearOpen(true);
  };

  const confirmClearRead = () => {
    clearReadNotifications();
    setIsConfirmClearOpen(false);
  };

  const handleOpenSettings = () => {
    setTempPreferences([...preferences]);
    setIsSettingsOpen(true);
  };

  const handleTogglePreference = (key: string) => {
    setTempPreferences((prev) =>
      prev.map((p) => (p.key === key ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleSavePreferences = async () => {
    try {
      await updatePreferences(tempPreferences);
      setIsSettingsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const TABS = [
    { id: "all", label: "All" },
    { id: "orders", label: "Orders" },
    { id: "customers", label: "Customers" },
    { id: "payments", label: "Payments" },
    { id: "offers", label: "Offers" },
    { id: "security", label: "Security" },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col gap-5 font-sans pb-12 text-[#4E3E2A] dark:text-slate-100"
    >
      {/* ==========================================
          1. HEADER SECTION — Premium glass card
          ========================================== */}
      <div className="relative overflow-hidden bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-[#4E3E2A]/8 dark:border-slate-800/80 shadow-[0_8px_32px_-8px_rgba(78,62,42,0.12)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]">
        {/* Decorative gradient orb */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-radial from-[#D45113]/10 via-[#F9A03F]/5 to-transparent pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-radial from-[#813405]/8 to-transparent pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            {/* Bell icon with animated badge */}
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D45113] to-[#813405] flex items-center justify-center shadow-[0_6px_20px_-4px_rgba(212,81,19,0.5)]">
                <Bell
                  size={24}
                  className="text-white"
                  strokeWidth={2}
                />
              </div>
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center shadow-md"
                >
                  <span className="text-[10px] font-black text-white leading-none">
                    {unreadCount}
                  </span>
                </motion.div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-[28px] font-black text-[#813405] dark:text-[#F9A03F] tracking-tight leading-none">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D45113]/12 text-[#D45113] dark:text-[#F9A03F] text-[10px] font-black uppercase tracking-widest"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D45113] animate-pulse inline-block" />
                    Live
                  </motion.span>
                )}
              </div>
              <p className="text-xs text-[#4E3E2A]/50 dark:text-slate-400 mt-1 font-medium">
                {unreadCount > 0
                  ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""} need your attention`
                  : "All caught up — no pending alerts"}
              </p>
            </div>
          </div>

          {/* Header Settings button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenSettings}
            className="group flex items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-slate-950 border border-[#4E3E2A]/12 dark:border-slate-800 hover:border-[#D45113]/30 dark:hover:border-[#F9A03F]/30 text-[#813405] dark:text-[#F9A03F] rounded-xl shadow-sm transition-all duration-200 cursor-pointer text-xs font-black"
          >
            <Settings
              size={15}
              className="group-hover:rotate-90 transition-transform duration-300"
            />
            <span>Preferences</span>
          </motion.button>
        </div>
      </div>

      {/* ==========================================
          2. FILTER TABS — Pill-style floating tabs
          ========================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id] || 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer ${isActive
                ? "bg-[#D45113] text-white shadow-[0_4px_14px_-4px_rgba(212,81,19,0.55)]"
                : "bg-white/80 dark:bg-slate-900/70 border border-[#4E3E2A]/10 dark:border-slate-800 text-[#4E3E2A]/70 dark:text-slate-400 hover:text-[#813405] dark:hover:text-[#F9A03F] hover:border-[#D45113]/20"
                }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black ${isActive
                    ? "bg-white/25 text-white"
                    : "bg-[#4E3E2A]/8 dark:bg-slate-800 text-[#4E3E2A]/60 dark:text-slate-400"
                    }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==========================================
          3. NOTIFICATION FEED
          ========================================== */}
      <div className="flex flex-col gap-2.5 min-h-[300px]">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-[#F8DDA4]/80 dark:border-slate-800 min-h-[300px]"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#D45113]/8 flex items-center justify-center mb-4">
                <Bell size={28} className="text-[#813405]/30 dark:text-slate-600" />
              </div>
              <p className="text-sm font-black text-[#813405]/50 dark:text-slate-400">
                Nothing here
              </p>
              <p className="text-xs text-[#813405]/35 dark:text-slate-600 mt-1">
                All caught up in this category
              </p>
            </motion.div>
          ) : (
            filteredNotifications.map((notif, i) => {
              const meta = TYPE_META[notif.type];
              const icon = TYPE_ICONS[notif.type];
              const isHovered = hoveredId === notif.id;

              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.97 }}
                  transition={{
                    duration: 0.25,
                    delay: i * 0.03,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                  onHoverStart={() => setHoveredId(notif.id)}
                  onHoverEnd={() => setHoveredId(null)}
                  onClick={() => {
                    handleToggleRead(notif.id);
                    if (notif.orderId) {
                      navigate({
                        to: "/restaurant/orders",
                        search: { orderId: notif.orderId } as any,
                      });
                    }
                  }}
                  className={`group relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-200 ${!notif.read
                    ? "bg-white dark:bg-slate-900 border-[#4E3E2A]/12 dark:border-slate-800/80 shadow-[0_2px_16px_-4px_rgba(78,62,42,0.1)] dark:shadow-[0_2px_16px_-4px_rgba(0,0,0,0.3)]"
                    : "bg-white/60 dark:bg-slate-900/50 border-[#4E3E2A]/6 dark:border-slate-800/50"
                    } hover:shadow-[0_6px_24px_-6px_rgba(78,62,42,0.15)] dark:hover:shadow-[0_6px_24px_-6px_rgba(0,0,0,0.4)] hover:border-[#4E3E2A]/20 dark:hover:border-slate-700`}
                >
                  {/* Unread gradient wash */}
                  {!notif.read && (
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${meta.gradient} pointer-events-none`}
                    />
                  )}

                  {/* Unread left accent bar */}
                  {!notif.read && (
                    <div
                      className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full ${meta.dot}`}
                    />
                  )}

                  <div className="relative flex items-center gap-4 p-4 pl-5">
                    {/* Icon */}
                    <div
                      className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!notif.read
                        ? `bg-gradient-to-br ${meta.gradient} border border-current/10`
                        : "bg-[#4E3E2A]/5 dark:bg-slate-800"
                        }`}
                    >
                      <span className={meta.iconColor}>{icon}</span>
                      {!notif.read && (
                        <span
                          className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${meta.dot} border-2 border-white dark:border-slate-900`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${meta.pill}`}
                        >
                          {meta.label}
                        </span>
                        {!notif.read && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#D45113]/70 dark:text-[#F9A03F]/70">
                            New
                          </span>
                        )}
                      </div>
                      <h4
                        className={`text-sm font-black tracking-tight truncate ${!notif.read
                          ? "text-[#813405] dark:text-[#F9A03F]"
                          : "text-[#4E3E2A]/80 dark:text-slate-300"
                          }`}
                      >
                        {notif.title}
                      </h4>
                      <p className="text-xs text-[#4E3E2A]/55 dark:text-slate-500 mt-0.5 truncate leading-relaxed">
                        {notif.description}
                      </p>
                    </div>

                    {/* Right side: time + delete */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-[10px] text-[#4E3E2A]/35 dark:text-slate-600 font-semibold whitespace-nowrap">
                        {notif.time}
                      </span>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                          opacity: isHovered ? 1 : 0,
                          scale: isHovered ? 1 : 0.8,
                        }}
                        onClick={(e) => handleDeleteNotif(notif.id, e)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[#4E3E2A]/30 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* ==========================================
          4. ACTION BUTTONS
          ========================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#4E3E2A]/6 dark:border-slate-800">
        {/* Summary */}
        <p className="text-xs text-[#4E3E2A]/40 dark:text-slate-500 font-medium">
          {notifications.length} total · {unreadCount} unread
        </p>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 hover:border-[#D45113]/25 text-[#813405] dark:text-[#F9A03F] text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={13} strokeWidth={3} />
            Mark All Read
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleClearRead}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 hover:border-rose-300/50 text-[#813405] dark:text-[#F9A03F] hover:text-rose-600 text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Trash2 size={13} />
            Clear Read
          </motion.button>
        </div>
      </div>

      {/* ==========================================
          5. NOTIFICATION SETTINGS MODAL
          ========================================== */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/40 dark:bg-black/65 backdrop-blur-md"
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 16 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
              className="relative w-full max-w-md bg-[#FFFCF5] dark:bg-slate-900 border border-[#4E3E2A]/12 dark:border-slate-800 rounded-3xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.3)] z-10 overflow-hidden"
            >
              {/* Modal top accent line */}
              <div className="h-1 w-full bg-gradient-to-r from-[#D45113] via-[#F9A03F] to-[#813405]" />

              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#4E3E2A]/8 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#D45113]/10 flex items-center justify-center">
                    <Settings size={16} className="text-[#D45113]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#813405] dark:text-[#F9A03F] tracking-tight">
                      Notification Preferences
                    </h3>
                    <p className="text-[10px] text-[#4E3E2A]/45 dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                      Configure your alerts
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Preferences List */}
              <div className="px-5 py-4 space-y-2 max-h-[360px] overflow-y-auto">
                {tempPreferences.map((pref, i) => (
                  <motion.div
                    key={pref.key}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleTogglePreference(pref.key)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${pref.enabled
                      ? "bg-white dark:bg-slate-950 border-[#4E3E2A]/8 dark:border-slate-800 hover:border-[#D45113]/20"
                      : "bg-[#4E3E2A]/3 dark:bg-slate-950/50 border-transparent hover:border-[#4E3E2A]/8"
                      }`}
                  >
                    <span
                      className={`text-xs font-bold transition-colors ${pref.enabled
                        ? "text-[#4E3E2A]/90 dark:text-slate-200"
                        : "text-[#4E3E2A]/40 dark:text-slate-500"
                        }`}
                    >
                      {pref.label}
                    </span>

                    {/* Toggle switch */}
                    <div
                      className={`relative w-10 h-5.5 rounded-full transition-colors duration-300 shrink-0 ${pref.enabled
                        ? "bg-[#D45113]"
                        : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      style={{ height: "22px", width: "40px" }}
                    >
                      <motion.div
                        layout
                        transition={{
                          type: "spring",
                          stiffness: 600,
                          damping: 35,
                        }}
                        className="absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm"
                        style={{ width: "18px", height: "18px" }}
                        animate={{ x: pref.enabled ? 18 : 0 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-4 border-t border-[#4E3E2A]/8 dark:border-slate-800">
                <span className="text-[10px] text-[#4E3E2A]/40 dark:text-slate-500 font-medium">
                  {tempPreferences.filter((p) => p.enabled).length} of{" "}
                  {tempPreferences.length} alerts enabled
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-4 py-2 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 text-[#4E3E2A]/60 dark:text-slate-400 text-xs font-black rounded-xl transition cursor-pointer hover:text-[#4E3E2A] dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSavePreferences}
                    className="px-4 py-2 bg-gradient-to-br from-[#D45113] to-[#813405] hover:from-[#813405] hover:to-[#5a2503] text-white text-xs font-black rounded-xl shadow-[0_4px_14px_-4px_rgba(212,81,19,0.55)] transition-all cursor-pointer"
                  >
                    Save Changes
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear Read Confirmation Modal */}
      <AnimatePresence>
        {isConfirmClearOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmClearOpen(false)}
              className="fixed inset-0 bg-black z-45"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="clear-read-title"
              className="relative w-[calc(100%-2rem)] max-w-md h-fit bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-955/20 shadow-2xl z-50 rounded-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-rose-100/70 dark:border-rose-955/40 bg-rose-50/70 dark:bg-rose-950/10 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-955/40 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 size={18} />
                </div>
                <div className="min-w-0 text-left">
                  <h2 id="clear-read-title" className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Clear Read Notifications
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    This action deletes all read alerts permanently.
                  </p>
                </div>
              </div>

              <div className="p-6">
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 text-left">
                  Are you sure you want to clear all read notifications? You will not be able to retrieve them once cleared.
                </p>
              </div>

              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfirmClearOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmClearRead}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-sm shadow-rose-600/20 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} /> Clear All
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export default Notifications;
