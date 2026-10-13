# Module 12 — laptop integration and Judge experience

Delivered locally on `feat/full-moon-foundation`, 2026-10-13. Backup: `.codex/backups/zero-to-beyond-before-module12.tar.gz`. No GitHub push, commit, deployment, mobile work or automated tests/build/lint/typecheck were performed, following the user's current scope.

## Implemented

- Typed, objective-aware Judge chapters replace positional boolean flags. Menu groups: Start here, Flight, Science, Return. At most three chapter buttons per group; no scrolling list of eleven shortcuts. Loading/cancellation/errors leave the normal mission intact. Checkpoint creation verifies the prior reducers actually reached the advertised chapter; a failed replay cannot masquerade as a successful checkpoint.
- Battery challenge uses the live Ice kit and a 100-cm rehearsal. A 100-Wh battery exposes a real energy failure; Fix opens the recommended battery. Replacing it or drilling less changes the calculation. Rechecks still require cabin, mass, rehearsal and subsequent validation receipts. No fictional science result is awarded by this comparison.
- Auto-build and Judge provenance survive saves and same-blueprint retries. Guided launch, launch skip and chapter-specific assistance are included in the ending and downloaded JSON. Buying tools, assistance and skipping still cannot create science observations or recovered crew.
- Save dependencies include sensor plan, sensor placement, samples and repair guidance. Repair targets restore from known catalog entries and code-owned voice/text; they never restore approvals. A corrupt newer envelope no longer hides a compatible older save. Future-version envelopes remain protected from overwriting.
- A chapter import/render failure retains navigation through a mission boundary. Reload first attempts a save; if saving fails, it stays in the tab and returns home instead of discarding progress.
- Optional Sources panel separates NASA capability references from authored credits, masses, energy tiers, terrain, readings, flight allowances and safety thresholds. Exported logs include this source/model boundary register. Existing source URL-array shape remains; detailed references are an additional field.

## Manual check actually performed this turn

1. Opened the grouped Judge menu and Battery challenge. It reached the real failed power rehearsal: 100 Wh battery, 20 Wh reserve, energy fault.
2. Fix opened the Battery category with Medium highlighted. Replaced Small with Medium; Retest correctly returned to crew revalidation, rather than approving the changed spacecraft.
3. Resumed the isolated demo after the app refreshed during source edits. The repaired 220-Wh design and crew-check checkpoint remained intact.
4. Sealed the cabin, accepted the crew check, repaired the radar connector and weighed the 283-kg explorer.
5. Manually drove, drilled 100 cm and returned. The same rehearsal succeeded: **138 Wh / 63% remaining**, above the **44 Wh / 20% reserve**. This is the meaningful design comparison; it is not a mocked pass flag.
6. Opened/closed the Sources panel; the first page displayed linked NASA crew/return/rocket-equation references. Confirmed no runtime errors in the local browser log. Completed-rehearsal Hint now targets Next rather than a vanished trial button.

Source review covered isolation, canonical save restore, assistance labels, design invalidation, chapter gates, science/transmission provenance, return authorization and error handling. Prior Ice/Geology evidence and return checks are recorded in the earlier module review folders. No new full end-to-end Ice/Geology replay, deliberately forced corrupted save/WebGL failure, audible voice-quality audition, production build or release check is claimed. `judge-battery-comparison.jpg` is the proof view.

## Release boundary

Laptop features for Modules 1–12 are implemented. A fresh full integration pass and production verification remain unclaimed. Phone work and publishing are deferred, not silently treated as completed. See `JUDGE-DEMO.md` and `SCIENCE-SOURCES.md`.

The user-provided official challenge URL returned HTTP 502 during this audit; a domain-restricted search did not supply its full official text. The game implements the agreed complete-mission/engineering/resource/evidence premise, but this delivery does not invent additional judging requirements or assert that every official 2026 clause was reverified.
