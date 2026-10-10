import { Suspense, lazy, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { ArrowRight, BookOpen, BookOpenCheck, Hand, Info, Stamp } from "lucide-react";
import { SITES, findSite } from "../../content/sites";
import { BADGES } from "../../content/badges";
import type { EarnedStamp } from "../../services/progress";
import { Button, ButtonLink } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { StampArt, Tag } from "../../components/Media";
import { progress, useProgress } from "../../state/progress";
import { useReducedMotion } from "../../state/preferences";
import { formatVisitDate } from "../completion/Completion";
import "./passport.css";

const Passport3D = lazy(() => import("./Passport3D"));

export function PassportPage() {
  const p = useProgress();
  const reduced = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [viewer, setViewer] = useState<"loading" | "ready" | "fallback">("loading");
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [detail, setDetail] = useState<EarnedStamp | null>(null);

  useEffect(() => {
    document.title = "My Heritage Passport · Heirloom";
  }, []);

  const placeId = params.get("place");
  const toPlace = p.earnedStamps.find((s) => s.id === placeId);
  const isPlaced = (s: EarnedStamp) => p.placements.some((pl) => pl.earnedStampId === s.id);
  const explored = SITES.filter((s) => p.visits[s.id]?.completedAt).length;
  const unplaced = p.earnedStamps.filter((s) => !isPlaced(s));
  const firstUnvisited = SITES.find((s) => !p.earnedStamps.some((e) => e.siteId === s.id));

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

      {toPlace && (
        <section className="place-notice card card--tape" aria-labelledby="place-h">
          <StampArt src={findSite(toPlace.siteId)?.stamp.art ?? ""} alt="" tilt={-5} className="place-notice__stamp" />
          <div>
            <h2 id="place-h">{findSite(toPlace.siteId)?.name} stamp is ready</h2>
            <p>
              <Tag tone="demo">Next build</Tag> Choosing a page and pressing the stamp exactly where you like arrives in the next stage of the build. Your stamp is saved and waiting in the tray below, so nothing is lost.
            </p>
            <Button variant="secondary" size="sm" onClick={() => setParams({}, { replace: true })}>
              Got it
            </Button>
          </div>
        </section>
      )}

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
                onTap={() => setOpen((o) => !o)}
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
          <Button variant={open ? "secondary" : "primary"} icon={open ? <BookOpen size={18} /> : <BookOpenCheck size={18} />} onClick={() => setOpen((o) => !o)} aria-pressed={open}>
            {open ? "Close passport" : "Open passport"}
          </Button>
          {viewer === "ready" && (
            <span className="muted passport3d__hint">
              <Hand size={14} aria-hidden="true" /> Drag to turn it, tap to {open ? "close" : "open"}
            </span>
          )}
        </div>
        {viewer === "fallback" && <p className="muted passport3d__hint">{fallbackReason} Showing the cover instead.</p>}
        <p className="notice passport3d__dev">
          <Info size={16} aria-hidden="true" />
          <span>
            <strong>Coming in the next build:</strong> flip through the stamp pages and press each stamp wherever you like. The pages, placement rules and storage are already set up.
          </span>
        </p>
      </section>

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
                    <Tag tone={isPlaced(s) ? "olive" : "mustard"}>{isPlaced(s) ? "Placed" : "Waiting to be placed"}</Tag>
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
            <Button block disabled aria-describedby="place-soon">
              Place in passport
            </Button>
            <p id="place-soon" className="muted" style={{ fontSize: "var(--text-sm)" }}>
              Free placement on the passport pages arrives in the next build.
            </p>
            <ButtonLink to={`/site/${findSite(detail.siteId)?.slug}`} variant="ghost" block>
              Revisit {findSite(detail.siteId)?.name}
            </ButtonLink>
          </div>
        )}
      </Sheet>
    </div>
  );
}
