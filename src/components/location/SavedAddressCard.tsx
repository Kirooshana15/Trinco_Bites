import { motion } from "framer-motion";
import { BriefcaseBusiness, Edit3, Home, Plus } from "lucide-react";

import type { SavedAddress } from "@/context/LocationContext";

type SavedAddressCardProps = {
  address?: SavedAddress;
  kind: SavedAddress["kind"];
  active: boolean;
  onSelect: () => void;
  onAction: () => void;
};

export function SavedAddressCard({
  address,
  kind,
  active,
  onSelect,
  onAction,
}: SavedAddressCardProps) {
  const hasAddress = Boolean(address);
  const Icon = kind === "work" ? BriefcaseBusiness : Home;
  const actionLabel = hasAddress ? "Edit address" : "Add address";
  const title = address?.label ?? (kind === "work" ? "Work" : "Home");
  const description =
    address?.address ?? "Save this address for one-tap delivery.";

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="w-full rounded-[28px] border p-4 text-left"
      style={{
        background: !hasAddress
          ? "linear-gradient(145deg, rgba(255,252,245,0.9), rgba(248,221,164,0.35))"
          : active
          ? "linear-gradient(135deg, rgba(248,221,164,0.95), rgba(255,252,245,0.98))"
          : "rgba(255,252,245,0.88)",
        borderColor: !hasAddress
          ? "rgba(212,81,19,0.28)"
          : active
          ? "rgba(212,81,19,0.32)"
          : "rgba(129,52,5,0.1)",
        borderStyle: hasAddress ? "solid" : "dashed",
        boxShadow: !hasAddress
          ? "0 18px 44px -34px rgba(212,81,19,0.5)"
          : active
          ? "0 20px 45px -28px rgba(212,81,19,0.45)"
          : "0 12px 38px -28px rgba(129,52,5,0.2)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
            style={{
              background:
                "linear-gradient(145deg, rgba(129,52,5,0.92), rgba(212,81,19,0.86))",
            }}
          >
            <Icon className="h-5 w-5 text-[#F8DDA4]" />
          </div>

          <div>
            <p className="text-sm font-semibold text-[#813405]">
              {title}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#813405b3]">
              {description}
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          aria-label={actionLabel}
          whileHover={{ rotate: 12 }}
          onClick={(event) => {
            event.stopPropagation();
            onAction();
          }}
          className="grid h-9 w-9 place-items-center rounded-2xl border"
          style={{
            borderColor: hasAddress
              ? "rgba(129,52,5,0.1)"
              : "rgba(212,81,19,0.16)",
            background: hasAddress
              ? "rgba(255,252,245,0.78)"
              : "rgba(255,252,245,0.6)",
          }}
        >
          {hasAddress ? (
            <Edit3 className="h-4 w-4 text-[#813405]" />
          ) : (
            <Plus className="h-4 w-4 text-[#D45113]" />
          )}
        </motion.button>
      </div>
    </motion.button>
  );
}
