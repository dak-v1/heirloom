// Composes postage-style site stamps and their rubber-stamp ink impressions.
import { textPath, cjkPath, FONTS } from "./fonts.mjs";
import { LANDMARKS, LANDMARK_BOUNDS } from "./landmarks.mjs";
import { DEMO_LANDMARKS, DEMO_LANDMARK_BOUNDS } from "./demo-landmarks.mjs";
import { P, SITE_INKS } from "./palette.mjs";

export const STAMP_W = 300;
export const STAMP_H = 380;

export const STAMP_SITES = [
  { slug: "thian-hock-keng", title: "THIAN HOCK KENG", local: { text: "天福宫", script: "cjk" }, area: "TELOK AYER", no: "01" },
  { slug: "sri-mariamman-temple", title: "SRI MARIAMMAN", local: { text: "ஸ்ரீ மாரியம்மன் கோவில்", script: "tamil" }, area: "SOUTH BRIDGE ROAD", no: "02" },
  { slug: "sultan-mosque", title: "SULTAN MOSQUE", local: { text: "مسجد سلطان", script: "jawi" }, area: "KAMPONG GLAM", no: "03" },
];

// Extra inks for the placeholder stamps (frame, line ink, pale tint, accent, sky).
const INK = {
  terracotta: SITE_INKS["thian-hock-keng"],
  blue: SITE_INKS["sri-mariamman-temple"],
  olive: SITE_INKS["sultan-mosque"],
  mustard: { frame: "#BC9545", ink: "#5E4718", tint: "#F1E4C3", accent: "#DDBF7A", sky: "#F7EFDB" },
  teal: { frame: "#3F7F7C", ink: "#22463F", tint: "#D6E7E3", accent: "#A4CBC3", sky: "#EAF2EF" },
  plum: { frame: "#86566F", ink: "#4B2C3E", tint: "#EBDCE4", accent: "#D2AFC2", sky: "#F5ECF0" },
};

/**
 * Placeholder stamps for demos, so a passport can look well travelled. They are
 * labelled "Demo stamp" and aren't part of the trail. App side: src/content/demo-stamps.ts.
 */
export const DEMO_STAMP_SITES = [
  { slug: "lau-pa-sat", title: "LAU PA SAT", local: { text: "老巴刹", script: "cjk" }, area: "RAFFLES QUAY", no: "04", inks: INK.mustard },
  { slug: "cavenagh-bridge", title: "CAVENAGH BRIDGE", local: { text: "加文纳桥", script: "cjk" }, area: "SINGAPORE RIVER", no: "05", inks: INK.teal },
  { slug: "fort-canning", title: "FORT CANNING", local: { text: "Bukit Larangan", script: "latin" }, area: "FORT CANNING PARK", no: "06", inks: INK.olive },
  { slug: "hill-street", title: "HILL STREET", local: { text: "Old Police Station", script: "latin" }, area: "HILL STREET", no: "07", inks: INK.plum },
  { slug: "koon-seng-road", title: "KOON SENG ROAD", local: { text: "Peranakan Houses", script: "latin" }, area: "JOO CHIAT", no: "08", inks: INK.terracotta },
  { slug: "kampong-buangkok", title: "KAMPONG BUANGKOK", local: { text: "Kampung Lorong Buangkok", script: "latin" }, area: "LORONG BUANGKOK", no: "09", inks: INK.olive },
  { slug: "armenian-church", title: "ARMENIAN CHURCH", local: { text: "St Gregory the Illuminator", script: "latin" }, area: "HILL STREET", no: "10", inks: INK.blue },
  { slug: "tanjong-pagar-station", title: "TANJONG PAGAR", local: { text: "Railway Station", script: "latin" }, area: "KEPPEL ROAD", no: "11", inks: INK.teal },
  { slug: "victoria-concert-hall", title: "VICTORIA HALL", local: { text: "Victoria Concert Hall", script: "latin" }, area: "EMPRESS PLACE", no: "12", inks: INK.mustard },
  { slug: "merlion-park", title: "MERLION PARK", local: { text: "鱼尾狮", script: "cjk" }, area: "MARINA BAY", no: "13", inks: INK.plum },
].map((s) => ({ ...s, demo: true }));

const boundsOf = (slug) => LANDMARK_BOUNDS[slug] ?? DEMO_LANDMARK_BOUNDS[slug];
const drawingOf = (slug) => LANDMARKS[slug] ?? DEMO_LANDMARKS[slug];
const inksOf = (site) => site.inks ?? SITE_INKS[site.slug];

/** Transform that fits a landmark into a box, standing its ground line on `groundY`. */
function fitArt(slug, { cx, groundY, maxW, maxH, maxScale = 1.6 }) {
  const b = boundsOf(slug);
  const scale = Math.min(maxW / (b.x1 - b.x0), maxH / (182 - b.y0), maxScale);
  const tx = cx - ((b.x0 + b.x1) / 2) * scale;
  const ty = groundY - 182 * scale;
  return `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(3)})`;
}

function localName(local, { size, x, y, anchor = "middle" }) {
  if (local.script === "cjk") return cjkPath(local.text, { size: size * 1.05, x, y, anchor, tracking: 0.12 });
  if (local.script === "tamil") return textPath(local.text, { file: FONTS.tamil(600), size: size * 0.82, x, y, anchor });
  if (local.script === "latin") {
    let t = textPath(local.text, { file: FONTS.displayItalic(500), size: size * 0.8, x, y, anchor });
    if (t.width > 210) t = textPath(local.text, { file: FONTS.displayItalic(500), size: (size * 0.8 * 210) / t.width, x, y, anchor });
    return t;
  }
  return textPath(local.text, { file: FONTS.jawi(700), size: size * 1.15, x, y: y + 2, anchor });
}

function fitTitle(text, maxWidth, size) {
  let t = textPath(text, { file: FONTS.display(800), size, anchor: "middle", tracking: 0.04 });
  if (t.width > maxWidth) size = (size * maxWidth) / t.width;
  return size;
}

function perforationMask(id, w, h, r = 5.6, step = 15) {
  const holes = [];
  for (let x = step / 2 + 3; x < w; x += step) holes.push([x, 0], [x, h]);
  for (let y = step / 2 + 3; y < h; y += step) holes.push([0, y], [w, y]);
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#fff"/>
  ${holes.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#000"/>`).join("")}
</mask>`;
}

function hatchPattern(id, color, angle = 45, gap = 2.6, width = 0.55) {
  return `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})"><line x1="0" y1="0" x2="0" y2="${gap}" stroke="${color}" stroke-width="${width}"/></pattern>`;
}

/** Full-colour perforated postage stamp. */
export function postageStamp(site) {
  const inks = inksOf(site);
  const id = site.slug.replace(/[^a-z]/g, "");
  const titleSize = fitTitle(site.title, 226, 25);
  const title = textPath(site.title, { file: FONTS.display(800), size: titleSize, x: 150, y: 62, anchor: "middle", tracking: 0.04 });
  const local = localName(site.local, { size: 19, x: 150, y: 90 });
  const area = textPath(site.area, { file: FONTS.display(600), size: 10.5, x: 38, y: 343, tracking: 0.16 });
  const no = textPath(`No. ${site.no}`, { file: FONTS.displayItalic(500), size: 12, x: 262, y: 343, anchor: "end" });
  const brand = textPath(site.demo ? "HEIRLOOM · DEMO STAMP" : "HEIRLOOM · SINGAPORE", { file: FONTS.display(700), size: 7, x: 150, y: 363.2, anchor: "middle", tracking: 0.3 });
  const art = drawingOf(site.slug)({ ink: inks.ink, tint: inks.tint, accent: inks.accent, paper: P.paperLight, hatch: `${id}-hatch` });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${STAMP_W} ${STAMP_H}" width="${STAMP_W}" height="${STAMP_H}">
<title>${site.title} stamp</title>
<defs>
${perforationMask(`${id}-perf`, STAMP_W, STAMP_H)}
${hatchPattern(`${id}-hatch`, inks.ink)}
<clipPath id="${id}-panel"><rect x="26" y="26" width="248" height="328" rx="2"/></clipPath>
<filter id="${id}-grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.36  0 0 0 0 0.27  0 0 0 0.09 0"/>
  <feComposite in2="SourceGraphic" operator="in"/>
</filter>
</defs>
<g mask="url(#${id}-perf)">
  <rect width="${STAMP_W}" height="${STAMP_H}" fill="${P.paperLight}"/>
  <rect x="13" y="13" width="274" height="354" fill="${inks.frame}"/>
  <rect x="26" y="26" width="248" height="328" fill="${inks.sky}"/>
  <g clip-path="url(#${id}-panel)">
    <circle cx="150" cy="196" r="92" fill="${P.paperLight}" opacity="0.85"/>
    <circle cx="150" cy="196" r="92" fill="none" stroke="${inks.ink}" stroke-width="0.6" stroke-dasharray="1.5 3.5" opacity="0.6"/>
    <path d="M44 140 q12 -8 24 0 q10 -6 20 0 M214 122 q10 -7 20 0 q8 -5 16 0" fill="none" stroke="${inks.ink}" stroke-width="0.9" stroke-linecap="round" opacity="0.7"/>
    <g transform="${fitArt(site.slug, { cx: 150, groundY: 304, maxW: 236, maxH: 200, maxScale: 1.3 })}">${art}</g>
    <rect x="26" y="304.5" width="248" height="50" fill="${inks.sky}"/>
  </g>
  <path d="M38 314 H262" stroke="${inks.ink}" stroke-width="0.8"/>
  <path d="M38 311 H262" stroke="${inks.ink}" stroke-width="0.4"/>
  <path d="${title.d}" fill="${inks.ink}"/>
  <path d="${local.d}" fill="${inks.ink}"/>
  <path d="${area.d}" fill="${inks.ink}"/>
  <path d="${no.d}" fill="${inks.ink}"/>
  <path d="${brand.d}" fill="${P.paperLight}" opacity="0.9"/>
  <rect x="26" y="26" width="248" height="328" fill="none" stroke="${inks.ink}" stroke-width="1"/>
  <rect x="30" y="30" width="240" height="320" fill="none" stroke="${inks.ink}" stroke-width="0.4"/>
  ${[[19.5, 19.5], [280.5, 19.5], [19.5, 360.5], [280.5, 360.5]].map(([x, y]) => `<path d="M${x} ${y - 4} L${x + 4} ${y} L${x} ${y + 4} L${x - 4} ${y} Z" fill="${P.paperLight}"/>`).join("")}
  <rect width="${STAMP_W}" height="${STAMP_H}" filter="url(#${id}-grain)"/>
</g>
</svg>`;
}

/**
 * Single-colour rubber-stamp impression with distressed ink, transparent background.
 * Leaves a blank band (normalised y ≈ 0.86–0.93) where the app prints the visitor's visit date.
 */
export function inkImpression(site) {
  const inks = inksOf(site);
  const id = `${site.slug.replace(/[^a-z]/g, "")}-ink`;
  const color = inks.ink;
  const titleSize = fitTitle(site.title, 220, 24);
  const title = textPath(site.title, { file: FONTS.display(800), size: titleSize, x: 150, y: 58, anchor: "middle", tracking: 0.04 });
  const local = localName(site.local, { size: 18, x: 150, y: 86 });
  const visited = textPath("VISITED", { file: FONTS.display(700), size: 9, x: 150, y: 318, anchor: "middle", tracking: 0.35 });
  const art = drawingOf(site.slug)({ ink: color, tint: "none", accent: "none", paper: "none", hatch: `${id}-hatch`, weight: 1.3 });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${STAMP_W} ${STAMP_H}" width="${STAMP_W}" height="${STAMP_H}">
<title>${site.title} ink stamp</title>
<defs>
${hatchPattern(`${id}-hatch`, color, 45, 3, 0.7)}
<filter id="${id}-distress" x="-2%" y="-2%" width="104%" height="104%">
  <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="11" result="noise"/>
  <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -5 3.85" result="holes"/>
  <feComposite in="SourceGraphic" in2="holes" operator="in" result="speckled"/>
  <feTurbulence type="turbulence" baseFrequency="0.035" numOctaves="2" seed="4" result="warp"/>
  <feDisplacementMap in="speckled" in2="warp" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
</filter>
</defs>
<g filter="url(#${id}-distress)" opacity="0.92">
  <rect x="10" y="10" width="280" height="360" rx="18" fill="none" stroke="${color}" stroke-width="6"/>
  <rect x="21" y="21" width="258" height="338" rx="10" fill="none" stroke="${color}" stroke-width="1.6"/>
  <path d="${title.d}" fill="${color}"/>
  <path d="${local.d}" fill="${color}"/>
  <g transform="${fitArt(site.slug, { cx: 150, groundY: 296, maxW: 232, maxH: 196, maxScale: 1.3 })}">${art}</g>
  <path d="M40 304 H260" stroke="${color}" stroke-width="1.4"/>
  <path d="${visited.d}" fill="${color}"/>
  <path d="M70 344 H230" stroke="${color}" stroke-width="0.8" stroke-dasharray="2 3"/>
</g>
</svg>`;
}
