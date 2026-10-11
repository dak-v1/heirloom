import { describe, expect, it } from "vitest";
import { charCount, dataUrlBytes, fitWithin, isBlankPixels, validateName, validateNote } from "../src/features/memories/validation";

describe("memory composer validation", () => {
  it("rejects empty or whitespace-only notes", () => {
    expect(validateNote("")).toMatch(/Write something/);
    expect(validateNote("   \n  ")).toMatch(/Write something/);
    expect(validateNote("Hello")).toBeNull();
  });

  it("allows exactly 500 characters and rejects 501, counting emoji like the server", () => {
    expect(validateNote("a".repeat(500))).toBeNull();
    expect(validateNote("a".repeat(501))).toMatch(/under 500/);
    expect(charCount("🏮".repeat(500))).toBe(500);
    expect(validateNote("🏮".repeat(500))).toBeNull();
  });

  it("limits the optional display name to 40 characters", () => {
    expect(validateName("")).toBeNull();
    expect(validateName("n".repeat(40))).toBeNull();
    expect(validateName("n".repeat(41))).toMatch(/under 40/);
    expect(validateNote("Hi", "n".repeat(41))).toMatch(/under 40/);
  });

  it("detects a blank canvas", () => {
    const blank = new Uint8ClampedArray(4 * 16);
    expect(isBlankPixels(blank)).toBe(true);
    const drawn = new Uint8ClampedArray(4 * 16);
    drawn[4 * 7 + 3] = 255;
    expect(isBlankPixels(drawn)).toBe(false);
  });

  it("caps drawings at 1200 px per side, keeping the ratio", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(2400, 1800)).toEqual({ width: 1200, height: 900 });
    expect(fitWithin(1000, 3000)).toEqual({ width: 400, height: 1200 });
  });

  it("measures data URL size accurately", () => {
    for (const n of [1234, 1235, 1236]) expect(dataUrlBytes("data:image/png;base64," + btoa("x".repeat(n)))).toBe(n);
  });
});
