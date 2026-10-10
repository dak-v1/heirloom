// Decor for the profile page: the illustrated mini-map behind the map-icon preview,
// the explorer card's round seal and its faint shophouse facade.
import { textPath, FONTS } from "./fonts.mjs";
import { arcText } from "./brand.mjs";
import { P } from "./palette.mjs";

const f2 = (n) => +n.toFixed(2);

/** A small vintage street map (320 × 160) of a riverside heritage quarter. */
export function miniMapSvg() {
  const road = (d, w = 8) => `<path d="${d}" fill="none" stroke="${P.paperBorder}" stroke-width="${w + 2}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#FFFDF7" stroke-width="${w}" stroke-linecap="round"/>`;
  const block = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#E9DFCB" stroke="#D3C6AD" stroke-width="1"/>`;
  const tree = (x, y, r = 5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#A8B48F" stroke="#7E8C68" stroke-width="1"/>`;
  const shop = (x, y, n) => {
    let s = "";
    for (let i = 0; i < n; i++) {
      const hx = x + i * 13;
      s += `<path d="M${hx} ${y} V${y - 14} L${hx + 6.5} ${y - 19} L${hx + 13} ${y - 14} V${y}" fill="#F3E6CF"/><path d="M${hx + 3} ${y} V${y - 6} Q${hx + 6.5} ${y - 10} ${hx + 10} ${y - 6} V${y} M${hx + 4} ${y - 10} h5" />`;
    }
    return `<g stroke="${P.inkMuted}" stroke-width="1" fill="none" stroke-linejoin="round">${s}<path d="M${x - 2} ${y} H${x + n * 13 + 2}"/></g>`;
  };
  const site = (x, y, n) =>
    `<g transform="translate(${x} ${y})"><path d="M0 0 C-7 -8 -8 -14 -8 -17 A8 8 0 0 1 8 -17 C8 -14 7 -8 0 0 Z" fill="${P.terracotta}" stroke="#fff" stroke-width="1.4"/><path d="${textPath(String(n), { file: FONTS.display(800), size: 9, x: 0, y: -14, anchor: "middle" }).d}" fill="#fff"/></g>`;
  const N = textPath("N", { file: FONTS.display(800), size: 9, x: 296, y: 26, anchor: "middle" }).d;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160" width="320" height="160">
<title>Illustrated map</title>
<defs><clipPath id="map"><rect width="320" height="160"/></clipPath></defs>
<g clip-path="url(#map)">
<rect width="320" height="160" fill="#F3ECDD"/>
<path d="M210 0 C214 24 240 40 278 38 C300 37 320 30 320 30 V0 Z" fill="#DCE3CF"/>
<path d="M0 104 C30 98 50 116 40 140 L0 160 Z" fill="#DCE3CF"/>
${block(14, 14, 40, 22)}${block(62, 10, 34, 26)}${block(14, 44, 30, 30)}${block(150, 16, 44, 20)}${block(150, 44, 30, 26)}${block(234, 58, 30, 22)}${block(272, 58, 34, 18)}${block(112, 54, 26, 18)}
<path d="M-10 128 C40 112 80 140 132 124 C180 110 206 92 250 100 C284 106 300 120 330 114" fill="none" stroke="#9FBBD3" stroke-width="22" stroke-linecap="round"/>
<path d="M-10 128 C40 112 80 140 132 124 C180 110 206 92 250 100 C284 106 300 120 330 114" fill="none" stroke="#B9CFE0" stroke-width="16" stroke-linecap="round"/>
<path d="M30 126 h10 M96 128 h12 M178 108 h10 M260 106 h12" stroke="#E6EEF4" stroke-width="1.6" stroke-linecap="round"/>
${road("M0 40 H320", 7)}${road("M104 0 V112", 7)}${road("M200 0 C200 30 214 60 222 98", 6)}${road("M0 84 C60 80 120 90 200 76 S300 62 320 64", 6)}${road("M150 108 L162 160", 5)}
${shop(16, 38, 3)}${shop(150, 38, 3)}
${tree(70, 60)}${tree(82, 66, 4)}${tree(240, 18)}${tree(256, 24, 4)}${tree(272, 16, 6)}${tree(20, 122, 4)}${tree(30, 132, 5)}${tree(186, 140, 5)}${tree(200, 146, 4)}
<path d="M44 64 C80 70 96 62 126 76 S186 70 214 54 S262 50 286 82" fill="none" stroke="${P.terracotta}" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round"/>
${site(44, 62, 1)}${site(214, 52, 2)}${site(286, 80, 3)}
<g transform="translate(296 36)" stroke="${P.inkMuted}" stroke-width="1" fill="none"><circle r="9"/><path d="M0 -12 L3 0 L0 12 L-3 0 Z" fill="${P.inkMuted}"/></g>
<path d="${N}" fill="${P.inkMuted}" transform="translate(0 -14)"/>
</g>
<rect x="0.5" y="0.5" width="319" height="159" fill="none" stroke="${P.paperBorder}"/>
</svg>`;
}

/** Round explorer seal: arc lettering around a Vanda Miss Joaquim–style orchid. */
export function sealSvg({ color = P.terracotta } = {}) {
  const file = FONTS.display(700);
  const top = arcText("HERITAGE EXPLORER", { file, size: 9.5, cx: 70, cy: 70, r: 51, centerDeg: 0, tracking: 0.22 });
  const bottom = arcText("SINGAPORE", { file, size: 9.5, cx: 70, cy: 70, r: 51, centerDeg: 180, tracking: 0.3, inside: true });
  let petals = "";
  for (let i = 0; i < 5; i++) {
    petals += `<path d="M0 -4 C-7 -10 -7 -22 0 -28 C7 -22 7 -10 0 -4 Z" transform="rotate(${i * 72})"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" width="140" height="140">
<title>Heritage Explorer seal</title>
<g fill="${color}" opacity="0.9">
<circle cx="70" cy="70" r="66" fill="none" stroke="${color}" stroke-width="3.5"/>
<circle cx="70" cy="70" r="60" fill="none" stroke="${color}" stroke-width="1.2"/>
<circle cx="70" cy="70" r="40" fill="none" stroke="${color}" stroke-width="1.2" stroke-dasharray="2 3"/>
${top}${bottom}
<circle cx="17" cy="70" r="2.2"/><circle cx="123" cy="70" r="2.2"/>
<g transform="translate(70 72)" fill="${color}" fill-opacity="0.85">${petals}</g>
<circle cx="70" cy="72" r="6" fill="${P.paperLight}" stroke="${color}" stroke-width="2"/>
</g>
</svg>`;
}

/** Faint two-storey shophouse with a palm, line art for the explorer card. */
export function facadeSvg({ ink = P.inkMuted } = {}) {
  const win = (x, y) => `<path d="M${x} ${y + 30} V${y + 8} Q${x + 7} ${y} ${x + 14} ${y + 8} V${y + 30} Z M${x + 7} ${y + 3} V${y + 30} M${x} ${y + 15} H${x + 14} M${x} ${y + 22} H${x + 14}"/>`;
  let tiles = "";
  for (let x = 30; x < 180; x += 6) tiles += `M${x} 60 l3 -4 l3 4 `;
  let frond = "";
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.95 + (i * Math.PI * 0.9) / 8;
    const x2 = 196 + Math.cos(a) * 34, y2 = 66 + Math.sin(a) * 26 + 14;
    frond += `M196 66 Q${f2(196 + Math.cos(a) * 20)} ${f2(56 + Math.sin(a) * 18)} ${f2(x2)} ${f2(y2)} `;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 200" width="220" height="200">
<title>Shophouse facade</title>
<g fill="none" stroke="${ink}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
<path d="M26 192 V62 H70 C72 44 88 32 104 28 C120 32 136 44 138 62 H182 V192"/>
<path d="M22 62 H186 M24 68 H184"/><path d="${tiles}" stroke-width="0.8"/>
<circle cx="104" cy="48" r="7"/><circle cx="104" cy="48" r="2.5"/>
${win(38, 78)}${win(62, 78)}${win(97, 78)}${win(132, 78)}${win(156, 78)}
<path d="M26 118 H182 M26 122 H182"/>
<path d="M30 192 V150 Q48 128 66 150 V192 M86 192 V150 Q104 128 122 150 V192 M142 192 V150 Q160 128 178 150 V192"/>
<path d="M95 192 V160 H113 V192 M104 160 V192" stroke-width="1"/>
<path d="M20 192 H200"/>
<path d="M196 192 C194 160 198 120 196 66" stroke-width="2"/>
<path d="M194 180 h4 M194 166 h4 M194 152 h4 M195 138 h4 M195 124 h4 M195 110 h4 M195 96 h4 M195 82 h4" stroke-width="1"/>
<path d="${frond}"/>
<path d="M8 192 C10 176 4 168 8 160 M8 172 C2 168 0 160 2 154 M8 176 C14 170 16 162 14 156" stroke-width="1"/>
</g>
</svg>`;
}
