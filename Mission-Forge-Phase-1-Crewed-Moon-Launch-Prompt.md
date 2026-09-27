# MISSION FORGE — Phase 1: Crewed Moon mission, through Earth parking orbit

Antigravity implementation prompt • Exovisionaries • 26 September 2026

This is a standalone replacement for the earlier full-game prompt. Give Antigravity this file only for the first implementation. The earlier prompt's Mars, landing, surface operations, mission debrief, and Decision Replay requirements do not apply to this phase.

---

## 1. Assignment and exact stopping point

Build **MISSION FORGE**, a premium-looking, story-led 3D educational web game for Exovisionaries. Implement one complete first chapter: preparing and launching a **crewed Moon expedition** into **Earth parking orbit**.

The player is the mission commander. The active mission is **Lunar South Pole Ice Explorer**. They receive a briefing, choose a site concept, configure the scientific payload and crewed spacecraft, assemble a coherent launch stack, select three crew members, resolve launch-readiness issues, and experience the launch of their assembled vehicle.

**Finish exactly at “Earth parking orbit reached.”** The crew remains in Earth orbit. Do not execute translunar injection, separation/docking for lunar transfer, flight to the Moon, lunar orbit insertion, landing, rover exploration, EVA, storms, sample analysis, return flight, or full-mission scoring.

Other destinations and mission types must remain visible where appropriate. Clicking Mars, Moon Geology Explorer, Moon Volcanic Features, or a later chapter must open a polished accessible **Coming soon** dialog. Explain the feature in one sentence and return focus correctly on close. Never navigate to a blank page or secretly implement the full feature.

This is a playable first chapter, not the complete Space Apps challenge submission. Later chapters will continue from the saved mission configuration. Do not portray reaching Earth orbit as achieving lunar ice discovery or completing a lunar expedition.

Complete the implementation first, then perform one brief final check and deliver the build for the user's manual review. Use small implementation milestones internally, but do not run tests or browser-verification loops after each milestone. Remain strictly within this phase; do not stop after a landing page or a static mockup.

**Testing preference — applies throughout this prompt:** The user will manually review the game. Do not repeatedly run automated tests, browser checks, screenshots, performance audits, or full-flow replays during development. Do not create a new testing framework or extensive test suite for this task. After all implementation and visual work is finished, perform one lightweight final build-and-smoke-check session as described in Section 13. If that session reveals a blocker, fix it and recheck only the affected behavior or failed build; do not restart the full checklist. Reading code, checking documentation, and fixing an observed compiler/runtime error are ordinary implementation work and do not require a broad test run.

## 2. Source story and product references

Story source: [NASA Space Apps Challenge 2026 — team planning document](https://docs.google.com/document/d/14OlD6AqRhN-i2wRsvcLuLBGgkDYLVBCeYxlHJytqwvg/edit).

Its tabs are **basic idea** and the nested **MOON mission**. Relevant content has been carried into this specification so implementation does not depend on connector access. The source story includes a commander, mission/site choice, engineering constraints, spacecraft/instrument selection, crew selection, launch, and later exploration. Preserve its crewed expedition premise; the user has explicitly deferred robotic missions.

Previous visual reference: [Exovisionaries website](https://exo-visionaries.vercel.app/). Team context: [2025 project page](https://www.spaceappschallenge.org/2025/find-a-team/exovisionaries/?tab=details).

Inspect the old website if browser access works. Record a short observation-based visual audit before adapting its strengths. Its rendered design was not inspected while preparing this prompt because a browser security check was unavailable. Do not pretend its colors, layout, or motion have already been verified, and do not bypass security controls.

Follow this new phase specification over the older master prompt. The source document's example numbers, such as $500M, 1,500 kg surface payload, 2,000 W, and 14 surface days, are planning examples—not a verified three-person lunar vehicle specification. In particular, do not treat a surface-payload allocation as the total crewed spacecraft mass.

## 3. Narrative and screen flow

Use this exact playable progression:

**Welcome → destination → science mission → site briefing → spacecraft/payload assembly → crew → launch readiness → launch pad → ascent → Earth parking orbit.**

A clear top progress indicator should allow returning to earlier preparation steps. Preserve selections and explain any incompatibility resulting from a change. Once launching, fly an immutable snapshot of the approved design.

### Welcome

Headline: **Your mission starts before liftoff.**

Supporting text: **Lead a crewed lunar expedition. Choose your science, assemble your spacecraft, and earn a clear-to-launch decision.**

Actions: **Begin mission**, **Continue preparation** when saved, and a secondary **Quick launch demo** using a visibly disclosed preconfigured manifest. The demo must use the real launch flow, not a separate fake video.

Show a hero rocket in an aerospace assembly hall with a restrained cinematic presentation. Provide a lightweight poster while 3D loads. Avoid long introductory videos, mandatory login, and a marketing page the player must scroll through before playing.

### Destination and science mission

Moon is playable. Mars opens Coming soon. Inside Moon, only **Lunar South Pole Ice Explorer** is playable; Geology and Volcanic Features open Coming soon.

Briefing copy should explain that the future expedition investigates the distribution and accessibility of lunar water ice. This chapter equips and launches the expedition; no discovery is made yet.

Use a fictional mission-control voice through text and optional captions. Do not require generated voice audio or a live AI service. A useful briefing line is: **“Commander, your crew needs a spacecraft that can carry the right science—not just reach the launch pad.”**

### Site planning

Present the document's three site concepts with a realistic Moon visual and concise trade-offs:

1. **High-illumination ridge — recommended:** more favorable solar opportunities; the future expedition must travel farther toward shadowed targets.
2. **Ice-proximity crater rim:** closer access to shadowed terrain; stronger power, terrain, and navigation planning requirements.
3. **Permanently shadowed region:** no direct solar illumination, severe thermal/power constraints. Show as **Advanced site — Coming soon** in this first phase. Explain that the first crewed version plans a sunlit base with later access to shadowed science targets, instead of pretending a solar-powered crewed base can operate indefinitely inside permanent shadow.

The first two choices should affect recommended equipment, payload planning, and concise readiness advice. They need not create two separate launch simulations. Never fabricate an exact real landing coordinate, illumination schedule, terrain hazard score, or certified safe site. Label the site previews **Illustrative planning concepts**.

### Assembly

Use a real 3D hangar with three focused views: **Science payload**, **Crew spacecraft**, and **Full launch stack**. This keeps individual components large enough to manipulate while still letting players assemble a full rocket.

Left panel: inventory with categories and recognizable part renders. Center: large 3D viewport. Right: selected-part details, mission manifest, and remaining constraints. Bottom: undo/redo, view controls, contextual instruction, and Continue.

Start with structure and clear empty attachment points, not a completed spacecraft hidden behind a checklist. The player should visibly install both important spacecraft systems and large launch-stack modules. Group complicated hardware into believable subsystem assemblies; do not make them drag hundreds of bolts.

### Crew

Require exactly **three fictional astronauts** selected from a small roster. Use realistic original/licensed portraits or consistent illustrated portraits, not emoji faces or real astronaut identities with fictional attributes.

Provide Commander/Pilot, Mission Scientist, and Systems Engineer role coverage, with qualified backup candidates. Let players assign roles or show a clear reason a selection lacks required coverage. Use concise qualifications and mission relevance, not arbitrary numerical “charisma” or “luck” bonuses.

Mass/consumables accounting must use one documented planning allowance per seat and mission duration, not stereotypes based on portraits, gender, or nationality. Candidate expertise changes briefing/planning guidance now; later surface effects remain future data. Do not claim skills currently affect gameplay that has not been built.

The three people are the expedition crew. Surface crew allocation and lunar operations are not decided by this launch chapter. Do not silently promise that the three-seat capsule is a lunar lander or that all crew will descend in a historically two-person Apollo lunar module.

### Readiness

Check missing systems, assembly compatibility, crew/seat coverage, launch payload envelope, electrical compatibility, science-manifest requirements, budget, and launch safety equipment.

Label the result **Launch readiness**. It is not a claim that the entire future 14-day surface mission has been qualified. Separate **Launch blockers** from **Later-mission planning notes**. Notes must not look like unexplained red failures.

Each blocker has a concrete reason and **Show component** or **Fix selection** action. Never display arbitrary “Crew safety 94%,” “Landing capability 76%,” or “Mission success 99%.” Use clear pass/fail criteria and evidence-backed explanations.

### Parking-orbit endpoint

Show Earth below the assembled orbital stack and display:

**EARTH PARKING ORBIT REACHED**

**Launch chapter complete. Your crew is in Earth orbit. Lunar departure is the next chapter.**

Offer **View launch manifest**, **Replay ascent**, **Return to hangar**, and **Lunar departure — Coming soon**. Save the mission, crew, parts, site, budget, and launch snapshot. No lunar science score, fake discoveries, or automatic continuation.

## 4. Coherent crewed vehicle architecture

Use a **generic Apollo-inspired three-stage heavy-lift educational architecture**, with a three-seat crew capsule, service module, an enclosed future lunar-payload/lander package, payload adapter, instrument/guidance unit, and launch escape system.

This is a fictional educational vehicle using recognizable architectural principles, not a claim that Saturn V is commercially available today or that a new spacecraft is flight-certified. If using a real historical visual reference, identify it accurately. Never combine branded engines and modules from unrelated launch vehicles and call the result realistic.

Show meaningful physical modules, approximately bottom to top:

- First-stage propulsion/tank assembly.
- First interstage.
- Second-stage propulsion/tank assembly.
- Second interstage.
- Third-stage orbital-insertion/departure assembly.
- Guidance/instrument section and payload adapter.
- Enclosed lunar payload package, stowed for this chapter.
- Service module.
- Three-seat crew capsule.
- Protective/escape-system elements appropriate to the chosen reference architecture.

The flight sequence ends with the spacecraft still in the appropriate parking-orbit configuration. Do not discard the departure stage that the later chapter requires. Do not open the lunar payload enclosure or perform post-departure docking before the configured mission phase.

NASA's Apollo 10 account describes a three-stage ascent into parking orbit while attached to the third stage, followed later by a separate translunar-injection burn. Use that separation of phases as the reference, rather than treating liftoff, orbit, and lunar departure as the same event. [NASA Apollo 10 reference](https://www.nasa.gov/history/50-years-ago-apollo-10-to-sort-out-the-unknowns/)

Essential crew systems include a pressure vessel/crew module, environmental control and life support, oxygen storage and CO2 removal, electrical power, thermal management, flight control/navigation, communications, crew seats/restraints, and launch escape provisions. Use packaged interfaces and inspectable internal bays rather than attaching these externally at arbitrary points.

The launch package fixes compatible engine/tank families and performance profiles. The player assembles its large modules and configures allowable spacecraft/payload options. Do not simulate fluid plumbing, chemistry, unrestricted engines, or human-rating certification.

## 5. Science inventory and meaningful choices

Use authentic generic names:

- Neutron spectrometer — measures hydrogen-related signatures that can guide an ice investigation; not direct proof of ice by itself.
- Near-infrared spectrometer — material/volatile investigation with suitable illumination or a specifically modeled active light source.
- Subsurface drill and sample-handling assembly — enables the later collection of subsurface material.
- Sample-analysis mass spectrometer — part of a compatible sample preparation/analysis package, not a magic standalone rock scanner.
- Navigation and context camera assembly.
- Radiation-monitoring instrument.
- Optional additional science camera, spare battery module, backup radio, improved navigation sensor, or spare-parts package.

For this chapter, parts affect mass, cost, power interfaces, capacity, and the stored future science capabilities. Do not build scanning, drilling, rover driving, sample analysis, or EVA gameplay.

Choose a manageable catalogue of roughly 20–26 meaningful assemblies across vehicle, crew systems, science, and upgrades. Provide only a few justified alternatives. Core human-support and escape systems are mandatory; players must not trade them away for extra science and still get a green launch decision.

Use a compact mission-specific payload allowance to make instrument choices meaningful without redesigning the heavy-lift launcher. Show **Science payload allocation** separately from **Spacecraft launch mass** and **Full rocket liftoff mass**. Never make a 1,500 kg payload limit apply to the entire crewed lunar stack.

Every card needs a realistic thumbnail, engineering name, plain-language subtitle, cost status, mass, and relevant power/capacity. On hover, focus, or tap, explain **what it does, why it matters, and what it costs in resources**. Use expandable detail for sources and assumptions.

At least two valid science/upgrade combinations must fit the same core spacecraft. A larger battery costs mass and money; extra instrumentation consumes payload allowance. The first chapter should make those trade-offs visible without pretending it has simulated future surface results.

## 6. Pricing and quantitative honesty

Display aerospace-scale USD, such as `$250k` or `$12M`, with a consistent **Est.** label for authored allocations. Store a price status: `published`, `historical`, `educationalEstimate`, or `includedInPackage`, plus source/scope/date where available.

Many mission systems do not have public retail prices. Do not invent a manufacturer quote. Authentic names and credible order of magnitude are useful; unsupported exact prices presented as facts are not.

Do not reuse the previous robotic $150M scenario, Firefly CLPS cost, or SSO rideshare price as a validated cost for this crewed expedition. The source story's $500M is also not a researched crewed mission quote.

For implementation, use a clearly labeled **educational planning budget**. An initial authored budget model may use these broad allocations, expressly not vendor quotes or researched subsystem valuations:

| Line | Authored game allocation |
|---|---:|
| Heavy-lift launch vehicle/service package | $1,400M |
| Crew capsule and included core crew-support systems | $350M |
| Service module and included propulsion/power support | $180M |
| Reserved lunar-payload/lander package | $300M |
| System integration/qualification allocation | $100M |
| Ground/launch operations allocation | $70M |
| Reserved contingency | $200M |
| Configurable science/upgrade allowance | $20M |
| **Game planning cap** | **$2,620M** |

The first six lines total $2,400M. Add $200M reserved and at most $20M discretionary allocation. Unused discretionary funds are not spent. These are rounded game-design assumptions, not a cost prediction for any real mission. Keep them in data files and document any rebalancing.

Core launch/crew modules included in a package have visible resource characteristics but no second independent purchase price. Installing an included oxygen/life-support unit must not charge both its parent package and an invented retail fee. Keep an accounting tree so subtotal and inclusion boundaries are inspectable.

Required science components draw from the $20M allocation before optional upgrades. Define an authored, documented science catalogue in which at least two complete useful manifests fit and some over-equipped manifests exceed cost or mass. Do not populate prices randomly at runtime. Hardware mass/power figures need their own `sourced` or `assumed` status; a cost reference does not validate their specifications.

Store currency as integer dollars or another consistent money type. Add/remove/replace/undo must restore exactly the right cost. Reserve, committed cost, and available allocation must remain distinct.

## 7. Visual direction and realistic icons

Make the game feel like a premium aerospace assembly studio. The spacecraft must dominate the screen, with clean, readable control surfaces around it.

Suggested palette: deep navy `#060A12`, solid panels `#0D1522`, elevated panels `#142032`, white text `#F2F5FA`, secondary `#A7B6C9`, cyan action accent `#64D8ED`, amber warnings, coral errors. Choose accessible text/background contrast and refine after inspecting the previous website; do not start a separate audit cycle.

Use restrained Space Grotesk/Inter-style typography, with monospace for numerical telemetry only. Avoid tiny cinematic text, excessive neon, meaningless charts, stock dashboard tiles, heavy full-screen blur, and an emoji-based interface.

Rocket materials: thermal white, dark structural sections, subtle metal, realistic nozzle interiors, limited gold thermal insulation, readable labels, and coherent scale. Small surface details should enhance the silhouette without making loading expensive.

Part icons are **cached miniature renders of their actual 3D models**, with the same studio lighting, angle, and framing. Use simple accessible vector icons for UI actions. Do not create one live WebGL canvas per inventory card.

Desktop assembly: approximately 280 px inventory, flexible central scene occupying most of the space, approximately 300 px inspector. At 390 px width, use the scene plus a bottom-sheet inventory and compact status strip. Never squeeze desktop columns onto a phone.

Use subtle assembly clicks, calm radio-style cues, and an immersive but controllable launch soundtrack. Audio must begin only after interaction, default to a clearly controllable state, and have captions/text equivalents. Reduced-motion mode removes camera shake, auto-orbit, and decorative movement.

## 8. Drag-and-drop, assembly, and editing

Implement genuine inventory-to-canvas dragging, not only a button pretending to drag. Use a shared pointer controller, canvas-relative coordinates, raycasting, slot hit targets, and one atomic install operation.

On pickup: highlight compatible, empty, visible slots. On hover: align a translucent part preview to the exact slot orientation. On valid drop: snap and confirm. On invalid drop: return to inventory and state the reason. Add part labels to highlights so color is not the only cue.

Each slot stores ID, parent transform, accepted part types, interface class, prerequisites, occupancy, and an accessible name. Prevent duplicate installs, overlap, arbitrary engine placement, and installing inaccessible internal hardware through a closed enclosure.

Provide cutaway/exploded views for crew/support systems and a full-stack view for large modules. A **Focus compatible slots** action should help players find hidden locations. Closing a bay should never permanently prevent editing it.

Disable camera orbit during drag and restore it on drop, Escape, pointer cancellation, loss of capture, or window blur. Do not update React application state every animation frame. Do not disable page scrolling globally to solve touch interaction.

Provide equal-function **select part → choose slot → install** controls for touch and keyboard, plus an accessible DOM assembly list. Support remove, replace, undo/redo, reset view, and save/resume. Moving an installed part must not buy it again.

The launch snapshot must match the approved assembly. Returning to the hangar creates an editable copy; replaying ascent uses the original snapshot.

## 9. Launch readiness and flight representation

Keep these separate:

1. **Preparation model:** actual configuration accounting and rule checks.
2. **Ascent model:** one documented, bounded reference-based ascent profile for the compatible vehicle family.
3. **Cinematic rendering:** cameras, particles, sound, and animation driven by flight events.

Do not attempt a complete aerospace simulator in this chapter. An explicitly labeled educational reference profile is acceptable. It must produce consistent telemetry/events and must not make the same arbitrary animation “succeed” for incompatible or overweight configurations.

Before launch, validate payload mass against the selected reference profile's declared payload envelope, crew modules, required systems, interface compatibility, power connections, reserve assumptions, budget, and completed assembly. Validated variants can use the same bounded reference trajectory; disclose that this is not a fully coupled custom-vehicle flight solver.

If calculating ideal delta-v, use consistent SI units and proper stage mass accounting. For the same trajectory, adding payload generally reduces available delta-v at fixed propellant; do not teach “mass automatically increases required trajectory delta-v.” Do not use the source document's approximate delta-v table as a universal flight specification.

Power is W; energy is Wh. Crew/support and science loads must be tagged by phase; stowed science instruments need not draw their full surface-operation loads during ascent. Do not require a deployable solar panel to be extended inside an enclosure at launch. Do not infer 14-day surface survival from one instantaneous power balance.

Mission time and animation time are distinct. Pause/resume and **Skip to orbit** advance the same event/state sequence, preserving the manifest, rather than executing a separate success shortcut. No random failures in this first guided chapter. Hold/resume belongs to countdown; in-flight pause is a playback/simulation control, not a real rocket hovering in place.

Orbit requires the reference flight state to satisfy the defined insertion conditions. Never declare orbit solely because altitude exceeds 100 km. State the profile's speed, trajectory assumptions, and orbital endpoint; any displayed orbital elements must be consistent with that profile.

## 10. Cinematic sequence

Build a restrained approximately 45–70-second compressed sequence, with captions and skip/replay:

1. Approved assembly shown in the hangar.
2. Brief pad establishing shot of the same vehicle.
3. Crew/ground readiness callouts and user-controlled Begin countdown.
4. Countdown with Hold/Resume before ignition.
5. Ignition, hold-down release, and liftoff.
6. Gradual pitch-over and ascent with a physically coherent horizon.
7. First-stage cutoff and separation; second-stage ignition.
8. Escape/protective-system jettison at the chosen reference profile's appropriate phase.
9. Second-stage cutoff/separation and third-stage insertion burn.
10. Insertion cutoff, quiet coast, Earth parking-orbit endpoint.

Use a few strong camera compositions: wide pad, restrained ignition close-up, upward tracking, distant ascent, staging, and orbital reveal. Maintain spatial continuity; never let objects clip through the capsule or show a different payload after a cut.

Atmospheric smoke is appropriate near the pad. Avoid billowing atmospheric smoke in vacuum. No giant transparent cockpit over the rocket nose, no crew capsule hidden inside a conventional cargo fairing, and no deployed lunar landing legs during ascent.

Minimal HUD: mission phase, mission elapsed time, altitude, speed, active stage, and reference propellant state. Numbers must derive from the profile/model rather than unrelated random counters. Label time compression and simulated telemetry once in a clear, compact way.

Do not include a TLI burn, lunar-transfer camera shot, lander deployment, rover deployment, Moon arrival, or a full-game results screen.

## 11. Technology, persistence, and future continuation

For a fresh project prefer React + TypeScript + Vite, Three.js through React Three Fiber/Drei, a small typed store such as Zustand, schema validation, and a typed mission-flow state machine. Check compatible stable package versions and commit a lockfile. Reuse an existing suitable stack rather than replacing it without reason.

No backend, authentication, database, paid API, live AI, or general rigid-body physics engine is required. Use accessible UI primitives as needed; prioritize the game rather than library count.

Keep modules focused:

```
src/
  app/
  features/briefing/
  features/assembly/
  features/crew/
  features/readiness/
  features/launch/
  scene/
  engine/accounting/
  engine/validation/
  engine/ascent-profile/
  data/parts/
  data/missions/
  data/crew/
  data/sources/
  state/
  components/
```

Save a versioned record containing mission ID, site concept, component instances and slots, crew/roles, computed budget inputs, future capability tags, readiness report, active preparation step, and launch snapshot/profile version. Do not keep derived totals in several conflicting places.

Use local storage or IndexedDB with schema validation, safe recovery, and debounced saves after meaningful actions. Import/export may be added only if inexpensive; it is not a reason to delay the main loop. No public uploads.

At the orbit endpoint, save `phase: earthParkingOrbit` and future chapter data. That is enough for extension; do not build empty lunar-operation systems, unused AI infrastructure, or speculative multiplayer scaffolding now.

Coming-soon dialogs must not alter the selected mission or overwrite the save. When returning to preparation, preserve the player's completed launch record and editable configuration distinctly.

## 12. Assets, performance, and accessibility

Use original or appropriately licensed models. NASA models/textures can be candidates, but inspect individual credits and usage guidance. Do not imply NASA endorsement. Use GLB/glTF with named components, clean attachment pivots, and consistent units.

Do not ship placeholder cubes as finished spacecraft parts. If a licensed model is unavailable, build a recognizable original procedural assembly with sensible geometry/materials. Do not stall the whole game waiting for a photorealistic asset.

Use one main canvas, cached thumbnails, shared geometry/materials, compressed assets, lazy-loaded 3D code, capped pixel ratio, and automatic quality reduction. Render on demand in an idle hangar and continuously only during active interaction/animation. Avoid per-frame React store updates and unnecessary full-screen effects.

Design targets, not mandatory benchmarking tasks. Do not claim measured performance unless it was actually measured; extensive profiling is deferred to later user feedback:

- Aim for approximately 60 fps on an integrated-GPU laptop, with an adaptive 30 fps mode for mobile; these are targets, not verified results.
- Fast initial UI; aim for roughly 2.5-second LCP without running a separate Lighthouse or benchmarking campaign in this phase.
- Aim for the first playable mission's assets within roughly 8–12 MB transferred; load launch-specific scenery later.
- Start with a modest scene budget, around 150 draw calls and 200k visible triangles on medium quality. Optimize obvious waste during implementation; investigate further only if a concrete performance problem appears.

Add loading feedback, retry, asset fallbacks, and WebGL context-loss handling. A lightweight 2D slot/list assembly fallback should share the same manifest, validation, crew selection, and endpoint flow. It may use a simple illustrated ascent presentation when WebGL is unavailable; disclose the mode.

All important controls must work with keyboard and touch. Use visible focus, adequate contrast, text labels, roughly 44 px touch targets, reduced motion, captions, and mute. Tooltips must work on focus/tap. Do not announce rapidly changing telemetry repeatedly to screen readers.

Ship polished English. Keep text organized for later Bangla translation, but a localization system must not grow into a second project in this phase.

## 13. One lightweight final check; user-led manual review

Finish the entire requested chapter and its visual work before starting this check. Do not test after every feature, component, milestone, or styling change. Do not install Playwright/Cypress, write broad unit/integration suites, run repeated screenshots, or perform a device/browser matrix merely to satisfy this prompt.

Perform **one short final check session**:

1. Run the production build once, including the project's normal type check if it is part of that build. Fix compilation blockers if found and rerun only the failed build/check.
2. Make one browser walkthrough: start Moon Ice Explorer, install a part, check that the manifest updates, select the crew, obtain launch clearance, and reach Earth parking orbit. Use a prepared valid configuration to avoid repeating the entire assembly if needed, while still checking one real installation.
3. During that same walkthrough, confirm one Coming soon action and glance for obvious broken assets, unreadable/overlapping controls, or blocking runtime errors. A quick narrow-viewport glance is enough; no screenshot collection or exhaustive responsive audit is required.

If a blocker is found, fix it and recheck just that behavior. Once the brief session passes, stop testing and hand over to the user. Do not repeat the entire walkthrough to gain extra confidence, and do not claim comprehensive testing or measured performance.

The following remain implementation requirements, **not instructions to execute additional test passes**: compatible slots; correct package accounting; remove/replace/undo behavior; three crew with role coverage; mandatory crew/escape systems; budget and mass validation; coherent staging; preservation of the departure stage; consistent skip/replay state; save/resume; responsive controls; reduced motion; and the Earth-orbit stopping boundary.

Provide a concise manual-review note for the user naming the main controls and any known unfinished or unverified behavior. The user will perform the detailed visual and gameplay review and report issues for targeted follow-up.

## 14. Work order and final deliverables

Implement in four bounded passes:

1. **Functional chapter:** navigation, data models, assembly state, crew, validation, save/resume, and a simple launch-to-orbit state sequence.
2. **3D interaction:** coherent vehicle modules, true dragging, cutaway views, realistic thumbnails, and camera controls.
3. **Visual finish:** materials, lighting, responsive panels, crew portraits, audio/captions, and cinematic ascent.
4. **Final handoff:** one lightweight build-and-smoke-check session under Section 13, targeted blocker fixes if necessary, and a short manual-review note for the user.

Do not expand to the next chapter when this one starts working. Spend remaining effort making this chapter clear, attractive, responsive, and reliable.

Deliver source and lockfile, the local setup and production build, launch-only README, source/asset credits, a short assumptions document, a progress file for continuation, and a concise account of the single final check. Screenshots, test suites, and performance reports are not required. Disclose known issues and unverified areas, then leave detailed review to the user. Configure deployment if needed; do not claim a public URL exists unless actually deployed and verified.

The final experience must prove: **I chose my mission, equipped a crewed spacecraft, assembled a believable rocket, fixed real preparation issues, launched that exact vehicle, and reached Earth orbit.**

## 15. Reference links and evidence boundaries

- [Team story document](https://docs.google.com/document/d/14OlD6AqRhN-i2wRsvcLuLBGgkDYLVBCeYxlHJytqwvg/edit): authoritative creative direction, not validated engineering limits.
- [Previous Exovisionaries site](https://exo-visionaries.vercel.app/): visual reference to inspect.
- [NASA Apollo 10 history](https://www.nasa.gov/history/50-years-ago-apollo-10-to-sort-out-the-unknowns/): parking orbit precedes a separate TLI burn.
- [NASA Apollo 11 overview](https://www.nasa.gov/history/apollo-11-mission-overview/): historical spacecraft/adapter sequence and post-departure events; those later events are outside this phase.
- [NASA Apollo program](https://www.nasa.gov/the-apollo-program/): distinctions between command, service, and lunar modules; historical Apollo lunar module carried two people, not all three crew.
- [NASA Saturn V step-by-step](https://www.nasa.gov/wp-content/uploads/static/history/afj/pdf/saturn-V-step-by-step.pdf): reference ascent sequence and phase boundaries; verify detailed values before using them.
- [NASA Moon facts](https://science.nasa.gov/moon/facts/): environment reference.
- [NASA Small Spacecraft Technology](https://www.nasa.gov/smallsat-institute/sst-soa/): useful subsystem terminology; not proof that small-satellite hardware is suitable for crewed missions.
- [NASA CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/): imagery resources; global textures do not establish local landing safety.
- [NASA 3D resources](https://www.nasa.gov/3d-resources/) and [media guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/): asset discovery, credits, and conditions.
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html), and [React Three Fiber](https://r3f.docs.pmnd.rs/): current implementation documentation.

Keep references compact and inspectable in the app's Sources drawer. Field-level source status matters: a reference for a component's purpose does not validate its price, mass, mission duration, or crew safety.

Begin implementation now. Preserve the crewed Moon story and high visual ambition, and stop development at the Earth-parking-orbit chapter boundary. Follow the single-final-check policy; leave detailed testing to the user.
