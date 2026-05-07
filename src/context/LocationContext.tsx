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
};

export type SavedAddress = LocationOption & {
  kind: "home" | "work" | "custom";
};

type LocationCtx = {
  selectedLocation: LocationOption;
  savedAddresses: SavedAddress[];
  recentLocations: LocationOption[];
  suggestions: LocationOption[];
  setSelectedLocation: (location: LocationOption) => void;
  saveAddress: (address: SavedAddress) => void;
};

const defaultLocation: LocationOption = {
  id: "default-trinco",
  label: "Trincomalee",
  address: "Town Center, Trincomalee",
  note: "Fast delivery around your area",
};

const defaultSavedAddresses: SavedAddress[] = [
  {
    id: "saved-home",
    kind: "home",
    label: "Home",
    address: "No 12, Dockyard Road, Trincomalee",
  },
  {
    id: "saved-work",
    kind: "work",
    label: "Work",
    address: "Main Street, Trincomalee",
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
    useState<LocationOption>(defaultLocation);
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
      const existingIndex = prev.findIndex((item) => item.id === address.id);
      if (existingIndex >= 0) {
        return prev.map((item) => (item.id === address.id ? address : item));
      }
      return [...prev, address];
    });
    setSelectedLocationState((prev) =>
      prev.id === address.id ? address : prev
    );
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
