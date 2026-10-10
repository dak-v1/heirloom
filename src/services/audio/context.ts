// One shared AudioContext for soundscapes and sound effects. Created lazily from
// a user gesture (browsers block audio that starts without one).

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

export function audioSupported(): boolean {
  return typeof window !== "undefined" && ("AudioContext" in window || "webkitAudioContext" in window);
}

export function getAudioContext(): AudioContext | null {
  if (!audioSupported()) return null;
  if (!ctx) {
    const Ctor = (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) as typeof AudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Four seconds of looping pink noise, the raw material for wind, waves and crowds. */
export function pinkNoise(c: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === c.sampleRate) return noise;
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  // crossfade the loop seam
  const fade = Math.floor(c.sampleRate * 0.05);
  for (let i = 0; i < fade; i++) {
    const t = i / fade;
    d[len - fade + i] = d[len - fade + i] * (1 - t) + d[i] * t;
  }
  noise = buf;
  return buf;
}

export interface BellPartial {
  ratio: number;
  gain: number;
  decay: number;
}

/** Additive bell: inharmonic sine partials with exponential decays. */
export function strikeBell(c: AudioContext, out: AudioNode, f0: number, partials: BellPartial[], when: number, level = 0.2, pan = 0) {
  const p = c.createStereoPanner();
  p.pan.value = pan;
  p.connect(out);
  let end = when;
  for (const part of partials) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = f0 * part.ratio;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(level * part.gain, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + part.decay);
    o.connect(g).connect(p);
    o.start(when);
    o.stop(when + part.decay + 0.05);
    end = Math.max(end, when + part.decay);
  }
  window.setTimeout(() => p.disconnect(), (end - c.currentTime + 0.2) * 1000);
}

export const BRONZE_BELL: BellPartial[] = [
  { ratio: 0.5, gain: 0.5, decay: 7 },
  { ratio: 1, gain: 1, decay: 5.5 },
  { ratio: 1.19, gain: 0.55, decay: 4 },
  { ratio: 1.51, gain: 0.4, decay: 3.2 },
  { ratio: 2, gain: 0.35, decay: 2.6 },
  { ratio: 2.52, gain: 0.25, decay: 1.8 },
  { ratio: 3.01, gain: 0.15, decay: 1.2 },
];

export const HAND_BELL: BellPartial[] = [
  { ratio: 1, gain: 1, decay: 1.4 },
  { ratio: 2.32, gain: 0.5, decay: 0.9 },
  { ratio: 4.25, gain: 0.25, decay: 0.5 },
];

export const BICYCLE_BELL: BellPartial[] = [
  { ratio: 1, gain: 1, decay: 0.7 },
  { ratio: 2.71, gain: 0.45, decay: 0.45 },
  { ratio: 5.2, gain: 0.15, decay: 0.25 },
];
