// Achievement badges: scalloped enamel-pin medallions with a ribbon name banner.
import { textPath, cjkPath, FONTS } from "./fonts.mjs";
import { P } from "./palette.mjs";

const TONES = {
  terracotta: { base: "#A94E36", dark: "#6F2E1F", light: "#F2DDD3" },
  mustard: { base: "#BC9545", dark: "#6E5420", light: "#F3E7C8" },
  olive: { base: "#687758", dark: "#3C4931", light: "#E1E6D6" },
  blue: { base: "#6884A3", dark: "#334C69", light: "#DCE4EE" },
};

const sw = (w) => `fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

// Icons are drawn in a 100 × 100 box centred at (50, 50) using currentColor.
const ICONS = {
  footprints() {
    const foot = (x, y, r, flip) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${flip ? -1 : 1} 1)">
      <path d="M0 -14 C7 -14 9 -4 8 4 C7 11 2 14 -2 12 C-7 10 -8 2 -7 -4 C-6 -10 -4 -14 0 -14 Z" fill="currentColor"/>
      <ellipse cx="0" cy="20" rx="5.5" ry="6.5" fill="currentColor"/></g>`;
    return `${foot(36, 58, -14, false)}${foot(62, 36, 12, true)}
      <path d="M18 86 Q50 76 84 84" ${sw(2)} stroke-dasharray="2 5"/>`;
  },
  pocketWatch() {
    let ticks = "";
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const r0 = i % 3 === 0 ? 20 : 23, r1 = 26;
      ticks += `M${(50 + Math.sin(a) * r0).toFixed(1)} ${(56 - Math.cos(a) * r0).toFixed(1)} L${(50 + Math.sin(a) * r1).toFixed(1)} ${(56 - Math.cos(a) * r1).toFixed(1)} `;
    }
    return `<circle cx="50" cy="56" r="31" ${sw(3.2)}/><circle cx="50" cy="56" r="27" ${sw(1.2)}/>
      <path d="${ticks}" ${sw(1.8)}/>
      <path d="M50 56 L50 38 M50 56 L62 63" ${sw(3)}/><circle cx="50" cy="56" r="2.6" fill="currentColor"/>
      <path d="M44 22 H56 M47 22 V18 H53 V22" ${sw(2.6)}/><circle cx="50" cy="13" r="4.5" ${sw(2.4)}/>
      <path d="M54.5 13 Q74 8 82 22 Q86 30 80 34" ${sw(1.8)} stroke-dasharray="3 2.5"/>`;
  },
  magnifier() {
    return `<rect x="16" y="20" width="44" height="34" rx="2" ${sw(2)}/>
      <path d="M20 48 L32 36 L40 43 L48 33 L56 48" ${sw(1.8)}/><circle cx="27" cy="29" r="3.2" ${sw(1.6)}/>
      <circle cx="56" cy="54" r="20" fill="${P.paperLight}" ${sw(3.4).replace('fill="none" ', "")}/>
      <circle cx="56" cy="54" r="15.5" ${sw(1.2)}/>
      <path d="M48 47 Q51 43 56 43" ${sw(2)}/>
      <path d="M70.5 68.5 L86 84" ${sw(7)}/><path d="M70.5 68.5 L75 73" ${sw(3.4)}/>`;
  },
  gramophone() {
    return `<rect x="22" y="70" width="46" height="16" rx="2" ${sw(2.8)}/><path d="M26 78 H64" ${sw(1.2)}/>
      <ellipse cx="45" cy="70" rx="17" ry="3.5" ${sw(1.6)}/>
      <path d="M60 68 V58 Q60 52 54 50" ${sw(2.6)}/>
      <path d="M54 50 L48 46 C44 36 50 18 66 12 C78 8 88 14 90 22 C80 22 70 30 64 40 L54 50 Z" fill="${P.paperLight}" ${sw(2.8).replace('fill="none" ', "")}/>
      <path d="M66 12 C70 22 70 30 64 40 M78 10 C80 20 76 28 70 34" ${sw(1.3)}/>
      <path d="M18 30 q4 -4 8 0 M14 42 q5 -5 10 0" ${sw(1.8)}/>`;
  },
  lantern() {
    return `<path d="M50 8 V16 M42 16 H58" ${sw(2.6)}/><path d="M40 8 Q50 2 60 8" ${sw(2.2)}/>
      <path d="M36 24 H64 L60 18 H40 Z" fill="currentColor"/>
      <path d="M38 24 L34 70 H66 L62 24" ${sw(2.6)}/>
      <path d="M50 24 V70 M36 47 H64" ${sw(1.2)}/>
      <path d="M50 58 C44 52 46 44 50 38 C54 44 56 52 50 58 Z" fill="currentColor"/>
      <path d="M30 70 H70 L66 78 H34 Z" fill="currentColor"/>
      <path d="M22 40 L14 36 M22 52 L12 52 M78 40 L86 36 M78 52 L88 52" ${sw(2)}/>`;
  },
  book() {
    const g = [
      textPath("A", { file: FONTS.display(700), size: 15, x: 24, y: 32, anchor: "middle" }).d,
      cjkPath("中", { size: 14, x: 42, y: 22, anchor: "middle" }).d,
      textPath("அ", { file: FONTS.tamil(700), size: 13, x: 60, y: 22, anchor: "middle" }).d,
      textPath("ج", { file: FONTS.jawi(700), size: 17, x: 78, y: 32, anchor: "middle" }).d,
    ];
    return `<path d="${g.join("")}" fill="currentColor"/>
      <path d="M50 46 C40 40 26 40 14 44 V82 C26 78 40 78 50 84 C60 78 74 78 86 82 V44 C74 40 60 40 50 46 Z" fill="${P.paperLight}" ${sw(2.8).replace('fill="none" ', "")}/>
      <path d="M50 46 V84 M20 52 C28 50 36 50 44 53 M20 60 C28 58 36 58 44 61 M20 68 C28 66 36 66 44 69 M56 53 C64 50 72 50 80 52 M56 61 C64 58 72 58 80 60 M56 69 C64 66 72 66 80 68" ${sw(1.3)}/>`;
  },
  trailMap() {
    const pin = (x, y) => `<path d="M${x} ${y} C${x - 7} ${y - 8} ${x - 7} ${y - 16} ${x} ${y - 17} C${x + 7} ${y - 16} ${x + 7} ${y - 8} ${x} ${y} Z" fill="currentColor"/><circle cx="${x}" cy="${y - 11}" r="2.4" fill="${P.paperLight}"/>`;
    return `<path d="M12 28 L36 20 L64 28 L88 20 V76 L64 84 L36 76 L12 84 Z" fill="${P.paperLight}" ${sw(2.6).replace('fill="none" ', "")}/>
      <path d="M36 20 V76 M64 28 V84" ${sw(1.4)}/>
      <path d="M22 70 C30 58 40 66 48 54 S66 44 76 36" ${sw(2)} stroke-dasharray="3 3.5"/>
      ${pin(22, 70)}${pin(50, 56)}${pin(76, 38)}`;
  },
  quill() {
    return `<path d="M18 30 H62 V72 H18 Z" fill="${P.paperLight}" ${sw(2.4).replace('fill="none" ', "")}/>
      <path d="M24 40 H48 M24 48 H44 M24 56 H40" ${sw(1.4)}/>
      <path d="M40 66 C36 60 30 62 31 67 C32 72 40 76 40 76 C40 76 48 72 49 67 C50 62 44 60 40 66 Z" fill="currentColor" transform="translate(4 -10) scale(0.9)"/>
      <path d="M86 12 C70 14 56 30 50 52 L46 70 L54 56 C66 50 80 34 86 12 Z" fill="${P.paperLight}" ${sw(2.4).replace('fill="none" ', "")}/>
      <path d="M86 12 L50 62 M70 26 L62 28 M76 20 L66 24 M64 36 L56 37" ${sw(1.4)}/>
      <path d="M46 70 L43 80" ${sw(2.4)}/>`;
  },
};

export const BADGES = [
  { id: "first-footsteps", name: "First Footsteps", icon: "footprints", tone: "terracotta" },
  { id: "time-traveller", name: "Time Traveller", icon: "pocketWatch", tone: "mustard" },
  { id: "sharp-eye", name: "Sharp Eye", icon: "magnifier", tone: "blue" },
  { id: "good-listener", name: "Good Listener", icon: "gramophone", tone: "olive" },
  { id: "curious-mind", name: "Curious Mind", icon: "lantern", tone: "mustard" },
  { id: "many-tongues", name: "Many Tongues", icon: "book", tone: "blue" },
  { id: "three-journeys", name: "Three Journeys", icon: "trailMap", tone: "terracotta" },
  { id: "memory-keeper", name: "Memory Keeper", icon: "quill", tone: "olive" },
];

function scallopPath(cx, cy, r, n, depth) {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const p0 = [cx + Math.cos(a0) * (r - depth), cy + Math.sin(a0) * (r - depth)];
    const pm = [cx + Math.cos(am) * (r + depth), cy + Math.sin(am) * (r + depth)];
    const p1 = [cx + Math.cos(a1) * (r - depth), cy + Math.sin(a1) * (r - depth)];
    if (i === 0) d += `M${p0[0].toFixed(2)} ${p0[1].toFixed(2)} `;
    d += `Q${pm[0].toFixed(2)} ${pm[1].toFixed(2)} ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} `;
  }
  return d + "Z";
}

export function badgeSvg(badge) {
  const t = TONES[badge.tone];
  const label = badge.name.toUpperCase();
  let size = 15;
  let txt = textPath(label, { file: FONTS.display(800), size, x: 120, y: 0, anchor: "middle", tracking: 0.08 });
  if (txt.width > 150) size = (size * 150) / txt.width;
  txt = textPath(label, { file: FONTS.display(800), size, x: 120, y: 199 + size * 0.36, anchor: "middle", tracking: 0.08 });
  let dots = "";
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    dots += `<circle cx="${(120 + Math.cos(a) * 92).toFixed(2)}" cy="${(112 + Math.sin(a) * 92).toFixed(2)}" r="1.5" fill="${P.paperLight}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
<title>${badge.name} badge</title>
<path d="${scallopPath(120, 112, 104, 28, 4)}" fill="${t.dark}"/>
<circle cx="120" cy="112" r="98" fill="${t.base}"/>
${dots}
<circle cx="120" cy="112" r="84" fill="${P.paperLight}" stroke="${t.dark}" stroke-width="3"/>
<circle cx="120" cy="112" r="78" fill="none" stroke="${t.base}" stroke-width="1" stroke-dasharray="2 3"/>
<g transform="translate(62.5 44.5) scale(1.15)" color="${t.dark}">${ICONS[badge.icon]()}</g>
<path d="M14 180 L40 180 L32 196 L40 212 L14 212 L22 196 Z" fill="${t.dark}"/>
<path d="M226 180 L200 180 L208 196 L200 212 L226 212 L218 196 Z" fill="${t.dark}"/>
<path d="M30 176 H210 L204 218 H36 Z" fill="${t.base}"/>
<path d="M30 176 H210 L204 218 H36 Z" fill="none" stroke="${t.dark}" stroke-width="2"/>
<path d="M38 181 H202 M40 213 H200" stroke="${P.paperLight}" stroke-width="0.8" opacity="0.7"/>
<path d="${txt.d}" fill="${P.paperLight}"/>
</svg>`;
}
