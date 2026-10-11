import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Site } from "../../content/types";
import type { DemoPlace } from "../../content/demo-stamps";
import type { Fix } from "../../services/arrival";
import { mapMeHtml } from "../profile/MapMe";

interface Props {
  sites: Site[];
  /** Placeholder demo stamps, pinned with their stamp art. */
  demoPlaces: DemoPlace[];
  selectedId: string | null;
  visited: Set<string>;
  onSelect: (id: string) => void;
  fix: Fix | null;
  /** The visitor's chosen map icon (profile). */
  meArt: string;
  onTilesFailed: () => void;
}

const ACCENT: Record<Site["accent"], string> = { terracotta: "#A94E36", blue: "#3F5A78", olive: "#4E5A41" };

function icon(site: Site, n: number, selected: boolean, visited: boolean) {
  return L.divIcon({
    className: "pin-wrap",
    html: `<span class="pin${selected ? " is-selected" : ""}${visited ? " is-visited" : ""}" style="--pin:${ACCENT[site.accent]}"><span class="pin__stamp"><img src="${site.stamp.art}" alt=""/></span><span class="pin__n">${n}</span></span>`,
    iconSize: [52, 64],
    iconAnchor: [26, 62],
  });
}

function demoIcon(place: DemoPlace, selected: boolean, collected: boolean) {
  return L.divIcon({
    className: "pin-wrap",
    html: `<span class="pin pin--demo${selected ? " is-selected" : ""}${collected ? " is-visited" : ""}"><span class="pin__stamp"><img src="${place.stamp.art}" alt=""/></span></span>`,
    iconSize: [40, 50],
    iconAnchor: [20, 48],
  });
}

/** The visitor's position, shown with the map icon they chose on their profile. */
function meIcon(art: string) {
  return L.divIcon({ className: "map-me-wrap", html: mapMeHtml(art), iconSize: [46, 58], iconAnchor: [23, 57] });
}

/** Curated map. Tiles are decorative context; every action also exists in the list view. */
export function LeafletMap({ sites, demoPlaces, selectedId, visited, onSelect, fix, meArt, onTilesFailed }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef(new Map<string, L.Marker>());
  const me = useRef<{ dot: L.Marker; ring: L.Circle } | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const failedRef = useRef(onTilesFailed);
  failedRef.current = onTilesFailed;

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { zoomControl: false, attributionControl: true, tap: true } as L.MapOptions);
    L.control.zoom({ position: "topright" }).addTo(m);
    let errors = 0;
    // OpenStreetMap's standard tiles: no key needed, light use only (see docs/HANDOFF.md before scaling up).
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    })
      .on("tileerror", () => {
        errors++;
        if (errors === 6) failedRef.current();
      })
      .addTo(m);
    const bounds = L.latLngBounds(sites.map((s) => [s.coords.lat, s.coords.lng] as [number, number]));
    m.fitBounds(bounds.pad(0.35));
    sites.forEach((s, i) => {
      const mk = L.marker([s.coords.lat, s.coords.lng], { icon: icon(s, i + 1, false, false), title: s.name, alt: `${i + 1}. ${s.name}`, keyboard: true, riseOnHover: true })
        .on("click", () => onSelectRef.current(s.id))
        .on("keypress", (e: L.LeafletKeyboardEvent) => {
          if (e.originalEvent.key === "Enter" || e.originalEvent.key === " ") onSelectRef.current(s.id);
        })
        .addTo(m);
      markers.current.set(s.id, mk);
    });
    demoPlaces.forEach((d) => {
      const mk = L.marker([d.coords.lat, d.coords.lng], { icon: demoIcon(d, false, false), title: d.name, alt: d.name, keyboard: true, riseOnHover: true })
        .on("click", () => onSelectRef.current(d.id))
        .on("keypress", (e: L.LeafletKeyboardEvent) => {
          if (e.originalEvent.key === "Enter" || e.originalEvent.key === " ") onSelectRef.current(d.id);
        })
        .addTo(m);
      markers.current.set(d.id, mk);
    });
    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      markers.current.clear();
      me.current = null;
    };
  }, [sites, demoPlaces]);

  useEffect(() => {
    sites.forEach((s, i) => {
      const mk = markers.current.get(s.id);
      mk?.setIcon(icon(s, i + 1, s.id === selectedId, visited.has(s.id)));
      mk?.setZIndexOffset(s.id === selectedId ? 1000 : 0);
    });
    demoPlaces.forEach((d) => {
      const mk = markers.current.get(d.id);
      mk?.setIcon(demoIcon(d, d.id === selectedId, visited.has(d.id)));
      mk?.setZIndexOffset(d.id === selectedId ? 1000 : -200);
    });
    const sel = sites.find((s) => s.id === selectedId) ?? demoPlaces.find((d) => d.id === selectedId);
    if (sel && map.current) {
      // Keep the chosen marker visible above the place panel.
      const m = map.current;
      const target = m.project([sel.coords.lat, sel.coords.lng]).add([0, m.getSize().y * 0.2]);
      m.panTo(m.unproject(target), { animate: true });
    }
  }, [selectedId, sites, demoPlaces, visited]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!fix) {
      me.current?.dot.remove();
      me.current?.ring.remove();
      me.current = null;
      return;
    }
    const ll: [number, number] = [fix.lat, fix.lng];
    if (!me.current) {
      me.current = {
        ring: L.circle(ll, { radius: fix.accuracy, color: "#2f5d8a", weight: 1, fillColor: "#2f5d8a", fillOpacity: 0.12, interactive: false }).addTo(m),
        dot: L.marker(ll, { icon: meIcon(meArt), interactive: false, keyboard: false, zIndexOffset: 3000, alt: "You are here" }).addTo(m),
      };
    } else {
      me.current.ring.setLatLng(ll).setRadius(fix.accuracy);
      me.current.dot.setLatLng(ll);
    }
  }, [fix]);

  useEffect(() => {
    me.current?.dot.setIcon(meIcon(meArt));
  }, [meArt]);

  return <div ref={el} className="leaflet-host" role="region" aria-label="Map of curated heritage sites. Use the list view for the same places as text." />;
}
