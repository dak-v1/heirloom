import { useCallback, useState } from "react";

/** One pen stroke, in normalised canvas coordinates so it redraws at any size. */
export interface Stroke {
  color: string;
  /** Line width as a fraction of the canvas width. */
  size: number;
  points: [number, number][];
}

export interface MemoryDraftState {
  tab: "note" | "draw" | "photo";
  text: string;
  name: string;
  title: string;
  photo: string;
  strokes: Stroke[];
}

const EMPTY: MemoryDraftState = { tab: "photo", text: "", name: "", title: "", photo: "", strokes: [] };
const key = (siteId: string) => `heirloom:memory-draft:${siteId}`;

function load(siteId: string): MemoryDraftState {
  try {
    const raw = sessionStorage.getItem(key(siteId));
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Partial<MemoryDraftState>) };
  } catch {
    /* storage blocked or corrupt: start fresh */
  }
  return EMPTY;
}

function save(siteId: string, d: MemoryDraftState) {
  try {
    if (d.text || d.name || d.title || d.photo || d.strokes.length) sessionStorage.setItem(key(siteId), JSON.stringify(d));
    else sessionStorage.removeItem(key(siteId));
  } catch {
    /* quota or blocked: the draft still lives in memory for this visit */
  }
}

/** Drop every unsent memory draft in this tab (demo reset). */
export function clearAllMemoryDrafts() {
  try {
    for (const k of Object.keys(sessionStorage)) if (k.startsWith("heirloom:memory-draft:")) sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

/**
 * The memory being written for one site. Kept in state and in sessionStorage, so closing
 * the sheet, switching tabs or a failed submission never loses it. Cleared only after a
 * successful submission.
 */
export function useMemoryDraft(siteId: string) {
  const [draft, setDraft] = useState<MemoryDraftState>(() => load(siteId));
  const update = useCallback(
    (patch: Partial<MemoryDraftState>) =>
      setDraft((d) => {
        const next = { ...d, ...patch };
        save(siteId, next);
        return next;
      }),
    [siteId],
  );
  const clear = useCallback(() => {
    setDraft((d) => {
      const next = { ...EMPTY, tab: d.tab, name: d.name };
      save(siteId, next);
      return next;
    });
  }, [siteId]);
  return { draft, update, clear };
}
