import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Crosshair,
  LocateFixed,
  MapPin,
  Lock,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLocationState } from "@/context/LocationContext";
import type { SavedAddress } from "@/context/LocationContext";
import { C } from "@/utils/theme";
import { useAuth } from "@/context/AuthContext";

type Step = "choose" | "map" | "save";
type MapMode = "select" | "save";

type Coordinates = {
  lat: number;
  lng: number;
};

type SelectedPlace = {
  lat: number;
  lng: number;
  formattedAddress: string;
  city: string;
  district: string;
};

const DEFAULT_CENTER: Coordinates = { lat: 8.5874, lng: 81.2152 };
const MAPS_SCRIPT_ID = "google-maps-js";
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function isMapsConfigured() {
  return Boolean(GOOGLE_MAPS_API_KEY && !GOOGLE_MAPS_API_KEY.startsWith("your_"));
}

function getGoogleMaps() {
  return (window as any).google?.maps;
}

function loadGoogleMaps() {
  return new Promise<void>((resolve, reject) => {
    if (!isMapsConfigured()) {
      reject(new Error("Google Maps API key is not configured."));
      return;
    }

    if (getGoogleMaps()) {
      resolve();
      return;
    }

    const existing = document.getElementById(MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Google Maps.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Google Maps."));
    document.head.appendChild(script);
  });
}

function getAddressPart(result: any, types: string[]) {
  return result?.address_components?.find((part: any) =>
    types.some((type) => part.types.includes(type)),
  )?.long_name ?? "";
}

async function reverseGeocode(coords: Coordinates): Promise<SelectedPlace> {
  const maps = getGoogleMaps();
  if (!maps) {
    return {
      ...coords,
      formattedAddress: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
      city: "",
      district: "",
    };
  }

  const geocoder = new maps.Geocoder();

  return new Promise((resolve) => {
    geocoder.geocode({ location: coords }, (results: any[], status: string) => {
      const result = status === "OK" ? results?.[0] : null;
      resolve({
        ...coords,
        formattedAddress:
          result?.formatted_address ?? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
        city: getAddressPart(result, ["locality", "postal_town", "administrative_area_level_2"]),
        district: getAddressPart(result, ["administrative_area_level_2", "administrative_area_level_1"]),
      });
    });
  });
}

async function geocodeAddress(query: string): Promise<SelectedPlace | null> {
  await loadGoogleMaps();
  const maps = getGoogleMaps();
  const geocoder = new maps.Geocoder();

  return new Promise((resolve) => {
    geocoder.geocode({ address: query }, (results: any[], status: string) => {
      const result = status === "OK" ? results?.[0] : null;
      const location = result?.geometry?.location;
      if (!result || !location) {
        resolve(null);
        return;
      }

      resolve({
        lat: location.lat(),
        lng: location.lng(),
        formattedAddress: result.formatted_address,
        city: getAddressPart(result, ["locality", "postal_town", "administrative_area_level_2"]),
        district: getAddressPart(result, ["administrative_area_level_2", "administrative_area_level_1"]),
      });
    });
  });
}


export function LocationPage() {
  const navigate = useNavigate();
  const {
    savedAddresses,
    selectedLocation,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    setSelectedLocation,
  } = useLocationState();

  const [step, setStep] = useState<Step>("choose");
  const [mapMode, setMapMode] = useState<MapMode>("select");
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(() => ({
    lat: selectedLocation.lat ?? DEFAULT_CENTER.lat,
    lng: selectedLocation.lng ?? DEFAULT_CENTER.lng,
    formattedAddress: selectedLocation.address,
    city: "",
    district: "",
  }));

  const [searchQuery, setSearchQuery] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [error, setError] = useState("");

  const goBack = () => {
    if (step === "choose") {
      // Go back to checkout if checkout was in path, otherwise home
      if (window.history.length > 1) {
        window.history.back();
      } else {
        navigate({ to: "/home" });
      }
    }
    if (step === "map") setStep("choose");
    if (step === "save") setStep("choose");
  };

  const openMapAt = async (coords: Coordinates, mode: MapMode) => {
    setError("");
    setMapMode(mode);
    const place = await reverseGeocode(coords);
    setSelectedPlace(place);
    setStep("map");
  };

  const handleCurrentLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError("Location access is not supported on this device.");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLoadingLocation(false);
        await openMapAt({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }, "select");
      },
      () => {
        setLoadingLocation(false);
        setError("Please allow location permission to use your current location.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setError("");

    try {
      const result = await geocodeAddress(searchQuery);
      if (!result) {
        setError("We could not find that location.");
        return;
      }
      setSelectedPlace(result);
      setMapMode("select");
      setStep("map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to search location.");
    }
  };

  const handleSave = (address: SavedAddress) => {
    saveAddress(address);
    setSelectedLocation(address);
    goBack();
  };

  return (
    <main className="min-h-screen bg-gradient-soft py-6 md:py-10 px-4 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {step === "choose" && (
          <AddressesListView
            key="choose"
            error={error}
            query={searchQuery}
            savedAddresses={savedAddresses}
            selectedLocation={selectedLocation}
            onBack={goBack}
            onAddAddress={() => {
              setEditingAddress(null);
              setStep("save");
            }}
            onEditAddress={(address) => {
              setEditingAddress(address);
              setStep("save");
            }}
            onCurrentLocation={handleCurrentLocation}
            onQueryChange={setSearchQuery}
            onSearch={handleSearch}
            onSelectLocation={(address) => {
              setSelectedLocation(address);
              goBack();
            }}
            onSetMap={() => openMapAt(selectedPlace ?? DEFAULT_CENTER, "select")}
            onDeleteAddress={deleteAddress}
            onSetDefault={setDefaultAddress}
          />
        )}

        {step === "map" && selectedPlace && (
          <MapConfirmationScreen
            key="map"
            initialPlace={selectedPlace}
            onBack={goBack}
            onConfirm={(place) => {
              setSelectedPlace(place);
              if (mapMode === "save") {
                setStep("save");
                return;
              }

              const newAddr: SavedAddress = {
                id: `map-${Date.now()}`,
                label: place.city || "Selected location",
                address: place.formattedAddress,
                streetAddress: place.formattedAddress,
                city: place.city,
                district: place.district,
                kind: "custom",
                lat: place.lat,
                lng: place.lng,
              };
              setSelectedLocation(newAddr);
              goBack();
            }}
            onPlaceChange={setSelectedPlace}
          />
        )}

        {step === "save" && (
          <AddAddressFormView
            key="save"
            initialAddress={editingAddress}
            geocodedPlace={selectedPlace}
            onBack={goBack}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="mx-auto flex flex-col w-full max-w-md px-5 pt-5 pb-8 rounded-[30px] border border-[#813405]/10 shadow-[0_12px_40px_rgba(129,52,5,0.06)]"
      style={{
        background: "rgba(255, 252, 245, 0.9)",
        backdropFilter: "blur(24px)",
        minHeight: "82vh",
      }}
    >
      {children}
    </motion.section>
  );
}

// ── Addresses List Component (Screenshot 1 Layout) ──────────────────────────────────
export function AddressesListView({
  error,
  query,
  savedAddresses,
  selectedLocation,
  onBack,
  onAddAddress,
  onCurrentLocation,
  onQueryChange,
  onSearch,
  onSelectLocation,
  onSetMap,
  onEditAddress,
  onDeleteAddress,
  onSetDefault,
}: {
  error: string;
  query: string;
  savedAddresses: SavedAddress[];
  selectedLocation: any;
  onBack: () => void;
  onAddAddress: () => void;
  onCurrentLocation: () => void;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onSelectLocation: (address: SavedAddress) => void;
  onSetMap: () => void;
  onEditAddress: (address: SavedAddress) => void;
  onDeleteAddress: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (address: SavedAddress, e: React.MouseEvent) => {
    e.stopPropagation();
    const nameLine = address.fullName || `${address.firstName || ""} ${address.lastName || ""}`.trim();
    const emailLine = address.email ? `Email: ${address.email}\n` : "";
    const formatted = `${nameLine}\n${emailLine}${address.streetAddress || address.address}\nPhone: +94 ${address.phoneNumber || ""}`;
    navigator.clipboard.writeText(formatted);
    setCopiedId(address.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <ScreenShell>
      {/* Header */}
      <div className="relative flex h-14 items-center justify-center border-b border-[#813405]/10 mb-4 pb-2">
        <h1 className="text-xl font-black tracking-tight text-[#813405]">
          Addresses
        </h1>
        <button
          type="button"
          onClick={onBack}
          className="absolute right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 hover:scale-105 active:scale-95 transition"
        >
          <X className="h-5 w-5 text-[#813405]" />
        </button>
      </div>

      {/* Map and Search shortcuts */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={onCurrentLocation}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl text-xs font-black bg-white border border-[#813405]/10 text-[#813405] hover:bg-gray-50 active:scale-98 transition shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
        >
          <Crosshair className="h-4 w-4 text-[#D45113]" />
          My Location
        </button>
        <button
          onClick={onSetMap}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl text-xs font-black bg-white border border-[#813405]/10 text-[#813405] hover:bg-gray-50 active:scale-98 transition shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
        >
          <MapPin className="h-4 w-4 text-[#D45113]" />
          Choose on Map
        </button>
      </div>

      {/* Address Search Bar */}
      <div className="relative mb-5 flex h-12 items-center gap-3 rounded-2xl bg-white border border-[#813405]/10 px-4 shadow-[0_4px_16px_rgba(129,52,5,0.02)]">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder="Search saved addresses..."
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none text-[#813405] placeholder-[#813405]/30"
        />
      </div>


      {/* Addresses List Container */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-0.5" style={{ scrollbarWidth: "none" }}>
        {savedAddresses
          .filter(addr => {
            if (!query.trim()) return true;
            const search = query.toLowerCase();
            return (
              (addr.fullName || "").toLowerCase().includes(search) ||
              (addr.firstName || "").toLowerCase().includes(search) ||
              (addr.lastName || "").toLowerCase().includes(search) ||
              (addr.email || "").toLowerCase().includes(search) ||
              (addr.streetAddress || addr.address || "").toLowerCase().includes(search)
            );
          })
          .map((address) => {
            const isSelected = selectedLocation?.id === address.id;

            return (
              <div
                key={address.id}
                className="bg-white rounded-[20px] p-5 shadow-[0_6px_22px_rgba(129,52,5,0.03)] border border-[#813405]/5 flex flex-col gap-4 relative"
              >
                {/* Checkmark for active */}
                {isSelected && (
                  <div className="absolute right-5 top-5 text-[#D45113]">
                    <Check className="h-6 w-6 stroke-[3px]" />
                  </div>
                )}

                {/* Header: Badge (Optional), Name, Phone number */}
                <div className="flex flex-col gap-1 pr-8">
                  <div className="flex flex-wrap items-center gap-2">
                    {address.isDefault && (
                      <span className="bg-[#FF5F00] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                        Recently used
                      </span>
                    )}
                    <h3 className="font-extrabold text-[#813405] text-base leading-snug">
                      {address.fullName || `${address.firstName || address.label} ${address.lastName || ""}`.trim()}
                    </h3>
                    {address.email && (
                      <span className="text-[#813405]/60 text-xs font-semibold">
                        ({address.email})
                      </span>
                    )}
                    <span className="text-[#813405]/50 text-xs font-semibold">
                      {address.phoneNumber ? `+94 ${address.phoneNumber}` : ""}
                    </span>
                  </div>
                </div>

                {/* Address block */}
                <div className="text-sm font-semibold leading-relaxed text-[#813405]/80">
                  <p>{address.streetAddress || address.address}</p>
                </div>

                {/* Inactive button "Use" on right */}
                {!isSelected && (
                  <div className="absolute right-5 top-6">
                    <button
                      onClick={() => onSelectLocation(address)}
                      className="bg-[#FF5F00] hover:bg-[#D45113] active:scale-95 transition text-white text-xs font-black px-4 py-2 rounded-full shadow-md"
                    >
                      Use
                    </button>
                  </div>
                )}

                {/* Bottom Row controls */}
                <div className="flex items-center justify-between border-t border-[#813405]/5 pt-3.5 mt-1">
                  {/* Default switch */}
                  <button
                    onClick={() => onSetDefault(address.id)}
                    className="flex items-center gap-2 text-xs font-black text-[#813405] hover:text-[#D45113] transition"
                  >
                    {address.isDefault ? (
                      <>
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-black">
                          <span className="h-2.5 w-2.5 rounded-full bg-black" />
                        </span>
                        <span>Default</span>
                      </>
                    ) : (
                      <>
                        <span className="h-5 w-5 shrink-0 rounded-full border border-[#813405]/30 bg-transparent" />
                        <span className="text-[#813405]/50">Set as default</span>
                      </>
                    )}
                  </button>

                  {/* Actions links */}
                  <div className="flex items-center gap-2 text-[11px] font-black text-[#813405]/50">
                    <button
                      onClick={() => onDeleteAddress(address.id)}
                      className="hover:text-red-500 transition"
                    >
                      Delete
                    </button>
                    <span>|</span>
                    <button
                      onClick={(e) => handleCopy(address, e)}
                      className="hover:text-[#D45113] transition"
                    >
                      {copiedId === address.id ? "Copied" : "Copy"}
                    </button>
                    <span>|</span>
                    <button
                      onClick={() => onEditAddress(address)}
                      className="hover:text-[#D45113] transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        {savedAddresses.length === 0 && (
          <div className="py-12 text-center">
            <MapPin className="h-10 w-10 mx-auto text-[#813405]/20 mb-3" />
            <p className="text-sm font-bold text-[#813405]/40">No saved addresses yet.</p>
          </div>
        )}
      </div>

      {/* Add New Address Button */}
      <div className="mt-5">
        <button
          onClick={onAddAddress}
          className="w-full h-13 rounded-full text-white text-sm font-black bg-[#FF5F00] hover:bg-[#D45113] active:scale-98 transition shadow-[0_8px_20px_rgba(255,95,0,0.25)] flex items-center justify-center gap-2"
        >
          Add a new address
        </button>
      </div>
    </ScreenShell>
  );
}

// ── Add/Edit Address Form View (Screenshot 2 Layout) ─────────────────────────────────
export function AddAddressFormView({
  initialAddress,
  geocodedPlace,
  onBack,
  onSave,
}: {
  initialAddress: SavedAddress | null;
  geocodedPlace?: SelectedPlace | null;
  onBack: () => void;
  onSave: (address: SavedAddress) => void;
}) {
  const { user } = useAuth();

  // Extract name parts from logged-in user
  let defaultFirstName = "";
  let defaultLastName = "";
  if (user?.name) {
    const parts = user.name.trim().split(/\s+/);
    defaultFirstName = parts[0] || "";
    defaultLastName = parts.slice(1).join(" ") || "";
  }

  // Extract phone number digits
  let defaultPhoneNumber = "";
  if (user?.phone) {
    let clean = user.phone.replace(/\D/g, ""); // keep only digits
    if (clean.startsWith("94")) {
      clean = clean.substring(2);
    }
    clean = clean.replace(/^0/, "");
    defaultPhoneNumber = clean;
  }

  // Prefill street address if editing
  const [streetAddress, setStreetAddress] = useState(
    initialAddress?.streetAddress || 
    (initialAddress?.address ? initialAddress.address : "")
  );

  const [fullName, setFullName] = useState(
    initialAddress?.fullName ||
    (initialAddress?.firstName ? `${initialAddress.firstName} ${initialAddress.lastName || ""}`.trim() : "") ||
    user?.name ||
    ""
  );
  const [email, setEmail] = useState(
    initialAddress?.email ||
    user?.email ||
    ""
  );
  const [phoneNumber, setPhoneNumber] = useState(initialAddress?.phoneNumber || defaultPhoneNumber);
  const [isDefault, setIsDefault] = useState(initialAddress?.isDefault || false);
  const [deliveryInstructions, setDeliveryInstructions] = useState(initialAddress?.deliveryInstructions || "");

  const canSave = useMemo(() => {
    return (
      streetAddress.trim() &&
      fullName.trim() &&
      email.trim() &&
      phoneNumber.trim().length >= 7
    );
  }, [streetAddress, fullName, email, phoneNumber]);

  const handleSaveClick = () => {
    if (!canSave) return;

    const nameParts = fullName.trim().split(/\s+/);
    const parsedFirstName = nameParts[0] || "";
    const parsedLastName = nameParts.slice(1).join(" ") || "";

    onSave({
      id: initialAddress?.id || `saved-${Date.now()}`,
      kind: initialAddress?.kind || "custom",
      label: fullName.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      firstName: parsedFirstName,
      lastName: parsedLastName,
      phoneNumber: phoneNumber.trim().replace(/^0/, ""), // clean leading 0
      streetAddress: streetAddress.trim(),
      address: streetAddress.trim(),
      deliveryInstructions: deliveryInstructions.trim(),
      isDefault: initialAddress ? isDefault : savedAddressesCount() === 0 ? true : isDefault,
      lat: geocodedPlace?.lat || initialAddress?.lat,
      lng: geocodedPlace?.lng || initialAddress?.lng,
    });
  };

  // Check how many saved addresses exist in context (to set default if 0)
  const { savedAddresses } = useLocationState();
  const savedAddressesCount = () => savedAddresses.length;

  return (
    <ScreenShell>
      {/* Header */}
      <div className="relative flex flex-col items-center border-b border-[#813405]/10 mb-5 pb-3">
        <button
          type="button"
          onClick={onBack}
          className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 hover:scale-105 active:scale-95 transition"
        >
          <ArrowLeft className="h-5 w-5 text-[#813405]" />
        </button>

        <h1 className="text-base font-black tracking-tight text-[#813405]">
          {initialAddress ? "Edit address" : "Add a new address"}
        </h1>

        {/* Lock indicator */}
        <div className="flex items-center gap-1 mt-0.5 text-[#16A34A] font-extrabold text-[10px]">
          <Lock className="h-3 w-3 fill-[#16A34A] stroke-[2px]" />
          <span>All data is safeguarded</span>
        </div>
      </div>

      {/* Form Fields container */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-4 pr-0.5" style={{ scrollbarWidth: "none" }}>

        {/* Street Address */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#813405] mb-2 pl-1">
            Delivery Address <span className="text-[#D45113]">*</span>
          </label>
          <textarea
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            placeholder="Ex.: No. 12, Dockyard Road, Trincomalee"
            rows={3}
            className="w-full bg-white border border-[#813405]/10 rounded-2xl px-4 py-3 text-sm font-semibold text-[#813405] outline-none focus:border-[#D45113] placeholder-[#813405]/20 resize-none leading-relaxed"
          />
        </div>

        {/* Full Name & Email Address fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#813405] mb-2 pl-1">
              Full Name <span className="text-[#D45113]">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="w-full h-12 bg-white border border-[#813405]/10 rounded-2xl px-4 text-sm font-semibold text-[#813405] outline-none focus:border-[#D45113]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#813405] mb-2 pl-1">
              Email Address <span className="text-[#D45113]">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full h-12 bg-white border border-[#813405]/10 rounded-2xl px-4 text-sm font-semibold text-[#813405] outline-none focus:border-[#D45113]"
            />
          </div>
        </div>

        {/* Phone number */}
        <div>
          <div className="flex justify-between items-center mb-2 pl-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#813405]">
              Phone number <span className="text-[#D45113]">*</span>
            </label>

          </div>

          <div className="flex h-12 bg-white border border-[#813405]/10 rounded-2xl px-4 items-center focus-within:border-[#D45113]">
            {/* LK +94 indicator */}
            <span className="text-[#813405] text-sm font-black flex items-center pr-3 border-r border-[#813405]/10 mr-3 select-none">
              LK +94
            </span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="741 070620"
              className="min-w-0 flex-1 bg-transparent text-sm font-black tracking-wide text-[#813405] outline-none"
            />
          </div>
        </div>

        {/* Delivery instructions (Optional) */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#813405] mb-2 pl-1">
            Delivery instructions
          </label>
          <input
            type="text"
            value={deliveryInstructions}
            onChange={(e) => setDeliveryInstructions(e.target.value)}
            placeholder="Call before arriving, leave at the door, etc."
            className="w-full h-12 bg-white border border-[#813405]/10 rounded-2xl px-4 text-sm font-semibold text-[#813405] outline-none focus:border-[#D45113]"
          />
        </div>

        {/* Set as default checkbox */}
        <label className="flex items-center gap-3 select-none cursor-pointer pl-1 mt-2">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 rounded text-[#D45113] accent-[#D45113] border-[#813405]/20 focus:ring-0 focus:outline-none"
          />
          <span className="text-sm font-extrabold text-[#813405]">Set as my default address</span>
        </label>
      </div>

      {/* Save Button */}
      <div className="mt-4">
        <button
          onClick={handleSaveClick}
          disabled={!canSave}
          className="w-full h-13 rounded-full text-white text-sm font-black bg-[#FF5F00] hover:bg-[#D45113] active:scale-98 disabled:opacity-40 disabled:pointer-events-none transition shadow-[0_8px_20px_rgba(255,95,0,0.25)]"
        >
          Save and use
        </button>
      </div>
    </ScreenShell>
  );
}

function MapConfirmationScreen({
  initialPlace,
  onBack,
  onConfirm,
  onPlaceChange,
}: {
  initialPlace: SelectedPlace;
  onBack: () => void;
  onConfirm: (place: SelectedPlace) => void;
  onPlaceChange: (place: SelectedPlace) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const idleListenerRef = useRef<any>(null);
  const [place, setPlace] = useState(initialPlace);
  const [mapError, setMapError] = useState("");

  const updatePlace = useCallback(
    async (coords: Coordinates) => {
      const nextPlace = await reverseGeocode(coords);
      setPlace(nextPlace);
      onPlaceChange(nextPlace);
    },
    [onPlaceChange],
  );

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapContainerRef.current) return;
        const maps = getGoogleMaps();

        mapRef.current = new maps.Map(mapContainerRef.current, {
          center: { lat: initialPlace.lat, lng: initialPlace.lng },
          zoom: 17,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: "greedy",
          styles: [
            { featureType: "poi.business", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ],
        });

        idleListenerRef.current = mapRef.current.addListener("idle", () => {
          const center = mapRef.current.getCenter();
          if (!center) return;
          updatePlace({ lat: center.lat(), lng: center.lng() });
        });
      })
      .catch((error) => setMapError(error instanceof Error ? error.message : "Unable to load Google Maps."));

    return () => {
      cancelled = true;
      idleListenerRef.current?.remove?.();
    };
  }, [initialPlace.lat, initialPlace.lng, updatePlace]);

  const moveToCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      mapRef.current?.panTo(coords);
      updatePlace(coords);
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="relative h-screen overflow-hidden"
      style={{ background: C.soft }}
    >
      <div ref={mapContainerRef} className="absolute inset-0" />

      {mapError && (
        <div className="absolute inset-0 grid place-items-center px-6 text-center z-20">
          <div className="rounded-[28px] p-5 shadow-xl bg-white border border-gray-100 max-w-xs">
            <p className="text-sm font-bold text-[#D45113]">{mapError}</p>
            <p className="mt-2 text-xs text-[#813405]/50">
              Please check VITE_GOOGLE_MAPS_API_KEY settings.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="absolute left-5 top-5 z-10 grid h-11 w-11 place-items-center rounded-full bg-white shadow-md border border-gray-100 hover:scale-105 active:scale-95 transition"
      >
        <ArrowLeft className="h-5 w-5 text-[#813405]" />
      </button>

      <button
        type="button"
        onClick={moveToCurrentLocation}
        className="absolute right-5 top-5 z-10 grid h-12 w-12 place-items-center rounded-full bg-white shadow-md border border-gray-100 hover:scale-105 active:scale-95 transition"
      >
        <LocateFixed className="h-5 w-5 text-[#606C38]" />
      </button>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full"
      >
        <MapPin className="h-12 w-12 text-[#D45113] fill-[#F9A03F]" />
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-[34px] bg-white px-5 pb-6 pt-5 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] border-t border-gray-50 max-w-md mx-auto">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-100" />
        <h2 className="text-lg font-black text-[#813405]">
          Confirm your location
        </h2>
        <p className="mt-1 text-xs font-semibold text-[#813405]/50">
          Press Confirm if this location is correct
        </p>

        <div className="mt-4 flex gap-3 rounded-[24px] border border-gray-100 p-4 bg-gray-50/50">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white shadow-sm border border-gray-100">
            <MapPin className="h-5 w-5 text-[#606C38]" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black text-[#813405]">
              Selected address
            </p>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-[#813405]/60">
              {place.formattedAddress}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onConfirm(place)}
          className="mt-5 h-13 w-full rounded-full text-white text-sm font-black bg-[#FF5F00] hover:bg-[#D45113] active:scale-98 transition shadow-[0_8px_20px_rgba(255,95,0,0.25)]"
        >
          Confirm Location
        </button>
      </div>
    </motion.section>
  );
}
