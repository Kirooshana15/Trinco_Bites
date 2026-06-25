import { motion, AnimatePresence } from "framer-motion";
import { Clock, Zap, Truck, Tag, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useRestaurants } from "@/context/RestaurantContext";

import offer1 from "@/assets/offer1.jpg";
import offer2 from "@/assets/offer2.png";

import { C } from "@/utils/theme";



type Banner = {
  id: string;
  image: string;
  hasCustomImage: boolean;
  badge: { label: string; icon: any; color: string; bg: string };
  heading: string;
  subheading: string;
  description: string;
  cta: string;
  gradient: string;
  accent: string;
  restaurant_id: any;
};

/* ── Slide transition variants ───────────────────────────────────── */
const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};



/* ── OffersBannerCarousel ────────────────────────────────────────── */
export function OffersBannerCarousel({ onCtaClick }: { onCtaClick?: (bannerId: string) => void }) {
  const navigate = useNavigate();
  const { offers } = useRestaurants();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const banners = offers.map((offer) => ({
    id: offer.id,
    image: offer.bannerImage || offer1,
    hasCustomImage: !!offer.bannerImage,
    badge: {
      label: offer.discountBadge || "Offer",
      icon: Tag,
      color: "#fff",
      bg: "rgba(212,81,19,0.90)",
    },
    heading: offer.title,
    subheading: offer.description,
    description: offer.description,
    cta: "Order Now",
    gradient: "linear-gradient(100deg, rgba(10,3,0,0.82) 0%, rgba(10,3,0,0.55) 45%, rgba(10,3,0,0.10) 100%)",
    accent: "#F9A03F",
    restaurant_id: { _id: offer.restaurantId }
  }));

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      goTo((current + 1) % banners.length, 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [current, banners.length]);

  const goTo = (index: number, dir: number) => {
    setDirection(dir);
    setCurrent(index);
  };

  const handleCtaClick = (banner: Banner) => {
    if (onCtaClick) {
      onCtaClick(banner.id);
    } else if (banner.restaurant_id && banner.restaurant_id._id) {
      navigate({ to: "/restaurant/$id", params: { id: banner.restaurant_id._id } });
    } else {
      navigate({ to: "/home" });
    }
  };

  if (banners.length === 0) return null;

  const banner = banners[current];
  const BadgeIcon = banner.badge.icon;

  return (
    <section className="mx-auto max-w-6xl px-4 mt-6 mb-2">
      {/* ── Main carousel container ── */}
      <div
        className="relative overflow-hidden aspect-[16/11] sm:aspect-[16/7] lg:aspect-[16/6]"
        style={{ borderRadius: 24 }}
      >
        {/* ── Slides ── */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={banner.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
            className={`absolute inset-0 ${banner.hasCustomImage ? "cursor-pointer" : ""}`}
            onClick={banner.hasCustomImage ? () => handleCtaClick(banner) : undefined}
          >
            {/* Background image */}
            <img
              src={banner.image}
              alt={banner.heading}
              className="w-full h-full object-cover"
              style={{ objectPosition: "center" }}
            />

            {/* Gradient overlay - only if NOT custom designed image */}
            {!banner.hasCustomImage && (
              <div
                className="absolute inset-0"
                style={{ background: banner.gradient }}
              />
            )}

            {/* Content overlay */}
            {banner.hasCustomImage ? (
              /* If custom image banner, render a clean subtle hover overlay indicator */
              <div className="absolute inset-0 flex items-end justify-end p-4 sm:p-6 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <span className="px-4 py-2 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-black rounded-full shadow-md">
                  View Restaurant →
                </span>
              </div>
            ) : (
              /* Default textual overlay for plain images */
              <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-14 max-w-[550px]">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.35 }}
                  className="inline-flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full w-fit mb-3 sm:mb-4"
                  style={{
                    background: banner.badge.bg,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <BadgeIcon size={10} className="sm:w-[11px] sm:h-[11px]" color="#fff" />
                  <span className="text-[9px] sm:text-[11px] font-black tracking-wide text-white uppercase">
                    {banner.badge.label}
                  </span>
                </motion.div>

                {/* Heading */}
                <motion.h2
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.20, duration: 0.40 }}
                  className="font-black leading-[0.95] mb-1.5"
                  style={{
                    fontSize: "clamp(1.5rem, 8vw, 3.8rem)",
                    color: "#fff",
                    textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                  }}
                >
                  {banner.heading}
                </motion.h2>

                {/* Subheading */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.38 }}
                  className="font-black text-sm sm:text-xl mb-1.5 sm:mb-3 leading-tight"
                  style={{ color: banner.accent }}
                >
                  {banner.subheading}
                </motion.p>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.30, duration: 0.38 }}
                  className="text-[10px] sm:text-sm leading-snug sm:leading-relaxed mb-3 sm:mb-6 max-w-[240px] sm:max-w-xs"
                  style={{ color: "rgba(255,255,255,0.80)" }}
                >
                  {banner.description}
                </motion.p>

                {/* CTA */}
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.35 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-fit px-4 py-1.5 sm:px-7 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-black tracking-wide"
                  style={{
                    background: `linear-gradient(110deg, ${C.brown}, ${C.burnt} 60%, ${C.orange})`,
                    color: "#fff",
                    boxShadow: "0 6px 20px rgba(212,81,19,0.40)",
                  }}
                  onClick={() => handleCtaClick(banner)}
                >
                  {banner.cta} →
                </motion.button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Premium shadow rim ── */}
        <div
          className="absolute inset-0 rounded-[24px] pointer-events-none"
          style={{
            boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.08), 0 16px 48px rgba(129,52,5,0.18)",
          }}
        />
      </div>

      {/* ── Pagination dots ── */}
      {banners.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              className="rounded-full transition-all duration-300"
              style={{
                width:  i === current ? 28 : 8,
                height: 8,
                background: i === current
                  ? `linear-gradient(90deg, ${C.burnt}, ${C.orange})`
                  : "rgba(129,52,5,0.20)",
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
