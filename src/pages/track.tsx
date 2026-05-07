import { Link } from "@tanstack/react-router";
import { motion, useAnimation, animate } from "framer-motion";
import {
  Check, ChefHat, Bike, PackageCheck, Receipt,
  ThumbsUp, MapPin, Phone, MessageCircle, Star,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// ── Order steps ──────────────────────────────────────────────────────────────
const steps = [
  { label: "Order Received", icon: Receipt },
  { label: "Out for Delivery", icon: Bike },
  { label: "Delivered", icon: PackageCheck },
];

// ── Fake road path (SVG polyline points, delivery → you) ─────────────────────
// The path goes from top-left to bottom-right with a realistic road curve
const PATH = "M 60,50 C 100,50 120,90 160,100 S 220,130 260,140 S 300,160 330,180";

export function Track() {
  const [active, setActive] = useState(0);
  const [eta, setEta] = useState(18);
  const bikeRef = useRef<SVGCircleElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const riderAnim = useAnimation();

  // ── Auto advance steps ────────────────────────────────────────────────────
  useEffect(() => {
    if (active >= steps.length - 1) return;
    const t = setTimeout(() => setActive((a) => a + 1), 2200);
    return () => clearTimeout(t);
  }, [active]);

  // ── ETA countdown once out for delivery ──────────────────────────────────
  useEffect(() => {
    if (active < 1) return;
    if (eta <= 0) return;
    const t = setInterval(() => setEta((e) => Math.max(0, e - 1)), 60_000);
    return () => clearInterval(t);
  }, [active, eta]);

  // ── Animate rider along SVG path when out for delivery ───────────────────
  useEffect(() => {
    if (active < 1 || !pathRef.current || !bikeRef.current) return;

    const path = pathRef.current;
    const total = path.getTotalLength();
    let frame = 0;
    let raf: number;

    const tick = () => {
      frame += 0.4;
      if (frame > total) frame = 0;
      const pt = path.getPointAtLength(frame);
      if (bikeRef.current) {
        bikeRef.current.setAttribute("cx", String(pt.x));
        bikeRef.current.setAttribute("cy", String(pt.y));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const outForDelivery = active >= 1;
  const delivered = active === steps.length - 1;
  const orderId = useRef(`TRC-${Math.floor(Math.random() * 9000 + 1000)}`);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#F7F0E3" }}>
      <Navbar />

      <div className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6 pb-16 space-y-4">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#813405]">Track Order</h1>
            <p className="text-xs text-[#813405]/40 font-semibold mt-0.5">
              Order #{orderId.current}
            </p>
          </div>
          {outForDelivery && !delivered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-end"
            >
              <span className="text-[10px] uppercase tracking-widest font-black text-[#813405]/40">ETA</span>
              <span className="text-2xl font-black text-[#D45113] leading-none">{eta} min</span>
            </motion.div>
          )}
        </div>

        {/* ── MAP CARD ────────────────────────────────────────────────────── */}
        <div
          className="rounded-[28px] overflow-hidden relative"
          style={{
            height: 280,
            background: "linear-gradient(160deg, #FDF0DE 0%, #F5E6CC 100%)",
            boxShadow: "0 8px 40px rgba(129,52,5,0.12)",
            border: "1px solid rgba(248,221,164,0.4)",
          }}
        >
          {/* Grid road pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-30"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
                <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#D45113" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Road blocks decoration */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Block fills */}
            <rect x="10" y="10" width="80" height="40" rx="6" fill="rgba(212,81,19,0.06)" />
            <rect x="110" y="10" width="60" height="40" rx="6" fill="rgba(212,81,19,0.06)" />
            <rect x="200" y="10" width="90" height="40" rx="6" fill="rgba(212,81,19,0.06)" />
            <rect x="10" y="110" width="70" height="50" rx="6" fill="rgba(212,81,19,0.06)" />
            <rect x="170" y="110" width="80" height="50" rx="6" fill="rgba(212,81,19,0.06)" />
            <rect x="270" y="80" width="70" height="40" rx="6" fill="rgba(212,81,19,0.06)" />
            <rect x="100" y="170" width="90" height="40" rx="6" fill="rgba(212,81,19,0.06)" />
            <rect x="220" y="160" width="100" height="50" rx="6" fill="rgba(212,81,19,0.06)" />

            {/* Road path (dashed) */}
            <path
              ref={pathRef}
              d={PATH}
              fill="none"
              stroke="#D45113"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="8 6"
              opacity="0.35"
            />

            {/* Animated pulse ring at destination */}
            <motion.circle
              cx="330" cy="180" r="18"
              fill="none"
              stroke="#D45113"
              strokeWidth="2"
              animate={{ r: [12, 26], opacity: [0.6, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
            />
            <motion.circle
              cx="330" cy="180" r="12"
              fill="none"
              stroke="#D45113"
              strokeWidth="2"
              animate={{ r: [8, 20], opacity: [0.8, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut", delay: 0.4 }}
            />

            {/* Destination pin dot */}
            <circle cx="330" cy="180" r="6" fill="#813405" />

            {/* Rider dot — animated along path when out for delivery */}
            {outForDelivery && !delivered ? (
              <circle ref={bikeRef} cx="60" cy="50" r="10" fill="#D45113" />
            ) : (
              /* Idle bounce at start */
              !outForDelivery && (
                <motion.circle
                  cx="60" cy="50" r="10"
                  fill="#D45113"
                  animate={{ cy: [50, 44, 50] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                />
              )
            )}

            {/* Rider emoji label */}
            {outForDelivery && !delivered && (
              <text
                ref={(el) => {
                  // mirror position to bikeRef once it moves
                }}
                x="60" y="50"
                fontSize="14"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                🛵
              </text>
            )}
          </svg>

          {/* Rider emoji layer (HTML, follows path via JS) */}
          {outForDelivery && !delivered && (
            <RiderEmoji pathEl={pathRef} />
          )}

          {/* "You are here" label */}
          <div
            className="absolute flex flex-col items-center"
            style={{ bottom: 28, right: 46 }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg,#813405,#D45113)" }}
            >
              <MapPin size={16} className="text-white" fill="white" />
            </div>
            <span
              className="text-[9px] font-black mt-1 px-2 py-0.5 rounded-full"
              style={{ background: "#813405", color: "#F8DDA4" }}
            >
              YOU
            </span>
          </div>

          {/* Delivered overlay */}
          {delivered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ background: "rgba(247,240,227,0.88)", backdropFilter: "blur(6px)" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl"
                style={{ background: "linear-gradient(135deg,#D45113,#813405)" }}
              >
                <Check size={28} className="text-white" strokeWidth={3} />
              </motion.div>
              <p className="font-black text-[#813405] text-lg">Delivered! 🎉</p>
            </motion.div>
          )}

          {/* Status chip */}
          {!delivered && (
            <div
              className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
              style={{
                background: outForDelivery
                  ? "linear-gradient(135deg,#D45113,#813405)"
                  : "rgba(129,52,5,0.1)",
                color: outForDelivery ? "#F8DDA4" : "#813405",
                boxShadow: outForDelivery ? "0 4px 14px rgba(212,81,19,0.3)" : "none",
              }}
            >
              {outForDelivery ? "🛵 On the way" : "⏳ Preparing"}
            </div>
          )}
        </div>

        {/* ── Delivery partner card ────────────────────────────────────────── */}
        {outForDelivery && !delivered && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="rounded-[24px] p-4 flex items-center gap-4"
            style={{
              background: "linear-gradient(135deg,#ffffff,#FDF6EC)",
              border: "1px solid rgba(248,221,164,0.5)",
              boxShadow: "0 4px 24px rgba(129,52,5,0.08)",
            }}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner"
                style={{ background: "linear-gradient(135deg,#D45113,#813405)", color: "#F8DDA4" }}
              >
                K
              </div>
              {/* Online dot */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                style={{ background: "#22c55e" }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-black text-[#813405] text-sm">Kasun Perera</p>
              <p className="text-[11px] text-[#813405]/50 font-semibold">Honda Scooter • WP-CAR-1234</p>
              {/* Star rating */}
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={9} fill={s <= 4 ? "#F9A03F" : "none"} stroke="#F9A03F" />
                ))}
                <span className="text-[9px] text-[#813405]/40 ml-1 font-bold">4.8</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(212,81,19,0.1)",
                  color: "#D45113",
                }}
              >
                <MessageCircle size={16} />
              </button>
              <button
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                style={{
                  background: "linear-gradient(135deg,#D45113,#813405)",
                  boxShadow: "0 4px 12px rgba(212,81,19,0.3)",
                }}
              >
                <Phone size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step tracker ─────────────────────────────────────────────────── */}
        <div
          className="rounded-[24px] p-5"
          style={{
            background: "linear-gradient(160deg,#ffffff,#FDF6EC)",
            border: "1px solid rgba(248,221,164,0.4)",
            boxShadow: "0 4px 24px rgba(129,52,5,0.06)",
          }}
        >
          {steps.map((s, i) => {
            const done = i < active;
            const cur = i === active;
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex gap-4 items-start relative pb-5 last:pb-0">
                {/* connector line */}
                {i < steps.length - 1 && (
                  <div
                    className="absolute top-10 bottom-0 w-0.5"
                    style={{ left: 19, background: done ? "#D45113" : "rgba(248,221,164,0.6)" }}
                  />
                )}

                {/* Step icon */}
                <motion.div
                  animate={cur ? { scale: [1, 1.12, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                  style={{
                    background: done
                      ? "linear-gradient(135deg,#D45113,#813405)"
                      : cur
                        ? "linear-gradient(135deg,#F9A03F,#D45113)"
                        : "rgba(248,221,164,0.3)",
                    boxShadow: cur ? "0 0 0 4px rgba(212,81,19,0.15)" : "none",
                  }}
                >
                  {done
                    ? <Check size={16} className="text-white" strokeWidth={3} />
                    : <Icon size={16} style={{ color: cur ? "#fff" : "#C4A07A" }} />
                  }
                </motion.div>

                {/* Label */}
                <div className="pt-2.5 flex-1">
                  <p
                    className="text-sm font-black leading-none"
                    style={{
                      color: done ? "#813405" : cur ? "#D45113" : "#C4A07A",
                    }}
                  >
                    {s.label}
                  </p>
                  {cur && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] mt-1 font-semibold"
                      style={{ color: "#D45113" }}
                    >
                      In progress...
                    </motion.p>
                  )}
                </div>

                {/* Timestamp for done steps */}
                {done && (
                  <span className="text-[9px] font-bold pt-3" style={{ color: "#C4A07A" }}>
                    ✓ Done
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── View receipt ──────────────────────────────────────────────────── */}
        {delivered && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center pt-2"
          >
            <Link
              to="/success"
              className="inline-flex items-center gap-2 text-white font-black px-8 py-4 rounded-2xl text-sm uppercase tracking-widest relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg,#D45113,#813405)",
                boxShadow: "0 8px 28px rgba(212,81,19,0.35)",
              }}
            >
              <span className="absolute inset-x-0 top-0 h-1/2 bg-white/10 rounded-t-2xl" />
              🧾 View Receipt
            </Link>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}

// ── Rider emoji that actually follows the SVG path via rAF ─────────────────
function RiderEmoji({ pathEl }: { pathEl: React.RefObject<SVGPathElement | null> }) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const path = pathEl.current;
    const div = divRef.current;
    if (!path || !div) return;

    const svgEl = path.ownerSVGElement!;
    const total = path.getTotalLength();
    let frame = 0;
    let raf: number;

    const tick = () => {
      frame = (frame + 0.4) % total;
      const pt = path.getPointAtLength(frame);
      const ptNext = path.getPointAtLength(Math.min(frame + 1, total));
      const angle = Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x) * (180 / Math.PI);

      // Convert SVG coords → container-relative px
      const svgRect = svgEl.getBoundingClientRect();
      const vb = svgEl.viewBox.baseVal;
      const scaleX = svgRect.width / (vb.width || svgRect.width);
      const scaleY = svgRect.height / (vb.height || svgRect.height);

      div.style.left = `${pt.x * scaleX - 14}px`;
      div.style.top = `${pt.y * scaleY - 14}px`;
      div.style.transform = `rotate(${angle}deg)`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pathEl]);

  return (
    <div
      ref={divRef}
      className="absolute text-2xl pointer-events-none"
      style={{ left: 46, top: 36, transition: "none" }}
    >
      🛵
    </div>
  );
}