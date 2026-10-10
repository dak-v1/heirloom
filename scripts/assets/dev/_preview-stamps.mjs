// Dev helper: renders a contact sheet PNG for visual review. Usage: node <this file> out.png
// Dev helper: renders stamps side by side into one PNG for visual review.
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { STAMP_SITES, postageStamp, inkImpression } from "../lib/stamps.mjs";
const out = process.argv[2];
const items = STAMP_SITES.flatMap((s) => [postageStamp(s), inkImpression(s)]);
const cell = (svg, i) => `<g transform="translate(${(i % 3) * 320 + 10} ${Math.floor(i / 3) * 400 + 10})"><image width="300" height="380" href="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}"/></g>`;
const order = [0, 2, 4, 1, 3, 5];
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="970" height="810"><rect width="100%" height="100%" fill="#F3ECDD"/>${order.map((k, i) => cell(items[k], i)).join("")}</svg>`;
writeFileSync(out, new Resvg(sheet, { fitTo: { mode: "width", value: 970 } }).render().asPng());
console.log("ok");
