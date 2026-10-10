import { useEffect, useState, type CSSProperties, type PointerEvent } from "react";
import { BADGE_BY_ID } from "../../content/badges";
import { Tag } from "../../components/Media";
import { Sheet } from "../../components/Sheet";
import { useReducedMotion } from "../../state/preferences";
import { useProgress } from "../../state/progress";
import { profile } from "../../state/profile";

const REST = { rx: -4, ry: 8, gx: 32 };

function earnedOn(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

/** A badge up close: the pin tilts toward your finger to catch the light, with what it shows and how it's earned. */
export function BadgeCloseup({ id, onClose }: { id: string | null; onClose: () => void }) {
  const p = useProgress();
  const reduced = useReducedMotion();
  const badge = id ? BADGE_BY_ID.get(id) : undefined;
  const earned = badge ? p.badges[badge.id] : undefined;
  const [tilt, setTilt] = useState(REST);

  useEffect(() => {
    setTilt(REST);
    if (id && earned) profile.markSeen(id);
  }, [id]);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) - 0.5;
    const ny = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) - 0.5;
    setTilt({ rx: -ny * 24, ry: nx * 30, gx: (nx + 0.5) * 100 });
  };

  return (
    <Sheet open={!!badge} onClose={onClose} title={badge?.name ?? "Badge"} className="closeup">
      {badge && (
        <>
          <div className={`closeup__stage${reduced ? "" : " is-live"}`} onPointerMove={onMove} onPointerLeave={() => setTilt(REST)}>
            <div
              className={`closeup__pin${earned ? "" : " is-locked"}`}
              style={{ "--rx": `${tilt.rx}deg`, "--ry": `${tilt.ry}deg`, "--gx": `${tilt.gx}%`, "--art": `url("${badge.art}")` } as CSSProperties}
            >
              <img src={badge.art} alt={`Enamel pin: ${badge.motif.toLowerCase()}${earned ? "" : ", not earned yet"}`} draggable={false} />
              {earned && <span className="closeup__sheen" aria-hidden="true" />}
            </div>
          </div>
          <p className="closeup__status">{earned ? <Tag tone="olive">Earned {earnedOn(earned.earnedAt)}</Tag> : <Tag>Not earned yet</Tag>}</p>
          <div className="closeup__text">
            <h3>What it shows</h3>
            <p>
              <strong>{badge.motif}.</strong> {badge.about}
            </p>
            <h3>{earned ? "Why it's yours" : "How to earn it"}</h3>
            <p>{earned ? badge.description : badge.howToEarn}</p>
          </div>
        </>
      )}
    </Sheet>
  );
}
