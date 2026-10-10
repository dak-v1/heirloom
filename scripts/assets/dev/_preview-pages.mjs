// Dev helper: renders a contact sheet PNG for visual review. Usage: node <this file> out.png
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { endPageSvg, identityPageSvg, stampPageSvg } from "../lib/passport-art.mjs";
import LAYOUT from "../../../src/content/passport-layout.json" with { type: "json" };
const u = (s) => `data:image/svg+xml;base64,${Buffer.from(s).toString("base64")}`;
const pages = LAYOUT.pages.map((p, index) => ({ ...p, index }));
const side = (id) => (LAYOUT.leaves.some((l) => l.recto === id) ? "recto" : "verso");
const faces = [identityPageSvg(1), ...pages.filter((p) => p.kind === "stamp").map((p) => stampPageSvg(p, side(p.id))), endPageSvg()];
const cell = (svg, i) => `<image href="${u(svg)}" x="${(i % 4) * 230 + 10}" y="${Math.floor(i / 4) * 330 + 10}" width="220" height="312"/>`;
writeFileSync(process.argv[2], new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="930" height="670"><rect width="100%" height="100%" fill="#ccc"/>${faces.map(cell).join("")}</svg>`).render().asPng());
console.log("ok");
