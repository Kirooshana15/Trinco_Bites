import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { apiRequest } from "../utils/api";
import { useAuth } from "./AuthContext";

export type LocationOption = {
  id: string;
  label: string;
  address: string;
  note?: string;
  lat?: number;
  lng?: number;
};

export type SavedAddress = LocationOption & {
  kind: "home" | "work" | "custom" | "other";
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  streetAddress?: string;
  phoneNumber?: string;
  deliveryInstructions?: string;
  isDefault?: boolean;
  addressLine1?: string;
  addressLine2?: string;
  formattedAddress?: string;
  location?: {
    lat: number;
    lng: number;
  };
};

type LocationCtx = {
  selectedLocation: LocationOption | SavedAddress;
  savedAddresses: SavedAddress[];
  recentLocations: LocationOption[];
  suggestions: LocationOption[];
  setSelectedLocation: (location: LocationOption | SavedAddress) => void;
  saveAddress: (address: SavedAddress) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
};

const defaultLocation: LocationOption = {
  id: "default-trinco",
  label: "Trincomalee",
  address: "Town Center, Trincomalee",
  note: "Fast delivery around your area",
};

const defaultSavedAddresses: SavedAddress[] = [



];

const defaultRecentLocations: LocationOption[] = [
  { id: "recent-uppuveli", label: "Uppuveli", address: "Uppuveli Beach Road" },
  { id: "recent-nilaveli", label: "Nilaveli", address: "Nilaveli Main Road" },
  { id: "recent-dockyard", label: "Dockyard Road", address: "Dockyard Road, Trincomalee" },
  { id: "recent-main", label: "Main Street", address: "Main Street, Trincomalee" },
];

const defaultSuggestions: LocationOption[] = [
  defaultLocation,
  ...defaultSavedAddresses,
  ...defaultRecentLocations,
  {
    id: "suggest-orrs-hill",
    label: "Orr's Hill",
    address: "Orr's Hill, Trincomalee",
  },
  {
    id: "suggest-mc-road",
    label: "Mc Heyzer Road",
    address: "Mc Heyzer Road, Trincomalee",
  },
];

const Ctx = createContext<LocationCtx | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();

  const [selectedLocation, setSelectedLocationState] =
    useState<LocationOption | SavedAddress>(defaultLocation);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [recentLocations, setRecentLocations] = useState<LocationOption[]>(
    defaultRecentLocations
  );

  // Load addresses when token/auth state changes
  useEffect(() => {
    if (token) {
      const loadAddresses = async () => {
        try {
          const addresses = await apiRequest<any[]>("/address", { token });
          const mapped: SavedAddress[] = addresses.map((addr) => ({
            id: addr.id,
            label: addr.fullName,
            address: addr.address,
            kind: "custom",
            fullName: addr.fullName,
            email: addr.email,
            streetAddress: addr.address,
            phoneNumber: addr.phone,
            deliveryInstructions: addr.instructions || "",
            isDefault: addr.isDefault,
          }));
          setSavedAddresses(mapped);

          // Auto-select the default address or fallback to first one, or keep current if valid
          const defaultAddress = mapped.find((a) => a.isDefault) || mapped[0];
          if (defaultAddress) {
            setSelectedLocationState(defaultAddress);
          } else {
            setSelectedLocationState(defaultLocation);
          }
        } catch (e) {
          console.error("Failed to load addresses from backend:", e);
        }
      };
      loadAddresses();
    } else {
      setSavedAddresses([]);
      setSelectedLocationState(defaultLocation);
    }
  }, [token]);

  const suggestions = useMemo(
    () =>
      [
        selectedLocation,
        ...savedAddresses,
        ...recentLocations,
        ...defaultSuggestions,
      ].filter(
        (location, index, list) =>
          list.findIndex((item) => item.id === location.id) === index
      ),
    [recentLocations, savedAddresses, selectedLocation]
  );

  const setSelectedLocation = (location: LocationOption | SavedAddress) => {
    setSelectedLocationState(location);
    setRecentLocations((prev) => {
      const next = [
        location,
        ...prev.filter((item) => item.id !== location.id),
      ];
      return next.slice(0, 6);
    });
  };

  const saveAddress = async (address: SavedAddress) => {
    if (!token) {
      // Local fallback if no token
      setSavedAddresses((prev) => {
        const updated = prev.map((item) => {
          if (address.isDefault && item.id !== address.id) {
            return { ...item, isDefault: false };
          }
          return item;
        });
        const existingIndex = updated.findIndex((item) => item.id === address.id);
        if (existingIndex >= 0) {
          return updated.map((item) => (item.id === address.id ? address : item));
        }
        return [...updated, address];
      });
      if (address.isDefault || selectedLocation.id === address.id) {
        setSelectedLocationState(address);
      }
      return;
    }

    try {
      const isNew = address.id.startsWith("saved-");
      const body = {
        address: address.streetAddress || address.address,
        fullName: address.fullName || `${address.firstName || ""} ${address.lastName || ""}`.trim(),
        email: address.email || "",
        phone: address.phoneNumber || "",
        instructions: address.deliveryInstructions || "",
        isDefault: address.isDefault ?? false,
      };

      let saved: any;
      if (isNew) {
        saved = await apiRequest<any>("/address", {
          method: "POST",
          body,
          token,
        });
      } else {
        saved = await apiRequest<any>(`/address/${address.id}`, {
          method: "PUT",
          body,
          token,
        });
      }

      const mapped: SavedAddress = {
        id: saved.id,
        label: saved.fullName,
        address: saved.address,
        kind: "custom",
        fullName: saved.fullName,
        email: saved.email,
        streetAddress: saved.address,
        phoneNumber: saved.phone,
        deliveryInstructions: saved.instructions || "",
        isDefault: saved.isDefault,
      };

      setSavedAddresses((prev) => {
        const updated = prev.map((item) => {
          if (mapped.isDefault && item.id !== mapped.id) {
            return { ...item, isDefault: false };
          }
          return item;
        });

        const existingIndex = updated.findIndex((item) => item.id === mapped.id);
        if (existingIndex >= 0) {
          return updated.map((item) => (item.id === mapped.id ? mapped : item));
        }
        return [...updated, mapped];
      });

      if (mapped.isDefault || selectedLocation.id === address.id) {
        setSelectedLocationState(mapped);
      }
    } catch (e) {
      console.error("Failed to save address to backend:", e);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!token) {
      setSavedAddresses((prev) => prev.filter((item) => item.id !== id));
      if (selectedLocation.id === id) {
        setSelectedLocationState(defaultLocation);
      }
      return;
    }

    try {
      await apiRequest(`/address/${id}`, {
        method: "DELETE",
        token,
      });

      setSavedAddresses((prev) => prev.filter((item) => item.id !== id));
      if (selectedLocation.id === id) {
        setSelectedLocationState(defaultLocation);
      }
    } catch (e) {
      console.error("Failed to delete address from backend:", e);
    }
  };

  const setDefaultAddress = async (id: string) => {
    if (!token) {
      setSavedAddresses((prev) =>
        prev.map((item) => ({
          ...item,
          isDefault: item.id === id,
        }))
      );
      const target = savedAddresses.find((item) => item.id === id);
      if (target) {
        setSelectedLocationState({ ...target, isDefault: true });
      }
      return;
    }

    try {
      const target = savedAddresses.find((item) => item.id === id);
      if (!target) return;

      const saved = await apiRequest<any>(`/address/${id}`, {
        method: "PUT",
        body: {
          isDefault: true,
        },
        token,
      });

      const mapped: SavedAddress = {
        id: saved.id,
        label: saved.fullName,
        address: saved.address,
        kind: "custom",
        fullName: saved.fullName,
        email: saved.email,
        streetAddress: saved.address,
        phoneNumber: saved.phone,
        deliveryInstructions: saved.instructions || "",
        isDefault: saved.isDefault,
      };

      setSavedAddresses((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return mapped;
          }
          return { ...item, isDefault: false };
        })
      );
      setSelectedLocationState(mapped);
    } catch (e) {
      console.error("Failed to set default address in backend:", e);
    }
  };

  return (
    <Ctx.Provider
      value={{
        selectedLocation,
        savedAddresses,
        recentLocations,
        suggestions,
        setSelectedLocation,
        saveAddress,
        deleteAddress,
        setDefaultAddress,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useLocationState = () => {
  const value = useContext(Ctx);
  if (!value) {
    throw new Error("useLocationState must be used within LocationProvider");
  }
  return value;
};
