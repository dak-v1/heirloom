import { useEffect, useRef, useState } from "react";
import { CameraOff, History, X } from "lucide-react";
import type { Site } from "../../content/types";
import { Button, IconButton } from "../../components/Button";
import { Tag, FramedImage } from "../../components/Media";
import { EraTimeline } from "./EraTimeline";
import { Immersive } from "./PastView";

type CamState = "requesting" | "live" | "denied" | "unavailable" | "unsupported" | "insecure";

/**
 * Live Time Window (P2) as an honest "camera overlay preview": the camera feed
 * with a historical photograph blended on top. No tracking or alignment is
 * claimed; the visitor lines it up by eye. Camera stops when this closes.
 */
export function LiveWindow({ site, eraId, onEra, onClose, onFallback }: { site: Site; eraId: string; onEra: (id: string) => void; onClose: () => void; onFallback: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [cam, setCam] = useState<CamState>("requesting");
  const [blend, setBlend] = useState(0.8);
  const historical = site.eras.filter((e) => !e.isToday);
  const era = historical.find((e) => e.id === eraId) ?? historical[0];

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    if (!window.isSecureContext) {
      setCam("insecure");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCam("unsupported");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play().catch(() => {});
        }
        setCam("live");
      })
      .catch((e: DOMException) => setCam(e.name === "NotAllowedError" || e.name === "SecurityError" ? "denied" : "unavailable"));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      if (video.current) video.current.srcObject = null;
    };
  }, []);

  const failed = cam !== "live" && cam !== "requesting";
  const reason: Record<string, string> = {
    denied: "Camera access was declined, so the preview can't show your surroundings.",
    unavailable: "No camera could be started on this device.",
    unsupported: "This browser can't open the camera.",
    insecure: "The camera needs a secure (https) connection.",
  };

  return (
    <Immersive label={`Camera overlay preview at ${site.name}`} onClose={onClose}>
      <div className="live">
        <video ref={video} className="live__video" playsInline muted aria-hidden="true" />
        <header className="past__bar">
          <IconButton label="Close camera preview" variant="dark" onClick={onClose}>
            <X size={22} />
          </IconButton>
          <div className="past__title">
            <span className="past__kicker">Live Time Window</span>
            <span>Camera overlay preview</span>
          </div>
          <span style={{ width: 44 }} />
        </header>

        {failed ? (
          <div className="live__fallback">
            <CameraOff size={36} aria-hidden="true" />
            <p>{reason[cam]}</p>
            <p className="muted-light">Your visit isn't affected. Past View works without the camera.</p>
            <Button size="lg" icon={<History size={20} />} onClick={onFallback}>
              Use Past View instead
            </Button>
          </div>
        ) : (
          <>
            <div className="live__overlay" style={{ opacity: cam === "live" ? blend : 1 }}>
              <FramedImage image={era.image} className="live__photo" eager />
            </div>
            <div className="live__panel">
              <p className="live__label">
                <Tag tone="demo">Preview</Tag> Not tracked AR: the photograph stays still. Hold your phone up and line it up with the street yourself.
              </p>
              <label className="live__blend">
                <span>Present</span>
                <input type="range" min={0.15} max={1} step={0.01} value={blend} onChange={(e) => setBlend(Number(e.target.value))} aria-label="Blend between the camera and the old photograph" />
                <span>Past</span>
              </label>
              <EraTimeline eras={historical} value={era.id} onChange={onEra} tone="dark" />
              {cam === "requesting" && <p className="muted-light">Waiting for camera permission…</p>}
            </div>
          </>
        )}
      </div>
    </Immersive>
  );
}
