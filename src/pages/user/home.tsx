import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  ChevronDown,
  SlidersHorizontal,
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

import { type Restaurant, categories as staticCategories } from "@/utils/data/mock";
import { apiRequest } from "@/utils/api";

import catKoththu from "@/assets/kottu.png";
import catFriedRice from "@/assets/fried rice.png";
import catSeafood from "@/assets/seafood.png";
import catBriyani from "@/assets/Briyani.png";
import catBurger from "@/assets/burgur.png";
import catPizza from "@/assets/Pizza.png";
import catSoftDrinks from "@/assets/soft drink.png";
import catJuice from "@/assets/Juice.png";
import catMojito from "@/assets/Mojito.png";
import catMilkshake from "@/assets/Milkshake.png";
import catDesserts from "@/assets/Desserts.png";
import catNoodels from "@/assets/noodles.png";
import riceandCurry from "@/assets/rice and curry.png";

const getCategoryImage = (name: string): string => {
  const n = name.trim().toLowerCase();
  if (n.includes("koththu") || n.includes("kottu")) return catKoththu;
  if (n.includes("noodles") || n.includes("noodels")) return catNoodels;
  if (n.includes("fried rice")) return catFriedRice;
  if (n.includes("seafood") || n.includes("fish")) return catSeafood;
  if (n.includes("briyani") || n.includes("biryani")) return catBriyani;
  if (n.includes("burger")) return catBurger;
  if (n.includes("pizza")) return catPizza;
  if (n.includes("soft drink") || n.includes("drink") || n.includes("beverage")) return catSoftDrinks;
  if (n.includes("juice")) return catJuice;
  if (n.includes("mojito")) return catMojito;
  if (n.includes("milkshake")) return catMilkshake;
  if (n.includes("dessert")) return catDesserts;
  if (n.includes("rice") && n.includes("curry")) return riceandCurry;
  return catFriedRice;
};
import { useRestaurants } from "@/context/RestaurantContext";
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

export function Home() {
  const { filteredRestaurants: list, filteredLoading: loading, fetchFiltered, offers } = useRestaurants();
  const navigate = useNavigate();
  const { selectedLocation } = useLocationState();
  const { searchQuery, setSearchQuery } = useSearch();
  const [cat, setCat] = useState("All");
  const [selectedFilters, setSelectedFilters] = useState<ExtraFilter[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [expandedFilter, setExpandedFilter] = useState<ExtraFilter | null>(null);
  const [dietaryPlan, setDietaryPlan] = useState<"All" | "Veg" | "Non-Veg" | "Halal">("All");

  const hasActiveFilters = searchQuery.trim() !== "" || cat !== "All" || selectedFilters.length > 0 || dietaryPlan !== "All" || minRating > 0;

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const filters: any = {};

      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      if (cat && cat !== "All") {
        filters.category = cat;
      }

      if (selectedFilters.includes("Open Now")) {
        filters.openNow = true;
      }

      if (selectedFilters.includes("Under 30 min")) {
        filters.under30 = true;
      }

      if (selectedFilters.includes("With Offers")) {
        filters.withOffers = true;
      }

      if (selectedFilters.includes("Highest rated")) {
        filters.sortBy = "rating";
        filters.sortOrder = "desc";
      }

      if (selectedFilters.includes("Rating") && minRating > 0) {
        filters.minRating = minRating;
      }

      if (dietaryPlan !== "All") {
        filters.dietary = dietaryPlan.toUpperCase().replace("-", "_");
      }

      fetchFiltered(filters);
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, cat, selectedFilters, minRating, dietaryPlan, fetchFiltered]);

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
    const offer = offers.find(o => o.id === bannerId);
    if (offer) {
      navigate({
        to: "/restaurant/$id",
        params: { id: offer.restaurantId },
        search: { offer: offer.id }
      });
    } else {
      navigate({ to: "/home" });
    }
  };

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
            {staticCategories.map((c) => (
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
        {!hasActiveFilters && <TopRatedRestaurants />}

        {/* 5. 📍 POPULAR NEAR YOU */}
        {!hasActiveFilters && <PopularNearYou />}

        {/* 8. 🥘 ALL RESTAURANTS GRID (Filtered) */}
        <section id="all-restaurants" className={`mx-auto max-w-6xl px-4 pb-24 pt-16 ${hasActiveFilters ? "" : "mt-20 border-t border-[rgba(129,52,5,0.06)]"}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-black mb-2" style={{ color: C.brown }}>
                {searchQuery.trim() ? "Search Results" : hasActiveFilters ? "Filtered Restaurants" : "All Restaurants"}
              </h2>
              <p className="text-sm font-medium opacity-60">
                {searchQuery.trim() ? `Showing matches for "${searchQuery}"` : hasActiveFilters ? "Showing restaurants matching your filters" : "Hand-picked collection of top local eateries"}
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
