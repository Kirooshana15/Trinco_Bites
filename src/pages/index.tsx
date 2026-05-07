import { useNavigate } from "@tanstack/react-router";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import logo from "@/utils/assets/logo.png";
import food1 from "@/utils/assets/food-1.jpg";
import food2 from "@/utils/assets/food-2.jpg";
import food3 from "@/utils/assets/food-3.jpg";
import food4 from "@/utils/assets/food-4.jpg";

/* ── Palette ────────────────────────────────────────────────────────── */
const C = {
  brown: "#813405",
  burnt: "#D45113",
  orange: "#F9A03F",
  cream: "#F8DDA4",
  olive: "#606C38",
} as const;

const FOOD_IMAGES = [food1, food2, food3, food4];

type BackgroundFood = {
  image: string;
  top: string;
  left: string;
  size: number;
  rotate: number;
  delay: number;
  duration: number;
};

function createBackgroundFoods(count: number): BackgroundFood[] {
  return Array.from({ length: count }, (_, index) => ({
    image: FOOD_IMAGES[Math.floor(Math.random() * FOOD_IMAGES.length)],
    top: `${8 + Math.random() * 74}%`,
    left: `${4 + Math.random() * 82}%`,
    size: 90 + Math.round(Math.random() * 70),
    rotate: -20 + Math.round(Math.random() * 40),
    delay: index * 0.2,
    duration: 7 + Math.random() * 4,
  }));
}

/* ─── Floating orb ─────────────────────────────────────────────────── */
function Orb({ cx, cy, r, color, delay }: {
  cx: string; cy: string; r: string; color: string; delay: number;
}) {
  return (
    <motion.circle
      cx={cx} cy={cy} r={r} fill={color}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: [0.2, 0.38, 0.2], scale: [0.95, 1.08, 0.95] }}
      transition={{ delay, duration: 5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ─── Main component ────────────────────────────────────────────────── */
export function Splash() {
  const navigate = useNavigate();
  const progress = useMotionValue(0);
  const [pct, setPct] = useState(0);
  const [backgroundFoods] = useState<BackgroundFood[]>(() => createBackgroundFoods(10));
  const barWidth = useTransform(progress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const controls = animate(progress, 1, {
      duration: 7.5,
      ease: "easeInOut",
      onUpdate: (v) => setPct(Math.round(v * 100)),
    });
    const t = setTimeout(() => navigate({ to: "/onboarding" }), 7500);
    return () => { controls.stop(); clearTimeout(t); };
  }, [navigate, progress]);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.18, delayChildren: 0.35 } },
  };
  const item = {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 3, ease: "easeOut" as const } },
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden grid place-items-center bg-gradient-soft"
    >

      {/* ── SVG ambient orbs ─────────────────────────────────────── */}
      <svg className="pointer-events-none absolute inset-0 w-full h-full" aria-hidden>
        <defs>
          <filter id="blur-orb">
            <feGaussianBlur stdDeviation="60" />
          </filter>
        </defs>
        <g filter="url(#blur-orb)">
          <Orb cx="15%" cy="20%" r="180" color={C.burnt} delay={0} />
          <Orb cx="85%" cy="15%" r="140" color={C.orange} delay={0.8} />
          <Orb cx="70%" cy="80%" r="200" color={C.olive} delay={1.2} />
          <Orb cx="10%" cy="75%" r="120" color={C.brown} delay={0.4} />
        </g>
      </svg>

      {/* ── Wave decoration ──────────────────────────────────────── */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        aria-hidden
      >
        <motion.path
          d="M0,60 C240,120 480,0 720,70 C960,140 1200,20 1440,80 L1440,140 L0,140 Z"
          fill="rgba(212,81,19,0.10)"
          animate={{
            d: [
              "M0,60 C240,120 480,0 720,70 C960,140 1200,20 1440,80 L1440,140 L0,140 Z",
              "M0,80 C240,20 480,110 720,50 C960,0 1200,100 1440,60 L1440,140 L0,140 Z",
              "M0,60 C240,120 480,0 720,70 C960,140 1200,20 1440,80 L1440,140 L0,140 Z",
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M0,90 C360,40 720,130 1080,60 C1260,30 1380,90 1440,100 L1440,140 L0,140 Z"
          fill="rgba(96,108,56,0.14)"
          animate={{
            d: [
              "M0,90 C360,40 720,130 1080,60 C1260,30 1380,90 1440,100 L1440,140 L0,140 Z",
              "M0,70 C360,120 720,40 1080,100 C1260,130 1380,50 1440,80 L1440,140 L0,140 Z",
              "M0,90 C360,40 720,130 1080,60 C1260,30 1380,90 1440,100 L1440,140 L0,140 Z",
            ]
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>



      {/* ── Content ───────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex flex-col items-center px-8 text-center"
        variants={container}
        initial="hidden"
        animate="show"
      >

        {/* Logo */}
        <motion.div variants={item}>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            className="relative mx-auto h-28 w-28"
          >
            {/* Glow ring — burnt orange */}
            <motion.span
              className="absolute inset-0 rounded-3xl"
              animate={{
                boxShadow: [
                  `0 0 0 0px rgba(212,81,19,0.6)`,
                  `0 0 0 18px rgba(212,81,19,0)`,
                ]
              }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
            />
            <div
              className="h-full w-full rounded-3xl overflow-hidden grid place-items-center"
              style={{
                background: "rgba(248,221,164,0.07)",
                backdropFilter: "blur(16px)",
                border: `1px solid rgba(212,81,19,0.35)`,
                boxShadow: `0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(248,221,164,0.12)`,
              }}
            >
              <img src={logo} alt="Trinco Rides" className="h-full w-full object-cover" />
            </div>
          </motion.div>
        </motion.div>

        {/* Wordmark */}
        <motion.div variants={item} className="mt-7">
          <h1
            className="text-5xl font-black tracking-tight leading-none"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              color: "#813405",
              filter: `drop-shadow(0 2px 14px rgba(212,81,19,0.45))`,
            }}
          >
            Trinco Bites
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.div variants={item} className="mt-3">
          <p
            className="text-sm font-medium tracking-widest uppercase"
            style={{ color: "#813405", letterSpacing: "0.2em" }}
          >
            Taste Trinco · Delivered Fast
          </p>
        </motion.div>

        {/* Decorative divider */}
        <motion.div variants={item} className="mt-6 flex items-center gap-3">
          <span
            className="h-px w-12"
            style={{ background: `linear-gradient(to right, transparent, ${C.orange}80)` }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: C.olive }}
          />
          <span
            className="h-px w-12"
            style={{ background: `linear-gradient(to left, transparent, ${C.orange}80)` }}
          />
        </motion.div>

        {/* Progress bar */}
        <motion.div
          variants={item}
          className="mt-10 w-52 flex flex-col items-center gap-2"
        >
          <div
            className="relative h-1 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(248,221,164,0.10)" }}
          >
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{
                width: barWidth,
                background: `linear-gradient(90deg, ${C.burnt}, ${C.orange})`,
                boxShadow: `0 0 10px rgba(212,81,19,0.75)`,
              }}
            />
          </div>
          <span
            className="text-xs tabular-nums"
            style={{ color: "rgba(248,221,164,0.35)", fontVariantNumeric: "tabular-nums" }}
          >
            {pct}%
          </span>
        </motion.div>
      </motion.div>

      {/* ── Bottom brand note ─────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
