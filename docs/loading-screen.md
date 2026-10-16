# Space-Themed Loading Screen & Subsystem Preloading Architecture

## 1. Overview & Architectural Purpose

The **Loading Screen Component** ([LoadingScreen.tsx](file:///d:/RUNNING_PROJECTS/_nasaspaceappschallenge-2k26/exovisionaries2026/src/components/common/LoadingScreen.tsx)) serves as an architectural shield and cinematic entry point for **Exovisionaries-2k26**:
1. **Cinematic Progression Flow**: 
   - **Step 1: Intro Splash**: On initial visit of the day/session, a solid pitch-black screen presents `"ExoVisionaries-2k26 Presents"`.
   - **Step 2: Looping NASA Carousel**: The intro splash smoothly cross-fades to reveal an endlessly looping full-screen carousel of authentic NASA space exploration imagery and educational captions.
   - **Step 3: Real Progress Tracking**: A sleek glowing progress bar tracks real background engineering tasks from `0%` to `100%`.
   - **Step 4: Seamless Reveal**: As soon as backend engineering tasks complete, the loader smoothly exits.
2. **Real Subsystem Shielding**: Rather than relying on simulated timer ticks, the progress bar tracks real background engineering tasks—including dynamic module chunk loading, Three.js 3D procedural geometry compilation, PBR materials, Web Audio synthesizer initialization, texture decodes, and state hydration.
3. **Lifecycle Integration**: Automatically triggers both at initial application landing (preloading everything up until mission start) and upon mission entry (preloading heavy 3D rocket assembly, flight physics, and lunar viewports).
4. **Orientation Synchronization**: Automatically pauses carousel cycling and asset loading whenever orientation is blocked in portrait mode by `OrientationGuard`, and holds underlying game interactions inert while loading is active.

---

## 2. Environment Configuration (`.env.example`)

All timing values, minimum durations, and deliberate visual testing delays are retrieved dynamically from Vite environment variables (with fallback defaults) via [loadingConfig.ts](file:///d:/RUNNING_PROJECTS/_nasaspaceappschallenge-2k26/exovisionaries2026/src/config/loadingConfig.ts):

| Environment Variable | Default Value | Description |
|---|---|---|
| `VITE_LOADING_PROGRESS_MULTIPLIER` | `1` | Multiplier mechanism to simulate weak network conditions by slowing down progress bar loading X times (e.g. `2`, `3`, or `5`). Does not alter carousel slide timing or hold the splash screen. |
| `VITE_SLIDE_DISPLAY_MIN_MS` | `2800` | Minimum duration in milliseconds each carousel slide remains active. |
| `VITE_INTRO_SPLASH_DISPLAY_MS` | `1800` | Optional display duration for generic splash screens. |

To customize these settings locally, copy `.env.example` to `.env` or `.env.local` and adjust the variables.

---

## 3. Component Architecture & Data Flow

```
                           +---------------------------+
                           |       src/App.tsx         |
                           +-------------+-------------+
                                         |
                                         v
                         +-------------------------------+
                         | <LoadingScreen /> [Global UI] |
                         +---------------+---------------+
                                         | Reads state & progress
                                         v
+-------------------------------+-------------------------------+
|      loadingStore.ts          |       assetPreloader.ts       |
| - isLoading (default: true)   | - preloadEntrySubsystems()    |
| - isPaused                    |   * 40% Dynamic Code Modules  |
| - progress (0-100 real)       |   * 30% 3D Moon Shaders       |
| - showIntroSplash             |   * 20% Heavy Character Art   |
| - pendingTasks (Promises)     |   * 10% Audio & State         |
+-------------------------------+ - preloadMissionSubsystems()  |
                                |   * 40% 3D Workshop & Flight  |
                                |   * 30% Rocket PBR Meshes     |
                                |   * 20% Crew Dossiers         |
                                |   * 10% Launch Acoustics      |
                                +-------------------------------+
                                         |
                                         v
                         +-------------------------------+
                         |       loadingEngine.ts        |
                         | - preloadImage(url)           |
                         | - Browser Cache Storage API   |
                         |   (7-day inactivity purge)    |
                         | - Intro Splash Evaluator      |
                         +-------------------------------+
```

---

## 4. Key Functional Behaviors

### 4.1 Intro Splash Screen Flow
- When landing into the app, the pitch-black Intro Splash screen displays with zero container mount animation, followed by sequential text line animations powered by Framer Motion:
  > **NASA Space Apps Challenge 2026** (400ms delay, 400ms duration)  
  > **ExoVisionaries-2k26 PRESENTS** (800ms delay, 400ms duration)  
  > **A JOURNEY BEYOND THE HORIZON** (1200ms delay, 400ms duration, responsive typography)
- **Fluid Transition**: As soon as text animations complete at 1600ms, the splash screen fades out with a 400ms exit animation.
- **Concurrent Asset Preload**: While the splash sequence plays, entry assets and carousel images preload concurrently in the background without layout shift.
- **Carousel & Progress Synchronization**: Once the intro splash finishes exiting, the carousel mounts and the glowing progress bar starts strictly from `0%`, smoothly interpolating up to 100% based on backend engineering readiness.

### 4.2 Looping Carousel & Guaranteed Dismissal
- The NASA carousel slides cycle continuously (`0 -> 1 -> 2 -> 3 -> 4 -> 0 -> 1...`) for the duration of the loading process.
- The carousel is decoupled from the progress percentage: the progress bar reflects real engineering completion, while the carousel provides continuous ambient cosmic imagery until engineering workloads finish.
- When progress reaches 100%, the loading screen container performs a smooth 500ms fade-out and dismisses cleanly into the game. Subsequent mission loads reset state and proceed smoothly without sticking.

### 4.3 Real Subsystem Preloading Pipeline
- **Entry Preloading** (`preloadEntrySubsystems`):
  - Preloads `HomeViewport.tsx` 3D Moon sphere and shaders, `SelectionScreens.tsx`, `sources.ts`, `parts.ts`, `/story/crew-welcome.png`, `/story/mission-control.png`, and the 5 NASA loading slides.
- **Mission Preloading** (`preloadMissionSubsystems`):
  - Triggered when starting any mission or demo.
  - Preloads `WorkshopScreen.tsx`, `WorkshopViewport.tsx`, `Assembly.tsx`, `RocketBuilder3D.tsx`, `FlightScreen.tsx`, `FlightScene3D.tsx`, `SystemTests.tsx`, all lunar mission viewports, `/story/pilot.png`, and `/story/sarah-jenkins.png`.
  - Always concludes by setting progress to 100% in a safe `finally` block. As soon as all tasks finish, the loader dismisses.

### 4.4 Universal Lifecycle Freeze & Loading Screen Halting
- **Unified Engine Suspension**: When `LoadingScreen` is active (`isLoading = true`) or when `OrientationGuard` blocks in portrait mode (`isBlocked = true`), the entire application state halts via the centralized lifecycle store (`src/state/orientationLifecycleStore.ts`):
  - **Simulation Loops Halted**: Descent physics, flight timers, lunar rover telemetry, and automated assembly are paused in-place. If the user reloads in the middle of a mission and restarts, no underlying game ticks or progress advance behind the loading screen.
  - **Audio & Spoken Dialogue**: Web Audio synthesizer contexts are suspended in-place via `SoundEngine.pauseAll()`, and active spoken narration is held silent. Spoken dialogue is prevented from starting until loading completes; upon unfreezing at 100% progress, dialogue replays from the beginning of the line so the player hears the complete context without clipping or browser synthesis freeze.
  - **Orientation Pause on Loader**: While the orientation guard is active, the loading screen's intro splash timer, carousel hold timer, and visual progress interpolation freeze with exact millisecond precision.
  - **Background Preloader Exemption**: Heavy asynchronous engineering tasks (`preloadEntrySubsystems`, `preloadMissionSubsystems`, Three.js geometry compilation, audio buffer synthesis) **continue spinning unhindered** in the background, ensuring all assets are fully resolved when the loading screen reaches 100%.
  - **Seamless Continuation**: When loading reaches 100% and dismisses, `orientationLifecycleStore` unfreezes, resuming Web Audio, replaying spoken dialogue, and continuing mission simulation seamlessly.
- While `LoadingScreen` is active, the underlying game views are rendered inert and protected from clicks or key events.

### 4.5 Browser Cache Storage & 7-Day Inactivity Purge
- Preloaded images and assets are stored in the browser's native **Cache Storage API** under cache name `'exovisionaries-assets-v1'`.
- The system records `exovisionaries_cache_last_active_v1` in `localStorage`.
- On boot, if `Date.now() - lastActive > 7 days` (604,800,000 ms), the cache is purged via `caches.delete('exovisionaries-assets-v1')`, handing storage lifecycle management to the browser.
