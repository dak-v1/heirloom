// Hand-built line illustrations of the three curated landmarks.
// Each function returns SVG markup for a 200 × 200 box (ground line ≈ y 182).
// `c` = { ink, tint, accent, paper, hatch } where `hatch` is the id of a hatch pattern.
// Pass tint/accent = "none" for a single-colour ink impression.

const f = (n) => +n.toFixed(2);
const mirrorX = (x) => 200 - x;

function stroke(c, w = 1.4) {
  return `fill="none" stroke="${c.ink}" stroke-width="${f(w * (c.weight ?? 1))}" stroke-linecap="round" stroke-linejoin="round"`;
}

function hatchFill(c) {
  return c.hatch ? `fill="url(#${c.hatch})"` : `fill="none"`;
}

/* ------------------------------------------------------------------ */
/* Thian Hock Keng 天福宫 — Hokkien temple on Telok Ayer Street        */
/* ------------------------------------------------------------------ */
export function thianHockKeng(c) {
  const s = [];
  // ground, granite platform and steps
  s.push(`<path d="M6 182 H194" ${stroke(c, 1.6)}/>`);
  s.push(`<path d="M18 182 V174 H182 V182 M24 174 V170 H176 V174" ${stroke(c, 1.1)}/>`);
  s.push(`<path d="M86 182 V178 H114 V182 M90 178 V174 H110 V178" ${stroke(c, 0.9)}/>`);

  // facade walls
  s.push(`<rect x="30" y="118" width="140" height="52" fill="${c.tint}" stroke="${c.ink}" stroke-width="1.2"/>`);
  // shaded side bays (engraving hatch)
  s.push(`<rect x="30" y="118" width="12" height="52" ${hatchFill(c)}/>`);
  s.push(`<rect x="158" y="118" width="12" height="52" ${hatchFill(c)}/>`);

  // granite columns with coiled dragons on the central pair
  for (const x of [42, 74, 126, 158]) {
    s.push(`<path d="M${x - 2.5} 170 V120 M${x + 2.5} 170 V120" ${stroke(c, 1)}/>`);
    s.push(`<path d="M${x - 4} 170 H${x + 4} M${x - 4} 121 H${x + 4}" ${stroke(c, 1)}/>`);
  }
  for (const x of [74, 126]) {
    let d = `M${x - 2.5} 164`;
    for (let y = 164; y > 126; y -= 8) d += ` Q${x + 5} ${y - 2} ${x + 2.5} ${y - 4} Q${x - 5} ${y - 6} ${x - 2.5} ${y - 8}`;
    s.push(`<path d="${d}" ${stroke(c, 0.8)}/>`);
    s.push(`<circle cx="${x}" cy="125" r="1.6" fill="${c.ink}"/>`);
  }

  // central doorway with door-god panels and studs
  s.push(`<rect x="86" y="132" width="28" height="38" fill="${c.paper}" stroke="${c.ink}" stroke-width="1.2"/>`);
  s.push(`<path d="M100 132 V170" ${stroke(c, 1)}/>`);
  for (const x of [93, 107]) {
    s.push(`<circle cx="${x}" cy="143" r="3" ${stroke(c, 0.8)}/>`);
    s.push(`<path d="M${x - 4} 166 V151 Q${x} 147 ${x + 4} 151 V166" ${stroke(c, 0.8)}/>`);
  }
  // signboard above the door
  s.push(`<rect x="88" y="123" width="24" height="6" fill="${c.ink}"/>`);
  // side doorways
  for (const [x0, x1] of [[50, 66], [134, 150]]) {
    s.push(`<path d="M${x0} 170 V146 Q${(x0 + x1) / 2} 140 ${x1} 146 V170" fill="${c.paper}" stroke="${c.ink}" stroke-width="1"/>`);
    s.push(`<path d="M${(x0 + x1) / 2} 146 V170" ${stroke(c, 0.7)}/>`);
  }
  // hanging lanterns
  for (const x of [80, 120]) {
    s.push(`<path d="M${x} 112 V118" ${stroke(c, 0.7)}/>`);
    s.push(`<ellipse cx="${x}" cy="123" rx="4.4" ry="5.2" fill="${c.accent}" stroke="${c.ink}" stroke-width="0.9"/>`);
    s.push(`<path d="M${x - 2.5} 118.5 H${x + 2.5} M${x - 2.5} 127.5 H${x + 2.5} M${x} 128.5 V133" ${stroke(c, 0.7)}/>`);
  }

  // bracket band under the eaves
  let band = "";
  for (let x = 32; x < 168; x += 6) band += `M${x} 118 l3 -4 l3 4 `;
  s.push(`<path d="${band}" ${stroke(c, 0.6)}/>`);

  // side roofs (lower), swallowtail ends turning outwards
  const sideRoof = (m) => {
    const X = (x) => (m ? mirrorX(x) : x);
    const eave = `M${X(78)} 116 L${X(34)} 116 Q${X(20)} 116 ${X(12)} 106`;
    const ridge = `M${X(70)} 100 L${X(40)} 100 Q${X(30)} 100 ${X(24)} 90 M${X(40)} 100 Q${X(28)} 98 ${X(20)} 94`;
    const surface = `M${X(70)} 100 L${X(78)} 116 L${X(34)} 116 Q${X(22)} 115 ${X(14)} 107 Q${X(26)} 104 ${X(40)} 100 Z`;
    s.push(`<path d="${surface}" fill="${c.tint}" stroke="none"/>`);
    let tiles = "";
    for (let x = 40; x <= 72; x += 4) tiles += `M${X(x)} 100.5 L${X(x + 4)} 115.5 `;
    s.push(`<path d="${tiles}" ${stroke(c, 0.55)}/>`);
    s.push(`<path d="${eave}" ${stroke(c, 1.5)}/>`);
    s.push(`<path d="${ridge}" ${stroke(c, 1.5)}/>`);
  };
  sideRoof(false);
  sideRoof(true);

  // central roof (higher), deep upswept eaves and split swallowtail ridge
  s.push(`<path d="M64 84 L136 84 L150 108 Q160 104 168 94 Q156 112 146 112 L54 112 Q44 112 32 94 Q40 104 50 108 Z" fill="${c.tint}" stroke="none"/>`);
  let ctiles = "";
  for (let x = 66; x <= 134; x += 4) ctiles += `M${x} 85 L${f(50 + (x - 64) * (100 / 72))} 111 `;
  s.push(`<path d="${ctiles}" ${stroke(c, 0.55)}/>`);
  s.push(`<path d="M54 112 H146 M54 112 Q44 112 32 94 M146 112 Q156 112 168 94" ${stroke(c, 1.7)}/>`);
  s.push(`<path d="M64 84 H136" ${stroke(c, 2.2)}/>`);
  s.push(`<path d="M64 84 Q54 84 46 70 M64 84 Q52 82 42 76 M136 84 Q146 84 154 70 M136 84 Q148 82 158 76" ${stroke(c, 1.6)}/>`);
  s.push(`<path d="M64 84 L50 108 M136 84 L150 108" ${stroke(c, 1)}/>`);

  // ridge: two dragons flanking a flaming pearl
  s.push(`<circle cx="100" cy="76" r="3.6" fill="${c.accent}" stroke="${c.ink}" stroke-width="1"/>`);
  s.push(`<path d="M100 72.4 L98 68 M100 72.4 L102 67.5 M100 72.4 L100 66.5" ${stroke(c, 0.7)}/>`);
  const dragon = (m) => {
    const X = (x) => (m ? mirrorX(x) : x);
    s.push(`<path d="M${X(70)} 83 Q${X(74)} 72 ${X(80)} 78 Q${X(85)} 84 ${X(89)} 74 Q${X(91)} 70 ${X(93)} 73" ${stroke(c, 1.5)}/>`);
    s.push(`<path d="M${X(93)} 73 L${X(95.5)} 74.5 M${X(92)} 71 L${X(93)} 68.5 M${X(76)} 76 L${X(75)} 72 M${X(84)} 79 L${X(84)} 75" ${stroke(c, 0.8)}/>`);
  };
  dragon(false);
  dragon(true);
  return s.join("\n");
}

/* ------------------------------------------------------------------ */
/* Sri Mariamman Temple — gopuram on South Bridge Road                 */
/* ------------------------------------------------------------------ */
export function sriMariamman(c) {
  const s = [];
  s.push(`<path d="M6 182 H194" ${stroke(c, 1.6)}/>`);

  // boundary walls with reclining cows on the coping
  for (const m of [false, true]) {
    const X = (x) => (m ? mirrorX(x) : x);
    s.push(`<path d="M${X(8)} 182 V152 H${X(66)} V182" fill="${c.tint}" stroke="${c.ink}" stroke-width="1.1"/>`);
    s.push(`<path d="M${X(6)} 152 H${X(66)} M${X(6)} 149 H${X(66)}" ${stroke(c, 1)}/>`);
    let bricks = "";
    for (let y = 158; y < 182; y += 6) bricks += `M${X(8)} ${y} H${X(66)} `;
    s.push(`<path d="${bricks}" ${stroke(c, 0.4)}/>`);
    // reclining cow facing the gopuram: back, hump, raised head, horns, folded foreleg
    const cx = 34, b = 149;
    const P = (dx, dy) => `${X(cx + dx)} ${b + dy}`;
    s.push(`<path d="M${P(-14, 0)} Q${P(-15, -7)} ${P(-10, -8)} Q${P(-4, -9.5)} ${P(1, -10)} Q${P(3, -13.5)} ${P(6, -11)} Q${P(8, -13)} ${P(10, -15)} Q${P(14, -15.5)} ${P(15.5, -11)} Q${P(15, -8.5)} ${P(12.5, -8.5)} Q${P(10, -6)} ${P(9, -3.5)} Q${P(13, -3)} ${P(14, 0)} Z" fill="${c.paper}" stroke="${c.ink}" stroke-width="${f(1 * (c.weight ?? 1))}" stroke-linejoin="round"/>`);
    s.push(`<path d="M${P(10, -15)} Q${P(8.5, -18.5)} ${P(10, -20)} M${P(12.5, -15.2)} Q${P(14, -18.5)} ${P(16, -19)} M${P(9.5, -13.5)} L${P(7, -14.5)} M${P(-14, -2)} Q${P(-17, -1)} ${P(-16, 0)} M${P(-6, 0)} Q${P(-4, -3)} ${P(-1, 0)}" ${stroke(c, 0.8)}/>`);
    s.push(`<circle cx="${X(cx + 13)}" cy="${b - 12.5}" r="0.7" fill="${c.ink}"/>`);
  }

  // gopuram base (granite) with entrance
  s.push(`<rect x="62" y="128" width="76" height="54" fill="${c.paper}" stroke="${c.ink}" stroke-width="1.3"/>`);
  s.push(`<rect x="62" y="128" width="9" height="54" ${hatchFill(c)}/>`);
  s.push(`<rect x="129" y="128" width="9" height="54" ${hatchFill(c)}/>`);
  s.push(`<path d="M60 128 H140 M60 133 H140" ${stroke(c, 1.1)}/>`);
  s.push(`<rect x="88" y="140" width="24" height="42" fill="${c.tint}" stroke="${c.ink}" stroke-width="1.2"/>`);
  s.push(`<path d="M100 140 V182 M85 140 H115 M85 137 H115" ${stroke(c, 1)}/>`);
  for (let y = 147; y < 180; y += 6) for (const x of [94, 106]) s.push(`<circle cx="${x}" cy="${y}" r="0.9" fill="${c.ink}"/>`);
  for (const x of [74, 126]) s.push(`<path d="M${x - 4} 176 V146 Q${x} 140 ${x + 4} 146 V176 Z" ${stroke(c, 0.8)}/>`);

  // five tapering tiers of sculpted niches
  const tiers = 5;
  const baseW = 70, topW = 40, top = 50, bottom = 128;
  const th = (bottom - top) / tiers;
  for (let i = 0; i < tiers; i++) {
    const y1 = bottom - i * th;
    const y0 = y1 - th;
    const w1 = baseW - (baseW - topW) * (i / tiers);
    const w0 = baseW - (baseW - topW) * ((i + 1) / tiers);
    const x1l = 100 - w1 / 2, x1r = 100 + w1 / 2;
    const x0l = 100 - w0 / 2, x0r = 100 + w0 / 2;
    // tier body
    s.push(`<path d="M${f(x1l)} ${f(y1)} L${f(x0l + 2)} ${f(y0 + 3)} H${f(x0r - 2)} L${f(x1r)} ${f(y1)} Z" fill="${c.tint}" stroke="${c.ink}" stroke-width="1.1"/>`);
    s.push(`<path d="M${f(x1r)} ${f(y1)} L${f(x0r - 2)} ${f(y0 + 3)} L${f(x0r - 7)} ${f(y0 + 3)} L${f(x1r - 6)} ${f(y1)} Z" ${hatchFill(c)}/>`);
    // cornice ledge with corner kudu (miniature domed shrines)
    s.push(`<path d="M${f(x0l - 2)} ${f(y0 + 3)} H${f(x0r + 2)}" ${stroke(c, 1.4)}/>`);
    for (const x of [x0l + 1, x0r - 1]) s.push(`<path d="M${f(x - 3)} ${f(y0 + 3)} Q${f(x)} ${f(y0 - 4)} ${f(x + 3)} ${f(y0 + 3)}" fill="${c.accent}" stroke="${c.ink}" stroke-width="0.9"/>`);
    // seated guardian figures on the tier corners
    for (const x of [x1l + 3, x1r - 3]) {
      s.push(`<circle cx="${f(x)}" cy="${f(y1 - th + 6.5)}" r="1.3" fill="${c.ink}"/>`);
      s.push(`<path d="M${f(x - 2.4)} ${f(y1 - 1)} L${f(x)} ${f(y1 - th + 8)} L${f(x + 2.4)} ${f(y1 - 1)} Z" fill="${c.paper}" stroke="${c.ink}" stroke-width="${f(0.7 * (c.weight ?? 1))}"/>`);
    }
    // niches with tiny figures
    const n = i < 2 ? 5 : i < 4 ? 4 : 3;
    const span = (x1r - x1l + x0r - x0l) / 2 - 10;
    for (let k = 0; k < n; k++) {
      const cx = 100 - span / 2 + (span * (k + 0.5)) / n;
      const ny = y1 - 2, nh = th - 7;
      s.push(`<path d="M${f(cx - 2.6)} ${f(ny)} V${f(ny - nh + 3)} Q${f(cx)} ${f(ny - nh)} ${f(cx + 2.6)} ${f(ny - nh + 3)} V${f(ny)}" ${stroke(c, 0.6)}/>`);
      s.push(`<circle cx="${f(cx)}" cy="${f(ny - nh + 4.2)}" r="1.1" fill="${c.ink}"/>`);
      s.push(`<path d="M${f(cx)} ${f(ny - nh + 5.4)} V${f(ny - 1.5)} M${f(cx - 1.4)} ${f(ny - nh + 7.5)} H${f(cx + 1.4)}" ${stroke(c, 0.6)}/>`);
      if (k < n - 1) {
        const px = cx + span / n / 2;
        s.push(`<path d="M${f(px)} ${f(ny)} V${f(ny - nh + 1)}" ${stroke(c, 0.45)}/>`);
      }
    }
  }
  // crowning barrel vault (shala) with horseshoe ends and kalasam finials
  s.push(`<path d="M76 52 Q76 34 92 32 H108 Q124 34 124 52 Z" fill="${c.accent}" stroke="${c.ink}" stroke-width="1.3"/>`);
  s.push(`<path d="M80 52 Q80 40 90 38 M120 52 Q120 40 110 38" ${stroke(c, 0.8)}/>`);
  s.push(`<circle cx="76" cy="44" r="4" fill="${c.paper}" stroke="${c.ink}" stroke-width="1"/><circle cx="124" cy="44" r="4" fill="${c.paper}" stroke="${c.ink}" stroke-width="1"/>`);
  for (const x of [84, 92, 100, 108, 116]) {
    s.push(`<path d="M${x} 32 V29 M${x - 2} 29 Q${x - 2.6} 25 ${x} 24 Q${x + 2.6} 25 ${x + 2} 29 Z M${x} 24 V20" fill="${c.accent}" stroke="${c.ink}" stroke-width="0.9"/>`);
  }
  return s.join("\n");
}

/* ------------------------------------------------------------------ */
/* Sultan Mosque (Masjid Sultan) — Kampong Glam                        */
/* ------------------------------------------------------------------ */
export function sultanMosque(c) {
  const s = [];
  s.push(`<path d="M6 182 H194" ${stroke(c, 1.6)}/>`);

  // facade block
  s.push(`<rect x="40" y="120" width="120" height="52" fill="${c.paper}" stroke="${c.ink}" stroke-width="1.3"/>`);
  s.push(`<rect x="40" y="120" width="10" height="52" ${hatchFill(c)}/>`);
  s.push(`<rect x="150" y="120" width="10" height="52" ${hatchFill(c)}/>`);
  s.push(`<path d="M38 120 H162 M40 126 H160" ${stroke(c, 1)}/>`);
  // merlon cresting along the parapet
  let merl = "";
  for (let x = 42; x < 158; x += 7) merl += `M${x} 120 V116 H${x + 2} L${x + 2.5} 114 L${x + 3} 116 H${x + 5} V120 `;
  s.push(`<path d="${merl}" ${stroke(c, 0.7)}/>`);

  // central ogee-arched entrance
  s.push(`<path d="M87 172 V146 Q87 138 93 134 Q99 131 100 126 Q101 131 107 134 Q113 138 113 146 V172 Z" fill="${c.tint}" stroke="${c.ink}" stroke-width="1.3"/>`);
  s.push(`<path d="M91 172 V148 Q91 141 96 138 Q99.5 136 100 132 Q100.5 136 104 138 Q109 141 109 148 V172" ${stroke(c, 0.8)}/>`);
  // flanking ogee windows
  for (const x of [60, 75, 125, 140]) {
    s.push(`<path d="M${x - 4.5} 164 V149 Q${x - 4.5} 144 ${x - 1.5} 142 Q${x} 141 ${x} 138 Q${x} 141 ${x + 1.5} 142 Q${x + 4.5} 144 ${x + 4.5} 149 V164 Z" fill="${c.tint}" stroke="${c.ink}" stroke-width="1"/>`);
    s.push(`<path d="M${x - 4.5} 155 H${x + 4.5}" ${stroke(c, 0.6)}/>`);
  }

  // corner cupolas (chhatri) on the parapet
  for (const x of [52, 148]) {
    s.push(`<path d="M${x - 5} 114 V104 M${x + 5} 114 V104 M${x - 6.5} 104 H${x + 6.5}" ${stroke(c, 1)}/>`);
    s.push(`<path d="M${x - 6} 104 Q${x - 6} 96 ${x} 92 Q${x + 6} 96 ${x + 6} 104 Z" fill="${c.accent}" stroke="${c.ink}" stroke-width="1"/>`);
    s.push(`<path d="M${x} 92 V88" ${stroke(c, 0.8)}/>`);
  }

  // drum with arched lights, then the band of glass bottle ends
  s.push(`<rect x="76" y="100" width="48" height="14" fill="${c.paper}" stroke="${c.ink}" stroke-width="1.1"/>`);
  for (const x of [83, 93, 107, 117]) s.push(`<path d="M${x - 2.5} 112 V106 Q${x} 102.5 ${x + 2.5} 106 V112" ${stroke(c, 0.8)}/>`);
  s.push(`<path d="M100 103 V113" ${stroke(c, 0.6)}/>`);
  s.push(`<rect x="74" y="95" width="52" height="5.5" fill="${c.ink}"/>`);
  for (let x = 77; x < 125; x += 3.5) s.push(`<circle cx="${f(x)}" cy="97.75" r="0.9" fill="${c.paper}"/>`);

  // the great onion (ogee) dome
  const dome = "M76 95 C68 84 66 70 78 59 C87 51 96 47 100 36 C104 47 113 51 122 59 C134 70 132 84 124 95 Z";
  s.push(`<path d="${dome}" fill="${c.accent}" stroke="${c.ink}" stroke-width="1.5"/>`);
  s.push(`<path d="M104 47 C113 51 122 59 C134 70 132 84 124 95 L112 95 C118 82 118 68 104 47 Z" ${hatchFill(c)}/>`);
  s.push(`<path d="M86 60 C80 70 80 82 84 92" ${stroke(c, 0.6)}/>`);
  // finial with crescent and star
  s.push(`<path d="M100 36 V24" ${stroke(c, 1.1)}/>`);
  s.push(`<circle cx="100" cy="30" r="2" fill="${c.ink}"/>`);
  s.push(`<path d="M103.5 14.5 A5 5 0 1 0 103.5 23.5 A4 4 0 1 1 103.5 14.5 Z" fill="${c.ink}"/>`);

  // minarets with balconies and small cupolas
  for (const m of [false, true]) {
    const X = (x) => (m ? mirrorX(x) : x);
    const cx = 24;
    s.push(`<path d="M${X(cx - 5)} 182 V66 H${X(cx + 5)} V182" fill="${c.paper}" stroke="${c.ink}" stroke-width="1.2"/>`);
    s.push(`<path d="M${X(cx + (m ? -2 : 2))} 180 V68" ${stroke(c, 0.5)}/>`);
    for (const y of [132, 96]) {
      s.push(`<path d="M${X(cx - 8)} ${y} H${X(cx + 8)} M${X(cx - 7)} ${y} V${y - 6} H${X(cx + 7)} V${y}" ${stroke(c, 1)}/>`);
      let rail = "";
      for (let x = cx - 6; x <= cx + 6; x += 2.4) rail += `M${X(f(x))} ${y} V${y - 6} `;
      s.push(`<path d="${rail}" ${stroke(c, 0.45)}/>`);
      s.push(`<path d="M${X(cx - 3)} ${y + 10} V${y + 4} Q${X(cx)} ${y + 1} ${X(cx + 3)} ${y + 4} V${y + 10}" ${stroke(c, 0.7)}/>`);
    }
    s.push(`<path d="M${X(cx - 7)} 66 H${X(cx + 7)}" ${stroke(c, 1.1)}/>`);
    s.push(`<path d="M${X(cx - 5.5)} 66 C${X(cx - 7)} 58 ${X(cx - 2)} 54 ${X(cx)} 49 C${X(cx + 2)} 54 ${X(cx + 7)} 58 ${X(cx + 5.5)} 66 Z" fill="${c.accent}" stroke="${c.ink}" stroke-width="1"/>`);
    s.push(`<path d="M${X(cx)} 49 V43" ${stroke(c, 0.9)}/>`);
  }

  // cast-iron boundary railing
  let rail = "";
  for (let x = 32; x <= 168; x += 3.4) rail += `M${f(x)} 182 V174 `;
  s.push(`<path d="${rail}" ${stroke(c, 0.5)}/>`);
  s.push(`<path d="M30 174 H170 M30 178 H170" ${stroke(c, 0.8)}/>`);
  for (const x of [30, 65, 100, 135, 170]) s.push(`<circle cx="${x}" cy="172.5" r="1.4" fill="${c.ink}"/>`);
  return s.join("\n");
}

// Drawn extents of each illustration inside its 200 × 200 box (ground at y 182).
export const LANDMARK_BOUNDS = {
  "thian-hock-keng": { x0: 12, x1: 188, y0: 66 },
  "sri-mariamman-temple": { x0: 6, x1: 194, y0: 20 },
  "sultan-mosque": { x0: 6, x1: 194, y0: 14 },
};

export const LANDMARKS = {
  "thian-hock-keng": thianHockKeng,
  "sri-mariamman-temple": sriMariamman,
  "sultan-mosque": sultanMosque,
};
