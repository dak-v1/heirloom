import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Camera, Info, List, Puzzle, X } from "lucide-react";
import type { Era, Site } from "../../content/types";
import { IMAGE_KIND_LABEL } from "../../content/media";
import { IconButton, Button } from "../../components/Button";
import { Tag, hideBrokenImage } from "../../components/Media";
import { ImageStage } from "./ImageStage";
import { EraTimeline } from "./EraTimeline";
import { MiniPlayer } from "../audio/StoryPlayer";
import type { useSiteStory } from "../audio/useSiteStory";

/** Full-screen layer outside the app shell; the shell is made inert while it is open. */
export function Immersive({ label, children, onClose }: { label: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const shell = document.getElementById("app-shell");
    shell?.setAttribute("inert", "");
    document.body.classList.add("is-immersive");
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector(".sheet")) onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      shell?.removeAttribute("inert");
      document.body.classList.remove("is-immersive");
      document.removeEventListener("keydown", onKey);
      if (prev && document.contains(prev)) prev.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <div ref={ref} className="immersive" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
      {children}
    </div>,
    document.body,
  );
}

interface PastViewProps {
  site: Site;
  eraId: string;
  onEra: (id: string) => void;
  openedKeys: string[];
  onOpenHotspot: (hotspotId: string) => void;
  onClose: () => void;
  onSources: () => void;
  onDetails: () => void;
  onPlay: () => void;
  onSwitchToLive: () => void;
  story: ReturnType<typeof useSiteStory>;
  onTranscript: () => void;
}

export function PastView({ site, eraId, onEra, openedKeys, onOpenHotspot, onClose, onSources, onDetails, onPlay, onSwitchToLive, story, onTranscript }: PastViewProps) {
  const today = site.eras.find((e) => e.isToday)!;
  const era: Era = site.eras.find((e) => e.id === eraId) ?? site.eras[0];
  const [announce, setAnnounce] = useState("");
  useEffect(() => setAnnounce(`${era.label}: ${era.caption}`), [era]);

  return (
    <Immersive label={`Past View of ${site.name}`} onClose={onClose}>
      <div className="past" data-today={era.isToday ? "true" : "false"}>
        <div className="past__backdrop" aria-hidden="true">
          <img src={today.image.srcSmall ?? today.image.src} alt="" referrerPolicy="no-referrer" onError={hideBrokenImage} />
        </div>

        <header className="past__bar">
          <IconButton label="Close Past View" variant="dark" onClick={onClose}>
            <X size={22} />
          </IconButton>
          <div className="past__title">
            <span className="past__kicker">Past View</span>
            <span>{site.name}</span>
          </div>
          <IconButton label="About this photograph and its sources" variant="dark" onClick={onSources}>
            <Info size={22} />
          </IconButton>
        </header>

        <div className="past__main">
          <figure className="past__frame">
            <div className="past__paper">
              <ImageStage era={era} openedKeys={openedKeys} onOpenHotspot={onOpenHotspot} eager />
              <span className="past__era-tag" aria-hidden="true">
                {era.isToday ? `Today · ${era.image.dateLabel}` : era.label}
              </span>
            </div>
            <figcaption className="past__caption">
              <span className="past__caption-tags">
                <Tag tone={era.isToday ? "olive" : "terracotta"}>{IMAGE_KIND_LABEL[era.image.kind]}</Tag>
                <span>{era.image.dateLabel}</span>
              </span>
              <span className="past__caption-text">{era.caption}</span>
              <button type="button" className="link-btn past__credit" onClick={onSources}>
                {era.image.credit.creator} · {era.image.credit.license} · details
              </button>
            </figcaption>
          </figure>

          <EraTimeline eras={site.eras} value={era.id} onChange={onEra} tone="dark" />
          <p className="visually-hidden" aria-live="polite">
            {announce}
          </p>
        </div>

        <footer className="past__dock">
          <MiniPlayer story={story} onOpenTranscript={onTranscript} />
          <div className="past__actions">
            <Button variant="secondary" size="sm" icon={<List size={16} />} onClick={onDetails}>
              All details
            </Button>
            <Button variant="secondary" size="sm" icon={<Puzzle size={16} />} onClick={onPlay}>
              Guess the Year
            </Button>
            <Button variant="secondary" size="sm" icon={<Camera size={16} />} onClick={onSwitchToLive}>
              Camera preview
            </Button>
          </div>
        </footer>
      </div>
    </Immersive>
  );
}
