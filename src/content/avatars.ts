/** Map icons a visitor can choose for their profile. Art: public/assets/avatars (scripts/assets/lib/avatars.mjs). */
export interface AvatarDef {
  id: string;
  name: string;
  art: string;
  alt: string;
  /** One line shown under the preview when it's chosen. */
  note: string;
}

export const AVATARS: AvatarDef[] = [
  {
    id: "otter",
    name: "Otter",
    art: "/assets/avatars/otter.svg",
    alt: "A smooth-coated otter in a green scarf",
    note: "Smooth-coated otters have made the Singapore River and Marina Bay their home.",
  },
  {
    id: "kopi",
    name: "Kopi",
    art: "/assets/avatars/kopi.svg",
    alt: "A cup of kopi on a coffee-shop saucer",
    note: "Coffee-shop coffee, ordered in its own shorthand: kopi-o, kopi-c, kopi peng.",
  },
  {
    id: "merlion",
    name: "Merlion",
    art: "/assets/avatars/merlion.svg",
    alt: "The Merlion, half lion and half fish, spouting water",
    note: "Half lion, half fish: Singapore's mascot, first unveiled in 1972.",
  },
  {
    id: "orchid",
    name: "Orchid",
    art: "/assets/avatars/orchid.svg",
    alt: "A pink and magenta Vanda Miss Joaquim orchid",
    note: "Vanda Miss Joaquim, Singapore's national flower.",
  },
  {
    id: "trishaw",
    name: "Trishaw",
    art: "/assets/avatars/trishaw.svg",
    alt: "A red trishaw decorated with flowers",
    note: "Pedal-powered rides through the old quarters, with flowers on the hood.",
  },
  {
    id: "durian",
    name: "Durian",
    art: "/assets/avatars/durian.svg",
    alt: "A spiky durian with an opened segment",
    note: "The king of fruits. Loved at the stalls, kept off the trains.",
  },
];

export const DEFAULT_AVATAR = AVATARS[0].id;

export function findAvatar(id: string | undefined): AvatarDef {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}
