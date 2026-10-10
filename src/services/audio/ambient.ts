// Illustrative soundscapes synthesised live with the Web Audio API.
// They are moods, not recordings: the UI labels them as synthesised and illustrative.

import type { AmbientRecipe } from "../../content/types";
import { BICYCLE_BELL, BRONZE_BELL, HAND_BELL, getAudioContext, pinkNoise, strikeBell } from "./context";

type Cleanup = () => void;

interface Kit {
  c: AudioContext;
  out: AudioNode;
  /** Repeat `fn` at random intervals between min and max seconds. */
  every: (minS: number, maxS: number, fn: (when: number) => void) => void;
  noise: () => AudioBufferSourceNode;
  track: (...nodes: AudioNode[]) => void;
}

function lfo(c: AudioContext, target: AudioParam, freq: number, depth: number, kit: Kit) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.value = freq;
  g.gain.value = depth;
  o.connect(g).connect(target);
  o.start();
  kit.track(o, g);
}

function chirp(c: AudioContext, out: AudioNode, when: number, base: number, pan: number) {
  const p = c.createStereoPanner();
  p.pan.value = pan;
  p.connect(out);
  const notes = 2 + Math.floor(Math.random() * 4);
  let t = when;
  for (let i = 0; i < notes; i++) {
    const o = c.createOscillator();
    const g = c.createGain();
    const f = base * (0.9 + Math.random() * 0.3);
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * (1.25 + Math.random() * 0.4), t + 0.05);
    o.frequency.exponentialRampToValueAtTime(f * 0.85, t + 0.11);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(p);
    o.start(t);
    o.stop(t + 0.14);
    t += 0.12 + Math.random() * 0.12;
  }
  window.setTimeout(() => p.disconnect(), (t - c.currentTime + 0.5) * 1000);
}

const RECIPES: Record<AmbientRecipe, (kit: Kit) => void> = {
  "harbour-temple": (kit) => {
    const { c, out } = kit;
    // slow waves: low-passed noise swelling in and out
    const sea = kit.noise();
    const seaLp = c.createBiquadFilter();
    seaLp.type = "lowpass";
    seaLp.frequency.value = 520;
    const seaGain = c.createGain();
    seaGain.gain.value = 0.55;
    sea.connect(seaLp).connect(seaGain).connect(out);
    lfo(c, seaGain.gain, 0.09, 0.32, kit);
    lfo(c, seaLp.frequency, 0.05, 160, kit);
    // foam hiss on the crest
    const foam = kit.noise();
    const foamHp = c.createBiquadFilter();
    foamHp.type = "highpass";
    foamHp.frequency.value = 2600;
    const foamGain = c.createGain();
    foamGain.gain.value = 0.05;
    foam.connect(foamHp).connect(foamGain).connect(out);
    lfo(c, foamGain.gain, 0.09, 0.045, kit);
    kit.track(seaLp, seaGain, foamHp, foamGain);
    // a deep temple bell now and then
    kit.every(14, 26, (when) => strikeBell(c, out, 196, BRONZE_BELL, when, 0.11, -0.2 + Math.random() * 0.4));
    // gulls / shore birds, rarely
    kit.every(9, 20, (when) => chirp(c, out, when, 1700, Math.random() * 1.6 - 0.8));
  },

  "street-bells": (kit) => {
    const { c, out } = kit;
    // a murmur of distant voices: band-limited noise with syllabic flutter
    for (const [f, pan] of [[420, -0.5], [640, 0.4], [880, 0]] as const) {
      const n = kit.noise();
      const bp = c.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = f;
      bp.Q.value = 1.1;
      const g = c.createGain();
      g.gain.value = 0.16;
      const p = c.createStereoPanner();
      p.pan.value = pan;
      n.connect(bp).connect(g).connect(p).connect(out);
      lfo(c, g.gain, 3 + Math.random() * 2, 0.07, kit);
      lfo(c, bp.frequency, 0.2 + Math.random() * 0.2, f * 0.25, kit);
      kit.track(bp, g, p);
    }
    // clusters of small brass hand bells
    kit.every(8, 16, (when) => {
      const rings = 3 + Math.floor(Math.random() * 6);
      const f0 = 1500 + Math.random() * 400;
      const pan = Math.random() * 1.2 - 0.6;
      for (let i = 0; i < rings; i++) strikeBell(c, out, f0, HAND_BELL, when + i * (0.11 + Math.random() * 0.05), 0.05, pan);
    });
    kit.every(12, 24, (when) => chirp(c, out, when, 2600, Math.random() * 1.6 - 0.8));
  },

  "kampong-morning": (kit) => {
    const { c, out } = kit;
    // breeze through palm fronds
    const wind = kit.noise();
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1800;
    const wg = c.createGain();
    wg.gain.value = 0.07;
    wind.connect(hp).connect(wg).connect(out);
    lfo(c, wg.gain, 0.06, 0.05, kit);
    // very soft distant street bed
    const bed = kit.noise();
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 300;
    const bg = c.createGain();
    bg.gain.value = 0.2;
    bed.connect(lp).connect(bg).connect(out);
    kit.track(hp, wg, lp, bg);
    // birdsong from several directions
    kit.every(2.5, 6, (when) => chirp(c, out, when, 2800 + Math.random() * 1200, Math.random() * 1.8 - 0.9));
    kit.every(5, 11, (when) => chirp(c, out, when, 1900, Math.random() * 1.8 - 0.9));
    // a distant bicycle bell: two quick rings
    kit.every(18, 34, (when) => {
      const pan = Math.random() * 1.4 - 0.7;
      strikeBell(c, out, 2350, BICYCLE_BELL, when, 0.05, pan);
      strikeBell(c, out, 2350, BICYCLE_BELL, when + 0.16, 0.045, pan);
    });
  },
};

export class AmbientEngine {
  private master: GainNode | null = null;
  private duckNode: GainNode | null = null;
  private cleanups: Cleanup[] = [];
  private nodes: AudioNode[] = [];
  private _volume = 0.6;
  current: AmbientRecipe | null = null;

  get volume() {
    return this._volume;
  }

  /** Must be called from a user gesture. Returns false when Web Audio is unavailable. */
  start(recipe: AmbientRecipe): boolean {
    const c = getAudioContext();
    if (!c) return false;
    this.stop(true);
    const master = c.createGain();
    master.gain.value = 0.0001;
    const duck = c.createGain();
    duck.gain.value = 1;
    master.connect(duck).connect(c.destination);
    this.master = master;
    this.duckNode = duck;
    const timers: number[] = [];
    const kit: Kit = {
      c,
      out: master,
      every: (minS, maxS, fn) => {
        const loop = () => {
          const delay = minS + Math.random() * (maxS - minS);
          const id = window.setTimeout(() => {
            fn(c.currentTime + 0.05);
            loop();
          }, delay * 1000);
          timers.push(id);
        };
        loop();
      },
      noise: () => {
        const src = c.createBufferSource();
        src.buffer = pinkNoise(c);
        src.loop = true;
        src.loopStart = Math.random() * 3;
        src.start(c.currentTime, Math.random() * 3);
        this.nodes.push(src);
        return src;
      },
      track: (...n) => this.nodes.push(...n),
    };
    RECIPES[recipe](kit);
    this.cleanups.push(() => timers.forEach((t) => clearTimeout(t)));
    master.gain.setTargetAtTime(this._volume, c.currentTime, 0.6);
    this.current = recipe;
    return true;
  }

  stop(immediate = false) {
    const c = getAudioContext();
    this.cleanups.forEach((f) => f());
    this.cleanups = [];
    const nodes = this.nodes;
    const master = this.master;
    const duck = this.duckNode;
    this.nodes = [];
    this.master = null;
    this.duckNode = null;
    this.current = null;
    if (!c || !master) return;
    const finish = () => {
      for (const n of nodes) {
        try {
          if (n instanceof AudioScheduledSourceNode) n.stop();
        } catch {
          /* already stopped */
        }
        n.disconnect();
      }
      master.disconnect();
      duck?.disconnect();
    };
    if (immediate) finish();
    else {
      master.gain.setTargetAtTime(0.0001, c.currentTime, 0.25);
      window.setTimeout(finish, 1200);
    }
  }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    const c = getAudioContext();
    if (c && this.master) this.master.gain.setTargetAtTime(Math.max(0.0001, this._volume), c.currentTime, 0.1);
  }

  /** Lower the soundscape while narration plays so the story stays intelligible. */
  duck(on: boolean) {
    const c = getAudioContext();
    if (c && this.duckNode) this.duckNode.gain.setTargetAtTime(on ? 0.3 : 1, c.currentTime, 0.35);
  }
}
