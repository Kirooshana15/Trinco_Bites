import { Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Store, LogOut, Menu, X, ChevronRight, Bell,
  LayoutDashboard, ShoppingBag, ChefHat, Grid, 
  Users, Star, Ticket, TrendingUp, Truck, Wallet, 
  User, Settings, Gift
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRestaurants } from "@/context/RestaurantContext";
import { useOrders } from "@/context/OrderContext";
import { buildRestaurantAlerts } from "@/utils/restaurantNotifications";
import { C } from "@/utils/theme";
import logo from "@/assets/logo.png";

const getShortName = (name: string) => {
  const mapping: Record<string, string> = {
    "Dashboard": "Dashboard",
    "Order Management": "Orders",
    "Menu Management": "Menu",
    "Category Management": "Categories",
    "Customer Management": "Customers",
    "Reviews & Ratings": "Reviews",
    "Offers": "Offers",
    "Analytics & Reports": "Analytics",
    "Restaurant Profile": "Profile",
    "Notifications": "Alerts",
    "Payment & Wallet": "Wallet",
  };
  return mapping[name] || name.split(" ")[0];
};

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

interface SidebarGroup {
  groupName: string;
  items: SidebarItem[];
}

export function RestaurantAdminLayout() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { user, isAuthenticated, logout } = useAuth();
  const { findRestaurant, offers } = useRestaurants();
  const { orders } = useOrders();
  const currentRestaurant = user?.restaurantId ? findRestaurant(user.restaurantId) : undefined;
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Premium operational features states
  const [isScrolled, setIsScrolled] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  const notifications = useMemo(
    () =>
      buildRestaurantAlerts({
        orders,
        offers,
        restaurantId: currentRestaurant?.id,
      })
        .slice(0, 8)
        .map((alert) => ({
          id: alert.id,
          title: alert.title,
          message: alert.description,
          timestamp: alert.time,
          type: alert.type === "offers" ? "coupon" : alert.type === "payments" ? "payment" : "order",
          isUnread: !alert.read && !readNotificationIds.includes(alert.id),
          orderId: alert.orderId,
        })),
    [orders, offers, currentRestaurant?.id, readNotificationIds]
  );

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (e.currentTarget.scrollTop > 5) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  const handleMarkAllRead = () => {
    setReadNotificationIds(notifications.map((notification) => notification.id));
  };

  const handleNotificationClick = (notification: { id: string; orderId?: string }) => {
    setReadNotificationIds((prev) =>
      prev.includes(notification.id) ? prev : [...prev, notification.id]
    );
    setIsNotificationOpen(false);

    if (notification.orderId) {
      navigate({
        to: "/restaurant/orders",
        search: { orderId: notification.orderId } as any,
      });
    }
  };

  const unreadCount = notifications.filter(n => n.isUnread).length;

  useEffect(() => {
    // Route guard: only restaurant admins allowed
    if (!isAuthenticated) {
      navigate({ to: "/business_login" });
    } else if (user?.role !== "restaurant_admin") {
      // Redirect other roles to their proper places
      if (user?.role === "main_admin") {
        navigate({ to: "/admin/dashboard" });
      } else {
        navigate({ to: "/home" });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/business_login" });
  };

  if (!isAuthenticated || user?.role !== "restaurant_admin") {
    return null; // Don't flash dashboard while redirecting
  }

  // Grouped Navigation Structure
  const navigationGroups: SidebarGroup[] = [
    {
      groupName: "Core Operations",
      items: [
        { name: "Dashboard", path: "/restaurant/dashboard", icon: LayoutDashboard },
        { name: "Order Management", path: "/restaurant/orders", icon: ShoppingBag },
        { name: "Menu Management", path: "/restaurant/menu", icon: ChefHat },
        { name: "Category Management", path: "/restaurant/categories", icon: Grid },
      ]
    },
    {
      groupName: "Customer Experience",
      items: [
        { name: "Customer Management", path: "/restaurant/customers", icon: Users },
        { name: "Reviews & Ratings", path: "/restaurant/reviews", icon: Star },
      ]
    },
    {
      groupName: "Marketing & Growth",
      items: [
        { name: "Offers", path: "/restaurant/offers", icon: Gift },
        { name: "Analytics & Reports", path: "/restaurant/analytics", icon: TrendingUp },
      ]
    },
    {
      groupName: "Management & Settings",
      items: [
        { name: "Restaurant Profile", path: "/restaurant/profile", icon: Store },
        { name: "Notifications", path: "/restaurant/notifications", icon: Bell },
        { name: "Payment & Wallet", path: "/restaurant/payments", icon: Wallet },
      ]
    }
  ];

  const sidebarVariants = {
    expanded: { width: 280, transition: { duration: 0.3, ease: "easeInOut" as const } },
    collapsed: { width: 88, transition: { duration: 0.3, ease: "easeInOut" as const } }
  };

  const textVariants = {
    expanded: { opacity: 1, x: 0, display: "block", transition: { delay: 0.1, duration: 0.2 } },
    collapsed: { opacity: 0, x: -10, transitionEnd: { display: "none" }, transition: { duration: 0.1 } }
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full py-6 select-none">
      {/* Brand Header */}
      <div 
        onClick={() => !isMobile && setIsSidebarCollapsed(!isSidebarCollapsed)}
        title={!isMobile ? (isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar") : undefined}
        className={`mb-8 flex items-center transition-all duration-300 ${!isMobile ? "cursor-pointer hover:opacity-85" : ""} ${
          isSidebarCollapsed && !isMobile 
            ? 'px-2 justify-center' 
            : 'px-6 justify-between'
        }`}
      >
        <div className="flex items-center gap-3">
          <img 
            src={logo} 
            alt="Trinco Bites Logo" 
            className="h-10 w-10 object-contain rounded-xl shadow-glow shrink-0" 
          />
          {(!isSidebarCollapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-[#4E3E2A]">Trinco Bites</span>
              <span className="text-[10px] font-bold text-[#71A066] uppercase tracking-widest -mt-1">Restaurant Hub</span>
            </div>
          )}
        </div>
        {isMobile && (
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg text-[#4E3E2A] hover:bg-[#4E3E2A]/10"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 ${
        isSidebarCollapsed && !isMobile 
          ? 'px-2 space-y-4' 
          : 'px-4 space-y-6'
      }`}>
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1.5">
            {(!isSidebarCollapsed || isMobile) ? (
              <h3 className="px-3 text-[10px] font-extrabold tracking-widest text-[#4E3E2A]/50 uppercase mb-2">
                {group.groupName}
              </h3>
            ) : (
              groupIdx > 0 && <div className="h-px bg-[#4E3E2A]/10 my-3 mx-2" />
            )}
            
            <ul className={`space-y-1 ${isSidebarCollapsed && !isMobile ? 'flex flex-col items-center gap-1.5' : ''}`}>
              {group.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                
                if (isSidebarCollapsed && !isMobile) {
                  return (
                    <li key={itemIdx} className="w-full flex justify-center">
                      <Link
                        to={item.path}
                        className="group flex flex-col items-center justify-center w-full py-1 relative cursor-pointer"
                      >
                        {/* Active Line Indicator on Right Edge of Item */}
                        {isActive && (
                          <motion.div 
                            layoutId="activeIndicatorCollapsed"
                            className="absolute right-0 w-[3px] h-7 rounded-l bg-[#71A066]"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        
                        {/* Icon Card Container */}
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-sm ${
                          isActive 
                            ? "bg-[#71A066] text-white" 
                            : "bg-[#71A066]/10 text-[#71A066] group-hover:bg-[#71A066]/20"
                        }`}>
                          <Icon size={19} />
                        </div>
                        
                        {/* Label underneath */}
                        <span className="text-[9px] font-extrabold mt-1 text-[#71A066] tracking-tight text-center truncate max-w-full px-1">
                          {getShortName(item.name)}
                        </span>
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={itemIdx}>
                    <Link
                      to={item.path}
                      onClick={() => isMobile && setIsMobileOpen(false)}
                      className={`group flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-tight transition-all duration-200 relative ${
                        isActive 
                          ? "bg-[#FFFCF5] text-[#4E3E2A] shadow-sm" 
                          : "text-[#4E3E2A]/85 hover:bg-[#FFFCF5]/50 hover:text-[#4E3E2A]"
                      }`}
                    >
                      {/* Active Sidebar Indicator Left Border pill */}
                      {isActive && (
                        <motion.div 
                          layoutId="activeIndicator"
                          className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-md bg-[#71A066]"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      
                      <div className={`p-1.5 rounded-lg transition-transform duration-200 group-hover:scale-110 shrink-0 ${
                        isActive ? "text-[#71A066]" : "text-[#4E3E2A]/60 group-hover:text-[#4E3E2A]"
                      }`}>
                        <Icon size={18} />
                      </div>

                      <span className="truncate">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Sidebar Footer / User Banner */}
      <div className={`pt-4 border-t border-[#4E3E2A]/10 transition-all duration-300 ${
        isSidebarCollapsed && !isMobile 
          ? 'px-2' 
          : 'px-4'
      }`}>
        {(!isSidebarCollapsed || isMobile) ? (
          <div className="bg-[#FFFCF5]/40 backdrop-blur-sm rounded-2xl p-3 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-[#71A066]/10 text-[#71A066] flex items-center justify-center font-bold text-sm shadow-sm shrink-0 overflow-hidden border border-[#71A066]/20">
                {currentRestaurant?.image ? (
                  <img
                    src={currentRestaurant.image}
                    alt={`${currentRestaurant.name} logo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || "A"
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-xs text-[#4E3E2A] truncate">{user?.name || "Restaurant Hub"}</span>
                <span className="text-[10px] text-[#4E3E2A]/70 truncate font-semibold">{user?.email}</span>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#EF4444]/10 hover:bg-[#DC2626] text-[#B91C1C] hover:text-white border border-[#EF4444]/25 hover:border-[#DC2626] font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DC2626]"
            >
              <LogOut size={13} /> Log Out
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="h-10 w-10 rounded-full bg-[#71A066]/10 text-[#71A066] flex items-center justify-center font-bold text-sm shadow-sm transition-all duration-200 hover:scale-105 overflow-hidden border border-[#71A066]/20">
              {currentRestaurant?.image ? (
                <img
                  src={currentRestaurant.image}
                  alt={`${currentRestaurant.name} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "A"
              )}
            </div>
            
            <button 
              onClick={handleLogout}
              className="group flex flex-col items-center justify-center w-full py-1 relative cursor-pointer bg-transparent border-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DC2626] rounded-xl"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#EF4444]/10 text-[#B91C1C] border border-[#EF4444]/25 flex items-center justify-center transition-all duration-200 group-hover:bg-[#DC2626] group-hover:text-white group-hover:border-[#DC2626] group-hover:scale-105 shadow-sm">
                <LogOut size={18} />
              </div>
              <span className="text-[9px] font-extrabold mt-1 text-[#B91C1C] tracking-tight">
                Logout
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-soft font-sans overflow-hidden">
      
      {/* 1. Desktop Sidebar Container */}
      <motion.aside
        initial={false}
        animate={isSidebarCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        className="hidden md:flex flex-col h-screen sticky top-0 bg-gradient-to-b from-[#F7E5C3] to-[#E9C88C] border-r border-[#4E3E2A]/10 z-30 shadow-sm overflow-hidden shrink-0"
      >
        <SidebarContent />
      </motion.aside>
 
      {/* 2. Mobile Drawer Navigation Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-gradient-to-b from-[#F7E5C3] to-[#E9C88C] z-50 md:hidden shadow-2xl flex flex-col"
            >
              <SidebarContent isMobile={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
 
      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Universal Top Header */}
        <header className={`h-16 flex items-center justify-between px-6 sticky top-0 z-20 shrink-0 transition-all duration-300 ${
          isScrolled 
            ? 'shadow-md bg-[#FAF7F2]/95 border-b border-[#4E3E2A]/15 backdrop-blur-md' 
            : 'bg-[#FAF7F2]/80 backdrop-blur-md border-b border-[#4E3E2A]/10'
        }`}>
          <div className="flex items-center gap-3">
            {/* Mobile Menu Trigger */}
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 rounded-xl text-[#4E3E2A] hover:bg-[#4E3E2A]/10 transition-colors"
            >
              <Menu size={20} />
            </button>
            

 
            {/* Path Header info */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4E3E2A]/50">
              <span className="hover:text-[#71A066] cursor-pointer">Restaurant Hub</span>
              <ChevronRight size={12} className="text-[#4E3E2A]/30" />
              <span className="text-[#71A066] capitalize font-bold">
                {currentPath.split("/").pop()?.replace("-", " ") || "Dashboard"}
              </span>
            </div>
          </div>
 
          <div className="flex items-center gap-4">
            {/* Store availability toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsStoreOpen(!isStoreOpen)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none shadow-inner shrink-0 ${
                  isStoreOpen 
                    ? "bg-[#71A066]/20 border border-[#71A066]/30 hover:bg-[#71A066]/30" 
                    : "bg-[#EF4444]/15 border border-[#EF4444]/25 hover:bg-[#EF4444]/25"
                }`}
                aria-label="Toggle store status"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 flex items-center justify-center ${
                    isStoreOpen ? "translate-x-6 text-[#71A066]" : "translate-x-1 text-[#EF4444]"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isStoreOpen ? "bg-[#71A066]" : "bg-[#EF4444]"}`} />
                </span>
              </button>
              <div className="hidden sm:flex flex-col text-left select-none pointer-events-none shrink-0">
                <span className={`text-[9px] font-black tracking-wider leading-none uppercase flex items-center gap-1 ${
                  isStoreOpen ? "text-[#71A066]" : "text-[#EF4444]"
                }`}>
                  {isStoreOpen ? "🟢 Open" : "🔴 Closed"}
                </span>
                <span className="text-[7px] text-[#4E3E2A]/50 font-bold uppercase tracking-widest mt-0.5">Availability</span>
              </div>
            </div>

            <div className="h-6 w-px bg-[#4E3E2A]/10" />

            {/* Quick Notify bell icon & Dropdown Panel */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={`p-2 rounded-xl transition-all duration-200 relative shrink-0 ${
                  isNotificationOpen 
                    ? "bg-[#71A066] text-white shadow-md scale-105" 
                    : "bg-[#71A066]/5 hover:bg-[#71A066]/10 text-[#71A066]"
                }`}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-[#EF4444] text-white text-[8px] font-black flex items-center justify-center border border-[#FAF7F2] shadow-sm animate-pulse px-1">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationOpen && (
                  <>
                    {/* Click-outside dismissal overlay */}
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setIsNotificationOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#FAF7F2] border border-[#4E3E2A]/10 rounded-2xl shadow-xl z-50 overflow-hidden"
                    >
                      {/* Dropdown Header */}
                      <div className="p-3.5 border-b border-[#4E3E2A]/10 bg-[#FFFCF5] flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-[13px] text-[#4E3E2A] tracking-tight">Recent Alerts</span>
                          <span className="text-[9px] text-[#4E3E2A]/50 font-bold uppercase tracking-wider">{unreadCount} Pending</span>
                        </div>
                        {unreadCount > 0 && (
                          <button 
                            onClick={handleMarkAllRead}
                            className="text-[9px] font-extrabold text-[#71A066] hover:text-[#71A066]/80 bg-[#71A066]/5 px-2 py-1 rounded-lg transition-colors border border-[#71A066]/10 uppercase tracking-wider"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Scrollable list */}
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar divide-y divide-[#4E3E2A]/5">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center flex flex-col items-center justify-center">
                            <Bell size={20} className="text-[#4E3E2A]/20 mb-2" />
                            <span className="text-[11px] font-bold text-[#4E3E2A]/40">No alerts found</span>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-3.5 flex gap-3 text-left hover:bg-[#FFFCF5] transition-colors cursor-pointer relative group ${
                                notif.isUnread ? "bg-[#71A066]/3" : ""
                              }`}
                            >
                              {/* Left dot for unread status */}
                              {notif.isUnread && (
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#71A066]" />
                              )}
                              
                              {/* Icon container based on type */}
                              <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${
                                notif.type === "order" ? "bg-[#71A066]/10 text-[#71A066] border-[#71A066]/20" :
                                notif.type === "coupon" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                notif.type === "review" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                "bg-[#4E3E2A]/10 text-[#4E3E2A] border-[#4E3E2A]/20"
                              }`}>
                                {notif.type === "order" && <ShoppingBag size={13} />}
                                {notif.type === "coupon" && <Ticket size={13} />}
                                {notif.type === "review" && <Star size={13} fill="currentColor" className="text-blue-500" strokeWidth={0} />}
                                {notif.type === "payment" && <Wallet size={13} />}
                              </div>

                              <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <span className={`text-[11px] text-[#4E3E2A] truncate ${
                                    notif.isUnread ? "font-black" : "font-extrabold"
                                  }`}>
                                    {notif.title}
                                  </span>
                                  <span className="text-[8px] font-bold text-[#4E3E2A]/40 shrink-0 mt-0.5">
                                    {notif.timestamp}
                                  </span>
                                </div>
                                <span className="text-[10px] text-[#4E3E2A]/70 font-semibold leading-normal mt-0.5 group-hover:text-[#4E3E2A] transition-colors">
                                  {notif.message}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* View Notifications Center Link */}
                      <Link 
                        to="/restaurant/notifications"
                        onClick={() => setIsNotificationOpen(false)}
                        className="block text-center py-2.5 bg-[#FFFCF5]/50 hover:bg-[#FFFCF5] text-[9px] font-black uppercase tracking-wider text-[#4E3E2A] hover:text-[#71A066] border-t border-[#4E3E2A]/10 transition-colors"
                      >
                        Alerts Center
                      </Link>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
 
            <div className="h-6 w-px bg-[#4E3E2A]/10" />
 
            {/* Quick profile link */}
            <Link to="/restaurant/profile" className="flex items-center gap-2 text-left group shrink-0">
              <div className="h-8 w-8 rounded-lg bg-[#71A066]/10 text-[#71A066] flex items-center justify-center font-bold text-xs group-hover:bg-[#71A066] group-hover:text-white transition duration-200 shadow-sm">
                <User size={14} />
              </div>
              <span className="hidden sm:inline font-bold text-xs text-[#4E3E2A] group-hover:text-[#71A066] transition-colors">
                Profile
              </span>
            </Link>
          </div>
        </header>
 
        {/* Dynamic Nested Route Content View */}
        <main 
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 md:p-8 bg-gradient-soft custom-scrollbar"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
