import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Home,
  MapPin,
  ShoppingBag,
  User,
  Search,
  ChevronDown,
} from "lucide-react";

import { useCart } from "@/context/CartContext";
import { useSearch } from "@/context/SearchContext";
import { useAuth } from "@/context/AuthContext";
import logo from "@/utils/assets/logo.png";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

export function Navbar() {
  const { count } = useCart();
  const { searchQuery, setSearchQuery } = useSearch();
  const { pathname } = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest(".profile-dropdown-container")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* DESKTOP NAVBAR */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="mx-auto max-w-6xl px-2 sm:px-4 h-20 flex items-center justify-between gap-2">

          {/* LEFT */}
          <Link to="/home" className="flex items-center gap-2 sm:gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border border-white/20 flex-shrink-0">
              <img
                src={logo}
                alt="logo"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="leading-tight">
              <h1 className="font-black text-xl sm:text-2xl text-[#3B1700]">
                Trinco
                <span className="text-[#D45113]">Bites</span>
              </h1>

              <p className="hidden sm:block text-[11px] text-[#8A6A52]">
                Fast delivery · Local flavors
              </p>
            </div>
          </Link>

          {/* CENTER: SEARCH BAR (RESPONSIVE) */}
          <div className="flex items-center gap-2 bg-white/70 border border-[#EADBC8] rounded-full px-3 py-1.5 sm:px-4 sm:py-2 w-32 sm:w-48 md:w-64 focus-within:bg-white focus-within:border-[#D45113] transition-all shadow-sm mx-auto">
            <Search className="h-3 w-3 sm:h-4 sm:w-4 text-[#813405]" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-[10px] sm:text-xs w-full text-[#813405] placeholder-[#8A6A52] font-serif"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* CART */}
            <Link
              to="/cart"
              className="
                relative
                rounded-full
                bg-[#F8E7C4]
                p-3
                hover:scale-105
                transition
              "
            >
              <ShoppingBag className="h-5 w-5 text-[#813405]" />

              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="
                    absolute -top-1 -right-1
                    h-5 min-w-5 px-1
                    rounded-full
                    bg-[#D45113]
                    text-white
                    text-xs
                    grid place-items-center
                    font-semibold
                  "
                >
                  {count}
                </motion.span>
              )}
            </Link>

            {/* PROFILE */}
            <div className="relative profile-dropdown-container">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="
                  h-10 w-10 sm:h-11 sm:w-11
                  rounded-full
                  bg-white/70
                  border border-[#EADBC8]
                  flex items-center justify-center
                  hover:bg-white transition flex-shrink-0
                "
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-[#813405]" />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-xl border border-[#EADBC8] overflow-hidden z-50"
                  >
                    <div className="p-2 space-y-1">
                      {isAuthenticated ? (
                        <>
                          <div className="px-3 py-2 border-b border-[#F8E7C4] mb-1">
                            <p className="text-[10px] uppercase tracking-wider text-[#8A6A52] font-bold">Account</p>
                            <p className="text-sm font-bold text-[#3B1700] truncate">{user?.name}</p>
                          </div>
                          <Link
                            to="/track"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-[#813405] hover:bg-[#F8E7C4]/50 transition"
                          >
                            My Orders
                          </Link>
                          <button
                            onClick={() => {
                              logout();
                              setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition"
                          >
                            Logout
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/checkout"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-[#813405] hover:bg-[#F8E7C4]/50 transition"
                          >
                            Checkout
                          </Link>
                          <Link
                            to="/login"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-[#813405] hover:bg-[#F8E7C4]/50 transition"
                          >
                            Login
                          </Link>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

    </>
  );
}