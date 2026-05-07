import { motion } from "framer-motion";
import { Search } from "lucide-react";

type LocationSearchBarProps = {
  value: string;
  focused: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
};

export function LocationSearchBar({
  value,
  focused,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
}: LocationSearchBarProps) {
  return (
    <motion.label
      animate={{
        boxShadow: focused
          ? "0 18px 55px -24px rgba(212,81,19,0.34)"
          : "0 10px 35px -26px rgba(129,52,5,0.22)",
      }}
      className="flex items-center gap-3 rounded-[28px] border px-4 py-4"
      style={{
        background: "rgba(255,252,245,0.92)",
        borderColor: focused ? "rgba(129,52,5,0.48)" : "rgba(129,52,5,0.28)",
        backdropFilter: "blur(18px)",
      }}
    >
      <Search className="h-5 w-5 text-[#813405]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder="Search location, street, area..."
        className="w-full bg-transparent text-sm text-[#5b2200] outline-none placeholder:text-[#813405b3]"
      />
    </motion.label>
  );
}
