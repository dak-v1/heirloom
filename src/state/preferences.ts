import { useEffect, useSyncExternalStore } from "react";
import type { LangCode } from "../content/types";
import { createBrowserStore, readJson, writeJson } from "../services/storage";

export type MotionPref = "system" | "reduce" | "full";

export interface Preferences {
  storyLang: LangCode;
  motion: MotionPref;
  soundEffects: boolean;
  ambientVolume: number;
}

const KEY = "heirloom:prefs:v1";
const DEFAULTS: Preferences = { storyLang: "en", motion: "system", soundEffects: true, ambientVolume: 0.6 };
const store = createBrowserStore();
let prefs: Preferences = { ...DEFAULTS, ...(readJson<Partial<Preferences>>(store, KEY) ?? {}) };
const listeners = new Set<() => void>();

function applyMotion() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (prefs.motion === "reduce") root.dataset.motion = "reduced";
  else if (prefs.motion === "full") root.dataset.motion = "full";
  else delete root.dataset.motion;
}
applyMotion();

export function getPreferences() {
  return prefs;
}

export function setPreferences(patch: Partial<Preferences>) {
  prefs = { ...prefs, ...patch };
  writeJson(store, KEY, prefs);
  applyMotion();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => void listeners.delete(l);
}

export function usePreferences() {
  return useSyncExternalStore(subscribe, getPreferences, getPreferences);
}

const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
function subscribeMq(l: () => void) {
  mq?.addEventListener("change", l);
  return () => mq?.removeEventListener("change", l);
}

/** True when motion should be minimised (system setting or the in-app override). */
export function useReducedMotion(): boolean {
  const p = usePreferences();
  const system = useSyncExternalStore(subscribeMq, () => !!mq?.matches, () => false);
  return p.motion === "reduce" || (p.motion === "system" && system);
}

/** Non-hook check for imperative animation code. */
export function prefersReducedMotion(): boolean {
  return prefs.motion === "reduce" || (prefs.motion === "system" && !!mq?.matches);
}

/** Keep <html data-motion> in sync after hydration. */
export function useApplyMotion() {
  const p = usePreferences();
  useEffect(applyMotion, [p.motion]);
}
