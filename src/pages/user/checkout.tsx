import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Wallet, CreditCard,
  User, Phone, Mail, ShieldCheck, ChevronRight, MessageSquare
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useLocationState } from "@/context/LocationContext";
import type { SavedAddress } from "@/context/LocationContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { useRestaurants, type Offer } from "@/context/RestaurantContext";
import { isRestaurantOpen } from "@/utils/time";
import { AddressesListView, AddAddressFormView } from "./location";
import { getCartItemPrices, formatPrice, VAT_RATE } from "@/utils/pricing";

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

function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

export function Checkout() {
  const { findRestaurant, offers } = useRestaurants();
  const { items, total, clear } = useCart();
  const {
    selectedLocation,
    savedAddresses,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    setSelectedLocation
  } = useLocationState();

  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { placeOrder } = useOrders();
  const [pay, setPay] = useState<"cash" | "card">("cash");
  const [orderType, setOrderType] = useState<"Delivery" | "Self Pickup">("Delivery");

  // Resolve restaurant from cart items
  const restaurant = useMemo(() => {
    return items.length > 0 ? findRestaurant(items[0].restaurantId) : undefined;
  }, [items, findRestaurant]);

  // Dynamically default payment method if COD is disabled by restaurant
  useEffect(() => {
    if (restaurant && restaurant.cashOnDelivery === false) {
      setPay("card");
    }
  }, [restaurant]);

  // Dynamically default order type if delivery is disabled by restaurant
  useEffect(() => {
    if (restaurant && restaurant.deliveryAvailable === false) {
      setOrderType("Self Pickup");
    }
  }, [restaurant]);

  const restaurantStatus = useMemo(() => {
    if (!restaurant) return { allowed: true, message: "" };
    if (restaurant.temporaryClosure) {
      return { allowed: false, message: "This restaurant is temporarily closed. You cannot place this order right now." };
    }
    if (restaurant.holidayMode) {
      return { allowed: false, message: "This restaurant is closed for holidays. You cannot place this order right now." };
    }
    if (restaurant.vacationMode) {
      return { allowed: false, message: "This restaurant is currently on vacation. You cannot place this order right now." };
    }
    if (restaurant.acceptOrders === false) {
      return { allowed: false, message: "This restaurant's kitchen is busy and not accepting new orders right now." };
    }
    if (!isRestaurantOpen(restaurant)) {
      return { allowed: false, message: "This restaurant is currently closed. You cannot place this order right now." };
    }
    return { allowed: true, message: "" };
  }, [restaurant]);

  // Compute distance in km
  const distance = useMemo(() => {
    if (!selectedLocation || !restaurant) return 1.5; // default fallback

    // Coordinates lookup map for Trincomalee landmarks
    const coordMap: Record<string, { lat: number; lng: number }> = {
      "trinco-spice": { lat: 8.5714, lng: 81.2335 },
      "ocean-pearl": { lat: 8.5835, lng: 81.2185 },
      "biryani-palace": { lat: 8.5685, lng: 81.2315 },
      "burger-co": { lat: 8.5752, lng: 81.2285 },
      
      // Landmarks / Locations
      "default-trinco": { lat: 8.5714, lng: 81.2335 },
      "recent-uppuveli": { lat: 8.5850, lng: 81.2150 },
      "recent-nilaveli": { lat: 8.6850, lng: 81.1850 },
      "recent-dockyard": { lat: 8.5680, lng: 81.2350 },
      "recent-main": { lat: 8.5700, lng: 81.2300 },
      "suggest-orrs-hill": { lat: 8.5790, lng: 81.2250 },
      "suggest-mc-road": { lat: 8.5650, lng: 81.2330 }
    };

    const restId = restaurant.id;
    const restCoords = coordMap[restId] || coordMap["trinco-spice"];
    
    let custLat = (selectedLocation as any).lat || (selectedLocation as any).location?.lat;
    let custLng = (selectedLocation as any).lng || (selectedLocation as any).location?.lng;

    if (!custLat || !custLng) {
      const locId = selectedLocation.id;
      const matched = coordMap[locId];
      if (matched) {
        custLat = matched.lat;
        custLng = matched.lng;
      } else {
        const label = (selectedLocation.label || "").toLowerCase();
        if (label.includes("uppuveli")) {
          custLat = coordMap["recent-uppuveli"].lat;
          custLng = coordMap["recent-uppuveli"].lng;
        } else if (label.includes("nilaveli")) {
          custLat = coordMap["recent-nilaveli"].lat;
          custLng = coordMap["recent-nilaveli"].lng;
        } else if (label.includes("dockyard")) {
          custLat = coordMap["recent-dockyard"].lat;
          custLng = coordMap["recent-dockyard"].lng;
        } else if (label.includes("main")) {
          custLat = coordMap["recent-main"].lat;
          custLng = coordMap["recent-main"].lng;
        } else {
          // Deterministic mock distance based on label length to show variation
          const hash = label.length % 5;
          return 1.2 + hash * 1.5;
        }
      }
    }

    return parseFloat(getHaversineDistance(restCoords.lat, restCoords.lng, custLat, custLng).toFixed(1));
  }, [selectedLocation, restaurant]);

  // Check if there is an active FREE_DELIVERY offer for this restaurant
  const hasFreeDeliveryOffer = useMemo(() => {
    if (!restaurant) return false;
    
    // Check if any cart item has applied offer of type FREE_DELIVERY
    const cartHasFreeDelivery = items.some(it => it.appliedOffer?.type === 'FREE_DELIVERY');
    if (cartHasFreeDelivery) return true;

    // Check if there is an active offer of type FREE_DELIVERY for this restaurant
    const activeOffers = offers.filter(o => o.restaurantId === restaurant.id);
    const getAutomaticOfferStatus = (offer: Offer) => {
      if (offer.status === "Draft") return "Draft";
      const now = new Date();
      const todayStr = now.getFullYear() + "-" + 
        String(now.getMonth() + 1).padStart(2, "0") + "-" + 
        String(now.getDate()).padStart(2, "0");
      if (todayStr > offer.endDate) return "Expired";
      if (todayStr < offer.startDate) return "Scheduled";
      const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      if (!offer.activeDays.includes(daysMap[now.getDay()])) return "Scheduled";
      return "Active";
    };
    return activeOffers.some(o => o.type === 'FREE_DELIVERY' && getAutomaticOfferStatus(o) === 'Active');
  }, [items, offers, restaurant]);

  // Compute delivery fee
  const deliveryFee = useMemo(() => {
    if (orderType !== "Delivery" || !restaurant || restaurant.deliveryAvailable === false || hasFreeDeliveryOffer) return 0;
    
    if (restaurant.freeDeliveryThreshold && restaurant.freeDeliveryThreshold > 0 && total >= restaurant.freeDeliveryThreshold) {
      return 0;
    }

    if (restaurant.deliveryFee !== undefined && restaurant.deliveryFee !== null) {
      return restaurant.deliveryFee;
    }
    
    const RATE_PER_KM = 50;
    const calculated = Math.round(distance * RATE_PER_KM);
    return calculated;
  }, [orderType, restaurant, distance, hasFreeDeliveryOffer, total]);

  // Check if there is an active order-level offer applied
  const orderDiscount = useMemo(() => {
    if (!restaurant) return 0;
    // Look at active offers for this restaurant
    const getAutomaticOfferStatus = (offer: Offer) => {
      if (offer.status === "Draft") return "Draft";
      const now = new Date();
      const todayStr = now.getFullYear() + "-" + 
        String(now.getMonth() + 1).padStart(2, "0") + "-" + 
        String(now.getDate()).padStart(2, "0");
      if (todayStr > offer.endDate) return "Expired";
      if (todayStr < offer.startDate) return "Scheduled";
      const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      if (!offer.activeDays.includes(daysMap[now.getDay()])) return "Scheduled";
      return "Active";
    };
    const activeOffers = offers.filter(o => o.restaurantId === restaurant.id && getAutomaticOfferStatus(o) === "Active");
    
    let discount = 0;
    
    // Find FIRST_ORDER_DISCOUNT
    const firstOrderOffer = activeOffers.find(o => o.type === "FIRST_ORDER_DISCOUNT");
    if (firstOrderOffer) {
      // Extract percentage or amount
      const pctMatch = firstOrderOffer.discountBadge.match(/(\d+)%/);
      if (pctMatch) {
        discount = total * (parseInt(pctMatch[1], 10) / 100);
      } else {
        const amtMatch = firstOrderOffer.discountBadge.match(/Rs\.?\s*(\d+)/i) || firstOrderOffer.discountBadge.match(/(\d+)\s*Off/i);
        if (amtMatch) {
          discount = parseFloat(amtMatch[1]);
        }
      }
    }
    
    // Find MINIMUM_ORDER discount
    const minOrderOffer = activeOffers.find(o => o.type === "MINIMUM_ORDER" && total >= (o.minOrderAmount || 0));
    if (minOrderOffer) {
      const pctMatch = minOrderOffer.discountBadge.match(/(\d+)%/);
      if (pctMatch) {
        discount = Math.max(discount, total * (parseInt(pctMatch[1], 10) / 100));
      } else {
        const amtMatch = minOrderOffer.discountBadge.match(/Rs\.?\s*(\d+)/i) || minOrderOffer.discountBadge.match(/(\d+)\s*Off/i);
        if (amtMatch) {
          discount = Math.max(discount, parseFloat(amtMatch[1]));
        }
      }
    }

    // Find FIXED_AMOUNT_DISCOUNT (when not item-specific, i.e. no menuItemId)
    const fixedAmtOffer = activeOffers.find(o => o.type === "FIXED_AMOUNT_DISCOUNT" && !o.menuItemId && total >= (o.minOrderAmount || 0));
    if (fixedAmtOffer) {
      const amtMatch = fixedAmtOffer.discountBadge.match(/Rs\.?\s*(\d+)/i) || fixedAmtOffer.discountBadge.match(/(\d+)\s*Off/i);
      if (amtMatch) {
        discount = Math.max(discount, parseFloat(amtMatch[1]));
      }
    }

    return Math.round(discount);
  }, [offers, restaurant, total]);

  const isBelowMinOrder = useMemo(() => {
    if (!restaurant || restaurant.minOrder === undefined || restaurant.minOrder === null) return false;
    return total < restaurant.minOrder;
  }, [restaurant, total]);

  // Bottom drawer address selector states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<"list" | "form">("list");
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  const [loc, setLoc] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });

  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    if (clean.length > 2) {
      return `${clean.slice(0, 2)} / ${clean.slice(2)}`;
    }
    return clean;
  };

  const formatCvc = (val: string) => val.replace(/\D/g, "").slice(0, 4);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  // Synchronize contact info with selected address or fall back to user profile
  useEffect(() => {
    if (selectedLocation) {
      const isSaved = (selectedLocation as SavedAddress).fullName || (selectedLocation as SavedAddress).firstName;
      
      const addressName = isSaved
        ? ((selectedLocation as SavedAddress).fullName || `${(selectedLocation as SavedAddress).firstName} ${(selectedLocation as SavedAddress).lastName || ""}`.trim())
        : (user?.name || selectedLocation.label);

      let cleanUserPhone = "";
      if (user?.phone) {
        let clean = user.phone.replace(/\D/g, "");
        if (clean.startsWith("94")) {
          clean = clean.substring(2);
        }
        clean = clean.replace(/^0/, "");
        cleanUserPhone = clean;
      }

      setContact((prev) => ({
        ...prev,
        name: addressName || prev.name,
        phone: (selectedLocation as SavedAddress).phoneNumber || cleanUserPhone || prev.phone,
        email: (selectedLocation as SavedAddress).email || user?.email || prev.email,
      }));
      setLoc(selectedLocation.address || selectedLocation.label);
    }
  }, [selectedLocation, user]);

  if (!isAuthenticated) return null;

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

  const place = async () => {
    if (!restaurantStatus.allowed || isBelowMinOrder || isProcessingPayment) return;

    if (pay === "card") {
      const cleanCard = cardNum.replace(/\s/g, "");
      if (cleanCard.length !== 16) {
        alert("Please enter a valid 16-digit card number.");
        return;
      }
      const cleanExpiry = cardExpiry.replace(/\s/g, "");
      if (cleanExpiry.length !== 5 || !cleanExpiry.includes("/")) {
        alert("Please enter a valid expiry date in MM / YY format.");
        return;
      }
      const cleanCvc = cardCvc.replace(/\s/g, "");
      if (cleanCvc.length < 3 || cleanCvc.length > 4) {
        alert("Please enter a valid 3 or 4-digit security code (CVC).");
        return;
      }
    }

    const restaurantId = items.length > 0 ? items[0].restaurantId : "";
    const restaurantName =
      items.length > 0
        ? findRestaurant(items[0].restaurantId)?.name ?? "Trinco Bites"
        : "Trinco Bites";

    const finalSubtotal = Math.max(0, total - orderDiscount);
    const vatAmount = Math.round(finalSubtotal * VAT_RATE);
    const grandTotal = finalSubtotal + deliveryFee + vatAmount;

    setIsProcessingPayment(true);

    try {
      await placeOrder({
        restaurantId,
        restaurantName,
        items,
        orderType,
        subtotal: finalSubtotal,
        tax: vatAmount,
        deliveryFee,
        total: grandTotal,
        paymentMethod: pay,
        contact,
        deliveryAddress: loc || selectedLocation.address || selectedLocation.label,
        locationLabel: selectedLocation.label,
        cardNumber: pay === "card" ? cardNum : undefined,
        cardExpiry: pay === "card" ? cardExpiry : undefined,
        cardCvc: pay === "card" ? cardCvc : undefined,
      } as any);
      clear();
      navigate({ to: "/track" });
    } catch (err: any) {
      alert(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F0E3]">
      <Navbar />
      <div className="flex-1">
        <div className="mx-auto max-w-2xl px-4 pt-6 pb-12">

          {/* Page Title */}
          <div className="flex items-center gap-3 mb-5">
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


          {/* Redesigned Delivery Location (Screenshot 1 Layout) */}
          <Section title="Delivery Location" icon={MapPin}>
            <div
              onClick={() => {
                setDrawerStep("list");
                setIsDrawerOpen(true);
              }}
              className="bg-white rounded-2xl p-4.5 border border-[#F8DDA4]/45 shadow-[0_4px_16px_rgba(129,52,5,0.02)] flex items-center justify-between cursor-pointer hover:border-[#D45113]/30 transition group"
            >
              <div className="flex gap-3 items-start min-w-0 flex-1">
                <MapPin className="h-5 w-5 text-[#D45113] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-extrabold text-[#813405] text-sm">
                      {(selectedLocation as SavedAddress).fullName || (selectedLocation as SavedAddress).firstName
                        ? ((selectedLocation as SavedAddress).fullName || `${(selectedLocation as SavedAddress).firstName} ${(selectedLocation as SavedAddress).lastName || ""}`.trim())
                        : selectedLocation.label}
                    </h4>
                    {(selectedLocation as SavedAddress).email && (
                      <span className="text-[#813405]/60 text-xs font-semibold">
                        ({(selectedLocation as SavedAddress).email})
                      </span>
                    )}
                    {(selectedLocation as SavedAddress).phoneNumber && (
                      <span className="text-[#813405]/50 text-xs font-bold">
                        +94 {(selectedLocation as SavedAddress).phoneNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#D45113] font-black mt-1 leading-relaxed truncate">
                    {(selectedLocation as SavedAddress).streetAddress || selectedLocation.address}
                  </p>
                  <p className="text-[11px] text-[#813405]/60 font-bold mt-0.5 leading-normal">
                    {(selectedLocation as SavedAddress).city ? `${(selectedLocation as SavedAddress).city}, ${(selectedLocation as SavedAddress).district || ""}, ${(selectedLocation as SavedAddress).province || ""}, Sri Lanka` : "Tap to select address"}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[#813405]/30 group-hover:text-[#D45113] transition shrink-0 ml-3" />
            </div>
          </Section>

          {/* Order Type — Delivery vs Self Pickup */}
          <Section title="Order Type" icon={MapPin}>
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={restaurant?.deliveryAvailable === false}
                onClick={() => setOrderType("Delivery")}
                className={`p-4 rounded-[20px] flex flex-col items-start gap-2.5 text-left relative overflow-hidden transition-all duration-200 ${
                  restaurant?.deliveryAvailable === false ? "opacity-50 cursor-not-allowed" : ""
                }`}
                style={{
                  border: orderType === "Delivery" && restaurant?.deliveryAvailable !== false
                    ? "2px solid #D45113"
                    : "2px solid rgba(248,221,164,0.35)",
                  background: restaurant?.deliveryAvailable === false
                    ? "rgba(129,52,5,0.03)"
                    : orderType === "Delivery"
                      ? "linear-gradient(135deg,rgba(212,81,19,0.06),rgba(129,52,5,0.03))"
                      : "#ffffff",
                  boxShadow: orderType === "Delivery" && restaurant?.deliveryAvailable !== false
                    ? "0 4px 16px rgba(212,81,19,0.12)"
                    : "none",
                }}
              >
                {orderType === "Delivery" && restaurant?.deliveryAvailable !== false && <span className="absolute top-2 right-2 text-[10px]">✅</span>}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                  style={{ background: orderType === "Delivery" && restaurant?.deliveryAvailable !== false ? "linear-gradient(135deg,#D45113,#813405)" : "rgba(248,221,164,0.3)" }}>
                  <span>🛵</span>
                </div>
                <span className="text-sm font-black leading-snug" style={{ color: orderType === "Delivery" && restaurant?.deliveryAvailable !== false ? "#813405" : "#b0a090" }}>
                  Delivery
                </span>
                <span className="text-[10px] font-semibold" style={{ color: orderType === "Delivery" && restaurant?.deliveryAvailable !== false ? "#D45113" : "#c0b0a0" }}>
                  {restaurant?.deliveryAvailable === false ? "Delivery Unavailable" : `+ Rs. ${deliveryFee} delivery fee (${distance} km)`}
                </span>
              </button>
              <button
                onClick={() => setOrderType("Self Pickup")}
                className="p-4 rounded-[20px] flex flex-col items-start gap-2.5 text-left relative overflow-hidden transition-all duration-200"
                style={{
                  border: orderType === "Self Pickup" ? "2px solid #D45113" : "2px solid rgba(248,221,164,0.35)",
                  background: orderType === "Self Pickup"
                    ? "linear-gradient(135deg,rgba(212,81,19,0.06),rgba(129,52,5,0.03))"
                    : "#ffffff",
                  boxShadow: orderType === "Self Pickup" ? "0 4px 16px rgba(212,81,19,0.12)" : "none",
                }}
              >
                {orderType === "Self Pickup" && <span className="absolute top-2 right-2 text-[10px]">✅</span>}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                  style={{ background: orderType === "Self Pickup" ? "linear-gradient(135deg,#D45113,#813405)" : "rgba(248,221,164,0.3)" }}>
                  <span>🏃</span>
                </div>
                <span className="text-sm font-black leading-snug" style={{ color: orderType === "Self Pickup" ? "#813405" : "#b0a090" }}>
                  Self Pickup
                </span>
                <span className="text-[10px] font-semibold" style={{ color: orderType === "Self Pickup" ? "#D45113" : "#c0b0a0" }}>
                  No delivery fee
                </span>
              </button>
            </div>
          </Section>

          {/* Payment */}
          <Section title="Payment Method" icon={Wallet}>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <PayOpt 
                active={pay === "cash"} 
                onClick={() => setPay("cash")} 
                icon={Wallet} 
                label="Cash on Delivery" 
                emoji="💵" 
                disabled={restaurant?.cashOnDelivery === false}
                tooltip={restaurant?.cashOnDelivery === false ? "Cash on Delivery is disabled by this restaurant." : undefined}
              />
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
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
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
                            value={cardCvc}
                            onChange={(e) => setCardCvc(formatCvc(e.target.value))}
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
            {!restaurantStatus.allowed && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                {restaurantStatus.message}
              </div>
            )}
            {isBelowMinOrder && (
              <div className="mb-4 rounded-2xl border border-[#F8DDA4] bg-[#FFF5E6]/90 backdrop-blur-sm px-4 py-3 text-xs font-extrabold text-[#813405] flex items-center gap-2.5 shadow-[0_4px_12px_rgba(129,52,5,0.04)]">
                <span className="text-base">⚠️</span>
                <span>
                  The minimum order value for <span className="text-[#D45113]">{restaurant?.name}</span> is {restaurant?.minOrder ? formatPrice(restaurant.minOrder) : ""}. 
                  Please add {restaurant?.minOrder ? formatPrice(restaurant.minOrder - total) : ""} more to place your order.
                </span>
              </div>
            )}
            {/* Ordered Items List */}
            <div className="mb-5 space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((it) => {
                const prices = getCartItemPrices(it);
                return (
                  <div key={it.dbId || it.id} className="text-xs space-y-1 bg-white/50 border border-[#F8DDA4]/25 p-3 rounded-xl">
                    <div className="flex justify-between font-bold text-[#813405]">
                      <span className="truncate max-w-[70%] flex items-center gap-1 flex-wrap">
                        {it.name}
                        {it.selectedSize && (
                          <span className="text-[10px] font-black text-orange-650 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                            {it.selectedSize}
                          </span>
                        )}
                        {it.appliedOffer && (
                          <span className="text-[9px] font-black text-emerald-650 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                            🏷️ {it.appliedOffer.discountBadge} Applied
                          </span>
                        )}
                        <span className="ml-1 text-slate-400 text-[10px]">x{it.quantity}</span>
                      </span>
                      <span>{formatPrice(prices.itemTotal)}</span>
                    </div>
                    
                    {(it.appliedOffer?.type === "BUY_ONE_GET_ONE" || it.appliedOffer?.id === "O-205") && (
                      <div className="mt-1.5 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100/50 flex items-center justify-between text-[11px] text-emerald-850 font-bold">
                        <span className="flex items-center gap-1">
                          🎁 {it.quantity}x {it.name} ({it.selectedSize || "Regular"}) [FREE BOGO]
                        </span>
                        <span className="font-black">Rs 0</span>
                      </div>
                    )}
                    
                    <div className="text-[11px] text-[#813405]/70 pl-2 space-y-0.5 border-l border-[#F8DDA4]">
                      <div className="flex justify-between">
                        <span>Base Price ({it.quantity}x {formatPrice(prices.basePrice)})</span>
                        {it.appliedOffer && prices.basePrice < (it.selectedSize === "Large" ? it.price * 1.5 : it.price) ? (
                          <span className="font-semibold flex items-center gap-1.5">
                            <span className="text-slate-400 line-through font-normal">{formatPrice((it.selectedSize === "Large" ? it.price * 1.5 : it.price) * it.quantity)}</span>
                            <span>{formatPrice(prices.totalBasePrice)}</span>
                          </span>
                        ) : (
                          <span className="font-semibold">{formatPrice(prices.totalBasePrice)}</span>
                        )}
                      </div>
                      
                      {it.selectedExtras && it.selectedExtras.length > 0 && (
                        <>
                          {it.selectedExtras.map((extra, idx) => (
                            <div key={idx} className="flex justify-between text-[#813405]/50 pl-1.5">
                              <span>+ {extra.name} ({it.quantity}x {formatPrice(extra.price)})</span>
                              <span>{formatPrice(extra.price * it.quantity)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-bold text-[#813405]/75 pl-1.5 pt-0.5">
                            <span>Add-ons Total</span>
                            <span>{formatPrice(prices.totalExtrasPrice)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-400 text-sm">Subtotal</span>
              <span className="font-bold text-[#813405]">{formatPrice(total)}</span>
            </div>
            {orderDiscount > 0 && (
              <div className="flex justify-between items-center mb-3 text-emerald-600 font-black">
                <span className="text-sm">Order Discount</span>
                <span>-{formatPrice(orderDiscount)}</span>
              </div>
            )}
            {orderType === "Delivery" && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-sm">
                  🛵 Delivery Fee {restaurant?.deliveryFee !== undefined && restaurant?.deliveryFee !== null ? `(${distance} km)` : `(Rs. 50/km · ${distance} km)`}
                </span>
                <span className="font-bold text-[#813405]">{formatPrice(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 text-sm">🇱🇰 VAT (18%)</span>
              <span className="font-bold text-[#813405]">{formatPrice(Math.round(Math.max(0, total - orderDiscount) * VAT_RATE))}</span>
            </div>
            <div
              className="h-px mb-4 mt-1"
              style={{ background: "linear-gradient(to right, transparent, #F8DDA4, transparent)" }}
            />
            <div className="flex justify-between font-black text-xl text-[#813405] mb-7">
              <span style={{ fontFamily: "var(--font-heading)" }}>Total</span>
              <span style={{ fontFamily: "var(--font-heading)" }}>
                {formatPrice(Math.max(0, total - orderDiscount) + deliveryFee + Math.round(Math.max(0, total - orderDiscount) * VAT_RATE))}
              </span>
            </div>

            <motion.button
              whileTap={!restaurantStatus.allowed || isBelowMinOrder || isProcessingPayment ? undefined : { scale: 0.97 }}
              onClick={place}
              disabled={!restaurantStatus.allowed || isBelowMinOrder || isProcessingPayment}
              className="w-full text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm relative overflow-hidden flex items-center justify-center gap-2"
              style={{
                background: (!restaurantStatus.allowed || isBelowMinOrder)
                  ? "rgba(148,163,184,0.8)"
                  : isProcessingPayment
                    ? "linear-gradient(135deg, #D45113 0%, #813405 100%)"
                    : "linear-gradient(135deg, #D45113 0%, #813405 100%)",
                opacity: isProcessingPayment ? 0.8 : 1,
                boxShadow: (!restaurantStatus.allowed || isBelowMinOrder || isProcessingPayment)
                  ? "none"
                  : "0 8px 28px rgba(212,81,19,0.38), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              {/* inner gloss */}
              <span className="absolute inset-x-0 top-0 h-1/2 bg-white/10 rounded-t-2xl pointer-events-none" />
              {isProcessingPayment ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Payment...
                </span>
              ) : isBelowMinOrder 
                ? `Min. Order LKR ${restaurant?.minOrder} Required`
                : !restaurantStatus.allowed 
                  ? "Restaurant Unavailable" 
                  : "🛒 Place Order"}
            </motion.button>
          </div>

        </div>
      </div>

      {/* Slide-Up Addresses Bottom Sheet Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-[#813405]/20 backdrop-blur-[2px]"
            />
            {/* Slide-up sheet max-w-md centered */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 240 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md bg-[#F7F0E3] rounded-t-[30px] shadow-[0_-16px_40px_rgba(129,52,5,0.12)] overflow-hidden flex flex-col border-t border-[#813405]/10"
              style={{ height: "85vh" }}
            >
              {/* Draggable notch indicator */}
              <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-[#813405]/15 shrink-0" />
              
              <div className="flex-1 overflow-y-auto px-1 pb-8" style={{ scrollbarWidth: "none" }}>
                {drawerStep === "list" ? (
                  <AddressesListView
                    error=""
                    query=""
                    savedAddresses={savedAddresses}
                    selectedLocation={selectedLocation}
                    onBack={() => setIsDrawerOpen(false)}
                    onAddAddress={() => {
                      setEditingAddress(null);
                      setDrawerStep("form");
                    }}
                    onEditAddress={(addr) => {
                      setEditingAddress(addr);
                      setDrawerStep("form");
                    }}
                    onCurrentLocation={() => navigate({ to: "/location" })}
                    onQueryChange={() => {}}
                    onSearch={() => {}}
                    onSelectLocation={(address) => {
                      setSelectedLocation(address);
                      setIsDrawerOpen(false);
                    }}
                    onSetMap={() => navigate({ to: "/location" })}
                    onDeleteAddress={deleteAddress}
                    onSetDefault={setDefaultAddress}
                  />
                ) : (
                  <AddAddressFormView
                    initialAddress={editingAddress}
                    onBack={() => setDrawerStep("list")}
                    onSave={(addr) => {
                      saveAddress(addr);
                      setDrawerStep("list");
                    }}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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

function PayOpt({ active, onClick, icon: Icon, label, emoji, disabled, tooltip }: any) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`p-4 rounded-[20px] flex flex-col items-start gap-2.5 text-left relative overflow-hidden w-full ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      style={{
        border: active && !disabled ? "2px solid #D45113" : "2px solid rgba(248,221,164,0.35)",
        background: disabled
          ? "rgba(129,52,5,0.03)"
          : active
            ? "linear-gradient(135deg,rgba(212,81,19,0.06),rgba(129,52,5,0.03))"
            : "#ffffff",
        boxShadow: active && !disabled ? "0 4px 16px rgba(212,81,19,0.12)" : "none",
        transition: "all 0.2s",
      }}
      title={tooltip}
    >
      {active && !disabled && (
        <span className="absolute top-2 right-2 text-[10px]">✅</span>
      )}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
        style={{
          background: active && !disabled
            ? "linear-gradient(135deg,#D45113,#813405)"
            : "rgba(248,221,164,0.3)",
        }}
      >
        <span>{emoji}</span>
      </div>
      <span
        className="text-sm font-black leading-snug"
        style={{ color: active && !disabled ? "#813405" : "#b0a090" }}
      >
        {label}
        {disabled && (
          <span className="block text-[9px] font-semibold text-rose-500 mt-0.5">
            Unsupported
          </span>
        )}
      </span>
    </motion.button>
  );
}
