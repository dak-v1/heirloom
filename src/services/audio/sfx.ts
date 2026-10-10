// Short synthesised sound effects. Callers check the visitor's sound preference first.
import { getAudioContext, strikeBell, HAND_BELL } from "./context";

/** A gentle three-note chime for a reward. */
export function playChime() {
  const c = getAudioContext();
  if (!c) return;
  const t = c.currentTime + 0.02;
  [1046.5, 1318.5, 1568].forEach((f, i) => strikeBell(c, c.destination, f, HAND_BELL, t + i * 0.12, 0.06, (i - 1) * 0.3));
}

/** A soft rubber-stamp thunk (for the Stage 2 stamping animation). */
export function playStampThunk() {
  const c = getAudioContext();
  if (!c) return;
  const t = c.currentTime + 0.01;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(55, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + 0.2);
  const len = Math.floor(c.sampleRate * 0.06);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const n = c.createBufferSource();
  n.buffer = buf;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  const ng = c.createGain();
  ng.gain.value = 0.25;
  n.connect(lp).connect(ng).connect(c.destination);
  n.start(t);
}
