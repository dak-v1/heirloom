# Heirloom

Every street has a story. Walk it, listen to it, and leave your own memory behind.

Heirloom is a mobile-first, no-install heritage web app for Singapore, built for the *Common Ground Makeathon: Design × Tech × Culture* (working title "Singapore, Reimagined"). At three curated national monuments, visitors hold real archival photographs up against today's street, listen to (or read) a sourced story, try an optional game, and earn a stamp for their Heritage Passport.

| Site | Area | Story |
| --- | --- | --- |
| Thian Hock Keng 天福宫 | Telok Ayer, Chinatown | Hokkien temple to Mazu on the old shoreline |
| Sri Mariamman Temple ஸ்ரீ மாரியம்மன் கோவில் | South Bridge Road, Chinatown | Singapore's oldest Hindu temple |
| Sultan Mosque مسجد سلطان | Kampong Glam | Royal mosque rebuilt by a whole community |

This repository is at the **end of Stage 1** of the two-person plan (Perynn → teammate). See [docs/HANDOFF.md](docs/HANDOFF.md) before changing anything.

## Quick start

Requires Node.js **22.13 or newer** (the API uses the built-in `node:sqlite`).

```bash
npm install
npm run dev          # web app on http://localhost:5173, API on :8787 (proxied at /api)
```

Open http://localhost:5173 on a desktop browser, or use phone emulation at 375–430 px.

To try it on a phone (geolocation and the camera need HTTPS):

```bash
npm run dev:https    # serves https://<your-LAN-IP>:5173 with a self-signed certificate
```

Run the API alongside it with `npm run dev:api` in a second terminal.

### Demo without being in Singapore

Menu (☰) → **Demo tools** → *Simulate arrival*, or Map → *Demo: simulate arrival*. The arrival sheet is labelled **Demo** and never uses your real location. You can also pick any site on the Map/List and tap **I'm here**.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server + API with auto-reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm start` | Production: API + built app on `PORT` (default 8787) |
| `npm test` | Unit and API tests (Vitest) |
| `npm run assets` | Regenerate all artwork, icons, textures and 3D models |
| `npm run narration -- --dry-run` | Plan ElevenLabs narration (see below) |
| `npm run media:vendor` | Optional: download the Commons photos for offline demos |

## Configuration

Copy `.env.example` to `.env`. Nothing is required for the core journey.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `PORT` | server | Port for `npm start` (hosting platforms set this) |
| `HEIRLOOM_GUEST_SECRET` | server | Signs anonymous guest tokens. Set a long random value in production |
| `HEIRLOOM_ADMIN_TOKEN` | server | Moderator token for `/api/admin/*`. Without it, memories can be submitted (pending) but not approved |
| `HEIRLOOM_DB_FILE` | server | SQLite file (default `server/data/heirloom.sqlite`) |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_VOICE_NAME`, `ELEVENLABS_MODEL_ID` | `scripts/generate-narration.mjs` only | Pre-generate narration. Never sent to the browser |

## Narration

Without prepared audio, stories are read by the **device's own text-to-speech voice**, labelled "Device voice". With an ElevenLabs key:

```bash
npm run narration -- --langs en --dry-run
npm run narration -- --langs en
```

MP3s land in `public/audio/narration/` and are listed in `manifest.json`; the app then plays them, labelled "Synthetic voice generated with ElevenLabs". Files are cached by site, language, story version, voice and model, so each story is generated once.

## Project layout

```
src/
  content/        curated data: sites, eras, hotspots, stories, games, stamps, badges, sources
  services/       storage, progress (earnStamp…), arrival detection, audio, memories API client
  state/          app-wide stores (progress, preferences)
  features/       home, map, location, site (Past View, Live preview), audio, game, completion, passport, info
  components/     shell, buttons, sheets, toasts, framed images
server/           Express + SQLite API: guest identity, memories with enforced moderation
scripts/assets/   generators for stamps, badges, brand, decor and the 3D passport (GLB)
public/assets/    generated artwork (committed)
tests/            Vitest unit + API tests
docs/             handoff, sources register, asset specs, acceptance results
```

## Deploying

Any Node 22.13+ host (Render, Railway, Fly.io, a VM): `npm install && npm run build`, then `npm start`. Serve over HTTPS. Set `HEIRLOOM_GUEST_SECRET` and `HEIRLOOM_ADMIN_TOKEN`, and give `HEIRLOOM_DB_FILE` a persistent disk if memories should survive redeploys.

## Honesty notes

Archival photographs are real and credited; dates are only as precise as the archive's. English stories are curated from NHB Roots.sg and NLB sources; 中文 and Bahasa Melayu are AI-assisted **draft** translations awaiting review; Tamil is not yet available. Soundscapes are synthesised in the browser and labelled illustrative. The passport is a keepsake, not an official document. Heirloom is not affiliated with NHB, NLB or the featured places of worship. Details: [docs/CONTENT_SOURCES.md](docs/CONTENT_SOURCES.md).
