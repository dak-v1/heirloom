import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, ChevronRight, Compass, Image as ImageIcon, MapPin, Mic2, Pause, Play, RotateCcw, Volume2, X } from "lucide-react";
import { SITES } from "../../content/sites";
import { Button, IconButton } from "../../components/Button";
import { useGeo } from "../location/geo-context";
import { useAudio, useNarration } from "../audio/audio-context";
import { useSiteStory } from "../audio/useSiteStory";
import { Immersive } from "../site/PastView";
import { HeritageScene } from "../tour/HeritageScene";
import { tourConfig } from "../tour/config";
import "../site/site.css";
import "../tour/tour.css";
import "./now.css";

type FlowStep = "capture" | "place" | "era" | "explore";
const STEP_INFO: { id: Exclude<FlowStep, "explore">; title: string }[] = [
  { id: "capture", title: "Capture present" },
  { id: "place", title: "Confirm place" },
  { id: "era", title: "Choose an era" },
];
const FRAME_GUIDANCE = ["Sweep left", "Face ahead", "Sweep right"];
const DEMO_SITE_ID = "thian-hock-keng";

function makePanorama(frames: string[]) {
  const tileWidth = 720;
  const tileHeight = 480;
  const canvas = document.createElement("canvas");
  canvas.width = tileWidth * frames.length;
  canvas.height = tileHeight;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("Panorama preview could not be created."));

  return Promise.all(frames.map((src) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("A camera frame could not be read."));
    image.src = src;
  }))).then((images) => {
    images.forEach((image, index) => {
      const targetAspect = tileWidth / tileHeight;
      const sourceAspect = image.width / image.height;
      let sx = 0;
      let sy = 0;
      let sw = image.width;
      let sh = image.height;
      if (sourceAspect > targetAspect) {
        sw = image.height * targetAspect;
        sx = (image.width - sw) / 2;
      } else {
        sh = image.width / targetAspect;
        sy = (image.height - sh) / 2;
      }
      context.drawImage(image, sx, sy, sw, sh, index * tileWidth, 0, tileWidth, tileHeight);
    });
    return canvas.toDataURL("image/jpeg", 0.86);
  });
}

export function NowPage() {
  const geo = useGeo();
  const [siteId, setSiteId] = useState(() => geo.nearest?.site.id ?? SITES[0].id);
  const site = SITES.find((item) => item.id === siteId) ?? SITES[0];
  const pastEras = useMemo(
    () => site.eras.filter((era) => !era.isToday).slice().sort((a, b) => a.sortYear - b.sortYear),
    [site],
  );
  const presentEra = site.eras.find((era) => era.isToday)!;
  const [step, setStep] = useState<FlowStep>("capture");
  const [eraId, setEraId] = useState<string | null>(null);
  const selectedEra = pastEras.find((era) => era.id === eraId) ?? pastEras[0];
  const config = useMemo(() => tourConfig(site), [site]);
  const { player } = useAudio();
  const narration = useNarration();
  const story = useSiteStory(site);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [panorama, setPanorama] = useState<string | null>(null);
  const [panoramaBusy, setPanoramaBusy] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [frameError, setFrameError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [timeWindowOpen, setTimeWindowOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRequestedRef = useRef(false);
  const manualSiteRef = useRef(false);
  const abandonPendingCameraRef = useRef(false);

  useEffect(() => {
    document.title = "Now · Travel through time · Singapore, Reimagined";
  }, []);

  useEffect(() => {
    setEraId(pastEras[0]?.id ?? null);
    setActiveHotspotId(null);
  }, [site.id, pastEras]);

  useEffect(() => {
    if (!manualSiteRef.current && geo.nearest) setSiteId(geo.nearest.site.id);
  }, [geo.nearest]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
    setCameraReady(false);
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, [stream, timeWindowOpen]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access needs a secure connection (HTTPS or localhost) and a supported browser.");
      return;
    }
    abandonPendingCameraRef.current = false;
    setCameraStarting(true);
    setCameraError(null);
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (abandonPendingCameraRef.current) {
        nextStream.getTracks().forEach((track) => track.stop());
        return;
      }
      setStream(nextStream);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setCameraError(
        name === "NotAllowedError"
          ? "Camera permission was declined. Allow camera access in your browser settings, or continue with the present-day site photo."
          : name === "NotFoundError"
            ? "No camera was found. You can still explore with the present-day site photo."
            : "The camera could not start. Check your browser permission, or continue with the present-day site photo.",
      );
    } finally {
      setCameraStarting(false);
    }
  }, []);

  // Now remains a direct camera action: request permission as soon as the
  // visitor enters, while still offering a photo-based path if access fails.
  useEffect(() => {
    if (cameraRequestedRef.current) return;
    cameraRequestedRef.current = true;
    void startCamera();
  }, [startCamera]);

  const stopCamera = useCallback(() => {
    abandonPendingCameraRef.current = true;
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setCameraReady(false);
  }, [stream]);

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    setFrameError(null);
    const frameCanvas = document.createElement("canvas");
    const maxWidth = 960;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    frameCanvas.width = Math.round(video.videoWidth * scale);
    frameCanvas.height = Math.round(video.videoHeight * scale);
    const context = frameCanvas.getContext("2d");
    if (!context) {
      setFrameError("This browser could not capture a camera frame.");
      return;
    }
    context.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
    const nextFrames = [...frames, frameCanvas.toDataURL("image/jpeg", 0.84)];
    setFrames(nextFrames);
    if (nextFrames.length < FRAME_GUIDANCE.length) return;

    setPanoramaBusy(true);
    try {
      setPanorama(await makePanorama(nextFrames));
      stopCamera();
      setStep("place");
    } catch {
      setFrameError("The panorama preview could not be assembled. Retake the three views or continue with the site photo.");
    } finally {
      setPanoramaBusy(false);
    }
  };

  const resetCapture = () => {
    setDemoMode(false);
    setFrames([]);
    setPanorama(null);
    setFrameError(null);
    setStep("capture");
    if (!stream) void startCamera();
  };

  const useSitePhoto = () => {
    setDemoMode(false);
    setPanorama(null);
    stopCamera();
    setStep("place");
  };

  const startDemo = () => {
    const demoSite = SITES.find((item) => item.id === DEMO_SITE_ID) ?? SITES[0];
    manualSiteRef.current = true;
    setDemoMode(true);
    setSiteId(demoSite.id);
    setFrames([]);
    setPanorama(null);
    setFrameError(null);
    setStep("capture");
    setTimeWindowOpen(true);
    if (!stream) void startCamera();
  };

  const continueFromTimeWindow = () => {
    setTimeWindowOpen(false);
    stopCamera();
    setStep("place");
  };

  const confirmSite = () => {
    setEraId(pastEras[0]?.id ?? null);
    setStep("era");
  };

  const enterReconstruction = () => {
    setActiveHotspotId(null);
    setAboutOpen(false);
    stopCamera();
    setStep("explore");
  };

  const backToEra = () => {
    player.pause();
    setAboutOpen(false);
    setStep("era");
  };

  const activeHotspot = config.hotspots.find((hotspot) => hotspot.id === activeHotspotId);
  const currentSentence = narration.currentSentence || story.version.paragraphs[0] || site.summary;
  const voiceLabel = narration.voiceLabel ?? (narration.status === "loading" ? "Preparing the guide…" : "Narrated story");
  const canPlay = !["loading", "idle", "unsupported"].includes(narration.status);
  const placeStatus = demoMode
    ? `Demo suggestion · ${site.name}`
    : geo.nearest
      ? geo.nearest.site.id === site.id
        ? `GPS suggestion · ${site.name} · about ${Math.round(geo.nearest.distance)} m away`
        : `GPS suggests ${geo.nearest.site.name} · selected ${site.name}`
      : manualSiteRef.current
        ? `Selected by you · ${site.name}`
        : geo.status === "requesting"
          ? "Finding nearby places…"
          : "No nearby GPS match yet · choose a place or try the demo";

  if (timeWindowOpen) {
    return <main className={`now-time-window now-time-window--${site.accent}`} aria-label="Past and present camera view">
      <section className="now-time-window__past" aria-label={`Archival view of ${site.name}`}>
        <img src={selectedEra?.image.src ?? presentEra.image.src} alt={`${site.name}, archival view from ${selectedEra?.image.dateLabel ?? "the past"}`} />
      </section>
      <section className="now-time-window__present" aria-label={`Present-day view of ${site.name}`}>
        {stream
          ? <video ref={videoRef} onLoadedMetadata={() => setCameraReady(true)} autoPlay muted playsInline aria-label="Live rear camera view" />
          : <img src={presentEra.image.src} alt={`${site.name} today: ${presentEra.image.alt}`} />}
      </section>
      <div className="now-time-window__seam" aria-hidden="true" />
      <div className="now-time-window__controls">
        <IconButton label="Back to camera" variant="dark" onClick={() => setTimeWindowOpen(false)}><ArrowLeft size={21} /></IconButton>
        <IconButton label="Continue to the archive and 3D tour" variant="dark" onClick={continueFromTimeWindow}><ChevronRight size={22} /></IconButton>
      </div>
    </main>;
  }

  return (
    <div className={`page now-page now-page--${site.accent}`}>
      <header className="now-flow__head">
        <div>
          <p className="label"><Compass size={15} aria-hidden="true" /> Camera Now · Travel through time</p>
          <h1>Meet this place in another time.</h1>
          <p className="muted">Capture where you are, choose an era with archival evidence, then step into a site-specific 3D interpretation.</p>
        </div>
      </header>

      {step !== "explore" && <ol className="now-flow__steps" aria-label="Travel through time steps">
        {STEP_INFO.map((item, index) => {
          const active = item.id === step;
          const complete = STEP_INFO.findIndex((candidate) => candidate.id === step) > index;
          return <li key={item.id} className={`${active ? "is-active" : ""} ${complete ? "is-complete" : ""}`}>
            <span>{complete ? <Check size={14} aria-hidden="true" /> : index + 1}</span>{item.title}
          </li>;
        })}
      </ol>}

      {step === "capture" && <section className="now-flow" aria-labelledby="now-capture-title">
        <div className="now-flow__section-head">
          <div><p className="label">Step 1 · Capture the present</p><h2 id="now-capture-title">Take in the view around you</h2></div>
          <p className="muted">Capture three views to make a panorama on this device. GPS can suggest a place, but the camera image is not matched automatically.</p>
        </div>
        <div className="now-capture">
          <div className="now-capture__stage">
            {stream ? <video ref={videoRef} onLoadedMetadata={() => setCameraReady(true)} autoPlay muted playsInline aria-label="Live rear camera view" /> : <img src={presentEra.image.src} alt={`${site.name} today: ${presentEra.image.alt}`} />}
            <div className="now-capture__shade" />
            <span className={`now-capture__live${stream ? " is-live" : ""}`}><Camera size={14} />{stream ? "Camera on · stays on this device" : "Present-day reference"}</span>
            {stream && <div className="now-capture__guide" aria-live="polite">
              <span>{frames.length + 1} / {FRAME_GUIDANCE.length}</span><strong>{FRAME_GUIDANCE[Math.min(frames.length, FRAME_GUIDANCE.length - 1)]}</strong>
              <div>{FRAME_GUIDANCE.map((label, index) => <i key={label} className={frames.length > index ? "is-done" : frames.length === index ? "is-current" : ""} />)}</div>
            </div>}
            {!stream && <div className="now-capture__fallback-copy"><strong>Continue with the documented site photo</strong><span>You can still choose an era and explore this location in 3D.</span></div>}
          </div>
          <div className="now-capture__actions">
            {stream ? <Button variant="primary" icon={<Camera size={17} />} onClick={() => void captureFrame()} disabled={!cameraReady || cameraStarting || panoramaBusy}>
              {panoramaBusy ? "Building panorama preview…" : `Capture ${FRAME_GUIDANCE[Math.min(frames.length, FRAME_GUIDANCE.length - 1)].toLowerCase()} view`}
            </Button> : <Button variant="primary" icon={<Camera size={17} />} onClick={() => void startCamera()} disabled={cameraStarting}>
              {cameraStarting ? "Opening camera…" : "Try camera again"}
            </Button>}
            {stream && frames.length > 0 && <button type="button" className="now-flow__text-button" onClick={() => setFrames([])}><RotateCcw size={15} /> Retake all views</button>}
            {!stream && <Button variant="secondary" icon={<ImageIcon size={16} />} onClick={useSitePhoto}>Continue with site photo</Button>}
            <Button variant="secondary" icon={<MapPin size={16} />} onClick={startDemo}>Try demo · Thian Hock Keng</Button>
          </div>
          {frames.length > 0 && <p className="now-capture__progress" aria-live="polite">{frames.length} of {FRAME_GUIDANCE.length} camera views captured</p>}
          {cameraError && <p className="notice notice--warn now-flow__notice" role="status">{cameraError}</p>}
          {frameError && <p className="notice notice--warn now-flow__notice" role="status">{frameError}</p>}
          <p className="now-capture__privacy">Your panorama preview is assembled in this browser and is not uploaded.</p>
        </div>
      </section>}

      {step === "place" && <section className="now-flow" aria-labelledby="now-place-title">
        <div className="now-flow__section-head">
          <div><p className="label">Step 2 · Confirm the place</p><h2 id="now-place-title">{demoMode ? `Demo visit · ${site.name}` : `Are you at ${site.name}?`}</h2></div>
          <p className="muted">{demoMode ? "This sample skips GPS and image matching so you can preview the complete site-specific history flow." : "GPS suggests a nearby site when available. Compare the image and correct the selection if needed."}</p>
        </div>
        <div className="now-place">
          <figure className="now-place__image">
            <img src={panorama ?? presentEra.image.src} alt={panorama ? `Three-view panorama preview captured by the visitor near ${site.name}` : `${site.name} today: ${presentEra.image.alt}`} />
            <figcaption>{panorama ? "Your three-view panorama preview" : demoMode ? "Demo site photo · Thian Hock Keng" : `Present-day site photo · ${presentEra.image.credit.creator}`}</figcaption>
          </figure>
          <div className="now-place__details">
            <label className="now-page__site-select">
              <span>{demoMode ? "Demo site · choose another if needed" : "Heritage site · choose another if needed"}</span>
              <select value={site.id} onChange={(event) => { manualSiteRef.current = true; setDemoMode(false); setSiteId(event.target.value); }}>
                {SITES.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.area}</option>)}
              </select>
            </label>
            <p className="now-place__status"><MapPin size={16} aria-hidden="true" />{placeStatus}</p>
            {!demoMode && <div className="now-place__actions">
              <button type="button" className="now-flow__text-button" onClick={() => { manualSiteRef.current = false; setDemoMode(false); if (geo.nearest) setSiteId(geo.nearest.site.id); geo.start(); }}><MapPin size={15} />{geo.status === "requesting" ? "Finding nearby places…" : "Use my location"}</button>
              <button type="button" className="now-flow__text-button" onClick={startDemo}><MapPin size={15} />Try demo · Thian Hock Keng</button>
            </div>}
            <p className="now-place__honesty">{demoMode ? "Demo: Thian Hock Keng is preselected to show the full flow. It uses the site’s curated archive and 3D interpretation, not live GPS or image recognition." : "GPS can suggest the nearest curated site. The camera image is not analyzed; confirm or change the place here. Camera frames stay in this browser."}</p>
            <div className="now-flow__button-row">
              <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={resetCapture}>Back to capture</Button>
              <Button variant="primary" icon={<Check size={17} />} onClick={confirmSite}>Yes, explore {site.name}</Button>
            </div>
          </div>
        </div>
      </section>}

      {step === "era" && <section className="now-flow" aria-labelledby="now-era-title">
        <div className="now-flow__section-head">
          <div><p className="label">Step 3 · Research the past</p><h2 id="now-era-title">Choose an era at {site.name}</h2></div>
          <p className="muted">These dates come from the site archive. Each image includes its date range, source and limits.</p>
        </div>
        {pastEras.length ? <>
          <div className="now-era-grid">
            {pastEras.map((era) => <button key={era.id} type="button" className={`now-era-card${selectedEra?.id === era.id ? " is-selected" : ""}`} aria-pressed={selectedEra?.id === era.id} onClick={() => setEraId(era.id)}>
              <img src={era.image.srcSmall ?? era.image.src} alt="" loading="lazy" />
              <span className="now-era-card__date">{era.label}</span>
              <strong>{era.caption}</strong>
              <small>{era.image.dateBasis}</small>
              <span className="now-era-card__credit">{era.image.credit.creator} · {era.image.credit.collection}</span>
            </button>)}
          </div>
          {selectedEra && <div className="now-era-evidence">
            <img src={selectedEra.image.src} alt={`${selectedEra.image.alt}, ${selectedEra.image.dateLabel}`} />
            <div><span className="label"><ImageIcon size={14} /> Archival evidence · {selectedEra.image.dateLabel}</span>
              <p>{selectedEra.caption}</p><small>{selectedEra.image.credit.creator} · {selectedEra.image.credit.collection} · {selectedEra.image.credit.license}</small>
              {selectedEra.image.limitations && <small className="now-era-evidence__limits">What this record cannot show: {selectedEra.image.limitations}</small>}
            </div>
          </div>}
          <div className="now-era-reconstruction">
            <div><span className="label">Site-specific 3D interpretation</span><h3>{config.year} · {config.period}</h3><p>{config.modelNote}</p></div>
            <Button variant="primary" icon={<ChevronRight size={17} />} onClick={enterReconstruction}>Explore this place in 3D</Button>
          </div>
        </> : <p className="notice">There are no archival eras available for this site yet. The current site photo remains available.</p>}
      </section>}

      {step === "explore" && <Immersive label={`${site.name} historical 3D reconstruction`} onClose={backToEra}>
        <main className={`now-explore now-explore--${site.accent}`}>
          <HeritageScene site={site} hotspots={config.hotspots} activeId={activeHotspotId} onHotspot={setActiveHotspotId} hint="Drag to rotate 360° · pinch or use + / − to zoom · tap a marker for its story" />
          <div className="now-explore__shade" aria-hidden="true" />
          <header className="now-explore__top">
            <IconButton label="Back to era selection" variant="dark" onClick={backToEra}><ArrowLeft size={20} /></IconButton>
            <div><span>Singapore, Reimagined · {config.year}</span><strong>{site.name}</strong></div>
            <IconButton label="Close 3D reconstruction" variant="dark" onClick={backToEra}><X size={19} /></IconButton>
          </header>
          <div className="now-explore__period"><b>{config.period}</b><span>Evidence selected: {selectedEra?.image.dateLabel ?? "site archive"}</span></div>
          <div className="now-explore__disclosure">
            <button type="button" aria-expanded={aboutOpen} onClick={() => setAboutOpen((open) => !open)}><Compass size={15} /> What is known and interpreted</button>
            {aboutOpen && <div><strong>Evidence-based interpretation</strong><p>{config.modelNote}</p><p>{config.description}</p><small>The selected archive photograph is dated {selectedEra?.image.dateLabel ?? "as shown in the archive"} and is shown separately as evidence; the 3D scene is labelled with its own reconstruction date.</small></div>}
          </div>
          {activeHotspot && <aside className="now-explore__hotspot" aria-live="polite">
            <button type="button" className="now-explore__hotspot-close" aria-label="Close hotspot detail" onClick={() => setActiveHotspotId(null)}>×</button>
            <span>Place detail · {activeHotspot.label}</span><h2>{activeHotspot.title}</h2><p>{activeHotspot.body}</p>
          </aside>}
          <section className="now-explore__story" aria-label="Audio guide">
            <span className="now-explore__story-kicker"><Mic2 size={13} /> Site story · {voiceLabel}</span>
            <p aria-live="polite">{currentSentence}</p>
            <div className="now-explore__story-controls">
              <button type="button" className="now-explore__play" aria-label={narration.status === "playing" ? "Pause narration" : "Play narration"} disabled={!canPlay} onClick={() => narration.status === "playing" ? player.pause() : story.play()}>
                {narration.status === "playing" ? <Pause size={19} /> : <Play size={19} />}
              </button>
              <span><Volume2 size={15} />{narration.mode === "file" ? "ElevenLabs voice guide" : "Audio guide"}</span>
              <button type="button" className="now-explore__transcript" onClick={() => setAboutOpen((open) => !open)}>Description &amp; sources</button>
            </div>
            {narration.message && <small role="status">{narration.message}</small>}
          </section>
        </main>
      </Immersive>}
    </div>
  );
}
