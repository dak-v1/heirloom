// The visitor's profile: display name, map icon and how their badge pins are
// arranged on the achievement board. Browser-local like the passport; never sent anywhere.
import { AVATARS, DEFAULT_AVATAR } from "../content/avatars";
import { readJson, writeJson, type KeyValueStore } from "./storage";

export const PROFILE_KEY = "heirloom:profile:v1";
export const NAME_MAX = 24;
export const DEFAULT_NAME = "Guest explorer";

/** A pin's place on the board: centre in board widths (x) and heights (y), tilt, stacking. */
export interface PinSpot {
  x: number;
  y: number;
  rot: number;
  z: number;
}

export interface Profile {
  name: string;
  avatar: string;
  board: Record<string, PinSpot>;
  /** Pinned badges still wearing their NEW tag (cleared when looked at up close). */
  fresh: string[];
}

const empty = (): Profile => ({ name: "", avatar: DEFAULT_AVATAR, board: {}, fresh: [] });

/** Trim, collapse spaces, drop control characters and cap the length. */
export function sanitizeName(raw: string): string {
  return [...raw.replace(/\p{Cc}/gu, "").replace(/\s+/g, " ").trim()].slice(0, NAME_MAX).join("").trim();
}

export const displayName = (p: Pick<Profile, "name">) => p.name || DEFAULT_NAME;

const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function sanitizeSpot(s: unknown): PinSpot | null {
  if (!s || typeof s !== "object") return null;
  const { x, y, rot, z } = s as Record<string, unknown>;
  if (!finite(x) || !finite(y)) return null;
  return { x: clamp01(x), y: clamp01(y), rot: finite(rot) ? Math.max(-30, Math.min(30, rot)) : 0, z: finite(z) ? Math.max(0, Math.round(z)) : 1 };
}

/** Accept only well-formed saved data, so a corrupted entry can't break the page. */
export function parseProfile(raw: unknown): Profile {
  const base = empty();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const board: Record<string, PinSpot> = {};
  if (r.board && typeof r.board === "object") {
    for (const [id, spot] of Object.entries(r.board as Record<string, unknown>)) {
      const s = sanitizeSpot(spot);
      if (s) board[id] = s;
    }
  }
  return {
    name: typeof r.name === "string" ? sanitizeName(r.name) : "",
    avatar: typeof r.avatar === "string" && AVATARS.some((a) => a.id === r.avatar) ? r.avatar : DEFAULT_AVATAR,
    board,
    fresh: Array.isArray(r.fresh) ? r.fresh.filter((id): id is string => typeof id === "string" && id in board) : [],
  };
}

export function createProfileService(store: KeyValueStore) {
  let state = parseProfile(readJson(store, PROFILE_KEY));
  const listeners = new Set<() => void>();
  const commit = (next: Profile) => {
    state = next;
    writeJson(store, PROFILE_KEY, state);
    listeners.forEach((l) => l());
  };

  return {
    get: () => state,
    subscribe(l: () => void) {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
    /** Re-read storage (another tab changed it). */
    reload() {
      state = parseProfile(readJson(store, PROFILE_KEY));
      listeners.forEach((l) => l());
    },
    setName(name: string) {
      commit({ ...state, name: sanitizeName(name) });
    },
    setAvatar(id: string) {
      if (AVATARS.some((a) => a.id === id)) commit({ ...state, avatar: id });
    },
    /** Pin newly earned badges to the board; they arrive with a NEW tag. */
    pinBadges(spots: Record<string, PinSpot>) {
      const ids = Object.keys(spots).filter((id) => !state.board[id]);
      if (!ids.length) return;
      const board = { ...state.board };
      for (const id of ids) board[id] = sanitizeSpot(spots[id])!;
      commit({ ...state, board, fresh: [...state.fresh, ...ids] });
    },
    movePin(id: string, spot: PinSpot) {
      const s = sanitizeSpot(spot);
      if (!s || !state.board[id]) return;
      commit({ ...state, board: { ...state.board, [id]: s } });
    },
    /** Replace every pin's spot at once (Tidy up). */
    arrange(spots: Record<string, PinSpot>) {
      const board = { ...state.board };
      for (const [id, spot] of Object.entries(spots)) {
        const s = sanitizeSpot(spot);
        if (s && board[id]) board[id] = s;
      }
      commit({ ...state, board });
    },
    markSeen(id: string) {
      if (state.fresh.includes(id)) commit({ ...state, fresh: state.fresh.filter((f) => f !== id) });
    },
    reset() {
      commit(empty());
    },
  };
}

export type ProfileService = ReturnType<typeof createProfileService>;
