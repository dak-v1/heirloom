// Foreground arrival detection: pure functions, no browser APIs, fully unit-tested.
//
// Given a stream of position fixes, decide when to *suggest* that the visitor is at
// a curated site. GPS is an aid to discovery, not proof of attendance, so:
//  - a site must be seen in range on consecutive fixes (debounce) before we suggest it;
//  - once suggested, it is not suggested again until the visitor has clearly left
//    (exit radius, hysteresis) and a cooldown has passed;
//  - poor accuracy produces an "approximate" suggestion that asks for confirmation;
//  - several candidates produce a chooser instead of a guess;
//  - dismissed sites stay quiet for the session until "Check nearby again".

export interface Fix {
  lat: number;
  lng: number;
  /** Reported accuracy radius in metres (68% confidence). */
  accuracy: number;
  timestamp: number;
  /** True for the labelled demo simulation; never mixed up with real readings. */
  simulated?: boolean;
}

export interface ArrivalSite {
  id: string;
  coords: { lat: number; lng: number };
  arrivalRadius: number;
}

export interface ArrivalConfig {
  /** Consecutive in-range fixes required before suggesting (real fixes only). */
  dwellFixes: number;
  /** Leave = distance beyond radius × exitFactor. */
  exitFactor: number;
  /** After leaving, wait this long before suggesting the same site again. */
  cooldownMs: number;
  /** Fixes worse than this cannot place you near any single site. */
  maxUsableAccuracy: number;
}

export const DEFAULT_ARRIVAL_CONFIG: ArrivalConfig = {
  dwellFixes: 2,
  exitFactor: 1.6,
  cooldownMs: 10 * 60 * 1000,
  maxUsableAccuracy: 400,
};

export interface DetectorState {
  /** Consecutive candidate fixes per site. */
  streak: Record<string, number>;
  /** Sites currently suggested or confirmed: suppressed until exit + cooldown. */
  announced: Record<string, { at: number; exitedAt?: number }>;
  /** Dismissed with "Not now" for this session. */
  dismissed: string[];
}

export const initialDetectorState = (): DetectorState => ({ streak: {}, announced: {}, dismissed: [] });

export interface Candidate {
  siteId: string;
  distance: number;
}

export type Suggestion =
  | { kind: "arrived"; candidates: [Candidate]; accuracy: number; simulated: boolean }
  | { kind: "approximate"; candidates: Candidate[]; accuracy: number; simulated: boolean }
  | { kind: "multiple"; candidates: Candidate[]; accuracy: number; simulated: boolean };

export interface Evaluation {
  state: DetectorState;
  suggestion: Suggestion | null;
  nearest: Candidate | null;
  /** The fix is too imprecise to place the visitor at any one site. */
  unusable: boolean;
}

const EARTH_RADIUS_M = 6_371_008.8;

export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(m: number): string {
  if (m < 50) return "less than 50 m away";
  if (m < 1000) return `about ${Math.round(m / 10) * 10} m away`;
  return `about ${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km away`;
}

export function evaluateArrival(
  sites: ArrivalSite[],
  fix: Fix,
  prev: DetectorState,
  now: number = fix.timestamp,
  config: ArrivalConfig = DEFAULT_ARRIVAL_CONFIG,
): Evaluation {
  const state: DetectorState = { streak: { ...prev.streak }, announced: { ...prev.announced }, dismissed: [...prev.dismissed] };
  const distances = sites.map((s) => ({ site: s, distance: distanceMeters(fix, s.coords) })).sort((a, b) => a.distance - b.distance);
  const nearest = distances[0] ? { siteId: distances[0].site.id, distance: distances[0].distance } : null;

  // Hysteresis: mark announced sites as exited once clearly out of range.
  for (const { site, distance } of distances) {
    const a = state.announced[site.id];
    if (a && !a.exitedAt && distance - Math.min(fix.accuracy, site.arrivalRadius) > site.arrivalRadius * config.exitFactor) {
      state.announced[site.id] = { ...a, exitedAt: now };
    }
  }

  const unusable = fix.accuracy > config.maxUsableAccuracy;
  if (unusable) {
    state.streak = {};
    return { state, suggestion: null, nearest, unusable };
  }

  const precise: Candidate[] = [];
  const possible: Candidate[] = [];
  for (const { site, distance } of distances) {
    const inRange = distance <= site.arrivalRadius;
    const maybe = !inRange && distance - fix.accuracy <= site.arrivalRadius;
    if (inRange && fix.accuracy <= site.arrivalRadius) precise.push({ siteId: site.id, distance });
    else if (inRange || maybe) possible.push({ siteId: site.id, distance });
  }
  const candidates = [...precise, ...possible];

  // Debounce: count consecutive candidate fixes per site; reset the rest.
  const nextStreak: Record<string, number> = {};
  for (const c of candidates) nextStreak[c.siteId] = (state.streak[c.siteId] ?? 0) + 1;
  state.streak = nextStreak;

  const needed = fix.simulated ? 1 : config.dwellFixes;
  const eligible = (c: Candidate) => {
    if (state.dismissed.includes(c.siteId)) return false;
    const a = state.announced[c.siteId];
    if (a && (!a.exitedAt || now - a.exitedAt < config.cooldownMs)) return false;
    return (state.streak[c.siteId] ?? 0) >= needed;
  };

  const readyPrecise = precise.filter(eligible);
  const readyPossible = possible.filter(eligible);
  let suggestion: Suggestion | null = null;
  if (readyPrecise.length === 1 && readyPossible.length === 0) {
    suggestion = { kind: "arrived", candidates: [readyPrecise[0]], accuracy: fix.accuracy, simulated: !!fix.simulated };
  } else if (readyPrecise.length + readyPossible.length > 1) {
    suggestion = { kind: "multiple", candidates: [...readyPrecise, ...readyPossible], accuracy: fix.accuracy, simulated: !!fix.simulated };
  } else if (readyPossible.length === 1) {
    suggestion = { kind: "approximate", candidates: readyPossible, accuracy: fix.accuracy, simulated: !!fix.simulated };
  }

  if (suggestion) {
    for (const c of suggestion.candidates) state.announced[c.siteId] = { at: now };
  }
  return { state, suggestion, nearest, unusable };
}

export function dismissSites(state: DetectorState, siteIds: string[]): DetectorState {
  return { ...state, dismissed: Array.from(new Set([...state.dismissed, ...siteIds])) };
}

/** "Check nearby again": clear dismissals and suppression so current surroundings are re-evaluated. */
export function resetForRecheck(state: DetectorState): DetectorState {
  return { ...state, dismissed: [], announced: {}, streak: {} };
}
