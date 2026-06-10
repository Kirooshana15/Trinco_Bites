import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Receipt, MapPin, Clock } from "lucide-react";
import { Footer } from "@/components/Footer";
import { useOrders } from "@/context/OrderContext";
import { getCartItemPrices, formatPrice } from "@/utils/pricing";

export function Success() {
  const { latestOrder } = useOrders();

  // Calculations for discount
  let originalSubtotal = 0;
  let totalDiscount = 0;

  if (latestOrder) {
    latestOrder.items.forEach((item) => {
      const extrasTotal = item.selectedExtras
        ? item.selectedExtras.reduce((sum, extra) => sum + extra.price, 0)
        : 0;
      const normalUnitPrice = item.selectedSize === "Large" ? item.price * 1.5 + extrasTotal : item.price + extrasTotal;
      const normalTotal = normalUnitPrice * item.quantity;
      originalSubtotal += normalTotal;

      if (item.customPrice !== undefined) {
        totalDiscount += (normalUnitPrice - item.customPrice) * item.quantity;
      }
      
      // If BOGO (O-205), we also have a free pizza of the same price
      if (item.appliedOffer?.id === "O-205") {
        originalSubtotal += normalUnitPrice;
        totalDiscount += normalUnitPrice;
      }
    });
  }

  const receiptNumber = latestOrder 
    ? `TB-REC-${latestOrder.id.replace("TRC-", "")}-${new Date(latestOrder.createdAt).getFullYear()}`
    : "";

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F0E3] text-center">
      <div className="flex-1 w-full py-10 px-4 md:px-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-xl space-y-8">
          {/* Top Confirmation Section */}
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto h-24 w-24 rounded-full bg-white grid place-items-center shadow-glow border border-[#F8DDA4]/45"
            >
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ delay: 0.3, type: "spring" }}
              >
                <Check className="h-12 w-12 text-[#D45113]" strokeWidth={3} />
              </motion.div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.4 }}
              className="text-3xl font-black text-[#813405] tracking-tight"
            >
              Order Delivered!
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.5 }}
              className="text-sm font-semibold text-[#813405]/80"
            >
              Enjoy your meal. We'd love to hear your feedback about your dining experience!
            </motion.p>
          </div>

          {/* Receipt Section */}
          {latestOrder && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-[28px] border border-[#813405]/10 shadow-[0_12px_40px_rgba(129,52,5,0.06)] overflow-hidden text-left"
            >
              {/* Receipt Header Style */}
              <div className="bg-[#813405] text-[#FAF7F2] p-6 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                  <Receipt className="h-32 w-32 translate-y-6 translate-x-6" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black tracking-tight uppercase">Invoice / Receipt</h2>
                    <p className="text-xs font-semibold opacity-85 mt-1 font-mono">{receiptNumber}</p>
                  </div>
                  <span className="bg-[#D45113] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                    {latestOrder.status}
                  </span>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="p-6 space-y-6">
                {/* Meta details grid */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-[#813405]/70 border-b border-gray-150 pb-5">
                  <div className="space-y-1">
                    <p className="font-extrabold uppercase text-[9px] tracking-wider text-[#813405]/45">Order Details</p>
                    <p className="text-[#813405] font-black">ID: {latestOrder.id}</p>
                    <p className="flex items-center gap-1 mt-1">
                      <Clock className="h-3.5 w-3.5 text-[#D45113] shrink-0" />
                      {new Date(latestOrder.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 font-black text-[#D45113]">
                      Payment: {latestOrder.paymentMethod === "card" ? "💳 Credit/Debit Card" : "💵 Cash on Delivery"}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-extrabold uppercase text-[9px] tracking-wider text-[#813405]/45">Delivery Address</p>
                    <p className="text-[#813405] font-bold text-[11px] leading-relaxed flex items-start gap-1.5 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-[#D45113] shrink-0 mt-0.5" />
                      {latestOrder.deliveryAddress}
                    </p>
                  </div>
                </div>

                {/* Restaurant name block */}
                <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#813405]/5 flex justify-between items-center">
                  <span className="text-xs font-black text-[#813405]/45 uppercase tracking-wider">Restaurant</span>
                  <span className="text-sm font-black text-[#813405]">{latestOrder.restaurantName}</span>
                </div>

                {/* Items details */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#813405]/45 mb-3">Order Items</h3>
                  <div className="space-y-4">
                    {latestOrder.items.map((item, index) => {
                      const prices = getCartItemPrices(item);
                      return (
                        <div key={`${item.id}-${index}`} className="pb-3 border-b border-gray-100 last:pb-0 last:border-b-0 space-y-1">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <p className="text-sm font-extrabold text-[#813405]">
                                {item.quantity}x {item.name}
                                {item.selectedSize ? ` (${item.selectedSize})` : ""}
                              </p>
                              
                              {/* Option tags */}
                              {item.appliedOffer && (
                                <span className="inline-block mt-1 text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                  🎁 {item.appliedOffer.discountBadge}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-extrabold text-[#813405]">{formatPrice(prices.itemTotal)}</span>
                          </div>

                          {/* BOGO free item listing */}
                          {item.appliedOffer?.id === "O-205" && (
                            <div className="mt-1 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100/50 flex items-center justify-between text-xs text-emerald-800 font-bold">
                              <span>🎁 {item.quantity}x {item.name} ({item.selectedSize || "Regular"}) [FREE BOGO]</span>
                              <span className="font-extrabold">Rs 0</span>
                            </div>
                          )}

                          {/* Extras/Add-ons nested breakdown */}
                          <div className="pl-3 text-[11px] text-[#813405]/65 border-l-2 border-[#F8DDA4]/45 space-y-1">
                            <div className="flex justify-between">
                              <span>Base price ({item.quantity}x {formatPrice(prices.basePrice)})</span>
                              <span>{formatPrice(prices.totalBasePrice)}</span>
                            </div>
                            {item.selectedExtras && item.selectedExtras.length > 0 && (
                              <div className="space-y-0.5">
                                {item.selectedExtras.map((ex, exIdx) => (
                                  <div key={exIdx} className="flex justify-between text-[#813405]/45">
                                    <span>+ {ex.name} ({item.quantity}x {formatPrice(ex.price)})</span>
                                    <span>{formatPrice(ex.price * item.quantity)}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between font-black text-[#813405]/75 pt-0.5">
                                  <span>Add-ons total</span>
                                  <span>{formatPrice(prices.totalExtrasPrice)}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {item.instructions && (
                            <div className="mt-1.5 p-1.5 rounded bg-amber-50/50 border border-amber-200/40 text-[10px] text-[#813405] font-bold">
                              <span>📝 Instructions: {item.instructions}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cost breakdown invoice summary */}
                <div className="bg-[#FDF6EC]/60 border border-[#F8DDA4]/30 rounded-2xl p-4.5 space-y-2.5 text-xs font-semibold text-[#813405]/80">
                  <div className="flex justify-between">
                    <span>Original Subtotal</span>
                    <span>{formatPrice(originalSubtotal)}</span>
                  </div>
                  
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Applied Promotion Discounts</span>
                      <span>-{formatPrice(totalDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Net Subtotal</span>
                    <span className="font-extrabold text-[#813405]">{formatPrice(latestOrder.subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{formatPrice(latestOrder.deliveryFee || 250)}</span>
                  </div>

                  {latestOrder.tax > 0 && (
                    <div className="flex justify-between">
                      <span>VAT (18%)</span>
                      <span>{formatPrice(latestOrder.tax)}</span>
                    </div>
                  )}

                  <div className="border-t border-[#813405]/10 pt-3 flex items-center justify-between text-sm font-black text-[#813405]">
                    <span>Total Paid</span>
                    <span className="text-xl font-black text-[#D45113]">{formatPrice(latestOrder.total)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.7 }}
            className="flex flex-col gap-3.5 max-w-sm mx-auto"
          >
            <Link 
              to="/rate" 
              className="bg-[#D45113] hover:bg-[#813405] text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition shadow-md shadow-[#D45113]/15 text-center flex items-center justify-center gap-2"
            >
              ⭐ Rate Restaurant & Delivery
            </Link>
            <Link 
              to="/home" 
              className="text-[#813405] hover:text-[#D45113] text-xs font-black uppercase tracking-widest py-3 border border-[#813405]/10 bg-white rounded-2xl transition"
            >
              Back to Home
            </Link>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
