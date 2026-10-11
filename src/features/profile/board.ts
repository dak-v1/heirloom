// Geometry of the achievement board: a canvas pennant (straight sides, pointed
// tail) that badge pins are pushed into. Pure functions, shared with the tests.
import type { PinSpot } from "../../services/profile";

/** Board width ÷ height. */
export const BOARD_ASPECT = 0.72;
/** Where the straight sides end and the point begins, as a fraction of the height. */
export const BODY_END = 0.8;
/** A pin's box, as a fraction of the board width. */
export const PIN_SIZE = 0.29;
/** Below the dowel sleeve at the top (fraction of the height). */
const TOP = 0.075;
const SIDE = 0.035;

const HX = PIN_SIZE / 2;
const HY = (PIN_SIZE / 2) * BOARD_ASPECT;

/** Free half-width (board widths) for a pin centred at height y, so it stays on the cloth. */
function halfSpan(y: number) {
  const probe = y + HY * 0.55;
  if (probe <= BODY_END) return 0.5 - SIDE - HX * 0.8;
  return 0.5 * (1 - (probe - BODY_END) / (1 - BODY_END)) - HX * 0.75;
}

const Y_MIN = TOP + HY * 0.9;
const Y_MAX = (() => {
  let y = BODY_END;
  while (halfSpan(y + 0.002) > 0.02) y += 0.002;
  return y;
})();

/** Keep a pin's centre where the whole pin sits on the pennant. */
export function clampToBoard(p: { x: number; y: number }): { x: number; y: number } {
  const y = Math.min(Y_MAX, Math.max(Y_MIN, p.y));
  const span = Math.max(0, halfSpan(y));
  return { x: Math.min(0.5 + span, Math.max(0.5 - span, p.x)), y };
}

/**
 * A staggered layout (rows of 3 and 2 down the pennant), listed in the order pins
 * arrive so even a small collection spreads over the whole cloth. [x, y, tilt°]
 */
const SLOTS: [number, number, number][] = [
  [0.24, 0.19, -7],
  [0.66, 0.38, 6],
  [0.26, 0.58, -4],
  [0.66, 0.77, 5],
  [0.76, 0.18, 4],
  [0.34, 0.38, -6],
  [0.76, 0.58, -3],
  [0.36, 0.77, 7],
  [0.5, 0.17, -2],
  [0.5, 0.57, 3],
  [0.5, 0.92, -5],
  [0.5, 0.38, 2],
];

const slot = (i: number) => {
  const [x, y, rot] = SLOTS[i % SLOTS.length];
  return { ...clampToBoard({ x, y }), rot };
};

/** Distance between pin centres, in board widths. */
export function pinDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, (a.y - b.y) / BOARD_ASPECT);
}

export const topZ = (spots: PinSpot[]) => spots.reduce((m, s) => Math.max(m, s.z), 0);

/** Where a newly earned badge lands: the first scatter slot clear of the pins already there. */
export function nextSpot(existing: PinSpot[], seed = 0): PinSpot {
  const z = topZ(existing) + 1;
  let best = { s: slot(0), d: -1 };
  for (let i = 0; i < SLOTS.length; i++) {
    const s = slot(i);
    const d = existing.length ? Math.min(...existing.map((e) => pinDistance(s, e))) : Infinity;
    if (d >= PIN_SIZE * 0.85) return { ...s, z };
    if (d > best.d) best = { s, d };
  }
  // A full board: overlap where there's most room, nudged so stacked pins stay visible.
  const j = ((seed * 37) % 11) / 100 - 0.05;
  return { ...clampToBoard({ x: best.s.x + j, y: best.s.y - j }), rot: best.s.rot - 4, z };
}

/** Tidy up: every pin back to its own scatter slot, in the order given. */
export function tidySpots(ids: string[]): Record<string, PinSpot> {
  return Object.fromEntries(ids.map((id, i) => [id, { ...slot(i), z: i + 1 }]));
}
