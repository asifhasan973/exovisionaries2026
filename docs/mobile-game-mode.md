# Mobile game mode

## Restore point

The unchanged version before this work is saved locally and on GitHub as
`backup/before-mobile-game-mode-2026-10-10`, at commit
`8497c5b3fff00c16983f694fcbe90688654258df`.

New mobile changes are in the working tree. To inspect the backup without
overwriting those changes, open its branch on GitHub or use a separate Git
worktree. Do not reset the current checkout unless its newer changes have been saved.

## Behavior

- At the application root, the `OrientationGuard` component monitors orientation in real time across all views (`src/App.tsx`). When portrait orientation is detected, interaction is paused and an advisory screen instructs the user to rotate to landscape.
- **Centralized State Halting (Zero Prop-Drilling)**: Rather than drilling state down through component props, application halts during orientation locks and loading screens are orchestrated via `src/state/orientationLifecycleStore.ts`. When orientation is blocked or loading is active:
  - All mission simulation loops (flight ascent, lunar descent, surface exploration, and returns) halt in-place.
  - Spoken narration and Web Audio synthesizer voices suspend immediately. When resumed, dialogue replays cleanly from the beginning of the active line to provide complete audio context.
  - While orientation is blocked, intro splash and NASA carousel timers freeze with exact remaining millisecond precision.
  - Interactive CSS animations pause immediately via `.orientation-guard-wrapper.is-blocked * { animation-play-state: paused !important; }`.
  - Background asset preloading workloads continue spinning unhindered so dependencies are ready when the user rotates back to landscape or enters the mission.
- On mobile devices, Play now and Judge demo request fullscreen from the user click, then attempt landscape orientation locking where supported.
- If rotation cannot be programmatically locked, guidance informs the user to rotate manually. The blocker overlay also provides an **Enter Landscape Fullscreen** button.
- The in-game website navbar is replaced by compact Pause and Voice controls. Words, Settings, Fullscreen, Turn phone and Mission home are in Pause.
- Next and Hint stay in the bottom action dock. Landscape layouts use a compact paged parts tray alongside the 3D workshop, with shorter controls and dialogue.
- Opening Pause or rotation guidance pauses a running rover rehearsal or flight. Back to game restores the previously running activity. Help drawers leave it paused until the player resumes. Returning home releases fullscreen/orientation owned by this game and restores the normal website navbar.
- Safe-area padding leaves room for phone cutouts and the bottom home indicator.

## Adjust the implementation

- `src/state/orientationLifecycleStore.ts`: centralized lifecycle authority managing global freeze and resume state without prop-drilling.
- `src/components/common/OrientationGuard.tsx`: application-wide landscape orientation enforcement and blocker overlay.
- `src/components/common/orientationGuard.css`: cosmic blocker overlay styles, device rotation animation, and universal CSS animation freeze rule.
- `src/components/common/LoadingScreen.tsx`: pausable intro splash, carousel hold timers, and preloading progress synchronization.
- `src/audio/soundEngine.ts`: Web Audio suspension and resumption in-place.
- `src/game/story/narration.ts`: speech synthesis and voice recording pause and resume at current timestamp.
- `src/game/story/ExactStory.tsx`: decoupled event-based pause and resume for mission simulation sub-sessions.
- `src/game/story/mobileGame.css`: mobile sizes, layout, action dock and dialogs.
- `src/game/story/mobileGameContext.ts`: device/viewport detection.
- `src/game/story/MobileGame.tsx`: fullscreen, in-game controls and Pause menu.
- `src/game/story/SelectionScreens.tsx`: Play entry points and mobile name input.
- `src/game/story/StoryShell.tsx`: desktop versus mobile navigation.
- `index.html`: safe-area viewport metadata and browser theme color.

## Manual review

Reviewed the game in the browser using phone landscape sizes (844 × 390 and
667 × 375), phone portrait (390 × 844), and desktop (1280 × 800). Browser host
scaling changes the resulting CSS viewport; inspected actual DOM bounds as well.

Verified name/story flow, mission selections, manual part drag, animated auto
build, radar/mass check, drive/drill/return rehearsal, budget, three packing
actions, approval, launch countdown, booster separation, 2× speed, skip, result
and home. The reviewed landscape workshop and flight screens had no document
overflow. Pause stopped active rehearsal/flight and Back to game resumed them.
Words and Settings remain reachable. Portrait fallback and desktop navbar were
checked. No automated test suite was run, per the user's preference.

Fullscreen succeeded in the review browser. Physical Android/iPhone testing has
not been performed; fullscreen and automatic orientation locking depend on the
browser. The explicit rotate guide and upright fallback cover unsupported APIs.

![Mobile flight preview](previews/mobile-game.jpg)
