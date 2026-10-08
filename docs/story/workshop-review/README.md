# Module 5 — mission preparation workshop

Implemented in the active root at `http://127.0.0.1:5173/`. Start or resume a story, finish the resource conversation, then press Build. The source's 18 spoken lines remain byte-for-byte unchanged (except the allowed player-name greeting substitution).

## What works

- Resource limits, initially empty lander, all six mandatory lander parts, three alternative rovers, NSS/NIRVSS/TRIDENT plus optional MSOLO, 10–100 cm drilling plan, solar/battery selection, thermal/radio/navigation choices.
- One exclusive choice in each rover/navigation/solar/battery/thermal/communication category. Replacing a choice removes its old cost, mass and load.
- Whole-canvas forgiving drop, 45–65 px outer margin, yellow attachment rings, pointer capture, 240 ms placement motion. Outside release and cancellation remove the drag preview. Tap and keyboard installation also work.
- Shelf multiselect, Select all, detail popups, removal, reversible hardware history and confirmed Quick Build. Quick Build is a 960-credit example, not mission approval.
- Live cost, mass, normal/peak loads, potential science, drill planning energy and sunlight/shadow energy. Science score remains zero before exploration.
- Atomic cursor + manifest save; invalid, duplicate and wrong-category IDs are sanitized. Earlier-module saves migrate with empty hardware. Existing legacy saves remain separate.
- Visible header and shared Back/Next footer. Mobile supports touch/tap and 320 px width; 3D failure leaves installation controls available.

## Copy, real science and game values

`design.ts` preserves the user-supplied numbers, including null specifications. `preparation.ts` is the separate resolved gameplay catalogue. Prices are credits, not verified procurement quotations; all scripted part masses and powers are game allocations.

NASA sources informed instrument functions, not these missing values:

- [VIPER instruments](https://science.nasa.gov/mission/viper/rover-and-instruments/): hydrogen prospecting with NSS; infrared study of water/hydroxyl/minerals with NIRVSS; drilling up to 1 m with TRIDENT; gas analysis with MSOLO. Hydrogen detection alone is not proof of water ice.
- [VIPER lunar operations](https://science.nasa.gov/mission/viper/lunar-operations/): shadow/sunlight route planning, battery reserves, mobility and terrain hazards.
- [VIPER in depth](https://science.nasa.gov/mission/viper/in-depth/): the real rover's described solar-charged battery and 450 W peak power provide context. This game is not a flight-certified VIPER replica.

### Explicit authored resolutions

| Source gap | Gameplay rule |
|---|---|
| MSOLO | Optional, 70 credits, 12 kg, 20 W |
| Solar mass | Standard 8 kg; high-efficiency 12 kg |
| “+250 W” | 250 W total, replacing Standard's 150 W; ideal sunlight only |
| Battery capacity units | 100 / 220 / 400 Wh; 450 W discharge ceiling, an authored limit |
| Basic thermal | 4 kg, 10 W |
| Advanced thermal | 8 kg, 15 W; qualitative improvement, no guarantee of PSR survival |
| Basic communication | 2 kg, 8 W; rover-to-lander radio, separate from mandatory lander antenna |
| High-gain communication | 4 kg, 15 W; terrain can still occlude the link |
| Body and engines | 0 W electrical load. Engine thrust uses propellant included in the scripted game mass. This is not a physical propulsion sizing calculation. |
| Rover load | Source rover watts are treated as base platform load, excluding separately selected instruments/heaters/radio. A conservative simultaneous-load model. |
| Drill peak | 175 W **replaces** its 20 W nominal load; it is not added twice |
| Operating modes | Lander's 60 W installed avionics load is reported separately from rover surface operation, never added as a permanent rover load |
| Sun/shadow | Solar output is 150/250 W in ideal sunlight, 0 W in permanent shadow |
| Battery endurance | `floor(0.8 × Wh / positive(normalW − solarW) × 60)` minutes: steady load, ideal arithmetic and 20% reserve; excludes drill energy and charging losses |
| Drill depth trade-off | Authored 30 seconds per 10 cm, conservative full rover peak load during drilling. Planned energy = `peakW × minutes / 60` Wh. Low risk ≤30 cm, medium ≤60 cm, high above 60 cm are game bands, not measured failure probabilities. |
| Drill potential | Source anchors 20 cm→5, 50→15, 100→35 retained; rounded linear interpolation from (0,0) for other depths. Potential points remain unearned. |
| Geology | Same mandatory toolkit; NIRVSS studies minerals, NSS provides hydrogen context. No extra invented geology success criterion or new dialogue. |

The example configuration totals **960 credits, 280 kg, 218 W normal, 373 W drill peak** (plus 60 W lander avionics in its separate mode). It stores 220 Wh and makes up to 250 W in sunlight. At 20 cm, modeled drilling is 1 minute / 6.2 Wh; at 100 cm it is 5 minutes / 31.1 Wh. These are planning estimates, not actual lunar test results. No timeline, power generation or radio line-of-sight solver is claimed.

Mass and peak caps are enforced by the later approval boundary, not by refusing purchases in the workshop. With the current exclusive source catalogue every combination fits the 350 kg/450 W caps; budget, energy, reliability and potential science drive the current trade-offs. Module 6 must account for the final packed manifest and route feasibility rather than manufacture over-limit examples.

## Implementation map

- `preparation.ts`: resolved catalogue, sanitization, single-choice replacement, totals, depth potential, real build gates.
- `workshopSession.ts`: navigation + manifest owner, hardware history, guarded activity completion, Quick Build.
- `selectionSession.ts`: one atomic saved payload, backward-compatible restoration and Module 6 boundary.
- `WorkshopScreen.tsx` / `workshop.css`: five stages, shelf, meters, pointer/touch interaction, native detail dialogs.
- `WorkshopViewport.tsx` / `workshopMeshes.ts`: actual installed meshes, same-mesh thumbnails, orbit/zoom/fit, attachment rings, GPU lifecycle.

## Verification

The focused browser pass exercised empty assembly, distant release/snap, invalid release, undo/redo, all/multiple add, swaps and drill depth. A Strict Mode native-dialog close-event race was found and repaired; verification then continued from that boundary through power, survival, save/reload, build completion, editing and Quick Build. `browser-review.json` records the combined outcomes and accurately identifies that continuation. A final production check loaded the real 3D canvas and thumbnails at 390/320 px, checked 0 W solar in permanent shadow, performed a touch battery swap and confirmed summary undo controls stay disabled. The original selection pass also verified all 18 unchanged spoken lines, both objectives/sites, storage failure and legacy-save isolation.

Meaningful unit checks cover totals, duplicate prevention, wrong-category rejection, valid gates, peak replacement, Wh arithmetic, deeper drilling energy, invalid-save recovery, swaps, undo/redo, fake-approval prevention and Back after removing an earlier part. Production build and the active story lint check pass. Repository-wide lint has existing warnings in legacy views and local backups; they were not rewritten as part of this module. Existing build warnings concern the shared Three.js chunk and the compositor's deliberate runtime URL fallback.

## Module 6 handoff

The live flow stops at `mass-check` with a **read-only build-complete screen** and editable stage links. No mass/power/budget checks are marked complete, no mission is approved, no rocket is packed or launched. Next module must implement correctable checks, battery/thermal/site feasibility, final packing and the launch-ready endpoint. Do not insert legacy crew-selection or unrelated landing screens.
