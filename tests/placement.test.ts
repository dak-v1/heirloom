import { describe, expect, it } from "vitest";
import { createProgressService } from "../src/services/progress";
import { createMemoryStore } from "../src/services/storage";
import { PAGE_ASPECT, STAMP_ASPECT, STAMP_WIDTH } from "../src/content/passport";
import { moveTo, nudge, overlapsAny, pointToPage, resize, rotate, undoPlacement } from "../src/features/passport/placement";

function setup() {
  let t = new Date("2026-10-10T09:00:00+08:00").getTime();
  const svc = createProgressService({ store: createMemoryStore(), now: () => new Date((t += 1000)) });
  const a = svc.earnStamp("thian-hock-keng").stamp;
  const b = svc.earnStamp("sultan-mosque").stamp;
  return { svc, a, b };
}

const spot = { pageId: "p1", x: 0.5, y: 0.5, widthRatio: 0.38, rotationDeg: 0 };

describe("undo and reposition", () => {
  it("undoing a first placement returns the stamp to the tray without touching the earned stamp", () => {
    const { svc, a } = setup();
    svc.saveStampPlacement(a.id, spot);
    expect(svc.getUnplacedStamps().map((s) => s.id)).not.toContain(a.id);
    undoPlacement(svc, a.id, null);
    expect(svc.getPassportPlacements()).toHaveLength(0);
    expect(svc.getUnplacedStamps().map((s) => s.id)).toContain(a.id);
    expect(svc.getEarnedStamps()).toHaveLength(2);
  });

  it("undoing a reposition restores the previous page, spot, size, rotation and layer", () => {
    const { svc, a, b } = setup();
    svc.saveStampPlacement(b.id, spot);
    const first = svc.saveStampPlacement(a.id, { ...spot, x: 0.4, y: 0.3, rotationDeg: 20 });
    expect(first.zIndex).toBe(2);
    const prev = { ...first };
    const moved = svc.saveStampPlacement(a.id, { pageId: "p4", x: 0.6, y: 0.7, widthRatio: 0.3, rotationDeg: -45 });
    expect(moved.id).toBe(first.id);
    expect(moved.pageId).toBe("p4");

    const restored = undoPlacement(svc, a.id, prev)!;
    expect(restored).toMatchObject({ id: first.id, pageId: "p1", x: prev.x, y: prev.y, widthRatio: prev.widthRatio, rotationDeg: 20, zIndex: 2 });
    expect(svc.getPassportPlacements().filter((p) => p.earnedStampId === a.id)).toHaveLength(1);
  });

  it("saving the same stamp repeatedly never duplicates it, and counts stay right", () => {
    const { svc, a } = setup();
    for (let i = 0; i < 5; i++) svc.saveStampPlacement(a.id, { ...spot, x: 0.3 + i * 0.05 });
    expect(svc.getPassportPlacements()).toHaveLength(1);
    expect(svc.getEarnedStamps()).toHaveLength(2);
    expect(svc.getUnplacedStamps()).toHaveLength(1);
  });

  it("delete then undo puts the stamp back exactly where it was", () => {
    const { svc, a } = setup();
    const placed = svc.saveStampPlacement(a.id, { ...spot, x: 0.35, rotationDeg: 10 });
    svc.removeStampPlacement(a.id);
    expect(svc.getEarnedStamps().map((s) => s.id)).toContain(a.id);
    expect(svc.getUnplacedStamps().map((s) => s.id)).toContain(a.id);
    undoPlacement(svc, a.id, placed);
    expect(svc.getPassportPlacements()[0]).toMatchObject({ pageId: "p1", x: placed.x, rotationDeg: 10 });
  });
});

describe("placement geometry", () => {
  it("maps screen points to normalised page coordinates, including scaled pages", () => {
    expect(pointToPage({ left: 100, top: 50, width: 200, height: 284 }, 200, 192)).toEqual({ x: 0.5, y: 0.5 });
    // Same page zoomed 1.5×: the centre still maps to the centre.
    expect(pointToPage({ left: 40, top: 20, width: 300, height: 426 }, 190, 233)).toEqual({ x: 0.5, y: 0.5 });
  });

  it("keeps the rotated stamp inside the page and its size within bounds", () => {
    const s = { x: 0.5, y: 0.5, widthRatio: STAMP_WIDTH.default, rotationDeg: 0 };
    const corner = rotate(moveTo(s, 0, 1), 45);
    const r = (corner.rotationDeg * Math.PI) / 180;
    const w = corner.widthRatio;
    const h = w / STAMP_ASPECT;
    const halfX = (w / 2) * Math.abs(Math.cos(r)) + (h / 2) * Math.abs(Math.sin(r));
    const halfY = ((w / 2) * Math.abs(Math.sin(r)) + (h / 2) * Math.abs(Math.cos(r))) * PAGE_ASPECT;
    expect(corner.x - halfX).toBeGreaterThanOrEqual(-1e-9);
    expect(corner.y + halfY).toBeLessThanOrEqual(1 + 1e-9);

    expect(resize(s, 10).widthRatio).toBe(STAMP_WIDTH.max);
    expect(resize(s, -10).widthRatio).toBe(STAMP_WIDTH.min);
    expect(nudge(s, 5, 5).x).toBeLessThan(1);
    expect(rotate(s, 200).rotationDeg).toBe(-160);
  });

  it("flags overlap softly", () => {
    const s = { x: 0.5, y: 0.5, widthRatio: 0.38, rotationDeg: 0 };
    expect(overlapsAny(s, [{ ...s, x: 0.55 }])).toBe(true);
    expect(overlapsAny(s, [{ ...s, x: 0.5, y: 0.05 }])).toBe(false);
  });
});
