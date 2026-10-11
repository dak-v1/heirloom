import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, BookOpen, Box, Camera, Check, History, Info, List, MapPin, MessageSquareHeart, Puzzle, Stamp } from "lucide-react";
import { findSite } from "../../content/sites";
import type { Site } from "../../content/types";
import { Button, ButtonLink, IconButton } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { Tag, hideBrokenImage } from "../../components/Media";
import { useToast } from "../../components/Toast";
import { formatDistance } from "../../services/arrival";
import { track } from "../../services/analytics";
import { playChime } from "../../services/audio/sfx";
import type { EarnResult } from "../../services/progress";
import { progress, useProgress } from "../../state/progress";
import { getPreferences, useReducedMotion } from "../../state/preferences";
import { useSiteStory } from "../audio/useSiteStory";
import { StoryPlayer, TranscriptSheet } from "../audio/StoryPlayer";
import { GuessTheYear, initialGameState, type GameState } from "../game/GuessTheYear";
import { NextSiteCard, StampReward, formatVisitDate } from "../completion/Completion";
import { useGeo } from "../location/geo-context";
import { MemoryComposer } from "../memories/MemoryComposer";
import { MemoryWall } from "../memories/MemoryWall";
import { DetailsListSheet, HotspotSheet, SourcesSheet } from "./InfoSheets";
import { hotspotKey } from "./ImageStage";
import { PastView } from "./PastView";
import { LiveWindow } from "./LiveWindow";
import { useJourneyScroll } from "./useJourneyScroll";
import "./site.css";

export function SitePage() {
  const { slug } = useParams();
  const site = findSite(slug);
  if (!site) return <SiteNotFound slug={slug} />;
  return <SiteExperience key={site.id} site={site} />;
}

function SiteNotFound({ slug }: { slug?: string }) {
  useEffect(() => {
    document.title = "Place not found · Heirloom";
  }, []);
  return (
    <div className="page">
      <div className="empty">
        <img src="/assets/decor/postmark.svg" alt="" width={180} />
        <h1>We couldn't find that place</h1>
        <p>
          There's no curated site called <code>{slug}</code>. It may have moved, or the link may be mistyped.
        </p>
        <ButtonLink to="/map" ticket size="lg">
          Back to the map
        </ButtonLink>
      </div>
    </div>
  );
}

type ArrivalKind = "location" | "simulated" | "manual" | undefined;

function SiteExperience({ site }: { site: Site }) {
  const journey = useRef<HTMLOListElement>(null);
  useJourneyScroll(journey, useReducedMotion());
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const p = useProgress();
  const geo = useGeo();
  const story = useSiteStory(site);
  const arrival = (location.state as { arrival?: ArrivalKind } | null)?.arrival;

  const visit = p.visits[site.id];
  const earned = p.earnedStamps.find((s) => s.siteId === site.id);
  const placed = earned ? p.placements.some((pl) => pl.earnedStampId === earned.id) : false;
  const openedKeys = visit?.hotspotsOpened ?? [];
  const allKeys = useMemo(() => site.eras.flatMap((e) => e.hotspots.map((h) => hotspotKey(e.id, h.id))), [site]);
  const historical = site.eras.filter((e) => !e.isToday);

  const [eraId, setEraId] = useState(visit?.lastEraId ?? historical[0]?.id ?? site.eras[0].id);
  const [hotspot, setHotspot] = useState<{ eraId: string; id: string } | null>(null);
  const [sheet, setSheet] = useState<null | "transcript" | "sources" | "details" | "modes" | "memory">(null);
  const [game, setGame] = useState<GameState>(() => initialGameState(site.game));
  const [skippedGame, setSkippedGame] = useState(false);
  const [skippedMemory, setSkippedMemory] = useState(false);
  const [memorySent, setMemorySent] = useState(false);
  const [memoryBusy, setMemoryBusy] = useState(false);
  const [wallKey, setWallKey] = useState(0);
  const [readTranscript, setReadTranscript] = useState(false);
  const [reward, setReward] = useState<EarnResult | null>(null);
  const [heroBroken, setHeroBroken] = useState(false);

  const view = params.get("view");
  const playing = params.get("play") === "1";

  useEffect(() => {
    document.title = `${site.name} · Heirloom`;
    progress.markSiteStarted(site.id);
    track("site_opened", { site: site.id, arrival: arrival ?? "direct" });
  }, [site, arrival]);

  /* ---------- overlay routing: overlays live in the URL so Back closes them ---------- */
  const openParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params);
      next.set(key, value);
      setParams(next, { state: { ...(location.state as object), overlay: true } });
    },
    [params, setParams, location.state],
  );
  const closeParam = useCallback(
    (...keys: string[]) => {
      if ((location.state as { overlay?: boolean } | null)?.overlay) navigate(-1);
      else {
        const next = new URLSearchParams(params);
        keys.forEach((k) => next.delete(k));
        setParams(next, { replace: true });
      }
    },
    [location.state, navigate, params, setParams],
  );

  const openPast = () => {
    setSheet(null);
    if (!visit?.lastEraId) progress.setLastEra(site.id, eraId);
    openParam("view", "past");
  };
  const openLive = () => {
    setSheet(null);
    if (eraId === site.eras.find((e) => e.isToday)?.id) setEraId(historical[0].id);
    openParam("view", "live");
  };
  const changeEra = (id: string) => {
    setEraId(id);
    progress.setLastEra(site.id, id);
  };

  const openHotspot = (eId: string, hId: string) => {
    setHotspot({ eraId: eId, id: hId });
    progress.recordHotspotOpened(site.id, hotspotKey(eId, hId), allKeys);
    track("hotspot_opened", { site: site.id, hotspot: hId });
  };

  const finish = () => {
    const r = progress.earnStamp(site.id, site.stamp.id);
    track("stamp_earned", { site: site.id, isNew: r.isNew });
    if (getPreferences().soundEffects) playChime();
    setReward(r);
  };

  const placeLater = () => {
    setReward(null);
    if (placed) return;
    toast({ title: "Saved to your stamp tray", body: "Place it in your passport whenever you like.", image: site.stamp.art, tone: "success" });
  };

  const gameDone = p.gameAttempts.some((a) => a.siteId === site.id);
  const explored = openedKeys.filter((k) => allKeys.includes(k)).length;
  const listened = !!visit?.narrationCompleted || readTranscript;
  const sawPast = !!visit?.lastEraId;
  const distance = geo.distanceTo(site);
  const activeHotspotEra = hotspot ? site.eras.find((e) => e.id === hotspot.eraId) : null;

  const today = site.eras.find((e) => e.isToday)!;

  return (
    <article className={`site site--${site.accent}`}>
      <div className="site-hero">
        <img
          className="site-hero__img"
          src={today.image.src}
          srcSet={today.image.srcSmall ? `${today.image.srcSmall} 640w, ${today.image.src} 1280w` : undefined}
          sizes="(max-width: 700px) 100vw, 700px"
          alt={today.image.alt}
          referrerPolicy="no-referrer"
          onError={(e) => {
            hideBrokenImage(e);
            setHeroBroken(true);
          }}
        />
        <div className="site-hero__bar">
          <IconButton label="Back to the map" variant="paper" onClick={() => navigate("/map")}>
            <ArrowLeft size={22} />
          </IconButton>
          <IconButton label="Sources and photo credits" variant="paper" onClick={() => setSheet("sources")}>
            <Info size={22} />
          </IconButton>
        </div>
        <p className="site-hero__credit">
          {heroBroken ? "Photo unavailable (you may be offline)" : `${today.image.dateLabel} · ${today.image.credit.creator}, ${today.image.credit.license}`}
        </p>
      </div>

      <div className="site-head">
        <div className="site-head__ticket">
          <p className="label">{site.area}</p>
          <h1>{site.name}</h1>
          <p className="site-head__local" lang={site.localName.lang} title={site.localName.gloss}>
            {site.localName.text}
            <span className="visually-hidden"> ({site.localName.gloss})</span>
          </p>
          <p className="site-head__tagline">{site.tagline}</p>
          <div className="site-head__meta">
            {arrival === "simulated" && <Tag tone="demo">Demo arrival (simulated)</Tag>}
            {arrival === "location" && <Tag tone="olive">You're here</Tag>}
            {arrival === "manual" && <Tag tone="olive">You said you're here</Tag>}
            {distance !== null && arrival !== "simulated" && (
              <span className="muted">
                <MapPin size={14} aria-hidden="true" /> {formatDistance(distance)}
              </span>
            )}
          </div>
        </div>
        <img className="site-head__stamp" src={site.stamp.art} alt="" aria-hidden="true" />
      </div>

      <div className="page site-page">
        <p className="site-summary">{site.summary}</p>
        <section className="site-tour-promo card" aria-label={`Explore ${site.name} in 3D`}>
          <div><span className="label">A place-specific reconstruction</span><p>Step into a sourced historical interpretation of {site.name}, with interactive details and a spoken story.</p></div>
          <ButtonLink to={`/tour/${site.slug}`} ticket icon={<Box size={18} />} iconRight={<ArrowRight size={18} />}>Explore in 3D</ButtonLink>
        </section>

        {earned && (
          <div className="done-banner card">
            <img src={site.stamp.art} alt="" width={56} />
            <div>
              <strong>Visit complete</strong>
              <p className="muted">
                Stamp earned {formatVisitDate(earned.visitDate)} · {placed ? "placed in your passport" : "waiting in your stamp tray"}
              </p>
            </div>
            <ButtonLink to="/passport" variant="secondary" size="sm">
              Passport
            </ButtonLink>
          </div>
        )}

        <ol className="journey" aria-label="Your visit" ref={journey}>
          <Step n={1} done={sawPast} title="See the past" icon={<History size={20} />}>
            <p>Hold the old photographs up against today's street. Pick an era and tap the numbered details.</p>
            <div className="step-actions">
              <Button ticket onClick={() => setSheet("modes")} icon={<History size={18} />}>
                See the past
              </Button>
            </div>
          </Step>

          <Step n={2} done={listened} title="Listen or read" icon={<BookOpen size={20} />}>
            <StoryPlayer
              site={site}
              story={story}
              onOpenTranscript={() => {
                setReadTranscript(true);
                setSheet("transcript");
              }}
            />
          </Step>

          <Step n={3} done={explored === allKeys.length} title="Explore the details" icon={<List size={20} />}>
            <p>
              {explored} of {allKeys.length} details discovered across {site.eras.length} views.
            </p>
            <div className="progress-bar" aria-hidden="true" style={{ margin: "8px 0 12px" }}>
              <span style={{ width: `${(explored / allKeys.length) * 100}%` }} />
            </div>
            <div className="step-actions">
              <Button variant="secondary" onClick={() => setSheet("details")} icon={<List size={18} />}>
                List all details
              </Button>
            </div>
          </Step>

          <Step n={4} done={gameDone || skippedGame} optional title="Play: Guess the Year" icon={<Puzzle size={20} />}>
            <p>Three photographs, one question each: when was it taken? About a minute or two.</p>
            <div className="step-actions">
              <Button variant="mustard" onClick={() => openParam("play", "1")} icon={<Puzzle size={18} />}>
                {game.phase === "intro" || game.phase === "results" ? (gameDone ? "Play again" : "Play") : "Resume game"}
              </Button>
              {!gameDone && !skippedGame && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSkippedGame(true);
                    track("game_skipped", { site: site.id });
                  }}
                >
                  Skip for now
                </Button>
              )}
            </div>
          </Step>

          <Step n={5} done={skippedMemory || memorySent || !!visit?.memorySubmitted} optional title="Leave a memory" icon={<MessageSquareHeart size={20} />}>
            <p>Pin a note or drawing to this place for future visitors.</p>
            <div className="step-actions">
              <Button variant="secondary" onClick={() => setSheet("memory")} icon={<MessageSquareHeart size={18} />}>
                Leave a memory
              </Button>
              {!skippedMemory && !memorySent && (
                <Button variant="ghost" onClick={() => setSkippedMemory(true)}>
                  Continue without sharing
                </Button>
              )}
            </div>
          </Step>

          <Step n={6} done={!!earned} title="Finish your visit" icon={<Stamp size={20} />}>
            <p>Done exploring? Finish to collect this place's stamp. No quiz score, sign-in or GPS check needed.</p>
            <div className="step-actions">
              <Button ticket block onClick={finish} icon={<Check size={20} />}>
                {earned ? "View my stamp" : "I've finished exploring"}
              </Button>
            </div>
          </Step>
        </ol>

        <p className="notice visit-note">
          <Info size={18} aria-hidden="true" />
          <span>{site.visitNote}</span>
        </p>

        <MemoryWall site={site} refreshKey={wallKey} onLeave={() => setSheet("memory")} />

        <NextSiteCard site={site} />
      </div>

      {/* ---------- sheets & overlays ---------- */}
      <Sheet open={sheet === "modes"} onClose={() => setSheet(null)} title="How would you like to see it?">
        <div className="modes">
          <button type="button" className="mode-card" onClick={openPast}>
            <History size={28} aria-hidden="true" />
            <span>
              <strong>Past View</strong>
              <Tag tone="olive">Recommended</Tag>
              <span className="muted">Old photographs over today's scene, with an era timeline and tappable details. No camera needed.</span>
            </span>
          </button>
          <button type="button" className="mode-card" onClick={openLive}>
            <Camera size={28} aria-hidden="true" />
            <span>
              <strong>Live Time Window</strong>
              <Tag tone="demo">Preview</Tag>
              <span className="muted">Blend an old photograph with your camera view. A camera overlay preview, not tracked AR. Asks for camera access.</span>
            </span>
          </button>
        </div>
      </Sheet>

      <Sheet
        open={sheet === "memory"}
        onClose={() => setSheet(null)}
        title="Leave a memory"
        size="tall"
        locked={memoryBusy}
        footer={
          !memorySent && (
            <Button
              block
              variant="secondary"
              disabled={memoryBusy}
              onClick={() => {
                setSkippedMemory(true);
                setSheet(null);
              }}
            >
              Continue without sharing
            </Button>
          )
        }
      >
        <MemoryComposer
          site={site}
          onBusyChange={setMemoryBusy}
          onSubmitted={() => {
            setMemorySent(true);
            setWallKey((k) => k + 1);
          }}
          onBack={() => {
            setSheet(null);
          }}
          onViewSaved={() => {
            setSheet(null);
            window.setTimeout(() => document.getElementById("wall-h")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
          }}
        />
      </Sheet>

      <TranscriptSheet open={sheet === "transcript"} onClose={() => setSheet(null)} site={site} story={story} />
      <SourcesSheet open={sheet === "sources"} onClose={() => setSheet(null)} site={site} era={site.eras.find((e) => e.id === eraId) ?? today} />
      <DetailsListSheet open={sheet === "details"} onClose={() => setSheet(null)} site={site} openedKeys={openedKeys} onOpen={(e, h) => openHotspot(e, h)} />

      {view === "past" && (
        <PastView
          site={site}
          eraId={eraId}
          onEra={changeEra}
          openedKeys={openedKeys}
          onOpenHotspot={(h) => openHotspot(eraId, h)}
          onClose={() => closeParam("view", "play")}
          onSources={() => setSheet("sources")}
          onDetails={() => setSheet("details")}
          onPlay={() => openParam("play", "1")}
          onSwitchToLive={() => {
            const next = new URLSearchParams(params);
            next.set("view", "live");
            if (eraId === today.id) setEraId(historical[0].id);
            setParams(next, { replace: true, state: location.state });
          }}
          story={story}
          onTranscript={() => {
            setReadTranscript(true);
            setSheet("transcript");
          }}
        />
      )}
      {view === "live" && (
        <LiveWindow
          site={site}
          eraId={eraId}
          onEra={changeEra}
          onClose={() => closeParam("view")}
          onFallback={() => {
            const next = new URLSearchParams(params);
            next.set("view", "past");
            setParams(next, { replace: true, state: location.state });
          }}
        />
      )}

      {hotspot && activeHotspotEra && (
        <HotspotSheet era={activeHotspotEra} hotspotId={hotspot.id} onClose={() => setHotspot(null)} onNavigate={(id) => openHotspot(activeHotspotEra.id, id)} />
      )}

      <GuessTheYear
        open={playing}
        game={site.game}
        siteName={site.name}
        state={game}
        setState={setGame}
        onClose={() => closeParam("play")}
        onSkip={() => {
          setSkippedGame(true);
          track("game_skipped", { site: site.id });
          closeParam("play");
        }}
        onComplete={(r) => {
          progress.recordGameResult(site.id, site.game.id, r);
          track("game_completed", { site: site.id, score: r.score });
        }}
      />

      {reward && <StampReward site={site} result={reward} onPlaceLater={placeLater} />}
    </article>
  );
}

function Step({ n, title, icon, done, optional, children }: { n: number; title: string; icon: React.ReactNode; done?: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <li className={`step${done ? " is-done" : ""}`}>
      <div className="step__marker" aria-hidden="true">
        {done ? <Check size={18} strokeWidth={3} /> : n}
      </div>
      <section className="step__card" aria-labelledby={`step-${n}`}>
        <header className="step__head">
          <span className="step__icon" aria-hidden="true">
            {icon}
          </span>
          <h2 id={`step-${n}`}>{title}</h2>
          {optional && <Tag>Optional</Tag>}
          {done && <span className="visually-hidden">(done)</span>}
        </header>
        <div className="step__body">{children}</div>
      </section>
    </li>
  );
}
