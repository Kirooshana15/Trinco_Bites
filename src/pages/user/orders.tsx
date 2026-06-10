import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingBag, ChevronRight, MapPin, Clock, ArrowLeft, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { useOrders, type OrderRecord } from "@/context/OrderContext";
import { useCart } from "@/context/CartContext";
import { getCartItemPrices, formatPrice } from "@/utils/pricing";
import { useEffect } from "react";

export function Orders() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { orders } = useOrders();
  const { clear: clearCart, add: addToCart } = useCart();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  const handleReorder = (order: OrderRecord) => {
    clearCart();
    order.items.forEach((item) => {
      addToCart(
        {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          description: item.description,
          rating: item.rating,
          category: item.category,
          popular: item.popular,
          discount: item.discount,
        },
        item.restaurantId,
        item.quantity,
        {
          selectedSize: item.selectedSize,
          selectedExtras: item.selectedExtras,
          instructions: item.instructions,
          customPrice: item.customPrice,
          appliedOffer: item.appliedOffer,
        }
      );
    });
    navigate({ to: "/cart" });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F0E3]">
      <Navbar />

      <div className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6 pb-16 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/home"
              className="w-9 h-9 rounded-2xl bg-white border border-[#EADBC8] flex items-center justify-center hover:bg-white/90 transition shadow-sm"
              title="Back to Home"
            >
              <ArrowLeft size={16} className="text-[#813405]" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ background: "linear-gradient(135deg,#D45113,#813405)" }}
              >
                <ShoppingBag size={15} />
              </div>
              <h1 className="text-2xl font-black text-[#813405]">My Orders</h1>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div
            className="w-full rounded-[28px] p-8 text-center"
            style={{
              background: "linear-gradient(160deg,#ffffff,#FDF6EC)",
              border: "1px solid rgba(248,221,164,0.4)",
              boxShadow: "0 8px 40px rgba(129,52,5,0.08)",
            }}
          >
            <h2 className="text-lg font-black text-[#813405]">No Orders Found</h2>
            <p className="mt-2 text-sm font-semibold text-[#813405]/55">
              You haven't placed any orders yet.
            </p>
            <Link
              to="/home"
              className="mt-6 inline-flex rounded-2xl bg-[#D45113] px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-[#D45113]/25 hover:bg-[#813405] transition"
            >
              Start Ordering
            </Link>
          </div>
        ) : (
          <div
            className="rounded-[24px] p-5 space-y-4"
            style={{
              background: "linear-gradient(160deg,#ffffff,#FDF6EC)",
              border: "1px solid rgba(248,221,164,0.4)",
              boxShadow: "0 4px 24px rgba(129,52,5,0.06)",
            }}
          >
            <h2 className="text-lg font-black text-[#813405] border-b border-[#F8DDA4]/30 pb-2">Order History</h2>
            <div className="space-y-4">
              {orders.map((order) => {
                const isActive = order.status !== "Delivered" && order.status !== "Cancelled";
                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-[#F8DDA4]/50 bg-white/80 p-4 space-y-3 shadow-[0_2px_8px_rgba(129,52,5,0.02)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-[#813405]">{order.restaurantName}</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-[#813405]/50 flex items-center gap-1.5">
                          <span>Order #{order.id}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-[#D45113]/60" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            order.status === "Delivered"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : order.status === "Cancelled"
                                ? "bg-red-50 text-red-650 border border-red-100"
                                : "bg-orange-50 text-orange-600 border border-orange-100"
                          }`}
                        >
                          {order.status}
                        </span>

                        {isActive && (
                          <Link
                            to="/track"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#D45113] to-[#813405] shadow-sm hover:opacity-90 transition shrink-0"
                          >
                            🛵 Track
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 border-t border-[#F8DDA4]/20 pt-2.5">
                      {order.items.map((item, index) => {
                        const prices = getCartItemPrices(item);
                        return (
                          <div key={`${item.id}-${index}`} className="text-xs space-y-0.5">
                            <div className="flex justify-between font-bold text-[#813405]/80">
                              <span className="flex items-center gap-1.5 flex-wrap">
                                {item.quantity}x {item.name}
                                {item.selectedSize ? ` (${item.selectedSize})` : ""}
                                {item.appliedOffer && (
                                  <span className="text-[9px] font-black text-emerald-650 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                                    🎁 {item.appliedOffer.discountBadge}
                                  </span>
                                )}
                              </span>
                              <span>{formatPrice(prices.itemTotal)}</span>
                            </div>
                            
                            {item.appliedOffer?.id === "O-205" && (
                              <div className="mt-1 p-1.5 rounded bg-emerald-50/40 flex items-center justify-between text-[10px] text-emerald-850 font-bold">
                                <span>🎁 {item.quantity}x {item.name} ({item.selectedSize || "Regular"}) [FREE BOGO]</span>
                                <span>Rs 0</span>
                              </div>
                            )}
                            
                            {item.selectedExtras && item.selectedExtras.length > 0 && (
                              <div className="text-[10px] text-slate-400 pl-3">
                                {item.selectedExtras.map((extra) => `+ ${extra.name} (${formatPrice(extra.price)})`).join(", ")}
                              </div>
                            )}

                            {item.instructions && (
                              <div className="text-[10px] text-[#813405] pl-3 italic font-semibold flex items-center gap-1 mt-0.5">
                                <span>📝 Instructions:</span>
                                <span>{item.instructions}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-dashed border-[#F8DDA4]/30 pt-2">
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span>Subtotal: {formatPrice(order.subtotal)}</span>
                        <span>|</span>
                        <span>Delivery: {formatPrice(order.deliveryFee)}</span>
                        {order.tax > 0 && (
                          <>
                            <span>|</span>
                            <span>VAT (18%): {formatPrice(order.tax)}</span>
                          </>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#D45113]">Total: {formatPrice(order.total)}</span>
                        <button
                          onClick={() => handleReorder(order)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#D45113] to-[#813405] shadow-sm hover:opacity-95 transition shrink-0 cursor-pointer"
                        >
                          <RefreshCw size={10} /> Re-order
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
