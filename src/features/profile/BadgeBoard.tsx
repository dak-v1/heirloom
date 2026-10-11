import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { BADGES } from "../../content/badges";
import { SITES } from "../../content/sites";
import { Button, ButtonLink } from "../../components/Button";
import type { PinSpot } from "../../services/profile";
import { playPinPop } from "../../services/audio/sfx";
import { getPreferences, useReducedMotion } from "../../state/preferences";
import { useProgress } from "../../state/progress";
import { profile, useProfile } from "../../state/profile";
import { clampToBoard, nextSpot, PIN_SIZE, tidySpots, topZ } from "./board";

/** Delay between pins popping in, when several arrive at once. */
const STAGGER = 320;
const POP_MS = 950;
const DRAG_THRESHOLD = 6;
const SPARKS = [0, 60, 120, 180, 240, 300];

/**
 * The achievement board: a canvas pennant with each earned badge as an enamel pin.
 * New badges pop in the first time the board is on screen; pins can be dragged
 * (or moved with the arrow keys) anywhere on the cloth, and tapped to look closer.
 */
export function BadgeBoard({ onOpen }: { onOpen: (badgeId: string) => void }) {
  const p = useProgress();
  const me = useProfile();
  const reduced = useReducedMotion();
  const board = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [arriving, setArriving] = useState<string[]>([]);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [announce, setAnnounce] = useState("");
  const press = useRef<{ id: string; pointer: number; sx: number; sy: number; ox: number; oy: number; moved: boolean; w: number; h: number; at?: { x: number; y: number } } | null>(null);
  const suppressClick = useRef(false);
  const timers = useRef<number[]>([]);

  const earned = useMemo(
    () => BADGES.filter((b) => p.badges[b.id]).sort((a, b) => p.badges[a.id].earnedAt.localeCompare(p.badges[b.id].earnedAt)),
    [p.badges],
  );
  const pinned = earned.filter((b) => me.board[b.id]);
  const missing = earned.filter((b) => !me.board[b.id]).map((b) => b.id);
  const missingKey = missing.join();

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Pop new badges in only once the visitor can actually see the board.
  useEffect(() => {
    const el = board.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting && e.intersectionRatio >= 0.3), { threshold: [0, 0.3, 0.6] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !missing.length) return;
    const all = Object.values(profile.get().board);
    const spots: Record<string, PinSpot> = {};
    missing.forEach((id, i) => {
      spots[id] = nextSpot(all, i);
      all.push(spots[id]);
    });
    profile.pinBadges(spots);
    const names = missing.map((id) => BADGES.find((b) => b.id === id)?.name).join(", ");
    setAnnounce(missing.length === 1 ? `New badge pinned to your board: ${names}.` : `${missing.length} new badges pinned to your board: ${names}.`);
    if (reduced) return;
    setArriving(missing);
    missing.forEach((_, i) => timers.current.push(window.setTimeout(() => getPreferences().soundEffects && playPinPop(), POP_MS * 0.5 + i * STAGGER)));
    timers.current.push(window.setTimeout(() => setArriving([]), POP_MS + 200 + missing.length * STAGGER));
  }, [inView, missingKey]);

  /* ---------------- dragging ---------------- */

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const spot = me.board[id];
    const rect = board.current?.getBoundingClientRect();
    if (!spot || !rect) return;
    press.current = { id, pointer: e.pointerId, sx: e.clientX, sy: e.clientY, ox: spot.x, oy: spot.y, moved: false, w: rect.width, h: rect.height };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const pr = press.current;
    if (!pr || pr.pointer !== e.pointerId) return;
    const dx = e.clientX - pr.sx;
    const dy = e.clientY - pr.sy;
    if (!pr.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    pr.moved = true;
    pr.at = clampToBoard({ x: pr.ox + dx / pr.w, y: pr.oy + dy / pr.h });
    setDrag({ id: pr.id, ...pr.at });
  };
  const endDrag = (e: PointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    const pr = press.current;
    if (!pr || pr.pointer !== e.pointerId) return;
    press.current = null;
    setDrag(null);
    if (!pr.moved) return;
    suppressClick.current = true;
    const spot = me.board[pr.id];
    if (!cancelled && pr.at && spot) profile.movePin(pr.id, { ...spot, ...pr.at, z: topZ(Object.values(me.board)) + 1 });
  };
  const onClick = (id: string) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    onOpen(id);
  };

  /* ---------------- keyboard ---------------- */

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, id: string, name: string) => {
    const step = e.shiftKey ? 0.08 : 0.025;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = moves[e.key];
    const spot = me.board[id];
    if (!m || !spot) return;
    e.preventDefault();
    const at = clampToBoard({ x: spot.x + m[0], y: spot.y + m[1] });
    profile.movePin(id, { ...spot, ...at, z: topZ(Object.values(me.board)) + 1 });
    setAnnounce(`${name} moved ${Math.round(at.x * 100)}% across, ${Math.round(at.y * 100)}% down.`);
  };

  const tidy = () => {
    profile.arrange(tidySpots(BADGES.filter((b) => me.board[b.id]).map((b) => b.id)));
    setAnnounce("Pins tidied into neat rows.");
  };

  const firstSite = SITES.find((s) => !p.visits[s.id]?.completedAt) ?? SITES[0];

  return (
    <div className="board-wrap">
      <div className="board" ref={board} role="group" aria-label={`Achievement board, ${pinned.length} ${pinned.length === 1 ? "pin" : "pins"}`}>
        <svg className="board__cord" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
          <path d="M8 38 L100 4 L192 38" />
          <circle cx="100" cy="4" r="3.4" />
        </svg>
        <div className="board__cloth-wrap" aria-hidden="true">
          <div className="board__cloth">
            <img className="board__print" src="/assets/brand/mark.svg" alt="" />
          </div>
        </div>
        <svg className="board__stitch" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M2.8 8 V79 L50 96.6 L97.2 79 V8" vectorEffect="non-scaling-stroke" />
          <path d="M0 6.4 H100" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="board__dowel" aria-hidden="true" />

        {pinned.length === 0 && (
          <div className="board__empty">
            <p>Your first badge will be pinned here.</p>
            {earned.length === 0 && (
              <ButtonLink to={`/tour/${firstSite.slug}`} size="sm" iconRight={<ArrowRight size={16} />}>
                Start at {firstSite.name}
              </ButtonLink>
            )}
          </div>
        )}

        <div className="board__pins">
          {pinned.map((b) => {
            const spot = me.board[b.id];
            const live = drag?.id === b.id ? drag : spot;
            const order = arriving.indexOf(b.id);
            const fresh = me.fresh.includes(b.id);
            return (
              <button
                key={b.id}
                type="button"
                className={`board-pin${drag?.id === b.id ? " is-dragging" : ""}${order >= 0 ? " is-arriving" : ""}`}
                style={
                  {
                    left: `${live.x * 100}%`,
                    top: `${live.y * 100}%`,
                    width: `${PIN_SIZE * 100}%`,
                    zIndex: spot.z,
                    "--rot": `${spot.rot}deg`,
                    "--delay": `${Math.max(0, order) * STAGGER}ms`,
                  } as CSSProperties
                }
                aria-label={`${b.name} badge${fresh ? ", new" : ""}`}
                aria-describedby="board-pin-help"
                onPointerDown={(e) => onPointerDown(e, b.id)}
                onPointerMove={onPointerMove}
                onPointerUp={(e) => endDrag(e, false)}
                onPointerCancel={(e) => endDrag(e, true)}
                onClick={() => onClick(b.id)}
                onKeyDown={(e) => onKeyDown(e, b.id, b.name)}
              >
                <img src={b.art} alt="" draggable={false} />
                {fresh && <span className="board-pin__new">New</span>}
                {order >= 0 && (
                  <span className="board-pin__burst" aria-hidden="true">
                    {SPARKS.map((a) => (
                      <i key={a} style={{ "--a": `${a}deg` } as CSSProperties} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <p id="board-pin-help" className="visually-hidden">
        Press Enter to look closer. Use the arrow keys to move the pin; hold Shift to move it further.
      </p>
      <p className="visually-hidden" aria-live="polite">
        {announce}
      </p>
      {pinned.length > 1 && (
        <div className="board__tools">
          <Button variant="ghost" size="sm" icon={<LayoutGrid size={16} />} onClick={tidy}>
            Tidy up
          </Button>
        </div>
      )}
    </div>
  );
}
