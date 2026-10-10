import { useRef, type KeyboardEvent } from "react";
import type { Era } from "../../content/types";

/**
 * Era selector showing only the eras that have real content, plus Today.
 * A radiogroup: arrow keys move between eras.
 */
export function EraTimeline({ eras, value, onChange, tone = "light" }: { eras: Era[]; value: string; onChange: (id: string) => void; tone?: "light" | "dark" }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = Math.max(0, eras.findIndex((e) => e.id === value));
  const onKey = (e: KeyboardEvent) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (idx + d + eras.length) % eras.length;
    onChange(eras[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div className={`timeline timeline--${tone}`} role="radiogroup" aria-label="Choose an era" onKeyDown={onKey}>
      <div className="timeline__rail" aria-hidden="true" />
      {eras.map((era, i) => {
        const checked = era.id === value;
        return (
          <button
            key={era.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className={`timeline__stop${checked ? " is-active" : ""}${era.isToday ? " is-today" : ""}`}
            onClick={() => onChange(era.id)}
          >
            <span className="timeline__dot" aria-hidden="true" />
            <span className="timeline__label">{era.label}</span>
          </button>
        );
      })}
    </div>
  );
}
