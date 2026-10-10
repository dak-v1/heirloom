import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { Era, ImageAsset, Site } from "../../content/types";
import { getSources } from "../../content/sources";
import { IMAGE_KIND_LABEL } from "../../content/media";
import { Sheet } from "../../components/Sheet";
import { Button } from "../../components/Button";
import { Tag } from "../../components/Media";
import { hotspotKey } from "./ImageStage";

export function HotspotSheet({
  era,
  hotspotId,
  onClose,
  onNavigate,
}: {
  era: Era;
  hotspotId: string | null;
  onClose: () => void;
  onNavigate: (hotspotId: string) => void;
}) {
  const i = era.hotspots.findIndex((h) => h.id === hotspotId);
  const h = era.hotspots[i];
  if (!h) return null;
  const sources = getSources(h.sourceIds);
  const prev = era.hotspots[i - 1];
  const next = era.hotspots[i + 1];
  return (
    <Sheet
      open
      onClose={onClose}
      title={h.title}
      footer={
        <div className="hotspot-nav">
          <Button variant="ghost" icon={<ChevronLeft size={18} />} disabled={!prev} onClick={() => prev && onNavigate(prev.id)}>
            Previous
          </Button>
          <span className="muted" aria-live="polite">
            {i + 1} of {era.hotspots.length}
          </span>
          <Button variant="ghost" iconRight={<ChevronRight size={18} />} disabled={!next} onClick={() => next && onNavigate(next.id)}>
            Next
          </Button>
        </div>
      }
    >
      <p style={{ marginBottom: 12 }}>
        <Tag tone={h.kind === "fact" ? "olive" : "mustard"}>{h.kind === "fact" ? "Sourced fact" : "What you can see"}</Tag>{" "}
        <span className="muted">
          {era.label} · {h.label}
        </span>
      </p>
      <p className="hotspot-body">{h.body}</p>
      {sources.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <h3 className="label">Source</h3>
          <ul className="source-list">
            {sources.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.title} <ExternalLink size={13} aria-hidden="true" />
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
                <span className="muted"> · {s.publisher}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted" style={{ marginTop: 16 }}>
          An observation about this photograph, not a sourced historical claim.
        </p>
      )}
    </Sheet>
  );
}

export function ImageCredit({ image }: { image: ImageAsset }) {
  const c = image.credit;
  return (
    <dl className="credit">
      <div>
        <dt>Type</dt>
        <dd>{IMAGE_KIND_LABEL[image.kind]}</dd>
      </div>
      <div>
        <dt>Date</dt>
        <dd>
          {image.dateLabel}
          <span className="muted"> · {image.dateBasis}</span>
        </dd>
      </div>
      <div>
        <dt>Archive title</dt>
        <dd>{c.title}</dd>
      </div>
      <div>
        <dt>Photographer</dt>
        <dd>{c.creator}</dd>
      </div>
      <div>
        <dt>Held by</dt>
        <dd>{c.collection}</dd>
      </div>
      <div>
        <dt>Licence</dt>
        <dd>
          {c.licenseUrl ? (
            <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer">
              {c.license}
            </a>
          ) : (
            c.license
          )}{" "}
          ·{" "}
          <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">
            File page
          </a>
        </dd>
      </div>
      {image.limitations && (
        <div>
          <dt>Limitations</dt>
          <dd>{image.limitations}</dd>
        </div>
      )}
    </dl>
  );
}

export function SourcesSheet({ open, onClose, site, era }: { open: boolean; onClose: () => void; site: Site; era: Era }) {
  return (
    <Sheet open={open} onClose={onClose} title="About this view" size="tall">
      <h3 className="label">This photograph</h3>
      <ImageCredit image={era.image} />
      <p className="muted" style={{ marginTop: 8 }}>
        Archival dates are given only as precisely as the holding archive records them. Heirloom does not create AI images of the past; every historical view here is a real photograph.
      </p>
      <h3 className="label" style={{ marginTop: 20 }}>
        Details in this view
      </h3>
      <ol className="detail-list">
        {era.hotspots.map((h) => (
          <li key={hotspotKey(era.id, h.id)}>
            <strong>{h.label}.</strong> {h.body}
          </li>
        ))}
      </ol>
      <h3 className="label" style={{ marginTop: 20 }}>
        Sources for {site.name}
      </h3>
      <ul className="source-list">
        {getSources(site.sourceIds).map((s) => (
          <li key={s.id}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.title}
            </a>
            <span className="muted"> · {s.publisher}</span>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

/** Text alternative to tapping markers: every detail in every era, as a list. */
export function DetailsListSheet({ open, onClose, site, openedKeys, onOpen }: { open: boolean; onClose: () => void; site: Site; openedKeys: string[]; onOpen: (eraId: string, hotspotId: string) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Details to discover" size="tall">
      {site.eras.map((era) => (
        <section key={era.id} style={{ marginBottom: 18 }}>
          <h3 className="label">{era.isToday ? `Today (${era.image.dateLabel})` : era.label}</h3>
          <ul className="details-index">
            {era.hotspots.map((h, i) => {
              const seen = openedKeys.includes(hotspotKey(era.id, h.id));
              return (
                <li key={h.id}>
                  <button type="button" onClick={() => onOpen(era.id, h.id)}>
                    <span className={`details-index__n${seen ? " is-seen" : ""}`} aria-hidden="true">
                      {i + 1}
                    </span>
                    <span>
                      <strong>{h.label}</strong>
                      <span className="muted"> · {h.title}</span>
                    </span>
                    {seen && <span className="visually-hidden"> (seen)</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </Sheet>
  );
}
