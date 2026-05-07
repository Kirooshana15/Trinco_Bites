import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  ChevronDown,
  SlidersHorizontal,
  Flame,
  Star,
  Clock,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSearch } from "@/context/SearchContext";

import { Navbar } from "@/components/Navbar";
import { RestaurantCard } from "@/components/RestaurantCard";
import { Footer } from "@/components/Footer";
import { useLocationState } from "@/context/LocationContext";
import { OffersBadge } from "@/components/OffersBadge";

import { restaurants, categories, type Restaurant } from "@/utils/data/mock";
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
  "Offers",
  "Under 30 min",
  "Highest rated",
  "Rating",
  "Price",
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
          fontFamily: "Georgia, serif",
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
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      className="relative flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold tracking-wide overflow-hidden"
      style={{
        fontFamily: "Georgia, serif",
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
      <span className="relative z-10">{label}</span>
    </motion.button>
  );
}

function parseDeliveryMinutes(deliveryTime: string) {
  const values = deliveryTime.match(/\d+/g)?.map(Number) ?? [];
  return values.length > 0 ? Math.max(...values) : Number.POSITIVE_INFINITY;
}

function getAveragePrice(restaurant: Restaurant) {
  return (
    restaurant.menu.reduce((sum, item) => sum + item.price, 0) /
    restaurant.menu.length
  );
}

/* ── Home ───────────────────────────────────────────────────────── */
export function Home() {
  const navigate = useNavigate();
  const { selectedLocation } = useLocationState();
  const { searchQuery, setSearchQuery } = useSearch();
  const [cat, setCat] = useState("All");
  const [extraFilter, setExtraFilter] = useState<ExtraFilter>("All");

  const list = useMemo(
    () => {
      const filtered = restaurants.filter(
        (r) =>
          (cat === "All" || r.category === cat) &&
          r.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const nextList = filtered.filter((restaurant) => {
        if (extraFilter === "Offers") {
          return restaurant.hasOffer;
        }
        if (extraFilter === "Under 30 min") {
          return parseDeliveryMinutes(restaurant.deliveryTime) <= 30;
        }
        if (extraFilter === "Rating") {
          return restaurant.rating >= 4.7;
        }
        return true;
      });

      if (extraFilter === "Highest rated") {
        return [...nextList].sort((a, b) => b.rating - a.rating);
      }

      if (extraFilter === "Price") {
        return [...nextList].sort(
          (a, b) => getAveragePrice(a) - getAveragePrice(b)
        );
      }

        return nextList;
    },
    [searchQuery, cat, extraFilter]
  );

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        background: C.bg,
        fontFamily: "Georgia, 'Times New Roman', serif",
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
                  active={extraFilter === "All"}
                  onClick={() => setExtraFilter("All")}
                />
                {extraFilters.map((filter) => (
                  <FilterChip
                    key={filter}
                    label={filter}
                    active={extraFilter === filter}
                    onClick={() => setExtraFilter(filter)}
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
