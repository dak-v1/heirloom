// Curated content model. Everything a site shows — images, eras, stories,
// hotspots, game rounds, stamp art — lives in typed data, never in components.

export type LangCode = "en" | "zh" | "ms" | "ta";

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** ISO date the source was consulted. */
  accessed: string;
}

export type ImageKind =
  | "archival-photo"
  | "archival-postcard"
  | "present-photo"
  | "illustration"
  | "reconstruction"
  | "ai-interpretation";

export interface MediaCredit {
  /** Title as given by the holding archive. */
  title: string;
  creator: string;
  /** Holding institution / collection. */
  collection: string;
  /** Page describing the file and its licence. */
  sourceUrl: string;
  license: string;
  licenseUrl?: string;
}

export interface ImageAsset {
  id: string;
  /** ~1280 px wide rendition. */
  src: string;
  /** ~640 px wide rendition for small screens / thumbnails. */
  srcSmall?: string;
  /** Pixel size of `src` (before crop) — used for aspect ratio and hotspot mapping. */
  width: number;
  height: number;
  alt: string;
  kind: ImageKind;
  /** Human date label exactly as precise as the evidence, e.g. "c. 1890", "Between 1930 and 1960". */
  dateLabel: string;
  /** Inclusive year range the archive supports. */
  dateRange: [number, number];
  /** How the date is known. */
  dateBasis: string;
  credit: MediaCredit;
  /** Normalised crop applied when displayed (e.g. to trim an album page or a handwritten date). */
  crop?: { x: number; y: number; w: number; h: number };
  limitations?: string;
}

export type HotspotKind = "fact" | "observation";

export interface Hotspot {
  id: string;
  /** Normalised centre on the displayed (cropped) image, 0–1. */
  x: number;
  y: number;
  /** Short label for the marker and list. */
  label: string;
  title: string;
  body: string;
  kind: HotspotKind;
  sourceIds: string[];
}

export interface Era {
  id: string;
  /** Short timeline label, e.g. "c. 1890" or "Today". */
  label: string;
  /** Year used to order the timeline. */
  sortYear: number;
  image: ImageAsset;
  caption: string;
  hotspots: Hotspot[];
  isToday?: boolean;
}

export type StoryStatus = "curated" | "draft-translation";

export interface StoryVersion {
  lang: LangCode;
  title: string;
  paragraphs: string[];
  status: StoryStatus;
  /** Shown with draft translations. */
  reviewNote?: string;
}

export interface Story {
  id: string;
  /** Bump when the script changes so cached narration is regenerated. */
  version: number;
  /** The story covers the site's whole history, not a single era. */
  scope: string;
  versions: Partial<Record<LangCode, StoryVersion>>;
  sourceIds: string[];
}

export type AmbientRecipe = "harbour-temple" | "street-bells" | "kampong-morning";

export interface AmbientTrack {
  id: string;
  title: string;
  description: string;
  recipe: AmbientRecipe;
}

export interface GameClue {
  label: string;
  detail: string;
}

export interface GameRound {
  id: string;
  image: ImageAsset;
  prompt: string;
  /** Inclusive accepted interval of years. */
  accept: [number, number];
  answerLabel: string;
  clues: GameClue[];
  explanation: string;
}

export interface GuessTheYearGame {
  id: string;
  type: "guess-the-year";
  title: string;
  intro: string;
  range: [number, number];
  rounds: GameRound[];
}

export interface StampDesign {
  id: string;
  /** Full-colour perforated postage stamp. */
  art: string;
  /** Single-colour rubber-stamp impression for the passport page. */
  inkArt: string;
  ink: string;
  alt: string;
  /** Normalised band on `inkArt` where the visit date is printed. */
  dateBand: { x: number; y: number; w: number; h: number };
}

export interface LocalName {
  text: string;
  lang: string;
  script: string;
  /** Romanisation / meaning, read aloud by screen readers. */
  gloss: string;
}

export interface Site {
  id: string;
  slug: string;
  name: string;
  localName: LocalName;
  area: string;
  address: string;
  coords: { lat: number; lng: number };
  /** Metres. Tuned per site; see docs/HANDOFF.md. */
  arrivalRadius: number;
  tagline: string;
  summary: string;
  visitNote: string;
  accent: "terracotta" | "blue" | "olive";
  eras: Era[];
  story: Story;
  ambient: AmbientTrack[];
  game: GuessTheYearGame;
  stamp: StampDesign;
  nextSiteId: string;
  sourceIds: string[];
  published: boolean;
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  howToEarn: string;
  art: string;
  /** Not yet earnable in this build (feature lands in a later stage). */
  comingSoon?: boolean;
}
