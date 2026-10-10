// Optional: copy every Wikimedia Commons image the app uses into public/media/commons
// so the demo does not depend on Wikimedia at the venue. Writes
// src/content/commons-local.json, which src/content/media.ts prefers when present.
//
//   npm run media:vendor
//
// All files are public domain, CC0, CC BY or CC BY-SA; credits stay in the app.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vite = await createServer({ root, logLevel: "error", server: { middlewareMode: true, hmr: false }, appType: "custom" });
const { COMMONS } = await vite.ssrLoadModule("/src/content/commons.ts");
await vite.close();

const outDir = path.join(root, "public", "media", "commons");
mkdirSync(outDir, { recursive: true });
const UA = "HeirloomHeritageApp/0.1 (makeathon demo; media vendoring script)";
const local = {};

for (const [id, f] of Object.entries(COMMONS)) {
  const entry = {};
  for (const [key, url] of [["src", f.src], ["srcSmall", f.srcSmall], ["srcLarge", f.srcLarge]]) {
    const ext = url.toLowerCase().endsWith(".png") ? "png" : "jpg";
    const name = `${id}-${key}.${ext}`;
    const r = await fetch(url, { headers: { "user-agent": UA } });
    if (!r.ok) {
      console.error(`  ${id} ${key}: HTTP ${r.status}, keeping the remote URL`);
      continue;
    }
    writeFileSync(path.join(outDir, name), Buffer.from(await r.arrayBuffer()));
    entry[key] = `/media/commons/${name}`;
    console.log(`  saved ${name}`);
  }
  local[id] = entry;
}
writeFileSync(path.join(root, "src", "content", "commons-local.json"), JSON.stringify(local, null, 2) + "\n");
console.log("Wrote src/content/commons-local.json. Rebuild the app to use local copies.");
