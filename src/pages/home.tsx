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
      {/* Emoji circle */}
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

    // Set as expanded when clicked, unless it's already expanded (then collapse)
    setExpandedFilter(prev => prev === filter ? null : filter);

    setSelectedFilters((prev) => {
      const isSelected = prev.includes(filter);
      if (isSelected) {
        // If it was already selected, and we click it again, and it's NOT the expanded one, 
        // we might want to keep it selected but just collapse it?
        // Actually, let's stick to standard toggle:
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

      // Apply all active filters
      filtered = filtered.filter((restaurant) => {
        const matchesRating = restaurant.rating >= minRating;
        
        // Check "Under 30 min" filter
        const isUnder30Active = selectedFilters.includes("Under 30 min");
        if (isUnder30Active && parseDeliveryMinutes(restaurant.deliveryTime) > 30) {
          return false;
        }

        // Open Now filter
        if (selectedFilters.includes("Open Now") && !isRestaurantOpen(restaurant)) {
          return false;
        }

        // Dietary filter (Heuristic: check menu and categories for veg/paneer keywords)
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

        // Check specific rating threshold if "Rating" chip is active
        // (This is separate from the manual slider minRating)
        const isRatingActive = selectedFilters.includes("Rating");
        if (isRatingActive && restaurant.rating < 4.5 && minRating === 0) {
          return false;
        }

        return matchesRating;
      });

      // Handle Sorting filters (only one sorting filter can effectively be applied last)
      if (selectedFilters.includes("Highest rated")) {
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
      }

      return filtered;
    },
    [searchQuery, cat, selectedFilters, minRating]
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
                Trinco’s
                <br />
                Finest meals, Delivered hot.
              </motion.h1>

            </div>

            {/* Stats */}
            <div className="mt-6 flex flex-wrap gap-2">
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

        {/* Categories & Mobile Search */}
        <section className="relative z-10 mx-auto max-w-6xl px-4 mt-6">
          
          {/* MOBILE SEARCH BAR */}
          <div className="lg:hidden mb-6">
            <div 
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
              style={{
                background: "rgba(255,252,245,0.94)",
                backdropFilter: "blur(18px)",
                border: "1.5px solid rgba(248,221,164,0.35)",
              }}
            >
              <Search size={16} style={{ color: C.burnt }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurants in Trinco…"
                className="flex-1 bg-transparent outline-none text-sm font-serif"
                style={{ color: C.brown }}
              />
            </div>
          </div>

          {/* Emoji category scroll */}
          <div className="flex gap-5 overflow-x-auto pb-2 px-1" style={{ scrollbarWidth: "none" }}>
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

          {/* Extra filters row */}
          <div
            className="mt-4 rounded-2xl px-4 py-3"
            style={{
              background: "rgba(255,252,245,0.92)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
                <FilterChip
                  label="All Filters"
                  active={selectedFilters.length === 0 && minRating === 0 && dietaryPlan === "All"}
                  onClick={() => {
                    toggleFilter("All");
                    setDietaryPlan("All");
                  }}
                />

                {/* FOOD PREFERENCE GROUP */}
                <div 
                  className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-full whitespace-nowrap transition-all"
                  style={{
                    background: "rgba(129,52,5,0.04)",
                    border: "1.5px solid rgba(129,52,5,0.08)",
                  }}
                >
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setDietaryPlan(dietaryPlan === "Veg" ? "All" : "Veg")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                      style={{
                        background: dietaryPlan === "Veg" ? "rgba(45,106,79,0.12)" : "transparent",
                        border: dietaryPlan === "Veg" ? "1px solid rgba(45,106,79,0.4)" : "1px solid transparent",
                        color: C.brown,
                      }}
                    >
                      <Leaf size={11} />
                      Veg
                    </button>

                    <button
                      onClick={() => setDietaryPlan(dietaryPlan === "Non-Veg" ? "All" : "Non-Veg")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                      style={{
                        background: dietaryPlan === "Non-Veg" ? "rgba(212,81,19,0.12)" : "transparent",
                        border: dietaryPlan === "Non-Veg" ? "1px solid rgba(212,81,19,0.4)" : "1px solid transparent",
                        color: C.brown,
                      }}
                    >
                      <Flame size={11} />
                      Non-Veg
                    </button>

                    <button
                      onClick={() => setDietaryPlan(dietaryPlan === "Halal" ? "All" : "Halal")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                      style={{
                        background: dietaryPlan === "Halal" ? "rgba(129,52,5,0.08)" : "transparent",
                        border: dietaryPlan === "Halal" ? "1px solid rgba(129,52,5,0.2)" : "1px solid transparent",
                        color: C.brown,
                      }}
                    >
                      <ShieldCheck size={11} />
                      Halal
                    </button>
                  </div>
                </div>

                {extraFilters.map((filter) => (
                  <FilterChip
                    key={filter}
                    label={filter}
                    icon={filter === "Open Now" ? <Clock size={12} /> : null}
                    active={selectedFilters.includes(filter) || expandedFilter === filter}
                    onClick={() => toggleFilter(filter)}
                  />
                ))}
              </div>
              <button
                className="h-8 w-8 rounded-xl grid place-items-center flex-shrink-0"
                style={{ background: "rgba(129,52,5,0.08)" }}
              >
                <SlidersHorizontal size={14} />
              </button>
            </div>
          </div>

          {/* RATING SLIDER FILTER SECTION */}
          <RatingSliderFilter 
            extraFilter={expandedFilter === "Rating" ? "Rating" : "All"}
            setExtraFilter={(val) => {
              if (val === "All") {
                setExpandedFilter(null);
              }
            }}
            minRating={minRating}
            setMinRating={setMinRating}
          />
        </section>

        {/* Restaurants */}
        <section className="mx-auto max-w-6xl px-4 mt-9 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p>No restaurants found.</p>
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
