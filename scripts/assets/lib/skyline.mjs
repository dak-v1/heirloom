// Pen-and-ink view of the bay from the river, for the home page hero: hotel towers
// and skypark, the city skyline, rain trees on the bank, reflections and a bumboat.
// Transparent background (the page supplies the paper). 640 × 360.
const W = 640;
const H = 360;
const WATER = 268;
const INK = "#3B352C";
const SOFT = "#8C8170";
const f = (n) => +n.toFixed(1);

// Deterministic jitter so the drawing is the same on every build.
let seed = 7;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const jit = (a) => (rnd() - 0.5) * 2 * a;

const pathEl = (d, { color = INK, w = 1, op = 1 } = {}) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` stroke-opacity="${op}"` : ""}/>`;

/** A wobbly hand-drawn line between two points. */
function hand(x0, y0, x1, y1, wob = 0.6) {
  const mx = (x0 + x1) / 2 + jit(wob);
  const my = (y0 + y1) / 2 + jit(wob);
  return `M${f(x0 + jit(wob * 0.4))} ${f(y0 + jit(wob * 0.4))} Q${f(mx)} ${f(my)} ${f(x1 + jit(wob * 0.4))} ${f(y1 + jit(wob * 0.4))} `;
}

/** A scalloped canopy outline (closed), like clumps of leaves drawn with a pen. */
function canopy(cx, cy, rx, ry, bumps = 14) {
  let d = "";
  for (let i = 0; i < bumps; i++) {
    const a0 = (i / bumps) * Math.PI * 2;
    const a1 = ((i + 1) / bumps) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const k = 1 + jit(0.08);
    const p0 = [cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry];
    const p1 = [cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry];
    const out = Math.sin(am) > 0.4 ? 1.08 : 1.32 * k; // flatter underneath
    const c = [cx + Math.cos(am) * rx * out, cy + Math.sin(am) * ry * out];
    if (i === 0) d += `M${f(p0[0])} ${f(p0[1])} `;
    d += `Q${f(c[0])} ${f(c[1])} ${f(p1[0])} ${f(p1[1])} `;
  }
  return d + "Z";
}

/** Little leaf clusters inside a canopy, denser on the shaded right and underside. */
function leafHatch(cx, cy, rx, ry, n = 60) {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * 0.85;
    const x = cx + Math.cos(a) * rx * r;
    const y = cy + Math.sin(a) * ry * r;
    const shade = (x - cx) / rx + (y - cy) / ry;
    if (shade < -0.6 && rnd() > 0.25) continue;
    d += `M${f(x)} ${f(y)} q${f(1.5 + rnd())} -2.5 ${f(3 + rnd() * 2)} 0 `;
  }
  return d;
}

function backgroundTrees() {
  const parts = [];
  for (const [cx, cy, rx, ry] of [[56, 140, 58, 34], [140, 120, 46, 28], [470, 112, 50, 30], [584, 126, 58, 34], [520, 92, 34, 20]]) parts.push(pathEl(canopy(cx, cy, rx, ry, 16), { color: SOFT, w: 0.9, op: 0.5 }));
  return parts.join("");
}

function tower(x, top, w) {
  const base = WATER - 8;
  const flare = 5;
  const parts = [];
  const outline = `M${x} ${top} L${x - flare} ${base} M${x + w} ${top} L${x + w + flare} ${base} M${x} ${top} H${x + w} M${x + w / 2} ${top} L${x + w / 2} ${base}`;
  parts.push(pathEl(outline, { w: 1.3 }));
  let floors = "";
  for (let y = top + 5; y < base; y += 4.2) {
    const t = (y - top) / (base - top);
    floors += `M${f(x - flare * t)} ${f(y)} H${f(x + w + flare * t)} `;
  }
  parts.push(pathEl(floors, { w: 0.45, op: 0.75 }));
  let shade = "";
  for (let k = 0; k < 8; k++) {
    const xx = x + w * 0.55 + k * (w * 0.055);
    shade += `M${f(xx)} ${top + 2} L${f(xx + flare * 0.9)} ${base} `;
  }
  parts.push(pathEl(shade, { w: 0.5, op: 0.6 }));
  return parts.join("");
}

function hotel() {
  const parts = [];
  const towers = [[178, 96, 34], [252, 92, 34], [326, 88, 34]];
  for (const [x, top, w] of towers) parts.push(tower(x, top, w));
  // the skypark: a long ship-like deck across the three roofs, cantilevered to the left
  parts.push(pathEl("M128 86 Q140 76 162 76 L372 72 Q388 73 392 79 L378 86 Z", { w: 1.4 }));
  parts.push(pathEl("M136 82 L384 78 M150 86 L376 84", { w: 0.6, op: 0.8 }));
  let bumps = "";
  for (let x = 170; x < 368; x += 9) bumps += `M${x} 76 q2 -4 4 0 `;
  parts.push(pathEl(bumps, { w: 0.6, op: 0.8 }));
  parts.push(pathEl("M140 86 Q150 92 168 90", { w: 0.6, op: 0.7 }));
  return parts.join("");
}

function cityTowers() {
  const parts = [];
  const blocks = [[404, 150, 24], [432, 176, 20], [456, 124, 30], [490, 160, 22], [516, 108, 28], [548, 146, 24], [576, 170, 30], [608, 156, 22]];
  for (const [x, top, w] of blocks) {
    const base = WATER - 8;
    parts.push(pathEl(`M${x} ${base} V${top} H${x + w} V${base}`, { w: 1.1 }));
    let win = "";
    for (let y = top + 6; y < base; y += 5) win += `M${x + 2} ${y} H${x + w - 2} `;
    parts.push(pathEl(win, { w: 0.4, op: 0.6 }));
    let shade = "";
    for (let k = 0; k < 4; k++) shade += `M${f(x + w * 0.62 + k * w * 0.1)} ${top + 1} V${base} `;
    parts.push(pathEl(shade, { w: 0.45, op: 0.55 }));
  }
  parts.push(pathEl("M530 108 V92 M528 96 H532", { w: 0.8 }));
  parts.push(pathEl("M456 124 L471 114 L486 124", { w: 0.9 }));
  return parts.join("");
}

function bankAndTrees() {
  const parts = [];
  // promenade and low waterfront buildings
  parts.push(pathEl(`M0 ${WATER} H${W}`, { w: 1.4 }));
  parts.push(pathEl(`M0 ${WATER - 4} H${W}`, { w: 0.6, op: 0.7 }));
  let low = "";
  for (const [x, w, h] of [[150, 40, 10], [200, 60, 8], [372, 36, 12], [420, 50, 9], [560, 40, 10]]) low += `M${x} ${WATER - 4} V${WATER - 4 - h} H${x + w} V${WATER - 4} `;
  parts.push(pathEl(low, { w: 0.8 }));
  let rail = "";
  for (let x = 4; x < W; x += 7) rail += `M${x} ${WATER - 4} V${WATER - 9} `;
  parts.push(pathEl(rail, { w: 0.35, op: 0.6 }));
  // big rain trees on the bank: wide, umbrella-shaped crowns over forked trunks
  for (const [cx, cy, rx, ry] of [[40, 210, 44, 26], [104, 218, 38, 22], [150, 236, 22, 14], [602, 224, 34, 20]]) {
    const top = WATER - 6;
    parts.push(pathEl(`M${cx - 3} ${top} C${cx - 2} ${cy + ry} ${cx - 8} ${cy + ry * 0.6} ${cx - rx * 0.45} ${cy + ry * 0.2} M${cx + 3} ${top} C${cx + 2} ${cy + ry} ${cx + 8} ${cy + ry * 0.6} ${cx + rx * 0.45} ${cy + ry * 0.25} M${cx} ${cy + ry * 1.2} V${cy + ry * 0.3}`, { w: 1.1 }));
    parts.push(pathEl(canopy(cx, cy, rx, ry, 16), { w: 1 }));
    parts.push(pathEl(leafHatch(cx, cy, rx, ry, Math.round(rx * 1.6)), { w: 0.6, op: 0.75 }));
  }
  let shrubs = "";
  for (const [x, r] of [[12, 8], [70, 10], [128, 7], [170, 6], [584, 9], [626, 7]]) shrubs += canopy(x, WATER - 10, r * 1.4, r * 0.8, 8) + " ";
  parts.push(pathEl(shrubs, { w: 0.8 }));
  // a pair of palms
  for (const x of [118, 574]) {
    parts.push(pathEl(`M${x} ${WATER - 6} C${x + 2} ${WATER - 40} ${x - 2} ${WATER - 60} ${x + 4} ${WATER - 82}`, { w: 1.1 }));
    let fr = "";
    for (const [dx, dy] of [[-18, 4], [-14, -8], [0, -14], [14, -8], [18, 4]]) fr += `M${x + 4} ${WATER - 82} q${dx * 0.5} ${dy - 6} ${dx} ${dy + 6} `;
    parts.push(pathEl(fr, { w: 0.9 }));
  }
  return parts.join("");
}

function water() {
  const parts = [];
  let ripples = "";
  for (let y = WATER + 6; y < H - 4; y += 5 + (y - WATER) * 0.04) {
    let x = jit(20);
    while (x < W) {
      const len = 16 + rnd() * 60;
      if (rnd() > 0.25) ripples += hand(x, y + jit(0.8), x + len, y + jit(0.8), 0.6);
      x += len + 6 + rnd() * 24;
    }
  }
  parts.push(pathEl(ripples, { w: 0.6, op: 0.7 }));
  // broken reflections under the towers
  let refl = "";
  for (const [x0, x1, depth] of [[176, 214, 70], [250, 288, 76], [324, 362, 80], [404, 428, 50], [456, 486, 64], [516, 544, 70], [576, 606, 40]]) {
    for (let x = x0; x < x1; x += 3) {
      for (let y = WATER + 4; y < WATER + depth; y += 7 + rnd() * 5) {
        if (rnd() > 0.45) refl += `M${f(x + jit(1))} ${f(y)} v${f(2 + rnd() * 3)} `;
      }
    }
  }
  parts.push(pathEl(refl, { w: 0.6, op: 0.55 }));
  // tree reflections, softer
  let trefl = "";
  for (let x = 8; x < 160; x += 4) for (let y = WATER + 4; y < WATER + 36; y += 6 + rnd() * 6) if (rnd() > 0.5) trefl += `M${f(x)} ${f(y)} h${f(3 + rnd() * 5)} `;
  parts.push(pathEl(trefl, { color: SOFT, w: 0.7, op: 0.6 }));
  return parts.join("");
}

function bumboat() {
  const x = 452;
  const y = 316;
  const parts = [];
  parts.push(pathEl(`M${x} ${y} H${x + 100} Q${x + 110} ${y} ${x + 112} ${y - 6} L${x + 96} ${y + 12} H${x + 10} Q${x + 2} ${y + 10} ${x} ${y} Z`, { w: 1.3 }));
  parts.push(pathEl(`M${x + 4} ${y + 5} H${x + 104}`, { w: 0.5, op: 0.8 }));
  parts.push(pathEl(`M${x + 18} ${y} V${y - 18} M${x + 52} ${y} V${y - 20} M${x + 86} ${y} V${y - 18}`, { w: 0.9 }));
  parts.push(pathEl(`M${x + 10} ${y - 18} Q${x + 52} ${y - 28} ${x + 96} ${y - 18} Z`, { w: 1.2 }));
  let roof = "";
  for (let k = 14; k < 94; k += 4) roof += `M${x + k} ${f(y - 19 - Math.sin(((k - 10) / 86) * Math.PI) * 4)} l2 4 `;
  parts.push(pathEl(roof, { w: 0.5, op: 0.8 }));
  let win = "";
  for (let k = 22; k < 84; k += 10) win += `M${x + k} ${y - 4} h6 v-8 h-6 z `;
  parts.push(pathEl(win, { w: 0.6, op: 0.8 }));
  parts.push(pathEl(`M${x + 100} ${y - 6} V${y - 30} M${x + 100} ${y - 30} l12 4 l-12 4`, { w: 0.9 }));
  let wake = "";
  for (let k = 0; k < 5; k++) wake += hand(x - 10 - k * 14, y + 10 + k * 2, x - 30 - k * 16, y + 11 + k * 2, 0.8);
  parts.push(pathEl(wake, { w: 0.7, op: 0.7 }));
  let shadow = "";
  for (let k = 0; k < 18; k++) shadow += `M${x + 8 + k * 5.5} ${y + 15 + jit(1)} h${f(3 + rnd() * 3)} `;
  parts.push(pathEl(shadow, { w: 0.8, op: 0.7 }));
  return parts.join("");
}

function birds() {
  return pathEl("M418 46 q4 -4 8 0 q4 -4 8 0 M440 34 q3 -3 6 0 q3 -3 6 0 M100 54 q3 -3 6 0 q3 -3 6 0", { w: 0.9, op: 0.8 });
}

export function skylineSketchSvg() {
  seed = 7;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>Pen sketch of the bay from the river</title>
<defs><radialGradient id="wash" cx="0.48" cy="0.62" r="0.62"><stop offset="0" stop-color="#8C7B5E" stop-opacity="0.16"/><stop offset="0.7" stop-color="#8C7B5E" stop-opacity="0.06"/><stop offset="1" stop-color="#8C7B5E" stop-opacity="0"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="url(#wash)"/>
${backgroundTrees()}
${birds()}
${cityTowers()}
${hotel()}
${bankAndTrees()}
${water()}
${bumboat()}
</svg>`;
}
