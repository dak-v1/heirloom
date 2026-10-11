import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, LocateFixed, MapPinned } from "lucide-react";
import { SITES, findSite } from "../../content/sites";
import { Button, ButtonLink } from "../../components/Button";
import { useProgress } from "../../state/progress";
import { useReducedMotion } from "../../state/preferences";
import { STATUS_LABEL, useGeo } from "../location/geo-context";
import { SiteCard } from "./SiteCard";
import { WorldIntro } from "./WorldIntro";
import "./home.css";

// Show the welcome sequence once per app load, even if the visitor returns home.
let worldIntroShown = false;

export function HomePage() {
  const p = useProgress();
  const geo = useGeo();
  const reducedMotion = useReducedMotion();
  const [showWorldIntro, setShowWorldIntro] = useState(() => !worldIntroShown);
  useEffect(() => {
    document.title = "Singapore, Reimagined · Heritage tours";
  }, []);

  const finishWorldIntro = () => {
    worldIntroShown = true;
    setShowWorldIntro(false);
  };

  const earned = p.earnedStamps.filter((e) => findSite(e.siteId)).length;
  const demoStamps = p.earnedStamps.length - earned;
  const unplaced = p.earnedStamps.filter((s) => !p.placements.some((pl) => pl.earnedStampId === s.id)).length;
  const inProgress = Object.entries(p.visits)
    .filter(([id, v]) => v.startedAt && !v.completedAt && findSite(id))
    .sort((a, b) => (b[1].startedAt ?? "").localeCompare(a[1].startedAt ?? ""))[0];
  const continueSite = inProgress ? findSite(inProgress[0]) : undefined;
  const locating = geo.status === "requesting";
  const locOn = geo.status === "active" || geo.status === "approximate";

  return (
    <>
    {showWorldIntro && <WorldIntro reducedMotion={reducedMotion} onComplete={finishWorldIntro} />}
    <div className="page home">
      <section className="hero fade-in" aria-labelledby="hero-h">
        <figure className="hero__plate" aria-hidden="true">
          <img src="/assets/decor/skyline-sketch.svg" alt="" width={640} height={360} />
          <img className="hero__postmark" src="/assets/decor/postmark-terracotta.svg" alt="" />
        </figure>
        <div className="hero__text">
          <p className="kicker">Singapore, Reimagined</p>
          <h1 id="hero-h">Every street has a story.</h1>
          <p className="hero__lede">Find a real heritage site nearby, step into its history in 3D, hear its stories and keep a memory of your visit.</p>
          <div className="hero__actions">
            <ButtonLink to="/map" size="lg" ticket iconRight={<ArrowRight size={20} />}>
              Start exploring
            </ButtonLink>
            <Button variant="secondary" icon={<LocateFixed size={18} />} onClick={geo.start} disabled={locating}>
              {locating ? "Finding you…" : locOn ? "Check nearby again" : "Find places near me"}
            </Button>
          </div>
        </div>
      </section>

      {continueSite && (
        <Link to={`/tour/${continueSite.slug}`} className="continue card card--tape">
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
          <h2 id="trail-h">What’s near you</h2>
          <Link to="/map" className="muted">
            Map <MapPinned size={14} aria-hidden="true" />
          </Link>
        </div>
        <p className="muted trail-intro">
          {locOn
            ? geo.nearest
              ? `Location on · ${geo.nearest.site.name} is closest to you. Explore its story and discover more heritage places.`
              : `${STATUS_LABEL[geo.status]} · Looking for nearby heritage places.`
            : geo.message ?? (locating ? "Checking your location…" : "Use location to find nearby heritage places, or explore the map.")}
        </p>
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
            <strong>{earned}</strong> of {SITES.length} trail stamps earned
            {demoStamps > 0 && <span className="muted"> · plus {demoStamps} demo</span>}
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

      <footer className="home-foot" aria-label="About">
        <img src="/assets/decor/shophouses.svg" alt="" className="home-foot__row" />
        <p className="hand">Singapore, always a good story.</p>
        <p className="muted">
          <Link to="/about">About &amp; sources</Link> · <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link>
        </p>
        <p className="muted home-foot__note">An independent community project. Not affiliated with the National Heritage Board, the National Library Board or the sites featured.</p>
      </footer>
    </div>
    </>
  );
}
