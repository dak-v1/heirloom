// Achievement badges as Singapore-themed enamel pins (200 × 200, transparent).
// Each pin is a die-struck metal shape with enamel fields between raised metal
// lines, a thickness edge and a gloss highlight, like a souvenir lapel pin.
import { textPath, cjkPath, FONTS } from "./fonts.mjs";

const METALS = {
  gold: { hi: "#F4E2A6", mid: "#C9A24E", lo: "#8A6526", edge: "#5E431A" },
  silver: { hi: "#FAF8F2", mid: "#C3BEB2", lo: "#7E786C", edge: "#4E4A42" },
};

// Enamel colours: the app palette, a touch richer, as hard enamel looks.
const E = {
  cream: "#F7EFDC",
  sand: "#E6D3AE",
  terracotta: "#B5543B",
  red: "#B7443A",
  deepRed: "#8E3328",
  mustard: "#D9AE4E",
  yellow: "#EBC968",
  olive: "#6F8A5C",
  green: "#5E8C6A",
  mint: "#A9CDB6",
  teal: "#3F8380",
  blue: "#5F84A8",
  navy: "#2F4A66",
  sepia: "#E9D9B6",
  river: "#9DB1B4",
  pink: "#E7AFA6",
  rose: "#C76F73",
  wood: "#9A643B",
  woodDark: "#6A3F24",
  ink: "#2D2A23",
  slate: "#55636B",
};

const f2 = (n) => +n.toFixed(2);
const metal = (w = 2.4) => `stroke="url(#m)" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/**
 * Assemble a pin. `shape` is the silhouette as bare elements (no fill attributes).
 * `body` is drawn clipped to the silhouette; `over` is drawn on top, unclipped
 * (cut-out details such as spokes); `lines` are extra unclipped raised-metal strokes.
 */
function pin({ title, metal: kind = "gold", shape, body, over = "", evenodd = false }) {
  const m = METALS[kind];
  const rule = evenodd ? ' fill-rule="evenodd" clip-rule="evenodd"' : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
<title>${title}</title>
<defs>
  <linearGradient id="m" gradientUnits="userSpaceOnUse" x1="20" y1="10" x2="180" y2="190">
    <stop offset="0" stop-color="${m.hi}"/><stop offset="0.42" stop-color="${m.mid}"/><stop offset="0.7" stop-color="${m.hi}"/><stop offset="1" stop-color="${m.lo}"/>
  </linearGradient>
  <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="30" y1="20" x2="140" y2="150">
    <stop offset="0" stop-color="#fff" stop-opacity="0.5"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.1"/><stop offset="0.46" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <clipPath id="c"${evenodd ? ' clip-rule="evenodd"' : ""}>${shape}</clipPath>
</defs>
<g transform="translate(2.2 3.4)" fill="${m.edge}"${rule}>${shape}</g>
<g fill="url(#m)"${rule}>${shape}</g>
<g clip-path="url(#c)">${body}</g>
${over}
<g fill="none" stroke="url(#m)" stroke-width="4.5" stroke-linejoin="round"${rule}>${shape}</g>
<rect width="200" height="200" fill="url(#g)" clip-path="url(#c)"/>
</svg>`;
}

/** Text that fits `maxW`, centred at x. */
function fit(text, { file, size, x, y, maxW, cjk = false }) {
  const make = (s) => (cjk ? cjkPath(text, { size: s, x, y, anchor: "middle" }) : textPath(text, { file, size: s, x, y, anchor: "middle" }));
  let t = make(size);
  if (t.width > maxW) t = make((size * maxW) / t.width);
  return t.d;
}

const foot = (x, y, rot, s = 1) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 -8 C4 -8 5 -2 4.6 2.4 C4 6.4 1.2 8 -1.2 6.8 C-4 5.6 -4.6 1.2 -4 -2.4 C-3.4 -6 -2.2 -8 0 -8 Z"/><ellipse cx="0" cy="11.4" rx="3.2" ry="3.6"/></g>`;

/* ------------------------------------------------------------------ */
/* First Footsteps: a Peranakan shophouse and its five-foot way        */
/* ------------------------------------------------------------------ */
function firstFootsteps() {
  const shape = `<path d="M44 186 V66 H72 C72 50 88 36 100 30 C112 36 128 50 128 66 H156 V186 Z"/>`;
  const window = (x) =>
    `<path d="M${x} 122 V90 Q${x} 79 ${x + 11} 79 Q${x + 22} 79 ${x + 22} 90 V122 Z" fill="${E.green}" ${metal(2.2)}/>
     <path d="M${x + 11} 81 V122 M${x + 2} 96 H${x + 20} M${x + 2} 104 H${x + 20} M${x + 2} 112 H${x + 20}" ${metal(1.2)}/>`;
  const arch = (x) => `<path d="M${x} 190 V158 Q${x + 14} 140 ${x + 28} 158 V190 Z" fill="#4A3F35" ${metal(2.2)}/>`;
  const body = `<rect width="200" height="200" fill="${E.mint}"/>
    <path d="M72 66 C72 50 88 36 100 30 C112 36 128 50 128 66 Z" fill="${E.cream}" ${metal(2.2)}/>
    <circle cx="100" cy="52" r="7.5" fill="${E.terracotta}" ${metal(2)}/><circle cx="100" cy="52" r="2.4" fill="${E.yellow}"/>
    <rect x="40" y="64" width="120" height="9" fill="${E.cream}" ${metal(2)}/>
    ${window(56)}${window(122)}
    <rect x="86" y="84" width="28" height="34" rx="3" fill="${E.pink}" ${metal(2.2)}/>
    <path d="M100 92 L108 101 L100 110 L92 101 Z" fill="${E.cream}" ${metal(1.4)}/><circle cx="100" cy="101" r="2.2" fill="${E.rose}"/>
    <rect x="40" y="126" width="120" height="8" fill="${E.cream}" ${metal(2)}/>
    ${arch(50)}${arch(86)}${arch(122)}
    <g fill="${E.cream}">${foot(94, 176, -14, 1.2)}${foot(107, 156, 10, 1.15)}</g>
    <rect x="40" y="183" width="120" height="8" fill="${E.sand}" ${metal(1.6)}/>`;
  return pin({ title: "First Footsteps pin: a shophouse and its five-foot way", shape, body });
}

/* ------------------------------------------------------------------ */
/* Time Traveller: a colonial clock tower                              */
/* ------------------------------------------------------------------ */
function timeTraveller() {
  const shape = `<path d="M100 8 L116 50 H120 V70 H127 V122 H120 V168 H138 V190 H62 V168 H80 V122 H73 V70 H80 V50 H84 Z"/>`;
  let ticks = "";
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const r0 = i % 3 === 0 ? 12.5 : 14.5;
    ticks += `M${f2(100 + Math.sin(a) * r0)} ${f2(98 - Math.cos(a) * r0)} L${f2(100 + Math.sin(a) * 17)} ${f2(98 - Math.cos(a) * 17)} `;
  }
  const tall = (x, y0, y1) => `<path d="M${x} ${y1} V${y0 + 5} Q${x + 4} ${y0} ${x + 8} ${y0 + 5} V${y1} Z" fill="${E.navy}" ${metal(1.6)}/>`;
  const body = `<rect width="200" height="200" fill="${E.cream}"/>
    <path d="M100 8 L116 50 H84 Z" fill="${E.slate}" ${metal(2.2)}/><path d="M100 14 V50 M92 32 L108 32" ${metal(1.3)}/>
    <rect x="80" y="50" width="40" height="20" fill="${E.cream}" ${metal(2)}/>
    ${tall(86, 54, 68)}${tall(104, 54, 68)}
    <rect x="73" y="68" width="54" height="7" fill="${E.mustard}" ${metal(2)}/>
    <rect x="73" y="75" width="54" height="46" fill="${E.cream}" ${metal(2)}/>
    <circle cx="100" cy="98" r="19.5" fill="#FFFBF2" ${metal(3)}/>
    <path d="${ticks}" stroke="${E.navy}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M100 98 L100 84 M100 98 L110 104" stroke="${E.navy}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="100" cy="98" r="2.6" fill="${E.terracotta}"/>
    <rect x="73" y="120" width="54" height="6" fill="${E.mustard}" ${metal(2)}/>
    <rect x="80" y="126" width="40" height="42" fill="${E.cream}" ${metal(2)}/>
    ${tall(87, 132, 160)}${tall(105, 132, 160)}
    <rect x="62" y="168" width="76" height="22" fill="${E.sand}" ${metal(2)}/>
    <path d="M62 174 H138" ${metal(1.3)}/>
    <path d="M92 192 V181 Q100 172 108 181 V192 Z" fill="${E.navy}" ${metal(1.8)}/>`;
  return pin({ title: "Time Traveller pin: a clock tower", shape, body });
}

/* ------------------------------------------------------------------ */
/* Sharp Eye: a magnifier over an old photograph of the river          */
/* ------------------------------------------------------------------ */
function sharpEye() {
  const handle = `<rect x="-11" y="0" width="22" height="70" rx="10" transform="translate(126 126) rotate(-45)"/>`;
  const shape = `<circle cx="84" cy="84" r="64"/>${handle}`;
  const boat = (x, y, w) =>
    `<path d="M${x} ${y} H${x + w} L${x + w - 6} ${y + 8} H${x + 8} Z" fill="${E.woodDark}" ${metal(1.4)}/>
     <path d="M${x + 10} ${y} Q${x + w / 2} ${y - 11} ${x + w - 10} ${y} Z" fill="${E.mustard}" ${metal(1.2)}/>`;
  const body = `<rect width="200" height="200" fill="url(#m)"/>
    <rect x="-11" y="0" width="22" height="70" rx="10" transform="translate(126 126) rotate(-45)" fill="${E.woodDark}"/>
    <path d="M140 162 L162 140 M150 172 L172 150" transform="translate(-2 2)" stroke="${E.wood}" stroke-width="2" stroke-linecap="round"/>
    <rect x="-12" y="2" width="24" height="12" transform="translate(126 126) rotate(-45)" fill="url(#m)" ${metal(1.4)}/>
    <clipPath id="lens"><circle cx="84" cy="84" r="51"/></clipPath>
    <g clip-path="url(#lens)">
      <rect width="200" height="200" fill="${E.sepia}"/>
      <path d="M28 96 V76 L38 70 L48 76 V66 L60 60 L72 66 V72 L84 64 L96 72 V62 L108 56 L120 62 V70 L132 64 L142 70 V96 Z" fill="#B49671" ${metal(1.4)}/>
      <path d="M40 80 h4 M64 74 h4 M88 78 h4 M112 70 h4 M126 76 h4 M52 86 h4 M100 84 h4" stroke="${E.sepia}" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="20" y="96" width="140" height="60" fill="${E.river}" ${metal(1.6)}/>
      <path d="M36 128 h12 M70 138 h16 M110 130 h12 M52 146 h10 M98 148 h14" stroke="#E7EEEF" stroke-width="2" stroke-linecap="round"/>
      ${boat(44, 108, 44)}${boat(96, 122, 34)}
    </g>
    <circle cx="84" cy="84" r="51" fill="none" stroke="#8A6526" stroke-opacity="0.35" stroke-width="6"/>
    <circle cx="84" cy="84" r="51" fill="none" ${metal(3)}/>
    <path d="M50 58 Q60 42 80 38" stroke="#fff" stroke-opacity="0.8" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  return pin({ title: "Sharp Eye pin: a magnifier over an old photo of the Singapore River", shape, body });
}

/* ------------------------------------------------------------------ */
/* Good Listener: a 1950s cable-radio set with a music note            */
/* ------------------------------------------------------------------ */
function goodListener() {
  const note = `<ellipse cx="148" cy="52" rx="13" ry="9.5" transform="rotate(-22 148 52)"/><rect x="155" y="12" width="7.5" height="40" rx="2"/><path d="M162 12 C178 16 186 28 179 42 C176 33 170 28 162 28 Z"/>`;
  const shape = `<path d="M28 168 V100 C28 62 60 44 100 44 C140 44 172 62 172 100 V168 Q172 176 164 176 H36 Q28 176 28 168 Z"/>${note}`;
  let rays = "";
  for (let a = -168; a <= -12; a += 13) {
    const r = (a * Math.PI) / 180;
    rays += `M100 124 L${f2(100 + Math.cos(r) * 70)} ${f2(124 + Math.sin(r) * 70)} `;
  }
  let ticks = "";
  for (let x = 54; x <= 146; x += 8) ticks += `M${x} 132 V${x % 16 === 6 ? 140 : 137} `;
  const body = `<rect width="200" height="200" fill="${E.wood}"/>
    <path d="M40 160 C70 156 120 164 160 158 M40 112 C60 108 74 116 92 110" stroke="${E.woodDark}" stroke-opacity="0.5" stroke-width="1.6" fill="none"/>
    <clipPath id="grille"><path d="M46 122 V102 C46 74 70 58 100 58 C130 58 154 74 154 102 V122 Z"/></clipPath>
    <path d="M46 122 V102 C46 74 70 58 100 58 C130 58 154 74 154 102 V122 Z" fill="${E.sand}"/>
    <g clip-path="url(#grille)"><path d="${rays}" ${metal(1.8)}/></g>
    <path d="M46 122 V102 C46 74 70 58 100 58 C130 58 154 74 154 102 V122 Z" fill="none" ${metal(2.6)}/>
    <circle cx="100" cy="112" r="9" fill="${E.mustard}" ${metal(2)}/>
    <rect x="46" y="128" width="108" height="20" rx="4" fill="${E.cream}" ${metal(2.2)}/>
    <path d="${ticks}" stroke="${E.ink}" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M116 130 V146" stroke="${E.red}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="58" cy="161" r="8" fill="url(#m)" ${metal(1.6)}/><circle cx="142" cy="161" r="8" fill="url(#m)" ${metal(1.6)}/>
    <path d="M55 161 h6 M142 158 v6" stroke="${E.woodDark}" stroke-width="1.6" stroke-linecap="round"/>
    <rect x="80" y="156" width="40" height="10" rx="2" fill="${E.cream}" ${metal(1.6)}/>
    <g fill="${E.terracotta}" ${metal(2)}>${note}</g>`;
  return pin({ title: "Good Listener pin: a vintage cable-radio set", shape, body });
}

/* ------------------------------------------------------------------ */
/* Curious Mind: a Peranakan majolica tile                             */
/* ------------------------------------------------------------------ */
function curiousMind() {
  const shape = `<rect x="28" y="28" width="144" height="144" rx="12"/>`;
  const quarter = (cx, cy) =>
    `<circle cx="${cx}" cy="${cy}" r="24" fill="${E.pink}" ${metal(2)}/><circle cx="${cx}" cy="${cy}" r="14" fill="${E.rose}" ${metal(1.8)}/><circle cx="${cx}" cy="${cy}" r="6" fill="${E.yellow}" ${metal(1.4)}/>`;
  let petals = "";
  for (let i = 0; i < 8; i++) {
    petals += `<ellipse cx="100" cy="78" rx="8.5" ry="19" transform="rotate(${i * 45} 100 100)" fill="${i % 2 ? E.pink : E.rose}" ${metal(1.8)}/>`;
  }
  let leaves = "";
  for (let i = 0; i < 4; i++) {
    leaves += `<path d="M0 -15 C8 -8 8 8 0 16 C-8 8 -8 -8 0 -15 Z" transform="rotate(${45 + i * 90} 100 100) translate(100 64)" fill="${E.green}" ${metal(1.6)}/>`;
  }
  let dots = "";
  for (let k = 0; k < 5; k++) {
    const t = 50 + k * 25;
    dots += `<circle cx="${t}" cy="35" r="2.3"/><circle cx="${t}" cy="165" r="2.3"/><circle cx="35" cy="${t}" r="2.3"/><circle cx="165" cy="${t}" r="2.3"/>`;
  }
  const mid = (x, y, rot) => `<path d="M0 -9 L7 4 L0 9 L-7 4 Z" transform="translate(${x} ${y}) rotate(${rot})" fill="${E.blue}" ${metal(1.5)}/>`;
  const body = `<rect width="200" height="200" fill="${E.teal}"/>
    <g fill="${E.cream}">${dots}</g>
    <rect x="42" y="42" width="116" height="116" fill="${E.cream}" ${metal(2.4)}/>
    <clipPath id="tile"><rect x="42" y="42" width="116" height="116"/></clipPath>
    <g clip-path="url(#tile)">${quarter(42, 42)}${quarter(158, 42)}${quarter(42, 158)}${quarter(158, 158)}</g>
    ${mid(100, 52, 0)}${mid(148, 100, 90)}${mid(100, 148, 180)}${mid(52, 100, 270)}
    ${leaves}${petals}
    <circle cx="100" cy="100" r="11" fill="${E.yellow}" ${metal(2)}/><circle cx="100" cy="100" r="4" fill="${E.terracotta}"/>`;
  return pin({ title: "Curious Mind pin: a Peranakan tile", metal: "silver", shape, body });
}

/* ------------------------------------------------------------------ */
/* Many Tongues: hello in Singapore's four official languages          */
/* ------------------------------------------------------------------ */
function manyTongues() {
  const shape = `<path d="M40 28 H160 Q180 28 180 48 V124 Q180 144 160 144 H88 L50 180 L58 144 H40 Q20 144 20 124 V48 Q20 28 40 28 Z"/>`;
  const block = (x, y, fill) => `<rect x="${x}" y="${y}" width="70" height="48" rx="7" fill="${fill}" ${metal(2.2)}/>`;
  const d = [
    fit("HELLO", { file: FONTS.display(800), size: 18, x: 66, y: 69, maxW: 56 }),
    fit("你好", { size: 25, x: 134, y: 72, maxW: 56, cjk: true }),
    fit("APA", { file: FONTS.display(800), size: 13, x: 66, y: 110, maxW: 56 }),
    fit("KHABAR", { file: FONTS.display(800), size: 13, x: 66, y: 126, maxW: 58 }),
  ].join("");
  const tamil = fit("வணக்கம்", { file: FONTS.tamil(700), size: 16, x: 140, y: 120, maxW: 62 });
  const body = `<rect width="200" height="200" fill="${E.cream}"/>
    ${block(31, 38, E.terracotta)}${block(105, 38, E.blue)}${block(31, 90, E.olive)}${block(105, 90, E.yellow)}
    <path d="${d}" fill="${E.cream}"/><path d="${tamil}" fill="${E.ink}"/>`;
  return pin({ title: "Many Tongues pin: hello in English, Chinese, Malay and Tamil", metal: "silver", shape, body });
}

/* ------------------------------------------------------------------ */
/* Three Journeys: a trishaw (three wheels, three sites)               */
/* ------------------------------------------------------------------ */
function threeJourneys() {
  const wheel = (cx, cy, r) => `<path d="M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z M${cx - r + 9} ${cy} a${r - 9} ${r - 9} 0 1 1 ${2 * (r - 9)} 0 a${r - 9} ${r - 9} 0 1 1 ${-2 * (r - 9)} 0 Z"/>`;
  const hood = `M26 126 C22 88 42 62 82 58 L98 62 V126 Z`;
  const shape = `${wheel(56, 152, 28)}${wheel(152, 152, 28)}<path d="${hood}"/><path d="M22 124 H100 L95 146 Q62 156 28 147 Z"/><circle cx="84" cy="40" r="6"/><path d="M82 40 H86 V60 H82 Z"/>`;
  const spokes = (cx, cy) => {
    let d = "";
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + 0.2;
      d += `M${cx} ${cy} L${f2(cx + Math.cos(a) * 20)} ${f2(cy + Math.sin(a) * 20)} `;
    }
    return d;
  };
  const frame = `M96 134 L124 152 L152 152 M124 152 L116 108 L152 152 M104 100 L124 152 M104 104 L118 110`;
  const over = `<g transform="translate(1.6 2.4)" fill="none" stroke="${METALS.gold.edge}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="${frame}"/></g>
    <path d="${frame}" fill="none" stroke="url(#m)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${frame}" fill="none" stroke="${E.teal}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${spokes(56, 152)}${spokes(152, 152)}" ${metal(2)}/>
    <circle cx="56" cy="152" r="4.5" fill="url(#m)"/><circle cx="152" cy="152" r="4.5" fill="url(#m)"/><circle cx="124" cy="152" r="6" fill="url(#m)" stroke="${METALS.gold.lo}" stroke-width="1.2"/>
    <path d="M96 96 Q104 88 112 94" fill="none" stroke="url(#m)" stroke-width="5" stroke-linecap="round"/>
    <path d="M108 102 H130 Q128 110 118 110 Z" fill="${E.ink}" ${metal(1.6)}/>`;
  const body = `<rect width="200" height="200" fill="url(#m)"/>
    <circle cx="56" cy="152" r="28" fill="${E.ink}"/><circle cx="152" cy="152" r="28" fill="${E.ink}"/>
    <path d="${hood}" fill="${E.deepRed}" ${metal(2.2)}/>
    <path d="M98 62 C72 70 50 94 46 126 M98 62 C82 76 72 100 72 126" ${metal(1.6)} fill="none"/>
    <g fill="${E.yellow}" ${metal(1)}><circle cx="34" cy="104" r="4"/><circle cx="42" cy="84" r="4"/><circle cx="56" cy="70" r="4"/><circle cx="74" cy="62" r="4"/></g>
    <g fill="${E.pink}"><circle cx="38" cy="94" r="2.6"/><circle cx="48" cy="76" r="2.6"/><circle cx="65" cy="65" r="2.6"/></g>
    <path d="M22 124 H100 L95 146 Q62 156 28 147 Z" fill="${E.terracotta}" ${metal(2.2)}/>
    <rect x="34" y="112" width="56" height="13" rx="5" fill="${E.cream}" ${metal(1.8)}/>
    <path d="M30 134 H92" ${metal(1.3)}/>
    <path d="M86 34 L108 40 L86 46 Z" fill="${E.mustard}" ${metal(1.4)}/>`;
  return pin({ title: "Three Journeys pin: a trishaw", shape, body, over, evenodd: true });
}

/* ------------------------------------------------------------------ */
/* Memory Keeper: a red pillar box with a letter going in              */
/* ------------------------------------------------------------------ */
function memoryKeeper() {
  const shape = `<path d="M62 176 V74 C62 48 80 32 100 32 C120 32 138 48 138 74 V176 Z"/><rect x="52" y="72" width="96" height="14" rx="3"/><rect x="50" y="168" width="100" height="22" rx="4"/><circle cx="100" cy="28" r="7"/>`;
  const body = `<rect width="200" height="200" fill="${E.red}"/>
    <rect x="62" y="80" width="10" height="96" fill="#CF6A5E"/>
    <rect x="122" y="80" width="16" height="96" fill="${E.deepRed}"/>
    <path d="M62 74 C62 48 80 32 100 32 C120 32 138 48 138 74 Z" fill="${E.deepRed}" ${metal(2.2)}/>
    <path d="M72 62 C76 50 86 42 98 40" stroke="#E08A7E" stroke-width="3" stroke-linecap="round" fill="none"/>
    <circle cx="100" cy="28" r="7" fill="url(#m)"/>
    <rect x="52" y="72" width="96" height="14" rx="3" fill="${E.deepRed}" ${metal(2.2)}/>
    <rect x="76" y="96" width="48" height="8" rx="4" fill="${E.ink}" ${metal(2)}/>
    <g transform="rotate(-7 100 116)">
      <rect x="77" y="100" width="46" height="30" rx="2" fill="${E.cream}" ${metal(2)}/>
      <path d="M77 101 L100 117 L123 101" fill="none" ${metal(1.6)}/>
      <path d="M100 126 C94 121 93 116 96.5 115 C98.5 114.5 100 116 100 117.5 C100 116 101.5 114.5 103.5 115 C107 116 106 121 100 126 Z" fill="${E.terracotta}"/>
    </g>
    <rect x="80" y="140" width="40" height="22" rx="3" fill="${E.cream}" ${metal(2)}/>
    <path d="M86 147 H114 M86 152 H110 M86 157 H106" stroke="${E.ink}" stroke-width="1.4" stroke-linecap="round"/>
    <rect x="50" y="168" width="100" height="22" rx="4" fill="#5A2A22" ${metal(2.2)}/>
    <path d="M56 176 H144" ${metal(1.2)}/>`;
  return pin({ title: "Memory Keeper pin: a pillar box with a letter", metal: "silver", shape, body });
}

export const PINS = {
  "first-footsteps": firstFootsteps,
  "time-traveller": timeTraveller,
  "sharp-eye": sharpEye,
  "good-listener": goodListener,
  "curious-mind": curiousMind,
  "many-tongues": manyTongues,
  "three-journeys": threeJourneys,
  "memory-keeper": memoryKeeper,
};
