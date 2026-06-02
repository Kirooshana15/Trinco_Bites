import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Footer } from "@/components/Footer";
import o1 from "@/assets/onboard-1.jpg";
import o2 from "@/assets/onboard-2.jpg";
import o3 from "@/assets/onboard-3.jpg";

const slides = [
  { img: o1, title: "Choose your meal", desc: "Browse top-rated restaurants across Trincomalee and pick your favorites." },
  { img: o2, title: "Get special offers", desc: "Save with daily deals, combos, and exclusive member discounts." },
  { img: o3, title: "Track your order", desc: "Real-time tracking from kitchen to your doorstep." },
];

export function Onboarding() {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const last = i === slides.length - 1;

  const next = () => (last ? navigate({ to: "/home" }) : setI(i + 1));

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      <div className="flex justify-end p-6">
        <Link to="/home" className="text-sm font-medium text-muted-foreground hover:text-primary">Skip</Link>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            <div className="rounded-[2rem] overflow-hidden shadow-card bg-card mx-auto aspect-square max-w-xs">
              <img src={slides[i].img} alt={slides[i].title} width={1024} height={1024} className="w-full h-full object-cover" />
            </div>
            <h2 className="mt-8 text-3xl font-extrabold">{slides[i].title}</h2>
            <p className="mt-3 text-muted-foreground">{slides[i].desc}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex gap-2">
          {slides.map((_, idx) => (
            <span key={idx} className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-2 bg-border"}`} />
          ))}
        </div>
      </div>
      <div className="p-6 max-w-md w-full mx-auto">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={next}
          className="w-full bg-gradient-warm text-primary-foreground font-semibold py-4 rounded-2xl shadow-glow"
        >
          {last ? "Get Started" : "Next"}
        </motion.button>
      </div>
      
    </div>
  );
}
