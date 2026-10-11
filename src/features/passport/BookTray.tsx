import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { STAMPABLE_PAGE_IDS } from "../../content/passport";
import { findStampPlace } from "../../content/sites";
import type { EarnedStamp, StampPlacement } from "../../services/progress";
import { StampArt } from "../../components/Media";
import { pointToPage } from "./placement";

interface Props {
  earned: EarnedStamp[];
  placements: StampPlacement[];
  selectedId: string | null;
  onPick: (earnedStampId: string, at?: DropSpot) => void;
  /** Where a stamp dropped at this screen point lands. Defaults to the flat book's pages. */
  resolveDrop?: (clientX: number, clientY: number) => DropSpot | null;
}

type DropSpot = { pageId: string; x: number; y: number };

/** Drop target in the flat book: the stampable page under the finger (the floating ghost ignores pointer events). */
function domDrop(clientX: number, clientY: number): DropSpot | null {
  const pageEl = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>(".book__slot [data-page-id]");
  const pageId = pageEl?.dataset.pageId;
  if (!pageEl || !pageId || !STAMPABLE_PAGE_IDS.includes(pageId)) return null;
  return { pageId, ...pointToPage(pageEl.getBoundingClientRect(), clientX, clientY) };
}

const DRAG_THRESHOLD = 6;

/** The stamp tray inside the book: tap a stamp to choose it, or drag it straight onto a page. */
export function BookTray({ earned, placements, selectedId, onPick, resolveDrop = domDrop }: Props) {
  const [dragging, setDragging] = useState<{ id: string; x: number; y: number } | null>(null);
  const press = useRef<{ id: string; pointer: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    if (!dragging) return;
    document.body.classList.add("is-dragging-stamp");
    return () => document.body.classList.remove("is-dragging-stamp");
  }, [dragging]);

  const placedIds = new Set(placements.map((p) => p.earnedStampId));
  const unplaced = earned.filter((s) => !placedIds.has(s.id));
  const placed = earned.filter((s) => placedIds.has(s.id));

  if (earned.length === 0) {
    return <p className="book-tray__empty muted">Finish exploring a site to earn your first stamp, then place it on any page.</p>;
  }

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>, id: string) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    press.current = { id, pointer: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const p = press.current;
    if (!p || p.pointer !== e.pointerId) return;
    if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) < DRAG_THRESHOLD) return;
    p.moved = true;
    setDragging({ id: p.id, x: e.clientX, y: e.clientY });
  };
  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const p = press.current;
    press.current = null;
    setDragging(null);
    if (!p || p.pointer !== e.pointerId || !p.moved) return;
    suppressClick.current = true;
    const at = resolveDrop(e.clientX, e.clientY);
    if (at) onPick(p.id, at);
  };
  const onClick = (id: string) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    onPick(id);
  };

  const item = (s: EarnedStamp, isPlaced: boolean) => {
    const site = findStampPlace(s.siteId);
    if (!site) return null;
    return (
      <li key={s.id}>
        <button
          type="button"
          className={`book-tray__item${s.id === selectedId ? " is-selected" : ""}${dragging?.id === s.id ? " is-lifted" : ""}`}
          aria-pressed={s.id === selectedId}
          aria-label={`${site.name} stamp. ${isPlaced ? "Placed. Choose to move it" : "Not placed yet. Choose to place it"}`}
          onPointerDown={(e) => onPointerDown(e, s.id)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            press.current = null;
            setDragging(null);
          }}
          onClick={() => onClick(s.id)}
        >
          <StampArt src={site.stamp.art} alt="" />
          <span className="book-tray__name">{site.name}</span>
        </button>
      </li>
    );
  };

  const draggedSite = dragging ? findStampPlace(earned.find((s) => s.id === dragging.id)?.siteId) : null;

  return (
    <div className="book-tray">
      {unplaced.length > 0 && (
        <>
          <p className="book-tray__hint">Drag a stamp onto any page, or tap one to choose it.</p>
          <ul className="book-tray__list" aria-label="Stamps waiting to be placed">
            {unplaced.map((s) => item(s, false))}
          </ul>
        </>
      )}
      {placed.length > 0 && (
        <>
          <p className="book-tray__hint">Placed. Tap to move, or drag onto another page.</p>
          <ul className="book-tray__list book-tray__list--placed" aria-label="Stamps already placed">
            {placed.map((s) => item(s, true))}
          </ul>
        </>
      )}
      {dragging &&
        draggedSite &&
        createPortal(
          <img className="tray-drag-ghost" src={draggedSite.stamp.inkArt} alt="" style={{ left: dragging.x, top: dragging.y }} />,
          document.body,
        )}
    </div>
  );
}
