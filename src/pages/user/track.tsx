import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Check, ChefHat, Bike, PackageCheck, Receipt,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { useOrders } from "@/context/OrderContext";
import { getCartItemPrices, formatPrice } from "@/utils/pricing";

// ── Order steps ──────────────────────────────────────────────────────────────
const steps = [
  { label: "Order Received", icon: Receipt, desc: "Your order has been placed successfully." },
  { label: "Preparing", icon: ChefHat, desc: "The restaurant is preparing your food." },
  { label: "Out for Delivery", icon: Bike, desc: "Your order is on its way to you." },
  { label: "Delivered", icon: PackageCheck, desc: "Your order has been delivered. Enjoy!" },
];

export function Track() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { latestOrder } = useOrders();

  const getActiveStep = (status: string) => {
    if (status === "Delivered") return 3;
    if (status === "Out for Delivery") return 2;
    if (status === "Preparing") return 1;
    if (status === "Cancelled") return -1;
    return 0;
  };

  const [active, setActive] = useState(() =>
    latestOrder ? getActiveStep(latestOrder.status) : 0
  );

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/login" });
  }, [isAuthenticated, navigate]);

  // Sync active step whenever order status changes (cross-tab sync)
  useEffect(() => {
    if (latestOrder) {
      setActive(getActiveStep(latestOrder.status));
    }
  }, [latestOrder?.status]);

  if (!isAuthenticated) return null;

  if (!latestOrder) {
    return (
      <div className="flex min-h-screen flex-col" style={{ background: "#F7F0E3" }}>
        <Navbar />
        <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-4 py-16">
          <div
            className="w-full rounded-[28px] p-8 text-center"
            style={{
              background: "linear-gradient(160deg,#ffffff,#FDF6EC)",
              border: "1px solid rgba(248,221,164,0.4)",
              boxShadow: "0 8px 40px rgba(129,52,5,0.08)",
            }}
          >
            <h1 className="text-2xl font-black text-[#813405]">My Orders</h1>
            <p className="mt-2 text-sm font-semibold text-[#813405]/55">
              You have no previous orders yet.
            </p>
            <Link
              to="/home"
              className="mt-6 inline-flex rounded-2xl bg-[#D45113] px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-[#D45113]/25"
            >
              Start Ordering
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const delivered = active === steps.length - 1;
  const cancelled = latestOrder?.status === "Cancelled";
  const currentOrder = latestOrder;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#F7F0E3" }}>
      <Navbar />

      <div className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6 pb-16 space-y-4">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#813405]">Track Order</h1>
            <p className="text-xs text-[#813405]/40 font-semibold mt-0.5">
              Order #{currentOrder.id}
            </p>
          </div>
          {/* Live status badge */}
          <motion.div
            key={latestOrder.status}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
            style={{
              background: cancelled
                ? "rgba(239,68,68,0.1)"
                : delivered
                ? "linear-gradient(135deg,#D45113,#813405)"
                : "rgba(212,81,19,0.1)",
              color: cancelled ? "#dc2626" : delivered ? "#F8DDA4" : "#D45113",
            }}
          >
            {cancelled ? "❌ Cancelled" : delivered ? "✅ Delivered" : `⏳ ${latestOrder.status}`}
          </motion.div>
        </div>

        {/* ── Step tracker ─────────────────────────────────────────────────── */}
        {!cancelled && (
          <div
            className="rounded-[28px] p-6"
            style={{
              background: "linear-gradient(160deg,#ffffff,#FDF6EC)",
              border: "1px solid rgba(248,221,164,0.4)",
              boxShadow: "0 4px 24px rgba(129,52,5,0.06)",
            }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-[#813405]/40 mb-5">
              Order Progress
            </p>
            {steps.map((s, i) => {
              const done = i < active || (delivered && i === active);
              const cur = i === active && !delivered;
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex gap-4 items-start relative pb-6 last:pb-0">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div
                      className="absolute top-10 bottom-0 w-0.5"
                      style={{ left: 19, background: done ? "#D45113" : "rgba(248,221,164,0.6)" }}
                    />
                  )}

                  {/* Step icon */}
                  <motion.div
                    animate={cur ? { scale: [1, 1.12, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                    style={{
                      background: done
                        ? "linear-gradient(135deg,#D45113,#813405)"
                        : cur
                        ? "linear-gradient(135deg,#F9A03F,#D45113)"
                        : "rgba(248,221,164,0.3)",
                      boxShadow: cur ? "0 0 0 4px rgba(212,81,19,0.15)" : "none",
                    }}
                  >
                    {done ? (
                      <Check size={16} className="text-white" strokeWidth={3} />
                    ) : (
                      <Icon size={16} style={{ color: cur ? "#fff" : "#C4A07A" }} />
                    )}
                  </motion.div>

                  {/* Label & description */}
                  <div className="pt-2 flex-1 text-left">
                    <p
                      className="text-sm font-black leading-none"
                      style={{ color: done ? "#813405" : cur ? "#D45113" : "#C4A07A" }}
                    >
                      {s.label}
                    </p>
                    {cur && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[11px] mt-1 font-semibold"
                        style={{ color: "#D45113" }}
                      >
                        {s.desc}
                      </motion.p>
                    )}
                    {done && (
                      <p className="text-[11px] mt-1 font-semibold text-[#813405]/40">
                        {s.desc}
                      </p>
                    )}
                  </div>

                  {/* Done checkmark label */}
                  {done && (
                    <span className="text-[9px] font-bold pt-3 text-emerald-600">✓ Done</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Cancelled Card ────────────────────────────────────────────────── */}
        {cancelled && (
          <div
            className="rounded-[24px] p-6 space-y-4"
            style={{
              background: "linear-gradient(160deg,#ffffff,#FFF0F0)",
              border: "1.5px solid rgba(239, 68, 68, 0.2)",
              boxShadow: "0 4px 24px rgba(239, 68, 68, 0.05)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-sm shrink-0">
                <span className="text-xl font-bold">✕</span>
              </div>
              <div>
                <h2 className="text-lg font-black text-red-700">Order Rejected</h2>
                <p className="text-[11px] text-red-500 font-semibold">
                  This order was not accepted by the restaurant.
                </p>
              </div>
            </div>

            {/* Rejection reason */}
            {currentOrder.cancellationReason ? (
              <div className="rounded-2xl bg-red-50 border border-red-200/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500/70 mb-1">
                  Reason for Rejection
                </p>
                <p className="text-sm font-semibold text-red-700 leading-relaxed">
                  {currentOrder.cancellationReason}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-red-50 border border-red-200/60 p-4">
                <p className="text-sm font-semibold text-red-600/70 italic">
                  No reason provided by the restaurant.
                </p>
              </div>
            )}

            {/* Payment-specific message */}
            {currentOrder.paymentMethod === "card" ? (
              /* Card payment → refund message */
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200/60 p-4 flex items-start gap-3">
                <span className="text-xl shrink-0">💳</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">
                    Refund Initiated
                  </p>
                  <p className="text-sm font-semibold text-emerald-700 leading-relaxed">
                    Your payment has been refunded to your card. It may take 3–5 business days to reflect in your account.
                  </p>
                </div>
              </div>
            ) : (
              /* Cash on Delivery → no refund needed */
              <div className="rounded-2xl bg-slate-50 border border-slate-200/50 p-4 flex items-start gap-3">
                <span className="text-xl shrink-0">💵</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Cash on Delivery
                  </p>
                  <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                    No payment was charged. You can place a new order anytime.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Order Details ──────────────────────────────────────────────────── */}
        <div
          className="rounded-[24px] p-5"
          style={{
            background: "linear-gradient(160deg,#ffffff,#FDF6EC)",
            border: "1px solid rgba(248,221,164,0.4)",
            boxShadow: "0 4px 24px rgba(129,52,5,0.06)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#813405]">Order Details</h2>
              <p className="mt-0.5 text-[11px] font-semibold text-[#813405]/45">
                {new Date(currentOrder.createdAt).toLocaleString()}
              </p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
              style={{ background: "rgba(212,81,19,0.1)", color: "#D45113" }}
            >
              {currentOrder.paymentMethod === "card" ? "Card Payment" : "Cash on Delivery"}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-[#F8DDA4]/50 bg-white/80 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#813405]/45">Restaurant</p>
              <p className="mt-1 text-sm font-black text-[#813405]">{currentOrder.restaurantName}</p>
            </div>

            <div className="rounded-2xl border border-[#F8DDA4]/50 bg-white/80 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#813405]/45">Delivery Address</p>
              <p className="mt-1 text-sm font-bold text-[#813405]">{currentOrder.deliveryAddress}</p>
            </div>

            {/* Special instructions (if any) */}
            {currentOrder.notes && (
              <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/70">📝 Special Instructions</p>
                <p className="mt-1 text-sm font-semibold text-amber-800 leading-relaxed">{currentOrder.notes}</p>
              </div>
            )}
            <div className="rounded-2xl border border-[#F8DDA4]/50 bg-white/80 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#813405]/45">Items</p>
              <div className="mt-2 space-y-3">
                {currentOrder.items.map((item, index) => {
                  const prices = getCartItemPrices(item);
                  return (
                    <div key={`${item.id}-${index}`} className="space-y-1 pb-2 border-b border-[#F8DDA4]/20 last:pb-0 last:border-b-0">
                      <div className="flex items-start justify-between gap-3 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-black text-[#813405]">
                            {item.quantity}x {item.name}
                            {item.selectedSize ? ` (${item.selectedSize})` : ""}
                          </p>
                          {item.appliedOffer && (
                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                              🎁 {item.appliedOffer.discountBadge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-black text-[#813405]">
                          {formatPrice(prices.itemTotal)}
                        </p>
                      </div>

                      {item.appliedOffer?.id === "O-205" && (
                        <div className="mt-1.5 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100/50 flex items-center justify-between text-[11px] text-emerald-800 font-bold">
                          <span className="flex items-center gap-1">
                            🎁 {item.quantity}x {item.name} ({item.selectedSize || "Regular"}) [FREE BOGO]
                          </span>
                          <span className="font-black">Rs 0</span>
                        </div>
                      )}

                      <div className="text-[11px] text-[#813405]/70 pl-2 space-y-0.5 border-l border-[#F8DDA4]/50">
                        <div className="flex justify-between">
                          <span>Base Price ({item.quantity}x {formatPrice(prices.basePrice)})</span>
                          <span>{formatPrice(prices.totalBasePrice)}</span>
                        </div>
                        {item.selectedExtras && item.selectedExtras.length > 0 && (
                          <>
                            {item.selectedExtras.map((extra, idx) => (
                              <div key={idx} className="flex justify-between text-[#813405]/50 pl-1.5">
                                <span>+ {extra.name} ({item.quantity}x {formatPrice(extra.price)})</span>
                                <span>{formatPrice(extra.price * item.quantity)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between font-bold text-[#813405]/75 pl-1.5 pt-0.5">
                              <span>Add-ons Total</span>
                              <span>{formatPrice(prices.totalExtrasPrice)}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {item.instructions && (
                        <div className="mt-2 p-2 rounded-xl bg-amber-50/70 border border-amber-200/40 text-[11px] text-[#813405] font-semibold flex items-start gap-1.5">
                          <span className="text-xs">📝</span>
                          <div className="flex-1 text-left">
                            <p className="text-[9px] font-black uppercase tracking-wider text-amber-600/70">Item Instructions</p>
                            <p className="mt-0.5 leading-relaxed">{item.instructions}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-[#F8DDA4]/50 bg-white/80 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 font-bold">
                <span>Subtotal</span>
                <span>{formatPrice(currentOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-bold">
                <span>Delivery Fee</span>
                <span>{formatPrice(currentOrder.deliveryFee || 250)}</span>
              </div>
              {currentOrder.tax > 0 && (
                <div className="flex justify-between text-slate-500 font-bold">
                  <span>VAT (18%)</span>
                  <span>{formatPrice(currentOrder.tax)}</span>
                </div>
              )}
              <div className="border-t border-[#F8DDA4]/30 pt-2 flex items-center justify-between text-sm font-black text-[#813405]">
                <span>Order Total</span>
                <span className="text-lg font-black text-[#D45113]">{formatPrice(currentOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── View Receipt (shown after delivered) ─────────────────────────── */}
        {delivered && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center pt-2"
          >
            <Link
              to="/success"
              className="inline-flex items-center gap-2 text-white font-black px-8 py-4 rounded-2xl text-sm uppercase tracking-widest relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg,#D45113,#813405)",
                boxShadow: "0 8px 28px rgba(212,81,19,0.35)",
              }}
            >
              <span className="absolute inset-x-0 top-0 h-1/2 bg-white/10 rounded-t-2xl" />
              🧾 View Receipt
            </Link>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
