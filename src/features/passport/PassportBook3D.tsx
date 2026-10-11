import { useEffect, useRef, type RefObject } from "react";
import { PassportScene, type Focus, type GhostState, type Mode, type PageHit, type SceneHandlers } from "./three/PassportScene";
import type { IdentityValues, InkStamp } from "./three/pageArt";

export interface Book3DHandle {
  /** Screen point → spot on a stamp page that is lying open, or null. */
  resolveDrop(clientX: number, clientY: number): PageHit | null;
}

export type PressRequest = GhostState & { id: string };

interface Props extends Omit<SceneHandlers, "onReady" | "onError"> {
  open: boolean;
  spread: number;
  focus: Focus;
  mode: Mode;
  reducedMotion: boolean;
  stamps: Map<string, InkStamp[]>;
  identity: IdentityValues;
  ghost: GhostState | null;
  /** A saved placement to press in with the rubber stamp (keep the object stable while it runs). */
  press: PressRequest | null;
  onPressDone(): void;
  onReady(): void;
  onError(reason: string): void;
  handle: RefObject<Book3DHandle | null>;
}

/**
 * The 3D Heritage Passport, used for the whole journey: closed cover → open book →
 * turning leaves → zooming onto a page → placing and pressing stamps.
 * Loaded lazily so three.js only downloads on the passport page.
 */
export default function PassportBook3D(props: Props) {
  const { open, spread, focus, mode, reducedMotion, stamps, identity, ghost, press, handle } = props;
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<PassportScene | null>(null);
  const cb = useRef(props);
  cb.current = props;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let s: PassportScene;
    try {
      s = new PassportScene(
        el,
        {
          onReady: () => cb.current.onReady(),
          onError: (r) => cb.current.onError(r),
          onTapClosed: () => cb.current.onTapClosed(),
          onFlip: (d) => cb.current.onFlip(d),
          onTapPage: (h) => cb.current.onTapPage(h),
          onTapStamp: (id) => cb.current.onTapStamp(id),
          onPlace: (h, phase) => cb.current.onPlace(h, phase),
          onContact: () => cb.current.onContact(),
        },
        { reducedMotion: cb.current.reducedMotion },
      );
    } catch (e) {
      cb.current.onError(e instanceof Error ? e.message : "3D graphics aren't available on this device.");
      return;
    }
    scene.current = s;
    handle.current = { resolveDrop: (x, y) => s.resolveDrop(x, y) };
    return () => {
      handle.current = null;
      scene.current = null;
      s.dispose();
    };
  }, [handle]);

  useEffect(() => scene.current?.setReducedMotion(reducedMotion), [reducedMotion]);
  useEffect(() => scene.current?.setView({ open, spread, focus }), [open, spread, focus]);
  useEffect(() => scene.current?.setMode(mode), [mode]);
  useEffect(() => scene.current?.setGhost(ghost), [ghost]);
  useEffect(() => scene.current?.setIdentity(identity), [identity]);

  // The press must claim its stamp before the new placement is painted, so it runs first.
  useEffect(() => {
    if (!press) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      cb.current.onPressDone();
    };
    const s = scene.current;
    if (!s) return finish();
    s.pressStamp(press).then(finish);
    return finish; // leaving mid-press must not leave placing locked
  }, [press]);
  useEffect(() => scene.current?.setStamps(stamps), [stamps]);

  return <div ref={host} className="passport3d__canvas" />;
}
