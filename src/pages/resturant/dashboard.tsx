import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Clock,
  CheckCircle2, XCircle, Star, Users, ArrowUpRight, Plus,
  RefreshCw, ChevronRight, Calendar, ArrowUp, ArrowDown,
  ClipboardList, Sparkles, Award, Utensils, MessageSquare,
  BellRing, ShieldCheck, HelpCircle, Wallet
} from "lucide-react";
import { type FoodItem } from "@/utils/data/mock";
import { useAuth } from "@/context/AuthContext";
import { useRestaurants } from "@/context/RestaurantContext";
import { apiRequest } from "@/utils/api";

// Helper for timeframe-based stats mapping
const getShortName = (name: string) => {
  const mapping: Record<string, string> = {
    "Dashboard": "Dashboard",
    "Order Management": "Orders",
    "Menu Management": "Menu",
    "Category Management": "Categories",
    "Customer Management": "Customers",
    "Reviews & Ratings": "Reviews",
    "Coupons & Offers": "Coupons",
    "Analytics & Reports": "Analytics",
    "Restaurant Profile": "Profile",
    "Notifications": "Alerts",
    "Payment & Wallet": "Wallet",
  };
  return mapping[name] || name.split(" ")[0];
};

export function RestaurantDashboard() {
  const { user, token } = useAuth();
  const { restaurants } = useRestaurants();
  const [timeframe, setTimeframe] = useState<"today" | "7days" | "30days">("7days");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number, y: number, value: number, day: string } | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setIsLoading(true);
    try {
      const data = await apiRequest<any>(`/restaurant/dashboard-stats?timeframe=${timeframe}`, { token });
      setDashboardData(data);
    } catch (err) {
      console.error("Failed to fetch dashboard statistics", err);
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData(true);
    setIsRefreshing(false);
  };

  const stats = dashboardData?.metrics || {
    totalOrders: "0",
    todayRevenue: "LKR 0",
    pendingOrders: "0",
    completedOrders: "0",
    cancelledOrders: "0",
    avgRating: "5.0",
    activeCustomers: "0",
    monthlyEarnings: "LKR 0",
    ordersTrend: "0.0%",
    revenueTrend: "0.0%",
    pendingTrend: "0.0%",
    completedTrend: "0.0%",
    cancelledTrend: "0.0%",
    ratingTrend: "0.0",
    customersTrend: "0.0%",
    earningsTrend: "0.0%"
  };

  // Get active menu items from mock database
  const popularDishes = dashboardData?.popularDishes || [];

  // Custom SVG Sparkline coordinates for KPI trend visualizer
  const sparklines = {
    totalOrders: { path: "M 0 32 Q 10 15 20 28 T 40 12 T 60 22 T 80 4", color: "#10B981" },
    todayRevenue: { path: "M 0 25 Q 10 32 20 12 T 40 28 T 60 8 T 80 4", color: "#10B981" },
    pendingOrders: { path: "M 0 12 Q 10 16 20 12 T 40 16 T 60 22 T 80 28", color: "#F59E0B" },
    completedOrders: { path: "M 0 28 Q 10 18 20 22 T 40 8 T 60 12 T 80 2", color: "#10B981" },
    cancelledOrders: { path: "M 0 4 Q 10 12 20 8 T 40 22 T 60 18 T 80 28", color: "#EF4444" },
    avgRating: { path: "M 0 12 L 20 12 L 40 10 L 60 10 L 80 6", color: "#F59E0B" },
    activeCustomers: { path: "M 0 28 Q 15 18 30 22 T 60 8 T 80 2", color: "#3B82F6" },
    monthlyEarnings: { path: "M 0 32 Q 10 18 20 28 T 40 12 T 60 8 T 80 2", color: "#10B981" },
  };

  // Clear hover state when timeframe changes
  useEffect(() => {
    setHoveredPoint(null);
  }, [timeframe]);

  // Dynamic Chart Dataset selection based on timeframe
  const rawData: Array<{ day: string; val: number }> = dashboardData?.chartData || [
    { day: "Mon", val: 0 },
    { day: "Tue", val: 0 },
    { day: "Wed", val: 0 },
    { day: "Thu", val: 0 },
    { day: "Fri", val: 0 },
    { day: "Sat", val: 0 },
    { day: "Sun", val: 0 }
  ];

  const maxVal = Math.max(1, ...rawData.map(d => d.val));
  const minY = 50;
  const maxY = 160;

  const chartPoints = rawData.map((pt: { day: string; val: number }, i) => {
    const x = 40 + i * (420 / (rawData.length - 1));
    const y = maxY - ((pt.val / maxVal) * (maxY - minY));
    return {
      x,
      y,
      val: pt.val,
      day: pt.day,
    };
  });

  const getCurvePath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p1.x - (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const curvePath = getCurvePath(chartPoints);
  const fillPath = curvePath ? `${curvePath} L 460 170 L 40 170 Z` : "";

  const completedPercent = dashboardData?.distribution?.completed ?? 80;
  const pendingPercent = dashboardData?.distribution?.pending ?? 12;
  const cancelledPercent = dashboardData?.distribution?.cancelled ?? 8;

  const completedDash = (completedPercent / 100) * 238.76;
  const pendingDash = (pendingPercent / 100) * 238.76;
  const cancelledDash = (cancelledPercent / 100) * 238.76;

  const pendingOffset = -completedDash;
  const cancelledOffset = -(completedDash + pendingDash);

  if (isLoading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-[#71A066]" size={36} />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading live analytics...</p>
        </div>
      </div>
    );
  }


  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6 w-full min-w-0"
    >
      {/* 1. Header & Page Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Dashboard
          </h1>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
            Dashboard Module
          </p>
        </div>

        {/* Filters & Actions bar */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Timeframe Selector Pill */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/80 p-1 rounded-xl flex items-center shadow-sm">
            {(["today", "7days", "30days"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 capitalize ${timeframe === t
                    ? "bg-[#71A066] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                  }`}
              >
                {t === "7days" ? "Last 7 Days" : t === "30days" ? "Last 30 Days" : "Today"}
              </button>
            ))}
          </div>

          {/* Action Tools */}
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 shadow-sm transition duration-200 cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[#71A066]" : ""} />
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Card 1: Total Orders */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[135px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Orders</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 tracking-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{stats.totalOrders}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm">
              <ArrowUp size={10} strokeWidth={3} /> {stats.ordersTrend}
            </span>
            {/* Sparkline Graphic */}
            <svg className="w-16 h-8 overflow-visible" viewBox="0 0 80 40">
              <defs>
                <linearGradient id="spark-grad-orders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklines.totalOrders.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={sparklines.totalOrders.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparklines.totalOrders.path} fill="none" stroke={sparklines.totalOrders.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${sparklines.totalOrders.path} L 80 40 L 0 40 Z`} fill="url(#spark-grad-orders)" />
            </svg>
          </div>
        </div>

        {/* KPI Card 2: Today Revenue */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[135px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Today's Revenue</span>
              <span className="text-xl font-bold text-slate-800 dark:text-white mt-2 tracking-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{stats.todayRevenue}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm">
              <ArrowUp size={10} strokeWidth={3} /> {stats.revenueTrend}
            </span>
            <svg className="w-16 h-8 overflow-visible" viewBox="0 0 80 40">
              <defs>
                <linearGradient id="spark-grad-rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklines.todayRevenue.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={sparklines.todayRevenue.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparklines.todayRevenue.path} fill="none" stroke={sparklines.todayRevenue.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${sparklines.todayRevenue.path} L 80 40 L 0 40 Z`} fill="url(#spark-grad-rev)" />
            </svg>
          </div>
        </div>

        {/* KPI Card 3: Pending Orders */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[135px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pending Orders</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 tracking-tight group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">{stats.pendingOrders}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 shrink-0">
              <Clock size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-amber-100/50 dark:border-amber-900/30 shadow-sm">
              <ArrowDown size={10} strokeWidth={3} /> {stats.pendingTrend}
            </span>
            <svg className="w-16 h-8 overflow-visible" viewBox="0 0 80 40">
              <defs>
                <linearGradient id="spark-grad-pend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklines.pendingOrders.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={sparklines.pendingOrders.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparklines.pendingOrders.path} fill="none" stroke={sparklines.pendingOrders.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${sparklines.pendingOrders.path} L 80 40 L 0 40 Z`} fill="url(#spark-grad-pend)" />
            </svg>
          </div>
        </div>

        {/* KPI Card 4: Completed Orders */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[135px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Completed Orders</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 tracking-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{stats.completedOrders}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm">
              <ArrowUp size={10} strokeWidth={3} /> {stats.completedTrend}
            </span>
            <svg className="w-16 h-8 overflow-visible" viewBox="0 0 80 40">
              <defs>
                <linearGradient id="spark-grad-comp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklines.completedOrders.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={sparklines.completedOrders.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparklines.completedOrders.path} fill="none" stroke={sparklines.completedOrders.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${sparklines.completedOrders.path} L 80 40 L 0 40 Z`} fill="url(#spark-grad-comp)" />
            </svg>
          </div>
        </div>

        {/* KPI Card 5: Cancelled Orders */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[135px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cancelled Orders</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 tracking-tight group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">{stats.cancelledOrders}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 shrink-0">
              <XCircle size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-rose-100/50 dark:border-rose-900/30 shadow-sm">
              <ArrowDown size={10} strokeWidth={3} /> {stats.cancelledTrend}
            </span>
            <svg className="w-16 h-8 overflow-visible" viewBox="0 0 80 40">
              <defs>
                <linearGradient id="spark-grad-canc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklines.cancelledOrders.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={sparklines.cancelledOrders.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparklines.cancelledOrders.path} fill="none" stroke={sparklines.cancelledOrders.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${sparklines.cancelledOrders.path} L 80 40 L 0 40 Z`} fill="url(#spark-grad-canc)" />
            </svg>
          </div>
        </div>

        {/* KPI Card 6: Average Rating */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[135px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Average Rating</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 tracking-tight group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">{stats.avgRating} <span className="text-xs font-bold text-slate-400">/ 5.0</span></span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 shrink-0">
              <Star size={18} fill="currentColor" className="text-amber-500" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm">
              <ArrowUp size={10} strokeWidth={3} /> {stats.ratingTrend}
            </span>
            <svg className="w-16 h-8 overflow-visible" viewBox="0 0 80 40">
              <defs>
                <linearGradient id="spark-grad-rat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklines.avgRating.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={sparklines.avgRating.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparklines.avgRating.path} fill="none" stroke={sparklines.avgRating.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${sparklines.avgRating.path} L 80 40 L 0 40 Z`} fill="url(#spark-grad-rat)" />
            </svg>
          </div>
        </div>

        {/* KPI Card 7: Active Customers */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[135px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Customers</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 tracking-tight group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{stats.activeCustomers}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 shrink-0">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm">
              <ArrowUp size={10} strokeWidth={3} /> {stats.customersTrend}
            </span>
            <svg className="w-16 h-8 overflow-visible" viewBox="0 0 80 40">
              <defs>
                <linearGradient id="spark-grad-cust" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklines.activeCustomers.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={sparklines.activeCustomers.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparklines.activeCustomers.path} fill="none" stroke={sparklines.activeCustomers.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${sparklines.activeCustomers.path} L 80 40 L 0 40 Z`} fill="url(#spark-grad-cust)" />
            </svg>
          </div>
        </div>

        {/* KPI Card 8: Monthly Earnings */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[135px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Monthly Earnings</span>
              <span className="text-xl font-bold text-slate-800 dark:text-white mt-2 tracking-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{stats.monthlyEarnings}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm">
              <ArrowUp size={10} strokeWidth={3} /> {stats.earningsTrend}
            </span>
            <svg className="w-16 h-8 overflow-visible" viewBox="0 0 80 40">
              <defs>
                <linearGradient id="spark-grad-earn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklines.monthlyEarnings.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={sparklines.monthlyEarnings.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparklines.monthlyEarnings.path} fill="none" stroke={sparklines.monthlyEarnings.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${sparklines.monthlyEarnings.path} L 80 40 L 0 40 Z`} fill="url(#spark-grad-earn)" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Main Split Visual Section - Interactive Chart & Orders on left, Widgets on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0">

        {/* Left Side: Revenue Chart & Table (8 / 12 width) */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full min-w-0">

          {/* Revenue Analytics Curve Chart */}
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col gap-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Financial Health</span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">Revenue Analytics</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800/30">
                <span className="px-2 py-1 bg-white dark:bg-slate-900 text-[#71A066] dark:text-emerald-400 rounded-lg shadow-sm">LKR (Rs)</span>
                <span className="px-2 py-1">Orders</span>
              </div>
            </div>

            {/* Custom Interactive SVG Graph */}
            <div className="w-full relative h-[210px] mt-2 select-none">
              {/* Floating Tooltip Card */}
              <AnimatePresence>
                {hoveredPoint && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{ left: hoveredPoint.x - 72, top: hoveredPoint.y - 80 }}
                    className="absolute bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl flex flex-col z-20 pointer-events-none w-36 transition-all duration-75"
                  >
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{hoveredPoint.day} Earnings</span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">LKR {hoveredPoint.value.toLocaleString()}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  {/* Grid / Curve Gradients */}
                  <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="chart-stroke-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>

                {/* Horizontal dotted gridlines */}
                <line x1="30" y1="50" x2="470" y2="50" stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="30" y1="100" x2="470" y2="100" stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="30" y1="150" x2="470" y2="150" stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeWidth="1" strokeDasharray="4 4" />

                {/* Baseline */}
                <line x1="30" y1="170" x2="470" y2="170" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />

                {/* Curve Fill Area */}
                <path
                  d={fillPath}
                  fill="url(#chart-area-grad)"
                />

                {/* Main Curved line */}
                <path
                  d={curvePath}
                  fill="none"
                  stroke="url(#chart-stroke-grad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Days labels */}
                {chartPoints.map((pt: { x: number; y: number; val: number; day: string }, idx: number) => (
                  <text
                    key={idx}
                    x={pt.x}
                    y="188"
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-wider"
                  >
                    {pt.day}
                  </text>
                ))}

                {/* Interactive Dot Nodes */}
                {chartPoints.map((pt: { x: number; y: number; val: number; day: string }, idx: number) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint && hoveredPoint.day === pt.day ? "5.5" : "4"}
                    fill={hoveredPoint && hoveredPoint.day === pt.day ? "#10B981" : "#FFF"}
                    stroke="#10B981"
                    strokeWidth={hoveredPoint && hoveredPoint.day === pt.day ? "3" : "2"}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredPoint({ x: pt.x, y: pt.y, value: pt.val, day: pt.day })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: shortcuts & Quick Operations (4 / 12 width) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full min-w-0">
          {/* Quick Actions Panel */}
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">shortcuts</span>
            <span className="text-md font-bold text-slate-800 dark:text-slate-100 -mt-2">Quick Operations</span>

            <div className="grid grid-cols-2 gap-3 mt-1">
              <Link to="/restaurant/menu" hash="add" className="flex flex-col items-center justify-center p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15 shadow-sm transition duration-200 text-center group cursor-pointer decoration-none">
                <div className="p-2 rounded-xl bg-[#71A066] dark:bg-emerald-600 text-white group-hover:scale-105 transition-transform">
                  <Plus size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-2 tracking-tight">Add Dish</span>
              </Link>

              <Link to="/restaurant/offers" hash="create" className="flex flex-col items-center justify-center p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 rounded-2xl hover:bg-amber-500/10 dark:hover:bg-amber-500/15 shadow-sm transition duration-200 text-center group cursor-pointer decoration-none">
                <div className="p-2 rounded-xl bg-amber-500 text-white group-hover:scale-105 transition-transform">
                  <Award size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-2 tracking-tight">Create Coupon</span>
              </Link>

              <Link to="/restaurant/menu" className="flex flex-col items-center justify-center p-4 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 rounded-2xl hover:bg-blue-500/10 dark:hover:bg-blue-500/15 shadow-sm transition duration-200 text-center group cursor-pointer decoration-none">
                <div className="p-2 rounded-xl bg-blue-500 text-white group-hover:scale-105 transition-transform">
                  <Utensils size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-2 tracking-tight">Update Stock</span>
              </Link>

              <Link to="/restaurant/payments" className="flex flex-col items-center justify-center p-4 bg-slate-500/5 dark:bg-slate-500/10 border border-slate-500/10 rounded-2xl hover:bg-slate-500/10 dark:hover:bg-slate-500/15 shadow-sm transition duration-200 text-center group cursor-pointer decoration-none">
                <div className="p-2 rounded-xl bg-slate-500 text-white group-hover:scale-105 transition-transform">
                  <Wallet size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-2 tracking-tight">Wallet Info</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Full-Width Insights & Distribution Sub-grid (spans 12 columns total!) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0">
        {/* Today's Summary Widget */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">insights</span>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/20 capitalize">
              {timeframe === "today" ? "Today's" : timeframe === "30days" ? "30 Days" : "7 Days"} Summary
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            {/* Peak Hour */}
            <div className="p-4 bg-gradient-to-br from-amber-500/5 to-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 rounded-2xl flex flex-col justify-between group hover:scale-[1.02] transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Peak Hour</span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 shrink-0">
                  <Clock size={12} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-base font-extrabold text-slate-800 dark:text-white leading-none block">
                  {dashboardData?.insights?.peakHour || "7:00 PM"}
                </span>
                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wider block">Busy Shift</span>
              </div>
            </div>

            {/* Best Seller */}
            <div className="p-4 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 rounded-2xl flex flex-col justify-between group hover:scale-[1.02] transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Best Seller</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
                  <Utensils size={12} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-[12px] font-black text-slate-800 dark:text-white leading-none block truncate" title={dashboardData?.insights?.bestSeller || "Chicken Kottu"}>
                  {dashboardData?.insights?.bestSeller || "Chicken Kottu"}
                </span>
                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wider block">Top Item</span>
              </div>
            </div>

            {/* Refunds */}
            <div className="p-4 bg-gradient-to-br from-rose-500/5 to-rose-500/10 border border-rose-500/10 dark:border-rose-500/20 rounded-2xl flex flex-col justify-between group hover:scale-[1.02] transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Refunds</span>
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 shrink-0">
                  <RefreshCw size={12} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-base font-extrabold text-slate-800 dark:text-white leading-none block">
                  {dashboardData?.insights?.refunds ?? 0}
                </span>
                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wider block">Claims</span>
              </div>
            </div>

            {/* New Customers */}
            <div className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 rounded-2xl flex flex-col justify-between group hover:scale-[1.02] transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">New Cust.</span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 shrink-0">
                  <Users size={12} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-base font-extrabold text-slate-800 dark:text-white leading-none block">
                  +{dashboardData?.insights?.newCustomers ?? 0}
                </span>
                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wider block">Acquired</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Donut Chart Widget */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">distribution</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/20">Order Status</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 py-2 px-2 flex-1">
            {/* Donut Chart SVG Wrapper */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center mx-auto sm:mx-0">
              <svg className="w-full h-full transform -rotate-90 select-none" viewBox="0 0 100 100">
                {/* Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="currentColor"
                  className="text-slate-200/50 dark:text-slate-800/40"
                  strokeWidth="10"
                />
                {/* Completed Segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#71A066"
                  strokeWidth="10"
                  strokeDasharray={`${completedDash} 238.76`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out cursor-pointer hover:stroke-[11px]"
                />
                {/* Pending Segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth="10"
                  strokeDasharray={`${pendingDash} 238.76`}
                  strokeDashoffset={pendingOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out cursor-pointer hover:stroke-[11px]"
                />
                {/* Cancelled Segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#EF4444"
                  strokeWidth="10"
                  strokeDasharray={`${cancelledDash} 238.76`}
                  strokeDashoffset={cancelledOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out cursor-pointer hover:stroke-[11px]"
                />
              </svg>
              {/* Center text inside donut hole */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-slate-800 dark:text-white leading-none">{completedPercent}%</span>
                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Success</span>
              </div>
            </div>

            {/* Chart Legend */}
            <div className="flex-1 flex flex-col gap-2 w-full justify-center">
              {/* Completed */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-800/10 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-[#71A066]" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Completed Orders</span>
                </div>
                <span className="text-xs font-extrabold text-slate-800 dark:text-white">{completedPercent}%</span>
              </div>

              {/* Pending */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-800/10 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Pending Operations</span>
                </div>
                <span className="text-xs font-extrabold text-slate-800 dark:text-white">{pendingPercent}%</span>
              </div>

              {/* Cancelled */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-800/10 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Cancelled/Declined</span>
                </div>
                <span className="text-xs font-extrabold text-slate-800 dark:text-white">{cancelledPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Parallel Grid for Operations & Performance Feed (Recent Orders & Top Selling Dishes side-by-side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0">
        {/* Left Side: Recent Orders (8 / 12 width) */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full min-w-0">
          {/* Recent Orders Preview Panel */}
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Live Feed</span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">Recent Orders</span>
              </div>
              <Link to="/restaurant/orders" className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 dark:text-slate-350 dark:hover:text-slate-100 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60 transition duration-200 shadow-sm cursor-pointer decoration-none">
                View All Orders <ChevronRight size={12} />
              </Link>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto thin-scrollbar -mx-6 px-6">
              <table className="w-full text-left border-collapse min-w-[800px] table-fixed">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pb-3">
                    <th className="py-3 pr-4 w-[90px]">Order ID</th>
                    <th className="py-3 px-4 w-[160px]">Customer</th>
                    <th className="py-3 px-4 w-[240px]">Items</th>
                    <th className="py-3 px-4 text-right w-[100px]">Amount</th>
                    <th className="py-3 px-4 w-[100px]">Time</th>
                    <th className="py-3 pl-4 text-right w-[110px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {dashboardData?.recentOrders && dashboardData.recentOrders.length > 0 ? (
                    dashboardData.recentOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition duration-150">
                        <td className="py-3.5 pr-4 font-bold text-[#71A066] dark:text-emerald-400">#{order.id}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-6 w-6 rounded-full bg-[#71A066]/10 text-[#71A066] dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0">
                              {order.customer.initials}
                            </div>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold truncate" title={order.customer.name}>
                              {order.customer.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start max-w-full">
                            {order.items.map((item: any, idx: number) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/30" title={`${item.quantity}x ${item.name}`}>
                                <span className="text-[#71A066] dark:text-emerald-450 font-black">{item.quantity}x</span>
                                <span className="truncate max-w-[140px]">{item.name}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">{order.amount}</td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-500 font-normal whitespace-nowrap">{order.time}</td>
                        <td className="py-3.5 pl-4 text-right">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm whitespace-nowrap ${
                            order.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/20'
                              : order.status === 'Preparing'
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border-blue-100 dark:border-blue-900/20'
                              : order.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-900/20'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/20'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                        No orders recorded in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Popular Foods / Top Selling (4 / 12 width) - perfectly parallel to Recent Orders */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full min-w-0">
          {/* Popular Dishes Widget */}
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">Top Selling</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/20">Popular Dishes</span>
            </div>

            <div className="flex flex-col gap-3.5">
              {popularDishes.map((dish: any) => (
                <div key={dish.id} className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800/50 hover:border-[#71A066]/30 dark:hover:border-emerald-500/30 transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <img
                      src={dish.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120"}
                      alt={dish.name}
                      className="h-11 w-11 object-cover rounded-lg shadow-sm shrink-0 border border-slate-200/60 dark:border-slate-800 group-hover:scale-105 transition duration-200"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[12px] text-slate-800 dark:text-slate-100 truncate max-w-[130px]">{dish.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-[#71A066] dark:text-emerald-400 font-bold">LKR {dish.price}</span>
                        <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                          <Star size={9} fill="currentColor" strokeWidth={0} /> {dish.rating || 4.8}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end text-right">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{dish.salesCount || 0} sold</span>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 mt-1">In Stock</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default RestaurantDashboard;
