# Full Moon mission — Module 1 foundation

Implemented on 2026-10-12, on `feat/full-moon-foundation`. Recoverable pre-change code: `backup/before-full-moon-module1-20261012`, pointing to `95bf4b1a80c27ad00e1ce96ec4a4db619df33892`.

## Delivered

- `moon/rules.ts`: shared rule/provenance references, separate 1,000-credit / 350-kg equipment and 240-credit crew allocation, 100-kg geology science sub-limit, 20% energy reserve, and a separately supplied crewed platform. Platform gross mass, fuel and life-support capacity remain explicitly unknown.
- `moon/resources.ts`: W/Wh calculations, mode-specific active electrical loads, drilling duration, zero-sun generation, charging/depletion integration, reserve checks, a common rehearsal budget, and available delta-v from mass ratio. No visual frame rate or playback-speed argument changes the energy integral.
- `moon/catalog.ts`: current equipment plus the 21 geology tiers, source/game-value provenance, calculated totals, unknown/duplicate/incompatible selections, single-tier rules, objective requirements, sample-collection requirements, and the five authored crew candidates with separate accounting.
- `moon/session.ts`: versioned full-mission state, objective/site, crew, geology equipment, deterministic scenario seed, resources, navigation, evidence, incidents, checkpoints, launch snapshot and outcome contracts. Existing design actions synchronize this state through the current session reducer. Future phases are gated by module capability and a new crewed snapshot.
- Existing preparation, trial and readiness now use the shared energy rules. Drilling peak replaces normal drill load. Readiness compares the unrounded integral to the usable battery; rounding is for display.
- Existing `WorkshopSession` now carries the future mission state; it is not a disconnected second store. Current UI/save calls persist it.

## Save contract and rollback

The new atomic envelope lives at `zero_to_beyond_full_moon_v2`, with `sessionVersion: 2`, current pre-launch data, voice preference and `moonVersion: 1`.

The previous `zero_to_beyond_script_story_v1` and voice key are read for migration and never overwritten by this implementation. Previously prepared hardware, player identity, preferences and valid existing progress restore. The new human mission starts in preparation with no human departure approval, evidence, launch snapshot or earned result. Legacy robotic readiness remains explicitly part of the old playable launch; it cannot authorize the new crewed mission.

Malformed new envelopes fall back to the previous save. A save belonging to a later session version is not overwritten. Unknown/incompatible crew and payload selections are filtered or reset through canonical design signatures; saved future success flags do not bypass unimplemented stages. Demo interactions remain isolated from the normal saved mission.

## Accounting and continuation notes

The script's 134-kg lander allocation is illustrative kit/subsystem accounting, not the gross mass of a human lunar lander. The supplied crewed platform and crew bodies are a separate account. Do not silently treat generic crew support units as W or Wh.

Computed geology examples:

| Example | Mass | Credits | Sum of instrument W | Potential SP |
| --- | --- | --- | --- | --- |
| Budget | 30 kg | 225 | 70 W | 28 |
| Balanced | 38 kg | 390 | 116 W | 61 |
| Deep | 99 kg | 930 | 302 W | 121 |

These are science-kit totals only, not full vehicle loads. The Balanced example lacks a sample collector for XRD and is correctly identified as incomplete for sample analysis. The displayed potential score is not earned science. Module 2 must expose valid objective-aware payload assembly and crew selection; Module 3 must define and validate actual crewed platform resources before enabling human departure.

## Verification performed

No automated test program was added or run. Production TypeScript/Vite build, scoped lint and diff whitespace checks passed.

Manual localhost checks:

1. A real existing saved adventure resumed at Power with 12 parts, 800 credits, 238 kg and 330 W; after reload the same scene/totals returned and the UI reported Saved.
2. Isolated Judge demo: radar connection and mass check reached the power rehearsal normally.
3. Medium battery / 20-cm drill: Drive → Drill → Return reached Home safe, leaving approximately 159 Wh from 220 Wh, with a 44-Wh reserve. Next enabled only after completion.
4. In the demo, changing depth from 20 to 100 cm changed the visible energy estimate from 6.2 to 31.1 Wh and duration from 1 to 5 mission minutes. Screenshot: `deep-drilling.jpg`.
5. Swapping the demo battery from Medium to Small changed capacity to 100 Wh and invalidated the previous check acknowledgements before rechecking.
6. Browser error log was empty after the successful rehearsal.
7. Small battery / 100-cm drill: the rehearsal stopped on Return at the 20-Wh reserve, showed the red `Not enough battery!` alert recommending Medium, and kept Next disabled. Screenshot: `reserve-failure.jpg`. Demo exit restored the original player's saved adventure.

Existing build warnings concern the character runtime URL and the Three.js chunk size; the build succeeds. No deployment or GitHub push was performed.

## Module boundary

Module 1 is data/resource/save infrastructure integrated into the current game. It does **not** yet add a crew screen, lunar journey, landing, exploration, or Earth return. Those remain the following modules in `FULL-MOON-MISSION-PLAN.md`. Unimplemented human phases cannot be entered or restored as completed.
