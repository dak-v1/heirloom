import { COMMONS } from "./commons";
import LOCAL from "./commons-local.json";
import type { ImageAsset, ImageKind } from "./types";

/** Local copies written by `npm run media:vendor`; empty means "hotlink from Wikimedia Commons". */
const LOCAL_COPIES = LOCAL as Record<string, { src?: string; srcSmall?: string; srcLarge?: string }>;

interface Curated {
  alt: string;
  kind: ImageKind;
  /** Title as catalogued by the archive (translated where the original is Dutch). */
  archiveTitle: string;
  dateLabel: string;
  dateRange: [number, number];
  dateBasis: string;
  crop?: ImageAsset["crop"];
  limitations?: string;
  /** Use the 1920 px rendition (for images shown cropped). */
  large?: boolean;
}

/** Combine a Commons file record with curated metadata into a displayable image. */
export function commonsImage(id: keyof typeof COMMONS & string, c: Curated): ImageAsset {
  const remote = COMMONS[id];
  if (!remote) throw new Error(`Unknown Commons image ${id}`);
  const f = { ...remote, ...LOCAL_COPIES[id] };
  const scale = c.large ? 1920 / f.width : 1;
  return {
    id,
    src: c.large ? f.srcLarge : f.src,
    srcSmall: f.srcSmall,
    width: Math.round(f.width * scale),
    height: Math.round(f.height * scale),
    alt: c.alt,
    kind: c.kind,
    dateLabel: c.dateLabel,
    dateRange: c.dateRange,
    dateBasis: c.dateBasis,
    crop: c.crop,
    limitations: c.limitations,
    credit: {
      title: c.archiveTitle,
      creator: f.creator,
      collection: f.collection,
      sourceUrl: f.page,
      license: f.license,
      licenseUrl: f.licenseUrl,
    },
  };
}

export const IMAGE_KIND_LABEL: Record<ImageKind, string> = {
  "archival-photo": "Archival photograph",
  "archival-postcard": "Archival postcard",
  "present-photo": "Present-day photograph",
  illustration: "Illustration",
  reconstruction: "Labelled reconstruction",
  "ai-interpretation": "AI interpretation",
};
