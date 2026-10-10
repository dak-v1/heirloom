import { Link } from "react-router";
import { Check } from "lucide-react";
import type { Site } from "../../content/types";
import { formatDistance } from "../../services/arrival";

/** Postage-stamp style card for a curated site. */
export function SiteCard({ site, index, distance, visited, started }: { site: Site; index: number; distance: number | null; visited: boolean; started: boolean }) {
  const today = site.eras.find((e) => e.isToday)!;
  return (
    <Link to={`/site/${site.slug}`} className={`site-card site-card--${site.accent}`} style={{ "--tilt": `${[-1.2, 0.8, -0.5][index % 3]}deg` } as React.CSSProperties}>
      <span className="site-card__frame perforated">
        <img src={today.image.srcSmall ?? today.image.src} alt="" loading="lazy" referrerPolicy="no-referrer" />
        <span className="site-card__no" aria-hidden="true">
          No. {String(index + 1).padStart(2, "0")}
        </span>
      </span>
      <span className="site-card__text">
        <strong>{site.name}</strong>
        <span className="site-card__local" lang={site.localName.lang}>
          {site.localName.text}
        </span>
        <span className="muted site-card__meta">
          {site.area}
          {distance !== null && ` · ${formatDistance(distance)}`}
        </span>
        <span className="site-card__tagline">{site.tagline}</span>
      </span>
      {visited ? (
        <span className="site-card__status is-visited">
          <Check size={14} strokeWidth={3} aria-hidden="true" /> Stamp earned
        </span>
      ) : started ? (
        <span className="site-card__status">In progress</span>
      ) : null}
    </Link>
  );
}
