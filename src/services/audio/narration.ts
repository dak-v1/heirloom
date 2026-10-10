// Story narration with two honest modes:
//  - "file":   prepared audio (e.g. pre-generated with ElevenLabs by scripts/generate-narration.mjs),
//              listed in /audio/narration/manifest.json and labelled as a synthetic voice;
//  - "speech": the device's own text-to-speech voice (Web Speech API), labelled as such.
// Playback only ever starts from a user gesture.

import type { LangCode } from "../../content/types";

export type NarrationStatus = "idle" | "loading" | "ready" | "playing" | "paused" | "ended" | "error" | "unsupported";

export interface NarrationTrack {
  key: string;
  siteId: string;
  lang: LangCode;
  bcp47: string;
  paragraphs: string[];
  /** Prepared audio, when one exists for this story version + language. */
  audio?: { url: string; label: string; duration?: number };
}

export interface NarrationSnapshot {
  status: NarrationStatus;
  mode: "file" | "speech" | null;
  trackKey: string | null;
  /** 0–1 */
  progress: number;
  elapsed: number;
  duration: number;
  segment: number;
  segmentCount: number;
  voiceLabel: string | null;
  message: string | null;
}

const IDLE: NarrationSnapshot = {
  status: "idle",
  mode: null,
  trackKey: null,
  progress: 0,
  elapsed: 0,
  duration: 0,
  segment: 0,
  segmentCount: 0,
  voiceLabel: null,
  message: null,
};

const WORDS_PER_SECOND = 2.5;

function splitSentences(paragraphs: string[]): string[] {
  const out: string[] = [];
  for (const p of paragraphs) {
    const parts = p.match(/[^.!?。！？]+[.!?。！？]+["'”’)]*\s*|[^.!?。！？]+$/g) ?? [p];
    for (const s of parts) {
      const t = s.trim();
      if (t) out.push(t);
    }
  }
  return out;
}

function estimateSeconds(text: string, lang: LangCode): number {
  if (lang === "zh") return Math.max(1, text.replace(/\s/g, "").length / 4.2);
  return Math.max(1, text.split(/\s+/).length / WORDS_PER_SECOND);
}

function waitForVoices(timeoutMs = 1200): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => resolve(synth.getVoices());
    synth.addEventListener("voiceschanged", done, { once: true });
    window.setTimeout(done, timeoutMs);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], bcp47: string): SpeechSynthesisVoice | null {
  const want = bcp47.toLowerCase();
  const base = want.split("-")[0];
  const norm = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace("_", "-");
  return (
    voices.find((v) => norm(v) === want) ??
    voices.find((v) => norm(v).startsWith(base + "-") && v.localService) ??
    voices.find((v) => norm(v).startsWith(base + "-") || norm(v) === base) ??
    null
  );
}

export class NarrationPlayer {
  private snap: NarrationSnapshot = IDLE;
  private listeners = new Set<() => void>();
  private track: NarrationTrack | null = null;
  private audio: HTMLAudioElement | null = null;
  private sentences: string[] = [];
  private sentenceSeconds: number[] = [];
  private voice: SpeechSynthesisVoice | null = null;
  private generation = 0;
  private tick: number | null = null;
  onComplete: ((track: NarrationTrack) => void) | null = null;
  onPlayingChange: ((playing: boolean) => void) | null = null;

  get snapshot() {
    return this.snap;
  }

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => void this.listeners.delete(l);
  };

  private set(patch: Partial<NarrationSnapshot>) {
    const wasPlaying = this.snap.status === "playing";
    this.snap = { ...this.snap, ...patch };
    const playing = this.snap.status === "playing";
    if (wasPlaying !== playing) this.onPlayingChange?.(playing);
    this.listeners.forEach((l) => l());
  }

  static speechSupported() {
    return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  /** Prepare a track. Cheap; does not start playback. */
  async load(track: NarrationTrack) {
    if (this.track?.key === track.key && this.snap.status !== "error") return;
    this.stop();
    this.track = track;
    const gen = ++this.generation;
    this.sentences = splitSentences(track.paragraphs);
    this.sentenceSeconds = this.sentences.map((s) => estimateSeconds(s, track.lang));
    const estimate = this.sentenceSeconds.reduce((a, b) => a + b, 0);

    if (track.audio) {
      const a = new Audio();
      a.preload = "metadata";
      a.src = track.audio.url;
      this.audio = a;
      a.addEventListener("loadedmetadata", () => gen === this.generation && this.set({ duration: a.duration || track.audio?.duration || estimate }));
      a.addEventListener("timeupdate", () => gen === this.generation && this.set({ elapsed: a.currentTime, progress: a.duration ? a.currentTime / a.duration : 0 }));
      a.addEventListener("ended", () => gen === this.generation && this.finish());
      a.addEventListener("error", () => {
        if (gen !== this.generation) return;
        // Prepared audio failed: fall back to the device voice (clearly relabelled) or the transcript.
        this.audio = null;
        void this.prepareSpeech(track, gen, estimate, "The prepared recording could not be loaded. ");
      });
      this.set({ ...IDLE, status: "ready", mode: "file", trackKey: track.key, duration: track.audio.duration ?? estimate, voiceLabel: track.audio.label, segmentCount: this.sentences.length });
      return;
    }
    await this.prepareSpeech(track, gen, estimate);
  }

  private async prepareSpeech(track: NarrationTrack, gen: number, estimate: number, prefix = "") {
    if (!NarrationPlayer.speechSupported()) {
      this.set({ ...IDLE, status: "unsupported", trackKey: track.key, message: `${prefix}This browser cannot read stories aloud. The transcript has the full story.` });
      return;
    }
    this.set({ ...IDLE, status: "loading", mode: "speech", trackKey: track.key, segmentCount: this.sentences.length, duration: estimate });
    const voices = await waitForVoices();
    if (gen !== this.generation) return;
    this.voice = pickVoice(voices, track.bcp47);
    if (!this.voice) {
      this.set({ status: "unsupported", message: `${prefix}Your device has no voice for this language. Read the transcript, or switch to another language.` });
      return;
    }
    this.set({ status: "ready", voiceLabel: `Your device's voice (${this.voice.name})`, message: prefix || null });
  }

  play() {
    if (!this.track) return;
    const s = this.snap.status;
    if (s === "playing" || s === "loading" || s === "unsupported") return;
    if (this.audio) {
      if (s === "ended") this.audio.currentTime = 0;
      this.audio.play().then(
        () => this.set({ status: "playing" }),
        () => this.set({ status: "error", message: "Playback was blocked or failed. Tap play again, or read the transcript." }),
      );
      return;
    }
    if (s === "ended") this.set({ segment: 0, elapsed: 0, progress: 0 });
    this.speakFrom(this.snap.segment);
  }

  pause() {
    if (this.snap.status !== "playing") return;
    if (this.audio) {
      this.audio.pause();
      this.set({ status: "paused" });
      return;
    }
    // speechSynthesis.pause() is unreliable on mobile: cancel and resume from the current sentence.
    this.generation++;
    window.speechSynthesis.cancel();
    this.clearTick();
    this.set({ status: "paused" });
  }

  toggle() {
    if (this.snap.status === "playing") this.pause();
    else this.play();
  }

  replay() {
    if (!this.track) return;
    if (this.audio) {
      this.audio.currentTime = 0;
      this.set({ status: "paused", elapsed: 0, progress: 0 });
      this.play();
      return;
    }
    this.generation++;
    window.speechSynthesis.cancel();
    this.set({ segment: 0, elapsed: 0, progress: 0, status: "paused" });
    this.speakFrom(0);
  }

  /** Skip by seconds (file) or by sentences (speech). */
  skip(direction: -1 | 1) {
    if (this.audio) {
      this.audio.currentTime = Math.max(0, Math.min(this.audio.duration || 0, this.audio.currentTime + direction * 15));
      return;
    }
    const target = Math.max(0, Math.min(this.sentences.length - 1, this.snap.segment + direction));
    const playing = this.snap.status === "playing";
    this.generation++;
    window.speechSynthesis.cancel();
    this.set({ segment: target, ...this.positionAt(target) });
    if (playing) this.speakFrom(target);
  }

  stop() {
    this.generation++;
    this.clearTick();
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.audio.load();
      this.audio = null;
    }
    if (NarrationPlayer.speechSupported()) window.speechSynthesis.cancel();
    this.track = null;
    this.set({ ...IDLE });
  }

  private positionAt(segment: number) {
    const elapsed = this.sentenceSeconds.slice(0, segment).reduce((a, b) => a + b, 0);
    const total = this.sentenceSeconds.reduce((a, b) => a + b, 0) || 1;
    return { elapsed, progress: elapsed / total };
  }

  private speakFrom(index: number) {
    const track = this.track;
    if (!track || !this.voice) return;
    const gen = ++this.generation;
    const synth = window.speechSynthesis;
    synth.cancel();
    const speakOne = (i: number) => {
      if (gen !== this.generation) return;
      if (i >= this.sentences.length) {
        this.finish();
        return;
      }
      const u = new SpeechSynthesisUtterance(this.sentences[i]);
      u.voice = this.voice;
      u.lang = this.voice?.lang ?? track.bcp47;
      u.rate = 0.95;
      const startAt = performance.now();
      const base = this.positionAt(i);
      this.set({ status: "playing", segment: i, ...base });
      this.clearTick();
      this.tick = window.setInterval(() => {
        if (gen !== this.generation) return;
        const within = Math.min(this.sentenceSeconds[i], (performance.now() - startAt) / 1000);
        const total = this.sentenceSeconds.reduce((a, b) => a + b, 0) || 1;
        this.set({ elapsed: base.elapsed + within, progress: (base.elapsed + within) / total });
      }, 250);
      u.onend = () => speakOne(i + 1);
      u.onerror = (e) => {
        if (gen !== this.generation || e.error === "interrupted" || e.error === "canceled") return;
        this.clearTick();
        this.set({ status: "error", message: "The device voice stopped unexpectedly. Tap play to continue, or read the transcript." });
      };
      synth.speak(u);
    };
    speakOne(index);
  }

  private finish() {
    this.clearTick();
    const t = this.track;
    this.set({ status: "ended", progress: 1, elapsed: this.snap.duration, segment: Math.max(0, this.sentences.length - 1) });
    if (t) this.onComplete?.(t);
  }

  private clearTick() {
    if (this.tick !== null) {
      window.clearInterval(this.tick);
      this.tick = null;
    }
  }
}

/* ---------------- prepared-audio manifest ---------------- */

export interface ManifestEntry {
  siteId: string;
  lang: LangCode;
  storyVersion: number;
  url: string;
  voice: string;
  generator: "elevenlabs" | "recorded";
  duration?: number;
}

let manifestPromise: Promise<ManifestEntry[]> | null = null;

/** Loads /audio/narration/manifest.json once. Missing manifest = no prepared audio (not an error). */
export function loadNarrationManifest(): Promise<ManifestEntry[]> {
  manifestPromise ??= fetch("/audio/narration/manifest.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : { entries: [] }))
    .then((j: { entries?: ManifestEntry[] }) => (Array.isArray(j.entries) ? j.entries : []))
    .catch(() => []);
  return manifestPromise;
}

export function preparedAudioFor(entries: ManifestEntry[], siteId: string, lang: LangCode, storyVersion: number) {
  const e = entries.find((x) => x.siteId === siteId && x.lang === lang && x.storyVersion === storyVersion);
  if (!e) return undefined;
  const label = e.generator === "elevenlabs" ? `Synthetic voice generated with ElevenLabs (${e.voice})` : `Recorded narration (${e.voice})`;
  return { url: e.url, label, duration: e.duration };
}
