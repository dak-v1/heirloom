import { describe, expect, it } from "vitest";
import { dismissSites, distanceMeters, evaluateArrival, initialDetectorState, resetForRecheck, type ArrivalSite, type Fix } from "../src/services/arrival";

const THK: ArrivalSite = { id: "thk", coords: { lat: 1.281056, lng: 103.847528 }, arrivalRadius: 90 };
const SMT: ArrivalSite = { id: "smt", coords: { lat: 1.282611, lng: 103.845278 }, arrivalRadius: 90 };
const SM: ArrivalSite = { id: "sm", coords: { lat: 1.3022, lng: 103.859 }, arrivalRadius: 120 };
const SITES = [THK, SMT, SM];

const at = (s: ArrivalSite, accuracy = 15, t = 0, dLat = 0): Fix => ({ lat: s.coords.lat + dLat, lng: s.coords.lng, accuracy, timestamp: t });

describe("distance", () => {
  it("measures the Telok Ayer to South Bridge Road walk at roughly 300 m", () => {
    const d = distanceMeters(THK.coords, SMT.coords);
    expect(d).toBeGreaterThan(270);
    expect(d).toBeLessThan(330);
  });
});

describe("evaluateArrival", () => {
  it("waits for two consecutive in-range fixes before suggesting", () => {
    let s = initialDetectorState();
    const r1 = evaluateArrival(SITES, at(THK, 15, 0), s);
    expect(r1.suggestion).toBeNull();
    s = r1.state;
    const r2 = evaluateArrival(SITES, at(THK, 15, 5000), s);
    expect(r2.suggestion?.kind).toBe("arrived");
    expect(r2.suggestion?.candidates[0].siteId).toBe("thk");
  });

  it("does not repeat a suggestion while the visitor stays nearby", () => {
    let s = initialDetectorState();
    for (let t = 0; t < 2; t++) s = evaluateArrival(SITES, at(THK, 15, t * 5000), s).state;
    for (let t = 2; t < 10; t++) {
      const r = evaluateArrival(SITES, at(THK, 15, t * 5000), s);
      expect(r.suggestion).toBeNull();
      s = r.state;
    }
  });

  it("allows a new suggestion only after leaving and the cooldown", () => {
    let s = initialDetectorState();
    for (let t = 0; t < 2; t++) s = evaluateArrival(SITES, at(THK, 15, t * 1000), s).state;
    s = evaluateArrival(SITES, at(THK, 15, 3000, -0.003), s).state; // ~330 m south: exited
    const back = (t: number) => evaluateArrival(SITES, at(THK, 15, t), s);
    let r = back(60_000);
    s = r.state;
    r = evaluateArrival(SITES, at(THK, 15, 65_000), s);
    expect(r.suggestion).toBeNull(); // still cooling down
    s = r.state;
    // Back in range throughout, so the first fix after the cooldown suggests again — once.
    r = evaluateArrival(SITES, at(THK, 15, 11 * 60_000), s);
    expect(r.suggestion?.kind).toBe("arrived");
    r = evaluateArrival(SITES, at(THK, 15, 11 * 60_000 + 5000), r.state);
    expect(r.suggestion).toBeNull();
  });

  it("asks for confirmation when accuracy is poor", () => {
    let s = initialDetectorState();
    s = evaluateArrival(SITES, at(SM, 180, 0, 0.0015), s).state;
    const r = evaluateArrival(SITES, at(SM, 180, 4000, 0.0015), s);
    expect(r.suggestion?.kind).toBe("approximate");
  });

  it("offers a chooser when several sites could match", () => {
    let s = initialDetectorState();
    const mid: Fix = { lat: (THK.coords.lat + SMT.coords.lat) / 2, lng: (THK.coords.lng + SMT.coords.lng) / 2, accuracy: 120, timestamp: 0 };
    s = evaluateArrival(SITES, mid, s).state;
    const r = evaluateArrival(SITES, { ...mid, timestamp: 5000 }, s);
    expect(r.suggestion?.kind).toBe("multiple");
    expect(r.suggestion?.candidates.map((c) => c.siteId).sort()).toEqual(["smt", "thk"]);
  });

  it("ignores fixes too imprecise to use", () => {
    const r = evaluateArrival(SITES, at(THK, 1500), initialDetectorState());
    expect(r.unusable).toBe(true);
    expect(r.suggestion).toBeNull();
  });

  it("respects dismissal until the visitor checks again", () => {
    let s = dismissSites(initialDetectorState(), ["thk"]);
    for (let t = 0; t < 4; t++) {
      const r = evaluateArrival(SITES, at(THK, 15, t * 1000), s);
      expect(r.suggestion).toBeNull();
      s = r.state;
    }
    s = resetForRecheck(s);
    s = evaluateArrival(SITES, at(THK, 15, 10_000), s).state;
    expect(evaluateArrival(SITES, at(THK, 15, 11_000), s).suggestion?.kind).toBe("arrived");
  });

  it("lets a labelled simulated arrival trigger immediately", () => {
    const r = evaluateArrival(SITES, { ...at(SMT, 5, 0), simulated: true }, initialDetectorState());
    expect(r.suggestion).toMatchObject({ kind: "arrived", simulated: true });
  });
});
