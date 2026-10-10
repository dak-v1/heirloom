import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SITES } from "../../content/sites";
import type { Site } from "../../content/types";
import {
  dismissSites,
  distanceMeters,
  evaluateArrival,
  initialDetectorState,
  resetForRecheck,
  type DetectorState,
  type Fix,
  type Suggestion,
} from "../../services/arrival";
import { track } from "../../services/analytics";
import { LocationContext, type LocationContextValue, type LocationStatus } from "./geo-context";

const SESSION_FLAG = "heirloom:location-on";
const APPROX_THRESHOLD = 100;
const USABLE_FOR_DISTANCE = 1000;

const arrivalSites = SITES.map((s) => ({ id: s.id, coords: s.coords, arrivalRadius: s.arrivalRadius }));

export function LocationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LocationStatus>("off");
  const [fix, setFix] = useState<Fix | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const watchId = useRef<number | null>(null);
  const enabled = useRef(false);
  const detector = useRef<DetectorState>(initialDetectorState());
  const suggestionRef = useRef<Suggestion | null>(null);
  suggestionRef.current = suggestion;

  const onPosition = useCallback((pos: GeolocationPosition) => {
    const f: Fix = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, timestamp: pos.timestamp || Date.now() };
    setFix(f);
    setMessage(null);
    setStatus(f.accuracy > APPROX_THRESHOLD ? "approximate" : "active");
    const r = evaluateArrival(arrivalSites, f, detector.current, Date.now());
    detector.current = r.state;
    if (r.suggestion && !suggestionRef.current) {
      setSuggestion(r.suggestion);
      track("arrival_suggested", { kind: r.suggestion.kind, simulated: false });
    }
  }, []);

  const onError = useCallback((err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) {
      enabled.current = false;
      sessionStorage.removeItem(SESSION_FLAG);
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      setStatus("denied");
      setMessage("Location is blocked for this site. You can still choose a place from the map or list and tap “I'm here”.");
    } else if (err.code === err.TIMEOUT) {
      setStatus((s) => (s === "active" || s === "approximate" ? s : "unavailable"));
      setMessage("Finding your position is taking a while. Try again outdoors, or pick a place from the list.");
    } else {
      setStatus("unavailable");
      setMessage("Your device couldn't determine a position right now. Try again, or pick a place from the list.");
    }
  }, []);

  const beginWatch = useCallback(() => {
    if (watchId.current !== null) return;
    watchId.current = navigator.geolocation.watchPosition(onPosition, onError, { enableHighAccuracy: true, maximumAge: 15_000, timeout: 25_000 });
  }, [onPosition, onError]);

  const endWatch = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
  }, []);

  const start = useCallback(() => {
    if (!window.isSecureContext) {
      setStatus("insecure");
      setMessage("Location needs a secure (https) connection. Pick a place from the list instead.");
      return;
    }
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      setMessage("This browser can't share your location. Pick a place from the list instead.");
      return;
    }
    enabled.current = true;
    sessionStorage.setItem(SESSION_FLAG, "1");
    setStatus((s) => (s === "active" || s === "approximate" ? s : "requesting"));
    setMessage(null);
    endWatch();
    beginWatch();
  }, [beginWatch, endWatch]);

  const stop = useCallback(() => {
    enabled.current = false;
    sessionStorage.removeItem(SESSION_FLAG);
    endWatch();
    setFix(null);
    setStatus("off");
    setMessage(null);
  }, [endWatch]);

  // Pause tracking while the page is hidden; re-check when the visitor returns.
  useEffect(() => {
    const onVis = () => {
      if (!enabled.current) return;
      if (document.visibilityState === "hidden") endWatch();
      else beginWatch();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [beginWatch, endWatch]);

  // Resume after a reload in the same tab, only if permission was already granted (no new prompt).
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_FLAG) !== "1" || !navigator.permissions?.query) return;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((p) => {
        if (p.state === "granted") start();
      })
      .catch(() => {});
    return endWatch;
  }, [start, endWatch]);

  const checkAgain = useCallback(() => {
    detector.current = resetForRecheck(detector.current);
    setSuggestion(null);
    if (!enabled.current) start();
  }, [start]);

  const dismissSuggestion = useCallback(() => {
    if (suggestionRef.current) detector.current = dismissSites(detector.current, suggestionRef.current.candidates.map((c) => c.siteId));
    setSuggestion(null);
  }, []);

  const clearSuggestion = useCallback(() => setSuggestion(null), []);

  /** Labelled demo readings. A throwaway detector means they never touch real location state. */
  const simulateArrival = useCallback((target: string) => {
    let simulated: Fix | null = null;
    const site = SITES.find((s) => s.id === target);
    if (site) simulated = { lat: site.coords.lat, lng: site.coords.lng, accuracy: 8, timestamp: Date.now(), simulated: true };
    else if (target === "demo:chinatown-imprecise") {
      // Halfway between the two Chinatown sites with a wide accuracy circle: both could match.
      const [a, b] = [SITES.find((s) => s.id === "thian-hock-keng"), SITES.find((s) => s.id === "sri-mariamman-temple")];
      if (a && b) simulated = { lat: (a.coords.lat + b.coords.lat) / 2, lng: (a.coords.lng + b.coords.lng) / 2, accuracy: 140, timestamp: Date.now(), simulated: true };
    } else if (target === "demo:kampong-glam-imprecise") {
      // ~170 m from Sultan Mosque with ±200 m accuracy: a "might be near" suggestion.
      const m = SITES.find((s) => s.id === "sultan-mosque");
      if (m) simulated = { lat: m.coords.lat + 0.0015, lng: m.coords.lng, accuracy: 200, timestamp: Date.now(), simulated: true };
    }
    if (!simulated) return;
    const r = evaluateArrival(arrivalSites, simulated, initialDetectorState());
    if (r.suggestion) {
      setSuggestion(r.suggestion);
      track("arrival_suggested", { kind: r.suggestion.kind, simulated: true });
    }
  }, []);

  const distanceTo = useCallback((site: Site) => (fix && fix.accuracy <= USABLE_FOR_DISTANCE ? distanceMeters(fix, site.coords) : null), [fix]);

  const nearest = useMemo(() => {
    if (!fix || fix.accuracy > USABLE_FOR_DISTANCE) return null;
    return SITES.map((site) => ({ site, distance: distanceMeters(fix, site.coords) })).sort((a, b) => a.distance - b.distance)[0] ?? null;
  }, [fix]);

  const value = useMemo<LocationContextValue>(
    () => ({ status, fix, message, suggestion, start, stop, checkAgain, dismissSuggestion, clearSuggestion, simulateArrival, distanceTo, nearest }),
    [status, fix, message, suggestion, start, stop, checkAgain, dismissSuggestion, clearSuggestion, simulateArrival, distanceTo, nearest],
  );
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}
