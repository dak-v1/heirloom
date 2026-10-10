// Logical passport model shared by stamp earning (Stage 1) and the interactive
// book (Stage 2). Page IDs are stable: placements reference them forever.

/** Fixed logical page aspect: 88 × 125 mm passport page (width / height). */
export const PAGE_ASPECT = 88 / 125;

/** Stamp artwork aspect (width / height) — matches the 300 × 380 SVGs. */
export const STAMP_ASPECT = 300 / 380;

export interface PassportPage {
  id: string;
  index: number;
  kind: "cover" | "identity" | "stamp";
  title?: string;
  /** Decorative template for Stage 2 page art. */
  template: string;
}

export const PASSPORT_PAGES: PassportPage[] = [
  { id: "cover", index: 0, kind: "cover", template: "cover" },
  { id: "identity", index: 1, kind: "identity", template: "identity" },
  { id: "p1", index: 2, kind: "stamp", title: "Visas & Visits", template: "guilloche" },
  { id: "p2", index: 3, kind: "stamp", title: "Along the River", template: "waves" },
  { id: "p3", index: 4, kind: "stamp", title: "Temple Streets", template: "tiles" },
  { id: "p4", index: 5, kind: "stamp", title: "Kampong Days", template: "orchid" },
  { id: "p5", index: 6, kind: "stamp", title: "Shophouse Rows", template: "shophouses" },
  { id: "p6", index: 7, kind: "stamp", title: "Notes & Keepsakes", template: "plain" },
];

export const STAMPABLE_PAGE_IDS = PASSPORT_PAGES.filter((p) => p.kind === "stamp").map((p) => p.id);

/** Default and allowed stamp sizes, as a fraction of page width. */
export const STAMP_WIDTH = { default: 0.38, min: 0.22, max: 0.55 };
