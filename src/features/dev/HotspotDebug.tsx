import { useState } from "react";
import { SITES } from "../../content/sites";
import { FramedImage } from "../../components/Media";
import type { ImageAsset } from "../../content/types";

/**
 * Development-only calibration tool (/dev/hotspots): shows every image with a
 * 10% grid and existing hotspots; click to read normalised coordinates.
 */
export function HotspotDebug() {
  const images: { key: string; label: string; image: ImageAsset; spots: { id: string; x: number; y: number }[] }[] = SITES.flatMap((s) => [
    ...s.eras.map((e) => ({ key: `${s.id}/${e.id}`, label: `${s.name} · ${e.label}`, image: e.image, spots: e.hotspots })),
    ...s.game.rounds.map((r) => ({ key: `${s.id}/${r.id}`, label: `${s.name} · game ${r.id}`, image: r.image, spots: [] })),
  ]);
  const [idx, setIdx] = useState(0);
  const [pt, setPt] = useState<{ x: number; y: number } | null>(null);
  const cur = images[idx];
  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <h1 style={{ fontSize: "1.4rem" }}>Hotspot calibration</h1>
      <select value={idx} onChange={(e) => setIdx(Number(e.target.value))} style={{ margin: "8px 0", minHeight: 40 }}>
        {images.map((im, i) => (
          <option key={im.key} value={i}>
            {im.label}
          </option>
        ))}
      </select>
      <p>
        Click: {pt ? `x: ${pt.x.toFixed(3)}, y: ${pt.y.toFixed(3)}` : "—"}
      </p>
      <div
        style={{ position: "relative", cursor: "crosshair" }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPt({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
        }}
      >
        <FramedImage
          key={cur.key}
          image={cur.image}
          eager
          overlay={
            <>
              {Array.from({ length: 9 }, (_, i) => (
                <span key={`v${i}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${(i + 1) * 10}%`, borderLeft: "1px solid rgba(255,0,0,.5)" }} />
              ))}
              {Array.from({ length: 9 }, (_, i) => (
                <span key={`h${i}`} style={{ position: "absolute", left: 0, right: 0, top: `${(i + 1) * 10}%`, borderTop: "1px solid rgba(255,0,0,.5)" }} />
              ))}
              {cur.spots.map((s) => (
                <span key={s.id} title={s.id} style={{ position: "absolute", left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: 14, height: 14, margin: -7, borderRadius: 7, background: "#a94e36", border: "2px solid #fff" }}>
                  <span style={{ position: "absolute", left: 14, top: -4, color: "#fff", background: "rgba(0,0,0,.6)", fontSize: 11, padding: "0 3px", whiteSpace: "nowrap" }}>{s.id}</span>
                </span>
              ))}
              {pt && <span style={{ position: "absolute", left: `${pt.x * 100}%`, top: `${pt.y * 100}%`, width: 10, height: 10, margin: -5, background: "#0f0" }} />}
            </>
          }
        />
      </div>
    </div>
  );
}
