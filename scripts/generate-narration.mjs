// Pre-generates story narration with ElevenLabs and records it in
// public/audio/narration/manifest.json. Runs on a developer machine or CI only:
// the API key never reaches the browser, and files are cached by
// (site, language, story version, voice, model) so each story is paid for once.
//
//   ELEVENLABS_API_KEY=… ELEVENLABS_VOICE_ID=… npm run narration -- --langs en --dry-run
//   ELEVENLABS_API_KEY=… ELEVENLABS_VOICE_ID=… npm run narration -- --langs en,zh,ms
//
// Flags: --langs en,zh,ms (default en) · --sites id,id · --dry-run · --force
// Draft translations are only voiced when their language is requested explicitly,
// and the app keeps labelling them as drafts.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (existsSync(path.join(root, ".env"))) process.loadEnvFile(path.join(root, ".env"));

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const langs = opt("langs", "en").split(",").map((s) => s.trim()).filter(Boolean);
const onlySites = opt("sites", "").split(",").map((s) => s.trim()).filter(Boolean);
const dryRun = flag("dry-run");
const force = flag("force");

const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID;
const voiceName = process.env.ELEVENLABS_VOICE_NAME || "Heritage guide";
const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
if (!dryRun && (!apiKey || !voiceId)) {
  console.error("Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID (in .env or the environment), or use --dry-run.");
  process.exit(1);
}

// Load the TypeScript content through Vite so this script reads exactly what the app shows.
const vite = await createServer({ root, logLevel: "error", server: { middlewareMode: true, hmr: false }, appType: "custom" });
const { SITES } = await vite.ssrLoadModule("/src/content/sites/index.ts");
const { storySummaryParagraphs } = await vite.ssrLoadModule("/src/services/audio/narration.ts");
await vite.close();

const outDir = path.join(root, "public", "audio", "narration");
mkdirSync(outDir, { recursive: true });
const manifestFile = path.join(outDir, "manifest.json");
const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, "utf8")) : { entries: [] };
manifest.entries ??= [];

let chars = 0;
for (const site of SITES) {
  if (onlySites.length && !onlySites.includes(site.id)) continue;
  for (const lang of langs) {
    const v = site.story.versions[lang];
    if (!v) {
      console.log(`- ${site.id} [${lang}]: no ${lang} version, skipped`);
      continue;
    }
    const tracks = [
      { kind: "story", paragraphs: [v.title + ".", ...v.paragraphs] },
      { kind: "summary", paragraphs: storySummaryParagraphs(v) },
    ];
    for (const track of tracks) {
      const text = track.paragraphs.join("\n\n");
      const key = createHash("sha256").update([site.id, lang, track.kind, site.story.version, voiceId, modelId, text].join("|")).digest("hex").slice(0, 10);
      const file = `${site.id}.${lang}.${track.kind}.v${site.story.version}.${key}.mp3`;
      const target = path.join(outDir, file);
      chars += text.length;
      if (existsSync(target) && !force) {
        console.log(`= ${site.id} [${lang}] ${track.kind}: cached ${file}`);
      } else if (dryRun) {
        console.log(`? ${site.id} [${lang}] ${track.kind}: would generate ${file} (${text.length} characters${v.status === "draft-translation" ? ", DRAFT translation" : ""})`);
        continue;
      } else {
        console.log(`> ${site.id} [${lang}] ${track.kind}: generating ${file} …`);
        const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
          method: "POST",
          headers: { "xi-api-key": apiKey, "content-type": "application/json", accept: "audio/mpeg" },
          body: JSON.stringify({ text, model_id: modelId, voice_settings: { stability: 0.55, similarity_boost: 0.75 } }),
        });
        if (!r.ok) {
          console.error(`  ElevenLabs request failed with HTTP ${r.status}. Check the API key, voice ID, quota, and model settings.`);
          process.exitCode = 1;
          continue;
        }
        writeFileSync(target, Buffer.from(await r.arrayBuffer()));
      }
      manifest.entries = manifest.entries.filter((e) => !(e.siteId === site.id && e.lang === lang && (e.kind ?? "story") === track.kind));
      manifest.entries.push({ siteId: site.id, lang, storyVersion: site.story.version, kind: track.kind, url: `/audio/narration/${file}`, voice: voiceName, generator: "elevenlabs", model: modelId });
    }
  }
}

if (!dryRun) {
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Manifest updated: ${manifest.entries.length} entr${manifest.entries.length === 1 ? "y" : "ies"}.`);
}
console.log(`Total characters in selected stories: ${chars}.`);
