import { Link, useParams, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  MapPin,
  ShoppingBag,
  Check,
  Flame,
  Sparkles
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useRestaurants } from "@/context/RestaurantContext";
import { useCart } from "@/context/CartContext";
import { isRestaurantOpen } from "@/utils/time";

const CARD_COLORS = [
  "#D97745",
  "#3BA99C",
  "#E05D5D",
  "#5C85D6",
  "#9A6DCC",
  "#4DA89E",
];

export function FoodDetailPage() {
  const { findFoodItem } = useRestaurants();
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const data = findFoodItem(id || "");
  const { add } = useCart();

  const [regularQty, setRegularQty] = useState(1);
  const [largeQty, setLargeQty] = useState(0);
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [instructions, setInstructions] = useState("");
  const [isFav, setIsFav] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const { food, restaurant } = data;
  const restaurantOpen = isRestaurantOpen(restaurant);
  const isDrink =
    food.category.toLowerCase().includes("drink") ||
    food.category.toLowerCase().includes("juice") ||
    food.category.toLowerCase().includes("mojito");

  const getCategoryExtras = (category: string, name: string) => {
    const cat = category.toLowerCase();
    const n = name.toLowerCase();
    let extras = [];

    const getProtein = (text: string) => {
      if (text.includes("chicken")) return { name: "Extra Chicken", price: 350 };
      if (text.includes("beef")) return { name: "Extra Beef", price: 400 };
      if (text.includes("prawn")) return { name: "Extra Prawn", price: 450 };
      if (text.includes("seafood")) return { name: "Extra Seafood", price: 450 };
      if (text.includes("mutton")) return { name: "Extra Mutton", price: 500 };
      return null;
    };

    const protein = getProtein(n);
    if (protein) extras.push(protein);

    if (cat.includes("burger")) {
      extras.push(
        { name: "Extra Cheese", price: 150 },
        { name: "Extra Patty", price: 300 },
        { name: "Fried Egg", price: 100 },
        { name: "Bacon Strip", price: 250 }
      );
    } else if (cat.includes("pizza")) {
      extras.push(
        { name: "Extra Cheese", price: 250 },
        { name: "Black Olives", price: 150 },
        { name: "Mushroom", price: 150 },
        { name: "Pepperoni", price: 300 }
      );
    } else if (cat.includes("drink") || cat.includes("juice") || cat.includes("mojito")) {
      extras.push(
        { name: "Extra Mint", price: 50 },
        { name: "Extra Ice", price: 0 },
        { name: "Less Sugar", price: 0 },
        { name: "Fresh Fruit", price: 100 }
      );
    } else {
      extras.push(
        { name: "Extra Egg", price: 150 },
        { name: "Cheese", price: 200 },
        { name: "Spicy Gravy", price: 100 }
      );
    }

    return extras;
  };

  const currentExtras = getCategoryExtras(food.category, food.name);

  const variants = restaurant.menu.filter((m) => m.category === food.category);
  const currentIndex = variants.findIndex((v) => v.id === food.id);

  const navigateToVariant = (index: number) => {
    const nextIndex = (index + variants.length) % variants.length;
    navigate({ to: "/food/$id", params: { id: variants[nextIndex].id } });
  };

  const basePrice = food.price;
  const largePrice = basePrice * 1.5;
  const extrasTotal = Array.from(selectedExtras).reduce((acc, name) => {
    const extra = currentExtras.find((e) => e.name === name);
    return acc + (extra?.price || 0);
  }, 0);

  const totalItems = regularQty + largeQty;
  const totalPrice =
    regularQty * basePrice + largeQty * largePrice + extrasTotal * totalItems;

  const uniqueCategories = Array.from(
    new Set(restaurant.menu.map((m) => m.category))
  );
  const catIndex = uniqueCategories.indexOf(food.category);
  const bgColor = CARD_COLORS[catIndex % CARD_COLORS.length];

  const handleAddToCart = () => {
    if (!restaurantOpen) return;
    const extrasObjects = Array.from(selectedExtras).map(
      (name) => currentExtras.find((e) => e.name === name)!
    );
    if (regularQty > 0) {
      add(food, restaurant.id, regularQty, {
        selectedSize: "Regular",
        selectedExtras: extrasObjects,
        instructions,
        customPrice: basePrice + extrasTotal,
      });
    }
    if (largeQty > 0) {
      add(food, restaurant.id, largeQty, {
        selectedSize: "Large",
        selectedExtras: extrasObjects,
        instructions,
        customPrice: largePrice + extrasTotal,
      });
    }
    navigate({ to: "/cart" });
  };

  const toggleExtra = (name: string) => {
    const next = new Set(selectedExtras);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedExtras(next);
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-[#F7F0E3]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <Navbar />

      <main className="flex-1 px-3 md:px-8 py-6 md:py-10 pb-16">
        <div className="max-w-7xl mx-auto">

          {/* ── HERO CARD ── */}
          <div className="relative flex min-h-[520px] w-full flex-col overflow-hidden rounded-[36px] border border-white/30 bg-white/70 shadow-[0_32px_80px_rgba(0,0,0,0.18)] backdrop-blur-sm md:rounded-[48px] lg:flex-row">

            {/* LEFT — Hero Image Panel */}
            <div
              className="relative flex min-h-[280px] sm:min-h-[420px] w-full items-center justify-center overflow-hidden lg:min-h-[680px] lg:w-[44%]"
              style={{ background: `linear-gradient(160deg, ${bgColor} 0%, ${bgColor}bb 100%)` }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 25% 20%, rgba(255,255,255,0.3), transparent 26%), radial-gradient(circle at 78% 28%, rgba(248,221,164,0.22), transparent 24%), linear-gradient(180deg, rgba(18,4,0,0.08), rgba(18,4,0,0.3))",
                }}
              />
              {/* Diagonal clip overlay */}
              <div
                className="absolute inset-0 hidden lg:block pointer-events-none z-10"
                style={{
                  background: "linear-gradient(to right, transparent 88%, #F7F0E3 100%)",
                  clipPath: "polygon(0 0, 93% 0, 100% 50%, 93% 100%, 0 100%)",
                }}
              />

              {/* Ambient glow rings */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `radial-gradient(ellipse 70% 70% at 50% 55%, white, transparent)`,
                }}
              />

              {/* Back button */}
              <button
                onClick={() => window.history.back()}
                className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/35 transition-all border border-white/20 shadow-lg"
              >
                <ArrowLeft size={20} />
              </button>

              {/* Wishlist button */}
              <button
                onClick={() => setIsFav(!isFav)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/35 transition-all border border-white/20 shadow-lg"
              >
                <Heart
                  size={20}
                  className={isFav ? "text-red-400 fill-red-400" : "text-white"}
                />
              </button>

              {/* Variant navigation */}
              {variants.length > 1 && (
                <>
                  <button
                    onClick={() => navigateToVariant(currentIndex - 1)}
                    className="absolute left-5 bottom-1/2 translate-y-1/2 z-30 h-11 w-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all border border-white/20"
                  >
                    <ChevronLeft size={22} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => navigateToVariant(currentIndex + 1)}
                    className="absolute right-5 bottom-1/2 translate-y-1/2 z-30 h-11 w-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all border border-white/20"
                  >
                    <ChevronRight size={22} strokeWidth={2.5} />
                  </button>
                </>
              )}

              {/* Food Image */}
              <motion.div
                layoutId={`card-image-container-${food.id}`}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                className="relative z-20"
              >
                {/* Spinning ring decoration */}
                <div
                  className="absolute inset-0 rounded-full border-[3px] border-dashed border-white/30 animate-spin"
                  style={{ animationDuration: "20s", margin: "-18px" }}
                />
                <div className="h-48 w-48 sm:h-64 sm:w-64 md:h-80 md:w-80 lg:h-[380px] lg:w-[380px] rounded-full shadow-[0_24px_64px_rgba(0,0,0,0.35)] overflow-hidden border-[10px] border-white/25">
                  <motion.img
                    layoutId={`card-image-${food.id}`}
                    transition={{ type: "spring", stiffness: 220, damping: 24 }}
                    src={food.image}
                    alt={food.name}
                    className="h-full w-full object-cover scale-110"
                  />
                </div>
              </motion.div>

              {/* Ghost category watermark */}
              <p
                className="absolute bottom-3 left-0 right-0 text-center text-[72px] font-black text-white/5 pointer-events-none select-none tracking-widest uppercase leading-none"
              >
                {food.category}
              </p>

              {/* Variant dots */}
              {variants.length > 1 && (
                <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
                  {variants.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => navigateToVariant(i)}
                      className={`cursor-pointer rounded-full transition-all duration-300 ${i === currentIndex
                          ? "w-7 h-2 bg-white"
                          : "w-2 h-2 bg-white/35 hover:bg-white/60"
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — Detail Panel */}
            <div
              ref={contentRef}
              className="flex flex-1 flex-col gap-7 overflow-y-auto bg-[linear-gradient(180deg,#fffdf9_0%,#fff7ef_100%)] px-7 py-8 md:px-10 lg:px-12"
            >
              {/* Header */}
              <div className="py-2">
                {/* Tags row */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-[9px] font-black uppercase tracking-[0.18em]">
                    {food.category}
                  </span>
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-500 text-xs font-bold">
                    <Star size={11} fill="currentColor" />
                    {food.rating}
                  </span>
                  {food.popular && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-500 text-[9px] font-black uppercase tracking-wider">
                      <Flame size={10} fill="currentColor" /> Popular
                    </span>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={food.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                  >
                    <h1
                      className="text-3xl sm:text-4xl md:text-5xl xl:text-[3.6rem] font-black text-slate-900 leading-[1.05] mb-3"
                      style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
                    >
                      {food.name}
                    </h1>
                    <p className="text-slate-400 text-sm md:text-[0.95rem] leading-relaxed italic">
                      "{food.description ||
                        "Freshly prepared with authentic ingredients and local spices for a taste you'll never forget."}"
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-6 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                  <Link
                    to="/restaurant/$id"
                    params={{ id: restaurant.id }}
                    className="flex items-center gap-4 py-2 transition-opacity hover:opacity-80"
                  >
                    <div className="h-14 w-14 overflow-hidden rounded-2xl shadow-md ring-2 ring-white">
                      <img src={restaurant.image} alt={restaurant.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#B98A66]">From Restaurant</p>
                      <p className="truncate text-sm font-black text-slate-900">{restaurant.name}</p>
                      <p className="truncate text-xs text-slate-500">{restaurant.location}</p>
                    </div>
                  </Link>

                  <div className="py-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#B98A66]">Base Price</p>
                    <p className="mt-1 text-2xl md:text-3xl font-black leading-none text-slate-900">Rs. {basePrice.toLocaleString()}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {isDrink ? "Single serve with optional add-ons." : "Choose your preferred portion and extras below."}
                    </p>
                  </div>
                </div>

                {!restaurantOpen && (
                  <div className="mt-4 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                    This restaurant is closed now. Ordering is temporarily unavailable until it opens again.
                  </div>
                )}

              </div>

              {/* ── SECTION 1: Portions / Quantity ── */}
              <section className="py-2">
                <SectionLabel number={1} label={isDrink ? "Quantity" : "Choose Portion"} />

                {isDrink ? (
                  <PortionRow
                    label="Standard"
                    sublabel="Regular"
                    price={basePrice}
                    qty={regularQty}
                    active={regularQty > 0}
                    onDec={() => restaurantOpen && setRegularQty(Math.max(1, regularQty - 1))}
                    onInc={() => restaurantOpen && setRegularQty(regularQty + 1)}
                    disabled={!restaurantOpen}
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    <PortionRow
                      label="Regular"
                      sublabel="Standard"
                      price={basePrice}
                      qty={regularQty}
                      active={regularQty > 0}
                      onDec={() => restaurantOpen && setRegularQty(Math.max(0, regularQty - 1))}
                      onInc={() => restaurantOpen && setRegularQty(regularQty + 1)}
                      disabled={!restaurantOpen}
                    />
                    <PortionRow
                      label="Large"
                      sublabel="Bigger"
                      price={largePrice}
                      qty={largeQty}
                      active={largeQty > 0}
                      onDec={() => restaurantOpen && setLargeQty(Math.max(0, largeQty - 1))}
                      onInc={() => restaurantOpen && setLargeQty(largeQty + 1)}
                      disabled={!restaurantOpen}
                    />
                  </div>
                )}
              </section>

              {/* ── SECTION 2: Extras ── */}
              <section className="py-2">
                <SectionLabel number={2} label="Add Extras" />
                <div className="flex flex-wrap gap-2.5">
                  {currentExtras.map((extra) => {
                    const active = selectedExtras.has(extra.name);
                    return (
                      <button
                        key={extra.name}
                        disabled={!restaurantOpen}
                        onClick={() => toggleExtra(extra.name)}
                        className={`group flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 transition-all duration-200 text-sm font-bold ${active
                            ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm shadow-orange-200"
                            : "border-slate-100 bg-transparent text-slate-600 hover:border-slate-300 hover:bg-white/40"
                          }`}
                      >
                        <span
                          className={`flex items-center justify-center h-5 w-5 rounded-lg transition-all ${active
                              ? "bg-orange-500 text-white"
                              : "bg-white border-2 border-slate-200 text-transparent group-hover:border-slate-300"
                            }`}
                        >
                          <Check size={11} strokeWidth={4} />
                        </span>
                        {extra.name}
                        <span className="text-[10px] font-black text-slate-400 ml-0.5">
                          {extra.price === 0 ? "Free" : `+Rs.${extra.price}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ── SECTION 3: Instructions ── */}
              <section className="py-2">
                <SectionLabel number={3} label="Special Instructions" />
                <div className="relative">
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    disabled={!restaurantOpen}
                    placeholder="e.g. Less spicy, no onions, extra gravy…"
                    rows={3}
                    className="w-full px-5 py-4 rounded-2xl bg-transparent border-2 border-slate-100 focus:border-orange-400 focus:bg-white/40 transition-all outline-none text-slate-700 text-sm resize-none leading-relaxed placeholder:text-slate-300"
                  />
                  {instructions && (
                    <Sparkles
                      size={14}
                      className="absolute top-4 right-4 text-orange-400"
                    />
                  )}
                </div>
              </section>

              <motion.section
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 24 }}
                className="py-4 mt-4 border-t border-[#F2D9BC]/30"
              >
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <div className="flex min-w-0 flex-1 flex-col text-left">
                    <span className="mb-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Total
                    </span>
                    <span className="text-lg md:text-2xl font-black leading-none text-slate-900">
                      Rs. {totalPrice.toLocaleString()}
                    </span>
                    {totalItems > 1 && (
                      <span className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        {[
                          regularQty > 0 && `${regularQty} Regular`,
                          largeQty > 0 && `${largeQty} Large`,
                        ]
                          .filter(Boolean)
                          .join(" + ")}
                      </span>
                    )}
                  </div>

                  <button
                    disabled={totalItems === 0 || !restaurantOpen}
                    onClick={handleAddToCart}
                    className={`inline-flex shrink-0 items-center justify-center gap-1.5 md:gap-2.5 rounded-2xl px-3 sm:px-4 md:px-7 py-3 md:py-3.5 font-black text-[13px] md:text-base text-white transition-all ${
                      totalItems > 0 && restaurantOpen
                        ? "bg-orange-600 hover:bg-orange-700 hover:scale-[1.02] active:scale-[0.97] shadow-lg shadow-orange-600/25"
                        : "bg-slate-200 cursor-not-allowed opacity-60"
                    }`}
                  >
                    {restaurantOpen ? "Add to Cart" : "Restaurant Closed"}
                    <ShoppingBag size={18} strokeWidth={2.5} />
                    {totalItems > 0 && (
                      <span className="ml-0.5 rounded-xl bg-white/25 px-2 py-0.5 text-xs font-black">
                        {totalItems}
                      </span>
                    )}
                  </button>
                </div>
              </motion.section>
            </div>
          </div>

          {/* ── FLOATING ORDER BAR ── */}
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ─── Sub-components ─── */

function SectionLabel({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 mb-4">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#813405] text-xs font-black text-white shadow-[0_10px_18px_rgba(129,52,5,0.25)]">
        {number}
      </span>
      <span className="text-base font-black tracking-tight text-slate-800">{label}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-[#F2D9BC] to-transparent" />
    </div>
  );
}

function PortionRow({
  label,
  sublabel,
  price,
  qty,
  active,
  onDec,
  onInc,
  disabled = false,
}: {
  label: string;
  sublabel: string;
  price: number;
  qty: number;
  active: boolean;
  onDec: () => void;
  onInc: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-[24px] border-2 px-3.5 py-3 sm:px-5 sm:py-4 transition-all duration-200 ${active
          ? "border-orange-400 bg-[linear-gradient(135deg,rgba(255,243,227,0.95),rgba(255,255,255,0.98))] shadow-[0_12px_24px_rgba(249,160,63,0.12)]"
          : "border-transparent bg-transparent hover:border-slate-200"
        }`}
    >
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 mr-2">
        <div
          className={`flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-xl text-[10px] sm:text-sm font-black transition-colors ${active ? "bg-orange-600 text-white" : "border-2 border-[#EEDBC4] bg-transparent text-slate-400"
            }`}
        >
          {label[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-slate-900 text-xs sm:text-sm leading-tight">{label} Portion</p>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5 leading-tight">
            <span className="font-bold text-slate-700">Rs. {price.toLocaleString()}</span> · {sublabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          disabled={disabled}
          onClick={onDec}
          className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-200 transition-all disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus size={14} strokeWidth={3} />
        </button>
        <span className="text-sm sm:text-base font-black text-slate-900 w-4 sm:w-5 text-center tabular-nums">
          {qty}
        </span>
        <button
          disabled={disabled}
          onClick={onInc}
          className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white hover:bg-orange-600 transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
