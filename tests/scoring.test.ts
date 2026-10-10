import { describe, expect, it } from "vitest";
import { describeOffset, scoreGuess } from "../src/features/game/scoring";
import { SITES } from "../src/content/sites";

describe("scoreGuess", () => {
  it("gives full marks anywhere inside a documented range", () => {
    expect(scoreGuess(1930, [1930, 1960]).points).toBe(100);
    expect(scoreGuess(1960, [1930, 1960]).points).toBe(100);
    expect(scoreGuess(1945, [1930, 1960]).verdict).toBe("spot-on");
  });

  it("scales down with distance from the range", () => {
    expect(scoreGuess(1890, [1895, 1895]).points).toBe(75);
    expect(scoreGuess(1880, [1895, 1895]).points).toBe(40);
    expect(scoreGuess(1870, [1895, 1895]).points).toBe(15);
    expect(scoreGuess(1990, [1895, 1895]).points).toBe(5);
  });

  it("describes direction", () => {
    expect(describeOffset(3, 1892, [1895, 1895])).toBe("3 years too early.");
    expect(describeOffset(1, 1896, [1895, 1895])).toBe("1 year too late.");
  });
});

describe("curated game content", () => {
  it("keeps every accepted interval inside the slider range and consistent with the image dating", () => {
    for (const site of SITES) {
      expect(site.game.rounds.length).toBeGreaterThanOrEqual(3);
      for (const r of site.game.rounds) {
        expect(r.accept[0]).toBeLessThanOrEqual(r.accept[1]);
        expect(r.accept[0]).toBeGreaterThanOrEqual(site.game.range[0]);
        expect(r.accept[1]).toBeLessThanOrEqual(site.game.range[1]);
        // the accepted window must overlap what the archive supports
        expect(r.accept[1]).toBeGreaterThanOrEqual(r.image.dateRange[0]);
        expect(r.accept[0]).toBeLessThanOrEqual(r.image.dateRange[1]);
      }
    }
  });

  it("gives every site at least three hotspots with sources for facts", () => {
    for (const site of SITES) {
      const hs = site.eras.flatMap((e) => e.hotspots);
      expect(hs.length).toBeGreaterThanOrEqual(3);
      for (const h of hs) {
        expect(h.x).toBeGreaterThanOrEqual(0);
        expect(h.x).toBeLessThanOrEqual(1);
        expect(h.y).toBeGreaterThanOrEqual(0);
        expect(h.y).toBeLessThanOrEqual(1);
        if (h.kind === "fact") expect(h.sourceIds.length).toBeGreaterThan(0);
      }
      expect(site.eras.filter((e) => e.isToday)).toHaveLength(1);
      expect(site.story.versions.en?.status).toBe("curated");
    }
  });
});
