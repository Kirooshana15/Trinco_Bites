import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "user" | "restaurant_admin" | "main_admin";

export type User = {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("trinco_user");
    const savedToken = localStorage.getItem("trinco_token");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const persistSession = (auth: AuthResponse) => {
    setUser(auth.user);
    setToken(auth.token);
    localStorage.setItem("trinco_user", JSON.stringify(auth.user));
    localStorage.setItem("trinco_token", auth.token);
    return auth.user;
  };

  const login = async (payload: LoginPayload) => {
    // Check local storage registry first
    const savedUsers = localStorage.getItem("trinco_mock_users");
    const users = savedUsers ? JSON.parse(savedUsers) : [];
    const foundUser = users.find((u: User) => u.email === payload.email);

    if (foundUser) {
      if (foundUser.role !== "user") {
        throw new Error("Invalid credentials for customer portal.");
      }
      return persistSession({ message: "Success", token: "mock-token-customer", user: foundUser });
    }

    // Default Customer fallback for ease of testing
    if (payload.email === "user@gmail.com") {
      const defaultUser: User = {
        name: "Test Customer",
        email: payload.email,
        phone: payload.phone || "0771234567",
        role: "user",
      };
      return persistSession({ message: "Success", token: "mock-token-customer", user: defaultUser });
    }

    throw new Error("User not found. Please register first.");
  };

  const restaurantLogin = async (payload: Omit<LoginPayload, "phone">) => {
    // Hardcoded credentials for Restaurant Admin
    if (payload.email === "restaurant@gmail.com" && payload.password === "restaurant@123") {
      const mockRestaurantAdmin: User = {
        name: "Restaurant Hub",
        email: payload.email,
        phone: "0777654321",
        role: "restaurant_admin",
      };
      return persistSession({ message: "Success", token: "mock-token-restaurant", user: mockRestaurantAdmin });
    }
    throw new Error("Invalid restaurant admin credentials.");
  };

  const adminLogin = async (payload: Omit<LoginPayload, "phone">) => {
    // Hardcoded credentials for Main Admin
    if (payload.email === "admin@gmail.com" && payload.password === "admin@123") {
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
    const mockUser: User = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: "user"
    };

    const savedUsers = localStorage.getItem("trinco_mock_users");
    const users = savedUsers ? JSON.parse(savedUsers) : [];

    if (users.some((u: User) => u.email === payload.email)) {
      throw new Error("Email already registered.");
    }

    users.push(mockUser);
    localStorage.setItem("trinco_mock_users", JSON.stringify(users));

    return { message: "Registered", user: mockUser };
  };

  const googleLogin = async (credential: string) => {
    const mockUser: User = {
      name: "Google User",
      email: "google@example.com",
      phone: "1234567890",
      role: "user"
    };
    return persistSession({ message: "Success", token: "mock-token-google", user: mockUser });
  };

  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("trinco_user");
    localStorage.removeItem("trinco_token");
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
