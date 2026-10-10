// Texture artwork for the 3D Heritage Passport. All sheets use an 880 × 1250
// viewBox (88 × 125 mm passport proportions) unless noted.
import { textPath, FONTS } from "./fonts.mjs";
import { arcText, markSvg, orchidSvg, postmarkSvg, shophouseDividerSvg } from "./brand.mjs";
import { P } from "./palette.mjs";
import LAYOUT from "../../../src/content/passport-layout.json" with { type: "json" };

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

/* ------------------------------------------------------------------ */
/* Interior pages. Recto = right-hand page (spine on its left);        */
/* verso = left-hand page once its leaf is turned (spine on its right). */
/* ------------------------------------------------------------------ */

const PW = LAYOUT.page.w;
const PH = LAYOUT.page.h;
const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

function paperBase(side, id) {
  const spineX = side === "recto" ? 0 : PW;
  const dir = side === "recto" ? 1 : -1;
  return `<defs>
  <radialGradient id="${id}-hi" cx="0.55" cy="0.42" r="0.75"><stop offset="0" stop-color="#FFFDF6" stop-opacity="0.75"/><stop offset="1" stop-color="#FFFDF6" stop-opacity="0"/></radialGradient>
  <linearGradient id="${id}-gutter" x1="${spineX}" x2="${spineX + dir * 110}" y1="0" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#2D2A23" stop-opacity="0.16"/><stop offset="0.35" stop-color="#2D2A23" stop-opacity="0.06"/><stop offset="1" stop-color="#2D2A23" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="${id}-edge" x1="${PW - spineX}" x2="${PW - spineX - dir * 50}" y1="0" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#8D8574" stop-opacity="0.12"/><stop offset="1" stop-color="#8D8574" stop-opacity="0"/>
  </linearGradient>
  <filter id="${id}-fibre" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.4  0 0 0 0 0.34  0 0 0 0 0.24  0 0 0 0.07 0"/>
  </filter>
</defs>
<rect width="${PW}" height="${PH}" fill="${P.paperLight}"/>
<rect width="${PW}" height="${PH}" fill="url(#${id}-hi)"/>
<rect width="${PW}" height="${PH}" filter="url(#${id}-fibre)"/>`;
}

function paperShading(id) {
  return `<rect width="${PW}" height="${PH}" fill="url(#${id}-gutter)"/>
<rect width="${PW}" height="${PH}" fill="url(#${id}-edge)"/>
<rect x="1.5" y="1.5" width="${PW - 3}" height="${PH - 3}" fill="none" stroke="${P.paperBorder}" stroke-width="3"/>`;
}

function decor(template, id) {
  if (template === "guilloche") {
    let a = "";
    let b = "";
    for (let r = 20; r < 1500; r += 22) a += `<circle cx="440" cy="1437" r="${r}"/>`;
    for (let r = 28; r < 1500; r += 30) b += `<circle cx="440" cy="-187" r="${r}"/>`;
    return `<g fill="none" stroke-width="2.4"><g stroke="${P.blue}" opacity="0.2">${a}</g><g stroke="${P.mustard}" opacity="0.18">${b}</g></g>`;
  }
  if (template === "waves") {
    let d = "";
    for (let y = 40; y < PH; y += 75) {
      for (const dy of [0, 19, 38]) {
        d += `M-20 ${y + dy}`;
        for (let x = -20; x < PW + 40; x += 67) d += " q16.75 -11 33.5 0 t33.5 0";
      }
    }
    return `<path d="${d}" fill="none" stroke="${P.terracotta}" stroke-width="4" stroke-linecap="round" opacity="0.14"/>`;
  }
  if (template === "tiles") {
    let d = "";
    const t = 85;
    for (let y = 0; y < PH + t; y += t) {
      for (let x = 0; x < PW + t; x += t) {
        if (((x + y) / t) % 2 === 0) d += `M${x} ${y - t / 2} L${x + t / 2} ${y} L${x} ${y + t / 2} L${x - t / 2} ${y} Z `;
      }
    }
    return `<defs><radialGradient id="${id}-fade" cx="0.5" cy="0.55" r="0.62"><stop offset="0.45" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>
<mask id="${id}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="${PW}" height="${PH}"><rect width="${PW}" height="${PH}" fill="url(#${id}-fade)"/></mask></defs>
<g mask="url(#${id}-m)"><path d="${d}" fill="${P.olive}" opacity="0.12"/></g>`;
  }
  if (template === "orchid") {
    return `<image href="${dataUri(orchidSvg())}" x="${PW - 405 + 50}" y="${PH - 552 - 50}" width="405" height="552" opacity="0.24"/>`;
  }
  if (template === "shophouses") {
    return `<g opacity="0.2"><image href="${dataUri(shophouseDividerSvg())}" x="-40" y="${PH - 300}" width="1936" height="194"/></g>`;
  }
  if (template === "plain") {
    let d = "";
    for (let y = PH * 0.2; y < PH * 0.9; y += 70) d += `M70 ${y.toFixed(1)} H${PW - 70} `;
    return `<path d="${d}" stroke="${P.blue}" stroke-width="2.5" opacity="0.2"/>`;
  }
  if (template === "identity") {
    let c = "";
    for (let r = 30; r < 1600; r += 30) c += `<circle cx="0" cy="${PH}" r="${r}"/>`;
    return `<g fill="none" stroke="${P.terracotta}" stroke-width="2.5" opacity="0.08">${c}</g>`;
  }
  return "";
}

function pageNumber(n, side) {
  return textPath(String(n), { file: FONTS.display(600), size: 28, x: side === "recto" ? PW - 70 : 70, y: PH - 52, anchor: side === "recto" ? "end" : "start" }).d;
}

/** A stamp page (p1–p6): faint themed decoration, title and page number. Stamps are added at runtime. */
export function stampPageSvg(page, side) {
  const id = `pg-${page.id}`;
  const title = textPath(page.title.toUpperCase(), { file: FONTS.display(700), size: 30, x: 70, y: 112, tracking: 0.16 });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}">
${paperBase(side, id)}
${decor(page.template, id)}
<path d="${title.d}" fill="${P.inkMuted}"/>
<path d="M70 136 H${PW - 70}" stroke="${P.paperBorder}" stroke-width="2.5"/>
<path d="${pageNumber(page.index + 1, side)}" fill="${P.inkMuted}"/>
${paperShading(id)}
</svg>`;
}

/** Identity page (recto of the first leaf). The runtime writes the visitor's details on the dotted lines. */
export function identityPageSvg(index = 1) {
  const id = "pg-identity";
  const ink = P.ink;
  const t = (s, o) => textPath(s, { file: FONTS.display(o.w ?? 700), size: o.size, x: o.x ?? 440, y: o.y, anchor: o.anchor ?? "middle", tracking: o.tr ?? 0 }).d;
  const fx = LAYOUT.identityFieldX;
  const fields = LAYOUT.identityFields
    .map((f) => `<path d="${t(f.label, { size: 21, x: fx, y: f.labelY, anchor: "start", w: 600, tr: 0.16 })}" fill="${P.inkMuted}"/><path d="M${fx} ${f.lineY} H${PW - 90}" stroke="${ink}" stroke-width="2" stroke-dasharray="3 7"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}">
${paperBase("recto", id)}
${decor("identity", id)}
<path d="${t("HEIRLOOM · SINGAPORE", { size: 22, y: 150, tr: 0.32, w: 600 })}" fill="${P.terracotta}"/>
<path d="${t("Heritage Passport", { size: 62, y: 228, w: 700 })}" fill="${ink}"/>
<path d="M120 262 H${PW - 120}" stroke="${P.terracotta}" stroke-width="2.5"/>
<rect x="${LAYOUT.identityPhoto.x}" y="${LAYOUT.identityPhoto.y}" width="${LAYOUT.identityPhoto.w}" height="${LAYOUT.identityPhoto.h}" rx="4" fill="${P.paper}" stroke="${ink}" stroke-width="2.5" stroke-dasharray="8 6"/>
<image href="${dataUri(markSvg({ size: 512 }))}" x="168" y="372" width="100" height="100"/>
<path d="${t("YOUR", { size: 21, x: 218, y: 532, w: 600, tr: 0.2 })}${t("JOURNEY", { size: 21, x: 218, y: 562, w: 600, tr: 0.2 })}" fill="${P.inkMuted}"/>
${fields}
<path d="${textPath("Every street has a story.", { file: FONTS.script(700), size: 64, x: 440, y: 890, anchor: "middle" }).d}" fill="${P.terracotta}"/>
<path d="${textPath("Walk it, listen to it, and leave your own memory behind.", { file: FONTS.script(500), size: 34, x: 440, y: 946, anchor: "middle" }).d}" fill="${ink}"/>
<image href="${dataUri(postmarkSvg({ color: P.terracotta }))}" x="70" y="960" width="230" height="140" opacity="0.45" transform="rotate(-8 185 1030)"/>
<path d="${t("A KEEPSAKE OF YOUR WALK, SAVED IN THIS BROWSER", { size: 15, y: 1132, w: 600, tr: 0.12 })}${t("NOT AN OFFICIAL TRAVEL DOCUMENT", { size: 15, y: 1158, w: 600, tr: 0.12 })}" fill="${P.inkMuted}"/>
<path d="${pageNumber(index + 1, "recto")}" fill="${P.inkMuted}"/>
${paperShading(id)}
</svg>`;
}

/** The decorative final verso (behind the last stamp page). */
export function endPageSvg() {
  const id = "pg-end";
  const t = (s, o) => textPath(s, { file: FONTS.display(o.w ?? 700), size: o.size, x: o.x ?? 440, y: o.y, anchor: "middle", tracking: o.tr ?? 0 }).d;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}">
${paperBase("verso", id)}
<image href="${dataUri(postmarkSvg({ color: P.inkMuted }))}" x="260" y="330" width="360" height="220" opacity="0.5"/>
<path d="${t("MORE STORIES TO COME", { size: 30, y: 650, tr: 0.22 })}" fill="${P.inkMuted}"/>
<path d="${textPath("Singapore, always a good story.", { file: FONTS.script(700), size: 54, x: 440, y: 730, anchor: "middle" }).d}" fill="${P.terracotta}"/>
<g opacity="0.25"><image href="${dataUri(shophouseDividerSvg())}" x="-40" y="${PH - 300}" width="1936" height="194"/></g>
${paperShading(id)}
</svg>`;
}

/** Page-block edges: fine stacked-leaf lines that vary along u. 512 × 64. */
export function pageEdgeSvg() {
  let lines = "";
  for (let x = 1; x < 512; x += 3.2) lines += `<rect x="${x.toFixed(1)}" y="0" width="${(0.7 + ((x * 7) % 5) / 10).toFixed(2)}" height="64" fill="#CDBFA4" opacity="${(0.35 + ((x * 13) % 7) / 20).toFixed(2)}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 64"><rect width="512" height="64" fill="#F4EDDC"/>${lines}</svg>`;
}
