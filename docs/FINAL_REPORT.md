# Final handoff report — Heirloom ("Singapore, Reimagined")

This report follows §13 of `docs/Singapore_Reimagined_Final_Build_Prompt.md`. It covers commit `8e733de` plus the Stage 4 integration fixes (§7) and was written on 10 October 2026.

- Stage 1 (foundation, discovery, site experience, game, earning): Perynn.
- Stage 2 (passport, placement, memories, moderation, integration and QA): teammate.
- Detailed results: [ACCEPTANCE.md](ACCEPTANCE.md). Developer notes: [HANDOFF.md](HANDOFF.md). Sources and rights: [CONTENT_SOURCES.md](CONTENT_SOURCES.md).

## 1. What was built

A mobile-first, no-install web app (React 19 + Vite; Express 5 + SQLite API) for three curated national monuments: **Thian Hock Keng**, **Sri Mariamman Temple** and **Sultan Mosque**.

| Route | What it is |
| --- | --- |
| `/` | Home: Start exploring, Find places near me, Continue your visit, trail cards, passport preview |
| `/map` | Leaflet/OSM map plus an accessible list, "I'm here", directions and a labelled demo arrival (`?view=list`, `?site=<id>`) |
| `/site/:slug` | The visit, as six steps: see the past, listen or read, explore details, play (optional), leave a memory (optional), finish. Then the stamp reward and next-site card. Overlays live in the URL so Back closes them: `?view=past` (Past View), `?view=live` (camera overlay preview), `?play=1` (Guess the Year). Sheets cover modes, transcript, sources, all details, hotspot detail and the memory composer. The memory wall is on the page |
| `/passport` | A 3D leather passport (three.js) used for the whole flow (`?book=1`). The cover opens and 4 leaves (8 pages) turn with a paper curl when you tap a page edge, swipe, use the arrows or press ← →. The camera zooms onto one page for stamping: drag a stamp from the in-book tray onto the 3D page, then drag, rotate and resize it there; a 3D rubber stamp presses the impression in. Undo and reposition, counts, a stamp tray and a link to the badge board. "Flat pages" (or no WebGL) shows the 2D book instead. `?place=<earnedStampId>` opens straight into placing that stamp |
| `/profile` | The visitor's profile. A Heritage Explorer Card shows their chosen map icon, an editable name, a rank and their counts. Tapping the icon opens "Choose your map icon" (otter, kopi, Merlion, orchid, trishaw, durian) with a preview on an illustrated map; the icon then marks "you are here" on the real map and appears as the passport photo. The achievement board is a canvas pennant: earned badges pop onto it as Singapore-themed enamel pins, can be dragged anywhere, and open up close with what they show and how they were earned. Below it is a "Still to earn" list |
| `/about`, `/privacy`, `/terms` | Sources and methodology, permissions and data, community and moderation rules |
| `/admin` | Protected moderation queue for memories. Lazy-loaded and linked from no menu |
| `/dev/hotspots` | Hotspot calibration. Development builds only |

Global elements: the arrival sheet, badge toasts, and a More menu with preferences (motion, sound effects, story language), location on/off, demo tools (simulate arrival, reset) and the secondary pages.

## 2. GPS arrival: how it works and what was tested

- **Starting:** the browser Geolocation API starts only when the visitor taps "Find places near me" (or turns location on in the menu). It uses `watchPosition` with high accuracy, `maximumAge` 15 s and `timeout` 25 s. It runs only while the app is open; tracking pauses and re-checks on `visibilitychange`.
- **Arrival:** a site counts when 2 consecutive fixes fall within its radius (Thian Hock Keng 90 m, Sri Mariamman Temple 90 m, Sultan Mosque 120 m) **and** the reported accuracy is within that radius.
- **Approximate fixes:** a fix that could plausibly be inside gives an "Are you at…?" suggestion. A fix worse than 400 m is ignored.
- **Several matches:** when more than one site matches, a short chooser appears.
- **Repeats:** hysteresis (leaving needs 1.6 × the radius), a 10-minute cooldown and per-session dismissal stop repeated popups. Arrival never starts sound.
- **Fallbacks:** if permission is denied or location is unavailable, the map/list plus "I'm here" path works without location. **Demo: simulate arrival** feeds a labelled, simulated fix into the same detector and sheet; distances are never shown for simulated fixes.
- **Privacy:** coordinates stay in memory only and are never stored or sent. Progress records only visits and stamps.
- **Tested:** the detector logic is unit-tested (debounce, radius, accuracy, hysteresis, cooldown, multiple, dismissal). The demo simulations and the denied path were tested in a desktop browser.
- **Not tested:** real GPS on a phone at the three sites. The radii may need tuning on site.
- **Limits:** foreground only, with no background geofencing, notifications or locked-screen detection. HTTPS is needed on phones (`npm run dev:https`, or a deployed HTTPS host).

## 3. Integrations: configured and tested

| Integration | State |
| --- | --- |
| Narration | Device text-to-speech, labelled "Device voice". ElevenLabs pre-generation is scripted (`npm run narration`) but **not configured or tested** (no key); the manifest is empty |
| Soundscapes and effects | Synthesised in the browser (Web Audio) and labelled illustrative. Stamp "thunk" and reward chime |
| Maps | OpenStreetMap standard tiles (light-use policy; no key). If tiles fail, the app falls back to the list |
| Photographs | Hotlinked from Wikimedia Commons unless `npm run media:vendor` has been run |
| Backend | Express 5 + `node:sqlite` (Node ≥ 22.13): signed anonymous guest tokens, memories with enforced moderation, rate limits. Tested by unit/API tests and a production smoke test |
| Camera | Live Time Window "camera overlay preview" (getUserMedia). **Real camera: not tested.** The denied fallback was tested |
| Accounts, sync, analytics | None. Analytics are a local-only ring buffer with no content and no location |

## 4. Sample, static, browser-local, fallback and stretch

- **Static or curated:** all site content (eras, stories, hotspots, games, stamps) is typed data in `src/content/`. The English stories are curated from NHB/NLB sources.
- **Draft:** the 中文 and Bahasa Melayu story versions are AI-assisted draft translations, labelled in the app. Tamil is not available and is shown as such.
- **Sample:** two **sample memories** per site, seeded in `server/db.mjs`. They are labelled "Sample" and written as illustrative personal impressions with no facts.
- **Browser-local:** guest progress, earned stamps, placements, badges, the current passport page, preferences and the profile (name, map icon, badge board layout) live in `localStorage`. Memory drafts live in `sessionStorage`, and the admin token lives in `sessionStorage` for that tab only.
- **Server:** memories (pending, approved, rejected or hidden) live in SQLite at `HEIRLOOM_DB_FILE`.
- **Fallbacks:** device voice instead of ElevenLabs; transcript as a full alternative to listening; list instead of map tiles; paper backgrounds and "Photo unavailable" captions for photos that fail; a flat cover image when WebGL is missing; Past View when the camera is unavailable.
- **Stretch (P2):** the Live Time Window is a labelled camera overlay preview, not tracked AR.
- **Not built (P1):** account sync, additional games, reviewed translations, richer moderation tools.

## 5. Passport earning, placement and persistence

- **Earning:** "I've finished exploring" calls `progress.earnStamp(siteId)`. It is idempotent (one entitlement per site), and repeat visits show "Already in your passport". It never depends on the game, a memory, GPS, sound or sign-in.
- **Earning and placing are separate.** "Stamp my passport" opens the 3D book, turns to and zooms on a stamp page, and starts placing. "Place later" leaves the stamp in both trays.
- **Placement:** free placement on pages p1–p6 with no slots, directly on the 3D page. Drag a stamp from the tray onto a page, or tap one and then tap or drag on the page (the scene raycasts the finger onto the paper and reports a normalised spot). Rotate, resize, use nudge/keyboard controls, tap a page edge to carry the stamp to the next page, and confirm with Stamp here or Cancel. The rotated footprint is clamped to the page, and a new stamp starts on a clear part of it.
- **What's saved:** page ID, normalised centre `x`/`y`, `widthRatio`, `rotationDeg`, `zIndex` and timestamps on a fixed 88:125 page. The same placement draws identically on the 3D page texture and in the flat book, at any size and after reload.
- **Single save:** the save happens once, before the press animation and independently of it. Confirming again moves the stamp; it never duplicates it.
- **Undo:** after a first placement, Undo returns the stamp to the tray. After a move, Undo restores the previous page, spot, size, rotation and layer. Delete returns a placed stamp to the tray and never removes the earned stamp.
- **Limits:** everything is **in this browser only**, with no account and no cross-device sync. Clearing site data or the in-app reset erases it (the passport page says so). In private browsing it falls back to memory and warns.

## 6. Acceptance summary

Full table with evidence: [ACCEPTANCE.md](ACCEPTANCE.md).

- **Pass:** core navigation and no-QR checks; demo, manual and denied arrival paths; Past View, timeline, hotspots, sources, audio and transcript; the game; the whole memory flow (pending, moderation, correct site, safe rendering, samples, report); every passport and stamping item in desktop/emulated testing; build checks; secrets; labels; info pages.
- **Partial:** real arrival (logic only); camera cleanup; accessibility (no screen-reader pass); failure recovery (placement save failure not forced); console errors (not re-checked after the Stage 4 fixes); journey C.
- **Not tested:** real GPS at the sites, real camera, real phones (touch gestures, HTTPS), screen readers, ElevenLabs.
- **Fail:** none known.

## 7. Known issues and remaining work (most severe first)

1. **Real-device testing is missing.** Arrival GPS at the three sites, touch dragging and drawing on actual phones, the camera preview, and HTTPS on a LAN or deployed host are untested. Run journeys A and B on at least one iOS and one Android phone before relying on them.
2. **Network dependence at the venue.** Photos hotlink Wikimedia and maps use OSM tiles. Run `npm run media:vendor` beforehand (photos only); map tiles can't be vendored, but the list view always works. Memories need the API running.
3. **Stage 4 fixes not yet re-tested in a browser:**
   - **(a)** Offline photo fallbacks on the site hero, trail cards and Past View backdrop.
   - **(b)** Reset now also forgets the memory identity and drafts.
   - **(c)** A repeat visit with an already-placed stamp offers "See it in my passport" instead of picking the stamp up.
   - **(d)** The "Full motion" preference now overrides the device's reduced-motion setting for CSS durations.
4. **The 3D passport hasn't been tried on a low-end phone.** It renders only when something changes and caps the pixel ratio at 2, but it hasn't been profiled on a real mid-range Android. If it struggles, "Flat pages" gives the 2D book with the same placements.
5. **No screen-reader pass.** Labels, live regions and keyboard paths exist but haven't been verified with VoiceOver or TalkBack.
6. **Content:** draft 中文 and Melayu translations need fluent review; Tamil is missing; one game photo identification (Thian Hock Keng, 1928) needs expert confirmation (see CONTENT_SOURCES §5).
7. **Moderation is minimal:** a single shared token, no audit log, no reason entry in the UI (the API accepts `reason`). Reports auto-hide after 3 distinct reporters.
8. **Production:** SQLite needs a persistent disk (`HEIRLOOM_DB_FILE`); the rate limits are in memory; OSM tiles are not for heavy traffic.
9. **Narration:** device voices vary, and many lack Chinese or Malay voices (the app says so and offers the transcript). "Good Listener" relies on the speech `end` event.

## 8. Run and demo instructions

```bash
npm install
npm run dev          # web http://localhost:5173 + API :8787 (proxied as /api)
npm test             # 50 tests
npm run build && npm start   # production: API + built app on PORT (default 8787)
npm run dev:https    # phones on the LAN (geolocation/camera need HTTPS); run `npm run dev:api` alongside
npm run media:vendor # optional offline prep: copies the Commons photos into public/media/commons
```

- **Demo arrival:** Menu ☰ → Demo tools → *Simulate arrival: <site>*, or Map → *Demo: simulate arrival*. Manual: Map/List → choose a site → *I'm here*.
- **Two-minute demo script and pre-demo checklist:** [README.md → Demo script (2 minutes)](../README.md#demo-script-2-minutes).
- **Moderation:** open `/admin`, paste the moderator token, then Approve, Reject or Hide. The curl and PowerShell equivalents are in HANDOFF §5.

## 9. Configuration variables (names only; never commit values)

| Variable | Used by | Purpose |
| --- | --- | --- |
| `PORT` | server | API port (production also serves the built app) |
| `HEIRLOOM_ADMIN_TOKEN` | server | Moderator token for `/api/admin/*` and `/admin`. Unset means moderation returns 503 |
| `HEIRLOOM_GUEST_SECRET` | server | Signs anonymous guest tokens. Unset means a random value per restart, so visitors lose "Your submissions" |
| `HEIRLOOM_DB_FILE` | server | SQLite path (default `server/data/heirloom.sqlite`) |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_VOICE_NAME`, `ELEVENLABS_MODEL_ID` | `scripts/generate-narration.mjs` only | Optional narration pre-generation; never sent to the browser |

`.env` is gitignored, and only `.env.example` (empty values) is tracked. A Stage 4 audit found no secret values in the built bundle, the source, docs, git history or server logs.

## 10. Historical, media and rights notes

- Every fact, photo, licence, crop, date basis and translation status is listed in [CONTENT_SOURCES.md](CONTENT_SOURCES.md).
- Archival photos come from Leiden University Libraries (KITLV) and the Rijksmuseum (public domain, CC0, CC BY 4.0). Present-day photos are CC BY-SA, credited in each photo's details panel and on /about. There are no AI-generated "historical" images.
- Stamps, badges, the passport cover and pages, the 3D models and the decor are original artwork generated by `scripts/assets/`. They show no government crests, and the passport says it is not an official travel document.
- Heirloom is not affiliated with NHB, NLB or the featured places of worship.
