// Pure placement helpers shared by the passport book UI and tests. Every change to a
// stamp's spot goes through `clampPlacement`, so the rotated stamp always stays on the paper.

import { PAGE_ASPECT, STAMP_WIDTH } from "../../content/passport";
import { clampPlacement, type ProgressService, type StampPlacement } from "../../services/progress";

export interface Spot {
  x: number;
  y: number;
  widthRatio: number;
  rotationDeg: number;
}

export const ROTATE_STEP = 15;
export const SIZE_STEP = 0.04;
export const NUDGE_STEP = 0.01;

/** Screen point → normalised page coordinates. `rect` is the page's on-screen box (scaling included). */
export function pointToPage(rect: { left: number; top: number; width: number; height: number }, clientX: number, clientY: number) {
  return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
}

export const fit = (s: Spot): Spot => clampPlacement(s);
export const moveTo = (s: Spot, x: number, y: number) => fit({ ...s, x, y });
export const nudge = (s: Spot, dx: number, dy: number) => fit({ ...s, x: s.x + dx, y: s.y + dy });
export const rotate = (s: Spot, deg: number) => fit({ ...s, rotationDeg: s.rotationDeg + deg });
export const resize = (s: Spot, d: number) => fit({ ...s, widthRatio: s.widthRatio + d });

/** Rough overlap test (circles in page-width units). Only used for a gentle note, never to block. */
export function overlapsAny(s: Spot, others: Spot[]) {
  return others.some((o) => {
    const dx = s.x - o.x;
    const dy = (s.y - o.y) / PAGE_ASPECT;
    return Math.hypot(dx, dy) < ((s.widthRatio + o.widthRatio) / 2) * 0.8;
  });
}

/** Where a newly chosen stamp starts: the first of a few tidy spots that doesn't cover another stamp. */
export function freeSpot(others: Spot[], widthRatio = STAMP_WIDTH.default): Spot {
  const spots = [
    [0.5, 0.45],
    [0.3, 0.3],
    [0.7, 0.3],
    [0.3, 0.7],
    [0.7, 0.7],
    [0.5, 0.78],
    [0.5, 0.22],
  ];
  for (const [x, y] of spots) {
    const s = fit({ x, y, widthRatio, rotationDeg: 0 });
    if (!overlapsAny(s, others)) return s;
  }
  return fit({ x: 0.5, y: 0.45, widthRatio, rotationDeg: 0 }); // a full page: overlapping is allowed
}

/** Short text for the screen-reader live region. */
export function describeSpot(s: Spot, pageLabel: string) {
  const deg = Math.round(s.rotationDeg);
  return `${pageLabel}: ${Math.round(s.x * 100)}% across, ${Math.round(s.y * 100)}% down, ${deg === 0 ? "upright" : `rotated ${deg}°`}, ${Math.round(s.widthRatio * 100)}% of the page wide.`;
}

/**
 * Undo the last placement change. `prev === null` means the stamp was placed for the
 * first time, so undo returns it to the tray; otherwise the previous spot (and layer) is restored.
 */
export function undoPlacement(svc: Pick<ProgressService, "saveStampPlacement" | "removeStampPlacement">, earnedStampId: string, prev: StampPlacement | null) {
  if (!prev) {
    svc.removeStampPlacement(earnedStampId);
    return null;
  }
  const { pageId, x, y, widthRatio, rotationDeg, zIndex } = prev;
  return svc.saveStampPlacement(earnedStampId, { pageId, x, y, widthRatio, rotationDeg, zIndex });
}
