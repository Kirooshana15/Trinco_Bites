import { AnimatePresence, motion } from "framer-motion";
import { MapPinned, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { SavedAddress } from "@/context/LocationContext";

type AddAddressModalProps = {
  open: boolean;
  title: string;
  initialAddress?: SavedAddress | null;
  onClose: () => void;
  onSave: (payload: {
    id: string;
    label: string;
    address: string;
    kind: SavedAddress["kind"];
  }) => void;
};

export function AddAddressModal({
  open,
  title,
  initialAddress,
  onClose,
  onSave,
}: AddAddressModalProps) {
  const [addressName, setAddressName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Trincomalee");

  useEffect(() => {
    if (!open) {
      return;
    }

    setAddressName(initialAddress?.label ?? "");
    setStreet(initialAddress?.address.split(",")[0] ?? "");
    setCity(initialAddress?.address.split(",").slice(1).join(",").trim() || "Trincomalee");
  }, [initialAddress, open]);

  const kind = initialAddress?.kind ?? "custom";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end bg-[#1b0900]/45 p-3 sm:items-center sm:justify-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.24 }}
            className="w-full max-w-md rounded-[32px] border p-5"
            style={{
              background: "rgba(255,252,245,0.97)",
              borderColor: "rgba(129,52,5,0.12)",
              boxShadow: "0 28px 60px -28px rgba(129,52,5,0.35)",
              backdropFilter: "blur(22px)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-[#813405]">{title}</p>
                <p className="mt-1 text-sm text-[#81340599]">
                  Save a precise delivery spot for faster checkout.
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-2xl bg-[#813405]/5 text-[#813405]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <Field
                label="Address name"
                value={addressName}
                onChange={setAddressName}
                placeholder="Home, Work, Villa..."
              />
              <Field
                label="Street"
                value={street}
                onChange={setStreet}
                placeholder="No 12, Dockyard Road"
              />
              <Field
                label="City"
                value={city}
                onChange={setCity}
                placeholder="Trincomalee"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const nextLabel = addressName.trim() || title.replace(/^Add /, "");
                const nextStreet = street.trim() || "Unnamed street";
                const nextCity = city.trim() || "Trincomalee";

                onSave({
                  id:
                    initialAddress?.id ??
                    `saved-${nextLabel.toLowerCase().replace(/\s+/g, "-")}`,
                  label: nextLabel,
                  address: `${nextStreet}, ${nextCity}`,
                  kind,
                });
                onClose();
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[#F8DDA4]"
              style={{
                background:
                  "linear-gradient(135deg, #813405 0%, #D45113 65%, #F9A03F 100%)",
              }}
            >
              <MapPinned className="h-4 w-4" />
              Save address
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

function Field({ label, value, onChange, placeholder }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#813405]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border bg-white/70 px-4 py-3 text-sm text-[#5b2200] outline-none placeholder:text-[#813405b3]"
        style={{ borderColor: "rgba(129,52,5,0.28)" }}
      />
    </label>
  );
}
