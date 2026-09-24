const CURRENCY_SYMBOLS = {
  BDT: "৳",
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  PKR: "₨",
  AED: "د.إ",
};

export function formatMoney(amount, currency = "BDT") {
  const symbol = CURRENCY_SYMBOLS[currency] || currency + " ";
  const n = Number(amount) || 0;
  const formatted = Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? "-" : ""}${symbol}${formatted}`;
}

export function formatDate(date, style = "medium") {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  if (style === "short") {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  if (style === "time") {
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function monthKey(d = new Date()) {
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key) {
  if (!key) return "";
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const CURRENCIES = Object.keys(CURRENCY_SYMBOLS);
