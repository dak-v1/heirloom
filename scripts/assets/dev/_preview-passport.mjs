// Dev helper: renders a contact sheet PNG for visual review. Usage: node <this file> out.png
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { coverFrontSvg, coverBackSvg, endpaperSvg, identityPageSvg, spineSvg } from "../lib/passport-art.mjs";
const u = (s) => `data:image/svg+xml;base64,${Buffer.from(s).toString("base64")}`;
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="1290" height="520"><rect width="100%" height="100%" fill="#ddd"/>
<image href="${u(coverFrontSvg())}" x="10" y="10" width="352" height="500"/>
<image href="${u(coverFrontSvg("metal"))}" x="372" y="10" width="176" height="250"/>
<image href="${u(coverBackSvg())}" x="372" y="265" width="176" height="250"/>
<image href="${u(endpaperSvg())}" x="558" y="10" width="352" height="500"/>
<image href="${u(identityPageSvg())}" x="920" y="10" width="352" height="500"/>
</svg>`;
writeFileSync(process.argv[2], new Resvg(sheet).render().asPng());
console.log("ok");
