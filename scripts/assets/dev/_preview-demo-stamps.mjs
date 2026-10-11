// Dev helper: contact sheet of the placeholder stamps (postage + ink). Usage: node <this file> out.png
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { DEMO_STAMP_SITES, postageStamp, inkImpression } from "../lib/stamps.mjs";

const u = (s) => `data:image/svg+xml;base64,${Buffer.from(s).toString("base64")}`;
const cells = DEMO_STAMP_SITES.flatMap((s, i) => {
  const x = (i % 5) * 190 + 10;
  const y = Math.floor(i / 5) * 470 + 10;
  return [`<image href="${u(postageStamp(s))}" x="${x}" y="${y}" width="170" height="215"/>`, `<image href="${u(inkImpression(s))}" x="${x}" y="${y + 225}" width="170" height="215"/>`];
});
writeFileSync(process.argv[2], new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="950"><rect width="100%" height="100%" fill="#F3ECDD"/>${cells.join("")}</svg>`).render().asPng());
console.log("ok");
