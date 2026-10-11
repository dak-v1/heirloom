import { Suspense, lazy, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { ArrowRight, Box, BookOpen, BookOpenCheck, ChevronLeft, ChevronRight, Hand, Info, Layers, Stamp, ZoomIn, ZoomOut } from "lucide-react";
import { SITES, findStampPlace } from "../../content/sites";
import { BADGES } from "../../content/badges";
import { PASSPORT_PAGES, SPREADS, STAMPABLE_PAGE_IDS, locatePage } from "../../content/passport";
import type { EarnedStamp } from "../../services/progress";
import { playStampThunk } from "../../services/audio/sfx";
import { Button, ButtonLink, IconButton } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { StampArt, Tag } from "../../components/Media";
import { progress, useProgress } from "../../state/progress";
import { useProfile } from "../../state/profile";
import { displayName } from "../../services/profile";
import { findAvatar } from "../../content/avatars";
import { getPreferences, useReducedMotion } from "../../state/preferences";
import { formatVisitDate } from "../completion/Completion";
import { PassportBook, useWideLayout } from "./PassportBook";
import { formatIssued, passportNumber } from "./BookPage";
import { BookTray } from "./BookTray";
import { PlacementLayer } from "./PlacementLayer";
import { PlacementControls } from "./PlacementControls";
import { StampPress } from "./StampPress";
import { usePlacement } from "./usePlacement";
import { NUDGE_STEP, ROTATE_STEP, SIZE_STEP, moveTo, nudge, resize, rotate } from "./placement";
import type { Book3DHandle, PressRequest } from "./PassportBook3D";
import type { Focus, Mode, PageHit } from "./three/PassportScene";
import type { InkStamp } from "./three/pageArt";
import "./passport.css";
import "./book3d.css";

const PassportBook3D = lazy(() => import("./PassportBook3D"));

/** Page-by-page order when zoomed onto one page. */
const READING_ORDER = ["identity", ...STAMPABLE_PAGE_IDS];

function pageName(pageId: string) {
  const page = PASSPORT_PAGES.find((p) => p.id === pageId);
  if (!page) return "Inside cover";
  return `Page ${page.index + 1}, ${page.kind === "identity" ? "Identity" : page.title}`;
}

export function PassportPage() {
  const p = useProgress();
  const reduced = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [viewer, setViewer] = useState<"loading" | "ready" | "fallback">("loading");
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [flat, setFlat] = useState(false);
  const [detail, setDetail] = useState<EarnedStamp | null>(null);
  const bookRef = useRef<HTMLElement>(null);
  const book3d = useRef<Book3DHandle | null>(null);

  useEffect(() => {
    document.title = "My Heritage Passport · Heirloom";
  }, []);

  const placeId = params.get("place");
  const toPlace = p.earnedStamps.find((s) => s.id === placeId);
  const inBook = params.get("book") === "1" || !!toPlace;
  const currentPageId = p.passport.currentPageId ?? "cover";
  const isPlaced = (s: EarnedStamp) => p.placements.some((pl) => pl.earnedStampId === s.id);
  const explored = SITES.filter((s) => p.visits[s.id]?.completedAt).length;
  const unplaced = p.earnedStamps.filter((s) => !isPlaced(s));
  const firstUnvisited = SITES.find((s) => !p.earnedStamps.some((e) => e.siteId === s.id));
  const earnedBadges = BADGES.filter((b) => p.badges[b.id]);
  const me = useProfile();
  const holder = displayName(me);

  const placement = usePlacement({ reducedMotion: reduced });
  const { draft, pressing } = placement;
  const wide = useWideLayout();
  const use3D = viewer !== "fallback" && !flat;
  const [zoom, setZoom] = useState(false);
  const [visible, setVisible] = useState<string[]>([]);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Each newly chosen stamp starts zoomed in on its page.
  useEffect(() => {
    if (draft) setZoom(true);
  }, [draft?.earnedStampId]);

  // Escape cancels placing wherever focus is (unless a sheet is open and handles it).
  const placing = !!draft;
  useEffect(() => {
    if (!placing) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !document.body.classList.contains("has-sheet")) placement.cancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [placing, placement.cancel]);

  // Arriving with a stamp to place (?place= from the reward or the tray sheet): choose it.
  useEffect(() => {
    if (!toPlace) return;
    placement.pick(toPlace.id);
    const next = new URLSearchParams(params);
    next.delete("place");
    next.set("book", "1");
    setParams(next, { replace: true, state: location.state });
  }, [toPlace?.id]);

  // Move focus into the book when it opens, so keyboard and screen-reader users land on it.
  // (Delayed so it wins over a closing sheet handing focus back to its opener.)
  useEffect(() => {
    if (!inBook) return;
    const t = window.setTimeout(() => !draftRef.current && bookRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [inBook]);

  /** The open book lives in the URL (?book=1) so browser Back closes it again. */
  const enterBook = (stampId?: string) => {
    const next = new URLSearchParams({ book: "1" });
    if (stampId) next.set("place", stampId);
    setParams(next, { state: { overlay: true } });
  };
  const leaveBook = () => {
    placement.cancel();
    setZoom(false);
    if ((location.state as { overlay?: boolean } | null)?.overlay) navigate(-1);
    else setParams({}, { replace: true });
  };

  /* ---------------- 3D book: what is on screen ---------------- */

  const here = locatePage(currentPageId) ?? { spread: 0, side: "right" as const };
  const spread = SPREADS[here.spread];
  const zoomedIn = inBook && (zoom || !!pressing);
  const focus: Focus = zoomedIn ? here.side : "spread";
  const focusedPageId = here.side === "left" ? spread.left : spread.right;
  const mode: Mode = pressing ? "locked" : draft ? "place" : "browse";
  const viewLabel = focus === "spread" ? `${pageName(spread.left)} and ${pageName(spread.right)}` : pageName(focusedPageId);
  const shortLabel =
    focus !== "spread" ? pageName(focusedPageId).replace(", ", " · ") : here.spread === 0 ? "Identity page" : `Pages ${PASSPORT_PAGES.find((pg) => pg.id === spread.left)!.index + 1}–${PASSPORT_PAGES.find((pg) => pg.id === spread.right)!.index + 1}`;

  const goTo = (pageId: string) => (draftRef.current ? placement.moveToPage(pageId) : progress.setCurrentPassportPage(pageId));

  /** Next page (zoomed) or spread to turn to; "close" past the first spread; null at the ends. */
  const flipTarget = (dir: 1 | -1): string | "close" | null => {
    const busyPlacing = !!draftRef.current;
    if (focus !== "spread") {
      const order = busyPlacing ? STAMPABLE_PAGE_IDS : READING_ORDER;
      return order[Math.max(0, order.indexOf(currentPageId)) + dir] ?? null;
    }
    const s = here.spread + dir;
    if (s < (busyPlacing ? 1 : 0)) return busyPlacing ? null : "close";
    if (s >= SPREADS.length) return null;
    // Forward lands on the left page you'd read first; back lands on the right page.
    return dir > 0 && s > 0 ? SPREADS[s].left : SPREADS[s].right;
  };
  const flip = (dir: 1 | -1) => {
    if (pressing) return;
    const target = flipTarget(dir);
    if (target === "close") leaveBook();
    else if (target) goTo(target);
  };

  const onTapPage = (hit: PageHit) => {
    if (focus !== "spread" || !READING_ORDER.includes(hit.pageId)) return;
    progress.setCurrentPassportPage(hit.pageId);
    setZoom(true);
  };
  const onPlace = (hit: PageHit) => {
    const d = draftRef.current;
    if (!d) return;
    if (hit.pageId !== d.pageId) placement.moveToPage(hit.pageId, hit.x, hit.y);
    else placement.update((s) => moveTo(s, hit.x, hit.y));
  };

  const onStageKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!inBook) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        enterBook();
      }
      return;
    }
    if (pressing) return;
    const key = e.key;
    if (draft) {
      const step = NUDGE_STEP * (e.shiftKey ? 6 : 2);
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[key]) placement.update((s) => nudge(s, ...moves[key]));
      else if (key === "[" || key === "]") placement.update((s) => rotate(s, key === "]" ? ROTATE_STEP : -ROTATE_STEP));
      else if (key === "-" || key === "=" || key === "+") placement.update((s) => resize(s, key === "-" ? -SIZE_STEP : SIZE_STEP));
      else if (key === "PageDown" || key === "PageUp") flip(key === "PageDown" ? 1 : -1);
      else if (key === "Enter") placement.confirm();
      else return;
    } else if (key === "ArrowRight" || key === "PageDown") flip(1);
    else if (key === "ArrowLeft" || key === "PageUp") flip(-1);
    else if (key === "Escape" && zoom) setZoom(false);
    else return;
    e.preventDefault();
  };

  /* ---------------- 3D book: what is drawn ---------------- */

  const inkStamps = useMemo(() => {
    const byPage = new Map<string, InkStamp[]>();
    for (const pl of p.placements) {
      if (pl.earnedStampId === draft?.earnedStampId) continue; // the ghost stands in for it while it moves
      const earned = p.earnedStamps.find((s) => s.id === pl.earnedStampId);
      const site = findStampPlace(earned?.siteId);
      if (!earned || !site) continue;
      const list = byPage.get(pl.pageId) ?? [];
      list.push({ id: earned.id, site, visitDate: earned.visitDate, x: pl.x, y: pl.y, widthRatio: pl.widthRatio, rotationDeg: pl.rotationDeg, zIndex: pl.zIndex });
      byPage.set(pl.pageId, list);
    }
    return byPage;
  }, [p.placements, p.earnedStamps, draft?.earnedStampId]);

  const identity = useMemo(
    () => ({ holder, number: passportNumber(p.guestId), issued: formatIssued(p.createdAt), stamps: String(p.earnedStamps.length), photo: findAvatar(me.avatar).art }),
    [holder, me.avatar, p.guestId, p.createdAt, p.earnedStamps.length],
  );

  const inkArtOf = (earnedStampId: string) => findStampPlace(p.earnedStamps.find((s) => s.id === earnedStampId)?.siteId)?.stamp.inkArt;
  const ghost = useMemo(() => {
    const art = draft && inkArtOf(draft.earnedStampId);
    return draft && art ? { pageId: draft.pageId, x: draft.x, y: draft.y, widthRatio: draft.widthRatio, rotationDeg: draft.rotationDeg, inkArt: art } : null;
  }, [draft]);
  const press = useMemo<PressRequest | null>(() => {
    const art = pressing && inkArtOf(pressing.earnedStampId);
    if (!pressing || !art) return null;
    const { pageId, x, y, widthRatio, rotationDeg } = pressing.placement;
    return { id: pressing.earnedStampId, pageId, x, y, widthRatio, rotationDeg, inkArt: art };
  }, [pressing]);
  useEffect(() => {
    if (use3D && pressing && !press) placement.finishPress();
  }, [use3D, pressing, press]);

  const stampsHere = [spread.left, spread.right]
    .flatMap((id) => (inkStamps.get(id) ?? []).map((s) => `${s.site.name} (${pageName(id).split(",")[0].toLowerCase()})`))
    .join(", ");

  // Zooming in makes the stage taller; keep the whole page on screen (above the phone's action bar).
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stageRef.current;
    if (!zoomedIn || !use3D || !el) return;
    const reveal = () => el.scrollIntoView({ block: "nearest", behavior: "instant" });
    // Once the height transition has finished (the timer covers no transition / reduced motion).
    const onEnd = (e: TransitionEvent) => e.target === el && e.propertyName === "height" && reveal();
    el.addEventListener("transitionend", onEnd);
    const t = window.setTimeout(reveal, reduced ? 0 : 480);
    return () => {
      el.removeEventListener("transitionend", onEnd);
      window.clearTimeout(t);
    };
  }, [zoomedIn, use3D, draft?.earnedStampId]);

  const switchTo3D = () => {
    setViewer("loading");
    setFlat(false);
  };

  return (
    <div className="page passport">
      <header className="passport__head">
        <p className="kicker">Your keepsake</p>
        <h1>My Heritage Passport</h1>
        <dl className="passport__counts">
          <div>
            <dt>Sites explored</dt>
            <dd>
              {explored}
              <span>/{SITES.length}</span>
            </dd>
          </div>
          <div>
            <dt>Stamps earned</dt>
            <dd>{p.earnedStamps.length}</dd>
          </div>
          <div>
            <dt>Waiting to be placed</dt>
            <dd>{unplaced.length}</dd>
          </div>
        </dl>
      </header>

      {use3D ? (
        <section
          className={`passport3d card${inBook ? " is-open" : ""}${zoomedIn ? " is-zoomed" : ""}${draft ? " is-placing" : ""}`}
          aria-labelledby="book-h"
          ref={bookRef}
          tabIndex={-1}
        >
          {inBook ? (
            <div className="passport3d__head">
              <h2 id="book-h">Your passport</h2>
              <div className="passport3d__tools">
                <Button variant="ghost" size="sm" icon={<Layers size={16} />} onClick={() => setFlat(true)} disabled={!!pressing}>
                  Flat pages
                </Button>
                <Button variant="secondary" size="sm" icon={<BookOpen size={16} />} onClick={leaveBook} disabled={!!pressing}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <h2 id="book-h" className="visually-hidden">
              Your passport
            </h2>
          )}

          <div
            ref={stageRef}
            className="passport3d__stage"
            tabIndex={0}
            role="group"
            aria-roledescription="3D passport"
            aria-label={
              !inBook
                ? "The Heritage Passport, closed. Press Enter to open it."
                : draft
                  ? `${viewLabel}. Arrow keys move the stamp, [ and ] turn it, minus and plus resize it, Page Up and Page Down turn pages, Enter stamps it.`
                  : `${viewLabel}. Left and right arrow keys turn the pages.`
            }
            onKeyDown={onStageKey}
          >
            <Suspense fallback={null}>
              <PassportBook3D
                handle={book3d}
                open={inBook}
                spread={here.spread}
                focus={focus}
                mode={mode}
                reducedMotion={reduced}
                stamps={inkStamps}
                identity={identity}
                ghost={ghost}
                press={press}
                onPressDone={placement.finishPress}
                onReady={() => setViewer("ready")}
                onError={(r) => {
                  setFallbackReason(r);
                  setViewer("fallback");
                }}
                onTapClosed={() => enterBook()}
                onFlip={flip}
                onTapPage={onTapPage}
                onTapStamp={(id) => placement.pick(id)}
                onPlace={onPlace}
                onContact={() => getPreferences().soundEffects && playStampThunk()}
              />
            </Suspense>
            {viewer !== "ready" && (
              <div className="passport3d__fallback" aria-hidden="true">
                <img src="/assets/3d/passport-cover.png" alt="" />
                <span className="passport3d__loading">Opening your passport…</span>
              </div>
            )}
            {inBook && viewer === "ready" && (
              <>
                <p className="passport3d__where" aria-hidden="true">
                  {shortLabel}
                </p>
                <IconButton
                  label={flipTarget(-1) === "close" ? "Close the passport" : focus === "spread" ? "Previous pages" : "Previous page"}
                  variant="paper"
                  className="passport3d__nav passport3d__nav--prev"
                  onClick={() => flip(-1)}
                  disabled={!!pressing || !flipTarget(-1)}
                >
                  <ChevronLeft size={22} />
                </IconButton>
                <IconButton
                  label={focus === "spread" ? "Next pages" : "Next page"}
                  variant="paper"
                  className="passport3d__nav passport3d__nav--next"
                  onClick={() => flip(1)}
                  disabled={!!pressing || !flipTarget(1)}
                >
                  <ChevronRight size={22} />
                </IconButton>
                {!draft && (
                  <IconButton
                    label={zoom ? "Show both pages" : "Zoom in on this page"}
                    variant="paper"
                    className="passport3d__zoom"
                    onClick={() => setZoom((z) => !z)}
                    disabled={!!pressing}
                  >
                    {zoom ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
                  </IconButton>
                )}
                {draft && !pressing && (
                  <p className="passport3d__chip" aria-hidden="true">
                    {draft.touched ? "Drag to adjust it" : "Tap or drag to place it"}
                  </p>
                )}
              </>
            )}
          </div>
          <p className="visually-hidden" aria-live="polite">
            {inBook && viewer === "ready" ? `${viewLabel}. ${stampsHere ? `Stamps here: ${stampsHere}.` : "No stamps on these pages yet."}` : ""}
          </p>

          {inBook ? (
            <div className="passport3d__below">
              <BookTray
                earned={p.earnedStamps}
                placements={p.placements}
                selectedId={draft?.earnedStampId ?? null}
                onPick={placement.pick}
                resolveDrop={(x, y) => book3d.current?.resolveDrop(x, y) ?? null}
              />
              <PlacementControls api={placement} onScreen={!!draft} zoomed={focus !== "spread"} onToggleZoom={() => setZoom((z) => !z)} />
              {!draft && (
                <p className="muted passport-book__hint">
                  <Hand size={14} aria-hidden="true" /> Tap the edge of a page or swipe to turn it. Tap a page to look closer, or a stamp to move it.
                </p>
              )}
            </div>
          ) : (
            <div className="passport3d__controls">
              <Button icon={<BookOpenCheck size={18} />} onClick={() => enterBook()}>
                Open passport
              </Button>
              {viewer === "ready" && (
                <span className="muted passport3d__hint">
                  <Hand size={14} aria-hidden="true" /> Drag to turn it, tap to open
                </span>
              )}
            </div>
          )}
        </section>
      ) : inBook ? (
        renderFlatBook()
      ) : (
        <section className="passport3d card" aria-labelledby="book-h">
          <h2 id="book-h" className="visually-hidden">
            Your passport
          </h2>
          <div className="passport3d__stage">
            <div className="passport3d__fallback">
              <img src="/assets/3d/passport-cover.png" alt="The Heirloom Heritage Passport: a leather cover with a gold emblem of a temple roof, a gopuram and a dome." />
            </div>
          </div>
          <div className="passport3d__controls">
            <Button icon={<BookOpenCheck size={18} />} onClick={() => enterBook()}>
              Open passport
            </Button>
            {viewer === "fallback" ? (
              <span className="muted passport3d__hint">{fallbackReason} Showing flat pages instead.</span>
            ) : (
              <Button variant="ghost" size="sm" icon={<Box size={16} />} onClick={switchTo3D}>
                3D view
              </Button>
            )}
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="tray-h">
        <div className="section-head">
          <h2 id="tray-h">Stamp tray</h2>
          <span className="muted">{p.earnedStamps.length ? `${unplaced.length} waiting` : ""}</span>
        </div>
        {p.earnedStamps.length === 0 ? (
          <div className="empty card card--flat">
            <Stamp size={36} aria-hidden="true" />
            <p>
              <strong>Your passport is waiting for its first stamp.</strong>
              <br />
              Finish exploring any site to earn one. Games and memories are optional.
            </p>
            {firstUnvisited && (
              <ButtonLink to={`/site/${firstUnvisited.slug}`} ticket iconRight={<ArrowRight size={18} />}>
                Start at {firstUnvisited.name}
              </ButtonLink>
            )}
          </div>
        ) : (
          <ul className="tray">
            {p.earnedStamps.map((s, i) => {
              const site = findStampPlace(s.siteId);
              if (!site) return null;
              return (
                <li key={s.id}>
                  <button type="button" className={`tray__item${s.id === placeId ? " is-highlight" : ""}`} onClick={() => setDetail(s)}>
                    <StampArt src={site.stamp.art} alt={site.stamp.alt} tilt={[-3, 2, -1][i % 3]} />
                    <span className="tray__name">{site.name}</span>
                    <span className="tray__date">{formatVisitDate(s.visitDate)}</span>
                    <Tag tone={isPlaced(s) ? "olive" : "mustard"}>{isPlaced(s) ? "Placed" : "Not placed yet"}</Tag>
                    {site.demo && <Tag tone="demo">Demo stamp</Tag>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {firstUnvisited && p.earnedStamps.length > 0 && (
          <p className="tray__next">
            Next stamp: <ButtonLink variant="ghost" size="sm" to={`/site/${firstUnvisited.slug}`} iconRight={<ArrowRight size={14} />}>{firstUnvisited.name}</ButtonLink>
          </p>
        )}
      </section>

      <section className="section passport-badges" aria-labelledby="badges-h">
        <div className="section-head">
          <h2 id="badges-h">Badges</h2>
          <span className="muted">
            {Object.keys(p.badges).length} of {BADGES.length}
          </span>
        </div>
        <Link to="/profile" className="passport-badges__link card card--flat">
          <span className="passport-badges__pins" aria-hidden="true">
            {(earnedBadges.length ? earnedBadges : BADGES.slice(0, 3)).slice(0, 4).map((b, i) => (
              <img key={b.id} src={b.art} alt="" className={earnedBadges.length ? "" : "is-locked"} style={{ rotate: `${[-8, 5, -3, 7][i]}deg` }} />
            ))}
          </span>
          <span>
            <strong>Your badges live on your profile now</strong>
            <span className="muted">Pin them to your achievement board, arrange them and look at each one up close.</span>
          </span>
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>

      <p className={`notice storage-note${progress.persistent ? "" : " notice--warn"}`}>
        <Info size={16} aria-hidden="true" />
        <span>
          {progress.persistent
            ? "Your passport is saved in this browser only. There's no account and no sync between devices yet; clearing this site's data erases it."
            : "This browser isn't letting Heirloom save data (private browsing?). Your stamps will disappear when this tab closes."}
        </span>
      </p>

      <Sheet open={!!detail} onClose={() => setDetail(null)} title={detail ? (findStampPlace(detail.siteId)?.name ?? "Stamp") : "Stamp"}>
        {detail && (
          <div className="stamp-detail">
            <div className="stamp-detail__art">
              <StampArt src={findStampPlace(detail.siteId)?.stamp.art ?? ""} alt={findStampPlace(detail.siteId)?.stamp.alt ?? ""} />
              <img className="stamp-detail__ink" src={findStampPlace(detail.siteId)?.stamp.inkArt} alt="Ink impression version of the stamp, as it will look pressed onto a passport page." />
            </div>
            <p>
              {findStampPlace(detail.siteId)?.demo ? (
                <>
                  <Tag tone="demo">Demo stamp</Tag> A placeholder that fills the passport for demos; it isn't a trail visit.{" "}
                </>
              ) : (
                <>
                  Visited <strong>{formatVisitDate(detail.visitDate)}</strong>.{" "}
                </>
              )}
              {isPlaced(detail) ? "Placed in your passport." : "Waiting to be placed."}
            </p>
            <Button
              block
              icon={<Stamp size={18} />}
              onClick={() => {
                const id = detail.id;
                setDetail(null);
                enterBook(id);
              }}
            >
              {isPlaced(detail) ? "Move in passport" : "Place in passport"}
            </Button>
            {!findStampPlace(detail.siteId)?.demo && (
              <ButtonLink to={`/site/${findStampPlace(detail.siteId)?.slug}`} variant="ghost" block>
                Revisit {findStampPlace(detail.siteId)?.name}
              </ButtonLink>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );

  /** The flat, flippable book: used when 3D isn't available, or when the visitor prefers it. (A render helper, not a component, so it isn't remounted on every render.) */
  function renderFlatBook() {
    const zoomed = (!!draft && zoom) || !!pressing;
    const onScreen = !!draft && visible.includes(draft.pageId);
    const controls = <PlacementControls api={placement} onScreen={onScreen} zoomed={zoomed} onToggleZoom={() => setZoom((z) => !z)} />;
    const controlsBeside = wide && zoomed;
    // Turning pages while placing carries the preview along to the stamp page now on screen.
    const onVisiblePagesChange = (ids: string[]) => {
      setVisible(ids);
      const d = draftRef.current;
      if (d && !ids.includes(d.pageId)) {
        const target = ids.find((id) => STAMPABLE_PAGE_IDS.includes(id));
        if (target) placement.moveToPage(target);
      }
    };
    return (
      <section className={`passport-book${draft ? " is-placing" : ""}`} aria-labelledby="book-h" ref={bookRef} tabIndex={-1}>
        <div className="passport-book__head">
          <h2 id="book-h">Your passport</h2>
          <div className="passport3d__tools">
            {viewer !== "fallback" && (
              <Button variant="ghost" size="sm" icon={<Box size={16} />} onClick={switchTo3D} disabled={!!pressing}>
                3D view
              </Button>
            )}
            <Button variant="secondary" size="sm" icon={<BookOpen size={16} />} onClick={leaveBook} disabled={!!pressing}>
              Close
            </Button>
          </div>
        </div>
        <BookTray earned={p.earnedStamps} placements={p.placements} selectedId={draft?.earnedStampId ?? null} onPick={placement.pick} />
        <PassportBook
          currentPageId={currentPageId}
          onPageChange={(id) => progress.setCurrentPassportPage(id)}
          onVisiblePagesChange={onVisiblePagesChange}
          reducedMotion={reduced}
          identity={{ holder, avatar: findAvatar(me.avatar).art, issuedAt: p.createdAt, guestId: p.guestId, stampsEarned: p.earnedStamps.length }}
          swipeEnabled={!draft && !pressing}
          zoomed={zoomed}
          aside={controlsBeside ? controls : undefined}
          renderPageOverlay={(page, { interactive }) => <PlacementLayer page={page} interactive={interactive} placements={p.placements} earned={p.earnedStamps} api={placement} />}
        />
        {!controlsBeside && controls}
        {!draft && (
          <p className="muted passport-book__hint">
            <Hand size={14} aria-hidden="true" /> Swipe, use the arrows, or press ← → to turn pages. Tap a stamp on a page to move it.
          </p>
        )}
        {pressing && !reduced && <StampPress pressing={pressing} onDone={placement.finishPress} />}
      </section>
    );
  }
}
