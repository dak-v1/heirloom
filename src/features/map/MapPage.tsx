import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowRight, List, LocateFixed, Map as MapIcon, MapPin, Navigation, PersonStanding, X } from "lucide-react";
import { SITES, findSite } from "../../content/sites";
import { Button, ButtonA, IconButton } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { Tag } from "../../components/Media";
import { formatDistance } from "../../services/arrival";
import { useProgress } from "../../state/progress";
import { useProfile } from "../../state/profile";
import { findAvatar } from "../../content/avatars";
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
  const imHere = (slug: string) => navigate(`/site/${slug}`, { state: { arrival: "manual" } });
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
          <LeafletMap sites={SITES} selectedId={selected?.id ?? null} visited={visited} onSelect={select} fix={locOn ? geo.fix : null} meArt={findAvatar(me.avatar).art} onTilesFailed={() => setTilesFailed(true)} />
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
                <Button variant="secondary" iconRight={<ArrowRight size={16} />} onClick={() => navigate(`/site/${selected.slug}`)}>
                  Explore
                </Button>
                <ButtonA variant="ghost" href={directionsUrl(selected)} icon={<Navigation size={16} />}>
                  Directions
                </ButtonA>
              </div>
            </section>
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
                    <Button variant="secondary" onClick={() => navigate(`/site/${s.slug}`)} iconRight={<ArrowRight size={16} />}>
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
