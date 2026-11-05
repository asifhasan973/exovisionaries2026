# Repository Agent Guidelines & Commit Standards

This document defines standard conventions, architectural standards, and development protocols for agents working in this repository.

---

## 1. Commit and Version Control Policies

- **Never Commit Automatically**: Agents must never execute `git commit` or push code autonomously. All changes must remain for the user to review, stage, and commit manually.
- **Explicit Message Generation**: Never generate or update version control files autonomously. Only prepare messages when explicitly requested by the user.
- **Dual Commit & PR Generation**: Generate BOTH the conventional commit message in `temp/COMMIT_MSG.txt` AND the GitHub pull request description in `temp/PR_MSG.txt` simultaneously.
- **Standards & Templates**: Follow Conventional Commits (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`) with an imperative summary line. For PR messages, strictly adhere to `.github/pull_request_template.md` (checklists, responsive tiers, architecture).

---

## 2. Information Leakage Prevention Policy

- **Zero Internal Leakage**: Never mention or leak internal engineering briefs, execution metadata, prompt instructions, system messages, conversation IDs, or workflow mechanics in code, comments, docs, commit messages, or PR descriptions.
- **Mandatory Repository Scan**: Before finalizing messages or docs: (1) Scan modified/created files for internal terminology or unintended metadata; (2) Ensure comments reflect clean industry standards; (3) Verify task briefs are not echoed.

---

## 3. Monorepo Package Boundaries & Core Package Segregation

- **Core Package Segregation**: Generic primitives, datasets, and pure mathematical engines live strictly in packages; `apps/web` acts purely as an orchestration layer:
  - `@exo/engine` (`packages/engine`): NASA physics models, orbital mechanics, mass/power budget accounting, flight trajectory velocity calculations, and loader engine scheduling.
  - `@exo/data` (`packages/data`): Historical flight archives (`archive/`), aerospace parts catalog (`parts/`), candidate crew dossiers (`missions/`), and landing site manifests.
  - `@exo/audio` (`packages/audio`): Web Audio synthesizer (`soundEngine.ts`, `synthEffects.ts`) and global audio state (`audioStore.ts`).
  - `@exo/ui` (`packages/ui`): Aerospace HUD primitives, `OrientationGuard`, `LoadingScreen`, `CosmicBackground`, `ProgressRing`, `GameInfo`, and vector icon sets.
  - `@exo/tsconfig` (`packages/tsconfig`): Shared TypeScript compiler configurations (`base.json`, `react-library.json`, `node-library.json`).
- **Application Orchestration (`apps/web`)**: Coordinates game routing, screen rendering, Three.js 3D viewport canvas mounts, and player session persistence.
- **Dependency Flow**: Strict downward flow from `apps/web` into `@exo/*`. Packages never import `apps/web`. Link packages with `"workspace:*"` and mirror in Vite `resolve.alias`.

---

## 4. Domain-Driven Feature Slices & Codebase Layout

- **Feature Directory Taxonomy (`apps/web/src/features/`)**:
  - `features/narrative/`: Mission flow definitions, branching choices, character dialogue engine, and voice narration controllers.
  - `features/workshop/`: Lander & rover design bay, component assembly grid, and auto-build engine.
  - `features/crew/`: Candidate crew dossiers, skill matrices, seat assignments, and 3D crew viewer.
  - `features/readiness/`: Pre-flight checklists, packing bay, systems telemetry verification, and radar repair.
  - `features/flight/`: Launch countdown, multi-stage ascent, staging physics, and Earth orbit insertion.
  - `features/landing/`: Trans-lunar injection, powered descent steering, shadow hazard detection, and touchdown.
  - `features/surface/`: Lunar surface deployment, EVA operations, rover course navigation, and fieldwork.
  - `features/science/`: Subsurface ice drill, spectrometry, core sample analysis, and thermal logging.
  - `features/hazards/`: Dust mitigation, sensor recalibration, emergency holds, and hazard recovery.
  - `features/return/`: Ascent staging, lunar departure, Earth atmospheric re-entry, and mission debrief.
  - `features/archive/`: Historical NASA flight timeline, mission detail modals, and educational manifests.
- **Shared Application Slices (`apps/web/src/shared/`)**: `shared/shell/` (StoryShell, MissionBoundary, GestureGuide), `shared/styles/` (design tokens, typography, App.css), `shared/services/` (assetPreloader, nasaApiService), `shared/debug/` (toolbar, catalogs, seeders).

---

## 5. File Size Ceiling & Directory Density Guard

- **Strict 250-Line Non-CSS Guard**: Any TypeScript or TSX file exceeding 250 lines must be proactively modularized into focused sub-components, custom hooks, or utility helpers.
- **Directory Density Limit**: Directories must contain at most 12 files. Group larger sets into domain subdirectories with a unifying `index.ts` barrel export.
- **CSS Stylesheet Preservation**: Do NOT split internal lines of CSS stylesheets. Keep CSS files intact, cohesive, and format/prettify cleanly.
- **Facades & Exports**: Preserve backwards-compatible re-export facades at legacy paths during migrations. Prefer explicit named exports over default exports.

---

## 6. Static Asset Taxonomy & Type-Safe Registry

- **Domain-Categorized Public Hierarchy**: Static assets in `apps/web/public/` strictly reside in domain folders: Audio (`public/story/audio/<domain>/` with 16 categorized domains), Character Sprites (`public/story/characters-v1/`), Textures/Models (`textures/<domain>/`, `models/<domain>/`).
- **Type-Safe Asset Registry**: All static assets must be cataloged in `assetRegistry.ts` with automated path verification against disk, preventing 404 runtime errors.
- **Asset Formats**: Prefer modern WebP for images/sprites and compressed MP3/OGG for audio to minimize mobile download payloads.

---

## 7. Heavy Asset Preloading & Loading Screen Policy

- **Architectural Shielding**: All heavy workloads (Three.js geometry generation, PBR textures, audio buffers, procedural calculations, remote data) must hide behind `LoadingScreen`.
- **Automatic Task Registration**: Register async promises via `useLoadingStore.getState().registerLoaderTask(taskPromise)` or launch managed sequences with `useLoadingStore.getState().startLoading('mission_start', statusMessage)`.
- **Zero Asset Popping & Carousel**: Ensure all textures/dependencies resolve before dismissing the loading screen for smooth 60fps transitions. Display educational carousel tips during loading.

---

## 8. Orientation Guard & Universal State Freeze Protocol

- **Centralized Lifecycle (Zero Prop-Drilling)**: Suspend/resume states strictly through `useOrientationLifecycleStore` and `game-orientation-pause` / `game-orientation-resume` events.
- **Universal State Freeze**: When `isBlocked = true` or `isLoading = true`:
  - *Simulation*: Progression, flight ascent, descent physics, rover telemetry, and assembly halt at exact frame/sub-second.
  - *Audio/Speech*: Web Audio suspends via `SoundEngine.pauseAll()`; speech narration pauses and replays line cleanly on resume.
  - *Timers & CSS*: Progress bar and slide intervals freeze; CSS animations pause via `.orientation-guard-wrapper.is-blocked * { animation-play-state: paused !important; }`.
  - *Preloading Exemption*: Asynchronous asset preloading continues unhindered in the background. Manually paused subsystems remain paused on resume.

---

## 9. Strict Landscape Architecture & Multi-Tier Responsive Layouts

- **Enforced Landscape Viewport**: Optimized strictly for horizontal viewports across all devices. Zero vertical page scrolling (`overflow: hidden`).
- **Responsive Viewport Tiers**:
  - *Tier 1: Compact Mobile Landscape* (H <= 450px, W >= 600px): Side-by-side splits (`grid-template-columns: minmax(0,1fr) minmax(0,1.1fr)`), `clamp()` typography, compact buttons (42-48px).
  - *Tier 2: Tablet Landscape* (H 451-720px, W 800-1280px): Balanced spacing, >= 48px touch targets, character/3D stages with dialog cards.
  - *Tier 3: Desktop Standard* (H 721-1080px, W 1280-1920px): Full aerospace HUD, glow borders, and telemetry status bars.
  - *Tier 4: Ultra-Wide/4K* (W > 1920px): Max-width container (`max-width: 1680px`) centered with cosmic ambient gradients.
- **Zero Layout Shifts**: Canvases and containers must preserve strict aspect ratio boxes during load and resize events.

---

## 10. Playful UI/UX, Gamification & Visual Excellence

- **Aesthetics & Micro-Animations**: Deep space palettes with vibrant neon (cyan `#8ce2c2`, purple `#ed8def`, amber `#ffdf89`, emerald `#5df2b2`), glassmorphic HUDs (`backdrop-filter: blur(12px)`), glow borders, pulsing CTAs, radar sweeps, and cubic-bezier transitions (`cubic-bezier(0.25, 0.45, 0.3, 1)`).
- **Tactility & Audio-Haptic Feedback**: Hover scale shifts (`transform: scale(1.03)`), active press states (`scale(0.97)`), synthesized UI chirps/hums, and mobile haptic feedback (`navigator.vibrate`) on key milestones.

---

## 11. Web Audio Synthesis & Sound Engine Protocols

- **Centralized Sound Management**: UI sound effects route through `sound` (`packages/audio/src/soundEngine.ts`) and generators in `synthEffects.ts`.
- **Synthesized UI Sounds**: `playButtonHover()` (sine pip 800-1200Hz, 30ms), `playButtonClick()` (dual-tone click 440->880Hz, 60ms), `playMissionLaunch()` (resonant sweep + filtered noise), `playTelemetryChime()` (triple harmonic arpeggio). Respects global mute (`useAudioStore`) and suspends during orientation blocks.

---

## 12. Interactive Consultation & Design Interview Protocol

- **Zero Unilateral Assumptions**: Never customize pages, components, or subsystems without prior consultation.
- **Structured Questions**: Formulate queries using `ask_question` presenting distinct implementation options with architectural, visual, performance, and UX trade-offs across layout, scaling, gamification, and audio.

---

## 13. Contradiction & Duplication Resolution

- **Code Audit First**: Inspect existing code, styles, and docs before adding implementations to prevent duplicate definitions or conflicting CSS rules. Consult user on conflicts.
- **Navigation Audio**: Forward navigation (Next, Skip, Resume) autoplays spoken narration; Back navigation silences autoplay to avoid redundant replay (replay button remains available).

---

## 14. Code Quality, AI-Agent Readability & Document Compression Guard

- **Engineering Standards**: Clean, modular, self-documenting TypeScript and vanilla CSS. Decouple business logic and stores from visual presentation.
- **Dual Readability & Type Safety**: Explicit types, descriptive function signatures, concise docstrings, and zero `any` types. Model mission events with discriminated unions.
- **Document Length Guard**: This `AGENTS.md` file must strictly stay within **200~250 lines**. Updates must be tightly compressed and dense with technical precision.

---

## 15. Component Customization Workflow

- **Execution Flow**: (1) Visual & Layout Audit across viewport tiers; (2) Interactive Consultation via `ask_question`; (3) Foundational Layout & Grid Implementation with clamp sizing; (4) Gamification & Animation Integration; (5) Audio & Haptic Binding; (6) Lifecycle & Freeze Compliance with `orientationLifecycleStore`; (7) Multi-ratio verification with zero errors and 60fps performance.

---

## 16. Subsystem Verification & CI Build Pipeline

- **Automated Validation Sequence**: Before completing tasks, execute:
  1. `pnpm run lint`: Zero warnings and zero errors across workspace packages via `oxlint`.
  2. `pnpm --filter <pkg> exec tsc --noEmit`: Strict TypeScript type checking without emitting artifacts.
  3. `pnpm run build`: Full Turborepo build pipeline and Vite production bundling.
- **Zero Degradation Invariant**: Refactorings and features must preserve 100% backwards compatibility and existing gameplay mechanics.

---

## 17. Progressive Web App (PWA) & Offline Continuity

- **Platform Guides & Precaching**: Tailored install guides (`DesktopInstructions`, `AndroidInstructions`, `IosInstructions`) via `usePwaStore`. Workbox service worker precaches game bundles, 3D assets, and audio for offline aerospace simulation.
- **Storage Resilience**: Handle localStorage quota limits and Safari private mode via fallback in-memory stores without interrupting missions.

---

## 18. Three.js WebGL & 3D Rendering Performance Protocols

- **Resource Disposal**: Recursively traverse mesh hierarchies and invoke `geometry.dispose()` and `material.dispose()` via `disposeGroup()` on unmount to prevent WebGL memory leaks.
- **Resilience & Budgets**: Intercept `webglcontextlost` and render `SceneFallback.tsx`. Limit mobile draw calls to <= 65 per frame. Use instanced meshes and compressed geometry for repeating terrain/starfields.

---

## 19. Mission State Machine & Immutable Reducer Architecture

- **Predictable Transitions**: State progression flows strictly through pure reducers (`reduceMission()`, `reduceStoryProgress()`) producing immutable state snapshots.
- **Milestones & Seeding**: Track chapter completions via `trackMilestoneTransition()`. Maintain deterministic mock session builders (`createDebugSession()`) for rapid developer testing.

---

## 20. Accessibility & Universal Usability Standards

- **Accessible Semantics**: Semantic `<main>`, `<header>`, `<nav>` landmarks, ARIA live region announcements for canvas telemetry, focus trapping in modal dialogs with instant `Escape` key support, and >= 4.5:1 text contrast ratios against deep space backgrounds.

---

## 21. Error Boundaries & Fault-Tolerant Viewport Mounts

- **Component Shielding**: Wrap dynamically loaded screens in `<MissionBoundary frame={frame} onReload={...} />`. Preserve latest valid progress session during runtime failures and provide transparent recovery actions (retry, mission control hub, diagnostics).

---

## 22. NASA Historical Data Integrity & Educational Compliance

- **Empirical Accuracy**: Flight specifications, lunar site geology, and mission timelines must reflect authentic NASA technical publications. Cite primary sources in `MissionSources.tsx` and provide interactive term definitions in `glossary.ts`.

---

## 23. Design System & CSS Token Architecture

- **Token Architecture**: Enforce unified CSS custom properties across stylesheets (`--ink`, `--purple`, `--lavender`, `--cream`, `--yellow`, `--mint`, `--line`). Utilize fluid `clamp()` scaling and maintain the zero-scroll invariant (`overflow: hidden`).

---

## 24. Security, Isolation & Environment Boundaries

- **Sandboxed Execution**: Run commands within sandboxed runtime boundaries by default. Production builds must never leak development flags (`isDevelopment`), mock seeders, or debug toolbar routes. Prevent unsafe eval or unsanitized dynamic scripts.

---

## 25. Performance Profiling & React Render Cycle Optimization

- **Render Optimization**: Memoize expensive Three.js calculations (`useMemo`, `useCallback`), cancel `requestAnimationFrame` IDs on unmount, scope telemetry to dedicated Zustand slices, pre-allocate Three.js vector/quaternion instances outside animation loops, and audit code-split chunks.

---
