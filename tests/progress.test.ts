import { describe, expect, it } from "vitest";
import { clampPlacement, createProgressService, PlacementError, PROGRESS_KEY } from "../src/services/progress";
import { createMemoryStore } from "../src/services/storage";
import { PAGE_ASPECT, STAMP_ASPECT } from "../src/content/passport";

const SITES = ["thian-hock-keng", "sri-mariamman-temple", "sultan-mosque"];

function setup() {
  const store = createMemoryStore();
  let t = new Date("2026-10-10T09:00:00+08:00").getTime();
  const now = () => new Date((t += 1000));
  return { store, svc: createProgressService({ store, now, siteIds: SITES }), now };
}

describe("earnStamp", () => {
  it("awards exactly one entitlement per site, even when called repeatedly", () => {
    const { svc } = setup();
    const first = svc.earnStamp("thian-hock-keng");
    const second = svc.earnStamp("thian-hock-keng");
    expect(first.isNew).toBe(true);
    expect(second.isNew).toBe(false);
    expect(second.stamp.id).toBe(first.stamp.id);
    expect(svc.getEarnedStamps()).toHaveLength(1);
  });

  it("survives a reload from storage without duplicating", () => {
    const { store, svc, now } = setup();
    const { stamp } = svc.earnStamp("sultan-mosque");
    const reopened = createProgressService({ store, now, siteIds: SITES });
    expect(reopened.getEarnedStamps().map((s) => s.id)).toEqual([stamp.id]);
    expect(reopened.earnStamp("sultan-mosque").isNew).toBe(false);
    expect(reopened.getEarnedStamps()).toHaveLength(1);
  });

  it("records completion and the visit date, separate from placement", () => {
    const { svc } = setup();
    const { stamp } = svc.earnStamp("thian-hock-keng");
    const p = svc.getVisitorProgress();
    expect(p.visits["thian-hock-keng"].completedAt).toBeTruthy();
    expect(stamp.visitDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(svc.getUnplacedStamps()).toHaveLength(1);
    expect(svc.getPassportPlacements()).toHaveLength(0);
  });

  it("awards First Footsteps once and Three Journeys after every site", () => {
    const { svc } = setup();
    expect(svc.earnStamp(SITES[0]).newBadges).toEqual(["first-footsteps"]);
    expect(svc.earnStamp(SITES[1]).newBadges).toEqual([]);
    expect(svc.earnStamp(SITES[2]).newBadges).toEqual(["three-journeys"]);
  });

  it("recovers from corrupt storage with a fresh guest", () => {
    const store = createMemoryStore();
    store.set(PROGRESS_KEY, "{not json");
    const svc = createProgressService({ store, siteIds: SITES });
    expect(svc.getVisitorProgress().guestId).toMatch(/^guest_/);
    expect(svc.getEarnedStamps()).toEqual([]);
  });
});

describe("badges", () => {
  it("awards Curious Mind only when every hotspot is opened", () => {
    const { svc } = setup();
    const all = ["a", "b", "c"];
    expect(svc.recordHotspotOpened("x", "a", all)).toEqual([]);
    expect(svc.recordHotspotOpened("x", "a", all)).toEqual([]);
    expect(svc.recordHotspotOpened("x", "b", all)).toEqual([]);
    expect(svc.recordHotspotOpened("x", "c", all)).toEqual(["curious-mind"]);
  });

  it("awards Many Tongues on a second language and game badges by result", () => {
    const { svc } = setup();
    expect(svc.recordLanguageUsed("x", "en")).toEqual([]);
    expect(svc.recordLanguageUsed("x", "zh")).toEqual(["many-tongues"]);
    expect(svc.recordGameResult("x", "g", { score: 140, maxScore: 300, perfect: false })).toEqual(["time-traveller"]);
    expect(svc.recordGameResult("x", "g", { score: 300, maxScore: 300, perfect: true })).toEqual(["sharp-eye"]);
  });

  it("notifies badge listeners", () => {
    const { svc } = setup();
    const seen: string[][] = [];
    svc.onBadges((ids) => seen.push(ids));
    svc.recordNarrationCompleted("x");
    svc.recordNarrationCompleted("x");
    expect(seen).toEqual([["good-listener"]]);
  });

  it("awards Memory Keeper once for a submitted memory, without touching stamps", () => {
    const { svc } = setup();
    expect(svc.recordMemorySubmitted("sultan-mosque")).toEqual(["memory-keeper"]);
    expect(svc.recordMemorySubmitted("thian-hock-keng")).toEqual([]);
    const p = svc.getVisitorProgress();
    expect(p.visits["sultan-mosque"].memorySubmitted).toBe(true);
    expect(p.earnedStamps).toHaveLength(0);
  });
});

describe("placements (storage contract for the Stage 2 passport)", () => {
  it("rejects unearned stamps and unknown pages", () => {
    const { svc } = setup();
    expect(() => svc.saveStampPlacement("nope", { pageId: "p1", x: 0.5, y: 0.5, widthRatio: 0.4, rotationDeg: 0 })).toThrow(PlacementError);
    const { stamp } = svc.earnStamp("thian-hock-keng");
    expect(() => svc.saveStampPlacement(stamp.id, { pageId: "cover", x: 0.5, y: 0.5, widthRatio: 0.4, rotationDeg: 0 })).toThrow(PlacementError);
    expect(() => svc.saveStampPlacement(stamp.id, { pageId: "p1", x: NaN, y: 0.5, widthRatio: 0.4, rotationDeg: 0 })).toThrow(PlacementError);
  });

  it("moves an existing placement instead of duplicating it, and undo returns it to the tray", () => {
    const { svc } = setup();
    const { stamp } = svc.earnStamp("thian-hock-keng");
    const a = svc.saveStampPlacement(stamp.id, { pageId: "p1", x: 0.5, y: 0.5, widthRatio: 0.4, rotationDeg: 8 });
    const b = svc.saveStampPlacement(stamp.id, { pageId: "p2", x: 0.4, y: 0.6, widthRatio: 0.4, rotationDeg: -12 });
    expect(svc.getPassportPlacements()).toHaveLength(1);
    expect(b.id).toBe(a.id);
    expect(b.pageId).toBe("p2");
    expect(svc.getUnplacedStamps()).toHaveLength(0);
    svc.removeStampPlacement(stamp.id);
    expect(svc.getUnplacedStamps()).toHaveLength(1);
  });

  it("clamps the rotated footprint inside the page", () => {
    for (const rot of [0, 33, 90, -135]) {
      const p = clampPlacement({ x: 0.99, y: 0.01, widthRatio: 0.5, rotationDeg: rot });
      const rad = (p.rotationDeg * Math.PI) / 180;
      const w = p.widthRatio, h = p.widthRatio / STAMP_ASPECT, pageH = 1 / PAGE_ASPECT;
      const hx = (w / 2) * Math.abs(Math.cos(rad)) + (h / 2) * Math.abs(Math.sin(rad));
      const hy = ((w / 2) * Math.abs(Math.sin(rad)) + (h / 2) * Math.abs(Math.cos(rad))) / pageH;
      expect(p.x + hx).toBeLessThanOrEqual(1 + 1e-9);
      expect(p.y - hy).toBeGreaterThanOrEqual(-1e-9);
    }
  });
});

describe("demo stamps", () => {
  it("adds placeholder stamps once, pressing the ones with a page straight in", () => {
    const { svc } = setup();
    svc.earnStamp("thian-hock-keng");
    const added = svc.addDemoStamps([
      { siteId: "demo-lau-pa-sat", visitDate: "2026-09-01", placement: { pageId: "p2", x: 0.5, y: 0.45, widthRatio: 0.38, rotationDeg: -8 } },
      { siteId: "demo-merlion-park", visitDate: "2026-09-02" },
    ]);
    expect(added).toBe(2);
    expect(svc.addDemoStamps([{ siteId: "demo-lau-pa-sat", visitDate: "2026-09-01" }])).toBe(0);
    expect(svc.getEarnedStamps()).toHaveLength(3);
    expect(svc.getPassportPlacements()).toHaveLength(1);
    expect(svc.getUnplacedStamps().map((s) => s.siteId).sort()).toEqual(["demo-merlion-park", "thian-hock-keng"]);
    expect(Object.keys(svc.getVisitorProgress().badges)).toEqual(["first-footsteps"]);
  });

  it("removes only the demo stamps and their placements", () => {
    const { svc } = setup();
    const real = svc.earnStamp("sultan-mosque").stamp;
    svc.saveStampPlacement(real.id, { pageId: "p1", x: 0.5, y: 0.5, widthRatio: 0.38, rotationDeg: 0 });
    svc.addDemoStamps([{ siteId: "demo-fort-canning", visitDate: "2026-09-01", placement: { pageId: "p1", x: 0.3, y: 0.3, widthRatio: 0.38, rotationDeg: 0 } }]);
    svc.removeDemoStamps(["demo-fort-canning"]);
    expect(svc.getEarnedStamps().map((s) => s.siteId)).toEqual(["sultan-mosque"]);
    expect(svc.getPassportPlacements().map((p) => p.earnedStampId)).toEqual([real.id]);
  });
});
