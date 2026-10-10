# Heirloom

Every street has a story. Walk it, listen to it, and leave your own memory behind.

Heirloom is a mobile-first, no-install heritage web app for Singapore, built for the *Common Ground Makeathon: Design × Tech × Culture* (working title "Singapore, Reimagined"). At three curated national monuments, visitors hold real archival photographs up against today's street, listen to (or read) a sourced story, try an optional game, and earn a stamp for their Heritage Passport.

| Site | Area | Story |
| --- | --- | --- |
| Thian Hock Keng 天福宫 | Telok Ayer, Chinatown | Hokkien temple to Mazu on the old shoreline |
| Sri Mariamman Temple ஸ்ரீ மாரியம்மன் கோவில் | South Bridge Road, Chinatown | Singapore's oldest Hindu temple |
| Sultan Mosque مسجد سلطان | Kampong Glam | Royal mosque rebuilt by a whole community |

Both stages of the two-person plan are complete. Start with the **[final report](docs/FINAL_REPORT.md)** (what was built, limits, known issues), then [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) and [docs/HANDOFF.md](docs/HANDOFF.md).

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

## Demo script (2 minutes)

**Before the demo (5 minutes):**
1. Check that `.env` exists with `HEIRLOOM_ADMIN_TOKEN` and `HEIRLOOM_GUEST_SECRET` (copy `.env.example`; use long random values). Restart `npm run dev` after any change.
2. If the venue Wi-Fi is doubtful, run `npm run media:vendor` once (see [Offline prep](#offline-prep)) and restart.
3. Open http://localhost:5173. Go to Menu ☰ → **Demo tools** → *Reset this browser's progress…* → **Erase progress**. This gives a fresh passport, a fresh memory identity and no drafts.
4. Open a second tab at **http://localhost:5173/admin**. Copy the token without showing it with `(Select-String -Path .env -Pattern '^HEIRLOOM_ADMIN_TOKEN=').Line.Split('=',2)[1] | Set-Clipboard` (PowerShell, repo root), paste it and press **Unlock moderation**. Leave this tab on *Pending*.
5. Turn sound up. Sound effects are on by default (Menu ☰ → Preferences).

**On stage:**

| Time | Do this | Say |
| --- | --- | --- |
| 0:00 | Menu ☰ → Demo tools → **Simulate arrival: Thian Hock Keng** → the sheet shows **Demo** → *Explore this place* | GPS suggests nearby places while the app is open; this is a labelled simulation |
| 0:15 | Step 1 **See the past** → *Past View* → switch era (c. 1890 → 1930–60 → Today) → tap hotspot ① → close | Real dated archive photos, sourced details |
| 0:35 | Step 2 → play the story for a few seconds → **Stop** → open the transcript | Narration, or read it instead |
| 0:45 | Step 4 **Guess the Year** → *Skip for now* (or play one round) | Optional; never blocks the stamp |
| 0:55 | Step 5 **Leave a memory** → write a short note → **Share for review** → "waiting for review" → *Back* | Shared memories are moderated |
| 1:10 | Step 6 **I've finished exploring** → reward → **Stamp my passport** → the book turns and zooms → drag the stamp, rotate ↻ → **Stamp here** | Earning and placing are separate; free placement, no slots |
| 1:35 | Reload the page: the stamp is still there | Saved in this browser |
| 1:40 | Switch to the **/admin** tab → *Refresh* → **Approve** the note → back to the site tab → reload `/site/thian-hock-keng` → the note is on the wall ("Your submissions: Published") | Only approved memories go public, and only on their own site |
| 1:55 | **Next on the trail** → Sri Mariamman Temple | Move on |

If something goes wrong: the map's **List** view and *I'm here* always work without location; reset from the menu and start again.

## Offline prep

Photographs are hotlinked from Wikimedia Commons and map tiles come from OpenStreetMap.
- `npm run media:vendor` (needs internet once) downloads every Commons photo into `public/media/commons/` and writes `src/content/commons-local.json`, which the app then prefers. Restart the dev server (or rebuild for `npm start`).
- Map tiles can't be vendored. Without them the map page shows a notice and the accessible list, and every place still works.
- If a photo still fails, the app shows the paper background with "Photo unavailable", or a framed placeholder with *Try again*, instead of a broken image.
- Narration uses the device voice, which works offline. Memories need the local API (`npm run dev` runs it on the same laptop), so they work without internet.

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
