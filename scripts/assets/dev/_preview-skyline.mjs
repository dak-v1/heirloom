// Dev helper: render the home hero sketch on textured paper. Usage: node <this file> out.png
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { skylineSketchSvg } from "../lib/skyline.mjs";

const u = (s) => `data:image/svg+xml;base64,${Buffer.from(s).toString("base64")}`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="400"><rect width="100%" height="100%" fill="#EFE5D0"/><image href="${u(skylineSketchSvg())}" x="30" y="20" width="640" height="360"/></svg>`;
writeFileSync(process.argv[2], new Resvg(svg).render().asPng());
console.log("ok", Buffer.byteLength(skylineSketchSvg()));
