import { Link, useParams } from "@tanstack/react-router";
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
  Gift
} from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FoodCard } from "@/components/FoodCard";
import { OffersBadge } from "@/components/OffersBadge";
import { categories, type FoodItem } from "@/utils/data/mock";
import { useRestaurants, type Offer } from "@/context/RestaurantContext";
import { useCart } from "@/context/CartContext";

import { C } from "@/utils/theme";

const VIBRANT_COLORS = Object.values(C.vibrant);

/* ── Status Helpers ───────────────────────────────────────────────── */
function isCurrentlyOpen(open: string, close: string) {
  const now = new Date();
  const parseTime = (t: string) => {
    const [time, period] = t.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  };
  const openTime = parseTime(open);
  const closeTime = parseTime(close);
  return now >= openTime && now <= closeTime;
}

function getAutomaticOfferStatus(offer: Offer) {
  if (offer.status === "Draft") return "Paused";

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
function MenuRow({ item, index, restaurantId, onSelect, isOpen }: {
  item: FoodItem;
  index: number;
  restaurantId: string;
  onSelect: (item: FoodItem) => void;
  isOpen: boolean;
}) {

  const card = (
    <motion.div
        layoutId={`card-bg-${item.id}`}
        initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30, rotate: index % 2 === 0 ? -2 : 2 }}
        whileInView={{ opacity: 1, x: 0, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex flex-col lg:h-full rounded-[40px] p-6 shadow-2xl border border-white/15 cursor-pointer overflow-hidden"
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
          {CAT_DESCRIPTIONS[item.category] || item.description || "Freshly prepared with authentic ingredients and local spices."}
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
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        </div>
      </motion.div>
      {!isOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#120400]/55 backdrop-blur-[2px]">
          <div className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white">
            Restaurant Closed
          </div>
        </div>
      )}
    </motion.div>
  );

  return isOpen ? (
    <Link to="/food/$id" params={{ id: item.id }}>
      {card}
    </Link>
  ) : (
    <div className="cursor-not-allowed">
      {card}
    </div>
  );
}

/* ── Category Descriptions ────────────────────────────────────────── */
const CAT_DESCRIPTIONS: Record<string, string> = {
  "Kottu": "Chopped roti stir-fried with spicy curry, vegetables, eggs, and your favorite meat for the ultimate Sri Lankan street-food experience.",
  "Noodles": "Flavor-packed stir-fried noodles tossed with fresh vegetables, sauces, and delicious chicken or seafood options.",
  "Srilankan Foods": "Authentic local meals rich with traditional spices, aromatic curries, rice, and homemade flavors from Sri Lanka.",
  "Fried Rice": "Wok-fried rice mixed with vegetables, eggs, and your choice of chicken, seafood, or beef for a satisfying meal.",
  "Nasi Goreng": "Indonesian-style spicy fried rice blended with sweet soy sauce, chili flavors, and perfectly cooked proteins.",
  "Seafood": "Fresh ocean flavors featuring prawns, crab, fish, and calamari cooked with bold coastal seasonings.",
  "Briyani": "Aromatic basmati rice layered with flavorful spices and tender meat, slow-cooked for a rich traditional taste.",
  "Chinese Rice": "Delicious Chinese-style rice dishes cooked with savory sauces, vegetables, and sizzling meat combinations.",
  "Burgers": "Juicy burgers stacked with crispy patties, melted cheese, fresh veggies, and signature sauces.",
  "Pizza": "Oven-baked pizzas loaded with cheesy goodness, fresh toppings, and flavorful sauces on a crispy crust.",
  "Soft Drinks": "Refreshing chilled beverages perfect for pairing with your favorite meals and snacks.",
  "Juice": "Freshly blended fruit juices packed with natural sweetness, tropical flavors, and refreshing energy.",
  "Mojito": "Cool minty mocktails mixed with fruity flavors, citrus freshness, and sparkling refreshment.",
  "Milkshake": "Creamy thick milkshakes blended with rich flavors, ice cream, and sweet toppings.",
  "Desserts": "Sweet treats and delightful desserts crafted to perfectly finish your meal experience.",
  "Omlete": "Fluffy egg omelets filled with vegetables, cheese, and savory ingredients for a simple tasty bite.",
};

export function RestaurantPage() {
  const { findRestaurant, offers } = useRestaurants();
  const { id } = useParams({ strict: false });
  const r = findRestaurant(id || "");
  const { count, add, decrement, items: cartItems } = useCart();
  const [activeCategory, setActiveCategory] = useState("All");

  const activeAndLiveOffers = useMemo(() => {
    if (!r) return [];
    return offers
      .filter(o => o.restaurantId === r.id)
      .map(o => ({
        ...o,
        computedStatus: getAutomaticOfferStatus(o)
      }))
      .filter(o => o.computedStatus !== "Expired" && o.status !== "Draft");
  }, [offers, r]);


  if (!r) return null;

  const isOpen = isCurrentlyOpen(r.openingTime, r.closingTime);

  const uniqueMenu = useMemo(() => {
    const seen = new Set<string>();
    return r.menu.filter((item) => {
      if (seen.has(item.category)) return false;
      seen.add(item.category);
      return true;
    });
  }, [r.menu]);

  const filteredMenu = useMemo(() => {
    if (activeCategory === "All") return uniqueMenu;
    return uniqueMenu.filter(item => item.category === activeCategory);
  }, [uniqueMenu, activeCategory]);

  const popularItems = useMemo(() => {
    return r.menu.filter(item => item.popular).slice(0, 3);
  }, [r.menu]);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: C.bg, fontFamily: "var(--font-body)" }}
    >
      <Navbar />

      <main className="flex-1">
        {/* ── Hero Banner ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-b-[40px] md:rounded-b-[80px]" style={{ minHeight: 400 }}>
          <div className="absolute inset-0 rounded-b-[40px] md:rounded-b-[80px] overflow-hidden">
            <img src={r.image} alt={r.name} className="h-full w-full object-cover" />
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
                  <img src={r.image} alt="logo" className="h-full w-full object-cover rounded-xl" />
                </div>
                <div className="px-4 py-1.5 rounded-full bg-[#D45113] text-white text-[10px] font-black uppercase tracking-widest">
                  {r.category}
                </div>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-black text-white leading-tight">
                {r.name}
              </motion.h1>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="mt-6 flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm">
                <div className="flex items-center gap-2"><MapPin size={16} className="text-[#F9A03F]" /> {r.location}</div>
                <div className="flex items-center gap-2"><Star size={16} className="text-[#F9A03F] fill-[#F9A03F]" /> {r.rating} (500+ reviews)</div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Restaurant Info Section ─────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 -mt-10 relative z-20">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-[32px] p-6 shadow-2xl border border-[#F8DDA4]/40 grid grid-cols-2 md:grid-cols-4 gap-6">

            <div className="flex flex-col items-center text-center p-2">
              <div className={`flex items-center gap-2 mb-2 px-3 py-1 rounded-full text-[10px] font-black ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {isOpen ? 'OPEN NOW' : 'CLOSED'}
              </div>
              <p className="text-xs text-slate-500">Closes at {r.closingTime}</p>
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
              <p className={`text-[11px] font-black leading-tight ${r.deliveryAvailable ? 'text-[#813405]' : 'text-red-600'}`}>
                {r.deliveryAvailable ? `Rs. ${r.deliveryFee?.toLocaleString()}.00` : "Delivery Unavailable"}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-1">
                {r.deliveryAvailable ? "Delivery Fee" : "Status"}
              </p>
            </div>
          </motion.div>
        </section>

        {/* ── Available Offers Section ────────────────────────────── */}
        {activeAndLiveOffers.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 mt-10">
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
                const isActiveRightNow = offer.computedStatus === "Active";
                
                return (
                  <motion.div
                    key={offer.id}
                    whileHover={{ y: -4 }}
                    className="flex-shrink-0 w-80 md:w-96 rounded-2xl bg-white border border-[#F8DDA4]/30 shadow-md p-4 snap-start flex flex-col justify-between"
                  >
                    <div className="flex gap-3">
                      {/* Banner / Image block */}
                      {offer.bannerImage ? (
                        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 relative bg-slate-50 border border-slate-100">
                          <img src={offer.bannerImage} alt={offer.title} className="w-full h-full object-cover" />
                          <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white ${
                            isActiveRightNow ? "bg-green-650 animate-pulse" : "bg-amber-600"
                          }`}>
                            {isActiveRightNow ? "Live Now" : "Upcoming"}
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-orange-50/50 border border-orange-100/50 flex items-center justify-center shrink-0 text-3xl">
                          {offer.emoji}
                        </div>
                      )}

                      <div className="flex-1 flex flex-col justify-between text-left">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[8px] font-black uppercase tracking-wider text-[#D45113] bg-[#D45113]/10 px-2 py-0.5 rounded-full">
                              {offer.type === "Discount" ? "Automatic Discount" : offer.type === "Combo" ? "Combo Deal" : "Special Promo"}
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
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
                        isActiveRightNow 
                          ? "bg-green-100 text-green-700 border border-green-200/50 animate-pulse" 
                          : "bg-amber-100 text-amber-700 border border-amber-200/50"
                      }`}>
                        {isActiveRightNow ? "✓ Auto Applied" : "Starts Soon"}
                      </span>
                    </div>
                  </motion.div>
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
              {filteredMenu.map((item, i) => (
                <MenuRow
                  key={item.id}
                  item={item}
                  index={uniqueMenu.findIndex(m => m.category === item.category)}
                  restaurantId={r.id}
                  onSelect={() => {}}
                  isOpen={isOpen}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>



      </main>

      <Footer />

      {/* ── Bottom Action Bar (Mobile) ────────────────────────────── */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white px-6 py-5 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-[#F8DDA4]/30 rounded-t-[32px]"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Cart Total</p>
                <p className="text-lg font-black text-[#D45113]">Checkout</p>
              </div>
              <Link to="/cart" className="flex-1">
                <motion.button whileTap={{ scale: 0.95 }}
                  className="w-full bg-[#D45113] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#D45113]/30">
                  <ShoppingBag size={20} /> View Cart ({count})
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
