import { Link, useParams } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Clock,
  MapPin,
  ShoppingBag,
  ArrowLeft,
  Bike,
  Store,
  Heart,
  ChevronRight,
  Info,
  Plus,
  Minus,
  X,
  ChevronLeft
} from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FoodCard } from "@/components/FoodCard";
import { OffersBadge } from "@/components/OffersBadge";
import { findRestaurant, categories, type FoodItem } from "@/utils/data/mock";
import { useCart } from "@/context/CartContext";

/* ── Palette ─────────────────────────────────────────────────────── */
const C = {
  brown: "#813405",
  burnt: "#D45113",
  orange: "#F9A03F",
  cream: "#F8DDA4",
  olive: "#606C38",
  bg: "#F7F0E3",
  vibrant: {
    yellow: "#F9C74F",
    teal: "#4D908E",
    pink: "#F94144",
    orange: "#F8961E",
    blue: "#277DA1",
    green: "#90BE6D"
  }
} as const;

const VIBRANT_COLORS = Object.values(C.vibrant);

/* ── Status Helper ───────────────────────────────────────────────── */
function isCurrentlyOpen(open: string, close: string) {
  const now = new Date();
  const parseTime = (t: string) => {
    const [time, period] = t.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  };
  const openTime = parseTime(open);
  const closeTime = parseTime(close);
  return now >= openTime && now <= closeTime;
}

/* ── Category Chip ──────────────────────────────────────────────── */
function CatChip({
  label,
  image,
  active,
  onClick,
}: {
  label: string;
  image: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      className="flex flex-col items-center flex-shrink-0 gap-2 px-2"
      style={{ minWidth: 70 }}
    >
      <motion.div
        animate={{
          background: active
            ? `linear-gradient(135deg, ${C.burnt}, ${C.orange})`
            : "rgba(255,255,255,0.9)",
          scale: active ? 1.05 : 1,
        }}
        className="h-16 w-16 rounded-full flex items-center justify-center overflow-hidden border-2 shadow-sm transition-all"
        style={{
          borderColor: active ? C.burnt : "rgba(129,52,5,0.1)",
          boxShadow: active ? `0 4px 15px rgba(212,81,19,0.3)` : "none",
        }}
      >
        <img src={image} alt={label} className="w-full h-full object-cover" />
      </motion.div>
      <span
        className="text-[11px] font-black uppercase tracking-tight text-center"
        style={{ color: active ? C.burnt : C.brown }}
      >
        {label}
      </span>
    </motion.button>
  );
}

/* ── Visual Constants ───────────────────────────────────────────── */
const CARD_COLORS = [
  "#D97745",
  "#3BA99C",
  "#E05D5D",
  "#5C85D6",
  "#9A6DCC",
  "#4DA89E",
];

/* ── Menu Row Card ──────────────────────────────────────────────── */
function MenuRow({ item, index, restaurantId, onSelect }: {
  item: FoodItem;
  index: number;
  restaurantId: string;
  onSelect: (item: FoodItem) => void;
}) {

  return (
    <motion.div
      layoutId={`card-bg-${item.id}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={() => onSelect(item)}
      className="relative flex flex-col lg:h-full rounded-[40px] p-6 shadow-2xl border border-white/20 cursor-pointer overflow-visible"
      style={{ background: CARD_COLORS[index % CARD_COLORS.length] }}
    >
      <motion.div
        layoutId={`card-texture-${item.id}`}
        className="absolute inset-0 opacity-10 pointer-events-none rounded-[40px]"
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/subtle-surface.png')",
          opacity: 0.1
        }}
      />

      <div className="flex-1 flex flex-col items-start text-left z-10 pr-4">
        <motion.h3
          layoutId={`card-title-${item.id}`}
          className="text-lg md:text-xl font-black text-white mb-2 leading-tight drop-shadow-md"
        >
          {item.category}
        </motion.h3>
        <motion.p
          layoutId={`card-desc-${item.id}`}
          className="text-white/80 text-[11px] font-medium leading-relaxed max-w-[140px]"
        >
          {CAT_DESCRIPTIONS[item.category] || item.description || "Freshly prepared with authentic ingredients and local spices."}
        </motion.p>
      </div>

      <motion.div
        layoutId={`card-image-container-${item.id}`}
        className="absolute bottom-[-20px] right-[-20px] z-30"
      >
        <div className="h-28 w-28 md:h-32 md:w-32 rounded-full border-[6px] border-white shadow-2xl overflow-hidden bg-white transform rotate-[-10deg]">
          <motion.img
            layoutId={`card-image-${item.id}`}
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Category Descriptions ────────────────────────────────────────── */
const CAT_DESCRIPTIONS: Record<string, string> = {
  "Kottu": "Chopped roti stir-fried with spicy curry, vegetables, eggs, and your favorite meat for the ultimate Sri Lankan street-food experience.",
  "Noodles": "Flavor-packed stir-fried noodles tossed with fresh vegetables, sauces, and delicious chicken or seafood options.",
  "Srilankan Foods": "Authentic local meals rich with traditional spices, aromatic curries, rice, and homemade flavors from Sri Lanka.",
  "Fried Rice": "Wok-fried rice mixed with vegetables, eggs, and your choice of chicken, seafood, or beef for a satisfying meal.",
  "Nasi Goreng": "Indonesian-style spicy fried rice blended with sweet soy sauce, chili flavors, and perfectly cooked proteins.",
  "Seafood": "Fresh ocean flavors featuring prawns, crab, fish, and calamari cooked with bold coastal seasonings.",
  "Briyani": "Aromatic basmati rice layered with flavorful spices and tender meat, slow-cooked for a rich traditional taste.",
  "Chinese Rice": "Delicious Chinese-style rice dishes cooked with savory sauces, vegetables, and sizzling meat combinations.",
  "Burgers": "Juicy burgers stacked with crispy patties, melted cheese, fresh veggies, and signature sauces.",
  "Pizza": "Oven-baked pizzas loaded with cheesy goodness, fresh toppings, and flavorful sauces on a crispy crust.",
  "Soft Drinks": "Refreshing chilled beverages perfect for pairing with your favorite meals and snacks.",
  "Juice": "Freshly blended fruit juices packed with natural sweetness, tropical flavors, and refreshing energy.",
  "Mojito": "Cool minty mocktails mixed with fruity flavors, citrus freshness, and sparkling refreshment.",
  "Milkshake": "Creamy thick milkshakes blended with rich flavors, ice cream, and sweet toppings.",
  "Desserts": "Sweet treats and delightful desserts crafted to perfectly finish your meal experience.",
  "Omlete": "Fluffy egg omelets filled with vegetables, cheese, and savory ingredients for a simple tasty bite.",
};

export function RestaurantPage() {
  const { id } = useParams({ strict: false });
  const r = findRestaurant(id || "");
  const { count, add, decrement, items: cartItems } = useCart();
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);

  // Get current quantity of selected item from cart
  const currentQty = selectedItem ? (cartItems.find(i => i.id === selectedItem.id)?.quantity || 0) : 0;

  if (!r) return null;

  const isOpen = isCurrentlyOpen(r.openingTime, r.closingTime);

  const uniqueMenu = useMemo(() => {
    const seen = new Set<string>();
    return r.menu.filter((item) => {
      if (seen.has(item.category)) return false;
      seen.add(item.category);
      return true;
    });
  }, [r.menu]);

  const filteredMenu = useMemo(() => {
    if (activeCategory === "All") return uniqueMenu;
    return uniqueMenu.filter(item => item.category === activeCategory);
  }, [uniqueMenu, activeCategory]);

  const popularItems = useMemo(() => {
    return r.menu.filter(item => item.popular).slice(0, 3);
  }, [r.menu]);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: C.bg, fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      <Navbar />

      <main className="flex-1">
        {/* ── Hero Banner ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-b-[40px] md:rounded-b-[80px]" style={{ minHeight: 400 }}>
          <div className="absolute inset-0 rounded-b-[40px] md:rounded-b-[80px] overflow-hidden">
            <img src={r.image} alt={r.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(18,4,0,0.4) 0%, rgba(18,4,0,0.85) 100%)" }} />
          </div>

          <div className="relative mx-auto max-w-6xl px-5 pt-8 pb-12 flex flex-col justify-between min-h-[400px]">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Link to="/home" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition">
                <ArrowLeft size={16} /> Back to Home
              </Link>
            </motion.div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex-1">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 rounded-2xl bg-white p-1 shadow-xl border-2 border-[#F8DDA4]/30 overflow-hidden">
                    <img src={r.image} alt="logo" className="h-full w-full object-cover rounded-xl" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#D45113] text-white text-[10px] font-bold uppercase tracking-widest">
                    {r.category}
                  </div>
                </motion.div>

                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="text-4xl md:text-5xl font-black text-white leading-tight">
                  {r.name}
                </motion.h1>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="mt-4 flex flex-wrap items-center gap-4 text-white/80 text-sm">
                  <div className="flex items-center gap-1.5"><MapPin size={14} className="text-[#F9A03F]" /> {r.location}</div>
                  <div className="flex items-center gap-1.5"><Star size={14} className="text-[#F9A03F] fill-[#F9A03F]" /> {r.rating} (500+ reviews)</div>
                </motion.div>
              </div>

              {r.hasOffer && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}>
                  <OffersBadge variant="detail" label={r.offerText} />
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* ── Restaurant Info Section ─────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 -mt-10 relative z-20">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-[32px] p-6 shadow-2xl border border-[#F8DDA4]/40 grid grid-cols-2 md:grid-cols-4 gap-6">

            <div className="flex flex-col items-center text-center p-2">
              <div className={`flex items-center gap-2 mb-2 px-3 py-1 rounded-full text-[10px] font-black ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {isOpen ? 'OPEN NOW' : 'CLOSED'}
              </div>
              <p className="text-xs text-slate-500">Closes at {r.closingTime}</p>
            </div>

            <div className="flex flex-col items-center text-center p-2 border-l border-slate-100">
              <Bike className="text-[#D45113] mb-2" size={20} />
              <p className="text-sm font-bold text-[#813405]">{r.deliveryTime}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Delivery Time</p>
            </div>

            <div className="flex flex-col items-center text-center p-2 border-l border-slate-100">
              <Store className="text-[#D45113] mb-2" size={20} />
              <p className="text-sm font-bold text-[#813405]">{r.deliveryRadius} km</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Delivery Radius</p>
            </div>

            <div className="flex flex-col items-center text-center p-2 border-l border-slate-100">
              <Info className="text-[#D45113] mb-2" size={20} />
              <p className="text-sm font-bold text-[#813405]">Verified</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Restaurant info</p>
            </div>
          </motion.div>
        </section>




        {/* ── Menu Display Section (Responsive Grid) ──────────────────── */}
        <section className="mx-auto max-w-7xl px-4 mt-8 pb-24">
          <motion.h2
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black text-[#813405] mb-8 text-center md:text-left"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {activeCategory === "All" ? "Full Menu" : `${activeCategory} Items`}
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            <AnimatePresence mode="popLayout">
              {filteredMenu.map((item, i) => (
                <MenuRow
                  key={item.id}
                  item={item}
                  index={uniqueMenu.findIndex(m => m.category === item.category)}
                  restaurantId={r.id}
                  onSelect={setSelectedItem}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* ── Food Detail Overlay (Mobile App Style) ─────────────────── */}
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedItem(null)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />

              <motion.div
                layoutId={`card-bg-${selectedItem.id}`}
                className="relative w-full h-full md:h-[90vh] md:max-w-md bg-white md:rounded-[60px] overflow-hidden shadow-2xl flex flex-col"
              >
                {/* Diagonal Background Split */}
                <div
                  className="absolute inset-0 z-0 pointer-events-none transition-colors duration-500"
                  style={{
                    background: `linear-gradient(135deg, white 50%, ${selectedItem.id ? CARD_COLORS[uniqueMenu.findIndex(m => m.category === selectedItem.category) % CARD_COLORS.length] : '#F9C74F'} 50%)`
                  }}
                />

                {/* Top Nav */}
                <div className="relative z-10 flex items-center justify-between px-8 pt-12 pb-6">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedItem(null)}
                    className="h-10 w-10 flex items-center justify-center text-slate-800"
                  >
                    <ArrowLeft size={24} />
                  </motion.button>
                  <div className="flex items-center gap-4 text-slate-800">
                    <Heart size={22} />
                  </div>
                </div>

                {/* Title & Emojis */}
                <div className="relative z-10 text-center px-8">
                  <motion.h3
                    className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2 mb-1"
                  >
                    🍽️ Taste the Trinco Heat 🔥
                  </motion.h3>
                  <motion.p
                    layoutId={`card-title-${selectedItem.id}`}
                    className="text-lg text-slate-600 uppercase tracking-wide"
                  >
                    {selectedItem.name}
                  </motion.p>
                </div>

                {/* Large Center Image with Carousel Effect & Arrows */}
                <div className="relative z-10 flex-1 flex items-center justify-center py-4 px-4">
                  {/* Left Arrow */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const variants = r.menu.filter(m => m.category === selectedItem.category);
                      const idx = variants.findIndex(m => m.id === selectedItem.id);
                      const prevIdx = (idx - 1 + variants.length) % variants.length;
                      setSelectedItem(variants[prevIdx]);
                    }}
                    className="absolute left-4 z-50 h-10 w-10 rounded-full bg-white/80 backdrop-blur shadow-md flex items-center justify-center text-slate-800 hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>

                  <motion.div
                    layoutId={`card-image-container-${selectedItem.id}`}
                    className="relative z-20"
                  >
                    <div className="h-64 w-64 md:h-72 md:w-72 rounded-full border-[8px] border-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden bg-white">
                      <motion.img
                        layoutId={`card-image-${selectedItem.id}`}
                        src={selectedItem.image}
                        alt={selectedItem.name}
                        className="h-full w-full object-cover scale-110"
                      />
                    </div>
                  </motion.div>

                  {/* Right Arrow */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const variants = r.menu.filter(m => m.category === selectedItem.category);
                      const idx = variants.findIndex(m => m.id === selectedItem.id);
                      const nextIdx = (idx + 1) % variants.length;
                      setSelectedItem(variants[nextIdx]);
                    }}
                    className="absolute right-4 z-50 h-10 w-10 rounded-full bg-white/80 backdrop-blur shadow-md flex items-center justify-center text-slate-800 hover:bg-white transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>

                {/* Bottom Content Area */}
                <div className="relative z-10 px-8 pb-12 flex flex-col items-center">
                  <div className="mb-10 text-center">
                    <p className="text-5xl font-black text-slate-900 leading-none mb-6">
                      LKR {selectedItem.price.toLocaleString()}.00
                    </p>

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-center gap-6 mb-8">
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          decrement(selectedItem.id);
                        }}
                        className="text-2xl text-slate-400 hover:text-[#D45113] transition-colors"
                      >
                        <Minus size={24} strokeWidth={3} />
                      </motion.button>

                      <motion.div
                        key={currentQty}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl font-black shadow-lg transition-colors duration-300 ${currentQty > 0 ? 'bg-[#F9C74F] text-slate-800 shadow-[#F9C74F]/40' : 'bg-slate-100 text-slate-400 shadow-none'
                          }`}
                      >
                        {currentQty}
                      </motion.div>

                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          add(selectedItem, r.id, 1);
                        }}
                        className="text-2xl text-slate-400 hover:text-[#D45113] transition-colors"
                      >
                        <Plus size={24} strokeWidth={3} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="w-full py-5 rounded-3xl bg-[#F9C74F] text-slate-900 font-black text-lg shadow-xl shadow-[#F9C74F]/20 flex items-center justify-center gap-3 hover:bg-[#F8961E] transition-colors"
                  >
                    Continue 🍕
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>

      <Footer />

      {/* ── Bottom Action Bar (Mobile) ────────────────────────────── */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white px-6 py-5 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-[#F8DDA4]/30 rounded-t-[32px]"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Cart Total</p>
                <p className="text-lg font-black text-[#D45113]">Checkout</p>
              </div>
              <Link to="/cart" className="flex-1">
                <motion.button whileTap={{ scale: 0.95 }}
                  className="w-full bg-[#D45113] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#D45113]/30">
                  <ShoppingBag size={20} /> View Cart ({count})
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
