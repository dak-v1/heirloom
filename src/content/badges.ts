import type { BadgeDef } from "./types";

/** Bonus badges reward curiosity. They never gate a site stamp. */
export const BADGES: BadgeDef[] = [
  {
    id: "first-footsteps",
    name: "First Footsteps",
    description: "You finished your first heritage visit.",
    howToEarn: "Finish exploring any site.",
    art: "/assets/badges/first-footsteps.svg",
  },
  {
    id: "time-traveller",
    name: "Time Traveller",
    description: "You dated every photograph in a Guess the Year game.",
    howToEarn: "Complete a Guess the Year game at any site.",
    art: "/assets/badges/time-traveller.svg",
  },
  {
    id: "sharp-eye",
    name: "Sharp Eye",
    description: "Every guess in one game landed inside the documented date range.",
    howToEarn: "Get every round of one Guess the Year game spot on.",
    art: "/assets/badges/sharp-eye.svg",
  },
  {
    id: "good-listener",
    name: "Good Listener",
    description: "You listened to a whole story from start to finish.",
    howToEarn: "Play a site's narration to the end.",
    art: "/assets/badges/good-listener.svg",
  },
  {
    id: "curious-mind",
    name: "Curious Mind",
    description: "You opened every detail hidden in a site's photographs.",
    howToEarn: "Open every hotspot, in every era, at one site.",
    art: "/assets/badges/curious-mind.svg",
  },
  {
    id: "many-tongues",
    name: "Many Tongues",
    description: "You explored a story in more than one language.",
    howToEarn: "Switch a story to another available language.",
    art: "/assets/badges/many-tongues.svg",
  },
  {
    id: "three-journeys",
    name: "Three Journeys",
    description: "Different journeys, same home: you visited every site on the trail.",
    howToEarn: "Finish all three curated sites.",
    art: "/assets/badges/three-journeys.svg",
  },
  {
    id: "memory-keeper",
    name: "Memory Keeper",
    description: "You left a note or drawing for future visitors.",
    howToEarn: "Leave a note or drawing at any site.",
    art: "/assets/badges/memory-keeper.svg",
  },
];

export const BADGE_BY_ID = new Map(BADGES.map((b) => [b.id, b]));
