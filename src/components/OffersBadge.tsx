import { motion } from "framer-motion";
import { Gift, Percent, Tag, Flame, ArrowRight } from "lucide-react";
import React from "react";

type BadgeVariant = "navbar" | "hero" | "card" | "detail";

interface OffersBadgeProps {
  variant: BadgeVariant;
  label?: string;
  count?: number;
  onClick?: () => void;
  className?: string;
}

const C = {
  brown: "#813405",
  burnt: "#D45113",
  orange: "#F9A03F",
  cream: "#F8DDA4",
  olive: "#606C38",
};

export const OffersBadge: React.FC<OffersBadgeProps> = ({
  variant,
  label,
  count,
  onClick,
  className = "",
}) => {
  if (variant === "navbar") {
    return (
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-white/80 backdrop-blur-md border border-[#F8DDA4]/30
          shadow-[0_4px_12px_rgba(129,52,5,0.08)]
          group transition-all duration-300 hover:border-[#D45113]/40
          ${className}
        `}
      >
        <div className="relative">
          <Gift size={16} className="text-[#D45113]" />
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1 w-2 h-2 bg-[#D45113] rounded-full"
          />
        </div>
        
        {count !== undefined && (
          <span className="text-sm font-bold text-[#813405] font-serif">
            {count} <span className="hidden sm:inline text-[10px] uppercase tracking-wider opacity-70 ml-0.5">Offers</span>
          </span>
        )}
      </motion.button>
    );
  }

  if (variant === "hero") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          relative overflow-hidden p-6 rounded-[2rem]
          bg-gradient-to-br from-[#813405] via-[#D45113] to-[#F9A03F]
          shadow-[0_20px_50px_rgba(212,81,19,0.3)]
          border border-white/10
          ${className}
        `}
      >
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [-20, -100],
                x: Math.random() * 400,
                opacity: [0, 0.3, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              className="absolute bottom-0 w-2 h-2 bg-white rounded-full blur-[1px]"
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
              <Flame size={32} className="text-[#F8DDA4] fill-[#F8DDA4]" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white font-serif leading-tight">
                {label || "Weekend Seafood Deals"}
              </h3>
              <p className="text-white/80 text-sm mt-1">
                Get up to 30% OFF on all signature dishes.
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-full text-[#813405] font-bold text-sm shadow-xl"
          >
            Claim Offer <ArrowRight size={16} />
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (variant === "card") {
    return (
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`
          absolute top-3 left-3 z-10
          flex items-center gap-1.5 px-3 py-1.5 rounded-xl
          bg-[#D45113] border border-white/20
          shadow-[0_4px_12px_rgba(212,81,19,0.4)]
          ${className}
        `}
      >
        <Percent size={12} className="text-white" />
        <span className="text-[10px] font-black text-white uppercase tracking-tighter">
          {label || "Offer"}
        </span>
        
        {/* Glow effect */}
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-0 rounded-xl bg-white/20 blur-sm -z-10"
        />
      </motion.div>
    );
  }

  if (variant === "detail") {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-2xl
          bg-white/10 backdrop-blur-xl border border-white/20
          shadow-lg
          ${className}
        `}
      >
        <div className="w-10 h-10 rounded-full bg-[#D45113] flex items-center justify-center">
          <Tag size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest leading-none">Special Offer</p>
          <p className="text-[#F8DDA4] text-sm font-black mt-0.5">{label}</p>
        </div>
        
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="ml-auto w-2 h-2 bg-[#F9A03F] rounded-full shadow-[0_0_8px_#F9A03F]"
        />
      </motion.div>
    );
  }

  return null;
};
