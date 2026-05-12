import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Wallet, CreditCard,
  User, Phone, Mail, ShieldCheck
} from "lucide-react";
import { useState } from "react";
import { useLocationState } from "@/context/LocationContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useOrders } from "@/context/OrderContext";
import { findRestaurant } from "@/utils/data/mock";
import { isRestaurantOpen } from "@/utils/time";

// ── Card brand definitions ─────────────────────────────────────────────────
const CARD_BRANDS = [
  {
    id: "visa",
    label: "Visa",
    emoji: "💳",
    bg: "linear-gradient(135deg, #1A1F71, #2A52BE)",
    text: "#FFFFFF",
    glow: "rgba(26,31,113,0.35)",
    prefix: ["4"],
    abbr: "VISA",
  },
  {
    id: "mastercard",
    label: "Mastercard",
    emoji: "🔴",
    bg: "linear-gradient(135deg, #EB001B, #FF5F00)",
    text: "#FFFFFF",
    glow: "rgba(235,0,27,0.3)",
    prefix: ["51", "52", "53", "54", "55"],
    abbr: "MC",
    icon: (
      <span className="flex -space-x-1.5">
        <span className="w-4 h-4 rounded-full bg-[#EB001B] opacity-90 inline-block" />
        <span className="w-4 h-4 rounded-full bg-[#F79E1B] opacity-90 inline-block" />
      </span>
    ),
  },
  {
    id: "amex",
    label: "Amex",
    emoji: "💠",
    bg: "linear-gradient(135deg, #007BC1, #00AEEF)",
    text: "#FFFFFF",
    glow: "rgba(0,123,193,0.3)",
    prefix: ["34", "37"],
    abbr: "AMEX",
  },
];

function detectCardBrand(number: string): string | null {
  const clean = number.replace(/\s/g, "");
  for (const brand of CARD_BRANDS) {
    if (brand.prefix.some((p) => clean.startsWith(p))) return brand.id;
  }
  return null;
}

export function Checkout() {
  const { items, total, clear } = useCart();
  const { selectedLocation } = useLocationState();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { placeOrder } = useOrders();
  const [pay, setPay] = useState<"cash" | "card">("cash");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  const [loc, setLoc] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const hasClosedRestaurantItems = items.some((item) => {
    const restaurant = findRestaurant(item.restaurantId);
    return restaurant ? !isRestaurantOpen(restaurant) : false;
  });

  const detectedBrand = detectCardBrand(cardNum);

  const formatCard = (val: string) =>
    val
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();

  const place = () => {
    if (hasClosedRestaurantItems) return;
    const restaurantName =
      items.length > 0
        ? findRestaurant(items[0].restaurantId)?.name ?? "Trinco Bites"
        : "Trinco Bites";

    placeOrder({
      restaurantName,
      items,
      subtotal: total,
      deliveryFee: 250,
      total: total + 250,
      paymentMethod: pay,
      contact,
      deliveryAddress: loc || selectedLocation.label,
      locationLabel: selectedLocation.label,
    });
    clear();
    navigate({ to: "/track" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F0E3]">
      <Navbar />
      <div className="flex-1">
        <div className="mx-auto max-w-2xl px-4 pt-6 pb-12">

          {/* Page Title */}
          <div className="flex items-center gap-3 mb-7">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{ background: "linear-gradient(135deg,#D45113,#813405)" }}
            >
              <ShieldCheck size={18} />
            </div>
            <h1
              className="text-2xl font-black text-[#813405]"
              style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
            >
              Checkout
            </h1>
          </div>

          {/* Contact */}
          <Section title="Contact Information" icon={User}>
            <div className="space-y-4">
              <Field label="Full Name" icon={<User size={15} />}>
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="checkout-input"
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Phone Number" icon={<Phone size={15} />}>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    placeholder="07X XXX XXXX"
                    className="checkout-input"
                  />
                </Field>
                <Field label="Email Address" icon={<Mail size={15} />}>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="example@mail.com"
                    className="checkout-input"
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Delivery */}
          <Section title="Delivery Location" icon={MapPin}>
            <div className="relative">
              <input
                type="text"
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                placeholder="Enter your delivery address"
                className="checkout-input"
              />
            </div>
          </Section>

          {/* Payment */}
          <Section title="Payment Method" icon={Wallet}>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <PayOpt active={pay === "cash"} onClick={() => setPay("cash")} icon={Wallet} label="Cash on Delivery" emoji="💵" />
              <PayOpt active={pay === "card"} onClick={() => setPay("card")} icon={CreditCard} label="Pay by Card" emoji="💳" />
            </div>

            <AnimatePresence>
              {pay === "card" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "circOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-5 pt-2 pb-1">

                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3.5 h-3.5 rounded-full border-[3px] border-[#D45113] bg-white flex-shrink-0" />
                          <span className="font-black text-[#813405] text-sm">Credit / Debit Cards</span>
                        </div>
                        <p className="text-[11px] text-[#81340599] ml-5 leading-relaxed">
                          Powered by <span className="font-black text-[#813405]">Stripe</span> — all transactions are encrypted
                        </p>
                      </div>

                      {/* Card brand badges */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {CARD_BRANDS.map((brand) => {
                          const isActive = detectedBrand === brand.id;
                          const isDetecting = detectedBrand !== null;
                          return (
                            <motion.div
                              key={brand.id}
                              animate={{
                                scale: isActive ? 1.18 : isDetecting ? 0.88 : 1,
                                opacity: isDetecting && !isActive ? 0.35 : 1,
                              }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              title={brand.label}
                              className="flex flex-col items-center justify-center rounded-lg px-2 py-1 min-w-[44px]"
                              style={{
                                background: brand.bg,
                                boxShadow: isActive
                                  ? `0 4px 14px ${brand.glow}, 0 0 0 2px white, 0 0 0 3.5px ${brand.text === "#FFFFFF" ? brand.glow : "#D45113"}`
                                  : "0 2px 6px rgba(0,0,0,0.12)",
                                transition: "box-shadow 0.2s",
                              }}
                            >
                              {brand.id === "mastercard" ? (
                                <span className="flex -space-x-1 mb-0.5">
                                  <span className="w-3 h-3 rounded-full bg-[#EB001B] inline-block" />
                                  <span className="w-3 h-3 rounded-full bg-[#F79E1B] inline-block" />
                                </span>
                              ) : (
                                <span className="text-[13px] leading-none mb-0.5">{brand.emoji}</span>
                              )}
                              <span
                                className="text-[7px] font-black tracking-widest leading-none"
                                style={{ color: brand.text }}
                              >
                                {brand.abbr}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Divider */}
                    <div
                      className="h-px"
                      style={{ background: "linear-gradient(to right, transparent, #F8DDA4, transparent)" }}
                    />

                    {/* Card Number */}
                    <Field label="Card Number" icon={<CreditCard size={15} />}>
                      <input
                        type="text"
                        value={cardNum}
                        onChange={(e) => setCardNum(formatCard(e.target.value))}
                        placeholder="1234  5678  9012  3456"
                        maxLength={19}
                        className="checkout-input font-mono tracking-widest pr-4"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Expiry */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-[#813405] ml-1 flex items-center gap-1">
                          <span>📅</span> Expiry
                        </label>
                        <input
                          type="text"
                          placeholder="MM / YY"
                          maxLength={7}
                          className="checkout-input"
                          style={{ paddingLeft: "1rem" }}
                        />
                      </div>

                      {/* CVC */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-[#813405] ml-1 flex items-center gap-1">
                          <span>🔒</span> Security Code
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            placeholder="CVC"
                            maxLength={4}
                            className="checkout-input pr-11"
                            style={{ paddingLeft: "1rem" }}
                          />
                          <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D45113]/30" size={16} />
                        </div>
                      </div>
                    </div>

                    {/* Save card */}
                    <label className="flex items-center gap-2.5 cursor-pointer mt-2 ml-1 select-none">
                      <input type="checkbox" className="w-4 h-4 rounded accent-[#D45113]" />
                      <span className="text-sm font-bold text-[#813405]">💾 Save card for future orders</span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>

          {/* Order Summary */}
          <div
            className="rounded-[28px] p-6 mt-2 border border-[#F8DDA4]/40"
            style={{
              background: "linear-gradient(160deg, #ffffff, #FDF6EC)",
              boxShadow: "0 8px 40px rgba(129,52,5,0.08)",
            }}
          >
            <h3 className="font-black text-[#813405] text-sm mb-4 uppercase tracking-widest text-[10px]">
              🧾 Order Summary
            </h3>
            {hasClosedRestaurantItems && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                This restaurant is currently closed. You cannot place this order right now.
              </div>
            )}
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-400 text-sm">Subtotal</span>
              <span className="font-bold text-[#813405]">Rs {total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 text-sm">🛵 Delivery Fee</span>
              <span className="font-bold text-[#813405]">Rs 250</span>
            </div>
            <div
              className="h-px mb-4"
              style={{ background: "linear-gradient(to right, transparent, #F8DDA4, transparent)" }}
            />
            <div className="flex justify-between font-black text-xl text-[#813405] mb-7">
              <span style={{ fontFamily: "var(--font-heading)" }}>Total</span>
              <span style={{ fontFamily: "var(--font-heading)" }}>
                Rs {(total + 250).toLocaleString()}
              </span>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={place}
              disabled={hasClosedRestaurantItems}
              className="w-full text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm relative overflow-hidden"
              style={{
                background: hasClosedRestaurantItems
                  ? "rgba(148,163,184,0.8)"
                  : "linear-gradient(135deg, #D45113 0%, #813405 100%)",
                boxShadow: hasClosedRestaurantItems
                  ? "none"
                  : "0 8px 28px rgba(212,81,19,0.38), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              {/* inner gloss */}
              <span className="absolute inset-x-0 top-0 h-1/2 bg-white/10 rounded-t-2xl pointer-events-none" />
              🛒 &nbsp;Place Order
            </motion.button>
          </div>

        </div>
      </div>
      <Footer />

      {/* Global input styles */}
      <style>{`
        .checkout-input {
          width: 100%;
          background: rgba(248,221,164,0.08);
          border: 1.5px solid rgba(248,221,164,0.35);
          border-radius: 14px;
          padding: 12px 16px;
          outline: none;
          color: #813405;
          font-weight: 600;
          font-size: 13px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .checkout-input::placeholder { color: rgba(129,52,5,0.3); }
        .checkout-input:focus {
          border-color: #D45113;
          box-shadow: 0 0 0 3px rgba(212,81,19,0.1);
        }
      `}</style>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: any) {
  return (
    <div
      className="rounded-[28px] p-6 mb-4 border border-[#F8DDA4]/30"
      style={{
        background: "linear-gradient(160deg,#ffffff,#FDF6EC)",
        boxShadow: "0 4px 24px rgba(129,52,5,0.06)",
      }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(212,81,19,0.1)" }}
        >
          <Icon className="h-4 w-4 text-[#D45113]" />
        </div>
        <h2
          className="font-black text-[#813405]"
          style={{ letterSpacing: "-0.01em" }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-widest font-bold text-[#813405] ml-1 flex items-center gap-1">
        <span className="text-[#D45113]/60">{icon}</span>
        {label}
      </label>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

function PayOpt({ active, onClick, icon: Icon, label, emoji }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="p-4 rounded-[20px] flex flex-col items-start gap-2.5 text-left relative overflow-hidden"
      style={{
        border: active ? "2px solid #D45113" : "2px solid rgba(248,221,164,0.35)",
        background: active
          ? "linear-gradient(135deg,rgba(212,81,19,0.06),rgba(129,52,5,0.03))"
          : "#ffffff",
        boxShadow: active ? "0 4px 16px rgba(212,81,19,0.12)" : "none",
        transition: "all 0.2s",
      }}
    >
      {active && (
        <span className="absolute top-2 right-2 text-[10px]">✅</span>
      )}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
        style={{
          background: active
            ? "linear-gradient(135deg,#D45113,#813405)"
            : "rgba(248,221,164,0.3)",
        }}
      >
        <span>{emoji}</span>
      </div>
      <span
        className="text-sm font-black leading-snug"
        style={{ color: active ? "#813405" : "#b0a090" }}
      >
        {label}
      </span>
    </motion.button>
  );
}
