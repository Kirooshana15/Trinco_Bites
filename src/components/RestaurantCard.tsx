import { motion } from "framer-motion";
import { Star, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Restaurant } from "@/utils/data/mock";
import { OffersBadge } from "./OffersBadge";
import { isRestaurantOpen } from "@/utils/time";

export function RestaurantCard({ r, index = 0 }: { r: Restaurant; index?: number }) {
  const isOpen = isRestaurantOpen(r);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <Link to="/restaurant/$id" params={{ id: r.id }} className="block group">
        <div className="rounded-3xl overflow-hidden bg-card shadow-card hover:shadow-glow transition-shadow">
          <div className="relative aspect-[16/10] overflow-hidden">
            <img src={r.image} alt={r.name} loading="lazy" width={1024} height={640}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <span
              className={`absolute top-3 right-3 z-10 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-md ${
                isOpen
                  ? "bg-emerald-500/90 text-white shadow-lg shadow-emerald-900/25"
                  : "bg-red-500/90 text-white shadow-lg shadow-red-900/25"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {isOpen ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                <span>{isOpen ? "Open now" : "Closed now"}</span>
              </span>
            </span>
            {r.hasOffer ? (
              <OffersBadge variant="card" label={r.offerText} />
            ) : (
              <span className="absolute top-3 left-3 bg-background/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-semibold">
                {r.category}
              </span>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-base">{r.name}</h3>
              <div className="flex items-center gap-1 text-sm font-semibold text-brand-olive">
                <Star className="h-4 w-4 fill-current" />{r.rating}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{r.location}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/10 pt-2.5">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />{r.deliveryTime}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-brand-brown">
                <span>🕒 {r.openingTime} - {r.closingTime}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
