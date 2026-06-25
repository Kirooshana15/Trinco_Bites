import { motion } from "framer-motion";
import { MapPin, Clock, Star, TrendingUp, ChevronRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { type Restaurant } from "@/utils/data/mock";
import { useRestaurants } from "@/context/RestaurantContext";
import { isRestaurantOpen, getTodayHours } from "@/utils/time";

import { C } from "@/utils/theme";

export function PopularNearYou() {
  const { restaurants } = useRestaurants();
  const navigate = useNavigate();

  // Filter restaurants for "Popular" logic (rating >= 4.5), excluding unpublished/vacation ones
  const popular = restaurants
    .filter(r => r.rating >= 4.5 && r.showPublicly !== false && r.vacationMode !== true)
    .slice(0, 4);

  return (
    <section className="mx-auto max-w-6xl px-4 mt-12 mb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2 text-orange-600">
            <MapPin size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Local Discovery</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black flex items-center gap-3" style={{ color: C.brown }}>
            Popular near you
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <TrendingUp size={24} className="text-orange-500" />
            </motion.div>
          </h2>
        </div>
        <button className="flex items-center gap-1 text-sm font-bold transition-all hover:gap-2" style={{ color: C.burnt }}>
          See all <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {popular.map((r, i) => {
          const isOpen = isRestaurantOpen(r);
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="group cursor-pointer rounded-3xl overflow-hidden bg-white"
              style={{
                boxShadow: "0 10px 30px rgba(129, 52, 5, 0.08)",
                border: "1.5px solid rgba(212, 81, 19, 0.05)"
              }}
              onClick={() => navigate({ to: "/restaurant/$id", params: { id: r.id } })}
            >
              {/* Image Container */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={r.image}
                  alt={r.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Distance Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md flex items-center gap-1 shadow-sm">
                  <MapPin size={10} className="text-orange-600" />
                  <span className="text-[10px] font-black text-slate-800">2.1 km away</span>
                </div>

                {/* Status Badge */}
                <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm text-white ${
                  isOpen ? "bg-emerald-500" : "bg-red-500"
                }`}>
                  {isOpen ? "OPEN" : "CLOSED"}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-black text-lg leading-tight truncate pr-2" style={{ color: C.brown }}>{r.name}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star size={14} className="fill-orange-400 text-orange-400" />
                    <span className="text-xs font-black" style={{ color: C.brown }}>{r.rating}</span>
                  </div>
                </div>

                <p className="text-xs font-medium mb-1.5 opacity-60 truncate">{r.category} • {r.deliveryTime}</p>
                
                <p className="text-[11px] font-bold text-brand-brown mb-3 flex items-center gap-1">
                  <span>🕒 Hours: {getTodayHours(r)}</span>
                </p>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-[10px] font-black text-orange-700 uppercase tracking-wider">
                    Trending
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    Most Ordered
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
