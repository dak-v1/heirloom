// Generates every 2D asset the app uses into public/assets.
//   node scripts/assets/build-2d.mjs
// Outputs are committed, so this only needs re-running after artwork changes.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { STAMP_SITES, DEMO_STAMP_SITES, postageStamp, inkImpression } from "./lib/stamps.mjs";
import { PINS } from "./lib/pins.mjs";
import { AVATARS, avatarSvg } from "./lib/avatars.mjs";
import { miniMapSvg, sealSvg, facadeSvg } from "./lib/profile-art.mjs";
import { skylineSketchSvg } from "./lib/skyline.mjs";
import { markSvg, logoSvg, postmarkSvg, wavesSvg, orchidSvg, shophouseDividerSvg, stampToolSvg } from "./lib/brand.mjs";
import { textPath, FONTS } from "./lib/fonts.mjs";
import { P } from "./lib/palette.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = (...p) => path.join(root, "public", "assets", ...p);
const write = (file, data) => {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, data);
  console.log("  wrote", path.relative(root, file));
};
const png = (svg, width) => new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

console.log("Stamps");
for (const site of STAMP_SITES) {
  write(out("stamps", `${site.slug}.svg`), postageStamp(site));
  write(out("stamps", `${site.slug}-ink.svg`), inkImpression(site));
}

console.log("Demo stamps (placeholders)");
for (const site of DEMO_STAMP_SITES) {
  write(out("stamps", "demo", `${site.slug}.svg`), postageStamp(site));
  write(out("stamps", "demo", `${site.slug}-ink.svg`), inkImpression(site));
}

console.log("Badges (enamel pins)");
for (const [id, make] of Object.entries(PINS)) write(out("badges", `${id}.svg`), make());

console.log("Avatars");
for (const a of AVATARS) write(out("avatars", `${a.id}.svg`), avatarSvg(a.id));

console.log("Brand");
write(out("brand", "mark.svg"), markSvg());
write(out("brand", "logo.svg"), logoSvg());
write(out("brand", "logo-light.svg"), logoSvg({ color: P.paperLight }));
write(path.join(root, "public", "favicon.svg"), markSvg({ size: 64 }));
write(path.join(root, "public", "icons", "icon-192.png"), png(markSvg({ background: P.paper }), 192));
write(path.join(root, "public", "icons", "icon-512.png"), png(markSvg({ background: P.paper }), 512));
write(path.join(root, "public", "icons", "icon-maskable-512.png"), png(markSvg({ background: P.paper, inset: 34 }), 512));
write(path.join(root, "public", "icons", "apple-touch-icon.png"), png(markSvg({ background: P.paper, inset: 12 }), 180));

console.log("Decor");
write(out("decor", "postmark.svg"), postmarkSvg());
write(out("decor", "postmark-terracotta.svg"), postmarkSvg({ color: P.terracotta }));
write(out("decor", "waves.svg"), wavesSvg());
write(out("decor", "waves-ink.svg"), wavesSvg({ color: P.ink }));
write(out("decor", "orchid.svg"), orchidSvg());
write(out("decor", "shophouses.svg"), shophouseDividerSvg());
write(out("decor", "stamp-tool.svg"), stampToolSvg());
write(out("decor", "mini-map.svg"), miniMapSvg());
write(out("decor", "explorer-seal.svg"), sealSvg());
write(out("decor", "shophouse-facade.svg"), facadeSvg());
write(out("decor", "skyline-sketch.svg"), skylineSketchSvg());

console.log("Textures");
const paperTile = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
<filter id="f" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="3" stitchTiles="stitch" result="fine"/>
  <feColorMatrix in="fine" type="matrix" values="0 0 0 0 0.40  0 0 0 0 0.34  0 0 0 0 0.24  0 0 0 0.10 0" result="speck"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="2" seed="9" stitchTiles="stitch" result="fibre"/>
  <feColorMatrix in="fibre" type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.47  0 0 0 0 0.33  0 0 0 0.16 -0.02" result="mottle"/>
  <feMerge><feMergeNode in="mottle"/><feMergeNode in="speck"/></feMerge>
</filter>
<rect width="256" height="256" filter="url(#f)"/>
</svg>`;
write(out("textures", "paper-grain.png"), png(paperTile, 256));

console.log("Share image");
const stampImgs = STAMP_SITES.map((s) => dataUri(postageStamp(s)));
const title = textPath("Heirloom", { file: FONTS.display(800), size: 112, x: 80, y: 250 });
const tag1 = textPath("See the past. Hear the stories.", { file: FONTS.display(500), size: 40, x: 84, y: 330 });
const tag2 = textPath("Leave your mark.", { file: FONTS.display(500), size: 40, x: 84, y: 382 });
const kicker = textPath("A SINGAPORE HERITAGE PASSPORT", { file: FONTS.display(700), size: 18, x: 86, y: 148, tracking: 0.3 });
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><radialGradient id="v" cx="0.5" cy="0.45" r="0.75"><stop offset="0.6" stop-color="${P.paper}"/><stop offset="1" stop-color="#E6DCC6"/></radialGradient></defs>
<rect width="1200" height="630" fill="url(#v)"/>
<path d="${kicker.d}" fill="${P.terracotta}"/>
<path d="${title.d}" fill="${P.ink}"/>
<path d="${tag1.d}${tag2.d}" fill="${P.inkMuted}"/>
<image href="${dataUri(postmarkSvg({ color: P.terracotta }))}" x="80" y="430" width="250" height="153" opacity="0.8"/>
<g transform="translate(700 120) rotate(-9)"><rect x="6" y="10" width="232" height="294" fill="#000" opacity="0.12"/><image href="${stampImgs[0]}" width="232" height="294"/></g>
<g transform="translate(850 170) rotate(4)"><rect x="6" y="10" width="232" height="294" fill="#000" opacity="0.12"/><image href="${stampImgs[2]}" width="232" height="294"/></g>
<g transform="translate(760 290) rotate(-2)"><rect x="6" y="10" width="232" height="294" fill="#000" opacity="0.14"/><image href="${stampImgs[1]}" width="232" height="294"/></g>
</svg>`;
write(path.join(root, "public", "og-image.png"), png(og, 1200));

console.log("Done.");
