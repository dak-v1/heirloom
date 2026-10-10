// Dev helper: renders a contact sheet PNG for visual review. Usage: node <this file> out.png
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";
const f = (p) => `data:image/svg+xml;base64,${readFileSync(p).toString("base64")}`;
const pngUri = (p) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="760"><rect width="100%" height="100%" fill="#F3ECDD"/>
<image href="${f("public/assets/brand/logo.svg")}" x="20" y="20" height="100" width="420"/>
<image href="${f("public/assets/decor/postmark.svg")}" x="480" y="10" width="300" height="183"/>
<image href="${pngUri("public/icons/icon-192.png")}" x="20" y="150" width="128" height="128"/>
<image href="${pngUri("public/icons/icon-maskable-512.png")}" x="160" y="150" width="128" height="128"/>
<image href="${f("public/favicon.svg")}" x="300" y="150" width="32" height="32"/>
<image href="${f("public/assets/decor/waves.svg")}" x="300" y="200" width="120" height="40"/>
<image href="${f("public/assets/decor/orchid.svg")}" x="800" y="10" width="160" height="218"/>
<image href="${f("public/assets/decor/stamp-tool.svg")}" x="460" y="200" width="100" height="130"/>
<image href="${f("public/assets/decor/shophouses.svg")}" x="0" y="330" width="1000" height="100"/>
<image href="${pngUri("public/og-image.png")}" x="20" y="440" width="600" height="315"/>
<image href="${pngUri("public/assets/textures/paper-grain.png")}" x="640" y="440" width="300" height="300"/>
</svg>`;
writeFileSync(process.argv[2], new Resvg(sheet).render().asPng());
console.log("ok");
