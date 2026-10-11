import type { Site, StampPlace } from "../types";
import { DEMO_PLACES } from "../demo-stamps";
import { thianHockKeng } from "./thian-hock-keng";
import { sriMariammanTemple } from "./sri-mariamman-temple";
import { sultanMosque } from "./sultan-mosque";

/** Curated demo trail, in recommended walking order. */
export const SITES: Site[] = [thianHockKeng, sriMariammanTemple, sultanMosque].filter((s) => s.published);

const byKey = new Map<string, Site>();
for (const s of SITES) {
  byKey.set(s.id, s);
  byKey.set(s.slug, s);
}

export function findSite(idOrSlug: string | undefined | null): Site | undefined {
  return idOrSlug ? byKey.get(idOrSlug) : undefined;
}

const stampPlaces = new Map<string, StampPlace>([...SITES, ...DEMO_PLACES].map((p) => [p.id, p]));

/** Whose stamp this is: a trail site or a placeholder demo stamp. Use for anything in the passport. */
export function findStampPlace(id: string | undefined | null): StampPlace | undefined {
  return id ? stampPlaces.get(id) : undefined;
}
