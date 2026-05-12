import rest1 from "@/utils/assets/rest-1.jpg";
import rest2 from "@/utils/assets/rest-2.jpg";
import rest3 from "@/utils/assets/rest-3.jpg";
import rest4 from "@/utils/assets/rest-4.jpg";
import food1 from "@/utils/assets/food-1.jpg";
import food2 from "@/utils/assets/food-2.jpg";
import food3 from "@/utils/assets/food-3.jpg";
import food4 from "@/utils/assets/food-4.jpg";
import food5 from "@/utils/assets/food-5.jpg";

// Category images
import catAll from "@/utils/assets/srilankan food.jpg";
import catKoththu from "@/utils/assets/Koththu.jpg";
import catSrilankan from "@/utils/assets/srilankan food.jpg";
import catFriedRice from "@/utils/assets/Friedrice.jpg";
import catNasi from "@/utils/assets/Nasi.jpg";
import catSeafood from "@/utils/assets/seafood.png";
import catBriyani from "@/utils/assets/briyani.jpg";
import catBurger from "@/utils/assets/burgar.jpg";
import catPizza from "@/utils/assets/pizza.avif";
import catSoftDrinks from "@/utils/assets/softdrink.jpg";
import catJuice from "@/utils/assets/juice.jpg";
import catMojito from "@/utils/assets/mojito.jpg";
import catMilkshake from "@/utils/assets/milkshake.jpg";
import catDesserts from "@/utils/assets/dessert.jpg";
import catChinese from "@/utils/assets/chinesefood.jpg";

// Variety Images - Fried Rice
import frChicken from "@/utils/assets/chickenfriedrice.jpg";
import frBeef from "@/utils/assets/beeffriedrice.jpg";
import frEgg from "@/utils/assets/eggfriedrice.jpg";
import frPrawn from "@/utils/assets/prawnfriedrice.jpg";
import frSausage from "@/utils/assets/sausagefriedrice.jpg";
import frSeafood from "@/utils/assets/seafoodfriedrice.jpg";
import frVeg from "@/utils/assets/vegfriedrice.jpg";

// Variety Images - Biryani
import brChicken from "@/utils/assets/chicked- briyani.jpg";
import brBeef from "@/utils/assets/beef-briyani.jpg";
import brEgg from "@/utils/assets/egg-briyani.jpg";
import brPaneer from "@/utils/assets/panner briyani.jpg";
import brPrawn from "@/utils/assets/prawn briyani.jpg";

// Variety Images - Mojito
import mjLime from "@/utils/assets/LimeMojoto.jpg";
import mjPassion from "@/utils/assets/PassionMojito.jpg";
import mjPine from "@/utils/assets/PineappleMojito.jpg";
import mjWater from "@/utils/assets/WatermelonMojito.jpg";
import mjApple from "@/utils/assets/appleMojito.jpg";
 
// Variety Images - Koththu
import ktChicken from "@/utils/assets/Kottu-Chicken.jpg";
import ktEgg from "@/utils/assets/kottu-Egg.jpg";
import ktMutton from "@/utils/assets/kottu-Mutton.jpg";
import ktVeg from "@/utils/assets/kottu-Veg.jpg";
import ktSeafood from "@/utils/assets/Koththu.jpg";



export type FoodItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  rating: number;
  popular?: boolean;
  discount?: string;
  category: string;
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
  categories: string[];
  menu: FoodItem[];
};

export type Category = { name: string; image: string };

export const categories: Category[] = [
  { name: "Kottu", image: catKoththu },
  { name: "Noodles", image: catChinese },
  { name: "Srilankan Foods", image: catSrilankan },
  { name: "Fried Rice", image: catFriedRice },
  { name: "Nasi Goreng", image: catNasi },
  { name: "Seafood", image: catSeafood },
  { name: "Briyani", image: catBriyani },
  { name: "Chinese rice", image: catChinese },
  { name: "Burgers", image: catBurger },
  { name: "Pizza", image: catPizza },
  { name: "Soft Drinks", image: catSoftDrinks },
  { name: "Juice", image: catJuice },
  { name: "Mojito", image: catMojito },
  { name: "Milkshake", image: catMilkshake },
  { name: "Dessets", image: catDesserts },
  { name: "Omlete", image: catAll },
];

const sharedMenu: FoodItem[] = [
  { id: "sh-fr1", name: "Chicken Fried Rice", price: 900, image: frChicken, description: "Classic wok-fried rice with tender chicken.", rating: 3.2, category: "Fried Rice" },
  { id: "sh-fr2", name: "Beef Fried Rice", price: 1150, image: frBeef, description: "Savory beef strips with fried rice.", rating: 4.1, category: "Fried Rice" },
  { id: "sh-fr3", name: "Egg Fried Rice", price: 750, image: frEgg, description: "Simple and delicious egg fried rice.", rating: 2.8, category: "Fried Rice" },
  { id: "sh-fr4", name: "Prawn Fried Rice", price: 1350, image: frPrawn, description: "Fresh prawns with aromatic fried rice.", rating: 4.9, popular: true, category: "Fried Rice" },
  { id: "sh-fr5", name: "Seafood Fried Rice", price: 1200, image: frSeafood, description: "Wok-tossed rice with fresh catch.", rating: 3.5, category: "Fried Rice" },
  { id: "sh-fr6", name: "Veg Fried Rice", price: 700, image: frVeg, description: "Fresh garden vegetables with rice.", rating: 4.4, category: "Fried Rice" },
  { id: "sh-br1", name: "Chicken Biryani", price: 1050, image: brChicken, description: "Slow-cooked basmati with tender chicken.", rating: 4.8, popular: true, category: "Briyani" },
  { id: "sh-br2", name: "Beef Biryani", price: 1250, image: brBeef, description: "Rich and spicy beef biryani.", rating: 4.7, category: "Briyani" },
  { id: "sh-br3", name: "Egg Biryani", price: 850, image: brEgg, description: "Fragrant basmati with egg.", rating: 4.4, category: "Briyani" },
  { id: "sh-br4", name: "Prawn Biryani", price: 1450, image: brPrawn, description: "Trinco special prawn biryani.", rating: 4.9, popular: true, category: "Briyani" },
  { id: "sh-br5", name: "Paneer Biryani", price: 1150, image: brPaneer, description: "Mild and creamy paneer biryani.", rating: 4.6, category: "Briyani" },
  { id: "sh-mj1", name: "Lime Mojito", price: 450, image: mjLime, description: "Refreshing lime and mint cooler.", rating: 4.8, category: "Mojito" },
  { id: "sh-mj2", name: "Passion Mojito", price: 550, image: mjPassion, description: "Tropical passion fruit mojito.", rating: 4.7, category: "Mojito" },
  { id: "sh-mj3", name: "Pineapple Mojito", price: 550, image: mjPine, description: "Sweet and tangy pineapple mojito.", rating: 4.8, category: "Mojito" },
  { id: "sh-mj4", name: "Watermelon Mojito", price: 500, image: mjWater, description: "Cooling watermelon and mint.", rating: 4.6, category: "Mojito" },
  { id: "sh-mj5", name: "Apple Mojito", price: 480, image: mjApple, description: "Crisp apple flavored mojito.", rating: 4.5, category: "Mojito" },
  
  // Koththu Varieties
  { id: "sh-kt1", name: "Chicken Kottu", price: 850, image: ktChicken, description: "Shredded godamba roti stir-fried with chicken & spices.", rating: 4.8, popular: true, category: "Kottu" },
  { id: "sh-kt2", name: "Egg Kottu", price: 750, image: ktEgg, description: "Classic egg kottu with spicy gravy.", rating: 4.7, category: "Kottu" },
  { id: "sh-kt3", name: "Mutton Kottu", price: 1250, image: ktMutton, description: "Succulent mutton pieces tossed with roti.", rating: 4.9, popular: true, category: "Kottu" },
  { id: "sh-kt4", name: "Veg Kottu", price: 650, image: ktVeg, description: "Fresh garden vegetables and roti.", rating: 4.5, category: "Kottu" },
  { id: "sh-kt5", name: "Seafood Kottu", price: 1100, image: ktSeafood, description: "Mixed seafood with godamba roti.", rating: 4.9, category: "Kottu" },
];

const commonCategories = ["Fried Rice", "Briyani", "Mojito", "Soft Drinks", "Milkshake", "Juice"];

export const restaurants: Restaurant[] = [
  {
    id: "trinco-spice",
    name: "Trinco Spice House",
    image: rest1,
    rating: 3.8,
    deliveryTime: "20-30 min",
    category: "Srilankan Foods",
    location: "Dockyard Rd, Trincomalee",
    hasOffer: true,
    offerText: "20% OFF",
    openingTime: "08:00 AM",
    closingTime: "10:00 PM",
    deliveryRadius: 8,
    categories: ["Kottu", "Srilankan Foods", "Seafood", ...commonCategories],
    menu: [
      { id: "f2", name: "Fish Curry & Rice", price: 950, image: food3, description: "Fresh catch in a fragrant Trinco-style curry.", rating: 4.7, category: "Srilankan Foods" },
      ...sharedMenu,
    ],
  },
  {
    id: "ocean-pearl",
    name: "Ocean Pearl Seafood",
    image: rest2,
    rating: 4.9,
    deliveryTime: "25-35 min",
    category: "Seafood",
    location: "Uppuveli Beach, Trincomalee",
    hasOffer: false,
    openingTime: "07:00 AM",
    closingTime: "09:00 PM",
    deliveryRadius: 10,
    deliveryAvailable: true,
    deliveryFee: 150,
    categories: ["Srilankan Foods", "Noodles", "Kottu", "Omlete", "Juice", ...commonCategories],
    menu: [
      { id: "f3", name: "Grilled Seer Fish", price: 1450, image: food3, description: "Charcoal grilled with lemon butter.", rating: 4.9, popular: true, category: "Seafood" },
      ...sharedMenu,
    ],
  },
  {
    id: "biryani-palace",
    name: "Biryani Palace",
    image: rest3,
    rating: 4.1,
    deliveryTime: "30-40 min",
    category: "Briyani",
    location: "Main St, Trincomalee",
    hasOffer: true,
    offerText: "Free Delivery",
    openingTime: "08:00 AM",
    closingTime: "11:00 PM",
    deliveryRadius: 12,
    deliveryAvailable: true,
    deliveryFee: 250,
    categories: ["Briyani", "Kottu", "Fried Rice", "Seafood", "Soft Drinks", ...commonCategories],
    menu: [
      { id: "f5", name: "Chicken Biryani", price: 1050, image: brChicken, description: "Slow-cooked basmati with tender chicken.", rating: 4.8, popular: true, category: "Briyani" },
      { id: "f6", name: "Mutton Biryani", price: 1350, image: food2, description: "Aromatic spices and succulent mutton.", rating: 4.9, category: "Briyani" },
      ...sharedMenu,
    ],
  },
  {
    id: "burger-co",
    name: "Trinco Burger Co.",
    image: rest4,
    rating: 2.5,
    deliveryTime: "15-25 min",
    category: "Burgers",
    location: "Inner Harbour Rd",
    hasOffer: true,
    offerText: "Buy 1 Get 1",
    openingTime: "09:00 AM",
    closingTime: "11:30 PM",
    deliveryRadius: 8,
    deliveryAvailable: false,
    deliveryFee: 0,
    categories: ["Fried Rice", "Nasi Goreng", "Noodles", "Chinese Rice", "Juice", ...commonCategories],
    menu: [
      { id: "f7", name: "Double Cheeseburger", price: 1250, image: food4, description: "Two beef patties, melty cheese, fries on the side.", rating: 4.7, popular: true, category: "Burgers" },
      { id: "f8", name: "Margherita Pizza", price: 1450, image: food5, description: "Wood-fired with fresh basil & mozzarella.", rating: 4.5, category: "Pizza" },
      ...sharedMenu,
    ],
  },
];

export const findRestaurant = (id: string) => restaurants.find((r) => r.id === id);

export const findFoodItem = (foodId: string) => {
  for (const r of restaurants) {
    const item = r.menu.find((f) => f.id === foodId);
    if (item) return { food: item, restaurant: r };
  }
  return null;
};
