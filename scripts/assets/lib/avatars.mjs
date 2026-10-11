// Profile / map-icon portraits (160 × 160, full bleed: the app crops them to a
// circle on the map and shows them square inside a stamp frame on the profile).
// Flat colour with ink outlines, like a vintage picture-book plate.

const INK = "#2D2A23";
const ink = (w = 2.4) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const f2 = (n) => +n.toFixed(2);

function frame(bg, glow, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
<defs><radialGradient id="bg" cx="0.5" cy="0.38" r="0.7"><stop offset="0" stop-color="${glow}"/><stop offset="1" stop-color="${bg}"/></radialGradient><clipPath id="frame"><rect width="160" height="160"/></clipPath></defs>
<g clip-path="url(#frame)">
<rect width="160" height="160" fill="url(#bg)"/>
<g fill="none" stroke="${INK}" stroke-opacity="0.07" stroke-width="1">${Array.from({ length: 11 }, (_, i) => `<path d="M-10 ${18 + i * 14} q20 -6 40 0 t40 0 t40 0 t40 0 t40 0"/>`).join("")}</g>
${content}
</g>
</svg>`;
}

function otter() {
  return frame(
    "#E3CFAD",
    "#F3E7CF",
    `<path d="M14 162 C20 128 46 114 80 114 C114 114 140 128 146 162 Z" fill="#8A5A3B" ${ink()}/>
    <circle cx="40" cy="52" r="10" fill="#9B6A45" ${ink()}/><circle cx="40" cy="52" r="4.5" fill="#6A3F24"/>
    <circle cx="120" cy="52" r="10" fill="#9B6A45" ${ink()}/><circle cx="120" cy="52" r="4.5" fill="#6A3F24"/>
    <path d="M80 32 C110 32 128 52 128 76 C128 100 108 116 80 116 C52 116 32 100 32 76 C32 52 50 32 80 32 Z" fill="#9B6A45" ${ink()}/>
    <path d="M58 40 C68 34 92 34 102 40" stroke="#B9875D" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M80 68 C99 68 112 78 112 92 C112 106 97 115 80 115 C63 115 48 106 48 92 C48 78 61 68 80 68 Z" fill="#EBD5B1"/>
    <ellipse cx="51" cy="95" rx="7" ry="3.4" fill="#D98E78" opacity="0.45"/><ellipse cx="109" cy="95" rx="7" ry="3.4" fill="#D98E78" opacity="0.45"/>
    <circle cx="62" cy="71" r="5.4" fill="${INK}"/><circle cx="63.8" cy="69.2" r="1.7" fill="#fff"/>
    <circle cx="98" cy="71" r="5.4" fill="${INK}"/><circle cx="99.8" cy="69.2" r="1.7" fill="#fff"/>
    <path d="M70 80 C74 75.5 86 75.5 90 80 C90 88 84 92 80 92 C76 92 70 88 70 80 Z" fill="${INK}"/>
    <ellipse cx="76" cy="79.5" rx="3" ry="1.4" fill="#fff" opacity="0.5"/>
    <path d="M80 92 V98 M80 98 C76 103 70 103 67 99 M80 98 C84 103 90 103 93 99" fill="none" ${ink(2)}/>
    <g fill="${INK}"><circle cx="65" cy="92" r="1.3"/><circle cx="61" cy="96" r="1.3"/><circle cx="95" cy="92" r="1.3"/><circle cx="99" cy="96" r="1.3"/></g>
    <path d="M58 93 L30 88 M58 98 L32 101 M102 93 L130 88 M102 98 L128 101" fill="none" ${ink(1.3)}/>
    <path d="M42 116 C58 130 102 130 118 116 C125 122 125 132 118 137 C100 148 60 148 42 137 C35 132 35 122 42 116 Z" fill="#687758" ${ink()}/>
    <path d="M50 126 C66 134 94 134 110 126" fill="none" stroke="#8FA27C" stroke-width="2.4" stroke-dasharray="4 5"/>
    <path d="M98 134 L112 162 H92 L88 138 Z" fill="#5A6B4A" ${ink()}/>`,
  );
}

function kopi() {
  let steam = "";
  for (const x of [66, 80, 94]) steam += `<path d="M${x} 58 C${x - 7} 49 ${x + 6} 43 ${x} 33" fill="none" stroke="#7B7F70" stroke-opacity="0.55" stroke-width="2.6" stroke-linecap="round"/>`;
  return frame(
    "#D5DFC9",
    "#EEF2E6",
    `<rect x="0" y="122" width="160" height="38" fill="#EDEAE2"/>
    <path d="M0 122 H160" ${ink(1.6)}/><path d="M12 140 C40 134 60 150 92 142 S140 146 160 136" fill="none" stroke="#B9B5AA" stroke-width="1.3"/>
    <ellipse cx="80" cy="124" rx="52" ry="12" fill="#FBF8F0" ${ink()}/>
    <ellipse cx="80" cy="122" rx="34" ry="7" fill="none" ${ink(1.2)}/>
    <path d="M116 84 C138 82 138 110 112 108" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
    <path d="M116 84 C138 82 138 110 112 108" fill="none" stroke="#FBF8F0" stroke-width="5" stroke-linecap="round"/>
    <path d="M42 72 C42 96 48 112 60 118 C70 123 90 123 100 118 C112 112 118 96 118 72 Z" fill="#FBF8F0" ${ink()}/>
    <path d="M50 108 C64 116 96 116 110 108" fill="none" stroke="#5E8C6A" stroke-width="3"/>
    <circle cx="80" cy="96" r="6" fill="#B5543B" ${ink(1.3)}/><circle cx="80" cy="96" r="2" fill="#EBC968"/>
    <path d="M73 96 C66 91 60 93 57 97 C62 100 68 100 73 96 Z M87 96 C94 91 100 93 103 97 C98 100 92 100 87 96 Z" fill="#5E8C6A" ${ink(1.1)}/>
    <ellipse cx="80" cy="72" rx="38" ry="9.5" fill="#FBF8F0" ${ink()}/>
    <ellipse cx="80" cy="72" rx="38" ry="9.5" fill="none" stroke="#5E8C6A" stroke-width="2" transform="translate(0 0.6) scale(1 1)" opacity="0.7"/>
    <ellipse cx="80" cy="73" rx="31" ry="6.6" fill="#6B3E26"/>
    <ellipse cx="74" cy="72" rx="13" ry="2.6" fill="#8C5A3A"/>
    ${steam}
    <path d="M118 128 L146 120" stroke="#8E8A80" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="114" cy="129" rx="6" ry="3" fill="#B8B4AA" ${ink(1)}/>`,
  );
}

function scallop(cx, cy, r, n, depth) {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    if (i === 0) d += `M${f2(cx + Math.cos(a0) * r)} ${f2(cy + Math.sin(a0) * r)} `;
    d += `Q${f2(cx + Math.cos(am) * (r + depth))} ${f2(cy + Math.sin(am) * (r + depth))} ${f2(cx + Math.cos(a1) * r)} ${f2(cy + Math.sin(a1) * r)} `;
  }
  return d + "Z";
}

function merlion() {
  let scales = "";
  for (const [x, y] of [[88, 96], [100, 92], [112, 96], [94, 106], [106, 104], [100, 114], [112, 110]]) scales += `M${x - 5} ${y} q5 6 10 0 `;
  return frame(
    "#CDDBE8",
    "#EDF2F7",
    `<circle cx="100" cy="54" r="34" fill="#F1F4F8" opacity="0.8"/>
    <path transform="translate(-7 0)" d="M110 100 C126 92 134 80 134 62 C140 64 140 72 138 80 C134 92 124 100 114 106 Z" fill="#EFE9DC" ${ink()}/>
    <path transform="translate(-7 0)" d="M134 64 C130 52 134 40 144 32 C143 42 145 50 151 56 C156 53 162 53 164 56 C156 64 144 68 134 64 Z" fill="#EFE9DC" ${ink()}/>
    <path transform="translate(-7 0)" d="M136 60 C138 50 141 44 144 38 M138 63 C146 61 152 59 158 58" fill="none" ${ink(1.1)}/>
    <path d="M74 126 C68 108 76 92 92 86 C112 80 128 90 126 106 C124 120 112 126 100 126 Z" fill="#EFE9DC" ${ink()}/>
    <path d="${scales}" fill="none" ${ink(1.2)}/>
    <path d="${scallop(70, 64, 27, 13, 6)}" fill="#E2D6BE" ${ink()}/>
    <path d="M58 44 C64 52 66 60 62 70 M84 46 C80 54 82 62 88 68 M70 38 C72 46 70 52 66 56" fill="none" ${ink(1.2)}/>
    <path d="M70 46 C82 46 90 56 88 70 C86 80 78 88 66 88 C58 88 50 84 48 78 L40 76 C42 69 45 62 50 58 C54 50 62 46 70 46 Z" fill="#F5F1E8" ${ink()}/>
    <path d="M40 76 L54 77 L46 82 Z" fill="#6A3F24" ${ink(1.4)}/>
    <ellipse cx="61" cy="62" rx="4" ry="2.8" fill="${INK}"/><path d="M55 56 Q61 53 67 56" fill="none" ${ink(1.6)}/>
    <path d="M76 52 C80 48 84 50 84 55" fill="none" ${ink(1.6)}/>
    <path d="M41 77 C24 72 12 92 8 130" fill="none" stroke="#9EB9D3" stroke-width="8" stroke-linecap="round"/>
    <path d="M41 77 C24 72 12 92 8 130" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="0.9"/>
    <g fill="#9EB9D3"><circle cx="16" cy="134" r="3"/><circle cx="4" cy="138" r="2.4"/><circle cx="22" cy="140" r="2"/></g>
    <path d="M66 136 L70 124 H130 L136 136 Z" fill="#C9BFAE" ${ink(2)}/>
    <path d="M0 138 C14 130 26 146 40 138 S66 130 80 138 S106 146 120 138 S146 130 160 138 V160 H0 Z" fill="#6884A3" ${ink(2)}/>
    <path d="M0 150 C14 144 26 156 40 150 S66 144 80 150 S106 156 120 150 S146 144 160 150" fill="none" stroke="#B9CFE0" stroke-width="2"/>`,
  );
}

function orchid() {
  const wash = "#EBC6D4";
  const vein = "#A9668A";
  const petal = (d) => `<path d="${d}" fill="${wash}" ${ink(2)}/>`;
  return frame(
    "#EDD6DF",
    "#F8EDF1",
    `<path d="M80 166 C82 146 78 128 86 112" fill="none" stroke="#5E7A4E" stroke-width="4" stroke-linecap="round"/>
    <path d="M82 150 C60 146 40 132 30 112 C54 118 72 130 82 150 Z" fill="#7E9A66" ${ink(2)}/>
    <path d="M82 140 C104 132 122 118 132 98 C110 104 92 118 82 140 Z" fill="#6F8A5C" ${ink(2)}/>
    <g transform="translate(80 70) scale(1.75)">
      ${petal("M0 0 C-10 -6 -26 -4 -30 -16 C-22 -20 -8 -14 0 -2 Z")}
      ${petal("M0 0 C10 -6 26 -4 30 -16 C22 -20 8 -14 0 -2 Z")}
      ${petal("M0 -2 C-6 -14 -6 -28 0 -36 C6 -28 6 -14 0 -2 Z")}
      ${petal("M0 0 C-8 6 -20 10 -24 22 C-14 22 -6 14 0 4 Z")}
      ${petal("M0 0 C8 6 20 10 24 22 C14 22 6 14 0 4 Z")}
      <path d="M-4 -26 C-2 -18 -2 -10 0 -4 M4 -26 C2 -18 2 -10 0 -4 M-24 -14 C-16 -10 -8 -7 -2 -2 M24 -14 C16 -10 8 -7 2 -2" fill="none" stroke="${vein}" stroke-width="0.6"/>
      <path d="M0 2 C-11 9 -12 24 0 32 C12 24 11 9 0 2 Z" fill="#B04F7E" ${ink(1.2)}/>
      <path d="M-3 10 C-2 17 1 21 0 27 M3 10 C4 16 3 20 2 25" fill="none" stroke="#F1C6D8" stroke-width="0.9"/>
      <circle cx="0" cy="1" r="3" fill="#E3B34C" ${ink(0.8)}/>
    </g>
    <ellipse cx="122" cy="40" rx="6" ry="10" transform="rotate(30 122 40)" fill="${wash}" ${ink(1.6)}/>
    <path d="M118 49 C114 60 108 70 100 78" fill="none" stroke="#5E7A4E" stroke-width="2" stroke-linecap="round"/>`,
  );
}

function trishaw() {
  const spokes = (cx, cy, r) => {
    let d = "";
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + 0.3;
      d += `M${cx} ${cy} L${f2(cx + Math.cos(a) * r)} ${f2(cy + Math.sin(a) * r)} `;
    }
    return d;
  };
  const wheel = (cx, cy, r) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${INK}" stroke-width="6"/><circle cx="${cx}" cy="${cy}" r="${r - 4}" fill="none" stroke="#C9A24E" stroke-width="1.6"/>
     <path d="${spokes(cx, cy, r - 4)}" fill="none" stroke="#8E8A80" stroke-width="1.2"/><circle cx="${cx}" cy="${cy}" r="3.4" fill="#C9A24E" ${ink(1)}/>`;
  const frameD = "M82 106 L104 122 L126 122 M104 122 L98 86 L126 122 M88 80 L104 122";
  return frame(
    "#EBCFC2",
    "#F7E8E1",
    `<ellipse cx="80" cy="146" rx="66" ry="7" fill="${INK}" opacity="0.12"/>
    <path d="M0 146 H160" ${ink(1.4)} opacity="0.4"/>
    ${wheel(42, 124, 22)}
    <path d="${frameD}" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${frameD}" fill="none" stroke="#3F8380" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${wheel(126, 122, 22)}
    <path d="M16 96 C12 62 32 40 64 38 L80 42 V100 Z" fill="#8E3328" ${ink()}/>
    <path d="M80 42 C58 50 40 70 36 98 M80 42 C66 56 58 76 58 98" fill="none" stroke="#C25A49" stroke-width="2"/>
    <g ${ink(1)}><circle cx="22" cy="80" r="4" fill="#EBC968"/><circle cx="28" cy="62" r="4" fill="#E7AFA6"/><circle cx="40" cy="49" r="4" fill="#EBC968"/><circle cx="56" cy="41" r="4" fill="#E7AFA6"/></g>
    <path d="M12 98 H84 L80 116 Q48 126 18 118 Z" fill="#B5543B" ${ink()}/>
    <rect x="22" y="88" width="48" height="12" rx="5" fill="#F7EFDC" ${ink(1.8)}/>
    <path d="M80 76 Q88 68 96 74" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M92 82 H112 Q110 89 101 89 Z" fill="${INK}"/>
    <path d="M64 38 V18" ${ink(2)}/><path d="M64 18 L84 23 L64 29 Z" fill="#D9AE4E" ${ink(1.6)}/>`,
  );
}

function durian() {
  let spikes = "";
  const cx = 74, cy = 90, rx = 44, ry = 48;
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    const nx = Math.cos(a), ny = Math.sin(a) * (rx / ry);
    const len = Math.hypot(nx, ny);
    const ux = nx / len, uy = ny / len;
    spikes += `M${f2(x - uy * 5)} ${f2(y + ux * 5)} L${f2(x + ux * 8)} ${f2(y + uy * 8)} L${f2(x + uy * 5)} ${f2(y - ux * 5)} `;
  }
  let inner = "";
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      const x = 38 + col * 12 + (row % 2) * 6;
      const y = 52 + row * 12;
      inner += `<path d="M${x} ${y - 5} L${x + 4.5} ${y + 3} H${x - 4.5} Z" fill="#6E7A36"/><path d="M${x} ${y - 5} L${x - 4.5} ${y + 3}" stroke="#C4CC86" stroke-width="1"/>`;
    }
  }
  return frame(
    "#ECDDB6",
    "#F8F0DB",
    `<ellipse cx="80" cy="146" rx="60" ry="7" fill="${INK}" opacity="0.12"/>
    <path d="${spikes}" fill="#7C8A3E" ${ink(1.6)}/>
    <clipPath id="husk"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#93A050"/>
    <g clip-path="url(#husk)">${inner}<ellipse cx="${cx + 16}" cy="${cy + 10}" rx="${rx}" ry="${ry}" fill="#4E5A26" opacity="0.18"/></g>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" ${ink()}/>
    <path d="M74 42 C72 32 76 24 86 20" fill="none" stroke="#6A3F24" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="74" cy="43" rx="10" ry="4.5" fill="#6A3F24" ${ink(1.6)}/>
    <path d="M100 136 C104 114 128 106 144 118 C150 132 138 144 120 146 C108 146 100 142 100 136 Z" fill="#93A050" ${ink()}/>
    <path d="M106 134 C110 120 128 114 140 122 C142 132 132 140 120 140 C112 140 106 138 106 134 Z" fill="#F2EAD0"/>
    <ellipse cx="123" cy="128" rx="14" ry="8.5" fill="#F0C95E" ${ink(1.6)}/>
    <path d="M114 126 C118 123 124 122 130 124" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>`,
  );
}

export const AVATARS = [
  { id: "otter", make: otter },
  { id: "kopi", make: kopi },
  { id: "merlion", make: merlion },
  { id: "orchid", make: orchid },
  { id: "trishaw", make: trishaw },
  { id: "durian", make: durian },
];

export function avatarSvg(id) {
  return AVATARS.find((a) => a.id === id).make();
}
