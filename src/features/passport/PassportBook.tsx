import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PASSPORT_PAGES, type PassportPage } from "../../content/passport";
import { IconButton } from "../../components/Button";
import { BookPage, type IdentityInfo } from "./BookPage";
import "./book.css";

/** What is visible at once: one page on phones (or when zoomed), a left/right spread on wide screens. */
interface View {
  left?: PassportPage;
  right?: PassportPage;
}

const SPREAD_QUERY = "(min-width: 760px)";
const FLIP_MS = 600;
const ZOOM_MS = 380;

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

/** True on screens wide enough for a two-page spread. */
export const useWideLayout = () => useMedia(SPREAD_QUERY);

interface Props {
  /** Stable page ID the visitor is on (see src/content/passport.ts). */
  currentPageId: string;
  onPageChange: (pageId: string) => void;
  /** Reports which pages are on screen whenever that changes. */
  onVisiblePagesChange?: (pageIds: string[]) => void;
  reducedMotion: boolean;
  identity: IdentityInfo;
  /** Turn off swipe-to-flip, e.g. while a stamp is being placed. */
  swipeEnabled?: boolean;
  /** Zoom in on the current page (one large page, even on wide screens). */
  zoomed?: boolean;
  /** Shown beside the zoomed page on wide screens (placement controls). */
  aside?: ReactNode;
  /** Content layered on a page. `interactive` is false for the copies drawn on a turning leaf. */
  renderPageOverlay?: (page: PassportPage, opts: { interactive: boolean }) => ReactNode;
}

type Flip = { from: number; to: number };

/**
 * The flat, flippable Heritage Passport. Pages keep the fixed logical aspect ratio
 * and stable IDs in every layout, so placements land on the same spot everywhere.
 */
export function PassportBook({ currentPageId, onPageChange, onVisiblePagesChange, reducedMotion, identity, swipeEnabled = true, zoomed = false, aside, renderPageOverlay }: Props) {
  const spread = useMedia(SPREAD_QUERY);
  const [zoomActive, setZoomActive] = useState(false);
  const mode = zoomActive ? "zoom" : spread ? "spread" : "single";
  const views = buildViews(mode === "spread");
  const found = views.findIndex((v) => pagesOf(v).some((p) => p.id === currentPageId));
  const index = found < 0 ? 0 : found;

  const [flipState, setFlip] = useState<Flip | null>(null);
  const flipping = useRef(false);
  const flipTimer = useRef<number | undefined>(undefined);
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const last = useRef({ mode, index });
  const lastRect = useRef<DOMRect | null>(null);
  // A layout change mid-flip would leave stale view indices: drop the animation.
  const flip = flipState && views[flipState.from] && views[flipState.to] ? flipState : null;

  const startFlip = (f: Flip) => {
    flipping.current = true;
    setFlip(f);
    window.clearTimeout(flipTimer.current);
    // Fallback in case animationend never fires (tab hidden, animation disabled by the browser).
    flipTimer.current = window.setTimeout(finishFlip, FLIP_MS + 300);
  };
  const finishFlip = useCallback(() => {
    window.clearTimeout(flipTimer.current);
    flipping.current = false;
    setFlip(null);
  }, []);

  useEffect(() => () => window.clearTimeout(flipTimer.current), []);
  useEffect(finishFlip, [spread, finishFlip]);

  const slotOf = (pageId: string) => stage.current?.querySelector<HTMLElement>(`.book__slot > [data-page-id="${pageId}"]`)?.parentElement ?? null;

  // 1. A page change from outside (picking a stamp on another page) turns the page too.
  // 2. Entering/leaving zoom animates the page from where it was to where it is (FLIP).
  // Runs before paint, so there is no flash of the new state.
  useLayoutEffect(() => {
    const prev = last.current;
    last.current = { mode, index };
    if (prev.mode === mode) {
      if (prev.index !== index && !flipping.current && !reducedMotion) startFlip({ from: prev.index, to: index });
      return;
    }
    if (prev.mode !== "zoom" && mode !== "zoom") return;
    const el = slotOf(currentPageId);
    const before = lastRect.current;
    if (!el) return;
    if (mode === "zoom") {
      const y0 = window.scrollY;
      stage.current?.scrollIntoView({ block: "start", behavior: "instant" });
      if (before) before.y -= window.scrollY - y0;
    }
    if (!before || reducedMotion) return;
    const after = el.getBoundingClientRect();
    if (!after.width) return;
    el.style.transition = "none";
    el.style.transformOrigin = "0 0";
    el.style.transform = `translate(${before.x - after.x}px, ${before.y - after.y}px) scale(${before.width / after.width})`;
    void el.offsetWidth;
    el.style.transition = `transform ${ZOOM_MS}ms var(--ease-out)`;
    el.style.transform = "";
    const clear = () => {
      el.style.transition = "";
      el.style.transformOrigin = "";
    };
    el.addEventListener("transitionend", clear, { once: true });
    window.setTimeout(clear, ZOOM_MS + 100);
  });

  // Remember where the current page is on screen, for the next zoom animation.
  useLayoutEffect(() => {
    lastRect.current = slotOf(currentPageId)?.getBoundingClientRect() ?? null;
  });

  // Zoom only once any page turn has finished: turn to the page first, then zoom in.
  useEffect(() => {
    if (zoomed && !zoomActive && !flipping.current) setZoomActive(true);
    else if (!zoomed && zoomActive) setZoomActive(false);
  }, [zoomed, zoomActive, flipState]);

  const shown = views[index];
  const shownIds = pagesOf(shown)
    .map((p) => p.id)
    .join(",");
  useEffect(() => {
    onVisiblePagesChange?.(shownIds.split(","));
    // Only when the visible pages change.
  }, [shownIds]);

  const go = (to: number) => {
    if (flip || to < 0 || to >= views.length || to === index) return;
    if (!reducedMotion) startFlip({ from: index, to });
    last.current = { mode, index: to };
    onPageChange(primary(views[to]).id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return; // keys inside a page (stamp preview) are theirs
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

  const shownPages = pagesOf(shown);
  const total = PASSPORT_PAGES.length;
  const label =
    shownPages.length > 1 ? `Pages ${shownPages[0].index + 1}–${shownPages[1].index + 1} of ${total}` : `Page ${shownPages[0].index + 1} of ${total}`;
  const titles = shownPages.map((p) => p.title ?? (p.kind === "cover" ? "Cover" : "Identity page")).join(" and ");
  const twoSlots = mode === "spread";

  // During a flip the leaf turns over the right-hand slot. With a = the earlier view and b = the later one:
  // underneath shows a.left and b.right; the leaf's front is a.right and its back is b.left.
  const a = flip ? views[Math.min(flip.from, flip.to)] : shown;
  const b = flip ? views[Math.max(flip.from, flip.to)] : shown;
  const forward = flip ? flip.to > flip.from : true;

  const page = (p: PassportPage | undefined, side: "left" | "right", interactive: boolean) =>
    p ? (
      <BookPage page={p} side={twoSlots ? side : "right"} identity={identity} overlay={renderPageOverlay?.(p, { interactive })} />
    ) : (
      <div className="book-page book-page--empty" aria-hidden="true" />
    );

  return (
    <div className={`book book--${mode}`}>
      <div
        ref={stage}
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
          {twoSlots && <div className="book__slot book__slot--left">{page(flip ? a.left : shown.left, "left", !flip)}</div>}
          <div className="book__slot book__slot--right">
            {page(flip ? b.right : shown.right, "right", !flip)}
            {flip && (
              <div className={`book__leaf ${forward ? "is-forward" : "is-back"}`} onAnimationEnd={finishFlip} aria-hidden="true">
                <div className="book__face book__face--front">{page(a.right, "right", false)}</div>
                <div className="book__face book__face--back">{twoSlots ? page(b.left, "left", false) : <div className="book-page book-page--verso" />}</div>
              </div>
            )}
          </div>
          {twoSlots && <div className="book__gutter" aria-hidden="true" />}
          {mode === "zoom" && spread && aside && <div className="book__aside">{aside}</div>}
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
