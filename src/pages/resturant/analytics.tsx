import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Clock,
  CheckCircle2, Star, Users, ArrowUpRight, Plus,
  RefreshCw, ChevronRight, Calendar, ArrowUp, ArrowDown,
  ClipboardList, Sparkles, Award, Utensils, MessageSquare,
  BellRing, ShieldCheck, HelpCircle, Wallet,
  ExternalLink, BarChart3, PieChart as PieIcon
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";
import { C } from "@/utils/theme";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";

// Timeframe options
type Timeframe = "today" | "7days" | "30days" | "12months";

// Type definitions for Analytics data
interface Metric {
  totalEarnings: number;
  totalOrders: number;
  avgOrderValue: number;
  cancelledRate: number;
  trends: {
    earnings: string;
    orders: string;
    aov: string;
    cancelled: string;
  };
}

interface TrendPoint {
  label: string;
  revenue: number;
  orders: number;
}

interface CategorySale {
  name: string;
  value: number;
  count: number;
  color: string;
}

interface BusyHourPoint {
  hour: string;
  orders: number;
  revenue: number;
}

interface TopSellingItem {
  id: string;
  name: string;
  category: string;
  price: number;
  salesCount: number;
  revenue: number;
  rating: number;
  image?: string;
}

interface AnalyticsData {
  metrics: Metric;
  salesTrend: TrendPoint[];
  categorySales: CategorySale[];
  busyHours: BusyHourPoint[];
  orderChannels: { name: string; value: number; color: string }[];
  paymentMethods: { name: string; value: number; color: string }[];
  customerRetention: { name: string; value: number; color: string }[];
  topSellingItems: TopSellingItem[];
}

export function AnalyticsReports() {
  const { user, token } = useAuth();
  const [timeframe, setTimeframe] = useState<Timeframe>("7days");
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const fetchAnalyticsData = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setIsLoading(true);
    try {
      const result = await apiRequest<AnalyticsData>(`/restaurant/analytics?timeframe=${timeframe}`, { token });
      setAnalyticsData(result);
    } catch (err) {
      console.error("Failed to fetch analytics statistics", err);
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, token]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const handleRefresh = () => {
    fetchAnalyticsData(true);
  };

  // Mint green brand colors
  const mintColor = "#71A066";
  const mintHover = "#5E8B54";

  const fallbackData: AnalyticsData = {
    metrics: {
      totalEarnings: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      cancelledRate: 0,
      trends: {
        earnings: "0%",
        orders: "0%",
        aov: "0%",
        cancelled: "0%",
      },
    },
    salesTrend: [],
    categorySales: [],
    busyHours: [],
    orderChannels: [
      { name: "Delivery", value: 0, color: "#71A066" },
      { name: "Pickup", value: 0, color: "#F9A03F" },
    ],
    paymentMethods: [
      { name: "Cash", value: 0, color: "#813405" },
      { name: "Card", value: 0, color: "#71A066" },
    ],
    customerRetention: [
      { name: "Returning", value: 0, color: "#71A066" },
      { name: "New", value: 0, color: "#F9C74F" },
    ],
    topSellingItems: [],
  };
  const data = analyticsData || fallbackData;

  // Custom tooltips for Recharts
  const CustomTooltipRevenue = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#FFFCF5] p-3 rounded-2xl border border-[#F8DDA4]/60 shadow-lg text-xs font-semibold">
          <p className="text-[#813405]/50 mb-1">{label}</p>
          <p className="text-[#813405] text-sm font-bold">
            Revenue: <span className="text-[#71A066]">LKR {payload[0].value.toLocaleString()}</span>
          </p>
          {payload[1] && (
            <p className="text-[#813405]/70 mt-0.5">
              Orders: <span className="text-[#F9A03F]">{payload[1].value}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomTooltipHours = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#FFFCF5] p-3 rounded-2xl border border-[#F8DDA4]/60 shadow-lg text-xs font-semibold">
          <p className="text-[#813405]/50 mb-1">Hour: {label}</p>
          <p className="text-[#813405] text-sm font-bold">
            Orders: <span className="text-[#71A066]">{payload[0].value}</span>
          </p>
          <p className="text-[#813405]/70 mt-0.5">
            Est. Revenue: <span className="text-[#606C38]">LKR {payload[0].payload.revenue.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomCategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-[#FFFCF5] p-3 rounded-2xl border border-[#F8DDA4]/60 shadow-lg text-xs font-semibold">
          <p className="text-sm font-bold" style={{ color: payload[0].payload.color || mintColor }}>
            {dataPoint.name}
          </p>
          <p className="text-[#813405] mt-1">
            Revenue: <span className="font-bold">LKR {dataPoint.value.toLocaleString()}</span>
          </p>
          <p className="text-[#813405]/70">
            Quantity Sold: <span className="font-bold">{dataPoint.count}</span>
          </p>
        </div>
      );
    }
    return null;
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#FFFCF5] p-6 rounded-3xl border border-[#F8DDA4]/60 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-[#813405] tracking-tight">
              Analytics & Reports
            </h1>
            <Sparkles className="w-5 h-5 text-[#71A066] animate-pulse" />
          </div>
          <p className="text-xs font-bold text-[#D45113]/70 mt-1 uppercase tracking-wider">
            Restaurant performance diagnostics and business intelligence metrics
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 lg:w-auto shrink-0">
          {/* Timeframe Selector */}
          <div className="relative flex items-center bg-[#F7F0E3] p-1 rounded-2xl border border-[#F8DDA4]/45">
            {(["today", "7days", "30days", "12months"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${timeframe === tf
                    ? "bg-[#71A066] text-[#FFFCF5] shadow-sm"
                    : "text-[#813405]/65 hover:text-[#813405]"
                  }`}
              >
                {tf === "today" ? "Today" : tf === "7days" ? "7 Days" : tf === "30days" ? "30 Days" : "12 Mos"}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-[#F7F0E3] border border-[#F8DDA4]/45 text-[#813405] hover:bg-[#F8DDA4]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#71A066]" : ""}`} />
          </button>


        </div>
      </div>



      {/* Main Dashboard Panel */}
      <div id="analytics-dashboard-content" className="flex flex-col gap-6">

        {/* Loading overlay for timeframe transitions */}
        {isLoading ? (
          <div className="bg-[#FFFCF5] rounded-3xl p-8 border border-dashed border-[#F8DDA4]/60 shadow-card min-h-[500px] flex flex-col items-center justify-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#F8DDA4]/30 animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-[#71A066] border-t-transparent animate-spin" />
            </div>
            <p className="text-sm font-bold text-[#813405]">Loading Analytics Engine...</p>
            <p className="text-xs text-[#813405]/60">Processing sales database and client metrics</p>
          </div>
        ) : (
          <>
            {/* KPI Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Earnings Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-[#FFFCF5] p-6 rounded-3xl border border-[#F8DDA4]/50 shadow-card hover:shadow-lg transition-shadow relative overflow-hidden"
              >
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#71A066]/5 rounded-full" />
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-[#71A066]/10 text-[#71A066] rounded-2xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs font-black ${data.metrics.trends.earnings.startsWith("+") ? "text-[#71A066]" : "text-[#F94144]"
                    }`}>
                    {data.metrics.trends.earnings.startsWith("+") ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {data.metrics.trends.earnings}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-black text-[#813405]/50 uppercase tracking-wider">Gross Revenue</p>
                  <h3 className="text-xl md:text-2xl font-black text-[#813405] mt-1 font-display">
                    LKR {data.metrics.totalEarnings.toLocaleString()}
                  </h3>
                  <p className="text-[10px] text-[#813405]/40 mt-1">vs previous timeframe</p>
                </div>
              </motion.div>

              {/* Orders Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#FFFCF5] p-6 rounded-3xl border border-[#F8DDA4]/50 shadow-card hover:shadow-lg transition-shadow relative overflow-hidden"
              >
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#F9A03F]/5 rounded-full" />
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-[#F9A03F]/10 text-[#F9A03F] rounded-2xl">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs font-black ${data.metrics.trends.orders.startsWith("+") ? "text-[#71A066]" : "text-[#F94144]"
                    }`}>
                    {data.metrics.trends.orders.startsWith("+") ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {data.metrics.trends.orders}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-black text-[#813405]/50 uppercase tracking-wider">Total Orders</p>
                  <h3 className="text-xl md:text-2xl font-black text-[#813405] mt-1 font-display">
                    {data.metrics.totalOrders.toLocaleString()}
                  </h3>
                  <p className="text-[10px] text-[#813405]/40 mt-1">vs previous timeframe</p>
                </div>
              </motion.div>

              {/* AOV Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-[#FFFCF5] p-6 rounded-3xl border border-[#F8DDA4]/50 shadow-card hover:shadow-lg transition-shadow relative overflow-hidden"
              >
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#606C38]/5 rounded-full" />
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-[#606C38]/10 text-[#606C38] rounded-2xl">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs font-black ${data.metrics.trends.aov.startsWith("+") ? "text-[#71A066]" : "text-[#F94144]"
                    }`}>
                    {data.metrics.trends.aov.startsWith("+") ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {data.metrics.trends.aov}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-black text-[#813405]/50 uppercase tracking-wider">Avg Order Value</p>
                  <h3 className="text-xl md:text-2xl font-black text-[#813405] mt-1 font-display">
                    LKR {data.metrics.avgOrderValue.toLocaleString()}
                  </h3>
                  <p className="text-[10px] text-[#813405]/40 mt-1">per order basket average</p>
                </div>
              </motion.div>

              {/* Cancellation Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#FFFCF5] p-6 rounded-3xl border border-[#F8DDA4]/50 shadow-card hover:shadow-lg transition-shadow relative overflow-hidden"
              >
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#813405]/5 rounded-full" />
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-[#813405]/10 text-[#813405] rounded-2xl">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs font-black ${data.metrics.trends.cancelled.startsWith("-") ? "text-[#71A066]" : "text-[#F94144]"
                    }`}>
                    {data.metrics.trends.cancelled.startsWith("-") ? (
                      <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUp className="w-3 h-3" />
                    )}
                    {data.metrics.trends.cancelled}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-black text-[#813405]/50 uppercase tracking-wider">Cancellation Rate</p>
                  <h3 className="text-xl md:text-2xl font-black text-[#813405] mt-1 font-display">
                    {data.metrics.cancelledRate}%
                  </h3>
                  <p className="text-[10px] text-[#813405]/40 mt-1">failed or rejected requests</p>
                </div>
              </motion.div>
            </div>

            {/* Sales Trend Chart Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales Curve Line / Area */}
              <div className="lg:col-span-2 bg-[#FFFCF5] p-6 rounded-3xl border border-[#F8DDA4]/60 shadow-card flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-md font-black text-[#813405] flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-[#71A066]" /> Sales & Order Trends
                    </h3>
                    <p className="text-xs text-[#813405]/60 mt-0.5">Timeline diagnostics of revenue and volume</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#813405]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#71A066]" /> Revenue
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#813405]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F9A03F]" /> Orders
                    </div>
                  </div>
                </div>

                <div className="w-full h-[320px] select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.salesTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#71A066" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#71A066" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(129,52,5,0.06)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "rgba(129,52,5,0.6)", fontSize: 10, fontWeight: "bold" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fill: "rgba(129,52,5,0.6)", fontSize: 10, fontWeight: "bold" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: "rgba(129,52,5,0.6)", fontSize: 10, fontWeight: "bold" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltipRevenue />} cursor={{ stroke: "rgba(129,52,5,0.1)", strokeWidth: 1 }} />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#71A066"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="orders"
                        fill="#F9A03F"
                        barSize={timeframe === "30days" ? 6 : 14}
                        radius={[4, 4, 0, 0]}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sales Category Breakdown */}
              <div className="bg-[#FFFCF5] p-6 rounded-3xl border border-[#F8DDA4]/60 shadow-card flex flex-col justify-between">
                <div>
                  <h3 className="text-md font-black text-[#813405] flex items-center gap-1.5">
                    <PieIcon className="w-4 h-4 text-[#71A066]" /> Sales by Category
                  </h3>
                  <p className="text-xs text-[#813405]/60 mt-0.5">Contribution of menu groups to gross revenue</p>
                </div>

                <div className="w-full h-[220px] relative select-none mt-4">
                  {/* Center Text displaying dominant category */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4 z-0">
                    <p className="text-[10px] uppercase font-bold text-[#813405]/50">Top Group</p>
                    <p className="text-base font-black text-[#813405]">
                      {data.categorySales[0]?.name || "None"}
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomCategoryTooltip />} />
                      <Pie
                        data={data.categorySales}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data.categorySales.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend Details */}
                <div className="flex flex-col gap-2 mt-4">
                  {data.categorySales.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-bold text-[#813405]/80">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-semibold text-[#813405]/60">
                        <span>{cat.count} sold</span>
                        <span className="font-bold text-[#813405]">LKR {cat.value.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Busiest Peak Hours & Split Distribution Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Peak operating hours */}
              <div className="lg:col-span-2 bg-[#FFFCF5] p-6 rounded-3xl border border-[#F8DDA4]/60 shadow-card">
                <div className="mb-4">
                  <h3 className="text-md font-black text-[#813405] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#71A066]" /> Busy Hours Distribution
                  </h3>
                  <p className="text-xs text-[#813405]/60 mt-0.5">Identifies peak load times during operation (24h profiles)</p>
                </div>
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.busyHours} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(129,52,5,0.04)" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fill: "rgba(129,52,5,0.6)", fontSize: 9, fontWeight: "bold" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "rgba(129,52,5,0.6)", fontSize: 9, fontWeight: "bold" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltipHours />} />
                      <Bar dataKey="orders" fill={mintColor} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sub Distributions (Channels, Payments, Customers) */}
              <div className="bg-[#FFFCF5] p-6 rounded-3xl border border-[#F8DDA4]/60 shadow-card flex flex-col justify-between">
                <div>
                  <h3 className="text-md font-black text-[#813405] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#71A066]" /> Operational Splits
                  </h3>
                  <p className="text-xs text-[#813405]/60 mt-0.5">Payment, channels, and customer retention metrics</p>
                </div>

                <div className="flex flex-col gap-4 mt-4">
                  {/* Order Channels */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-[#813405]/80 mb-1.5">
                      <span>Order Channels</span>
                      <div className="flex gap-2 text-[10px]">
                        <span className="text-[#71A066] font-bold">Delivery ({data.orderChannels[0].value}%)</span>
                        <span className="text-[#F9A03F] font-bold">Pickup ({data.orderChannels[1].value}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-[#F7F0E3] rounded-full overflow-hidden flex">
                      <div className="h-full bg-[#71A066]" style={{ width: `${data.orderChannels[0].value}%` }} />
                      <div className="h-full bg-[#F9A03F]" style={{ width: `${data.orderChannels[1].value}%` }} />
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-[#813405]/80 mb-1.5">
                      <span>Payment Methods</span>
                      <div className="flex gap-2 text-[10px]">
                        <span className="text-[#813405] font-bold">Cash ({data.paymentMethods[0].value}%)</span>
                        <span className="text-[#71A066] font-bold">Card ({data.paymentMethods[1].value}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-[#F7F0E3] rounded-full overflow-hidden flex">
                      <div className="h-full bg-[#813405]" style={{ width: `${data.paymentMethods[0].value}%` }} />
                      <div className="h-full bg-[#71A066]" style={{ width: `${data.paymentMethods[1].value}%` }} />
                    </div>
                  </div>

                  {/* Customer Retention */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-[#813405]/80 mb-1.5">
                      <span>Customer Loyalty</span>
                      <div className="flex gap-2 text-[10px]">
                        <span className="text-[#71A066] font-bold">Returning ({data.customerRetention[0].value}%)</span>
                        <span className="text-[#F9C74F] font-bold">New ({data.customerRetention[1].value}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-[#F7F0E3] rounded-full overflow-hidden flex">
                      <div className="h-full bg-[#71A066]" style={{ width: `${data.customerRetention[0].value}%` }} />
                      <div className="h-full bg-[#F9C74F]" style={{ width: `${data.customerRetention[1].value}%` }} />
                    </div>
                  </div>
                </div>

                <div className="bg-[#FAF7F2] border border-[#F8DDA4]/40 p-3 rounded-2xl mt-4 text-[10px] font-semibold text-[#813405]/70 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#71A066]" />
                  <span>Metrics are calculated from secure checkouts and authentic reviews.</span>
                </div>
              </div>
            </div>

            {/* Top Selling Items Table */}
            <div className="bg-[#FFFCF5] p-6 rounded-3xl border border-[#F8DDA4]/60 shadow-card">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                  <h3 className="text-md font-black text-[#813405] flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-[#71A066]" /> Top Performing Menu Items
                  </h3>
                  <p className="text-xs text-[#813405]/60 mt-0.5">Highest generating food options and client reviews</p>
                </div>
                <div className="px-3 py-1 bg-[#71A066]/10 text-[#71A066] rounded-xl text-xs font-black">
                  Top 5 Dishes
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#F8DDA4]/40 text-[#813405]/60 text-xs font-black uppercase">
                      <th className="pb-3 font-black">Rank / Item</th>
                      <th className="pb-3 font-black">Category</th>
                      <th className="pb-3 font-black">Unit Price</th>
                      <th className="pb-3 font-black text-center">Qty Sold</th>
                      <th className="pb-3 font-black text-right">Revenue</th>
                      <th className="pb-3 font-black text-right pr-2">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F8DDA4]/30">
                    {data.topSellingItems.map((item, idx) => {
                      const maxRevenue = data.topSellingItems[0].revenue || 1;
                      const barWidthPct = Math.round((item.revenue / maxRevenue) * 100);
                      return (
                        <tr key={item.id} className="text-xs font-bold text-[#813405]/80 hover:bg-[#FAF7F2]/50 transition-colors">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${idx === 0 ? "bg-[#F9C74F] text-[#813405]" : idx === 1 ? "bg-slate-300 text-slate-700" : idx === 2 ? "bg-amber-600 text-[#FFFCF5]" : "bg-[#F7F0E3] text-[#813405]/50"
                                }`}>
                                {idx + 1}
                              </span>
                              <div>
                                <p className="font-black text-[#813405] text-sm">{item.name}</p>
                                <p className="text-[10px] text-[#813405]/50 font-bold">Dish ID: TRB-{item.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">{item.category}</td>
                          <td className="py-4">LKR {item.price.toLocaleString()}</td>
                          <td className="py-4 text-center text-sm font-black text-[#813405]">{item.salesCount}</td>
                          <td className="py-4">
                            <div className="flex flex-col items-end gap-1.5 w-full">
                              <span className="font-black text-[#813405]">LKR {item.revenue.toLocaleString()}</span>
                              <div className="w-24 h-1.5 bg-[#F7F0E3] rounded-full overflow-hidden">
                                <div className="h-full bg-[#71A066]" style={{ width: `${barWidthPct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <div className="flex items-center justify-end gap-1 font-black text-[#F9A03F]">
                              <Star className="w-3.5 h-3.5 fill-[#F9A03F] text-[#F9A03F]" />
                              <span>{item.rating}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default AnalyticsReports;
