# Landscape Mode Enforcement & Orientation Guard

## Overview

The spacecraft cockpit, assembly hangars, 3D flight viewport, and telemetry consoles are designed for widescreen landscape presentation. To prevent distorted layouts, hidden interaction panels, and suboptimal touch targets, **Landscape Mode Enforcement** is integrated at the root application level via the `OrientationGuard` component (`src/components/common/OrientationGuard.tsx`).

Whenever a user accesses the application in portrait orientation or resizes their viewport below a 1:1 aspect ratio, the game presentation is safely suspended and an illustrated flight deck advisory screen directs the player to rotate their device.

---

## Behavior & User Experience

1. **Immediate Detection**: On initial page load or whenever orientation changes, the system assesses viewport and device orientation in real time without requiring a page reload.
2. **State Preservation & Input Inertia**: When portrait orientation is detected, the underlying game subtree is marked `inert` with `pointer-events: none` and `aria-hidden="true"`. All existing game state, active timers, dialogue progression, and assembly manifests remain preserved in memory.
3. **Themed Mission Advisory**:
   - High-contrast cosmic theme with radial lighting and twinkling starfields matching the project's visual identity.
   - Animated visual device rotation guide showing a smartphone pivoting from portrait to landscape alongside radar pulse waves and orbit rings.
   - Status beacon displaying active flight status: `Portrait Mode Detected • Game Paused`.
   - Clear instructional copy: *"Commander, the spacecraft flight deck and navigation systems require Landscape Orientation. Please turn your device sideways to continue your mission."*
4. **Fullscreen & Orientation Lock Assist**:
   - The primary action button, **Enter Landscape Fullscreen**, attempts programmatic switch to fullscreen (`requestFullscreen`) and requests `screen.orientation.lock('landscape')`.
   - On browsers where programmatic orientation lock is restricted by platform policy (such as iOS Safari or non-standalone web apps), an inline guidance tip gently reminds the player to unlock device auto-rotate.
5. **Seamless Dismissal**: The moment landscape orientation is restored, the blocker overlay unmounts instantly and full interactivity returns to the game.

---

## Universal State Freeze & Resumption

Orientation halts are coordinated centrally via `src/state/orientationLifecycleStore.ts` and unified lifecycle events (`game-orientation-pause` / `game-orientation-resume`):

- **Simulation Loops**: Active mission progressions, flight ascent timers, descent physics, lunar rover telemetry, and automated assembly sequences halt immediately.
- **Audio & Spoken Narration**: Web Audio synthesizer contexts suspend in-place via `SoundEngine.pauseAll()`, and active narration pauses immediately. When resumed, dialogue replays cleanly from the beginning of the line to ensure full context.
- **CSS Animations**: Interactive viewport animations freeze instantly via `.orientation-guard-wrapper.is-blocked * { animation-play-state: paused !important; }`.
- **Preloading Workloads**: Background asset preloading tasks continue accumulating unhindered during orientation blocks.

---

## Testing & Diagnostics

1. **URL Parameter**: Append `?forcePortrait=true` to any application route (e.g., `http://localhost:5173/?forcePortrait=true`). This forces the orientation blocker active regardless of physical window dimensions.
2. **DevTools Device Emulation**: Open DevTools, enable device emulation, select a mobile profile, and toggle between portrait and landscape viewports.
3. **Responsive Window Sizing**: Drag the browser window width narrower than its height to verify instantaneous activation and dismissal.
