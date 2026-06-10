import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserCheck, Crown, Star, Search, Filter, Plus,
  ChevronLeft, ChevronRight, MoreVertical, Eye, Edit2, Trash2,
  Clock, CheckCircle2, XCircle, MapPin, TrendingUp, UserX,
  AlertTriangle, Mail, Phone, Calendar, DollarSign, X, ChevronDown,
  Award, ShieldAlert, Heart, RefreshCw, Sparkles, MessageSquare,
  ArrowUpRight, ShoppingBag
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";

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
  status: "Active" | "Frequent" | "Inactive" | "Blocked";
  loyaltyLevel?: "Gold" | "Platinum" | "Diamond";
  favoriteFood: string;
  rating: number;
  orders: CustomerOrder[];
  reviews: CustomerReview[];
  blockReason?: string;
}

// ==========================================
// 2. DETAILED MOCK DATA (Trinco Bites Context)
// ==========================================
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Nithya Rajendran",
    email: "nithya@example.com",
    phone: "+94 77 123 4567",
    avatar: "NR",
    totalOrders: 42,
    totalSpent: 76400,
    joinDate: "2025-08-12",
    status: "Frequent",
    loyaltyLevel: "Diamond",
    favoriteFood: "Trinco Crab Curry",
    rating: 4.9,
    orders: [
      { id: "TB-9824", date: "2026-05-24", items: "1x Crab Curry + 2x Roast Paan", amount: 2800, paymentStatus: "Paid", orderStatus: "Completed" },
      { id: "TB-9755", date: "2026-05-18", items: "2x Seafood Biryani + 1x Lime Juice", amount: 4200, paymentStatus: "Paid", orderStatus: "Completed" },
      { id: "TB-9610", date: "2026-05-02", items: "3x Crab Curry + 4x Parotta", amount: 7500, paymentStatus: "Paid", orderStatus: "Completed" },
      { id: "TB-9400", date: "2026-04-12", items: "1x Jumbo Prawn Platter", amount: 8900, paymentStatus: "Paid", orderStatus: "Completed" },
      { id: "TB-9201", date: "2026-03-20", items: "2x Spicy Seafood Devilled", amount: 4800, paymentStatus: "Paid", orderStatus: "Completed" }
    ],
    reviews: [
      { id: "rev-1-1", rating: 5, comment: "The authentic Trinco Crab Curry is absolutely out of this world! Incredible service.", date: "2026-05-24", foodRating: 5, serviceRating: 5 },
      { id: "rev-1-2", rating: 4.8, comment: "Best Biryani in town! Extremely flavorful and generous seafood portions.", date: "2026-05-18", foodRating: 5, serviceRating: 4.5 }
    ]
  },
  {
    id: "cust-2",
    name: "Daniel Jackson",
    email: "daniel@example.com",
    phone: "+94 76 987 6543",
    avatar: "DJ",
    totalOrders: 18,
    totalSpent: 28500,
    joinDate: "2025-11-04",
    status: "Active",
    loyaltyLevel: "Gold",
    favoriteFood: "Spicy Chicken Kottu",
    rating: 4.5,
    orders: [
      { id: "TB-9810", date: "2026-05-22", items: "1x Spicy Chicken Kottu + 1x Ginger Beer", amount: 1650, paymentStatus: "Paid", orderStatus: "Completed" },
      { id: "TB-9788", date: "2026-05-15", items: "1x Cheese Kottu + 1x Coca Cola", amount: 1800, paymentStatus: "Paid", orderStatus: "Completed" },
      { id: "TB-9512", date: "2026-03-30", items: "2x Chicken Kottu + 2x Milo", amount: 3300, paymentStatus: "Paid", orderStatus: "Completed" }
    ],
    reviews: [
      { id: "rev-2-1", rating: 4.5, comment: "The Chicken Kottu was very hot, fresh and flavorful. Super fast delivery to Dutch Bay.", date: "2026-05-22", foodRating: 5, serviceRating: 4 }
    ]
  },
  {
    id: "cust-3",
    name: "Archana Senthil",
    email: "archana@example.com",
    phone: "+94 75 456 7890",
    avatar: "AS",
    totalOrders: 29,
    totalSpent: 54200,
    joinDate: "2025-09-20",
    status: "Frequent",
    loyaltyLevel: "Platinum",
    favoriteFood: "Seafood Fried Rice",
    rating: 4.7,
    orders: [
      { id: "TB-9830", date: "2026-05-26", items: "1x Seafood Fried Rice + 1x Apple Mojito", amount: 2100, paymentStatus: "Paid", orderStatus: "Pending" },
      { id: "TB-9764", date: "2026-05-19", items: "2x Mix Kottu + 2x Ice Cream Waffles", amount: 3800, paymentStatus: "Paid", orderStatus: "Completed" },
      { id: "TB-9688", date: "2026-05-08", items: "4x Seafood Fried Rice", amount: 7600, paymentStatus: "Paid", orderStatus: "Completed" }
    ],
    reviews: [
      { id: "rev-3-1", rating: 5, comment: "Outstanding seafood fried rice. Brimming with prawns, cuttlefish and premium local spices!", date: "2026-05-19", foodRating: 5, serviceRating: 5 },
      { id: "rev-3-2", rating: 4.4, comment: "Mix Kottu was highly delicious, and portion size is huge. Easily feeds two.", date: "2026-05-08", foodRating: 4.5, serviceRating: 4.2 }
    ]
  },
  {
    id: "cust-4",
    name: "Ramesh Kumar",
    email: "ramesh@example.com",
    phone: "+94 77 654 3210",
    avatar: "RK",
    totalOrders: 15,
    totalSpent: 21900,
    joinDate: "2025-12-15",
    status: "Active",
    loyaltyLevel: "Gold",
    favoriteFood: "Trinco Mutton Kottu",
    rating: 4.2,
    orders: [
      { id: "TB-9801", date: "2026-05-20", items: "1x Mutton Kottu + 1x Fanta", amount: 2200, paymentStatus: "Paid", orderStatus: "Completed" },
      { id: "TB-9702", date: "2026-04-28", items: "1x Beef Burger + Fries + Coke", amount: 1900, paymentStatus: "Paid", orderStatus: "Completed" }
    ],
    reviews: [
      { id: "rev-4-1", rating: 4, comment: "Food is very delicious, but delivery took slightly longer than expected on a rainy day.", date: "2026-05-20", foodRating: 4.5, serviceRating: 3.5 }
    ]
  },
  {
    id: "cust-5",
    name: "Shamil Mohamed",
    email: "shamil@example.com",
    phone: "+94 71 555 4433",
    avatar: "SM",
    totalOrders: 8,
    totalSpent: 14300,
    joinDate: "2026-01-10",
    status: "Blocked",
    favoriteFood: "Double Beef Burger",
    rating: 2.0,
    blockReason: "Repeated payment chargebacks & fraudulent refund claims",
    orders: [
      { id: "TB-9502", date: "2026-03-12", items: "2x Double Beef Burger + Cheese Fries", amount: 3200, paymentStatus: "Failed", orderStatus: "Cancelled" },
      { id: "TB-9411", date: "2026-02-28", items: "1x Chicken Club Sandwich", amount: 1400, paymentStatus: "Paid", orderStatus: "Completed" }
    ],
    reviews: [
      { id: "rev-5-1", rating: 2.0, comment: "Claims the food was bad to secure refunds repeatedly. Unprofessional customer.", date: "2026-03-12", foodRating: 2, serviceRating: 2 }
    ]
  },
  {
    id: "cust-6",
    name: "Priya Ratnam",
    email: "priya@example.com",
    phone: "+94 72 222 8888",
    avatar: "PR",
    totalOrders: 5,
    totalSpent: 6800,
    joinDate: "2026-02-18",
    status: "Inactive",
    favoriteFood: "Cheese Coconut Roti",
    rating: 4.0,
    orders: [
      { id: "TB-9350", date: "2026-03-02", items: "3x Cheese Roti + 1x Ginger Tea", amount: 1800, paymentStatus: "Paid", orderStatus: "Completed" }
    ],
    reviews: [
      { id: "rev-6-1", rating: 4, comment: "Lovely warm cheese rotis, highly recommended for a quick snack in Trinco.", date: "2026-03-02", foodRating: 4, serviceRating: 4 }
    ]
  },
  {
    id: "cust-7",
    name: "Tharindu Perera",
    email: "tharindu@example.com",
    phone: "+94 77 999 0000",
    avatar: "TP",
    totalOrders: 33,
    totalSpent: 62800,
    joinDate: "2025-10-01",
    status: "Frequent",
    loyaltyLevel: "Platinum",
    favoriteFood: "Cuttlefish Devilled",
    rating: 4.8,
    orders: [
      { id: "TB-9829", date: "2026-05-25", items: "1x Cuttlefish Devilled + 1x Lime Mojito", amount: 2250, paymentStatus: "Paid", orderStatus: "Completed" },
      { id: "TB-9750", date: "2026-05-17", items: "2x Cuttlefish Devilled + 4x Garlic Naan", amount: 4800, paymentStatus: "Paid", orderStatus: "Completed" }
    ],
    reviews: [
      { id: "rev-7-1", rating: 5, comment: "Consistently excellent. The spicy cuttlefish devilled has that perfect coastal Trinco kick!", date: "2026-05-25", foodRating: 5, serviceRating: 5 }
    ]
  },
  {
    id: "cust-8",
    name: "Minuki De Silva",
    email: "minuki@example.com",
    phone: "+94 76 333 4444",
    avatar: "MS",
    totalOrders: 2,
    totalSpent: 2400,
    joinDate: "2026-03-25",
    status: "Blocked",
    favoriteFood: "Chocolate Brownie Shake",
    rating: 1.5,
    blockReason: "Spam feedback and abusive behavior on delivery team",
    orders: [
      { id: "TB-9620", date: "2026-04-01", items: "1x Chocolate Shake + Garlic Bread", amount: 1200, paymentStatus: "Paid", orderStatus: "Completed" }
    ],
    reviews: [
      { id: "rev-8-1", rating: 1.5, comment: "Terrible attitude, left negative ratings on multiple drivers without reason.", date: "2026-04-01", foodRating: 2, serviceRating: 1 }
    ]
  }
];

const CUSTOMER_GROWTH_MOCK = [
  { date: "May 21", customers: 1100, active: 750 },
  { date: "May 22", customers: 1180, active: 790 },
  { date: "May 23", customers: 1250, active: 810 },
  { date: "May 24", customers: 1320, active: 820 },
  { date: "May 25", customers: 1410, active: 835 },
  { date: "May 26", customers: 1460, active: 840 },
  { date: "May 27", customers: 1482, active: 845 }
];

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
  // ==========================================
  // 3. PAGE STATES
  // ==========================================
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("cust-1");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Frequent" | "Inactive" | "Blocked">("All");
  const [sortBy, setSortBy] = useState<"name" | "totalOrders" | "totalSpent" | "joinDate">("totalSpent");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // UI Drawers / Modals
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  // Custom expandable rows in order history
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);

  // Form states for creating a new customer
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustFood, setNewCustFood] = useState("Seafood Biryani");
  const [newCustLoyalty, setNewCustLoyalty] = useState<"Gold" | "Platinum" | "Diamond" | "None">("None");
  const [newCustStatus, setNewCustStatus] = useState<"Active" | "Frequent" | "Inactive">("Active");

  // SSR Mounting guard
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close actions dropdown when clicking elsewhere
  useEffect(() => {
    const handleClose = () => setActiveActionsId(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, []);

  // ==========================================
  // 4. CALCULATED ANALYTICS STATS (DYNAMIC)
  // ==========================================
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.status === "Active").length;
    const frequent = customers.filter(c => c.status === "Frequent").length;
    const blocked = customers.filter(c => c.status === "Blocked").length;

    const validRatings = customers.map(c => c.rating).filter(r => r > 0);
    const avgRating = validRatings.length
      ? (validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length).toFixed(2)
      : "0.00";

    return { total, active, frequent, blocked, avgRating };
  }, [customers]);

  // Selected customer object for timeline & review updates
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  // ==========================================
  // 5. SEARCH, FILTER & SORT LOGIC
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

  // ==========================================
  // 6. EVENT HANDLERS (VIP & CRUD)
  // ==========================================
  const handleSort = (field: "name" | "totalOrders" | "totalSpent" | "joinDate") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustEmail || !newCustPhone) {
      toast.error("Please fill in all core fields!");
      return;
    }

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName,
      email: newCustEmail,
      phone: newCustPhone,
      avatar: newCustName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
      totalOrders: 0,
      totalSpent: 0,
      joinDate: new Date().toISOString().split("T")[0],
      status: newCustLoyalty !== "None" ? "Frequent" : newCustStatus,
      loyaltyLevel: newCustLoyalty !== "None" ? newCustLoyalty : undefined,
      favoriteFood: newCustFood,
      rating: 5.0,
      orders: [],
      reviews: []
    };

    setCustomers(prev => [newCust, ...prev]);
    setIsAddDrawerOpen(false);

    // Reset form
    setNewCustName("");
    setNewCustEmail("");
    setNewCustPhone("");
    setNewCustFood("Seafood Biryani");
    setNewCustLoyalty("None");
    setNewCustStatus("Active");

    toast.success(`Successfully added customer ${newCustName}!`);
  };

  const handleEditCustomerClick = (cust: Customer) => {
    setEditingCustomer(cust);
    setIsEditDrawerOpen(true);
  };

  const handleSaveEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? editingCustomer : c));
    setIsEditDrawerOpen(false);
    setEditingCustomer(null);
    toast.success("Customer profile updated successfully!");
  };

  const handleToggleBlock = (customerId: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const isBlocked = c.status === "Blocked";
        return {
          ...c,
          status: isBlocked ? "Active" : "Blocked",
          blockReason: isBlocked ? undefined : "Flagged by administration for suspicious activity"
        };
      }
      return c;
    }));

    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const wasBlocked = customer.status === "Blocked";
      toast.success(wasBlocked
        ? `${customer.name} has been unblocked!`
        : `${customer.name} has been placed in blocked status.`
      );
    }
  };

  const handleDeleteCustomer = (cust: Customer) => {
    setDeleteTarget(cust);
  };

  const confirmDeleteCustomer = () => {
    if (!deleteTarget) return;
    setCustomers(prev => prev.filter(c => c.id !== deleteTarget.id));
    if (selectedCustomerId === deleteTarget.id) {
      setSelectedCustomerId("cust-1");
    }
    toast.error("Customer record permanently removed.");
    setDeleteTarget(null);
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-[#4E3E2A]/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#71A066]/10 text-[#71A066] rounded-xl">
              <Users size={24} />
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#4E3E2A] dark:text-slate-100 tracking-tight">
                Customer Management
              </h1>
              <p className="text-xs font-semibold text-[#4E3E2A]/60 dark:text-slate-400 mt-0.5">
                Manage returning customers, loyal diners, and feedback.
              </p>
            </div>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center flex-wrap gap-2.5">
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
              <option value="Inactive">Inactive Members</option>
              <option value="Blocked">Blocked Customers</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3.5 pointer-events-none text-[#4E3E2A]/50 dark:text-slate-400" />
          </div>



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
              +12.4%
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
              +8.2%
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
              +15.3%
            </span>
            {drawSparkline([1, 2, 2, 3, 3, 3, stats.frequent], "#8B5CF6")}
          </div>
        </div>

        {/* Card 4: Blocked Customers */}
        <div className="bg-white/95 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-[#4E3E2A]/10 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 group flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-wider">Blocked Customers</span>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-450 mt-2">{stats.blocked}</span>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-tr from-rose-600 to-red-400 text-white shrink-0 shadow-sm">
              <UserX size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#4E3E2A]/5 dark:border-slate-850">
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-rose-100/50">
              -4.5%
            </span>
            {drawSparkline([4, 3, 3, 2, 2, 2, stats.blocked], "#EF4444")}
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
              +0.15
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
                <p className="text-[10px] font-semibold text-[#4E3E2A]/50 dark:text-slate-400">Filter, sort, paginated, and trigger customer actions live.</p>
              </div>
              <div className="text-[10px] font-bold text-[#4E3E2A]/50 dark:text-slate-400 bg-[#4E3E2A]/5 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-[#4E3E2A]/10">
                Displaying <span className="font-extrabold text-[#71A066]">{filteredCustomers.length}</span> of {customers.length} Customers
              </div>
            </div>

            {/* Responsive Table Wrapper */}
            <div className="overflow-x-auto overflow-y-auto max-h-[400px] scrollbar-thin w-full rounded-b-3xl">
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
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 pr-6 text-right">Actions</th>
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
                              <span className="text-[9px] text-[#4E3E2A]/40 dark:text-slate-500 font-semibold">{cust.id.toUpperCase()}</span>
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
                        <td className="py-4 px-4">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs shrink-0 ${cust.status === "Frequent"
                            ? "bg-purple-50 text-purple-650 dark:bg-purple-950/25 dark:text-purple-400 border-purple-100 dark:border-purple-900/30"
                            : cust.status === "Active"
                              ? "bg-emerald-50 text-emerald-650 dark:bg-emerald-950/25 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                              : cust.status === "Inactive"
                                ? "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                                : "bg-rose-50 text-rose-650 dark:bg-rose-950/25 dark:text-rose-450 border-rose-100 dark:border-rose-900/30 animate-pulse"
                            }`}>
                            {cust.status}
                          </span>
                        </td>

                        {/* Actions Menu */}
                        <td className="py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => setActiveActionsId(activeActionsId === cust.id ? null : cust.id)}
                              className="p-1.5 rounded-lg hover:bg-[#4E3E2A]/5 dark:hover:bg-slate-800/80 text-[#4E3E2A]/55 dark:text-slate-400 cursor-pointer"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {/* Dropdown Options Box */}
                            <AnimatePresence>
                              {activeActionsId === cust.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-40 text-left"
                                >
                                  <button
                                    onClick={() => {
                                      setSelectedCustomerId(cust.id);
                                      toast.success(`Displaying logs for ${cust.name}`);
                                      setActiveActionsId(null);
                                    }}
                                    className="flex items-center gap-2 w-full px-3.5 py-2 text-xs font-bold text-[#4E3E2A] dark:text-slate-300 hover:bg-[#FFFCF5] dark:hover:bg-slate-800"
                                  >
                                    <Eye size={13} /> View Profiles
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleEditCustomerClick(cust);
                                      setActiveActionsId(null);
                                    }}
                                    className="flex items-center gap-2 w-full px-3.5 py-2 text-xs font-bold text-[#4E3E2A] dark:text-slate-300 hover:bg-[#FFFCF5] dark:hover:bg-slate-800"
                                  >
                                    <Edit2 size={13} /> Edit Customer
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleToggleBlock(cust.id);
                                      setActiveActionsId(null);
                                    }}
                                    className={`flex items-center gap-2 w-full px-3.5 py-2 text-xs font-bold ${cust.status === "Blocked"
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-amber-600 dark:text-amber-500"
                                      } hover:bg-[#FFFCF5] dark:hover:bg-slate-800`}
                                  >
                                    <ShieldAlert size={13} /> {cust.status === "Blocked" ? "Unblock Customer" : "Block Customer"}
                                  </button>
                                  <div className="h-px bg-[#4E3E2A]/5 dark:bg-slate-850 my-1" />
                                  <button
                                    onClick={() => {
                                      handleDeleteCustomer(cust);
                                      setActiveActionsId(null);
                                    }}
                                    className="flex items-center gap-2 w-full px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                                  >
                                    <Trash2 size={13} /> Delete Customer
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                    Past orders and current delivery status.
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
                {selectedCustomer.orders.map((ord, idx) => {
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
                        className="bg-white/40 dark:bg-slate-950/30 hover:bg-white/70 dark:hover:bg-slate-950/60 p-4 rounded-2xl border border-[#4E3E2A]/5 dark:border-slate-850 hover:border-[#71A066]/25 transition-all duration-200 cursor-pointer select-none"
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
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-450"
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

                        {/* Expandable Order details details */}
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
                                    : "text-rose-600 dark:text-rose-400"
                                    }`}>{ord.paymentStatus}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[#4E3E2A]/40 dark:text-slate-500 font-bold uppercase tracking-wider block">Merchant Gateway</span>
                                  <span className="font-bold">TrincoPay Wallet</span>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                  <span className="text-[9px] text-[#4E3E2A]/40 dark:text-slate-500 font-bold uppercase tracking-wider block">Delivery Point</span>
                                  <span className="font-bold flex items-center gap-0.5"><MapPin size={10} /> Dutch Bay Road, Trinco</span>
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
                <p className="text-[10px] font-semibold text-[#4E3E2A]/50 dark:text-slate-400">What customers think about our food and delivery.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Ratings progress charts / analytics (Left column) */}
              <div className="md:col-span-4 bg-[#FFFCF5]/40 dark:bg-slate-950/30 p-4.5 rounded-2xl border border-[#4E3E2A]/5 dark:border-slate-850 flex flex-col items-center text-center">
                <span className="text-[10px] font-black text-[#4E3E2A]/40 dark:text-slate-500 uppercase tracking-widest">Average Customer score</span>
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
                      className="bg-white/40 dark:bg-slate-950/20 p-3.5 rounded-xl border border-[#4E3E2A]/5 dark:border-slate-850 flex flex-col gap-2 hover:border-[#71A066]/20 transition-all duration-200"
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
                  <AreaChart data={CUSTOMER_GROWTH_MOCK} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
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
                  Initialing Analytics Engine...
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

            {/* Premium circular progress SVG ring */}
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
                    strokeDashoffset={(2 * Math.PI * 50) * (1 - 0.78)}
                    strokeLinecap="round"
                    strokeWidth="10"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Center text indicator */}
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-xl font-black text-[#4E3E2A] dark:text-white">78%</span>
                  <span className="text-[7px] font-bold text-[#71A066] uppercase tracking-widest -mt-1">Loyal Customers</span>
                </div>
              </div>

              {/* Retention Metrics details */}
              <div className="flex flex-col gap-2 font-semibold text-[11px] text-[#4E3E2A]/70 dark:text-slate-400 w-full">
                <div className="flex items-center justify-between border-b border-[#4E3E2A]/5 dark:border-slate-850 pb-1.5">
                  <span className="flex items-center gap-1.5"><Heart size={11} className="text-[#71A066]" /> Returning customer activity</span>
                  <span className="font-extrabold text-[#71A066]">Excellent (9.2/10)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Happy Customers:</span>
                  <span className="font-bold text-[#4E3E2A] dark:text-slate-200">96.4%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Time Between Visits:</span>
                  <span className="font-bold text-[#4E3E2A] dark:text-slate-200">4.2 Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* BLOCKED CUSTOMERS PANEL */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-[#4E3E2A]/10 dark:border-slate-800 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#4E3E2A]/5 dark:border-slate-850 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-rose-50/80 dark:bg-rose-950/20 text-rose-500 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <AlertTriangle size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#4E3E2A] dark:text-slate-100">Blocked Customers</h3>
                  <p className="text-[10px] font-semibold text-[#4E3E2A]/50 dark:text-slate-400 mt-0.5">
                    Manage restricted customer accounts and unblock trusted users.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full border border-rose-100/50 dark:border-rose-900/50">
                {stats.blocked} Restricted
              </span>
            </div>

            {/* List of blocked customers */}
            <div className="flex flex-col gap-3">
              {customers.filter(c => c.status === "Blocked").length === 0 ? (
                <div className="py-4 text-center text-[#4E3E2A]/40 dark:text-slate-500 font-medium text-[11px] bg-[#FFFCF5]/30 dark:bg-slate-950/20 rounded-2xl border border-[#4E3E2A]/5 dark:border-slate-850">
                  No restricted customers at the moment.
                </div>
              ) : (
                customers.filter(c => c.status === "Blocked").map((blk) => (
                  <div
                    key={blk.id}
                    className="p-4 bg-white dark:bg-slate-950/40 border border-rose-100/60 dark:border-rose-900/20 hover:border-rose-200 dark:hover:border-rose-800/40 hover:shadow-sm rounded-2xl flex items-center justify-between gap-3 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center font-extrabold text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-500 shrink-0 border border-rose-100/50 dark:border-rose-900/50">
                        {blk.avatar}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-bold text-xs text-[#4E3E2A] dark:text-slate-200 truncate">{blk.name}</span>
                        <p className="text-[10px] text-[#4E3E2A]/60 dark:text-slate-400 font-medium truncate">
                          {blk.blockReason || "Account restricted"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleBlock(blk.id)}
                      className="px-3 py-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-full transition-colors cursor-pointer shrink-0 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30"
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ==========================================
          SLIDE-OVER DRAWER MODAL: ADD CUSTOMER
          ========================================== */}
      <AnimatePresence>
        {isAddDrawerOpen && (
          <>
            {/* Dark blur glass backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddDrawerOpen(false)}
              className="fixed inset-0 bg-black z-45"
            />
            {/* Drawer side sheet */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[#FAF7F2] dark:bg-slate-900 border-l border-[#4E3E2A]/10 dark:border-slate-800 z-50 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#4E3E2A]/10 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-[#71A066]/10 text-[#71A066] rounded-xl">
                      <Plus size={18} />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-md text-[#4E3E2A] dark:text-slate-100">Add Customer Profile</h3>
                      <p className="text-[10px] font-semibold text-[#4E3E2A]/60 dark:text-slate-400">Initialize a new guest registration profile.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAddDrawerOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-[#4E3E2A]/5 text-[#4E3E2A]/50 dark:text-slate-400 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Form fields */}
                <form onSubmit={handleAddCustomer} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#4E3E2A]/60 dark:text-slate-400">Customer Full Name</label>
                    <input
                      type="text"
                      required
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      placeholder="e.g. Priyantha Jayawardene"
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] text-[#4E3E2A] dark:text-slate-100 placeholder-[#4E3E2A]/30 dark:placeholder-slate-500 font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#4E3E2A]/60 dark:text-slate-400">Email Address</label>
                    <input
                      type="email"
                      required
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                      placeholder="e.g. priyantha@example.com"
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] text-[#4E3E2A] dark:text-slate-100 placeholder-[#4E3E2A]/30 dark:placeholder-slate-500 font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#4E3E2A]/60 dark:text-slate-400">Phone Number (LK)</label>
                    <input
                      type="text"
                      required
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      placeholder="e.g. +94 77 987 6543"
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] text-[#4E3E2A] dark:text-slate-100 placeholder-[#4E3E2A]/30 dark:placeholder-slate-500 font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#4E3E2A]/60 dark:text-slate-400">Favorite Coastal Dish</label>
                    <input
                      type="text"
                      value={newCustFood}
                      onChange={(e) => setNewCustFood(e.target.value)}
                      placeholder="e.g. Hot Butter Cuttlefish"
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] text-[#4E3E2A] dark:text-slate-100 placeholder-[#4E3E2A]/30 dark:placeholder-slate-500 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#4E3E2A]/60 dark:text-slate-400">Loyalty level</label>
                      <select
                        value={newCustLoyalty}
                        onChange={(e) => setNewCustLoyalty(e.target.value as any)}
                        className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] text-[#4E3E2A] dark:text-slate-200 font-bold"
                      >
                        <option value="None">None (Regular)</option>
                        <option value="Gold">Gold VIP</option>
                        <option value="Platinum">Platinum VIP</option>
                        <option value="Diamond">Diamond VIP</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#4E3E2A]/60 dark:text-slate-400">Guest status</label>
                      <select
                        value={newCustStatus}
                        onChange={(e) => setNewCustStatus(e.target.value as any)}
                        disabled={newCustLoyalty !== "None"}
                        className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] text-[#4E3E2A] dark:text-slate-200 font-bold disabled:opacity-50"
                      >
                        <option value="Active">Active</option>
                        <option value="Frequent">Frequent</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddDrawerOpen(false)}
                      className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-[#4E3E2A] dark:text-slate-300 border border-[#4E3E2A]/10 bg-white dark:bg-slate-950 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-white bg-[#71A066] hover:bg-[#5E8B54] rounded-xl transition shadow-md shadow-[#71A066]/20 cursor-pointer"
                    >
                      Submit profile
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==========================================
          SLIDE-OVER DRAWER MODAL: EDIT CUSTOMER
          ========================================== */}
      <AnimatePresence>
        {isEditDrawerOpen && editingCustomer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditDrawerOpen(false)}
              className="fixed inset-0 bg-black z-45"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[#FAF7F2] dark:bg-slate-900 border-l border-[#4E3E2A]/10 dark:border-slate-800 z-50 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#4E3E2A]/10 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-[#71A066]/10 text-[#71A066] rounded-xl">
                      <Edit2 size={18} />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-md text-[#4E3E2A] dark:text-slate-100">Modify Customer Profile</h3>
                      <p className="text-[10px] font-semibold text-[#4E3E2A]/60 dark:text-slate-400">Edit existing customer details and metrics.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditDrawerOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-[#4E3E2A]/5 text-[#4E3E2A]/50 dark:text-slate-400 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveEditCustomer} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#4E3E2A]/60 dark:text-slate-400">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editingCustomer.name}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] text-[#4E3E2A] dark:text-slate-100 font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#4E3E2A]/60 dark:text-slate-400">Email address</label>
                    <input
                      type="email"
                      required
                      value={editingCustomer.email}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] text-[#4E3E2A] dark:text-slate-100 font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#4E3E2A]/60 dark:text-slate-400">Phone number</label>
                    <input
                      type="text"
                      required
                      value={editingCustomer.phone}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] text-[#4E3E2A] dark:text-slate-100 font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#4E3E2A]/60 dark:text-slate-400">Favorite Coastal dish</label>
                    <input
                      type="text"
                      value={editingCustomer.favoriteFood}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, favoriteFood: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] text-[#4E3E2A] dark:text-slate-100 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#4E3E2A]/60 dark:text-slate-400">Loyalty level</label>
                      <select
                        value={editingCustomer.loyaltyLevel || "None"}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          loyaltyLevel: e.target.value === "None" ? undefined : e.target.value as any,
                          status: e.target.value !== "None" ? "Frequent" : editingCustomer.status
                        })}
                        className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] text-[#4E3E2A] dark:text-slate-200 font-bold"
                      >
                        <option value="None">None (Regular)</option>
                        <option value="Gold">Gold VIP</option>
                        <option value="Platinum">Platinum VIP</option>
                        <option value="Diamond">Diamond VIP</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#4E3E2A]/60 dark:text-slate-400">Customer status</label>
                      <select
                        value={editingCustomer.status}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value as any })}
                        disabled={!!editingCustomer.loyaltyLevel}
                        className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] text-[#4E3E2A] dark:text-slate-200 font-bold disabled:opacity-50"
                      >
                        <option value="Active">Active</option>
                        <option value="Frequent">Frequent</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditDrawerOpen(false)}
                      className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-[#4E3E2A] dark:text-slate-300 border border-[#4E3E2A]/10 bg-white dark:bg-slate-950 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-white bg-[#71A066] hover:bg-[#5E8B54] rounded-xl transition shadow-md shadow-[#71A066]/20 cursor-pointer"
                    >
                      Save changes
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Item Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="fixed inset-0 bg-black z-45"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-customer-title"
              className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md h-fit bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-955/20 shadow-2xl z-50 rounded-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-rose-100/70 dark:border-rose-955/40 bg-rose-50/70 dark:bg-rose-950/10 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-955/40 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 size={18} />
                </div>
                <div className="min-w-0 text-left">
                  <h2 id="delete-customer-title" className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Delete Customer
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    This action permanently deletes customer record.
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4 text-left">
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-955/40 p-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-extrabold text-xs shrink-0">
                    {deleteTarget.avatar}
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{deleteTarget.name}</span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">{deleteTarget.email}</span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Are you sure you want to delete customer "{deleteTarget.name}"? This action cannot be undone.
                </p>
              </div>

              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteCustomer}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-sm shadow-rose-600/20 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} /> Delete Customer
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

    </motion.div>
  );
}

export default CustomerManagement;
