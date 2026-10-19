# PWA integration compatibility fixes

The PWA, loading, archive and responsive layout additions retain the existing
mission and saved-progress rules.

- Global orientation/loading suspension gates mission events without changing
  manual pause state. Removing a block cannot dismiss a user's pause menu.
- Automatic assembly pauses its remaining timeout delays during suspension and
  resumes without installing hidden parts while blocked.
- Loading makes background game content inert and blocks background keyboard
  shortcuts. Splash duration uses `VITE_INTRO_SPLASH_DISPLAY_MS` (2800 ms by
  default); stale preload jobs cannot finish a newer sequence. Optional loader
  failures settle to the existing playable fallback path.
- Voice and effects preferences are independent. Archive master mute temporarily
  silences both without overwriting those preferences or deactivating the archive.
- Narration invalidates cancelled playback callbacks and watchdogs before replay
  after an engine suspension. Manually paused narration is not engine-resumed.
- Both npm and pnpm lockfiles are retained. `npm ci` and the production build
  (TypeScript, Vite and PWA generation) succeeded with the updated npm lockfile.

Focused browser checks covered clean loading completion, both voice/effects
preference combinations, and a paused flight across portrait/landscape. Flight
telemetry remained at 57 km / 2.32 km/s with the menu open; explicit Back to game
resumed it. No full mission replay, physical-device audio audition, actual PWA
installation or deployment is claimed by these checks.

Cloudflare deployment remains conditional on repository credentials and an
existing Pages project. Its credentials and project are not provisioned here.

The subsequent debug/workshop update is integrated with these fixes:

- Debug route changes remount the experience, preserving normal saved progress
  when leaving an ephemeral session. Debug navigation is disabled in every
  production build, including builds with copied development environment values.
- Workshop cards retain keyboard activation and an Install fallback if 3D fails.
  Repair guidance opens the correct inventory category and brings its highlighted
  target into view. Hidden inventory controls leave the keyboard focus order.

Focused checks of the subsequent update confirmed keyboard installation in the new drawer and preservation of the normal saved adventure after exiting an edited debug session. The latest update also needed a missing `StoryStepId` type import to compile.
