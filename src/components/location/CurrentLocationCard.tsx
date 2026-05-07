import { motion } from "framer-motion";
import { LoaderCircle, Navigation, Radar } from "lucide-react";

type CurrentLocationCardProps = {
  loading: boolean;
  onClick: () => void;
};

export function CurrentLocationCard({
  loading,
  onClick,
}: CurrentLocationCardProps) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full rounded-[30px] border p-5 text-left"
      style={{
        background: "rgba(255,252,245,0.88)",
        borderColor: "rgba(129,52,5,0.12)",
        boxShadow: "0 18px 44px -30px rgba(129,52,5,0.3)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(129,52,5,0.95), rgba(212,81,19,0.9))",
          }}
        >
          {loading ? (
            <LoaderCircle className="h-6 w-6 animate-spin text-[#F8DDA4]" />
          ) : (
            <Navigation className="h-6 w-6 text-[#F8DDA4]" />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-base font-semibold text-[#813405]">
            Use current location
          </p>
          <p className="mt-1 text-sm leading-6 text-[#813405b3]">
            {loading
              ? "Detecting your location and preparing the map..."
              : "Enable GPS to detect your location"}
          </p>
        </div>

        {!loading && <Radar className="ml-auto h-5 w-5 text-[#D45113]" />}
      </div>
    </motion.button>
  );
}
