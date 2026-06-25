

// Category images
import riceandCurry from "@/assets/rice and curry.png";
import catKoththu from "@/assets/kottu.png";
import catFriedRice from "@/assets/fried rice.png";
import catSeafood from "@/assets/seafood.png";
import catBriyani from "@/assets/Briyani.png";
import catBurger from "@/assets/burgur.png";
import catPizza from "@/assets/Pizza.png";
import catSoftDrinks from "@/assets/soft drink.png";
import catJuice from "@/assets/Juice.png";
import catMojito from "@/assets/Mojito.png";
import catMilkshake from "@/assets/Milkshake.png";
import catDesserts from "@/assets/Desserts.png";
import catChinese from "@/assets/chinesefood.jpg";
import catNoodels from "@/assets/noodles.png";



export type FoodItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  popular?: boolean;
  discount?: string;
  category: string;
  categoryId?: string;
  timeAvailability?: string;
  variants?: { name: string; price: number }[];
};

export type Restaurant = {
  id: string;
  name: string;
  image: string;
  rating: number;
  deliveryTime: string;
  category: string;
  location: string;
  hasOffer: boolean;
  offerText?: string;
  openingTime: string; // e.g. "09:00 AM"
  closingTime: string; // e.g. "11:00 PM"
  deliveryRadius: number; // in km
  deliveryAvailable: boolean;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
  categories: string[];
  menu: FoodItem[];

  // ── Profile fields (editable from restaurant dashboard) ──
  tagline?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  streetAddress?: string;
  city?: string;
  logoImage?: string;
  coverImage?: string;
  minOrder?: number;
  halalFriendly?: boolean;
  vegetarianFriendly?: boolean;
  dineIn?: boolean;
  takeaway?: boolean;
  delivery?: boolean;
  // Social links
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
  reviewsCount?: number;
  weeklyHours?: any;
  holidayMode?: boolean;
  temporaryClosure?: boolean;
  acceptOrders?: boolean;
  showPublicly?: boolean;
  vacationMode?: boolean;
  cashOnDelivery?: boolean;
};

export type Category = { name: string; image: string };

export const categories: Category[] = [
  { name: "Kottu", image: catKoththu },
  { name: "Noodles", image: catNoodels },
  { name: "Fried Rice", image: catFriedRice },
  { name: "Seafood", image: catSeafood },
  { name: "Briyani", image: catBriyani },
  { name: "Burgers", image: catBurger },
  { name: "Pizza", image: catPizza },
  { name: "Soft Drinks", image: catSoftDrinks },
  { name: "Juice", image: catJuice },
  { name: "Mojito", image: catMojito },
  { name: "Milkshake", image: catMilkshake },
  { name: "Desserts", image: catDesserts },
  { name: "Rice and Curry", image: riceandCurry },
];


export const restaurants: Restaurant[] = [];

export const findRestaurant = (id: string) => restaurants.find((r) => r.id === id);

export const findFoodItem = (foodId: string) => {
  for (const r of restaurants) {
    const item = r.menu.find((f) => f.id === foodId);
    if (item) return { food: item, restaurant: r };
  }
  return null;
};
