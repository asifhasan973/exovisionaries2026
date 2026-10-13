# Module 5 — laptop lunar landing

Lunar orbit → lander separation → braking → terminal descent → terrain decision → safe touchdown. Two crew land; the support specialist remains in the command spacecraft. Surface deployment and exploration remain Module 6.

## Declared game model

- Apollo-inspired architecture, reused from the approved crewed platform. The lander carries two crew, equipment and the complete fueled ascent stage. Ascent and Earth-return fuel are separate from landing fuel.
- An authored 1700 m/s approach burn plus 5% margin is charged through the ideal rocket equation. It compresses the descent orbit/braking approach into a short cinematic. The planar terminal model begins at 130 m, −6 m/s vertical and 1 m/s horizontal velocity.
- Fixed 1/30-second steps integrate gravity (1.62 m/s²), acceleration from a 45 kN engine, tilt (±20°), changing vehicle mass and propellant flow `thrust / (g₀ × Isp)`. No atmospheric drag or parachute is used. Two simulated seconds pass per real screen second. Rendering never advances mission state.
- Touchdown requires down speed ≤2.5 m/s, sideways speed ≤1.5 m/s and a clear patch within 12 m of its centre. The planned patch contains boulders. Edge slopes and boundaries are unsafe. Terrain and thresholds are authored, not a georeferenced LRO landing prediction. Visual scale is exaggerated.
- Mandatory radar/cameras provide height information. The selected stereo hazard camera reveals the hazard at 105 m; basic camera at 75 m. Both retain a playable route. The hazard pauses the simulation for Continue / Divert / Abort. Choosing a clear patch changes the actual steering target. Keeping the rocky patch causes a terrain failure even at a gentle speed.
- Guided uses feedback control for throttle/tilt with the same force and fuel equations as Challenge. Challenge uses the thrust slider, steer buttons or A/D and W/S (arrow keys also supported). Space pauses. Help, menus and hidden tabs pause gameplay.
- Abort is offered only during descent above 15 m, with vertical speed ≥−20 m/s and sufficient ascent fuel. It discards the descent stage and spends an authored 2100 m/s orbit-recovery budget plus current speed, with a 480-second recovery-time allowance. The recovery cinematic ends in an abort orbit; rendezvous/docking is not claimed to be complete. A further landing requires an explicit assisted checkpoint retry.
- Supplies, cabin energy and mission time derive from the arrival baseline plus this flight’s elapsed steps and braking allowance. No rover energy or science is awarded/spent for landing.

## State and recovery

Save v6 preserves v5 and earlier normal save keys. Landing stores bounded control/frame receipts; refresh replays those inputs to reconstruct physics rather than accepting saved position, fuel or success flags. Active descent resumes paused. Retry restores the lunar-orbit checkpoint and marks assistance. In-flight hardware edits stay locked.

Landing demo is explicitly assisted and traverses real preparation, launch and journey gates through the existing reducers. It never overwrites the player’s normal save. The shortcut was opened from Home → Judge demo → Landing demo and reached the real separation screen with its valid manifest and 8500 kg landing fuel. Previous Module 4 source/assets are archived at `/Users/asifhasan/.codex/backups/zero-to-beyond-module4-20261012.tar.gz`.

## Verification boundary

Per user instruction: laptop only, direct manual browser play and source review. No automated tests, lint, production build, GitHub push or deployment. React review covered lazy scene loading, effect/listener cleanup, GPU/sprite texture disposal, keyboard labels, fixed-step timing and bounded atomic saves.

Manual checks so far: Module 4 orbit save continued into landing; Guided diversion to patch A touched down at 0.7 m/s with 1346 kg landing fuel, 2600 kg ascent fuel protected; refresh during final approach preserved 1 m height, 0.7 m/s and 1355 kg landing fuel; retry restored 8500 kg descent fuel. Continuing over the planned boulder field correctly failed even at 0.9 m/s, with a terrain explanation and Retry. Challenge keyboard W increased thrust from 30% to 38%; left steering reduced horizontal speed from 1.0 to 0.6 m/s; pause stopped descent. Abort at 99 m completed with 2538 kg ascent fuel spent and 62 kg remaining, with the descent stage visually discarded and rendezvous left pending.

NASA principles: [Apollo 11 powered descent](https://www.nasa.gov/missions/apollo/apollo-11/apollo-11-mission-overview/), [Moon gravity and environment](https://science.nasa.gov/moon/facts/), [Apollo boulder avoidance and crew architecture](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11.summary.html). All numeric platform inputs, terminal limits, camera warning heights, terrain and abort envelope are authored game estimates.

Evidence: `touchdown.jpg`.
