import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, ShieldCheck, Clock, RotateCcw, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { C } from "@/utils/theme";
import { Field } from "@/components/ui/Field";
import { apiRequest } from "../utils/api";

type Step = "email" | "otp" | "reset";
type Role = "user" | "restaurant_admin" | "main_admin";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [detectedRole, setDetectedRole] = useState<Role>("user");
  const [otpInputs, setOtpInputs] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Custom Toast/Notification Popup State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [validationError, setValidationError] = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Show a custom popup toast that automatically disappears after 5 seconds
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    // Keep it longer if it's an info toast showing OTP code for testing
    const duration = type === "info" ? 7000 : 4000;
    const t = setTimeout(() => {
      setToast(null);
    }, duration);
    return () => clearTimeout(t);
  };

  // Countdown timer for OTP expiry
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timer]);

  // Handle email submission (Step 1)
  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError("");
    
    if (!email) {
      setValidationError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest<{ message: string; role: string }>("/auth/forgot-password", {
        method: "POST",
        body: { email: email.toLowerCase().trim() },
      });

      const roleMapped: Role = response.role === "ADMIN" 
        ? "main_admin" 
        : response.role === "RESTAURANT" 
          ? "restaurant_admin" 
          : "user";
      
      setDetectedRole(roleMapped);
      setTimer(60);
      setIsTimerActive(true);
      setOtpInputs(Array(6).fill(""));
      setStep("otp");
      showToast(response.message || "Successfully sent OTP to email!", "success");
    } catch (err: any) {
      showToast(err.message || "This email address is not registered in our system.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Resend
  const handleResendOtp = async () => {
    try {
      const response = await apiRequest<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: { email: email.toLowerCase().trim() },
      });
      setTimer(60);
      setIsTimerActive(true);
      setOtpInputs(Array(6).fill(""));
      showToast(response.message || "Successfully resent OTP to email!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to resend OTP.", "error");
    }
  };

  // Handle individual OTP field change
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric inputs
    if (value && !/^\d+$/.test(value)) return;

    const newInputs = [...otpInputs];
    newInputs[index] = value.slice(-1); // only keep last character
    setOtpInputs(newInputs);

    // Auto-focus next field
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace key on OTP input
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpInputs[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP verification (Step 2)
  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError("");
    const enteredOtp = otpInputs.join("");

    if (enteredOtp.length < 6) {
      setValidationError("Please enter the complete 6-digit OTP code.");
      return;
    }

    if (timer === 0) {
      setValidationError("OTP code has expired. Please request a new one.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest<{ message: string }>("/auth/verify-otp", {
        method: "POST",
        body: { email: email.toLowerCase().trim(), otp: enteredOtp },
      });
      
      setValidationError("");
      setStep("reset");
      showToast(response.message || "OTP verified successfully!", "success");
    } catch (err: any) {
      setValidationError(err.message || "Invalid OTP code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle resetting password (Step 3)
  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError("");
    const enteredOtp = otpInputs.join("");

    if (newPassword.length < 6) {
      setValidationError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: { 
          email: email.toLowerCase().trim(), 
          otp: enteredOtp,
          password: newPassword,
        },
      });

      showToast(response.message || "Password successfully reset!", "success");
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        if (detectedRole === "user") {
          navigate({ to: "/login" });
        } else {
          navigate({ to: "/business_login" });
        }
      }, 2000);
    } catch (err: any) {
      setValidationError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col items-center justify-center px-6 relative overflow-hidden">
      
      {/* ── Background decoration matching Splash ────────────────────── */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div 
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${C.orange} 0%, transparent 70%)` }}
        />
        <div 
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${C.burnt} 0%, transparent 70%)` }}
        />
      </div>

      {/* ── Premium Toast Notification Popups ─────────────────────────── */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 max-w-sm w-full px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="rounded-2xl p-4 flex items-start gap-3 shadow-lg border backdrop-blur-md"
              style={{
                background: toast.type === "success" 
                  ? "rgba(236,253,245,0.9)" 
                  : toast.type === "error"
                  ? "rgba(254,242,242,0.9)"
                  : "rgba(254,249,195,0.9)",
                borderColor: toast.type === "success" 
                  ? "#10B981" 
                  : toast.type === "error"
                  ? "#EF4444"
                  : "#EAB308",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)"
              }}
            >
              {toast.type === "success" && <CheckCircle2 className="text-emerald-600 flex-shrink-0 mt-0.5" size={18} />}
              {toast.type === "error" && <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />}
              {toast.type === "info" && <ShieldCheck className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />}
              
              <div className="flex-1">
                <p 
                  className="text-xs font-semibold"
                  style={{
                    color: toast.type === "success"
                      ? "#065F46"
                      : toast.type === "error"
                      ? "#991B1B"
                      : "#854D0E"
                  }}
                >
                  {toast.type === "success" ? "Success" : toast.type === "error" ? "Error" : "Demo Information"}
                </p>
                <p 
                  className="text-[11px] mt-0.5 leading-relaxed font-medium"
                  style={{
                    color: toast.type === "success"
                      ? "#047857"
                      : toast.type === "error"
                      ? "#B91C1C"
                      : "#A16207"
                  }}
                >
                  {toast.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Main Form Card ────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        
        {/* Step 1: ENTER EMAIL */}
        {step === "email" && (
          <motion.div
            key="email"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-orange-200/50 shadow-card relative z-10"
            style={{
              background: "rgba(255,252,245,0.72)",
              border: "1.5px solid rgba(248,221,164,0.55)",
            }}
          >
            <div className="text-center mb-6">
              <h1
                className="text-2xl font-black tracking-tight"
                style={{
                  fontFamily: "var(--font-body)",
                  background: `linear-gradient(135deg, ${C.brown} 0%, ${C.burnt} 55%, ${C.orange} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Forgot Password
              </h1>
              <p
                className="text-xs mt-2"
                style={{ color: "rgba(129,52,5,0.6)", fontFamily: "var(--font-body)" }}
              >
                Enter your email address and we'll send you an OTP code to reset your password.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <Field
                icon={Mail}
                label="Email address"
                type="email"
                placeholder="enter your email address"
                value={email}
                onChange={setEmail}
              />

              {validationError && (
                <p 
                  className="rounded-2xl px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5" 
                  style={{ background: "rgba(212,81,19,0.1)", color: C.burnt }}
                >
                  <AlertCircle size={14} />
                  {validationError}
                </p>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                className="w-full relative overflow-hidden rounded-2xl py-4 font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2"
                style={{
                  background: loading
                    ? "rgba(129,52,5,0.22)"
                    : `linear-gradient(110deg, ${C.brown} 0%, ${C.burnt} 50%, ${C.orange} 100%)`,
                  color: C.cream,
                  boxShadow: loading ? "none" : `0 4px 20px rgba(212,81,19,0.35)`,
                  transition: "background 0.3s",
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.10em",
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
                    />
                    Sending OTP…
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Send OTP <ArrowRight size={14} />
                  </span>
                )}
              </motion.button>
            </form>

            <div className="mt-5 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs font-bold underline underline-offset-4"
                style={{ color: C.burnt }}
              >
                <ArrowLeft size={13} /> Back to Sign In
              </Link>
            </div>
          </motion.div>
        )}

        {/* Step 2: ENTER OTP */}
        {step === "otp" && (
          <motion.div
            key="otp"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-orange-200/50 shadow-card relative z-10"
            style={{
              background: "rgba(255,252,245,0.72)",
              border: "1.5px solid rgba(248,221,164,0.55)",
            }}
          >
            <button
              onClick={() => setStep("email")}
              className="absolute top-5 left-5 text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ color: C.brown }}
            >
              <ArrowLeft size={14} /> Back
            </button>

            <div className="text-center mt-3 mb-6">
              <h1
                className="text-2xl font-black tracking-tight"
                style={{
                  fontFamily: "var(--font-body)",
                  background: `linear-gradient(135deg, ${C.brown} 0%, ${C.burnt} 55%, ${C.orange} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Verify OTP
              </h1>
              <p
                className="text-xs mt-2"
                style={{ color: "rgba(129,52,5,0.6)", fontFamily: "var(--font-body)" }}
              >
                We have successfully sent an OTP code to:
              </p>
              <p className="text-xs font-bold mt-1" style={{ color: C.brown }}>
                {email}
              </p>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-6">
              
              {/* OTP Input Row */}
              <div className="flex justify-between gap-2.5 px-1">
                {otpInputs.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-lg font-bold rounded-xl border-2 bg-amber-50/25 outline-none transition-all"
                    style={{
                      borderColor: val ? C.burnt : "rgba(129,52,5,0.15)",
                      boxShadow: val ? `0 0 0 3px rgba(212,81,19,0.12)` : "none",
                      color: C.brown,
                    }}
                  />
                ))}
              </div>

              {/* Timer & Resend Controls */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-1" style={{ color: "rgba(129,52,5,0.6)" }}>
                  <Clock size={13} />
                  <span>
                    Expires in:{" "}
                    <span className="font-bold tabular-nums" style={{ color: timer > 10 ? C.brown : C.burnt }}>
                      0:{timer.toString().padStart(2, "0")}
                    </span>
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  {timer === 0 ? (
                    <motion.button
                      key="resendBtn"
                      type="button"
                      onClick={handleResendOtp}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="font-bold inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-85"
                      style={{ color: C.burnt }}
                    >
                      <RotateCcw size={12} /> Resend OTP
                    </motion.button>
                  ) : (
                    <span className="opacity-40 select-none font-medium" style={{ color: C.brown }}>
                      Resend Option Disabled
                    </span>
                  )}
                </AnimatePresence>
              </div>

              {validationError && (
                <p 
                  className="rounded-2xl px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5" 
                  style={{ background: "rgba(212,81,19,0.1)", color: C.burnt }}
                >
                  <AlertCircle size={14} />
                  {validationError}
                </p>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                className="w-full relative overflow-hidden rounded-2xl py-4 font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(110deg, ${C.brown} 0%, ${C.burnt} 50%, ${C.orange} 100%)`,
                  color: C.cream,
                  boxShadow: `0 4px 20px rgba(212,81,19,0.35)`,
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.10em",
                }}
              >
                Verify OTP
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Step 3: RESET PASSWORD */}
        {step === "reset" && (
          <motion.div
            key="reset"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-orange-200/50 shadow-card relative z-10"
            style={{
              background: "rgba(255,252,245,0.72)",
              border: "1.5px solid rgba(248,221,164,0.55)",
            }}
          >
            <div className="text-center mb-6">
              <h1
                className="text-2xl font-black tracking-tight"
                style={{
                  fontFamily: "var(--font-body)",
                  background: `linear-gradient(135deg, ${C.brown} 0%, ${C.burnt} 55%, ${C.orange} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Reset Password
              </h1>
              <p
                className="text-xs mt-2"
                style={{ color: "rgba(129,52,5,0.6)", fontFamily: "var(--font-body)" }}
              >
                Enter your new strong password below to complete the reset process.
              </p>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <Field
                icon={Lock}
                label="New Password"
                type="password"
                placeholder="enter new password"
                value={newPassword}
                onChange={setNewPassword}
              />

              <Field
                icon={Lock}
                label="Confirm Password"
                type="password"
                placeholder="confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />

              {validationError && (
                <p 
                  className="rounded-2xl px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5" 
                  style={{ background: "rgba(212,81,19,0.1)", color: C.burnt }}
                >
                  <AlertCircle size={14} />
                  {validationError}
                </p>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                className="w-full relative overflow-hidden rounded-2xl py-4 font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2"
                style={{
                  background: loading
                    ? "rgba(129,52,5,0.22)"
                    : `linear-gradient(110deg, ${C.brown} 0%, ${C.burnt} 50%, ${C.orange} 100%)`,
                  color: C.cream,
                  boxShadow: loading ? "none" : `0 4px 20px rgba(212,81,19,0.35)`,
                  transition: "background 0.3s",
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.10em",
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
                    />
                    Setting Password…
                  </span>
                ) : (
                  <span>Set Password</span>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
