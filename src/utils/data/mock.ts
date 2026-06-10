import rest1 from "@/assets/rest-1.jpg";
import rest2 from "@/assets/rest-2.jpg";
import rest3 from "@/assets/rest-3.jpg";
import rest4 from "@/assets/rest-4.jpg";
import food1 from "@/assets/food-1.jpg";
import food2 from "@/assets/food-2.jpg";
import food3 from "@/assets/food-3.jpg";
import food4 from "@/assets/food-4.jpg";
import food5 from "@/assets/food-5.jpg";

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

// Variety Images - Fried Rice
import frChicken from "@/assets/chickenfriedrice.jpg";
import frBeef from "@/assets/beeffriedrice.jpg";
import frEgg from "@/assets/eggfriedrice.jpg";
import frPrawn from "@/assets/prawnfriedrice.jpg";
import frSausage from "@/assets/sausagefriedrice.jpg";
import frSeafood from "@/assets/seafoodfriedrice.jpg";
import frVeg from "@/assets/vegfriedrice.jpg";

// Variety Images - Biryani
import brChicken from "@/assets/chicked- briyani.jpg";
import brBeef from "@/assets/beef-briyani.jpg";
import brEgg from "@/assets/egg-briyani.jpg";
import brPaneer from "@/assets/panner briyani.jpg";
import brPrawn from "@/assets/prawn briyani.jpg";

// Variety Images - Mojito
import mjLime from "@/assets/LimeMojoto.jpg";
import mjPassion from "@/assets/PassionMojito.jpg";
import mjPine from "@/assets/PineappleMojito.jpg";
import mjWater from "@/assets/WatermelonMojito.jpg";
import mjApple from "@/assets/appleMojito.jpg";

// Variety Images - Koththu
import ktChicken from "@/assets/Kottu-Chicken.jpg";
import ktEgg from "@/assets/kottu-Egg.jpg";
import ktMutton from "@/assets/kottu-Mutton.jpg";
import ktVeg from "@/assets/kottu-Veg.jpg";
import ktSeafood from "@/assets/kottu.png";



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
    closingTime: "12:00 PM",
    deliveryRadius: 8,
    deliveryAvailable: true,
    deliveryFee: 0,
    categories: ["Kottu", "Srilankan Foods", "Seafood", ...commonCategories],
    tagline: "Authentic Srilankan Foods & Spices",
    description: "Trinco Spice House brings you the true taste of Trincomalee's culinary heritage. Specializing in Sri Lankan foods and fresh seafood, we pride ourselves on using locally sourced ingredients and traditional spices.",
    phone: "+94 26 222 3456",
    whatsapp: "+94 77 123 4567",
    email: "trincospicehouse@gmail.com",
    website: "https://trincospicehouse.com",
    facebook: "https://facebook.com/trincospicehouse",
    instagram: "https://instagram.com/trincospicehouse",
    tiktok: "https://tiktok.com/@trincospicehouse",
    youtube: "https://youtube.com/c/trincospicehouse",
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
    hasOffer: true,
    offerText: "20% OFF",
    openingTime: "07:00 AM",
    closingTime: "09:00 PM",
    deliveryRadius: 10,
    deliveryAvailable: true,
    deliveryFee: 150,
    categories: ["Srilankan Foods", "Noodles", "Kottu", "Omlete", "Juice", ...commonCategories],
    tagline: "Fresh Beachside Seafood Feast",
    description: "Located directly on Uppuveli Beach, Ocean Pearl Seafood offers a premium selection of fresh ocean catch, prepared with bold coastal seasonings and grilled over hot coals.",
    phone: "+94 26 222 7890",
    whatsapp: "+94 77 987 6543",
    email: "oceanpearl@gmail.com",
    website: "https://oceanpearlseafood.com",
    facebook: "https://facebook.com/oceanpearlseafood",
    instagram: "https://instagram.com/oceanpearlseafood",
    tiktok: "https://tiktok.com/@oceanpearlseafood",
    youtube: "https://youtube.com/c/oceanpearlseafood",
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
    tagline: "Aromatic Basmati & Rich Spice",
    description: "Biryani Palace is famous for its mouthwatering traditional biryani, slow-cooked to perfection with premium basmati rice, tender meats, and a signature spice blend.",
    phone: "+94 26 222 5555",
    whatsapp: "+94 77 555 6666",
    email: "biryanipalace@gmail.com",
    website: "https://biryanipalace.com",
    facebook: "https://facebook.com/biryanipalace",
    instagram: "https://instagram.com/biryanipalace",
    tiktok: "https://tiktok.com/@biryanipalace",
    youtube: "https://youtube.com/c/biryanipalace",
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
    tagline: "Juicy Handcrafted Flame-Grilled Burgers",
    description: "Trinco Burger Co. serves the juiciest burgers in town, crafted from premium beef and fresh toppings, alongside wood-fired artisanal pizzas.",
    phone: "+94 26 222 9999",
    whatsapp: "+94 77 999 0000",
    email: "trincoburgerco@gmail.com",
    website: "https://trincoburgerco.com",
    facebook: "https://facebook.com/trincoburgerco",
    instagram: "https://instagram.com/trincoburgerco",
    tiktok: "https://tiktok.com/@trincoburgerco",
    youtube: "https://youtube.com/c/trincoburgerco",
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
