import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Eraser, Undo2 } from "lucide-react";
import { Button } from "../../components/Button";
import type { Stroke } from "./draft";
import { DRAWING_MAX_BYTES, dataUrlBytes, fitWithin, isBlankPixels } from "./validation";

/** Internal canvas resolution (4:3). Displayed at 100% width. */
const W = 800;
const H = 600;
const MAX_STROKES = 400;
const MAX_POINTS = 1500;

// Mirrors the ink colours in src/styles/tokens.css (canvas can't read CSS variables cheaply).
export const INKS = [
  { name: "Ink", value: "#2d2a23" },
  { name: "Terracotta", value: "#a94e36" },
  { name: "Olive", value: "#687758" },
  { name: "Dusty blue", value: "#6884a3" },
  { name: "Mustard", value: "#bc9545" },
];
const PENS = [
  { name: "Fine pen", value: 0.007 },
  { name: "Bold pen", value: 0.018 },
];

export class DrawingError extends Error {}

export interface DrawingCanvasHandle {
  /** PNG data URL within the server's limits. Throws DrawingError if blank or too large. */
  exportPng: () => string;
}

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke, w: number, h: number) {
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  ctx.lineWidth = s.size * w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const [first, ...rest] = s.points;
  if (!first) return;
  if (!rest.length) {
    ctx.beginPath();
    ctx.arc(first[0] * w, first[1] * h, (s.size * w) / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(first[0] * w, first[1] * h);
  for (const [x, y] of rest) ctx.lineTo(x * w, y * h);
  ctx.stroke();
}

function render(canvas: HTMLCanvasElement, strokes: Stroke[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of strokes) drawStroke(ctx, s, canvas.width, canvas.height);
}

interface Props {
  strokes: Stroke[];
  onChange: (strokes: Stroke[]) => void;
  disabled?: boolean;
}

/**
 * Touch/pen/mouse drawing pad. `touch-action: none` keeps strokes from scrolling the page.
 * Strokes are vectors, so undo is "drop the last stroke" and the draft survives reloads.
 */
export const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas({ strokes, onChange, disabled }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef<{ pointer: number; stroke: Stroke } | null>(null);
  const [color, setColor] = useState(INKS[0].value);
  const [pen, setPen] = useState(PENS[0].value);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (canvas.current) render(canvas.current, strokes);
  }, [strokes]);

  useImperativeHandle(ref, () => ({
    exportPng() {
      const c = canvas.current;
      const ctx = c?.getContext("2d");
      if (!c || !ctx || !strokes.length || isBlankPixels(ctx.getImageData(0, 0, c.width, c.height).data)) {
        throw new DrawingError("Draw something before sharing your drawing.");
      }
      // Redraw at the allowed size; shrink until the PNG fits the server's limit.
      for (let scale = 1; scale >= 0.3; scale *= 0.75) {
        const { width, height } = fitWithin(W * scale, H * scale);
        const out = document.createElement("canvas");
        out.width = width;
        out.height = height;
        render(out, strokes);
        const url = out.toDataURL("image/png");
        if (dataUrlBytes(url) <= DRAWING_MAX_BYTES) return url;
      }
      throw new DrawingError("That drawing is too detailed to send. Try undoing a few strokes.");
    },
  }));

  /** Screen point → normalised canvas point (rounded to keep the saved draft small). */
  const point = (r: DOMRect, clientX: number, clientY: number): [number, number] => {
    const clamp = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 1000) / 1000;
    return [clamp((clientX - r.left) / r.width), clamp((clientY - r.top) / r.height)];
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0) || strokes.length >= MAX_STROKES) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    live.current = { pointer: e.pointerId, stroke: { color, size: pen, points: [point(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY)] } };
    const ctx = e.currentTarget.getContext("2d");
    if (ctx) drawStroke(ctx, live.current.stroke, W, H);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const l = live.current;
    if (!l || l.pointer !== e.pointerId || l.stroke.points.length >= MAX_POINTS) return;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    const r = e.currentTarget.getBoundingClientRect();
    const ctx = e.currentTarget.getContext("2d");
    for (const ev of events) {
      const prev = l.stroke.points[l.stroke.points.length - 1];
      const next = point(r, ev.clientX, ev.clientY);
      l.stroke.points.push(next);
      if (ctx) drawStroke(ctx, { ...l.stroke, points: [prev, next] }, W, H);
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const l = live.current;
    if (!l || l.pointer !== e.pointerId) return;
    live.current = null;
    onChange([...strokes, l.stroke]);
  };

  const significant = strokes.length > 3;

  return (
    <div className="draw">
      <canvas
        ref={canvas}
        className="draw__canvas"
        width={W}
        height={H}
        role="img"
        aria-label={`Drawing area, ${strokes.length} ${strokes.length === 1 ? "stroke" : "strokes"}. Drawing needs touch, a pen or a mouse; the Note tab lets you share in words instead.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="draw__tools">
        <div className="draw__swatches" role="radiogroup" aria-label="Ink colour">
          {INKS.map((ink) => (
            <button
              key={ink.value}
              type="button"
              role="radio"
              aria-checked={color === ink.value}
              aria-label={ink.name}
              title={ink.name}
              className="draw__swatch"
              style={{ "--swatch": ink.value } as React.CSSProperties}
              onClick={() => setColor(ink.value)}
            />
          ))}
        </div>
        <div className="chips" role="radiogroup" aria-label="Pen">
          {PENS.map((p) => (
            <button key={p.value} type="button" role="radio" className="chip" aria-checked={pen === p.value} onClick={() => setPen(p.value)}>
              {p.name}
            </button>
          ))}
        </div>
        <div className="draw__actions">
          <Button variant="secondary" size="sm" icon={<Undo2 size={16} />} disabled={!strokes.length || disabled} onClick={() => onChange(strokes.slice(0, -1))}>
            Undo
          </Button>
          {!confirmClear ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<Eraser size={16} />}
              disabled={!strokes.length || disabled}
              onClick={() => (significant ? setConfirmClear(true) : onChange([]))}
            >
              Clear
            </Button>
          ) : (
            <span className="draw__confirm" role="alert">
              Clear the whole drawing?
              <Button
                variant="ink"
                size="sm"
                onClick={() => {
                  onChange([]);
                  setConfirmClear(false);
                }}
              >
                Clear
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>
                Keep it
              </Button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
