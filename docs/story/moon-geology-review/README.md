# Module 10: Geology Explorer

Local laptop implementation on `feat/full-moon-foundation`. Module 9 was archived before editing: `/Users/asifhasan/.codex/backups/zero-to-beyond-module9-20261013.tar.gz`. No Git push/deployment or automated tests/build/typecheck/lint was run. Verification uses source review and a short isolated localhost chapter walkthrough.

## A different mission

New Geology selections are **Lunar highlands** and **Ancient impact crater**; Ice retains its own rim/shadow choices. The geology scout visits the light-rock patch and returns to Base, rather than requiring an ice shadow-edge visit. Shared crew, readiness, transfer, landing, battery integration, supplies, incidents and crew return remain authoritative.

Surface sites: light-rock patch, lava fragments, crater ejecta. The terrain/communications graph is authored and shared for predictable resource comparisons; its visible labels and rock patches depend on the objective. This is not a NASA terrain product or surveyed real landing location. Highland and crater bases affect the stable illustrative rock scenario, rather than merely changing a title.

Camera and optional GPR survey → surface scoop or depth-limited drill collection → fitted IR/XRF/XRD analysis → optional quiet-ground sensor deployment and listening → safe route home → evidence interpretation → transmission → samples stowed → crew ascent/docking/Earth return/recovery → Geology debrief.

## Tools and receipts

- Camera: rock texture/photo context; cannot alone identify a mineral or rock.
- IR: mineral light signatures, with dust/calibration quality effects.
- XRF: elemental clues; not crystal mineral identity.
- XRD: crystalline mineral patterns; requires a **collected sample ID**.
- GPR: point-scan echo boundaries, not chemical identification or a whole-Moon interior map.
- Seismometer: place off the rover on quiet ground, then record a ten-virtual-minute **training trace with a calibration pulse**. No natural Moonquake rate, depth, crust thickness or interior discovery is invented. Behind a blocked radio link, only the sensor plan programmed before departure can deploy automatically; a new live command is refused.
- Scoop: 0-cm surface sample, 60 virtual seconds, no deep-drill slider.
- Drill: depth ceiling from the installed tier (30/60/100 cm). Time/energy use the same depth-dependent model as readiness.

Tiers improve authored detail and quality. Stable anorthosite-, basalt- and breccia-like clues are not NASA observations. Two mutually supporting analytical families are required for a named interpretation. Breccia additionally needs angular joined-fragment camera context; a mixed soil spectrum alone is insufficient. Radar/seismic data cannot substitute for composition evidence. A weak or unsupported classification remains inconclusive, not a fabricated success.

First delivered useful family measurement/site points: camera 2; IR 6; XRF 6; XRD 8; GPR 5; seismic trace 6. Collection and purchases earn zero. Repeated depth, tier or repaired readings at the same site earn no extra family points. Individual recorded quality and signals survive repair. Food, cabin energy, rover battery, solar/thermal constraints and the route home are still integrated, not presentation-only.

Tool Wh is gross energy consumed. Battery Wh is net energy after available solar; in sunlight a solar array can cover the full load and leave the battery full. The forecast shows tool energy instead of implying that a zero battery deficit means no work occurred.

## Real physical samples

Collection creates a unique labeled 0.2-kg game sample with site/depth provenance, capped by the supplied platform's 10-kg sample allowance. At Base, **Stow rock samples** transfers samples to a sealed return box and consumes time/energy. Ascent is gated by those stow receipts. The return fuel calculation retains the existing conservative 10-kg allocation, so the small acquired samples do not exceed an unmodeled payload allowance. The rover and deployed sensor stay on the Moon; crew, measurements and sealed samples return to Earth.

Ice retains zero physical sample return; its earlier exposed-cuttings activity is not silently changed into sample collection. Geometry provides visible different rock patches, scoop-arm motion, drill movement, ground sensor and listening feedback. Sampling/testing still uses the actual fitted tools.

## Preparation, saves and demo

Balanced example now explicitly includes the required surface scoop. Catalog totals remain computed, not copied. The all-family basic geology demo is assembled within the real budget, then passes normal crew/readiness/flight/landing/scout gates. It opens before any science, sample or finding has been granted. Demo state is isolated from the ordinary saved mission.

Save v11 keeps v10–v2 fallback; demo v11 keeps v10–v5 fallback. Science rebuilds from its frozen surface origin and bounded commands, including collection, sensor placement/listening, claims, transmission and sample stowing. Return rebuilds the same way. Old Ice saves retain their existing evidence model. Older Geology designs with Ice-only landing-site selections must choose a valid Geology site and revalidate their retained equipment/crew; obsolete approval/flight flags cannot bypass the changed site.

## Sources and limits

- [NASA Moon composition](https://science.nasa.gov/moon/composition/): highland/crust and basalt/mineral context; Moon interior observations.
- [NASA XRF/XRD technology](https://heasarc.gsfc.nasa.gov/docs/nicer/technology/spinoffs/materials-analysis.html): element and crystal mineral analysis capabilities.
- [NASA LRO geology overview](https://www.jpl.nasa.gov/news/nasas-lro-exposes-moons-complex-turbulent-youth/): calcium/aluminium-rich highland rocks and iron/magnesium-rich mare rocks.
- [NASA LEMS](https://science.nasa.gov/missions/artemis/nasa-completes-astronaut-deployed-science-instrument-for-lunar-surface/): continuous, long-term seismic monitoring; the short game trace is not equivalent.
- [NASA radar instrument context](https://pds.nasa.gov/ds-view/pds/viewContext.jsp?identifier=urn%3Anasa%3Apds%3Acontext%3Ainstrument%3Amars2020.rimfax): ground-penetrating radio echo capability; not a claim that this Mars instrument flew on a crewed lunar rover.

Scores, prices in game credits, tool tiers, samples, traces, scenario signals and numeric thresholds are authored game values. No laboratory fidelity, certified mission or real geological discovery is claimed.

Remaining work: Module 11 character/audio/visual/onboarding polish and Module 12 final integration/performance. Geology implementation is not the end of all project work.

Manual observations so far: the all-family basic kit is **266 kg** with **41 kg science equipment**. Before the sensor trace, 27 SP were measured; after its timed recording, 33 SP were measured. Wrong rover-mounted sensor placement and a rock interpretation inconsistent with the tool cards were refused. The accepted highland interpretation followed camera, IR, XRF and XRD clues. Six records were transmitted. Return remained disabled with crew/rover/data checked until the **0.2-kg** sample was explicitly stowed. A cold reload reconstructed the complete science/safety checkpoint, including samples and all earlier validation gates. A stale Geology site gate found during development was fixed in shared readiness validation. Scoop active power also now includes its actual 5-W tool load; solar may cover it.

The optional “Geology return · assisted” menu shortcut replays the real survey, collection, tests, sensor setup, interpretation, transmission and stowing before opening the return screen. It is a judge/developer preview, not normal play; it grants no injected observations or approval flags. Full replay can take several seconds because it executes the existing physics/receipt reducers.

Save-loading refinement: Home only checks whether a supported demo envelope exists; it does not replay the full demo just to show a menu button. Actual Resume still revalidates all receipts. A weak cache of deterministic route-leg profiles avoids repeating the same 80-step power integral at every science/replay frame. Cache identity includes the immutable preparation object, design, site/objective, support specialist, directed leg, pace and dust-driven solar/drive effects. Battery state, accumulated exposure, time, supply reserve and route feasibility are **not** cached. Temporary diagnostic logging was removed after reviewing preserved validation gates.

Only mineral/element observations receive the interpreted rock classification. Photos, radar echoes and seismic traces remain distinct evidence kinds in the result; none is presented as independently naming a rock. The full export retains all measurements and sample provenance.

Final observed result: **3/3 crew recovered**, **33 delivered SP**, **6 actual transmitted records**, supported highland/crust interpretation and **0.2 kg sealed physical sample returned**. The exported sample receipt is `rock:lookout:0`, surface depth 0, stowed true; exactly the 3 mineral/element records carry classification, while photo/radar/seismic records retain their own evidence kinds. Equipment: **1,000 credits / 266 kg**. The same complete result survived a clean reload and Resume demo checkpoint. Local PNG card and JSON data exports downloaded successfully. Proof: `geology-debrief.jpg`. The main game/result fit the laptop viewport without scrolling. These are manual observations, not automated-test claims.
