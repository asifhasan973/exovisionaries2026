# Module 6 — laptop lunar surface engine

Touchdown → deploy the selected rover → scout a ridge/lookout and shadow edge → preserve a feasible path home → surface-ready endpoint. Module 7 will add observations, drilling and evidence. Scouting never awards science or confirms ice.

## World and controls

A bounded illustrative map has Base, Sunny ridge, Lookout, Shadow edge and a Cold crater target (Rock field marker for Geology). The scene reuses the selected rover/instrument/power/thermal/radio meshes and the supplied crewed lander. Two restrained astronaut models deploy the rover, then shelter. Follow-rover and map cameras reveal routes, a boulder field, ridge, light/shadow zones and waypoints. It is authored terrain, not a georeferenced LRO data product. Ambient rendering fill is for visibility, not solar generation.

- Node coordinates scale by three to obtain authored travel metres. Basic/Polar/Heavy speeds are 0.12/0.18/0.22 m/s. Fast travels 1.2× faster but uses 1.4× rover drive power. Rough paths slow travel by 1.2 and use 1.25× drive load. Grade limits are 8°/14°/16°; the rough shortcut also requires stereo navigation. These are game tiers, not NASA rover specifications.
- Driving follows the selected safe corridor. Route assist runs it; Hold mode requires W/up arrow or the held drive button. Releasing pauses the simulation. Turn back reverses the current corridor from the exact current position. Planned Return to base traverses the computed home path and records assistance. It is not free steering or a teleport.
- Each leg has 80 fixed 0.1-second presentation steps. Virtual time is route distance / vehicle speed, distributed over those steps. Deployment animates over 30 steps and costs ten virtual minutes. Charging takes 60 steps and fifteen virtual minutes. Renderer interpolation does not spend energy or advance physics. Menus, hints and hidden tabs pause the clock.

## Shared resource contract

Operating modes use the existing `operatingPower` and `batteryStep`: selected rover/camera loads while traversing, heaters/radio in standby, plus 12 W headlights in shadow. Solar output uses the installed array and authored illumination fractions; permanent-shadow zones generate exactly 0 W. Charging requires positive illumination and net surplus. Full batteries clip at capacity while the declared time still passes.

Route forecasts integrate the same per-step loads as runtime, conservatively crediting no hoped-for surplus charging. Before departure, the chosen leg (or autonomous round trip) must leave the computed minimum-energy home path plus 20% battery reserve. Earth-return supplies and cabin energy also retain the three-day return allowance plus two contingency days. Rover Wh, crew day-kits, cabin Wh and propulsion reserves remain separate.

Basic/advanced thermal kits have authored 20/120-minute continuous-shadow operating windows. Ten continuous virtual minutes in light reset the cold-exposure budget. These are qualitative balancing windows, not a heat-transfer calculation or survival certification. Hardware cannot be bought or swapped in flight. Unsafe paths show a red alert, a short recorded explanation and remain blocked.

The rover-to-base radio has authored 75/260-m ranges. A ridge blocks both radio tiers beyond x=85 regardless of range. A blocked destination requires the player to arm an approved out-and-back corridor before departure; no new commands are accepted there other than pausing the game. This game feature is not a claim about VIPER autonomous capability. Orbital/Earth link geometry is not modeled by the local radio rule.

Crew suit time is bounded at sixty minutes per deployed surface crew in this scenario. Ten minutes are used by deployment, then both crew shelter. Driving the robot does not consume suit time. All three crew consume shared supplies/cabin energy during virtual surface time. Science remains zero.

## State, recovery and verification

Save v7 preserves prior keys through v6/v5 and restores active surface operations paused. Bounded control/frame receipts replay through the live rules; saved battery, position and success flags are not trusted. The normal mission and tab-local judge demo remain separate. Retry from touchdown restores the post-landing resource checkpoint and records assistance. Module 5 is archived at `/Users/asifhasan/.codex/backups/zero-to-beyond-module5-20261013.tar.gz`.

Per user instruction: laptop only; no automated tests, lint, production build, GitHub push or deployment. Direct browser play and source review only. React review covered lazy scene loading, primitive effect dependencies, timer/listener cleanup, GPU/sprite/route-line disposal, accessible held controls and bounded atomic saves.

Manual observations: deployment completed and crew sheltered; Eco sunlight routes showed 0 Wh maximum battery cost, while Fast reduced time and increased the forecast to 1–2 Wh. A planned shadow-edge loop consumed battery and returned to a linked ridge. Refresh preserved 203.3 Wh and return-leg progress 66. Completion left 206.5 Wh; charging fifteen virtual minutes restored 220 Wh without increasing suit time. A 1.2-second held button advanced 12 route frames, and release paused. The held return reached Base. The boulder loop showed Solar 0 W, load 191 W and Radio blocked, with 205.5 Wh at frame 75; the headlight scene remained visible.

NASA reference: [VIPER lunar route planning](https://science.nasa.gov/mission/viper/lunar-operations/). The reference supports the importance of illumination, energy reserves, terrain constraints, waypoints and line-of-sight communications. Map, speeds, ranges, thermal windows, crew allowances and autonomous return rules above are authored game assumptions. Audio is interface/cabin feedback, not sound propagation through lunar vacuum.

Final manual run: the programmed boulder loop returned to Base with 182.2/220 Wh after 142 virtual surface minutes. Radio relinked; sunlight supplied 188 W against 18 W standby load. Route ready opened the fitted one-viewport Scout complete screen, with crew sheltered, both scout goals checked and science still zero. Module 7 is explicitly unavailable rather than an unfinished playable screen. Recorded female/male completion lines match the shortened copy.

Evidence: `shadow-route.jpg` captures the paused blackout/headlight route; `surface-ready.jpg` captures successful return and the Module 6 endpoint.
