import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import type { FoodItem } from "@/utils/data/mock";
import type { Offer } from "@/context/RestaurantContext";
import { getCartItemPrices } from "@/utils/pricing";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { useRestaurants } from "@/context/RestaurantContext";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export type CartItem = FoodItem & { 
  quantity: number; 
  restaurantId: string;
  restaurantName?: string;
  selectedSize?: string;
  selectedExtras?: { name: string; price: number }[];
  instructions?: string;
  customPrice?: number;
  appliedOffer?: Offer;
  dbId?: string;
};

type CartCtx = {
  items: CartItem[];
  total: number;
  count: number;
  add: (item: FoodItem, restaurantId: string, quantity?: number, customizations?: Partial<CartItem>) => void;
  decrement: (id: string, customizations?: Partial<CartItem>) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const { findRestaurant } = useRestaurants();
  const [items, setItems] = useState<CartItem[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingItem, setPendingItem] = useState<{
    item: FoodItem;
    restaurantId: string;
    quantity: number;
    customizations: Partial<CartItem>;
  } | null>(null);

  const fetchCart = async () => {
    if (!token) return;
    try {
      const backendCart = await apiRequest<any[]>("/cart", { token });
      const mappedItems: CartItem[] = backendCart.map((bi) => ({
        id: bi.menuItemId,
        dbId: bi.id,
        name: bi.menuItem.name,
        price: bi.menuItem.price,
        image: bi.menuItem.image,
        description: bi.menuItem.description || "",
        category: bi.menuItem.categoryId || "",
        quantity: bi.quantity,
        restaurantId: bi.restaurantId,
        restaurantName: bi.restaurant?.name || undefined,
        selectedSize: bi.selectedSize || undefined,
        selectedExtras: bi.selectedExtras || undefined,
        instructions: bi.instructions || undefined,
        customPrice: bi.customPrice || undefined,
        appliedOffer: bi.appliedOffer || undefined,
      }));
      setItems(mappedItems);
    } catch (err) {
      console.error("Failed to fetch cart from backend:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCart();
    } else {
      setItems([]);
    }
  }, [token]);

  const add: CartCtx["add"] = async (item, restaurantId, quantity = 1, customizations = {}) => {
    // Check if cart contains items from a different restaurant
    if (items.length > 0 && items[0].restaurantId !== restaurantId) {
      setPendingItem({ item, restaurantId, quantity, customizations });
      setShowConflictModal(true);
      return;
    }

    if (token) {
      try {
        await apiRequest("/cart", {
          method: "POST",
          token,
          body: {
            menuItemId: item.id,
            restaurantId,
            quantity,
            selectedSize: customizations.selectedSize,
            selectedExtras: customizations.selectedExtras,
            instructions: customizations.instructions,
            customPrice: customizations.customPrice,
            appliedOfferId: customizations.appliedOffer?.id,
          },
        });
        await fetchCart();
      } catch (err) {
        console.error("Failed to add to cart on backend:", err);
      }
    } else {
      setItems((prev) => {
        // Find item with same ID AND same customizations
        const extrasJson = JSON.stringify(customizations.selectedExtras || []);
        const found = prev.find((p) => 
          p.id === item.id && 
          p.selectedSize === customizations.selectedSize &&
          JSON.stringify(p.selectedExtras || []) === extrasJson
        );

        if (found) {
          return prev.map((p) => (
            (p.id === item.id && 
             p.selectedSize === customizations.selectedSize &&
             JSON.stringify(p.selectedExtras || []) === extrasJson) 
            ? { ...p, quantity: p.quantity + quantity } 
            : p
          ));
        }
        return [...prev, { ...item, quantity, restaurantId, ...customizations }];
      });
    }
  };

  const decrement: CartCtx["decrement"] = async (id, customizations = {}) => {
    if (token) {
      const extrasJson = JSON.stringify(customizations.selectedExtras || []);
      const found = items.find((p) => 
        p.id === id && 
        p.selectedSize === customizations.selectedSize &&
        JSON.stringify(p.selectedExtras || []) === extrasJson
      );
      if (!found) return;

      try {
        if (found.quantity <= 1) {
          await apiRequest(`/cart/${found.dbId}`, { method: "DELETE", token });
        } else {
          await apiRequest(`/cart/${found.dbId}`, {
            method: "PATCH",
            token,
            body: { quantity: found.quantity - 1 },
          });
        }
        await fetchCart();
      } catch (err) {
        console.error("Failed to decrement cart item:", err);
      }
    } else {
      setItems((prev) => {
        const extrasJson = JSON.stringify(customizations.selectedExtras || []);
        const found = prev.find((p) => 
          p.id === id && 
          p.selectedSize === customizations.selectedSize &&
          JSON.stringify(p.selectedExtras || []) === extrasJson
        );
        if (!found) return prev;
        if (found.quantity <= 1) {
          return prev.filter((p) => !(
            p.id === id && 
            p.selectedSize === customizations.selectedSize &&
            JSON.stringify(p.selectedExtras || []) === extrasJson
          ));
        }
        return prev.map((p) => (
          (p.id === id && 
           p.selectedSize === customizations.selectedSize &&
           JSON.stringify(p.selectedExtras || []) === extrasJson) 
          ? { ...p, quantity: p.quantity - 1 } 
          : p
        ));
      });
    }
  };

  const remove: CartCtx["remove"] = async (id) => {
    if (token) {
      const isDbId = items.some((i) => i.dbId === id);
      const matched = isDbId
        ? items.filter((i) => i.dbId === id)
        : items.filter((i) => i.id === id);
      try {
        for (const item of matched) {
          if (item.dbId) {
            await apiRequest(`/cart/${item.dbId}`, { method: "DELETE", token });
          }
        }
        await fetchCart();
      } catch (err) {
        console.error("Failed to remove item(s) from backend cart:", err);
      }
    } else {
      setItems((p) => p.filter((i) => i.id !== id && i.dbId !== id));
    }
  };

  const setQty: CartCtx["setQty"] = async (id, qty) => {
    if (token) {
      if (qty <= 0) {
        await remove(id);
        return;
      }
      const isDbId = items.some((i) => i.dbId === id);
      const found = isDbId
        ? items.find((i) => i.dbId === id)
        : items.find((i) => i.id === id);
      if (!found) return;

      try {
        await apiRequest(`/cart/${found.dbId}`, {
          method: "PATCH",
          token,
          body: { quantity: qty },
        });
        await fetchCart();
      } catch (err) {
        console.error("Failed to update cart item quantity:", err);
      }
    } else {
      setItems((p) => (qty <= 0 ? p.filter((i) => i.id !== id) : p.map((i) => (i.id === id ? { ...i, quantity: qty } : i))));
    }
  };

  const clear = async () => {
    if (token) {
      try {
        await apiRequest("/cart", { method: "DELETE", token });
        await fetchCart();
      } catch (err) {
        console.error("Failed to clear backend cart:", err);
      }
    } else {
      setItems([]);
    }
  };

  const total = useMemo(() => items.reduce((s, i) => s + getCartItemPrices(i).itemTotal, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  const confirmReplace = async () => {
    if (!pendingItem) return;
    const { item, restaurantId, quantity, customizations } = pendingItem;

    if (token) {
      try {
        console.log("confirmReplace: Deleting old cart items from backend database...");
        await apiRequest("/cart", { method: "DELETE", token });
        
        console.log("confirmReplace: Adding new item from new restaurant to backend...");
        await apiRequest("/cart", {
          method: "POST",
          token,
          body: {
            menuItemId: item.id,
            restaurantId,
            quantity,
            selectedSize: customizations.selectedSize,
            selectedExtras: customizations.selectedExtras,
            instructions: customizations.instructions,
            customPrice: customizations.customPrice,
            appliedOfferId: customizations.appliedOffer?.id,
          },
        });
        
        console.log("confirmReplace: Fetching updated cart items...");
        await fetchCart();
        toast.success("Cart replaced successfully!");
      } catch (err: any) {
        console.error("Failed to replace cart on backend:", err);
        toast.error(`Failed to replace cart: ${err?.message || err}`);
      }
    } else {
      console.log("confirmReplace: Guest user, replacing local state...");
      setItems([{ ...item, quantity, restaurantId, ...customizations }]);
      toast.success("Cart replaced successfully!");
    }

    setShowConflictModal(false);
    setPendingItem(null);
  };

  const existingRestaurant = useMemo(() => {
    if (items.length === 0) return "";
    return items[0].restaurantName || findRestaurant(items[0].restaurantId)?.name || "Another Restaurant";
  }, [items, findRestaurant]);

  const newRestaurant = useMemo(() => {
    if (!pendingItem) return "";
    return findRestaurant(pendingItem.restaurantId)?.name || "New Restaurant";
  }, [pendingItem, findRestaurant]);

  return (
    <Ctx.Provider value={{ items, total, count, add, decrement, remove, setQty, clear }}>
      {children}
      <AnimatePresence>
        {showConflictModal && pendingItem && (
          <ConflictModal
            onCancel={() => {
              setShowConflictModal(false);
              setPendingItem(null);
            }}
            onConfirm={confirmReplace}
            existingRestaurant={existingRestaurant}
            newRestaurant={newRestaurant}
          />
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
};

interface ConflictModalProps {
  onCancel: () => void;
  onConfirm: () => void;
  existingRestaurant: string;
  newRestaurant: string;
}

function ConflictModal({ onCancel, onConfirm, existingRestaurant, newRestaurant }: ConflictModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[32px] border border-white/20 bg-white/95 p-6 text-center shadow-[0_24px_50px_rgba(0,0,0,0.25)] backdrop-blur-md"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {/* Warning Icon Banner */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600 shadow-inner">
          <AlertTriangle size={32} className="animate-pulse" />
        </div>

        {/* Title */}
        <h3 
          className="text-xl font-black text-[#813405] mb-3"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Replace Cart Items?
        </h3>

        {/* Description */}
        <p className="text-slate-500 text-sm leading-relaxed mb-6 text-left sm:text-center">
          Your cart contains dishes from <span className="font-extrabold text-[#D45113]">"{existingRestaurant}"</span>. 
          Do you want to discard these items and start a new cart with <span className="font-extrabold text-[#D45113]">"{newRestaurant}"</span>?
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border-2 border-slate-100 bg-transparent py-3 text-xs font-black uppercase tracking-wider text-slate-500 hover:border-slate-300 hover:bg-slate-50 active:scale-97 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 py-3 text-xs font-black uppercase tracking-wider text-white hover:opacity-95 shadow-lg shadow-orange-600/20 active:scale-97 transition-all"
          >
            Discard & Add
          </button>
        </div>
      </motion.div>
    </div>
  );
}
