import { useState } from "react";
import { FileText, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX, Waves } from "lucide-react";
import type { LangCode, Site } from "../../content/types";
import { STORY_LANGUAGES } from "../../content/languages";
import { getSources } from "../../content/sources";
import { Button, IconButton } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { Tag } from "../../components/Media";
import { useAudio, useNarration } from "./audio-context";
import { useSiteStory } from "./useSiteStory";

export function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

type Story = ReturnType<typeof useSiteStory>;

export function LanguagePicker({ story, compact }: { story: Story; compact?: boolean }) {
  const [note, setNote] = useState<string | null>(null);
  return (
    <div>
      <div className="chips" role="radiogroup" aria-label="Story language">
        {STORY_LANGUAGES.map((l) => {
          const has = story.available.includes(l.code);
          return (
            <button
              key={l.code}
              type="button"
              role="radio"
              className="chip"
              lang={l.bcp47}
              aria-checked={story.lang === l.code}
              aria-disabled={!has}
              title={has ? l.english : `${l.english}: not available yet`}
              onClick={() => {
                if (has) {
                  setNote(null);
                  story.setLang(l.code as LangCode);
                } else setNote(`The ${l.english} version isn't ready yet. We only publish translations that have been prepared for review, so the story stays in ${story.version.lang === "en" ? "English" : "the current language"} for now.`);
              }}
            >
              {l.label}
              {!has && !compact && <span className="visually-hidden"> (not available yet)</span>}
            </button>
          );
        })}
      </div>
      {note && (
        <p className="notice" role="status" style={{ marginTop: 8 }}>
          {note}
        </p>
      )}
    </div>
  );
}

function StatusLine({ story }: { story: Story }) {
  const n = useNarration();
  return (
    <div className="story__status">
      {story.version.status === "draft-translation" && <Tag tone="draft">Draft translation</Tag>}
      {n.voiceLabel && <Tag tone={n.mode === "file" ? "olive" : "plain"}>{n.mode === "file" ? "Synthetic voice" : "Device voice"}</Tag>}
      {n.voiceLabel && <span className="muted story__voice">{n.voiceLabel}</span>}
    </div>
  );
}

/** Full narration controls for the site page. */
export function StoryPlayer({ site, story, onOpenTranscript }: { site: Site; story: Story; onOpenTranscript: () => void }) {
  const n = useNarration();
  const { player } = useAudio();
  const playing = n.status === "playing";
  const disabled = n.status === "unsupported" || n.status === "loading" || n.status === "idle";
  return (
    <div className="story">
      <p className="story__title" lang={story.version.lang === "zh" ? "zh-Hans" : story.version.lang}>
        “{story.version.title}”
      </p>
      <LanguagePicker story={story} />
      <div className="story__controls">
        <IconButton label={n.mode === "file" ? "Back 15 seconds" : "Previous sentence"} onClick={() => player.skip(-1)} disabled={disabled}>
          <SkipBack size={22} />
        </IconButton>
        <button
          type="button"
          className="story__play"
          onClick={() => (playing ? player.pause() : story.play())}
          disabled={disabled}
          aria-label={playing ? "Pause story" : n.status === "paused" ? "Resume story" : n.status === "ended" ? "Play story again" : "Listen to the story"}
        >
          {playing ? <Pause size={30} aria-hidden="true" /> : <Play size={30} aria-hidden="true" style={{ marginLeft: 3 }} />}
        </button>
        <IconButton label={n.mode === "file" ? "Forward 15 seconds" : "Next sentence"} onClick={() => player.skip(1)} disabled={disabled}>
          <SkipForward size={22} />
        </IconButton>
        <IconButton label="Replay from the start" onClick={() => player.replay()} disabled={disabled}>
          <RotateCcw size={20} />
        </IconButton>
      </div>
      <div className="story__progress">
        <span>{formatTime(n.elapsed)}</span>
        <div className="progress-bar" role="progressbar" aria-label="Story progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(n.progress * 100)}>
          <span style={{ width: `${n.progress * 100}%` }} />
        </div>
        <span>{n.mode === "speech" ? "~" : ""}{formatTime(n.duration)}</span>
      </div>
      <StatusLine story={story} />
      {n.message && (
        <p className="notice notice--warn" role="status">
          {n.message}
        </p>
      )}
      <div className="story__row">
        <Button variant="secondary" icon={<FileText size={18} />} onClick={onOpenTranscript}>
          Read the transcript
        </Button>
      </div>
      <AmbientControls site={site} />
    </div>
  );
}

export function AmbientControls({ site }: { site: Site }) {
  const { ambient, startAmbient, stopAmbient, setAmbientVolume, stopAll } = useAudio();
  const n = useNarration();
  const t = site.ambient[0];
  if (!t) return null;
  const on = ambient.playing && ambient.trackId === t.id;
  return (
    <div className="ambient">
      <div className="ambient__head">
        <Waves size={18} aria-hidden="true" />
        <div>
          <strong>{t.title}</strong>
          <p className="muted">
            {t.description} <em>Synthesised in your browser; not a historical recording.</em>
          </p>
        </div>
      </div>
      {ambient.supported ? (
        <div className="ambient__controls">
          <Button variant={on ? "olive" : "secondary"} size="sm" aria-pressed={on} onClick={() => (on ? stopAmbient() : startAmbient(t.id, t.recipe))}>
            {on ? "Soundscape on" : "Play soundscape"}
          </Button>
          <label className="ambient__volume">
            <span className="visually-hidden">Soundscape volume</span>
            <VolumeX size={16} aria-hidden="true" />
            <input type="range" min={0} max={1} step={0.05} value={ambient.volume} onChange={(e) => setAmbientVolume(Number(e.target.value))} />
            <Volume2 size={16} aria-hidden="true" />
          </label>
          {(on || n.status === "playing") && (
            <Button variant="ghost" size="sm" icon={<VolumeX size={16} />} onClick={stopAll}>
              Stop all sound
            </Button>
          )}
        </div>
      ) : (
        <p className="muted">This browser can't play generated soundscapes.</p>
      )}
    </div>
  );
}

/** Compact player for the immersive Past View. */
export function MiniPlayer({ story, onOpenTranscript }: { story: Story; onOpenTranscript: () => void }) {
  const n = useNarration();
  const { player, stopAll, ambient } = useAudio();
  const playing = n.status === "playing";
  const disabled = n.status === "unsupported" || n.status === "loading" || n.status === "idle";
  return (
    <div className="mini-player">
      <button
        type="button"
        className="mini-player__play"
        onClick={() => (playing ? player.pause() : story.play())}
        disabled={disabled}
        aria-label={playing ? "Pause story" : "Listen to the story"}
      >
        {playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
      </button>
      <div className="mini-player__meta">
        <span className="mini-player__label">{n.status === "unsupported" ? "Read the story instead" : playing ? "Listening…" : "Listen to the story"}</span>
        <div className="progress-bar">
          <span style={{ width: `${n.progress * 100}%` }} />
        </div>
      </div>
      <IconButton label="Read the transcript" onClick={onOpenTranscript}>
        <FileText size={20} />
      </IconButton>
      {(playing || ambient.playing) && (
        <IconButton label="Stop all sound" onClick={stopAll}>
          <VolumeX size={20} />
        </IconButton>
      )}
    </div>
  );
}

export function TranscriptSheet({ open, onClose, site, story }: { open: boolean; onClose: () => void; site: Site; story: Story }) {
  const v = story.version;
  const sources = getSources(site.story.sourceIds);
  return (
    <Sheet open={open} onClose={onClose} title="Story transcript" size="tall">
      <LanguagePicker story={story} compact />
      <article className="transcript" lang={v.lang === "zh" ? "zh-Hans" : v.lang}>
        <h3>{v.title}</h3>
        {v.status === "draft-translation" && (
          <p className="notice notice--warn" lang="en">
            <span>
              <Tag tone="draft">Draft</Tag> {v.reviewNote}
            </span>
          </p>
        )}
        <div className="prose">
          {v.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>
      <div className="transcript__meta" lang="en">
        <p className="muted">{site.story.scope}</p>
        <h4 className="label" style={{ marginTop: 16 }}>
          Sources
        </h4>
        <ul className="source-list">
          {sources.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.title}
              </a>
              <span className="muted">
                {" "}
                · {s.publisher} (accessed {s.accessed})
              </span>
            </li>
          ))}
        </ul>
        <p className="muted" style={{ marginTop: 12 }}>
          Narration uses a synthetic voice (your device's text-to-speech, or pre-generated audio where available). It is not a historical recording.
        </p>
      </div>
    </Sheet>
  );
}
