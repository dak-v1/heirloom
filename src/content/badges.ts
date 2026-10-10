import type { BadgeDef } from "./types";

/** Bonus badges reward curiosity. They never gate a site stamp. */
export const BADGES: BadgeDef[] = [
  {
    id: "first-footsteps",
    name: "First Footsteps",
    description: "You finished your first heritage visit.",
    howToEarn: "Finish exploring any site.",
    art: "/assets/badges/first-footsteps.svg",
    motif: "A shophouse and its five-foot way",
    about: "Shophouses line the old streets of Chinatown and Kampong Glam. The covered walkway in front, the five-foot way, shaded passers-by from sun and rain.",
  },
  {
    id: "time-traveller",
    name: "Time Traveller",
    description: "You dated every photograph in a Guess the Year game.",
    howToEarn: "Complete a Guess the Year game at any site.",
    art: "/assets/badges/time-traveller.svg",
    motif: "A colonial clock tower",
    about: "Clock towers like the one at Victoria Concert Hall kept the town's time long before every pocket held a phone.",
  },
  {
    id: "sharp-eye",
    name: "Sharp Eye",
    description: "Every guess in one game landed inside the documented date range.",
    howToEarn: "Get every round of one Guess the Year game spot on.",
    art: "/assets/badges/sharp-eye.svg",
    motif: "A magnifier over an old photograph of the Singapore River",
    about: "Bumboats once crowded the river, ferrying cargo between the ships offshore and the godowns along its banks.",
  },
  {
    id: "good-listener",
    name: "Good Listener",
    description: "You listened to a whole story from start to finish.",
    howToEarn: "Play a site's narration to the end.",
    art: "/assets/badges/good-listener.svg",
    motif: "A 1950s cable-radio set",
    about: "Before television, cable radio brought news, music and storytellers into Singapore homes and coffee shops.",
  },
  {
    id: "curious-mind",
    name: "Curious Mind",
    description: "You opened every detail hidden in a site's photographs.",
    howToEarn: "Open every hotspot, in every era, at one site.",
    art: "/assets/badges/curious-mind.svg",
    motif: "A Peranakan tile",
    about: "Glazed relief tiles brightened Peranakan homes and shophouse fronts. The closer you look, the more you find.",
  },
  {
    id: "many-tongues",
    name: "Many Tongues",
    description: "You explored a story in more than one language.",
    howToEarn: "Switch a story to another available language.",
    art: "/assets/badges/many-tongues.svg",
    motif: "Hello in Singapore's four official languages",
    about: "English, Mandarin, Malay and Tamil: the pin says hello, 你好 (nǐ hǎo), apa khabar and வணக்கம் (vaṇakkam).",
  },
  {
    id: "three-journeys",
    name: "Three Journeys",
    description: "Different journeys, same home: you visited every site on the trail.",
    howToEarn: "Finish all three curated sites.",
    art: "/assets/badges/three-journeys.svg",
    motif: "A trishaw",
    about: "Three wheels for three journeys. Trishaws were an everyday ride for decades; today they carry visitors through the old quarters.",
  },
  {
    id: "memory-keeper",
    name: "Memory Keeper",
    description: "You left a note or drawing for future visitors.",
    howToEarn: "Leave a note or drawing at any site.",
    art: "/assets/badges/memory-keeper.svg",
    motif: "A red pillar box with a letter going in",
    about: "Red post boxes have collected Singapore's letters and postcards for generations. Yours went to future visitors instead.",
  },
];

export const BADGE_BY_ID = new Map(BADGES.map((b) => [b.id, b]));
