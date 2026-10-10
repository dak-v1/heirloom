// Audio context and hooks, kept apart from the provider component for stable hot reloading.
import { createContext, useContext, useSyncExternalStore } from "react";
import type { AmbientRecipe } from "../../content/types";
import type { ManifestEntry, NarrationPlayer, NarrationSnapshot } from "../../services/audio/narration";

export interface AmbientState {
  playing: boolean;
  trackId: string | null;
  volume: number;
  supported: boolean;
}

export interface AudioContextValue {
  player: NarrationPlayer;
  ambient: AmbientState;
  startAmbient: (trackId: string, recipe: AmbientRecipe) => boolean;
  stopAmbient: () => void;
  setAmbientVolume: (v: number) => void;
  /** Stop every sound (narration + soundscape). */
  stopAll: () => void;
  manifest: ManifestEntry[];
}

export const AudioCtx = createContext<AudioContextValue | null>(null);

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used inside AudioProvider");
  return ctx;
}

export function useNarration(): NarrationSnapshot {
  const { player } = useAudio();
  return useSyncExternalStore(player.subscribe, () => player.snapshot, () => player.snapshot);
}
