import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  ChevronDown,
  SlidersHorizontal,
  Flame,
  Star,
  Clock,
  ShieldCheck,
  ArrowRight,
  Leaf,
  Beef,
} from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSearch } from "@/context/SearchContext";
import { Slider } from "@/components/ui/slider";

import { Navbar } from "@/components/Navbar";
import { RestaurantCard } from "@/components/RestaurantCard";
import { Footer } from "@/components/Footer";

import { useLocationState } from "@/context/LocationContext";
import { OffersBadge } from "@/components/OffersBadge";
import { RatingSliderFilter } from "@/components/RatingSlider";
import { TopRatedRestaurants } from "@/components/TopRatedRestaurants";
import { OffersBannerCarousel } from "@/components/OffersBannerCarousel";
import { PopularNearYou } from "@/components/PopularNearYou";

import { categories, type Restaurant } from "@/utils/data/mock";
import { useRestaurants } from "@/context/RestaurantContext";
import { isRestaurantOpen } from "@/utils/time";
import homeBack from "@/assets/home-back.jpg";

import { C } from "@/utils/theme";

const extraFilters = [
  "Open Now",
  "Under 30 min",
  "Highest rated",
  "Rating",
  "With Offers",
] as const;

type ExtraFilter = (typeof extraFilters)[number] | "All";

/* ── Stat Badge ─────────────────────────────────────────────────── */
function StatBadge({
  icon: Icon,
  value,
  label,
  delay,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-1.5 sm:gap-3 px-2 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl flex-1 sm:flex-initial min-w-0"
      style={{
        background: "rgba(255,252,245,0.12)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(248,221,164,0.20)",
      }}
    >
      <div
        className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg sm:rounded-xl grid place-items-center flex-shrink-0"
        style={{ background: "rgba(212,81,19,0.35)" }}
      >
        <Icon size={12} className="sm:w-[13px] sm:h-[13px]" style={{ color: C.cream }} />
      </div>

      <div className="flex flex-col min-w-0">
        <p
          className="text-[11px] sm:text-sm font-black leading-none"
          style={{ color: C.cream }}
        >
          {value}
        </p>

        <p
          className="text-[8px] sm:text-[10px] mt-0.5 leading-none opacity-60"
          style={{ color: C.cream }}
        >
          {label}
        </p>
      </div>
    </motion.div>
  );
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
      whileTap={{ scale: 0.90 }}
      className="flex flex-col items-center flex-shrink-0 gap-1.5"
      style={{ minWidth: 60 }}
    >
      {/* Image circle */}
      <motion.div
        animate={{
          background: active
            ? `linear-gradient(135deg, ${C.burnt}, ${C.orange})`
            : "rgba(255,252,245,0.95)",
          boxShadow: active
            ? `0 4px 14px rgba(212,81,19,0.35)`
            : `0 2px 8px rgba(129,52,5,0.10)`,
          scale: active ? 1.1 : 1,
        }}
        transition={{ duration: 0.22 }}
        className="h-16 w-16 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          border: active
            ? "2.5px solid rgba(212,81,19,0.6)"
            : "2px solid rgba(129,52,5,0.12)",
        }}
      >
        <img
          src={image}
          alt={label}
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Label */}
      <span
        className="text-[11px] font-bold leading-tight text-center"
        style={{
          color: active ? C.burnt : "#4E1D02",
          fontFamily: "var(--font-body)",
          maxWidth: 64,
        }}
      >
        {label}
      </span>
    </motion.button>
  );
}

/* ── Filter Chip (small pill for extra filters row) ─────────────── */
function FilterChip({
  label,
  isSelected,
  isExpanded,
  onClick,
  icon,
}: {
  label: string;
  isSelected: boolean;
  isExpanded: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      className="relative flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold tracking-wide overflow-hidden"
      style={{
        fontFamily: "var(--font-body)",
        color: isExpanded ? C.cream : (isSelected ? C.burnt : "#4E1D02"),
        border: isExpanded
          ? "1.5px solid transparent"
          : isSelected
          ? `1.5px solid ${C.burnt}`
          : "1.5px solid rgba(129,52,5,0.25)",
        background: isExpanded ? "transparent" : "rgba(255,252,245,0.95)",
      }}
    >
      {isExpanded && (
        <motion.span
          layoutId="filter-active-bg"
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(110deg, ${C.brown}, ${C.burnt} 60%, ${C.orange})`,
          }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </motion.button>
  );
}

function parseDeliveryMinutes(deliveryTime: string) {
  const values = deliveryTime.match(/\d+/g)?.map(Number) ?? [];
  return values.length > 0 ? Math.max(...values) : Number.POSITIVE_INFINITY;
}

/* ── Home ───────────────────────────────────────────────────────── */
export function Home() {
  const { restaurants, loading, refetch } = useRestaurants();
  const navigate = useNavigate();
  const { selectedLocation } = useLocationState();
  const { searchQuery, setSearchQuery } = useSearch();
  const [cat, setCat] = useState("All");
  const [selectedFilters, setSelectedFilters] = useState<ExtraFilter[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [expandedFilter, setExpandedFilter] = useState<ExtraFilter | null>(null);
  const [dietaryPlan, setDietaryPlan] = useState<"All" | "Veg" | "Non-Veg" | "Halal">("All");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      refetch(searchQuery);
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, refetch]);

  const toggleFilter = (filter: ExtraFilter) => {
    if (filter === "All") {
      setSelectedFilters([]);
      setMinRating(0);
      setExpandedFilter(null);
      return;
    }

    setExpandedFilter(prev => prev === filter ? null : filter);

    setSelectedFilters((prev) => {
      const isSelected = prev.includes(filter);
      if (isSelected) {
        const next = prev.filter((f) => f !== filter);
        if (filter === "Rating") setMinRating(0);
        return next;
      } else {
        if (filter === "Rating" && minRating === 0) setMinRating(4.0);
        return [...prev, filter];
      }
    });
  };

  const handleBannerCtaClick = (bannerId: string) => {
    if (bannerId === "fallback-1") {
      navigate({
        to: "/restaurant/$id",
        params: { id: "burger-co" },
        search: { offer: "O-204" }
      });
    } else if (bannerId === "fallback-2") {
      navigate({
        to: "/restaurant/$id",
        params: { id: "burger-co" },
        search: { offer: "O-205" }
      });
    }
  };

  const list = useMemo(
    () => {
      let filtered = restaurants.filter(
        (r) =>
          (cat === "All" || r.category === cat) &&
          r.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      filtered = filtered.filter((restaurant) => {
        const matchesRating = restaurant.rating >= minRating;

        const isUnder30Active = selectedFilters.includes("Under 30 min");
        if (isUnder30Active && parseDeliveryMinutes(restaurant.deliveryTime) > 30) {
          return false;
        }

        if (selectedFilters.includes("Open Now") && !isRestaurantOpen(restaurant)) {
          return false;
        }

        if (dietaryPlan === "Veg") {
          const hasVeg = restaurant.menu.some(item =>
            item.name.toLowerCase().includes("veg") ||
            item.name.toLowerCase().includes("paneer") ||
            item.category.toLowerCase().includes("veg")
          );
          if (!hasVeg) return false;
        } else if (dietaryPlan === "Non-Veg") {
          const hasNonVeg = restaurant.menu.some(item =>
            item.name.toLowerCase().includes("chicken") ||
            item.name.toLowerCase().includes("beef") ||
            item.name.toLowerCase().includes("mutton") ||
            item.name.toLowerCase().includes("fish") ||
            item.name.toLowerCase().includes("prawn") ||
            item.name.toLowerCase().includes("seafood")
          );
          if (!hasNonVeg) return false;
        } else if (dietaryPlan === "Halal") {
          const isHalal = restaurant.name.toLowerCase().includes("halal") ||
            restaurant.category.toLowerCase().includes("halal") ||
            restaurant.menu.some(item => item.name.toLowerCase().includes("halal"));
          if (!isHalal) return false;
        }

        const isRatingActive = selectedFilters.includes("Rating");
        if (isRatingActive && restaurant.rating < 4.5 && minRating === 0) {
          return false;
        }

        if (selectedFilters.includes("With Offers") && !restaurant.hasOffer) {
          return false;
        }

        return matchesRating;
      });

      if (selectedFilters.includes("Highest rated")) {
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
      }

      return filtered;
    },
    [restaurants, searchQuery, cat, selectedFilters, minRating, dietaryPlan]
  );

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        background: C.bg,
        fontFamily: "var(--font-body)",
      }}
    >
      {/* NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT */}
      <div className="flex-1">

        {/* HERO */}
        <section
          className="relative overflow-hidden rounded-b-[1rem] md:rounded-b-[80px]"
          style={{ minHeight: 420 }}
        >
          {/* Background */}
          <div className="absolute inset-0">
            <img
              src={homeBack}
              alt=""
              className="w-full h-full object-cover"
            />

            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(18,4,0,0.82) 0%, rgba(18,4,0,0.55) 55%, rgba(18,4,0,0.20) 100%)",
              }}
            />

            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(18,4,0,0.65) 0%, transparent 50%)",
              }}
            />
          </div>

          {/* Hero Content */}
          <div className="relative mx-auto max-w-6xl px-5 pt-12 pb-10 flex flex-col justify-between min-h-[420px]">

            {/* Top Content */}
            <div className="max-w-lg">

              {/* Location */}
              <motion.button
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45 }}
                onClick={() => navigate({ to: "/location" })}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                style={{
                  background: "rgba(248,221,164,0.12)",
                  border: "1px solid rgba(248,221,164,0.22)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <MapPin size={12} style={{ color: C.orange }} />

                <span
                  className="text-xs"
                  style={{ color: "rgba(248,221,164,0.65)" }}
                >
                  Delivering to
                </span>

                <span
                  className="text-xs font-bold flex items-center gap-0.5"
                  style={{ color: C.cream }}
                >
                  {selectedLocation.label} <ChevronDown size={10} />
                </span>
              </motion.button>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[2.6rem] md:text-[3.2rem] font-black leading-[1.03]"
                style={{
                  background: `linear-gradient(135deg, ${C.cream} 0%, ${C.orange} 60%, ${C.burnt} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Trinco's
                <br />
                Finest meals, Delivered hot.
              </motion.h1>

              {/* Mobile Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-8 md:hidden w-full relative z-20"
              >
                <div 
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-2.5 shadow-xl focus-within:bg-white/20 focus-within:border-white/40 transition-all"
                  style={{ backdropFilter: "blur(12px)" }}
                >
                  <Search size={20} style={{ color: C.orange }} />
                  <input
                    type="text"
                    placeholder="Search for food or restaurants..."
                    className="bg-transparent outline-none text-sm w-full text-white placeholder-white/50 font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </motion.div>
            </div>

            <div className="mt-8 flex items-center justify-between sm:justify-start gap-1.5 sm:gap-6">
              <StatBadge
                icon={Flame}
                value="30+"
                label="Restaurants"
                delay={0.4}
              />

              <StatBadge
                icon={Clock}
                value="25m"
                label="Avg delivery"
                delay={0.5}
              />

              <StatBadge
                icon={Star}
                value="4.8"
                label="Avg rating"
                delay={0.6}
              />
            </div>
          </div>
        </section>

        {/* OFFERS BANNER CAROUSEL */}
        {!searchQuery.trim() && <OffersBannerCarousel onCtaClick={handleBannerCtaClick} />}

        {/* 3. FOOD CATEGORIES */}
        <section className="relative z-10 mx-auto max-w-6xl px-4 mt-12 mb-4">
          <div className="flex items-center gap-3 mb-8">
             <div className="h-1 bg-orange-200 flex-1 rounded-full" />
             <h2 className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: C.brown }}>What's on your mind?</h2>
             <div className="h-1 bg-orange-200 flex-1 rounded-full" />
          </div>

          {/* Emoji category scroll */}
          <div className="flex gap-8 overflow-x-auto pt-3 pb-5 px-2" style={{ scrollbarWidth: "none" }}>
            {categories.map((c) => (
              <CatChip
                key={c.name}
                label={c.name}
                image={c.image}
                active={cat === c.name}
                onClick={() => setCat(c.name)}
              />
            ))}
          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
             <FilterChip
                label="All Filters"
                isSelected={selectedFilters.length === 0 && minRating === 0 && dietaryPlan === "All"}
                isExpanded={selectedFilters.length === 0 && minRating === 0 && dietaryPlan === "All"}
                onClick={() => {
                  toggleFilter("All");
                  setDietaryPlan("All");
                }}
              />
              <div
                className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-full whitespace-nowrap"
                style={{ background: "rgba(129,52,5,0.04)", border: "1.5px solid rgba(129,52,5,0.08)" }}
              >
                <div className="flex gap-1.5">
                  {[
                    { name: "Veg", icon: Leaf, color: "#16a34a" },
                    { name: "Non-Veg", icon: Beef, color: "#dc2626" },
                    { name: "Halal", icon: ShieldCheck, color: "#0891b2" }
                  ].map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setDietaryPlan(dietaryPlan === p.name ? "All" : p.name as any)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer"
                      style={{
                        background: dietaryPlan === p.name ? "rgba(212,81,19,0.12)" : "transparent",
                        border: dietaryPlan === p.name ? "1px solid rgba(212,81,19,0.4)" : "1px solid rgba(129,52,5,0.15)",
                        color: dietaryPlan === p.name ? C.burnt : "#4E1D02",
                      }}
                    >
                      <p.icon size={13} style={{ color: dietaryPlan === p.name ? p.color : "#4E1D02" }} />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              {extraFilters.map((filter) => (
                <FilterChip
                  key={filter}
                  label={filter}
                  isSelected={selectedFilters.includes(filter)}
                  isExpanded={expandedFilter === filter}
                  onClick={() => toggleFilter(filter)}
                />
              ))}
          </div>
        </section>

        {/* 4. ⭐ TOP RATED RESTAURANTS */}
        {!searchQuery.trim() && <TopRatedRestaurants />}

        {/* 5. 📍 POPULAR NEAR YOU */}
        {!searchQuery.trim() && <PopularNearYou />}

        {/* 8. 🥘 ALL RESTAURANTS GRID (Filtered) */}
        <section id="all-restaurants" className={`mx-auto max-w-6xl px-4 pb-24 pt-16 ${searchQuery.trim() ? "" : "mt-20 border-t border-[rgba(129,52,5,0.06)]"}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-black mb-2" style={{ color: C.brown }}>
                {searchQuery.trim() ? "Search Results" : "All Restaurants"}
              </h2>
              <p className="text-sm font-medium opacity-60">
                {searchQuery.trim() ? `Showing matches for "${searchQuery}"` : "Hand-picked collection of top local eateries"}
              </p>
            </div>

          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="rounded-[24px] overflow-hidden bg-white/40 border border-orange-100/50 p-4 animate-pulse"
                  style={{ minHeight: 320 }}
                >
                  <div className="w-full h-48 bg-orange-100/40 rounded-[20px] mb-4"></div>
                  <div className="h-6 w-3/4 bg-orange-100/40 rounded-full mb-3"></div>
                  <div className="h-4 w-1/2 bg-orange-100/40 rounded-full mb-2"></div>
                  <div className="h-4 w-1/2 bg-orange-100/40 rounded-full"></div>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" style={{ display: loading ? "none" : "grid" }}>
            {list.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <RestaurantCard r={r} index={i} />
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          <AnimatePresence>
            {!loading && list.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <div className="w-20 h-20 bg-orange-50 rounded-full grid place-items-center mx-auto mb-6">
                   <Search size={32} className="text-orange-300" />
                </div>
                <h3 className="text-xl font-black mb-2" style={{ color: C.brown }}>No matches found</h3>
                <p className="text-sm opacity-60">Try adjusting your filters or search query.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
