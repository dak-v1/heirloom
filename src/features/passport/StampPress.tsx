import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { playStampThunk } from "../../services/audio/sfx";
import { getPreferences } from "../../state/preferences";
import type { Pressing } from "./usePlacement";

/** Whole press, ms. Contact happens at CONTACT of the way through (keep in sync with book.css). */
export const PRESS_MS = 1000;
const CONTACT = 0.48;

// Where the rubber pad's centre sits in stamp-tool.svg (200 × 260): x 100, y ≈ 207.
const PAD_X = 0.5;
const PAD_Y = 0.795;
// Pad width (140 of 200) relative to the tool image width.
const PAD_W = 0.7;

/**
 * The dimensional stamping moment: a wooden stamp drops from above the screen onto the
 * saved spot, presses, and lifts away. Purely visual — the placement is already saved.
 */
export function StampPress({ pressing, onDone }: { pressing: Pressing; onDone: () => void }) {
  const [box, setBox] = useState<{ aim: CSSProperties; rotate: string } | null>(null);
  const done = useRef(onDone);
  done.current = onDone;

  // Measure the page on screen and line the pad up with the stamp's centre and rotation.
  useLayoutEffect(() => {
    const { pageId, x, y, widthRatio, rotationDeg } = pressing.placement;
    const page = document.querySelector<HTMLElement>(`.book__slot > [data-page-id="${pageId}"]`);
    if (!page) {
      done.current();
      return;
    }
    const r = page.getBoundingClientRect();
    const toolW = (widthRatio * r.width * 1.08) / PAD_W;
    setBox({
      aim: { left: r.left + x * r.width - toolW * PAD_X, top: r.top + y * r.height - toolW * (260 / 200) * PAD_Y, width: toolW },
      rotate: `${rotationDeg}deg`,
    });
  }, [pressing]);

  useEffect(() => {
    const thunk = window.setTimeout(() => {
      if (getPreferences().soundEffects) playStampThunk();
    }, PRESS_MS * CONTACT);
    const fallback = window.setTimeout(() => done.current(), PRESS_MS + 400);
    return () => {
      window.clearTimeout(thunk);
      window.clearTimeout(fallback);
    };
  }, [pressing]);

  if (!box) return null;
  return createPortal(
    <div className="stamp-press" aria-hidden="true">
      <div className="stamp-press__aim" style={box.aim}>
        <span className="stamp-press__shadow" style={{ left: `${PAD_X * 100}%`, top: `${PAD_Y * 100}%` }} />
        {/* The drop stays vertical (from the top of the screen); only the tool turns to match the stamp. */}
        <div className="stamp-press__drop" onAnimationEnd={(e) => e.target === e.currentTarget && done.current()}>
          <img
            className="stamp-press__tool"
            src="/assets/decor/stamp-tool.svg"
            alt=""
            draggable={false}
            style={{ rotate: box.rotate, transformOrigin: `${PAD_X * 100}% ${PAD_Y * 100}%` }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
