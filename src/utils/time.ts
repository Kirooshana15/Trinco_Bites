import type { Restaurant } from "@/utils/data/mock";

export function isMenuItemTimeAvailable(timeAvailability?: string) {
  if (!timeAvailability || timeAvailability === 'All Day') return true;
  const hour = new Date().getHours();
  if (timeAvailability === 'Breakfast') return hour >= 6 && hour < 11;
  if (timeAvailability === 'Lunch') return hour >= 11 && hour < 16;
  if (timeAvailability === 'Dinner') return hour >= 16 && hour < 23;
  return true;
}

export function isRestaurantOpen(r: Restaurant) {
  if (r.temporaryClosure === true) return false;
  if (r.holidayMode === true) return false;
  if (r.vacationMode === true) return false;
  if (r.acceptOrders === false) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const parseTime = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(" ");
    if (parts.length < 2) return 0;
    const [time, modifier] = parts;
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  let openingTimeStr = r.openingTime;
  let closingTimeStr = r.closingTime;

  if (r.weeklyHours) {
    const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = daysMap[now.getDay()];
    let weekly = r.weeklyHours;
    if (typeof weekly === 'string') {
      try {
        weekly = JSON.parse(weekly);
      } catch (e) {
        weekly = null;
      }
    }
    if (weekly && weekly[currentDay]) {
      const todayHours = weekly[currentDay];
      if (!todayHours.open) {
        return false; // Closed today!
      }
      openingTimeStr = todayHours.from || openingTimeStr;
      closingTimeStr = todayHours.to || closingTimeStr;
    }
  }

  if (!openingTimeStr || !closingTimeStr) return false;

  const open = parseTime(openingTimeStr);
  const close = parseTime(closingTimeStr);

  if (close < open) {
    // Overlays midnight (e.g. 10 PM to 2 AM)
    return currentTime >= open || currentTime <= close;
  }
  return currentTime >= open && currentTime <= close;
}

export function getTodayHours(r: Restaurant) {
  const now = new Date();
  const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDay = daysMap[now.getDay()];

  let openingTimeStr = r.openingTime;
  let closingTimeStr = r.closingTime;

  if (r.weeklyHours) {
    let weekly = r.weeklyHours;
    if (typeof weekly === "string") {
      try {
        weekly = JSON.parse(weekly);
      } catch (e) {
        weekly = null;
      }
    }
    if (weekly && weekly[currentDay]) {
      const todayHours = weekly[currentDay];
      if (!todayHours.open) {
        return "Closed Today";
      }
      openingTimeStr = todayHours.from || openingTimeStr;
      closingTimeStr = todayHours.to || closingTimeStr;
    }
  }

  if (!openingTimeStr || !closingTimeStr) {
    return "Hours Unavailable";
  }

  return `${openingTimeStr} - ${closingTimeStr}`;
}
