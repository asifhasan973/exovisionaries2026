# Scientific references and game-model boundaries

Reviewed 2026-10-13. The runtime register lives in `src/game/story/moon/missionSources.ts`, is available from the flask icon, and is included in mission log exports.

| Reference | Used for | Not claimed |
|---|---|---|
| [Apollo 17 mission details](https://www.nasa.gov/missions/apollo/apollo-17-mission-details/) and [return sequence](https://www.nasa.gov/history/50-years-ago-apollo-17-heads-home-to-earth/) | Crewed rover exploration and lunar ascent/rendezvous/Earth return | The fictional spacecraft is a certified Apollo reproduction |
| [VIPER instruments](https://science.nasa.gov/mission/viper/rover-and-instruments/) | NSS, NIRVSS, TRIDENT and MSolo capabilities; up-to-one-metre excavation | Credit prices, lightweight masses, battery tiers and power allocations are measured NASA specifications |
| [VIPER operations](https://science.nasa.gov/mission/viper/lunar-operations/) and [Moon water/ice](https://science.nasa.gov/moon/moon-water-and-ices/) | Light/shadow operations and evidence-based polar ice exploration | A hydrogen reading alone confirms water; fictional signals are real observations |
| [Moon composition](https://science.nasa.gov/moon/composition/) | Mineral/rock context for Geology | The scene is mapped to an actual surveyed outcrop or imported terrain dataset |
| [X-ray fluorescence/diffraction](https://heasarc.gsfc.nasa.gov/docs/nicer/technology/spinoffs/materials-analysis.html) | Element versus crystal/mineral analysis | Our scanner tiers or authored classifications are laboratory calibration data |
| [Ideal rocket equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/) | Delta-v/fuel/mass arithmetic | Authored burn allowances and cinematics form a solved three-dimensional flight trajectory |

## Declared authored values

- Equipment: 1,000 credits, 350 kg, 450 W ceiling. Geology science tools have a 100-kg sub-limit; crew uses a separate roster budget. Credits are not market prices.
- Battery: Wh energy, W power, 20% reserve. Shadow provides zero direct solar power. Drill time scales with chosen depth using the game's duration allocation. Rehearsal is a conservative 15-minute travel loop plus drilling/collection; surface modes use their active tools.
- Supplied human platform: mass, fuel, specific impulse, cabin loads and day-kit allocations are stated in `platform.ts`. Mission-day limits are game boundaries, not universal lunar-stay limits.
- Journey/descent/return: authored maneuver allowances, route timing, landing terrain, docking limits, entry/chute gates and compressed animation. Crew-return cabin energy and supplies include the coast; fuel accounts remain separate.
- Surface science: authored sites/signals/quality, geometric radio visibility, cold-exposure rules, qualitative radiation shelter, excavation dust, calibration and point awards. No radiation-dose prediction, real moonquake identification or certified thermal survival model.
- Evidence: no points for buying hardware or repeat farming. Classification and water confirmation use the performed tool records. Data must be transmitted; physical rock samples must be collected and sealed. An inconclusive/partial result and safe crew recovery remain legitimate separate outcomes.
- Visual/audio: existing registered character art, recorded synthetic voices and illustrated 3D scenes. Talking motion is rhythmic and playback-driven, not phoneme-accurate lip sync. Scene scale is illustrative; image/audio attribution remains in `public/story` credits.

## Challenge availability

The [user-provided 2026 challenge](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/) returned 502 during this review. Official wording could not be reverified. No unofficial judging criteria have been substituted. The accepted plan targets complete mission design, resource management, engineering decisions and evidence-based outcomes; confirm any additional official data-submission requirement before release.
