import { motion } from "framer-motion";
import { MapPin, Route } from "lucide-react";

import type { LocationOption } from "@/context/LocationContext";

type MapPreviewProps = {
  location: LocationOption;
  onConfirm: () => void;
};

export function MapPreview({ location, onConfirm }: MapPreviewProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[32px] border"
      style={{
        background: "rgba(255,252,245,0.88)",
        borderColor: "rgba(129,52,5,0.12)",
        boxShadow: "0 24px 55px -34px rgba(129,52,5,0.32)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="relative h-56 overflow-hidden bg-[#f6e8c6]">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 25%, rgba(96,108,56,0.12), transparent 32%), linear-gradient(rgba(129,52,5,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(129,52,5,0.08) 1px, transparent 1px)",
            backgroundSize: "auto, 34px 34px, 34px 34px",
          }}
        />
        <div className="absolute left-[12%] top-[42%] h-14 w-28 rounded-full border border-white/40 bg-white/35 backdrop-blur-md" />
        <div className="absolute right-[12%] top-[18%] h-20 w-20 rounded-full border border-white/40 bg-white/30 backdrop-blur-md" />
        <div className="absolute left-[35%] top-[16%] h-24 w-24 rounded-[28px] border border-white/40 bg-white/20 backdrop-blur-md" />

        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.9, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="relative">
            <span className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D45113]/15" />
            <MapPin className="relative h-11 w-11 fill-[#F9A03F] text-[#813405]" />
          </div>
        </motion.div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#606C38]/10">
            <Route className="h-5 w-5 text-[#606C38]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#813405]">
              Your current location detected
            </p>
            <p className="text-sm text-[#81340599]">{location.address}</p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onConfirm}
          className="w-full rounded-full px-4 py-3 text-sm font-semibold text-[#F8DDA4]"
          style={{
            background:
              "linear-gradient(135deg, #813405 0%, #D45113 65%, #F9A03F 100%)",
          }}
        >
          Deliver here
        </motion.button>
      </div>
    </motion.section>
  );
}
