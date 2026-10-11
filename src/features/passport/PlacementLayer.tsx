import { useEffect, useRef } from "react";
import { RotateCw, Trash2 } from "lucide-react";
import type { PassportPage } from "../../content/passport";
import { findStampPlace } from "../../content/sites";
import type { EarnedStamp, StampPlacement } from "../../services/progress";
import { IconButton } from "../../components/Button";
import { NUDGE_STEP, ROTATE_STEP, SIZE_STEP, moveTo, nudge, overlapsAny, pointToPage, resize, rotate } from "./placement";
import { StampImpression, spotStyle } from "./StampImpression";
import { formatVisitDate } from "../completion/Completion";
import type { PlacementApi } from "./usePlacement";

interface Props {
  page: PassportPage;
  /** False for the copies drawn on a turning page: they are pictures, not controls. */
  interactive: boolean;
  placements: StampPlacement[];
  earned: EarnedStamp[];
  api: PlacementApi;
}

/**
 * Everything stamped on one page, plus the ghost preview while placing. Lies exactly over
 * the page box, so normalised coordinates map 1:1 at any size, zoom or layout.
 */
export function PlacementLayer({ page, interactive, placements, earned, api }: Props) {
  const layer = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const { draft, pressing } = api;
  const draftHere = !!draft && draft.pageId === page.id;
  const drafting = interactive && !!draft && !pressing;

  // Keyboard users land on the preview as soon as it appears on this page.
  useEffect(() => {
    if (interactive && draftHere) ghost.current?.focus({ preventScroll: true });
  }, [interactive, draftHere, draft?.earnedStampId]);

  if (page.kind !== "stamp") return null;

  const siteOf = (earnedStampId: string) => {
    const e = earned.find((s) => s.id === earnedStampId);
    return e ? { stamp: e, site: findStampPlace(e.siteId) } : null;
  };
  const here = placements.filter((p) => p.pageId === page.id && !(interactive && p.earnedStampId === draft?.earnedStampId)).sort((a, b) => a.zIndex - b.zIndex);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drafting || !draft || !layer.current) return;
    const target = e.target as HTMLElement;
    if (target.closest(".ghost-tools") || (e.pointerType === "mouse" && e.button !== 0)) return;
    const p = pointToPage(layer.current.getBoundingClientRect(), e.clientX, e.clientY);
    const onGhost = draftHere && !!target.closest(".ghost");
    drag.current = { id: e.pointerId, dx: onGhost ? p.x - draft.x : 0, dy: onGhost ? p.y - draft.y : 0 };
    if (!onGhost) {
      if (draftHere) api.update((s) => moveTo(s, p.x, p.y));
      else api.moveToPage(page.id, p.x, p.y);
    }
    layer.current.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !layer.current) return;
    const p = pointToPage(layer.current.getBoundingClientRect(), e.clientX, e.clientY);
    api.update((s) => moveTo(s, p.x - d.dx, p.y - d.dy));
  };
  const endDrag = () => {
    drag.current = null;
  };

  const onGhostKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.05 : NUDGE_STEP;
    const actions: Record<string, () => void> = {
      ArrowLeft: () => api.update((s) => nudge(s, -step, 0)),
      ArrowRight: () => api.update((s) => nudge(s, step, 0)),
      ArrowUp: () => api.update((s) => nudge(s, 0, -step)),
      ArrowDown: () => api.update((s) => nudge(s, 0, step)),
      "[": () => api.update((s) => rotate(s, -ROTATE_STEP)),
      "]": () => api.update((s) => rotate(s, ROTATE_STEP)),
      "-": () => api.update((s) => resize(s, -SIZE_STEP)),
      "+": () => api.update((s) => resize(s, SIZE_STEP)),
      "=": () => api.update((s) => resize(s, SIZE_STEP)),
      Enter: api.confirm,
      Escape: api.cancel,
    };
    const act = actions[e.key];
    if (!act) return;
    e.preventDefault();
    e.stopPropagation();
    act();
  };

  const ghostInfo = draftHere && draft ? siteOf(draft.earnedStampId) : null;
  const side = draft && draft.x < 0.55 ? "right" : "left";
  const reach = draft ? draft.widthRatio * 0.62 : 0;

  return (
    <div
      ref={layer}
      className={`placement-layer${drafting ? " is-drafting" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {here.map((pl) => {
        const info = siteOf(pl.earnedStampId);
        if (!info?.site) return null;
        const fresh = pressing?.earnedStampId === pl.earnedStampId;
        const ink = (
          <StampImpression site={info.site} visitDate={info.stamp.visitDate}>
            {fresh && <span className="impression__ring" aria-hidden="true" />}
          </StampImpression>
        );
        return interactive && !draft && !pressing ? (
          <button
            key={pl.id}
            type="button"
            className="impression impression--button"
            style={spotStyle(pl, pl.zIndex)}
            onClick={() => api.pick(pl.earnedStampId)}
            aria-label={`${info.site.name} stamp, visited ${formatVisitDate(info.stamp.visitDate)}. Move it`}
          >
            {ink}
          </button>
        ) : (
          <span key={pl.id} className={`impression${fresh ? " is-fresh" : ""}`} style={spotStyle(pl, pl.zIndex)} aria-hidden={!interactive}>
            {ink}
          </span>
        );
      })}

      {interactive && draft && draftHere && ghostInfo?.site && !pressing && (
        <>
          <div
            ref={ghost}
            className="ghost"
            style={spotStyle(draft, 9000)}
            tabIndex={0}
            role="application"
            aria-roledescription="stamp preview"
            aria-label={`${ghostInfo.site.name} stamp preview. Arrow keys move it, Shift for bigger steps. Square brackets rotate, minus and plus resize, Enter stamps it, Escape cancels.`}
            onKeyDown={onGhostKey}
          >
            <StampImpression site={ghostInfo.site} visitDate={ghostInfo.stamp.visitDate} />
          </div>
          <div
            className="ghost-tools"
            style={{
              left:
                side === "right"
                  ? `clamp(4px, calc(${(draft.x + reach) * 100}% + 6px), calc(100% - 52px))`
                  : `clamp(4px, calc(${(draft.x - reach) * 100}% - 54px), calc(100% - 52px))`,
              top: `clamp(4px, calc(${draft.y * 100}% - 48px), calc(100% - 100px))`,
            }}
          >
            <IconButton label="Rotate 15° clockwise" variant="paper" onClick={() => api.update((s) => rotate(s, ROTATE_STEP))}>
              <RotateCw size={20} />
            </IconButton>
            {draft.prev && (
              <IconButton label="Delete from this page. The stamp goes back to your tray" variant="paper" onClick={api.remove}>
                <Trash2 size={20} />
              </IconButton>
            )}
          </div>
          {!draft.touched && <p className="placement-hint">Tap anywhere to place your stamp</p>}
          {draft.touched && overlapsAny(draft, here) && <p className="placement-hint placement-hint--soft">Overlaps another stamp, which is fine</p>}
        </>
      )}
    </div>
  );
}
