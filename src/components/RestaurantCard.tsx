import { motion } from "framer-motion";
import { Star, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Restaurant } from "@/utils/data/mock";
import { OffersBadge } from "./OffersBadge";

export function RestaurantCard({ r, index = 0 }: { r: Restaurant; index?: number }) {
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
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />{r.deliveryTime}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
