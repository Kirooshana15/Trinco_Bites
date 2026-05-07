import { Link, useLocation } from "@tanstack/react-router";
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
import logo from "@/utils/assets/logo.png";
import { OffersBadge } from "./OffersBadge";

export function Navbar() {
  const { count } = useCart();
  const { searchQuery, setSearchQuery } = useSearch();
  const { pathname } = useLocation();

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

          {/* CENTER */}
          <div className="hidden md:flex items-center gap-4">


            {/* SEARCH BAR (LAPTOP VIEW) */}
            <div className="hidden lg:flex items-center gap-2 bg-white/70 border border-[#EADBC8] rounded-full px-4 py-2 w-64 focus-within:bg-white focus-within:border-[#D45113] transition-all shadow-sm">
              <Search className="h-4 w-4 text-[#813405]" />
              <input
                type="text"
                placeholder="Search food..."
                className="bg-transparent outline-none text-xs w-full text-[#813405] placeholder-[#8A6A52] font-serif"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* OFFERS BADGE */}
            <OffersBadge
              variant="navbar"
              count={3}
              onClick={() => console.log("Offers clicked")}
            />

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
            <button
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
          </div>
        </div>
      </header>

    </>
  );
}