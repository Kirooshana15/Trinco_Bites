import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Lock, User, Eye, EyeOff, ArrowRight, Mail } from "lucide-react";
import { useState } from "react";
import type { ElementType, FormEvent, ReactNode } from "react";
import logo from "@/utils/assets/logo.png";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

/* ── Palette ─────────────────────────────────────────────────────── */
const C = {
  brown: "#813405",
  burnt: "#D45113",
  orange: "#F9A03F",
  cream: "#F8DDA4",
  olive: "#606C38",
} as const;

/* ── Float-label input ───────────────────────────────────────────── */
function Field({
  icon: Icon,
  label,
  type = "text",
  placeholder,
}: {
  icon: ElementType;
  label: string;
  type?: string;
  placeholder: string;
}) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const isPwd = type === "password";
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
      className="relative flex items-center rounded-2xl"
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
        onChange={e => setValue(e.target.value)}
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
function SocialBtn({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
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


/* ── Main ────────────────────────────────────────────────────────── */
export function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    login("newuser@example.com");
    setTimeout(() => navigate({ to: "/home" }), 950);
  };

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" as const } },
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col px-6">
      <div className="flex-1 flex items-center justify-center py-12">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-sm mx-auto"
        >
          {/* ── Heading ──────────────────────────────────────────── */}
          <motion.div variants={item} className="text-center mb-7">
            <h1
              className="text-[2rem] font-black leading-tight"
              style={{
                fontFamily: "var(--font-body)",
                background: `linear-gradient(135deg, ${C.brown} 0%, ${C.burnt} 55%, ${C.orange} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Create account
            </h1>
            <p
              className="mt-1.5 text-sm"
              style={{ color: "rgba(129,52,5,0.50)", fontFamily: "var(--font-body)" }}
            >
              Start ordering in under a minute.
            </p>
          </motion.div>

          {/* ── Card ─────────────────────────────────────────────── */}
          <motion.div
            variants={item}
            className="rounded-3xl p-6"
            style={{
              background: "rgba(255,252,245,0.72)",
              backdropFilter: "blur(24px)",
              border: "1.5px solid rgba(248,221,164,0.55)",
              boxShadow: `0 8px 40px rgba(129,52,5,0.11), 0 2px 8px rgba(129,52,5,0.06)`,
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-3">

              <Field icon={User} label="Full name" type="text" placeholder="Your full name" />
              <Field icon={Mail} label="Email address" type="email" placeholder="you@email.com" />
              <Field icon={Phone} label="Phone number" type="tel" placeholder="+94 77 123 4567" />
              <Field icon={Lock} label="Password" type="password" placeholder="••••••••" />

              {/* Terms note */}
              <p
                className="text-[11px] leading-relaxed pt-0.5"
                style={{ color: "rgba(129, 53, 5, 0.75)", fontFamily: "var(--font-body)" }}
              >
                By creating an account you agree to our{" "}
                <a href="/terms" className="underline underline-offset-2" style={{ color: C.burnt }}>
                  Terms
                </a>{" "}
                &amp;{" "}
                <a href="/privacy" className="underline underline-offset-2" style={{ color: C.burnt }}>
                  Privacy Policy
                </a>.
              </p>

              {/* submit */}
              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                className="w-full relative overflow-hidden rounded-2xl py-[15px] mt-1 font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2"
                style={{
                  background: loading
                    ? "rgba(129,52,5,0.22)"
                    : `linear-gradient(110deg, ${C.brown} 0%, ${C.burnt} 50%, ${C.orange} 100%)`,
                  color: C.cream,
                  boxShadow: loading ? "none" : `0 4px 22px rgba(212,81,19,0.38), inset 0 1px 0 rgba(248,221,164,0.15)`,
                  transition: "background 0.3s",
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.10em",
                }}
              >
                {/* shimmer */}
                {!loading && (
                  <motion.span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(105deg, transparent 30%, rgba(248,221,164,0.22) 50%, transparent 70%)",
                      backgroundSize: "200% 100%",
                    }}
                    animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                    transition={{ repeat: Infinity, duration: 2.6, ease: "linear", repeatDelay: 1.2 }}
                  />
                )}

                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.span key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2">
                      <motion.span
                        className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                      />
                      Creating account…
                    </motion.span>
                  ) : (
                    <motion.span key="lbl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="relative z-10 flex items-center gap-2">
                      Create Account <ArrowRight size={15} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* sign-in link */}
              <p className="text-center text-xs pt-1" style={{ color: "rgba(129, 53, 5, 0.75)", fontFamily: "var(--font-body)" }}>
                Already have an account?{" "}
                <Link to="/login" className="font-bold underline underline-offset-2" style={{ color: C.burnt }}>
                  Login
                </Link>
              </p>
            </form>

            {/* ── Divider ───────────────────────────────────────── */}
            <div className="flex items-center gap-3 my-5">
              <span className="flex-1 h-px" style={{ background: "rgba(129,52,5,0.12)" }} />
              <span className="text-xs font-medium" style={{ color: "rgba(129, 53, 5, 0.75)", fontFamily: "var(--font-body)" }}>
                or sign up with
              </span>
              <span className="flex-1 h-px" style={{ background: "rgba(129,52,5,0.12)" }} />
            </div>

            {/* ── Social ────────────────────────────────────────── */}
            <div className="flex gap-3">
              <SocialBtn onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  login("user.google@gmail.com");
                  navigate({ to: "/home" });
                }, 1200);
              }}>
                <img
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
                Google
              </SocialBtn>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
