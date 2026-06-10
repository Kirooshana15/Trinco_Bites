import React, { createContext, useContext, useState, useEffect } from "react";

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

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (payload: LoginPayload) => Promise<User>;
  restaurantLogin: (payload: Omit<LoginPayload, "phone">) => Promise<User>;
  adminLogin: (payload: Omit<LoginPayload, "phone">) => Promise<User>;
  googleLogin: (credential: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customerUser, setCustomerUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("trinco_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [customerToken, setCustomerToken] = useState<string | null>(() => {
    return localStorage.getItem("trinco_token");
  });

  const [restaurantUser, setRestaurantUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("trinco_restaurant_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [restaurantToken, setRestaurantToken] = useState<string | null>(() => {
    return localStorage.getItem("trinco_restaurant_token");
  });

  const [adminUser, setAdminUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("trinco_admin_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem("trinco_admin_token");
  });

  const [pathname, setPathname] = useState(() => typeof window !== "undefined" ? window.location.pathname : "");

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
    if (pathname.startsWith("/restaurant")) {
      return { user: restaurantUser, token: restaurantToken };
    }
    if (pathname.startsWith("/admin")) {
      return { user: adminUser, token: adminToken };
    }
    return { user: customerUser, token: customerToken };
  };

  const { user, token } = getActiveSession();

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
    // Check local storage registry first
    const savedUsers = localStorage.getItem("trinco_mock_users");
    const users = savedUsers ? JSON.parse(savedUsers) : [];
    const foundUser = users.find((u: User & { password?: string }) => u.email === payload.email);

    if (foundUser) {
      if (foundUser.role !== "user") {
        throw new Error("Invalid credentials for customer portal.");
      }
      if (foundUser.password && foundUser.password !== payload.password) {
        throw new Error("Incorrect password.");
      }
      if (normalizePhone(foundUser.phone) !== normalizePhone(payload.phone)) {
        throw new Error("Email and phone number do not match.");
      }
      return persistSession({ message: "Success", token: "mock-token-customer", user: foundUser });
    }

    // Default Customer fallback for ease of testing
    if (payload.email === "user@gmail.com") {
      const defaultPhone = "0771234567";
      const userOverride = localStorage.getItem("trinco_user_password_override") || "user@123";
      if (payload.password !== userOverride) {
        throw new Error("Incorrect password.");
      }
      if (payload.phone && normalizePhone(payload.phone) !== normalizePhone(defaultPhone)) {
        throw new Error("Email and phone number do not match.");
      }
      const defaultUser: User = {
        name: "Test Customer",
        email: payload.email,
        phone: payload.phone || defaultPhone,
        role: "user",
      };
      return persistSession({ message: "Success", token: "mock-token-customer", user: defaultUser });
    }

    throw new Error("User not found. Please register first.");
  };

  const restaurantLogin = async (payload: Omit<LoginPayload, "phone">) => {
    // Hardcoded credentials for Restaurant Admin
    const restaurantOverride = localStorage.getItem("trinco_restaurant_password_override") || "restaurant@123";
    
    const accounts = [
      {
        email: "restaurant@gmail.com",
        name: "Trinco Spice House",
        restaurantId: "trinco-spice",
        phone: "0777654321"
      },
      {
        email: "spicehouse@gmail.com",
        name: "Trinco Spice House",
        restaurantId: "trinco-spice",
        phone: "0777111222"
      },
      {
        email: "oceanpearl@gmail.com",
        name: "Ocean Pearl Seafood",
        restaurantId: "ocean-pearl",
        phone: "0777333444"
      },
      {
        email: "biryanipalace@gmail.com",
        name: "Biryani Palace",
        restaurantId: "biryani-palace",
        phone: "0777555666"
      },
      {
        email: "burgerco@gmail.com",
        name: "Trinco Burger Co.",
        restaurantId: "burger-co",
        phone: "0777777888"
      }
    ];

    const match = accounts.find(acc => acc.email.toLowerCase() === payload.email.toLowerCase());

    if (match && payload.password === restaurantOverride) {
      const mockRestaurantAdmin: User = {
        name: match.name,
        email: match.email,
        phone: match.phone,
        role: "restaurant_admin",
        restaurantId: match.restaurantId,
      };
      return persistSession({ message: "Success", token: "mock-token-restaurant", user: mockRestaurantAdmin });
    }
    throw new Error("Invalid restaurant admin credentials.");
  };

  const adminLogin = async (payload: Omit<LoginPayload, "phone">) => {
    // Hardcoded credentials for Main Admin
    const adminOverride = localStorage.getItem("trinco_admin_password_override") || "admin@123";
    if (payload.email === "admin@gmail.com" && payload.password === adminOverride) {
      const mockMainAdmin: User = {
        name: "Main Admin",
        email: payload.email,
        phone: "0779876543",
        role: "main_admin",
      };
      return persistSession({ message: "Success", token: "mock-token-admin", user: mockMainAdmin });
    }
    throw new Error("Invalid main admin credentials.");
  };

  const register = async (payload: RegisterPayload) => {
    const mockUser: User & { password?: string } = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: "user",
      password: payload.password
    };

    const savedUsers = localStorage.getItem("trinco_mock_users");
    const users = savedUsers ? JSON.parse(savedUsers) : [];

    if (users.some((u: User) => u.email === payload.email) || payload.email === "user@gmail.com") {
      throw new Error("Email already registered.");
    }

    if (users.some((u: User) => normalizePhone(u.phone) === normalizePhone(payload.phone)) || normalizePhone(payload.phone) === normalizePhone("0771234567")) {
      throw new Error("Phone number already registered.");
    }

    users.push(mockUser);
    localStorage.setItem("trinco_mock_users", JSON.stringify(users));

    return { message: "Registered", user: mockUser };
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

    // Check if a user with this email is already registered in local mock database
    const savedUsers = localStorage.getItem("trinco_mock_users");
    const users = savedUsers ? JSON.parse(savedUsers) : [];
    const foundUser = users.find((u: User) => u.email === email);
    if (foundUser) {
      name = foundUser.name;
      phone = foundUser.phone;
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
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        restaurantLogin,
        adminLogin,
        googleLogin,
        register,
        logout,
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
