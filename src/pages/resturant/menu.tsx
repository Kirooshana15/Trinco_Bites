import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit, Trash2, Eye, RefreshCw, Star, Sparkles,
  Filter, ChevronDown, Check, X, ShieldAlert, ArrowUpRight,
  Upload, GripVertical, FileSpreadsheet, Play, Power, Calendar,
  Clock, DollarSign, ArrowUp, ArrowDown, HelpCircle, Utensils
} from "lucide-react";
import { toast } from "sonner";
import { useRestaurants } from "@/context/RestaurantContext";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";

// Define strict high-fidelity interfaces
export interface MenuVariant {
  name: string; // e.g. Small, Medium, Large
  price: number;
}

export interface MenuAddon {
  name: string; // e.g. Extra Cheese, Extra Spicy
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  price: number; // Base Price
  stock: number;
  isAvailable: boolean;
  tags: ("Veg" | "Spicy" | "Bestseller" | "New")[];
  variants: MenuVariant[];
  addons: MenuAddon[];
  timeAvailability: "All Day" | "Breakfast" | "Lunch" | "Dinner";
  rating: number;
  ordersCount: number;
}

export function MenuManagement() {
  const { user, token } = useAuth();
  const { restaurants, updateRestaurantMenu } = useRestaurants();
  const activeRestaurant = restaurants.find((r) => r.id === user?.restaurantId) || restaurants[0];

  const [currentRestaurantId, setCurrentRestaurantId] = useState<string>("");

  const [items, setItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("All Day");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);

  // Modal form states
  const [activeModalItem, setActiveModalItem] = useState<MenuItem | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [activeViewItem, setActiveViewItem] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Fried Rice");
  const [formPrice, setFormPrice] = useState(0);
  const [formStock, setFormStock] = useState(0);
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formTags, setFormTags] = useState<("Veg" | "Spicy" | "Bestseller" | "New")[]>([]);
  const [formVariants, setFormVariants] = useState<MenuVariant[]>([]);
  const [formAddons, setFormAddons] = useState<MenuAddon[]>([]);
  const [formTimeAvailability, setFormTimeAvailability] = useState<"All Day" | "Breakfast" | "Lunch" | "Dinner">("All Day");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Helper to sync local items changes back to global context
  const syncWithContext = (updatedItems: MenuItem[]) => {
    if (!activeRestaurant) return;
    const foodItems = updatedItems.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      description: item.description,
      rating: item.rating,
      popular: item.tags.includes("Bestseller"),
      category: item.category,
      stock: item.stock,
      isAvailable: item.isAvailable,
      tags: item.tags,
      variants: item.variants,
      addons: item.addons,
      timeAvailability: item.timeAvailability,
      ordersCount: item.ordersCount,
    }));
    updateRestaurantMenu(activeRestaurant.id, foodItems);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploadingImage(true);
    const uploadToast = toast.loading("Uploading food image to Cloudinary...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiRequest<{ message: string; url: string }>("/menu/upload", {
        method: "POST",
        token,
        body: formData,
      });

      setFormImage(res.url);
      toast.success("Food image uploaded successfully!", { id: uploadToast });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload image. Please verify Cloudinary configuration.", { id: uploadToast });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Fetch menu items from backend
  const fetchItems = useCallback(async (searchQuery?: string, categoryFilter?: string) => {
    if (!token) return;
    setLoadingItems(true);
    try {
      let path = "/menu";
      const params: string[] = [];
      if (searchQuery && searchQuery.trim() !== "") {
        params.push(`search=${encodeURIComponent(searchQuery)}`);
      }
      if (categoryFilter && categoryFilter !== "All") {
        params.push(`category=${encodeURIComponent(categoryFilter)}`);
      }
      if (params.length > 0) {
        path += "?" + params.join("&");
      }

      const data = await apiRequest<any[]>(path, {
        method: "GET",
        token,
      });

      const mapped: MenuItem[] = data.map((item) => {
        return {
          id: item.id,
          name: item.name,
          category: item.category?.name || item.categoryName || "Uncategorized",
          description: item.description || "",
          image: item.image || "",
          price: item.price,
          stock: item.stock ?? 0,
          isAvailable: item.isAvailable ?? true,
          tags: item.tags || [],
          variants: item.variants || [],
          addons: item.addons || [],
          timeAvailability: item.timeAvailability || "All Day",
          rating: item.rating || 5.0,
          ordersCount: item.ordersCount || 0
        };
      });

      setItems(mapped);
      syncWithContext(mapped);
    } catch (err: any) {
      toast.error(err.message || "Failed to load menu items");
    } finally {
      setLoadingItems(false);
    }
  }, [token, activeRestaurant?.id]);

  // Load backend items and sync
  useEffect(() => {
    if (token) {
      fetchItems(searchTerm, selectedCategory);
    }
  }, [token, searchTerm, selectedCategory, fetchItems]);

  // Open Add Food Item modal if URL hash is #add
  useEffect(() => {
    if (window.location.hash === "#add" && items.length > 0) {
      openAddModal();
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [items]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchItems(searchTerm, selectedCategory);
    setIsRefreshing(false);
    toast.success("Menu database refreshed successfully");
  };

  // Switch availability toggle
  const toggleAvailability = async (itemId: string) => {
    const target = items.find((it) => it.id === itemId);
    if (!target) return;
    const nextState = !target.isAvailable;

    try {
      await apiRequest<any>(`/menu/${itemId}`, {
        method: "PUT",
        token,
        body: {
          isAvailable: nextState,
          stock: nextState ? 20 : 0
        },
      });

      toast.success(`${target.name} is now ${nextState ? "Available" : "Unavailable"}`);
      await fetchItems(searchTerm, selectedCategory);
    } catch (err: any) {
      toast.error(err.message || "Failed to update item availability");
    }
  };

  // Get distinct categories from restaurant settings and existing menu items.
  // Rules:
  //  1. Restaurant-defined categories come first (stable order).
  //  2. Any extra categories found on items are appended after.
  //  3. Case-insensitive deduplication – keeps the first seen casing.
  //  4. "Uncategorized" is excluded from the filter tabs.
  const buildCategoriesList = (): string[] => {
    const seen = new Map<string, string>(); // lowercased key -> original display value
    const ordered: string[] = [];

    const add = (name: string) => {
      if (!name || name === "Uncategorized") return;
      const key = name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, name);
        ordered.push(name);
      }
    };

    (activeRestaurant?.categories || []).forEach(add);
    items.map((it) => it.category).forEach(add);

    return ["All", ...ordered];
  };
  const categoriesList = buildCategoriesList();

  // Filters logic
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "All" || item.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();

    const matchesTag = selectedTag === "All" || item.tags.includes(selectedTag as any);

    const matchesTime = selectedTimeframe === "All Day" || item.timeAvailability === selectedTimeframe || item.timeAvailability === "All Day";

    return matchesSearch && matchesCategory && matchesTag && matchesTime;
  });

  // Calculate statistics
  const totalItems = items.length;
  const availableItems = items.filter((it) => it.isAvailable).length;
  const outOfStockItems = items.filter((it) => it.stock === 0 || !it.isAvailable).length;
  const totalCategories = categoriesList.length - 1;
  const bestsellerCount = items.filter((it) => it.tags.includes("Bestseller")).length;

  // Initialize form for editing
  const openEditModal = (item: MenuItem) => {
    setActiveModalItem(item);
    setIsAddMode(false);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price);
    setFormStock(item.stock);
    setFormDescription(item.description);
    setFormImage(item.image);
    setFormIsAvailable(item.isAvailable);
    setFormTags(item.tags);
    setFormVariants([...item.variants]);
    setFormAddons([...item.addons]);
    setFormTimeAvailability(item.timeAvailability);
  };

  // Initialize form for adding
  const openAddModal = () => {
    setActiveModalItem(null);
    setIsAddMode(true);
    setFormName("");
    setFormCategory(categoriesList[1] || "Fried Rice");
    setFormPrice(800);
    setFormStock(50);
    setFormDescription("");
    setFormImage(items[0]?.image || "");
    setFormIsAvailable(true);
    setFormTags(["New"]);
    setFormVariants([]);
    if (formAddons.length === 0) {
      setFormAddons([
        { name: "Extra Gravy", price: 80 },
        { name: "Egg / Cheese Wrap", price: 120 }
      ]);
    }
    setFormTimeAvailability("All Day");
  };

  // Delete Food Item
  const handleDeleteItem = (item: MenuItem) => {
    setDeleteTarget(item);
  };

  const confirmDeleteItem = async () => {
    if (!deleteTarget) return;

    try {
      await apiRequest<any>(`/menu/${deleteTarget.id}`, {
        method: "DELETE",
        token,
      });

      toast.error(`${deleteTarget.name} has been deleted from the menu.`);
      setDeleteTarget(null);
      await fetchItems(searchTerm, selectedCategory);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete menu item");
    }
  };

  // Dynamic Add / Remove Variants inside Modal
  const addVariantRow = () => {
    setFormVariants([...formVariants, { name: "Regular", price: formPrice }]);
  };

  const removeVariantRow = (index: number) => {
    setFormVariants(formVariants.filter((_, idx) => idx !== index));
  };

  const updateVariantRow = (index: number, field: "name" | "price", value: string | number) => {
    setFormVariants(
      formVariants.map((v, idx) => {
        if (idx === index) {
          return {
            ...v,
            [field]: value
          };
        }
        return v;
      })
    );
  };

  // Dynamic Add / Remove Add-ons inside Modal
  const addAddonRow = () => {
    setFormAddons([...formAddons, { name: "Cheese Option", price: 100 }]);
  };

  const removeAddonRow = (index: number) => {
    setFormAddons(formAddons.filter((_, idx) => idx !== index));
  };

  const updateAddonRow = (index: number, field: "name" | "price", value: string | number) => {
    setFormAddons(
      formAddons.map((ad, idx) => {
        if (idx === index) {
          return {
            ...ad,
            [field]: value
          };
        }
        return ad;
      })
    );
  };

  // Toggle form tag selection
  const toggleFormTag = (tag: "Veg" | "Spicy" | "Bestseller" | "New") => {
    if (formTags.includes(tag)) {
      setFormTags(formTags.filter((t) => t !== tag));
    } else {
      setFormTags([...formTags, tag]);
    }
  };

  // Save Modal Form (Insert or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Please enter the food name");
      return;
    }

    try {
      if (isAddMode) {
        await apiRequest<any>("/menu", {
          method: "POST",
          token,
          body: {
            name: formName,
            category: formCategory,
            description: formDescription,
            image: formImage,
            price: Number(formPrice),
            stock: Number(formStock),
            isAvailable: formIsAvailable,
            tags: formTags,
            variants: formVariants,
            addons: formAddons,
            timeAvailability: formTimeAvailability,
          },
        });
        toast.success(`${formName} has been added to the menu!`);
      } else {
        if (!activeModalItem) return;
        await apiRequest<any>(`/menu/${activeModalItem.id}`, {
          method: "PUT",
          token,
          body: {
            name: formName,
            category: formCategory,
            description: formDescription,
            image: formImage,
            price: Number(formPrice),
            stock: Number(formStock),
            isAvailable: formIsAvailable,
            tags: formTags,
            variants: formVariants,
            addons: formAddons,
            timeAvailability: formTimeAvailability,
          },
        });
        toast.success(`${formName} updated successfully!`);
      }

      await fetchItems(searchTerm, selectedCategory);
      setActiveModalItem(null);
      setIsAddMode(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save menu item");
    }
  };

  // Reorder items mock simulation
  const shiftItemOrder = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= filteredItems.length) return;

    const absoluteIndex1 = items.findIndex((it) => it.id === filteredItems[index].id);
    const absoluteIndex2 = items.findIndex((it) => it.id === filteredItems[nextIndex].id);

    setItems((prev) => {
      const nextItems = [...prev];
      const temp = nextItems[absoluteIndex1];
      nextItems[absoluteIndex1] = nextItems[absoluteIndex2];
      nextItems[absoluteIndex2] = temp;

      syncWithContext(nextItems);
      return nextItems;
    });
    toast.success("Menu items sequence updated");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      {/* 1. Header & Page Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Menu Management
            <Sparkles size={20} className="text-amber-500 animate-pulse shrink-0" />
          </h1>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">
            Create, organize, and track your culinary offerings in real-time
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2.5 shrink-0">


          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#71A066] hover:bg-emerald-600 transition duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#71A066]/10"
          >
            <Plus size={14} strokeWidth={2.5} />
            Add Food Item
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 shadow-sm transition duration-200 cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[#71A066]" : ""} />
          </button>
        </div>
      </div>

      {/* 2. SaaS Statistics Tracker Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Items */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-between min-h-[90px]">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Items</span>
            <h4 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">{totalItems}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
            <Utensils size={16} />
          </div>
        </div>

        {/* Available Items */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-between min-h-[90px]">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Available</span>
            <h4 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">{availableItems}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-450">
            <Power size={16} />
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-between min-h-[90px]">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Out of Stock</span>
            <h4 className="text-xl font-extrabold text-rose-600 dark:text-rose-450 tracking-tight">{outOfStockItems}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-650 dark:bg-rose-500/20 dark:text-rose-400">
            <ShieldAlert size={16} />
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-between min-h-[90px]">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Categories</span>
            <h4 className="text-xl font-extrabold text-amber-600 dark:text-amber-450 tracking-tight">{totalCategories}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <Filter size={16} />
          </div>
        </div>

        {/* Bestseller Items */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-between min-h-[90px] col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Bestsellers</span>
            <h4 className="text-xl font-extrabold text-violet-600 dark:text-violet-400 tracking-tight">{bestsellerCount}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
            <Star size={16} />
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Grid */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-slate-800/80 p-4.5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by food name, category, or ID reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#71A066] dark:focus:ring-emerald-500/40 text-xs font-semibold placeholder-slate-400"
            />
          </div>

          {/* Filtering dropdowns */}
          <div className="flex gap-2">
            {/* Tag filter selector */}


            {/* Time availability filter */}
            <div className="relative min-w-[120px]">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#71A066]"
              >
                <option value="All Day">All Hours</option>
                <option value="Breakfast">Breakfast Only</option>
                <option value="Lunch">Lunch Only</option>
                <option value="Dinner">Dinner Only</option>
              </select>
              <ChevronDown size={12} className="absolute right-3.5 top-3.5 text-slate-450 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Category horizontal scrolling tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 pr-2 custom-scrollbar">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap transition duration-200 cursor-pointer shadow-sm ${selectedCategory === cat
                ? "bg-[#71A066] border-[#71A066] text-white"
                : "border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main Menu Items Grid */}
      <AnimatePresence mode="popLayout">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item, index) => {
              const tagColors = {
                Veg: "bg-emerald-500 text-white",
                Spicy: "bg-rose-500 text-white",
                Bestseller: "bg-amber-500 text-white",
                New: "bg-sky-500 text-white"
              };

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group h-full relative"
                >
                  {/* Reorder drag/arrow toggles overlay */}
                  {reorderMode && (
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-3">
                      <div className="p-2 rounded-xl bg-white text-slate-800 flex items-center gap-2 font-bold text-xs shadow-md">
                        <GripVertical size={14} className="text-slate-400 cursor-grab" />
                        <span>Sequence Order</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          disabled={index === 0}
                          onClick={() => shiftItemOrder(index, "up")}
                          className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 disabled:opacity-40 shadow transition cursor-pointer"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          disabled={index === filteredItems.length - 1}
                          onClick={() => shiftItemOrder(index, "down")}
                          className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 disabled:opacity-40 shadow transition cursor-pointer"
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Food Image block with overlay hover */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Absolute Tags overlay */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span key={tag} className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-sm tracking-wider ${tagColors[tag]}`}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Time availability overlay badge */}
                    <span className="absolute bottom-2.5 right-2.5 bg-slate-900/60 backdrop-blur-xs text-white text-[8px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-widest">
                      <Clock size={8} /> {item.timeAvailability}
                    </span>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-4.5 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Name & Category Row */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-[#71A066] dark:text-emerald-450 uppercase tracking-widest">{item.category}</span>
                          <h5 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight leading-tight mt-0.5">{item.name}</h5>
                        </div>


                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-2 mt-2">{item.description}</p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      {/* Pricing, stock, and Availability Switch */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Base Price</span>
                          <span className="font-extrabold text-slate-800 dark:text-white text-sm">Rs. {item.price.toLocaleString()}</span>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-1">Availability</span>
                          <button
                            onClick={() => toggleAvailability(item.id)}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-250 cursor-pointer ${item.isAvailable ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                              }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-250 transform ${item.isAvailable ? "translate-x-4" : "translate-x-0"
                                }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Stock Warning details */}
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-400">Stock Status:</span>
                        {item.isAvailable && item.stock > 0 ? (
                          <span className="text-slate-500 font-bold">{item.stock} Units Left</span>
                        ) : (
                          <span className="text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded flex items-center gap-0.5">
                            <ShieldAlert size={10} /> Out of Stock
                          </span>
                        )}
                      </div>

                      {/* Variant and addon indicators */}
                      {item.variants.length > 0 && (
                        <div className="pt-1.5 space-y-1">
                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Variants ({item.variants.length})</span>
                            <span className="text-[#71A066]">Multi-price</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.variants.map((v) => (
                              <span key={v.name} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                                {v.name}: Rs. {v.price}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card actions footer panel */}
                  <div className="px-4.5 py-3 border-t border-slate-100 dark:border-slate-800/85 bg-slate-50/50 dark:bg-slate-800/10 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setActiveViewItem(item)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 hover:border-slate-300 dark:text-slate-400 dark:hover:text-white shadow-xs transition cursor-pointer flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5"
                      title="View Details"
                    >
                      <Eye size={11} /> View
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-[#71A066] dark:text-slate-400 shadow-xs transition cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit size={11} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="p-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 dark:border-rose-950/20 bg-white dark:bg-slate-900 text-rose-500 hover:text-rose-600 shadow-xs transition cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800/30 text-slate-400">
                <ShieldAlert size={32} />
              </div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No Food Items Found</p>
              <p className="text-xs text-slate-450 mt-0.5">Try adjusting your filters or keyword query</p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Item Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="fixed inset-0 bg-black z-45"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-menu-item-title"
              className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md h-fit bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/40 shadow-2xl z-50 rounded-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-rose-100/70 dark:border-rose-950/40 bg-rose-50/70 dark:bg-rose-950/10 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 size={18} />
                </div>
                <div className="min-w-0">
                  <h2 id="delete-menu-item-title" className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Delete Menu Item
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    This action removes the item from the customer menu.
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3">
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shrink-0">
                    <img src={deleteTarget.image} alt={deleteTarget.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{deleteTarget.name}</span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">{deleteTarget.category}</span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Are you sure you want to delete this item? You will need to add it again manually if you change your mind.
                </p>
              </div>

              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteItem}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-sm shadow-rose-600/20 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} /> Delete Item
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>


      {/* 6. High-fidelity Add / Edit Item Modal */}
      <AnimatePresence>
        {activeModalItem !== null || isAddMode ? (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => { setActiveModalItem(null); setIsAddMode(false); }}
              className="fixed inset-0 bg-black z-45"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto w-full max-w-xl h-fit max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-2xl z-50 rounded-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/10">
                <span className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Utensils size={15} className="text-[#71A066]" />
                  {isAddMode ? "Add New Food Item" : `Modify: ${formName}`}
                </span>
                <button
                  onClick={() => { setActiveModalItem(null); setIsAddMode(false); }}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 transition duration-150"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 text-xs">

                {/* Image upload simulation & preview */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Food Image Selection</label>

                  <div className="grid grid-cols-5 gap-3.5 items-center">
                    <div
                      onClick={() => document.getElementById("food-image-uploader")?.click()}
                      className="col-span-2 relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 group/img cursor-pointer"
                      title="Click to upload custom image"
                    >
                      <img
                        src={formImage}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-150 text-[9px] font-bold">
                        <Upload size={14} className="mb-1" />
                        <span>Upload Custom</span>
                      </div>
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                      type="file"
                      id="food-image-uploader"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />

                    {/* Pre-seeded dynamic mock images selector */}
                    <div className="col-span-3 space-y-2">
                      <span className="text-[9px] text-slate-450 leading-relaxed block font-semibold">Select default asset or upload:</span>
                      <div className="flex flex-wrap gap-2">
                        {items.slice(0, 4).map((it) => (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => setFormImage(it.image)}
                            className={`h-9 w-9 rounded-lg overflow-hidden border-2 transition duration-150 shrink-0 cursor-pointer ${formImage === it.image ? "border-[#71A066] scale-95" : "border-transparent opacity-65 hover:opacity-100"
                              }`}
                          >
                            <img src={it.image} className="w-full h-full object-contain" />
                          </button>
                        ))}

                        {/* Custom browse thumbnail button */}
                        <button
                          type="button"
                          onClick={() => document.getElementById("food-image-uploader")?.click()}
                          className="h-9 w-9 rounded-lg border-2 border-dashed border-slate-350 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-[#71A066] hover:border-[#71A066] transition duration-150 shrink-0 cursor-pointer bg-slate-50/50 dark:bg-slate-900"
                          title="Upload Custom Image"
                        >
                          <Upload size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main details row (Name & Category) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Food Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Cheese Pizza, Mixed Kottu"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#71A066] text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#71A066] text-xs font-semibold cursor-pointer"
                    >
                      {categoriesList.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Stock & Pricing Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base Price (Rs.)</label>
                    <input
                      type="number"
                      placeholder="850"
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#71A066] text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stock Quantity</label>
                    <input
                      type="number"
                      placeholder="50"
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#71A066] text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time Availability</label>
                    <select
                      value={formTimeAvailability}
                      onChange={(e) => setFormTimeAvailability(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#71A066] text-xs font-semibold cursor-pointer"
                    >
                      <option value="All Day">All Day</option>
                      <option value="Breakfast">Breakfast Only</option>
                      <option value="Lunch">Lunch Only</option>
                      <option value="Dinner">Dinner Only</option>
                    </select>
                  </div>
                </div>

                {/* Description Textarea */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Item Description</label>
                  <textarea
                    placeholder="Provide a delicious detailed description of the food item, spices used, allergen info..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2.5}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#71A066] text-xs font-semibold resize-none placeholder-slate-400"
                  />
                </div>



                {/* VARIANT SYSTEM MANAGER */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Dynamic Size / Price Variations</span>
                    <button
                      type="button"
                      onClick={addVariantRow}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[9px] uppercase tracking-widest rounded-lg flex items-center gap-0.5"
                    >
                      <Plus size={10} /> Add Variant
                    </button>
                  </div>

                  {formVariants.length > 0 ? (
                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                      {formVariants.map((variant, index) => (
                        <div key={index} className="flex items-center gap-2.5">
                          <input
                            type="text"
                            placeholder="e.g. Small, Medium, Double Portion"
                            value={variant.name}
                            onChange={(e) => updateVariantRow(index, "name", e.target.value)}
                            className="flex-3 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-[11px] font-semibold"
                          />
                          <input
                            type="number"
                            placeholder="Price"
                            value={variant.price}
                            onChange={(e) => updateVariantRow(index, "price", Number(e.target.value))}
                            className="flex-2 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-[11px] font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariantRow(index)}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center border border-slate-200/50 dark:border-slate-800/40 rounded-xl text-slate-400 text-[10px] italic">
                      No variations specified. Standard base price will be applied.
                    </div>
                  )}
                </div>

                {/* ADD-ONS SYSTEM MANAGER */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Gourmet Extra Add-ons</span>
                    <button
                      type="button"
                      onClick={addAddonRow}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[9px] uppercase tracking-widest rounded-lg flex items-center gap-0.5"
                    >
                      <Plus size={10} /> Add Add-on
                    </button>
                  </div>

                  {formAddons.length > 0 ? (
                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                      {formAddons.map((addon, index) => (
                        <div key={index} className="flex items-center gap-2.5">
                          <input
                            type="text"
                            placeholder="e.g. Extra Cheese, Added Fried Egg"
                            value={addon.name}
                            onChange={(e) => updateAddonRow(index, "name", e.target.value)}
                            className="flex-3 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-[11px] font-semibold"
                          />
                          <input
                            type="number"
                            placeholder="Price"
                            value={addon.price}
                            onChange={(e) => updateAddonRow(index, "price", Number(e.target.value))}
                            className="flex-2 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-[11px] font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => removeAddonRow(index)}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center border border-slate-200/50 dark:border-slate-800/40 rounded-xl text-slate-400 text-[10px] italic">
                      No extra side add-ons configured.
                    </div>
                  )}
                </div>

                {/* Availability Toggle switch inside Form */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Active Stock Availability</span>
                    <span className="text-[10px] text-slate-400 leading-tight">Turn off to temporarily hide from customer menus.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormIsAvailable(!formIsAvailable)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-250 cursor-pointer ${formIsAvailable ? "bg-[#71A066]" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-250 transform ${formIsAvailable ? "translate-x-4" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>
              </form>

              {/* Action buttons footer */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setActiveModalItem(null); setIsAddMode(false); }}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveItem}
                  className="flex-1 py-2.5 bg-[#71A066] hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-sm shadow-[#71A066]/10"
                >
                  Save Item
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      {/* 7. Detailed Gourmet View Modal */}
      <AnimatePresence>
        {activeViewItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveViewItem(null)}
              className="fixed inset-0 bg-black z-45"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-2xl z-50 rounded-2xl flex flex-col overflow-hidden"
            >
              {/* Image banner details */}
              <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800">
                <img src={activeViewItem.image} alt={activeViewItem.name} className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button
                  onClick={() => setActiveViewItem(null)}
                  className="absolute top-4 right-4 p-1.5 bg-black/40 backdrop-blur-xs text-white rounded-full hover:bg-black/60"
                >
                  <X size={14} />
                </button>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">{activeViewItem.category}</span>
                  <h4 className="text-md font-extrabold tracking-tight mt-0.5">{activeViewItem.name}</h4>
                </div>
              </div>

              {/* View Item details panel */}
              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar text-xs">
                {/* Description */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Description</span>
                  <p className="text-slate-650 dark:text-slate-350 leading-relaxed">{activeViewItem.description}</p>
                </div>

                {/* Info parameters */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Base Price</span>
                    <span className="font-extrabold text-slate-800 dark:text-white text-sm">Rs. {activeViewItem.price.toLocaleString()}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Stock</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{activeViewItem.stock} Units left</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Time Availability</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{activeViewItem.timeAvailability}</span>
                  </div>

                </div>

                {/* Dynamic Variants list */}
                {activeViewItem.variants.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Variations</span>
                    <div className="divide-y divide-slate-100 dark:divide-slate-850">
                      {activeViewItem.variants.map((v) => (
                        <div key={v.name} className="py-2 flex items-center justify-between text-slate-650 dark:text-slate-350">
                          <span className="font-bold">{v.name}</span>
                          <span className="font-extrabold text-slate-800 dark:text-white">Rs. {v.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamic Add-ons list */}
                {activeViewItem.addons.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Side Extra Add-ons</span>
                    <div className="divide-y divide-slate-100 dark:divide-slate-850">
                      {activeViewItem.addons.map((ad) => (
                        <div key={ad.name} className="py-2 flex items-center justify-between text-slate-650 dark:text-slate-350">
                          <span>{ad.name}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">+ Rs. {ad.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Close footer button */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    openEditModal(activeViewItem);
                    setActiveViewItem(null);
                  }}
                  className="w-full py-2.5 bg-[#71A066] hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-sm shadow-[#71A066]/10 flex items-center justify-center gap-1.5"
                >
                  <Edit size={12} /> Edit Details
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default MenuManagement;
