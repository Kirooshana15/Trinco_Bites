import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useRestaurants } from "@/context/RestaurantContext";
import { isRestaurantOpen } from "@/utils/time";
import { getCartItemPrices, formatPrice } from "@/utils/pricing";

export function Cart() {
  const { findRestaurant } = useRestaurants();
  const { items, total, setQty, remove } = useCart();
  const closedRestaurantItems = items.filter((item) => {
    const restaurant = findRestaurant(item.restaurantId);
    return restaurant ? !isRestaurantOpen(restaurant) : false;
  });
  const hasClosedRestaurantItems = closedRestaurantItems.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-soft">
      <Navbar />
      <div className="flex-1">
        <div className="mx-auto max-w-3xl px-4 pt-6 pb-24">
          <h1 className="text-2xl font-extrabold mb-6">Your Cart</h1>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto h-20 w-20 rounded-full bg-secondary grid place-items-center">
                <ShoppingBag className="h-9 w-9 text-primary" />
              </div>
              <p className="mt-4 text-muted-foreground">Your cart is empty.</p>
              <Link to="/home" className="inline-block mt-6 bg-gradient-warm text-primary-foreground px-6 py-3 rounded-full font-semibold">Browse restaurants</Link>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <AnimatePresence>
                  {items.map((it) => {
                    const prices = getCartItemPrices(it);
                    return (
                      <motion.div
                        key={it.id}
                        layout
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="bg-card rounded-2xl shadow-card p-4 flex gap-4 items-start"
                      >
                        <img src={it.image} alt={it.name} width={80} height={80} className="h-20 w-20 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-slate-800 text-base leading-tight truncate flex items-center gap-1.5 flex-wrap">
                            {it.name}
                            {it.selectedSize && (
                              <span className="text-xs font-bold text-orange-650 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                                {it.selectedSize}
                              </span>
                            )}
                          </h3>

                          {it.appliedOffer?.id === "O-205" && (
                            <div className="mt-2 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
                              <span className="font-bold flex items-center gap-1">
                                🎁 {it.quantity}x {it.name} ({it.selectedSize || "Regular"})
                                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.25 rounded">FREE BOGO</span>
                              </span>
                              <span className="font-black text-emerald-700">Rs. 0</span>
                            </div>
                          )}

                          {/* Detailed pricing breakdown */}
                          <div className="mt-2 text-xs space-y-1 text-slate-500 border-l-2 border-orange-200 pl-2">
                            <div className="flex justify-between">
                              <span>Base Price ({it.quantity}x {formatPrice(prices.basePrice)})</span>
                              <span className="font-semibold">{formatPrice(prices.totalBasePrice)}</span>
                            </div>

                            {it.selectedExtras && it.selectedExtras.length > 0 && (
                              <>
                                <div className="mt-1 space-y-0.5 pl-1.5 border-l border-slate-200">
                                  {it.selectedExtras.map((extra, idx) => (
                                    <div key={idx} className="flex justify-between text-[11px] text-slate-400">
                                      <span>+ {extra.name} ({it.quantity}x {formatPrice(extra.price)})</span>
                                      <span>{formatPrice(extra.price * it.quantity)}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-between text-[11px] font-bold text-slate-500 pl-1.5">
                                  <span>Add-ons Total</span>
                                  <span>{formatPrice(prices.totalExtrasPrice)}</span>
                                </div>
                              </>
                            )}

                            {it.instructions && (
                              <p className="text-[10px] text-orange-600 italic mt-1.5 leading-relaxed bg-orange-50/50 p-1.5 rounded-lg border border-orange-100/50">
                                "Note: {it.instructions}"
                              </p>
                            )}

                            <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5 text-sm font-black text-slate-800">
                              <span>Item Total</span>
                              <span className="text-orange-650">{formatPrice(prices.itemTotal)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2.5 shrink-0 self-stretch justify-between">
                          <button onClick={() => remove(it.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
                          <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                            <button onClick={() => setQty(it.id, it.quantity - 1)} className="h-7 w-7 rounded-full bg-card grid place-items-center"><Minus className="h-3.5 w-3.5" /></button>
                            <span className="w-6 text-center text-sm font-semibold">{it.quantity}</span>
                            <button onClick={() => setQty(it.id, it.quantity + 1)} className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center"><Plus className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="mt-8 bg-card rounded-3xl shadow-card p-5 space-y-3">
                {hasClosedRestaurantItems && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                    Some items are from a restaurant that is currently closed. Remove them before checkout.
                  </div>
                )}
                <Row label="Subtotal" value={total} />
                <Row label="Delivery" value={250} />
                <div className="border-t border-border pt-3">
                  <Row label="Total" value={total + 250} bold />
                </div>
                {hasClosedRestaurantItems ? (
                  <div className="block text-center w-full bg-slate-300 text-slate-500 font-semibold py-3.5 rounded-xl shadow-card cursor-not-allowed">
                    Restaurant Closed
                  </div>
                ) : (
                  <Link to="/checkout" className="block text-center w-full bg-gradient-warm text-primary-foreground font-semibold py-3.5 rounded-xl shadow-card">
                    Proceed to Checkout
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "font-bold text-base" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{formatPrice(value)}</span>
    </div>
  );
}
