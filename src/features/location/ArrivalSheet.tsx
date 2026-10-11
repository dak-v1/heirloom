import { useNavigate } from "react-router";
import { MapPin, Navigation } from "lucide-react";
import { Sheet } from "../../components/Sheet";
import { Button } from "../../components/Button";
import { Tag } from "../../components/Media";
import { findSite } from "../../content/sites";
import { formatDistance } from "../../services/arrival";
import { useGeo } from "./geo-context";
import "./arrival.css";

/**
 * The compact "You're near…" prompt. It never opens a site or plays sound on its
 * own: the visitor confirms with "Explore this place" or dismisses with "Not now".
 */
export function ArrivalSheet() {
  const { suggestion, dismissSuggestion, clearSuggestion } = useGeo();
  const navigate = useNavigate();
  if (!suggestion) return null;

  const sites = suggestion.candidates.map((c) => ({ c, site: findSite(c.siteId)! })).filter((x) => x.site);
  const go = (slug: string) => {
    clearSuggestion();
    navigate(`/tour/${slug}${suggestion.simulated ? "?demo=1" : ""}`, { state: { arrival: suggestion.simulated ? "simulated" : "location" } });
  };
  const primary = sites[0]?.site;

  const title =
    suggestion.kind === "arrived" ? `You're near ${primary?.name}` : suggestion.kind === "approximate" ? `Are you at ${primary?.name}?` : "A few places are nearby";

  return (
    <Sheet open onClose={dismissSuggestion} title={title} closeLabel="Not now" className="arrival-sheet">
      {suggestion.simulated && (
        <p className="notice notice--demo" style={{ marginBottom: 12 }}>
          <Tag tone="demo">Demo</Tag>
          <span>Simulated arrival for demonstration. This did not use your real location.</span>
        </p>
      )}

      {suggestion.kind === "multiple" ? (
        <>
          <p className="muted">Your position fits more than one place. Which one are you at?</p>
          <ul className="arrival-choices">
            {sites.map(({ c, site }) => (
              <li key={site.id}>
                <button type="button" className="arrival-choice" onClick={() => go(site.slug)}>
                  <img src={site.eras.find((era) => era.isToday)?.image.srcSmall ?? site.eras.find((era) => era.isToday)?.image.src} alt="" width={64} height={54} />
                  <span>
                    <strong>{site.name}</strong>
                    <span className="muted">
                      {site.area}
                      {!suggestion.simulated && ` · ${formatDistance(c.distance)}`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Button variant="ghost" block onClick={dismissSuggestion}>
            None of these
          </Button>
        </>
      ) : (
        primary && (
          <div className="arrival-one">
            <img className="arrival-one__photo" src={primary.eras.find((era) => era.isToday)?.image.srcSmall ?? primary.eras.find((era) => era.isToday)?.image.src} alt={primary.eras.find((era) => era.isToday)?.image.alt ?? `${primary.name} today`} />
            <div>
              <p className="lede" style={{ fontSize: "var(--text-md)" }}>{primary.summary}</p>
              <p className="arrival-one__meta">
                <MapPin size={16} aria-hidden="true" /> {primary.area}
                {!suggestion.simulated && (
                  <>
                    {" · "}
                    <Navigation size={14} aria-hidden="true" /> accuracy ±{Math.round(suggestion.accuracy)} m
                  </>
                )}
              </p>
            </div>
          </div>
        )
      )}

      {suggestion.kind !== "multiple" && primary && (
        <div className="arrival-actions">
          <Button size="lg" ticket block onClick={() => go(primary.slug)}>
            {suggestion.kind === "approximate" ? "Yes, I'm here · Explore in 3D" : "Explore in 3D"}
          </Button>
          <Button variant="ghost" block onClick={dismissSuggestion}>
            Not now
          </Button>
        </div>
      )}
    </Sheet>
  );
}
