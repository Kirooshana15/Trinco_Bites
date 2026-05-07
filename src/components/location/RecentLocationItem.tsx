import { motion } from "framer-motion";
import { History } from "lucide-react";

import type { LocationOption } from "@/context/LocationContext";

type RecentLocationItemProps = {
  location: LocationOption;
  onSelect: () => void;
};

export function RecentLocationItem({
  location,
  onSelect,
}: RecentLocationItemProps) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-[24px] border px-4 py-3 text-left"
      style={{
        background: "rgba(255,252,245,0.72)",
        borderColor: "rgba(129,52,5,0.08)",
      }}
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#F8DDA4]/70">
        <History className="h-4 w-4 text-[#813405]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#813405]">{location.label}</p>
        <p className="text-sm text-[#81340599]">{location.address}</p>
      </div>
    </motion.button>
  );
}
