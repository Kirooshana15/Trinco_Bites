import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { Slider } from "@/components/ui/slider";

/**
 * RatingSliderFilter — TrincoBites warm-glass edition
 *
 * Props:
 *   extraFilter    {string}  — current active filter tab
 *   setExtraFilter {fn}      — setter for active filter tab
 *   minRating      {number}  — current min rating (0–5)
 *   setMinRating   {fn}      — setter for min rating
 */
interface RatingSliderFilterProps {
  extraFilter: string;
  setExtraFilter: (val: any) => void;
  minRating: number;
  setMinRating: (val: number) => void;
}

export function RatingSliderFilter({
  extraFilter,
  setExtraFilter,
  minRating,
  setMinRating,
}: RatingSliderFilterProps) {
  return (
    <AnimatePresence>
      {extraFilter === "Rating" && (
        <motion.div
          key="rating-filter"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 px-1 flex justify-center"
        >
          <div
            className="w-full max-w-xl rounded-3xl p-7 relative overflow-hidden"
            style={{
              background: "rgba(255, 252, 245, 0.82)",
              backdropFilter: "blur(32px) saturate(180%)",
              WebkitBackdropFilter: "blur(32px) saturate(180%)",
              border: "1px solid rgba(129, 52, 5, 0.12)",
              boxShadow:
                "0 12px 40px rgba(129, 52, 5, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
            }}
          >
            {/* Warm ambient glow — top right */}
            <div
              className="absolute -top-16 -right-16 w-52 h-52 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(212,81,19,0.15) 0%, transparent 70%)",
              }}
            />
            {/* Subtle warm shimmer — bottom left */}
            <div
              className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(248,180,80,0.07) 0%, transparent 70%)",
              }}
            />

            {/* ── Header ───────────────────────────── */}
            <div className="relative z-10 flex items-center justify-between mb-8">
              <div className="flex items-center gap-3.5">
                <motion.div
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #C04A10 0%, #E8722A 100%)",
                    boxShadow:
                      "0 4px 16px rgba(180,60,10,0.45), inset 0 1px 0 rgba(255,200,140,0.2)",
                  }}
                >
                  <Star size={17} fill="white" color="white" />
                </motion.div>

                <div>
                  <p
                    className="text-sm font-bold leading-none"
                    style={{ color: "#813405" }}
                  >
                    Rating Filter
                  </p>
                  <p
                    className="text-[11px] mt-1.5 leading-none font-medium"
                    style={{ color: "rgba(129, 52, 5, 0.45)" }}
                  >
                    Show only top-rated spots
                  </p>
                </div>
              </div>

              {/* Live value badge */}
              <motion.div
                key={minRating > 0 ? "active" : "inactive"}
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wide"
                style={{
                  background:
                    minRating > 0
                      ? "rgba(212, 81, 19, 0.12)"
                      : "rgba(129, 52, 5, 0.05)",
                  border: `1px solid ${minRating > 0
                    ? "rgba(212, 81, 19, 0.3)"
                    : "rgba(129, 52, 5, 0.1)"
                    }`,
                  color:
                    minRating > 0 ? "#D45113" : "rgba(129, 52, 5, 0.4)",
                  transition: "background 0.3s, border-color 0.3s, color 0.3s",
                }}
              >
                {minRating > 0
                  ? `${minRating.toFixed(1)}+ stars`
                  : "All ratings"}
              </motion.div>
            </div>

            {/* ── Slider ───────────────────────────── */}
            <div className="relative z-10 px-0.5">
              <Slider
                value={[minRating]}
                max={5}
                step={0.1}
                onValueChange={(val) => setMinRating(val[0])}
                className="cursor-pointer py-3"
              />

              {/* Star tick marks */}
              <div className="flex justify-between mt-5">
                {[1, 2, 3, 4, 5].map((val) => {
                  const active = minRating >= val;
                  return (
                    <motion.button
                      key={val}
                      onClick={() =>
                        setMinRating(val === Math.round(minRating) ? 0 : val)
                      }
                      animate={{ opacity: active ? 1 : 0.65 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="flex flex-col items-center gap-1.5 focus:outline-none"
                    >
                      <span
                        className="text-sm leading-none"
                        style={{
                          color: active ? "#D45113" : "rgba(129, 52, 5, 0.55)",
                          transition: "color 0.3s ease",
                        }}
                      >
                        ★
                      </span>
                      <span
                        className="text-[10px] font-bold tabular-nums"
                        style={{
                          color: active ? "#D45113" : "rgba(129, 52, 5, 0.65)",
                          transition: "color 0.3s ease",
                        }}
                      >
                        {val}.0
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Warm divider — only when reset button is visible */}
            <AnimatePresence>
              {minRating > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10 mt-7"
                  style={{
                    height: "1px",
                    background:
                      "linear-gradient(to right, transparent, rgba(129, 52, 5, 0.1), transparent)",
                  }}
                />
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}