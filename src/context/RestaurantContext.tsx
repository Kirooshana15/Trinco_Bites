import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { type Restaurant, type FoodItem, restaurants as mockRestaurants } from "@/utils/data/mock";
import offer1 from "@/assets/offer1.jpg";
import offer2 from "@/assets/offer2.png";

export interface Offer {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  discountBadge: string;
  activeDays: string[];
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  timeLabel?: string;
  status: "Active" | "Scheduled" | "Expired" | "Draft";
  bgGradient: string;
  emoji: string;
  type: "Discount" | "Combo" | "Promo";
  bannerImage?: string;
  // Future scalability / Optional premium features:
  targetCustomer?: "All" | "FirstOrder";
  channel?: "All" | "Delivery" | "Pickup";
  minOrderAmount?: number;
}

const initialOffers: Offer[] = [
  {
    id: "O-201",
    restaurantId: "trinco-spice",
    title: "20% OFF Burgers",
    description: "Apply automatic 20% discount on gourmet flame-grilled burgers",
    discountBadge: "20% OFF",
    activeDays: ["Fri", "Sat", "Sun"],
    startDate: "2026-05-28",
    endDate: "2026-06-15",
    startTime: "05:00 PM",
    endTime: "10:00 PM",
    timeLabel: "Evening Deal",
    status: "Active",
    bgGradient: "from-amber-500/10 to-orange-500/15 border-orange-500/25",
    emoji: "🍔",
    type: "Discount",
    bannerImage: offer1,
    targetCustomer: "All",
    channel: "All",
    minOrderAmount: 0
  },
  {
    id: "O-202",
    restaurantId: "trinco-spice",
    title: "Weekend Family Combo",
    description: "Buy 2 large Pizzas and get a 1L Coke bottle completely free",
    discountBadge: "Free Coke",
    activeDays: ["Fri", "Sat", "Sun"],
    startDate: "2026-05-28",
    endDate: "2026-06-30",
    startTime: "05:00 PM",
    endTime: "10:00 PM",
    timeLabel: "Weekend Combo",
    status: "Active",
    bgGradient: "from-rose-500/10 to-purple-500/15 border-rose-500/25",
    emoji: "🍕",
    type: "Combo",
    bannerImage: offer2,
    targetCustomer: "All",
    channel: "All",
    minOrderAmount: 1500
  },
  {
    id: "O-203",
    restaurantId: "trinco-spice",
    title: "Lunch Time Deal",
    description: "Complimentary authentic fresh mojito with any premium Biryani purchase",
    discountBadge: "Free Drink",
    activeDays: ["Mon", "Tue", "Wed", "Thu"],
    startDate: "2026-06-01",
    endDate: "2026-06-20",
    startTime: "11:30 AM",
    endTime: "02:00 PM",
    timeLabel: "Lunch Special",
    status: "Scheduled",
    bgGradient: "from-blue-500/10 to-indigo-500/15 border-blue-500/25",
    emoji: "🥤",
    type: "Promo",
    bannerImage: offer1,
    targetCustomer: "All",
    channel: "All",
    minOrderAmount: 0
  },
  {
    id: "O-204",
    restaurantId: "burger-co",
    title: "50% OFF Burgers",
    description: "Apply automatic 50% discount on Trinco's juiciest burgers today.",
    discountBadge: "50% OFF",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    startDate: "2026-05-28",
    endDate: "2026-06-30",
    startTime: "08:00 AM",
    endTime: "11:30 PM",
    timeLabel: "All Day Deal",
    status: "Active",
    bgGradient: "from-amber-500/10 to-orange-500/15 border-orange-500/25",
    emoji: "🍔",
    type: "Discount",
    bannerImage: offer1,
    targetCustomer: "All",
    channel: "All",
    minOrderAmount: 0
  },
  {
    id: "O-205",
    restaurantId: "burger-co",
    title: "Buy 1 Get 1 Pizza",
    description: "Order any pizza and get a second one absolutely free today.",
    discountBadge: "BOGO Pizza",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    startDate: "2026-05-28",
    endDate: "2026-06-30",
    startTime: "08:00 AM",
    endTime: "11:30 PM",
    timeLabel: "Pizza Special",
    status: "Active",
    bgGradient: "from-rose-500/10 to-purple-500/15 border-rose-500/25",
    emoji: "🍕",
    type: "Combo",
    bannerImage: offer2,
    targetCustomer: "All",
    channel: "All",
    minOrderAmount: 1200
  },
  {
    id: "O-301",
    restaurantId: "ocean-pearl",
    title: "Seafood Feast Combo",
    description: "Save on a coastal combo with grilled seafood, rice, and a refreshing drink.",
    discountBadge: "20% OFF",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    startDate: "2026-05-28",
    endDate: "2026-12-31",
    startTime: "07:00 AM",
    endTime: "09:00 PM",
    timeLabel: "All Day Seafood",
    status: "Active",
    bgGradient: "from-blue-500/10 to-cyan-500/15 border-blue-500/25",
    emoji: "🐟",
    type: "Combo",
    bannerImage: offer1,
    targetCustomer: "All",
    channel: "All",
    minOrderAmount: 1500
  },
  {
    id: "O-302",
    restaurantId: "ocean-pearl",
    title: "Grilled Fish Special",
    description: "Enjoy a limited Ocean Pearl discount on signature grilled fish orders.",
    discountBadge: "15% OFF",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    startDate: "2026-05-28",
    endDate: "2026-12-31",
    startTime: "11:00 AM",
    endTime: "09:00 PM",
    timeLabel: "Lunch & Dinner",
    status: "Active",
    bgGradient: "from-emerald-500/10 to-teal-500/15 border-emerald-500/25",
    emoji: "🍽️",
    type: "Discount",
    bannerImage: offer2,
    targetCustomer: "All",
    channel: "All",
    minOrderAmount: 1200
  },
  {
    id: "O-303",
    restaurantId: "ocean-pearl",
    title: "Beachside Family Pack",
    description: "A family-sized seafood deal with sides for group orders from Ocean Pearl.",
    discountBadge: "Free Drink",
    activeDays: ["Fri", "Sat", "Sun"],
    startDate: "2026-05-28",
    endDate: "2026-12-31",
    startTime: "12:00 PM",
    endTime: "09:00 PM",
    timeLabel: "Weekend Pack",
    status: "Active",
    bgGradient: "from-amber-500/10 to-orange-500/15 border-orange-500/25",
    emoji: "🌊",
    type: "Promo",
    bannerImage: offer1,
    targetCustomer: "All",
    channel: "All",
    minOrderAmount: 2500
  },
  {
    id: "O-304",
    restaurantId: "ocean-pearl",
    title: "Uppuveli Pickup Deal",
    description: "Pickup customers get a seafood discount on selected Ocean Pearl favourites.",
    discountBadge: "10% OFF",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    startDate: "2026-05-28",
    endDate: "2026-12-31",
    startTime: "07:00 AM",
    endTime: "09:00 PM",
    timeLabel: "Pickup Saver",
    status: "Active",
    bgGradient: "from-rose-500/10 to-purple-500/15 border-rose-500/25",
    emoji: "🎁",
    type: "Discount",
    bannerImage: offer2,
    targetCustomer: "All",
    channel: "Pickup",
    minOrderAmount: 1000
  }
];

const sanitizeOffers = (offers: Offer[]): Offer[] => {
  const emojiMap: Record<string, string> = {
    "ðŸ Ÿ": "🐟",
    "ðŸ ½ï¸ ": "🍽️",
    "ðŸŒŠ": "🌊",
    "ðŸŽ ": "🎁",
    "ðŸŽ": "🎁"
  };
  return offers.map((offer) => ({
    ...offer,
    emoji: emojiMap[offer.emoji] || offer.emoji,
  }));
};

const mergeInitialOffers = (savedOffers: Offer[]) => {
  const sanitizedSaved = sanitizeOffers(savedOffers);
  const savedIds = new Set(sanitizedSaved.map((offer) => offer.id));
  const missingInitialOffers = initialOffers.filter((offer) => !savedIds.has(offer.id));
  return [...sanitizedSaved, ...missingInitialOffers];
};

type RestaurantContextType = {
  restaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  refetch: (searchQueryString?: string) => Promise<void>;
  findRestaurant: (id: string) => Restaurant | undefined;
  findFoodItem: (foodId: string, restaurantId?: string) => { food: FoodItem; restaurant: Restaurant } | null;
  offers: Offer[];
  setOffers: React.Dispatch<React.SetStateAction<Offer[]>>;
  updateRestaurantMenu: (restaurantId: string, newMenu: FoodItem[]) => void;
  updateRestaurantProfile: (restaurantId: string, profileFields: Partial<Restaurant>) => void;
};

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const mergeRestaurantDefaults = (saved: Restaurant[]): Restaurant[] => {
  return saved.map((r) => {
    const initial = mockRestaurants.find((m) => m.id === r.id);
    if (!initial) return r;
    return {
      ...r,
      tagline: r.tagline || initial.tagline,
      description: r.description || initial.description,
      phone: r.phone || initial.phone,
      whatsapp: r.whatsapp || initial.whatsapp,
      email: r.email || initial.email,
      website: r.website || initial.website,
      facebook: r.facebook || initial.facebook,
      instagram: r.instagram || initial.instagram,
      tiktok: r.tiktok || initial.tiktok,
      youtube: r.youtube || initial.youtube,
      logoImage: r.logoImage || initial.logoImage,
      coverImage: r.coverImage || initial.coverImage,
      reviewsCount: r.reviewsCount || initial.reviewsCount,
    };
  });
};

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    const saved = localStorage.getItem("trinco_restaurants");
    return saved ? mergeRestaurantDefaults(JSON.parse(saved)) : mockRestaurants;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>(() => {
    const saved = localStorage.getItem("trinco_offers");
    if (saved && (saved.includes("ðŸ") || saved.includes("ð") || saved.includes("ï¸"))) {
      localStorage.removeItem("trinco_offers");
      return initialOffers;
    }
    return saved ? mergeInitialOffers(JSON.parse(saved)) : initialOffers;
  });

  const fetchRestaurants = useCallback(async (searchQueryString?: string) => {
    setLoading(true);
    // Simulate network delay for realistic mock
    setTimeout(() => {
      const saved = localStorage.getItem("trinco_restaurants");
      const fullList: Restaurant[] = saved ? mergeRestaurantDefaults(JSON.parse(saved)) : mockRestaurants;

      // Update/initialize localStorage with the merged list
      localStorage.setItem("trinco_restaurants", JSON.stringify(fullList));

      if (searchQueryString) {
        const query = searchQueryString.toLowerCase();
        setRestaurants(fullList.filter(r => r.name.toLowerCase().includes(query)));
      } else {
        setRestaurants(fullList);
      }
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Persist offers when updated
  useEffect(() => {
    localStorage.setItem("trinco_offers", JSON.stringify(offers));
  }, [offers]);

  // Sync state between tabs in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "trinco_restaurants" && e.newValue) {
        setRestaurants(JSON.parse(e.newValue));
      }
      if (e.key === "trinco_offers" && e.newValue) {
        setOffers(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const findRestaurant = useCallback((id: string) => {
    return restaurants.find((r) => r.id === id);
  }, [restaurants]);

  const findFoodItem = useCallback((foodId: string, restaurantId?: string) => {
    if (restaurantId) {
      const r = restaurants.find((res) => res.id === restaurantId);
      if (r) {
        const item = r.menu.find((f) => f.id === foodId);
        if (item && (item as any).isAvailable !== false && (item as any).stock !== 0) {
          return { food: item, restaurant: r };
        }
      }
      return null;
    }
    for (const r of restaurants) {
      const item = r.menu.find((f) => f.id === foodId);
      if (item && (item as any).isAvailable !== false && (item as any).stock !== 0) {
        return { food: item, restaurant: r };
      }
    }
    return null;
  }, [restaurants]);

  const updateRestaurantMenu = useCallback((restaurantId: string, newMenu: FoodItem[]) => {
    const saved = localStorage.getItem("trinco_restaurants");
    const fullList: Restaurant[] = saved ? JSON.parse(saved) : mockRestaurants;

    const updatedList = fullList.map((r) => {
      if (r.id === restaurantId) {
        const newCategories = Array.from(new Set(newMenu.map((item) => item.category)));
        return {
          ...r,
          categories: newCategories.length > 0 ? newCategories : r.categories,
          menu: newMenu,
        };
      }
      return r;
    });

    localStorage.setItem("trinco_restaurants", JSON.stringify(updatedList));
    setRestaurants(updatedList);
  }, []);

  const updateRestaurantProfile = useCallback((restaurantId: string, profileFields: Partial<Restaurant>) => {
    const saved = localStorage.getItem("trinco_restaurants");
    const fullList: Restaurant[] = saved ? JSON.parse(saved) : mockRestaurants;

    const updatedList = fullList.map((r) => {
      if (r.id === restaurantId) {
        return { ...r, ...profileFields };
      }
      return r;
    });

    localStorage.setItem("trinco_restaurants", JSON.stringify(updatedList));
    setRestaurants(updatedList);
  }, []);

  return (
    <RestaurantContext.Provider
      value={{
        restaurants,
        loading,
        error,
        refetch: fetchRestaurants,
        findRestaurant,
        findFoodItem,
        offers,
        setOffers,
        updateRestaurantMenu,
        updateRestaurantProfile
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurants() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error("useRestaurants must be used within a RestaurantProvider");
  }
  return context;
}
