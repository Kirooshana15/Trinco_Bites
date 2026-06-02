import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, Mail, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { C } from "@/utils/theme";
import { Field } from "@/components/ui/Field";
import logo from "@/assets/logo.png";
import loginBg from "@/assets/login.png";

export function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin, restaurantLogin, isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Redirect already-authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "main_admin") {
        navigate({ to: "/admin/dashboard" });
      } else if (user?.role === "restaurant_admin") {
        navigate({ to: "/restaurant/dashboard" });
      } else {
        navigate({ to: "/home" });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Try main admin first, then restaurant admin
    try {
      const loggedInUser = await adminLogin({ email, password });
      navigate({ to: loggedInUser.role === "main_admin" ? "/admin/dashboard" : "/restaurant/dashboard" });
      return;
    } catch {
      // Not a main admin — try restaurant admin
    }

    try {
      await restaurantLogin({ email, password });
      navigate({ to: "/restaurant/dashboard" });
    } catch {
      setError("Invalid credentials. Please check your email and password.");
      setLoading(false);
    }
  };

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
  };
  const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#FFFCF5" }}>

      {/* ── Left: Form Side ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 relative z-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-md mx-auto"
        >
          {/* Logo */}
          <motion.div variants={item} className="mb-8">
            <img
              src={logo}
              alt="Trinco Bites"
              className="h-16 w-16 rounded-2xl object-cover"
              style={{
                boxShadow: `0 4px 20px rgba(129,52,5,0.15)`,
              }}
            />
          </motion.div>

          {/* Heading */}
          <motion.div variants={item} className="mb-8">
            <h1
              className="text-3xl md:text-4xl font-black leading-tight"
              style={{
                fontFamily: "var(--font-body)",
                background: `linear-gradient(135deg, ${C.brown} 0%, ${C.burnt} 55%, ${C.orange} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Your Business Starts Here
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ color: "rgba(129,52,5,0.55)", fontFamily: "var(--font-body)" }}
            >
              Login to manage your restaurant & orders
            </p>
          </motion.div>

          {/* Form */}
          <motion.form variants={item} onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 tracking-wide"
                style={{ color: "rgba(129,52,5,0.65)", fontFamily: "var(--font-body)" }}
              >
                Email Id
              </label>
              <input
                type="email"
                placeholder="you@trincobites.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-b-2 py-2.5 text-sm outline-none transition-colors placeholder:text-[#813405]/30"
                style={{
                  borderColor: "rgba(129,52,5,0.15)",
                  color: "#813405",
                  fontFamily: "var(--font-body)",
                }}
                onFocus={(e) => (e.target.style.borderColor = C.burnt)}
                onBlur={(e) => (e.target.style.borderColor = "rgba(129,52,5,0.15)")}
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 tracking-wide"
                style={{ color: "rgba(129,52,5,0.65)", fontFamily: "var(--font-body)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-transparent border-b-2 py-2.5 pr-10 text-sm outline-none transition-colors placeholder:text-[#813405]/30"
                  style={{
                    borderColor: "rgba(129,52,5,0.15)",
                    color: "#813405",
                    fontFamily: "var(--font-body)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = C.burnt)}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(129,52,5,0.15)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#813405]/60 hover:text-[#813405] hover:bg-[#813405]/5 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <a
                href="/forgot-password"
                className="text-xs font-semibold hover:underline"
                style={{ color: C.burnt, fontFamily: "var(--font-body)" }}
              >
                Forgot password ?
              </a>
            </div>

            {/* Error */}
            {error && (
              <p
                className="rounded-2xl px-4 py-2.5 text-xs font-semibold"
                style={{ background: "rgba(212,81,19,0.10)", color: C.burnt }}
              >
                {error}
              </p>
            )}

            {/* Submit button */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              disabled={loading}
              className="relative overflow-hidden rounded-full py-3.5 px-12 mx-auto flex items-center justify-center gap-2 font-bold text-sm tracking-wider uppercase"
              style={{
                background: loading
                  ? "rgba(129,52,5,0.22)"
                  : `linear-gradient(110deg, ${C.brown} 0%, ${C.burnt} 50%, ${C.orange} 100%)`,
                color: C.cream,
                boxShadow: loading ? "none" : `0 6px 28px rgba(212,81,19,0.35)`,
                transition: "all 0.3s",
                fontFamily: "var(--font-body)",
                letterSpacing: "0.10em",
              }}
            >
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
                    Signing in…
                  </motion.span>
                ) : (
                  <motion.span key="lbl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="relative z-10 flex items-center gap-2">
                    Log in
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3 pt-2">
              <span className="flex-1 h-px" style={{ background: "rgba(129,52,5,0.12)" }} />
              <span
                className="text-xs font-medium"
                style={{ color: "rgba(129,52,5,0.45)", fontFamily: "var(--font-body)" }}
              >
                OR
              </span>
              <span className="flex-1 h-px" style={{ background: "rgba(129,52,5,0.12)" }} />
            </div>

            {/* Back to customer login */}
            <p
              className="text-center text-xs"
              style={{ color: "rgba(129,52,5,0.65)", fontFamily: "var(--font-body)" }}
            >
              Not an admin?{" "}
              <Link
                to="/login"
                className="font-bold underline underline-offset-2"
                style={{ color: C.burnt }}
              >
                Customer Login
              </Link>
            </p>
          </motion.form>
        </motion.div>
      </div>

      {/* ── Right: Image Side ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="hidden lg:block lg:w-[50%] xl:w-[55%] relative"
      >
        <img
          src={loginBg}
          alt="Food delivery"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay for smooth blending */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to right, #FFFCF5 0%, transparent 15%)",
          }}
        />
      </motion.div>
    </div>
  );
}
