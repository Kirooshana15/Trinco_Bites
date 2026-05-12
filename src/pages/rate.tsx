import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export function Rate() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F0E3]">
      <Navbar />
      <div className="flex-1">
        <div className="mx-auto max-w-md px-4 pt-12">
          <h1 className="text-3xl font-black text-[#813405] text-center mb-2" style={{ fontFamily: "var(--font-heading)" }}>Rate your experience</h1>
          <p className="text-[#813405]/60 font-black uppercase tracking-widest text-[10px] text-center mb-10">Trinco Spice House</p>

          <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-[#F8DDA4]/40 relative overflow-hidden">
            <div className="flex justify-center gap-3 mb-10">
              {[1, 2, 3, 4, 5].map((n) => (
                <motion.button
                  key={n} 
                  whileTap={{ scale: 0.8 }}
                  onMouseEnter={() => setHover(n)} 
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  className="relative"
                >
                  <Star
                    className={`h-12 w-12 transition-all duration-300 ${
                      (hover || rating) >= n 
                        ? "fill-[#D45113] text-[#D45113] scale-110 drop-shadow-[0_0_8px_rgba(212,81,19,0.4)]" 
                        : "text-[#D45113]/20"
                    }`}
                  />
                </motion.button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#813405] ml-2">Your Feedback</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="How was your food and delivery?"
                rows={4}
                className="w-full bg-[#F8DDA4]/5 border border-[#F8DDA4]/30 rounded-[28px] p-6 outline-none text-[#813405] font-bold text-sm resize-none placeholder:text-[#813405]/30 focus:border-[#D45113] focus:ring-1 focus:ring-[#D45113] transition-all"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={rating === 0}
              onClick={() => { setSubmitted(true); setTimeout(() => navigate({ to: "/home" }), 1500); }}
              className="mt-8 w-full text-white font-black py-5 rounded-[24px] uppercase tracking-widest text-sm relative overflow-hidden disabled:opacity-20 shadow-xl shadow-[#D45113]/20"
              style={{
                background: "linear-gradient(135deg, #D45113 0%, #813405 100%)",
              }}
            >
              <span className="absolute inset-x-0 top-0 h-1/2 bg-white/10 rounded-t-[24px]" />
              {submitted ? "Success! 🎉" : "Submit Review"}
            </motion.button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
