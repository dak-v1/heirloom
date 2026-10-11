// Dev helper: contact sheet of the profile artwork (badge pins, avatars, decor).
// Usage: node scripts/assets/dev/_preview-profile.mjs out.png
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { PINS } from "../lib/pins.mjs";

const u = (s) => `data:image/svg+xml;base64,${Buffer.from(s).toString("base64")}`;
const items = Object.values(PINS).map((make) => ({ svg: make(), w: 200, h: 200 }));

let extra = [];
try {
  const { AVATARS, avatarSvg } = await import("../lib/avatars.mjs");
  extra = AVATARS.map((a) => ({ svg: avatarSvg(a.id), w: 160, h: 160 }));
  const art = await import("../lib/profile-art.mjs");
  extra.push({ svg: art.miniMapSvg(), w: 320, h: 160 }, { svg: art.sealSvg(), w: 140, h: 140 }, { svg: art.facadeSvg(), w: 220, h: 200 });
} catch (e) {
  if (e.code !== "ERR_MODULE_NOT_FOUND") throw e;
}

const all = [...items, ...extra];
let x = 10, y = 10, rowH = 0;
const cells = all.map(({ svg, w, h }) => {
  if (x + w > 900) {
    x = 10;
    y += rowH + 14;
    rowH = 0;
  }
  const cell = `<image href="${u(svg)}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  x += w + 14;
  rowH = Math.max(rowH, h);
  return cell;
});
const H = y + rowH + 10;
writeFileSync(process.argv[2], new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="910" height="${H}"><rect width="100%" height="100%" fill="#EFE6D2"/>${cells.join("")}</svg>`).render().asPng());
console.log("ok");
