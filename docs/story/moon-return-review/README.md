# Module 9: crew return and Ice ending

Local laptop implementation. No automated tests/build/lint/typecheck or deployment was run at the user's request. Module 8 was archived before this work in `/Users/asifhasan/.codex/backups/zero-to-beyond-module8-20261013.tar.gz`.

## Gameplay

`surface-secured → crew-return → mission-debrief`. Surface safety receipts must prove: crew sheltered, rover parked, records archived, no active EVA alert, ascent/service reserves retained. Two Moon crew ascend; the orbit support specialist waits in the CSM. Docking requires an authored ≤0.25 m/s closing speed and ±0.2 normalized alignment. Brake/left/right work; guided assistance records its use. An unsafe dock holds without collision or crew loss. All three transfer to the command module; the empty ascent stage is released before Earth departure.

Earth-return service burn → three-day coast → service-module separation and heatshield-first orientation → re-entry → Earth parachutes → ocean recovery. The player can pause, use 1×/1.5×/2× and skip only the coast. Skip still consumes all virtual coast resources and marks assistance. A nose-first choice is rejected before entry. Parachutes cannot open on the Moon or during high-altitude entry.

## Physics and honest limits

`return.ts` uses the approved manifest and ideal rocket equation: ascent 2,100 m/s, rendezvous 20 m/s, Earth-return 1,260 m/s. Dry masses retain the conservative manifest 10-kg sample allowance. Actual returned sample mass is **zero**: the Ice instrument activity exposes cuttings and transmits readings, and has no physical sample capture/stow receipt. The rover/descent stage remain on the Moon; unused service fuel stays with the separated service module.

Ascent 600 virtual s; rendezvous 3,600 s; departure burn 180 s; coast 3 days; entry 600 s; chute descent 180 s. Cabin energy uses the shared 600-W allocation, including capsule return power; supplies use 3 crew-days per day. The rover's energy is the final surface snapshot, not a prediction of its unattended performance after departure. Crew food/power must cover the actual return; spare contingency supplies may legitimately be used instead of stranding a crew whose direct return is feasible.

Presentation frames are compressed. Docking error/speed values are abstract teaching controls; the entire rendezvous correction is accounted as a bounded 20-m/s maneuver, not a per-click thrust simulation. No Lambert solver, flight-certified maneuver, aerothermal solution, real parachute dynamics or radiation dose is claimed. No true-ascent failure/rescue branch is invented; unsafe commands use safe hold, while the previous module supports early fieldwork stop and partial-science return.

NASA architecture references:
- [Apollo 11 mission overview](https://www.nasa.gov/history/apollo-11-mission-overview/): ascent, rendezvous/docking, Earth departure and recovery.
- [Apollo 16 press kit](https://ntrs.nasa.gov/citations/20170000922): lunar ascent to the command/service module, service-module release before Earth re-entry.
- [NASA parachute development](https://www.nasa.gov/history/60-years-ago-apollo-parachute-development-and-testing/): parachutes for the final atmospheric descent to water.
- [VIPER instruments](https://science.nasa.gov/mission/viper/rover-and-instruments/): instrument roles, not synthetic measurement truth or human flight equipment values.

## Result and replay

Success requires delivered water evidence and recovered crew; otherwise useful delivered clues give a partial result, or recovery alone gives safe-return. Science points derive exclusively from actual transmitted instrument records. Early stop, assistance, incident choices, corrected return decisions, elapsed time, food/cabin energy and fuel used remain visible in the log.

Result offers a local PNG mission card and full JSON science/decision log. “Change equipment & replay” preserves the Earth blueprint/crew but clears approvals, flight, observations and scores. Comparison is by saved mission cards/logs, not a claimed automatic counterfactual score.

## Save and integration

Save v10 retains fallback v9–v2; demo v10 retains v9–v5. Restoring replays verified launch → journey → landing → frozen surface origin → science/recovery → return commands. Fuel/time, current crew location, return status and result are reconstructed. Consecutive timing receipts are merged and replayed across automatic burn/coast boundaries, and clipped phase ticks cannot grant extra elapsed time on reload. Restored flight is paused. Hint/menu/hidden-page pauses are supported. Main UI fits a laptop viewport with chapter controls, fixed Back/Next, optional word explanations and lazy-loaded Three.js visuals. Both existing Commander identities have new recorded return narration.

An isolated **Return demo · assisted** replays real prior gates and actual science/incident decisions before opening return; it cannot fabricate discovery or award return success. The ordinary saved mission remains separate.

## Manual review

Source review covered receipt replay, resource units, crew locations, stale/unsupported events, old-save gates, type/property names, optional terms, Three.js cleanup and local exports. A short localhost return walkthrough checks unsafe docking, assisted safe docking, Earth burn/three-day coast, incorrect nose orientation, correct heat shield, chutes and splashdown. A reload check validates the same final log via the demo checkpoint. Proof: `mission-debrief.jpg`.

Remaining plan: Module 10 Geology objective; Module 11 accessibility/onboarding/replay refinement; Module 12 final art/audio/performance polish. This completes the Ice ending, not every project module.

Observed walkthrough result: **3 recovered crew**, **12 delivered SP**, 3 transmitted readings, water **inconclusive**, 6.49 mission days, ~3.5 food days for each of 3 crew, 206.6 kWh cabin energy. Ascent+rendezvous spent ~2,550 kg; Earth departure spent ~4,344 kg. Unsafe dock and nose-first entry were each blocked and counted as 2 corrected choices. The same result/resources survived reload and “Resume demo checkpoint”. PNG card and JSON log both downloaded successfully through their visible buttons. The card's next-attempt advice correctly distinguishes a carried-but-unused care kit from a missing one.
