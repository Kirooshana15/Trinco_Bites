import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useOrders } from "@/context/OrderContext";
import { useRestaurants } from "@/context/RestaurantContext";
import { useAuth } from "@/context/AuthContext";

const REVIEWS_KEY = "trinco_reviews";

export function Rate() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const { user } = useAuth();
  const { latestOrder } = useOrders();
  const { restaurants } = useRestaurants();

  const restaurantName = latestOrder?.restaurantName || "Trinco Spice House";
  const restaurantObj = restaurants.find(
    (r) => r.name.toLowerCase() === restaurantName.toLowerCase()
  );
  const restaurantImage = restaurantObj?.image;

  const handleSubmit = () => {
    if (rating === 0) return;

    // Build customer name & initials
    const customerName = user?.name || "Guest Customer";
    const initials = customerName
      .split(" ")
      .map((w: string) => w[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const sentiment: "Positive" | "Neutral" | "Negative" =
      rating >= 4 ? "Positive" : rating <= 2 ? "Negative" : "Neutral";

    // Build a full Review object matching the Review interface in reviews.tsx
    const newReview = {
      id: `rev-${Date.now()}`,
      restaurantId: latestOrder?.restaurantId || restaurantObj?.id || "trinco-spice",
      customerName,
      avatar: initials,
      rating,
      comment: feedback.trim() || "No comment provided.",
      date: new Date().toISOString().split("T")[0],
      foodRating: rating,
      serviceRating: rating,
      verified: true,
      orderId: latestOrder?.id || `TB-${Math.floor(Math.random() * 9000 + 1000)}`,
      dishName: latestOrder?.items?.[0]?.name || "Food Item",
      sentiment,
      reported: false,
      hidden: false,
      bookmarked: false,
      pinned: false,
      loyaltyScore: "Bronze" as const,
      replies: [] as { avatar: string; timestamp: string; text: string }[],
    };

    // Persist to localStorage
    const existing: typeof newReview[] = JSON.parse(
      localStorage.getItem(REVIEWS_KEY) || "[]"
    );
    const updated = [newReview, ...existing];
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));

    // Notify the restaurant dashboard tab via storage event
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: REVIEWS_KEY,
        newValue: JSON.stringify(updated),
        storageArea: localStorage,
      })
    );

    setSubmitted(true);
    setTimeout(() => navigate({ to: "/home" }), 1500);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F0E3]">
      <Navbar />
      <div className="flex-1">
        <div className="mx-auto max-w-md px-4 pt-12 pb-24">
          <h1
            className="text-3xl font-black text-[#813405] text-center mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Rate your experience
          </h1>

          <div className="flex flex-col items-center mb-8">
            {restaurantImage ? (
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={restaurantImage}
                alt={restaurantName}
                className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md mb-3"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-white border border-[#813405]/10 flex items-center justify-center mb-3 shadow-md">
                <span className="text-2xl font-black text-[#D45113]">🍽️</span>
              </div>
            )}
            <p className="text-[#813405]/60 font-black uppercase tracking-widest text-[10px] text-center">
              {restaurantName}
            </p>
          </div>

          <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-[#F8DDA4]/40 relative overflow-hidden">
            {/* Star rating */}
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

            {/* Feedback textarea */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#813405] ml-2">
                Your Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="How was your food and delivery?"
                rows={4}
                className="w-full bg-[#F8DDA4]/5 border border-[#F8DDA4]/30 rounded-[28px] p-6 outline-none text-[#813405] font-bold text-sm resize-none placeholder:text-[#813405]/30 focus:border-[#D45113] focus:ring-1 focus:ring-[#D45113] transition-all"
              />
            </div>

            {/* Submit button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={rating === 0}
              onClick={handleSubmit}
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
