import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type LocationOption = {
  id: string;
  label: string;
  address: string;
  note?: string;
  lat?: number;
  lng?: number;
};

export type SavedAddress = LocationOption & {
  kind: "home" | "work" | "custom";
  firstName?: string;
  lastName?: string;
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
  selectedLocation: LocationOption;
  savedAddresses: SavedAddress[];
  recentLocations: LocationOption[];
  suggestions: LocationOption[];
  setSelectedLocation: (location: LocationOption) => void;
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
  {
    id: "saved-trinco-1",
    kind: "home",
    label: "Nimal Perera",
    firstName: "Nimal",
    lastName: "Perera",
    phoneNumber: "077 234 5678",
    streetAddress: "No. 45, Dockyard Road",
    city: "Trincomalee",
    district: "Trincomalee",
    province: "Eastern",
    country: "Sri Lanka",
    address: "No. 45, Dockyard Road, Trincomalee, Trincomalee, Trincomalee, Eastern, Sri Lanka",
    isDefault: true,
  },
  {
    id: "saved-trinco-2",
    kind: "work",
    label: "Kasun Fernando",
    firstName: "Kasun",
    lastName: "Fernando",
    phoneNumber: "071 456 7890",
    streetAddress: "No. 12, Main Street",
    city: "Trincomalee",
    district: "Trincomalee",
    province: "Eastern",
    country: "Sri Lanka",
    address: "No. 12, Main Street, Trincomalee, Trincomalee, Trincomalee, Eastern, Sri Lanka",
    isDefault: false,
  },
  {
    id: "saved-trinco-3",
    kind: "other",
    label: "Tharushi Silva",
    firstName: "Tharushi",
    lastName: "Silva",
    phoneNumber: "075 987 6543",
    streetAddress: "No. 88, Kandy Road",
    city: "China Bay",
    district: "Trincomalee",
    province: "Eastern",
    country: "Sri Lanka",
    address: "No. 88, Kandy Road, China Bay, Trincomalee, Eastern, Sri Lanka",
    isDefault: false,
  },
  {
    id: "saved-trinco-4",
    kind: "home",
    label: "Sajith Kumar",
    firstName: "Sajith",
    lastName: "Kumar",
    phoneNumber: "076 321 4587",
    streetAddress: "No. 27, Nilaveli Road",
    city: "Nilaveli",
    district: "Trincomalee",
    province: "Eastern",
    country: "Sri Lanka",
    address: "No. 27, Nilaveli Road, Nilaveli, Trincomalee, Eastern, Sri Lanka",
    isDefault: false,
  },
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
  const [selectedLocation, setSelectedLocationState] =
    useState<LocationOption>(defaultSavedAddresses[0] || defaultLocation);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(
    defaultSavedAddresses
  );
  const [recentLocations, setRecentLocations] = useState<LocationOption[]>(
    defaultRecentLocations
  );

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

  const setSelectedLocation = (location: LocationOption) => {
    setSelectedLocationState(location);
    setRecentLocations((prev) => {
      const next = [
        location,
        ...prev.filter((item) => item.id !== location.id),
      ];
      return next.slice(0, 6);
    });
  };

  const saveAddress = (address: SavedAddress) => {
    setSavedAddresses((prev) => {
      // If the saved address is set as default, we need to unset default for other addresses
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
  };

  const deleteAddress = (id: string) => {
    setSavedAddresses((prev) => prev.filter((item) => item.id !== id));
    if (selectedLocation.id === id) {
      setSelectedLocationState(defaultLocation);
    }
  };

  const setDefaultAddress = (id: string) => {
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
