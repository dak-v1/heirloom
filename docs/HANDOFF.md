# Stage 1 → Stage 2 handoff

**From:** Perynn (Stage 1: foundation, discovery, arrival, site experience, game, stamp earning)
**To:** teammate (Stage 2: memories, interactive passport, placement and stamping animation, final QA)

Read this first, then run the app and reproduce the demo below before editing.

> **Status (10 Oct 2026): Stage 1 and Stage 2 are complete.** The final state, limits and known issues are in [FINAL_REPORT.md](FINAL_REPORT.md), with test evidence in [ACCEPTANCE.md](ACCEPTANCE.md). The sections below are kept as the developer reference and updated where Stage 2 changed things.

## 1. Checkpoint

| Item | Value |
| --- | --- |
| Repository | `https://github.com/dak-v1/heirloom` |
| Branch / commit | `main`. Stage 1 `314a081`; Stage 2 `74787d6` (tray), `d8d41d0` (placement), `8e733de` (memories); then the Stage 4 integration fixes |
| Node | 22.13+ (tested on 22.18.0) |
| Tests | `npm test`: 50 passing (progress, arrival, scoring/content, placement/undo, memory validation, memories API incl. rate limits and samples) |
| Build | `npm run build` passes with no type errors |

## 2. Run it

```bash
npm install
npm run dev            # web :5173, API :8787 (proxied as /api)
npm test
```

Phone testing needs HTTPS for location and camera: `npm run dev:https` (plus `npm run dev:api` in another terminal), then open `https://<LAN-IP>:5173` and accept the self-signed certificate.

Optional `.env` (see `.env.example`): `HEIRLOOM_ADMIN_TOKEN` enables moderation endpoints; `HEIRLOOM_GUEST_SECRET` keeps guest tokens valid across restarts. Transfer real values privately, never in git.

## 3. Demo script

**For a live demo, use the timed [Demo script (2 minutes)](../README.md#demo-script-2-minutes) in the README** (pre-demo checklist, reset, approving a memory live on `/admin`). The longer walkthrough below covers every feature.

1. **Home** → *Start exploring* (or *Find places near me*).
2. **Arrive**: Map → *Demo: simulate arrival* → *Arrive at Thian Hock Keng*. The sheet is labelled **Demo**. Tap *Explore this place*. (Manual path: tap a stamp marker or the List → *I'm here*.) The same menu has two imprecise readings that show the "Are you at…?" and "A few places are nearby" sheets.
3. **See the past** → *Past View*. Switch eras on the timeline (c. 1890, 1930–60, Today). Tap numbered hotspots; *All details* lists them as text. The ⓘ button shows credits, licence and date basis.
4. **Listen**: mini-player or step 2. Narration uses the device voice (labelled). Open the transcript; switch to 中文 / Melayu (draft labels); Tamil shows as not yet available.
5. **Play** (optional): *Guess the Year*, 3 rounds, or *Skip for now*.
6. **Leave a memory** (optional): note or drawing → "waiting for review"; or *Continue without sharing*. Approve it at `/admin` (see §5) and it appears on that site's wall.
7. **Finish**: *I've finished exploring* → stamp reward → *Stamp my passport* (opens `/passport?place=<earnedStampId>`: the book turns to a stamp page, zooms in and starts placing → drag/tap, rotate, resize → *Stamp here* → press animation → Undo in the toast) or *Place later* (toast; stamp waits in the in-book tray and the passport tray).
8. Refresh: progress, badges and the earned stamp persist; finishing again shows "Already in your passport" (no duplicate).
9. **Next on the trail** card → next site, directions or map.

## 4. What Stage 1 built

| Route | Purpose | Notes |
| --- | --- | --- |
| `/` | Home: start, find nearby, continue visit, trail cards, passport preview | |
| `/map` | Leaflet map (OSM tiles, sepia) + accessible list, "I'm here", directions, demo arrival | `?view=list`, `?site=<id>` |
| `/site/:slug` | Visit journey (6 steps) | overlays in the URL so Back closes them: `?view=past`, `?view=live`, `?play=1` |
| `/passport` | 3D cover → flat 8-page book (prev/next, swipe, page turn), in-book tray, free placement + zoom + stamp press, undo/reposition, counts, tray, badges | `?book=1` (book open), `?place=<earnedStampId>` (place that stamp) |
| `/about`, `/privacy`, `/terms` | Sources, image licences, permissions, community and moderation rules | |
| `/admin` | Memory moderation (token in sessionStorage only) | Not linked from any menu |
| `/dev/hotspots` | Dev-only hotspot calibration grid | Not in production builds |

Global: `ArrivalSheet` (location suggestions), badge toasts, More menu (preferences: motion, sound effects, default story language; location on/off; demo tools; reset progress).

## 5. Data, identity and storage

### Content (`src/content/`)
- `sites/*.ts`: one file per site; `types.ts` documents every field. Stable IDs/slugs: `thian-hock-keng`, `sri-mariamman-temple`, `sultan-mosque`.
- Each site: `eras[]` (image + caption + hotspots, `isToday` for the present), `story` (versions per language, `version` number), `ambient[]`, `game` (Guess the Year rounds with accepted year intervals), `stamp` (art, ink art, date band), `nextSiteId`, `arrivalRadius` (m), `coords`.
- `commons.ts` is generated from the Wikimedia API (URLs, sizes, licences). `media.ts` merges curated metadata. `commons-local.json` overrides URLs after `npm run media:vendor`.
- `sources.ts`: every factual claim cites one of these IDs. `badges.ts`, `languages.ts`, `passport.ts` (logical pages, aspect ratios).

### Guest identity and progress (browser-local)
- `src/services/progress.ts` (`createProgressService`) → app instance in `src/state/progress.ts` (`progress`, `useProgress()`).
- Stored in `localStorage["heirloom:progress:v1"]` with an opaque `guestId`. Falls back to memory if storage is blocked (`progress.persistent === false`; the passport page warns). No server sync, no cross-device sync.
- Server-side guest identity exists only for memories: `POST /api/guest` returns a signed token, stored in `localStorage["heirloom:guest-token:v1"]` by `src/services/memories.ts`.

### Interfaces (plan §5)

| Interface | Status | Where |
| --- | --- | --- |
| `getSite(idOrSlug)` | ✅ as `findSite()` | `src/content/sites/index.ts` |
| `getVisitorProgress()` | ✅ | `progress.getVisitorProgress()` / `useProgress()` |
| `earnStamp(siteId)` | ✅ idempotent, unit-tested | `progress.earnStamp(siteId, stampDesignId)` → `{ stamp, isNew, newBadges }` |
| `getPassportPlacements()` | ✅ storage only (returns `[]` until Stage 2 places stamps) | `progress.getPassportPlacements()` |
| `saveStampPlacement(earnedStampId, placement)` | ✅ storage + validation, unit-tested; **no UI yet** | `progress.saveStampPlacement(id, { pageId, x, y, widthRatio, rotationDeg, zIndex? })`, `progress.removeStampPlacement(id)` for undo |
| `submitMemory(siteId, draft)` | ✅ client + server + composer UI (`src/features/memories/`) | `src/services/memories.ts` → `POST /api/memories` |
| `getApprovedMemories(siteId)` | ✅ client + server | `GET /api/sites/:siteId/memories` (approved only) |

Also available: `progress.getUnplacedStamps()`, `hasEarned()`, `recordHotspotOpened/LanguageUsed/NarrationCompleted/GameResult`, `setCurrentPassportPage()`, `onBadges(listener)`, `resetProgress()`; and `clampPlacement()` (keeps a rotated stamp inside the page).

### Placement contract (for the passport book)
- Logical page: `PAGE_ASPECT = 88/125` (width/height). Coordinates are **normalised to the page**: `x` 0–1 of width, `y` 0–1 of height, centre of the stamp.
- `widthRatio`: stamp width / page width, clamped to `STAMP_WIDTH` (`min 0.22`, `default 0.38`, `max 0.55`). Stamp art aspect `STAMP_ASPECT = 300/380`.
- `rotationDeg` normalised to −180…180; `clampPlacement` keeps the rotated footprint inside the page (tested at several angles).
- Stampable page IDs: `p1`–`p6` (`cover` and `identity` are not stampable). See `PASSPORT_PAGES` for titles/templates.
- One placement per earned stamp: saving again **moves** it (same placement ID). New placements go on top (`zIndex`).

### Memories API (server/app.mjs) — rules already enforced server-side
- `POST /api/memories` (header `x-heirloom-guest: <token>`): `{ siteId, type: "note"|"drawing", text?, drawing? (PNG data URL), displayName? }` → always `pending`. Limits: note ≤ 500 chars, name ≤ 40, PNG ≤ 350 KB and ≤ 1200 px per side, 5 submissions / 10 min per guest, with a generous per-IP backstop (120 / 10 min) so a room on one Wi-Fi can still submit. Text is stored plain and must be **rendered as text**.
- `GET /api/sites/:siteId/memories` → approved only. `GET /api/me/memories` → the guest's own items with status (no moderation reason).
- `GET /api/memories/:id/drawing.png` → only when approved (or with the moderator token).
- `POST /api/memories/:id/report` → hides an approved memory after 3 reports.
- Moderation (`Authorization: Bearer $HEIRLOOM_ADMIN_TOKEN`): `GET /api/admin/memories?status=pending`, `POST /api/admin/memories/:id/approve|reject|hide` (`{ reason? }`). Without the env var these return 503.
- Sample memories: 2 per site, approved and labelled (`is_sample = 1`, "Sample visitor"), seeded at API start with fixed IDs (`seedSampleMemories` in `server/db.mjs`), so restarts never duplicate them.

### Moderating memories

**In the browser:** open `/admin` (not linked from any menu), paste the value of `HEIRLOOM_ADMIN_TOKEN`, then Approve / Reject / Hide. The token is kept only in that tab's session storage and is never shown. To copy it without printing it (PowerShell, repo root):

```powershell
(Select-String -Path .env -Pattern '^HEIRLOOM_ADMIN_TOKEN=').Line.Split('=',2)[1] | Set-Clipboard
```

**From a terminal** (API on :8787; the token is read from `.env` and never echoed):

```bash
TOKEN=$(grep '^HEIRLOOM_ADMIN_TOKEN=' .env | cut -d= -f2-)
API=http://localhost:8787/api/admin/memories
curl -s -H "Authorization: Bearer $TOKEN" "$API?status=pending"          # list pending (also approved|rejected|hidden)
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "content-type: application/json" -d '{}' "$API/<id>/approve"
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "content-type: application/json" -d '{"reason":"off-topic"}' "$API/<id>/reject"
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "content-type: application/json" -d '{}' "$API/<id>/hide"
curl -s -H "Authorization: Bearer $TOKEN" -o drawing.png "http://localhost:8787/api/memories/<id>/drawing.png"   # preview a pending drawing
```

PowerShell equivalent:

```powershell
$t = (Select-String -Path .env -Pattern '^HEIRLOOM_ADMIN_TOKEN=').Line.Split('=',2)[1]
$h = @{ Authorization = "Bearer $t" }
Invoke-RestMethod -Headers $h "http://localhost:8787/api/admin/memories?status=pending"
Invoke-RestMethod -Method Post -Headers $h -ContentType application/json -Body '{}' "http://localhost:8787/api/admin/memories/<id>/approve"
```

`401` = wrong token; `503` = `HEIRLOOM_ADMIN_TOKEN` not set (restart the API after editing `.env`). Moderation reasons are stored but never returned to visitors.
- Storage: SQLite (`node:sqlite`) at `HEIRLOOM_DB_FILE`. Needs a persistent disk in production.

## 6. Connection points (as built)

- **Finish → earn**: `SitePage.finish()` calls `progress.earnStamp(site.id, site.stamp.id)` and shows `StampReward` (`src/features/completion/Completion.tsx`). Insert the optional memory step *before* this; do not gate earning on it.
- **"Stamp my passport"** navigates to `/passport?place=<earnedStampId>`; `PassportPage` calls `usePlacement().pick()`, the book (`PassportBook`, `zoomed`) turns and zooms, `PlacementLayer` handles ghost/drag/keys, `confirm()` calls `saveStampPlacement` once, then `StampPress` animates. If the stamp is already placed, the reward offers "See it in my passport" (`/passport?book=1` on its page) instead.
- **"Place later"** already works: the stamp stays in `progress.getUnplacedStamps()` (the tray).
- **Memory step** (done in Stage 2): `MemoryComposer` in the `sheet === "memory"` sheet, `MemoryWall` on the site page; `progress.recordMemorySubmitted()` awards `memory-keeper`. `finish()` is untouched.
- **Analytics** (local only): `track("stamp_placed" | "memory_submitted", …)` in `src/services/analytics.ts`.

## 7. Assets ready for Stage 2

See [ASSETS.md](ASSETS.md) for specs.
- Ink impressions for placed stamps: `public/assets/stamps/<site>-ink.svg` with a blank band for the visit date (`site.stamp.dateBand`, normalised). Print `formatVisitDate(stamp.visitDate)` there in CSS.
- Rubber stamp tool: `public/assets/3d/rubber-stamp.glb` (3D) and `public/assets/decor/stamp-tool.svg` (2D, for a CSS-perspective animation as the spec prefers).
- Stamp sound: `playStampThunk()` in `src/services/audio/sfx.ts` (check `getPreferences().soundEffects`).
- 3D passport: `public/assets/3d/heirloom-passport.glb` with a hinged `FrontCover` node and an `Open` animation; viewer in `src/features/passport/Passport3D.tsx`. Page textures (endpaper, identity page) are generated in `scripts/assets/lib/passport-art.mjs` and can be exported as images for the 2D page UI.
- Paper texture tile: `public/assets/textures/paper-grain.png` (256 px, transparent). Decorative: `postmark*.svg`, `waves*.svg`, `orchid.svg`, `shophouses.svg`.

## 8. Stage 2 scope: done

1. Memories: composer (note + drawing with palette, pen, undo, clear, blank validation, draft preservation), scrapbook wall of approved memories with labelled samples, `/admin` moderation plus the curl workflow above, report action. Code: `src/features/memories/`, `src/features/admin/`.
2. Interactive passport: cover/identity/stamp pages, page turn (buttons, swipe, keys, reduced-motion variant, "Page n of 8"), trays, free placement within bounds, confirm/cancel, stamp-press animation, undo and repositioning, accessible controls, persistence. Code: `src/features/passport/` (`PassportBook`, `BookPage`, `usePlacement`, `placement.ts`, `PlacementLayer`, `PlacementControls`, `BookTray`, `StampImpression`, `StampPress`).
3. Integration, About/Privacy/Terms wording, QA and docs. **Still open:** the acceptance checklist on real phones (see FINAL_REPORT §7).

## 9. Known issues and limitations (most severe first)

The up-to-date list is in [FINAL_REPORT.md §7](FINAL_REPORT.md#7-known-issues-and-remaining-work-most-severe-first). The Stage 1 list below still applies.

1. **Real GPS arrival is untested on a device in Singapore.** Logic (debounce, hysteresis, cooldown, approximate and multiple matches, dismissal) is unit-tested; the demo simulations (exact, approximate, multiple) and the denied-permission path were tested in a browser. Arrival radii (90–120 m) may need tuning on site.
2. **Live Time Window camera overlay is untested with a real camera** (the test browser blocks cameras). The denied/unavailable fallback was tested. It is labelled a preview, not tracked AR.
3. Translations: 中文 and Bahasa Melayu are AI-assisted drafts labelled as such; they need review by fluent speakers. Tamil is not available. Local-script site names (stamps, headers) should also be checked.
4. Photographs are hotlinked from Wikimedia Commons. For a venue with poor connectivity, run `npm run media:vendor` (downloads ~16 images × 3 sizes) and rebuild.
5. Map tiles come from OpenStreetMap's standard tile server, which allows light use only. For real launch traffic switch to a provider with an API key.
6. Device text-to-speech quality varies, and many devices lack Chinese or Malay voices (the app says so and offers the transcript). ElevenLabs narration is scripted but no key was available, so it is **not configured or tested**.
7. One game photo (Thian Hock Keng, 14 April 1928) is identified as Thian Hock Keng by us, not the archive; it is labelled in-app and in the source register.
8. Badge award for "Good Listener" relies on the speech engine's `end` event; some browsers end speech early when backgrounded.
9. Dev only: React Fast Refresh fully reloads some modules that export hooks; if you see a stale-context error after editing, refresh the page.
