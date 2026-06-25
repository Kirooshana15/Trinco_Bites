import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Plus, Copy, Trash2, RefreshCw, TrendingUp, DollarSign,
  Clock, Zap, ShoppingBag, Search, Edit2, AlertCircle, Gift, Upload,
  BarChart2, Calendar, Target, ShieldAlert, CheckCircle, Percent,
  Tag, Eye, ChevronRight, Play, Pause, AlertTriangle, ArrowRight, MapPin, X, HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { useRestaurants, type Offer } from "@/context/RestaurantContext";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { apiRequest } from "@/utils/api";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie
} from "recharts";


export const getOfferTypeLabel = (type: string) => {
  switch (type) {
    case "PERCENTAGE_DISCOUNT": return "Percentage Discount";
    case "FIXED_AMOUNT_DISCOUNT": return "Fixed Amount Discount";
    case "FREE_DELIVERY": return "Free Delivery";
    case "BUY_ONE_GET_ONE": return "Buy One Get One";
    case "COMBO_DEAL": return "Combo Deal";
    case "DISCOUNT": return "General Discount";
    case "ITEM_DISCOUNT": return "Item Discount";
    case "FIRST_ORDER_DISCOUNT": return "First Order Discount";
    case "FESTIVAL_OFFER": return "Festival Offer";
    case "HAPPY_HOUR": return "Happy Hour";
    case "WEEKEND_OFFER": return "Weekend Offer";
    case "MINIMUM_ORDER": return "Minimum Order Offer";
    default: return type || "General Discount";
  }
};

export const OFFER_TYPES = [
  { value: "PERCENTAGE_DISCOUNT", label: "Percentage Discount", desc: "e.g., 20% off entire order" },
  { value: "FIXED_AMOUNT_DISCOUNT", label: "Fixed Amount Discount", desc: "e.g., Rs. 500 off orders" },
  { value: "FREE_DELIVERY", label: "Free Delivery", desc: "e.g., free delivery on minimum spend" },
  { value: "BUY_ONE_GET_ONE", label: "Buy One Get One (BOGO)", desc: "e.g., Buy 1 Get 1 free" },
  { value: "COMBO_DEAL", label: "Combo Deal", desc: "e.g., Burger + Fries + Drink package" },
  { value: "ITEM_DISCOUNT", label: "Item Discount", desc: "e.g., 30% off specific items" },
  { value: "DISCOUNT", label: "General Discount", desc: "e.g., Flat percentage storewide" },
  { value: "FIRST_ORDER_DISCOUNT", label: "First Order Discount", desc: "e.g., 25% off first time orders" },
  { value: "HAPPY_HOUR", label: "Happy Hour", desc: "e.g., 3 PM - 5 PM special discounts" },
  { value: "WEEKEND_OFFER", label: "Weekend Offer", desc: "e.g., Sat & Sun special discounts" },
  { value: "FESTIVAL_OFFER", label: "Festival Offer", desc: "e.g., New Year holiday special" },
  { value: "MINIMUM_ORDER", label: "Minimum Order Offer", desc: "e.g., spend Rs. 4000 get Rs. 800 off" },
] as const;

// Color gradients for cards
const GRADIENTS = [
  "from-emerald-500/10 to-teal-500/15 border-emerald-500/20",
  "from-rose-500/10 to-purple-500/15 border-rose-500/20",
  "from-amber-500/10 to-orange-500/15 border-orange-500/20",
  "from-blue-500/10 to-indigo-500/15 border-blue-500/20",
];

export function CouponsOffers() {
  const { restaurants, refetch: refetchGlobal } = useRestaurants();
  const { user, token } = useAuth();
  const { orders } = useOrders();
  const activeRestaurant = restaurants.find((r) => r.id === user?.restaurantId) || restaurants[0];
  
  const [offersList, setOffersList] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Navigation Tabs: 'promotions' or 'analytics'
  const [activeNavTab, setActiveNavTab] = useState<"promotions" | "analytics">("promotions");
  // Filter inside Promotions: 'Active' | 'Scheduled' | 'Expired' | 'Draft'
  const [offerStatusFilter, setOfferStatusFilter] = useState<"Active" | "Scheduled" | "Expired" | "Draft">("Active");

  // Modal & Form states
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);
  const [viewingOfferDetails, setViewingOfferDetails] = useState<Offer | null>(null);

  // Common Form States
  const [formOfferTitle, setFormOfferTitle] = useState("");
  const [formOfferDesc, setFormOfferDesc] = useState("");
  const [formOfferBadge, setFormOfferBadge] = useState("");
  const [formOfferDays, setFormOfferDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  const [formOfferStartDate, setFormOfferStartDate] = useState("");
  const [formOfferEndDate, setFormOfferEndDate] = useState("");
  const [formOfferStartTime, setFormOfferStartTime] = useState("");
  const [formOfferEndTime, setFormOfferEndTime] = useState("");
  const [formOfferTimeLabel, setFormOfferTimeLabel] = useState("");
  const [formOfferType, setFormOfferType] = useState<Offer["type"]>("PERCENTAGE_DISCOUNT");
  const [formOfferStatus, setFormOfferStatus] = useState<Offer["status"]>("Active");
  const [formOfferBannerImage, setFormOfferBannerImage] = useState("");
  const [formOfferTargetCustomer, setFormOfferTargetCustomer] = useState<Offer["targetCustomer"]>("All");
  const [formOfferChannel, setFormOfferChannel] = useState<Offer["channel"]>("All");
  const [formOfferMinOrder, setFormOfferMinOrder] = useState<number>(0);
  const [formOfferMenuItemId, setFormOfferMenuItemId] = useState("");
  const [formOfferCategoryId, setFormOfferCategoryId] = useState("");
  const [applicabilityScope, setApplicabilityScope] = useState<"entire" | "category" | "item">("entire");
  
  // Advanced Settings States
  const [formOfferTargetSegment, setFormOfferTargetSegment] = useState<"All" | "New" | "Returning" | "VIP">("All");
  const [formOfferAvailabilityMode, setFormOfferAvailabilityMode] = useState<"AllDays" | "CustomDays" | "SpecificDates">("AllDays");
  const [formOfferLimitMode, setFormOfferLimitMode] = useState<"Unlimited" | "PerCustomer" | "TotalLimit">("Unlimited");
  const [formOfferLimitValue, setFormOfferLimitValue] = useState<number>(0);
  const [formOfferStackable, setFormOfferStackable] = useState<boolean>(false);

  // Type-specific Metadata States
  const [formOfferMetadata, setFormOfferMetadata] = useState<any>({});

  const [restaurantCategories, setRestaurantCategories] = useState<any[]>([]);

  // Fetch Categories List
  const fetchCategoriesList = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<any[]>("/category", {
        method: "GET",
        token,
      });
      setRestaurantCategories(data || []);
    } catch (err: any) {
      console.error("Failed to load categories:", err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchCategoriesList();
    }
  }, [token, fetchCategoriesList]);

  // Fetch Offers List
  const fetchOffersList = useCallback(async (searchQuery?: string) => {
    if (!token) return;
    setLoadingOffers(true);
    try {
      const path = searchQuery && searchQuery.trim() !== ""
        ? `/offer?search=${encodeURIComponent(searchQuery)}`
        : "/offer";

      const data = await apiRequest<Offer[]>(path, {
        method: "GET",
        token,
      });
      setOffersList(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load offers");
    } finally {
      setLoadingOffers(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const delayDebounceFn = setTimeout(() => {
      fetchOffersList(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, token, fetchOffersList]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOffersList(searchTerm);
    setIsRefreshing(false);
    toast.success("Offers refreshed successfully");
  };

  // Status mapping
  const getAutomaticOfferStatus = (offer: Offer) => {
    if (offer.status === "Draft") return "Draft";

    const now = new Date();
    const todayStr = now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0");

    const start = offer.startDate;
    const end = offer.endDate;

    if (todayStr > end) return "Expired";
    if (todayStr < start) return "Scheduled";

    const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const currentDay = daysMap[now.getDay()];
    if (offer.activeDays && offer.activeDays.length > 0 && !offer.activeDays.includes(currentDay)) {
      return "Scheduled";
    }

    if (offer.startTime && offer.endTime) {
      const parseTimeToMinutes = (t: string) => {
        try {
          const [time, period] = t.split(" ");
          let [hours, minutes] = time.split(":").map(Number);
          if (period === "PM" && hours !== 12) hours += 12;
          if (period === "AM" && hours === 12) hours = 0;
          return hours * 60 + minutes;
        } catch {
          return 0;
        }
      };

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = parseTimeToMinutes(offer.startTime);
      const endMinutes = parseTimeToMinutes(offer.endTime);

      if (startMinutes < endMinutes) {
        if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
          return "Scheduled";
        }
      } else {
        if (currentMinutes < startMinutes && currentMinutes > endMinutes) {
          return "Scheduled";
        }
      }
    }

    return "Active";
  };

  // CRUD Actions
  const handleUpdateOfferStatus = async (id: string, status: Offer["status"]) => {
    try {
      await apiRequest<any>(`/offer/${id}`, {
        method: "PUT",
        token,
        body: { status },
      });
      toast.info(`Offer moved to ${status}`);
      fetchOffersList(searchTerm);
      refetchGlobal();
    } catch (err: any) {
      toast.error(err.message || "Failed to update offer status");
    }
  };

  const handleDeleteOffer = (offer: Offer) => {
    setDeleteTarget(offer);
  };

  const confirmDeleteOffer = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest<any>(`/offer/${deleteTarget.id}`, {
        method: "DELETE",
        token,
      });
      toast.success(`Offer "${deleteTarget.title}" deleted successfully`);
      setDeleteTarget(null);
      fetchOffersList(searchTerm);
      refetchGlobal();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete offer");
    }
  };

  const handleDuplicateOffer = async (offer: Offer) => {
    try {
      await apiRequest<any>("/offer", {
        method: "POST",
        token,
        body: {
          title: `${offer.title} (Copy)`,
          description: offer.description,
          discountBadge: offer.discountBadge,
          activeDays: offer.activeDays,
          startDate: offer.startDate,
          endDate: offer.endDate,
          startTime: offer.startTime,
          endTime: offer.endTime,
          timeLabel: offer.timeLabel,
          status: "Draft",
          type: offer.type,
          bannerImage: offer.bannerImage,
          targetCustomer: offer.targetCustomer,
          channel: offer.channel,
          minOrderAmount: offer.minOrderAmount || 0,
          menuItemId: offer.menuItemId || null,
          categoryId: offer.categoryId || null,
          metadata: offer.metadata || {},
        },
      });
      toast.success(`Offer duplicated as Draft: ${offer.title} (Copy)`);
      fetchOffersList(searchTerm);
      refetchGlobal();
    } catch (err: any) {
      toast.error(err.message || "Failed to duplicate offer");
    }
  };



  const openEditOfferModal = (offer: Offer) => {
    setEditingOffer(offer);
    setFormOfferTitle(offer.title);
    setFormOfferDesc(offer.description);
    setFormOfferBadge(offer.discountBadge);
    setFormOfferDays(offer.activeDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    setFormOfferStartDate(offer.startDate || "");
    setFormOfferEndDate(offer.endDate || "");
    setFormOfferStartTime(offer.startTime || "");
    setFormOfferEndTime(offer.endTime || "");
    setFormOfferTimeLabel(offer.timeLabel || "");
    setFormOfferType(offer.type || "PERCENTAGE_DISCOUNT");
    setFormOfferStatus(offer.status || "Active");
    setFormOfferBannerImage(offer.bannerImage || "");
    setFormOfferTargetCustomer(offer.targetCustomer || "All");
    setFormOfferChannel(offer.channel || "All");
    setFormOfferMinOrder(offer.minOrderAmount || 0);
    setFormOfferMenuItemId(offer.menuItemId || "");
    setFormOfferCategoryId(offer.categoryId || "");
    if (offer.menuItemId) {
      setApplicabilityScope("item");
    } else if (offer.categoryId) {
      setApplicabilityScope("category");
    } else {
      setApplicabilityScope("entire");
    }

    // Load Advanced Settings
    setFormOfferTargetSegment(offer.metadata?.targetSegment || "All");
    setFormOfferAvailabilityMode(offer.metadata?.availabilityMode || "AllDays");
    setFormOfferLimitMode(offer.metadata?.limitMode || "Unlimited");
    setFormOfferLimitValue(offer.metadata?.limitValue || 0);
    setFormOfferStackable(offer.metadata?.stackable || false);

    // Load Metadata
    setFormOfferMetadata(offer.metadata || {});

    setIsOfferModalOpen(true);
  };

  const openCreateOfferModal = () => {
    setEditingOffer(null);
    setFormOfferTitle("");
    setFormOfferDesc("");
    setFormOfferBadge("");
    setFormOfferDays([]);
    
    setFormOfferStartDate("");
    setFormOfferEndDate("");
    setFormOfferStartTime("");
    setFormOfferEndTime("");
    setFormOfferTimeLabel("");
    setFormOfferType("PERCENTAGE_DISCOUNT");
    setFormOfferStatus("Active");
    setFormOfferBannerImage("");
    setFormOfferTargetCustomer("All");
    setFormOfferChannel("All");
    setFormOfferMinOrder(0);
    setFormOfferMenuItemId("");
    setFormOfferCategoryId("");
    setApplicabilityScope("entire");
    
    // Reset Advanced Settings
    setFormOfferTargetSegment("All");
    setFormOfferAvailabilityMode("AllDays");
    setFormOfferLimitMode("Unlimited");
    setFormOfferLimitValue(0);
    setFormOfferStackable(false);
    setFormOfferMetadata({});

    setIsOfferModalOpen(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOfferTitle.trim()) {
      toast.error("Please enter an offer title");
      return;
    }

    const payloadMetadata = {
      ...formOfferMetadata,
      targetSegment: formOfferTargetSegment,
      availabilityMode: formOfferAvailabilityMode,
      limitMode: formOfferLimitMode,
      limitValue: formOfferLimitValue,
      stackable: formOfferStackable
    };

    const bodyData = {
      title: formOfferTitle,
      description: formOfferDesc,
      discountBadge: formOfferBadge,
      activeDays: formOfferDays,
      startDate: formOfferStartDate,
      endDate: formOfferEndDate,
      startTime: formOfferStartTime || null,
      endTime: formOfferEndTime || null,
      timeLabel: formOfferTimeLabel || null,
      status: formOfferStatus,
      type: formOfferType,
      bannerImage: formOfferBannerImage || null,
      targetCustomer: formOfferTargetCustomer,
      channel: formOfferChannel,
      minOrderAmount: Number(formOfferMinOrder),
      menuItemId: formOfferMenuItemId || null,
      categoryId: formOfferCategoryId || null,
      metadata: payloadMetadata
    };

    try {
      if (editingOffer) {
        await apiRequest<any>(`/offer/${editingOffer.id}`, {
          method: "PUT",
          token,
          body: bodyData,
        });
        toast.success(`Offer "${formOfferTitle}" updated successfully`);
      } else {
        const bgColors = [
          "from-emerald-500/10 to-teal-500/15 border-emerald-500/20",
          "from-rose-500/10 to-purple-500/15 border-rose-500/20",
          "from-amber-500/10 to-orange-500/15 border-orange-500/20",
          "from-blue-500/10 to-indigo-500/15 border-blue-500/20"
        ];
        await apiRequest<any>("/offer", {
          method: "POST",
          token,
          body: {
            ...bodyData,
            bgGradient: bgColors[Math.floor(Math.random() * bgColors.length)]
          },
        });
        toast.success(`Offer "${formOfferTitle}" created successfully`);
      }
      setIsOfferModalOpen(false);
      fetchOffersList(searchTerm);
      refetchGlobal();
    } catch (err: any) {
      toast.error(err.message || "Failed to save offer");
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.match("image.*")) {
      toast.error("Please upload an image file (JPG, PNG, or WEBP)");
      return;
    }
    setIsUploadingImage(true);
    const uploadToast = toast.loading("Uploading offer banner image...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiRequest<{ message: string; url: string }>("/offer/upload", {
        method: "POST",
        token,
        body: formData,
      });

      setFormOfferBannerImage(res.url);
      toast.success("Offer banner image uploaded!", { id: uploadToast });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload image. Reverting to local fallback.", { id: uploadToast });
    } finally {
      setIsUploadingImage(false);
    }
  };



  // Filter offers lists
  const filteredOffers = offersList.filter(o => o.status === offerStatusFilter);

  // REAL & FALLBACK STATS FOR DASHBOARD & PERFORMANCE
  const analyticsStats = useMemo(() => {
    const totalActive = offersList.filter(o => o.status === "Active").length;
    const totalScheduled = offersList.filter(o => o.status === "Scheduled").length;
    
    // Find all orders where an offer was applied
    const ordersWithOffers = (orders || []).filter(order => 
      order.items && order.items.some((item: any) => item.appliedOfferId || item.appliedOffer)
    );

    // 1. Offer Revenue: Sum of totals for orders that utilized any offer
    const revenue = ordersWithOffers.reduce((sum, order) => sum + (order.total || 0), 0);

    // 2. Redemptions: count of items across all orders that had an offer applied
    const redemptions = (orders || []).reduce((sum, order) => {
      if (!order.items) return sum;
      return sum + order.items.filter((item: any) => item.appliedOfferId || item.appliedOffer).length;
    }, 0);

    // 3. Conversion Rate
    const conversionRate = redemptions > 0 && orders.length > 0
      ? ((ordersWithOffers.length / orders.length) * 100)
      : 0;

    // 4. Average Discount %
    let totalDiscountPercent = 0;
    let discountCount = 0;
    (orders || []).forEach(order => {
      if (order.items) {
        order.items.forEach((item: any) => {
          const offer = item.appliedOffer;
          if (offer && offer.metadata && offer.metadata.discountPercentage) {
            totalDiscountPercent += Number(offer.metadata.discountPercentage);
            discountCount++;
          }
        });
      }
    });
    const avgDiscount = discountCount > 0 ? (totalDiscountPercent / discountCount) : 0;

    // 5. Customer Acquisition Rate
    const totalCustomers = new Set((orders || []).map(o => o.contact?.phone || o.contact?.email)).size;
    const promoCustomers = new Set(ordersWithOffers.map(o => o.contact?.phone || o.contact?.email)).size;
    const customerAcq = totalCustomers > 0 ? ((promoCustomers / totalCustomers) * 100) : 0;

    return {
      activeCount: totalActive,
      scheduledCount: totalScheduled,
      revenue: revenue,
      redemptions: redemptions,
      conversionRate: Math.min(conversionRate, 100).toFixed(2),
      avgDiscount: avgDiscount.toFixed(1),
      customerAcq: Math.min(customerAcq, 100).toFixed(1)
    };
  }, [offersList, orders]);

  // Real-time chart calculations
  const performanceTrendData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts = days.reduce((acc, d) => ({ ...acc, [d]: 0 }), {} as Record<string, number>);

    (orders || []).forEach(order => {
      if (!order.createdAt) return;
      const orderDate = new Date(order.createdAt);
      const dayIndex = orderDate.getDay();
      const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayName = dayMap[dayIndex];

      const claims = order.items ? order.items.filter((item: any) => item.appliedOfferId || item.appliedOffer).length : 0;
      if (claims > 0) {
        counts[dayName] = (counts[dayName] || 0) + claims;
      }
    });

    return days.map(d => ({
      name: d,
      Redemptions: counts[d] || 0
    }));
  }, [orders]);

  const revenueImpactData = useMemo(() => {
    let withOfferVal = 0;
    let regularVal = 0;

    (orders || []).forEach(order => {
      const hasOffer = order.items && order.items.some((item: any) => item.appliedOfferId || item.appliedOffer);
      if (hasOffer) {
        withOfferVal += order.total || 0;
      } else {
        regularVal += order.total || 0;
      }
    });

    return [
      { name: "Promo Orders", withOffer: withOfferVal, regular: 0 },
      { name: "Regular Orders", withOffer: 0, regular: regularVal },
    ];
  }, [orders]);

  const redemptionHistoryData = useMemo(() => {
    const datesMap: Record<string, Record<string, number>> = {};
    (orders || []).forEach(order => {
      if (!order.createdAt) return;
      const dateStr = order.createdAt.split("T")[0].substring(5); // MM-DD
      if (!datesMap[dateStr]) {
        datesMap[dateStr] = { "Percentage": 0, "Fixed Off": 0, "BOGO": 0, "Combo": 0 };
      }

      if (order.items) {
        order.items.forEach((item: any) => {
          const offer = item.appliedOffer;
          if (offer) {
            if (offer.type?.includes("PERCENTAGE")) datesMap[dateStr]["Percentage"]++;
            else if (offer.type?.includes("FIXED")) datesMap[dateStr]["Fixed Off"]++;
            else if (offer.type?.includes("BUY_ONE")) datesMap[dateStr]["BOGO"]++;
            else if (offer.type?.includes("COMBO")) datesMap[dateStr]["Combo"]++;
          }
        });
      }
    });

    return Object.entries(datesMap).map(([date, vals]) => ({
      date,
      ...vals
    })).slice(-7);
  }, [orders]);

  const mostSuccessfulData = useMemo(() => {
    const offerStats: Record<string, { name: string; revenue: number; redemptions: number }> = {};
    
    (orders || []).forEach(order => {
      if (order.items) {
        order.items.forEach((item: any) => {
          const offer = item.appliedOffer;
          if (offer) {
            if (!offerStats[offer.id]) {
              offerStats[offer.id] = { name: offer.title, revenue: 0, redemptions: 0 };
            }
            offerStats[offer.id].redemptions++;
            offerStats[offer.id].revenue += order.total || 0;
          }
        });
      }
    });

    return Object.values(offerStats).map(stat => ({
      name: stat.name.length > 20 ? stat.name.slice(0, 18) + "..." : stat.name,
      revenue: stat.revenue,
      redemptions: stat.redemptions,
      score: Math.min(99, 70 + stat.redemptions)
    })).sort((a, b) => b.redemptions - a.redemptions).slice(0, 5);
  }, [orders]);

  const defaultSuccessfulData: any[] = [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-6 p-1 text-slate-800 dark:text-slate-100"
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-150 dark:border-slate-850 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            Offer Management Portal
            <Sparkles size={22} className="text-emerald-500 dark:text-emerald-400 animate-pulse" />
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Design, schedule, track, and optimize your promotional offers. Boost customer conversions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openCreateOfferModal}
            className="px-4.5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/10 active:scale-95 transition-all duration-150 flex items-center gap-1.5 cursor-pointer border-0"
          >
            <Plus size={15} strokeWidth={2.5} />
            Create Campaign
          </button>

          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 shadow-sm transition duration-150 cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin text-emerald-500" : ""} />
          </button>
        </div>
      </div>

      {/* Analytics widgets grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Widget 1: Active Campaigns */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4.5 border border-slate-150 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Offers</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-450"><Gift size={14} /></span>
          </div>
          <div className="mt-3.5">
            <span className="text-2xl font-black">{analyticsStats.activeCount}</span>
            <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-1">+{analyticsStats.scheduledCount} Scheduled next</p>
          </div>
        </div>

        {/* Widget 2: Campaign Revenue */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4.5 border border-slate-150 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Offer Revenue</span>
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-650 dark:bg-teal-500/20 dark:text-teal-450"><DollarSign size={14} /></span>
          </div>
          <div className="mt-3.5">
            <span className="text-2xl font-black">Rs. {analyticsStats.revenue.toLocaleString()}</span>
            <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-1">Total revenue from promo orders</p>
          </div>
        </div>

        {/* Widget 3: Total Claims */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4.5 border border-slate-150 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Redemptions</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-450"><ShoppingBag size={14} /></span>
          </div>
          <div className="mt-3.5">
            <span className="text-2xl font-black">{analyticsStats.redemptions} Claims</span>
            <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-1">Across all order types</p>
          </div>
        </div>

        {/* Widget 4: Conversion Rate */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4.5 border border-slate-150 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Conversion Rate</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-650 dark:bg-purple-500/20 dark:text-purple-450"><Percent size={14} /></span>
          </div>
          <div className="mt-3.5">
            <span className="text-2xl font-black">{analyticsStats.conversionRate}%</span>
            <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-1">Promo orders of total orders</p>
          </div>
        </div>

        {/* Widget 5: Avg Discount Given */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4.5 border border-slate-150 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg. Discount</span>
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-450"><Tag size={14} /></span>
          </div>
          <div className="mt-3.5">
            <span className="text-2xl font-black">{analyticsStats.avgDiscount}%</span>
            <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-1">Average saving per claim</p>
          </div>
        </div>

        {/* Widget 6: Customer Acquisition */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4.5 border border-slate-150 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acquisition Rate</span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-450"><Target size={14} /></span>
          </div>
          <div className="mt-3.5">
            <span className="text-2xl font-black">{analyticsStats.customerAcq}%</span>
            <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-1">Promo users of total customers</p>
          </div>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-1 mt-2">
        <button
          onClick={() => setActiveNavTab("promotions")}
          className={`px-5 py-3 text-xs font-bold transition duration-200 relative border-b-2 cursor-pointer flex items-center gap-2 ${
            activeNavTab === "promotions"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-450"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Gift size={14} />
          <span>Campaign Console</span>
        </button>

        <button
          onClick={() => setActiveNavTab("analytics")}
          className={`px-5 py-3 text-xs font-bold transition duration-200 relative border-b-2 cursor-pointer flex items-center gap-2 ${
            activeNavTab === "analytics"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-450"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <BarChart2 size={14} />
          <span>Performance Insights</span>
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      <AnimatePresence mode="wait">
        {activeNavTab === "promotions" ? (
          <motion.div
            key="promotions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Table & Management Toolbar */}
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-sm overflow-hidden">
              
              {/* Toolbar */}
              <div className="p-4.5 border-b border-slate-150 dark:border-slate-850 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/20">
                {/* Sub status filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                  {(["Active", "Scheduled", "Expired", "Draft"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setOfferStatusFilter(tab)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                        offerStatusFilter === tab
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 bg-white dark:bg-slate-900"
                      }`}
                    >
                      <span>{tab}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        offerStatusFilter === tab ? "bg-white/25 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}>
                        {offersList.filter(o => {
                          return getAutomaticOfferStatus(o) === tab || (tab === "Draft" && o.status === "Draft");
                        }).length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search bar */}
                <div className="relative w-full lg:max-w-xs shrink-0">
                  <Search className="absolute left-3.5 top-3 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-2.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80 font-bold uppercase tracking-wider">
                      <th className="py-4.5 px-5">Banner & Title</th>
                      <th className="py-4.5 px-4">Offer Type</th>
                      <th className="py-4.5 px-4">Status</th>
                      <th className="py-4.5 px-4">Validity</th>
                      <th className="py-4.5 px-4 text-center">Usage</th>
                      <th className="py-4.5 px-4 text-right">Revenue Impact</th>
                      <th className="py-4.5 px-4 text-center">Performance</th>
                      <th className="py-4.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingOffers ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center">
                          <RefreshCw className="animate-spin text-emerald-500 mx-auto mb-2.5" size={24} />
                          <p className="text-xs text-slate-400 font-semibold">Loading campaigns from portal...</p>
                        </td>
                      </tr>
                    ) : filteredOffers.length > 0 ? (
                      filteredOffers.map((offer, idx) => {
                        const computedStatus = getAutomaticOfferStatus(offer);
                        // Calculate real analytical values per row from actual orders
                        const offerOrders = (orders || []).filter(order =>
                          order.items && order.items.some((item: any) => item.appliedOfferId === offer.id || item.appliedOffer?.id === offer.id)
                        );
                        const usageCount = (orders || []).reduce((sum, order) => {
                          if (!order.items) return sum;
                          return sum + order.items.filter((item: any) => item.appliedOfferId === offer.id || item.appliedOffer?.id === offer.id).length;
                        }, 0);
                        const rowRevenue = offerOrders.reduce((sum, order) => sum + (order.total || 0), 0);
                        const score = usageCount > 0 ? Math.min(99, 75 + usageCount) : 0;

                        return (
                          <tr
                            key={offer.id}
                            className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-all duration-150"
                          >
                            <td className="py-4 px-5 max-w-[280px]">
                              <div className="flex items-center gap-3">
                                {offer.bannerImage ? (
                                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200/50 dark:border-slate-800 bg-slate-100">
                                    <img src={offer.bannerImage} alt={offer.title} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-450 shrink-0 flex items-center justify-center text-xl font-bold select-none">
                                    {offer.emoji || "🎁"}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-extrabold text-slate-900 dark:text-white truncate" title={offer.title}>
                                    {offer.title}
                                  </div>
                                  <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                                    {offer.description}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350">
                                {getOfferTypeLabel(offer.type)}
                              </span>
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${
                                  computedStatus === "Active" ? "bg-emerald-500 animate-pulse" :
                                  computedStatus === "Scheduled" ? "bg-blue-500" :
                                  computedStatus === "Expired" ? "bg-slate-400" : "bg-amber-500"
                                }`} />
                                <span className="font-bold text-[11px] capitalize text-slate-650 dark:text-slate-350">
                                  {computedStatus}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                              <div className="flex flex-col">
                                <span>{offer.startDate}</span>
                                <span className="text-[9px] text-slate-400 mt-0.5">to {offer.endDate}</span>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                              {usageCount}
                            </td>

                            <td className="py-4 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                              Rs. {rowRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>

                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-12 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden shrink-0">
                                  <div
                                    className={`h-full rounded-full ${
                                      score > 90 ? "bg-emerald-500" :
                                      score > 80 ? "bg-teal-500" :
                                      score > 70 ? "bg-blue-500" : "bg-amber-500"
                                    }`}
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                                <span className="font-bold text-[10px] text-slate-500 dark:text-slate-400">{score}</span>
                              </div>
                            </td>

                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setViewingOfferDetails(offer)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-500 hover:text-slate-800 dark:hover:bg-slate-850 dark:text-slate-400 dark:hover:text-slate-250 cursor-pointer transition"
                                  title="View details"
                                >
                                  <Eye size={12} />
                                </button>
                                <button
                                  onClick={() => openEditOfferModal(offer)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-500 hover:text-emerald-500 dark:hover:bg-slate-850 dark:text-slate-400 dark:hover:text-emerald-400 cursor-pointer transition"
                                  title="Edit offer"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleDuplicateOffer(offer)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-500 hover:text-blue-500 dark:hover:bg-slate-850 dark:text-slate-400 dark:hover:text-blue-400 cursor-pointer transition"
                                  title="Duplicate offer"
                                >
                                  <Copy size={12} />
                                </button>
                                <button
                                  onClick={() => {
                                    const nextStatus = offer.status === "Active" ? "Draft" : "Active";
                                    handleUpdateOfferStatus(offer.id, nextStatus as any);
                                  }}
                                  className={`p-1.5 rounded-lg border cursor-pointer transition ${
                                    offer.status === "Active"
                                      ? "border-amber-100 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                                      : "border-emerald-100 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                  }`}
                                  title={offer.status === "Active" ? "Pause Offer" : "Activate Offer"}
                                >
                                  {offer.status === "Active" ? <Pause size={12} /> : <Play size={12} />}
                                </button>
                                <button
                                  onClick={() => handleDeleteOffer(offer)}
                                  className="p-1.5 rounded-lg border border-rose-100 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 cursor-pointer transition"
                                  title="Delete offer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-20 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800/30 text-slate-400">
                              <AlertCircle size={32} />
                            </div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No {offerStatusFilter} Offers Found</p>
                            <p className="text-xs text-slate-400">There are no discount offer entries listed in this section.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Performance Trend */}
              <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-150 dark:border-slate-800/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-500" />
                    Offer Performance Trend
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Weekly Claims</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRedemptions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800"/>
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Area type="monotone" dataKey="Redemptions" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRedemptions)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Revenue Impact */}
              <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-150 dark:border-slate-800/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-2">
                    <DollarSign size={14} className="text-teal-500" />
                    Revenue Impact
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Promo vs Full Price Orders</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueImpactData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800"/>
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="withOffer" name="With Offer (LKR)" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="regular" name="Regular (LKR)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Redemption History */}
              <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-150 dark:border-slate-800/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-2">
                    <Clock size={14} className="text-blue-500" />
                    Redemption History
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Daily Claims by Type</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={redemptionHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800"/>
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="Percentage" stroke="#10B981" strokeWidth={2} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="BOGO" stroke="#EC4899" strokeWidth={2} />
                      <Line type="monotone" dataKey="Combo" stroke="#F59E0B" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Most Successful Offers */}
              <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-150 dark:border-slate-800/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-500" />
                    Most Successful Offers
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Top Campaigns Ranked</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mostSuccessfulData.length > 0 ? mostSuccessfulData : defaultSuccessfulData}
                      layout="vertical"
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" className="dark:stroke-slate-800"/>
                      <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={9} tickLine={false} width={100} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="score" name="Performance Score (100)" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT OFFER MODAL FORM (WITH LIVE PREVIEW SIDEBAR) */}
      <AnimatePresence>
        {isOfferModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOfferModalOpen(false)}
              className="fixed inset-0 bg-slate-950/70 z-40 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              className="fixed inset-0 m-auto w-full max-w-5xl h-[88vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 rounded-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 px-6 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                <span className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2 font-mono">
                  <Gift size={16} className="text-emerald-500" />
                  {editingOffer ? `Edit Campaign: ${editingOffer.title}` : "Create Marketing Campaign"}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsOfferModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border-0 bg-transparent"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body Split */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                
                {/* Left Panel: Form Section (7/12) */}
                <form
                  onSubmit={handleSaveOffer}
                  className="lg:col-span-7 overflow-y-auto custom-scrollbar p-6 space-y-6 text-xs text-left"
                >
                  
                  {/* Banner image selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Promotion Banner
                    </label>

                    {formOfferBannerImage ? (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-150">
                        <img src={formOfferBannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormOfferBannerImage("")}
                          className="absolute bottom-3 right-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition border-0 cursor-pointer shadow-md"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files?.[0]) handleImageUpload(e.dataTransfer.files[0]);
                        }}
                        className="w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition relative"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <Upload size={22} className="text-emerald-500 animate-bounce" />
                        <span className="font-bold text-slate-500 dark:text-slate-400">Drag & drop cover banner image here</span>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Recommended: 16:9 ratio • JPG, PNG, WEBP</span>
                      </div>
                    )}
                  </div>

                  {/* Core Settings */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
                      <Tag size={12} /> Offer Configuration
                    </h4>

                    {/* Offer Type selector */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500 dark:text-slate-400">Campaign Promo Type</label>
                        <select
                          value={formOfferType}
                          onChange={(e) => setFormOfferType(e.target.value as Offer["type"])}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          {OFFER_TYPES.map((type) => (
                            <option key={type.value} value={type.value} className="dark:bg-slate-900">
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500 dark:text-slate-400">Campaign Status</label>
                        <select
                          value={formOfferStatus}
                          onChange={(e) => setFormOfferStatus(e.target.value as Offer["status"])}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="Active" className="dark:bg-slate-900">Active</option>
                          <option value="Scheduled" className="dark:bg-slate-900">Scheduled</option>
                          <option value="Draft" className="dark:bg-slate-900">Draft</option>
                          <option value="Expired" className="dark:bg-slate-900">Expired</option>
                        </select>
                    </div>
                  </div>

                  {/* Applicability Target Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5 col-span-1">
                        <label className="font-bold text-slate-500 dark:text-slate-400">Offer Applicability Scope</label>
                        <select
                          value={applicabilityScope}
                          onChange={(e) => {
                            const val = e.target.value as "entire" | "category" | "item";
                            setApplicabilityScope(val);
                            if (val !== "category") setFormOfferCategoryId("");
                            if (val !== "item") setFormOfferMenuItemId("");
                          }}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="entire" className="dark:bg-slate-900">Entire Menu</option>
                          <option value="category" className="dark:bg-slate-900">Specific Category</option>
                          <option value="item" className="dark:bg-slate-900">Specific Menu Item</option>
                        </select>
                      </div>

                      {applicabilityScope === "category" && (
                        <div className="space-y-1.5 col-span-2">
                          <label className="font-bold text-slate-500 dark:text-slate-400">Target Category</label>
                          <select
                            value={formOfferCategoryId}
                            onChange={(e) => setFormOfferCategoryId(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                          >
                            <option value="" className="dark:bg-slate-900">Select Category</option>
                            {restaurantCategories.map((cat: any) => (
                              <option key={cat.id} value={cat.id} className="dark:bg-slate-900">
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {applicabilityScope === "item" && (
                        <div className="space-y-1.5 col-span-2">
                          <label className="font-bold text-slate-500 dark:text-slate-400">Target Menu Item</label>
                          <select
                            value={formOfferMenuItemId}
                            onChange={(e) => setFormOfferMenuItemId(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                          >
                            <option value="" className="dark:bg-slate-900">Select Menu Item</option>
                            {(activeRestaurant?.menu || []).map((item: any) => (
                              <option key={item.id} value={item.id} className="dark:bg-slate-900">
                                {item.name} (Rs. {item.price})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* DYNAMIC FORM FIELDS BASED ON TYPE */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-850/40 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
                      <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-450 tracking-wider">
                        {getOfferTypeLabel(formOfferType)} Settings
                      </span>

                      {/* 1. Percentage Discount Form */}
                      {formOfferType === "PERCENTAGE_DISCOUNT" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Discount %</label>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={formOfferMetadata.discountPercentage || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, discountPercentage: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              placeholder="e.g. 20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Max Discount Limit (Rs.)</label>
                            <input
                              type="number"
                              value={formOfferMetadata.maxDiscountAmount || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, maxDiscountAmount: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              placeholder="e.g. 500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Min Order Value (Rs.)</label>
                            <input
                              type="number"
                              value={formOfferMetadata.minOrderValue || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, minOrderValue: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              placeholder="e.g. 1500"
                            />
                          </div>
                        </div>
                      )}

                      {/* 2. Fixed Amount Discount Form */}
                      {formOfferType === "FIXED_AMOUNT_DISCOUNT" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Discount Value (Rs.)</label>
                            <input
                              type="number"
                              value={formOfferMetadata.discountAmount || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, discountAmount: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              placeholder="e.g. 300"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Min Order Value (Rs.)</label>
                            <input
                              type="number"
                              value={formOfferMetadata.minOrderValue || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, minOrderValue: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              placeholder="e.g. 2000"
                            />
                          </div>
                        </div>
                      )}

                      {/* 3. Free Delivery Form */}
                      {formOfferType === "FREE_DELIVERY" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Min Order Amount (Rs.)</label>
                              <input
                                type="number"
                                value={formOfferMetadata.minOrderAmount || ""}
                                onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, minOrderAmount: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                                placeholder="e.g. 1500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Delivery Radius (km)</label>
                              <input
                                type="number"
                                value={formOfferMetadata.deliveryRadius || ""}
                                onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, deliveryRadius: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                                placeholder="e.g. 5"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Valid Locations (Comma Separated)</label>
                            <input
                              type="text"
                              value={formOfferMetadata.validLocations?.join(", ") || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, validLocations: e.target.value.split(",").map(s => s.trim()) })}
                              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              placeholder="e.g. Trincomalee Town, Uppuveli, Nilaveli"
                            />
                          </div>
                        </div>
                      )}

                      {/* 4. Buy One Get One (BOGO) Form */}
                      {formOfferType === "BUY_ONE_GET_ONE" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Buy Item</label>
                              <select
                                value={formOfferMetadata.buyItemId || ""}
                                onChange={(e) => {
                                  const itemId = e.target.value;
                                  const itemObj = activeRestaurant?.menu?.find(m => m.id === itemId);
                                  const defVariant = itemObj?.variants && itemObj.variants.length > 0 ? itemObj.variants[0].name : "";
                                  setFormOfferMetadata({
                                    ...formOfferMetadata,
                                    buyItemId: itemId,
                                    buyItemVariant: defVariant
                                  });
                                }}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              >
                                <option value="">Select Item</option>
                                {activeRestaurant?.menu?.map(item => (
                                  <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Free Item</label>
                              <select
                                value={formOfferMetadata.freeItemId || ""}
                                onChange={(e) => {
                                  const itemId = e.target.value;
                                  const itemObj = activeRestaurant?.menu?.find(m => m.id === itemId);
                                  const defVariant = itemObj?.variants && itemObj.variants.length > 0 ? itemObj.variants[0].name : "";
                                  setFormOfferMetadata({
                                    ...formOfferMetadata,
                                    freeItemId: itemId,
                                    freeItemVariant: defVariant
                                  });
                                }}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              >
                                <option value="">Select Item</option>
                                {activeRestaurant?.menu?.map(item => (
                                  <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Variant Portions Selection */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(() => {
                              const buyItem = activeRestaurant?.menu?.find(m => m.id === formOfferMetadata.buyItemId);
                              if (buyItem && buyItem.variants && buyItem.variants.length > 0) {
                                return (
                                  <div className="space-y-1">
                                    <label className="font-bold text-slate-500">Buy Portion (Variant)</label>
                                    <select
                                      value={formOfferMetadata.buyItemVariant || ""}
                                      onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, buyItemVariant: e.target.value })}
                                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                                    >
                                      {buyItem.variants.map((v: any) => (
                                        <option key={v.name} value={v.name}>{v.name} (Rs. {v.price})</option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {(() => {
                              const freeItem = activeRestaurant?.menu?.find(m => m.id === formOfferMetadata.freeItemId);
                              if (freeItem && freeItem.variants && freeItem.variants.length > 0) {
                                return (
                                  <div className="space-y-1">
                                    <label className="font-bold text-slate-500">Free Portion (Variant)</label>
                                    <select
                                      value={formOfferMetadata.freeItemVariant || ""}
                                      onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, freeItemVariant: e.target.value })}
                                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                                    >
                                      {freeItem.variants.map((v: any) => (
                                        <option key={v.name} value={v.name}>{v.name} (Rs. {v.price})</option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Quantity Required (Buy)</label>
                              <input
                                type="number"
                                min={1}
                                value={formOfferMetadata.buyQty || 1}
                                onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, buyQty: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Quantity Free (Get)</label>
                              <input
                                type="number"
                                min={1}
                                value={formOfferMetadata.freeQty || 1}
                                onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, freeQty: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 5. Combo Deal Form */}
                      {formOfferType === "COMBO_DEAL" && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Select Multiple Menu Items</label>
                            <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-white dark:bg-slate-900 space-y-1.5">
                              {activeRestaurant?.menu?.map(item => {
                                const comboItemsList = formOfferMetadata.comboItems || [];
                                const existingIndex = comboItemsList.findIndex((ci: any) => (typeof ci === 'string' ? ci : ci.itemId) === item.id);
                                const isChecked = existingIndex > -1;

                                return (
                                  <label key={item.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        let updatedItems = [...comboItemsList];
                                        if (isChecked) {
                                          updatedItems = updatedItems.filter((ci: any) => (typeof ci === 'string' ? ci : ci.itemId) !== item.id);
                                        } else {
                                          updatedItems.push({ itemId: item.id, quantity: 1 });
                                        }
                                        
                                        // Recalculate original price
                                        const origPrice = updatedItems.reduce((sum, ci) => {
                                          const id = typeof ci === 'string' ? ci : ci.itemId;
                                          const qty = typeof ci === 'string' ? 1 : ci.quantity;
                                          const menuItem = activeRestaurant?.menu?.find(m => m.id === id);
                                          return sum + ((menuItem?.price || 0) * qty);
                                        }, 0);

                                        const cPrice = formOfferMetadata.comboPrice || 0;

                                        setFormOfferMetadata({
                                          ...formOfferMetadata,
                                          comboItems: updatedItems,
                                          originalPrice: origPrice,
                                          savings: origPrice - cPrice
                                        });
                                      }}
                                    />
                                    <span className="font-semibold">{item.name} (Rs. {item.price})</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Configure Quantities for Selected Items */}
                          {formOfferMetadata.comboItems?.length > 0 && (
                            <div className="space-y-2 mt-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-805">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                Configure Quantities
                              </span>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {formOfferMetadata.comboItems.map((ci: any, idx: number) => {
                                  const id = typeof ci === 'string' ? ci : ci.itemId;
                                  const qty = typeof ci === 'string' ? 1 : ci.quantity;
                                  const variantName = typeof ci === 'string' ? undefined : ci.variantName;
                                  const item = activeRestaurant?.menu?.find(m => m.id === id);
                                  if (!item) return null;

                                  return (
                                    <div key={id} className="flex flex-col gap-2 p-2.5 bg-white dark:bg-slate-850 rounded-lg shadow-xs border border-slate-200/40 dark:border-slate-800/80">
                                      <div className="flex items-center justify-between gap-4">
                                        <span className="font-semibold truncate max-w-[150px]">{item.name}</span>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedItems = formOfferMetadata.comboItems.map((c: any) => {
                                                const cId = typeof c === 'string' ? c : c.itemId;
                                                const cQty = typeof c === 'string' ? 1 : c.quantity;
                                                if (cId === id) {
                                                  return { ...c, itemId: id, quantity: Math.max(1, cQty - 1) };
                                                }
                                                return typeof c === 'string' ? { itemId: c, quantity: 1 } : c;
                                              });

                                              // Recalculate original price
                                              const origPrice = updatedItems.reduce((sum: number, c: any) => {
                                                const menuItem = activeRestaurant?.menu?.find(m => m.id === c.itemId);
                                                const vPrice = c.variantName && menuItem?.variants && menuItem.variants.length > 0
                                                  ? (menuItem.variants.find((v: any) => v.name === c.variantName)?.price || menuItem.price)
                                                  : menuItem?.price || 0;
                                                return sum + (vPrice * c.quantity);
                                              }, 0);

                                              const cPrice = formOfferMetadata.comboPrice || 0;

                                              setFormOfferMetadata({
                                                ...formOfferMetadata,
                                                comboItems: updatedItems,
                                                originalPrice: origPrice,
                                                savings: origPrice - cPrice
                                              });
                                            }}
                                            className="p-1 px-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold hover:bg-slate-200 border-0 cursor-pointer"
                                          >
                                            -
                                          </button>
                                          <span className="w-8 text-center font-bold">{qty}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedItems = formOfferMetadata.comboItems.map((c: any) => {
                                                const cId = typeof c === 'string' ? c : c.itemId;
                                                const cQty = typeof c === 'string' ? 1 : c.quantity;
                                                if (cId === id) {
                                                  return { ...c, itemId: id, quantity: cQty + 1 };
                                                }
                                                return typeof c === 'string' ? { itemId: c, quantity: 1 } : c;
                                              });

                                              // Recalculate original price
                                              const origPrice = updatedItems.reduce((sum: number, c: any) => {
                                                const menuItem = activeRestaurant?.menu?.find(m => m.id === c.itemId);
                                                const vPrice = c.variantName && menuItem?.variants && menuItem.variants.length > 0
                                                  ? (menuItem.variants.find((v: any) => v.name === c.variantName)?.price || menuItem.price)
                                                  : menuItem?.price || 0;
                                                return sum + (vPrice * c.quantity);
                                              }, 0);

                                              const cPrice = formOfferMetadata.comboPrice || 0;

                                              setFormOfferMetadata({
                                                ...formOfferMetadata,
                                                comboItems: updatedItems,
                                                originalPrice: origPrice,
                                                savings: origPrice - cPrice
                                              });
                                            }}
                                            className="p-1 px-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-extrabold hover:bg-slate-200 border-0 cursor-pointer"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>

                                      {/* Portion dropdown inside quantity config row if variants exist */}
                                      {item.variants && item.variants.length > 0 && (
                                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5 mt-0.5">
                                          <span className="text-[10px] text-slate-400 font-bold">Select Portion:</span>
                                          <select
                                            value={variantName || item.variants[0].name}
                                            onChange={(e) => {
                                              const selectedName = e.target.value;
                                              const updatedItems = formOfferMetadata.comboItems.map((c: any) => {
                                                const cId = typeof c === 'string' ? c : c.itemId;
                                                if (cId === id) {
                                                  return { itemId: id, quantity: qty, variantName: selectedName };
                                                }
                                                return typeof c === 'string' ? { itemId: c, quantity: 1 } : c;
                                              });

                                              // Recalculate original price
                                              const origPrice = updatedItems.reduce((sum: number, c: any) => {
                                                const menuItem = activeRestaurant?.menu?.find(m => m.id === c.itemId);
                                                const vPrice = c.variantName && menuItem?.variants && menuItem.variants.length > 0
                                                  ? (menuItem.variants.find((v: any) => v.name === c.variantName)?.price || menuItem.price)
                                                  : menuItem?.price || 0;
                                                return sum + (vPrice * c.quantity);
                                              }, 0);

                                              const cPrice = formOfferMetadata.comboPrice || 0;

                                              setFormOfferMetadata({
                                                ...formOfferMetadata,
                                                comboItems: updatedItems,
                                                originalPrice: origPrice,
                                                savings: origPrice - cPrice
                                              });
                                            }}
                                            className="px-2 py-1 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-905 text-[10px] font-semibold cursor-pointer max-w-[120px]"
                                          >
                                            {item.variants.map((v: any) => (
                                              <option key={v.name} value={v.name}>
                                                {v.name} (Rs. {v.price})
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Original Price (Rs.)</label>
                              <input
                                type="number"
                                readOnly
                                value={formOfferMetadata.originalPrice || 0}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-bold text-slate-500 rounded-xl"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Combo Promo Price (Rs.)</label>
                              <input
                                type="number"
                                value={formOfferMetadata.comboPrice || ""}
                                onChange={(e) => {
                                  const cPrice = Number(e.target.value);
                                  const origPrice = formOfferMetadata.originalPrice || 0;
                                  setFormOfferMetadata({
                                    ...formOfferMetadata,
                                    comboPrice: cPrice,
                                    savings: origPrice - cPrice
                                  });
                                }}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                                placeholder="e.g. 1500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Savings Display (Rs.)</label>
                              <input
                                type="number"
                                readOnly
                                value={formOfferMetadata.savings || 0}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-bold text-emerald-600 rounded-xl"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 6. Item Discount Form */}
                      {formOfferType === "ITEM_DISCOUNT" && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Select Target Menu Items</label>
                            <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-white dark:bg-slate-900 space-y-1.5">
                              {activeRestaurant?.menu?.map(item => {
                                const isChecked = formOfferMetadata.selectedItems?.includes(item.id);
                                return (
                                  <label key={item.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked || false}
                                      onChange={() => {
                                        let updatedItems = [...(formOfferMetadata.selectedItems || [])];
                                        if (isChecked) {
                                          updatedItems = updatedItems.filter(id => id !== item.id);
                                        } else {
                                          updatedItems.push(item.id);
                                        }
                                        setFormOfferMetadata({ ...formOfferMetadata, selectedItems: updatedItems });
                                      }}
                                    />
                                    <span className="font-semibold">{item.name} (Rs. {item.price})</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Discount Type</label>
                              <select
                                value={formOfferMetadata.discountType || "percentage"}
                                onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, discountType: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Value (Rs.)</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Discount Value</label>
                              <input
                                type="number"
                                value={formOfferMetadata.discountValue || ""}
                                onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, discountValue: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                                placeholder="e.g. 30"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 7. General Store Discount Form */}
                      {formOfferType === "DISCOUNT" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Discount Percentage (%)</label>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={formOfferMetadata.discountPercentage || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, discountPercentage: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              placeholder="e.g. 10"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Max Discount Limit (Rs.)</label>
                            <input
                              type="number"
                              value={formOfferMetadata.maxDiscountLimit || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, maxDiscountLimit: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              placeholder="e.g. 1000"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Minimum Spend (Rs.)</label>
                            <input
                              type="number"
                              value={formOfferMetadata.minSpend || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, minSpend: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              placeholder="e.g. 1000"
                            />
                          </div>
                        </div>
                      )}

                      {/* 8. First Order Discount Form */}
                      {formOfferType === "FIRST_ORDER_DISCOUNT" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Discount %</label>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={formOfferMetadata.discountPercentage || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, discountPercentage: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              placeholder="e.g. 25"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Max Discount (Rs.)</label>
                            <input
                              type="number"
                              value={formOfferMetadata.maximumDiscount || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, maximumDiscount: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              placeholder="e.g. 500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Min Order Value (Rs.)</label>
                            <input
                              type="number"
                              value={formOfferMetadata.minimumOrderValue || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, minimumOrderValue: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              placeholder="e.g. 1000"
                            />
                          </div>
                        </div>
                      )}

                      {/* 9. Happy Hour Offer Form */}
                      {formOfferType === "HAPPY_HOUR" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Start Time (24h)</label>
                              <input
                                type="time"
                                value={formOfferMetadata.startTimeHour || ""}
                                onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, startTimeHour: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">End Time (24h)</label>
                              <input
                                type="time"
                                value={formOfferMetadata.endTimeHour || ""}
                                onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, endTimeHour: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Happy Hour Discount (%)</label>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={formOfferMetadata.discountPercentage || ""}
                                onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, discountPercentage: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                                placeholder="e.g. 20"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Time Label Description</label>
                              <input
                                type="text"
                                value={formOfferTimeLabel}
                                onChange={(e) => setFormOfferTimeLabel(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                                placeholder="e.g. Tea Time Rush"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 10. Weekend Offer Form */}
                      {formOfferType === "WEEKEND_OFFER" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Weekend Days</label>
                            <div className="flex gap-2 pt-1">
                              {["Fri", "Sat", "Sun"].map(day => {
                                const isSel = formOfferMetadata.selectedDays?.includes(day);
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => {
                                      let list = [...(formOfferMetadata.selectedDays || [])];
                                      if (isSel) list = list.filter(d => d !== day);
                                      else list.push(day);
                                      setFormOfferMetadata({ ...formOfferMetadata, selectedDays: list });
                                    }}
                                    className={`px-3.5 py-1.5 rounded-lg border font-bold ${
                                      isSel ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200"
                                    }`}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Weekend Discount (%)</label>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={formOfferMetadata.discountPercentage || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, discountPercentage: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              placeholder="e.g. 15"
                            />
                          </div>
                        </div>
                      )}

                      {/* 11. Festival Offer Form */}
                      {formOfferType === "FESTIVAL_OFFER" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Festival Event Name</label>
                              <input
                                type="text"
                                value={formOfferMetadata.festivalName || ""}
                                onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, festivalName: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                                placeholder="e.g. New Year Special"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Festival Discount (%)</label>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={formOfferMetadata.discountSettings?.discountPercentage || ""}
                                onChange={(e) => setFormOfferMetadata({
                                  ...formOfferMetadata,
                                  discountSettings: { ...formOfferMetadata.discountSettings, discountPercentage: Number(e.target.value) }
                                })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                                placeholder="e.g. 20"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Custom Greeting Message</label>
                            <textarea
                              value={formOfferMetadata.customMessage || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, customMessage: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl resize-none"
                              placeholder="e.g. Wish you a prosperous year! Celebrate with a delicious bite."
                            />
                          </div>
                        </div>
                      )}

                      {/* 12. Minimum Order Offer Form */}
                      {formOfferType === "MINIMUM_ORDER" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Minimum Spend (Rs.)</label>
                            <input
                              type="number"
                              value={formOfferMetadata.minimumSpend || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, minimumSpend: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              placeholder="e.g. 4000"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Reward Type</label>
                            <select
                              value={formOfferMetadata.rewardType || "amount"}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, rewardType: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                            >
                              <option value="amount">Amount Reward (Rs.)</option>
                              <option value="percentage">Percentage Reward (%)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Reward Value</label>
                            <input
                              type="number"
                              value={formOfferMetadata.rewardAmount || ""}
                              onChange={(e) => setFormOfferMetadata({ ...formOfferMetadata, rewardAmount: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl"
                              placeholder="e.g. 800"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Basic Form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500 dark:text-slate-400">Offer Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Flat Rs. 300 Off Special"
                          value={formOfferTitle}
                          onChange={(e) => setFormOfferTitle(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500 dark:text-slate-400">Discount Badge Text</label>
                        <input
                          type="text"
                          placeholder="e.g. 20% OFF, FREE COKE"
                          value={formOfferBadge}
                          onChange={(e) => setFormOfferBadge(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-500 dark:text-slate-400">Campaign Promotion Description</label>
                      <textarea
                        placeholder="Explain to customers what this discount offers when shopping on your storefront app..."
                        value={formOfferDesc}
                        onChange={(e) => setFormOfferDesc(e.target.value)}
                        rows={2.5}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Advanced settings section */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
                      <Zap size={12} /> Advanced Settings
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Targeting */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">Audience Targeting</label>
                        <select
                          value={formOfferTargetSegment}
                          onChange={(e) => setFormOfferTargetSegment(e.target.value as any)}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-slate-150 rounded-xl"
                        >
                          <option value="All">All Customers</option>
                          <option value="New">New Customers Only</option>
                          <option value="Returning">Returning Customers Only</option>
                          <option value="VIP">VIP Customers Only</option>
                        </select>
                      </div>

                      {/* Stackability */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">Offer Stackability</label>
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id="stackable-checkbox"
                            checked={formOfferStackable}
                            onChange={(e) => setFormOfferStackable(e.target.checked)}
                            className="h-4 w-4 rounded text-emerald-500"
                          />
                          <label htmlFor="stackable-checkbox" className="font-semibold text-slate-650">
                            Allow with other active offers
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Availability days */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">Availability Days</label>
                        <select
                          value={formOfferAvailabilityMode}
                          onChange={(e) => setFormOfferAvailabilityMode(e.target.value as any)}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl"
                        >
                          <option value="AllDays">All Days of Week</option>
                          <option value="CustomDays">Custom Selected Days</option>
                          <option value="SpecificDates">Specific Dates Only</option>
                        </select>
                      </div>

                      {/* Channel */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">Order Channel</label>
                        <select
                          value={formOfferChannel}
                          onChange={(e) => setFormOfferChannel(e.target.value as any)}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl"
                        >
                          <option value="All">All Channels (Delivery & Pickup)</option>
                          <option value="Delivery">Delivery Orders Only</option>
                          <option value="Pickup">Pickup Orders Only</option>
                        </select>
                      </div>

                      {/* Usage limits selector */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">Redemption Limit</label>
                        <select
                          value={formOfferLimitMode}
                          onChange={(e) => setFormOfferLimitMode(e.target.value as any)}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl"
                        >
                          <option value="Unlimited">Unlimited Redemptions</option>
                          <option value="PerCustomer">Per-Customer Cap</option>
                          <option value="TotalLimit">Total Campaign Cap</option>
                        </select>
                      </div>
                    </div>

                    {/* Availability Custom Days Render */}
                    {formOfferAvailabilityMode === "CustomDays" && (
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">Select active days</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => {
                            const isAct = formOfferDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  if (isAct) setFormOfferDays(prev => prev.filter(d => d !== day));
                                  else setFormOfferDays(prev => [...prev, day]);
                                }}
                                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold ${
                                  isAct ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200 text-slate-650"
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Limits values input */}
                    {formOfferLimitMode !== "Unlimited" && (
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">Limit Value (Count)</label>
                        <input
                          type="number"
                          value={formOfferLimitValue || ""}
                          onChange={(e) => setFormOfferLimitValue(Number(e.target.value))}
                          placeholder="e.g., 1"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                        />
                      </div>
                    )}

                    {/* Start/End Date Pickers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">Start Date</label>
                        <input
                          type="date"
                          value={formOfferStartDate}
                          onChange={(e) => setFormOfferStartDate(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">End Date</label>
                        <input
                          type="date"
                          value={formOfferEndDate}
                          onChange={(e) => setFormOfferEndDate(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Time limit scheduling */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">Start Time (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 11:00 AM"
                          value={formOfferStartTime}
                          onChange={(e) => setFormOfferStartTime(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">End Time (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 10:00 PM"
                          value={formOfferEndTime}
                          onChange={(e) => setFormOfferEndTime(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer inside form scroll block */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800 flex gap-3 -mx-6 -mb-6 pt-5">
                    <button
                      type="button"
                      onClick={() => setIsOfferModalOpen(false)}
                      className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer bg-transparent"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-md shadow-emerald-500/10 border-0"
                    >
                      {editingOffer ? "Apply Settings" : "Launch Promotion"}
                    </button>
                  </div>
                </form>

                {/* Right Panel: Smartphone Mockup Preview (5/12) */}
                <div className="hidden lg:flex lg:col-span-5 bg-slate-50 dark:bg-slate-950 p-6 flex-col justify-center items-center border-l border-slate-150 dark:border-slate-850 overflow-y-auto h-[80vh] relative select-none">
                  
                  <div className="w-[280px] h-[480px] bg-white dark:bg-slate-900 border-[8px] border-slate-800 dark:border-slate-700 rounded-[36px] shadow-2xl relative flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
                    
                    {/* Speaker notch */}
                    <div className="absolute top-0 inset-x-0 mx-auto w-24 h-4 bg-slate-800 dark:bg-slate-700 rounded-b-xl z-20 flex justify-center items-center">
                      <div className="w-10 h-1 bg-slate-650 rounded-full" />
                    </div>

                    {/* Mock phone status bar */}
                    <div className="h-6 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between px-6 pt-3.5 text-[8px] font-black text-slate-500">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <span>5G</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Mock phone content space */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
                      
                      {/* Fake header info */}
                      <div className="space-y-0.5">
                        <span className="text-[7px] font-black uppercase text-emerald-600 bg-emerald-500/10 w-fit px-1.5 py-0.5 rounded">
                          {activeRestaurant?.name || "Spice House"}
                        </span>
                        <h5 className="text-[11px] font-black leading-tight text-slate-800 dark:text-white mt-1">
                          Merchant Storefront Preview
                        </h5>
                      </div>

                      {/* Mockup Storefront Offer Card */}
                      <div className="w-full rounded-2xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 shadow-md p-3 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
                        
                        {/* Banner preview */}
                        {formOfferBannerImage ? (
                          <div className="w-full h-20 rounded-xl overflow-hidden mb-2.5 relative bg-slate-100">
                            <img src={formOfferBannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                            <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-[6px] font-black text-white px-1.5 py-0.5 rounded uppercase">
                              Promo
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-16 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/15 border border-emerald-500/20 flex items-center justify-center mb-2.5 text-2xl">
                            {formOfferType === "FREE_DELIVERY" ? "🚚" :
                             formOfferType === "BUY_ONE_GET_ONE" ? "🍕" :
                             formOfferType === "COMBO_DEAL" ? "🍔" :
                             formOfferType === "FESTIVAL_OFFER" ? "🎉" : "🎁"}
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[6.5px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
                              {getOfferTypeLabel(formOfferType)}
                            </span>
                            {formOfferTimeLabel && (
                              <span className="text-[6.5px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded-full">
                                {formOfferTimeLabel}
                              </span>
                            )}
                          </div>

                          <h6 className="font-extrabold text-[11px] text-slate-800 dark:text-white leading-tight">
                            {formOfferTitle || "Campaign Promo Title"}
                          </h6>
                          <p className="text-[8px] text-slate-500 leading-snug line-clamp-2">
                            {formOfferDesc || "Add a descriptive message detailing the campaign limits."}
                          </p>
                        </div>

                        {/* Eligible details context */}
                        {formOfferType === "COMBO_DEAL" && formOfferMetadata.comboItems?.length > 0 && (
                          <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 mt-2 text-[7px] font-bold text-slate-550 space-y-0.5">
                            <span className="text-emerald-500 uppercase text-[6px] font-black block">Eligible Combo Package:</span>
                            {formOfferMetadata.comboItems.slice(0, 5).map((ci: any, idx: number) => {
                              const id = typeof ci === "string" ? ci : ci.itemId;
                              const qty = typeof ci === "string" ? 1 : ci.quantity;
                              const item = activeRestaurant?.menu?.find(m => m.id === id);
                              return <div key={id} className="truncate">• {qty}x {item?.name || `Item ${idx+1}`}</div>;
                            })}
                            <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                              <span className="line-through">Orig Price: Rs. {formOfferMetadata.originalPrice || 0}</span>
                              <span className="text-emerald-600 font-extrabold">Combo Price: Rs. {formOfferMetadata.comboPrice || 0}</span>
                            </div>
                          </div>
                        )}

                        {/* BOGO preview context */}
                        {formOfferType === "BUY_ONE_GET_ONE" && formOfferMetadata.buyItemId && (
                          <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 mt-2 text-[7px] font-bold text-slate-550">
                            <span className="text-emerald-500 uppercase text-[6px] font-black block">BOGO Promotion:</span>
                            <div>Buy: <span className="font-extrabold">{activeRestaurant?.menu?.find(m => m.id === formOfferMetadata.buyItemId)?.name}{formOfferMetadata.buyItemVariant ? ` (${formOfferMetadata.buyItemVariant})` : ""}</span></div>
                            <div>Get Free: <span className="text-emerald-600 font-extrabold">{activeRestaurant?.menu?.find(m => m.id === formOfferMetadata.freeItemId)?.name}{formOfferMetadata.freeItemVariant ? ` (${formOfferMetadata.freeItemVariant})` : ""}</span></div>
                          </div>
                        )}

                        {/* Free Delivery preview context */}
                        {formOfferType === "FREE_DELIVERY" && formOfferMetadata.deliveryRadius && (
                          <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 mt-2 text-[7px] font-bold text-slate-500">
                            <span className="text-emerald-500 uppercase text-[6px] font-black block">Delivery Coverage:</span>
                            <div>Radius: {formOfferMetadata.deliveryRadius} km coverage</div>
                            <div className="truncate">Locations: {formOfferMetadata.validLocations?.join(", ")}</div>
                          </div>
                        )}

                        {/* Footer details */}
                        <div className="mt-2.5 pt-2 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {formOfferBadge || "Offer"}
                          </span>
                          <span className="text-[7px] font-black uppercase text-teal-700 bg-teal-50 border border-teal-200/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <CheckCircle size={7} /> Auto Applied
                          </span>
                        </div>
                      </div>

                      {/* Dynamic menu item showcase item */}
                      {(() => {
                        const showcaseItem = activeRestaurant?.menu && activeRestaurant.menu.length > 0 ? activeRestaurant.menu[0] : null;
                        if (!showcaseItem) return null;
                        return (
                          <div className="h-16 border border-slate-150 dark:border-slate-800/80 rounded-xl bg-slate-50/50 dark:bg-slate-900 p-2 flex items-center justify-between gap-2.5">
                            <div className="min-w-0">
                              <span className="text-[6px] font-extrabold uppercase text-emerald-500 tracking-wider block">Bestseller Dish</span>
                              <p className="text-[9px] font-extrabold leading-tight text-slate-800 dark:text-white truncate" title={showcaseItem.name}>
                                {showcaseItem.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 leading-none">
                                <span className="text-[8px] font-black text-emerald-600">Rs. {showcaseItem.price}</span>
                              </div>
                            </div>
                            <div className="h-11 w-11 rounded-lg bg-slate-200/70 dark:bg-slate-800 shrink-0 overflow-hidden relative">
                              {showcaseItem.image && (
                                <img src={showcaseItem.image} alt={showcaseItem.name} className="w-full h-full object-cover" />
                              )}
                              <span className="absolute top-0.5 left-0.5 bg-rose-600 text-[5px] font-black text-white px-1 py-0.2 rounded uppercase scale-90 origin-top-left">
                                {formOfferBadge || "Promo"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  </div>

                  <span className="absolute bottom-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Live Mobile Storefront Preview
                  </span>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* VIEW OFFER DETAILS MODAL */}
      <AnimatePresence>
        {viewingOfferDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingOfferDetails(null)}
              className="fixed inset-0 bg-slate-950/70 z-40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-150 dark:border-slate-850 flex items-center justify-between">
                <span className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Eye size={15} className="text-emerald-500" />
                  Campaign Overview
                </span>
                <button
                  onClick={() => setViewingOfferDetails(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-0 bg-transparent cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-xs text-left">
                {/* Banner and header */}
                <div className="flex gap-4 p-3 bg-slate-50 dark:bg-slate-850/40 rounded-xl border border-slate-100 dark:border-slate-850">
                  {viewingOfferDetails.bannerImage ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-200/50 bg-white">
                      <img src={viewingOfferDetails.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0 flex items-center justify-center text-3xl">
                      {viewingOfferDetails.emoji || "🎁"}
                    </div>
                  )}
                  <div className="min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      {getOfferTypeLabel(viewingOfferDetails.type)}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">
                      {viewingOfferDetails.title}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">
                      Badge: {viewingOfferDetails.discountBadge}
                    </span>
                  </div>
                </div>

                {/* Campaign description */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Description</span>
                  <p className="text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                    {viewingOfferDetails.description}
                  </p>
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 dark:border-slate-850 py-4.5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Validity Period</span>
                    <span className="font-bold text-slate-750 dark:text-slate-250">
                      {viewingOfferDetails.startDate} to {viewingOfferDetails.endDate}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Operational Days</span>
                    <span className="font-bold text-slate-750 dark:text-slate-250 truncate block">
                      {viewingOfferDetails.activeDays?.join(", ")}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Time Range</span>
                    <span className="font-bold text-slate-750 dark:text-slate-250">
                      {viewingOfferDetails.startTime && viewingOfferDetails.endTime
                        ? `${viewingOfferDetails.startTime} - ${viewingOfferDetails.endTime}`
                        : "All Day Offer"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Target Audience</span>
                    <span className="font-bold text-slate-750 dark:text-slate-250">
                      {viewingOfferDetails.targetCustomer === "FirstOrder" ? "New Customers Only" : "All Customers"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Order Channel</span>
                    <span className="font-bold text-slate-750 dark:text-slate-250 capitalize">
                      {viewingOfferDetails.channel?.toLowerCase()} orders only
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Min Order Value</span>
                    <span className="font-bold text-slate-750 dark:text-slate-250">
                      Rs. {viewingOfferDetails.minOrderAmount || 0}
                    </span>
                  </div>
                </div>

                {/* Specific Offer Metadata Details */}
                {viewingOfferDetails.metadata && Object.keys(viewingOfferDetails.metadata).length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Promotion Parameters</span>
                    <div className="bg-slate-50 dark:bg-slate-850/40 rounded-xl p-3 border border-slate-100 dark:border-slate-850 grid grid-cols-2 gap-3.5">
                      {Object.entries(viewingOfferDetails.metadata).map(([key, val]: any) => {
                        // Hide advanced toggles
                        if (["targetSegment", "availabilityMode", "limitMode", "limitValue", "stackable"].includes(key)) return null;
                        
                        // Format keys
                        const formattedKey = key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str: string) => str.toUpperCase());
                        
                        let displayValue = String(val);
                        if (Array.isArray(val)) {
                          // If combo item IDs
                          if (key === "comboItems") {
                            displayValue = val.map((ci: any, idx: number) => {
                              const id = typeof ci === 'string' ? ci : ci.itemId;
                              const qty = typeof ci === 'string' ? 1 : ci.quantity;
                              const item = activeRestaurant?.menu?.find(m => m.id === id);
                              return `${qty}x ${item?.name || `Item ${idx+1}`}`;
                            }).join(", ");
                          } else if (key === "selectedItems") {
                            displayValue = val.map((itemId: string, idx: number) => {
                              const item = activeRestaurant?.menu?.find(m => m.id === itemId);
                              return item?.name || `Item ${idx+1}`;
                            }).join(", ");
                          } else {
                            displayValue = val.join(", ");
                          }
                        } else if (typeof val === "object" && val !== null) {
                          displayValue = JSON.stringify(val);
                        }

                        return (
                          <div key={key} className="space-y-0.5">
                            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">{formattedKey}</span>
                            <span className="font-black text-slate-700 dark:text-slate-300">{displayValue}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/10 border-t border-slate-150 dark:border-slate-800 text-center">
                <button
                  onClick={() => setViewingOfferDetails(null)}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider border-0 cursor-pointer shadow"
                >
                  Close Overview
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="fixed inset-0 bg-slate-950/70 z-40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md h-fit bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-955/20 shadow-2xl z-50 rounded-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-rose-100/50 dark:border-rose-955/40 bg-rose-50/70 dark:bg-rose-950/10 flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-955/40 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 size={18} />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Delete Offer
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-550 dark:text-slate-400 mt-0.5">
                    This action removes the offer from storefront page.
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex gap-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3">
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-center text-3xl font-bold">
                    {deleteTarget.emoji || "🎁"}
                  </div>
                  <div className="min-w-0 flex flex-col justify-center text-left">
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{deleteTarget.title}</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{deleteTarget.discountBadge}</span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-650 dark:text-slate-350 text-left font-semibold">
                  Are you sure you want to delete this offer? This cannot be undone, and the campaign statistics will be archived.
                </p>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/10 border-t border-slate-150 dark:border-slate-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteOffer}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer shadow flex items-center justify-center gap-1.5 border-0"
                >
                  <Trash2 size={13} /> Delete Campaign
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default CouponsOffers;
