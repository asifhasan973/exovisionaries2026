# Final laptop review — return, replay and evidence

2026-10-13, local working branch. Backup: `.codex/backups/zero-to-beyond-before-final-review.tar.gz`. This is source review plus short manual checks, not a claim of a full production or mobile release pass. No test program, build/lint/typecheck, GitHub push or deployment was run.

## Corrections

- Return Hint/help pauses the clock, but previously Brake/Align/Heat shield clicks were silently ignored while paused. An explicit cockpit action now resumes first and then passes through the real reducer. Invalid docking and nose-first entry remain rejected; opening help alone does not resume time.
- Restarting preparation from a science/recovery checkpoint preserves the auto-build/Judge provenance of the retained blueprint. The optional restart text now explicitly describes a simulation reset, clearing flight/science without awarding crew recovery.
- Landing/surface keyboard shortcuts leave focused buttons, links, form fields and open dialogs alone. W/ArrowUp hold controls apply only to manual driving; a key release no longer pauses a guided rover.
- Paused landing and guided-surface Hint point to Resume; manual hold driving still points to the hold control. Hand captions near the footer sit above the pointer and clamp their horizontal starting position so they are readable.

## Manual outcomes

Both runs started at **assisted return chapters**, whose earlier readiness/surface/science receipts are produced by the existing real reducers. They are not full manual playthroughs from the name screen.

| Check | Observed result |
|---|---|
| Geology docking after Hint | Brake changed closing speed from 1.20 to 0.85 m/s immediately; no extra Resume click needed |
| Unsafe docking | Rejected, with crew still waiting; braking/alignment then allowed transfer of all three to the command module |
| Wrong re-entry choice after help | Nose first was rejected; choosing the shield started entry |
| Earth parachutes | Offered only after entry; crew recovered at splashdown |
| Geology debrief | Success, 3 crew, 33 delivered SP, 0.2 kg sealed samples, 6.49 mission days |
| Ice debrief | Partial, 3 crew, 12 delivered SP, water not confirmed, 0 kg physical samples |
| Refresh and Resume | Each result retained its evidence, resources and recovered crew |
| JSON exports | Geology: 6 transmitted records; Ice: 3 transmitted records. Correct outcomes, samples and assistance disclosures |

Exact Geology export: 6.485126521687513 days, 10.54462043493746 crew-days remaining, 206.6141780876998 kWh cabin energy. Those equal 30 initial crew-days minus three people’s elapsed time, and 300 initial kWh minus the authored 600-W cabin load over that time. Ice follows the same accounts with its own surface-operation duration. Three days of skipped visual coast are still charged to the mission clocks.

Export proof files generated through the UI:

- `/Users/asifhasan/Downloads/zero-to-beyond-geology-log (1).json`
- `/Users/asifhasan/Downloads/zero-to-beyond-moon-log (1).json`

`ice-partial-debrief.jpg` shows the honest Ice partial result; negative/inconclusive evidence is not relabeled as a discovery. The normal Asif mission remained separate from these tab-local demos.

## Limits

The return gates, partial/success result paths, exports and refresh were checked this turn. Keyboard focus guards, restart provenance and caption placement received source review. Confirmed-water expedition variants, every incident/crew/kit combination, full name-to-splashdown play, intentionally failed GPU/assets/storage, production build, mobile and deployment were not newly verified. Earlier module reviews record the earlier chapter checks. None of the pending release checks is represented as passed.
