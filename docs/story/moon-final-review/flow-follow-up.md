# Laptop flow follow-up

2026-10-13. Source review and focused browser checks only. No automated tests,
build, lint, typecheck, commit, push, deployment or mobile work.

## Fixed

Science/recovery simulation reset and the debrief's new attempt previously started
at `science-build` with an empty navigation history. The first Back therefore did
nothing. Both now use `createBlueprintReplayProgress`, which reconstructs only
the retained preparation path through the ordinary story gates. It preserves
name, character, choices and blueprint assistance; old flight, science, return
history and approvals are not restored. The first Back reaches rover selection,
and earlier preparation remains reachable.

## Reviewed in source

- Screen dispatch from name/choices through preparation, crew, validation,
  Earth launch, transfer, descent, scouting, science, recovery and return.
- Next authorization derives from live equipment/check/operation receipts.
- Equipment and crew changes invalidate affected preparation and departure state.
- Post-launch Back offers a paused checkpoint/menu rather than buying parts or
  teleporting backward. Explicit resets start a new simulation.
- Save restore reconstructs valid operation receipts and filters activity flags.
- Timers, keyboard listeners and scene resources have lifecycle cleanup; narration
  retains the single-channel controller and 1.5x setting.

Source review is not a runtime pass for every possible loadout or action sequence.

## Actually observed in the local UI

1. The existing normal saved mission opened its Geology site-selection screen.
   It was not reset or given a new site/equipment choice.
2. Resumed the tab-local Ice debrief and chose Change equipment & replay →
   Start new attempt. Science equipment editing opened. Back reached Rover.
3. Ran animated auto-build from that isolated blueprint. It traversed the real
   five assembly stages and reached the crew briefing, then crew selection.
4. Save crew → Flight checks opened a fresh crew check. The leaking hatch was
   unsealed and Check crew was disabled: the previous flight's approval had not
   survived replay/auto-build.
5. Opened the isolated Ice science chapter → Back → Restart simulation. Science
   editing opened; its first Back also reached Rover. `replay-back-rover.jpg`
   is the final proof view.

Earlier end-of-mission checks remain in README.md. This follow-up does not claim
a fresh uninterrupted manual playthrough from name entry to splashdown, all
equipment/incident combinations, voice audition or production verification.
