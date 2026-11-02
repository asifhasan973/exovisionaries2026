# Remote rover sample run

After a verified landing, two astronauts operate the uncrewed rover from inside the lunar lander. The first half of the mission, arcade driving, close chase camera and judge Skip remain unchanged. New rover sessions use model 3.

## Mission loop

1. A two-line cabin exchange introduces remote control and the first sunny sample. The cabin has an enclosed spacecraft interior, crew seats, console, selected-rover monitor and two illustrated characters. Scientist and Commander have distinct recorded voices.
2. Only sample A is marked. Drive freely, park inside its circle, press E, and stop the alignment marker in the green band. A 2.6-second extraction lowers the installed tool, raises a core, seals the tube and moves it into cargo. Alignment/result screens do not drain rover battery.
3. Return to base. E starts a 3.8-second transfer: the hatch opens, a mechanical gripper takes the sealed tube and moves it into the storage rack. Delivery credit is issued only after transfer ends. An explicit delivery result confirms 1/2.
4. Solar Ridge becomes the only active target. Park and hold E, Space/Enter on the charging button, or the pointer charging control. Releasing stops charging. A physical cable and progress bar show the connection. At least two seconds of charging and 95% battery are required before the shadow target appears. There is no passive recharge.
5. Drill at B, the shadow outcrop. The hard layer stops extraction and gives no sample. A short cabin exchange reveals nearby C. Cargo, the first deposit and this story milestone remain safe.
6. Collect C, then return and deliver it through the same transfer animation. There are three drilling attempts and two delivered samples.
7. E starts the six-second cargo-bay sequence: door opens, rover aligns, wheels roll up the ramp, rover parks inside, ramp folds and door closes. Only then does the launch exchange and existing ascent become available. Crew remain inside throughout.

Map and terrain flags expose only the current sample target. Base remains marked; the charging station is marked when it is the objective. Rocks, crater edges and route landmarks remain visible. The player steers freely rather than travelling on movement rails.

## Controls and resources

W accelerates, S brakes then reverses, A/D steer while rolling. Arrow keys also work. Mouse drag looks around, C recentres, wheel adjusts distance, M opens the map, and P/Esc pauses. E performs the nearby action or starts a held charge. Map/help pause simulation. Global loading/orientation suspension freezes state and rendering and releases held controls without cancelling an existing manual pause.

The selected rover model is 15% smaller in the surface scene. No seats or external astronauts are added. `buildRoverAssembly(preparation)` retains the chosen chassis, panels, navigation, battery, thermal, communications and science hardware.

Model-3 moving drain is 0.6% capacity per screen second in sunlight and 1.35% in shadow: roughly 74 seconds of full-battery shadow driving. Charging supplies 17% capacity per held second. These, terrain relief and vehicle grip are authored game values. Dialogue, alignment, extraction, transfer and storage animations do not drain rover battery. Cabin energy/support remain separate accounts.

Stopping at a sunny checkpoint saves progress. Battery/crater failure retries at the sunny checkpoint with a full battery. The first delivered sample and acknowledged hard-ground story persist; unsaved later cargo must be collected again. Charging is required after the first delivery. Hard-ground and charging checkpoints preserve this ordering through retries.

## Implementation and compatibility

- `rover.ts`: versioned driving, sequential goals, held charging, extraction/delivery/stow phases, checkpoint restoration and bounded action replay.
- `roverCourse.ts`: authored terrain, obstacles and optional route landmarks. `roverGoal` and `visibleRoverSites` supply the shared map/scene target contract.
- `roverBay.ts`: cargo hold, door, ramp, gripper, sample rack and phase-time animation. `RoverViewport.tsx` renders the selected uncrewed rover, terrain, tool/tube, charging cable and contextual cameras.
- `RoverScreen.tsx`, `RoverMap.tsx`, `RoverRadio.tsx`: laptop controls, compact HUD, current-target map and short cabin radio advice.
- `RoverCabin.tsx`, `roverCabin.css`, `roverCopy.ts`: crew presentation and short recorded exchanges. `rover-run-*`/`rover-radio-*` catalogue entries use the existing Commander voice and a different Scientist voice. [Artwork sources and prompts](rover-artwork.md).
- `roverSession.ts`: landing authorization, resource/evidence reconciliation and existing ascent handoff. Delivery indicates a sealed physical sample; it does not confirm water or composition.

Models 1 and 2 retain their prior physics and receipt replay. Opening an unfinished older run records a `tour` migration, preserves its earned sample count and maps the existing containers into the new A/C sequence. Runs that already earned two samples retain that accomplishment and can park for ascent. Ready/completed old runs retain their existing departure authorization. No Earth launch/landing replay is required. Full saves retain the v13 envelope and v12 fallback.

Positions, cargo, battery, charge completion, delivery and stow flags are reconstructed from validated commands, rather than trusted saved fields. Active restored phases start paused with neutral driving/charging inputs. Transfers and stow resume from their saved phase time. Bounded replay includes the historical model before a migration command.

## Verification

`node --experimental-strip-types scripts/check-rover-sample-run.mjs` physically drives the new route through ordinary throttle/steering commands. It covers one-target visibility, A delivery before charge, hold/release and no passive charging, hard B without cargo, replacement C, two transfers, three drills, stow before ascent, freeze/retry, story checkpoint preservation, save roundtrips, tamper rejection and old-model migration.

`check-rover-arcade.mjs` retains model-2 driving/collection/delivery coverage; `check-free-rover.mjs` retains model-1 mission/retry coverage. `check-judge-tour.mjs` covers both objective tours and their saved checkpoints. The sample-run check also validates all 15 new voice files and their speaker assignments. The cabin was visually reviewed at the reported laptop size before the final character-size adjustment. The browser connection became unavailable before a final visual pass of delivery and stow; those animations still need that visual review. These checks do not assert an audible voice-quality rating or a frame-rate guarantee.

## Equipment-coupled runs (model 4)

New runs retain the sequential driving game and reconstruct their equipment from the immutable launch manifest. Models 1–3 retain their previous numeric replay, collection rules and outcomes; they are not silently reinterpreted. Model 4 reuses operatingPower/batteryStep (W and Wh) for driving, standby, instrument work and charging. Normal travel uses 10 mission seconds per screen second; collection/analysis uses 120, and held solar charging uses 600. These are authored time compression factors, not hardware specifications. Cabin power and supplies use the same elapsed mission time. Sunlit panels can generate energy during travel/standby.

Rover terrain ratings affect the grade speed penalty; rover motor loads affect energy. The installed collector determines surface versus subsurface collection and depth up to the authored 40-cm target limit, plus extraction duration. The hard outcrop remains a scripted obstruction beyond this run's collection procedure. Sample collection retains the existing timing interaction and animation, followed by instrument analysis in the same interaction. Ice uses installed NSS/TRIDENT/NIRVSS/MSolo readings and the existing optical-plus-gas confirmation rule. Geology uses the existing survey, collection, analysis and corroborated classification functions. No instrument means no corresponding measurement. Simulated signals remain authored, not live NASA data.

Readings generated aboard the rover remain untransmitted until base delivery; collection alone grants no generic science points. The finale reports physical samples independently from the evidence-based mission outcome. Return with two samples can remain scientifically inconclusive.

Focused checks: check-rover-equipment.mjs covers equipment comparisons, readings, collection versus discovery and model-4 replay; check-rover-sample-run.mjs runs the legacy model-3 route by default and the model-4 route with ROVER_TEST_MODEL=4. Both objectives complete the driven route, transfers, charge, hard outcrop, replacement sample, stow and return authorization with save roundtrips.

## Rover usability verification

The analysis result now names instruments individually, keeps long evidence inside a bounded scrollable card, and hides the instruments panel behind the result. The live HUD shows Wh/capacity and solar W. The HUD and help explicitly require keyboard and mouse; touch-only driving is not advertised. Help explains panel generation and held charging, and timing feedback no longer promises zero battery consumption during model-4 instrument work.

The map contains keyboard focus, closes with Escape and restores focus to its opener after the overlay unmounts. Closing a map retains an existing manual pause. Return shortcuts accept A/D/S/E after mouse clicks; Enter/Space retain native button behavior and text-entry controls are excluded.

Browser verification used isolated debug sessions so the main mission save was preserved. Ice and Geology were driven to their first site, collected through the timing interaction, and visually checked with their actual instrument readings. Desktop 1280×720 and 1440×900 and compact landscape 844×390 were inspected. Map Tab/Shift+Tab/Escape/focus restoration and return click→S/A/Enter/E docking were exercised. Model-4 automated driven-route checks separately verified retry, saved evidence restoration, pause, delivery and ascent for both objectives. Debug sessions intentionally reset on reload; this browser pass does not claim normal-save reload or physical-device/screen-reader certification.
