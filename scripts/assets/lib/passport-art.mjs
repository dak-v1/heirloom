// Texture artwork for the 3D Heritage Passport. All sheets use an 880 × 1250
// viewBox (88 × 125 mm passport proportions) unless noted.
import { textPath, FONTS } from "./fonts.mjs";
import { arcText } from "./brand.mjs";
import { P } from "./palette.mjs";

export const COVER_W = 880;
export const COVER_H = 1250;
export const LEATHER = "#6B2A1F";
export const GOLD = "#E2BC6A";

function emblem({ cx, cy, r, color }) {
  const line = `fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;
  const thin = `fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`;
  const ring = arcText("DIFFERENT JOURNEYS  ·  SAME HOME", { file: FONTS.display(700), size: 26, cx, cy, r: r - 44, centerDeg: 0, tracking: 0.22 });
  const ringB = arcText("SINGAPORE", { file: FONTS.display(700), size: 26, cx, cy, r: r - 44, centerDeg: 180, tracking: 0.4, inside: true });
  // silhouettes of the three curated sites, drawn in a 300 × 200 box centred on the emblem
  const ox = cx - 150, oy = cy - 120;
  const roofs = [
    // Chinese temple roof with swallowtail ridge
    "M18 150 H98 M26 150 V122 H90 V150",
    "M8 122 Q30 120 40 104 H76 Q86 120 108 122",
    "M40 104 Q30 100 24 90 M76 104 Q86 100 92 90",
    "M48 150 V132 H68 V150",
    // gopuram
    "M122 150 L132 40 H168 L178 150",
    "M124 128 H176 M126 106 H174 M128 84 H172 M130 62 H170",
    "M134 40 Q134 24 150 22 Q166 24 166 40",
    "M140 150 V136 Q150 128 160 136 V150",
    // domed mosque with minarets
    "M200 150 V110 H282 V150",
    "M220 110 V98 H262 V110",
    "M220 98 C212 84 222 66 241 52 C260 66 270 84 262 98",
    "M241 52 V40",
    "M232 150 V132 Q241 122 250 132 V150",
    "M196 150 V70 M286 150 V70",
  ];
  const crescent = `<path d="M245 26 A9 9 0 1 0 245 42 A7 7 0 1 1 245 26 Z" fill="${color}"/>`;
  let waves = "";
  for (let k = 0; k < 3; k++) waves += `M20 ${170 + k * 16} q16 -10 32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 `;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" ${line}/>
<circle cx="${cx}" cy="${cy}" r="${r - 12}" ${thin}/>
<circle cx="${cx}" cy="${cy}" r="${r - 76}" ${thin}/>
<g fill="${color}">${ring}${ringB}</g>
<circle cx="${cx - r + 44}" cy="${cy}" r="5" fill="${color}"/><circle cx="${cx + r - 44}" cy="${cy}" r="5" fill="${color}"/>
<clipPath id="emb"><circle cx="${cx}" cy="${cy}" r="${r - 80}"/></clipPath>
<g clip-path="url(#emb)"><g transform="translate(${ox} ${oy})"><path d="${roofs.join(" ")}" ${line}/>${crescent}<path d="${waves}" ${thin}/></g></g>`;
}

function corner(x, y, sx, sy, color) {
  return `<path transform="translate(${x} ${y}) scale(${sx} ${sy})" d="M0 60 V0 H60 M14 60 V14 H60 M0 0 L22 22 M30 28 q10 -14 22 -4 M28 30 q-14 10 -4 22" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
}

/** Front cover: gold foil on leather. `mode` = "color" | "metal" (metal mask: gold white, rest black). */
export function coverFrontSvg(mode = "color") {
  const gold = mode === "color" ? GOLD : "#fff";
  const bg = mode === "color" ? LEATHER : "#000";
  const brand = textPath("HEIRLOOM", { file: FONTS.display(800), size: 104, x: 440, y: 268, anchor: "middle", tracking: 0.16 });
  const l1 = textPath("SINGAPORE", { file: FONTS.display(700), size: 62, x: 440, y: 975, anchor: "middle", tracking: 0.32 });
  const l2 = textPath("HERITAGE PASSPORT", { file: FONTS.display(700), size: 46, x: 440, y: 1048, anchor: "middle", tracking: 0.22 });
  const l3 = textPath("EVERY STREET HAS A STORY", { file: FONTS.display(600), size: 22, x: 440, y: 1140, anchor: "middle", tracking: 0.3 });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COVER_W} ${COVER_H}">
<rect width="${COVER_W}" height="${COVER_H}" fill="${bg}"/>
${mode === "color" ? `<radialGradient id="glow" cx="0.5" cy="0.45" r="0.7"><stop offset="0" stop-color="#7C3324"/><stop offset="1" stop-color="${LEATHER}"/></radialGradient><rect width="${COVER_W}" height="${COVER_H}" fill="url(#glow)"/>` : ""}
<rect x="44" y="44" width="${COVER_W - 88}" height="${COVER_H - 88}" rx="18" fill="none" stroke="${gold}" stroke-width="5"/>
<rect x="60" y="60" width="${COVER_W - 120}" height="${COVER_H - 120}" rx="10" fill="none" stroke="${gold}" stroke-width="2"/>
${corner(84, 84, 1, 1, gold)}${corner(COVER_W - 84, 84, -1, 1, gold)}${corner(84, COVER_H - 84, 1, -1, gold)}${corner(COVER_W - 84, COVER_H - 84, -1, -1, gold)}
<path d="${brand.d}" fill="${gold}"/>
<path d="M300 318 H418 M462 318 H580" stroke="${gold}" stroke-width="3"/>
<path d="M440 306 L452 318 L440 330 L428 318 Z" fill="${gold}"/>
${emblem({ cx: 440, cy: 620, r: 230, color: gold })}
<path d="${l1.d}${l2.d}" fill="${gold}"/>
<path d="M340 1088 H540" stroke="${gold}" stroke-width="2.5"/>
<path d="${l3.d}" fill="${gold}"/>
</svg>`;
}

export function coverBackSvg(mode = "color") {
  const gold = mode === "color" ? GOLD : "#fff";
  const bg = mode === "color" ? LEATHER : "#000";
  const note = textPath("NOT AN OFFICIAL TRAVEL DOCUMENT", { file: FONTS.display(600), size: 18, x: 440, y: 1150, anchor: "middle", tracking: 0.28 });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COVER_W} ${COVER_H}">
<rect width="${COVER_W}" height="${COVER_H}" fill="${bg}"/>
<rect x="44" y="44" width="${COVER_W - 88}" height="${COVER_H - 88}" rx="18" fill="none" stroke="${gold}" stroke-width="3"/>
<g transform="translate(380 960)"><rect width="120" height="120" rx="4" fill="none" stroke="${gold}" stroke-width="4" stroke-dasharray="10 6"/>
<path d="${textPath("H", { file: FONTS.display(900), size: 80, x: 60, y: 88, anchor: "middle" }).d}" fill="${gold}"/></g>
<path d="${note.d}" fill="${gold}" opacity="0.85"/>
</svg>`;
}

/** Spine wraps 1 (u) × 1250 (v); drawn 200 wide. */
export function spineSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 ${COVER_H}">
<rect width="200" height="${COVER_H}" fill="${LEATHER}"/>
${[70, 90, COVER_H - 90, COVER_H - 70].map((y) => `<rect x="0" y="${y}" width="200" height="6" fill="${GOLD}"/>`).join("")}
<path d="M100 560 L112 625 L100 690 L88 625 Z" fill="${GOLD}"/>
</svg>`;
}

/** Endpapers: a Peranakan-tile-inspired repeat in terracotta on cream. */
export function endpaperSvg() {
  const tile = `<pattern id="t" width="110" height="110" patternUnits="userSpaceOnUse">
  <rect width="110" height="110" fill="${P.paperLight}"/>
  <g transform="translate(55 55)" fill="none" stroke="${P.terracotta}" stroke-width="2.4">
    ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path transform="rotate(${a})" d="M0 -8 C6 -16 6 -26 0 -32 C-6 -26 -6 -16 0 -8 Z"/>`).join("")}
    <circle r="6" fill="${P.mustard}" stroke="${P.terracotta}"/>
  </g>
  <path d="M0 0 L14 0 L0 14 Z M110 0 L96 0 L110 14 Z M0 110 L14 110 L0 96 Z M110 110 L96 110 L110 96 Z" fill="${P.olive}"/>
  <path d="M55 0 V8 M55 102 V110 M0 55 H8 M102 55 H110" stroke="${P.olive}" stroke-width="2.4"/>
</pattern>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COVER_W} ${COVER_H}">
<defs>${tile}</defs>
<rect width="${COVER_W}" height="${COVER_H}" fill="url(#t)"/>
<rect width="${COVER_W}" height="${COVER_H}" fill="${P.paperLight}" opacity="0.28"/>
</svg>`;
}

/** First (identity) page shown when the cover opens. */
export function identityPageSvg() {
  const ink = P.ink;
  let guilloche = "";
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * Math.PI * 2;
    guilloche += `<ellipse cx="440" cy="560" rx="300" ry="120" transform="rotate(${((a * 180) / Math.PI).toFixed(1)} 440 560)"/>`;
  }
  const t = (s, o) => textPath(s, { file: FONTS.display(o.w ?? 700), size: o.size, x: o.x ?? 440, y: o.y, anchor: o.anchor ?? "middle", tracking: o.tr ?? 0 }).d;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COVER_W} ${COVER_H}">
<rect width="${COVER_W}" height="${COVER_H}" fill="${P.paperLight}"/>
<g fill="none" stroke="#9FB2C6" stroke-width="1.2" opacity="0.55">${guilloche}</g>
<rect x="40" y="40" width="${COVER_W - 80}" height="${COVER_H - 80}" fill="none" stroke="${P.paperBorder}" stroke-width="3"/>
<path d="${t("HERITAGE PASSPORT", { size: 50, y: 170, tr: 0.18 })}" fill="${P.terracotta}"/>
<path d="${t("HEIRLOOM · SINGAPORE", { size: 22, y: 214, tr: 0.32, w: 600 })}" fill="${ink}"/>
<path d="M120 252 H760" stroke="${P.terracotta}" stroke-width="2.5"/>
<rect x="110" y="330" width="230" height="290" fill="${P.paper}" stroke="${ink}" stroke-width="2.5" stroke-dasharray="8 6"/>
<path d="${t("YOUR", { size: 22, x: 225, y: 462, w: 600, tr: 0.2 })}${t("JOURNEY", { size: 22, x: 225, y: 494, w: 600, tr: 0.2 })}" fill="${P.inkMuted}"/>
<path d="${t("THIS PASSPORT BELONGS TO", { size: 22, x: 380, y: 360, anchor: "start", w: 600, tr: 0.14 })}" fill="${P.inkMuted}"/>
<path d="M380 420 H770" stroke="${ink}" stroke-width="2" stroke-dasharray="3 7"/>
<path d="${t("PLACES EXPLORED", { size: 22, x: 380, y: 486, anchor: "start", w: 600, tr: 0.14 })}" fill="${P.inkMuted}"/>
<path d="M380 546 H770" stroke="${ink}" stroke-width="2" stroke-dasharray="3 7"/>
<path d="${t("FIRST STAMP", { size: 22, x: 380, y: 600, anchor: "start", w: 600, tr: 0.14 })}" fill="${P.inkMuted}"/>
<path d="M380 660 H770" stroke="${ink}" stroke-width="2" stroke-dasharray="3 7"/>
<path d="${textPath("Every street has a story.", { file: FONTS.script(700), size: 64, x: 440, y: 840, anchor: "middle" }).d}" fill="${P.terracotta}"/>
<path d="${textPath("Walk it, listen to it, and leave your own memory behind.", { file: FONTS.script(500), size: 36, x: 440, y: 900, anchor: "middle" }).d}" fill="${ink}"/>
<path d="${t("A KEEPSAKE FROM THE HEIRLOOM APP — NOT AN OFFICIAL TRAVEL DOCUMENT", { size: 15, y: 1130, w: 600, tr: 0.12 })}" fill="${P.inkMuted}"/>
<path d="${t("1", { size: 26, y: 1190, w: 600 })}" fill="${P.inkMuted}"/>
</svg>`;
}

/** Page-block edges: fine stacked-leaf lines that vary along u. 512 × 64. */
export function pageEdgeSvg() {
  let lines = "";
  for (let x = 1; x < 512; x += 3.2) lines += `<rect x="${x.toFixed(1)}" y="0" width="${(0.7 + ((x * 7) % 5) / 10).toFixed(2)}" height="64" fill="#CDBFA4" opacity="${(0.35 + ((x * 13) % 7) / 20).toFixed(2)}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 64"><rect width="512" height="64" fill="#F4EDDC"/>${lines}</svg>`;
}
