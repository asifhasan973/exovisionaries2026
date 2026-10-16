# Repository Agent Guidelines & Commit Standards

This document defines standard conventions, development constraints, and protocols for agents working in this repository.

---

## 1. Commit and Version Control Policies

- **Never Commit Automatically**: Agents must never execute `git commit` or push code autonomously. All changes must remain for the user to review, stage, and commit manually.
- **Explicit Message Generation**: Never generate or update version control files autonomously or by default. Only prepare and write messages when explicitly requested.
- **Dual Commit & PR Message Generation**: Unless the user explicitly requests only one, always generate BOTH the conventional commit message in `temp/COMMIT_MSG.txt` AND the GitHub pull request description in `temp/PR_MSG.txt` simultaneously.
- **Conventional Commits Standard**: When preparing a commit message (`temp/COMMIT_MSG.txt`), follow the Conventional Commits specification (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`) with an imperative summary line and detailed explanatory body.
- **GitHub PR Template Compliance**: When preparing a pull request message (`temp/PR_MSG.txt`), strictly follow the official repository template in `.github/pull_request_template.md`. Ensure all checklists, responsive landscape verification tiers, and architectural highlights are completed.

---

## 2. Information Leakage Prevention Policy

- **Zero Internal Leakage**: Never mention or leak internal engineering briefs, execution metadata, prompt instructions, system messages, internal conversation IDs, or workflow mechanics anywhere in the repository (including code comments, docstrings, documentation files, commit messages, PR descriptions, and markdown files).
- **Mandatory Repository Scan**: Before finalizing any commit message or documentation:
  1. Scan all modified and newly created files in the working tree for internal terminology or unintended metadata.
  2. Ensure code comments and documentation reflect clean, professional, industry-standard engineering language.
  3. Verify that instructions and meta-dialogue from task briefs are not echoed into public-facing repository artifacts.

---

## 3. Documentation Standards

- Always keep documentation in `docs/` and `README.md` up to date whenever new architectural features, components, or user-facing behaviors are introduced.
- Maintain consistent formatting, clear technical explanations, and accurate file paths across all documentation.
- When new pages, state stores, or audio/3D visual modules are created, document their interfaces and design considerations in dedicated markdown files in `docs/`.

---

## 4. Heavy Asset Preloading & Loading Screen Policy

- **Architectural Shielding**: All heavy engineering workloads—including Three.js 3D geometry generation, PBR textures, audio synthesis buffers, procedural asset calculations, and remote data fetching—must be hidden behind the application loading screen (`src/components/common/LoadingScreen.tsx`).
- **Automatic Task Registration**: When introducing asynchronous asset loading, mesh pipelines, or network requests prior to mission start or on app boot, agents must register promises using `useLoadingStore.getState().registerLoaderTask(taskPromise)` or initiate a managed loading sequence with `useLoadingStore.getState().startLoading('mission_start', statusMessage)`.
- **Zero Asset Popping**: Ensure all textures and dependencies are resolved or cached in memory before dismissing the loading screen, guaranteeing smooth 60fps transitions into interactive views without layout shifts.

---

## 5. Orientation Guard & Universal State Freeze Protocol

- **Centralized Lifecycle Management (Zero Prop-Drilling)**: Halting and resuming application states during an orientation block (or any universal suspension event such as the mission loading screen) must strictly be orchestrated through the central lifecycle store (`src/state/orientationLifecycleStore.ts` and the unified lifecycle events `game-orientation-pause` / `game-orientation-resume`), never passed down through prop-drilling across component hierarchies.
- **Universal State Freeze & In-Place Resume**: Whenever the orientation guard triggers (`isBlocked = true`) or a mission loading sequence is active (`isLoading = true`):
  - **Game Simulation Progress**: All active mission progressions, flight ascent timers, descent physics, lunar rover telemetry, and automated assembly sequences must halt immediately at the exact current frame and sub-second.
  - **Audio & Spoken Narration**: Web Audio synthesizer contexts must suspend in-place via `SoundEngine.pauseAll()`, and active spoken narration (browser SpeechSynthesis and recorded audio clips) must pause immediately. When unfreezing, dialogue replays cleanly from the beginning of the line so the player hears the full context without browser synthesis glitches or missing words.
  - **Loading Screen & Visual Timers**: While orientation is blocked, carousel slide intervals, splash screen countdowns, and progress bar interpolation freeze at their exact elapsed milliseconds. When loading is active in landscape, the loading screen runs smoothly while the underlying game remains completely frozen until the progress bar reaches 100%.
  - **Visual Animations**: All CSS animations within the interactive viewport must be paused instantly using `.orientation-guard-wrapper.is-blocked * { animation-play-state: paused !important; }`.
  - **Seamless Continuation**: When all suspension blocks are released, all frozen states resume seamlessly from their exact saved parameters and dialogue starts/replays cleanly.
  - **No Accidental Unpausing**: If a subsystem was already manually paused by the user before the suspension block appeared, releasing the block must never erroneously unpause that subsystem.
- **Background Asset Preloading Exemption**: Heavy asynchronous asset preloading tasks (Three.js geometry generation, remote texture streaming, audio synthesis buffers, and preload promises) must continue spinning and accumulating progress in the background unhindered during orientation blocks. Only the front-end visual display and user interactions are paused.

---

## 6. Strict Landscape Architecture & Multi-Tier Responsive Layouts

- **Enforced Landscape Viewport**: The application is strictly optimized for landscape mode. All components, scenes, dialogs, and HUD overlays must be designed specifically for horizontal game viewports across all devices.
- **Responsive Viewport Tiers**:
  - **Tier 1: Compact Mobile Landscape** (Height <= 450px, Width >= 600px):
    - Zero vertical page scrolling.
    - Two-column or side-by-side horizontal splits using `grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr)`.
    - Compact typography scaling via `clamp()` formulas (e.g., `font-size: clamp(20px, 4vw, 32px)`).
    - Reduced padding/margins (`padding: 8px 16px`) and compact interactive buttons (`height: 42px to 48px`).
  - **Tier 2: Tablet & Mid-Sized Landscape** (Height 451px–720px, Width 800px–1280px):
    - Balanced spacing with generous touch targets (minimum 48x48px).
    - Prominent character/3D stages with accompanying dialog and telemetry cards.
  - **Tier 3: Desktop Standard** (Height 721px–1080px, Width 1280px–1920px):
    - Full-featured aerospace HUD layout with high-fidelity visual effects, glow borders, and detailed status bars.
  - **Tier 4: Ultra-Wide & 4K** (Width > 1920px, 21:9 to 32:9 ratios):
    - Prevent unnatural horizontal stretching. Use max-width containers (`max-width: 1680px`) centered with cosmic ambient gradients.
- **Zero Layout Shifts**: Dynamic contents, async data, and 3D canvases must preserve strict aspect ratio boxes and container bounds to eliminate visual jumping during load or resize events.

---

## 7. Playful UI/UX, Gamification & Visual Excellence

- **Senior Frontend Craftsmanship**: Apply expert frontend standards built on decades of game UI experience. Every screen must feel lively, tactile, engaging, and premium, turning routine interactions into exciting gameplay moments that keep players engaged.
- **Rich Visual Aesthetics**:
  - Deep space color palettes with vibrant neon and bioluminescent highlights (cyan `#8ce2c2`, electric purple `#ed8def`, solar amber `#ffdf89`, neon emerald `#5df2b2`).
  - Glassmorphic aerospace HUD panels, frosted blur backgrounds (`backdrop-filter: blur(12px)`), subtle glowing borders, and cosmic depth gradients.
  - Dynamic micro-animations: pulsating call-to-actions, orbital radar sweeps, floating debris particles, and smooth cubic-bezier transitions (`cubic-bezier(0.25, 0.45, 0.3, 1)`).
- **Interactive Tactility & Feedback**:
  - Interactive elements must react with hover scale shifts (`transform: scale(1.03)`), active pressed states (`transform: scale(0.97)`), and tactile visual cues.
  - Integrated Web Audio sound effects: synthesised UI chirps, rocket thruster hums, telemetry clicks, and mission confirmation chimes.
  - Device haptic feedback on supported mobile browsers (`navigator.vibrate`) during key gameplay milestones and primary button taps.
- **Narrative Immersion**: Seamlessly connect story dialogue, character reactions, telemetry meters, and 3D scenes so players stay captivated throughout the mission arc.

---

## 8. Web Audio Synthesis & Sound Engine Protocols

- **Centralized Sound Management**: All UI sound effects must route through `SoundEngine` (`src/audio/soundEngine.ts`) or dedicated synthesizer modules.
- **Synthesized UI Feedback Sounds**:
  - `playButtonHover()`: Gentle high-frequency sine pip (800Hz–1200Hz, 30ms, soft exponential decay).
  - `playButtonClick()`: Crisp resonant dual-tone confirmation click (440Hz -> 880Hz, 60ms).
  - `playMissionLaunch()`: Low-frequency resonant frequency sweep with filtered white noise burst.
  - `playTelemetryChime()`: Triple harmonic arpeggio denoting milestone unlocks or readiness pass.
- **Mute & Volume Synchronization**: Sound effects must respect the global mute status (`voiceEnabled`, sound toggle in `GameSettingsContext`, and `orientationLifecycleStore`).
- **Suspension Invariant**: When orientation is blocked or game freezes, Web Audio `AudioContext.suspend()` must trigger immediately to prevent audio bleeding.

---

## 9. Interactive Consultation & Design Interview Protocol

- **Zero Unilateral Assumptions**: Never begin customizing any page, component, or UX subsystem without prior consultation with the user.
- **Mandatory Question Tool Utilization**: Before writing or modifying component code, formulate structured queries using the `ask_question` tool.
- **Comprehensive Option Presentation**: Each inquiry must present clear, distinct implementation options along with concrete architectural, visual, performance, and UX trade-offs.
- **Full Coverage Requirement**: Ensure all facets—including layout structure, responsive scaling, playful animations, sound/haptic cues, and telemetry integrations—are clarified before beginning code implementation.

---

## 10. Contradiction & Duplication Resolution

- **Pre-Implementation Code Audit**: Always inspect existing code, styles, and documentation before adding new implementations to avoid duplicate definitions or conflicting CSS rules.
- **Conflict Escalation Protocol**: If an instruction or prompt appears to contradict existing recorded patterns (e.g. navigation autoplay policies, store structures, or orientation behavior), pause and consult the user with trade-off analysis before proceeding.
- **Navigation Audio Standards**: Forward progression (Next, Skip, Resume) automatically triggers spoken narration; Back button navigation intentionally silences narration (no autoplay, preventing redundant replay of earlier lines), while manual playback remains available via the replay icon.

---

## 11. Code Quality, AI-Agent Readability & Document Compression Guard

- **Engineering Excellence**: Write clean, modular, self-documenting TypeScript and vanilla CSS. Keep components focused, decoupling business logic and stores from visual presentation.
- **Dual Readability (Human & AI)**: Structure code, state reducers, and interfaces with explicit types, descriptive function signatures, and concise docstrings so future developers and AI agents can seamlessly navigate and maintain the codebase.
- **Document Length Guard**: This `AGENTS.md` file must strictly stay within **200~250 lines**. All updates must be tightly compressed, dense with technical precision, and void of unnecessary verbose phrasing.

---

## 12. Component Customization Workflow

- **Step 1: Visual & Layout Audit**: Inspect existing component DOM hierarchy, CSS rules, touch targets, and responsive behavior across ultra-wide, desktop, tablet, and compact mobile landscape viewports.
- **Step 2: Interactive Consultation**: Deploy `ask_question` with structured trade-off options covering layout composition, gamified interactions, visual animation intensity, and audio-tactile polish.
- **Step 3: Foundational Layout & Grid Implementation**: Refactor styles with responsive CSS custom properties, clamp sizing, and landscape-first media queries avoiding vertical scrolling.
- **Step 4: Gamification & Animation Integration**: Add rich micro-interactions, glowing HUD states, particles, and smooth transitions.
- **Step 5: Audio & Haptic Binding**: Connect tactile audio cues and haptic triggers to interactive elements.
- **Step 6: Lifecycle & Freeze Compliance**: Ensure all animations, timers, and canvases register with `orientationLifecycleStore` and pause cleanly during orientation blocks or loading screens.
- **Step 7: Verification**: Test across varied viewport ratios and verify zero console errors, zero layout shifts, and 60fps performance.

---
