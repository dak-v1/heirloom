# Final Build Prompt — Singapore, Reimagined

## Common Ground Makeathon: Design × Tech × Culture

> Build a polished, working, mobile-first heritage web app for Singapore. Follow the latest workflow and the attached visual references. This document is the complete, authoritative specification: GPS arrival prompts replace QR scanning; games appear within a site's experience; the Heritage Passport is an interactive book with page flipping and freely positioned stamps.

---

## 1. Role, mission, and execution rules

You are the lead product designer, UX architect, full-stack engineer, and QA owner for **Singapore, Reimagined**.

Create a no-install browser experience that brings Singapore's heritage to life through historical imagery, ambient sound, multilingual narration, interactive hotspots, optional learning games, shared memories, and a personal Heritage Passport.

Implement the complete visitor journey. Deliver functioning interactions, connected state, appropriate persistence, and loading/error/empty states. The result must be usable inside a phone browser, rather than a collection of static phone mockups or a decorative landing page.

### Execution rules

1. Inspect the existing project, framework, available services, and all supplied attachments before changing the app.
2. Preserve working features and existing conventions where compatible with this specification. Resolve conflicts in favour of the latest requirements here.
3. Review the references for visual direction. References may contain outdated QR buttons, a Game Hub, or a stamp grid: those elements must not override this document.
4. Complete the core journey before adding enhancements. Every visible control must work or clearly explain its unavailable state.
5. Make sensible implementation decisions without blocking progress on minor choices. Document material assumptions.
6. Do not claim GPS detection, live AR, shared memories, integrations, or cross-device persistence work unless implemented and tested.
7. Never invent historical facts, dates, quotes, sources, image rights, or successful test results. Label sample content and generated interpretations.
8. Protect secrets and enforce access controls on the server. Never expose API keys in frontend code.
9. Keep games, memory contributions, sound, camera access, location permission, and account creation optional. Visitors must still be able to finish a visit and earn its stamp.
10. Run appropriate build checks and end-to-end smoke tests, fix failures, and report remaining limitations honestly.

### Priorities

- **P0 — Core demo:** Reliable foreground location arrival prompts and manual fallback; historical popup view; available-era timeline; narration/transcript and ambient audio; hotspots; one complete optional game; notes and drawings; moderated memory wall; stamp earning; interactive passport; next-site flow.
- **P1 — Enhancement:** Configured ElevenLabs narration generation, additional reviewed translations, account sync, richer moderation tools, and additional complete games.
- **P2 — Stretch:** Genuine live camera transformation with tested alignment/tracking. A labelled visual preview is an acceptable fallback.

---

## 2. Product vision and final visitor workflow

### Positioning

**“See the past. Hear the stories. Leave your mark.”**

Design for Singapore residents, students, families, tourists, older community members, and educators. Make the experience warm, accessible, participatory, and culturally respectful.

### The eight-step workflow

#### 1. Arrive

The visitor opens the web app and chooses **“Find places near me”**. After permission is granted, the app uses browser geolocation while open to identify a nearby curated heritage site.

A compact arrival popup or bottom sheet says, for example:

> **You're near [site name]**  
> Discover the stories this place holds.  
> **Explore this place** · **Not now**

Do not launch an intrusive full-screen experience simply because a coordinate changes. Let the visitor confirm the suggestion. GPS is an aid to discovery, not a mandatory proof of attendance.

If location is denied, inaccurate, unsupported, or unavailable, the visitor can select a site from the map/list and tap **“I'm here”**. Provide an explicitly labelled demo arrival simulation for judging without pretending it is live GPS.

**No QR code is involved. Do not create QR assets, a QR scanner, a Scan tab, a scan page, or QR-dependent progression.**

#### 2. Choose how to see it

Open a site-specific mode chooser:

- **Past View — P0:** Show an olden-days image in an immersive popup/overlay over or beside the present view. A live camera background is optional; a present-day photograph must work without camera permission.
- **Live Time Window — P2:** Let the visitor hold up the phone and see the past through the camera, only when a genuine supported implementation is available. Otherwise provide a clearly labelled preview.

Include a timeline with the available years or eras. Selecting an era updates the historical image, caption, hotspots, and corresponding story where content exists. Do not generate supposedly accurate intermediate years from a continuous slider without supporting content.

#### 3. Listen

Provide a clear **“Listen to the story”** action. After the visitor starts audio, play the prepared historical narration and a gentle illustrative soundscape, such as kopitiam clatter or trishaw bells where relevant to the site.

Use ElevenLabs-generated audio when configured; otherwise use prepared audio or a clearly identified fallback. Provide the text transcript, available language choices, independent narration/ambient controls, and a visible mute/stop action.

Audio must follow browser playback restrictions and require a user gesture. GPS arrival alone must not trigger sound.

#### 4. Explore

Tappable hotspots on the historical image reveal facts, details, old photographs, and source information. Keep the image as the central experience and reveal supporting content progressively through small panels or bottom sheets.

#### 5. Play — optional

Offer a short, relevant activity within the current site's experience. Launch it in a modal/bottom sheet, with a full-height sheet on small phones if needed.

- Target duration: 1–2 minutes.
- Provide **“Play”** and **“Skip for now”**.
- Return to the same site and preserve its state on close/completion.
- Games do not determine whether the visitor earns the standard site stamp.

**Do not build a global Game Hub, a Games navigation tab, or a separate browsing destination for games.**

#### 6. Leave a memory — optional

The visitor can add a note or drawing pinned to the current location. Show approved contributions from previous visitors in a scrapbook-style wall. New submissions enter moderation before becoming public.

Provide **“Leave a memory”** and **“Continue without sharing”**. A pending submission must not block visit completion.

#### 7. Collect and place a stamp

After the story experience, the visitor finishes the visit and earns its stamp. Show a short reward animation and **“Stamp my passport”**.

Open the actual passport interface. The visitor selects an available page, chooses where the stamp goes, and confirms the placement. Animate a dimensional stamp pressing onto the paper and leaving the final impression.

Earning and placing are separate states. A visitor who closes the reward can place the earned stamp later. Never auto-place every stamp in a fixed collection grid.

#### 8. Move on

Recommend the next curated site. Show distance only when real coordinates and usable current location support it. The visitor can continue exploring, open directions, return to the map, or stay in the passport.

### Navigation

Use a compact primary navigation with **Home**, **Map**, and **Passport**. Put About, language/preferences, privacy, and community rules in a small secondary menu. Site activities live within the visit experience.

---

## 3. Visual direction from the attached references

Review all six image references and any later attachments before making major visual decisions. Carry their nostalgic travel-journal aesthetic into the working interface.

### Reference interpretation

- **Ticket/postcard reference:** Ink illustrations of places, perforated edges, compact printed labels, and archival ephemera. Use this to inform site stamp composition.
- **Open passport reference:** Cream paper, a visible centre gutter, subtle page curvature, layered travel marks, and ink impressions. Use this to inform the interactive book.
- **Illustrated postage-stamp reference:** Hand-drawn landmark motifs, scalloped borders, imperfect ink, and limited colours. Adapt the visual grammar to Singapore landmarks rather than copying foreign motifs.
- **Singapore app boards:** Warm aged paper, black/sepia architectural illustrations, terracotta CTAs, muted green/blue/mustard accents, botanical details, serif titles, and scrapbook memories.

Treat the app boards as style references. Replace their obsolete scan controls, standalone audio/game screens, and passport collection grid with the final workflow here.

### Starter design tokens

Use these as adjustable starting values, then refine them against the references:

| Token | Suggested value | Use |
| --- | --- | --- |
| Paper | `#F3ECDD` | Main background |
| Light paper | `#FAF6EB` | Cards and passport pages |
| Ink | `#2D2A23` | Main text and illustrations |
| Muted ink | `#655F52` | Secondary text; verify contrast |
| Terracotta | `#A94E36` | Primary CTAs and active state |
| Olive | `#687758` | Supporting accents and stamp art |
| Dusty blue | `#6884A3` | Supporting accents and stamp art |
| Mustard | `#BC9545` | Highlights and stamp art |
| Paper border | `#D6CBB6` | Dividers, frames, page edges |

Use dark ink for small text on pastel backgrounds. Verify actual contrast rather than assuming a palette is accessible.

### Typography, imagery, and layout

- Use a legible editorial serif for titles and a readable body face. Handwritten lettering belongs in small decorative captions, not navigation, transcripts, or important instructions.
- Combine historical photography with locally relevant line illustrations, stamp borders, subtle paper texture, postal marks, and restrained botanical accents.
- Keep texture behind content light enough for outdoor readability.
- Prefer compact app screens, meaningful whitespace, and one primary action per state.
- Avoid neon, glass effects, dense dashboard cards, oversized marketing sections, and decoration that covers controls.
- Use approximately 44 px or larger touch targets, readable body text, visible focus, semantic controls, and screen-reader labels.

### Actual app presentation

The page background, buttons, image viewers, and passport must render inside the real browser viewport. Do not build a permanent phone frame, fake status bar, or large book illustration outside the app as the main UI.

Design and verify around 375–430 px phone widths, including a narrow 320 px fallback. Support larger screens responsively and respect safe-area insets. Hide or minimise navigation during immersive views when appropriate, while keeping an obvious exit.

### Reusable components

Build shared buttons, site cards, arrival sheet, mode chooser, era selector, historical image viewer, hotspot/detail sheet, audio mini-player, transcript sheet, game overlay, memory composer/wall, stamp reward, passport book/page, stamp tray, placement controls, toasts, skeletons, and recovery states.

Respect reduced motion for overlays, page flips, stamp impacts, and celebratory effects.

---

## 4. App structure and connected states

### Main routes

| Route | Purpose |
| --- | --- |
| `/` | Compact home and exploration entry |
| `/map` | Curated map and accessible site list |
| `/site/:slug` | Complete site experience, including overlays |
| `/passport` | Interactive passport book and earned stamp tray |
| `/about` | Project purpose, sources, and image methodology |
| `/privacy` | Permissions, data handling, and public contributions |
| `/terms` | Community contribution rules and demo terms |
| `/admin` | Optional protected content/moderation tools |

Preserve direct site links so a visitor can bookmark or share a location. Optional nested routes/query states may support browser Back and reopening overlays, but they must not create new top-level Scan or Game Hub destinations.

### Home

- Compact title, brief explanation, and **“Start exploring”** CTA.
- **“Find places near me”** action with permission explanation.
- Curated trail/site cards and a **“Continue your visit”** card when applicable.
- Small passport preview showing earned progress and **“Open passport”**.
- Lightweight explanation of historical interpretation and shared memories.

Do not make users scroll through a long promotional landing page before using the app.

### Map and arrival

- Map markers, selected-site bottom sheet, accessible list alternative.
- **“I'm here”**, **“Explore this place”**, and directions where supported.
- Location state: off, requesting, active, approximate, denied, or unavailable.
- Honest distances and labels; never use invented live position or walk times.
- Manual site selection works without location or map-provider credentials.

### Site experience

Use a clear flow through image/story, hotspots, optional play, optional memory, completion, reward, and next site. Avoid forcing every activity into a single long page of cards.

Suggested state model:

`site ready → mode choice → past/live view → listen/explore → optional activity → finish visit → stamp earned → place now/later → next site`

Maintain separate state for open overlay, era, language, audio position, game attempt, memory draft, visit completion, stamp earning, and placement. Closing a panel should not erase unrelated progress.

When switching sites, pause the previous site's audio. When a modal closes, restore focus and scroll sensibly. Handle invalid slugs with a friendly return-to-map action.

---

## 5. Foreground geolocation and arrival behaviour

Use the browser Geolocation API over HTTPS. Device location may combine GPS, Wi-Fi, and other signals; avoid promising exact GPS precision.

### Permission and detection

1. Request permission only after a visitor taps a location-related action.
2. While the app is open and visible, track position using a suitable foreground watcher or refresh strategy.
3. Calculate distance to published site coordinates.
4. Use a configurable arrival radius per site, initially around 75–150 metres and tuned for demo conditions.
5. Check reported accuracy. Poor accuracy should produce a suggested nearby place and manual confirmation, rather than asserting precise arrival.
6. Debounce arrival suggestions and use hysteresis/cooldown so noisy coordinates do not repeatedly trigger popups.
7. Respect dismissal for the current visit/session; allow an explicit **“Check nearby again”** action.
8. If multiple sites match, offer a short chooser rather than guessing.
9. Pause/clean up tracking when the feature is disabled or the experience is closed. Recheck location when the visitor returns to the app.

Do not promise background geofencing, notifications when the browser is closed, or continuous tracking on a locked phone. Those are outside the core browser MVP.

### Recovery and privacy

- Denied permission: show a manual map/list selection path.
- Timeout/unavailable location: provide retry and manual selection.
- Inaccurate location: ask the visitor to confirm the place through **“I'm here”**.
- No nearby curated site: show the available list without repeated alerts.
- No network: retain already loaded content where supported and explain unavailable actions.
- Do not retain raw coordinates or movement history by default. Record site progress rather than detailed location trails.

### Demo arrival

Include a clearly labelled **“Demo: simulate arrival”** control or development mode for the curated sites. It should trigger the same arrival sheet and downstream flow. Keep simulated coordinates distinct from real location in implementation and reporting.

---

## 6. Past views, timeline, sound, and hotspots

### Past View — P0

- Present a historical image as a labelled popup/overlay against the present-day view, or a usable then-and-now comparison.
- Provide a close/back action and a way to return to **“Today”**.
- Work without camera access using a present-day photograph.
- Use site-specific era choices based on real seeded content. With one historical era, show that era and Today rather than dummy timeline options.
- Display image type, era/date, credit, and limitations through a readable caption and source panel.
- Distinguish archival photographs, illustrations, licensed reconstructions, and AI interpretations.

### Live Time Window — P2

- Request camera only when the visitor selects this mode.
- Only claim real-time AR when alignment/tracking and device behaviour have been implemented and tested.
- If only a camera feed with a historical overlay or crossfade is supported, label it **“Camera overlay preview”**; do not imply accurate reconstruction or tracked AR.
- If camera access fails, return to Past View without losing the visit.
- Stop camera tracks when the view closes.

### Timeline synchronisation

Changing era updates the image, its hotspots, date/source label, and linked story content when available. Pause an incompatible narration before switching it. If the same general story spans eras, retain it and explain its scope; do not pretend every year has different narration.

Keep hotspot coordinates normalised to the displayed image and account for scaling, cropping, and `object-fit`. A hotspot must stay attached to the intended feature at every viewport size.

### Audio and multilingual narration

- Narrate prepared, sourced scripts rather than generating historical claims freely at runtime.
- Use ElevenLabs as the storyteller when configured through server-side requests.
- Prefer pre-generated, cached audio for the demo. Cache by story version, language, voice, and relevant settings.
- Provide play, pause, resume, replay, progress, and independent ambient controls. Use practical mobile volume/mute controls where browser volume APIs are limited.
- Reduce ambient volume under narration so the story remains intelligible.
- Keep narration and transcript available in the languages actually prepared and reviewed.
- Support English and, where feasible, at least one reviewed Chinese, Malay, or Tamil version. Show unsupported content honestly and provide a clear English fallback.
- Separate UI language from story language where necessary. Keep translations in structured data.
- Always make transcript access easy. Reading the story is a complete alternative to listening.
- Identify synthetic narration and illustrative soundscapes; do not pass them off as historical recordings.
- If translating or transcribing with AI, review the output before presenting it as curated content. ElevenLabs TTS alone should not be described as providing every translation/transcription function.

### Hotspot details

Each hotspot opens a concise fact, optional related photograph, contextual detail, and available source credit. Use genuine site content. Provide accessible labels and a text/list alternative to tapping image markers.

---

## 7. Optional site-specific games

Implement at least one complete game for the demo, preferably **Guess the Year**. Seed one usable activity for each demo site; the same complete game component may support all three sites.

### Core game: Guess the Year

- Show a site-specific sourced historical photo with known date or bounded era.
- Let visitors select a year/decade with a slider plus accessible increment controls.
- On submit, reveal the answer and explain visible clues such as signage, clothing, or vehicles only when supported by the image/context.
- Define scoring consistently. If only an approximate date is known, accept the documented interval rather than inventing an exact year.
- Show a short result and **“Back to this place”** / **“Play again”**.
- Remove answer-revealing captions during the question while preserving credits/source access in the reveal.

### Additional activities — implement only when complete

- **Heritage Detective:** A site-specific mystery, 3–4 clues from hotspots, and a reasoned final guess. Reward curiosity rather than speed.
- **Rebuild the Lost Place:** Correct answers reveal parts of a verified demolished landmark, ending with an explicitly labelled reconstruction. Use it only for a place genuinely lost or demolished; do not portray an existing landmark as demolished.
- **Live a Day in 1965:** A short, sourced role-play with culturally grounded choices. Label invented dialogue and scenario elements as interpretation.
- **Time Capsule Hunt:** Discover or contribute moderated site memories. Keep unsafe/unreviewed content out of rewards.

Heritage Passport is the progression system, not a separate game that visitors must finish. Bonus stories/badges may reward play, but standard site stamps remain available when games are skipped.

Do not display unfinished activities as working buttons. No global game hub or leaderboard is required for the core experience.

---

## 8. Shared memories: notes and drawings

Use a location-linked scrapbook wall with warm paper cards, tape-like details, readable notes, and drawings. Contributions must remain tied to the correct site.

### Composer — P0

- Offer **“Write a note”** and **“Draw a memory”**.
- Optional display name; no email or account requirement for the demo.
- Note input with a clear character limit, initially 500 characters.
- Drawing canvas supporting touch/pointer input, a small colour palette, pen, undo, and clear.
- Preserve a draft when switching composer tabs or briefly closing a panel; confirm before discarding significant work.
- Validate empty notes and blank drawings. Limit drawing dimensions and upload size.
- Explain that contributions will be public after review and provide a clear submission state.
- Let visitors skip without affecting their stamp.

### Moderation and public display

- Submit new contributions as `pending` by default.
- Only `approved` memories are returned by the public wall's server query/access rules.
- Pending, rejected, and hidden records must not leak through public APIs.
- Provide an authorised approval/rejection path: a small protected moderation view or a documented secure backend workflow.
- Render notes as safe text, not raw HTML. Validate uploaded assets and block unsafe executable formats.
- Add basic submission limits and a report action where feasible. Profanity filtering alone is not sufficient for automatic public publication.
- Do not expose private profile details or internal moderation reasons.
- Clearly label seeded sample memories as demo contributions.

If a backend is unavailable, implement a clearly labelled local demonstration of submission and moderation. Do not describe local-only notes as visible to other visitors. Shared public memories require real server-side storage and moderation enforcement.

---

## 9. Heritage Passport — interactive book, free placement, dimensional stamping

This is a central feature. Build it as a usable book within the app viewport, with interactive pages and persistent stamp impressions.

### Book presentation and page flipping

- Provide a passport cover, a short identity/intro page, and several stampable interior pages with stable IDs.
- Use warm textured paper, subtle edge shadows, fine borders, page numbers, and a central gutter when showing a spread.
- On phones, show one readable page at a time if a two-page spread would make placement too cramped. Wider screens may show a spread.
- Offer previous/next buttons and swipe gestures with a convincing page-turn animation. Provide a reduced-motion transition.
- Clearly show the current page and boundaries, for example **“Page 2 of 8”**.
- Preserve the same logical page layout across phone single-page and desktop spread views.
- Disable swipe-to-flip while the visitor is dragging a stamp so the gestures do not conflict.
- Page flipping must update actual page content; it cannot be a visual animation over an unchanged stamp grid.

### Earning versus placement

Award a site's unique stamp when the visitor completes its story experience:

- Narration completion may expose the finish action, but allow an explicit **“I've finished exploring”** action for transcript readers, muted users, and playback failures.
- Do not enforce a timer, quiz score, memory submission, precise GPS check, or sign-in requirement.
- Completing a visit records progress and earns one stamp entitlement for that site.
- Show the earned stamp reward, then **“Stamp my passport”** or **“Place later”**.
- Put earned-but-unplaced stamps in an accessible stamp tray.
- Reopening or refreshing a completed visit must not award another copy.

### Stamp artwork

Each stamp should contain a Singapore place illustration, the site/place name, a distinct muted ink colour, and a ticket/postage/ink-stamp composition inspired by the references. Show the user's visit date as visit metadata, distinct from a landmark's historical date.

Use transparent artwork or vector impressions where practical. Do not reuse the same generic icon for every site. Respect cultural context and avoid invented official endorsements or historical seals.

### Free-placement interaction — P0

1. The visitor opens the passport and flips to any stampable page.
2. They select an earned stamp from the tray.
3. Show a movable ghost preview on the page and clear **“Tap anywhere to place your stamp”** guidance.
4. Allow tap-to-position and drag-to-adjust within the page.
5. Provide simple rotation controls and a sensible default size. Optional scaling must stay within safe bounds.
6. Offer **“Stamp here”** and **“Cancel”**. Nothing is consumed until placement is committed.
7. On confirmation, animate the tool pressing into the selected spot and leave the ink impression exactly there.
8. Persist the page, position, rotation, and size. Offer **“Undo placement”** immediately; also provide an edit/reposition mode later.

No mandatory slots, grid snapping, or predetermined positions. Permit layering/overlap to create a personal scrapbook. Keep the full stamp inside the paper bounds and outside controls; warn softly about overlap rather than blocking it.

Provide an accessible alternative using position/rotation controls and a confirm action. Every essential placement action must be possible without precision dragging.

### Placement data and resizing

Use a fixed logical page coordinate system/aspect ratio and save normalised coordinates. Convert screen pointer coordinates into that page space. Store size relative to the page, rather than only saving device pixels.

Persist at least:

- `earned_stamp_id`
- `page_id`
- `x`, `y` — normalised centre coordinates
- `width_ratio` — size relative to the logical page width
- `rotation_degrees`
- `z_index`
- `placed_at`, `updated_at`

Clamp the rotated stamp footprint to page bounds. Existing placements must remain visually stable after resize, orientation changes, page flips, and reloads. Do not change the logical page ratio between devices.

### Dimensional stamping animation — P0

Create a lightweight 3D-style effect using CSS perspective/transforms or the existing motion stack:

1. A wooden/rubber stamp tool appears above the chosen position.
2. It tilts into alignment and presses toward the paper.
3. A brief shadow compression and ink reveal indicate contact.
4. The tool lifts away; the ink impression remains.

Keep the effect short, approximately 0.6–1.2 seconds, and aligned with the visitor's chosen position/rotation. An optional soft stamping sound must respect mute preferences. Avoid a heavy 3D dependency unless already justified by the project.

Reduced-motion mode should reveal the impression with minimal movement. Disable duplicate confirmation during placement, save exactly once, and provide a recoverable failure state. Animation must never determine whether a successful save is recorded.

### Persistence and progress

- Keep earned stamps, placements, and current page across browser reloads in guest mode where supported.
- Explain browser-local limitations and lack of cross-device sync unless real sync exists.
- Use idempotent earning and unique constraints for one site entitlement per visitor.
- A placement consumes that stamp's available entitlement once; editing moves the existing placement rather than creating a duplicate.
- Display **“Sites explored”**, **“Stamps earned”**, and **“Waiting to be placed”** as appropriate. Awarded progress is independent of whether the stamp has been placed.
- Provide empty passport guidance and a gentle next-site recommendation.
- Do not make users reset or discard their passport when returning to an already completed site.

---

## 10. Stack, data model, security, and integrations

Inspect and use the existing platform's supported framework, storage, backend, and authentication rather than replacing them unnecessarily.

### Architecture

- Responsive frontend with centralised design tokens and reusable components.
- Published site content may be seeded/static for the demo; shared memories require supported backend persistence.
- Store image and audio assets in supported storage or stable, permitted media URLs.
- Keep guest exploration as the default; optional accounts may sync progress if reliable.
- Deploy over HTTPS for geolocation and camera support.
- Use structured media metadata, translations, game payloads, and configurable arrival settings.
- Add only dependencies that improve a required feature.

### Suggested entities

| Entity | Essential fields |
| --- | --- |
| `Sites` | ID, unique slug, name, description, area/address, latitude/longitude, arrival radius, cover image, published status |
| `HistoricalEras` | ID, site ID, era/date range, image URL/type, caption, context, source/credit/rights, limitations, display order |
| `Stories` | ID, site/era association, language, title, script/transcript, audio URL, duration, sources, content version, published status |
| `AmbientTracks` | ID, site ID, asset URL, title, credit/licence, illustrative/historical label |
| `Hotspots` | ID, site/era ID, normalised coordinates, label, fact/detail, optional image, source |
| `Games` | ID, site/era ID, game type, instructions, question/media payload, sourced answer or accepted interval, scoring rules |
| `GameAttempts` | ID, visitor ID, game ID, score, completion, timestamp; keep unnecessary personal data out |
| `Memories` | ID, site ID, visitor/owner ID, optional public name, note/drawing data, moderation status, timestamps; restricted moderation reason |
| `StampDesigns` | ID, site ID, name, transparent artwork URL/SVG, ink colour, descriptive/accessibility label |
| `VisitorProgress` | ID, visitor ID, site ID, completion timestamp, story/game state where useful |
| `EarnedStamps` | ID, visitor ID, site/design ID, earned timestamp; unique visitor/site entitlement |
| `PassportPages` | Stable page ID/index, logical dimensions/aspect ratio, decorative page template |
| `StampPlacements` | ID, earned stamp ID, page ID, normalised centre, relative size, rotation, layering order, timestamps; unique earned stamp placement |

Use a stable opaque guest identifier and the platform's anonymous identity facilities where available. A client-supplied guest ID alone must not grant server access to another visitor's private passport.

When syncing, earning and placement should be idempotent; enforce uniqueness in storage. Keep public stamp designs separate from visitors' private progress/placements.

### Permissions and validation

- Visitors can read published site content and approved memories.
- Visitors can submit memories through a validated endpoint, but cannot directly approve them.
- Only authorised moderators/admins can publish content, approve/reject memories, or access moderation queues.
- Visitors can access/edit only their own progress and passport.
- Validate site/era IDs, note lengths, drawing uploads, placement coordinates, and transformations.
- Safely render public text and drawing assets. Never accept executable HTML or untrusted script content.
- Rate-limit submissions and costly API actions on the server. Do not rely on browser counters for abuse protection.

### Configuration and cost control

Potential server-side variables include `ELEVENLABS_API_KEY`, provider-specific database/storage configuration, and a maps key only if required. Never commit secrets.

Pre-generate/cache narration, reuse assets, and avoid one paid generation call per visit. Handle unavailable services with graceful fallback. Browser TTS, prepared audio, and transcripts should be described accurately; do not label fallback speech as ElevenLabs output.

No LLM is required for GPS detection, timeline selection, games, page flipping, or stamp placement. Keep factual content curated and reviewed.

### Accounts, privacy, and secondary pages

- No forced sign-in for the visit flow.
- Offer optional sync only when implemented. Avoid broken sign-in buttons.
- Include logout/deletion controls if full accounts are added.
- Explain camera/location use, browser-local progress, public memories, moderation, and relevant third-party audio services.
- Provide About, Privacy, and Terms without blocking the core flow.
- Use descriptive titles, useful sharing metadata, alt text, and stable site URLs. Do not imply official government/museum affiliation without evidence.
- Keep analytics minimal: site opened, audio started, hotspot opened, game completed/skipped, memory submitted, stamp earned/placed. Do not send memory content or precise location history to analytics.

---

## 11. Curated demo content and resilience

Use three curated Singapore heritage locations. Candidate areas include Chinatown, Kampong Glam, and Little India, but select precise sites based on credible sources, usable imagery, rights, and demo feasibility. A neighbourhood is not interchangeable with one landmark or street.

For each site, prepare:

- Real coordinates and a tunable arrival radius.
- Present-day image and at least one archival image or labelled interpretation.
- Additional eras only where content exists.
- Short sourced story and accessible transcript.
- Available reviewed language versions and prepared narration/fallback.
- Relevant ambient audio with credit and an illustrative label where applicable.
- At least three meaningful hotspots.
- One complete optional game using the shared implemented game type.
- Distinct stamp artwork.
- Clearly labelled sample memories if needed.
- A real next-site relationship or honest recommendation.

Maintain a content/source register with URLs, credits, rights notes, date precision, and interpretation labels. Prefer primary cultural/archive sources where accessible. Verify factual claims before seeding; if verification is unavailable, retain explicit draft/sample labels rather than inventing evidence.

### Resilience requirements

- Site/media loading skeletons and useful retry actions.
- Missing image/audio/language fallbacks.
- Manual discovery after location/camera denial.
- Graceful unsupported Live Time Window state.
- Empty memory wall and blank passport guidance.
- Submission/save failure that retains the draft or chosen placement.
- Browser refresh that preserves earned progress and passport placement.
- No repeated arrival alerts or overlapping audio players.
- Optional activities can be closed without trapping the visitor.
- Previously loaded local content may remain usable offline; do not pretend new public submissions are synced while offline.

---

## 12. Acceptance checklist and end-to-end tests

Report each item as **Pass**, **Fail**, or **Not tested**, with concise evidence where useful. Never mark an item Pass merely because code was written.

### Entry, GPS, and navigation

- [ ] Home immediately offers a working exploration action.
- [ ] Primary navigation contains Home, Map, and Passport, with no Scan or Games destination.
- [ ] There is no QR scanner, QR asset, QR route, or QR-dependent copy.
- [ ] Location permission is requested only through an explicit action.
- [ ] A qualifying foreground location produces the correct arrival sheet.
- [ ] Dismissal, cooldown, approximate position, and multiple nearby sites are handled.
- [ ] Denied/unavailable location has a working manual selection and “I'm here” path.
- [ ] Demo arrival is labelled and uses the same downstream flow.
- [ ] Distance/nearby claims are based on actual data or honestly omitted.
- [ ] Direct site links work and invalid slugs recover gracefully.

### Visual experience, audio, and exploration

- [ ] Past View opens within the app and works without camera permission.
- [ ] Today and available-era choices update media/context correctly.
- [ ] No unsupported timeline years pretend to have historical content.
- [ ] Archival photos and generated interpretations are distinguishable.
- [ ] Hotspots stay aligned across viewport changes and reveal correct content.
- [ ] Source/date/credit information is available.
- [ ] Narration and ambient sound require a playback gesture and have independent controls.
- [ ] Play/pause/resume/replay and transcript work.
- [ ] Available language changes select the correct content and handle missing versions.
- [ ] Closing/switching sites cleans up previous audio/camera resources.
- [ ] Live mode is real and tested, or clearly labelled as a preview/unavailable stretch feature.

### Optional activities and memories

- [ ] The game opens from the current site as an overlay and returns to it correctly.
- [ ] Questions, scoring, feedback, and replay work.
- [ ] Skipping or closing the game still allows a stamp.
- [ ] Note and drawing creation both work on touch-sized layouts.
- [ ] Drawing undo/clear and empty-content validation work.
- [ ] New memory submissions are pending and remain out of the public wall.
- [ ] An authorised approval publishes the memory only at the correct site.
- [ ] Public APIs protect non-approved content and moderator actions.
- [ ] Unsafe/oversized input is rejected; notes are safely rendered.
- [ ] Memory submission or skipping does not block visit completion.

### Passport and stamping

- [ ] Story completion or explicit finish action earns one correct site stamp.
- [ ] Transcript readers and visitors who mute/skip games can complete the visit.
- [ ] Refreshing/repeating completion does not issue duplicate stamp entitlements.
- [ ] “Place later” preserves the earned stamp in the tray.
- [ ] Passport cover/interior pages render inside the actual viewport.
- [ ] Previous/next and swipe flip to real pages with stable IDs.
- [ ] Earned stamps can be placed freely on any stampable page without fixed slots.
- [ ] Tap/drag, rotation, confirmation, cancel, undo, and later repositioning work.
- [ ] The whole rotated stamp remains inside the paper bounds.
- [ ] Placement gestures do not accidentally flip pages or scroll the drawing surface.
- [ ] Dimensional stamp animation ends at the chosen position and leaves the correct impression.
- [ ] Reduced-motion mode is usable.
- [ ] Repeated confirmation does not create duplicates.
- [ ] Placements survive page flips, reloads, resizing, and phone/desktop layout changes.
- [ ] Keyboard/non-drag placement controls provide an accessible alternative.
- [ ] Earned versus placed counts are correct.
- [ ] Next-site action opens the correct location.

### Overall quality

- [ ] Core flow works around 375–430 px and on desktop, with a usable narrow-screen fallback.
- [ ] No fake phone frame or off-screen passport illustration replaces the actual interface.
- [ ] Controls have usable touch targets, focus, labels, and contrast.
- [ ] Modal focus/Back/close behaviour is sensible.
- [ ] Loading, empty, permission, submission, and save failures recover gracefully.
- [ ] Build checks pass and no material console/runtime errors remain.
- [ ] Secrets and private data are protected.
- [ ] Historical/sample/integration labels are honest.
- [ ] Privacy, Terms, and source methodology are accessible.

### Test these complete journeys

**A. Arrival to stamp placement**

1. Open Home and choose “Find places near me”.
2. Trigger a real tested arrival or the explicitly labelled demo simulation.
3. Confirm the arrival sheet and select Past View.
4. Choose an available era; start narration and open the transcript.
5. Explore a hotspot and complete or skip the optional game.
6. Submit a note/drawing; verify it is pending and not public.
7. Finish the visit and earn the stamp.
8. Open the passport, flip to a chosen page, position/rotate the stamp, and confirm.
9. Refresh and verify the stamp's page, position, and earned/placed counts.
10. Open the next-site recommendation.

**B. Permission-free and accessibility path**

1. Deny location and camera permissions.
2. Select a site manually and use Past View with the present-day photo.
3. Read the transcript with sound off.
4. Skip game and memory, then finish the visit.
5. Earn the stamp, select “Place later”, and return through the stamp tray.
6. Place it using accessible position controls and reduced motion.

**C. Persistence and recovery**

Reopen a completed site, confirm no duplicate award, reposition an existing stamp, change viewport size, test a failed save/submission, and confirm progress/drafts recover without duplicate placements or public pending memories.

---

## 13. Implementation order and final handoff

### Build in this order

1. Audit the existing app and references; define tokens, data, navigation, and connected site states.
2. Implement curated map/list discovery, foreground arrival detection, manual “I'm here”, and labelled demo arrival.
3. Build Past View, available-era timeline, narration/transcript, ambient controls, and hotspots.
4. Add one complete site-specific game overlay with a working skip path.
5. Implement note/drawing submission, moderation states, and approved memory display.
6. Implement idempotent visit completion and stamp earning.
7. Build the interactive passport, page flipping, free placement, dimensional stamping, undo/reposition, and persistence.
8. Connect next-site recommendations, secondary pages, permission/error recovery, and responsive/accessibility refinements.
9. Test the full journeys and fix failures before adding P1/P2 enhancements.

### Definition of done

The core app is ready when visitors can arrive or manually select a site, view its past, listen or read, explore, optionally play/share, earn a stamp, freely place it in a persistent flip-through passport, and move to the next site. Three curated demo sites and one complete reusable game type should be available. Public memories must use an honest, enforced moderation flow.

The design must reflect the supplied nostalgic Singapore references and behave as a real phone web app. No QR entry, standalone Game Hub, static passport grid, or unlabelled simulated GPS/AR may remain.

### Final handoff report

Provide:

1. What was built and the implemented routes/overlays.
2. How GPS arrival works, what was tested on devices, and foreground limitations.
3. Which narration/map/backend integrations were configured and tested.
4. Which content or features are sample, static, browser-local, fallback, or stretch.
5. Passport earning/placement persistence behaviour and any sync limitations.
6. Acceptance checklist results: Pass / Fail / Not tested.
7. Known issues and remaining work ordered by severity.
8. Exact run/demo instructions, including manual/demo arrival.
9. Required configuration variables without exposing credential values.
10. Historical/media source and rights notes.

**Start by inspecting the project and attachments, then implement the P0 journey end-to-end. The visual polish and working interactions must support the same final workflow throughout the app.**
