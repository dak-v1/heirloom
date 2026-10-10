import type { Source } from "./types";

const ACCESSED = "2026-10-10";

/** Every factual claim in stories and hotspots points at one or more of these. */
export const SOURCES: Record<string, Source> = {
  "roots-thk": {
    id: "roots-thk",
    title: "Thian Hock Keng",
    publisher: "Roots.sg, National Heritage Board",
    url: "https://roots.gov.sg/places/places-landing/Places/national-monuments/thian-hock-keng",
    accessed: ACCESSED,
  },
  "infopedia-thk": {
    id: "infopedia-thk",
    title: "Thian Hock Keng",
    publisher: "Singapore Infopedia, National Library Board",
    url: "https://eresources.nlb.gov.sg/infopedia/articles/SIP_793_2005-01-10.html",
    accessed: ACCESSED,
  },
  "biblioasia-reclamation": {
    id: "biblioasia-reclamation",
    title: "Land From Sand: Singapore's Reclamation Story (Lim Tin Seng, 2017)",
    publisher: "BiblioAsia, National Library Board",
    url: "https://biblioasia.nlb.gov.sg/vol-13/issue-1/apr-jun-2017/land-from-sand/",
    accessed: ACCESSED,
  },
  "roots-smt": {
    id: "roots-smt",
    title: "Sri Mariamman Temple",
    publisher: "Roots.sg, National Heritage Board",
    url: "https://www.roots.gov.sg/places/places-landing/Places/national-monuments/sri-mariamman-temple",
    accessed: ACCESSED,
  },
  "biblioasia-temple-design": {
    id: "biblioasia-temple-design",
    title: "Time-honoured Temple Design",
    publisher: "BiblioAsia, National Library Board",
    url: "https://biblioasia.nlb.gov.sg/vol-12/issue-3/oct-dec-2016/time-honoured-temple",
    accessed: ACCESSED,
  },
  "roots-jamae": {
    id: "roots-jamae",
    title: "Jamae Mosque",
    publisher: "Roots.sg, National Heritage Board",
    url: "https://www.roots.gov.sg/places/places-landing/Places/national-monuments/jamae-mosque",
    accessed: ACCESSED,
  },
  "sgmd-chinatown": {
    id: "sgmd-chinatown",
    title: "牛车水 (Chinatown)",
    publisher: "Singaporean Mandarin Database, Promote Mandarin Council",
    url: "https://languagecouncils.sg/mandarin/en/learning-resources/singaporean-mandarin-database/terms/chinatown",
    accessed: ACCESSED,
  },
  "roots-sultan": {
    id: "roots-sultan",
    title: "Sultan Mosque",
    publisher: "Roots.sg, National Heritage Board",
    url: "https://www.roots.gov.sg/places/places-landing/Places/national-monuments/sultan-mosque",
    accessed: ACCESSED,
  },
  "roots-sultan-collection": {
    id: "roots-sultan-collection",
    title: "The Sultan Mosque (collection record noting its 1975 gazettal)",
    publisher: "Roots.sg, National Heritage Board",
    url: "https://roots.gov.sg/Collection-Landing/listing/1192186",
    accessed: ACCESSED,
  },
  "infopedia-sultan": {
    id: "infopedia-sultan",
    title: "Sultan Mosque",
    publisher: "Singapore Infopedia, National Library Board",
    url: "https://eresources.nlb.gov.sg/infopedia/articles/SIP_753_2005-01-03.html",
    accessed: ACCESSED,
  },
  "infopedia-rickshaw": {
    id: "infopedia-rickshaw",
    title: "Rickshaws (article SIP_947)",
    publisher: "Singapore Infopedia, National Library Board",
    url: "https://eresources.nlb.gov.sg/infopedia/articles/SIP_947_2005-01-25.html",
    accessed: ACCESSED,
  },
  "infopedia-trishaw": {
    id: "infopedia-trishaw",
    title: "Trishaws (article SIP_932)",
    publisher: "Singapore Infopedia, National Library Board",
    url: "https://eresources.nlb.gov.sg/infopedia/articles/SIP_932_2005-01-24.html",
    accessed: ACCESSED,
  },
};

export function getSources(ids: string[]): Source[] {
  return ids.map((id) => SOURCES[id]).filter((s): s is Source => Boolean(s));
}
