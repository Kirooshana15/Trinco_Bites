import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Star, Image as ImageIcon, Trash2, Camera, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { toast } from "sonner";

export type OrderRecord = {
  id: string;
  dbId: string;
  createdAt: string;
  status: "Order Received" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled";
  restaurantId: string;
  restaurantName: string;
  items: Array<{ name: string; quantity: number }>;
  orderType: string;
  total: number;
};

export function Rate() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  // Advanced state
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  // Parse orderId from search parameters
  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }

    if (!orderId) {
      setOrderError("No order ID provided. Please select an order from your history to rate.");
      setLoadingOrder(false);
      return;
    }

    const loadOrderAndCheckReview = async () => {
      try {
        setLoadingOrder(true);
        // 1. Fetch order details from backend
        const fetchedOrder = await apiRequest<OrderRecord>(`/orders/${orderId}`, { token });
        setOrder(fetchedOrder);

        // Verify status
        if (fetchedOrder.status !== "Delivered") {
          setOrderError("You can only submit a review after the order has been successfully delivered.");
          setLoadingOrder(false);
          return;
        }

        // 2. Check if a review already exists
        const existingReview = await apiRequest<any>(`/reviews/order/${orderId}`, { token }).catch(() => null);
        if (existingReview) {
          setOrderError("You have already submitted a review for this order.");
          setLoadingOrder(false);
          return;
        }

        setOrderError(null);
      } catch (err: any) {
        console.error("Failed to load order info:", err);
        setOrderError(err?.message || "Failed to load order details. Please try again.");
      } finally {
        setLoadingOrder(false);
      }
    };

    loadOrderAndCheckReview();
  }, [orderId, token, isAuthenticated, navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 images");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const response = await apiRequest<{ urls: string[] }>("/reviews/upload", {
        method: "POST",
        token,
        body: formData,
      });
      setUploadedImages((prev) => [...prev, ...response.urls]);
      toast.success("Food photos uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload food photos. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (rating === 0 || !order) return;

    try {
      const reviewData = {
        restaurantId: order.restaurantId,
        orderId: order.dbId || order.id,
        rating,
        comment: feedback.trim() || "No comment provided.",
        images: uploadedImages,
        dishName: order.items?.[0]?.name || "Food Item",
      };

      await apiRequest("/reviews", {
        method: "POST",
        token,
        body: reviewData,
      });

      setSubmitted(true);
      toast.success("Thank you for your rating & feedback! 🎉");
      setTimeout(() => navigate({ to: "/orders" }), 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F0E3]">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="mx-auto w-full max-w-md px-4 pt-12 pb-24">
          <h1
            className="text-3xl font-black text-[#813405] text-center mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Rate your experience
          </h1>

          {loadingOrder ? (
            /* Loading State */
            <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-[#F8DDA4]/45 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D45113]" />
              <p className="mt-4 text-[#813405]/60 font-black text-sm">Verifying order details...</p>
            </div>
          ) : orderError ? (
            /* Error/Warning State */
            <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-[#F8DDA4]/45 text-center flex flex-col items-center justify-center min-h-[300px] space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-lg font-black text-[#813405]">Rating Unavailable</h3>
              <p className="text-xs font-semibold text-[#813405]/70 max-w-[280px] mx-auto leading-relaxed">
                {orderError}
              </p>
              <button
                onClick={() => navigate({ to: "/orders" })}
                className="mt-4 px-6 py-3 bg-[#D45113] hover:bg-[#813405] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition"
              >
                Back to My Orders
              </button>
            </div>
          ) : (
            /* Main Form */
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-white border border-[#813405]/10 flex items-center justify-center mb-3 shadow-md">
                  <span className="text-2xl font-black text-[#D45113]">🍽️</span>
                </div>
                <p className="text-[#813405]/65 font-black uppercase tracking-widest text-[10px] text-center">
                  {order?.restaurantName}
                </p>
                <p className="text-[9px] text-[#813405]/40 font-bold mt-0.5">
                  Order #{order?.id}
                </p>
              </div>

              <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-[#F8DDA4]/40 relative overflow-hidden">
                {/* Star rating */}
                <div className="flex justify-center gap-3 mb-8">
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
                        className={`h-10 w-10 transition-all duration-300 ${
                          (hover || rating) >= n
                            ? "fill-[#D45113] text-[#D45113] scale-110 drop-shadow-[0_0_8px_rgba(212,81,19,0.35)]"
                            : "text-[#D45113]/20"
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>

                {/* Feedback textarea */}
                <div className="space-y-2 mb-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#813405] ml-2">
                    Your Feedback
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="How was your food and delivery? Let others know!"
                    rows={4}
                    className="w-full bg-[#F8DDA4]/5 border border-[#F8DDA4]/30 rounded-[24px] p-5 outline-none text-[#813405] font-bold text-sm resize-none placeholder:text-[#813405]/30 focus:border-[#D45113] focus:ring-1 focus:ring-[#D45113] transition-all"
                  />
                </div>

                {/* Multiple Food Photos Upload */}
                <div className="space-y-3 mb-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#813405] ml-2 flex items-center gap-1.5">
                    <Camera size={12} /> Upload Food Photos
                  </label>

                  <div className="grid grid-cols-5 gap-2.5">
                    {uploadedImages.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[#813405]/10 shadow-sm group">
                        <img src={url} alt="Food upload" className="h-full w-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition rounded-xl"
                          type="button"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}

                    {uploadedImages.length < 5 && (
                      <label className={`aspect-square rounded-xl border-2 border-dashed border-[#813405]/20 hover:border-[#D45113] flex flex-col items-center justify-center cursor-pointer transition ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        {uploading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#D45113]" />
                        ) : (
                          <>
                            <ImageIcon size={18} className="text-[#813405]/40" />
                            <span className="text-[8px] font-black text-[#813405]/40 mt-1 uppercase">Add</span>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                  <p className="text-[8.5px] text-[#813405]/40 font-bold ml-2">
                    You can upload up to 5 photos of your meal.
                  </p>
                </div>

                {/* Submit button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={rating === 0 || uploading}
                  onClick={handleSubmit}
                  className="w-full text-white font-black py-4.5 rounded-[22px] uppercase tracking-widest text-xs relative overflow-hidden disabled:opacity-20 shadow-xl shadow-[#D45113]/20 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #D45113 0%, #813405 100%)",
                  }}
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-white/10 rounded-t-[22px]" />
                  {submitted ? "Success! 🎉" : "Submit Review"}
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Rate;
