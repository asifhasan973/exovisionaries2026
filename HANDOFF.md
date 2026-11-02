# Project handoff

## Completed work
- Added sequential rover sampling, equipment-dependent science evidence, W/Wh resource accounting, return gameplay and a saved-data mission debrief for Ice and Geology objectives.
- Added illustrated milestone screens, workshop selection improvements, shuffled packing, rocket assembly and concise crew dialogue/audio.
- Added a bounded NASA/JPL date planner, numerically computed transfer candidates, interactive departure/capture burns, camera controls and solar-system context. See `docs/story/moon-transfer-game.md` for model limits.
- Redesigned “Bring it down softly” as a full-width 3D lunar landing game with terrain, navigation circles, drift indicator, engine plume, dust and touchdown/failure feedback.
- Replaced the visible Guided/Challenge selector with one medium game. Added contextual Hint, retry, keyboard controls and mouse controls.
- Connected medium control changes to autosave checkpoints. Updated the assisted surface demo to use the medium landing reducer.
- Retained shared milestone navigation and Back review behavior.

## Key files
- `src/game/story/moon/RoverScreen.tsx`, `rover.ts`, `roverEquipment.ts`, `roverSession.ts`: driving, sequential sampling, scientific instruments and persistence.
- `src/game/story/moon/JourneyScreen.tsx`, `JourneyViewport.tsx`, `journey.ts`, `transferModel.ts`, `transferData.json`, `solarData.json`: route planning and flight controls.
- `src/game/story/moon/MissionDebrief.tsx`, `missionDebrief.ts`, `ReturnScreen.tsx`: crew return, actual results and comparison records.
- `scripts/trajectory/`: reproducible ephemeris collection and transfer candidate generation.
- `src/game/story/moon/LandingScreen.tsx`: controls, instruments, hints, results and narration.
- `src/game/story/moon/LandingViewport.tsx`, `landing.css`: procedural scene and layout.
- `src/game/story/moon/landing.ts`, `landingSession.ts`: physics, receipt replay, authorization, resources and retries.
- `src/game/story/moon/landingCopy.ts`, `journeyDemo.ts`: dialogue and assisted demo.
- `src/game/story/ExactStory.tsx`, `GestureGuide.tsx`: autosave integration and hand hints.
- `src/game/story/missionNavigation.ts`, `StoryShell.tsx`, `missionMilestones.ts`: shared navigation and milestone progress.
- `docs/story/landing-game.md`: landing design, handling and verification record.

## Important decisions
- New landing state uses version 2 and medium handling; version 1 remains supported for legacy receipt replay.
- Hold A/D or left/right arrows to steer; release to damp drift. Hold Space/W/up arrow to slow descent; P pauses.
- Mouse arrows latch movement, the crosshair stops it, and the brake toggles slowing. This permits steering and braking together with one mouse.
- Players choose and reach a clear circle themselves. Stabilization controls handling, not the landing destination.
- The approach is compressed; version 2 terminal descent runs at screen time. Terrain and touchdown thresholds are authored game values.

## Things that should not change
- Preserve existing unrelated working-tree changes; the repository contains many modified and untracked files.
- Keep Back routed through shared mission review; do not restart flight or spend resources during review.
- Reconstruct landing outcomes from bounded command receipts rather than trusting saved positions or success flags.
- Keep descent, ascent and Earth-return fuel separate. Retry explicitly restores the pre-descent checkpoint and records assistance.
- Keep physics and rendering frozen during shared loading/orientation suspension. Register scene loading and clean up GPU resources/listeners.
- Use the central sound engine and respect narration/effects settings. Back must not autoplay narration.
- Keep synced project `sources/` read-only. Do not commit, push or deploy without a request.

## Verification results
- Production build, TypeScript and lockfile dry-run validation passed during release preparation.
- Lint completed without errors after moving debug-only hooks into a separately mounted component; existing warnings remain.
- Equipment, mission debrief, judge tour and transfer pilot checks passed. These include both rover objectives, sequential delivery/stow, scientific evidence, command replay and save/resource consistency.
- The old selection browser script timed out waiting for its initial name screen; it is not recorded as passed. No complete manual mission playthrough was performed during release preparation.
- Earlier browser checks covered date selection, route confirmation, chase/trajectory rendering, engine fire/cutoff and pause. These do not establish physical-device or screen-reader compatibility.

## Unresolved issues
- Transfer search is restricted to 1–7 November 2026 and three chosen durations. Eight candidates converged; missing candidates are solver limitations, not unavailable launch dates.
- Vehicle specifications and gameplay tolerances are authored. Coast follows a nominal stored trajectory; lunar capture uses a local two-body approximation. Moon surface relief is illustrative.
- Full manual piloted arrival, physical mobile devices and screen readers require further review. Legacy browser scripts need to be aligned with the current entry flow.

## Next step
- Main-branch pushes deploy through `.github/workflows/deploy.yml` to Cloudflare Pages. Verify the resulting workflow and production build identity after publishing.
- Continue manual visual review of lunar arrival, landing and the complete return experience without changing saved mission/resource semantics.
