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
  }
];

type RestaurantContextType = {
  restaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  refetch: (searchQueryString?: string) => Promise<void>;
  findRestaurant: (id: string) => Restaurant | undefined;
  findFoodItem: (foodId: string) => { food: FoodItem; restaurant: Restaurant } | null;
  offers: Offer[];
  setOffers: React.Dispatch<React.SetStateAction<Offer[]>>;
};

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>(initialOffers);

  const fetchRestaurants = useCallback(async (searchQueryString?: string) => {
    setLoading(true);
    // Simulate network delay for realistic mock
    setTimeout(() => {
      if (searchQueryString) {
        const query = searchQueryString.toLowerCase();
        setRestaurants(mockRestaurants.filter(r => r.name.toLowerCase().includes(query)));
      } else {
        setRestaurants(mockRestaurants);
      }
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const findRestaurant = useCallback((id: string) => {
    return restaurants.find((r) => r.id === id);
  }, [restaurants]);

  const findFoodItem = useCallback((foodId: string) => {
    for (const r of restaurants) {
      const item = r.menu.find((f) => f.id === foodId);
      if (item) return { food: item, restaurant: r };
    }
    return null;
  }, [restaurants]);

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
        setOffers
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
