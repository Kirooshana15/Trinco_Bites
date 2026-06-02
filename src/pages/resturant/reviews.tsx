import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, ShieldAlert, AlertTriangle, Search, Filter,
  RefreshCw, ChevronDown, CheckCircle, MessageSquare, Trash2, EyeOff,
  Bookmark, Flag, Send, X, Heart, Check, Smile, Sparkles, MessageCircle,
  Pin, Clock
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { toast } from "sonner";

// ==========================================
// 1. TYPE DEFINITIONS
// ==========================================
interface AdminReply {
  avatar: string;
  timestamp: string;
  text: string;
}

interface Review {
  id: string;
  customerName: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  foodRating: number;
  serviceRating: number;
  verified: boolean;
  orderId: string;
  dishName: string;
  dishImage?: string; // Optional food image preview URL
  sentiment: "Positive" | "Neutral" | "Negative";
  reported: boolean;
  reportReason?: string;
  hidden: boolean;
  bookmarked: boolean;
  pinned: boolean;
  loyaltyScore: "New" | "Bronze" | "Gold" | "Diamond VIP";
  replies: AdminReply[];
}

// ==========================================
// 2. DETAILED MOCK DATA (Trinco Bites Context)
// ==========================================
const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev-1",
    customerName: "Nithya Rajendran",
    avatar: "NR",
    rating: 5,
    comment: "The authentic Trinco Crab Curry is absolutely out of this world! Filled with succulent crab claws and extremely aromatic local spices. The roast paan was hot and crispy. Highly recommended!",
    date: "2026-05-25",
    foodRating: 5,
    serviceRating: 5,
    verified: true,
    orderId: "TB-9824",
    dishName: "Trinco Crab Curry",
    dishImage: "https://images.unsplash.com/photo-1551248429-40975aa4de74?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    sentiment: "Positive",
    reported: false,
    hidden: false,
    bookmarked: true,
    pinned: true,
    loyaltyScore: "Diamond VIP",
    replies: [
      { avatar: "TB", timestamp: "2026-05-25 14:32", text: "Dear Nithya, thank you so much for your wonderful review! We are delighted that you loved our authentic coastal crab curry. We look forward to serving you again soon!" }
    ]
  },
  {
    id: "rev-2",
    customerName: "Daniel Jackson",
    avatar: "DJ",
    rating: 4.5,
    comment: "The Chicken Kottu had that perfect coastal street-style kick. It was slightly too spicy for my preference but the flavor was extremely rich and cuttlefish gravy on top was amazing. Quick delivery to Dutch Bay!",
    date: "2026-05-24",
    foodRating: 5,
    serviceRating: 4,
    verified: true,
    orderId: "TB-9810",
    dishName: "Spicy Chicken Kottu",
    sentiment: "Positive",
    reported: false,
    hidden: false,
    bookmarked: false,
    pinned: false,
    loyaltyScore: "Gold",
    replies: []
  },
  {
    id: "rev-3",
    customerName: "Archana Senthil",
    avatar: "AS",
    rating: 5,
    comment: "Outstanding seafood fried rice. Brimming with fresh prawns, cuttlefish, and premium local spices! Portion size is huge, easily feeds two people. Will definitely order this again.",
    date: "2026-05-23",
    foodRating: 5,
    serviceRating: 5,
    verified: true,
    orderId: "TB-9830",
    dishName: "Seafood Fried Rice",
    dishImage: "https://images.unsplash.com/photo-1603133872878-6855047b74c4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    sentiment: "Positive",
    reported: false,
    hidden: false,
    bookmarked: true,
    pinned: false,
    loyaltyScore: "Diamond VIP",
    replies: []
  },
  {
    id: "rev-4",
    customerName: "Ramesh Kumar",
    avatar: "RK",
    rating: 2,
    comment: "Flavor of the mutton kottu was exceptionally delicious, but the order arrived nearly cold because the driver took more than an hour due to the rain in Trincomalee. Very disappointed with driver transit times.",
    date: "2026-05-22",
    foodRating: 4.5,
    serviceRating: 2,
    verified: true,
    orderId: "TB-9801",
    dishName: "Trinco Mutton Kottu",
    sentiment: "Negative",
    reported: false,
    hidden: false,
    bookmarked: false,
    pinned: false,
    loyaltyScore: "Gold",
    replies: []
  },
  {
    id: "rev-5",
    customerName: "Shamil Mohamed",
    avatar: "SM",
    rating: 1,
    comment: "The Double Beef Burger was completely burnt and hard as rock! The fries were stale and smelled like old oil. I demanded a refund but customer support refused. Never ordering again! Acompetitor does this way better!",
    date: "2026-05-20",
    foodRating: 1,
    serviceRating: 1,
    verified: false,
    orderId: "TB-9502",
    dishName: "Double Beef Burger",
    sentiment: "Negative",
    reported: true,
    reportReason: "Fake Feedback",
    hidden: false,
    bookmarked: false,
    pinned: false,
    loyaltyScore: "New",
    replies: []
  },
  {
    id: "rev-6",
    customerName: "Priya Ratnam",
    avatar: "PR",
    rating: 4,
    comment: "Lovely cheese coconut rotis. Perfectly warm, soft, and paired with a delicious spicy onion sambol. The ginger milk tea was the perfect highlight for a cozy evening.",
    date: "2026-05-18",
    foodRating: 4,
    serviceRating: 4,
    verified: true,
    orderId: "TB-9350",
    dishName: "Cheese Coconut Roti",
    sentiment: "Positive",
    reported: false,
    hidden: false,
    bookmarked: false,
    pinned: false,
    loyaltyScore: "Bronze",
    replies: [
      { avatar: "TB", timestamp: "2026-05-18 19:40", text: "Dear Priya, thank you so much! We are glad our warm rotis and hot ginger tea made your evening cozy. Hope to serve you again soon!" }
    ]
  },
  {
    id: "rev-7",
    customerName: "Tharindu Perera",
    avatar: "TP",
    rating: 5,
    comment: "The cuttlefish devilled was extremely spicy, perfectly seasoned, and super fresh. Truly has that authentic Trinco coastal kick! The portion was generous and packaged perfectly to retain heat.",
    date: "2026-05-15",
    foodRating: 5,
    serviceRating: 5,
    verified: true,
    orderId: "TB-9750",
    dishName: "Cuttlefish Devilled",
    sentiment: "Positive",
    reported: false,
    hidden: false,
    bookmarked: false,
    pinned: false,
    loyaltyScore: "Gold",
    replies: []
  },
  {
    id: "rev-8",
    customerName: "Minuki De Silva",
    avatar: "MS",
    rating: 1,
    comment: "Total scam! Abusive staff and stale garlic bread. I waited two hours and everything was icy cold. Customer service laughed at me. Go somewhere else!",
    date: "2026-05-12",
    foodRating: 1,
    serviceRating: 1,
    verified: false,
    orderId: "TB-9620",
    dishName: "Chocolate Brownie Shake",
    sentiment: "Negative",
    reported: true,
    reportReason: "Spam",
    hidden: false,
    bookmarked: false,
    pinned: false,
    loyaltyScore: "New",
    replies: []
  }
];

// Recharts Trend Data
const WEEKLY_TREND_MOCK = [
  { day: "Mon", rating: 4.6, satisfaction: 88 },
  { day: "Tue", rating: 4.8, satisfaction: 94 },
  { day: "Wed", rating: 4.7, satisfaction: 91 },
  { day: "Thu", rating: 4.9, satisfaction: 97 },
  { day: "Fri", rating: 4.5, satisfaction: 86 },
  { day: "Sat", rating: 4.8, satisfaction: 95 },
  { day: "Sun", rating: 4.8, satisfaction: 96 }
];

export function ReviewsRatings() {
  // ==========================================
  // 3. CORE MANAGEMENT STATES
  // ==========================================
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [searchTerm, setSearchTerm] = useState("");
  const [starFilter, setStarFilter] = useState<number | "All">("All");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "positive" | "negative" | "replied" | "unreplied">("newest");
  
  // Quick Filters
  const [dishSearch, setDishSearch] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState<"All" | "Positive" | "Neutral" | "Negative">("All");

  // Interaction States
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  
  // Modals & Gallery
  const [reportingReview, setReportingReview] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState<string>("Spam");
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Loading / Refresh Simulation
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Quick Reply templates
  const QUICK_TEMPLATES = [
    { label: "Positive Appreciation", text: "Dear Guest, thank you so much for your wonderful review! We are delighted that you loved the authentic flavors. Hope to serve you again soon!" },
    { label: "Apologize for Delay", text: "Dear Guest, we apologize sincerely for the delivery delay. The weather conditions on coastal roads were challenging, but we will strive to improve driver transit times. Thank you for your feedback!" },
    { label: "Resolve Quality Concern", text: "Dear Guest, we apologize if the dish did not meet your expectations. Quality is our highest priority, and we would love to make this right for you. Please reach out to our Trinco Bites support team so we can compensate you." }
  ];

  // ==========================================
  // 4. DYNAMIC CALCULATIONS & METRICS
  // ==========================================
  const metrics = useMemo(() => {
    const total = reviews.filter(r => !r.hidden).length;
    const avg = parseFloat(
      (reviews.filter(r => !r.hidden).reduce((sum, r) => sum + r.rating, 0) / (total || 1)).toFixed(2)
    );
    const positiveCount = reviews.filter(r => !r.hidden && r.rating >= 4).length;
    const negativeCount = reviews.filter(r => !r.hidden && r.rating <= 2).length;
    const positivePercent = total ? Math.round((positiveCount / total) * 100) : 100;
    
    const replied = reviews.filter(r => !r.hidden && r.replies.length > 0).length;
    const reports = reviews.filter(r => !r.hidden && r.reported).length;

    // Breakdown
    const starsCounts = [0, 0, 0, 0, 0]; // 1★ to 5★
    reviews.filter(r => !r.hidden).forEach(r => {
      const idx = Math.floor(r.rating) - 1;
      if (idx >= 0 && idx < 5) starsCounts[idx]++;
    });

    const breakdownPercents = starsCounts.map(count => 
      total ? Math.round((count / total) * 100) : 0
    );

    return { total, avg, positivePercent, negativeCount, replied, reports, starsCounts, breakdownPercents };
  }, [reviews]);

  // ==========================================
  // 5. SEARCH & FILTER PIPELINE
  // ==========================================
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (r.hidden) return false;
      
      const matchesSearch = 
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.orderId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDish = 
        !dishSearch || r.dishName.toLowerCase().includes(dishSearch.toLowerCase());
      
      const matchesStars = 
        starFilter === "All" || Math.floor(r.rating) === starFilter;

      const matchesSentiment = 
        selectedSentiment === "All" || r.sentiment === selectedSentiment;

      return matchesSearch && matchesDish && matchesStars && matchesSentiment;
    }).sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === "positive") {
        return b.rating - a.rating;
      }
      if (sortBy === "negative") {
        return a.rating - b.rating;
      }
      if (sortBy === "replied") {
        const aReplied = a.replies.length > 0 ? 1 : 0;
        const bReplied = b.replies.length > 0 ? 1 : 0;
        return bReplied - aReplied;
      }
      if (sortBy === "unreplied") {
        const aReplied = a.replies.length > 0 ? 1 : 0;
        const bReplied = b.replies.length > 0 ? 1 : 0;
        return aReplied - bReplied;
      }
      return 0;
    });
  }, [reviews, searchTerm, dishSearch, starFilter, selectedSentiment, sortBy]);

  // Most Reviewed Items dataset for charts
  const mostReviewedDishes = useMemo(() => {
    const dishCounts: Record<string, { name: string, count: number, ratingSum: number }> = {};
    reviews.filter(r => !r.hidden).forEach(r => {
      if (!dishCounts[r.dishName]) {
        dishCounts[r.dishName] = { name: r.dishName, count: 0, ratingSum: 0 };
      }
      dishCounts[r.dishName].count++;
      dishCounts[r.dishName].ratingSum += r.rating;
    });

    return Object.values(dishCounts)
      .map(d => ({
        name: d.name.split(" ").slice(-2).join(" "), // clean for chart rendering
        reviews: d.count,
        avgRating: parseFloat((d.ratingSum / d.count).toFixed(1))
      }))
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 4);
  }, [reviews]);

  // Sentiment ratio pie chart dataset
  const sentimentRatioData = useMemo(() => {
    const pos = reviews.filter(r => r.sentiment === "Positive").length;
    const neu = reviews.filter(r => r.sentiment === "Neutral").length;
    const neg = reviews.filter(r => r.sentiment === "Negative").length;
    return [
      { name: "Positive", value: pos, color: "#10B981" },
      { name: "Neutral", value: neu, color: "#FBBF24" },
      { name: "Negative", value: neg, color: "#EF4444" }
    ];
  }, [reviews]);

  // ==========================================
  // 6. INTERACTION & ACTION HANDLERS
  // ==========================================
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Review feeds synchronized with Swiggy & UberEats APIs!");
    }, 800);
  };

  const handleSendReply = (reviewId: string) => {
    const text = replyTextMap[reviewId];
    if (!text || !text.trim()) {
      toast.error("Reply text cannot be blank.");
      return;
    }

    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          replies: [
            ...r.replies,
            { avatar: "TB", timestamp: new Date().toISOString().replace("T", " ").substring(0, 16), text }
          ]
        };
      }
      return r;
    }));

    setReplyTextMap(prev => ({ ...prev, [reviewId]: "" }));
    setActiveReplyId(null);
    toast.success("Restaurant reply published inline successfully!");
  };

  const handleInjectTemplate = (reviewId: string, templateText: string) => {
    setReplyTextMap(prev => ({ ...prev, [reviewId]: templateText }));
    toast.success("Quick template injected into reply box!");
  };

  const handleTriggerReport = (review: Review) => {
    setReportingReview(review);
    setReportReason("Spam");
  };

  const handleSubmitReport = () => {
    if (!reportingReview) return;
    
    setReviews(prev => prev.map(r => {
      if (r.id === reportingReview.id) {
        return { ...r, reported: true, reportReason };
      }
      return r;
    }));

    setReportingReview(null);
    toast.success(`Review successfully reported for: ${reportReason}`);
  };

  const handleToggleBookmark = (reviewId: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        const nextState = !r.bookmarked;
        toast.success(nextState ? "Review bookmarked for admin attention." : "Bookmark removed.");
        return { ...r, bookmarked: nextState };
      }
      return r;
    }));
  };

  const handleTogglePin = (reviewId: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        const nextState = !r.pinned;
        toast.success(nextState ? "Review pinned to the top." : "Pin released.");
        return { ...r, pinned: nextState };
      }
      return r;
    }));
  };

  const handleHideReview = (reviewId: string) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, hidden: true } : r));
    toast.success("Review hidden from public customer screens.");
  };

  const handleDeleteReview = (reviewId: string) => {
    if (confirm("Are you absolute certain you want to delete this customer review permanently?")) {
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success("Review deleted from dashboard memory.");
    }
  };



  // Helper star rating render
  const renderStars = (rating: number, size = 14) => {
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.25;
    return (
      <div className="flex gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < full) {
            return <Star key={i} size={size} fill="currentColor" className="stroke-amber-400" />;
          }
          if (i === full && hasHalf) {
            return (
              <div key={i} className="relative">
                <Star size={size} className="text-[#4E3E2A]/20 dark:text-slate-700" />
                <div className="absolute top-0 left-0 w-1/2 overflow-hidden text-amber-400">
                  <Star size={size} fill="currentColor" className="stroke-amber-400" />
                </div>
              </div>
            );
          }
          return <Star key={i} size={size} className="text-[#4E3E2A]/20 dark:text-slate-700" />;
        })}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6 font-sans text-[#4E3E2A] pb-12"
    >
      {/* ==========================================
          PAGE HEADER SECTION
          ========================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-[#4E3E2A]/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#71A066]/10 text-[#71A066] rounded-xl">
              <Star size={24} fill="currentColor" />
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#4E3E2A] dark:text-slate-100 tracking-tight">
                Reviews & Ratings
              </h1>
              <p className="text-xs font-semibold text-[#4E3E2A]/60 dark:text-slate-400 mt-0.5">
                Manage customer feedback, reply to reviews, and track reported issues.
              </p>
            </div>
          </div>
        </div>

        {/* Header toolbar */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Quick Diner search */}
          <div className="relative flex-1 sm:w-56 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#4E3E2A]/40 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search comments, order IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] dark:text-slate-100 placeholder-[#4E3E2A]/30 dark:placeholder-slate-500 transition duration-150"
            />
          </div>

          {/* Refresh Action button */}
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-[#4E3E2A]/60 dark:text-slate-350 shadow-sm transition duration-150 cursor-pointer relative"
            title="Synchronize API Feeds"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[#71A066]" : ""} />
          </button>



          {/* Low rating notification pill alarm */}
          <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20 flex items-center gap-1.5 text-xs font-bold tracking-wide shrink-0">
            <MessageSquare size={13} /> {reviews.filter(r => r.rating <= 2 && r.replies.length === 0).length} Pending Replies
          </div>
        </div>
      </div>

      {/* ==========================================
          TOP STATISTICS CARDS (6 Cards Grid)
          ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Average Rating circular gauge */}
        <div className="bg-white/95 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4.5 border border-[#4E3E2A]/10 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 group flex items-center justify-between min-h-[110px]">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-wider">Average Rating</span>
            <span className="text-2xl font-black text-[#4E3E2A] dark:text-white mt-1 group-hover:text-[#71A066] transition-colors">{metrics.avg}</span>
            <div className="mt-1 flex items-center gap-0.5 text-amber-500">
              {renderStars(metrics.avg, 12)}
            </div>
          </div>
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className="text-[#4E3E2A]/5 dark:text-slate-800" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#71A066" strokeDasharray="100" strokeDashoffset={100 - (metrics.avg / 5) * 100} strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div className="absolute text-[9px] font-black">{Math.round((metrics.avg / 5) * 100)}%</div>
          </div>
        </div>

        {/* Card 2: Total Reviews */}
        <div className="bg-white/95 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4.5 border border-[#4E3E2A]/10 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 group flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-wider">Total Feedbacks</span>
              <span className="text-2xl font-black text-[#4E3E2A] dark:text-white mt-1 group-hover:text-[#71A066] transition-colors">{metrics.total}</span>
            </div>
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-400 text-white rounded-lg shadow-sm shrink-0">
              <MessageSquare size={15} />
            </div>
          </div>
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-100/50 self-start mt-2">
            +18.4% monthly
          </span>
        </div>

        {/* Card 3: Positive Reviews percent */}
        <div className="bg-white/95 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4.5 border border-[#4E3E2A]/10 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 group flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-wider">Satisfaction rate</span>
              <span className="text-2xl font-black text-[#4E3E2A] dark:text-white mt-1 group-hover:text-emerald-500 transition-colors">{metrics.positivePercent}%</span>
            </div>
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-lg shadow-sm shrink-0">
              <Heart size={15} fill="currentColor" />
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#4E3E2A]/10 dark:bg-slate-850 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-550" style={{ width: `${metrics.positivePercent}%` }} />
          </div>
        </div>

        {/* Card 4: Negative Reviews alerts */}
        <div className="bg-white/95 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4.5 border border-rose-500/10 dark:border-rose-900/20 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 group flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-wider">Negative Reviews</span>
              <span className="text-2xl font-black text-rose-500 mt-1">{metrics.negativeCount}</span>
            </div>
            <div className="p-2 bg-rose-50 text-rose-500 rounded-lg shadow-sm shrink-0">
              <AlertTriangle size={15} />
            </div>
          </div>
          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded border border-rose-100/50 self-start mt-2">
            Review needed
          </span>
        </div>

        {/* Card 5: Replied Reviews percentage */}
        <div className="bg-white/95 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4.5 border border-[#4E3E2A]/10 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 group flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-wider">Replied rate</span>
              <span className="text-2xl font-black text-[#4E3E2A] dark:text-white mt-1">
                {metrics.total ? Math.round((metrics.replied / metrics.total) * 100) : 0}%
              </span>
            </div>
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-400 text-white rounded-lg shadow-sm shrink-0">
              <CheckCircle size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[9px] font-bold text-[#4E3E2A]/50 dark:text-slate-400 border-t border-[#4E3E2A]/5 dark:border-slate-850 pt-2">
            <span>{metrics.replied} Replied</span>
            <span>{metrics.total - metrics.replied} Unreplied</span>
          </div>
        </div>

        {/* Card 6: Reported Fake Reviews */}
        <div className="bg-white/95 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4.5 border border-[#4E3E2A]/10 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 group flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-wider">Reported Reviews</span>
              <span className="text-2xl font-black text-amber-500 mt-1">{metrics.reports}</span>
            </div>
            <div className="p-2 bg-amber-50 text-amber-500 rounded-lg shadow-sm shrink-0">
              <Flag size={15} />
            </div>
          </div>
          <span className="text-[9px] font-semibold text-[#4E3E2A]/50 dark:text-slate-500 truncate max-w-[130px] self-start mt-2 block">
            Pending review
          </span>
        </div>
      </div>

      {/* ==========================================
          TWO-COLUMN CORE LAYOUT
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ==========================================
            LEFT COLUMN: ANALYTICS & REVIEW CARDS (9/12)
            ========================================== */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          
          {/* ANALYTICS SECTION GRID */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-[#4E3E2A]/10 shadow-sm">
            <h2 className="text-sm font-black text-[#4E3E2A] dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles size={16} className="text-[#71A066] animate-pulse" /> Rating Insights & Trend Analysis
            </h2>
            <p className="text-[10px] font-semibold text-[#4E3E2A]/50 dark:text-slate-400 mt-0.5">
              Weekly guest satisfaction curve, positive ratio distribution, and popular food item reviews.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 items-center">
              
              {/* Chart 1: Weekly Satisfaction Area Chart */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-wider text-center">Weekly Satisfaction Index</span>
                <div className="h-36 w-full select-none">
                  {isMounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={WEEKLY_TREND_MOCK} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="satisfaction-glow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#71A066" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#71A066" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4E3E2A" opacity={0.05} />
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#4E3E2A", opacity: 0.6 }} />
                        <YAxis tick={{ fontSize: 9, fill: "#4E3E2A", opacity: 0.6 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="satisfaction" stroke="#71A066" strokeWidth={2} fillOpacity={1} fill="url(#satisfaction-glow)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
              </div>

              {/* Chart 2: Positive vs Negative Pie Chart */}
              <div className="flex flex-col gap-3 items-center text-center">
                <span className="text-[10px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-wider">Diner Sentiment Ratio</span>
                <div className="h-36 w-full relative flex items-center justify-center select-none">
                  {isMounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sentimentRatioData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={50}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {sentimentRatioData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : null}
                  {/* Center percentage summary */}
                  <div className="absolute flex flex-col items-center">
                    <Smile size={18} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-[#4E3E2A]/60 dark:text-slate-400 mt-0.5">Satisfied</span>
                  </div>
                </div>
                {/* Custom Legends */}
                <div className="flex gap-3 text-[9px] font-bold text-[#4E3E2A]/50 dark:text-slate-400 justify-center">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Pos</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Neu</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Neg</span>
                </div>
              </div>

              {/* Chart 3: Most Reviewed Food Items Bar Chart */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-[#4E3E2A]/50 dark:text-slate-500 uppercase tracking-wider text-center">Reviews per Food Item</span>
                <div className="h-36 w-full select-none">
                  {isMounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mostReviewedDishes} layout="vertical" margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4E3E2A" opacity={0.05} />
                        <XAxis type="number" tick={{ fontSize: 9, fill: "#4E3E2A" }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "#4E3E2A", width: 60 }} />
                        <Tooltip />
                        <Bar dataKey="reviews" fill="#71A066" radius={[0, 4, 4, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
              </div>

            </div>
          </div>

          {/* INTERACTIVE STAR BREAKDOWN & RATING CONTROLS PANEL */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-[#4E3E2A]/10 shadow-sm flex flex-col gap-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-[#4E3E2A]/5 dark:border-slate-850 pb-4">
              {/* Star breakdown details */}
              <div className="flex-1 space-y-2">
                <span className="text-[10px] font-black text-[#4E3E2A]/40 dark:text-slate-500 uppercase tracking-widest block">Review Score Breakdown</span>
                <div className="space-y-1.5">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const stars = 5 - idx;
                    const count = metrics.starsCounts[stars - 1];
                    const percent = metrics.breakdownPercents[stars - 1];
                    return (
                      <div key={stars} className="flex items-center gap-3 text-[10px] font-bold text-[#4E3E2A]/60 dark:text-slate-400">
                        <span className="w-10 text-left shrink-0 flex items-center gap-0.5">{stars} Stars</span>
                        <div className="flex-1 h-2 bg-[#4E3E2A]/5 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="w-14 text-right shrink-0">{count} reviews ({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Granular Active Filters selector box */}
              <div className="md:w-72 bg-[#FFFCF5]/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-[#4E3E2A]/5 dark:border-slate-850 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-[#4E3E2A]/40 dark:text-slate-500 uppercase tracking-widest">Granular Filters</span>
                
                {/* Star Filter buttons row */}
                <div className="flex items-center flex-wrap gap-1.5">
                  <button
                    onClick={() => setStarFilter("All")}
                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border transition ${
                      starFilter === "All"
                        ? "bg-[#71A066] border-[#71A066] text-white"
                        : "bg-white dark:bg-slate-950 border-[#4E3E2A]/10 text-[#4E3E2A]/60 hover:bg-[#FFFCF5]"
                    }`}
                  >
                    All
                  </button>
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <button
                      key={stars}
                      onClick={() => setStarFilter(stars)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-black border transition flex items-center gap-0.5 ${
                        starFilter === stars
                          ? "bg-amber-400 border-amber-400 text-white"
                          : "bg-white dark:bg-slate-950 border-[#4E3E2A]/10 text-amber-500 hover:bg-[#FFFCF5]"
                      }`}
                    >
                      {stars} ★
                    </button>
                  ))}
                </div>

                {/* Sentiment selector */}
                <div className="grid grid-cols-4 gap-1 select-none text-[9px] font-black uppercase text-center border border-[#4E3E2A]/10 dark:border-slate-850 rounded-xl p-0.5 bg-white dark:bg-slate-950 shrink-0">
                  {(["All", "Positive", "Neutral", "Negative"] as const).map(sent => (
                    <button
                      key={sent}
                      onClick={() => setSelectedSentiment(sent)}
                      className={`py-1.5 rounded-lg transition ${
                        selectedSentiment === sent
                          ? sent === "Positive"
                            ? "bg-emerald-500 text-white"
                            : sent === "Negative"
                            ? "bg-rose-500 text-white"
                            : sent === "Neutral"
                            ? "bg-amber-400 text-white"
                            : "bg-[#71A066] text-white"
                          : "text-[#4E3E2A]/60 hover:bg-[#FFFCF5] hover:text-[#4E3E2A]"
                      }`}
                    >
                      {sent === "All" ? "All" : sent.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick controls panel */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs font-bold">
              {/* Dish Tag filter search */}
              <div className="relative flex-1">
                <Filter className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#4E3E2A]/40" />
                <input
                  type="text"
                  placeholder="Filter by food item (e.g. Kottu, Curry)..."
                  value={dishSearch}
                  onChange={(e) => setDishSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] dark:text-slate-100 font-semibold"
                />
              </div>

              {/* Sorting options select */}
              <div className="relative w-full sm:w-44">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full pl-3.5 pr-8 py-2 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] text-[#4E3E2A] dark:text-slate-200 appearance-none cursor-pointer font-bold"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="positive">Highest Rated</option>
                  <option value="negative">Lowest Rated</option>
                  <option value="replied">Replied First</option>
                  <option value="unreplied">Unreplied First</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-3 pointer-events-none text-[#4E3E2A]/50 dark:text-slate-400" />
              </div>
            </div>
          </div>

          {/* REVIEWS LIST FEED */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              /* PREMIUM EMPTY STATE SECTION */
              <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-10 rounded-3xl border border-[#4E3E2A]/10 shadow-sm flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-gradient-to-tr from-[#FFFCF5] to-[#F8DDA4]/40 border-2 border-dashed border-[#F8DDA4]/60 rounded-full text-[#71A066]">
                  <MessageCircle size={44} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-md font-black text-[#4E3E2A] dark:text-slate-100">No matching reviews found</h3>
                  <p className="text-xs font-bold text-[#4E3E2A]/50 dark:text-slate-400 max-w-[280px]">
                    We couldn't find any reviews matching your search parameters or filter scopes.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setDishSearch("");
                    setStarFilter("All");
                    setSelectedSentiment("All");
                    setSortBy("newest");
                    toast.success("All reviews filters cleared successfully.");
                  }}
                  className="px-4.5 py-2.5 bg-[#71A066] text-xs font-black uppercase tracking-wider text-white hover:bg-[#5E8B54] rounded-xl transition duration-200 shadow-sm shadow-[#71A066]/20 cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              filteredReviews.map((rev) => {
                const isReplyBoxOpen = activeReplyId === rev.id;
                const activeReplyText = replyTextMap[rev.id] || "";
                return (
                  <motion.div
                    key={rev.id}
                    layout
                    whileHover={{ y: -1 }}
                    className={`bg-white/85 dark:bg-slate-900/65 backdrop-blur-md p-4 rounded-xl border transition-all duration-300 relative group flex flex-col gap-3 shadow-xs ${
                      rev.pinned
                        ? "border-[#71A066] bg-gradient-to-br from-[#FFFCF5]/40 to-transparent dark:from-slate-850/20"
                        : "border-[#4E3E2A]/10 dark:border-slate-850"
                    }`}
                  >
                    {/* Header: User avatar, verify badge, bookmark actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#4E3E2A]/5 dark:border-slate-850 pb-3.5">
                      
                      {/* Left: profile */}
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#71A066]/10 text-[#71A066] flex items-center justify-center font-black text-xs shadow-xs relative shrink-0">
                          {rev.avatar}
                          {rev.verified && (
                            <span className="absolute -top-1.5 -right-1.5 bg-[#71A066] text-white p-0.5 rounded-full border border-white" title="Verified buyer">
                              <Check size={8} strokeWidth={4} />
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-[#4E3E2A] dark:text-slate-100">{rev.customerName}</span>
                            
                            {/* Loyalty level badge */}
                            <span className="text-[7.5px] font-black uppercase tracking-wider bg-[#FFFCF5] dark:bg-slate-950 text-[#71A066] px-1.5 py-0.5 rounded-md border border-[#71A066]/20">
                              {rev.loyaltyScore}
                            </span>
                          </div>
                          <span className="text-[9px] text-[#4E3E2A]/40 dark:text-slate-500 font-bold mt-0.5">Order #{rev.orderId} · {rev.date}</span>
                        </div>
                      </div>

                      {/* Right: sentiments, warnings, priority controls */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {/* Sentiment badge */}
                        <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-2xs ${
                          rev.sentiment === "Positive"
                            ? "bg-[#71A066]/10 text-[#71A066] dark:bg-[#71A066]/20"
                            : rev.sentiment === "Negative"
                            ? "bg-rose-50 text-rose-500 dark:bg-rose-950/20"
                            : "bg-amber-50 text-amber-500 dark:bg-amber-950/20"
                        }`}>
                          {rev.sentiment}
                        </span>

                        {/* Reported fake alert badge */}
                        {rev.reported && (
                          <span className="text-[8px] font-black uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded shadow-sm animate-pulse flex items-center gap-0.5">
                            <ShieldAlert size={8} /> reported: {rev.reportReason}
                          </span>
                        )}

                        {/* Action shortcuts */}
                        <button
                          onClick={() => handleTogglePin(rev.id)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            rev.pinned 
                              ? "bg-[#71A066]/10 border-[#71A066] text-[#71A066]"
                              : "bg-white dark:bg-slate-950 border-[#4E3E2A]/10 text-[#4E3E2A]/40 hover:text-[#71A066] dark:hover:text-slate-350"
                          }`}
                          title={rev.pinned ? "Unpin Review" : "Pin Review to Top"}
                        >
                          <Pin size={11} className={rev.pinned ? "fill-[#71A066]" : ""} />
                        </button>

                        <button
                          onClick={() => handleToggleBookmark(rev.id)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            rev.bookmarked 
                              ? "bg-amber-500/10 border-amber-400 text-amber-500"
                              : "bg-white dark:bg-slate-950 border-[#4E3E2A]/10 text-[#4E3E2A]/40 hover:text-amber-500 dark:hover:text-slate-350"
                          }`}
                          title={rev.bookmarked ? "Unbookmark" : "Bookmark Review"}
                        >
                          <Bookmark size={11} className={rev.bookmarked ? "fill-amber-500" : ""} />
                        </button>
                      </div>

                    </div>

                    {/* Content: rating, food name, comment text, image previews */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {renderStars(rev.rating, 13)}
                          <span className="text-xs font-extrabold text-[#4E3E2A] dark:text-slate-200">{rev.rating.toFixed(1)} Stars</span>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wide bg-[#71A066]/5 dark:bg-[#71A066]/10 px-2 py-0.5 rounded-lg text-[#71A066] border border-[#71A066]/10">
                          {rev.dishName}
                        </span>
                      </div>

                      {/* Comment text */}
                      <p className="text-[11.5px] text-[#4E3E2A]/85 dark:text-slate-350 font-medium leading-relaxed">
                        {rev.comment}
                      </p>

                      {/* Food image upload preview (optional) */}
                      {rev.dishImage && (
                        <div className="flex mt-1">
                          <div
                            onClick={() => setZoomImage(rev.dishImage!)}
                            className="relative h-14 w-20 rounded-lg overflow-hidden border border-[#4E3E2A]/10 dark:border-slate-800 shadow-sm cursor-zoom-in group-hover:border-[#71A066]/40 transition"
                          >
                            <img src={rev.dishImage} alt={rev.dishName} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold uppercase transition">
                              Click to Zoom
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Dynamic breakdown scores */}
                      <div className="flex items-center gap-4 text-[9px] text-[#4E3E2A]/40 dark:text-slate-500 font-bold uppercase tracking-wider mt-1 pb-1">
                        <span>Food Quality score: <strong className="text-[#71A066] font-black">{rev.foodRating}.0</strong></span>
                        <span>Service score: <strong className="text-amber-500 font-black">{rev.serviceRating}.0</strong></span>
                      </div>
                    </div>

                    {/* Admin Replies Timeline */}
                    {rev.replies.length > 0 && (
                      <div className="bg-[#FFFCF5] dark:bg-slate-950/20 p-4 rounded-xl border border-[#71A066]/20 flex flex-col gap-2">
                        {rev.replies.map((reply, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="h-7 w-7 rounded-lg bg-[#71A066] text-white flex items-center justify-center font-bold text-[10px] shadow-sm shrink-0">
                              {reply.avatar}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-[11px] text-[#4E3E2A] dark:text-slate-200">Trinco Bites (Admin Response)</span>
                                <span className="text-[7.5px] font-black uppercase tracking-widest bg-[#71A066] text-white px-1.5 py-0.5 rounded shadow-2xs">Owner</span>
                              </div>
                              <span className="text-[8px] text-[#4E3E2A]/40 dark:text-slate-500 font-bold mt-0.5">{reply.timestamp}</span>
                              <p className="text-[11px] text-[#4E3E2A]/80 dark:text-slate-400 mt-1.5 leading-relaxed font-semibold">
                                {reply.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bottom toolbar actions: reply trigger, report modal, delete, hide */}
                    <div className="flex items-center justify-between border-t border-[#4E3E2A]/5 dark:border-slate-850 pt-3 mt-1 select-none">
                      <div className="flex items-center gap-2">
                        {/* Reply trigger button */}
                        <button
                          onClick={() => {
                            setActiveReplyId(isReplyBoxOpen ? null : rev.id);
                            if (!isReplyBoxOpen) {
                              setReplyTextMap(prev => ({ ...prev, [rev.id]: "" }));
                            }
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md border transition duration-150 cursor-pointer ${
                            isReplyBoxOpen
                              ? "bg-slate-500 border-slate-500 text-white"
                              : "bg-[#71A066]/5 border-[#71A066]/10 text-[#71A066] hover:bg-[#71A066]/10"
                          }`}
                        >
                          <MessageCircle size={11} /> {isReplyBoxOpen ? "Close reply" : "Reply console"}
                        </button>

                        {/* Report Fake review modal trigger */}
                        {!rev.reported && (
                          <button
                            onClick={() => handleTriggerReport(rev)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 rounded-md transition duration-150 cursor-pointer"
                          >
                            <Flag size={11} /> Flag Review
                          </button>
                        )}
                      </div>

                      {/* Moderation shortcuts */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleHideReview(rev.id)}
                          className="p-1.5 rounded-lg border border-[#4E3E2A]/10 text-[#4E3E2A]/40 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-700 cursor-pointer"
                          title="Hide review from public"
                        >
                          <EyeOff size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1.5 rounded-lg border border-rose-500/10 text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                          title="Delete review permanently"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* REPLY DRAWER SYSTEM (Expandable textarea with templates) */}
                    <AnimatePresence>
                      {isReplyBoxOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-3 border-t border-[#4E3E2A]/10 dark:border-slate-800 pt-4 flex flex-col gap-3.5"
                        >
                          {/* Quick Reply template pills row */}
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[8.5px] font-black uppercase tracking-widest text-[#4E3E2A]/40 dark:text-slate-500 flex items-center gap-1">
                              <Sparkles size={9} /> Auto-fill templates (Quick response)
                            </span>
                            <div className="flex items-center flex-wrap gap-2">
                              {QUICK_TEMPLATES.map((tpl, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handleInjectTemplate(rev.id, tpl.text)}
                                  className="px-2.5 py-1.5 bg-[#FFFCF5] hover:bg-[#F8DDA4]/30 dark:bg-slate-950 border border-[#71A066]/20 hover:border-[#71A066]/40 text-[9px] font-bold text-[#4E3E2A] dark:text-slate-350 rounded-lg transition text-left cursor-pointer"
                                >
                                  {tpl.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Textarea input */}
                          <div className="flex gap-2">
                            <textarea
                              rows={3}
                              value={activeReplyText}
                              onChange={(e) => setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })}
                              placeholder="Write a warm guest response or use templates above..."
                              className="flex-1 p-3 text-xs bg-white dark:bg-slate-950 border border-[#4E3E2A]/15 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] dark:text-slate-100 font-semibold"
                            />
                            <button
                              onClick={() => handleSendReply(rev.id)}
                              className="px-4.5 bg-[#71A066] hover:bg-[#5E8B54] text-white rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-md shadow-[#71A066]/10 transition cursor-pointer"
                            >
                              <Send size={14} />
                              <span className="text-[9px] font-black uppercase tracking-wider">Send</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                );
              })
            )}
          </div>

        </div>

        {/* ==========================================
            RIGHT COLUMN: SIDEBAR INSIGHTS & ALERTS (3/12)
            ========================================== */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          

          {/* RECENT COMPLAINTS PANEL */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-5 rounded-3xl border border-amber-500/10 dark:border-amber-900/30 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#4E3E2A] dark:text-slate-100 flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-500" /> Recent Complaints
              </h3>
              <p className="text-[9px] font-semibold text-[#4E3E2A]/50 dark:text-slate-400">Negative feedback awaiting your response.</p>
            </div>

            {/* Complaint List */}
            <div className="flex flex-col gap-3">
              {reviews.filter(r => r.rating <= 2 && r.replies.length === 0).map((alertItem) => (
                <div
                  key={alertItem.id}
                  onClick={() => {
                    setSearchTerm(alertItem.orderId);
                    toast.success(`Filtering dashboard for review: ${alertItem.id}`);
                  }}
                  className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl flex flex-col gap-2 cursor-pointer hover:border-amber-200 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[11px] text-[#4E3E2A] dark:text-slate-200 group-hover:text-amber-600 transition-colors">
                      {alertItem.customerName}
                    </span>
                    <span className="text-[9px] text-amber-600 font-bold bg-amber-100/50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded border border-amber-200/50">
                      {alertItem.dishName}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#4E3E2A]/70 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    "{alertItem.comment}"
                  </p>
                  <div className="flex justify-end mt-1">
                    <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-amber-200/50 shadow-xs flex items-center gap-1">
                      <MessageSquare size={10} /> Reply
                    </span>
                  </div>
                </div>
              ))}

              {reviews.filter(r => r.rating <= 2 && r.replies.length === 0).length === 0 && (
                <div className="py-3 text-center text-[#4E3E2A]/40 dark:text-slate-500 font-semibold text-[10px]">
                  All complaints resolved!
                </div>
              )}
            </div>
          </div>

          {/* REPORTED REVIEWS LIST */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-5 rounded-3xl border border-[#4E3E2A]/10 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#4E3E2A] dark:text-slate-100 flex items-center gap-1.5">
                <Flag size={15} className="text-[#4E3E2A]/60" /> Reported Reviews
              </h3>
              <p className="text-[9px] font-semibold text-[#4E3E2A]/50 dark:text-slate-400">Reviews flagged by staff for moderation.</p>
            </div>

            <div className="flex flex-col gap-2.5">
              {reviews.filter(r => r.reported).map((flagged) => (
                <div
                  key={flagged.id}
                  className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-extrabold text-[11px] text-[#4E3E2A] dark:text-slate-200 truncate">{flagged.customerName}</span>
                    <p className="text-[9px] text-[#4E3E2A]/60 dark:text-slate-400 mt-0.5 line-clamp-1 italic">"{flagged.comment}"</p>
                    <span className="text-[8px] font-bold text-[#4E3E2A]/50 uppercase tracking-wider mt-1">Reason: {flagged.reportReason}</span>
                  </div>
                  <button
                    onClick={() => {
                      setReviews(prev => prev.map(r => r.id === flagged.id ? { ...r, reported: false, reportReason: undefined } : r));
                      toast.success(`Resolved reported review from ${flagged.customerName}`);
                    }}
                    className="px-3 py-1.5 text-[9px] font-bold text-[#4E3E2A] dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-[#4E3E2A]/10 rounded-lg transition shadow-xs cursor-pointer shrink-0"
                  >
                    Resolve
                  </button>
                </div>
              ))}

              {reviews.filter(r => r.reported).length === 0 && (
                <div className="py-2 text-center text-[#4E3E2A]/40 dark:text-slate-500 font-semibold text-[10px]">
                  No reported reviews at the moment.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ==========================================
          MODAL INTERFACES WORKFLOW
          ========================================== */}
      
      {/* MODAL 1: REPORT FAKE REVIEW DIALOG */}
      <AnimatePresence>
        {reportingReview && (
          <>
            {/* Dark glass backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportingReview(null)}
              className="fixed inset-0 bg-black z-45"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-[#FAF7F2] dark:bg-slate-900 border border-[#4E3E2A]/10 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-50 flex flex-col gap-4 text-xs font-semibold"
            >
              <div className="flex items-center justify-between border-b border-[#4E3E2A]/10 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                    <Flag size={14} />
                  </span>
                  <h3 className="font-bold text-sm text-[#4E3E2A] dark:text-slate-100">Report Review</h3>
                </div>
                <button
                  onClick={() => setReportingReview(null)}
                  className="p-1 rounded hover:bg-[#4E3E2A]/5 text-[#4E3E2A]/50 dark:text-slate-400 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#4E3E2A]/55 dark:text-slate-400 uppercase tracking-wide">Reviewer</span>
                <span className="font-extrabold text-[#4E3E2A] dark:text-slate-200 block text-xs">{reportingReview.customerName} (Order #{reportingReview.orderId})</span>
              </div>

              {/* Reasons list selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#4E3E2A]/60 dark:text-slate-400">Select report reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-[#4E3E2A]/10 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#71A066] text-[#4E3E2A] dark:text-slate-200 font-bold"
                >
                  <option value="Spam">Spam</option>
                  <option value="Offensive Language">Offensive Language</option>
                  <option value="Fake Feedback">Fake Feedback</option>
                  <option value="Duplicate Review">Duplicate Review</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setReportingReview(null)}
                  className="flex-1 py-2.5 border border-[#4E3E2A]/10 bg-white dark:bg-slate-950 hover:bg-slate-50 text-[#4E3E2A] dark:text-slate-300 font-bold uppercase rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold uppercase rounded-xl transition shadow-sm cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL 2: EXPANDED PHOTO GALLERY ZOOM MODAL */}
      <AnimatePresence>
        {zoomImage && (
          <>
            {/* Black overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomImage(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xs z-45"
            />
            {/* Large image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto max-w-lg w-[90%] h-fit max-h-[80vh] overflow-hidden rounded-3xl border border-white/10 z-50 flex items-center justify-center p-2 bg-transparent"
            >
              <img src={zoomImage} alt="Culinary Zoom" className="w-full h-auto object-contain rounded-2xl shadow-2xl max-h-[75vh]" />
              <button
                onClick={() => setZoomImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

export default ReviewsRatings;
