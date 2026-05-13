import { motion } from "framer-motion";
import { Plus, Star, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { restaurants } from "@/utils/data/mock";

const C = {
  brown: "#813405",
  burnt: "#D45113",
  orange: "#F9A03F",
};

export function RecentlyAdded() {
  const navigate = useNavigate();

  // Last 4 restaurants (mocking "recent")
  const recent = [...restaurants].reverse().slice(0, 4);

  return (
    <section className="mx-auto max-w-6xl px-4 mt-16 mb-20">
      <div className="flex items-center gap-3 mb-10">

        <div>
          <h2 className="text-3xl font-black" style={{ color: C.brown }}>🆕 Newly Added</h2>
          <p className="text-sm font-medium opacity-60">Discover the latest tastes in Trincomalee</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recent.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -6 }}
            className="group cursor-pointer rounded-3xl overflow-hidden bg-white border border-slate-100 transition-all hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/40"
            onClick={() => navigate({ to: "/restaurant/$id", params: { id: r.id } })}
          >
            {/* Image */}
            <div className="relative h-40 overflow-hidden">
              <img src={r.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
              <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-blue-500 text-white text-[9px] font-black uppercase tracking-wider">
                New
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-black truncate pr-2" style={{ color: C.brown }}>{r.name}</h3>
                <div className="flex items-center gap-1 shrink-0">
                  <Star size={12} className="fill-orange-400 text-orange-400" />
                  <span className="text-[10px] font-black">{r.rating}</span>
                </div>
              </div>

              <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-3">{r.category}</p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <span className="text-[10px] font-black text-slate-400">Recently Joined</span>
                <div className="h-6 w-6 rounded-lg bg-slate-50 grid place-items-center group-hover:bg-orange-500 transition-colors">
                  <Plus size={14} className="text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
