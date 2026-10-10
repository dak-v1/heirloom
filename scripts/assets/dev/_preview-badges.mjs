// Dev helper: renders a contact sheet PNG for visual review. Usage: node <this file> out.png
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { BADGES, badgeSvg } from "../lib/badges.mjs";
const cells = BADGES.map((b, i) => `<g transform="translate(${(i % 4) * 250 + 5} ${Math.floor(i / 4) * 250 + 5})"><image width="240" height="240" href="data:image/svg+xml;base64,${Buffer.from(badgeSvg(b)).toString("base64")}"/></g>`);
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="1005" height="505"><rect width="100%" height="100%" fill="#F3ECDD"/>${cells.join("")}</svg>`;
writeFileSync(process.argv[2], new Resvg(sheet).render().asPng());
console.log("ok");
