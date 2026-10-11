// Line illustrations for the ten placeholder ("demo") stamps, in the same engraved
// style as landmarks.mjs: a 200 × 200 box with the ground line at y 182.
// `c` = { ink, tint, accent, paper, hatch, weight }; tint/accent "none" for ink impressions.

const f = (n) => +n.toFixed(2);
const w = (c, n) => f(n * (c.weight ?? 1));
const line = (c, n = 1.4) => `fill="none" stroke="${c.ink}" stroke-width="${w(c, n)}" stroke-linecap="round" stroke-linejoin="round"`;
const shape = (c, fill, n = 1.2) => `fill="${fill}" stroke="${c.ink}" stroke-width="${w(c, n)}" stroke-linejoin="round"`;
const hatch = (c) => (c.hatch ? `fill="url(#${c.hatch})"` : `fill="none"`);
const ground = (c, x0 = 6, x1 = 194) => `<path d="M${x0} 182 H${x1}" ${line(c, 1.6)}/>`;
const arch = (x, y, aw, h) => `M${x} ${y + h} V${y + aw / 2} Q${x} ${y} ${x + aw / 2} ${y} Q${x + aw} ${y} ${x + aw} ${y + aw / 2} V${y + h}`;
const tree = (c, x, y, r) =>
  `<path d="M${x - r} ${y} q${-r * 0.2} ${-r * 0.9} ${r * 0.6} ${-r * 1.1} q${r * 0.4} ${-r * 0.8} ${r * 1.2} ${-r * 0.3} q${r * 0.9} ${-r * 0.1} ${r * 0.8} ${r * 0.9} q${r * 0.5} ${r * 0.7} ${-r * 0.3} ${r * 1}" ${shape(c, c.accent, 1)}/><path d="M${x} ${y} V${y + r * 1.2}" ${line(c, 1.2)}/>`;

/* Lau Pa Sat: the octagonal Victorian market hall with its clock tower */
function lauPaSat(c) {
  const s = [ground(c)];
  s.push(`<rect x="22" y="128" width="156" height="54" ${shape(c, c.tint)}/>`);
  for (let i = 0; i < 7; i++) {
    const x = 27 + i * 21.4;
    s.push(`<path d="${arch(x, 140, 15, 42)}" ${hatch(c)} stroke="${c.ink}" stroke-width="${w(c, 1)}"/>`);
  }
  s.push(`<path d="M16 128 L40 104 H160 L184 128 Z" ${shape(c, c.accent)}/>`);
  s.push(`<path d="M28 122 H172 M40 110 H160" ${line(c, 0.7)}/>`);
  for (let x = 46; x <= 154; x += 9) s.push(`<path d="M${x} 104 L${x - 6 + (x - 100) * 0.12} 128" ${line(c, 0.5)}/>`);
  s.push(`<rect x="84" y="66" width="32" height="38" ${shape(c, c.tint)}/>`);
  s.push(`<circle cx="100" cy="84" r="10" ${shape(c, c.paper, 1.1)}/><path d="M100 84 V77 M100 84 L105 87" ${line(c, 1)}/>`);
  s.push(`<path d="M80 66 L100 42 L120 66 Z" ${shape(c, c.accent)}/><path d="M100 42 V26" ${line(c, 1.2)}/><circle cx="100" cy="24" r="2.2" fill="${c.ink}"/>`);
  s.push(`<path d="M80 66 H120 M84 98 H116" ${line(c, 0.8)}/>`);
  return s.join("");
}

/* Cavenagh Bridge: the cast-iron suspension bridge over the Singapore River */
function cavenaghBridge(c) {
  const s = [];
  s.push(`<path d="M6 168 q12 -4 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" ${line(c, 0.9)}/>`);
  s.push(`<path d="M14 176 q10 -3 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" ${line(c, 0.7)}/>`);
  s.push(`<path d="M6 150 H194" ${line(c, 2.4)}/><path d="M6 157 H194" ${line(c, 1.2)}/>`);
  let rail = "";
  for (let x = 10; x <= 190; x += 6) rail += `M${x} 150 V157 `;
  s.push(`<path d="${rail}" ${line(c, 0.6)}/>`);
  for (const x of [52, 148]) {
    s.push(`<rect x="${x - 7}" y="96" width="14" height="66" ${shape(c, c.tint)}/>`);
    s.push(`<path d="M${x - 9} 96 H${x + 9} M${x} 96 V86" ${line(c, 1.2)}/><circle cx="${x}" cy="84" r="3" ${shape(c, c.accent, 1)}/>`);
    s.push(`<path d="M${x - 7} 120 H${x + 7} M${x - 7} 140 H${x + 7}" ${line(c, 0.7)}/>`);
  }
  const chain = "M6 146 Q30 128 52 100 Q100 150 148 100 Q170 128 194 146";
  s.push(`<path d="${chain}" ${line(c, 1.8)}/>`);
  let hangers = "";
  for (let x = 60; x <= 140; x += 8) {
    const t = (x - 52) / 96;
    const y = (1 - t) * (1 - t) * 100 + 2 * (1 - t) * t * 150 + t * t * 100;
    hangers += `M${x} ${f(y)} V150 `;
  }
  s.push(`<path d="${hangers}" ${line(c, 0.6)}/>`);
  s.push(`<path d="M2 162 L18 162 L22 182 L2 182 Z M198 162 L182 162 L178 182 L198 182 Z" ${shape(c, c.accent)}/>`);
  return s.join("");
}

/* Fort Canning: the Fort Gate, with a cannon in front */
function fortCanning(c) {
  const s = [ground(c)];
  s.push(tree(c, 30, 104, 14), tree(c, 170, 100, 16));
  s.push(`<rect x="40" y="104" width="120" height="78" ${shape(c, c.tint)}/>`);
  for (let x = 40; x < 160; x += 15) s.push(`<rect x="${x}" y="94" width="9" height="10" ${shape(c, c.tint)}/>`);
  let course = "";
  for (let y = 116; y < 182; y += 9) course += `M40 ${y} H160 `;
  s.push(`<path d="${course}" ${line(c, 0.5)}/>`);
  s.push(`<path d="${arch(76, 118, 48, 64)} Z" ${hatch(c)} stroke="${c.ink}" stroke-width="${w(c, 1.4)}"/>`);
  s.push(`<path d="M70 182 V116 H130 V182" ${line(c, 1.2)}/>`);
  s.push(`<path d="M70 112 H130" ${line(c, 1.4)}/>`);
  s.push(`<path d="M22 170 L58 160" stroke="${c.ink}" stroke-width="${w(c, 5)}" stroke-linecap="round"/>`);
  s.push(`<circle cx="34" cy="172" r="8" ${shape(c, c.accent, 1.2)}/><circle cx="34" cy="172" r="2" fill="${c.ink}"/>`);
  return s.join("");
}

/* Old Hill Street Police Station: rows of brightly painted window shutters */
function hillStreet(c) {
  const s = [ground(c)];
  s.push(`<rect x="14" y="62" width="172" height="120" ${shape(c, c.tint)}/>`);
  s.push(`<path d="M10 62 H190 M12 68 H188" ${line(c, 1.2)}/>`);
  s.push(`<path d="M86 62 L100 50 L114 62" ${shape(c, c.tint)}/>`);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 8; col++) {
      const x = 22 + col * 20.5;
      const y = 76 + row * 20;
      const fill = (row + col) % 3 === 0 ? c.accent : (row + col) % 3 === 1 ? c.paper : c.tint;
      s.push(`<rect x="${f(x)}" y="${y}" width="11" height="14" ${shape(c, fill, 0.9)}/><path d="M${f(x + 5.5)} ${y} V${y + 14}" ${line(c, 0.5)}/>`);
    }
  }
  for (let i = 0; i < 8; i++) s.push(`<path d="${arch(20 + i * 20.5, 158, 15, 24)}" ${hatch(c)} stroke="${c.ink}" stroke-width="${w(c, 0.9)}"/>`);
  return s.join("");
}

/* Koon Seng Road: a pair of Peranakan terrace houses */
function koonSeng(c) {
  const s = [ground(c)];
  for (const [x, fill] of [[16, c.tint], [100, c.accent]]) {
    s.push(`<rect x="${x}" y="70" width="84" height="112" ${shape(c, fill)}/>`);
    s.push(`<path d="M${x - 4} 70 L${x + 42} 52 L${x + 88} 70 Z" ${shape(c, c.paper)}/>`);
    s.push(`<path d="M${x + 30} 62 h24" ${line(c, 0.8)}/>`);
    for (const wx of [x + 10, x + 34, x + 58]) {
      s.push(`<path d="${arch(wx, 80, 16, 36)} Z" ${shape(c, c.paper, 1)}/><path d="M${wx + 8} 84 V116 M${wx} 98 H${wx + 16}" ${line(c, 0.6)}/>`);
    }
    s.push(`<path d="M${x} 122 H${x + 84} M${x} 126 H${x + 84}" ${line(c, 0.9)}/>`);
    let tiles = "";
    for (let tx = x + 4; tx < x + 82; tx += 8) tiles += `M${tx} 130 l4 4 l4 -4 `;
    s.push(`<path d="${tiles}" ${line(c, 0.6)}/>`);
    s.push(`<rect x="${x + 30}" y="146" width="24" height="36" ${shape(c, c.paper, 1)}/><path d="M${x + 30} 158 H${x + 54} M${x + 42} 146 V182" ${line(c, 0.7)}/>`);
    s.push(`<rect x="${x + 8}" y="148" width="14" height="18" ${hatch(c)} stroke="${c.ink}" stroke-width="${w(c, 0.8)}"/><rect x="${x + 62}" y="148" width="14" height="18" ${hatch(c)} stroke="${c.ink}" stroke-width="${w(c, 0.8)}"/>`);
  }
  return s.join("");
}

/* Kampong Lorong Buangkok: a zinc-roofed kampung house and a coconut palm */
function kampung(c) {
  const s = [ground(c)];
  s.push(`<path d="M160 182 C162 150 156 110 166 70" ${line(c, 2.2)}/>`);
  let fronds = "";
  for (const [dx, dy] of [[-30, 6], [-24, -14], [-6, -24], [16, -20], [30, -2], [24, 14], [-16, 18]]) fronds += `M166 70 Q${166 + dx * 0.5} ${70 + dy * 0.2 - 8} ${166 + dx} ${70 + dy} `;
  s.push(`<path d="${fronds}" ${line(c, 1.3)}/>`);
  s.push(`<circle cx="164" cy="76" r="3" ${shape(c, c.accent, 0.8)}/><circle cx="169" cy="77" r="3" ${shape(c, c.accent, 0.8)}/>`);
  s.push(`<path d="M22 104 L76 70 L130 104 Z" ${shape(c, c.accent)}/>`);
  let ribs = "";
  for (let x = 32; x <= 120; x += 6) ribs += `M${x} ${f(104 - ((x < 76 ? x - 22 : 130 - x) * 34) / 54)} V104 `;
  s.push(`<path d="${ribs}" ${line(c, 0.5)}/>`);
  s.push(`<rect x="32" y="104" width="88" height="56" ${shape(c, c.tint)}/>`);
  let planks = "";
  for (let y = 111; y < 160; y += 7) planks += `M32 ${y} H120 `;
  s.push(`<path d="${planks}" ${line(c, 0.45)}/>`);
  s.push(`<rect x="44" y="116" width="18" height="18" ${shape(c, c.paper, 1)}/><path d="M53 116 V134" ${line(c, 0.7)}/>`);
  s.push(`<rect x="86" y="120" width="20" height="40" ${shape(c, c.paper, 1)}/>`);
  s.push(`<path d="M36 160 V182 M76 160 V182 M116 160 V182" ${line(c, 1.6)}/>`);
  s.push(`<path d="M86 160 L82 182 M106 160 L110 182 M84 168 H108 M83 175 H109" ${line(c, 1)}/>`);
  s.push(`<path d="M8 182 q6 -10 10 0 q4 -8 8 0 M132 182 q5 -9 9 0 q4 -7 8 0" ${line(c, 1)}/>`);
  return s.join("");
}

/* Armenian Church: a small portico and its slender spire */
function armenianChurch(c) {
  const s = [ground(c)];
  s.push(tree(c, 24, 128, 14), tree(c, 178, 132, 12));
  s.push(`<rect x="88" y="62" width="24" height="56" ${shape(c, c.tint)}/>`);
  s.push(`<path d="M88 62 L100 22 L112 62 Z" ${shape(c, c.accent)}/><path d="M100 22 V10 M95 14 H105" ${line(c, 1.3)}/>`);
  s.push(`<path d="${arch(95, 72, 10, 16)}" ${hatch(c)} stroke="${c.ink}" stroke-width="${w(c, 0.8)}"/>`);
  s.push(`<rect x="44" y="118" width="112" height="64" ${shape(c, c.tint)}/>`);
  s.push(`<path d="M52 118 L100 92 L148 118 Z" ${shape(c, c.paper)}/><path d="M64 113 H136" ${line(c, 0.6)}/>`);
  for (const x of [58, 78, 122, 142]) s.push(`<path d="M${x - 3} 182 V122 M${x + 3} 182 V122 M${x - 5} 122 H${x + 5}" ${line(c, 0.9)}/>`);
  s.push(`<path d="${arch(90, 140, 20, 42)} Z" ${hatch(c)} stroke="${c.ink}" stroke-width="${w(c, 1)}"/>`);
  return s.join("");
}

/* Tanjong Pagar Railway Station: the art deco front with its four statues */
function railwayStation(c) {
  const s = [ground(c)];
  s.push(`<rect x="10" y="128" width="180" height="54" ${shape(c, c.tint)}/>`);
  for (let i = 0; i < 6; i++) {
    const x = i < 3 ? 16 + i * 18 : 132 + (i - 3) * 18;
    s.push(`<rect x="${x}" y="140" width="10" height="24" ${hatch(c)} stroke="${c.ink}" stroke-width="${w(c, 0.8)}"/>`);
  }
  s.push(`<rect x="62" y="66" width="76" height="116" ${shape(c, c.tint)}/>`);
  s.push(`<path d="M68 182 V104 Q68 78 100 78 Q132 78 132 104 V182" ${shape(c, c.paper, 1.2)}/>`);
  s.push(`<path d="M84 182 V84 M100 182 V78 M116 182 V84 M68 110 H132 M68 136 H132" ${line(c, 0.7)}/>`);
  s.push(`<rect x="88" y="160" width="24" height="22" ${hatch(c)} stroke="${c.ink}" stroke-width="${w(c, 0.9)}"/>`);
  for (const x of [66, 86, 114, 134]) {
    s.push(`<rect x="${x - 4}" y="56" width="8" height="10" ${shape(c, c.accent, 0.9)}/><path d="M${x} 56 V44" ${line(c, 2.2)}/><circle cx="${x}" cy="41" r="2.6" ${shape(c, c.accent, 0.8)}/>`);
  }
  s.push(`<path d="M58 66 H142" ${line(c, 1.4)}/>`);
  return s.join("");
}

/* Victoria Concert Hall: the clock tower between two wings */
function concertHall(c) {
  const s = [ground(c)];
  for (const x of [10, 122]) {
    s.push(`<rect x="${x}" y="118" width="68" height="64" ${shape(c, c.tint)}/>`);
    s.push(`<path d="M${x - 2} 118 L${x + 34} 100 L${x + 70} 118 Z" ${shape(c, c.paper)}/>`);
    for (let i = 0; i < 3; i++) s.push(`<path d="${arch(x + 8 + i * 20, 132, 12, 26)} Z" ${hatch(c)} stroke="${c.ink}" stroke-width="${w(c, 0.8)}"/>`);
    s.push(`<path d="M${x} 164 H${x + 68}" ${line(c, 0.8)}/>`);
  }
  s.push(`<rect x="82" y="56" width="36" height="126" ${shape(c, c.tint)}/>`);
  s.push(`<circle cx="100" cy="78" r="11" ${shape(c, c.paper, 1.2)}/><path d="M100 78 V70 M100 78 L106 81" ${line(c, 1)}/>`);
  s.push(`<path d="M80 56 L100 24 L120 56 Z" ${shape(c, c.accent)}/><path d="M100 24 V12" ${line(c, 1.2)}/><circle cx="100" cy="10" r="2" fill="${c.ink}"/>`);
  s.push(`<path d="M82 96 H118 M82 100 H118" ${line(c, 0.8)}/>`);
  s.push(`<path d="${arch(92, 108, 16, 30)} Z" ${hatch(c)} stroke="${c.ink}" stroke-width="${w(c, 0.8)}"/>`);
  s.push(`<path d="${arch(90, 154, 20, 28)} Z" ${shape(c, c.paper, 1)}/>`);
  return s.join("");
}

/* Merlion Park: the Merlion spouting into the bay */
function merlion(c) {
  const s = [];
  s.push(`<path d="M2 170 q12 -6 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" ${line(c, 1)}/>`);
  s.push(`<path d="M10 178 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" ${line(c, 0.8)}/>`);
  s.push(`<path d="M96 168 L100 150 H170 L176 168 Z" ${shape(c, c.accent)}/>`);
  s.push(`<path d="M112 150 C106 126 116 104 136 98 C158 92 172 104 170 124 C168 142 154 150 140 150 Z" ${shape(c, c.tint)}/>`);
  let scales = "";
  for (const [x, y] of [[130, 112], [144, 108], [158, 112], [136, 124], [150, 122], [142, 136], [156, 134]]) scales += `M${x - 6} ${y} q6 7 12 0 `;
  s.push(`<path d="${scales}" ${line(c, 0.8)}/>`);
  s.push(`<path d="M164 108 C176 98 184 84 180 68 C188 74 196 70 196 60 C188 63 182 58 180 52 C176 66 172 84 160 98 Z" ${shape(c, c.tint)}/>`);
  let mane = "";
  for (let i = 0; i < 11; i++) {
    const a0 = -2.6 + i * 0.42;
    const r = 26;
    mane += `${i ? "" : `M${f(116 + Math.cos(a0) * r)} ${f(76 + Math.sin(a0) * r)} `}Q${f(116 + Math.cos(a0 + 0.21) * (r + 7))} ${f(76 + Math.sin(a0 + 0.21) * (r + 7))} ${f(116 + Math.cos(a0 + 0.42) * r)} ${f(76 + Math.sin(a0 + 0.42) * r)} `;
  }
  s.push(`<path d="${mane}" ${shape(c, c.accent)}/>`);
  s.push(`<path d="M114 58 C126 58 134 68 132 82 C130 92 122 100 110 100 C102 100 94 96 92 90 L84 88 C86 81 89 74 94 70 C98 62 106 58 114 58 Z" ${shape(c, c.paper)}/>`);
  s.push(`<ellipse cx="105" cy="74" rx="3.2" ry="2.2" fill="${c.ink}"/><path d="M99 69 Q105 66 111 69" ${line(c, 1)}/>`);
  s.push(`<path d="M85 89 L97 90 L90 94 Z" fill="${c.ink}"/>`);
  s.push(`<path d="M86 89 C60 82 34 104 22 166" ${line(c, 3.2)}/><path d="M86 89 C62 84 40 104 30 160" ${line(c, 0.8)}/>`);
  s.push(`<path d="M14 166 q4 -6 8 0 M26 168 q4 -5 8 0" ${line(c, 1)}/>`);
  return s.join("");
}

export const DEMO_LANDMARKS = {
  "lau-pa-sat": lauPaSat,
  "cavenagh-bridge": cavenaghBridge,
  "fort-canning": fortCanning,
  "hill-street": hillStreet,
  "koon-seng-road": koonSeng,
  "kampong-buangkok": kampung,
  "armenian-church": armenianChurch,
  "tanjong-pagar-station": railwayStation,
  "victoria-concert-hall": concertHall,
  "merlion-park": merlion,
};

// Drawn extents inside the 200 × 200 box (ground at y 182), for fitting into the stamp frame.
export const DEMO_LANDMARK_BOUNDS = {
  "lau-pa-sat": { x0: 8, x1: 192, y0: 22 },
  "cavenagh-bridge": { x0: 2, x1: 198, y0: 80 },
  "fort-canning": { x0: 6, x1: 194, y0: 80 },
  "hill-street": { x0: 6, x1: 194, y0: 50 },
  "koon-seng-road": { x0: 6, x1: 194, y0: 52 },
  "kampong-buangkok": { x0: 6, x1: 198, y0: 46 },
  "armenian-church": { x0: 6, x1: 194, y0: 10 },
  "tanjong-pagar-station": { x0: 6, x1: 194, y0: 38 },
  "victoria-concert-hall": { x0: 6, x1: 194, y0: 8 },
  "merlion-park": { x0: 2, x1: 198, y0: 46 },
};
