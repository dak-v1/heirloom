import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PASSPORT_PAGES, type PassportPage } from "../../content/passport";
import { IconButton } from "../../components/Button";
import { BookPage, type IdentityInfo } from "./BookPage";
import "./book.css";

/** What is visible at once: one page on phones, a left/right spread on wide screens. */
interface View {
  left?: PassportPage;
  right?: PassportPage;
}

const SPREAD_QUERY = "(min-width: 760px)";
const FLIP_MS = 600;

function buildViews(spread: boolean): View[] {
  if (!spread) return PASSPORT_PAGES.map((p) => ({ right: p }));
  // Like a real passport: the cover sits alone on the right, then pages pair up across the gutter.
  const [cover, ...rest] = PASSPORT_PAGES;
  const views: View[] = [{ right: cover }];
  for (let i = 0; i < rest.length; i += 2) views.push({ left: rest[i], right: rest[i + 1] });
  return views;
}

const primary = (v: View) => (v.left ?? v.right)!;
const pagesOf = (v: View) => [v.left, v.right].filter((p): p is PassportPage => !!p);

function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

interface Props {
  /** Stable page ID the visitor is on (see src/content/passport.ts). */
  currentPageId: string;
  onPageChange: (pageId: string) => void;
  reducedMotion: boolean;
  identity: IdentityInfo;
  /** Turn off swipe-to-flip, e.g. while a stamp is being dragged. */
  swipeEnabled?: boolean;
  /** Content layered on a page (stamp impressions, placement controls). */
  renderPageOverlay?: (page: PassportPage) => ReactNode;
}

type Flip = { from: number; to: number };

/**
 * The flat, flippable Heritage Passport. Pages keep the fixed logical aspect ratio
 * and stable IDs in both layouts, so later placements land on the same spot.
 */
export function PassportBook({ currentPageId, onPageChange, reducedMotion, identity, swipeEnabled = true, renderPageOverlay }: Props) {
  const spread = useMedia(SPREAD_QUERY);
  const views = buildViews(spread);
  const found = views.findIndex((v) => pagesOf(v).some((p) => p.id === currentPageId));
  const index = found < 0 ? 0 : found;
  const [flipState, setFlip] = useState<Flip | null>(null);
  const flipTimer = useRef<number | undefined>(undefined);
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  // A layout change mid-flip would leave stale view indices: drop the animation.
  const flip = flipState && views[flipState.from] && views[flipState.to] ? flipState : null;

  const finishFlip = useCallback(() => {
    window.clearTimeout(flipTimer.current);
    setFlip(null);
  }, []);

  useEffect(() => () => window.clearTimeout(flipTimer.current), []);
  useEffect(finishFlip, [spread, finishFlip]);

  const go = (to: number) => {
    if (flip || to < 0 || to >= views.length || to === index) return;
    onPageChange(primary(views[to]).id);
    if (reducedMotion) return;
    setFlip({ from: index, to });
    // Fallback in case animationend never fires (tab hidden, animation disabled by the browser).
    flipTimer.current = window.setTimeout(finishFlip, FLIP_MS + 300);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!swipeEnabled || (e.target as HTMLElement).closest("button, a, input")) return;
    swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!swipeEnabled || !s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    go(dx < 0 ? index + 1 : index - 1);
  };

  const shown = views[index];
  const shownPages = pagesOf(shown);
  const total = PASSPORT_PAGES.length;
  const label =
    shownPages.length > 1 ? `Pages ${shownPages[0].index + 1}–${shownPages[1].index + 1} of ${total}` : `Page ${shownPages[0].index + 1} of ${total}`;
  const titles = shownPages.map((p) => p.title ?? (p.kind === "cover" ? "Cover" : "Identity page")).join(" and ");

  // During a flip the leaf turns over the right-hand slot. With a = the earlier view and b = the later one:
  // underneath shows a.left and b.right; the leaf's front is a.right and its back is b.left.
  const a = flip ? views[Math.min(flip.from, flip.to)] : shown;
  const b = flip ? views[Math.max(flip.from, flip.to)] : shown;
  const forward = flip ? flip.to > flip.from : true;

  const page = (p: PassportPage | undefined, side: "left" | "right") =>
    p ? <BookPage page={p} side={spread ? side : "right"} identity={identity} overlay={renderPageOverlay?.(p)} /> : <div className="book-page book-page--empty" aria-hidden="true" />;

  return (
    <div className={`book${spread ? " book--spread" : " book--single"}`}>
      <div
        className="book__stage"
        role="group"
        aria-roledescription="book"
        aria-label={`Heritage Passport, ${label}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
        style={{ touchAction: swipeEnabled ? "pan-y" : "none" }}
      >
        <div className="book__spread">
          {spread && <div className="book__slot book__slot--left">{page(flip ? a.left : shown.left, "left")}</div>}
          <div className="book__slot book__slot--right">
            {page(flip ? b.right : shown.right, "right")}
            {flip && (
              <div className={`book__leaf ${forward ? "is-forward" : "is-back"}`} onAnimationEnd={finishFlip} aria-hidden="true">
                <div className="book__face book__face--front">{page(a.right, "right")}</div>
                <div className="book__face book__face--back">{spread ? page(b.left, "left") : <div className="book-page book-page--verso" />}</div>
              </div>
            )}
          </div>
          {spread && <div className="book__gutter" aria-hidden="true" />}
        </div>
      </div>

      <div className="book__nav">
        <IconButton label="Previous page" variant="paper" onClick={() => go(index - 1)} disabled={index === 0}>
          <ChevronLeft size={24} />
        </IconButton>
        <p className="book__label" aria-live="polite">
          <span>{label}</span>
          <span className="book__title">{titles}</span>
        </p>
        <IconButton label="Next page" variant="paper" onClick={() => go(index + 1)} disabled={index === views.length - 1}>
          <ChevronRight size={24} />
        </IconButton>
      </div>
    </div>
  );
}
