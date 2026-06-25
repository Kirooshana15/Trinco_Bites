import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pizza, GlassWater, IceCream, Flame, Fish, Utensils, Plus,
  Search, Edit, Trash2, Eye, EyeOff, Filter, ChevronDown, Check,
  X, ShieldAlert, ArrowUpRight, Upload, GripVertical, Calendar,
  Download, LayoutGrid, List, Sparkles, Info, ArrowUp, ArrowDown,
  ShoppingBag, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { useRestaurants } from "@/context/RestaurantContext";
import { apiRequest } from "@/utils/api";

// Define Category Item interface
export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  image: string;
  iconName: "Pizza" | "GlassWater" | "IceCream" | "Flame" | "Fish" | "Utensils";
  totalItems: number;
  status: "Active" | "Hidden";
  createdDate: string;
  displayOrder: number;
}

// Icon Component Dictionary for dynamic icon mapping
const IconComponents = {
  Pizza: Pizza,
  GlassWater: GlassWater,
  IceCream: IceCream,
  Flame: Flame,
  Fish: Fish,
  Utensils: Utensils
};

const getCategoryImage = (name: string) => {
  return "";
};

const getCategoryIcon = (name: string): CategoryItem["iconName"] => {
  const lower = name.toLowerCase();
  if (lower.includes("pizza") || lower.includes("burger")) return "Pizza";
  if (lower.includes("mojito") || lower.includes("juice") || lower.includes("drink") || lower.includes("milkshake")) return "GlassWater";
  if (lower.includes("dessert")) return "IceCream";
  if (lower.includes("seafood") || lower.includes("fish") || lower.includes("prawn")) return "Fish";
  if (lower.includes("kottu") || lower.includes("spicy")) return "Flame";
  return "Utensils";
};

export function CategoryManagement() {
  const { user, token } = useAuth();
  const { restaurants, updateRestaurantMenu, updateRestaurantProfile } = useRestaurants();
  const activeRestaurant = restaurants.find((r) => r.id === user?.restaurantId) || restaurants[0];
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Hidden">("All");
  const [sortOption, setSortOption] = useState<"Newest" | "Oldest" | "Most Items" | "Alphabetical">("Newest");
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Modal / form states
  const [activeModalCategory, setActiveModalCategory] = useState<CategoryItem | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formIconName, setFormIconName] = useState<"Pizza" | "GlassWater" | "IceCream" | "Flame" | "Fish" | "Utensils">("Pizza");
  const [formDisplayOrder, setFormDisplayOrder] = useState(1);
  const [formStatus, setFormStatus] = useState<"Active" | "Hidden">("Active");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploadingImage(true);
    const uploadToast = toast.loading("Uploading category image to Cloudinary...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiRequest<{ message: string; url: string }>("/category/upload", {
        method: "POST",
        token,
        body: formData,
      });

      setFormImage(res.url);
      toast.success("Category image uploaded successfully!", { id: uploadToast });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload image. Please verify your Cloudinary config.", { id: uploadToast });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Fetch categories from backend
  const fetchCategories = useCallback(async (searchQuery?: string) => {
    if (!token) return;
    setLoadingCategories(true);
    try {
      const path = searchQuery && searchQuery.trim() !== "" 
        ? `/category?search=${encodeURIComponent(searchQuery)}` 
        : "/category";
      
      const data = await apiRequest<any[]>(path, {
        method: "GET",
        token,
      });

      const items: CategoryItem[] = data.map((item) => {
        const totalItems = activeRestaurant 
          ? activeRestaurant.menu.filter((m) => {
              const mCat = m.category.toLowerCase();
              const itemCat = item.name.toLowerCase();
              return m.categoryId === item.id || 
                     mCat === itemCat || 
                     mCat === itemCat + 's' || 
                     itemCat === mCat + 's' || 
                     mCat.startsWith(itemCat.substring(0, 4));
            }).length 
          : 0;

        return {
          id: item.id,
          name: item.name,
          description: item.description || "",
          image: item.image || getCategoryImage(item.name),
          iconName: (item.iconName || getCategoryIcon(item.name)) as CategoryItem["iconName"],
          totalItems,
          status: (item.status || "Active") as CategoryItem["status"],
          createdDate: new Date(item.createdAt).toISOString().split("T")[0],
          displayOrder: item.displayOrder ?? 1,
        };
      });

      setCategories(items);
    } catch (err: any) {
      toast.error(err.message || "Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  }, [token, activeRestaurant]);

  // Debounce search input and fetch categories
  useEffect(() => {
    if (!token) return;
    const delayDebounceFn = setTimeout(() => {
      fetchCategories(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, token, fetchCategories]);

  const cascadeCategoryVisibility = (categoryName: string, nextStatus: "Active" | "Hidden") => {
    if (!activeRestaurant) return;

    const updatedMenu = activeRestaurant.menu.map((item) => {
      if (item.category !== categoryName) return item;
      const typedItem = item as any;
      return {
        ...item,
        isAvailable: nextStatus === "Active",
        stock: nextStatus === "Active" ? (typedItem.stock && typedItem.stock > 0 ? typedItem.stock : 20) : 0,
      };
    });

    const nextCategories =
      nextStatus === "Active"
        ? Array.from(new Set([...activeRestaurant.categories, categoryName]))
        : activeRestaurant.categories.filter((name) => name !== categoryName);

    updateRestaurantMenu(activeRestaurant.id, updatedMenu);
    updateRestaurantProfile(activeRestaurant.id, { categories: nextCategories });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCategories(searchTerm);
    setIsRefreshing(false);
    toast.success("Categories refreshed successfully");
  };

  // Toggle Visibility Status directly on card
  const toggleVisibility = async (catId: string) => {
    const target = categories.find((category) => category.id === catId);
    if (!target) return;
    const nextStatus = target.status === "Active" ? "Hidden" : "Active";

    try {
      await apiRequest<any>(`/category/${catId}`, {
        method: "PUT",
        token,
        body: {
          status: nextStatus,
        },
      });

      cascadeCategoryVisibility(target.name, nextStatus);
      fetchCategories(searchTerm);
      toast.success(`Category "${target.name}" ${nextStatus === "Active" ? "enabled" : "disabled"} in menu and customer view`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update category status");
    }
  };

  // Delete Category item
  const handleDeleteCategory = (cat: CategoryItem) => {
    setDeleteTarget(cat);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest<any>(`/category/${deleteTarget.id}`, {
        method: "DELETE",
        token,
      });

      if (activeRestaurant) {
        const updatedMenu = activeRestaurant.menu.filter((item) => item.category !== deleteTarget.name);
        const updatedCategories = activeRestaurant.categories.filter((name) => name !== deleteTarget.name);
        updateRestaurantMenu(activeRestaurant.id, updatedMenu);
        updateRestaurantProfile(activeRestaurant.id, { categories: updatedCategories });
      }

      toast.error(`Category "${deleteTarget.name}" and its menu items were removed from customer view.`);
      setDeleteTarget(null);
      fetchCategories(searchTerm);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    }
  };



  // Filters & Sort Logic
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || cat.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (sortOption === "Alphabetical") {
      return a.name.localeCompare(b.name);
    }
    if (sortOption === "Most Items") {
      return b.totalItems - a.totalItems;
    }
    if (sortOption === "Oldest") {
      return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
    }
    // Newest default
    return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
  });

  // Calculate Statistics
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.status === "Active").length;
  const hiddenCategories = categories.filter((c) => c.status === "Hidden").length;
  const totalMenuItems = categories.reduce((sum, c) => sum + c.totalItems, 0);

  // Initialize edit modal state
  const openEditModal = (cat: CategoryItem) => {
    setActiveModalCategory(cat);
    setIsAddMode(false);
    setFormName(cat.name);
    setFormDescription(cat.description);
    setFormImage(cat.image);
    setFormIconName(cat.iconName);
    setFormDisplayOrder(cat.displayOrder);
    setFormStatus(cat.status);
  };

  // Initialize add modal state
  const openAddModal = () => {
    setActiveModalCategory(null);
    setIsAddMode(true);
    setFormName("");
    setFormDescription("");
    setFormImage(categories[0]?.image || "");
    setFormIconName("Pizza");
    setFormDisplayOrder(categories.length + 1);
    setFormStatus("Active");
  };

  // Save Modal Form (Insert or Edit)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Please provide a category name");
      return;
    }

    try {
      if (isAddMode) {
        // Create on backend
        await apiRequest<any>("/category", {
          method: "POST",
          token,
          body: {
            name: formName,
            description: formDescription,
            image: formImage,
            iconName: formIconName,
            displayOrder: Number(formDisplayOrder),
            status: formStatus,
          },
        });

        // Sync with local context if needed
        if (activeRestaurant) {
          const nextCategories = Array.from(new Set([...activeRestaurant.categories, formName]));
          updateRestaurantProfile(activeRestaurant.id, { categories: nextCategories });
        }

        toast.success(`Category "${formName}" created successfully!`);
      } else {
        if (!activeModalCategory) return;
        
        // Update on backend
        await apiRequest<any>(`/category/${activeModalCategory.id}`, {
          method: "PUT",
          token,
          body: {
            name: formName,
            description: formDescription,
            image: formImage,
            iconName: formIconName,
            displayOrder: Number(formDisplayOrder),
            status: formStatus,
          },
        });

        // Sync with local context
        if (activeRestaurant) {
          const renamedMenu = activeRestaurant.menu.map((item) =>
            item.category === activeModalCategory.name ? { ...item, category: formName } : item
          );
          const nextCategories = Array.from(
            new Set(
              activeRestaurant.categories
                .filter((name) => name !== activeModalCategory.name)
                .concat(formStatus === "Active" ? [formName] : [])
            )
          );

          const updatedMenu = renamedMenu.map((item) => {
            if (item.category !== formName) return item;
            const typedItem = item as any;
            return {
              ...item,
              isAvailable: formStatus === "Active",
              stock: formStatus === "Active" ? (typedItem.stock && typedItem.stock > 0 ? typedItem.stock : 20) : 0,
            };
          });

          updateRestaurantMenu(activeRestaurant.id, updatedMenu);
          updateRestaurantProfile(activeRestaurant.id, { categories: nextCategories });
        }

        toast.success(`Category "${formName}" updated successfully!`);
      }

      fetchCategories(searchTerm);
      setActiveModalCategory(null);
      setIsAddMode(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      {/* 1. Top Action Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Category Management
            <Sparkles size={20} className="text-[#71A066] animate-pulse shrink-0" />
          </h1>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">
            Manage restaurant food categories and menu organization
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#71A066] hover:bg-emerald-600 transition duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#71A066]/10"
          >
            <Plus size={14} strokeWidth={2.5} />
            Add Category
          </button>


          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 shadow-sm transition duration-200 cursor-pointer"
            title="Refresh categories"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[#71A066]" : ""} />
          </button>
        </div>
      </div>

      {/* 2. SaaS Animated Statistics tracker Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Categories */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 group min-h-[110px]">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Categories</span>
              <h4 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{totalCategories}</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-[#71A066]/10 group-hover:text-[#71A066] transition duration-200">
              <Filter size={16} />
            </div>
          </div>
          <div className="mt-3">
            {/* Progress line */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="bg-[#71A066] h-full rounded-full w-full" />
            </div>
          </div>
        </div>

        {/* Card 2: Active Categories */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 group min-h-[110px]">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Status</span>
              <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">{activeCategories}</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Check size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[8px] font-bold text-emerald-600">
            <span>{Math.round((activeCategories / (totalCategories || 1)) * 100)}% Operational</span>
            <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(activeCategories / (totalCategories || 1)) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Card 3: Hidden Categories */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 group min-h-[110px]">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Hidden Status</span>
              <h4 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">{hiddenCategories}</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-650 dark:bg-rose-500/20 dark:text-rose-400">
              <EyeOff size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[8px] font-bold text-rose-500">
            <span>{Math.round((hiddenCategories / (totalCategories || 1)) * 100)}% Archived</span>
            <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(hiddenCategories / (totalCategories || 1)) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Card 4: Total Menu Items */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 group min-h-[110px]">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Assigned Items</span>
              <h4 className="text-2xl font-extrabold text-violet-600 dark:text-violet-400 tracking-tight">{totalMenuItems}</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[8px] font-bold text-violet-600">
            <span>Avg {Math.round(totalMenuItems / (totalCategories || 1))} items / category</span>
            <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="bg-violet-500 h-full rounded-full w-3/4" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar Section */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-4 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Left: search input and filter buttons */}
        <div className="w-full flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 min-w-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#71A066] text-xs font-semibold placeholder-slate-450"
            />
          </div>

          <div className="flex gap-2 shrink-0">
            {/* Status Dropdown */}
            <div className="relative min-w-[110px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#71A066]"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Hidden">Hidden</option>
              </select>
              <ChevronDown size={12} className="absolute right-3.5 top-3.5 text-slate-450 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative min-w-[120px]">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#71A066]"
              >
                <option value="Newest">Newest first</option>
                <option value="Oldest">Oldest first</option>
                <option value="Most Items">Most Items</option>
                <option value="Alphabetical">Alphabetical</option>
              </select>
              <ChevronDown size={12} className="absolute right-3.5 top-3.5 text-slate-450 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right: Layout Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-850 border border-slate-200/30 dark:border-slate-800/80 p-0.5 rounded-xl self-end sm:self-auto shadow-xs">
          <button
            onClick={() => setLayoutMode("grid")}
            className={`p-2 rounded-lg transition duration-200 cursor-pointer ${layoutMode === "grid"
              ? "bg-white dark:bg-slate-900 text-[#71A066] shadow-xs"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            title="Grid Layout"
          >
            <LayoutGrid size={13} />
          </button>
          <button
            onClick={() => setLayoutMode("list")}
            className={`p-2 rounded-lg transition duration-200 cursor-pointer ${layoutMode === "list"
              ? "bg-white dark:bg-slate-900 text-[#71A066] shadow-xs"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            title="List Layout"
          >
            <List size={13} />
          </button>
        </div>
      </div>

      {/* 4. Category Grid / List Layout Section */}
      <AnimatePresence mode="popLayout">
        {sortedCategories.length > 0 ? (
          layoutMode === "grid" ? (
            /* Responsive Cards Grid Layout */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {sortedCategories.map((cat) => {
                const IconComponent = IconComponents[cat.iconName] || Pizza;
                const statusColors = {
                  Active: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-emerald-500/5",
                  Hidden: "bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-rose-500/5"
                };

                return (
                  <motion.div
                    key={cat.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group h-full relative"
                  >
                    {/* Header Banner Image Block */}
                    <div className="relative h-28 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />

                      {/* Icon overlay inside header */}
                      <div className="absolute bottom-2.5 left-3 h-8 w-8 rounded-lg bg-white/10 backdrop-blur-xs flex items-center justify-center text-white shadow-sm">
                        <IconComponent size={16} />
                      </div>

                      {/* Status overlay badge */}
                      <div className="absolute top-2.5 right-2.5">
                        <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded shadow-sm tracking-wider ${statusColors[cat.status]}`}>
                          {cat.status}
                        </span>
                      </div>
                    </div>

                    {/* Card Body Details */}
                    <div className="p-4.5 space-y-3.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight leading-tight mt-0.5">{cat.name}</h4>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-2">{cat.description}</p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-semibold text-slate-400">
                        <div className="flex items-center justify-between">
                          <span>Display Order:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">#{cat.displayOrder}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Created Date:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">{cat.createdDate}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-100 dark:border-slate-800/50">
                          <span className="text-[#71A066] font-bold">Unification:</span>
                          <span className="font-bold text-slate-850 bg-[#71A066]/10 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">{cat.totalItems} Menu Items</span>
                        </div>
                      </div>
                    </div>

                    {/* Card operations footer */}
                    <div className="px-4.5 py-3 border-t border-slate-100 dark:border-slate-800/85 bg-slate-50/50 dark:bg-slate-800/10 flex items-center justify-between gap-3">


                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleVisibility(cat.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:text-slate-400 shadow-xs transition cursor-pointer"
                          title={cat.status === "Active" ? "Hide Category" : "Show Category"}
                        >
                          {cat.status === "Active" ? <EyeOff size={11} /> : <Eye size={11} />}
                        </button>
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-[#71A066] dark:text-slate-400 shadow-xs transition cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 dark:border-rose-955/20 bg-white dark:bg-slate-900 text-rose-500 hover:text-rose-600 shadow-xs transition cursor-pointer"
                          title="Delete Category"
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
            /* Premium List Layout */
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px] text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-3 bg-slate-50/40 dark:bg-slate-800/10">
                      <th className="py-4 px-5">Image</th>
                      <th className="py-4 px-4">Category Name</th>
                      <th className="py-4 px-4">Description</th>
                      <th className="py-4 px-4 text-center">Menu Items</th>
                      <th className="py-4 px-4">Date Created</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-600 dark:text-slate-350">
                    {sortedCategories.map((cat) => {
                      const statusColors = {
                        Active: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20",
                        Hidden: "bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/20"
                      };

                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/15 transition duration-150">
                          <td className="py-3 px-5">
                            <div className="h-10 w-16 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                              <img src={cat.image} className="w-full h-full object-contain" />
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">{cat.name}</td>
                          <td className="py-3 px-4 max-w-[220px] truncate text-slate-400 dark:text-slate-500">{cat.description}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-100">{cat.totalItems} Items</td>
                          <td className="py-3 px-4 text-slate-400 dark:text-slate-500">{cat.createdDate}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[cat.status]}`}>
                              {cat.status}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => toggleVisibility(cat.id)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:text-slate-400 shadow-xs transition"
                                title={cat.status === "Active" ? "Hide" : "Show"}
                              >
                                {cat.status === "Active" ? <EyeOff size={11} /> : <Eye size={11} />}
                              </button>
                              <button
                                onClick={() => openEditModal(cat)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-[#71A066] dark:text-slate-400 shadow-xs transition"
                              >
                                <Edit size={11} />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat)}
                                className="p-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 dark:border-rose-950/20 bg-white dark:bg-slate-900 text-rose-500 hover:text-rose-600 shadow-xs transition"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* Premium Empty State Visual layout */
          <div className="py-24 text-center bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800/30 text-slate-400">
                <ShieldAlert size={32} />
              </div>
              <p className="text-sm font-bold text-slate-550 dark:text-slate-400">No Categories Found</p>
              <p className="text-xs text-slate-450 mt-0.5">There are no food categories matching your current filters.</p>

              <button
                onClick={openAddModal}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#71A066] hover:bg-emerald-600 transition flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Create Category
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Add / Edit Category Modal Dialog */}
      <AnimatePresence>
        {activeModalCategory !== null || isAddMode ? (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => { setActiveModalCategory(null); setIsAddMode(false); }}
              className="fixed inset-0 bg-black z-45"
            />

            {/* Modal Container sheet */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-2xl z-50 rounded-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/10">
                <span className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Filter size={15} className="text-[#71A066]" />
                  {isAddMode ? "Add New Category" : `Modify Category: ${formName}`}
                </span>
                <button
                  onClick={() => { setActiveModalCategory(null); setIsAddMode(false); }}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveCategory} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 text-xs">

                {/* Image selection drag uploader zone */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category Banner Image</label>

                  <div className="grid grid-cols-5 gap-3.5 items-center">
                    {/* Clickable preview block */}
                    <div
                      onClick={() => !isUploadingImage && document.getElementById("category-image-uploader")?.click()}
                      className="col-span-2 relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 group/img cursor-pointer"
                      title="Click to select image file"
                    >
                      {formImage ? (
                        <img src={formImage} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Upload size={20} />
                        </div>
                      )}
                      
                      {isUploadingImage ? (
                        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center text-white text-[9px] font-bold">
                          <RefreshCw size={16} className="animate-spin mb-1 text-[#71A066]" />
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-150 text-[9px] font-bold">
                          <Upload size={14} className="mb-1" />
                          <span>Upload Custom</span>
                        </div>
                      )}
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                      type="file"
                      id="category-image-uploader"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingImage}
                      onChange={handleImageUpload}
                    />

                    {/* Preseeded preset default selections */}
                    <div className="col-span-3 space-y-2">
                      <span className="text-[9px] text-slate-450 leading-relaxed block font-semibold">Select default Trinco asset:</span>
                      <div className="flex flex-wrap gap-2">
                        {categories.slice(0, 4).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setFormImage(c.image)}
                            className={`h-9 w-9 rounded-lg overflow-hidden border-2 transition duration-150 shrink-0 cursor-pointer ${formImage === c.image ? "border-[#71A066] scale-95" : "border-transparent opacity-65 hover:opacity-100"
                              }`}
                          >
                            <img src={c.image} className="w-full h-full object-contain" />
                          </button>
                        ))}

                        {/* Upload custom uploader thumbnail */}
                        <button
                          type="button"
                          onClick={() => document.getElementById("category-image-uploader")?.click()}
                          className="h-9 w-9 rounded-lg border-2 border-dashed border-slate-350 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-[#71A066] hover:border-[#71A066] transition duration-150 shrink-0 cursor-pointer bg-slate-50/50 dark:bg-slate-900"
                        >
                          <Upload size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name & Display order */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Burgers, Pizza, Shakes"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#71A066] text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Display Order</label>
                    <input
                      type="number"
                      placeholder="1"
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#71A066] text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Description input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</label>
                  <textarea
                    placeholder="Short description describing dishes within this menu category..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2.5}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#71A066] text-xs font-semibold resize-none placeholder-slate-450"
                  />
                </div>

                {/* Dynamic Category Icon Overlay selection grid */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category Icon overlay</label>
                  <div className="grid grid-cols-6 gap-2">
                    {(Object.keys(IconComponents) as Array<keyof typeof IconComponents>).map((iconKey) => {
                      const PresIcon = IconComponents[iconKey];
                      return (
                        <button
                          key={iconKey}
                          type="button"
                          onClick={() => setFormIconName(iconKey)}
                          className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 hover:border-[#71A066] hover:text-[#71A066] transition cursor-pointer ${formIconName === iconKey
                            ? "border-[#71A066] text-[#71A066] bg-[#71A066]/5"
                            : "border-slate-200/60 dark:border-slate-800/80 text-slate-450 dark:text-slate-400 bg-slate-50/20 dark:bg-slate-900/10"
                            }`}
                        >
                          <PresIcon size={16} />
                          <span className="text-[7.5px] font-extrabold uppercase tracking-wider">{iconKey}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Toggle Switch */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-850 dark:text-slate-200">Active Operational Status</span>
                    <span className="text-[10px] text-slate-400 leading-tight">Turn off to temporarily hide this category from user apps.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormStatus(formStatus === "Active" ? "Hidden" : "Active")}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-250 cursor-pointer ${formStatus === "Active" ? "bg-[#71A066]" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-250 transform ${formStatus === "Active" ? "translate-x-4" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>
              </form>

              {/* Action buttons footer */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setActiveModalCategory(null); setIsAddMode(false); }}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategory}
                  className="flex-1 py-2.5 bg-[#71A066] hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-sm shadow-[#71A066]/10"
                >
                  Save Category
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
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
              aria-labelledby="delete-category-title"
              className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md h-fit bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-955/20 shadow-2xl z-50 rounded-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-rose-100/70 dark:border-rose-955/40 bg-rose-50/70 dark:bg-rose-950/10 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-955/40 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 size={18} />
                </div>
                <div className="min-w-0 text-left">
                  <h2 id="delete-category-title" className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Delete Category
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    This action will unassign all items.
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3">
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shrink-0">
                    <img src={deleteTarget.image} alt={deleteTarget.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center text-left">
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{deleteTarget.name}</span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">{deleteTarget.totalItems} Menu Items</span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 text-left">
                  Are you sure you want to delete category "{deleteTarget.name}"? This action will unassign all items.
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
                  onClick={confirmDeleteCategory}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-sm shadow-rose-600/20 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} /> Delete Category
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export default CategoryManagement;
