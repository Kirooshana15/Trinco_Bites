import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { findRestaurant } from "@/utils/data/mock";
import { isRestaurantOpen } from "@/utils/time";

export function Cart() {
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
      <div className="mx-auto max-w-3xl px-4 pt-6">
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
                {items.map((it) => (
                  <motion.div
                    key={it.id}
                    layout
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-card rounded-2xl shadow-card p-3 flex gap-3 items-center"
                  >
                    <img src={it.image} alt={it.name} width={80} height={80} className="h-20 w-20 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{it.name}</h3>
                      <p className="text-primary font-bold text-sm mt-1">Rs {(it.price * it.quantity).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                      <button onClick={() => setQty(it.id, it.quantity - 1)} className="h-7 w-7 rounded-full bg-card grid place-items-center"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-6 text-center text-sm font-semibold">{it.quantity}</span>
                      <button onClick={() => setQty(it.id, it.quantity + 1)} className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <button onClick={() => remove(it.id)} className="text-muted-foreground hover:text-destructive p-2"><Trash2 className="h-4 w-4" /></button>
                  </motion.div>
                ))}
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
      <span>Rs {value.toLocaleString()}</span>
    </div>
  );
}
