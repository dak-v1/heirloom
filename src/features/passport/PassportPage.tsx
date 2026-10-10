import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { ArrowRight, BookOpen, BookOpenCheck, Hand, Info, Stamp } from "lucide-react";
import { SITES, findSite } from "../../content/sites";
import { BADGES } from "../../content/badges";
import { STAMPABLE_PAGE_IDS } from "../../content/passport";
import type { EarnedStamp } from "../../services/progress";
import { Button, ButtonLink } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { StampArt, Tag } from "../../components/Media";
import { progress, useProgress } from "../../state/progress";
import { useReducedMotion } from "../../state/preferences";
import { formatVisitDate } from "../completion/Completion";
import { PassportBook, useWideLayout } from "./PassportBook";
import { BookTray } from "./BookTray";
import { PlacementLayer } from "./PlacementLayer";
import { PlacementControls } from "./PlacementControls";
import { StampPress } from "./StampPress";
import { usePlacement } from "./usePlacement";
import "./passport.css";

const Passport3D = lazy(() => import("./Passport3D"));

/** How long the 3D cover's "Open" clip runs before the flat book takes over. */
const COVER_OPEN_MS = 1100;

export function PassportPage() {
  const p = useProgress();
  const reduced = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [viewer, setViewer] = useState<"loading" | "ready" | "fallback">("loading");
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [detail, setDetail] = useState<EarnedStamp | null>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const bookRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.title = "My Heritage Passport · Heirloom";
    return () => window.clearTimeout(openTimer.current);
  }, []);

  const placeId = params.get("place");
  const toPlace = p.earnedStamps.find((s) => s.id === placeId);
  const inBook = params.get("book") === "1" || !!toPlace;
  const currentPageId = p.passport.currentPageId ?? "cover";
  const isPlaced = (s: EarnedStamp) => p.placements.some((pl) => pl.earnedStampId === s.id);
  const explored = SITES.filter((s) => p.visits[s.id]?.completedAt).length;
  const unplaced = p.earnedStamps.filter((s) => !isPlaced(s));
  const firstUnvisited = SITES.find((s) => !p.earnedStamps.some((e) => e.siteId === s.id));

  const placement = usePlacement({ reducedMotion: reduced });
  const { draft, pressing } = placement;
  const wide = useWideLayout();
  const [zoomedOut, setZoomedOut] = useState(false);
  const [visible, setVisible] = useState<string[]>([]);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const zoomed = (!!draft && !zoomedOut) || !!pressing;
  const onScreen = !!draft && visible.includes(draft.pageId);

  // Each newly chosen stamp starts zoomed in on its page.
  useEffect(() => setZoomedOut(false), [draft?.earnedStampId]);

  // Escape cancels placing wherever focus is (unless a sheet is open and handles it).
  const placing = !!draft;
  useEffect(() => {
    if (!placing) return;
    const onKey = (e: KeyboardEvent) => {
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

  // Turning pages while placing carries the preview along to the stamp page now on screen.
  const onVisiblePagesChange = (ids: string[]) => {
    setVisible(ids);
    const d = draftRef.current;
    if (d && !ids.includes(d.pageId)) {
      const target = ids.find((id) => STAMPABLE_PAGE_IDS.includes(id));
      if (target) placement.moveToPage(target);
    }
  };

  // Move focus into the book when it opens, so keyboard and screen-reader users land on it.
  // (Delayed so it wins over a closing sheet handing focus back to its opener.)
  useEffect(() => {
    if (!inBook) return;
    // If a stamp preview is already on a page, it has taken focus; leave it there.
    const t = window.setTimeout(() => !draftRef.current && bookRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [inBook]);

  /** The book lives in the URL (?book=1) so browser Back returns to the cover. */
  const enterBook = (stampId?: string) => {
    window.clearTimeout(openTimer.current);
    setOpen(false);
    const next = new URLSearchParams({ book: "1" });
    if (stampId) next.set("place", stampId);
    setParams(next, { state: { overlay: true } });
  };
  const leaveBook = () => {
    placement.cancel();
    if ((location.state as { overlay?: boolean } | null)?.overlay) navigate(-1);
    else setParams({}, { replace: true });
  };
  const openPassport = () => {
    if (reduced || viewer !== "ready") return enterBook();
    setOpen(true);
    openTimer.current = window.setTimeout(() => enterBook(), COVER_OPEN_MS);
  };
  const controls = <PlacementControls api={placement} onScreen={onScreen} zoomed={zoomed} onToggleZoom={() => setZoomedOut((z) => !z)} />;
  const controlsBeside = wide && zoomed;

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

      {inBook ? (
        <section className={`passport-book${draft ? " is-placing" : ""}`} aria-labelledby="book-h" ref={bookRef} tabIndex={-1}>
          <div className="passport-book__head">
            <h2 id="book-h">Your passport</h2>
            <Button variant="secondary" size="sm" icon={<BookOpen size={16} />} onClick={leaveBook} disabled={!!pressing}>
              Close passport
            </Button>
          </div>
          <BookTray earned={p.earnedStamps} placements={p.placements} selectedId={draft?.earnedStampId ?? null} onPick={placement.pick} />
          <PassportBook
            currentPageId={currentPageId}
            onPageChange={(id) => progress.setCurrentPassportPage(id)}
            onVisiblePagesChange={onVisiblePagesChange}
            reducedMotion={reduced}
            identity={{ issuedAt: p.createdAt, guestId: p.guestId, stampsEarned: p.earnedStamps.length }}
            swipeEnabled={!draft && !pressing}
            zoomed={zoomed}
            aside={controlsBeside ? controls : undefined}
            renderPageOverlay={(page, { interactive }) => (
              <PlacementLayer page={page} interactive={interactive} placements={p.placements} earned={p.earnedStamps} api={placement} />
            )}
          />
          {!controlsBeside && controls}
          {!draft && (
            <p className="muted passport-book__hint">
              <Hand size={14} aria-hidden="true" /> Swipe, use the arrows, or press ← → to turn pages. Tap a stamp on a page to move it.
            </p>
          )}
          {pressing && !reduced && <StampPress pressing={pressing} onDone={placement.finishPress} />}
        </section>
      ) : (
      <section className="passport3d card" aria-labelledby="book-h">
        <h2 id="book-h" className="visually-hidden">
          Your passport
        </h2>
        <div className={`passport3d__stage${open ? " is-open" : ""}`}>
          {viewer !== "fallback" && (
            <Suspense fallback={null}>
              <Passport3D
                open={open}
                reducedMotion={reduced}
                onTap={openPassport}
                onReady={() => setViewer("ready")}
                onError={(r) => {
                  setFallbackReason(r);
                  setViewer("fallback");
                }}
              />
            </Suspense>
          )}
          {viewer !== "ready" && (
            <div className="passport3d__fallback" aria-hidden={viewer === "loading"}>
              <img src="/assets/3d/passport-cover.png" alt="The Heirloom Heritage Passport: a leather cover with a gold emblem of a temple roof, a gopuram and a dome." />
              {viewer === "loading" && <span className="passport3d__loading">Opening your passport…</span>}
            </div>
          )}
        </div>
        <div className="passport3d__controls">
          <Button icon={<BookOpenCheck size={18} />} onClick={openPassport} disabled={open}>
            {open ? "Opening…" : "Open passport"}
          </Button>
          {viewer === "ready" && (
            <span className="muted passport3d__hint">
              <Hand size={14} aria-hidden="true" /> Drag to turn it, tap to open
            </span>
          )}
        </div>
        {viewer === "fallback" && <p className="muted passport3d__hint">{fallbackReason} Showing the cover instead.</p>}
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
              const site = findSite(s.siteId);
              if (!site) return null;
              return (
                <li key={s.id}>
                  <button type="button" className={`tray__item${s.id === placeId ? " is-highlight" : ""}`} onClick={() => setDetail(s)}>
                    <StampArt src={site.stamp.art} alt={site.stamp.alt} tilt={[-3, 2, -1][i % 3]} />
                    <span className="tray__name">{site.name}</span>
                    <span className="tray__date">{formatVisitDate(s.visitDate)}</span>
                    <Tag tone={isPlaced(s) ? "olive" : "mustard"}>{isPlaced(s) ? "Placed" : "Not placed yet"}</Tag>
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

      <section className="section" aria-labelledby="badges-h">
        <div className="section-head">
          <h2 id="badges-h">Badges</h2>
          <span className="muted">
            {Object.keys(p.badges).length} of {BADGES.filter((b) => !b.comingSoon).length}
          </span>
        </div>
        <p className="muted badges__intro">Bonus rewards for curiosity. They never decide whether you earn a site stamp.</p>
        <ul className="badges">
          {BADGES.map((b) => {
            const got = p.badges[b.id];
            return (
              <li key={b.id} className={`badge${got ? " is-earned" : ""}`}>
                <img src={b.art} alt="" width={96} height={96} />
                <strong>{b.name}</strong>
                <span className="muted">{got ? b.description : b.howToEarn}</span>
                {b.comingSoon && !got && <Tag tone="demo">Next build</Tag>}
                <span className="visually-hidden">{got ? "Earned" : "Not earned yet"}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <p className={`notice storage-note${progress.persistent ? "" : " notice--warn"}`}>
        <Info size={16} aria-hidden="true" />
        <span>
          {progress.persistent
            ? "Your passport is saved in this browser only. There's no account and no sync between devices yet; clearing this site's data erases it."
            : "This browser isn't letting Heirloom save data (private browsing?). Your stamps will disappear when this tab closes."}
        </span>
      </p>

      <Sheet open={!!detail} onClose={() => setDetail(null)} title={detail ? (findSite(detail.siteId)?.name ?? "Stamp") : "Stamp"}>
        {detail && (
          <div className="stamp-detail">
            <div className="stamp-detail__art">
              <StampArt src={findSite(detail.siteId)?.stamp.art ?? ""} alt={findSite(detail.siteId)?.stamp.alt ?? ""} />
              <img className="stamp-detail__ink" src={findSite(detail.siteId)?.stamp.inkArt} alt="Ink impression version of the stamp, as it will look pressed onto a passport page." />
            </div>
            <p>
              Visited <strong>{formatVisitDate(detail.visitDate)}</strong>. {isPlaced(detail) ? "Placed in your passport." : "Waiting to be placed."}
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
            <ButtonLink to={`/site/${findSite(detail.siteId)?.slug}`} variant="ghost" block>
              Revisit {findSite(detail.siteId)?.name}
            </ButtonLink>
          </div>
        )}
      </Sheet>
    </div>
  );
}
