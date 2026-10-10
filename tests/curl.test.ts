import { describe, expect, it } from "vitest";
import { bendColumns, leafPose } from "../src/features/passport/three/curl";
import { COVER_INSIDE, LEAVES, PASSPORT_PAGES, SPREADS, STAMPABLE_PAGE_IDS, locatePage } from "../src/content/passport";

const xs = Array.from({ length: 25 }, (_, i) => 0.012 + (0.835 * i) / 24);

describe("leaf bending", () => {
  it("lies flat on the right at rest", () => {
    const out = bendColumns(xs, { angle: 0, curl: 0 }, new Array(50));
    xs.forEach((x, c) => {
      expect(out[c * 2]).toBeCloseTo(x, 6);
      expect(out[c * 2 + 1]).toBeCloseTo(0, 6);
    });
  });

  it("lies flat on the left when turned, mirrored across the spine", () => {
    const out = bendColumns(xs, { angle: -Math.PI, curl: 0 }, new Array(50));
    xs.forEach((x, c) => {
      expect(out[c * 2]).toBeCloseTo(-x, 6);
      expect(Math.abs(out[c * 2 + 1])).toBeLessThan(1e-6);
    });
  });

  it("keeps the sheet's length while curling mid-turn", () => {
    const pose = leafPose(0.5, -Math.PI, 1);
    expect(pose.curl).toBeGreaterThan(0.9);
    const out = bendColumns(xs, pose, new Array(50));
    let len = Math.hypot(out[0], out[1]);
    for (let c = 1; c < xs.length; c++) len += Math.hypot(out[c * 2] - out[c * 2 - 2], out[c * 2 + 1] - out[c * 2 - 1]);
    expect(len).toBeCloseTo(xs[xs.length - 1], 3); // chords are a hair shorter than the arc
    // mid-turn the page stands up toward the viewer
    expect(out[out.length - 1]).toBeGreaterThan(0.3);
  });

  it("has no curl at either end of a turn", () => {
    expect(leafPose(0, -3, 1).curl).toBeCloseTo(0);
    expect(leafPose(1, -3, -1).curl).toBeCloseTo(0);
    expect(leafPose(1, -3, 1).angle).toBeCloseTo(-3);
  });
});

describe("3D book layout", () => {
  it("puts every logical page except the cover on exactly one leaf face", () => {
    const faces = LEAVES.flatMap((l) => [l.recto, l.verso]);
    for (const p of PASSPORT_PAGES.filter((p) => p.kind !== "cover")) expect(faces.filter((f) => f === p.id)).toHaveLength(1);
  });

  it("reaches every stamp page through a spread", () => {
    for (const id of [...STAMPABLE_PAGE_IDS, "identity"]) expect(locatePage(id)).not.toBeNull();
    expect(SPREADS[0]).toMatchObject({ left: COVER_INSIDE, right: "identity" });
    expect(locatePage("p1")).toEqual({ spread: 1, side: "left" });
    expect(locatePage("p6")).toEqual({ spread: 3, side: "right" });
  });
});
