import { Link, useParams, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
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
  ShoppingBag
} from "lucide-react";
import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { findFoodItem } from "@/utils/data/mock";
import { useCart } from "@/context/CartContext";

const CARD_COLORS = [
  "#D97745",
  "#3BA99C",
  "#E05D5D",
  "#5C85D6",
  "#9A6DCC",
  "#4DA89E",
];

export function FoodDetailPage() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const data = findFoodItem(id || "");
  const { count, add, decrement, items: cartItems } = useCart();

  if (!data) return null;

  const { food, restaurant } = data;
  const currentQty = cartItems.find(i => i.id === food.id)?.quantity || 0;

  // Find index for color consistency
  const uniqueCategories = Array.from(new Set(restaurant.menu.map(m => m.category)));
  const catIndex = uniqueCategories.indexOf(food.category);
  const bgColor = CARD_COLORS[catIndex % CARD_COLORS.length];

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F0E3]" style={{ fontFamily: "var(--font-body)" }}>
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl bg-white rounded-[40px] md:rounded-[60px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
          
          {/* Left Side: Image & Color Splash */}
          <div 
            className="w-full md:w-1/2 min-h-[300px] md:min-h-[600px] relative flex items-center justify-center overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%)`,
            }}
          >
            {/* Back Button */}
            <button
              onClick={() => window.history.back()}
              className="absolute top-6 left-6 z-20 h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>

            <motion.div
              layoutId={`card-image-container-${food.id}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10"
            >
              <div className="h-64 w-64 md:h-96 md:w-96 rounded-full border-[12px] border-white/30 shadow-[0_30px_60px_rgba(0,0,0,0.3)] overflow-hidden bg-white">
                <img
                  src={food.image}
                  alt={food.name}
                  className="h-full w-full object-cover scale-110"
                />
              </div>
            </motion.div>

            {/* Background Text Decor */}
            <div className="absolute -bottom-10 -left-10 text-[120px] font-black text-white/10 select-none pointer-events-none whitespace-nowrap">
              {food.category.toUpperCase()}
            </div>
          </div>

          {/* Right Side: Content */}
          <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest">
                  {food.category}
                </span>
                <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                  <Star size={14} fill="currentColor" />
                  {food.rating}
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
                {food.name}
              </h1>
              
              <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-8 italic">
                "{food.description || "Freshly prepared with authentic ingredients and local spices for a taste you'll never forget."}"
              </p>

              <div className="flex items-center justify-between mb-10">
                <p className="text-4xl font-black text-slate-900">
                  LKR {food.price.toLocaleString()}.00
                </p>

                {/* Quantity Controls */}
                <div className="flex items-center gap-4">
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => decrement(food.id)}
                    className="h-10 w-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-600 transition-colors"
                  >
                    <Minus size={20} />
                  </motion.button>

                  <span className="text-xl font-black w-8 text-center">{currentQty}</span>

                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => add(food, restaurant.id, 1)}
                    className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-lg"
                  >
                    <Plus size={20} />
                  </motion.button>
                </div>
              </div>

              {/* Restaurant Info Card */}
              <Link 
                to="/restaurant/$id" 
                params={{ id: restaurant.id }}
                className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100"
              >
                <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-md">
                  <img src={restaurant.image} alt={restaurant.name} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">From Restaurant</p>
                  <p className="text-sm font-black text-slate-900">{restaurant.name}</p>
                </div>
                <div className="ml-auto text-slate-300">
                  <ChevronRight size={20} />
                </div>
              </Link>
            </div>

            <button
              onClick={() => navigate({ to: "/cart" })}
              className="w-full py-5 rounded-3xl bg-orange-600 text-white font-black text-lg shadow-xl shadow-orange-600/20 flex items-center justify-center gap-3 hover:bg-orange-700 transition-colors"
            >
              Add to Cart & Checkout <ShoppingBag size={20} />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
