import type { StampPlace } from "./types";

/** A demo stamp's place on the map (approximate), with a one-line note. */
export interface DemoPlace extends StampPlace {
  area: string;
  coords: { lat: number; lng: number };
  note: string;
}

/**
 * Placeholder stamps for demos, so a passport can look well travelled before
 * anyone has walked the trail. They aren't trail sites (no visit page, no badges)
 * and every one is labelled "Demo stamp". Art: scripts/assets/lib/demo-landmarks.mjs.
 */
const demo = (slug: string, name: string, ink: string, alt: string, area: string, lat: number, lng: number, note: string): DemoPlace => ({
  id: `demo-${slug}`,
  slug,
  name,
  demo: true,
  area,
  coords: { lat, lng },
  note,
  stamp: {
    id: `stamp-demo-${slug}`,
    art: `/assets/stamps/demo/${slug}.svg`,
    inkArt: `/assets/stamps/demo/${slug}-ink.svg`,
    ink,
    alt: `Demo stamp: ${alt}`,
    dateBand: { x: 0.233, y: 0.868, w: 0.533, h: 0.053 },
  },
});

export const DEMO_PLACES: DemoPlace[] = [
  demo("lau-pa-sat", "Lau Pa Sat", "#5E4718", "the octagonal market hall and clock tower of Lau Pa Sat", "Raffles Quay", 1.2806, 103.8504, "A Victorian cast-iron market hall, now a hawker centre among the office towers."),
  demo("cavenagh-bridge", "Cavenagh Bridge", "#22463F", "Cavenagh Bridge, a suspension bridge over the Singapore River", "Singapore River", 1.2865, 103.8521, "One of the oldest bridges over the Singapore River, open since 1869."),
  demo("fort-canning", "Fort Canning", "#3C4931", "the Fort Gate on Fort Canning Hill, with a cannon", "Fort Canning Park", 1.2938, 103.8466, "The hill once called Bukit Larangan, with the old Fort Gate on its slope."),
  demo("hill-street", "Old Hill Street Police Station", "#4B2C3E", "the many coloured window shutters of the old Hill Street police station", "Hill Street", 1.2899, 103.8493, "The old police station known for its rainbow of window shutters."),
  demo("koon-seng-road", "Koon Seng Road", "#6F2E1F", "a pair of Peranakan terrace houses on Koon Seng Road", "Joo Chiat", 1.3127, 103.902, "Pastel Peranakan terrace houses with ornate tiles and plasterwork."),
  demo("kampong-buangkok", "Kampong Lorong Buangkok", "#3C4931", "a zinc-roofed kampung house and a coconut palm", "Lorong Buangkok", 1.381, 103.8807, "Often called mainland Singapore's last kampung."),
  demo("armenian-church", "Armenian Church", "#334C69", "the portico and spire of the Armenian Church", "Hill Street", 1.2932, 103.8497, "Often called Singapore's oldest church, completed in the 1830s."),
  demo("tanjong-pagar-station", "Tanjong Pagar Railway Station", "#22463F", "the art deco front of Tanjong Pagar Railway Station", "Keppel Road", 1.2734, 103.8379, "The art deco terminus of the old Malayan railway."),
  demo("victoria-concert-hall", "Victoria Concert Hall", "#5E4718", "the clock tower of Victoria Concert Hall", "Empress Place", 1.2878, 103.8516, "A colonial hall and clock tower by the river at Empress Place."),
  demo("merlion-park", "Merlion Park", "#4B2C3E", "the Merlion spouting water into the bay", "Marina Bay", 1.2868, 103.8545, "Where the Merlion spouts into Marina Bay."),
];

export const DEMO_PLACE_IDS = new Set(DEMO_PLACES.map((d) => d.id));

export const isDemoStamp = (siteId: string) => DEMO_PLACE_IDS.has(siteId);
