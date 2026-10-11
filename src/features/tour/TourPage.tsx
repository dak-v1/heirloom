import { useEffect, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, BookOpen, ChevronDown, ChevronLeft, ChevronRight, FileText, Globe2, Image as ImageIcon, Info, MessageSquareHeart, Pause, Play, RotateCcw, SkipBack, SkipForward, Stamp, Volume2 } from "lucide-react";
import { findSite, SITES } from "../../content/sites";
import { LANGUAGE_BY_CODE } from "../../content/languages";
import type { NarrationTrack } from "../../services/audio/narration";
import { preparedAudioFor, storySummaryParagraphs } from "../../services/audio/narration";
import { Button, IconButton } from "../../components/Button";
import { Tag } from "../../components/Media";
import { Sheet } from "../../components/Sheet";
import { useAudio, useNarration } from "../audio/audio-context";
import { TranscriptSheet } from "../audio/StoryPlayer";
import { MemoryComposer } from "../memories/MemoryComposer";
import { MemoryWall } from "../memories/MemoryWall";
import { Immersive } from "../site/PastView";
import { useSiteStory } from "../audio/useSiteStory";
import { HeritageScene } from "./HeritageScene";
import { tourConfig } from "./config";
import type { EarnResult } from "../../services/progress";
import { progress } from "../../state/progress";
import { StampReward } from "../completion/Completion";
import "../site/site.css";
import "./tour.css";

export function TourPage() {
  const { slug = "" } = useParams();
  const site = findSite(slug);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  if (!site) return <div className="page"><h1>That heritage tour isn't available.</h1><Button onClick={() => navigate("/map")}>Choose a place</Button></div>;
  return <TourExperience key={site.id} site={site} demo={params.get("demo") === "1"} />;
}

function TourExperience({ site, demo }: { site: (typeof SITES)[number]; demo: boolean }) {
  const navigate = useNavigate();
  const config = useMemo(() => tourConfig(site), [site]);
  const story = useSiteStory(site);
  const { player, manifest } = useAudio();
  const narration = useNarration();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [archiveView, setArchiveView] = useState(false);
  const [archiveIndex, setArchiveIndex] = useState(0);
  const [archivePlaying, setArchivePlaying] = useState(true);
  const [storyMode, setStoryMode] = useState<"summary" | "full">("full");
  const [transcript, setTranscript] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memoryBusy, setMemoryBusy] = useState(false);
  const [memoryWallOpen, setMemoryWallOpen] = useState(false);
  const [memoryWallKey, setMemoryWallKey] = useState(0);
  const [stampReward, setStampReward] = useState<EarnResult | null>(null);
  const swipeStart = useRef<{ x: number; y: number; at: number; interactive: boolean } | null>(null);
  const archiveEras = useMemo(
    () => site.eras.filter((era) => !era.isToday).slice().sort((a, b) => a.sortYear - b.sortYear),
    [site],
  );
  const archiveEra = archiveEras[archiveIndex] ?? archiveEras[0] ?? site.eras[0];
  const active = config.hotspots.find((h) => h.id === activeId);
  const bcp47 = LANGUAGE_BY_CODE.get(story.lang)?.bcp47 ?? "en-SG";

  const fullTrack = useMemo<NarrationTrack>(() => ({
    key: `${site.id}:${story.lang}:v${site.story.version}`,
    siteId: site.id,
    lang: story.lang,
    bcp47,
    paragraphs: [story.version.title + ".", ...story.version.paragraphs],
    audio: preparedAudioFor(manifest, site.id, story.lang, site.story.version),
  }), [site, story.lang, story.version, bcp47, manifest]);
  const summaryTrack = useMemo<NarrationTrack>(() => ({
    key: `${site.id}:${story.lang}:summary`,
    siteId: site.id,
    lang: story.lang,
    bcp47,
    paragraphs: storySummaryParagraphs(story.version),
    audio: preparedAudioFor(manifest, site.id, story.lang, site.story.version, "summary"),
  }), [site, story.lang, story.version, bcp47, manifest]);
  const selectedTrack = storyMode === "summary" ? summaryTrack : fullTrack;

  useEffect(() => { void player.load(selectedTrack); }, [player, selectedTrack]);
  useEffect(() => { document.title = `${site.name} in 3D · Singapore, Reimagined`; }, [site.name]);
  useEffect(() => {
    if (!archiveView || !archivePlaying || archiveEras.length < 2) return;
    const timer = window.setInterval(() => {
      setArchiveIndex((index) => (index + 1) % archiveEras.length);
    }, 6200);
    return () => window.clearInterval(timer);
  }, [archiveEras.length, archivePlaying, archiveView]);

  const playStory = () => {
    if (storyMode === "full") story.play();
    else player.play();
  };
  const finishVisit = () => {
    setStampReward(progress.earnStamp(site.id, site.stamp.id));
  };
  const playing = narration.status === "playing";
  const sentence = narration.currentSentence || selectedTrack.paragraphs[0] || story.version.title;
  const position = narration.segmentCount ? Math.min(100, ((narration.segment + 1) / narration.segmentCount) * 100) : 0;
  const voiceSource = narration.mode === "file"
    ? narration.voiceLabel?.toLowerCase().includes("elevenlabs") ? "ElevenLabs narration" : "Prepared narration"
    : narration.mode === "speech" ? "Device voice" : "Narrated story";

  const startTourSwipe = (event: ReactTouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    const target = event.target as HTMLElement;
    swipeStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      at: Date.now(),
      interactive: !!target.closest("button, a, input, select, textarea, [role='button']"),
    };
  };
  const endTourSwipe = (event: ReactTouchEvent<HTMLElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch || start.interactive) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.3 || Date.now() - start.at > 750) return;
    if (!archiveView && dx < 0) {
      setArchiveView(true);
      setArchiveIndex(0);
      setArchivePlaying(true);
      setActiveId(null);
      setAboutOpen(false);
    } else if (archiveView && dx > 0) {
      setArchiveView(false);
    } else if (archiveView && dx < 0 && archiveEras.length > 1) {
      setArchiveIndex((index) => (index + 1) % archiveEras.length);
    }
  };

  return (
    <>
      <Immersive label={`${site.name} immersive 3D tour`} onClose={() => navigate("/map")}>
        <main className={`heritage-tour heritage-tour--${site.accent}`} onTouchStartCapture={startTourSwipe} onTouchEndCapture={endTourSwipe}>
          <HeritageScene site={site} hotspots={config.hotspots} activeId={activeId} onHotspot={setActiveId} hidden={archiveView} />
          <div className="heritage-tour__shade" aria-hidden="true" />
          {archiveView && archiveEra && <ArchiveImageView
            key={archiveEra.id}
            era={archiveEra}
            index={archiveIndex % Math.max(archiveEras.length, 1)}
            count={Math.max(archiveEras.length, 1)}
            playing={archivePlaying}
            onPrevious={() => setArchiveIndex((index) => (index - 1 + archiveEras.length) % archiveEras.length)}
            onNext={() => setArchiveIndex((index) => (index + 1) % archiveEras.length)}
            onTogglePlaying={() => setArchivePlaying((playing) => !playing)}
          />}

          <header className="heritage-tour__top">
            <IconButton label="Back to the map" variant="dark" onClick={() => navigate("/map")}><ArrowLeft size={21} /></IconButton>
            <div className="heritage-tour__brand"><span className="heritage-tour__eyebrow">Singapore, Reimagined</span><strong>{site.name}</strong></div>
            <div className="heritage-tour__top-actions">
              {demo && <Tag tone="demo">Demo mode</Tag>}
              <label className="heritage-tour__select-label">
                <span className="visually-hidden">Choose a heritage tour</span>
                <select aria-label="Choose a heritage tour" value={site.slug} onChange={(e) => navigate(`/tour/${e.target.value}${demo ? "?demo=1" : ""}`)}>
                  {SITES.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
                </select>
              </label>
              <IconButton
                label={archiveView ? "Return to the interactive 3D tour" : `View historical image from ${archiveEra?.image.dateLabel ?? "the archive"}`}
                variant="dark"
                className="heritage-tour__archive-icon"
                aria-pressed={archiveView}
                onClick={() => {
                  if (!archiveView) {
                    setArchiveIndex(0);
                    setArchivePlaying(true);
                  }
                  setArchiveView((view) => !view);
                }}
              ><ImageIcon size={18} /></IconButton>
            </div>
          </header>

          <div className="heritage-tour__era">
            <span>{config.year}</span><span>{config.period}</span>
            <button type="button" className="heritage-tour__about-toggle" aria-expanded={aboutOpen} onClick={() => setAboutOpen((open) => !open)}>
              <Info size={15} /> About this reconstruction
            </button>
          </div>
          {aboutOpen && <aside className="heritage-tour__about" role="region" aria-label="About this 3D reconstruction">
            <p><strong>Historical interpretation</strong><br />{config.modelNote}</p>
            <p>{config.description}</p>
          </aside>}

          {active && !archiveView && <aside className="heritage-tour__hotspot-card" aria-live="polite">
            <button type="button" className="heritage-tour__card-close" aria-label="Close hotspot details" onClick={() => setActiveId(null)}>×</button>
            <span>Point of interest</span><h2>{active.title}</h2><p>{active.body}</p>
          </aside>}

          <section className="heritage-tour__story" aria-label="Narrated tour">
            <div className="heritage-tour__caption" aria-live="polite" aria-atomic="true" key={`${storyMode}-${narration.segment}-${sentence}`}>
              <span className="heritage-tour__caption-kicker">{storyMode === "summary" ? "Quick summary" : "The story of this place"}<span className="heritage-tour__voice-source"> · {voiceSource}</span></span>
              <p>{sentence}</p>
              <span className="heritage-tour__caption-index">{narration.segmentCount ? `${String(narration.segment + 1).padStart(2, "0")} / ${String(narration.segmentCount).padStart(2, "0")}` : "Caption"}</span>
            </div>

            <div className="heritage-tour__dock">
              <div className="heritage-tour__dock-head">
                <div className="heritage-tour__mode-switch" role="group" aria-label="Narration length">
                  <button type="button" aria-pressed={storyMode === "summary"} onClick={() => setStoryMode("summary")}>Summary</button>
                  <button type="button" aria-pressed={storyMode === "full"} onClick={() => setStoryMode("full")}>Full story</button>
                </div>
                <label className="heritage-tour__language"><Globe2 size={16} /><span className="visually-hidden">Narration language</span>
                  <select aria-label="Narration language" value={story.lang} onChange={(e) => story.setLang(e.target.value as typeof story.lang)}>
                    {story.available.map((code) => <option key={code} value={code}>{LANGUAGE_BY_CODE.get(code)?.label ?? code}</option>)}
                  </select><ChevronDown size={13} aria-hidden="true" />
                </label>
                <div className="heritage-tour__dock-actions">
                  <Button variant="secondary" size="sm" icon={<FileText size={16} />} onClick={() => setTranscript(true)}>Transcript</Button>
                  <button type="button" className="heritage-tour__memory-toggle" onClick={() => { setMemoryWallOpen(false); setMemoryOpen(true); }}>
                    <MessageSquareHeart size={15} /> Leave a memory
                  </button>
                  <Button className="heritage-tour__finish" size="sm" ticket icon={<Stamp size={15} />} onClick={finishVisit}>I'm done</Button>
                </div>
              </div>

              <div className="heritage-tour__progress" aria-label="Narration progress">
                <span>{formatTime(narration.elapsed)}</span>
                <div className="heritage-tour__progress-track" role="progressbar" aria-label="Story progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(narration.progress * 100)}>
                  <span style={{ width: `${narration.progress * 100}%` }} />
                </div>
                <span>{formatTime(narration.duration)}</span>
              </div>

              <div className="heritage-tour__controls">
                <IconButton label="Back 15 seconds" variant="dark" onClick={() => player.skip(-1)}><SkipBack size={21} /></IconButton>
                <IconButton label="Replay from the beginning" variant="dark" onClick={() => player.replay()}><RotateCcw size={18} /></IconButton>
                <button type="button" className="heritage-tour__play" aria-label={playing ? "Pause narration" : "Play narration"} onClick={() => playing ? player.pause() : playStory()}>
                  {playing ? <Pause size={25} fill="currentColor" /> : <Play size={25} fill="currentColor" />}
                </button>
                <IconButton label="Forward 15 seconds" variant="dark" onClick={() => player.skip(1)}><SkipForward size={21} /></IconButton>
                <span className="heritage-tour__voice"><Volume2 size={17} />{narration.voiceLabel ?? (narration.status === "loading" ? "Preparing narration…" : "Narration ready")}</span>
                <button type="button" className="heritage-tour__story-text" onClick={() => setAboutOpen((open) => !open)}><BookOpen size={16} /> Description</button>
              </div>

              {narration.message && <p className="heritage-tour__message" role="status">{narration.message}</p>}
              <div className="heritage-tour__chapter-progress" aria-hidden="true"><span style={{ width: `${position}%` }} /></div>
            </div>
          </section>
        </main>
      </Immersive>
      <TranscriptSheet open={transcript} onClose={() => setTranscript(false)} site={site} story={story} />
      <Sheet
        open={memoryOpen}
        onClose={() => { if (!memoryBusy) { setMemoryOpen(false); setMemoryWallOpen(false); } }}
        title={memoryWallOpen ? `Memories at ${site.name}` : `Leave a memory at ${site.name}`}
        hideTitle={memoryWallOpen}
        size="full"
        locked={memoryBusy}
      >
        {memoryWallOpen ? (
          <MemoryWall site={site} refreshKey={memoryWallKey} onLeave={() => setMemoryWallOpen(false)} />
        ) : (
          <MemoryComposer
            site={site}
            onBusyChange={setMemoryBusy}
            onSubmitted={() => setMemoryWallKey((key) => key + 1)}
            onBack={() => { setMemoryOpen(false); setMemoryWallOpen(false); }}
            onViewSaved={() => setMemoryWallOpen(true)}
          />
        )}
      </Sheet>
      {stampReward && <StampReward site={site} result={stampReward} onPlaceLater={() => setStampReward(null)} />}
    </>
  );
}

function ArchiveImageView({
  era,
  index,
  count,
  playing,
  onPrevious,
  onNext,
  onTogglePlaying,
}: {
  era: (typeof SITES)[number]["eras"][number];
  index: number;
  count: number;
  playing: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlaying: () => void;
}) {
  return (
    <figure className="heritage-tour__archive-view" aria-label={`Historical image from ${era.image.dateLabel}`}>
      <div className="heritage-tour__archive-blur" style={{ backgroundImage: `url("${era.image.src}")` }} aria-hidden="true" />
      <div className="heritage-tour__archive-shade" aria-hidden="true" />
      <img className="heritage-tour__archive-image" src={era.image.src} alt={era.image.alt} />
      <figcaption className="heritage-tour__archive-caption">
        <span>Archive image {index + 1} of {count} · {era.image.dateLabel}</span>
        <p>{era.caption}</p>
        <small>{era.image.credit.creator} · {era.image.credit.collection}</small>
      </figcaption>
      {count > 1 && <div className="heritage-tour__archive-controls" aria-label="Archive image carousel">
        <button type="button" aria-label="Previous archive image" onClick={onPrevious}><ChevronLeft size={18} /></button>
        <span aria-hidden="true">{index + 1} / {count}</span>
        <button type="button" aria-label={playing ? "Pause archive carousel" : "Play archive carousel"} onClick={onTogglePlaying}>
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button type="button" aria-label="Next archive image" onClick={onNext}><ChevronRight size={18} /></button>
      </div>}
    </figure>
  );
}

function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}
