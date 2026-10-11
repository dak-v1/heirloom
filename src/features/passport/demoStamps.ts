// Demo tool: fill the passport with the placeholder stamps (src/content/demo-stamps.ts).
import { DEMO_PLACES } from "../../content/demo-stamps";
import { progress } from "../../state/progress";
import { freeSpot } from "./placement";

/** Where the first seven go; the last three wait in the tray so stamping can be shown live. */
const PAGES = ["p2", "p2", "p3", "p4", "p4", "p5", "p6"];
const TILTS = [-8, 6, -4, 9, -6, 4, -10];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Add the ten demo stamps. Returns how many were added (0 if they're already there). */
export function addDemoStamps(): number {
  const placed = [...progress.getPassportPlacements()];
  const items = DEMO_PLACES.map((place, i) => {
    const pageId = PAGES[i];
    const visitDate = daysAgo(60 - i * 5);
    if (!pageId) return { siteId: place.id, visitDate };
    const spot = freeSpot(placed.filter((p) => p.pageId === pageId), 0.32);
    placed.push({ ...spot, pageId, id: "", earnedStampId: "", zIndex: 0, placedAt: "", updatedAt: "" });
    return { siteId: place.id, visitDate, placement: { pageId, ...spot, rotationDeg: TILTS[i] } };
  });
  return progress.addDemoStamps(items);
}

export function removeDemoStamps() {
  progress.removeDemoStamps(DEMO_PLACES.map((p) => p.id));
}
