# Acceptance checklist — status at the Stage 1 handoff

Statuses: **Pass** (tested, evidence given) · **Partial** · **Not tested** · **Stage 2** (owned by the teammate's stage; groundwork noted). "Browser" means the Claude desktop app's built-in Chromium pane at 375 × 812 unless stated; "unit" means `npm test`.

## Entry, GPS and navigation

| Item | Status | Evidence / notes |
| --- | --- | --- |
| Home immediately offers a working exploration action | Pass | "Start exploring" → /map; "Find places near me" (browser) |
| Primary navigation is Home, Map, Passport; no Scan or Games destination | Pass | `AppShell.tsx`; browser |
| No QR scanner, QR asset, QR route or QR copy | Pass | `grep -i "qr\|scan"` over src/server/public: no matches |
| Location requested only through an explicit action | Pass | `start()` only from buttons; auto-resume after reload only if permission is already granted (no prompt) |
| A qualifying foreground location produces the correct arrival sheet | Partial | Logic unit-tested (debounce, radius, accuracy). **Not tested with a real phone at the sites.** |
| Dismissal, cooldown, approximate position and multiple nearby sites handled | Pass | All four unit-tested in `tests/arrival.test.ts`; the "Are you at…?" and multiple-choice sheets checked in the browser via the labelled demo readings |
| Denied/unavailable location has a working manual path and "I'm here" | Pass | Browser denied permission → "Location blocked" message; List → "I'm here" opens the site |
| Demo arrival is labelled and uses the same downstream flow | Pass | "Demo" tag on sheet and on the site ("Demo arrival (simulated)"); same `ArrivalSheet` |
| Distance / nearby claims use real data or are omitted | Pass | Distances only from a real fix with accuracy ≤ 1 km; hidden for simulated arrivals |
| Direct site links work; invalid slugs recover | Pass | `/site/sultan-mosque` direct load; `/site/raffles-hotel` → "We couldn't find that place" + Back to map |

## Visual experience, audio and exploration

| Item | Status | Evidence / notes |
| --- | --- | --- |
| Past View opens in the app and works without camera permission | Pass | Browser, all three sites |
| Today and available eras update media and context | Pass | Timeline switches image, caption, credit and hotspots |
| No unsupported timeline years | Pass | Eras exist only where a dated photograph exists (2–3 per site + Today) |
| Archival photos vs generated interpretations distinguishable | Pass | Type tag on every image; no generated "historical" images are used |
| Hotspots stay aligned across viewport changes | Pass | Exact-ratio frames with normalised coordinates; checked at 320, 375 and the calibration view |
| Source, date and credit available | Pass | ⓘ panel: type, date basis, archive title, photographer, holder, licence, file page |
| Narration and ambient need a gesture and have independent controls | Pass | Nothing plays on load or arrival; separate narration and soundscape controls; "Stop all sound" |
| Play / pause / resume / replay and transcript | Pass | Play and pause tested in browser (device voice); replay/skip wired to the same player; transcript sheet tested |
| Language changes select the right content and handle missing versions | Pass | 中文 shows the draft label and, with no Chinese voice on the test PC, offers the transcript; Tamil shown as not available |
| Closing or switching sites cleans up audio and camera | Partial | Narration and soundscape stop on leaving a site (code + browser). Camera track stop is coded but **not tested with a real camera** |
| Live mode is real and tested, or clearly labelled | Pass | Labelled "Camera overlay preview … not tracked AR"; denied-camera fallback to Past View tested |
| ElevenLabs narration | Not tested | Script written and dry-run tested; no API key available |

## Optional activities and memories

| Item | Status | Evidence / notes |
| --- | --- | --- |
| Game opens from the site as an overlay and returns to it | Pass | `?play=1` sheet; "Back to <site>"; also opens over Past View |
| Questions, scoring, feedback and replay | Pass | Full run: 275/300, "So close" for 1930 vs 14 Apr 1928; unit-tested scoring |
| Skipping or closing the game still allows a stamp | Pass | Journey B |
| Note and drawing creation on touch layouts | Stage 2 | Server validation for notes and PNG drawings is ready |
| Drawing undo/clear and empty validation | Stage 2 | Server rejects blank notes and non-PNG/oversized drawings |
| New submissions are pending and stay off the public wall | Pass (API) | `tests/server.test.mjs`; UI is Stage 2 |
| Authorised approval publishes only at the correct site | Pass (API) | Same test checks the other site's wall |
| Public APIs protect non-approved content and moderator actions | Pass (API) | Drawings 404 until approved; admin endpoints 401 without token |
| Unsafe or oversized input rejected; notes rendered safely | Partial | Server validation tested; safe rendering is Stage 2 (render as text) |
| Memory submission or skipping does not block completion | Pass | "Continue without sharing" → finish (Journey B) |

## Passport and stamping

| Item | Status | Evidence / notes |
| --- | --- | --- |
| Finishing earns one correct site stamp | Pass | Browser + unit |
| Transcript readers and visitors who mute or skip can complete | Pass | Journey B |
| Refresh / repeat completion never duplicates | Pass | Browser ("Already in your passport", count stays 1) + unit |
| "Place later" keeps the stamp in the tray | Pass | Toast + tray shows "Waiting to be placed" after reload |
| Passport renders inside the viewport | Partial | 3D cover and identity page render and open/close in the browser; interior stamp pages are Stage 2 |
| Page flipping, free placement, rotation, undo, reposition, bounds, stamping animation, reduced-motion placement, non-drag controls, persistence of placements | Stage 2 | Storage contract implemented and unit-tested: `saveStampPlacement` (validation, move-not-duplicate, bounds clamp at any rotation), `removeStampPlacement` |
| Earned vs placed counts correct | Pass | "Stamps earned" / "Waiting to be placed" on the passport page |
| Next-site action opens the correct location | Pass | "Next on the trail" → next site |

## Overall quality

| Item | Status | Evidence / notes |
| --- | --- | --- |
| Works at 375–430 px, desktop, and a 320 px fallback | Pass | 375 and 320 checked visually with no horizontal scroll; tablet/desktop checked by layout measurement |
| No fake phone frame | Pass | |
| Touch targets, focus, labels, contrast | Partial | 44 px controls, visible focus rings, ARIA labels, contrast measured for every token pair; **no screen-reader pass yet** |
| Modal focus, Back and close | Pass | Sheets trap focus and restore it; Escape closes; browser Back closes Past View/game |
| Loading, empty, permission, submission and save failures | Partial | Image loading/error states, empty passport, denied location/camera tested; offline submission and storage-quota failures not exercised |
| Build passes; no material console errors | Pass | `npm run build`; production smoke test with no console errors |
| Secrets and private data protected | Pass | No keys in frontend; ElevenLabs key only in the CLI script; moderator token server-side; coordinates never stored |
| Honest historical / sample / integration labels | Pass | Draft translations, device voice, illustrative soundscapes, demo arrival, preview camera, game photo identification |
| Privacy, Terms and methodology accessible | Pass | /about, /privacy, /terms via the menu and footer |

## Journeys

- **A. Arrival → stamp**: steps 1–5, 7, 9 (earned state), 10 Pass with the labelled demo arrival; step 6 (memory) and step 8 (placement) are Stage 2.
- **B. Permission-free**: Pass through "Place later" (production build); placing with accessible controls is Stage 2.
- **C. Persistence**: no-duplicate award and reload Pass; repositioning and failed-save recovery are Stage 2 / not tested.
