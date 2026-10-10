// Location context, hook and labels live apart from the provider component so
// hot reloading the provider never creates a second context object.
import { createContext, useContext } from "react";
import type { Site } from "../../content/types";
import type { Fix, Suggestion } from "../../services/arrival";

export type LocationStatus = "off" | "requesting" | "active" | "approximate" | "denied" | "unavailable" | "unsupported" | "insecure";

export interface LocationContextValue {
  status: LocationStatus;
  /** Last real reading. Kept in memory only; never stored or sent anywhere. */
  fix: Fix | null;
  message: string | null;
  suggestion: Suggestion | null;
  start: () => void;
  stop: () => void;
  checkAgain: () => void;
  dismissSuggestion: () => void;
  clearSuggestion: () => void;
  /** Labelled demo: pretend to arrive at a site (or `demo:*` imprecise readings), through the same arrival flow. */
  simulateArrival: (siteIdOrDemo: string) => void;
  /** Distance from the last *real* fix, or null when unknown / too imprecise. */
  distanceTo: (site: Site) => number | null;
  nearest: { site: Site; distance: number } | null;
}

export const LocationContext = createContext<LocationContextValue | null>(null);
export function useGeo() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useGeo must be used inside LocationProvider");
  return ctx;
}

export const STATUS_LABEL: Record<LocationStatus, string> = {
  off: "Location off",
  requesting: "Asking for location…",
  active: "Location on",
  approximate: "Approximate location",
  denied: "Location blocked",
  unavailable: "Location unavailable",
  unsupported: "Location not supported",
  insecure: "Location needs https",
};
