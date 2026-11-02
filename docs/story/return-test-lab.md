# Return-system rehearsal lab

The preparation-stage return check is four short interactive rehearsals on one screen. Selecting a system opens its scene; selection alone never awards a new completion receipt. Completed systems have a small checkmark. The footer moves between unfinished tests and unlocks the Moon quiz after all four pass and the existing return-fuel calculation is valid.

- **Ascent engine:** set thrust inside the green 55–75% band and hold ignition for 2.2 seconds. An ascent cabin separates from the descent platform. Out-of-band thrust reduces accumulated progress.
- **Service engine:** turn the spacecraft toward an orbital target and perform a 2.4-second burn. Alignment within six degrees passes; a missed trajectory can be retried.
- **Heat shield:** rotate the capsule so its shield faces incoming heat, then run a 2.6-second exposure. Shield-first orientation keeps the cabin gauge low. Other orientations visibly heat the cabin and require a retry.
- **Parachutes:** start an Earth drop and deploy during the broad green window. The canopy inflates, descent slows, and the capsule splashes down. Missing the window allows an immediate retry.

These are illustrative, compressed training games. Their controls, thresholds, timing, trajectories and heat gauge are authored gameplay values, not flight performance predictions. Rehearsals do not consume mission propellant or award surface-science points.

## Interfaces and state

`src/game/story/moon/returnTests.ts` owns versioned `ReturnTestState`, `ReturnTestAction`, pure transitions and bounded restoration. `HumanValidation.returnTest` stores the selected test and its exact elapsed time, settings and canopy deployment time. Saved running tests restore paused; held ignition always restores released. A save still on the old systems-check page must play the new tests. Completed later-stage missions retain existing receipts for compatibility.

`readinessEvents.ts` processes `return-test-*` events only during the real systems-check stage after the prerequisite equipment checks. A new `connected` receipt is appended only when a simulation reaches `passed`. The old `human-connect` event also requires a passed matching simulation. `workshopSession.ts` routes these rehearsal events before the separate crew-return flight events. Chapter demos exercise the same simulation events.

`createReadinessDemo` prepares development-stage previews by replaying the real prerequisite actions up to the requested check. It leaves that stage unfinished, so controls remain playable without bypassing the normal receipt gates. `createJourneyDemo` uses the same preparation sequence through liftoff.

`ReturnTestLab.tsx` provides controls and a scalable, shaded SVG playfield. It adds no network assets or WebGL requirement. Its clock stops while the tab is hidden or the centralized orientation/loading lifecycle is frozen. Audio runs through `SoundEngine`, with existing engine sound and dedicated canopy/splash effects. CSS includes compact landscape layouts and reduced-motion support. Buttons, range input and hold ignition support keyboard operation.

The former green status-only system strip, card numbering, generic “Tap to test” labels and repeated fuel-success paragraph have been removed. Generic mission chips and repeated notes/edit controls are omitted from readiness screens; equipment editing remains available when an incomplete kit needs repair, and crew editing remains on the crew page.
