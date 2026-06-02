import { ElementType, ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { C } from "@/utils/theme";

/* ── Float-label input ───────────────────────────────────────────── */
export function Field({
  icon: Icon,
  label,
  type = "text",
  placeholder,
  value: controlledValue,
  onChange,
}: {
  icon: ElementType;
  label: string;
  type?: string;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [innerValue, setInnerValue] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const isPwd = type === "password";
  const value = controlledValue ?? innerValue;
  const lifted = focused || value.length > 0;
  const realType = isPwd ? (showPwd ? "text" : "password") : type;

  return (
    <motion.div
      animate={{
        borderColor: focused ? C.burnt : "rgba(129,52,5,0.18)",
        boxShadow: focused
          ? `0 0 0 3px rgba(212,81,19,0.13), 0 2px 12px rgba(129,52,5,0.07)`
          : "0 1px 4px rgba(129,52,5,0.06)",
      }}
      transition={{ duration: 0.2 }}
      className="relative flex items-center rounded-2xl overflow-visible"
      style={{
        background: "rgba(248,221,164,0.20)",
        border: "1.5px solid rgba(129,52,5,0.18)",
        backdropFilter: "blur(10px)",
        height: 58,
      }}
    >
      {/* floating label */}
      <motion.span
        animate={{
          top: lifted ? 8 : 18,
          fontSize: lifted ? 10 : 14,
          color: focused ? C.burnt : "rgba(129,52,5,0.42)",
        }}
        transition={{ duration: 0.17, ease: "easeOut" }}
        className="absolute left-11 pointer-events-none font-semibold z-10 tracking-wide leading-none"
        style={{ originX: 0 }}
      >
        {label}
      </motion.span>

      {/* left icon */}
      <motion.span
        animate={{ color: focused ? C.burnt : "rgba(129,52,5,0.38)" }}
        className="pl-3.5 flex-shrink-0"
      >
        <Icon size={17} />
      </motion.span>

      {/* input */}
      <input
        type={realType}
        placeholder={lifted ? placeholder : ""}
        required
        value={value}
        onChange={e => {
          const nextValue = e.target.value;
          if (onChange) onChange(nextValue);
          else setInnerValue(nextValue);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="flex-1 bg-transparent outline-none text-sm px-2 pb-1 pt-5"
        style={{ color: C.brown, fontFamily: "var(--font-body)" }}
      />

      {/* password toggle */}
      {isPwd && (
        <button
          type="button"
          onClick={() => setShowPwd(v => !v)}
          className="pr-3.5 flex-shrink-0 flex items-center"
          style={{ color: "rgba(129,52,5,0.35)" }}
        >
          {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
    </motion.div>
  );
}

/* ── Social button ───────────────────────────────────────────────── */
export function SocialBtn({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-2xl text-sm font-semibold"
      style={{
        background: "rgba(248,221,164,0.18)",
        border: "1.5px solid rgba(129,52,5,0.15)",
        color: C.brown,
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </motion.button>
  );
}
