import { motion } from "framer-motion";
import { Star, TrendingUp, Award, ChevronRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { type Restaurant } from "@/utils/data/mock";
import { useRestaurants } from "@/context/RestaurantContext";
import { useRef } from "react";
import { isRestaurantOpen, getTodayHours } from "@/utils/time";

import { C } from "@/utils/theme";

/* ── Helpers ─────────────────────────────────────────────────────── */
function getRatingColor(rating: number) {
  if (rating >= 4.5) return { bg: "rgba(34,197,94,0.20)", text: "#16a34a", border: "rgba(34,197,94,0.40)" };
  if (rating >= 4.0) return { bg: "rgba(249,160,63,0.20)", text: "#D45113", border: "rgba(249,160,63,0.45)" };
  return { bg: "rgba(239,68,68,0.18)", text: "#dc2626", border: "rgba(239,68,68,0.35)" };
}

function getBadge(r: Restaurant): { label: string; color: string; bg: string } | null {
  if (r.rating >= 4.8) return { label: "⭐ Top Rated", color: "#92400e", bg: "linear-gradient(110deg,#fef3c7,#fde68a)" };
  if (r.rating >= 4.5) return { label: "🔥 Trending",  color: "#7c2d12", bg: "linear-gradient(110deg,#fed7aa,#fdba74)" };
  if (r.hasOffer)      return { label: "🎁 Offer",      color: "#4d7c0f", bg: "linear-gradient(110deg,#d9f99d,#bef264)" };
  return null;
}

/* ── Single Card ─────────────────────────────────────────────────── */
function TopRestaurantCard({ r, index }: { r: Restaurant; index: number }) {
  const navigate  = useNavigate();
  const badge     = getBadge(r);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -8, transition: { duration: 0.25 } }}
      className="flex-shrink-0 cursor-pointer w-[240px] sm:w-[280px]"
      onClick={() => navigate({ to: "/restaurant/$id", params: { id: r.id } })}
    >
      <div
        className="rounded-[20px] overflow-hidden bg-white text-left"
        style={{
          boxShadow: "0 4px 24px rgba(129,52,5,0.08), 0 1px 4px rgba(129,52,5,0.04)",
          border: "1.5px solid rgba(249,160,63,0.15)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 14px 44px rgba(212,81,19,0.18), 0 4px 12px rgba(129,52,5,0.10)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 4px 24px rgba(129,52,5,0.08), 0 1px 4px rgba(129,52,5,0.04)";
        }}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden" style={{ height: 160 }}>
          <motion.img
            src={r.image}
            alt={r.name}
            loading="lazy"
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.07 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />

          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(10,3,0,0.4) 0%, transparent 60%)",
            }}
          />

          {/* Rating badge – top left */}
          <div
            className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(4px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <Star size={11} className="fill-orange-500 text-orange-500" />
            <span className="text-[11px] font-black text-slate-800">
              {r.rating.toFixed(1)}
            </span>
          </div>

          {/* Trend / Top Rated badge – top right */}
          {badge && (
            <div
              className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </div>
          )}
        </div>

        {/* Content Block */}
        <div className="p-4 flex flex-col justify-between" style={{ minHeight: 130 }}>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-[#D45113] mb-1">
              {r.category}
            </div>
            <h3
              className="font-black text-[1.05rem] leading-snug truncate"
              style={{ color: "#3B1700" }}
            >
              {r.name}
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold truncate mt-1">
              📍 {r.location}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 mt-3 pt-2.5 border-t border-[#F8DDA4]/20 text-[11px] font-bold text-[#813405]/75">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">⏱️ {r.deliveryTime}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase ${
                  isRestaurantOpen(r)
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-red-50 text-red-650 border border-red-100"
                }`}
              >
                {isRestaurantOpen(r) ? "Open" : "Closed"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold mt-0.5">
              <span>🕒 {getTodayHours(r)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Top Rated Section ───────────────────────────────────────────── */
export function TopRatedRestaurants() {
  const { restaurants } = useRestaurants();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Top 4 by rating, excluding unpublished or vacationing restaurants
  const topRestaurants = [...restaurants]
    .filter(r => r.showPublicly !== false && r.vacationMode !== true)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-6xl px-4 mt-10 mb-2">
      {/* ── Section Header ── */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="flex items-center gap-2 mb-1.5"
          >
            <div
              className="h-8 w-8 rounded-xl grid place-items-center"
              style={{ background: `linear-gradient(135deg, ${C.burnt}, ${C.orange})` }}
            >
              <Award size={15} color="#fff" />
            </div>
            <span
              className="text-[11px] font-black uppercase tracking-[0.12em]"
              style={{ color: C.burnt }}
            >
              Curated Picks
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="text-[1.65rem] font-black leading-tight"
            style={{ color: C.brown }}
          >
            ⭐ Top Rated Restaurants
            <br />
            <span
              className="text-[1.45rem]"
              style={{
                background: `linear-gradient(110deg, ${C.burnt}, ${C.orange})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              in Trincomalee
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="text-sm mt-1.5 font-medium"
            style={{ color: "rgba(129,52,5,0.60)" }}
          >
            Discover the highest-rated local favorites loved by customers.
          </motion.p>
        </div>

        {/* Scroll arrows */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => scroll("left")}
            className="h-9 w-9 rounded-full grid place-items-center transition-all"
            style={{
              background: "rgba(255,252,248,0.94)",
              border: "1.5px solid rgba(212,81,19,0.20)",
              color: C.burnt,
            }}
            aria-label="Scroll left"
          >
            <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="h-9 w-9 rounded-full grid place-items-center transition-all"
            style={{
              background: "rgba(255,252,248,0.94)",
              border: "1.5px solid rgba(212,81,19,0.20)",
              color: C.burnt,
            }}
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Glassmorphism container ── */}
      <div
        className="relative rounded-[28px] p-3 sm:p-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,248,236,0.92) 0%, rgba(255,240,210,0.80) 100%)",
          backdropFilter: "blur(24px)",
          border: "1.5px solid rgba(249,160,63,0.22)",
          boxShadow:
            "0 8px 40px rgba(129,52,5,0.08), inset 0 1px 0 rgba(255,255,255,0.60)",
        }}
      >
        {/* Info bar */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-4">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={13} style={{ color: C.orange }} />
            <span className="text-[10px] sm:text-[11px] font-black" style={{ color: C.burnt }}>
              Based on customer reviews
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="hidden sm:block h-1 w-1 rounded-full" style={{ background: C.orange }} />
            <span className="text-[10px] sm:text-[11px]" style={{ color: "rgba(129,52,5,0.50)" }}>
              Updated daily
            </span>
          </div>
        </div>

        {/* ── Horizontal scroll track ── */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {topRestaurants.map((r, i) => (
            <TopRestaurantCard key={r.id} r={r} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
