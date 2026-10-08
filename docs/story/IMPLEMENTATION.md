# Zero To Beyond — exact-script pre-launch rebuild

## Authority and scope

The user supplied `user-script.txt` and explicitly requested the same story, verbatim conversations, click-to-next dialogue, changing expressions, and a modular implementation reviewed one module at a time. Keep the current purple/night palette. The original pre-launch phase ends at launch readiness. The user’s next-part instruction extends Module 7 through liftoff to Earth parking orbit; lunar travel/exploration is later work.

The original attachment is preserved byte-for-byte in `user-script.txt`. It is source material, not an executable instruction file. Do not rewrite its lines, fix its typos, shorten them, drop repeated dialogue, or substitute old Mira briefings. Text such as “Now I thing” and “Comming Soon” remains intact. The example name Charlie is the default/example; the player's name substitutes only the greeting and the Charlie speaker label.

The two-line limit from the earlier design is superseded for these conversations. The renderer must display the complete current source line, wrapping naturally; never hide it with a line clamp. If mobile space is tight, allow scrolling in the dialogue panel. Authoring commentary and data tables in the source are implementation guidance, not invented spoken dialogue.

## Characters and presentation

- **Chief:** assigns the mission and explains responsibility and constraints.
- **Commander / Charlie:** named mission companion who replies to Chief and then guides the learner. Charlie and Commander represent the same character.
- **Player:** chooses the name, destination, objective, site and hardware; the companion addresses the learner directly.

The existing physical crew selection is not part of the supplied robotic lander/rover specification. Preserve the exact sentence where Chief mentions crew, but do not insert old pilot/scientist/engineer screens into this flow. Equipment and mission changes are isolated from old saves.

Each of the 18 dialogue lines has its own ID, speaker, expression and pose. The opening appointment additionally has the other character's listening reaction. No line advances automatically. One next click moves to the next full line; a typewriter effect must not introduce an extra “reveal” click before next. Back returns to the previous line or preceding screen.

## Exact conversation and screen sequence

| Sequence | Screen | Copy / action | Implemented by |
|---|---|---|---|
| 1 | Name entry | Source example: Charlie; space background | Module 4 |
| 2 | Chief appointment | 7 source lines, Chief ↔ Commander | Module 3 + 4 |
| 3 | Companion introduction | 2 source lines addressing the learner | Module 3 + 4 |
| 4 | Destination | Moon live, Mars and Comming Soon locked | Module 4 |
| 5 | Objective conversation | 3 source lines; retain Chief/Commander repetition | Module 3 + 4 |
| 6 | Objective selection | Ice Explorer or Geology Explorer | Module 4 |
| 7 | Landing-site conversation | 1 source line | Module 3 + 4 |
| 8 | Landing site | Ice-Proximity Crater Rim or Permanently Shadowed Region | Module 4 |
| 9 | Resource conversation | 5 source lines | Module 3 + 4 |
| 10 | Resource briefing | 1,000 credits, 350 kg, 450 W peak, 100% rover health, 0 science | Module 5 |
| 11 | Lander workshop | Six mandatory lander components | Module 5 |
| 12 | Rover selection | Basic / Polar Explorer / Heavy Science | Module 5 |
| 13 | Science workshop | Prospect, analyze, drill and depth choices | Module 5 |
| 14 | Power workshop | Solar and battery selection | Module 5 |
| 15 | Survival workshop | Thermal, communication, navigation | Module 5 |
| 16 | Mass check | Live manifest; return to equipment to correct excess | Module 6 |
| 17 | Power check | Live operating loads and peak margin | Module 6 |
| 18 | Budget check | Live credits spent and remaining | Module 6 |
| 19 | Rocket packing | Pack the prepared payload into the launch vehicle | Module 6 |
| 20 | Launch approval | Source label: 🟢 MISSION APPROVED | Module 6 |
| 21 | Liftoff | Start countdown; release booster and fairing | Module 7 |
| 22 | Endpoint | Earth parking orbit; Moon journey later | Module 7 |

The seven preparation steps in the source and its four physical design stages describe the same build. Use one manifest across them: spacecraft bus → rover → science payload → survival. Do not force the player to buy or assemble the same equipment twice. Keep lander and rover mass distinct from launch-vehicle mass; the 350 kg figure is the script's modeled equipment allowance, not gross rocket liftoff mass.

## Module delivery plan

| Module | Status | Concrete deliverable |
|---|---|---|
| 1 — Story foundation | Complete | Verbatim source snapshot; 18 dialogue/cue mappings; 20-step flow; gated progress reducer; separate save schema; script catalogue and unresolved values |
| 2 — Character assets | Complete | 48 facial frames, 9 body poses, registered mouth/eyelid/forearm compositor, responsive art lab, contact sheets and animated review |
| 3 — Conversation system | Complete | Large character stage; full exact dialogue; click/back; speaking face/mouth/eyes/gesture; stable navbar and controls; responsive renderer |
| 4 — Mission selection | Complete | Wire name, conversations and all three selections into the new flow; persist progress |
| 5 — Workshop | Complete | New lander/rover build, choices, equipment info and live resource calculations; 3D objects matching chosen hardware |
| 6 — Launch readiness | Complete | Correctable checks, packing, approved immutable manifest and launch-ready handoff; end-to-end verification |
| 7 — Liftoff | Complete | Interactive authored ascent, staging, fairing release, speed/pause/skip/replay, guarded save and Earth-orbit endpoint |

Await the user's next module instruction after each delivery. Do not commit, push, deploy or switch the public experience as part of Module 1.

Module 2 also keeps the playable entry point unchanged. Its isolated preview is `/story/characters-v1/preview.html`; see [the character asset handoff](character-assets/README.md) for files, registration controls and Module 3 integration.

## Module 2 asset contract

`types.ts` currently defines ten expression cues and six pose cues. Group assets by character and expression/pose combinations actually used in `dialogue.ts`; do not generate unused combinations simply to fill a grid.

For every used portrait/pose, deliver a registered base plus compatible closed/open/rounded mouth and open/closed eye layers. Shared camera, face scale and feature positions are necessary to prevent face jumps. Give the raised arm its own layer or a matched pose pair when a gesture is needed. Expression changes happen on line changes; mouth and blink movement continue while the same line is being spoken. Listener poses remain calm.

A static full-body swap plus CSS bobbing is not acceptance. Inspect a rendered animation sample and consistent character identity before integrating. Exact speech lip sync requires audio timing/visemes; a rhythmic talking effect must be described as such rather than claimed as phoneme-accurate lip sync.

## Foundation code

- `src/game/story/types.ts`: story, choice, cue and progress contracts.
- `src/game/story/dialogue.ts`: source dialogue, order and per-line performance cues.
- `src/game/story/flow.ts`: ordered screens, exact choice labels, player-name display substitution.
- `src/game/story/progress.ts`: pure next/back/selection/activity reducer and safe save restore. New key: `zero_to_beyond_script_story_v1`.
- `src/game/story/design.ts`: script's 24 component options and resource values, empty manifest shape.
- `tests/story-foundation.test.mjs`: source fidelity, navigation, gates, save roundtrip and mandatory totals.

Module 4 now makes the exact-script selection story the root experience. Module 3’s isolated `/?module=3` review route remains available without writing progress. The previous build-and-launch game is preserved at `/?experience=legacy`. Module 5 extends the root through the five build stages to `mass-check`, a read-only assembly handoff before Module 6 validation. No new dialogue was invented for workshop stage instructions.

## Source specification gaps

The source stays unchanged. Module 5 resolves items 1–7 with explicitly authored gameplay rules documented in [workshop assumptions](workshop-review/README.md); these are not verified NASA hardware values. Module 6 resolves item 8 with an explicitly illustrative robotic carrier; see its readiness handoff.

1. MSOLO appears in the design/exploration sequence but has no cost, mass, power or mandatory status.
2. Solar arrays have no mass. High-efficiency is written as “+250 W”; total vs incremental output is unspecified.
3. Battery capacities 100/220/400 have no unit or discharge power limit.
4. Thermal options lack mass and heater power; communication options lack mass/power and may overlap the mandatory antenna.
5. The 450 W ceiling, solar output and battery peak support need a defined operating model. The example 280 W + 175 W gives 455 W if added directly. Clarify whether nominal drill load is already included.
6. Geology is selectable but has no dedicated science package/objective criteria in this script. Keep its story selection available; author its validation explicitly in Module 5.
7. Drill science is provided at 20/50/100 cm only. Intermediate scoring and risk rules are unspecified.
8. The source assumes rocket design already exists; it does not specify robotic launch-vehicle configuration or a new packing dialogue. Reuse compatible visuals and define the payload adapter in Module 6 without silently inventing character speech.

Missing values stay `null` or explicit `specGaps`, never zero-cost/zero-mass defaults. The catalogue is marked as source-authored game data, not NASA-verified hardware specifications. Later research can resolve factual questions without rewriting the user's dialogue.

## Module 1 verification

Run once after implementation:

```sh
node --test tests/story-foundation.test.mjs
npm run build
npm run lint -- src/game/story
git diff --check
```

Do not run browser tests for Module 1: it changes the foundation only. Verify the visible experience when Modules 3/4 are integrated.

## Module 3 delivery

Conversation system complete. Open `/?module=3`; click Start conversation to begin with a user gesture. All 18 exact source lines are shown in five review scenes, with large Chief/Commander rigs, stable header and Back/Next controls, line progress, narration mute/replay and arrow-key navigation. Long mobile lines scroll inside the dialogue card; they are never rewritten or clamped.

Narration start/end/pause/cancel/error events control the speaking actor. Blink, breathing and hand gestures use the registered compositor, and reduced motion/hidden-page handling stops animation safely. Mouth movement is a rhythmic talking effect during actual speech, not phoneme-accurate lip sync. Browser voices can differ across devices; voice failure never blocks navigation.

See [renderer contract and verification evidence](conversation-review/README.md). The conversation preview remains isolated; Module 4 integrates this renderer into the active story. No selection, workshop or readiness logic was added to the preview itself.

## Module 4 delivery

Mission selection complete. The active root uses the story reducer for name submission, all 18 exact dialogue lines, Moon selection, both objective choices and both landing-site choices. Moon clicks advance immediately; objective/site choices stay highlighted until Next. Mars and Comming Soon are disabled. No old crew or camp screens enter this script.

Every screen shares `StoryShell` and `StoryControls`; the purple palette, visible header and bottom Back/Next positions remain consistent. Browser storage saves the separate story key, exact cursor, valid choices and voice preference. Saved missions resume from a Continue screen with a user gesture. Back followed by refresh retains valid later choices. Storage failure reports Not saved and keeps play available. Restart requires an in-game confirmation and affects only this story.

The root stops at a saved plan, not a fake mission approval: `resource-limits` is the Module 5 handoff, and no activity is completed or rocket launched. Future activity saves are bounded to this handoff by `restoreSelectionProgress`; Module 5 must extend that boundary together with a real preparation manifest and validation. Source resource values and unresolved specs are unchanged.

See [selection handoff, screenshots and verification](selection-review/README.md). Modules 5/6 remain pending.

## Module 5 delivery

The active story now enters a 3D workshop from the exact resource conversation. All 24 source options have info popups; six mandatory lander parts start uninstalled. Five steps build the lander, choose a rover, attach instruments and plan drilling, choose solar/battery, then add navigation/thermal/radio. Shelf thumbs and installed meshes use the same procedural part factory.

Pointer capture supports held mouse/touch dragging, a whole-bay snap margin, yellow attachment rings and a short settling animation. Releasing outside returns the preview to the shelf. Tap or keyboard install, multiselect, Select all, removal, undo/redo and confirmed Quick Build are available. Swaps replace the old choice instead of accumulating cost/mass. Science remains unearned until exploration. Depth changes potential points, modeled drill duration, energy and risk.

Progress and preparation persist in one versioned payload. Invalid hardware cannot restore later build completion; Back after removal cannot jump to a falsely completed handoff. Source dialogue and prior-module saves are preserved. The scene loads lazily, reuses one renderer for thumbnails, pauses when hidden, renders on changes and disposes GPU resources on unmount.

Mass/power/budget meters are live, but assembly completion does not approve a mission. Module 6 must implement correctable checks, battery reserve/route feasibility, site-specific constraints and rocket packing before an approved manifest. Permanent shadow currently shows 0 W solar and finite battery endurance; no permanent settlement or indefinite operation is claimed. Geology uses the shared mandated toolkit with NIRVSS mineral analysis; exploration success criteria remain future work.

See [Module 5 handoff and verification](workshop-review/README.md).

## Module 6 delivery

The live root now continues after Survival through the source's Mass → Power → Budget checks, then payload packing and **MISSION APPROVED**, before liftoff. No source conversation was rewritten and no extra character speech was invented. The old Module 4/5 handoff descriptions above record those deliveries; they are superseded by this module.

Checks read actual selected components, not the script's numerical examples. Each check requires an explicit player action and a valid design. The 350 kg allowance and 1,000 credits cover the modeled lander/rover equipment; the generic launch carrier, adapter and fairing are supplied separately. Current legal catalogue combinations all fit 350 kg, so the UI does not invent an overweight failure. Budget and battery/thermal choices still produce real failures.

Power uses the complete rover peak, replacing TRIDENT's normal 20 W with its 175 W peak, rather than adding both. A conservative rover rehearsal budgets 15 minutes of other operations in zero solar plus drilling at peak load, retaining 20% battery reserve. Shadow sites require the authored Advanced thermal option. This is an equipment/short-rehearsal gate, not validation of an entire lunar trajectory, lander battery, thermal lifetime or route. The lander descent electrical load is reported separately.

The hangar loads the actual selected lander and rover with all instruments into an illustrative folded arrangement: fit adapter → load explorer → close fairing. Players can drag into the whole hangar with a generous margin, tap or use keyboard; failed releases return to the shelf. The new robotic carrier has no crew capsule or escape tower. The parts, scale, launch service and fairing are explicitly illustrative, not certified real launch hardware.

Every acknowledgement and packing action is bound to a canonical versioned design signature. Changes to equipment, depth or mission choice clear checks, packing and approval. The endpoint has a recursively frozen manifest with hardware, totals, mission choices and assumptions; a JSON mission card can be downloaded. Save restoration recalculates specs and rejects stale signatures/approval totals. Reload resumes valid partial checks/packing. Old Module 5 saves resume at Mass with their hardware intact. Quick Build still stops before checks.

See [Module 6 rules and verification](readiness-review/README.md). Liftoff, transfer and lunar exploration are outside this delivery.


## Module 7 delivery

The approved mission now enters liftoff and ends in Earth parking orbit. The 18 source dialogue lines remain unchanged; the script has no launch conversation, so no extra Chief/Commander speech was invented. Earlier delivery endpoints above are historical.

A 38-second authored timeline (about 19 seconds at 2×, excluding player waits) includes countdown, booster burnout/release, upper-stage ignition, fairing release and orbital insertion. The timeline waits for each release and cannot jump over it. Pause, 1×/1.5×/2×, honest skip, replay and gentle-motion milestone views are available. Going home, Back, hiding the tab or reloading stops running flight; the user explicitly resumes. Flight requires the current approved packing signature; hardware edits reset it along with approval. Completed orbit restores only from valid flight state.

Packing and launch share the same procedural carrier and actual selected payload meshes. NASA Blue Marble surface imagery replaces the procedural Earth texture. Curvature and horizontal turn show the concept of building orbital speed; Earth recedes and the distant Sun remains fixed. Exhaust broadens during ascent; audio is a game effect, not sound travelling through vacuum. Scale, ascent samples and carrier hardware are illustrative. The final 200 km circular-orbit speed is computed from v=√(μ/r), about 7.79 km/s; this is not a trajectory solver or certification of a real launcher. No ISS stop, escape tower or crew capsule is inserted into the robotic screenplay.

Flight state persists atomically with hardware and approval at half-second checkpoints, action/status changes and page exit. Restoration pauses a running save and repairs impossible event order, stale signatures and forged orbit cursors. A failed WebGL scene retains usable flight controls/telemetry. Three loads lazily, renders only while changing, limits DPR, pauses when hidden and disposes renderer/textures/geometry on exit.

See [Module 7 evidence and science boundaries](flight-review/README.md). Moon transfer, lunar descent and source exploration scenarios are the next delivery scope.


## Gameplay revision: decisions, rehearsal and launch challenge

The original 18 screenplay lines are unchanged. Skip briefing advances only through consecutive conversations and stops before a required choice/activity. Judge demo is available from entry and home; it creates an isolated prebuilt explorer at Mass without granting checks, packing, approval or flight completion. Exiting restores the normal mission, and a demo never writes over its save.

The workshop now has a larger animated Commander with short contextual reactions after installations, completed systems and drill-depth edits. These extra lines are separate from the source screenplay. A disconnected radar must be found and connected before the payload scale can be accepted.

Power is now a player-operated zero-solar rehearsal: drive out, drill at the selected depth, return. Each leg represents 7.5 minutes at the modeled rover normal load; drilling uses the modeled peak load for the selected duration. Only the animation is compressed. Usable energy excludes a 20% reserve. Small batteries, deeper drilling and unsupported permanent-shadow thermal configurations can fail. Failure explains the cause and offers retry plus equipment editing. Edits invalidate all previous checks and approval. No real sample/science points are awarded by the rehearsal. Active saved rehearsals resume paused; restoration validates phase, energy and current equipment signature. Readiness rules version 2 invalidates older check acknowledgements while retaining hardware.

Guided launch remains the default and waits for actions. Challenge continues through four compressed seconds at each release window. Early commands are safely blocked, and missed windows pause for a retry of that stage. Mode, attempts, window state and pause status are saved. Mobile release controls remain on the visible flight canvas. Flight still ends in illustrative Earth parking orbit; these challenges are game rules, not certified spacecraft operations.

29 local neural MP3 recordings (approximately 1.1 MB total) use en-US-GuyNeural for Chief and en-GB-SoniaNeural for Commander. They include the exact screenplay and short engineer reactions. Actual playback starts/stops the existing mouth, blink and gesture effects; this is expressive animation, not phoneme-accurate lip-sync. A customized first greeting falls back to the selected browser male voice so the player's name remains correct. Missing audio assets also have a browser fallback. Recordings, transcripts and voice credits live in `public/story/audio/`, with a reproducible generator in `scripts/generate-story-voices.py`.
