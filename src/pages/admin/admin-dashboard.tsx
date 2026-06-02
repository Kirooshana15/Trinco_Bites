import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LogOut, Shield, Users, Store, TrendingUp, Key } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { C } from "@/utils/theme";

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    // Route guard: only main admins allowed
    if (!isAuthenticated) {
      navigate({ to: "/business_login" });
    } else if (user?.role !== "main_admin") {
      // Redirect other roles to their proper places
      if (user?.role === "restaurant_admin") {
        navigate({ to: "/restaurant/dashboard" });
      } else {
        navigate({ to: "/home" });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/business_login" });
  };

  if (!isAuthenticated || user?.role !== "main_admin") {
    return null; // Don't flash dashboard while redirecting
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  return (
    <div className="min-h-screen bg-gradient-soft px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#F8DDA4]/30">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#D45113]/10 text-[#D45113]">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#813405] tracking-tight">
                System Administration
              </h1>
              <p className="text-xs font-semibold text-[#D45113]/70 mt-0.5">
                Logged in as: <span className="underline">{user?.email}</span>
              </p>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleLogout}
            className="self-start sm:self-center flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition border border-[#D45113]/20 hover:bg-[#D45113]/10 text-[#813405]"
          >
            <LogOut size={16} /> Logout
          </motion.button>
        </header>

        {/* Dashboard Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Welcome Card */}
          <motion.div
            variants={item}
            className="md:col-span-3 rounded-3xl p-6 relative overflow-hidden"
            style={{
              background: "rgba(255,252,245,0.85)",
              backdropFilter: "blur(20px)",
              border: "1.5px solid rgba(248,221,164,0.55)",
              boxShadow: `0 8px 32px rgba(129,52,5,0.06)`,
            }}
          >
            <div className="relative z-10">
              <h2 className="text-xl md:text-2xl font-bold text-[#813405]">
                Welcome, {user?.name || "Administrator"}! 🛠️
              </h2>
              <p className="text-sm text-[#813405]/80 mt-2 max-w-2xl leading-relaxed">
                As the Main Administrator, you hold full root access. Manage global configuration settings, register and audit restaurant administrator accounts, run security sweeps, and analyze sitewide user engagement.
              </p>
            </div>
            {/* Design accents */}
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-4 translate-x-4">
              <Shield size={160} className="text-[#D45113]" />
            </div>
          </motion.div>

          {/* Quick Metrics */}
          <motion.div
            variants={item}
            className="rounded-3xl p-6 flex flex-col justify-between"
            style={{
              background: "rgba(255,252,245,0.85)",
              border: "1.5px solid rgba(248,221,164,0.55)",
              boxShadow: `0 8px 32px rgba(129,52,5,0.06)`,
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#D45113]">Platform Users</p>
                <h3 className="text-3xl font-black text-[#813405] mt-1">1,482 Active</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                <Users size={20} />
              </div>
            </div>
            <p className="text-xs font-semibold text-[#813405]/60 mt-4">+45 new signups today</p>
          </motion.div>

          <motion.div
            variants={item}
            className="rounded-3xl p-6 flex flex-col justify-between"
            style={{
              background: "rgba(255,252,245,0.85)",
              border: "1.5px solid rgba(248,221,164,0.55)",
              boxShadow: `0 8px 32px rgba(129,52,5,0.06)`,
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#D45113]">Total Restaurants</p>
                <h3 className="text-3xl font-black text-[#813405] mt-1">28 Registered</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-[#D45113]">
                <Store size={20} />
              </div>
            </div>
            <p className="text-xs font-semibold text-[#D45113] mt-4">2 new applications pending approval</p>
          </motion.div>

          <motion.div
            variants={item}
            className="rounded-3xl p-6 flex flex-col justify-between"
            style={{
              background: "rgba(255,252,245,0.85)",
              border: "1.5px solid rgba(248,221,164,0.55)",
              boxShadow: `0 8px 32px rgba(129,52,5,0.06)`,
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#D45113]">Platform Volume</p>
                <h3 className="text-3xl font-black text-[#813405] mt-1">LKR 312.4K</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600">
                <TrendingUp size={20} />
              </div>
            </div>
            <p className="text-xs font-semibold text-green-600 mt-4">+18% gross growth this week</p>
          </motion.div>

          {/* Action section for Main Admin */}
          <motion.div
            variants={item}
            className="md:col-span-3 rounded-3xl p-6 flex flex-col gap-4"
            style={{
              background: "rgba(255,252,245,0.85)",
              border: "1.5px solid rgba(248,221,164,0.55)",
              boxShadow: `0 8px 32px rgba(129,52,5,0.06)`,
            }}
          >
            <div>
              <h3 className="text-lg font-bold text-[#813405] flex items-center gap-2">
                <Key size={18} className="text-[#D45113]" /> Administrative Actions
              </h3>
              <p className="text-xs text-[#813405]/70 mt-1">
                Perform direct platform tasks.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              <button
                disabled
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#D45113]/40 cursor-not-allowed"
              >
                Create Restaurant Admin Account (Disabled)
              </button>
              <button
                disabled
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#813405] border border-[#813405]/20 cursor-not-allowed"
              >
                View System Audit Logs (Disabled)
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
