import { Check } from "lucide-react";
import type { Era } from "../../content/types";
import { FramedImage } from "../../components/Media";

interface Props {
  era: Era;
  openedKeys: string[];
  onOpenHotspot: (hotspotId: string) => void;
  className?: string;
  /** Hide markers (e.g. while blending in the camera preview). */
  hideHotspots?: boolean;
  eager?: boolean;
}

export const hotspotKey = (eraId: string, hotspotId: string) => `${eraId}:${hotspotId}`;

/** A historical (or present-day) photograph with numbered, tappable hotspots. */
export function ImageStage({ era, openedKeys, onOpenHotspot, className, hideHotspots, eager }: Props) {
  return (
    <FramedImage
      key={era.id}
      image={era.image}
      className={["stage", className].filter(Boolean).join(" ")}
      eager={eager}
      overlay={
        !hideHotspots && (
          <ol className="hotspots" aria-label={`Details in this ${era.isToday ? "present-day photograph" : "photograph"}`}>
            {era.hotspots.map((h, i) => {
              const opened = openedKeys.includes(hotspotKey(era.id, h.id));
              return (
                <li key={h.id} className="hotspot" style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }}>
                  <button type="button" className={`hotspot__btn${opened ? " is-opened" : ""}`} onClick={() => onOpenHotspot(h.id)} aria-label={`Detail ${i + 1}: ${h.label}${opened ? " (seen)" : ""}`}>
                    <span aria-hidden="true">{opened ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
                  </button>
                  <span className="hotspot__label" aria-hidden="true">
                    {h.label}
                  </span>
                </li>
              );
            })}
          </ol>
        )
      }
    />
  );
}
