import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a lat/long pair into the manifest-chip coordinate string, e.g. "41.01N 28.98E" */
export function formatCoords(lat: number, lng: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}${ns} ${Math.abs(lng).toFixed(2)}${ew}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const countryNameMap: Record<string, string> = {
  TR: "Turkey",
  KE: "Kenya",
  SE: "Sweden",
  JP: "Japan",
  ZA: "South Africa",
  MX: "Mexico",
  NL: "Netherlands",
  PH: "Philippines",
  NO: "Norway",
  GB: "United Kingdom",
  IN: "India",
  US: "United States",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  GL: "Global"
};

export function formatCountryName(code: string): string {
  if (!code) return "Global";
  const upper = code.toUpperCase();
  return countryNameMap[upper] || code;
}
