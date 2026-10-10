/** The visitor's map marker: their chosen icon in a pin. Styles: .map-me in components.css. */
export function MapMe({ art, live = false }: { art: string; live?: boolean }) {
  return (
    <span className={`map-me${live ? " is-live" : ""}`}>
      <img src={art} alt="" draggable={false} />
    </span>
  );
}

/** Same marker as plain HTML, for Leaflet's divIcon. */
export const mapMeHtml = (art: string) => `<span class="map-me is-live"><img src="${encodeURI(art)}" alt=""/></span>`;
