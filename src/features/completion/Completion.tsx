import { useNavigate } from "react-router";
import { ArrowRight, Map as MapIcon, Navigation } from "lucide-react";
import type { Site } from "../../content/types";
import { findSite } from "../../content/sites";
import { BADGE_BY_ID } from "../../content/badges";
import { formatDistance } from "../../services/arrival";
import type { EarnResult } from "../../services/progress";
import { Button, ButtonA, ButtonLink } from "../../components/Button";
import { StampArt } from "../../components/Media";
import { useReducedMotion } from "../../state/preferences";
import { progress } from "../../state/progress";
import { useGeo } from "../location/geo-context";
import { Immersive } from "../site/PastView";

export function formatVisitDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

export function directionsUrl(site: Site) {
  return `https://www.google.com/maps/dir/?api=1&destination=${site.coords.lat},${site.coords.lng}&travelmode=walking`;
}

/** Reward moment after "I've finished exploring". Earning and placing stay separate. */
export function StampReward({ site, result, onPlaceLater }: { site: Site; result: EarnResult; onPlaceLater: () => void }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const badges = result.newBadges.map((id) => BADGE_BY_ID.get(id)).filter((b) => !!b);
  // Already placed (a repeat visit): show it where it is rather than picking it up to move it.
  const placed = progress.getPassportPlacements().find((p) => p.earnedStampId === result.stamp.id);
  const openPassport = () => {
    if (placed) {
      progress.setCurrentPassportPage(placed.pageId);
      navigate("/passport?book=1");
    } else navigate(`/passport?place=${encodeURIComponent(result.stamp.id)}`);
  };
  return (
    <Immersive label="Stamp earned" onClose={onPlaceLater}>
      <div className={`reward${reduced ? " reward--still" : ""}`}>
        <img className="reward__postmark" src="/assets/decor/postmark-terracotta.svg" alt="" aria-hidden="true" />
        <p className="kicker">{result.isNew ? "Stamp earned" : "Already in your passport"}</p>
        <div className="reward__stamp">
          <span className="reward__ink" aria-hidden="true" />
          <StampArt src={site.stamp.art} alt={site.stamp.alt} tilt={-4} />
        </div>
        <h2 className="reward__title">{site.name}</h2>
        <p className="reward__meta">
          Visited {formatVisitDate(result.stamp.visitDate)}
          {!result.isNew && " · you collected this stamp earlier, so no duplicate was added"}
        </p>
        {badges.length > 0 && (
          <ul className="reward__badges" aria-label="Badges earned">
            {badges.map((b) => (
              <li key={b.id}>
                <img src={b.art} alt="" width={64} height={64} />
                <span>{b.name}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="reward__actions">
          <Button size="lg" ticket block onClick={openPassport}>
            {placed ? "See it in my passport" : "Stamp my passport"}
          </Button>
          <Button variant="secondary" block onClick={onPlaceLater}>
            {placed ? "Back to this place" : "Place later"}
          </Button>
        </div>
        <p className="reward__note">{placed ? "It's already pressed into your passport. Saved in this browser." : "Your stamp waits in the stamp tray until you place it. Saved in this browser."}</p>
      </div>
    </Immersive>
  );
}

export function NextSiteCard({ site, heading = "Next on the trail" }: { site: Site; heading?: string }) {
  const next = findSite(site.nextSiteId);
  const { distanceTo } = useGeo();
  if (!next) return null;
  const d = distanceTo(next);
  return (
    <section className="next-site card card--tape" aria-labelledby="next-site-h">
      <p className="label">{heading}</p>
      <div className="next-site__body">
        <img className="next-site__stamp" src={next.stamp.art} alt="" />
        <div>
          <h3 id="next-site-h">{next.name}</h3>
          <p className="muted">
            {next.area}
            {d !== null && ` · ${formatDistance(d)}`}
          </p>
          <p className="next-site__tagline">{next.tagline}</p>
        </div>
      </div>
      <div className="next-site__actions">
        <ButtonLink to={`/tour/${next.slug}`} iconRight={<ArrowRight size={18} />}>
          Explore {next.name}
        </ButtonLink>
        <ButtonA variant="secondary" href={directionsUrl(next)} icon={<Navigation size={16} />}>
          Directions
        </ButtonA>
        <ButtonLink variant="ghost" to="/map" icon={<MapIcon size={16} />}>
          Map
        </ButtonLink>
      </div>
    </section>
  );
}
