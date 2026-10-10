import type { Site } from "../types";
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
