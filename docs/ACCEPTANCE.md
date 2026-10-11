# Acceptance checklist — final (Stage 1 + Stage 2)

Checked against `docs/Singapore_Reimagined_Final_Build_Prompt.md` §12 on **10 October 2026**, commit `8e733de` plus the Stage 4 fixes listed in [FINAL_REPORT.md](FINAL_REPORT.md).

**Statuses:** **Pass** (tested, evidence given) · **Partial** · **Fail** · **Not tested**. Code being written is never counted as a pass.

**Evidence key:**

| Key | Meaning |
| --- | --- |
| **U** | Unit/API tests: `npm test`, 66 passing (adds leaf-curl, 3D-layout, free-spot, profile, badge-board and demo-stamp tests) |
| **A** | API and route smoke test against the production build (`npm run build` then `node server/index.mjs`), run in Stage 4 |
| **S1** | Browser test by Perynn at the Stage 1 handoff (built-in Chromium, 375 × 812, plus 320 and desktop) |
| **S2** | Browser test by the Stage 2 teammate after each Stage 2 step (desktop Chromium with device emulation and touch emulation at 320/375/430 and a wide window) |
| **S3** | Browser test by Perynn after the 3D passport rework (built-in Chromium at 390 × 844 and 1280 × 900, mouse input, full and reduced motion) |
| **C** | Code review only. It supports a result but is never the sole basis for a Pass |

Nothing was tested on a real phone, with real GPS, a real camera or a screen reader. Every item that depends on one of those is marked **Not tested**.

The four Stage 4 fixes (image fallbacks, full reset, the reward button for already-placed stamps, and the "Full motion" override) are type-checked and built but **not yet re-tested in a browser**. See FINAL_REPORT §7.

## Entry, GPS and navigation

| Item | Status | Evidence |
| --- | --- | --- |
| Home immediately offers a working exploration action | Pass | S1: "Start exploring" → /map; "Find places near me" |
| Primary navigation is Home, Map, Passport; no Scan or Games destination | Pass | `AppShell.tsx` NavLinks are `/`, `/map`, `/passport` and `/profile` (Profile was added on request after Stage 4); still no Scan or Games destination; `/admin` is reachable only by URL (C, S1, S3) |
| No QR scanner, QR asset, QR route or QR-dependent copy | Pass | Stage 4 grep of src, server and public for qr, scanner, scan routes, game hub and leaderboard: 0 matches |
| Location is requested only through an explicit action | Pass | S1; C: `start()` is called only from buttons |
| A qualifying foreground location produces the correct arrival sheet | Partial | U: radius, accuracy and debounce logic. **Real GPS on a device at the sites: Not tested** |
| Dismissal, cooldown, approximate position and multiple nearby sites are handled | Pass | U (`tests/arrival.test.ts`); S1 via the labelled demo readings |
| Denied or unavailable location has a working manual selection and "I'm here" path | Pass | S1 |
| Demo arrival is labelled and uses the same downstream flow | Pass | S1, S2 (used to start every Stage 2 test) |
| Distance and nearby claims use real data or are omitted | Pass | S1; C: hidden for simulated arrivals and for accuracy over 1 km |
| Direct site links work; invalid slugs recover gracefully | Pass | S1; A: every SPA route returns index.html with 200 |

## Visual experience, audio and exploration

| Item | Status | Evidence |
| --- | --- | --- |
| Past View opens in the app and works without camera permission | Pass | S1 |
| Today and available-era choices update media and context | Pass | S1 |
| No unsupported timeline years | Pass | S1; C (eras only where a dated photo exists) |
| Archival photos and generated interpretations are distinguishable | Pass | S1 (type tag on every image; no AI "historical" images) |
| Hotspots stay aligned across viewport changes | Pass | S1 at 320, 375 and the calibration view |
| Source, date and credit information is available | Pass | S1 |
| Narration and ambient sound need a playback gesture and have independent controls | Pass | S1 |
| Play, pause, resume, replay and transcript work | Pass | S1 |
| Language changes select the correct content and handle missing versions | Pass | S1 (中文 and Melayu labelled as drafts; Tamil "not available") |
| Closing or switching sites cleans up audio and camera | Partial | Audio: S1. **Camera track stop: Not tested** (no camera) |
| Live mode is real and tested, or clearly labelled as a preview | Pass | Labelled "Camera overlay preview, not tracked AR"; the denied-camera fallback was tested (S1). **A real camera: Not tested** |
| ElevenLabs narration | Not tested | Not configured (no key). The device voice is used and labelled |

## Optional activities and memories

| Item | Status | Evidence |
| --- | --- | --- |
| The game opens from the current site as an overlay and returns to it correctly | Pass | S1 |
| Questions, scoring, feedback and replay work | Pass | U, S1 |
| Skipping or closing the game still allows a stamp | Pass | S1, S2 |
| Note and drawing creation work on touch-sized layouts | Pass | S2 (375 px with touch emulation; drawing doesn't scroll the page). **Real touch device: Not tested** |
| Drawing undo and clear, and empty-content validation | Pass | U (`tests/memory-validation.test.ts`: blank canvas, empty note, 500/501 characters, 40-character name); S2 |
| New submissions are pending and stay off the public wall | Pass | U; A (submitted note was absent from the wall, `/api/me/memories` showed "pending"); S2 |
| An authorised approval publishes the memory only at the correct site | Pass | U; A (after approval it appeared on the Sultan Mosque wall and not on Thian Hock Keng's); S2 via `/admin` |
| Public APIs protect non-approved content and moderator actions | Pass | U; A: approving returned 401 with no token or a wrong token and 200 with the right one; drawings 404 until approved |
| Unsafe or oversized input is rejected; notes are rendered safely | Pass | U; A: an SVG "drawing" and a whitespace note were rejected; `<b>` is stored as literal text and rendered as React text, never HTML (C) |
| Memory submission or skipping doesn't block visit completion | Pass | S2; C: `finish()` is unchanged and doesn't read memory state |
| Sample memories are clearly labelled | Pass | A: 2 per site, `isSample`, "Sample visitor", text starting "Sample note:"; S2 ("Sample" tag) |
| Report action | Pass | U (one report per guest per memory); S2 |

## Profile and badge board (added on request after Stage 4)

| Item | Status | Evidence |
| --- | --- | --- |
| Name can be set, is cleaned and persists; empty falls back to "Guest explorer" | Pass | U; S3 (edit, Enter saves, focus returns to the pencil) |
| Map icon picker with a map preview; the choice shows on the real map and as the passport photo | Pass | S3 (picker; faked GPS fix on `/map` shows the icon above the site pin; 3D identity page shows it) |
| Badges moved from the passport page to the profile board | Pass | S3; the passport page links to the board |
| New badges pop onto the board when it comes into view, with a NEW tag until opened | Pass | S3 (three badges popped in with sparkles); U (pinned once, NEW cleared by `markSeen`) |
| Pins can be dragged anywhere on the pennant and stay on it; arrow keys move a focused pin | Pass (emulated) | U (clamping, including the pointed tail); S3 with the mouse. **Touch drag on a real phone: Not tested** |
| Tapping a pin opens a close-up with what it shows and how it's earned; locked badges too | Pass | S3 |

## Passport and stamping

| Item | Status | Evidence |
| --- | --- | --- |
| Story completion or the explicit finish action earns one correct site stamp | Pass | U, S1, S2 |
| Transcript readers and visitors who mute or skip games can complete the visit | Pass | S1 (journey B) |
| Refreshing or repeating completion never issues duplicate stamps | Pass | U, S1 |
| "Place later" keeps the earned stamp in the tray | Pass | S1, S2; C: the in-book tray and the passport-page tray both derive from `placements` |
| Passport cover and interior pages render inside the actual viewport | Pass | S2 at 320, 375 and wide (flat book); S3 at 390 and 1280 (3D spread and zoomed page, which fits above the phone action bar) |
| Previous/next and swipe turn to real pages with stable IDs | Pass | S2; S3 (3D: page-edge taps, arrows, ← →; turning back from the first spread closes the book); U (`tests/curl.test.ts`: every page sits on exactly one leaf face); C: `PASSPORT_PAGES` IDs are `cover`, `identity`, `p1`–`p6`. **3D swipe on a real phone: Not tested** |
| Earned stamps can be placed freely on any stampable page, with no fixed slots | Pass | S2; S3 (dragged from the tray onto a 3D page, dragged on the page, carried to the next page by an edge tap) |
| Tap and drag, rotation, confirm, cancel, undo and later repositioning work | Pass | U (`tests/placement.test.ts`: undo of a first placement, undo of a reposition restoring page, spot, size, rotation and layer, delete then undo); S2 |
| The whole rotated stamp stays inside the paper bounds | Pass | U (clamp at 45° in a corner); S2 |
| Placement gestures don't accidentally turn pages or scroll the surface | Pass (emulated) | S2 with touch emulation. **Real phone: Not tested** |
| The dimensional stamp animation ends at the chosen position and leaves the correct impression | Pass | S2 (flat); S3 (the 3D rubber stamp lands on the spot and the impression appears on contact) |
| Reduced-motion mode is usable | Pass | S2 (instant zoom, no tool, the impression appears); S3 (3D: instant open, turns and zoom, no tool) |
| Repeated confirmation doesn't create duplicates | Pass | U (repeated saves leave one placement); C (single-flight guard); S2 |
| Placements survive page turns, reloads, resizing and phone/desktop layout changes | Pass | S2; C (normalised coordinates on a fixed page ratio) |
| Keyboard and non-drag placement controls provide an accessible alternative | Pass | S2 (keyboard only). **Screen reader: Not tested** |
| Earned and placed counts are correct | Pass | S2; C: Home, the site banner and the passport header all read the same `useProgress()` state |
| The next-site action opens the correct location | Pass | S1, S2 (`nextSiteId` from completion; the passport links to the first unvisited site) |

## Overall quality

| Item | Status | Evidence |
| --- | --- | --- |
| Core flow works at 375–430 px and on desktop, with a usable 320 px fallback | Pass (emulated) | S1, S2 in device emulation. **Real phones: Not tested** |
| No fake phone frame or off-screen passport illustration | Pass | S1, S2 |
| Controls have usable touch targets, focus, labels and contrast | Partial | 44 px targets, visible focus rings, ARIA labels and measured token contrast (S1, C). **No screen-reader pass** |
| Modal focus, Back and close behave sensibly | Pass | S1 (sheets and overlays); S2 (passport book: Back returns to the cover) |
| Loading, empty, permission, submission and save failures recover gracefully | Partial | Image errors, empty passport and wall, denied location/camera (S1); offline memory submission keeps the draft (S2); offline photo fallbacks added in Stage 4 (C, not re-tested). **A placement save failure (storage quota) can't easily be forced: Not tested** |
| Build checks pass | Pass | Stage 4: `npm run typecheck` clean, `npm test` 50/50, `npm run build` succeeds |
| No material console or runtime errors | Partial | No errors reported in S1/S2. **Not re-checked after the Stage 4 fixes** |
| Secrets and private data are protected | Pass | Stage 4 audit: `.env` is gitignored; no token or secret value in `dist/`, the source, docs or git history; the server log printed no token; only variable *names* appear (a "not configured" hint on /admin). The admin token lives only in sessionStorage. Coordinates are never stored (C) |
| Historical, sample and integration labels are honest | Pass | Draft translations, device voice, illustrative soundscapes, demo arrival, camera preview, the identified game photo, and "Sample" memories |
| Privacy, Terms and source methodology are accessible | Pass | /about, /privacy, /terms (A: 200); memory moderation wording updated in Stage 3 |

## Journeys

| Journey | Status | Evidence |
| --- | --- | --- |
| **A. Arrival to stamp placement** (demo arrival → Past View → era → narration and transcript → hotspot → game or skip → note pending and not public → finish → passport page → place and rotate → refresh → next site) | Pass with the labelled demo arrival | S1 steps 1–5, 7, 10; S2 steps 6, 8, 9; A for step 6. **With real GPS arrival: Not tested** |
| **B. Permission-free and accessibility path** (deny location and camera → manual site → Past View → transcript with sound off → skip game and memory → finish → Place later → tray → accessible controls with reduced motion) | Pass (emulated) | S1 through "Place later"; S2 for tray placement with keyboard and button controls and reduced motion. **Screen reader and real phone: Not tested** |
| **C. Persistence and recovery** (reopen a completed site without a duplicate, reposition, change viewport, failed save or submission, no duplicates, no public pending memories) | Partial | No duplicate award (U, S1); reposition and viewport change (S2); failed memory submission keeps the draft (S2); pending never public (U, A). **Placement save failure: Not tested** |
