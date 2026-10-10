// Logical passport model shared by stamp earning (Stage 1), the book UI and the
// 3D asset. Page IDs are stable: placements reference them forever.
// Page list and 3D leaf layout live in passport-layout.json, which the asset
// pipeline (scripts/assets/build-3d.mjs) also reads.
import LAYOUT from "./passport-layout.json";

/** Fixed logical page aspect: 88 × 125 mm passport page (width / height). */
export const PAGE_ASPECT = 88 / 125;

/** Stamp artwork aspect (width / height) — matches the 300 × 380 SVGs. */
export const STAMP_ASPECT = 300 / 380;

export interface PassportPage {
  id: string;
  index: number;
  kind: "cover" | "identity" | "stamp";
  title?: string;
  /** Decorative page template (same names in the 2D book CSS and the 3D page art). */
  template: string;
}

export const PASSPORT_PAGES: PassportPage[] = LAYOUT.pages.map((p, index) => ({ ...p, index, kind: p.kind as PassportPage["kind"] }));

export const STAMPABLE_PAGE_IDS = PASSPORT_PAGES.filter((p) => p.kind === "stamp").map((p) => p.id);

/** Default and allowed stamp sizes, as a fraction of page width. */
export const STAMP_WIDTH = { default: 0.38, min: 0.22, max: 0.55 };

/* ---------------- 3D book: leaves and spreads ---------------- */

/** One turnable sheet of the 3D passport: `recto` faces up on the right, `verso` shows on the left once turned. */
export interface Leaf {
  node: string;
  recto: string;
  verso: string;
}

export const LEAVES: Leaf[] = LAYOUT.leaves;

/** Inside of the front cover (left of the first spread). Not a logical page. */
export const COVER_INSIDE = "cover-inside";

/**
 * An open spread of the 3D book. Spread `s` has `s` leaves turned: its left page is the
 * verso of leaf `s` (or the inside cover for s = 0) and its right page the recto of leaf `s + 1`.
 * Only spreads whose right page is a logical page are reachable (the last leaf's verso is decorative).
 */
export interface Spread {
  index: number;
  left: string;
  right: string;
}

export const SPREADS: Spread[] = LEAVES.map((leaf, s) => ({ index: s, left: s === 0 ? COVER_INSIDE : LEAVES[s - 1].verso, right: leaf.recto }));

/** Where a logical page lives in the 3D book. */
export function locatePage(pageId: string): { spread: number; side: "left" | "right" } | null {
  for (const s of SPREADS) {
    if (s.left === pageId) return { spread: s.index, side: "left" };
    if (s.right === pageId) return { spread: s.index, side: "right" };
  }
  return null;
}

export const PASSPORT_LAYOUT = LAYOUT;
