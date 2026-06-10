import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, Save, Upload, MapPin, Clock, Phone, Mail, DollarSign,
  CheckCircle2, AlertTriangle, Trash2, Plus, Globe, Facebook,
  Instagram, Youtube, Heart, Sparkles, Compass, Eye,
  Lock, User, ExternalLink, Shield, X, ChevronRight, Settings, Check,
  Info, AlertCircle, HelpCircle, ArrowRight, Laptop, Calendar, MessageSquare, Star
} from "lucide-react";
import { toast } from "sonner";
import { C } from "@/utils/theme";
import { useAuth } from "@/context/AuthContext";
import { restaurants } from "@/utils/data/mock";
import { useRestaurants } from "@/context/RestaurantContext";
import { Link } from "@tanstack/react-router";

// Types for profile state
interface WeeklyHour {
  open: boolean;
  from: string;
  to: string;
}

interface ProfileState {
  name: string;
  tagline: string;
  description: string;
  cuisineTypes: string[];
  phone: string;
  whatsapp: string;
  email: string;
  supportNumber: string;
  halalFriendly: boolean;
  vegetarianFriendly: boolean;
  dineIn: boolean;
  takeaway: boolean;
  delivery: boolean;

  // Location
  streetAddress: string;
  city: string;
  district: string;
  postalCode: string;
  lat: string;
  lng: string;
  deliveryRadius: number; // in km

  // Delivery
  estimatedDeliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  freeDeliveryThreshold: number;

  // Opening Hours
  openingTime: string;
  closingTime: string;
  weeklyHours: Record<string, WeeklyHour>;
  holidayMode: boolean;
  temporaryClosure: boolean;

  // Social Links
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  website: string;

  // Settings
  acceptOrders: boolean;
  showPublicly: boolean;
  vacationMode: boolean;
  autoAcceptOrders: boolean;
  cashOnDelivery: boolean;
  featuredRestaurant: boolean;

  // Reviews and Ratings
  rating: number;
  reviewsCount: number;
}

export function RestaurantProfile() {
  // Tabs list
  const tabs = [
    { id: "overview", label: "Overview", icon: Store },
    { id: "business", label: "Business Info", icon: Shield },
    { id: "location", label: "Location", icon: MapPin },
    { id: "delivery", label: "Delivery Settings", icon: DollarSign },
    { id: "hours", label: "Opening Hours", icon: Clock },
    { id: "social", label: "Social Links", icon: Globe },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const [activeTab, setActiveTab] = useState("overview");
  const [isSaving, setIsSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const { user } = useAuth();
  const { updateRestaurantProfile } = useRestaurants();
  const activeRestaurant = restaurants.find((r) => r.id === user?.restaurantId) || restaurants[0];
  const [logoImage, setLogoImage] = useState<string>(activeRestaurant.image);
  const [coverImage, setCoverImage] = useState<string>("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80");

  // Custom mock cuisine items
  const standardCuisines = [
    "Kottu", "Seafood", "Noodles", "Biryani", "Burgers",
    "Pizza", "Soft Drinks", "Desserts", "Rice and Curry", "Juices", "Milkshake", "Mojito"
  ];
  // Profile data state
  const [profile, setProfile] = useState<ProfileState>({
    name: activeRestaurant.name,
    tagline: `Authentic ${activeRestaurant.category} Flavors`,
    description: `${activeRestaurant.name} brings you the true taste of Trincomalee's culinary heritage. Specializing in ${activeRestaurant.category.toLowerCase()}, we pride ourselves on using locally sourced ingredients and traditional cooking techniques passed down through generations.`,
    cuisineTypes: activeRestaurant.categories.slice(0, 4),
    phone: "+94 26 222 3456",
    whatsapp: "+94 77 123 4567",
    email: `${activeRestaurant.name.toLowerCase().replace(/[\s.]+/g, "")}@gmail.com`,
    supportNumber: "+94 26 222 3458",
    halalFriendly: true,
    vegetarianFriendly: true,
    dineIn: true,
    takeaway: true,
    delivery: true,

    // Location
    streetAddress: activeRestaurant.location.split(",")[0]?.trim() || "42 Dockyard Road",
    city: "Trincomalee",
    district: "Trincomalee",
    postalCode: "31000",
    lat: "8.5714",
    lng: "81.2335",
    deliveryRadius: 8,

    // Delivery Settings
    estimatedDeliveryTime: activeRestaurant.deliveryTime || "25-35 min",
    deliveryFee: activeRestaurant.deliveryFee ?? 150,
    minOrder: 500,
    freeDeliveryThreshold: 2500,

    // Opening Hours
    openingTime: "08:00 AM",
    closingTime: "10:00 PM",
    weeklyHours: {
      Monday: { open: true, from: "08:00 AM", to: "10:00 PM" },
      Tuesday: { open: true, from: "08:00 AM", to: "10:00 PM" },
      Wednesday: { open: true, from: "08:00 AM", to: "10:00 PM" },
      Thursday: { open: true, from: "08:00 AM", to: "10:00 PM" },
      Friday: { open: true, from: "08:00 AM", to: "11:00 PM" },
      Saturday: { open: true, from: "08:00 AM", to: "11:00 PM" },
      Sunday: { open: true, from: "09:00 AM", to: "10:00 PM" }
    },
    holidayMode: false,
    temporaryClosure: false,

    // Social Links
    facebook: `https://facebook.com/${activeRestaurant.name.toLowerCase().replace(/[\s.]+/g, "")}`,
    instagram: `https://instagram.com/${activeRestaurant.name.toLowerCase().replace(/[\s.]+/g, "")}`,
    tiktok: `https://tiktok.com/@${activeRestaurant.name.toLowerCase().replace(/[\s.]+/g, "")}`,
    youtube: `https://youtube.com/c/${activeRestaurant.name.toLowerCase().replace(/[\s.]+/g, "")}`,
    website: `https://${activeRestaurant.name.toLowerCase().replace(/[\s.]+/g, "")}.com`,

    // Settings
    acceptOrders: true,
    showPublicly: true,
    vacationMode: false,
    autoAcceptOrders: true,
    cashOnDelivery: true,
    featuredRestaurant: false,

    // Reviews and Ratings
    rating: activeRestaurant.rating ?? 4.5,
    reviewsCount: activeRestaurant.reviewsCount ?? 184
  });

  // Calculate profile completion percentage
  const completionDetails = useMemo(() => {
    const checklist = [
      { name: "Logo Image", done: !!logoImage, ref: "overview" },
      { name: "Cover Image", done: !!coverImage, ref: "overview" },
      { name: "Basic Details (Name & Tagline)", done: !!profile.name && !!profile.tagline, ref: "overview" },
      { name: "Description", done: profile.description.length >= 50, ref: "overview" },
      { name: "Contact details", done: !!profile.phone && !!profile.email, ref: "overview" },
      { name: "Location Details", done: !!profile.streetAddress && !!profile.city, ref: "location" },
      { name: "Delivery Settings", done: profile.deliveryFee >= 0 && profile.minOrder > 0, ref: "delivery" },
      { name: "Weekly Operating Hours", done: Object.values(profile.weeklyHours).some(d => d.open), ref: "hours" },
      { name: "Social Links (At least 1)", done: !!profile.facebook || !!profile.instagram || !!profile.website, ref: "social" }
    ];

    const completed = checklist.filter(item => item.done).length;
    const percentage = Math.round((completed / checklist.length) * 100);

    return { percentage, checklist };
  }, [profile, logoImage, coverImage]);

  // Handle standard input updates
  const handleInputChange = (field: keyof ProfileState, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
    if (field === "email") {
      setEmailError(null);
    }
  };

  // Toggle cuisine choice
  const toggleCuisine = (cuisine: string) => {
    setProfile(prev => {
      const current = [...prev.cuisineTypes];
      if (current.includes(cuisine)) {
        return { ...prev, cuisineTypes: current.filter(c => c !== cuisine) };
      } else {
        return { ...prev, cuisineTypes: [...current, cuisine] };
      }
    });
  };

  // Copy Mon hours to all other days
  const copyHoursToAllDays = () => {
    const monHours = profile.weeklyHours.Monday;
    setProfile(prev => {
      const updatedHours = { ...prev.weeklyHours };
      Object.keys(updatedHours).forEach(day => {
        updatedHours[day] = { ...monHours };
      });
      return {
        ...prev,
        weeklyHours: updatedHours
      };
    });
    toast.success("Monday's operating hours copied to all days!");
  };

  // Update opening/closing hour of a specific day
  const handleDayHourChange = (day: string, field: "open" | "from" | "to", value: any) => {
    setProfile(prev => {
      const updatedHours = { ...prev.weeklyHours };
      updatedHours[day] = {
        ...updatedHours[day],
        [field]: value
      };
      return {
        ...prev,
        weeklyHours: updatedHours
      };
    });
  };


  // Detect location simulator
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setTimeout(() => {
      setProfile(prev => ({
        ...prev,
        lat: "8.5752",
        lng: "81.2312",
        streetAddress: "68 Sarada Road, Uppuveli",
        city: "Trincomalee",
        postalCode: "31000"
      }));
      setIsDetectingLocation(false);
      toast.success("Current GPS location detected successfully!");
    }, 1500);
  };

  // Drag and Drop Simulator for images
  const [isDragOverLogo, setIsDragOverLogo] = useState(false);
  const [isDragOverCover, setIsDragOverCover] = useState(false);

  const simulateLogoUpload = (e: any) => {
    e.preventDefault();
    setIsDragOverLogo(false);
    toast.info("Uploading restaurant logo...");
    setTimeout(() => {
      setLogoImage("https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200&auto=format&fit=crop&q=80");
      toast.success("Logo updated successfully!");
    }, 1000);
  };

  const simulateCoverUpload = (e: any) => {
    e.preventDefault();
    setIsDragOverCover(false);
    toast.info("Uploading restaurant cover image...");
    setTimeout(() => {
      setCoverImage("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80");
      toast.success("Cover image updated successfully!");
    }, 1200);
  };

  // Main save action
  const handleSaveAll = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profile.email.trim()) {
      setActiveTab("overview");
      setEmailError("Public email address is required");
      toast.error("Validation Error", {
        description: "Please enter a store public email address.",
        duration: 4000
      });
      return;
    }
    if (!emailRegex.test(profile.email.trim())) {
      setActiveTab("overview");
      setEmailError("Please enter a valid email address (e.g. store@example.com)");
      toast.error("Validation Error", {
        description: "Please enter a valid email address format.",
        duration: 4000
      });
      return;
    }

    setEmailError(null);
    setIsSaving(true);
    setTimeout(() => {
      // Persist profile changes to the shared restaurant store (context + localStorage)
      updateRestaurantProfile(activeRestaurant.id, {
        name: profile.name,
        tagline: profile.tagline,
        description: profile.description,
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        email: profile.email,
        location: profile.streetAddress ? `${profile.streetAddress}, ${profile.city}` : activeRestaurant.location,
        streetAddress: profile.streetAddress,
        city: profile.city,
        openingTime: profile.openingTime,
        closingTime: profile.closingTime,
        deliveryTime: profile.estimatedDeliveryTime,
        deliveryFee: profile.deliveryFee,
        deliveryAvailable: profile.delivery,
        deliveryRadius: profile.deliveryRadius,
        minOrder: profile.minOrder,
        halalFriendly: profile.halalFriendly,
        vegetarianFriendly: profile.vegetarianFriendly,
        dineIn: profile.dineIn,
        takeaway: profile.takeaway,
        delivery: profile.delivery,
        facebook: profile.facebook,
        instagram: profile.instagram,
        tiktok: profile.tiktok,
        youtube: profile.youtube,
        website: profile.website,
        logoImage: logoImage,
        coverImage: coverImage,
        rating: Number(profile.rating),
        reviewsCount: Number(profile.reviewsCount),
      });
      setIsSaving(false);
      toast.success("Restaurant Profile saved successfully!", {
        description: "All changes are now live and visible to customers.",
        duration: 4000
      });
    }, 1800);
  };

  // Determine current active operating status
  const currentStatus = useMemo(() => {
    if (profile.temporaryClosure) return { label: "Closed", color: "bg-red-500", text: "text-red-500", desc: "Temporarily Closed" };
    if (profile.holidayMode) return { label: "Closed", color: "bg-amber-500", text: "text-amber-500", desc: "Holiday Mode Active" };
    if (!profile.acceptOrders) return { label: "Busy", color: "bg-orange-500", text: "text-orange-500", desc: "Not Accepting Orders" };
    return { label: "Open Now", color: "bg-emerald-500", text: "text-emerald-500", desc: "Accepting Orders" };
  }, [profile.acceptOrders, profile.holidayMode, profile.temporaryClosure]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      {/* ── STICKY HEADER ─────────────────────────────────────────────── */}
      <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md rounded-2xl px-5 py-4 border border-brand-cream/30 dark:border-zinc-700/50 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-brand-brown dark:text-brand-orange tracking-tight">
              Restaurant Profile
            </h1>
            {/* Pulsing active status badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${currentStatus.color}/10 ${currentStatus.text}`}>
              <span className={`h-2 w-2 rounded-full ${currentStatus.color} animate-pulse`} />
              {currentStatus.label}
            </span>
          </div>
          <p className="text-xs font-bold text-brand-burnt/70 dark:text-brand-cream/70 mt-0.5 uppercase tracking-wider">
            Manage your customer-facing digital storefront
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobilePreviewOpen(true)}
            className="lg:hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-brand-cream/30 hover:bg-brand-cream/50 text-brand-brown dark:bg-brand-brown/30 dark:hover:bg-brand-brown/50 dark:text-brand-cream border border-brand-cream/40 dark:border-brand-brown/40 transition-colors"
          >
            <Eye className="h-4 w-4" />
            Live Preview
          </button>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-burnt hover:bg-brand-burnt/95 text-white dark:bg-brand-orange dark:hover:bg-brand-orange/95 dark:text-brand-brown shadow-md hover:shadow-lg disabled:opacity-70 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-4 w-4 border-2 border-white dark:border-brand-brown border-t-transparent rounded-full"
                />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── PROFILE COMPLETION PROGRESS CARD ──────────────────────────── */}
      <motion.div
        layout
        className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md rounded-2xl p-5 border border-brand-cream/30 dark:border-zinc-700/50 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center h-16 w-16 flex-shrink-0">
            {/* Custom SVG Circular Progress */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                className="stroke-zinc-100 dark:stroke-zinc-700 fill-none"
                strokeWidth="6"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                className="stroke-brand-burnt dark:stroke-brand-orange fill-none"
                strokeWidth="6"
                strokeDasharray={175}
                strokeDashoffset={175 - (175 * completionDetails.percentage) / 100}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <span className="absolute text-sm font-extrabold text-brand-brown dark:text-brand-orange">
              {completionDetails.percentage}%
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-brand-brown dark:text-brand-orange text-base flex items-center gap-1.5">
              Profile Setup Progress
              {completionDetails.percentage === 100 && (
                <Sparkles className="h-4 w-4 text-amber-500 animate-bounce" />
              )}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {completionDetails.percentage === 100
                ? "Your digital storefront is 100% complete and fully optimized!"
                : "Complete all sections to build trust and rank higher in customer searches."}
            </p>
          </div>
        </div>

        {/* Small checklist display */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t md:border-t-0 md:border-l border-zinc-200/80 dark:border-zinc-700/50 pt-4 md:pt-0 md:pl-6 max-w-xl">
          {completionDetails.checklist.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(item.ref)}
              className="flex items-center gap-1.5 text-xs text-left font-medium text-zinc-600 hover:text-brand-burnt dark:text-zinc-400 dark:hover:text-brand-orange transition-colors cursor-pointer group"
            >
              <span className={`h-4 w-4 rounded-full flex items-center justify-center border ${item.done ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-zinc-300 dark:border-zinc-600 text-transparent'} transition-all`}>
                {item.done ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 group-hover:bg-brand-burnt dark:group-hover:bg-brand-orange" />}
              </span>
              <span className={item.done ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}>
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── TAB NAVIGATION ────────────────────────────────────────────── */}
      <div className="overflow-x-auto custom-scrollbar -mx-4 px-4 pb-2 md:mx-0 md:px-0 sticky top-0 z-30 bg-[#FAF7F2]/95 dark:bg-zinc-900/95 backdrop-blur-md -mt-2 pt-2">
        <div className="flex border-b border-zinc-200/80 dark:border-zinc-800/80 min-w-max">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-bold tracking-tight transition-all cursor-pointer pb-3.5 border-b-2 ${isActive
                  ? "text-brand-burnt dark:text-brand-orange border-brand-burnt dark:border-brand-orange"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 border-transparent"
                  }`}
              >
                <TabIcon className="h-4.5 w-4.5" />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-burnt dark:bg-brand-orange"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN LAYOUT GRID (2-Col Form + 1-Col Live Preview) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side Tab Form Panel */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-200/60 dark:border-zinc-700/50 shadow-card flex flex-col gap-6"
            >
              {/* ── TAB 1: OVERVIEW ─────────────────────────────────────────── */}
              {activeTab === "overview" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-black text-brand-brown dark:text-brand-orange tracking-tight">Basic Visuals & Identity</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Upload your restaurant brand assets and establish your public identity.</p>
                  </div>

                  {/* Logo and Cover Uploaders */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Logo Uploader */}
                    <div className="md:col-span-1 flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-brand-brown dark:text-brand-orange">Logo Badge</label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOverLogo(true); }}
                        onDragLeave={() => setIsDragOverLogo(false)}
                        onDrop={simulateLogoUpload}
                        className={`relative aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all overflow-hidden ${isDragOverLogo
                          ? 'border-brand-burnt bg-brand-burnt/5 dark:border-brand-orange'
                          : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-900/40'
                          }`}
                      >
                        {logoImage ? (
                          <>
                            <img src={logoImage} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-center text-white">
                              <Upload className="h-5 w-5" />
                              <span className="text-[10px] font-bold">Replace Badge</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center flex flex-col items-center">
                            <Upload className="h-8 w-8 text-zinc-400 mb-2" />
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Drag & drop logo</span>
                            <span className="text-[10px] text-zinc-400 mt-1">1:1 square ratio</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={simulateLogoUpload}
                        />
                      </div>
                    </div>

                    {/* Cover Uploader */}
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-brand-brown dark:text-brand-orange">Hero Cover Image</label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOverCover(true); }}
                        onDragLeave={() => setIsDragOverCover(false)}
                        onDrop={simulateCoverUpload}
                        className={`relative aspect-[16/7] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all overflow-hidden ${isDragOverCover
                          ? 'border-brand-burnt bg-brand-burnt/5 dark:border-brand-orange'
                          : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-900/40'
                          }`}
                      >
                        {coverImage ? (
                          <>
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover rounded-xl" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-white">
                              <Upload className="h-6 w-6" />
                              <span className="text-xs font-bold">Replace Cover Landscape</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center flex flex-col items-center">
                            <Upload className="h-8 w-8 text-zinc-400 mb-2" />
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Drag & drop cover landscape image</span>
                            <span className="text-[10px] text-zinc-400 mt-1">16:9 or 21:9 landscape</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={simulateCoverUpload}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Name and Tagline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Restaurant Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                        placeholder="e.g. Trinco Spice House"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Slogan / Tagline</label>
                      <input
                        type="text"
                        value={profile.tagline}
                        onChange={(e) => handleInputChange("tagline", e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                        placeholder="e.g. Authentic Coastal Sri Lankan Flavors"
                      />
                    </div>
                  </div>

                  {/* Reviews & Ratings Settings inside Overview */}
                  <div className="border-t border-zinc-200/80 dark:border-zinc-700/50 pt-5 flex flex-col gap-4">
                    <h3 className="text-sm font-extrabold text-brand-brown dark:text-brand-orange uppercase tracking-wider">Reviews & Ratings Display Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Public Rating (0.0 - 5.0)</label>
                        <div className="relative">
                          <Star className="absolute left-3.5 top-3 h-4 w-4 text-amber-500 fill-amber-500" />
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={profile.rating}
                            onChange={(e) => handleInputChange("rating", Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)))}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                            placeholder="e.g. 4.8"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Number of Reviews</label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                          <input
                            type="number"
                            min="0"
                            value={profile.reviewsCount}
                            onChange={(e) => handleInputChange("reviewsCount", Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                            placeholder="e.g. 184"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Short Description */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Restaurant Description</label>
                      <span className={`text-[10px] font-bold ${profile.description.length < 50 ? 'text-amber-500' : 'text-zinc-400'}`}>
                        {profile.description.length} chars (min 50 recomended)
                      </span>
                    </div>
                    <textarea
                      value={profile.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={4}
                      className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200 resize-none leading-relaxed"
                      placeholder="Tell customers about your kitchen's unique qualities, culinary specialties, history..."
                    />
                  </div>

                  {/* Primary Cuisine Types */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Primary Cuisines & Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {standardCuisines.map((cuisine) => {
                        const isSelected = profile.cuisineTypes.includes(cuisine);
                        return (
                          <button
                            key={cuisine}
                            onClick={() => toggleCuisine(cuisine)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${isSelected
                              ? 'bg-brand-burnt text-white dark:bg-brand-orange dark:text-brand-brown shadow-sm scale-[1.03]'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-700/50 dark:hover:bg-zinc-700 dark:text-zinc-300'
                              }`}
                          >
                            <span>{cuisine}</span>
                            {isSelected ? <Check className="h-3 w-3 stroke-[2.5]" /> : <Plus className="h-3 w-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Basic Contact details inside Overview */}
                  <div className="border-t border-zinc-200/80 dark:border-zinc-700/50 pt-5 flex flex-col gap-4">
                    <h3 className="text-sm font-extrabold text-brand-brown dark:text-brand-orange uppercase tracking-wider">Quick Customer Contacts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Store Primary Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                          <input
                            type="text"
                            value={profile.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                            placeholder="+94 XX XXX XXXX"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Store Public Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                          <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 text-sm font-bold text-zinc-800 dark:text-zinc-200 transition-all ${emailError
                              ? "border-red-550 focus:ring-red-550/20"
                              : "border-zinc-300 dark:border-zinc-700 focus:ring-brand-burnt dark:focus:ring-brand-orange"
                              }`}
                            placeholder="store@example.com"
                          />
                        </div>
                        {emailError && (
                          <span className="text-[11px] font-bold text-red-550 flex items-center gap-1 mt-0.5">
                            <AlertCircle size={12} />
                            {emailError}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Store Customer Support Line</label>
                        <div className="relative">
                          <Info className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                          <input
                            type="text"
                            value={profile.supportNumber}
                            onChange={(e) => handleInputChange("supportNumber", e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                            placeholder="+94 XX XXX XXXX"
                          />
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
              )}

              {/* ── TAB 2: BUSINESS INFO ───────────────────────────────────── */}
              {activeTab === "business" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-black text-brand-brown dark:text-brand-orange tracking-tight">Business Profile & Verifications</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Configure dietary certifications and fulfillment standards.</p>
                  </div>

                  {/* Dietary Certifications and Availability switches */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-brand-brown dark:text-brand-orange">Dietary Certifications</h3>

                      {/* Halal Friendly */}
                      <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 bg-zinc-50/30 dark:bg-zinc-900/10 cursor-pointer">
                        <div>
                          <div className="text-xs font-bold text-zinc-700 dark:text-zinc-200">100% Halal Certified</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">Show Halal assurance badge on customer app</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={profile.halalFriendly}
                          onChange={(e) => handleInputChange("halalFriendly", e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-300 text-brand-burnt focus:ring-brand-burnt accent-brand-burnt"
                        />
                      </label>

                      {/* Veg Friendly */}
                      <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 bg-zinc-50/30 dark:bg-zinc-900/10 cursor-pointer">
                        <div>
                          <div className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Vegetarian Options Available</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">Highlight veggie/vegan friendliness</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={profile.vegetarianFriendly}
                          onChange={(e) => handleInputChange("vegetarianFriendly", e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-300 text-brand-burnt focus:ring-brand-burnt accent-brand-burnt"
                        />
                      </label>
                    </div>

                    <div className="flex flex-col gap-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-brand-brown dark:text-brand-orange">Fulfillment Methods</h3>



                      {/* Takeaway Toggle */}
                      <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 bg-zinc-50/30 dark:bg-zinc-900/10 cursor-pointer">
                        <div>
                          <div className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Takeaway / Pick-up</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">Allow customers to order and pick up themselves</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={profile.takeaway}
                          onChange={(e) => handleInputChange("takeaway", e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-300 text-brand-burnt focus:ring-brand-burnt accent-brand-burnt"
                        />
                      </label>

                      {/* Delivery Toggle */}
                      <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 bg-zinc-50/30 dark:bg-zinc-900/10 cursor-pointer">
                        <div>
                          <div className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Home Delivery Services</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">Deliver food directly to customer's doorsteps</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={profile.delivery}
                          onChange={(e) => handleInputChange("delivery", e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-300 text-brand-burnt focus:ring-brand-burnt accent-brand-burnt"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 3: LOCATION ────────────────────────────────────────── */}
              {activeTab === "location" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-black text-brand-brown dark:text-brand-orange tracking-tight">Geographic Location & Radius</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Position your store on the map and calibrate delivery scope.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Street Address</label>
                      <input
                        type="text"
                        value={profile.streetAddress}
                        onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                        placeholder="e.g. 42 Dockyard Road"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">City</label>
                        <input
                          type="text"
                          value={profile.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                          className="px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                          placeholder="e.g. Trincomalee"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">District</label>
                        <input
                          type="text"
                          value={profile.district}
                          onChange={(e) => handleInputChange("district", e.target.value)}
                          className="px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                          placeholder="District"
                        />
                      </div>

                    </div>
                  </div>

                  {/* Coordinates & Detect GPS */}
                  <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Latitude Coordinate</label>
                        <input
                          type="text"
                          value={profile.lat}
                          onChange={(e) => handleInputChange("lat", e.target.value)}
                          className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                          placeholder="e.g. 8.5714"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Longitude Coordinate</label>
                        <input
                          type="text"
                          value={profile.lng}
                          onChange={(e) => handleInputChange("lng", e.target.value)}
                          className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                          placeholder="e.g. 81.2335"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="px-4 py-2.5 h-[42px] rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border border-brand-burnt bg-brand-burnt/5 text-brand-burnt dark:border-brand-orange dark:text-brand-orange hover:bg-brand-burnt/10 dark:hover:bg-brand-orange/10 disabled:opacity-75 transition-colors cursor-pointer"
                    >
                      <MapPin className={`h-4 w-4 ${isDetectingLocation ? 'animate-bounce' : ''}`} />
                      <span>{isDetectingLocation ? "Detecting GPS..." : "Detect Current Location"}</span>
                    </button>
                  </div>

                  {/* Modern map visualizer card */}
                  <div className="relative h-44 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    {/* Glowing background representing radar map */}
                    <div className="absolute inset-0 bg-radial-gradient from-zinc-800 via-zinc-900 to-black opacity-90" />
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:20px_20px]" />

                    {/* Radar pulsing effect around coordinates */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="relative flex h-10 w-10 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-burnt/35 dark:bg-brand-orange/35 opacity-75" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-burnt dark:bg-brand-orange" />
                      </div>
                      <div className="mt-2 text-center text-white/95 text-[10px] font-bold tracking-widest bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800">
                        GPS RADAR: {profile.lat || "8.5714"}° N, {profile.lng || "81.2335"}° E
                      </div>
                    </div>
                  </div>

                  {/* Delivery Radius Slider */}
                  <div className="flex flex-col gap-2.5 border-t border-zinc-200/80 dark:border-zinc-700/50 pt-5">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">Store Delivery Radius</label>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Maximum straight-line distance you deliver to</p>
                      </div>
                      <span className="text-sm font-extrabold text-brand-burnt dark:text-brand-orange bg-brand-burnt/10 dark:bg-brand-orange/10 px-3 py-1 rounded-lg">
                        {profile.deliveryRadius} Kilometers (km)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="25"
                      step="1"
                      value={profile.deliveryRadius}
                      onChange={(e) => handleInputChange("deliveryRadius", parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 cursor-pointer accent-brand-burnt dark:accent-brand-orange"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 font-bold">
                      <span>1 km (Ultra local)</span>
                      <span>12 km (Standard)</span>
                      <span>25 km (Regional)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 4: DELIVERY SETTINGS ───────────────────────────────── */}
              {activeTab === "delivery" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-black text-brand-brown dark:text-brand-orange tracking-tight">Delivery Pricing & Logistics</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Configure logistics, delivery costs, thresholds, and calculate simulation.</p>
                  </div>

                  {/* Logistics fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Average Preparation & Delivery Time</label>
                      <input
                        type="text"
                        value={profile.estimatedDeliveryTime}
                        onChange={(e) => handleInputChange("estimatedDeliveryTime", e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                        placeholder="e.g. 25-35 min"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Base Delivery Fee (LKR)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-xs font-extrabold text-zinc-400">LKR</span>
                        <input
                          type="number"
                          value={profile.deliveryFee}
                          onChange={(e) => handleInputChange("deliveryFee", parseFloat(e.target.value) || 0)}
                          className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                          placeholder="e.g. 150"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Minimum Order Value (LKR)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-xs font-extrabold text-zinc-400">LKR</span>
                        <input
                          type="number"
                          value={profile.minOrder}
                          onChange={(e) => handleInputChange("minOrder", parseFloat(e.target.value) || 0)}
                          className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                          placeholder="e.g. 500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Free Delivery Threshold (LKR)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-xs font-extrabold text-zinc-400">LKR</span>
                        <input
                          type="number"
                          value={profile.freeDeliveryThreshold}
                          onChange={(e) => handleInputChange("freeDeliveryThreshold", parseFloat(e.target.value) || 0)}
                          className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                          placeholder="e.g. 2500"
                        />
                      </div>
                    </div>
                  </div>


                </div>
              )}

              {/* ── TAB 5: OPENING HOURS ───────────────────────────────────── */}
              {activeTab === "hours" && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-brand-brown dark:text-brand-orange tracking-tight">Weekly Store Schedule</h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Set weekly operational schedules and active overrides.</p>
                    </div>
                    <button
                      type="button"
                      onClick={copyHoursToAllDays}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-brand-burnt/30 text-brand-burnt dark:border-brand-orange/30 dark:text-brand-orange hover:bg-brand-burnt/5 transition-colors cursor-pointer"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>Copy Mon to All Days</span>
                    </button>
                  </div>

                  {/* Holiday / Closed Mode options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-zinc-200/80 dark:border-zinc-700/50 pb-5">
                    <label className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${profile.holidayMode
                      ? 'border-amber-500 bg-amber-500/5'
                      : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/50'
                      }`}>
                      <div>
                        <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full bg-amber-500 ${profile.holidayMode ? 'animate-pulse' : ''}`} />
                          Holiday Mode (Temporary Close)
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Toggle when closed for national/local holidays</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.holidayMode}
                        onChange={(e) => handleInputChange("holidayMode", e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-zinc-300 text-amber-500 focus:ring-amber-500 accent-amber-500"
                      />
                    </label>

                    <label className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${profile.temporaryClosure
                      ? 'border-red-500 bg-red-500/5'
                      : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/50'
                      }`}>
                      <div>
                        <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full bg-red-500 ${profile.temporaryClosure ? 'animate-pulse' : ''}`} />
                          Force Shutdown / Temporary Closure
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Close instantly for emergency maintenance/kitchen reset</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.temporaryClosure}
                        onChange={(e) => handleInputChange("temporaryClosure", e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-zinc-300 text-red-500 focus:ring-red-500 accent-red-500"
                      />
                    </label>
                  </div>

                  {/* Weekly Day rows */}
                  <div className="flex flex-col gap-3">
                    {Object.entries(profile.weeklyHours).map(([day, hrs]) => (
                      <div
                        key={day}
                        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl border transition-colors ${hrs.open
                          ? 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/40'
                          : 'border-zinc-150 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 opacity-70'
                          }`}
                      >
                        {/* Day & Open Status Toggle */}
                        <div className="flex items-center justify-between sm:justify-start gap-4">
                          <span className="text-xs font-extrabold w-24 text-zinc-700 dark:text-zinc-300">{day}</span>
                          <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={hrs.open}
                              onChange={(e) => handleDayHourChange(day, "open", e.target.checked)}
                              className="h-4 w-4 rounded text-brand-burnt focus:ring-brand-burnt accent-brand-burnt"
                            />
                            <span className={`text-[10px] font-bold ${hrs.open ? 'text-emerald-500' : 'text-zinc-400'}`}>
                              {hrs.open ? "OPENING" : "CLOSED"}
                            </span>
                          </label>
                        </div>

                        {/* Hours inputs if open */}
                        {hrs.open ? (
                          <div className="flex items-center gap-2 mt-3.5 sm:mt-0">
                            <input
                              type="text"
                              value={hrs.from}
                              onChange={(e) => handleDayHourChange(day, "from", e.target.value)}
                              className="w-24 text-center px-2.5 py-1.5 text-xs font-bold border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-burnt"
                              placeholder="08:00 AM"
                            />
                            <span className="text-xs font-bold text-zinc-400">to</span>
                            <input
                              type="text"
                              value={hrs.to}
                              onChange={(e) => handleDayHourChange(day, "to", e.target.value)}
                              className="w-24 text-center px-2.5 py-1.5 text-xs font-bold border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-burnt"
                              placeholder="10:00 PM"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-zinc-400 italic text-right mt-2 sm:mt-0">Store closed all day</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB 7: SOCIAL LINKS ────────────────────────────────────── */}
              {activeTab === "social" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-black text-brand-brown dark:text-brand-orange tracking-tight">Social Accounts & Website</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Promote social handles and connect customer redirects.</p>
                  </div>

                  {/* Social lists */}
                  <div className="flex flex-col gap-4">
                    {/* Website */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <Globe className="h-4 w-4 text-blue-500" />
                        Official Web Domain
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={profile.website}
                          onChange={(e) => handleInputChange("website", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                          placeholder="e.g. https://trincospicehouse.com"
                        />
                        {profile.website.startsWith("https://") && (
                          <span className="absolute right-3.5 top-3.5"><CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /></span>
                        )}
                      </div>
                    </div>

                    {/* Facebook */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <Facebook className="h-4 w-4 text-blue-600" />
                        Facebook Page URL
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={profile.facebook}
                          onChange={(e) => handleInputChange("facebook", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                          placeholder="e.g. https://facebook.com/brand"
                        />
                        {profile.facebook.startsWith("https://") && (
                          <span className="absolute right-3.5 top-3.5"><CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /></span>
                        )}
                      </div>
                    </div>

                    {/* Instagram */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <Instagram className="h-4 w-4 text-pink-500" />
                        Instagram Handle URL
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={profile.instagram}
                          onChange={(e) => handleInputChange("instagram", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                          placeholder="e.g. https://instagram.com/brand"
                        />
                        {profile.instagram.startsWith("https://") && (
                          <span className="absolute right-3.5 top-3.5"><CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /></span>
                        )}
                      </div>
                    </div>

                    {/* YouTube */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <Youtube className="h-4 w-4 text-red-600" />
                        YouTube channel URL
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={profile.youtube}
                          onChange={(e) => handleInputChange("youtube", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                          placeholder="e.g. https://youtube.com/channel"
                        />
                        {profile.youtube.startsWith("https://") && (
                          <span className="absolute right-3.5 top-3.5"><CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /></span>
                        )}
                      </div>
                    </div>

                    {/* TikTok/Shorts handle */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <Compass className="h-4 w-4 text-zinc-800 dark:text-zinc-200" />
                        TikTok Channel URL
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={profile.tiktok}
                          onChange={(e) => handleInputChange("tiktok", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-brand-burnt dark:focus:ring-brand-orange text-sm font-bold text-zinc-800 dark:text-zinc-200"
                          placeholder="e.g. https://tiktok.com/@handle"
                        />
                        {profile.tiktok.startsWith("https://") && (
                          <span className="absolute right-3.5 top-3.5"><CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 8: SETTINGS & GENERAL POLICY ───────────────────────── */}
              {activeTab === "settings" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-black text-brand-brown dark:text-brand-orange tracking-tight">System Controls & Preferences</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Configure administrative switches, visibility toggles, and vacation locks.</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Accept Orders */}
                    <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 bg-zinc-50/30 dark:bg-zinc-900/10 cursor-pointer">
                      <div className="flex-1 pr-4">
                        <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                          Accepting Incoming Orders
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">If disabled, the kitchen will immediately show as "Busy" and refuse checkouts.</p>
                      </div>
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.acceptOrders}
                          onChange={(e) => handleInputChange("acceptOrders", e.target.checked)}
                          className="sr-only peer"
                          id="toggle-accept-orders"
                        />
                        <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                      </div>
                    </label>

                    {/* Show Publicly */}
                    <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 bg-zinc-50/30 dark:bg-zinc-900/10 cursor-pointer">
                      <div className="flex-1 pr-4">
                        <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                          <Eye className="h-4.5 w-4.5 text-blue-500" />
                          Publish to Public App Storefront
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">Unpublish to hide your store from browse/search indexing (useful for massive resets).</p>
                      </div>
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.showPublicly}
                          onChange={(e) => handleInputChange("showPublicly", e.target.checked)}
                          className="sr-only peer"
                          id="toggle-show-publicly"
                        />
                        <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-burnt" />
                      </div>
                    </label>

                    {/* Vacation Mode */}
                    <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 bg-zinc-50/30 dark:bg-zinc-900/10 cursor-pointer">
                      <div className="flex-1 pr-4">
                        <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                          <Lock className="h-4.5 w-4.5 text-amber-500" />
                          Vacation Lock Status
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">Locks checkout indefinitely and displays customized holiday message.</p>
                      </div>
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.vacationMode}
                          onChange={(e) => handleInputChange("vacationMode", e.target.checked)}
                          className="sr-only peer"
                          id="toggle-vacation-mode"
                        />
                        <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                      </div>
                    </label>



                    {/* Cash on Delivery */}
                    <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 bg-zinc-50/30 dark:bg-zinc-900/10 cursor-pointer">
                      <div className="flex-1 pr-4">
                        <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                          <DollarSign className="h-4.5 w-4.5 text-green-600" />
                          Allow Cash on Delivery (COD) Checkouts
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">Accept cash at doorstep. If disabled, only card payments are supported.</p>
                      </div>
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.cashOnDelivery}
                          onChange={(e) => handleInputChange("cashOnDelivery", e.target.checked)}
                          className="sr-only peer"
                          id="toggle-cod"
                        />
                        <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                      </div>
                    </label>


                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── RIGHT COLUMN: STICKY LIVE CUSTOMER PREVIEW (DESKTOP) ── */}
        <div className="hidden lg:block lg:col-span-4 sticky top-[100px]">
          <div className="border border-zinc-200/80 dark:border-zinc-700/50 bg-white/95 dark:bg-zinc-800/90 backdrop-blur-md rounded-2xl overflow-hidden shadow-card">
            {/* Header branding representing preview */}
            <div className="bg-brand-brown dark:bg-zinc-900 text-white px-4 py-3 flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800">
              <span className="text-xs font-black uppercase tracking-wider text-brand-orange">Customer App View</span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold">Real-time Preview</span>
            </div>

            <RestaurantMockAppCard
              profile={profile}
              logoImage={logoImage}
              coverImage={coverImage}
              currentStatus={currentStatus}
              restaurantId={activeRestaurant.id}
            />
          </div>
        </div>
      </div>

      {/* ── MOBILE PREVIEW OVERLAY MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {isMobilePreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-zinc-800 rounded-3xl overflow-hidden shadow-2xl max-w-md w-full border border-zinc-200/80 dark:border-zinc-700"
            >
              <div className="bg-brand-brown dark:bg-zinc-900 text-white px-5 py-4 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-brand-orange">Customer View</span>
                <button
                  type="button"
                  onClick={() => setIsMobilePreviewOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-white/80 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[80vh]">
                <RestaurantMockAppCard
                  profile={profile}
                  logoImage={logoImage}
                  coverImage={coverImage}
                  currentStatus={currentStatus}
                  restaurantId={activeRestaurant.id}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── SUB-COMPONENT: REAL-TIME CUSTOMER INTERFACE CARD ─────────────────
interface RestaurantMockAppCardProps {
  profile: ProfileState;
  logoImage: string;
  coverImage: string;
  currentStatus: { label: string; color: string; text: string; desc: string };
  restaurantId: string;
}

function RestaurantMockAppCard({ profile, logoImage, coverImage, currentStatus, restaurantId }: RestaurantMockAppCardProps) {
  return (
    <div className="flex flex-col select-none">
      {/* Cover image landscape */}
      <div className="relative aspect-[16/8] bg-zinc-800 overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
            No cover image uploaded
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        {/* Floating status flag on cover */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[9px] font-bold text-white shadow-sm">
          <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.color} animate-pulse`} />
          {currentStatus.desc}
        </div>

        {/* Back and heart icons mimicking customer view */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white"><ChevronRight className="h-4 w-4 rotate-180" /></div>
        </div>

        {/* Overlay text */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <div className="flex-1 flex gap-2.5 items-center">
            {/* Logo thumbnail */}
            <div className="h-10 w-10 rounded-lg bg-white border border-white/35 shadow-md flex-shrink-0 overflow-hidden">
              {logoImage ? (
                <img src={logoImage} alt="Logo Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-zinc-200 flex items-center justify-center text-[10px] text-zinc-500 font-extrabold">TB</div>
              )}
            </div>
            {/* Restaurant Title on Cover */}
            <div className="overflow-hidden">
              <h4 className="text-white text-xs font-black tracking-tight line-clamp-1">
                {profile.name || "Restaurant Name"}
              </h4>
              <p className="text-[9px] text-zinc-300 line-clamp-1 mt-0.5">
                {profile.tagline || "Tagline"}
              </p>
            </div>
          </div>

          <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white"><Heart className="h-3.5 w-3.5 fill-red-500 stroke-red-500" /></div>
        </div>
      </div>

      {/* Main information content block */}
      <div className="p-4 flex flex-col gap-3 bg-zinc-50 dark:bg-zinc-900/60">
        {/* Rating and Cuisine header */}
        <div className="flex items-center justify-between text-xs border-b border-zinc-200/80 dark:border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200 font-bold">
            <span className="text-amber-500 text-sm">★</span>
            <span>{profile.rating.toFixed(1)}</span>
            <span className="text-zinc-400 text-[10px] font-normal">({profile.reviewsCount} reviews)</span>
          </div>
          <div className="text-[10px] font-bold text-zinc-400">
            {profile.cuisineTypes.slice(0, 3).join(", ") || "No cuisines configured"}
          </div>
        </div>

        {/* Location snippet */}
        <div className="flex items-start gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
          <MapPin className="h-3.5 w-3.5 text-zinc-400 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">
            {profile.streetAddress ? `${profile.streetAddress}, ${profile.city}` : "Street address not configured"}
          </span>
        </div>

        {/* Logistics row */}
        <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-zinc-200/80 dark:border-zinc-800/80 text-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-extrabold uppercase text-zinc-400 tracking-wider">Delivery Time</span>
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {profile.estimatedDeliveryTime || "25-35 min"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 border-l border-r border-zinc-200/80 dark:border-zinc-800/80">
            <span className="text-[8px] font-extrabold uppercase text-zinc-400 tracking-wider">Delivery Fee</span>
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {profile.delivery
                ? profile.deliveryFee === 0
                  ? "Free"
                  : `LKR ${profile.deliveryFee}`
                : "Unavailable"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-extrabold uppercase text-zinc-400 tracking-wider">Min. Order</span>
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              LKR {profile.minOrder}
            </span>
          </div>
        </div>

        {/* Short description block */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-extrabold">Our Culinary Philosophy</span>
          <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-3">
            {profile.description || "Describe your kitchen to customers here."}
          </p>
        </div>

        {/* Operating hours today info */}
        <div className="bg-white dark:bg-zinc-850 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 flex justify-between items-center text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            <span>Today's Hours</span>
          </div>
          <span>{profile.openingTime} - {profile.closingTime}</span>
        </div>

        {/* Quick redirect links — all configured social platforms */}
        {(profile.website || profile.facebook || profile.instagram || profile.youtube || profile.tiktok) && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-wider">Follow Us:</span>
            <div className="flex items-center gap-1.5">
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Official Website"
                  className="h-6 w-6 rounded-full bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center text-blue-500 transition-colors cursor-pointer"
                >
                  <Globe className="h-3.5 w-3.5" />
                </a>
              )}
              {profile.facebook && (
                <a
                  href={profile.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook Page"
                  className="h-6 w-6 rounded-full bg-blue-600/10 hover:bg-blue-600/20 flex items-center justify-center text-blue-600 transition-colors cursor-pointer"
                >
                  <Facebook className="h-3.5 w-3.5" />
                </a>
              )}
              {profile.instagram && (
                <a
                  href={profile.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram"
                  className="h-6 w-6 rounded-full bg-pink-500/10 hover:bg-pink-500/20 flex items-center justify-center text-pink-500 transition-colors cursor-pointer"
                >
                  <Instagram className="h-3.5 w-3.5" />
                </a>
              )}
              {profile.youtube && (
                <a
                  href={profile.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="YouTube Channel"
                  className="h-6 w-6 rounded-full bg-red-600/10 hover:bg-red-600/20 flex items-center justify-center text-red-600 transition-colors cursor-pointer"
                >
                  <Youtube className="h-3.5 w-3.5" />
                </a>
              )}
              {profile.tiktok && (
                <a
                  href={profile.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="TikTok"
                  className="h-6 w-6 rounded-full bg-zinc-800/10 hover:bg-zinc-800/20 dark:bg-zinc-200/10 dark:hover:bg-zinc-200/20 flex items-center justify-center text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  <Compass className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Interactive customer order CTA button */}
        <Link
          to="/restaurant/$id"
          params={{ id: restaurantId }}
          className={`w-full block ${(!profile.acceptOrders || profile.temporaryClosure || profile.holidayMode) ? "pointer-events-none" : ""}`}
        >
          <button
            type="button"
            disabled={!profile.acceptOrders || profile.temporaryClosure || profile.holidayMode}
            className="w-full bg-brand-burnt hover:bg-brand-burnt/95 dark:bg-brand-orange text-white dark:text-brand-brown py-2.5 rounded-xl text-xs font-extrabold transition-all mt-2 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 border-none cursor-pointer"
          >
            {!profile.acceptOrders || profile.temporaryClosure || profile.holidayMode
              ? "Kitchen Closed for Ordering"
              : "Browse Our Culinary Menu"}
          </button>
        </Link>
      </div>
    </div>
  );
}

export default RestaurantProfile;
