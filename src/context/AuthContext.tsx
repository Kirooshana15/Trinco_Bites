import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../utils/api";
import axios from "axios";

export type UserRole = "user" | "restaurant_admin" | "main_admin";

export type User = {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  restaurantId?: string;
};

type AuthResponse = {
  message: string;
  token: string;
  user: User;
};

type RegisterResponse = {
  message: string;
  user: User;
};

type LoginPayload = {
  email: string;
  phone: string;
  password: string;
};

type RegisterPayload = LoginPayload & {
  name: string;
};

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 9) {
    return "0" + digits;
  }
  if (digits.startsWith("94") && digits.length === 11) {
    return "0" + digits.substring(2);
  }
  return digits;
}

export function isRestaurantAdminPath(path: string): boolean {
  const adminPaths = [
    "/restaurant/dashboard",
    "/restaurant/orders",
    "/restaurant/menu",
    "/restaurant/categories",
    "/restaurant/profile",
    "/restaurant/customers",
    "/restaurant/reviews",
    "/restaurant/offers",
    "/restaurant/analytics",
    "/restaurant/notifications",
    "/restaurant/payments"
  ];
  return adminPaths.some((p) => path.startsWith(p));
}

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (payload: LoginPayload) => Promise<User>;
  businessLogin: (payload: Omit<LoginPayload, "phone">) => Promise<User>;
  restaurantLogin: (payload: Omit<LoginPayload, "phone">) => Promise<User>;
  adminLogin: (payload: Omit<LoginPayload, "phone">) => Promise<User>;
  googleLogin: (credential: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  if (token === "mock-token-google" || token.startsWith("mock-")) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    if (typeof payload.exp !== "number") {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return now >= (payload.exp - 10); // 10s buffer
  } catch (e) {
    console.error("Error decoding token for expiry check", e);
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customerUser, setCustomerUser] = useState<User | null>(() => {
    const token = localStorage.getItem("trinco_token");
    if (isTokenExpired(token)) {
      localStorage.removeItem("trinco_user");
      localStorage.removeItem("trinco_token");
      return null;
    }
    const savedUser = localStorage.getItem("trinco_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [customerToken, setCustomerToken] = useState<string | null>(() => {
    const token = localStorage.getItem("trinco_token");
    if (isTokenExpired(token)) {
      return null;
    }
    return token;
  });

  const [restaurantUser, setRestaurantUser] = useState<User | null>(() => {
    const token = localStorage.getItem("trinco_restaurant_token");
    if (isTokenExpired(token)) {
      localStorage.removeItem("trinco_restaurant_user");
      localStorage.removeItem("trinco_restaurant_token");
      return null;
    }
    const savedUser = localStorage.getItem("trinco_restaurant_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [restaurantToken, setRestaurantToken] = useState<string | null>(() => {
    const token = localStorage.getItem("trinco_restaurant_token");
    if (isTokenExpired(token)) {
      return null;
    }
    return token;
  });

  const [adminUser, setAdminUser] = useState<User | null>(() => {
    const token = localStorage.getItem("trinco_admin_token");
    if (isTokenExpired(token)) {
      localStorage.removeItem("trinco_admin_user");
      localStorage.removeItem("trinco_admin_token");
      return null;
    }
    const savedUser = localStorage.getItem("trinco_admin_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    const token = localStorage.getItem("trinco_admin_token");
    if (isTokenExpired(token)) {
      return null;
    }
    return token;
  });

  const [pathname, setPathname] = useState(() => typeof window !== "undefined" ? window.location.pathname : "");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL ?? "https://trincobites-backend.onrender.com/api";
        const res = await axios.get(baseUrl);
        // If the request completes, the backend is up
      } catch (err) {
        console.warn("Backend connection failed. Clearing localStorage cached states...", err);
        // Reset state
        setCustomerUser(null);
        setCustomerToken(null);
        setRestaurantUser(null);
        setRestaurantToken(null);
        setAdminUser(null);
        setAdminToken(null);
        
        // Clear storage keys
        const keysToRemove = [
          "trinco_user",
          "trinco_token",
          "trinco_restaurant_user",
          "trinco_restaurant_token",
          "trinco_admin_user",
          "trinco_admin_token",
          "trinco_restaurants",
          "trinco_orders"
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    };
    checkBackend();
  }, []);

  useEffect(() => {
    const checkExpiry = () => {
      const path = typeof window !== "undefined" ? window.location.pathname : "";
      let activeToken: string | null = null;
      let role: "restaurant" | "admin" | "customer" = "customer";

      if (isRestaurantAdminPath(path)) {
        activeToken = restaurantToken;
        role = "restaurant";
      } else if (path.startsWith("/admin")) {
        activeToken = adminToken;
        role = "admin";
      } else {
        activeToken = customerToken;
      }

      if (activeToken && isTokenExpired(activeToken)) {
        if (role === "restaurant") {
          setRestaurantUser(null);
          setRestaurantToken(null);
          localStorage.removeItem("trinco_restaurant_user");
          localStorage.removeItem("trinco_restaurant_token");
        } else if (role === "admin") {
          setAdminUser(null);
          setAdminToken(null);
          localStorage.removeItem("trinco_admin_user");
          localStorage.removeItem("trinco_admin_token");
        } else {
          setCustomerUser(null);
          setCustomerToken(null);
          localStorage.removeItem("trinco_user");
          localStorage.removeItem("trinco_token");
        }

        alert("Your session has expired. Please log in again.");

        if (role === "restaurant" || role === "admin") {
          window.location.href = "/business_login";
        } else {
          window.location.href = "/login";
        }
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 10000);
    return () => clearInterval(interval);
  }, [customerToken, restaurantToken, adminToken, pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  const getActiveSession = () => {
    if (isRestaurantAdminPath(pathname)) {
      return { user: restaurantUser, token: restaurantToken };
    }
    if (pathname.startsWith("/admin")) {
      return { user: adminUser, token: adminToken };
    }
    return { user: customerUser, token: customerToken };
  };

  const { user, token } = getActiveSession();

  // Listen to global "unauthorized" event (dispatched on any 401 response)
  useEffect(() => {
    const handleUnauthorized = () => {
      const path = typeof window !== "undefined" ? window.location.pathname : "";
      let role: "restaurant" | "admin" | "customer" = "customer";

      if (isRestaurantAdminPath(path)) {
        role = "restaurant";
      } else if (path.startsWith("/admin")) {
        role = "admin";
      }

      if (role === "restaurant") {
        setRestaurantUser(null);
        setRestaurantToken(null);
        localStorage.removeItem("trinco_restaurant_user");
        localStorage.removeItem("trinco_restaurant_token");
      } else if (role === "admin") {
        setAdminUser(null);
        setAdminToken(null);
        localStorage.removeItem("trinco_admin_user");
        localStorage.removeItem("trinco_admin_token");
      } else {
        setCustomerUser(null);
        setCustomerToken(null);
        localStorage.removeItem("trinco_user");
        localStorage.removeItem("trinco_token");
      }

      alert("Your session has expired or is invalid. Please log in again.");

      if (role === "restaurant" || role === "admin") {
        window.location.href = "/business_login";
      } else {
        window.location.href = "/login";
      }
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, [customerToken, restaurantToken, adminToken]);

  // On mount/init, verify the current token with backend
  useEffect(() => {
    const verifySession = async () => {
      const activeSession = getActiveSession();
      if (!activeSession.token) return;

      try {
        await apiRequest("/auth/me", { token: activeSession.token });
      } catch (err) {
        // If it fails with 401, the "unauthorized" event listener will automatically trigger logout.
        console.error("Session verification failed", err);
      }
    };

    verifySession();
  }, []);

  const persistSession = (auth: AuthResponse) => {
    const role = auth.user.role;
    if (role === "restaurant_admin") {
      setRestaurantUser(auth.user);
      setRestaurantToken(auth.token);
      localStorage.setItem("trinco_restaurant_user", JSON.stringify(auth.user));
      localStorage.setItem("trinco_restaurant_token", auth.token);
    } else if (role === "main_admin") {
      setAdminUser(auth.user);
      setAdminToken(auth.token);
      localStorage.setItem("trinco_admin_user", JSON.stringify(auth.user));
      localStorage.setItem("trinco_admin_token", auth.token);
    } else {
      setCustomerUser(auth.user);
      setCustomerToken(auth.token);
      localStorage.setItem("trinco_user", JSON.stringify(auth.user));
      localStorage.setItem("trinco_token", auth.token);
    }
    return auth.user;
  };

  const login = async (payload: LoginPayload) => {
    const response = await apiRequest<{
      message: string;
      token: string;
      user: {
        id: string;
        fullName: string;
        email: string;
        phone: string;
        role: string;
        restaurantId?: string;
      };
    }>("/auth/login", {
      method: "POST",
      body: {
        email: payload.email || undefined,
        phone: payload.phone || undefined,
        password: payload.password,
      },
    });

    const mappedUser: User = {
      name: response.user.fullName || "",
      email: response.user.email,
      phone: response.user.phone || "",
      role: response.user.role === "ADMIN" 
        ? "main_admin" 
        : response.user.role === "RESTAURANT" 
          ? "restaurant_admin" 
          : "user",
      restaurantId: response.user.restaurantId,
    };

    if (mappedUser.role !== "user") {
      throw new Error("Invalid credentials for customer portal.");
    }

    return persistSession({
      message: response.message,
      token: response.token,
      user: mappedUser,
    });
  };

  const businessLogin = async (payload: Omit<LoginPayload, "phone">) => {
    const response = await apiRequest<{
      message: string;
      token: string;
      user: {
        id: string;
        fullName: string;
        email: string;
        phone: string;
        role: string;
        restaurantId?: string;
      };
    }>("/auth/login", {
      method: "POST",
      body: {
        email: payload.email,
        password: payload.password,
      },
    });

    const mappedUser: User = {
      name: response.user.fullName || "",
      email: response.user.email,
      phone: response.user.phone || "",
      role: response.user.role === "ADMIN" 
        ? "main_admin" 
        : response.user.role === "RESTAURANT" 
          ? "restaurant_admin" 
          : "user",
      restaurantId: response.user.restaurantId,
    };

    if (mappedUser.role !== "main_admin" && mappedUser.role !== "restaurant_admin") {
      throw new Error("Invalid business credentials.");
    }

    return persistSession({
      message: response.message,
      token: response.token,
      user: mappedUser,
    });
  };

  const restaurantLogin = async (payload: Omit<LoginPayload, "phone">) => {
    const response = await apiRequest<{
      message: string;
      token: string;
      user: {
        id: string;
        fullName: string;
        email: string;
        phone: string;
        role: string;
        restaurantId?: string;
      };
    }>("/auth/login", {
      method: "POST",
      body: {
        email: payload.email,
        password: payload.password,
      },
    });

    const mappedUser: User = {
      name: response.user.fullName || "",
      email: response.user.email,
      phone: response.user.phone || "",
      role: response.user.role === "ADMIN" 
        ? "main_admin" 
        : response.user.role === "RESTAURANT" 
          ? "restaurant_admin" 
          : "user",
      restaurantId: response.user.restaurantId,
    };

    if (mappedUser.role !== "restaurant_admin") {
      throw new Error("Invalid restaurant admin credentials.");
    }

    return persistSession({
      message: response.message,
      token: response.token,
      user: mappedUser,
    });
  };

  const adminLogin = async (payload: Omit<LoginPayload, "phone">) => {
    const response = await apiRequest<{
      message: string;
      token: string;
      user: {
        id: string;
        fullName: string;
        email: string;
        phone: string;
        role: string;
        restaurantId?: string;
      };
    }>("/auth/login", {
      method: "POST",
      body: {
        email: payload.email,
        password: payload.password,
      },
    });

    const mappedUser: User = {
      name: response.user.fullName || "",
      email: response.user.email,
      phone: response.user.phone || "",
      role: response.user.role === "ADMIN" 
        ? "main_admin" 
        : response.user.role === "RESTAURANT" 
          ? "restaurant_admin" 
          : "user",
      restaurantId: response.user.restaurantId,
    };

    if (mappedUser.role !== "main_admin") {
      throw new Error("Invalid main admin credentials.");
    }

    return persistSession({
      message: response.message,
      token: response.token,
      user: mappedUser,
    });
  };

  const register = async (payload: RegisterPayload) => {
    const response = await apiRequest<{
      message: string;
      user: {
        id: string;
        fullName: string;
        email: string;
        phone: string;
        role: string;
      };
    }>("/auth/signup", {
      method: "POST",
      body: {
        fullName: payload.name,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
      },
    });

    const mappedUser: User = {
      name: response.user.fullName || "",
      email: response.user.email,
      phone: response.user.phone || "",
      role: "user",
    };

    return {
      message: response.message,
      user: mappedUser,
    };
  };

  const googleLogin = async (credential: string) => {
    let name = "Google User";
    let email = "google@example.com";
    let phone = "1234567890";

    try {
      const parts = credential.split(".");
      if (parts.length === 3) {
        // Decode base64 payload of JWT
        const payload = JSON.parse(
          atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
        );
        if (payload.name) name = payload.name;
        if (payload.email) email = payload.email;
      } else if (credential.startsWith("mock-gsi-credential-token-")) {
        const suffix = credential.replace("mock-gsi-credential-token-", "");
        if (suffix && suffix !== "demouser") {
          if (suffix.includes("@")) {
            email = suffix;
            const prefix = suffix.split("@")[0];
            name = prefix
              .split(/[._-]/)
              .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
              .join(" ");
          } else {
            name = suffix.charAt(0).toUpperCase() + suffix.slice(1);
          }
        } else {
          name = "Test Customer";
          email = "user@gmail.com";
          phone = "0771234567";
        }
      }
    } catch (e) {
      console.error("Error decoding Google credential", e);
    }

    const mockUser: User = {
      name,
      email,
      phone,
      role: "user"
    };
    return persistSession({ message: "Success", token: "mock-token-google", user: mockUser });
  };

  const clearSession = () => {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    if (path.startsWith("/restaurant")) {
      setRestaurantUser(null);
      setRestaurantToken(null);
      localStorage.removeItem("trinco_restaurant_user");
      localStorage.removeItem("trinco_restaurant_token");
    } else if (path.startsWith("/admin")) {
      setAdminUser(null);
      setAdminToken(null);
      localStorage.removeItem("trinco_admin_user");
      localStorage.removeItem("trinco_admin_token");
    } else {
      setCustomerUser(null);
      setCustomerToken(null);
      localStorage.removeItem("trinco_user");
      localStorage.removeItem("trinco_token");
    }
  };

  const logout = async () => {
    const activeToken = token;
    clearSession();
    if (activeToken) {
      try {
        await apiRequest("/auth/logout", {
          method: "POST",
          token: activeToken,
        });
      } catch (err) {
        console.error("Error logging out from backend:", err);
      }
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    if (path.startsWith("/restaurant")) {
      if (restaurantUser) {
        const newUser = { ...restaurantUser, ...updatedFields };
        setRestaurantUser(newUser);
        localStorage.setItem("trinco_restaurant_user", JSON.stringify(newUser));
      }
    } else if (path.startsWith("/admin")) {
      if (adminUser) {
        const newUser = { ...adminUser, ...updatedFields };
        setAdminUser(newUser);
        localStorage.setItem("trinco_admin_user", JSON.stringify(newUser));
      }
    } else {
      if (customerUser) {
        const newUser = { ...customerUser, ...updatedFields };
        setCustomerUser(newUser);
        localStorage.setItem("trinco_user", JSON.stringify(newUser));
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        businessLogin,
        restaurantLogin,
        adminLogin,
        googleLogin,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user && !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
