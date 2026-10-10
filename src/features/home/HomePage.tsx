import { useEffect } from "react";
import { Link } from "react-router";
import { ArrowRight, BookOpen, Headphones, History, LocateFixed, MapPinned, ShieldCheck } from "lucide-react";
import { SITES, findSite } from "../../content/sites";
import { Button, ButtonLink } from "../../components/Button";
import { Tag } from "../../components/Media";
import { useProgress } from "../../state/progress";
import { STATUS_LABEL, useGeo } from "../location/geo-context";
import { formatDistance } from "../../services/arrival";
import { SiteCard } from "./SiteCard";
import "./home.css";

export function HomePage() {
  const p = useProgress();
  const geo = useGeo();
  useEffect(() => {
    document.title = "Heirloom · Singapore heritage passport";
  }, []);

  const earned = p.earnedStamps.length;
  const unplaced = p.earnedStamps.filter((s) => !p.placements.some((pl) => pl.earnedStampId === s.id)).length;
  const inProgress = Object.entries(p.visits)
    .filter(([id, v]) => v.startedAt && !v.completedAt && findSite(id))
    .sort((a, b) => (b[1].startedAt ?? "").localeCompare(a[1].startedAt ?? ""))[0];
  const continueSite = inProgress ? findSite(inProgress[0]) : undefined;
  const locating = geo.status === "requesting";
  const locOn = geo.status === "active" || geo.status === "approximate";

  return (
    <div className="page home">
      <section className="hero fade-in" aria-labelledby="hero-h">
        <div className="hero__stamps" aria-hidden="true">
          {SITES.map((s, i) => (
            <img key={s.id} src={s.stamp.art} alt="" className={`hero__stamp hero__stamp--${i}`} />
          ))}
          <img src="/assets/decor/postmark.svg" alt="" className="hero__postmark" />
        </div>
        <p className="kicker">A Singapore heritage passport</p>
        <h1 id="hero-h">
          Every street
          <br />
          has a story.
        </h1>
        <p className="lede hero__lede">See the past, hear the stories and collect a stamp at three heritage sites in Chinatown and Kampong Glam.</p>
        <div className="hero__actions">
          <ButtonLink to="/map" size="lg" ticket iconRight={<ArrowRight size={20} />}>
            Start exploring
          </ButtonLink>
          <Button variant="secondary" icon={<LocateFixed size={18} />} onClick={geo.start} disabled={locating}>
            {locating ? "Finding you…" : locOn ? "Check nearby again" : "Find places near me"}
          </Button>
        </div>
        <p className="hero__loc muted" role="status">
          {geo.message ??
            (locOn && geo.nearest
              ? `${STATUS_LABEL[geo.status]}. Nearest: ${geo.nearest.site.name}, ${formatDistance(geo.nearest.distance)}.`
              : "Location is optional and only used while the app is open. You can always pick a place yourself.")}
        </p>
      </section>

      {continueSite && (
        <Link to={`/site/${continueSite.slug}`} className="continue card card--tape">
          <img src={continueSite.stamp.art} alt="" />
          <span>
            <span className="label">Continue your visit</span>
            <strong>{continueSite.name}</strong>
            <span className="muted">Pick up where you left off.</span>
          </span>
          <ArrowRight size={22} aria-hidden="true" />
        </Link>
      )}

      <section className="section" aria-labelledby="trail-h">
        <div className="section-head">
          <h2 id="trail-h">The trail</h2>
          <Link to="/map" className="muted">
            Map <MapPinned size={14} aria-hidden="true" />
          </Link>
        </div>
        <p className="muted trail-intro">Different journeys, same home: a Hokkien temple, a Hindu temple and a royal mosque, each with its own story.</p>
        <div className="trail">
          {SITES.map((s, i) => (
            <SiteCard key={s.id} site={s} index={i} distance={geo.distanceTo(s)} visited={p.earnedStamps.some((e) => e.siteId === s.id)} started={!!p.visits[s.id]?.startedAt} />
          ))}
        </div>
      </section>

      <section className="section passport-preview card" aria-labelledby="pp-h">
        <img className="passport-preview__cover" src="/assets/3d/passport-cover.png" alt="" />
        <div>
          <h2 id="pp-h">My Heritage Passport</h2>
          <p className="passport-preview__count">
            <strong>{earned}</strong> of {SITES.length} stamps earned
          </p>
          <div className="progress-bar" aria-hidden="true">
            <span style={{ width: `${(earned / SITES.length) * 100}%` }} />
          </div>
          {unplaced > 0 && (
            <p className="muted" style={{ marginTop: 6 }}>
              {unplaced} waiting to be placed
            </p>
          )}
          <ButtonLink to="/passport" variant="secondary" size="sm" style={{ marginTop: 12 }} iconRight={<ArrowRight size={16} />}>
            Open passport
          </ButtonLink>
        </div>
      </section>

      <section className="section how" aria-labelledby="how-h">
        <h2 id="how-h">How Heirloom works</h2>
        <ul className="how__list">
          <li>
            <History aria-hidden="true" />
            <span>
              <strong>Real photographs, honestly dated.</strong> Archival images from public collections, labelled with their type, date range and credit. No AI-made "history".
            </span>
          </li>
          <li>
            <Headphones aria-hidden="true" />
            <span>
              <strong>Listen or read.</strong> Sourced stories with a full transcript. English is curated; 中文 and Melayu are <Tag tone="draft">draft</Tag> translations awaiting review.
            </span>
          </li>
          <li>
            <BookOpen aria-hidden="true" />
            <span>
              <strong>Your stamp never depends on extras.</strong> The game and memories are optional. Finish exploring and the stamp is yours.
            </span>
          </li>
          <li>
            <ShieldCheck aria-hidden="true" />
            <span>
              <strong>Private by default.</strong> No account. Progress stays in this browser, and your location is never stored. <Link to="/privacy">Privacy</Link>
            </span>
          </li>
        </ul>
      </section>

      <footer className="home-foot" aria-label="About">
        <img src="/assets/decor/shophouses.svg" alt="" className="home-foot__row" />
        <p className="hand">Singapore, always a good story.</p>
        <p className="muted">
          <Link to="/about">About &amp; sources</Link> · <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link>
        </p>
        <p className="muted home-foot__note">An independent community project. Not affiliated with the National Heritage Board, the National Library Board or the sites featured.</p>
      </footer>
    </div>
  );
}
