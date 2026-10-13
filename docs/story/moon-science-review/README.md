# Module 7 — laptop Ice Explorer science loop

Existing crewed landing and surface scout → science expedition planning → drive → NSS survey → optional TRIDENT excavation and on-site NIRVSS/MSolo analysis → return to Base → interpretation → transmission → science-ready endpoint. Module 8 incidents and Module 9 crew ascent/Earth return remain unimplemented. Geology science remains Module 10.

## Inputs and scientific limits

NASA reference: https://science.nasa.gov/mission/viper/rover-and-instruments/ . NSS measures neutron/hydrogen clues; hydrogen alone does not prove ice. TRIDENT exposes regolith cuttings. NIRVSS examines infrared water/hydroxyl/mineral signatures. Optional installed MSolo examines gases released at the measurement site. The scene does not suggest a sealed sample is carried home for MSolo to examine.

The authored scenario matrix is stable per mission seed and site. Ground type and burial depth are independently keyed. Children see only instrument readings, not hidden composition. An accessible sunlit reference site produces a useful negative. Other sites can produce water, hydroxyl, dry or mixed readings. A deeper sample can reach a buried layer, but never guarantees water. Mixed/weak readings remain inconclusive. Two clear independent water signatures support the simulation’s Water detected finding; mineral-only high-quality readings can support No water detected in that sample. These are qualitative rules, not real detection thresholds or a verified ice abundance measurement. No actual NASA discovery is awarded.

Records retain objective, stable observation ID, waypoint/location, instrument, observation time, sample ID, deepest 10-cm cuttings interval, signal, quality, confidence, finding, points and transmitted status. Drilling exposes material at the site; the visual cuttings pile stays there. This module does not package a physical Earth-return sample.

## Gameplay and accounting

Players select a sunlit lookout, shadow edge or crater-floor expedition; scan-only or scan-and-sample; depth 10–100 cm in 10-cm increments; and whether to use an installed optional gas instrument. The return route and all measurements are programmed before departure. Behind a radio-blocking ridge, the vehicle executes its existing plan, stores observations and returns to the base link before taking new commands. Pause is an interface action, not a remote rover command. This simplified autonomous feature is an authored game mechanic.

Waypoint routing, rover grade/camera capability, solar illumination, headlight loads, thermal exposure, battery integration, crew cabin energy/supplies and Earth-return reserves all reuse Module 6. Science uses the same W/Wh integral as readiness: NSS operates for two virtual minutes; drilling uses 30 seconds per 10 cm with TRIDENT’s declared game peak replacing normal drill load; NIRVSS and optional MSolo operate together for three minutes; transmission costs one minute of standby/radio load. The full conservative forecast covers outward route + task + return to Base + transmission + 20% battery reserve, preserving crew return/contingency resources. Sunny generation can cover a load; the UI shows actual W and the forecast rather than inventing battery drain.

Fixed presentation frames are 30 survey, 50 drill, 40 analysis and 25 transmission, at 0.1-second steps. Existing 80-frame route legs are reused. Virtual resource expenditure is independent of UI timing. Menus, hints, hidden tabs and Pause suspend the simulation. Rendering never advances resources. Sound effects are interface/operator feedback, not sound through lunar vacuum. Recorded male/female voices reuse established identities and the app’s 1.5× narration setting.

## Evidence and recovery

Each site awards NSS 4 SP, NIRVSS 8 SP and optional MSolo 6 SP once per instrument. TRIDENT excavation gives 0 SP. A different depth can add evidence but cannot farm additional instrument points at the same site. Useful negatives and inconclusive measurements remain useful science. Repeated identical measurements are blocked; a later gas measurement is allowed if previously omitted. Buying tools or rehearsal does not earn points.

Stored and delivered points are separate. Transmission requires a linked idle vehicle; a sampled finding must first match its observed evidence. Incorrect interpretations show a short corrective prompt, not arbitrary lost lives. Optional further expeditions preserve prior records. Completion requires transmitted analyzed evidence, an accepted interpretation, an idle rover at Base and sheltered crew. The last screen explicitly stops before the unimplemented crew-return chapter.

Save v8 retains v7 and earlier keys read-only as migration fallbacks. The science origin is a verified replay of Module 6, followed by bounded science command/frame receipts. Restore recomputes readings, resources, score and transmission; saved numeric totals and success flags are not trusted. Active operations reopen paused. Failed-expedition retry replays its successful prefix, restores that expedition’s start and records assistance; it cannot accumulate free repeated science.

## Delivery and review

Module 6 archive: `/Users/asifhasan/.codex/backups/zero-to-beyond-module6-20261013.tar.gz`.

Per user instruction: laptop only, no automated tests, lint, production build, push or deployment. Primary verification is source review: reducer gates, dimensionally correct loads/time, deterministic receipts, duplicate prevention, save reconstruction, lazy scene import, effect/listener cleanup and GPU disposal. One isolated browser science expedition is used only to catch a rendering/navigation failure and confirm the sample → interpretation → transmitted endpoint integration. No full-game video/replay was performed.

Manual integration observation: the isolated Science demo reached Base with its existing selected kit and 220 Wh. A 20-cm sunlit-lookout sample produced a weak NSS clue and a clear mineral-only NIRVSS reading. Selecting No water detected unlocked Send finding. Transmission delivered all three measurement/excavation records and retained exactly 12 SP. After the development reload, Resume demo checkpoint reconstructed the same location, 119 surface minutes, evidence, finding, transmitted status and 12 SP; it did not add points.

Hydrogen, hydroxyl, evidence and confidence now have child-friendly glossary explanations and recorded male/female narration. Instrument cards include a visible gas-tool-not-fitted/off state instead of silently implying a measurement was taken.

Final navigation/layout check: Science complete opened `science-ready` with the accepted negative finding, 3/3 records delivered, 12 measured/sent SP, radio linked and rover at Base. The laptop viewport fits the header, control panel, 3D scene, three evidence cards and fixed footer without document scrolling. Final proof is `science-ready.jpg`. Confirmed/inconclusive branches, optional gas loads, duplicate handling and failed-trip recovery were source-reviewed, not exhaustively browser-tested.
