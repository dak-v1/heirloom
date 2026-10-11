// Visitor progress: visits, earned stamps, passport placements and bonus badges.
//
// Guest mode, browser-local: everything lives in this browser (localStorage) under
// an opaque guest ID. Nothing here is sent to a server and nothing syncs across
// devices. Earning is idempotent (one stamp entitlement per site), and earning is
// separate from placement (Stage 2 places stamps in the passport book).

import { PAGE_ASPECT, STAMP_ASPECT, STAMP_WIDTH, STAMPABLE_PAGE_IDS } from "../content/passport";
import type { LangCode } from "../content/types";
import { createBrowserStore, randomId, readJson, writeJson, type KeyValueStore } from "./storage";

export const PROGRESS_KEY = "heirloom:progress:v1";

export interface VisitRecord {
  startedAt?: string;
  completedAt?: string;
  lastEraId?: string;
  hotspotsOpened: string[];
  narrationCompleted?: boolean;
  /** The visitor shared a note or drawing here (it may still be awaiting review). */
  memorySubmitted?: boolean;
  languagesUsed: LangCode[];
}

export interface EarnedStamp {
  id: string;
  siteId: string;
  stampDesignId: string;
  earnedAt: string;
  /** Visitor's local calendar date of the visit (YYYY-MM-DD), printed on the impression. */
  visitDate: string;
}

export interface StampPlacement {
  id: string;
  earnedStampId: string;
  pageId: string;
  /** Normalised centre on the logical page (0–1 of width / height). */
  x: number;
  y: number;
  /** Stamp width as a fraction of page width. */
  widthRatio: number;
  rotationDeg: number;
  zIndex: number;
  placedAt: string;
  updatedAt: string;
}

export interface GameAttempt {
  id: string;
  siteId: string;
  gameId: string;
  score: number;
  maxScore: number;
  perfect: boolean;
  completedAt: string;
}

export interface ProgressState {
  version: 1;
  guestId: string;
  createdAt: string;
  visits: Record<string, VisitRecord>;
  earnedStamps: EarnedStamp[];
  placements: StampPlacement[];
  badges: Record<string, { earnedAt: string }>;
  gameAttempts: GameAttempt[];
  passport: { currentPageId?: string };
  updatedAt: string;
}

export interface EarnResult {
  stamp: EarnedStamp;
  /** False when the visitor already held this site's stamp (repeat completion, refresh). */
  isNew: boolean;
  newBadges: string[];
}

export type PlacementInput = Pick<StampPlacement, "pageId" | "x" | "y" | "widthRatio" | "rotationDeg"> & { zIndex?: number };

export class PlacementError extends Error {}

type Listener = () => void;
type BadgeListener = (badgeIds: string[]) => void;

interface Options {
  store?: KeyValueStore;
  now?: () => Date;
  /** IDs of every published site, for the trail-complete badge. */
  siteIds?: string[];
}

function localDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function emptyState(now: Date): ProgressState {
  const iso = now.toISOString();
  return {
    version: 1,
    guestId: randomId("guest_"),
    createdAt: iso,
    visits: {},
    earnedStamps: [],
    placements: [],
    badges: {},
    gameAttempts: [],
    passport: {},
    updatedAt: iso,
  };
}

function isValidState(s: unknown): s is ProgressState {
  const v = s as ProgressState;
  return !!v && v.version === 1 && typeof v.guestId === "string" && Array.isArray(v.earnedStamps) && typeof v.visits === "object";
}

/** Keep a rotated stamp's whole footprint inside the page. Shared with the Stage 2 book UI. */
export function clampPlacement(p: { x: number; y: number; widthRatio: number; rotationDeg: number }) {
  const widthRatio = Math.min(STAMP_WIDTH.max, Math.max(STAMP_WIDTH.min, p.widthRatio));
  const rotationDeg = ((((p.rotationDeg + 180) % 360) + 360) % 360) - 180;
  const rad = (rotationDeg * Math.PI) / 180;
  const w = widthRatio; // in page-width units
  const h = widthRatio / STAMP_ASPECT; // in page-width units
  const pageH = 1 / PAGE_ASPECT; // page height in page-width units
  const halfX = (w / 2) * Math.abs(Math.cos(rad)) + (h / 2) * Math.abs(Math.sin(rad));
  const halfY = ((w / 2) * Math.abs(Math.sin(rad)) + (h / 2) * Math.abs(Math.cos(rad))) / pageH;
  const clamp = (v: number, lo: number, hi: number) => (lo > hi ? 0.5 : Math.min(hi, Math.max(lo, v)));
  return { x: clamp(p.x, halfX, 1 - halfX), y: clamp(p.y, halfY, 1 - halfY), widthRatio, rotationDeg };
}

export function createProgressService({ store = createBrowserStore(), now = () => new Date(), siteIds = [] }: Options = {}) {
  let state: ProgressState = load();
  const listeners = new Set<Listener>();
  const badgeListeners = new Set<BadgeListener>();

  function load(): ProgressState {
    const saved = readJson<ProgressState>(store, PROGRESS_KEY);
    if (isValidState(saved)) {
      return {
        ...emptyState(now()),
        ...saved,
        placements: saved.placements ?? [],
        badges: saved.badges ?? {},
        gameAttempts: saved.gameAttempts ?? [],
        passport: saved.passport ?? {},
      };
    }
    const fresh = emptyState(now());
    writeJson(store, PROGRESS_KEY, fresh);
    return fresh;
  }

  function commit(next: ProgressState, newBadges: string[] = []) {
    state = { ...next, updatedAt: now().toISOString() };
    writeJson(store, PROGRESS_KEY, state);
    listeners.forEach((l) => l());
    if (newBadges.length) badgeListeners.forEach((l) => l(newBadges));
  }

  function visit(s: ProgressState, siteId: string): VisitRecord {
    return s.visits[siteId] ?? { hotspotsOpened: [], languagesUsed: [] };
  }

  function withVisit(siteId: string, patch: (v: VisitRecord) => VisitRecord): ProgressState {
    return { ...state, visits: { ...state.visits, [siteId]: patch(visit(state, siteId)) } };
  }

  function award(next: ProgressState, ids: string[]): { next: ProgressState; awarded: string[] } {
    const awarded = ids.filter((id) => !next.badges[id]);
    if (!awarded.length) return { next, awarded };
    const stamp = now().toISOString();
    const badges = { ...next.badges };
    for (const id of awarded) badges[id] = { earnedAt: stamp };
    return { next: { ...next, badges }, awarded };
  }

  return {
    /** Current snapshot (immutable; replaced on every change). */
    getVisitorProgress: (): ProgressState => state,
    get persistent() {
      return store.persistent;
    },

    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    onBadges(listener: BadgeListener) {
      badgeListeners.add(listener);
      return () => void badgeListeners.delete(listener);
    },

    /** Re-read storage (another tab changed it). */
    reload() {
      state = load();
      listeners.forEach((l) => l());
    },

    markSiteStarted(siteId: string) {
      if (visit(state, siteId).startedAt) return;
      commit(withVisit(siteId, (v) => ({ ...v, startedAt: now().toISOString() })));
    },

    setLastEra(siteId: string, eraId: string) {
      if (visit(state, siteId).lastEraId === eraId) return;
      commit(withVisit(siteId, (v) => ({ ...v, lastEraId: eraId })));
    },

    /** Record a hotspot; awards Curious Mind once every hotspot at the site has been opened. */
    recordHotspotOpened(siteId: string, hotspotKey: string, allHotspotKeys: string[]) {
      const v = visit(state, siteId);
      if (v.hotspotsOpened.includes(hotspotKey)) return [];
      const opened = [...v.hotspotsOpened, hotspotKey];
      let next = withVisit(siteId, (x) => ({ ...x, hotspotsOpened: opened }));
      const complete = allHotspotKeys.length > 0 && allHotspotKeys.every((k) => opened.includes(k));
      const { next: n2, awarded } = award(next, complete ? ["curious-mind"] : []);
      next = n2;
      commit(next, awarded);
      return awarded;
    },

    recordLanguageUsed(siteId: string, lang: LangCode) {
      const v = visit(state, siteId);
      if (v.languagesUsed.includes(lang)) return [];
      const next = withVisit(siteId, (x) => ({ ...x, languagesUsed: [...x.languagesUsed, lang] }));
      const all = new Set(Object.values(next.visits).flatMap((x) => x.languagesUsed));
      const { next: n2, awarded } = award(next, all.size > 1 ? ["many-tongues"] : []);
      commit(n2, awarded);
      return awarded;
    },

    recordNarrationCompleted(siteId: string) {
      const next = withVisit(siteId, (x) => ({ ...x, narrationCompleted: true }));
      const { next: n2, awarded } = award(next, ["good-listener"]);
      commit(n2, awarded);
      return awarded;
    },

    /** A memory was submitted (pending review). Awards Memory Keeper once. */
    recordMemorySubmitted(siteId: string) {
      const next = withVisit(siteId, (x) => ({ ...x, memorySubmitted: true }));
      const { next: n2, awarded } = award(next, ["memory-keeper"]);
      commit(n2, awarded);
      return awarded;
    },

    recordGameResult(siteId: string, gameId: string, result: { score: number; maxScore: number; perfect: boolean }) {
      const attempt: GameAttempt = { id: randomId("game_"), siteId, gameId, ...result, completedAt: now().toISOString() };
      const next = { ...state, gameAttempts: [...state.gameAttempts, attempt].slice(-50) };
      const { next: n2, awarded } = award(next, ["time-traveller", ...(result.perfect ? ["sharp-eye"] : [])]);
      commit(n2, awarded);
      return awarded;
    },

    /**
     * Finish a visit and earn the site's stamp. Idempotent: calling again (refresh,
     * repeat visit, double tap) returns the existing entitlement instead of a copy.
     * Never depends on games, memories, GPS precision, narration or sign-in.
     */
    earnStamp(siteId: string, stampDesignId = `stamp-${siteId}`): EarnResult {
      const existing = state.earnedStamps.find((s) => s.siteId === siteId);
      if (existing) return { stamp: existing, isNew: false, newBadges: [] };
      const at = now();
      const stamp: EarnedStamp = { id: randomId("stamp_"), siteId, stampDesignId, earnedAt: at.toISOString(), visitDate: localDate(at) };
      let next: ProgressState = {
        ...withVisit(siteId, (v) => ({ ...v, startedAt: v.startedAt ?? at.toISOString(), completedAt: at.toISOString() })),
        earnedStamps: [...state.earnedStamps, stamp],
      };
      const earnedSites = new Set(next.earnedStamps.map((s) => s.siteId));
      const badgeIds = ["first-footsteps"];
      if (siteIds.length && siteIds.every((id) => earnedSites.has(id))) badgeIds.push("three-journeys");
      const { next: n2, awarded } = award(next, badgeIds);
      next = n2;
      commit(next, awarded);
      return { stamp, isNew: true, newBadges: awarded };
    },

    getEarnedStamps: () => state.earnedStamps,
    getUnplacedStamps: () => state.earnedStamps.filter((s) => !state.placements.some((p) => p.earnedStampId === s.id)),
    hasEarned: (siteId: string) => state.earnedStamps.some((s) => s.siteId === siteId),

    /** Saved placements; empty until Stage 2's passport book places stamps. */
    getPassportPlacements: () => state.placements,

    /**
     * Save or move one stamp's placement. Validates ownership, page ID and bounds,
     * clamps the rotated footprint inside the page, and never duplicates a stamp.
     */
    saveStampPlacement(earnedStampId: string, input: PlacementInput): StampPlacement {
      if (!state.earnedStamps.some((s) => s.id === earnedStampId)) throw new PlacementError("This stamp has not been earned in this passport.");
      if (!STAMPABLE_PAGE_IDS.includes(input.pageId)) throw new PlacementError(`Unknown or non-stampable page: ${input.pageId}`);
      for (const k of ["x", "y", "widthRatio", "rotationDeg"] as const) {
        if (!Number.isFinite(input[k])) throw new PlacementError(`Invalid ${k}`);
      }
      const fit = clampPlacement(input);
      const at = now().toISOString();
      const existing = state.placements.find((p) => p.earnedStampId === earnedStampId);
      const topZ = Math.max(0, ...state.placements.filter((p) => p.pageId === input.pageId).map((p) => p.zIndex));
      const placement: StampPlacement = existing
        ? { ...existing, pageId: input.pageId, ...fit, zIndex: input.zIndex ?? (existing.pageId === input.pageId ? existing.zIndex : topZ + 1), updatedAt: at }
        : { id: randomId("place_"), earnedStampId, pageId: input.pageId, ...fit, zIndex: input.zIndex ?? topZ + 1, placedAt: at, updatedAt: at };
      commit({ ...state, placements: [...state.placements.filter((p) => p.earnedStampId !== earnedStampId), placement] });
      return placement;
    },

    /** Undo / remove a placement: the stamp returns to the tray. */
    removeStampPlacement(earnedStampId: string) {
      if (!state.placements.some((p) => p.earnedStampId === earnedStampId)) return;
      commit({ ...state, placements: state.placements.filter((p) => p.earnedStampId !== earnedStampId) });
    },

    setCurrentPassportPage(pageId: string) {
      if (state.passport.currentPageId === pageId) return;
      commit({ ...state, passport: { ...state.passport, currentPageId: pageId } });
    },

    /**
     * Demo helper: add placeholder stamps (src/content/demo-stamps.ts) so the passport
     * looks well travelled. Ones with a `placement` are pressed straight onto that page.
     * Stamps already present are skipped; returns how many were added. No badges, no visits.
     */
    addDemoStamps(items: { siteId: string; visitDate: string; placement?: PlacementInput }[]): number {
      const have = new Set(state.earnedStamps.map((s) => s.siteId));
      const at = now().toISOString();
      const stamps: EarnedStamp[] = [];
      const placements = [...state.placements];
      for (const item of items) {
        if (have.has(item.siteId)) continue;
        have.add(item.siteId);
        const stamp: EarnedStamp = { id: randomId("stamp_"), siteId: item.siteId, stampDesignId: `stamp-${item.siteId}`, earnedAt: at, visitDate: item.visitDate };
        stamps.push(stamp);
        const pl = item.placement;
        if (pl && STAMPABLE_PAGE_IDS.includes(pl.pageId)) {
          const topZ = Math.max(0, ...placements.filter((x) => x.pageId === pl.pageId).map((x) => x.zIndex));
          placements.push({ id: randomId("place_"), earnedStampId: stamp.id, pageId: pl.pageId, ...clampPlacement(pl), zIndex: topZ + 1, placedAt: at, updatedAt: at });
        }
      }
      if (stamps.length) commit({ ...state, earnedStamps: [...state.earnedStamps, ...stamps], placements });
      return stamps.length;
    },

    /** Demo helper: take the placeholder stamps (and their placements) back out. */
    removeDemoStamps(siteIds: string[]) {
      const ids = new Set(state.earnedStamps.filter((s) => siteIds.includes(s.siteId)).map((s) => s.id));
      if (!ids.size) return;
      commit({ ...state, earnedStamps: state.earnedStamps.filter((s) => !ids.has(s.id)), placements: state.placements.filter((p) => !ids.has(p.earnedStampId)) });
    },

    /** Demo helper: wipe this browser's progress (new guest ID). */
    resetProgress() {
      commit(emptyState(now()));
    },
  };
}

export type ProgressService = ReturnType<typeof createProgressService>;
