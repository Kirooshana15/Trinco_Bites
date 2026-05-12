import type { Restaurant } from "@/utils/data/mock";

export function isRestaurantOpen(r: Restaurant) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const parseTime = (timeStr: string) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const open = parseTime(r.openingTime);
  const close = parseTime(r.closingTime);

  if (close < open) {
    // Overlays midnight (e.g. 10 PM to 2 AM)
    return currentTime >= open || currentTime <= close;
  }
  return currentTime >= open && currentTime <= close;
}
