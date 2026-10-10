import { describe, expect, it } from "vitest";
import { createMemoryStore } from "../src/services/storage";
import { createProfileService, displayName, parseProfile, PROFILE_KEY, sanitizeName, type PinSpot } from "../src/services/profile";
import { BOARD_ASPECT, BODY_END, clampToBoard, nextSpot, PIN_SIZE, pinDistance, tidySpots } from "../src/features/profile/board";
import { BADGES } from "../src/content/badges";
import { AVATARS } from "../src/content/avatars";

describe("profile", () => {
  it("cleans names and falls back to a friendly default", () => {
    expect(sanitizeName("  Perynn \n  Neo\u0007 ")).toBe("Perynn Neo");
    expect(sanitizeName("x".repeat(60))).toHaveLength(24);
    expect(displayName({ name: "" })).toBe("Guest explorer");
  });

  it("only accepts known avatars and keeps them across reloads", () => {
    const store = createMemoryStore();
    const svc = createProfileService(store);
    svc.setAvatar("not-a-thing");
    expect(svc.get().avatar).toBe(AVATARS[0].id);
    svc.setAvatar("durian");
    svc.setName("Ah Boy");
    const again = createProfileService(store);
    expect(again.get()).toMatchObject({ avatar: "durian", name: "Ah Boy" });
  });

  it("pins each badge once, tagged NEW until looked at", () => {
    const svc = createProfileService(createMemoryStore());
    svc.pinBadges({ "first-footsteps": { x: 0.3, y: 0.2, rot: 4, z: 1 } });
    svc.pinBadges({ "first-footsteps": { x: 0.9, y: 0.9, rot: 0, z: 9 } });
    expect(svc.get().board["first-footsteps"]).toMatchObject({ x: 0.3, y: 0.2 });
    expect(svc.get().fresh).toEqual(["first-footsteps"]);
    svc.markSeen("first-footsteps");
    expect(svc.get().fresh).toEqual([]);
  });

  it("survives corrupted saved data", () => {
    const store = createMemoryStore();
    store.set(PROFILE_KEY, JSON.stringify({ name: 42, avatar: "zzz", board: { a: { x: "no" }, b: { x: 2, y: -1, rot: 400 } }, fresh: ["a", "b", 7] }));
    const p = parseProfile(JSON.parse(store.get(PROFILE_KEY)!));
    expect(p.name).toBe("");
    expect(p.board).toEqual({ b: { x: 1, y: 0, rot: 30, z: 1 } });
    expect(p.fresh).toEqual(["b"]);
    store.set(PROFILE_KEY, "{not json");
    expect(createProfileService(store).get().board).toEqual({});
  });
});

describe("achievement board", () => {
  /** True when the pin's box (shrunk a little, as the art doesn't fill it) is on the pennant. */
  const onCloth = (x: number, y: number) => {
    const hx = (PIN_SIZE / 2) * 0.7;
    const hy = (PIN_SIZE / 2) * BOARD_ASPECT * 0.5;
    const half = (yy: number) => (yy <= BODY_END ? 0.5 : 0.5 * (1 - (yy - BODY_END) / (1 - BODY_END)));
    return y - hy >= 0.05 && Math.abs(x - 0.5) + hx <= half(y + hy) + 1e-9;
  };

  it("keeps a dragged pin on the cloth, including the pointed tail", () => {
    for (const [x, y] of [[-1, -1], [2, 0.5], [0.5, 2], [0.05, 0.95], [0.95, 0.85], [0.5, 0.5]]) {
      const c = clampToBoard({ x, y });
      expect(onCloth(c.x, c.y)).toBe(true);
    }
    expect(clampToBoard({ x: 0.5, y: 0.5 })).toEqual({ x: 0.5, y: 0.5 });
  });

  it("places every badge clear of the others, on the cloth", () => {
    const spots: PinSpot[] = [];
    for (let i = 0; i < BADGES.length; i++) spots.push(nextSpot(spots, i));
    for (const s of spots) expect(onCloth(s.x, s.y)).toBe(true);
    for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) expect(pinDistance(spots[i], spots[j])).toBeGreaterThan(PIN_SIZE * 0.8);
    expect(spots.map((s) => s.z)).toEqual(spots.map((_, i) => i + 1));
  });

  it("tidies pins into distinct slots", () => {
    const ids = BADGES.map((b) => b.id);
    const t = tidySpots(ids);
    expect(Object.keys(t)).toEqual(ids);
    expect(new Set(Object.values(t).map((s) => `${s.x},${s.y}`)).size).toBe(ids.length);
  });
});
