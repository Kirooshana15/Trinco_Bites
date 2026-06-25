import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserCheck, Crown, Star, Search,
  ChevronLeft, ChevronRight, Eye, Clock, CheckCircle2, XCircle, MapPin,
  Mail, Phone, Heart, RefreshCw, ShoppingBag, ChevronDown
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";

// ==========================================
// 1. TYPE DEFINITIONS
// ==========================================
interface CustomerReview {
  id: string;
  rating: number;
  comment: string;
  date: string;
  foodRating: number;
  serviceRating: number;
}

interface CustomerOrder {
  id: string;
  date: string;
  items: string;
  amount: number; // in LKR
  paymentStatus: "Paid" | "Pending" | "Failed";
  orderStatus: "Completed" | "Pending" | "Cancelled";
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  status: "Active" | "Frequent";
  loyaltyLevel?: "Gold" | "Platinum" | "Diamond";
  favoriteFood: string;
  rating: number;
  orders: CustomerOrder[];
  reviews: CustomerReview[];
}

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-blue-500/10 text-blue-600",
    "bg-indigo-500/10 text-indigo-600",
    "bg-purple-500/10 text-purple-600",
    "bg-pink-500/10 text-pink-600",
    "bg-[#71A066]/10 text-[#71A066]", // brand green
    "bg-teal-500/10 text-teal-600",
    "bg-amber-500/10 text-amber-600",
    "bg-orange-500/10 text-orange-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export function CustomerManagement() {
  const { token } = useAuth();

  // ==========================================
  // PAGE STATES
  // ==========================================
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [returningDiners, setReturningDiners] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Frequent">("All");
  const [sortBy, setSortBy] = useState<"name" | "totalOrders" | "totalSpent" | "joinDate">("totalSpent");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Custom expandable rows in order history
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // SSR Mounting guard
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ==========================================
  // FETCH DATA FROM BACKEND
  // ==========================================
  const fetchCustomers = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setIsLoading(true);
    try {
      const data = await apiRequest<{
        customers: Customer[];
        growthData: any[];
        returningDiners: number;
      }>("/restaurant/customers", { token });

      const customerList = data.customers || [];
      setCustomers(customerList);
      setGrowthData(data.growthData || []);
      setReturningDiners(data.returningDiners || 0);

      if (customerList.length > 0) {
        setSelectedCustomerId(prev => {
          const exists = customerList.some(c => c.id === prev);
          return exists ? prev : customerList[0].id;
        });
      } else {
        setSelectedCustomerId("");
      }
    } catch (err) {
      console.error("Failed to fetch customers", err);
      toast.error("Failed to retrieve customer directory.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCustomers(true);
    setIsRefreshing(false);
  };

  // ==========================================
  // CALCULATED ANALYTICS STATS (DYNAMIC)
  // ==========================================
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.status === "Active").length;
    const frequent = customers.filter(c => c.status === "Frequent").length;

    const validRatings = customers.map(c => c.rating).filter(r => r > 0);
    const avgRating = validRatings.length
      ? (validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length).toFixed(2)
      : "5.00";

    return { total, active, frequent, avgRating };
  }, [customers]);

  // Selected customer object for timeline & review updates
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  // ==========================================
  // SEARCH, FILTER & SORT LOGIC
  // ==========================================
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm);

      const matchesStatus = statusFilter === "All" || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "joinDate") {
        comparison = new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
      } else if (sortBy === "totalOrders") {
        comparison = a.totalOrders - b.totalOrders;
      } else if (sortBy === "totalSpent") {
        comparison = a.totalSpent - b.totalSpent;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [customers, searchTerm, statusFilter, sortBy, sortOrder]);

  // Pagination bounds
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;

  // Keep pagination bounds in check
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSort = (field: "name" | "totalOrders" | "totalSpent" | "joinDate") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Sparkline generator helper
  const drawSparkline = (dataPoints: number[], color: string) => {
    const width = 80;
    const height = 30;
    const max = Math.max(...dataPoints);
    const min = Math.min(...dataPoints);
    const range = max - min || 1;

    const coords = dataPoints.map((val, idx) => {
      const x = (idx / (dataPoints.length - 1)) * width;
      const y = height - 3 - ((val - min) / range) * (height - 6);
      return `${x},${y}`;
    }).join(" ");

    return (
      <svg className="w-20 h-8 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords}
        />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[#4E3E2A] dark:text-slate-350 gap-4">
        <RefreshCw className="animate-spin text-[#71A066]" size={36} />
        <p className="text-sm font-semibold tracking-wide">Loading customer directory...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-8 font-sans text-[#4E3E2A] pb-16"
    >
      {/* ==========================================
          TOP HEADER AREA
          ========================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-[#4E3E2A]/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#71A066]/10 text-[#71A066] rounded-xl">
              <Users size={24} />
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#4E3E2A] dark:text-slate-100 tracking-tight">
                Customer Directory
              </h1>
              <p className="text-xs font-semibold text-[#4E3E2A]/60 dark:text-slate-400 mt-0.5">
                Monitor online diners, loyalty stats, and dynamic reviews feed.
              </p>
            </div>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          {/* Live Search bar */}
          <div className="relative flex-1 sm:w-60 min-w-[200px]">
            <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-[#4E3E2A]/40 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] dark:text-slate-100 placeholder-[#4E3E2A]/30 dark:placeholder-slate-500 transition-all duration-200"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-3.5 pr-8 py-2 text-sm bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] text-[#4E3E2A] dark:text-slate-200 appearance-none cursor-pointer font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Customers</option>
              <option value="Frequent">Frequent VIPs</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3.5 pointer-events-none text-[#4E3E2A]/50 dark:text-slate-400" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-white dark:bg-slate-950 hover:bg-[#FFFCF5] dark:hover:bg-slate-850 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl text-[#4E3E2A] dark:text-slate-200 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="Refresh Directory"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[#71A066]" : ""} />
          </button>
        </div>
      </div>

      {/* ==========================================
          STATISTICS CARDS
          ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Customers */}
        <div className="bg-white/95 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-[#4E3E2A]/10 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 group flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-wider">Total Customers</span>
              <span className="text-2xl font-black text-[#4E3E2A] dark:text-white mt-2 group-hover:text-[#71A066] transition-colors">{stats.total}</span>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shrink-0 shadow-sm">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#4E3E2A]/5 dark:border-slate-850">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100/50">
              Active
            </span>
            {drawSparkline([8, 12, 10, 15, 14, 18, stats.total], "#F59E0B")}
          </div>
        </div>

        {/* Card 2: Active Customers */}
        <div className="bg-white/95 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-[#4E3E2A]/10 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 group flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-wider">Active Customers</span>
              <span className="text-2xl font-black text-[#4E3E2A] dark:text-white mt-2 group-hover:text-[#71A066] transition-colors">{stats.active}</span>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shrink-0 shadow-sm">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#4E3E2A]/5 dark:border-slate-850">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100/50">
              Orders Placed
            </span>
            {drawSparkline([3, 5, 4, 7, 6, 8, stats.active], "#10B981")}
          </div>
        </div>

        {/* Card 3: Frequent Customers */}
        <div className="bg-white/95 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-[#4E3E2A]/10 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 group flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-wider">Frequent VIPs</span>
              <span className="text-2xl font-black text-[#4E3E2A] dark:text-white mt-2 group-hover:text-[#71A066] transition-colors">{stats.frequent}</span>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-400 text-white shrink-0 shadow-sm">
              <Crown size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#4E3E2A]/5 dark:border-slate-850">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100/50">
              5+ Orders
            </span>
            {drawSparkline([1, 2, 2, 3, 3, 3, stats.frequent], "#8B5CF6")}
          </div>
        </div>

        {/* Card 4: Returning Diners */}
        <div className="bg-white/95 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-[#4E3E2A]/10 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 group flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-wider">Returning Diners</span>
              <span className="text-2xl font-black text-[#71A066] mt-2">{returningDiners}%</span>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white shrink-0 shadow-sm">
              <Heart size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#4E3E2A]/5 dark:border-slate-850">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100/50">
              Loyal
            </span>
            {drawSparkline([60, 65, 62, 70, 75, 74, returningDiners], "#10B981")}
          </div>
        </div>

        {/* Card 5: Average Rating */}
        <div className="bg-white/95 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-[#4E3E2A]/10 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 group flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-wider">Average Rating</span>
              <span className="text-2xl font-black text-[#4E3E2A] dark:text-white mt-2 group-hover:text-[#71A066] transition-colors">{stats.avgRating} <span className="text-xs font-semibold text-[#4E3E2A]/40 dark:text-slate-500">/ 5.0</span></span>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-400 text-white shrink-0 shadow-sm">
              <Star size={18} fill="currentColor" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#4E3E2A]/5 dark:border-slate-850">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100/50">
              Satisfied
            </span>
            {drawSparkline([4.6, 4.65, 4.7, 4.72, 4.78, 4.8, parseFloat(stats.avgRating)], "#FBBF24")}
          </div>
        </div>
      </div>

      {/* ==========================================
          TWO-COLUMN MAIN GRID LAYOUT
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ==========================================
            LEFT MAIN COLUMN (8/12 Width)
            ========================================== */}
        <div className="lg:col-span-8 flex flex-col gap-8">

          {/* CUSTOMER TABLE SECTION */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-[#4E3E2A]/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#4E3E2A]/10 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div>
                <h2 className="text-md font-bold text-[#4E3E2A] dark:text-slate-100">Customer Directory</h2>
                <p className="text-[10px] font-semibold text-[#4E3E2A]/50 dark:text-slate-400">Filter, sort, and browse your registered online customers.</p>
              </div>
              <div className="text-[10px] font-bold text-[#4E3E2A]/50 dark:text-slate-400 bg-[#4E3E2A]/5 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-[#4E3E2A]/10">
                Displaying <span className="font-extrabold text-[#71A066]">{filteredCustomers.length}</span> of {customers.length} Customers
              </div>
            </div>

            {/* Responsive Table Wrapper */}
            <div className="overflow-x-auto overflow-y-auto max-h-[400px] scrollbar-thin w-full rounded-b-3xl">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-[#4E3E2A]/40 dark:text-slate-500 font-semibold text-xs">
                  No customers found matching the criteria.
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm">
                    <tr className="border-b border-[#4E3E2A]/10 dark:border-slate-800 text-[10px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-widest select-none">
                      <th className="py-3.5 pl-6 pr-2">Customer Info</th>
                      <th className="py-3.5 px-4">Contact</th>
                      <th className="py-3.5 px-4 cursor-pointer hover:text-[#71A066]" onClick={() => handleSort("totalOrders")}>
                        Orders {sortBy === "totalOrders" && (sortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="py-3.5 px-4 cursor-pointer hover:text-[#71A066]" onClick={() => handleSort("totalSpent")}>
                        Spent (LKR) {sortBy === "totalSpent" && (sortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="py-3.5 px-4 cursor-pointer hover:text-[#71A066]" onClick={() => handleSort("joinDate")}>
                        Joined {sortBy === "joinDate" && (sortOrder === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="py-3.5 pr-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4E3E2A]/5 dark:divide-slate-850 text-xs font-semibold text-[#4E3E2A] dark:text-slate-350">
                    {paginatedCustomers.map((cust) => {
                      const isSelected = selectedCustomerId === cust.id;
                      return (
                        <tr
                          key={cust.id}
                          onClick={() => setSelectedCustomerId(cust.id)}
                          className={`hover:bg-[#FFFCF5]/50 dark:hover:bg-slate-850/40 cursor-pointer transition-colors duration-150 ${isSelected ? "bg-[#FFFCF5] dark:bg-slate-800/50" : ""
                            }`}
                        >
                          {/* Avatar & Name */}
                          <td className="py-4 pl-6 pr-2">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-xs relative shrink-0 ${getAvatarColor(cust.name)}`}>
                                {cust.avatar}
                                {cust.status === "Frequent" && (
                                  <Crown size={8} className="absolute -top-1 -right-1 text-amber-500 fill-amber-500" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-extrabold text-sm text-[#4E3E2A] dark:text-slate-100 truncate flex items-center gap-1">
                                  {cust.name}
                                </span>
                                <span className="text-[9px] text-[#4E3E2A]/40 dark:text-slate-500 font-semibold">{cust.id.substring(0, 8).toUpperCase()}</span>
                              </div>
                            </div>
                          </td>

                          {/* Contact details */}
                          <td className="py-4 px-4 font-normal">
                            <div className="flex flex-col text-[11px] gap-0.5 text-[#4E3E2A]/70 dark:text-slate-400">
                              <span className="flex items-center gap-1"><Mail size={10} /> {cust.email}</span>
                              <span className="flex items-center gap-1"><Phone size={10} /> {cust.phone}</span>
                            </div>
                          </td>

                          {/* Total Orders */}
                          <td className="py-4 px-4 font-extrabold text-[#4E3E2A] dark:text-slate-200">
                            {cust.totalOrders} meals
                          </td>

                          {/* Total Spent */}
                          <td className="py-4 px-4 font-black text-[#71A066]">
                            Rs {cust.totalSpent.toLocaleString()}
                          </td>

                          {/* Join Date */}
                          <td className="py-4 px-4 text-[#4E3E2A]/60 dark:text-slate-400 text-[11px]">
                            {new Date(cust.joinDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 pr-6 text-right">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs shrink-0 ${cust.status === "Frequent"
                              ? "bg-purple-50 text-purple-650 dark:bg-purple-950/25 dark:text-purple-400 border-purple-100 dark:border-purple-900/30"
                              : "bg-emerald-50 text-emerald-650 dark:bg-emerald-950/25 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                              }`}>
                              {cust.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination controls */}
            <div className="p-4 border-t border-[#4E3E2A]/5 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 flex items-center justify-between text-xs font-bold text-[#4E3E2A]/60 dark:text-slate-400">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#4E3E2A]/10 bg-white dark:bg-slate-950 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-[#FFFCF5]"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#4E3E2A]/10 bg-white dark:bg-slate-950 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-[#FFFCF5]"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* DYNAMIC TIMELINE ORDER HISTORY SECTION */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-[#4E3E2A]/10 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#4E3E2A]/5 dark:border-slate-850 pb-4 mb-4 gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#71A066]/10 text-[#71A066] rounded-lg">
                  <ShoppingBag size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-[#4E3E2A] dark:text-slate-100">
                    Active Timeline: {selectedCustomer?.name || "No Customer Selected"}
                  </h3>
                  <p className="text-[10px] font-semibold text-[#4E3E2A]/50 dark:text-slate-400">
                    Past orders and current status.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-[#71A066] bg-[#71A066]/10 px-2.5 py-1 rounded-full border border-[#71A066]/20 shadow-sm shrink-0">
                {selectedCustomer?.orders.length || 0} Total Orders
              </span>
            </div>

            {/* Timeline element */}
            {!selectedCustomer || selectedCustomer.orders.length === 0 ? (
              <div className="py-8 text-center text-[#4E3E2A]/40 dark:text-slate-500 font-semibold text-xs">
                No orders registered under this customer account.
              </div>
            ) : (
              <div className="relative pl-6 border-l border-dashed border-[#71A066]/30 dark:border-slate-800 space-y-5 py-2">
                {selectedCustomer.orders.map((ord) => {
                  const isOpen = expandedOrderId === ord.id;
                  return (
                    <div key={ord.id} className="relative">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[31px] top-1.5 p-1 rounded-full border-4 bg-white dark:bg-slate-900 shadow-sm shrink-0 ${ord.orderStatus === "Completed"
                        ? "border-[#71A066] text-[#71A066]"
                        : ord.orderStatus === "Pending"
                          ? "border-amber-500 text-amber-500"
                          : "border-rose-500 text-rose-500"
                        }`}>
                        {ord.orderStatus === "Completed" && <CheckCircle2 size={10} />}
                        {ord.orderStatus === "Pending" && <Clock size={10} />}
                        {ord.orderStatus === "Cancelled" && <XCircle size={10} />}
                      </div>

                      {/* Timeline Card */}
                      <div
                        onClick={() => setExpandedOrderId(isOpen ? null : ord.id)}
                        className="bg-white/40 dark:bg-slate-955/30 hover:bg-white/70 dark:hover:bg-slate-955/60 p-4 rounded-2xl border border-[#4E3E2A]/5 dark:border-slate-850 hover:border-[#71A066]/25 transition-all duration-200 cursor-pointer select-none"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-[#71A066]">{ord.id}</span>
                            <span className="text-[10px] text-[#4E3E2A]/50 dark:text-slate-500 font-semibold mt-0.5">Ordered on {ord.date}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-[#4E3E2A] dark:text-slate-100">Rs {ord.amount.toLocaleString()}</span>

                            {/* Order Status Badge */}
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-2xs ${ord.orderStatus === "Completed"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : ord.orderStatus === "Pending"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-455"
                              }`}>
                              {ord.orderStatus}
                            </span>
                          </div>
                        </div>

                        {/* Collapsed items description preview */}
                        <div className="mt-2 text-[11px] text-[#4E3E2A]/70 dark:text-slate-400 flex items-center justify-between border-t border-[#4E3E2A]/5 dark:border-slate-850 pt-2 font-medium">
                          <span>Items: <strong className="text-[#4E3E2A] dark:text-slate-300 font-bold">{ord.items}</strong></span>
                          <span className="text-[9px] text-[#71A066] font-bold uppercase tracking-wider">{isOpen ? "Hide Summary" : "Expand Details"}</span>
                        </div>

                        {/* Expandable Order details */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden mt-3 border-t border-[#4E3E2A]/10 dark:border-slate-800 pt-3 flex flex-col gap-2.5 text-[11px] text-[#4E3E2A]/80 dark:text-slate-400"
                            >
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div>
                                  <span className="text-[9px] text-[#4E3E2A]/40 dark:text-slate-500 font-bold uppercase tracking-wider block">Payment status</span>
                                  <span className={`font-bold ${ord.paymentStatus === "Paid"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-450"
                                    }`}>{ord.paymentStatus}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[#4E3E2A]/40 dark:text-slate-500 font-bold uppercase tracking-wider block">Merchant Gateway</span>
                                  <span className="font-bold">TrincoPay Wallet</span>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                  <span className="text-[9px] text-[#4E3E2A]/40 dark:text-slate-500 font-bold uppercase tracking-wider block">Favorite Coastal Food</span>
                                  <span className="font-bold flex items-center gap-0.5"><Eye size={10} /> {selectedCustomer.favoriteFood}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CUSTOMER REVIEWS & RATINGS FEED */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-[#4E3E2A]/10 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#4E3E2A]/5 dark:border-slate-850 pb-4 mb-4">
              <span className="p-1.5 bg-[#71A066]/10 text-[#71A066] rounded-lg">
                <Star size={16} fill="currentColor" />
              </span>
              <div>
                <h3 className="text-sm font-black text-[#4E3E2A] dark:text-slate-100">Reviews & Ratings Feed</h3>
                <p className="text-[10px] font-semibold text-[#4E3E2A]/50 dark:text-slate-400">Diner feedback on food quality and delivery service.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Ratings progress charts / analytics (Left column) */}
              <div className="md:col-span-4 bg-[#FFFCF5]/40 dark:bg-slate-955/30 p-4.5 rounded-2xl border border-[#4E3E2A]/5 dark:border-slate-850 flex flex-col items-center text-center">
                <span className="text-[10px] font-black text-[#4E3E2A]/40 dark:text-slate-500 uppercase tracking-widest">Average Diner score</span>
                <span className="text-4xl font-black text-[#4E3E2A] dark:text-white mt-1.5">{selectedCustomer?.rating ? selectedCustomer.rating.toFixed(1) : "0.0"}</span>
                <div className="flex gap-0.5 mt-1.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < Math.floor(selectedCustomer?.rating || 0) ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-[#4E3E2A]/50 dark:text-slate-400 font-bold mt-2.5">Based on {selectedCustomer?.reviews.length || 0} feedback reviews</span>

                {/* mini analytics progress bars */}
                <div className="w-full space-y-1.5 mt-4 text-[9px] text-[#4E3E2A]/60 dark:text-slate-400 font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-16 text-left">Food Quality</span>
                    <div className="flex-1 h-1.5 bg-[#4E3E2A]/10 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${(selectedCustomer?.reviews[0]?.foodRating || 4.5) * 20}%` }} />
                    </div>
                    <span className="w-6 text-right">{(selectedCustomer?.reviews[0]?.foodRating || 4.5).toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-16 text-left">Driver Speed</span>
                    <div className="flex-1 h-1.5 bg-[#4E3E2A]/10 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#71A066]" style={{ width: `${(selectedCustomer?.reviews[0]?.serviceRating || 4.2) * 20}%` }} />
                    </div>
                    <span className="w-6 text-right">{(selectedCustomer?.reviews[0]?.serviceRating || 4.2).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Specific review cards feed (Right column) */}
              <div className="md:col-span-8 space-y-3 max-h-[180px] overflow-y-auto pr-1.5 scrollbar-thin">
                {!selectedCustomer || selectedCustomer.reviews.length === 0 ? (
                  <div className="py-8 text-center text-[#4E3E2A]/40 dark:text-slate-500 font-semibold text-xs">
                    No reviews written by this customer.
                  </div>
                ) : (
                  selectedCustomer.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white/40 dark:bg-slate-955/20 p-3.5 rounded-xl border border-[#4E3E2A]/5 dark:border-slate-850 flex flex-col gap-2 hover:border-[#71A066]/20 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={11}
                              fill={i < rev.rating ? "currentColor" : "none"}
                            />
                          ))}
                          <span className="ml-1 text-[#4E3E2A] dark:text-slate-300 font-extrabold">{rev.rating} Stars</span>
                        </div>
                        <span className="text-[#4E3E2A]/40 dark:text-slate-500 font-medium">{rev.date}</span>
                      </div>

                      <p className="text-[11px] text-[#4E3E2A]/80 dark:text-slate-350 italic font-medium leading-relaxed">
                        "{rev.comment}"
                      </p>

                      <div className="flex items-center gap-3 border-t border-[#4E3E2A]/5 dark:border-slate-850 pt-2 text-[9px] text-[#4E3E2A]/50 dark:text-slate-400 font-bold uppercase tracking-wider">
                        <span>Food score: <strong className="text-emerald-600">{rev.foodRating}.0</strong></span>
                        <span>Service score: <strong className="text-[#71A066]">{rev.serviceRating}.0</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ==========================================
            RIGHT SIDE COLUMN (4/12 Width)
            ========================================== */}
        <div className="lg:col-span-4 flex flex-col gap-8">

          {/* CUSTOMER GROWTH AREA CHART */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-[#4E3E2A]/10 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#4E3E2A] dark:text-slate-100">New Customers</h3>
                <p className="text-[10px] font-semibold text-[#4E3E2A]/50 dark:text-slate-400">Weekly new customer signups.</p>
              </div>
              <span className="text-[9px] font-bold text-[#71A066] bg-[#71A066]/10 px-2 py-0.5 rounded border border-[#71A066]/20">
                Active Users
              </span>
            </div>

            {/* Recharts Area Curve Chart */}
            <div className="w-full h-36 mt-2 select-none">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="glow-green" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#71A066" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#71A066" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4E3E2A" opacity={0.08} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#4E3E2A", opacity: 0.6 }} />
                    <YAxis tick={{ fontSize: 9, fill: "#4E3E2A", opacity: 0.6 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFF",
                        border: "1px solid rgba(78, 62, 42, 0.1)",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: "bold",
                        fontFamily: "sans-serif"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="customers"
                      stroke="#71A066"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#glow-green)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#4E3E2A]/40 dark:text-slate-500 font-semibold animate-pulse">
                  Initializing Analytics Engine...
                </div>
              )}
            </div>
          </div>

          {/* LOYALTY & REPEAT CUSTOMERS PROPORTION */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-[#4E3E2A]/10 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#4E3E2A] dark:text-slate-100">Returning Diners</h3>
              <p className="text-[10px] font-semibold text-[#4E3E2A]/50 dark:text-slate-400">Percentage of customers coming back.</p>
            </div>

            {/* circular progress SVG ring */}
            <div className="flex items-center gap-6 py-2">
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background Track Circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke="currentColor"
                    className="text-[#4E3E2A]/5 dark:text-slate-800"
                    strokeWidth="10"
                  />
                  {/* Active Percentage Circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke="#71A066"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={(2 * Math.PI * 50) * (1 - returningDiners / 100)}
                    strokeLinecap="round"
                    strokeWidth="10"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Center text indicator */}
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-xl font-black text-[#4E3E2A] dark:text-white">{returningDiners}%</span>
                  <span className="text-[7px] font-bold text-[#71A066] uppercase tracking-widest -mt-1">Loyal Diners</span>
                </div>
              </div>

              {/* Retention Metrics details */}
              <div className="flex flex-col gap-2 font-semibold text-[11px] text-[#4E3E2A]/70 dark:text-slate-400 w-full">
                <div className="flex items-center justify-between border-b border-[#4E3E2A]/5 dark:border-slate-850 pb-1.5">
                  <span className="flex items-center gap-1.5"><Heart size={11} className="text-[#71A066]" /> Diner Retention</span>
                  <span className="font-extrabold text-[#71A066]">{returningDiners > 50 ? "High" : "Moderate"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Loyalty Level:</span>
                  <span className="font-bold text-[#4E3E2A] dark:text-slate-200">Diamond / Platinum</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Repeat Frequency:</span>
                  <span className="font-bold text-[#4E3E2A] dark:text-slate-200">5+ Orders</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </motion.div>
  );
}

export default CustomerManagement;
