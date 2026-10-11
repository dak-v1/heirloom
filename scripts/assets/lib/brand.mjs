// Brand marks and decorative ephemera: logo, app icons, postmark, cancellation
// waves, orchid sprig, shophouse divider and the rubber-stamp tool illustration.
import { readFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { textPath, FONTS } from "./fonts.mjs";
import { P } from "./palette.mjs";

const r2 = (n) => +n.toFixed(2);

/** Text set around a circle (Latin only), centred on `centerDeg` (0 = top, clockwise). */
export function arcText(text, { file, size, cx, cy, r, centerDeg = 0, tracking = 0.12, inside = false }) {
  const chars = [...text];
  const adv = chars.map((ch) => (ch === " " ? size * 0.32 : textPath(ch, { file, size }).width));
  const gap = tracking * size;
  const total = adv.reduce((a, b) => a + b, 0) + gap * (chars.length - 1);
  const toDeg = (len) => (len / (2 * Math.PI * r)) * 360;
  const dir = inside ? -1 : 1;
  let pos = -total / 2;
  const out = [];
  chars.forEach((ch, i) => {
    const mid = centerDeg + dir * toDeg(pos + adv[i] / 2);
    if (ch !== " ") {
      const d = textPath(ch, { file, size, anchor: "middle" }).d;
      const tf = inside
        ? `translate(${cx} ${cy}) rotate(${r2(mid)}) translate(0 ${-r}) rotate(180) translate(0 ${r2(size * 0.72)})`
        : `translate(${cx} ${cy}) rotate(${r2(mid)}) translate(0 ${-r})`;
      out.push(`<path transform="${tf}" d="${d}"/>`);
    }
    pos += adv[i] + gap;
  });
  return out.join("");
}

// The mark's artwork lives in scripts/assets/source: the illustrated stamp cut out of its
// paper (heirloom-mark.png), and a single-ink version of it (heirloom-mark-mono.png).
const ART = 768;
const sourceUri = (file) => `data:image/png;base64,${readFileSync(new URL(`../source/${file}`, import.meta.url)).toString("base64")}`;
const MARK_ART = sourceUri("heirloom-mark.png");
const MARK_MONO_ART = sourceUri("heirloom-mark-mono.png");

/** The mark's artwork scaled down to `px`, as a PNG data URI for small embeds. */
export function markArt(px) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ART} ${ART}"><image href="${MARK_ART}" width="${ART}" height="${ART}"/></svg>`;
  return `data:image/png;base64,${new Resvg(svg, { fitTo: { mode: "width", value: px } }).render().asPng().toString("base64")}`;
}

/** The Heirloom mark: a perforated terracotta stamp holding a serif H wound with a flowering sprig. `inset` widens the margin; a negative one narrows it. */
export function markSvg({ size = 512, background = null, inset = 0, art = MARK_ART } = {}) {
  const S = 512;
  const pad = 76 + inset;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${size}" height="${size}">
<title>Heirloom</title>
${background ? `<rect width="${S}" height="${S}" fill="${background}"/>` : ""}
<image href="${art}" x="${pad}" y="${pad}" width="${S - pad * 2}" height="${S - pad * 2}"/>
</svg>`;
}

/** The mark in a single ink, for foil and blind stamping: `color` where the terracotta was, clear elsewhere. */
export function markMonoSvg({ color, size = 512 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ART} ${ART}" width="${size}" height="${size}">
<mask id="mark-ink"><image href="${MARK_MONO_ART}" width="${ART}" height="${ART}"/></mask>
<rect width="${ART}" height="${ART}" fill="${color}" mask="url(#mark-ink)"/>
</svg>`;
}

/** Horizontal lock-up: mark + "Heirloom" wordmark + tagline. */
export function logoSvg({ color = P.ink } = {}) {
  const word = textPath("Heirloom", { file: FONTS.display(700), size: 64, x: 104, y: 66 });
  const tag = textPath("EVERY STREET HAS A STORY", { file: FONTS.display(600), size: 11.5, x: 106, y: 90, tracking: 0.28 });
  const width = Math.ceil(Math.max(104 + word.width, 106 + tag.width) + 8);
  const mark = markSvg({ size: 92, art: markArt(192) }).replace(/<\?xml[^>]*>/, "").replace("<svg ", '<svg x="0" y="4" ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 100" width="${width}" height="100">
<title>Heirloom</title>
${mark}
<path d="${word.d}" fill="${color}"/>
<path d="${tag.d}" fill="${color}" opacity="0.75"/>
</svg>`;
}

/** Circular postmark with arc text and cancellation waves. */
export function postmarkSvg({ color = P.ink, top = "HEIRLOOM", bottom = "SINGAPORE", center = "SEE · HEAR · KEEP" } = {}) {
  const file = FONTS.display(700);
  const topT = arcText(top, { file, size: 15, cx: 110, cy: 110, r: 74, centerDeg: 0, tracking: 0.3 });
  const botT = arcText(bottom, { file, size: 15, cx: 110, cy: 110, r: 74, centerDeg: 180, tracking: 0.3, inside: true });
  const mid = textPath(center, { file: FONTS.display(600), size: 11, x: 110, y: 115, anchor: "middle", tracking: 0.12 });
  let waves = "";
  for (let k = 0; k < 4; k++) {
    const y = 74 + k * 22;
    waves += `M206 ${y} q14 -9 28 0 t28 0 t28 0 t28 0 t28 0 `;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" width="360" height="220">
<title>Postmark</title>
<g fill="${color}" stroke="none" opacity="0.85">
<circle cx="110" cy="110" r="96" fill="none" stroke="${color}" stroke-width="4"/>
<circle cx="110" cy="110" r="88" fill="none" stroke="${color}" stroke-width="1.5"/>
<circle cx="110" cy="110" r="52" fill="none" stroke="${color}" stroke-width="1.5"/>
${topT}${botT}
<path d="${mid.d}"/>
<path d="M66 96 H154 M66 128 H154" stroke="${color}" stroke-width="1.2" fill="none"/>
<circle cx="34" cy="110" r="3"/><circle cx="186" cy="110" r="3"/>
<path d="${waves}" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round"/>
</g>
</svg>`;
}

export function wavesSvg({ color = P.terracotta } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" width="120" height="40">
<path d="M4 10 q9 -6 18 0 t18 0 t18 0 t18 0 t18 0 t18 0 M4 20 q9 -6 18 0 t18 0 t18 0 t18 0 t18 0 t18 0 M4 30 q9 -6 18 0 t18 0 t18 0 t18 0 t18 0 t18 0" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>
</svg>`;
}

/** Vanda Miss Joaquim–inspired orchid sprig, line art with a pale wash. */
export function orchidSvg({ ink = "#5B3F4A", wash = "#E9D3DA", leaf = P.olive } = {}) {
  const flower = (x, y, rot, s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M0 0 C-10 -6 -26 -4 -30 -16 C-22 -20 -8 -14 0 -2 Z" fill="${wash}" stroke="${ink}" stroke-width="1.4"/>
    <path d="M0 0 C10 -6 26 -4 30 -16 C22 -20 8 -14 0 -2 Z" fill="${wash}" stroke="${ink}" stroke-width="1.4"/>
    <path d="M0 -2 C-6 -14 -6 -28 0 -36 C6 -28 6 -14 0 -2 Z" fill="${wash}" stroke="${ink}" stroke-width="1.4"/>
    <path d="M0 0 C-8 6 -20 10 -24 22 C-14 22 -6 14 0 4 Z" fill="${wash}" stroke="${ink}" stroke-width="1.4"/>
    <path d="M0 0 C8 6 20 10 24 22 C14 22 6 14 0 4 Z" fill="${wash}" stroke="${ink}" stroke-width="1.4"/>
    <path d="M0 2 C-9 8 -10 22 0 30 C10 22 9 8 0 2 Z" fill="${ink}" opacity="0.85"/>
    <path d="M-2 10 C-1 16 1 20 0 26 M2 10 C3 15 2 19 2 24" fill="none" stroke="${wash}" stroke-width="0.9"/>
    <circle cx="0" cy="1" r="2.6" fill="${P.mustard}" stroke="${ink}" stroke-width="0.8"/>
  </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 300" width="220" height="300">
<title>Orchid sprig</title>
<path d="M110 296 C112 240 104 190 116 140 C124 108 140 86 150 60" fill="none" stroke="${leaf}" stroke-width="3" stroke-linecap="round"/>
<path d="M112 250 C80 240 54 214 40 180 C72 192 98 214 112 250 Z" fill="none" stroke="${leaf}" stroke-width="2"/>
<path d="M112 250 C90 230 66 206 40 180" fill="none" stroke="${leaf}" stroke-width="1"/>
<path d="M110 214 C138 204 164 180 176 150 C148 160 124 182 110 214 Z" fill="none" stroke="${leaf}" stroke-width="2"/>
<path d="M110 214 C132 196 154 174 176 150" fill="none" stroke="${leaf}" stroke-width="1"/>
${flower(150, 58, 18, 1.15)}
${flower(108, 120, -16, 1.05)}
<path d="M138 100 q6 -4 10 -12 M126 160 q-8 -6 -12 -14" fill="none" stroke="${leaf}" stroke-width="2" stroke-linecap="round"/>
<ellipse cx="150" cy="102" rx="5" ry="9" transform="rotate(30 150 102)" fill="${wash}" stroke="${ink}" stroke-width="1.2"/>
</svg>`;
}

/** A row of shophouses: decorative footer divider (1200 × 120, repeatable). */
export function shophouseDividerSvg({ ink = P.ink } = {}) {
  const parts = [];
  const house = (x, w, h, variant) => {
    const g = [];
    const top = 112 - h;
    g.push(`<path d="M${x} 112 V${top + 12} L${x + w / 2} ${top} L${x + w} ${top + 12} V112" />`);
    g.push(`<path d="M${x - 2} ${top + 12} H${x + w + 2}" />`);
    // upper windows with shutters
    const wins = variant % 2 ? 3 : 2;
    for (let i = 0; i < wins; i++) {
      const wx = x + ((i + 0.5) * w) / wins;
      g.push(`<path d="M${wx - 5} ${top + 46} V${top + 24} Q${wx} ${top + 18} ${wx + 5} ${top + 24} V${top + 46} Z M${wx} ${top + 22} V${top + 46}" />`);
    }
    g.push(`<path d="M${x} ${top + 54} H${x + w} M${x} ${top + 58} H${x + w}" />`);
    // five-foot way arches
    const arches = 2;
    for (let i = 0; i < arches; i++) {
      const ax = x + (i * w) / arches + 3, aw = w / arches - 6;
      g.push(`<path d="M${ax} 112 V${top + 74} Q${ax + aw / 2} ${top + 62} ${ax + aw} ${top + 74} V112" />`);
    }
    return g.join("");
  };
  let x = 8;
  const widths = [64, 52, 70, 56, 64, 48, 72, 60, 52, 66, 58, 70, 54, 62, 68, 56, 60, 64, 50];
  const heights = [96, 88, 100, 92, 96, 86, 104, 94, 88, 98, 92, 100, 90, 94, 102, 88, 92, 96, 86];
  widths.forEach((w, i) => {
    if (x + w > 1192) return;
    parts.push(house(x, w, heights[i], i));
    x += w;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" width="1200" height="120" preserveAspectRatio="xMidYMax meet">
<title>Shophouse row</title>
<g fill="none" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${parts.join("")}<path d="M0 112.5 H1200" stroke-width="2"/></g>
</svg>`;
}

/** Wooden rubber stamp, three-quarter view, for the dimensional stamping animation. */
export function stampToolSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260" width="200" height="260">
<title>Rubber stamp</title>
<defs>
  <linearGradient id="wood" x1="0" x2="1">
    <stop offset="0" stop-color="#8A5A34"/><stop offset="0.45" stop-color="#B7814F"/><stop offset="1" stop-color="#7A4C2B"/>
  </linearGradient>
  <linearGradient id="woodTop" x1="0" x2="1" y1="0" y2="1">
    <stop offset="0" stop-color="#D3A273"/><stop offset="1" stop-color="#A9744A"/>
  </linearGradient>
  <radialGradient id="knob" cx="0.38" cy="0.32" r="0.75">
    <stop offset="0" stop-color="#D9AB7C"/><stop offset="0.6" stop-color="#9A643B"/><stop offset="1" stop-color="#6E4325"/>
  </radialGradient>
  <linearGradient id="rubber" x1="0" x2="1"><stop offset="0" stop-color="#3B2A26"/><stop offset="1" stop-color="#5A3F38"/></linearGradient>
</defs>
<ellipse cx="100" cy="246" rx="70" ry="9" fill="#2D2A23" opacity="0.18"/>
<path d="M30 196 L170 196 L170 214 Q100 226 30 214 Z" fill="url(#rubber)"/>
<path d="M26 150 L174 150 L174 198 Q100 212 26 198 Z" fill="url(#wood)"/>
<path d="M26 150 Q100 136 174 150 Q100 166 26 150 Z" fill="url(#woodTop)"/>
<path d="M44 168 Q90 176 150 166 M40 184 Q100 194 160 182" fill="none" stroke="#6E4325" stroke-width="1.2" opacity="0.45"/>
<path d="M84 150 L80 92 Q100 86 120 92 L116 150 Q100 156 84 150 Z" fill="url(#wood)"/>
<path d="M88 112 Q100 116 112 112" fill="none" stroke="#6E4325" stroke-width="1" opacity="0.5"/>
<ellipse cx="100" cy="92" rx="20" ry="6" fill="#B07A4C"/>
<circle cx="100" cy="58" r="38" fill="url(#knob)"/>
<ellipse cx="88" cy="44" rx="12" ry="7" fill="#F1D3B1" opacity="0.35" transform="rotate(-25 88 44)"/>
<path d="M26 150 Q100 136 174 150" fill="none" stroke="#F1D3B1" stroke-width="1.2" opacity="0.5"/>
</svg>`;
}
