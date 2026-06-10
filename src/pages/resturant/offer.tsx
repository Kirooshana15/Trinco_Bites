import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Plus, Copy, Trash2, RefreshCw, TrendingUp, DollarSign,
  Clock, Zap, ShoppingBag, Search, Edit2, AlertCircle, Gift, Upload
} from "lucide-react";
import { toast } from "sonner";
import { useRestaurants, type Offer } from "@/context/RestaurantContext";
import { useAuth } from "@/context/AuthContext";
import offer1 from "@/assets/offer1.jpg";
import offer2 from "@/assets/offer2.png";

export function CouponsOffers() {
  const { offers, setOffers, restaurants } = useRestaurants();
  const { user } = useAuth();
  const activeRestaurant = restaurants.find((r) => r.id === user?.restaurantId) || restaurants[0];
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Offers status sub-tabs filtering state
  const [offerStatusFilter, setOfferStatusFilter] = useState<"Active" | "Scheduled" | "Expired" | "Draft">("Active");

  // Modal Creation Form States
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);

  // Form Fields - Offers
  const [formOfferTitle, setFormOfferTitle] = useState("");
  const [formOfferDesc, setFormOfferDesc] = useState("");
  const [formOfferBadge, setFormOfferBadge] = useState("");
  const [formOfferDays, setFormOfferDays] = useState<string[]>(["Fri", "Sat", "Sun"]);
  const [formOfferStartDate, setFormOfferStartDate] = useState("2026-05-28");
  const [formOfferEndDate, setFormOfferEndDate] = useState("2026-06-30");
  const [formOfferStartTime, setFormOfferStartTime] = useState("05:00 PM");
  const [formOfferEndTime, setFormOfferEndTime] = useState("10:00 PM");
  const [formOfferTimeLabel, setFormOfferTimeLabel] = useState("Weekend Combo");
  const [formOfferEmoji, setFormOfferEmoji] = useState("🍕");
  const [formOfferType, setFormOfferType] = useState<Offer["type"]>("Discount");
  const [formOfferStatus, setFormOfferStatus] = useState<Offer["status"]>("Active");
  const [formOfferBannerImage, setFormOfferBannerImage] = useState<string>("");
  const [formOfferTargetCustomer, setFormOfferTargetCustomer] = useState<Offer["targetCustomer"]>("All");
  const [formOfferChannel, setFormOfferChannel] = useState<Offer["channel"]>("All");
  const [formOfferMinOrder, setFormOfferMinOrder] = useState<number>(0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Offers database re-indexed successfully");
    }, 700);
  };

  // Helper function to resolve the dashboard status tab.
  const getAutomaticOfferStatus = (offer: Offer) => {
    if (offer.status === "Draft") return "Draft";

    const now = new Date();
    
    // Format dates: YYYY-MM-DD
    const todayStr = now.getFullYear() + "-" + 
      String(now.getMonth() + 1).padStart(2, "0") + "-" + 
      String(now.getDate()).padStart(2, "0");
      
    const start = offer.startDate;
    const end = offer.endDate;

    if (todayStr > end) return "Expired";
    if (todayStr < start) return "Scheduled";

    // Check active day of week (e.g. "Mon", "Tue", etc.)
    const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const currentDay = daysMap[now.getDay()];
    if (!offer.activeDays.includes(currentDay)) {
      return "Scheduled"; // active overall, but not today
    }

    // Check active times if specified
    if (offer.startTime && offer.endTime) {
      const parseTimeToMinutes = (t: string) => {
        const [time, period] = t.split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = parseTimeToMinutes(offer.startTime);
      const endMinutes = parseTimeToMinutes(offer.endTime);

      if (startMinutes < endMinutes) {
        if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
          return "Scheduled"; // active today, but not right now
        }
      } else {
        // Handles overnight ranges (e.g. 10 PM to 1 AM)
        if (currentMinutes < startMinutes && currentMinutes > endMinutes) {
          return "Scheduled";
        }
      }
    }

    return "Active";
  };

  // Offer CRUD Actions
  const handleUpdateOfferStatus = (id: string, status: Offer["status"]) => {
    setOffers(prev => prev.map(o => {
      if (o.id === id) {
        toast.info(`Offer "${o.title}" moved to ${status}`);
        return { ...o, status };
      }
      return o;
    }));
  };

  const handleDeleteOffer = (offer: Offer) => {
    setDeleteTarget(offer);
  };

  const confirmDeleteOffer = () => {
    if (!deleteTarget) return;
    setOffers(prev => prev.filter(o => o.id !== deleteTarget.id));
    toast.error(`Offer "${deleteTarget.title}" deleted successfully`);
    setDeleteTarget(null);
  };

  const handleDuplicateOffer = (offer: Offer) => {
    const duplicated: Offer = {
      ...offer,
      id: `O-${Date.now()}`,
      title: `${offer.title} (Copy)`,
      status: "Draft"
    };
    setOffers(prev => [...prev, duplicated]);
    toast.success(`Offer duplicated as Draft: ${duplicated.title}`);
  };

  const openEditOfferModal = (offer: Offer) => {
    setEditingOffer(offer);
    setFormOfferTitle(offer.title);
    setFormOfferDesc(offer.description);
    setFormOfferBadge(offer.discountBadge);
    setFormOfferDays(offer.activeDays);
    setFormOfferStartDate(offer.startDate || "2026-05-28");
    setFormOfferEndDate(offer.endDate);
    setFormOfferStartTime(offer.startTime || "05:00 PM");
    setFormOfferEndTime(offer.endTime || "10:00 PM");
    setFormOfferTimeLabel(offer.timeLabel || "");
    setFormOfferEmoji(offer.emoji);
    setFormOfferType(offer.type || "Discount");
    setFormOfferStatus(offer.status || "Active");
    setFormOfferBannerImage(offer.bannerImage || "");
    setFormOfferTargetCustomer(offer.targetCustomer || "All");
    setFormOfferChannel(offer.channel || "All");
    setFormOfferMinOrder(offer.minOrderAmount || 0);
    setIsOfferModalOpen(true);
  };

  const openCreateOfferModal = () => {
    setEditingOffer(null);
    setFormOfferTitle("");
    setFormOfferDesc("");
    setFormOfferBadge("15% OFF");
    setFormOfferDays(["Fri", "Sat", "Sun"]);
    setFormOfferStartDate("2026-05-28");
    setFormOfferEndDate("2026-06-30");
    setFormOfferStartTime("05:00 PM");
    setFormOfferEndTime("10:00 PM");
    setFormOfferTimeLabel("Weekend Combo");
    setFormOfferEmoji("🌶️");
    setFormOfferType("Discount");
    setFormOfferStatus(offerStatusFilter);
    setFormOfferBannerImage("");
    setFormOfferTargetCustomer("All");
    setFormOfferChannel("All");
    setFormOfferMinOrder(0);
    setIsOfferModalOpen(true);
  };

  // Open Create Offer modal if URL hash is #create or #create-offer
  useEffect(() => {
    if (window.location.hash === "#create" || window.location.hash === "#create-offer") {
      openCreateOfferModal();
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const handleSaveOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOfferTitle.trim()) {
      toast.error("Please enter an offer title");
      return;
    }

    const gradients = [
      "from-rose-500/10 to-purple-500/15 border-rose-500/25",
      "from-amber-500/10 to-orange-500/15 border-orange-500/25",
      "from-blue-500/10 to-indigo-500/15 border-blue-500/25",
      "from-emerald-500/10 to-teal-500/15 border-emerald-500/25"
    ];

    if (editingOffer) {
      setOffers(prev => prev.map(o => {
        if (o.id === editingOffer.id) {
          return {
            ...o,
            title: formOfferTitle,
            description: formOfferDesc,
            discountBadge: formOfferBadge,
            activeDays: formOfferDays,
            startDate: formOfferStartDate,
            endDate: formOfferEndDate,
            startTime: formOfferStartTime,
            endTime: formOfferEndTime,
            timeLabel: formOfferTimeLabel,
            status: formOfferStatus,
            emoji: formOfferEmoji,
            type: formOfferType,
            bannerImage: formOfferBannerImage,
            targetCustomer: formOfferTargetCustomer,
            channel: formOfferChannel,
            minOrderAmount: formOfferMinOrder
          };
        }
        return o;
      }));
      toast.success(`Offer "${formOfferTitle}" updated`);
    } else {
      const newOffer: Offer = {
        id: `O-${Date.now()}`,
        restaurantId: activeRestaurant.id,
        title: formOfferTitle,
        description: formOfferDesc,
        discountBadge: formOfferBadge,
        activeDays: formOfferDays,
        startDate: formOfferStartDate,
        endDate: formOfferEndDate,
        startTime: formOfferStartTime,
        endTime: formOfferEndTime,
        timeLabel: formOfferTimeLabel,
        status: formOfferStatus,
        emoji: formOfferEmoji,
        type: formOfferType,
        bannerImage: formOfferBannerImage,
        targetCustomer: formOfferTargetCustomer,
        channel: formOfferChannel,
        minOrderAmount: formOfferMinOrder,
        bgGradient: gradients[Math.floor(Math.random() * gradients.length)]
      };
      setOffers(prev => [newOffer, ...prev]);
      toast.success(`Offer "${formOfferTitle}" created successfully`);
    }
    setIsOfferModalOpen(false);
  };

  const handleImageUpload = (file: File) => {
    if (!file.type.match("image.*")) {
      toast.error("Please upload an image file (JPG, PNG, or WEBP)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFormOfferBannerImage(e.target.result as string);
        toast.success("Offer banner image loaded successfully!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyAISuggestion = () => {
    const suggestions = [
      {
        title: "Happy Hour Mocktails",
        desc: "Cool down with our refreshing mocktails. Buy 1 get 1 free during high heat hours!",
        badge: "BOGO FREE",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        timeLabel: "Happy Hour",
        emoji: "🥤",
        type: "Promo" as const,
        startTime: "03:00 PM",
        endTime: "05:00 PM",
        bannerImage: offer1
      },
      {
        title: "Midnight Biryani Feast",
        desc: "Craving authentic biryani late at night? Enjoy a flat discount plus complimentary dessert.",
        badge: "15% OFF",
        days: ["Fri", "Sat"],
        timeLabel: "Midnight Deal",
        emoji: "🍛",
        type: "Discount" as const,
        startTime: "10:00 PM",
        endTime: "01:00 AM",
        bannerImage: offer2
      }
    ];
    const item = suggestions[Math.floor(Math.random() * suggestions.length)];
    setFormOfferTitle(item.title);
    setFormOfferDesc(item.desc);
    setFormOfferBadge(item.badge);
    setFormOfferDays(item.days);
    setFormOfferTimeLabel(item.timeLabel);
    setFormOfferEmoji(item.emoji);
    setFormOfferType(item.type);
    setFormOfferStartTime(item.startTime);
    setFormOfferEndTime(item.endTime);
    setFormOfferBannerImage(item.bannerImage);
    toast.success("AI generated a perfect promotion for your restaurant!");
  };

  const restaurantOffers = useMemo(
    () => offers.filter((offer) => offer.restaurantId === activeRestaurant.id),
    [offers, activeRestaurant.id]
  );

  // Dynamic filtering for search
  const filteredOffers = restaurantOffers
    .filter(o => {
      const computedStatus = getAutomaticOfferStatus(o);
      return computedStatus === offerStatusFilter;
    })
    .filter(o =>
      o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Sparkline coordinates for KPIs
  const sparklines = {
    active: { path: "M 0 25 Q 10 8 20 22 T 40 10 T 60 18 T 80 2", color: "#10B981" },
    revenue: { path: "M 0 32 Q 10 18 20 28 T 40 8 T 60 22 T 80 4", color: "#10B981" },
    usage: { path: "M 0 15 Q 15 28 30 12 T 60 24 T 80 6", color: "#3B82F6" },
    performance: { path: "M 0 20 Q 15 5 30 25 T 60 10 T 80 2", color: "#10B981" }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      {/* 1. Header with Offer Actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Offers
            <Sparkles size={20} className="text-[#71A066] animate-pulse shrink-0" />
          </h1>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
            Manage discounts, combo deals, and special promotions
          </p>
        </div>

        {/* Global actions tools */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={openCreateOfferModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#71A066] hover:bg-[#71A066]/90 transition duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#71A066]/10"
          >
            <Plus size={14} strokeWidth={2.5} />
            Create Offer
          </button>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350 shadow-sm transition duration-200 cursor-pointer"
            title="Refresh offers database"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[#71A066]" : ""} />
          </button>
        </div>
      </div>

      {/* 2. Top Summary Analytics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Offers */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Offers</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1 tracking-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                {restaurantOffers.filter(o => getAutomaticOfferStatus(o) === "Active").length} Offers
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
              <Gift size={16} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm">
              <TrendingUp size={10} strokeWidth={3} /> +14.6%
            </span>
            <svg className="w-16 h-8 overflow-visible" viewBox="0 0 80 40">
              <path d={sparklines.active.path} fill="none" stroke={sparklines.active.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* KPI 2: Offer Revenue */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Offer Revenue</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1 tracking-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                LKR 184,200
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm">
              <TrendingUp size={10} strokeWidth={3} /> +22.4%
            </span>
            <svg className="w-16 h-8 overflow-visible" viewBox="0 0 80 40">
              <path d={sparklines.revenue.path} fill="none" stroke={sparklines.revenue.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* KPI 3: Total Redemptions */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Redemptions</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1 tracking-tight group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                419 Claims
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 shrink-0">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm">
              <TrendingUp size={10} strokeWidth={3} /> +9.8%
            </span>
            <svg className="w-16 h-8 overflow-visible" viewBox="0 0 80 40">
              <path d={sparklines.usage.path} fill="none" stroke={sparklines.usage.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* KPI 4: Offer Performance */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Offer Performance</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1 tracking-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                4.82% Rate
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm">
              <TrendingUp size={10} strokeWidth={3} /> +0.6%
            </span>
            <svg className="w-16 h-8 overflow-visible" viewBox="0 0 80 40">
              <path d={sparklines.performance.path} fill="none" stroke={sparklines.performance.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Filtering Toolbar & Sub-tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
        {/* Sub-status Tab Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {(["Active", "Scheduled", "Expired", "Draft"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setOfferStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${offerStatusFilter === tab
                ? "bg-[#71A066] border-[#71A066] text-white shadow-sm"
                : "border-slate-200/60 dark:border-slate-800/60 text-slate-650 dark:text-slate-400 hover:bg-slate-55 dark:hover:bg-slate-850"
                }`}
            >
              <span>{tab} Offers</span>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${offerStatusFilter === tab ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}>{restaurantOffers.filter(o => getAutomaticOfferStatus(o) === tab).length}</span>
            </button>
          ))}
        </div>

        {/* Live Search */}
        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search offers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl text-xs font-semibold text-slate-850 dark:text-slate-200 focus:outline-none focus:border-[#71A066] dark:focus:border-emerald-500/85 transition"
          />
        </div>
      </div>

      {/* 4. Offers visual grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredOffers.length > 0 ? (
          filteredOffers.map((offer) => {
            const computedStatus = getAutomaticOfferStatus(offer);
            return (
              <div
                key={offer.id}
                className={`bg-gradient-to-br ${offer.bgGradient} backdrop-blur-md rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[220px] relative group overflow-hidden`}
              >
                {/* Banner image block if exists */}
                {offer.bannerImage && (
                  <div className="w-full h-24 rounded-xl overflow-hidden mb-3 relative bg-slate-50 border border-slate-100/50">
                    <img src={offer.bannerImage} alt={offer.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 text-[8px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded">
                      {offer.timeLabel || "Promo"}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {!offer.bannerImage && <span className="text-2xl select-none" role="img" aria-label="emoji">{offer.emoji}</span>}
                      <div className="flex flex-col">
                        <span className="text-[9px] font-extrabold text-[#71A066] uppercase tracking-widest">
                          {offer.type === "Discount"
                            ? "Automatic Discount"
                            : offer.type === "Combo"
                              ? "Combo Deal"
                              : "Promotional Offer"}
                        </span>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight leading-tight mt-0.5">{offer.title}</h4>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[8px] font-black uppercase bg-white/70 dark:bg-slate-900/70 text-slate-500 dark:text-slate-300 border border-slate-200/70 dark:border-slate-800 px-2 py-0.5 rounded-md tracking-wider">
                        {computedStatus}
                      </span>
                      <span className="text-[9.5px] font-extrabold uppercase bg-[#71A066] text-white shadow-xs px-2 py-0.5 rounded-md tracking-wider">
                        {offer.discountBadge}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-650 dark:text-slate-450 leading-relaxed font-semibold line-clamp-3 pt-1">
                    {offer.description}
                  </p>
                </div>

                {/* Expiry info & operational triggers */}
                <div className="space-y-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 mt-4">
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-0.5"><Clock size={9} /> {offer.activeDays.join(" • ")}</span>
                    <span>Ends: {offer.endDate}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditOfferModal(offer)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-[#71A066] dark:text-slate-400 shadow-xs transition cursor-pointer"
                        title="Edit offer"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={() => handleDuplicateOffer(offer)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-700 shadow-xs transition cursor-pointer"
                        title="Duplicate offer"
                      >
                        <Copy size={11} />
                      </button>
                      <button
                        onClick={() => handleDeleteOffer(offer)}
                        className="p-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 dark:border-rose-955/20 bg-white dark:bg-slate-900 text-rose-500 hover:text-rose-600 shadow-xs transition cursor-pointer"
                        title="Delete offer"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <select
                      value={offer.status}
                      onChange={(e) => handleUpdateOfferStatus(offer.id, e.target.value as Offer["status"])}
                      className="max-w-[118px] px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#71A066] cursor-pointer"
                      title="Change offer status"
                    >
                      <option value="Active">Active</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Draft">Draft</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800/30 text-slate-400">
                <AlertCircle size={32} />
              </div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No {offerStatusFilter} Offers Found</p>
              <p className="text-xs text-slate-400">There are no discount offer entries listed in this section.</p>
            </div>
          </div>
        )}
      </div>

      {/* 5. CREATE / EDIT OFFER MODAL FORM (SIDE-BY-SIDE SIDEBAR PREVIEW ON DESKTOP) */}
      <AnimatePresence>
        {isOfferModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOfferModalOpen(false)}
              className="fixed inset-0 bg-black z-45"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto w-full max-w-lg lg:max-w-4xl h-fit max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-2xl z-50 rounded-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/10">
                <span className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-serif">
                  <Gift size={15} className="text-[#71A066]" />
                  {editingOffer ? `Modify Offer: ${editingOffer.title}` : "Create New storefront Offer"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyAISuggestion}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition duration-150 shadow-xs cursor-pointer flex items-center gap-1 font-serif"
                  >
                    <Sparkles size={10} /> AI Suggestion
                  </button>
                  <button
                    onClick={() => setIsOfferModalOpen(false)}
                    className="p-1 rounded-lg text-slate-405 hover:bg-slate-100 dark:hover:bg-slate-855 transition cursor-pointer"
                  >
                    <AlertCircle size={16} />
                  </button>
                </div>
              </div>

              {/* Side-by-Side Flex Area */}
              <div className="flex-1 overflow-hidden lg:grid lg:grid-cols-12">

                {/* Col 1: Form (7/12 width) */}
                <form onSubmit={handleSaveOffer} className="lg:col-span-7 overflow-y-auto custom-scrollbar p-6 space-y-5 text-xs text-left h-[70vh]">

                  {/* Banner Image support */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Offer Banner Image</label>

                    {formOfferBannerImage ? (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50">
                        <img src={formOfferBannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormOfferBannerImage("")}
                          className="absolute bottom-2 right-2 px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition"
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
                        className="w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition relative"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <Upload size={24} className="text-[#71A066]" />
                        <span className="font-bold text-slate-500">Drag & drop offer banner here</span>
                        <span className="text-[9px] text-slate-450 font-semibold uppercase tracking-wider">Recommended: 16:9 ratio • JPG, PNG, WEBP</span>
                      </div>
                    )}


                  </div>

                  {/* Basic Details */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] font-black text-[#71A066] uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">Offer Details</h4>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-550">Offer Type</label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {(["Discount", "Combo", "Promo"] as const).map((t) => {
                          const label = t === "Discount" ? "Automatic Discount" : t === "Combo" ? "Combo Deal" : "Promotional Offer";
                          const isSelected = formOfferType === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setFormOfferType(t)}
                              className={`p-2 py-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${isSelected
                                ? "bg-[#71A066]/10 border-2 border-[#71A066] text-[#71A066] scale-102 font-serif"
                                : "border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-55 dark:hover:bg-slate-850"
                                }`}
                            >
                              <span className="text-[10px] font-bold">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-550">Offer Status</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {(["Active", "Scheduled", "Draft", "Expired"] as const).map((status) => {
                          const isSelected = formOfferStatus === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setFormOfferStatus(status)}
                              className={`p-2 py-2.5 rounded-xl border text-center transition flex items-center justify-center cursor-pointer ${isSelected
                                ? "bg-[#71A066]/10 border-2 border-[#71A066] text-[#71A066] font-serif"
                                : "border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-55 dark:hover:bg-slate-850"
                                }`}
                            >
                              <span className="text-[10px] font-bold">{status}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-550">Offer Title</label>
                        <input
                          type="text"
                          placeholder="e.g. 20% OFF Burgers"
                          value={formOfferTitle}
                          onChange={(e) => setFormOfferTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#71A066]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-550">Discount Badge Text</label>
                        <input
                          type="text"
                          placeholder="e.g. 20% OFF, Free Coke"
                          value={formOfferBadge}
                          onChange={(e) => setFormOfferBadge(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#71A066]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-550">Short Promotional Description</label>
                      <textarea
                        placeholder="Explain to customers what this discount offers when shopping on your storefront app..."
                        value={formOfferDesc}
                        onChange={(e) => setFormOfferDesc(e.target.value)}
                        rows={2.5}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold resize-none focus:outline-none focus:ring-1 focus:ring-[#71A066]"
                      />
                    </div>
                  </div>

                  {/* Advanced Offer Scheduling */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] font-black text-[#71A066] uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">Advanced Scheduling</h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-550">Offer Start Date</label>
                        <input
                          type="date"
                          value={formOfferStartDate}
                          onChange={(e) => setFormOfferStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#71A066]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-550">Offer End Date</label>
                        <input
                          type="date"
                          value={formOfferEndDate}
                          onChange={(e) => setFormOfferEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#71A066]"
                        />
                      </div>
                    </div>

                    {/* Time-based offer controls */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-550">Start Time</label>
                        <input
                          type="text"
                          placeholder="e.g. 11:30 AM"
                          value={formOfferStartTime}
                          onChange={(e) => setFormOfferStartTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#71A066]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-550">End Time</label>
                        <input
                          type="text"
                          placeholder="e.g. 02:00 PM"
                          value={formOfferEndTime}
                          onChange={(e) => setFormOfferEndTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#71A066]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-550">Smart Time Label</label>
                        <input
                          type="text"
                          placeholder="e.g. Lunch Special"
                          value={formOfferTimeLabel}
                          onChange={(e) => setFormOfferTimeLabel(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#71A066]"
                        />
                      </div>
                    </div>

                    {/* Day of Week Selector */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-555">Active Operational Days</label>
                      <div className="flex gap-1.5 pt-1 flex-wrap">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => {
                          const isDaySelected = formOfferDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                if (isDaySelected) {
                                  setFormOfferDays(prev => prev.filter(d => d !== day));
                                } else {
                                  setFormOfferDays(prev => [...prev, day]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg border transition text-[10px] font-bold cursor-pointer ${isDaySelected
                                ? "bg-[#71A066] border-[#71A066] text-white"
                                : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50"
                                }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Future Scalability / Premium targeting settings */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] font-black text-[#71A066] uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">Targeting & Limits (Premium)</h4>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-555">Customer segment</label>
                        <select
                          value={formOfferTargetCustomer}
                          onChange={(e) => setFormOfferTargetCustomer(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#71A066] cursor-pointer"
                        >
                          <option value="All" className="dark:bg-slate-900">All Customers</option>
                          <option value="FirstOrder" className="dark:bg-slate-900">First Order Only</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-555">Order Channel</label>
                        <select
                          value={formOfferChannel}
                          onChange={(e) => setFormOfferChannel(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#71A066] cursor-pointer"
                        >
                          <option value="All" className="dark:bg-slate-900">All Orders</option>
                          <option value="Delivery" className="dark:bg-slate-900">Delivery Only</option>
                          <option value="Pickup" className="dark:bg-slate-900">Pickup Only</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-555">Min Order Amount</label>
                        <input
                          type="number"
                          placeholder="e.g. 1500"
                          value={formOfferMinOrder || ""}
                          onChange={(e) => setFormOfferMinOrder(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#71A066]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Modal Action footer block inside scrollable col */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex gap-3 -mx-6 -mb-6 pt-5 sticky bottom-0 z-20">
                    <button
                      type="button"
                      onClick={() => setIsOfferModalOpen(false)}
                      className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer font-serif"
                    >
                      Discard Changes
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#71A066] hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-sm shadow-[#71A066]/10 font-serif"
                    >
                      {editingOffer ? "Apply Offer Settings" : "Save Offer"}
                    </button>
                  </div>
                </form>

                {/* Col 2: Storefront Live Preview (5/12 width) */}
                <div className="hidden lg:flex lg:col-span-5 bg-slate-50 dark:bg-slate-955 p-6 flex-col justify-center items-center border-l border-slate-100 dark:border-slate-800/80 overflow-y-auto h-[70vh] relative select-none">

                  {/* Phone screen mockup */}
                  <div className="w-full max-w-[270px] h-[460px] bg-white dark:bg-slate-900 border-[6px] border-slate-800 dark:border-slate-700 rounded-[30px] shadow-2xl relative flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">

                    {/* Speaker notch */}
                    <div className="absolute top-0 inset-x-0 mx-auto w-24 h-4 bg-slate-800 dark:bg-slate-700 rounded-b-xl z-20 flex justify-center items-center">
                      <div className="w-10 h-1 bg-slate-650 rounded-full" />
                    </div>

                    {/* Status bar */}
                    <div className="h-6 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between px-6 pt-3 text-[7.5px] font-black text-slate-500">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <span>5G</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Mock Content */}
                    <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">

                      {/* Fake header info */}
                      <div className="text-left space-y-1">
                        <span className="text-[7px] font-black uppercase text-[#D45113] tracking-widest block bg-[#D45113]/10 w-fit px-1.5 py-0.5 rounded font-serif">{activeRestaurant.name}</span>
                        <h5 className="text-[10px] font-black leading-tight text-slate-800 dark:text-white font-serif">Active Offers Preview</h5>
                      </div>

                      {/* Mock Storefront Card */}
                      <div className="w-full rounded-2xl bg-white dark:bg-slate-850 border border-[#F8DDA4]/30 shadow-md p-3 flex flex-col justify-between min-h-[145px]">
                        <div className="flex gap-2">

                          {/* Banner preview */}
                          {formOfferBannerImage ? (
                            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative bg-slate-50">
                              <img src={formOfferBannerImage} alt="Banner preview" className="w-full h-full object-cover" />
                              <div className="absolute top-0.5 left-0.5 bg-green-600 text-[6px] font-black text-white px-1 py-0.5 rounded uppercase">Live</div>
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-orange-50/50 dark:bg-slate-900 border border-orange-100/50 flex items-center justify-center shrink-0 text-xl">
                              {formOfferEmoji}
                            </div>
                          )}

                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[6.5px] font-black uppercase text-[#D45113] bg-[#D45113]/5 px-1 py-0.2 rounded-full">
                                {formOfferType === "Discount" ? "Automatic Discount" : formOfferType === "Combo" ? "Combo Deal" : "Special Promo"}
                              </span>
                              {formOfferTimeLabel && (
                                <span className="text-[6.5px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded-full">
                                  {formOfferTimeLabel}
                                </span>
                              )}
                            </div>
                            <h6 className="font-extrabold text-[10px] text-[#813405] mt-1 leading-tight truncate font-serif">{formOfferTitle || "Untitled Offer"}</h6>
                            <p className="text-[7.5px] text-slate-500 leading-snug font-medium mt-0.5 line-clamp-2">{formOfferDesc || "No description provided."}</p>
                          </div>
                        </div>

                        {/* Days / times preview */}
                        <div className="text-[7px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-0.5 mt-2 border-t border-slate-50 dark:border-slate-800 pt-1.5">
                          <Clock size={7} />
                          <span className="truncate">{formOfferDays.join(", ")} {formOfferStartTime ? `• ${formOfferStartTime} - ${formOfferEndTime}` : ""}</span>
                        </div>

                        {/* Badges footer */}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[9px] font-black text-[#D45113] bg-orange-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-orange-100/50">
                            {formOfferBadge || "Offer"}
                          </span>
                          <span className="text-[7.5px] font-black uppercase text-green-700 bg-green-50 border border-green-200/50 px-1.5 py-0.5 rounded">
                            ✓ Auto Applied
                          </span>
                        </div>
                      </div>

                      {/* Fake menu item block */}
                      <div className="h-20 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900 p-2 flex items-center justify-between gap-2">
                        <div className="text-left space-y-0.5">
                          <span className="text-[6px] font-extrabold uppercase text-[#71A066]">Popular Dish</span>
                          <p className="text-[9px] font-bold leading-tight">Chicken Fried Rice</p>
                          <p className="text-[8px] font-black text-[#D45113] leading-none mt-1">Rs. 900.00</p>
                        </div>
                        <div className="h-14 w-14 rounded-lg bg-slate-200 shrink-0 overflow-hidden relative">
                          <span className="absolute top-1 left-1 bg-[#D45113] text-[5.5px] font-black text-white px-1 py-0.2 rounded uppercase tracking-tighter">BOGO</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  <span className="absolute bottom-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Storefront Live Preview</span>
                </div>

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
              aria-labelledby="delete-modal-title"
              className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md h-fit bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-955/20 shadow-2xl z-50 rounded-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-rose-100/70 dark:border-rose-955/40 bg-rose-50/70 dark:bg-rose-950/10 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-955/40 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 size={18} />
                </div>
                <div className="min-w-0 text-left">
                  <h2 id="delete-modal-title" className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Delete Offer
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    This action removes the offer from storefront page.
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3">
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-center text-3xl">
                    {deleteTarget.emoji}
                  </div>
                  <div className="min-w-0 flex flex-col justify-center text-left">
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{deleteTarget.title}</span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">{deleteTarget.discountBadge}</span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 text-left">
                  Are you sure you want to delete this offer? You will need to add it again manually if you change your mind.
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
                  onClick={confirmDeleteOffer}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-sm shadow-rose-600/20 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} /> Delete Offer
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export default CouponsOffers;
