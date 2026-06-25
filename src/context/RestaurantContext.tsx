import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { type Restaurant, type FoodItem } from "@/utils/data/mock";
import { apiRequest } from "@/utils/api";
import rest1 from "@/assets/rest-1.jpg";

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
  bgGradient?: string;
  emoji?: string;
  menuItemId?: string;
  categoryId?: string;
  type:
    | "PERCENTAGE_DISCOUNT"
    | "FIXED_AMOUNT_DISCOUNT"
    | "FREE_DELIVERY"
    | "BUY_ONE_GET_ONE"
    | "COMBO_DEAL"
    | "DISCOUNT"
    | "ITEM_DISCOUNT"
    | "FIRST_ORDER_DISCOUNT"
    | "FESTIVAL_OFFER"
    | "HAPPY_HOUR"
    | "WEEKEND_OFFER"
    | "MINIMUM_ORDER";
  bannerImage?: string;
  // Future scalability / Optional premium features:
  targetCustomer?: "All" | "FirstOrder";
  channel?: "All" | "Delivery" | "Pickup";
  minOrderAmount?: number;
  metadata?: any;
}



type RestaurantContextType = {
  restaurants: Restaurant[];
  filteredRestaurants: Restaurant[];
  loading: boolean;
  filteredLoading: boolean;
  error: string | null;
  refetch: (searchQueryString?: string) => Promise<void>;
  fetchFiltered: (filters?: any) => Promise<void>;
  findRestaurant: (id: string) => Restaurant | undefined;
  findFoodItem: (foodId: string, restaurantId?: string) => { food: FoodItem; restaurant: Restaurant } | null;
  offers: Offer[];
  setOffers: React.Dispatch<React.SetStateAction<Offer[]>>;
  updateRestaurantMenu: (restaurantId: string, newMenu: FoodItem[]) => void;
  updateRestaurantProfile: (restaurantId: string, profileFields: Partial<Restaurant>) => void;
};

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const mergeRestaurantDefaults = (saved: Restaurant[]): Restaurant[] => {
  return saved;
};

const mapDbRestaurantToFrontend = (dbRest: any): Restaurant => {
  let category = dbRest.cuisineTypes?.[0] || "Srilankan Foods";
  if (category === "SRILANKAN") category = "Rice and Curry";
  else if (typeof category === "string" && category.toUpperCase() === "SOUTH_INDIAN") category = "South Indian";
  else if (typeof category === "string") {
    category = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase().replace("_", " ");
  }

  let categoriesList: string[] = [];
  if (dbRest.categories && Array.isArray(dbRest.categories)) {
    categoriesList = dbRest.categories.map((c: any) => c.name);
  } else {
    let fallbackList = ["Kottu", "Rice and Curry", "Fried Rice", "Briyani", "Mojito", "Soft Drinks"];
    if (dbRest.cuisineTypes && dbRest.cuisineTypes.length > 0) {
      const mapped = dbRest.cuisineTypes.map((c: string) => {
        if (c === "SRILANKAN") return "Rice and Curry";
        return c.charAt(0) + c.slice(1).toLowerCase().replace("_", " ");
      });
      fallbackList = Array.from(new Set([...mapped, ...fallbackList]));
    }
    categoriesList = fallbackList;
  }

  const image = dbRest.coverImage || rest1;

  return {
    id: dbRest.id,
    name: dbRest.name,
    image,
    rating: dbRest.rating ?? 4.0,
    deliveryTime: dbRest.deliveryTime || "20-30 min",
    category,
    location: dbRest.location || (dbRest.streetAddress ? `${dbRest.streetAddress}, ${dbRest.city}` : "") || "Trincomalee",
    hasOffer: dbRest.featuredRestaurant || false,
    offerText: dbRest.featuredRestaurant ? "Featured" : undefined,
    openingTime: dbRest.openingTime || "08:00 AM",
    closingTime: dbRest.closingTime || "10:00 PM",
    deliveryRadius: dbRest.deliveryRadius ?? 5,
    deliveryAvailable: dbRest.deliveryAvailable ?? true,
    deliveryFee: dbRest.deliveryFee ?? 150,
    categories: categoriesList,
    menu: (dbRest.menuItems && dbRest.menuItems.length > 0)
      ? dbRest.menuItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          description: item.description,
          popular: item.tags?.includes("Bestseller") || false,
          category: item.category?.name || item.categoryName || "Uncategorized",
          categoryId: item.categoryId || null,
          stock: item.stock ?? 0,
          isAvailable: item.isAvailable ?? true,
          tags: item.tags || [],
          variants: item.variants || [],
          addons: item.addons || [],
          timeAvailability: item.timeAvailability || "All Day",
          ordersCount: item.ordersCount ?? 0
        }))
      : [],

    tagline: dbRest.tagline || undefined,
    description: dbRest.description || undefined,
    phone: dbRest.phone || undefined,
    whatsapp: dbRest.whatsapp || undefined,
    email: dbRest.email || undefined,
    streetAddress: dbRest.streetAddress || undefined,
    city: dbRest.city || undefined,
    logoImage: dbRest.logoImage || undefined,
    coverImage: dbRest.coverImage || undefined,
    minOrder: dbRest.minOrder,
    freeDeliveryThreshold: dbRest.freeDeliveryThreshold ?? 0,
    halalFriendly: dbRest.halalFriendly ?? false,
    vegetarianFriendly: dbRest.vegetarianFriendly ?? false,
    dineIn: dbRest.dineIn ?? false,
    takeaway: dbRest.takeaway ?? false,
    delivery: dbRest.delivery ?? true,
    facebook: dbRest.facebook || undefined,
    instagram: dbRest.instagram || undefined,
    tiktok: dbRest.tiktok || undefined,
    youtube: dbRest.youtube || undefined,
    website: dbRest.website || undefined,
    reviewsCount: dbRest.reviewsCount,
    weeklyHours: dbRest.weeklyHours,
    holidayMode: dbRest.holidayMode ?? false,
    temporaryClosure: dbRest.temporaryClosure ?? false,
    acceptOrders: dbRest.acceptOrders ?? true,
    showPublicly: dbRest.showPublicly ?? true,
    vacationMode: dbRest.vacationMode ?? false,
    cashOnDelivery: dbRest.cashOnDelivery ?? true,
  };
};

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filteredLoading, setFilteredLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);

  const fetchRestaurants = useCallback(async (searchQueryString?: string) => {
    setLoading(true);
    try {
      const response = await apiRequest<{
        message: string;
        count: number;
        restaurants: any[];
      }>("/restaurant/public");

      let dbList = (response && response.restaurants && Array.isArray(response.restaurants))
        ? response.restaurants
        : [];

      // Fetch private restaurant profile if logged in
      const privateToken = localStorage.getItem("trinco_restaurant_token");
      if (privateToken) {
        try {
          const privRes = await apiRequest<{
            message: string;
            restaurant: any;
          }>("/restaurant/profile", {
            method: "GET",
            token: privateToken,
          });
          if (privRes && privRes.restaurant) {
            const exists = dbList.some((r) => r.id === privRes.restaurant.id);
            if (!exists) {
              dbList.push(privRes.restaurant);
            } else {
              // Replace with latest private data (which includes detailed address/description before it is public)
              dbList = dbList.map((r) => r.id === privRes.restaurant.id ? privRes.restaurant : r);
            }
          }
        } catch (e) {
          console.error("Failed to fetch private restaurant profile:", e);
        }
      }

      const mappedList = dbList.map((dbRest: any) => mapDbRestaurantToFrontend(dbRest));

      setRestaurants(mappedList);
      if (searchQueryString) {
        const query = searchQueryString.toLowerCase();
        setFilteredRestaurants(mappedList.filter(r => r.name.toLowerCase().includes(query)));
      } else {
        setFilteredRestaurants(mappedList);
      }
      setLoading(false);
      return;
    } catch (err) {
      console.error("Failed to fetch restaurants from backend", err);
      setRestaurants([]);
      setFilteredRestaurants([]);
      setLoading(false);
    }
  }, []);

  const fetchFiltered = useCallback(async (filters?: any) => {
    setFilteredLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== "") {
            queryParams.append(key, String(val));
          }
        });
      }
      const queryString = queryParams.toString();
      const response = await apiRequest<{
        message: string;
        count: number;
        restaurants: any[];
      }>(`/restaurant/public${queryString ? `?${queryString}` : ""}`);

      const dbList = (response && response.restaurants && Array.isArray(response.restaurants))
        ? response.restaurants
        : [];
      
      const mappedList = dbList.map((dbRest: any) => mapDbRestaurantToFrontend(dbRest));
      setFilteredRestaurants(mappedList);
    } catch (err) {
      console.error("Failed to fetch filtered restaurants:", err);
    } finally {
      setFilteredLoading(false);
    }
  }, []);

  const fetchOffers = useCallback(async () => {
    try {
      const data = await apiRequest<Offer[]>("/offer/public");
      if (data && Array.isArray(data)) {
        setOffers(data);
      }
    } catch (err) {
      console.error("Failed to fetch public offers:", err);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
    fetchOffers();
  }, [fetchRestaurants, fetchOffers]);



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
    const updateList = (prevList: Restaurant[]) =>
      prevList.map((r) => {
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
    setRestaurants((prev) => updateList(prev));
    setFilteredRestaurants((prev) => updateList(prev));
  }, []);

  const updateRestaurantProfile = useCallback((restaurantId: string, profileFields: Partial<Restaurant>) => {
    const updateList = (prevList: Restaurant[]) =>
      prevList.map((r) => {
        if (r.id === restaurantId) {
          return { ...r, ...profileFields };
        }
        return r;
      });
    setRestaurants((prev) => updateList(prev));
    setFilteredRestaurants((prev) => updateList(prev));
  }, []);

  const refetch = useCallback(async (searchQueryString?: string) => {
    await fetchRestaurants(searchQueryString);
    await fetchOffers();
  }, [fetchRestaurants, fetchOffers]);

  return (
    <RestaurantContext.Provider
      value={{
        restaurants,
        filteredRestaurants,
        loading,
        filteredLoading,
        error,
        refetch,
        fetchFiltered,
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
