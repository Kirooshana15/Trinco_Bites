import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  ChevronDown,
  SlidersHorizontal,
  Flame,
  Star,
  Clock,
  Leaf,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import React, { useState, useMemo } from "react";
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
import { RecentlyAdded } from "@/components/RecentlyAdded";

import { restaurants, categories, type Restaurant } from "@/utils/data/mock";
import { isRestaurantOpen } from "@/utils/time";
import homeBack from "@/utils/assets/home-back.jpg";

/* ── Palette ─────────────────────────────────────────────────────── */
const C = {
  brown: "#813405",
  burnt: "#D45113",
  orange: "#F9A03F",
  cream: "#F8DDA4",
  olive: "#606C38",
  bg: "#F7F0E3",
} as const;

const extraFilters = [
  "Open Now",
  "Under 30 min",
  "Highest rated",
  "Rating",
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
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
      style={{
        background: "rgba(255,252,245,0.12)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(248,221,164,0.20)",
      }}
    >
      <div
        className="h-7 w-7 rounded-xl grid place-items-center flex-shrink-0"
        style={{ background: "rgba(212,81,19,0.35)" }}
      >
        <Icon size={13} style={{ color: C.cream }} />
      </div>

      <div>
        <p
          className="text-sm font-black leading-none"
          style={{ color: C.cream }}
        >
          {value}
        </p>

        <p
          className="text-[10px] mt-0.5 leading-none"
          style={{ color: "rgba(248,221,164,0.55)" }}
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
        className="text-[11px] font-semibold leading-tight text-center"
        style={{
          color: active ? C.burnt : C.brown,
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
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
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
        color: active ? C.cream : C.brown,
        border: active ? "none" : "1.5px solid rgba(129,52,5,0.16)",
        background: active ? "transparent" : "rgba(255,252,245,0.85)",
      }}
    >
      {active && (
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
  const navigate = useNavigate();
  const { selectedLocation } = useLocationState();
  const { searchQuery, setSearchQuery } = useSearch();
  const [cat, setCat] = useState("All");
  const [selectedFilters, setSelectedFilters] = useState<ExtraFilter[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [expandedFilter, setExpandedFilter] = useState<ExtraFilter | null>(null);
  const [dietaryPlan, setDietaryPlan] = useState<"All" | "Veg" | "Non-Veg" | "Halal">("All");

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

        return matchesRating;
      });

      if (selectedFilters.includes("Highest rated")) {
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
      }

      return filtered;
    },
    [searchQuery, cat, selectedFilters, minRating, dietaryPlan]
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



            </div>

            {/* Stats */}
            <div className="mt-8 flex flex-wrap gap-2">
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
        <OffersBannerCarousel />

        {/* 3. FOOD CATEGORIES */}
        <section className="relative z-10 mx-auto max-w-6xl px-4 mt-12 mb-4">
          <div className="flex items-center gap-3 mb-8">
             <div className="h-1 bg-orange-200 flex-1 rounded-full" />
             <h2 className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: C.brown }}>What's on your mind?</h2>
             <div className="h-1 bg-orange-200 flex-1 rounded-full" />
          </div>

          {/* Emoji category scroll */}
          <div className="flex gap-8 overflow-x-auto pb-4 px-1" style={{ scrollbarWidth: "none" }}>
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
        </section>

        {/* 4. ⭐ TOP RATED RESTAURANTS */}
        <TopRatedRestaurants />

        {/* 5. 📍 POPULAR NEAR YOU */}
        <PopularNearYou />

        {/* 7. 🆕 RECENTLY ADDED */}
        <RecentlyAdded />

        {/* 8. 🥘 ALL RESTAURANTS GRID (Filtered) */}
        <section className="mx-auto max-w-6xl px-4 mt-20 pb-24 border-t border-[rgba(129,52,5,0.06)] pt-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-black mb-2" style={{ color: C.brown }}>All Restaurants</h2>
              <p className="text-sm font-medium opacity-60">Hand-picked collection of top local eateries</p>
            </div>

            {/* Filter Chips row (Existing filters) */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0" style={{ scrollbarWidth: "none" }}>
               <FilterChip
                  label="All Filters"
                  active={selectedFilters.length === 0 && minRating === 0 && dietaryPlan === "All"}
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
                    {["Veg", "Non-Veg", "Halal"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setDietaryPlan(dietaryPlan === p ? "All" : p as any)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                        style={{
                          background: dietaryPlan === p ? "rgba(212,81,19,0.12)" : "transparent",
                          border: dietaryPlan === p ? "1px solid rgba(212,81,19,0.4)" : "1px solid transparent",
                          color: C.brown,
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                {extraFilters.map((filter) => (
                  <FilterChip
                    key={filter}
                    label={filter}
                    active={selectedFilters.includes(filter) || expandedFilter === filter}
                    onClick={() => toggleFilter(filter)}
                  />
                ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
            {list.length === 0 && (
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
