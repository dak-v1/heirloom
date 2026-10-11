import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowRight, BookOpen, List, LocateFixed, Map as MapIcon, MapPin, Navigation, PersonStanding, X } from "lucide-react";
import { SITES, findSite } from "../../content/sites";
import { Button, ButtonA, IconButton } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { Tag } from "../../components/Media";
import { formatDistance } from "../../services/arrival";
import { useProgress } from "../../state/progress";
import { useProfile } from "../../state/profile";
import { findAvatar } from "../../content/avatars";
import { DEMO_PLACES, type DemoPlace } from "../../content/demo-stamps";
import { STATUS_LABEL, useGeo } from "../location/geo-context";
import { directionsUrl } from "../completion/Completion";
import { LeafletMap } from "./LeafletMap";
import "./map.css";

export function MapPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const geo = useGeo();
  const p = useProgress();
  const me = useProfile();
  const [tilesFailed, setTilesFailed] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const mode = params.get("view") === "list" || tilesFailed ? "list" : "map";
  const selected = findSite(params.get("site"));
  const selectedDemo = DEMO_PLACES.find((d) => d.id === params.get("site"));
  const visited = useMemo(() => new Set(p.earnedStamps.map((s) => s.siteId)), [p.earnedStamps]);

  useEffect(() => {
    document.title = "Map · Heirloom";
  }, []);

  const select = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("site", id);
    else next.delete("site");
    setParams(next, { replace: true });
  };
  const setMode = (m: "map" | "list") => {
    const next = new URLSearchParams(params);
    if (m === "list") next.set("view", "list");
    else next.delete("view");
    setParams(next, { replace: true });
  };
  const imHere = (slug: string) => navigate(`/tour/${slug}`, { state: { arrival: "manual" } });
  const locOn = geo.status === "active" || geo.status === "approximate";

  return (
    <div className={`mappage mappage--${mode}`}>
      <div className="mappage__bar">
        <div className="seg" role="tablist" aria-label="View">
          <button type="button" role="tab" aria-selected={mode === "map"} onClick={() => setMode("map")} disabled={tilesFailed}>
            <MapIcon size={16} aria-hidden="true" /> Map
          </button>
          <button type="button" role="tab" aria-selected={mode === "list"} onClick={() => setMode("list")}>
            <List size={16} aria-hidden="true" /> List
          </button>
        </div>
        <Button variant={locOn ? "secondary" : "primary"} size="sm" icon={<LocateFixed size={16} />} onClick={locOn ? geo.checkAgain : geo.start} disabled={geo.status === "requesting"}>
          {geo.status === "requesting" ? "Locating…" : locOn ? "Check again" : "Find nearby"}
        </Button>
      </div>

      <div className="mappage__status" role="status">
        <span className={`loc-dot loc-dot--${geo.status}`} aria-hidden="true" />
        <span>
          {STATUS_LABEL[geo.status]}
          {geo.fix && locOn && ` · ±${Math.round(geo.fix.accuracy)} m`}
          {geo.nearest && locOn && ` · nearest: ${geo.nearest.site.name}, ${formatDistance(geo.nearest.distance)}`}
        </span>
        <button type="button" className="link-btn mappage__demo" onClick={() => setDemoOpen(true)}>
          Demo: simulate arrival
        </button>
      </div>
      {geo.message && <p className="notice notice--warn mappage__msg">{geo.message}</p>}
      {tilesFailed && <p className="notice mappage__msg">Map tiles couldn't load (you may be offline), so here's the list instead. Every place works from here too.</p>}

      {mode === "map" ? (
        <div className="mappage__map">
          <LeafletMap sites={SITES} demoPlaces={DEMO_PLACES} selectedId={selected?.id ?? selectedDemo?.id ?? null} visited={visited} onSelect={select} fix={locOn ? geo.fix : null} meArt={findAvatar(me.avatar).art} onTilesFailed={() => setTilesFailed(true)} />
          {selected ? (
            <section className="map-panel card" aria-labelledby="map-panel-h">
              <IconButton label="Close place details" className="map-panel__close" onClick={() => select(null)}>
                <X size={20} />
              </IconButton>
              <div className="map-panel__head">
                <img src={selected.stamp.art} alt="" />
                <div>
                  <p className="label">{selected.area}</p>
                  <h2 id="map-panel-h">{selected.name}</h2>
                  <p className="muted map-panel__meta">
                    {visited.has(selected.id) && <Tag tone="olive">Stamp earned</Tag>}{" "}
                    {geo.distanceTo(selected) !== null && formatDistance(geo.distanceTo(selected)!)}
                  </p>
                </div>
              </div>
              <p className="map-panel__summary">{selected.summary}</p>
              <div className="map-panel__actions">
                <Button ticket icon={<PersonStanding size={18} />} onClick={() => imHere(selected.slug)}>
                  I'm here
                </Button>
                <Button variant="secondary" iconRight={<ArrowRight size={16} />} onClick={() => navigate(`/tour/${selected.slug}`)}>
                  Explore
                </Button>
                <ButtonA variant="ghost" href={directionsUrl(selected)} icon={<Navigation size={16} />}>
                  Directions
                </ButtonA>
              </div>
            </section>
          ) : selectedDemo ? (
            <DemoPanel place={selectedDemo} collected={visited.has(selectedDemo.id)} onClose={() => select(null)} onPassport={() => navigate("/passport")} />
          ) : (
            <p className="map-hint">
              <MapPin size={16} aria-hidden="true" /> Tap a stamp to see the place, or switch to the list.
            </p>
          )}
        </div>
      ) : (
        <div className="page mappage__list">
          <ol className="placelist">
            {SITES.map((s, i) => {
              const d = geo.distanceTo(s);
              return (
                <li key={s.id} className="placelist__item card">
                  <div className="placelist__head">
                    <img src={s.stamp.art} alt="" />
                    <div>
                      <p className="label">
                        No. {i + 1} · {s.area}
                      </p>
                      <h2>{s.name}</h2>
                      <p className="muted">
                        {s.address}
                        {d !== null && ` · ${formatDistance(d)}`}
                      </p>
                      {visited.has(s.id) && <Tag tone="olive">Stamp earned</Tag>}
                    </div>
                  </div>
                  <p className="placelist__summary">{s.summary}</p>
                  <div className="map-panel__actions">
                    <Button ticket icon={<PersonStanding size={18} />} onClick={() => imHere(s.slug)}>
                      I'm here
                    </Button>
                    <Button variant="secondary" onClick={() => navigate(`/tour/${s.slug}`)} iconRight={<ArrowRight size={16} />}>
                      Explore
                    </Button>
                    <ButtonA variant="ghost" href={directionsUrl(s)} icon={<Navigation size={16} />}>
                      Directions
                    </ButtonA>
                  </div>
                </li>
              );
            })}
          </ol>
          <h2 className="placelist__more">
            More stamps <Tag tone="demo">Demo</Tag>
          </h2>
          <p className="muted placelist__more-note">Placeholder stamps that fill the passport for demos. They aren't on the trail yet, so there's no visit to explore.</p>
          <ul className="placelist placelist--demo">
            {DEMO_PLACES.map((d) => (
              <li key={d.id} className="placelist__item placelist__item--demo card card--flat">
                <img src={d.stamp.art} alt="" />
                <div>
                  <p className="label">{d.area}</p>
                  <h3>{d.name}</h3>
                  <p className="muted">{d.note}</p>
                  {visited.has(d.id) && <Tag tone="olive">In your passport</Tag>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Sheet open={demoOpen} onClose={() => setDemoOpen(false)} title="Demo: simulate arrival">
        <p className="notice notice--demo">
          <Tag tone="demo">Demo</Tag>
          <span>Pretend you've arrived at a site, to test the arrival flow away from Singapore. It's clearly labelled and never uses or changes your real location.</span>
        </p>
        <div className="demo-list">
          {SITES.map((s) => (
            <Button
              key={s.id}
              variant="blue"
              block
              onClick={() => {
                setDemoOpen(false);
                geo.simulateArrival(s.id);
              }}
            >
              Arrive at {s.name}
            </Button>
          ))}
          <p className="label" style={{ marginTop: 8 }}>
            Imprecise readings
          </p>
          <Button
            variant="secondary"
            block
            onClick={() => {
              setDemoOpen(false);
              geo.simulateArrival("demo:chinatown-imprecise");
            }}
          >
            Between the two Chinatown sites (±140 m)
          </Button>
          <Button
            variant="secondary"
            block
            onClick={() => {
              setDemoOpen(false);
              geo.simulateArrival("demo:kampong-glam-imprecise");
            }}
          >
            Near Kampong Glam (±200 m)
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

/** Details for a placeholder demo stamp: no visit to start, but you can see where it is. */
function DemoPanel({ place, collected, onClose, onPassport }: { place: DemoPlace; collected: boolean; onClose: () => void; onPassport: () => void }) {
  return (
    <section className="map-panel card" aria-labelledby="map-panel-h">
      <IconButton label="Close place details" className="map-panel__close" onClick={onClose}>
        <X size={20} />
      </IconButton>
      <div className="map-panel__head">
        <img src={place.stamp.art} alt="" />
        <div>
          <p className="label">{place.area}</p>
          <h2 id="map-panel-h">{place.name}</h2>
          <p className="muted map-panel__meta">
            <Tag tone="demo">Demo stamp</Tag> {collected && <Tag tone="olive">In your passport</Tag>}
          </p>
        </div>
      </div>
      <p className="map-panel__summary">
        {place.note} It's a placeholder stamp for demos and isn't on the trail yet.
      </p>
      <div className="map-panel__actions">
        {collected && (
          <Button variant="secondary" icon={<BookOpen size={16} />} onClick={onPassport}>
            See it in my passport
          </Button>
        )}
        <ButtonA variant="ghost" href={`https://www.google.com/maps/dir/?api=1&destination=${place.coords.lat},${place.coords.lng}&travelmode=walking`} icon={<Navigation size={16} />}>
          Directions
        </ButtonA>
      </div>
    </section>
  );
}
