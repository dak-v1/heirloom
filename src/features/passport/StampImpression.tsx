import type { CSSProperties, ReactNode } from "react";
import type { Site } from "../../content/types";
import { formatVisitDate } from "../completion/Completion";
import type { Spot } from "./placement";

/** Normalised page coordinates → CSS box. Survives any page size, zoom or layout. */
export function spotStyle(s: Spot, zIndex?: number): CSSProperties {
  return {
    left: `${s.x * 100}%`,
    top: `${s.y * 100}%`,
    width: `${s.widthRatio * 100}%`,
    transform: `translate(-50%, -50%) rotate(${s.rotationDeg}deg)`,
    zIndex,
  };
}

/** The ink impression of a site stamp with the visitor's date printed in its blank band. */
export function StampImpression({ site, visitDate, children }: { site: Site; visitDate: string; children?: ReactNode }) {
  const band = site.stamp.dateBand;
  return (
    <span className="impression__ink" style={{ color: site.stamp.ink }}>
      <img src={site.stamp.inkArt} alt="" draggable={false} />
      <span
        className="impression__date"
        style={{ left: `${band.x * 100}%`, top: `${band.y * 100}%`, width: `${band.w * 100}%`, height: `${band.h * 100}%` }}
      >
        {formatVisitDate(visitDate)}
      </span>
      {children}
    </span>
  );
}
