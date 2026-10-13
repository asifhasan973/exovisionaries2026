# Zero To Beyond — full Moon mission implementation plan

Planning date: 2026-10-12, Asia/Dhaka. Status: Modules 1–12 have local laptop implementations on `feat/full-moon-foundation`. Fresh full integration/production verification and release are not claimed; mobile and publishing are deferred at the user’s request. See `moon-integration-review/README.md` for the scoped Module 12 delivery. Follow-up return/export/refresh checks and fixes are recorded in `moon-final-review/README.md`; both assisted endings were manually completed, with their different outcomes preserved. See `moon-foundation-review/README.md` and `moon-preparation-review/README.md` for delivery boundaries and verification.

## Authority and intended outcome

Story source: https://docs.google.com/document/d/14OlD6AqRhN-i2wRsvcLuLBGgkDYLVBCeYxlHJytqwvg/edit?tab=t.ndqefx7tshay — the **Final One** tab, read on the planning date. Other tabs are not the copy authority for this extension.

The user wants the existing game completed, rather than replaced, with crew and rover together. Preserve the purple/night palette, expressive 2D conversation characters, 3D hardware, mobile landscape experience, short activity instructions, spoken guidance, animated hints, and stable navigation. In the follow-up on this planning turn, the user explicitly permitted changes within the story where useful. Polish duplicated/unclear dialogue and fix factual rules; preserve the mission premise and record significant additions rather than claiming every new line came from the writer.

Ship both documented objectives: Ice Explorer first as a complete mission, then Geology Explorer on the same mission framework. Mars remains unavailable. The finished experience must connect preparation decisions to journey, landing, exploration, safe return, and a result explained by actual player actions.

Do not promise a competition win. The user confirmed the official challenge: https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/. The public HTML and its embedded page data were read on the planning date after the web reader returned an error. The published description asks for an interactive complete-mission game connecting engineering decisions, limited resources and outcomes; its resource-tab content was empty. Do not invent additional official requirements or resource links. Recheck the brief before release if it expands.

### Confirmed challenge alignment

| Published topic | Implementation |
| --- | --- |
| Mission objectives | Different Ice and Geology equipment, evidence tasks and endings. |
| Spacecraft design, instruments and launch vehicles | Shared manifest, objective-specific workshop and a visible supplied crewed platform with declared allocations. |
| Budgets, power and mass | Derived design limits, mission-time W/Wh accounting, load shedding and safe-state decisions. |
| Communications | Terrain/route-dependent coverage, link architecture, autonomy and successful data transmission. |
| Orbital constraints | Feasible transfer selection, maneuver fuel, lunar insertion, landing and reserved return capability. |
| Complete mission from concept to operation | Preparation through exploration, crew return and evidence-based debrief. |
| Evaluate the consequences of choices | Saved action log, reproducible incidents and a design/result comparison. |

NASA terrain/instrument references are recommended to substantiate the educational model; the current published description does not itself provide a mandatory dataset list.

## What actually exists

Inspected baseline: main at `95bf4b1a80c27ad00e1ce96ec4a4db619df33892`; working tree was clean before adding this document.

| Existing capability | Treatment |
| --- | --- |
| Home, name/gender selection, Chief/Commander dialogue and expression rigs | Reuse. Do not regenerate all assets or restart the introductory flow. |
| Moon/objective/site choices | Reuse, then give objective and site distinct downstream rules. |
| Five 3D assembly stages, thumbnails, held dragging, snap, multiselect, undo/redo | Extend the current manifest and model factory. |
| Animated automatic build, contextual reactions, recorded voices | Preserve; make plans objective-specific and use the existing speaker identities and 1.5x narration preference. |
| Mass/power/budget validation, radar connection, 3D shadow rehearsal | Keep, replace scattered assumptions with shared mission resource rules. |
| Red repair alerts, targeted repair navigation, hand guidance and spoken reasons | Extend to all new design-time faults. |
| Packing, generic robotic carrier, staged launch to Earth orbit | Adapt to the crewed architecture. The current carrier cannot silently become a human spacecraft. |
| Local save, isolated judge demo, glossary, shared shell, mobile menu | Extend with versioned mission state and shared pause handling. |
| Lunar transfer, lunar landing, astronaut crew selection, actual exploration, Earth return | Not implemented in the active story. |
| Geology-specific equipment and science | Not implemented; selecting Geology currently does not create its own payload. |

Relevant existing seams: `flow.ts`, `types.ts`, `workshopSession.ts`, `selectionSession.ts`, `design.ts`, `preparation.ts`, `readiness.ts`, `flight.ts`, `TrialViewport.tsx`, `StoryShell.tsx`, `Learning.tsx`, `repairGuidance.ts`, `characterAssets.ts`, and `src/audio/soundEngine.ts`.

## Decisions that resolve script contradictions

1. **Crewed architecture:** use an Apollo-inspired three-person mission: Commander and science specialist land; the support specialist remains with the command/service spacecraft in lunar orbit. This is a game architecture inspired by Apollo, not a claim that Apollo flew to the south pole with VIPER instruments.
2. **Resource boundaries:** keep 1,000 credits and 350 kg as the player equipment allocation. The crew capsule, full crewed lander structure, ascent/descent propellant, life support, and return heat shield belong to a supplied mission platform with a separate manifest. The script's lightweight lander part allocations are illustrative equipment/subsystem values, not the gross mass of a crewed lunar module.
3. **Crew accounting:** script crew mass and support demand are shown separately. Do not charge all crew credits against the same equipment budget: even the cheapest ice equipment build plus the cheapest valid crew exceeds 1,000 credits. Define a separate crew allocation with a balanced valid team before implementation. Keep generic life-support 'units' separate from W until a declared game conversion exists.
4. **Geology budget:** initially use the same total equipment budget as Ice, with a 100 kg science sub-limit. Do not accidentally grant a second free 1,000-credit budget. Instrument example totals are derived, never copied as constants: Balanced = 38 kg / 390 MC / 116 W / 61 potential SP; Deep = 99 kg / 930 MC / 302 W / 121 potential SP.
5. **Power and energy:** W is operating/discharge power; Wh is stored energy. Drill peak replaces its normal load rather than counting both. Solar generates zero in permanent shadow; charging elsewhere depends on usable illumination and the operating timeline.
6. **Science:** NSS provides hydrogen clues. Neither a strong signal nor a deeper hole guarantees water ice. Instruments and evidence determine confidence and results. Buying instruments, rehearsal samples, and repeat observations do not award discovery points.
7. **Flight:** required maneuver delta-v comes from the trajectory. Equipment mass affects fuel feasibility/available delta-v. Do not implement the script's incorrect 'more mass means higher required delta-v' chain.
8. **Scope of story changes:** preserve the Chief appointment, mission choice and engineering premise, but shorten redundant briefings under the user's latest authorization. Make the named Commander avatar consistently represent the player's command role instead of switching between Commander and the Commander's friend. Keep original copy archived and record adapted dialogue. New lunar/return scenes need separately identified continuation lines because the tab mostly describes gameplay after departure and does not supply a completed ending. Each screen's spoken prompt is short; details remain in optional explanations.
9. **Sites:** choose an illuminated operating base near the crater rim for the accessible route. Retain the shadow option as the hard route; clarify whether it is an exploration target or a full landing site. Direct PSR landing must never imply that solar power or a high-gain antenna solves darkness/terrain automatically. If direct landing remains available, validate its autonomous landing, thermal, energy, communications, and recovery conditions.
10. **Crew safety and return:** departure approval includes a feasible return plan. Ascent and Earth return reserves are not freely spendable science fuel. Rover return to base and crew return to Earth are separate accomplishments.

The missing hardware values, miniature vehicle masses, credits, reliability percentages and score bonuses remain explicit game estimates until backed by a specific source. No NASA flight-certification claim is made.

## Player-facing structure: four chapters

**Prepare → Journey → Explore → Return.** Implementation modules are engineering work packages, not thirteen milestones shown to children.

Full screen order:

Home / Continue / Judge demo → name and character → Chief appointment → Moon → objective → site → resource briefing → lander kit → rover → objective-specific science payload → power → survival → crew assignment → engineering validation → packing and approval → Earth launch → parking orbit → trajectory choice and TLI → transfer → lunar orbit → crew/lander separation → lunar descent → surface deployment → survey/traverse → sample selection → collect/analyze → adaptive incident decisions → transmit results and return to base → crew ascent → rendezvous/docking → Earth-return burn → re-entry → splashdown → debrief / replay.

Back/Next positions stay fixed. Before launch, Back permits editing and invalidates affected checks. After launch, Back opens the prior briefing/map or offers an explicit checkpoint retry; it must not teleport a spacecraft backwards or enable buying new hardware on the Moon.

## Implementation order and acceptance gates

**Current local implementation:** Modules 1–10. Preparation continues through crew readiness, launch, transfer, capture, powered descent, rover deployment and a bounded surface scout with energy, communications and a safe return path. Ice science now includes NSS survey, depth-dependent drilling, on-site analysis, evidence interpretation and transmitted records. Adaptive science-time incidents, repairs and surface recovery are implemented; crew ascent, docking, Earth return, re-entry, parachutes, splashdown and the evidence-derived Ice debrief are now implemented. Geology now has separate sites, rock survey/collection/testing, ground sensor traces, sealed sample return and a distinct debrief. See [Module 10 model](moon-geology-review/README.md). See [Module 9 model](moon-return-review/README.md). See [Module 8 model](moon-incidents-review/README.md). See [Module 7 model](moon-science-review/README.md). See [Module 3 review](moon-readiness-review/README.md) and [Module 4 model](moon-journey-review/README.md). Modules 4–10 currently target laptop layouts only. See [Module 5 model](moon-landing-review/README.md) and [Module 6 model](moon-surface-review/README.md).

### Module 1 — Mission foundation and science/resource contract

- Snapshot the current version on a recoverable branch before changing gameplay. Use an isolated implementation branch; keep the current public deployment until a reviewed build is ready.
- Add a versioned full-mission session with objective, crew, equipment, trajectory, resources, navigation, evidence, incidents, checkpoints and outcome. Extend the current reducer rather than maintaining a second conflicting game state.
- Introduce a catalog of script values, sourced facts and declared game estimates. Calculate every loadout total from its installed parts.
- Add operating modes for descent, traverse, drilling, analysis, charging, standby and crew return. Keep rehearsal state separate from surface evidence.
- Define the same simulation clock/resource calculations for readiness previews and actual operations. Accelerated playback changes presentation time, not total resource expenditure.
- Add staged save migration. Preserve the original save; old robotic launch approval cannot authorize a crewed departure. An existing player can reuse their design but must complete crew/return checks.

**Done when:** a valid Ice and Geology equipment set can be represented; impossible selections are identified; save upgrades preserve prior work; no new scene can bypass prerequisite validation.

### Module 2 — Crew assignment and objective-aware preparation

- Extend the workshop rather than rebuilding it. Ice uses NSS/TRIDENT/NIRVSS and explicitly modeled optional MSolo. Geology uses its actual camera/spectrometer/sample-handling choices; Ice instruments cannot falsely fulfill Geology tasks.
- Add the documented basic/balanced/advanced geology tiers with capability differences beyond score potential.
- Add crew assignment as a role-matching activity after assembly, as in the script: mandatory Commander, one science specialist, one systems/robotics specialist. Use the five candidates actually supplied; do not pretend the text's six-candidate claim contains a sixth profile.
- Make skills produce bounded effects: interpretation assistance, mobility assistance, repair options and workload/power-management help. Skills never override physical resource limits or create scientific evidence.
- Give the crewed platform a clear visual capsule, lunar lander and return hardware. Reuse relevant legacy crew assets/data only after checking their assumptions.
- Update auto-build to animate through valid objective-specific choices and stop for required crew/validation actions. No auto-awarded science.

**Done when:** both objectives have a valid equipment pathway; crew assignment is understandable; the manifest distinguishes crew infrastructure from the equipment allocation; selection changes visibly alter capabilities and resource totals.

### Module 3 — Readiness and design stress tests

- Reuse the radar, mass, budget and shadow-power checks. Add crew capacity, supplies, communications, thermal and return-system verification.
- Run the selected design through a short power/shadow rehearsal. A lower-capacity battery or longer drill genuinely changes the result.
- Add the script's mobility/dust, communication and radiation-protection stress tests using the same models later used on the Moon. Avoid four long compulsory copies of the same activity: core checks are mandatory; guided mode can demonstrate applicable incident tests and challenge mode can make them playable.
- One fault at a time: red alert → one-sentence spoken cause → Fix → exact part/category → animated hand → change and recheck. No misleading fix if a combination of changes is required.
- Produce a immutable crewed mission manifest and create an independent checkpoint before departure.

**Done when:** a known weak design fails for a visible reason, a valid change resolves that same reason, and old approvals cannot survive a changed design.

### Module 4 — Earth departure, trajectory and Moon arrival

- Preserve the existing launch controls, staging, playback speeds, voice identities and launch presentation, while adapting payload/fairing/abort-system visuals to the crewed configuration.
- Continue from the actual Earth-orbit endpoint to a trajectory panel. Show a small preview of travel duration, maneuver fuel, supplies and risk for each authored route; calculate whether it is feasible.
- Implement TLI and lunar insertion as visible engine burns/coasts with a simple direction/timing action. Guided mode pauses for the action; challenge mode shows a safe window and permits retry.
- Use a documented simplified two-body/transfer model or an authored profile with explicit provenance. Never label a cinematic as a full flight dynamics simulation. Validate maneuver/resource totals independently of visual scale.
- Keep real transfer duration separate from accelerated screen time. Sound feedback is cinematic/cabin/instrument feedback, not a claim that sound propagates through vacuum.

**Done when:** the chosen equipment/crew plan reaches lunar orbit with coherent resource changes; no orbit is entered just because a decorative progress bar finishes; speed/skip leaves a consistent declared assisted outcome.

### Module 5 — Lunar landing

- Build the descent around lunar gravity, throttle, vertical and horizontal velocity, fuel and a safe landing zone. Use a fixed simulation step independent of frame rate.
- Detect boulders/slopes with the selected cameras/radar. Better sensors provide useful earlier information; low-tier equipment still has an achievable route.
- Offer Continue / Divert / Abort when physically appropriate. Abort is available only if the phase, propulsion capability, trajectory and fuel allow recovery.
- Add accessible touch controls and keyboard controls; use the same dynamics in guided and challenge modes, with assistance rather than invented physics.
- Checkpoint before descent. A failed attempt shows what happened and permits retry, without replaying the introduction.

**Done when:** touchdown requires acceptable speed, terrain and position; steering/fuel choices matter; guided mode is playable for a novice; no atmosphere/parachute is used to land on the Moon.

### Module 6 — Shared lunar surface engine and world

- Deploy the actual selected rover/equipment from the lander. Show surface crew presence with restrained astronaut models/actions; existing expressive 2D characters remain the dialogue guides.
- Create a bounded, explorable map with base, safe sunlight/charging areas, shadow, slopes, obstacles, targets and communication zones. A limited polished map is preferable to an empty giant open world.
- Use NASA LRO-derived terrain/illumination information where practical. Preserve file provenance, scale and geographic scope. If simplified or fictional terrain is used, label it as an illustrative scenario instead of a real landing prediction.
- Route selection and driving both consume modeled energy/time. Instruments, heating and radio consume their operating loads. Headlights/illumination must make dark areas playable without making PSRs appear sunlit.
- Predict return reserve before starting a leg or drill. Charging requires actual light and time. Crew EVA activity gets a bounded support/return-to-shelter budget.
- Pause simulation when a menu, glossary, dialogue decision or hidden tab pauses gameplay. Rendering never advances mission state itself.

**Done when:** a route genuinely changes resources, solar is zero in shadow, terrain capability changes safe navigation, and the player can inspect a feasible return route.

### Module 7 — Complete Ice Explorer science loop

- Survey with NSS and reveal hydrogen clues without exposing hidden ground truth.
- Choose among drilling, another observation or a different route; depth selection changes time, energy and sampling coverage.
- Animate drilling and sample/cuttings analysis. Model NIRVSS water/hydroxyl/mineral evidence and MSolo gas/volatile evidence appropriately.
- Record location, depth, instrument, observation quality and confidence. Allow confirmed, inconclusive and negative findings; a useful negative observation can still earn bounded scientific value.
- Award points once for valid observations/discoveries, with a separate record of data transmitted. No repeated scoring from retry/reload or duplicate measurements.
- End the mission's science task with a brief visual finding and a character reaction, then a concrete return-to-base objective.

**Done when:** a player can explore, collect and interpret evidence, transmit a result and return to base with their original hardware. No automatic ice confirmation or points merely for buying/drilling deeper.

### Module 8 — Adaptive incidents and meaningful repairs

- Complete the document's dust, communications, power and solar-particle-event decisions on the shared surface engine.
- Trigger incidents from route/design/actions using a saved scenario seed. Do not reroll a favorable event on refresh or force every event into every playthrough.
- Dust affects sensors/panels/mobility according to the scenario; no Earth-like windstorm in lunar vacuum. Communication failures have geometry/equipment causes, and high gain cannot bypass a blocked line of sight.
- Radiation events constrain EVA and prioritize safe shelter; clearly declare qualitative game protection limits. Do not claim that an inexpensive universal shield makes any event safe.
- Surface repair uses installed equipment, carried spares and crew capability. It cannot instantly buy/fit a new battery or habitat. A design change is an explicit return to a pre-launch/rehearsal checkpoint.
- Use visible consequences, short spoken guidance, specialist assistance and safe-state choices; avoid unexplained random damage/hearts.

**Done when:** identical saved designs face reproducible incidents; every offered action has an effect and reason; bad preparation can be improved through an explicit retry, not magical in-flight shopping.

### Module 9 — Crew ascent, Earth return and Ice ending (implemented locally)

- Require surface tasks to reach a safe stop: crew aboard, needed data transmitted, samples stowed if collected, rover left safely on the Moon and reserved ascent fuel intact.
- Launch the lunar ascent stage, rendezvous/dock with the orbiting support specialist and command spacecraft, then execute Earth-return departure.
- Show coast, service-module separation, shielded re-entry, Earth parachute deployment and splashdown. Simplify to a few clear playable decisions rather than another long assembly mission.
- Implement bounded safe abort/early-return and partial-success outcomes. Preserve useful collected data and explain why safety took priority.
- Debrief with the actual mission log: discovery/evidence, science data delivered, crew safety, resources and decisions. Add a replay/compare-design action and a downloadable final mission card.

**Done when:** a full Ice mission reaches a defensible ending from Home without developer tools; all crew are accounted for; the result derives from recorded actions rather than prewritten percentages.

### Module 10 — Complete Geology Explorer (implemented locally)

- Reuse preparation, crew, validation, flight, landing, events and return. Provide the documented highland/crater site options and geological targets rather than ice-only sites.
- Add camera/spectral survey, sample selection/collection, XRF elemental evidence, XRD crystalline-mineral evidence, GPR subsurface interpretation and seismometer deployment appropriate to selected equipment.
- Tie sample-dependent analyses to sample-handling hardware. The suggested Balanced loadout does not include a drill: define surface-scoop/arm handling explicitly rather than letting XRD analyze an uncollected sample.
- Identify plausible rock classifications from evidence. Seismometer results need meaningful deployed observations/signals; selecting the part is not an instant interior discovery.
- Keep all documented instrument tiers, correcting totals and distinguishing capability/quality from potential score. Use the same evidence and duplicate-prevention rules as Ice.
- Write a distinct geological conclusion and debrief. Volcanic features may be geological targets, not a third mandatory mission outside Final One.

**Done when:** Geology is a genuinely different scientific objective with valid equipment choices and a full return/debrief, not Ice gameplay with a changed title.

### Module 11 — Characters, voice, visual polish and onboarding completion

Laptop delivery: see `moon-polish-review/README.md`. This is illustrated talking animation, not phoneme-accurate lip sync; no mobile or release verification is claimed.

These standards apply from Module 1; this module closes gaps after the complete flow is playable.

- Give scene-specific expressions and event-specific reactions using registered character art; avoid repeating one congratulation or neck/mouth artifacts. Generate additional art only for missing useful cues.
- Keep Chief male and Commander male/female voice selection consistent, including all new scenes. Maintain 1.5x speech preference; never queue several reactions on top of one another.
- Synchronize speaking motion with audio activity and blinking/gestures with performance cues. If only rhythmic mouth animation is delivered, call it talking animation rather than phoneme-accurate lip sync. Exact lip sync would require timed viseme/audio assets.
- Add automatic first-use hand demonstrations plus a repeatable Hint beside Next. The demonstration is visibly a demonstration, earns no science and does not silently complete a required player task.
- Maintain fixed navigation, legible text/contrast, minimal activity copy, optional glossary/science explanations, strong red actionable alerts and consistent achievement/audio feedback.
- Keep one viewport on desktop/mobile landscape; paginate or use compact panels instead of hiding essential controls. Preserve platform-specific fullscreen/rotation fallbacks.
- Refine crewed spacecraft, lunar lighting, terrain, deployment, burns and docking so the same hardware persists across scenes. Lazy-load large scenes, cap GPU detail on phones, stop hidden rendering and provide playable non-WebGL fallback.

**Done when:** an unfamiliar player understands the next action without a text wall; the same character/voice/UI is recognizable throughout; complete play remains possible without audio, WebGL or supported fullscreen APIs.

### Module 12 — Judge experience, verification and release

Laptop implementation delivered: grouped chapters, real battery comparison, provenance, save/repair recovery, source register and chapter error handling. Limited manual check and source review completed. Full replay/build/mobile/release portions remain unverified or deferred under the user’s current instructions; see `moon-integration-review/README.md`.

- Keep normal Play/Continue and an isolated Judge demo. Add chapter checkpoints for developers and a quick, self-contained comparison: a constrained design exposes a fault, an improved design completes a useful observation and safe return.
- Assisted skip/auto-build changes are labeled and recorded, never confused with earned player skill. Demo saves never replace the player's mission.
- Verify the full Ice and Geology paths manually, including weak/strong batteries, deep drilling, shadow versus rim, equipment swaps, crew variants, faults/repair, landing retry, evidence scoring, safe return and partial outcomes.
- Check refresh, old-save migration, pause/menu behavior, sound/mute/speaker identity, missing assets, WebGL failure and narrow mobile landscape. Run the existing production build/lint when implementing; do not introduce an automated test program against the user's stated preference without a new request.
- Publish an explicit NASA-data/source list and game-assumption list. Match the confirmed official challenge requirements and make a truthful short demo narrative based on the working features.
- Commit with focused descriptions and deploy an inspected preview. Promote the completed release when requested/authorized; leave a recoverable prior deployment/branch.

**Done when:** both missions run start-to-finish on desktop and phone; no required gate is cosmetic; project sources/limitations are accurate; the demo shows consequences instead of just a sequence of screens.

## Integration rules and dependency order

- Implement 1 → 2 → 3 before extending departure. Implement 4 → 5 → 6 before surface science. Implement 7 → 8 → 9 as a complete Ice vertical slice. Implement 10 after Ice works end-to-end. Finish 11 → 12 before release; onboarding/audio/mobile standards are applied in each module, not postponed until the end.
- Use explicit phase reducers (`crew`, `journey`, `landing`, `surface`, `science`, `incidents`, `return`, `outcome`) composed into the existing session. Keep scene rendering components separate from calculations.
- Derive feasibility, HUD values and debrief from one ruleset. Do not store independently editable 'passed', energy totals or science totals that disagree with the mission log.
- New changes to objective/site/crew/equipment invalidate only dependent approvals and outcomes. An immutable launch snapshot governs hardware in flight.
- Save at meaningful decisions and stable checkpoints, with guarded in-progress recovery. Do not mutate mission state from rendering or use frame rate as simulated elapsed mission time.
- Reuse the visual factories for shelf, packing, flight and surface equipment. A selected part must appear consistently and control its actual capability.
- Do not expand to Mars, base construction, multiplayer, a chatbot, randomized stories or a giant open world before completing Final One's Moon paths.

## Main risks and chosen mitigations

| Risk | Decision |
| --- | --- |
| Huge scope and unfinished ending | Complete one Ice vertical slice through Earth return before building all Geology variants. |
| Crew contradicts lightweight robotic build | Separate supplied crewed platform from player equipment and replace robotic approval explicitly. |
| Several impressive scenes but no causality | Every major hardware choice has a concrete downstream effect; the HUD and outcome share the same model. |
| More tests become another long checklist | Keep short required validation and contextual optional/advanced stress tests. |
| Child-friendly presentation teaches incorrect science | Short prompts plus optional explanation; simplified values labeled; evidence-based confirmation. |
| 3D, atlas and audio additions overwhelm phones | Reuse assets, lazy-load chapters, cap detail, reuse renderers where practical and dispose GPU/audio resources. |
| A challenge brief that may expand | The current official description is verified and mapped above; recheck before release and do not substitute a different challenge. |

## Definition of finished

The player can complete **Home → design → crew → validation → launch → Moon arrival → landing → objective-specific exploration → evidence/data return → crew Earth return → decision-based debrief**, without scrolling through the main game, developer intervention or fabricated success flags. Selected equipment and specialists matter, failure is understandable and recoverable, scientific claims have provenance, and the final result is earned.

## Scientific reference anchors

- Apollo architecture and crew return: https://www.nasa.gov/the-apollo-program/
- Apollo rover missions: https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html
- NSS/TRIDENT/NIRVSS/MSolo capabilities: https://science.nasa.gov/mission/viper/rover-and-instruments/
- Terrain, illumination, power and route planning: https://science.nasa.gov/mission/viper/lunar-operations/
- Rocket mass ratio and delta-v: https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/

These references guide principles and capability descriptions. They do not certify the authored mass/credit/power tables, guarantee an ice location, or turn an Apollo-inspired south-pole game into a historical Apollo recreation.
