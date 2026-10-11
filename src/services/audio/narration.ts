// Story narration uses prepared ElevenLabs audio listed in
// /audio/narration/manifest.json. Playback only ever starts from a user gesture.

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
  mode: "file" | null;
  trackKey: string | null;
  /** 0–1 */
  progress: number;
  elapsed: number;
  duration: number;
  segment: number;
  segmentCount: number;
  /** Sentence currently being spoken, also used for the tour's in-scene captions. */
  currentSentence: string;
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
  currentSentence: "",
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

/** A concise, language-matched audio preview made from the first line of a story. */
export function storySummaryParagraphs(version: { title: string; paragraphs: string[] }): string[] {
  const firstSentence = splitSentences([version.paragraphs[0] ?? ""])[0] ?? version.title;
  return [`${version.title}.`, firstSentence];
}

function estimateSeconds(text: string, lang: LangCode): number {
  if (lang === "zh") return Math.max(1, text.replace(/\s/g, "").length / 4.2);
  return Math.max(1, text.split(/\s+/).length / WORDS_PER_SECOND);
}

export class NarrationPlayer {
  private snap: NarrationSnapshot = IDLE;
  private listeners = new Set<() => void>();
  private track: NarrationTrack | null = null;
  private audio: HTMLAudioElement | null = null;
  private sentences: string[] = [];
  private sentenceSeconds: number[] = [];
  private generation = 0;
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

  /** Prepare a track. Cheap; does not start playback. */
  async load(track: NarrationTrack) {
    if (this.track?.key === track.key && this.track.audio?.url === track.audio?.url && this.snap.status !== "error") return;
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
      a.addEventListener("timeupdate", () => {
        if (gen !== this.generation) return;
        const duration = a.duration || track.audio?.duration || estimate;
        const segment = this.segmentAt(a.currentTime, duration);
        this.set({ elapsed: a.currentTime, progress: duration ? a.currentTime / duration : 0, segment, currentSentence: this.sentences[segment] ?? "" });
      });
      a.addEventListener("ended", () => gen === this.generation && this.finish());
      a.addEventListener("error", () => {
        if (gen !== this.generation) return;
        this.audio = null;
        this.set({ status: "unsupported", mode: null, message: "The ElevenLabs recording could not be loaded. Please read the transcript." });
      });
      this.set({ ...IDLE, status: "ready", mode: "file", trackKey: track.key, duration: track.audio.duration ?? 0, voiceLabel: track.audio.label, segmentCount: this.sentences.length, currentSentence: this.sentences[0] ?? "" });
      return;
    }
    this.set({
      ...IDLE,
      status: "unsupported",
      trackKey: track.key,
      segmentCount: this.sentences.length,
      currentSentence: this.sentences[0] ?? "",
      message: "ElevenLabs narration is not available for this story yet. Please read the transcript or choose another language.",
    });
  }

  play() {
    if (!this.track || !this.audio) return;
    const s = this.snap.status;
    if (s === "playing" || s === "loading" || s === "unsupported") return;
    if (s === "ended") this.audio.currentTime = 0;
    this.audio.play().then(
      () => this.set({ status: "playing" }),
      () => this.set({ status: "error", message: "Playback was blocked or failed. Tap play again, or read the transcript." }),
    );
  }

  pause() {
    if (this.snap.status !== "playing" || !this.audio) return;
    this.audio.pause();
    this.set({ status: "paused" });
  }

  toggle() {
    if (this.snap.status === "playing") this.pause();
    else this.play();
  }

  replay() {
    if (!this.track || !this.audio) return;
    this.audio.currentTime = 0;
    this.set({ status: "paused", segment: 0, currentSentence: this.sentences[0] ?? "", elapsed: 0, progress: 0 });
    this.play();
  }

  /** Skip forward or back by 15 seconds. */
  skip(direction: -1 | 1) {
    if (!this.audio) return;
    this.audio.currentTime = Math.max(0, Math.min(this.audio.duration || 0, this.audio.currentTime + direction * 15));
  }

  stop() {
    this.generation++;
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.audio.load();
      this.audio = null;
    }
    this.track = null;
    this.set({ ...IDLE });
  }

  /** Map elapsed time onto sentence cues for prepared recordings without authored cue metadata. */
  private segmentAt(elapsed: number, duration: number) {
    const total = this.sentenceSeconds.reduce((a, b) => a + b, 0) || 1;
    const target = Math.max(0, Math.min(total, elapsed / Math.max(duration, 0.001) * total));
    let cursor = 0;
    for (let i = 0; i < this.sentenceSeconds.length; i++) {
      cursor += this.sentenceSeconds[i];
      if (target < cursor || i === this.sentenceSeconds.length - 1) return i;
    }
    return 0;
  }

  private finish() {
    const t = this.track;
    const segment = Math.max(0, this.sentences.length - 1);
    this.set({ status: "ended", progress: 1, elapsed: this.snap.duration, segment, currentSentence: this.sentences[segment] ?? "" });
    if (t) this.onComplete?.(t);
  }

}

/* ---------------- prepared-audio manifest ---------------- */

export interface ManifestEntry {
  siteId: string;
  lang: LangCode;
  storyVersion: number;
  kind?: "story" | "summary";
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

export function preparedAudioFor(entries: ManifestEntry[], siteId: string, lang: LangCode, storyVersion: number, kind: "story" | "summary" = "story") {
  const e = entries.find((x) => x.siteId === siteId && x.lang === lang && x.storyVersion === storyVersion && (x.kind ?? "story") === kind);
  if (!e || e.generator !== "elevenlabs") return undefined;
  const label = `ElevenLabs narration (${e.voice})`;
  return { url: e.url, label, duration: e.duration };
}
