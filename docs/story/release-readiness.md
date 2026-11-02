# Mission debrief and local release verification

## Implemented behavior

The driving game remains the surface experience for both objectives. New model-4 runs use the immutable launched equipment and the existing W/Wh integration. Instrument survey/analysis occurs during the collection interaction. Readings remain untransmitted until sample delivery; collection alone cannot confirm water or identify a rock. Older models retain their numeric replay.

The final engineering report separates crew recovery, retained collected samples, samples returned to Earth, transmitted scientific evidence, and operational resources. It derives fuel, supplies, cabin energy, final battery balance and route trade-offs from the saved session. Battery start/end values are net balances after generation/charging; cumulative solar energy and minimum battery history were not recorded and are not invented. The supplied launch stage's TLI fuel is separate from service-module maneuvers.

A local comparison stores one explicit completed-attempt summary. It does not overwrite the mission save. Same-objective attempts show equipment mass, credits, battery, solar output, science points, returned samples and duration. Seed, route and assistance are shown because differences do not establish equipment causality. Route alternatives are calculated planning comparisons at the recorded launch mass, not predictions of discoveries or full mission reruns.

## Scientific assumptions and references

- [NASA VIPER instruments](https://science.nasa.gov/mission/viper/rover-and-instruments/): capability context for hydrogen, optical, drilling and gas measurements. Hardware numbers in the game are authored allocations.
- [NASA Moon water and ices](https://science.nasa.gov/moon/moon-water-and-ices/): lunar water context. A hydrogen clue alone is not confirmation.
- [NASA lunar composition](https://science.nasa.gov/moon/composition/): rock and mineral context. Geological signals are authored, not samples from a NASA instrument dataset.
- [NASA ideal rocket equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/): the physical relationship used for propellant calculations. Transfer times, maneuver allowances, spacecraft masses and specific impulses are authored teaching inputs.
- [Apollo 17 return](https://www.nasa.gov/history/50-years-ago-apollo-17-heads-home-to-earth/): architecture context for ascent, rendezvous, Earth return and ocean recovery.

No live terrain, ephemeris, instrument or discovery service is queried. Money, terrain, time compression, thermal thresholds, docking tolerances and scoring are educational game rules. The hard outcrop is a scripted setback. The game is not a validated trajectory, aerothermal, survival or crew-safety simulator.

## Supported devices and controls

Supported play target: laptop/desktop browser with WebGL, keyboard and mouse, in landscape. Visually checked viewport targets include 1280×720 and 1440×900; compact 844×390 landscape is a layout target, not a claim of touch-only play support. Physical phones/tablets, screen readers and browser combinations require device testing before certification.

- Rover: W/Up accelerator; S/Down brake/reverse; A/D or arrows steer. E interacts. Hold E at the solar station to charge. Mouse drag looks; wheel changes distance; C centers. M opens map. P/Escape pauses.
- Map: Tab/Shift+Tab stay inside; Escape closes and returns focus. Existing manual pause is preserved.
- Landing: A/D steer; Space slows descent.
- Return: A/D alignment, S brake, E contextual action. Native Enter/Space still activate focused buttons.
- Debrief: keyboard-accessible disclosure sections and comparison-save button. Comparison uses this browser's local storage; clearing site data removes it.

## Verification scope

`check-mission-debrief.mjs` drives both model-4 rover routes and then uses ordinary braking/alignment/orientation/parachute actions through debrief. It validates resources, evidence, samples, recommendations, comparison parsing and saved debrief reconstruction with floating-point tolerance. Its upstream preparation and launch fixtures are explicitly assisted; it is not an unassisted fresh-start browser playthrough.

`check-judge-tour.mjs` starts fresh progress for both objectives and exercises assisted page progression and saved checkpoints. This verifies the judge tour, not manual play of every minigame. Existing sample-run checks include retry, pause, save restoration and storage animation gates. The release report must distinguish browser checks from these reducer checks and identify any unexecuted device, offline or accessibility checks.

No commit, push or deployment is part of local release verification. Local working-tree contents differ from GitHub main; a final approved release candidate still needs a clean-checkout verification before submission.

## Verification record — 2026-11-01

- Passed: clean Vite production build with TypeScript; focused lint; whitespace check.
- Passed: both model-4 driven rover routes through ordinary return controls and debrief; resources, samples, evidence, recommendations and saved report reconstruction checked. Upstream preparation/launch was assisted.
- Passed: fresh-progress assisted judge-tour reducer checks for Ice and Geology (33 pages each), with save roundtrips.
- Passed: 128 production-preview JS/CSS and selected image/audio URLs returned HTTP 200 with non-HTML content types.
- Browser-exercised: Ice return from a valid assisted checkpoint, docking, Earth entry, parachutes, splashdown, debrief, Enter activation of comparison saving, and browser reload → Resume demo checkpoint. Completed Ice result and the saved comparison persisted.
- Browser-exercised: clean production origin, name entry, objective selection and reload/resume of Geology planning. The fresh Geology browser tour did not finish; Preview unavailable was observed during Skip. The direct reducer reproduction of that planning transition passed, so its browser failure is unresolved rather than attributed to a proven reducer defect.
- Observed update risk: pages left open while dist was rebuilt requested removed hashed chunks and showed Chapter paused. Reload/resume eventually recovered the saved Ice record. This is not a clean-version asset failure, but deployment/update recovery still needs explicit release testing.
- Pending: full manual fresh-start playthrough of both objectives; final debrief landscape/mobile visual pass; physical devices and screen readers; normal main-save browser reload independent of the isolated demo save. Browser control became unavailable before these checks could be completed.

Submission readiness is conditional. Automated checks do not replace the pending browser/device checks. Do not describe this record as a complete unassisted end-to-end browser certification.
