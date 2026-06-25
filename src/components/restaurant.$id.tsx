import { Link, useParams, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Clock,
  MapPin,
  ShoppingBag,
  ArrowLeft,
  Bike,
  Store,
  Heart,
  ChevronRight,
  Info,
  Plus,
  Minus,
  X,
  ChevronLeft,
  Gift,
  Globe,
  Facebook,
  Instagram,
  Youtube,
  Compass,
  RefreshCw
} from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FoodCard } from "@/components/FoodCard";
import { OffersBadge } from "@/components/OffersBadge";
import { type FoodItem } from "@/utils/data/mock";
import { useRestaurants, type Offer } from "@/context/RestaurantContext";
import { useCart } from "@/context/CartContext";
import { apiRequest } from "@/utils/api";
import { isMenuItemTimeAvailable } from "@/utils/time";

import { C } from "@/utils/theme";

const VIBRANT_COLORS = Object.values(C.vibrant);

/* ── Status Helpers ───────────────────────────────────────────────── */
function getTodayStatusMessage(open: string, close: string, weeklyHours?: any) {
  const now = new Date();
  const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDay = daysMap[now.getDay()];

  let openingTimeStr = open;
  let closingTimeStr = close;

  if (weeklyHours) {
    let weekly = weeklyHours;
    if (typeof weekly === 'string') {
      try {
        weekly = JSON.parse(weekly);
      } catch (e) {
        weekly = null;
      }
    }
    if (weekly && weekly[currentDay]) {
      const todayHours = weekly[currentDay];
      if (!todayHours.open) {
        return "Closed Today";
      }
      openingTimeStr = todayHours.from || openingTimeStr;
      closingTimeStr = todayHours.to || closingTimeStr;
    }
  }

  if (!openingTimeStr || !closingTimeStr) return "Closed";

  const parseTimeToMinutes = (t: string) => {
    const parts = t.split(" ");
    if (parts.length < 2) return 0;
    const [time, period] = parts;
    let [hours, minutes] = time.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = parseTimeToMinutes(openingTimeStr);
  const closeMinutes = parseTimeToMinutes(closingTimeStr);

  const isOpenNow = closeMinutes < openMinutes
    ? (currentMinutes >= openMinutes || currentMinutes <= closeMinutes)
    : (currentMinutes >= openMinutes && currentMinutes <= closeMinutes);

  if (isOpenNow) {
    return `Closes at ${closingTimeStr}`;
  } else if (currentMinutes < openMinutes) {
    return `Opens today at ${openingTimeStr}`;
  } else {
    return "Closed for the day";
  }
}

function isCurrentlyOpen(r: any) {
  if (r.temporaryClosure === true) return false;
  if (r.holidayMode === true) return false;
  if (r.vacationMode === true) return false;
  if (r.acceptOrders === false) return false;

  const now = new Date();
  const parseTime = (t: string) => {
    if (!t) return null;
    const parts = t.split(" ");
    if (parts.length < 2) return null;
    const [time, period] = parts;
    let [hours, minutes] = time.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  let openingTimeStr = r.openingTime;
  let closingTimeStr = r.closingTime;

  if (r.weeklyHours) {
    const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = daysMap[now.getDay()];
    let weekly = r.weeklyHours;
    if (typeof weekly === 'string') {
      try {
        weekly = JSON.parse(weekly);
      } catch (e) {
        weekly = null;
      }
    }
    if (weekly && weekly[currentDay]) {
      const todayHours = weekly[currentDay];
      if (!todayHours.open) {
        return false;
      }
      openingTimeStr = todayHours.from || openingTimeStr;
      closingTimeStr = todayHours.to || closingTimeStr;
    }
  }

  const openTime = parseTime(openingTimeStr);
  const closeTime = parseTime(closingTimeStr);

  if (!openTime || !closeTime) return false;

  return now >= openTime && now <= closeTime;
}

function getAutomaticOfferStatus(offer: Offer) {
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
  if (!offer.activeDays.includes(currentDay)) return "Scheduled";

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
      if (currentMinutes < startMinutes || currentMinutes > endMinutes) return "Scheduled";
    } else {
      if (currentMinutes < startMinutes && currentMinutes > endMinutes) return "Scheduled";
    }
  }

  return "Active";
}

function getLiveOfferState(offer: Offer) {
  if (offer.status !== "Active") return offer.status;

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
  if (!offer.activeDays.includes(currentDay)) return "Scheduled";

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
      if (currentMinutes < startMinutes || currentMinutes > endMinutes) return "Scheduled";
    } else {
      if (currentMinutes < startMinutes && currentMinutes > endMinutes) return "Scheduled";
    }
  }

  return "Active";
}

/* ── Category Chip ──────────────────────────────────────────────── */
function CatChip({
  label,
  image,
  active,
  onClick,
}: {
  label: string;
  image: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      className="flex flex-col items-center flex-shrink-0 gap-2 px-2"
      style={{ minWidth: 70 }}
    >
      <motion.div
        animate={{
          background: active
            ? `linear-gradient(135deg, ${C.burnt}, ${C.orange})`
            : "rgba(255,255,255,0.9)",
          scale: active ? 1.05 : 1,
        }}
        className="h-16 w-16 rounded-full flex items-center justify-center overflow-hidden border-2 shadow-sm transition-all"
        style={{
          borderColor: active ? C.burnt : "rgba(129,52,5,0.1)",
          boxShadow: active ? `0 4px 15px rgba(212,81,19,0.3)` : "none",
        }}
      >
        <img src={image} alt={label} className="w-full h-full object-cover" />
      </motion.div>
      <span
        className="text-[11px] font-black uppercase tracking-tight text-center"
        style={{ color: active ? C.burnt : C.brown }}
      >
        {label}
      </span>
    </motion.button>
  );
}

/* ── Visual Constants ───────────────────────────────────────────── */
const CARD_BACKGROUNDS = [
  "linear-gradient(145deg, #2B160B 0%, #6E3414 45%, #D97745 100%)",
  "linear-gradient(145deg, #0F2523 0%, #1E5B55 48%, #57B7A8 100%)",
  "linear-gradient(145deg, #2F1216 0%, #7B2434 46%, #E47A83 100%)",
  "linear-gradient(145deg, #121D34 0%, #274D86 48%, #76A5F6 100%)",
  "linear-gradient(145deg, #241634 0%, #5A3184 48%, #B894E6 100%)",
  "linear-gradient(145deg, #132B2A 0%, #1F6660 45%, #71C8BC 100%)",
];

/* ── Menu Row Card ──────────────────────────────────────────────── */
function MenuRow({ item, index, restaurantId, onSelect, isOpen, isBusy }: {
  item: FoodItem;
  index: number;
  restaurantId: string;
  onSelect: (item: FoodItem) => void;
  isOpen: boolean;
  isBusy?: boolean;
}) {

  const card = (
    <motion.div
      layoutId={`card-bg-${item.id}`}
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30, rotate: index % 2 === 0 ? -2 : 2 }}
      whileInView={{ opacity: 1, x: 0, rotate: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative flex flex-col min-h-[200px] rounded-[40px] p-6 shadow-2xl border border-white/15 cursor-pointer overflow-hidden"
      style={{
        background: CARD_BACKGROUNDS[index % CARD_BACKGROUNDS.length],
        boxShadow: "0 24px 44px rgba(37, 16, 7, 0.18), inset 0 1px 0 rgba(255,255,255,0.16)",
      }}
    >
      <motion.div
        layoutId={`card-texture-${item.id}`}
        className="absolute inset-0 opacity-10 pointer-events-none rounded-[40px]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 18%, rgba(255,255,255,0.22), transparent 32%), radial-gradient(circle at 82% 12%, rgba(248,221,164,0.18), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.08), transparent 55%)",
          opacity: 1,
        }}
      />

      <div
        className="absolute inset-x-6 top-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)" }}
      />

      <div
        className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(7,4,2,0.2), transparent)" }}
      />

      <div className="flex-1 flex flex-col items-start text-left z-10 pr-4">
        <motion.h3
          layoutId={`card-title-${item.id}`}
          className="text-lg md:text-xl font-black text-white mb-2 leading-tight drop-shadow-md"
        >
          {item.category}
        </motion.h3>
        <motion.p
          layoutId={`card-desc-${item.id}`}
          className="text-white/80 text-[11px] font-medium leading-relaxed max-w-[140px]"
        >
          {item.description || "Freshly prepared with authentic ingredients and local spices."}
        </motion.p>
      </div>

      <motion.div
        layoutId={`card-image-container-${item.id}`}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="absolute bottom-4 right-4 z-30"
      >
        <div
          className="h-24 w-24 md:h-28 md:w-28 rounded-full border-[4px] border-white/90 shadow-2xl overflow-hidden bg-white transform"
          style={{ rotate: index % 2 === 0 ? "-10deg" : "10deg" }}
        >
          <motion.img
            layoutId={`card-image-${item.id}`}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            src={getCategoryImage(item.category, item.image)}
            alt={item.category}
            className="h-full w-full object-cover"
          />
        </div>
      </motion.div>
      {!isOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#120400]/55 backdrop-blur-[2px]">
          <div className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white">
            {isBusy ? "Kitchen Busy" : "Restaurant Closed"}
          </div>
        </div>
      )}
    </motion.div>
  );

  return isOpen ? (
    <Link to="/food/$id" params={{ id: (item as any).foodItemId || item.id }} search={{ restaurantId }}>
      {card}
    </Link>
  ) : (
    <div className="cursor-not-allowed">
      {card}
    </div>
  );
}


function getCategoryImage(categoryName: string, fallbackImage: string) {
  return fallbackImage || "";
}

function getOfferFoodItemId(offerId: string, restaurant: any): string | null {
  const isAvailable = (item: any) => 
    item.isAvailable !== false && 
    item.stock !== 0 && 
    isMenuItemTimeAvailable(item.timeAvailability);

  if (offerId === "O-204") return "f7";
  if (offerId === "O-205") return "f8";

  if (offerId === "O-201") {
    const found = restaurant.menu.find((item: any) => 
      (item.category.toLowerCase().includes("burger") || item.name.toLowerCase().includes("burger")) && isAvailable(item)
    );
    return found ? found.id : restaurant.menu.find(isAvailable)?.id || null;
  }
  if (offerId === "O-202") {
    const found = restaurant.menu.find((item: any) => 
      (item.category.toLowerCase().includes("pizza") || item.name.toLowerCase().includes("pizza")) && isAvailable(item)
    );
    return found ? found.id : restaurant.menu.find(isAvailable)?.id || null;
  }
  if (offerId === "O-203") {
    const found = restaurant.menu.find((item: any) => 
      (item.category.toLowerCase().includes("briyani") || item.name.toLowerCase().includes("briyani")) && isAvailable(item)
    );
    return found ? found.id : restaurant.menu.find(isAvailable)?.id || null;
  }

  return restaurant.menu.find(isAvailable)?.id || restaurant.menu[0]?.id || null;
}

export function RestaurantPage() {
  const navigate = useNavigate();
  const { findRestaurant, offers } = useRestaurants();
  const { id } = useParams({ strict: false });
  const r = findRestaurant(id || "");
  const { count, add, decrement, items: cartItems } = useCart();
  const [activeCategory, setActiveCategory] = useState("All");
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchDbCategories = async () => {
      if (!id) return;
      try {
        setLoadingCategories(true);
        const data = await apiRequest<any[]>(`/category/public/restaurant/${id}`);
        setDbCategories(data || []);
      } catch (err) {
        console.error("Failed to fetch categories from backend:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchDbCategories();
  }, [id]);

  useEffect(() => {
    const offerParam = new URLSearchParams(window.location.search).get("offer");
    if (offerParam) {
      setTimeout(() => {
        const el = document.getElementById("offers-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, [id]);

  const activeAndLiveOffers = useMemo(() => {
    if (!r) return [];
    return offers
      .filter(o => o.restaurantId === r.id)
      .map(o => ({
        ...o,
        computedStatus: getAutomaticOfferStatus(o),
        liveState: getLiveOfferState(o)
      }))
      .filter(o => o.computedStatus === "Active" || o.computedStatus === "Scheduled");
  }, [offers, r]);

  const categoryCards = useMemo(() => {
    if (!r) return [];
    return dbCategories
      .map((dbCat) => {
        const catNameLower = dbCat.name.toLowerCase();

        // Find a matching available and time-available food item in this category
        const matchingFood = r.menu.find((f) => {
          const itemCatLower = f.category.toLowerCase();
          const matchesCat =
            f.categoryId === dbCat.id ||
            itemCatLower === catNameLower ||
            itemCatLower === catNameLower + "s" ||
            catNameLower === itemCatLower + "s" ||
            itemCatLower.startsWith(catNameLower.substring(0, 4));

          return (
            matchesCat &&
            (f as any).isAvailable !== false &&
            (f as any).stock !== 0 &&
            isMenuItemTimeAvailable(f.timeAvailability)
          );
        });

        // If no matching available food item is found, filter out this category
        if (!matchingFood) return null;

        return {
          id: `db-cat-${dbCat.id}`,
          foodItemId: matchingFood.id,
          category: dbCat.name,
          description: dbCat.description,
          image: dbCat.image,
        };
      })
      .filter((cat): cat is NonNullable<typeof cat> => cat !== null);
  }, [dbCategories, r?.menu]);

  const popularItems = useMemo(() => {
    if (!r) return [];
    return r.menu
      .filter((item) => 
        item.popular && 
        (item as any).isAvailable !== false && 
        (item as any).stock !== 0 &&
        isMenuItemTimeAvailable(item.timeAvailability)
      )
      .slice(0, 3);
  }, [r?.menu]);

  if (!r) return null;

  const isOpen = isCurrentlyOpen(r);

  const statusInfo = useMemo(() => {
    if (r.temporaryClosure) {
      return { label: "TEMPORARILY CLOSED", badgeClass: "bg-red-100 text-red-700 border border-red-200", dotClass: "bg-red-500", message: "Emergency kitchen reset/maintenance in progress." };
    }
    if (r.holidayMode) {
      return { label: "CLOSED FOR HOLIDAY", badgeClass: "bg-red-105 text-red-700 border border-red-200", dotClass: "bg-red-500", message: "Closed for national/local holiday." };
    }
    if (r.vacationMode) {
      return { label: "ON VACATION", badgeClass: "bg-amber-100 text-amber-700 border border-amber-200", dotClass: "bg-amber-500", message: "We are currently away on vacation. Checkouts are locked." };
    }
    if (r.acceptOrders === false) {
      return { label: "KITCHEN BUSY", badgeClass: "bg-orange-100 text-orange-700 border border-orange-200", dotClass: "bg-orange-500", message: "Kitchen is busy. Refusing new checkouts." };
    }
    const isTimeOpen = isCurrentlyOpen(r);
    if (isTimeOpen) {
      return { label: "OPEN NOW", badgeClass: "bg-green-100 text-green-700 border border-green-200", dotClass: "bg-green-500 animate-pulse", message: getTodayStatusMessage(r.openingTime, r.closingTime, r.weeklyHours) };
    } else {
      return { label: "CLOSED NOW", badgeClass: "bg-red-100 text-red-700 border border-red-200", dotClass: "bg-red-500", message: getTodayStatusMessage(r.openingTime, r.closingTime, r.weeklyHours) };
    }
  }, [r]);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: C.bg, fontFamily: "var(--font-body)" }}>
      <Navbar />

      <main className="flex-1">
        {/* ── Hero Banner ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-b-[40px] md:rounded-b-[80px]" style={{ minHeight: 400 }}>
          <div className="absolute inset-0 rounded-b-[40px] md:rounded-b-[80px] overflow-hidden">
            <img src={r.coverImage || r.image} alt={r.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(18,4,0,0.4) 0%, rgba(18,4,0,0.85) 100%)" }} />
          </div>

          <div className="relative mx-auto max-w-6xl px-5 pt-8 pb-12 flex flex-col justify-between min-h-[400px]">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Link to="/home" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition">
                <ArrowLeft size={16} /> Back to Home
              </Link>
            </motion.div>

            <div className="flex flex-col items-center text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4 mb-4">
                <div className="h-20 w-20 rounded-2xl bg-white p-1 shadow-2xl border-2 border-[#F8DDA4]/30 overflow-hidden">
                  <img src={r.logoImage || r.image} alt="logo" className="h-full w-full object-cover rounded-xl" />
                </div>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-black text-white leading-tight">
                {r.name}
              </motion.h1>

              {r.tagline && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                  className="mt-2 text-base text-white/75 font-medium italic max-w-lg">
                  {r.tagline}
                </motion.p>
              )}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="mt-6 flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm">
                <div className="flex items-center gap-2"><MapPin size={16} className="text-[#F9A03F]" /> {r.location}</div>
                <div className="flex items-center gap-2"><Star size={16} className="text-[#F9A03F] fill-[#F9A03F]" /> {r.rating} ({r.reviewsCount !== undefined ? `${r.reviewsCount} reviews` : '500+ reviews'})</div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Restaurant Info + Social Section ─────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 -mt-10 relative z-20">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-[32px] p-6 shadow-2xl border border-[#F8DDA4]/40 grid grid-cols-2 md:grid-cols-4 gap-6">

            <div className="flex flex-col items-center text-center p-2">
              <div className={`flex items-center gap-2 mb-2 px-3 py-1 rounded-full text-[10px] font-black ${statusInfo.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`} />
                {statusInfo.label}
              </div>
              <p className="text-xs text-slate-500 font-bold">
                {statusInfo.message}
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-2 border-l border-slate-100">
              <Bike className="text-[#D45113] mb-2" size={20} />
              <p className="text-sm font-bold text-[#813405]">{r.deliveryTime}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Delivery Time</p>
            </div>

            <div className="flex flex-col items-center text-center p-2 border-l border-slate-100">
              <Store className="text-[#D45113] mb-2" size={20} />
              <p className="text-sm font-bold text-[#813405]">{r.deliveryRadius} km</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Delivery Radius</p>
            </div>

            <div className="flex flex-col items-center text-center p-2 border-l border-slate-100">
              <Info className="text-[#D45113] mb-2" size={20} />
              <p className={`text-[11px] font-black leading-tight ${r.deliveryAvailable ? 'text-[#813405]' : 'text-red-750'}`}>
                {r.deliveryAvailable ? `Rs. ${r.deliveryFee?.toLocaleString()}.00` : "Delivery Unavailable"}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-1">
                {r.deliveryAvailable ? ((r as any).freeDeliveryThreshold ? `Free over Rs. ${(r as any).freeDeliveryThreshold.toLocaleString()}` : "Delivery Fee") : "Status"}
              </p>
            </div>
          </motion.div>

          {/* Warning banner for closed/busy status */}
          {(r.temporaryClosure || r.holidayMode || r.vacationMode || r.acceptOrders === false) && (
            <div className={`mt-4 rounded-[24px] p-5 border flex items-center gap-3.5 shadow-md ${
              r.acceptOrders === false 
                ? "bg-orange-50/70 border-orange-200 text-orange-800" 
                : r.vacationMode 
                  ? "bg-amber-50/70 border-amber-200 text-amber-800" 
                  : "bg-red-50/70 border-red-200 text-red-800"
            }`}>
              <span className="text-2xl shrink-0">⚠️</span>
              <div className="text-left">
                <h4 className="font-black text-sm uppercase tracking-wider">{statusInfo.label}</h4>
                <p className="text-xs font-semibold mt-1 opacity-90 leading-relaxed">{statusInfo.message}</p>
              </div>
            </div>
          )}

          {/* ── Social Links + Description Card ───────────────────── */}
          {(r.website || r.facebook || r.instagram || r.youtube || r.tiktok || r.phone || r.description) && (
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
              className="mt-4 bg-white rounded-[24px] p-5 shadow-lg border border-[#F8DDA4]/40 flex flex-col gap-4">
              {(r.website || r.facebook || r.instagram || r.youtube || r.tiktok) && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Follow Us:</span>
                  {r.website && (
                    <a href={r.website} target="_blank" rel="noopener noreferrer" title="Official Website"
                      className="h-9 w-9 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200/60 flex items-center justify-center text-blue-600 transition-all hover:scale-110 shadow-sm">
                      <Globe size={17} />
                    </a>
                  )}
                  {r.facebook && (
                    <a href={r.facebook} target="_blank" rel="noopener noreferrer" title="Facebook"
                      className="h-9 w-9 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-300/60 flex items-center justify-center text-blue-700 transition-all hover:scale-110 shadow-sm">
                      <Facebook size={17} />
                    </a>
                  )}
                  {r.instagram && (
                    <a href={r.instagram} target="_blank" rel="noopener noreferrer" title="Instagram"
                      className="h-9 w-9 rounded-full bg-pink-50 hover:bg-pink-100 border border-pink-200/60 flex items-center justify-center text-pink-600 transition-all hover:scale-110 shadow-sm">
                      <Instagram size={17} />
                    </a>
                  )}
                  {r.youtube && (
                    <a href={r.youtube} target="_blank" rel="noopener noreferrer" title="YouTube"
                      className="h-9 w-9 rounded-full bg-red-50 hover:bg-red-100 border border-red-200/60 flex items-center justify-center text-red-650 hover:scale-110 shadow-sm">
                      <Youtube size={17} />
                    </a>
                  )}
                  {r.tiktok && (
                    <a href={r.tiktok} target="_blank" rel="noopener noreferrer" title="TikTok"
                      className="h-9 w-9 rounded-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-300/60 flex items-center justify-center text-zinc-700 transition-all hover:scale-110 shadow-sm">
                      <Compass size={17} />
                    </a>
                  )}
                  {r.phone && (
                    <a href={`tel:${r.phone}`} title="Call Us"
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D45113]/10 hover:bg-[#D45113]/20 text-[#D45113] text-xs font-bold border border-[#D45113]/20 transition-colors">
                      📞 {r.phone}
                    </a>
                  )}
                </div>
              )}
              {r.description && (
                <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                  {r.description}
                </p>
              )}
            </motion.div>
          )}
        </section>

        {/* ── Available Offers Section ────────────────────────────── */}
        {activeAndLiveOffers.length > 0 && (
          <section id="offers-section" className="mx-auto max-w-6xl px-4 mt-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#D45113]/10 text-[#D45113]">
                    <Gift size={20} />
                  </div>
                  <h3 className="text-xl font-black text-[#813405] font-serif leading-tight">Available Offers</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 pl-9">Exclusive discounts and combos for you today</p>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
              {activeAndLiveOffers.map((offer) => {
                const isActiveRightNow = offer.liveState === "Active";
                let foodItemId = offer.menuItemId;
                if (!foodItemId && offer.categoryId) {
                  const match = r.menu.find((item) => item.categoryId === offer.categoryId);
                  if (match) foodItemId = match.id;
                }

                const cardContent = (
                  <motion.div
                    whileHover={isOpen && (foodItemId || offer.type === "FREE_DELIVERY") ? { y: -4, scale: 1.01 } : {}}
                    className={`flex-shrink-0 w-80 md:w-96 rounded-2xl bg-white border border-[#F8DDA4]/30 shadow-md p-4 snap-start flex flex-col justify-between ${isOpen && (foodItemId || offer.type === "FREE_DELIVERY") ? "cursor-pointer hover:border-[#D45113]/30 transition-all" : "cursor-not-allowed opacity-80"
                      }`}
                  >
                    <div className="flex gap-3">
                      {offer.bannerImage ? (
                        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 relative bg-slate-50 border border-slate-100">
                          <img src={offer.bannerImage} alt={offer.title} className="w-full h-full object-cover" />
                          <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white ${isActiveRightNow ? "bg-green-650 animate-pulse" : "bg-amber-600"
                            }`}>
                            {isActiveRightNow ? "Live Now" : "Upcoming"}
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-orange-50/50 border border-orange-100/50 flex items-center justify-center shrink-0 text-3xl">
                          {offer.emoji || "🎁"}
                        </div>
                      )}

                      <div className="flex-1 flex flex-col justify-between text-left">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[8px] font-black uppercase tracking-wider text-[#D45113] bg-[#D45113]/10 px-2 py-0.5 rounded-full">
                              {offer.type.includes("DISCOUNT") ? "Automatic Discount" : offer.type === "COMBO_DEAL" ? "Combo Deal" : "Special Promo"}
                            </span>
                            {offer.timeLabel && (
                              <span className="text-[8px] font-extrabold uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                                {offer.timeLabel}
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-sm text-[#813405] mt-1.5 line-clamp-1">{offer.title}</h4>
                          <p className="text-[10px] text-slate-500 font-medium mt-1 leading-normal line-clamp-2">{offer.description}</p>
                        </div>

                        <div className="text-[8.5px] font-bold text-slate-450 uppercase tracking-wide flex items-center gap-1 mt-2">
                          <Clock size={9} />
                          <span>{offer.activeDays.join(", ")} {offer.startTime ? `• ${offer.startTime} - ${offer.endTime}` : ""}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#D45113] bg-orange-50 border border-orange-100/50 px-2.5 py-0.5 rounded-lg shadow-sm">
                        {offer.discountBadge}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${isActiveRightNow
                          ? "bg-green-100 text-green-700 border border-green-200/50"
                          : "bg-amber-100 text-amber-700 border border-amber-200/50"
                          }`}>
                          {isActiveRightNow ? "✓ Auto Applied" : "Starts Soon"}
                        </span>
                        {isOpen && (foodItemId || offer.type === "FREE_DELIVERY") && (
                          <span className="text-[10px] font-black text-orange-650 flex items-center gap-0.5 bg-orange-100/50 px-2 py-1 rounded-lg border border-orange-200/50 hover:bg-orange-100">
                            Order Deal <ChevronRight size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );

                return (
                  <div
                    key={offer.id}
                    className="block"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!isOpen) return;
                      if (!foodItemId && offer.type !== "FREE_DELIVERY") return;
                      
                      if (offer.type === "COMBO_DEAL" && foodItemId) {
                        const foodItem = r.menu.find((item) => item.id === foodItemId);
                        if (foodItem) {
                          add(foodItem, r.id, 1, { appliedOffer: offer as any });
                          navigate({ to: "/cart" });
                        }
                      } else if (offer.type === "FREE_DELIVERY") {
                        const menuEl = document.getElementById("offers-section");
                        if (menuEl) {
                          menuEl.scrollIntoView({ behavior: "smooth" });
                        }
                      } else if (foodItemId) {
                        navigate({
                          to: "/food/$id",
                          params: { id: foodItemId },
                          search: { restaurantId: r.id, offerId: offer.id }
                        });
                      }
                    }}
                  >
                    {cardContent}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Menu Display Section (Responsive Grid) ──────────────────── */}
        <section className="mx-auto max-w-7xl px-4 mt-8 pb-24">

          <motion.h2
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black text-[#813405] mb-8 text-center md:text-left"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {activeCategory === "All" ? "Explore All" : `${activeCategory} Items`}
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            <AnimatePresence mode="popLayout">
              {categoryCards.map((item, i) => (
                <MenuRow
                  key={item.id}
                  item={item as any}
                  index={i}
                  restaurantId={r.id}
                  onSelect={() => { }}
                  isOpen={isOpen}
                  isBusy={r.acceptOrders === false}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>

      <Footer />


    </div>
  );
}
