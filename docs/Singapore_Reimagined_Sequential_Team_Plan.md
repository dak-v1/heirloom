# Singapore, Reimagined — Sequential Two-Person Build Plan

> Perynn builds first, then hands the working project to her teammate. Her teammate continues from that project. This is a sequential handoff, not parallel development.

Use this plan alongside the Final Build Prompt. The final requirements remain foreground GPS arrival, no QR scanning, site-specific game popups, shared notes/drawings, and a book-style passport with page flipping and free stamp placement.

## 1. Ownership

| Stage | Owner | Responsibility | Working result |
| --- | --- | --- | --- |
| 1 | Perynn | App foundation, shared data/storage, discovery, arrival, historical views, audio/transcript, hotspots, one game, visit completion and stamp earning | Visitors can experience a place, finish a visit and save an earned stamp |
| 2 | Teammate | Memory submission/moderation, interactive passport, placement and stamping animation, final journey integration and QA | Visitors can share memories, place stamps in their passport and continue exploring |

Both people implement UI and data handling for their features. Stage 1 establishes usable data and progress storage so Stage 2 can extend the app.

## 2. Stage 1 — Perynn builds first

### Foundation

- Set up the supported framework and run/build process.
- Define the vintage paper/ink design tokens and shared buttons, cards, sheets and navigation.
- Establish Home, Map, Site and Passport route boundaries. A temporary passport development placeholder must be replaced in Stage 2.
- Define stable site IDs/slugs and centralised objects for images, eras, stories, hotspots, game questions and stamp designs.
- Set up the supported backend/storage and guest identity, or clearly documented browser-local progress if necessary.
- Establish storage interfaces for progress, earned stamps and later passport placements. Prepare memory storage/access rules where supported; its UI and moderation flow belong to Stage 2.
- Keep storage details behind shared services so the teammate can extend the app without rewriting the screens.

### Discovery and arrival

- Build the curated map/site list and manual “I'm here” action.
- Add foreground geolocation, permission/recovery states and arrival popup.
- Add an explicitly labelled demo arrival simulation.
- Handle inaccurate position, repeated alerts, direct site links and invalid links.
- Do not implement QR scanning or promise detection when the phone is locked.

### Site experience and one game

- Build the mode chooser and Past View popup/overlay.
- Implement Today and the historical eras actually supported by content.
- Add source/date/image-type labels and tappable hotspots.
- Add narration, ambient controls, available language choices and transcript.
- Preserve story/era state when panels close and stop old audio when switching sites.
- Use honest prepared-audio/transcript fallbacks if ElevenLabs is unavailable.
- Implement one complete Guess the Year game overlay, including instructions, scoring, reveal, replay, close and skip.
- Reuse the game component with site-specific questions. Do not build a Game Hub.

### Completion and stamp earning

- Provide an explicit finish action for listeners and transcript readers.
- Record completion and earn the site's stamp once, independently of games/memories.
- Implement shared `earnStamp(siteId)` logic: a repeat call returns the existing entitlement instead of another copy.
- Keep earned and placed states separate. Placement is Stage 2.
- Show a basic reward and working “Place later” action. Mark any unimplemented placement entry as a development state rather than presenting it as working.
- Add a simple next-site suggestion from real site data; Stage 2 connects the final passport journey.

### Handoff checkpoint

Demonstrate:

**Home → select/arrive → historical view → listen/read → hotspot → play or skip → finish → saved earned stamp.**

Get one site fully connected first, then seed the remaining curated sites. Refresh and repeat completion to verify persistence and prevent duplicate earning.

## 3. Stage 2 — Teammate continues second

### Inspect the existing build

- Run the app and reproduce the handoff journey before editing.
- Reuse routes, design tokens, site IDs, guest identity and progress services.
- Fix blockers where necessary without rebuilding the functioning core.
- Replace temporary passport/memory development states with real features.

### Memories

- Build the site-linked scrapbook wall and note composer with validation/length limit.
- Add a touch drawing canvas with colours, undo, clear and blank-drawing validation.
- Preserve drafts during recoverable errors.
- Submit new memories as pending and show only approved memories publicly.
- Add a protected moderation path or a documented secure backend approval workflow.
- Insert an optional memory step before the existing finish action; reuse the existing earning function.
- Keep memory contribution optional and label sample contributions.

Shared memories need actual backend persistence and enforced moderation. If only local demo storage is possible, label it honestly; do not imply later visitors can see those submissions.

### Interactive passport

- Build the cover and real pages within the phone browser viewport.
- Implement previous/next page buttons, then page-turn animation and swipe where practical.
- Use stable page IDs and a fixed logical page aspect ratio, with readable single-page phone layouts.
- Load earned stamps into a tray.
- Add tap-to-position, dragging, rotation, confirmation and cancel, without mandatory slots.
- Persist page ID, normalised coordinates, relative size, rotation and layering order.
- Add immediate undo and later repositioning.
- Add the dimensional stamp-press animation and reduced-motion fallback.
- Prevent duplicate placement, keep rotated stamps within bounds and preserve positions after refresh/resize.
- Show correct earned/placed/unplaced counts.

### Final integration and verification

- Connect “Stamp my passport” to the earned entitlement and placement interface.
- Keep “Place later” working through the tray.
- Connect next-site recommendations from completion/passport.
- Complete About, Privacy, Terms and source notes.
- Test the complete flow at phone widths and on real devices where possible.
- Fix regressions and document tested integrations, fallbacks and remaining limitations.

## 4. Handoff package

| Item | Perynn should provide |
| --- | --- |
| Source checkpoint | Working project/repository and exact branch/commit or platform checkpoint |
| Run instructions | Install/run/build commands and configuration variable names; transfer secrets securely |
| Status | Working features, fallbacks, unfinished areas and known issues |
| Data | Stable site IDs, content models, guest identity and progress/storage interfaces |
| Assets | Images, scripts, questions, hotspot content, stamp designs, sources and credits |
| Connection points | How completion calls `earnStamp(siteId)` and how progress is loaded |
| Demo | Exact steps that reproduce the Stage 1 journey |
| Remaining scope | Memories, passport placement/animation and final QA |

Keep notes concrete enough that the teammate can run the app without guessing.

## 5. Shared interfaces

These are suggested application boundaries, not a mandatory framework or database choice:

| Interface | Behaviour |
| --- | --- |
| `getSite(siteIdOrSlug)` | Return the curated site and its content |
| `getVisitorProgress()` | Return completed sites and earned stamps |
| `earnStamp(siteId)` | Record completion and return one existing/new entitlement idempotently |
| `getPassportPlacements()` | Return saved placements; initially empty if none exist |
| `saveStampPlacement(earnedStampId, placement)` | Save/update one placement with validation and ownership checks |
| `submitMemory(siteId, draft)` | Submit a validated note/drawing as pending |
| `getApprovedMemories(siteId)` | Return only public approved contributions |

Stage 1 implements its needed interfaces and defines the remaining shapes. Stage 2 implements placement/memory operations against the chosen storage. Mark unfinished interfaces clearly; never treat a stub as a successful backend operation.

## 6. Completion checks

- [ ] Stage 1 discovery/story/game features still work.
- [ ] A visitor can finish without sound, a game, a memory or an account.
- [ ] Repeated completion/reload does not duplicate awards.
- [ ] Notes/drawings work; pending memories are not public.
- [ ] The passport flips between real pages.
- [ ] Stamps can be placed freely, rotated, undone and repositioned.
- [ ] Placements survive reload, page changes and resize.
- [ ] Animation respects reduced motion and does not duplicate saves.
- [ ] “Place later” and next-site actions work.
- [ ] Permissions and unavailable services recover gracefully.
- [ ] Build checks and the complete visitor smoke test pass; untested behaviour is documented.

## 7. Scheduling and scope

Agree on a fixed Stage 1 handoff time. Aim for roughly equal implementation time and reserve a final review window; do not spend the entire schedule polishing the first half.

Prioritise a working story journey, one complete game, notes/drawings, and a persistent freely stampable passport. Genuine live AR, extra games, account syncing and elaborate admin tools follow the core journey.

**Perynn builds the experience and earning foundation first. Her teammate adds memories and the interactive passport second, then verifies the finished app.**
