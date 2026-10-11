import { useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Minus, Plus, RotateCcw, RotateCw, Stamp, Trash2, X, ZoomIn, ZoomOut } from "lucide-react";
import { PASSPORT_PAGES, STAMP_WIDTH } from "../../content/passport";
import { findStampPlace } from "../../content/sites";
import { progress } from "../../state/progress";
import { Button, IconButton } from "../../components/Button";
import { NUDGE_STEP, ROTATE_STEP, SIZE_STEP, describeSpot, nudge, resize, rotate } from "./placement";
import type { PlacementApi } from "./usePlacement";

interface Props {
  api: PlacementApi;
  /** False when the draft's page is not on screen (e.g. turned to the identity page). */
  onScreen: boolean;
  zoomed: boolean;
  onToggleZoom: () => void;
}

/**
 * Button and keyboard alternative to dragging: every placement action works without
 * precision gestures. Also hosts the confirmation and the live announcements.
 */
export function PlacementControls({ api, onScreen, zoomed, onToggleZoom }: Props) {
  const { draft, pressing } = api;
  const [announce, setAnnounce] = useState("");
  const page = draft ? PASSPORT_PAGES.find((p) => p.id === draft.pageId) : undefined;
  const pageLabel = page ? `Page ${page.index + 1}, ${page.title}` : "";

  // Debounced so dragging doesn't flood screen readers.
  const spokenKey = draft ? `${draft.pageId}|${draft.x.toFixed(2)}|${draft.y.toFixed(2)}|${draft.rotationDeg}|${draft.widthRatio.toFixed(2)}` : "";
  useEffect(() => {
    if (!draft) return;
    const t = window.setTimeout(() => setAnnounce(describeSpot(draft, pageLabel)), 450);
    return () => window.clearTimeout(t);
  }, [spokenKey]);

  if (!draft) return <p className="visually-hidden" aria-live="polite">{pressing ? "Stamped." : ""}</p>;

  const site = findStampPlace(progress.getEarnedStamps().find((s) => s.id === draft.earnedStampId)?.siteId);
  const busy = !!pressing;

  return (
    <section className="placement-controls" aria-label="Stamp placement controls">
      <p className="visually-hidden" aria-live="polite">
        {announce}
      </p>
      <div className="placement-controls__head">
        <strong>
          {draft.prev ? "Move" : "Place"} your {site?.name ?? ""} stamp
        </strong>
        <span className="muted">{onScreen ? pageLabel : "Turn to a stamp page to place it."}</span>
      </div>

      <div className="placement-controls__grid">
        <fieldset className="placement-controls__group">
          <legend>Move</legend>
          <div className="nudge-pad">
            <IconButton label="Move up" variant="paper" className="nudge-pad__up" onClick={() => api.update((s) => nudge(s, 0, -NUDGE_STEP * 3))}>
              <ArrowUp size={20} />
            </IconButton>
            <IconButton label="Move left" variant="paper" className="nudge-pad__left" onClick={() => api.update((s) => nudge(s, -NUDGE_STEP * 3, 0))}>
              <ArrowLeft size={20} />
            </IconButton>
            <IconButton label="Move right" variant="paper" className="nudge-pad__right" onClick={() => api.update((s) => nudge(s, NUDGE_STEP * 3, 0))}>
              <ArrowRight size={20} />
            </IconButton>
            <IconButton label="Move down" variant="paper" className="nudge-pad__down" onClick={() => api.update((s) => nudge(s, 0, NUDGE_STEP * 3))}>
              <ArrowDown size={20} />
            </IconButton>
          </div>
        </fieldset>
        <fieldset className="placement-controls__group">
          <legend>Turn &amp; size</legend>
          <div className="placement-controls__row">
            <IconButton label="Rotate 15° anticlockwise" variant="paper" onClick={() => api.update((s) => rotate(s, -ROTATE_STEP))}>
              <RotateCcw size={20} />
            </IconButton>
            <IconButton label="Rotate 15° clockwise" variant="paper" onClick={() => api.update((s) => rotate(s, ROTATE_STEP))}>
              <RotateCw size={20} />
            </IconButton>
          </div>
          <div className="placement-controls__row">
            <IconButton label="Smaller" variant="paper" disabled={draft.widthRatio <= STAMP_WIDTH.min} onClick={() => api.update((s) => resize(s, -SIZE_STEP))}>
              <Minus size={20} />
            </IconButton>
            <IconButton label="Larger" variant="paper" disabled={draft.widthRatio >= STAMP_WIDTH.max} onClick={() => api.update((s) => resize(s, SIZE_STEP))}>
              <Plus size={20} />
            </IconButton>
          </div>
        </fieldset>
      </div>

      <div className="placement-controls__secondary">
        <Button variant="ghost" size="sm" icon={zoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />} onClick={onToggleZoom}>
          {zoomed ? "Zoom out" : "Zoom in"}
        </Button>
        {draft.prev && (
          <Button variant="ghost" size="sm" icon={<Trash2 size={16} />} onClick={api.remove} disabled={busy}>
            Delete from page
          </Button>
        )}
      </div>

      <div className="placement-actions">
        <Button variant="secondary" icon={<X size={18} />} onClick={api.cancel} disabled={busy}>
          Cancel
        </Button>
        <Button ticket icon={<Stamp size={18} />} onClick={api.confirm} disabled={busy || !onScreen}>
          Stamp here
        </Button>
      </div>
    </section>
  );
}
