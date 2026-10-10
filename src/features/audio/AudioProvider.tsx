import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AmbientRecipe } from "../../content/types";
import { AmbientEngine } from "../../services/audio/ambient";
import { audioSupported } from "../../services/audio/context";
import { NarrationPlayer, loadNarrationManifest, type ManifestEntry } from "../../services/audio/narration";
import { progress } from "../../state/progress";
import { getPreferences, setPreferences } from "../../state/preferences";
import { AudioCtx, type AmbientState } from "./audio-context";

export function AudioProvider({ children }: { children: ReactNode }) {
  const [player] = useState(() => new NarrationPlayer());
  const [engine] = useState(() => new AmbientEngine());
  const [ambient, setAmbient] = useState<AmbientState>(() => ({ playing: false, trackId: null, volume: getPreferences().ambientVolume, supported: audioSupported() }));
  const [manifest, setManifest] = useState<ManifestEntry[]>([]);

  useEffect(() => {
    engine.setVolume(getPreferences().ambientVolume);
    player.onPlayingChange = (playing) => engine.duck(playing);
    player.onComplete = (t) => {
      progress.recordNarrationCompleted(t.siteId);
    };
    loadNarrationManifest().then(setManifest);
    return () => {
      player.stop();
      engine.stop(true);
    };
  }, [player, engine]);

  const startAmbient = useCallback(
    (trackId: string, recipe: AmbientRecipe) => {
      const ok = engine.start(recipe);
      setAmbient((a) => ({ ...a, playing: ok, trackId: ok ? trackId : null }));
      return ok;
    },
    [engine],
  );
  const stopAmbient = useCallback(() => {
    engine.stop();
    setAmbient((a) => ({ ...a, playing: false, trackId: null }));
  }, [engine]);
  const setAmbientVolume = useCallback(
    (v: number) => {
      engine.setVolume(v);
      setPreferences({ ambientVolume: v });
      setAmbient((a) => ({ ...a, volume: v }));
    },
    [engine],
  );
  const stopAll = useCallback(() => {
    player.pause();
    stopAmbient();
  }, [player, stopAmbient]);

  const value = useMemo(() => ({ player, ambient, startAmbient, stopAmbient, setAmbientVolume, stopAll, manifest }), [player, ambient, startAmbient, stopAmbient, setAmbientVolume, stopAll, manifest]);
  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}
