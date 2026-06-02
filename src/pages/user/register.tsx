import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Lock, ArrowRight, Mail, User } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import logo from "@/assets/logo.png";
import { Footer } from "@/components/Footer";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useAuth } from "@/context/AuthContext";
import { C } from "@/utils/theme";
import { Field } from "@/components/ui/Field";
/* ── Main ────────────────────────────────────────────────────────── */
export function Register() {
  const navigate = useNavigate();
  const { googleLogin, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await register({ name, email, phone, password });
      navigate({ to: "/login" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setLoading(true);
    setError("");

    try {
      await googleLogin(credential);
      navigate({ to: "/home" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue with Google.");
    } finally {
      setLoading(false);
    }
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

              <Field icon={User} label="Full name" type="text" placeholder="Your full name" value={name} onChange={setName} />
              <Field icon={Mail} label="Email address" type="email" placeholder="you@email.com" value={email} onChange={setEmail} />
              <Field icon={Phone} label="Phone number" type="tel" placeholder="+94 77 123 4567" value={phone} onChange={setPhone} />
              <Field icon={Lock} label="Password" type="password" placeholder="********" value={password} onChange={setPassword} />

              {error && (
                <p className="rounded-2xl px-3 py-2 text-xs font-semibold" style={{ background: "rgba(212,81,19,0.10)", color: C.burnt }}>
                  {error}
                </p>
              )}

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
              <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} />
            </div>
          </motion.div>
        </motion.div>
      </div>


    </div>
  );
}
