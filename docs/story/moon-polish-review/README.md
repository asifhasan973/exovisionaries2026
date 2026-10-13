# Module 11 — laptop character, voice and onboarding polish

Implemented locally, 2026-10-13. No GitHub push or deployment. Earlier work is preserved in `.codex/backups/zero-to-beyond-before-module11.tar.gz` (source/docs/generator snapshot, not a replacement for the existing audio assets).

## Changes

- One narration owner across conversations, engineer reactions, flight comms and word explanations. New advice interrupts obsolete speech; buffering/paused recordings stop the actor’s mouth. Recorded voices work without browser speech synthesis. Existing Chief Guy / female Commander Sonia / male Commander Andrew clips and 1.5× speed remain.
- Canvas samples the playing recording’s time for mouth/gesture rhythm. Chief and Commander have different blink clocks. Open-mouth patches replace closed lips with a feathered mask, avoiding doubled lips. Discovery, analysis, waiting, burns and completion select registered expressions and poses; no new bitmap art was needed.
- Hand lessons point to actual buttons/ranges for route departure, science, sensor placement, docking alignment, heat-shield orientation and landing thrust. Burn hints target the direction button rather than its parent container. Reduced-motion mode uses a stationary pointer. Automatic demos are labeled and never dispatch mission actions or award evidence.
- Science battery/solar/load/radio HUD moved onto the scene to prevent a clipped battery label in a short laptop window. Choices, a larger engineer, and fixed Back/Hint/primary action remain visible. Idle crew no longer get mislabeled as cleaning.
- Journey, landing, surface/science and return have a lightweight illustrated 2D view if WebGL fails; lazy-scene failures are contained without losing the controls. Lost GPU contexts stop rendering. Existing hardware and mission resource/evidence rules remain shared.

## Verification and limits

Source review of ownership, stale-callback cancellation, registered cues, gesture selectors, canvas cleanup, fallback controls and HUD geometry. A short localhost check opened the isolated Geology science demo, replayed the engineer, used Hint, and checked that no science was earned or required task silently completed. The battery-clipping issue found there was corrected. No automated tests, build, lint or typecheck were run, per the user’s instruction. Full mission replay and deliberately forced WebGL failure were not performed for this visual module.

Talking animation follows playback activity and time; it is **not phoneme-accurate lip sync**, and no audio waveform/viseme analysis is claimed. Missing recorded clips can use a system voice; the exact natural voice is browser-dependent. Mobile work and full Ice/Geology integration verification belong to the remaining release scope (Module 12).

Proof: `desktop-polish.jpg`.
