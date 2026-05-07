import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Footer } from "@/components/Footer";
import { AddAddressModal } from "@/components/location/AddAddressModal";
import { CurrentLocationCard } from "@/components/location/CurrentLocationCard";
import { LocationSearchBar } from "@/components/location/LocationSearchBar";
import { MapPreview } from "@/components/location/MapPreview";
import { RecentLocationItem } from "@/components/location/RecentLocationItem";
import { SavedAddressCard } from "@/components/location/SavedAddressCard";
import {
  type LocationOption,
  type SavedAddress,
  useLocationState,
} from "@/context/LocationContext";

const C = {
  bg: "#F7F0E3",
} as const;

type ModalState = {
  title: string;
  initialAddress?: SavedAddress | null;
};

export function LocationPage() {
  const navigate = useNavigate();
  const {
    selectedLocation,
    suggestions,
    savedAddresses,
    recentLocations,
    setSelectedLocation,
    saveAddress,
  } = useLocationState();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<LocationOption | null>(
    null
  );
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) {
      return suggestions.slice(0, 5);
    }

    const search = query.toLowerCase();
    return suggestions.filter(
      (location) =>
        location.label.toLowerCase().includes(search) ||
        location.address.toLowerCase().includes(search)
    );
  }, [query, suggestions]);

  const handleSelectLocation = (location: LocationOption) => {
    setSelectedLocation(location);
    navigate({ to: "/home" });
  };

  const handleTypedLocation = () => {
    if (!query.trim()) return;
    handleSelectLocation({
      id: `typed-${Date.now()}`,
      label: query,
      address: query,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (filteredSuggestions.length > 0) {
        handleSelectLocation(filteredSuggestions[0]);
      } else {
        handleTypedLocation();
      }
    }
  };

  const handleUseCurrentLocation = () => {
    if (isDetectingLocation) {
      return;
    }

    setIsDetectingLocation(true);
    window.setTimeout(() => {
      setDetectedLocation({
        id: "current-trinco",
        label: "Current Location",
        address: "Alexandra Road, Trincomalee",
        note: "Detected from your device",
      });
      setIsDetectingLocation(false);
    }, 1500);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: `radial-gradient(circle at top right, rgba(249,160,63,0.15), transparent 28%), ${C.bg}`,
      }}
    >
      <motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-8 pt-4 sm:px-5"
      >
        <div className="flex-1">
          <section className="relative overflow-hidden rounded-[34px] border px-5 py-5 sm:px-6 sm:py-6">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(145deg, rgba(255,252,245,0.94), rgba(248,221,164,0.65))",
              }}
            />
            <div
              className="absolute -right-10 top-0 h-36 w-36 rounded-full"
              style={{ background: "rgba(249,160,63,0.14)", filter: "blur(14px)" }}
            />
            <div className="relative">
              <div className="flex items-start gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate({ to: "/home" })}
                  className="grid h-11 w-11 place-items-center rounded-2xl border"
                  style={{
                    borderColor: "rgba(129,52,5,0.12)",
                    background: "rgba(255,252,245,0.76)",
                  }}
                >
                  <ArrowLeft className="h-5 w-5 text-[#813405]" />
                </motion.button>

                <div className="min-w-0">
                  <p className="text-2xl font-black leading-tight text-[#813405]">
                    Choose delivery location
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[#81340599]">
                    Find restaurants and delivery near you
                  </p>
                </div>
              </div>

              <div
                className="mt-5 rounded-[26px] border px-4 py-3"
                style={{
                  background: "rgba(255,252,245,0.66)",
                  borderColor: "rgba(129,52,5,0.08)",
                }}
              >
                <p className="text-xs uppercase tracking-[0.22em] text-[#81340580]">
                  Currently selected
                </p>
                <p className="mt-2 text-sm font-semibold text-[#813405]">
                  {selectedLocation.label}
                </p>
                <p className="text-sm text-[#81340599]">
                  {selectedLocation.address}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-5">
            <LocationSearchBar
              value={query}
              focused={focused}
              onChange={setQuery}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
            />

            <AnimatePresence>
              {(focused || query) && filteredSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="mt-3 overflow-hidden rounded-[28px] border"
                  style={{
                    background: "rgba(255,252,245,0.92)",
                    borderColor: "rgba(129,52,5,0.1)",
                    boxShadow: "0 20px 46px -30px rgba(129,52,5,0.28)",
                    backdropFilter: "blur(18px)",
                  }}
                >
                  {query.trim() && (
                    <button
                      onClick={handleTypedLocation}
                      className="flex w-full items-center justify-between border-b px-4 py-4 text-left group"
                      style={{ borderColor: "rgba(129,52,5,0.12)", background: "rgba(212,81,19,0.04)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#D45113]/10 flex items-center justify-center text-[#D45113]">
                          <Search size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#813405]">Use "{query}"</p>
                          <p className="text-[10px] text-[#81340580] uppercase tracking-wider">Set as delivery location</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#D45113] group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                  {filteredSuggestions.map((location) => (
                    <button
                      key={location.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelectLocation(location)}
                      className="flex w-full items-center justify-between border-b px-4 py-3 text-left last:border-b-0 hover:bg-white/40 transition-colors"
                      style={{ borderColor: "rgba(129,52,5,0.06)" }}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#813405]">
                          {location.label}
                        </p>
                        <p className="text-sm text-[#81340599]">
                          {location.address}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#D45113]" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section className="mt-6 space-y-4">
            <CurrentLocationCard
              loading={isDetectingLocation}
              onClick={handleUseCurrentLocation}
            />

            {detectedLocation && (
              <MapPreview
                location={detectedLocation}
                onConfirm={() => handleSelectLocation(detectedLocation)}
              />
            )}
          </section>

          <section className="mt-7">
            <SectionHeading title="Saved addresses" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(["home", "work"] as const).map((kind) => {
                const address = savedAddresses.find((item) => item.kind === kind);

                return (
                  <SavedAddressCard
                    key={kind}
                    kind={kind}
                    address={address}
                    active={selectedLocation.id === address?.id}
                    onSelect={() => {
                      if (address) {
                        handleSelectLocation(address);
                      } else {
                        setModalState({
                          title: `Add ${kind === "home" ? "Home" : "Work"}`,
                          initialAddress: {
                            id: `saved-${kind}`,
                            kind,
                            label: kind === "home" ? "Home" : "Work",
                            address: "",
                          },
                        });
                      }
                    }}
                    onAction={() =>
                      setModalState({
                        title: `${address ? "Edit" : "Add"} ${kind === "home" ? "Home" : "Work"}`,
                        initialAddress: {
                          id: address?.id ?? `saved-${kind}`,
                          kind,
                          label: address?.label ?? (kind === "home" ? "Home" : "Work"),
                          address: address?.address ?? "",
                        },
                      })
                    }
                  />
                );
              })}
            </div>
          </section>

          <section className="mt-7">
            <SectionHeading title="Recent locations" />
            <div className="mt-4 space-y-3">
              {recentLocations.map((location) => (
                <RecentLocationItem
                  key={location.id}
                  location={location}
                  onSelect={() => handleSelectLocation(location)}
                />
              ))}
            </div>
          </section>
        </div>

       
      </motion.main>

      <AddAddressModal
        open={Boolean(modalState)}
        title={modalState?.title ?? "Add address"}
        initialAddress={modalState?.initialAddress}
        onClose={() => setModalState(null)}
        onSave={({ id, label, address, kind }) => {
          saveAddress({ id, label, address, kind });
        }}
      />
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-lg font-bold text-[#813405]">{title}</p>
      <Link to="/home" className="text-sm font-medium text-[#D45113]">
        Done
      </Link>
    </div>
  );
}
