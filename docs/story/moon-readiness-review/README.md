# Module 3 — crewed readiness

Implemented on `feat/full-moon-foundation`, after Module 2 (`4926ad5`). Recovery branch: `backup/module2-complete-20261012`.

## Playable flow

Crew assignment → crew day kits + cabin hatch → radar/mass → battery drive/drill/return → equipment budget → ascent/service engine, heat shield and parachute connections → route/dust/radio/shelter decisions → ordered crew capsule/lander/supply packing → immutable departure plan.

Back/Next stay in the shared footer. Mandatory instructions are short; explanations and NASA links are optional panels. Wrong decisions show a red alert and recorded male/female advice. Hint points to the applicable action; challenge Hint use is recorded as assisted. No rehearsals award science or execute a flight.

## Model contract

- Equipment: 1,000 game credits, 350 kg, 450 W; Geology science sub-limit 100 kg. Crew: separate 240-credit allocation, three people, two landing and one in orbit.
- Equipment battery/rehearsal uses the shared Wh model, actual drill depth and robotics driving benefit. Surface scoop collection consumes an authored 60 seconds instead of zero energy. Thermal/energy/peak/budget/mass repair suggestions are re-evaluated after each edit; multi-edit repairs must actually clear the issue.
- `moon/platform.ts` declares illustrative dry masses, propellant, specific impulse, maneuver budgets, life-support energy and day kits. These are **authored game values, not Apollo specifications**. Ideal delta-v uses the rocket equation with an authored 5% margin. Equipment stays on the Moon; two crew and a sample allowance ascend; all three return in the command spacecraft.
- The 8–14-day plan is this game's scenario range, not a universal lunar mission limit. Kits cover three crew and two contingency days. Platform life-support energy is separate from the rover battery.
- `moon/stress.ts` is the shared contract for later surface gameplay: selected rover terrain threshold and operating load, radio line of sight/range, camera dust visibility and qualitative particle-alert shelter decisions. Numerical ranges and thresholds are game rules. Radiation dose and actual shelter performance are not calculated.
- Save v4 preserves prior keys. Every equipment, crew, depth, objective, site or duration change invalidates readiness/packing/approval. Restore recalculates receipts and compares the canonical manifest before rebuilding the pre-departure checkpoint. Judge demo has a separate tab-local checkpoint and never writes the player's adventure.
- JSON flight plan and PNG mission card explicitly describe **a plan**, not a completed mission. The journey gate remains disabled until Module 4.

## Manual verification

Verified the Geology pathway with Commander + Geologist + Robotics expert: 865 equipment credits, 255 kg equipment, 215 crew credits, 232 kg crew. Increasing duration from 8 to 9 requires 33 kits and blocks the 30-kit pack; switching to 48 kits and sealing the hatch unlocks crew validation. The 220 Wh battery fell to approximately 168 Wh after drive/drill/return with the 20 cm drill, preserving its 44 Wh reserve.

Verified all four wrong decision choices block Next and display red feedback; correct choices permit advancement. Checked landscape phone layout at 844 × 390 and desktop viewport. Final packing generates a separate immutable pre-departure resource checkpoint. Automated gameplay tests were not run, per the user's preference; TypeScript production build and focused lint are the code checks.

Verified refresh/resume both midway through the four exercises and after final approval using the isolated Judge demo checkpoint. Changing Robotics expert to Systems engineer reset the accepted checks, hatch and locked plan. The original Asif adventure remained intact on the home screen.

Fixed a repair-shortcut restore issue that previously dropped the already matched crew/review steps. Recomputed crew-check receipts can recover these prerequisites; repaired designs now write them explicitly before restarting checks. Both Geology and Ice completed the whole Module 3 pathway. Polar Explorer passed the steep route that Basic Rover failed, with its higher authored traversal energy.

Verified Ice's Small 100 Wh battery with a 100 cm drill reaches the 20 Wh reserve before completing Return. It blocks Next and shows “Not enough battery!”; Fix opens the Battery category on the exact Medium 220 Wh card, with a yellow highlight, animated hand and short advice. Depth adjustment itself changes the displayed drilling cost from 6.2 Wh / 1 minute at 20 cm to 31.1 Wh / 5 minutes at 100 cm. After fitting Medium and completing fresh crew/mass checks, the same 100 cm operation returns successfully with about 134 Wh, exceeding the 44 Wh reserve.

Evidence: [Geology approved plan](departure-plan.jpg), [Ice approved plan](ice-departure-plan.jpg), [failed energy rehearsal](energy-failure.jpg), [targeted battery fix](battery-fix.jpg), [successful retest](energy-repaired.jpg), [exported demo plan](example-departure-plan.json).

## NASA references for principles

- [Ideal rocket equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/)
- [LunaNet communication](https://www.nasa.gov/communicating-with-missions/lunanet/)
- [Lunar dust and landing-plume problems](https://www.nasa.gov/directorates/stmd/nasa-technologies-aim-to-solve-housekeepings-biggest-issue-dust/)
- [Solar energetic particles](https://ccmc.gsfc.nasa.gov/ISEP/)

Not yet implemented: crewed launch/transfer, landing, actual surface evidence, ascent/docking, Earth return and debrief. Structural, entry-heating and launch dynamics are not flight-certified by this educational review.
