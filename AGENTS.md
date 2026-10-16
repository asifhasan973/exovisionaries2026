# Repository Agent Guidelines & Commit Standards

This document defines standard conventions, development constraints, and protocols for agents working in this repository.

---

## 1. Commit and Version Control Policies

- **Never Commit Automatically**: Agents must never execute `git commit` or push code autonomously. All changes must remain for the user to review, stage, and commit manually.
- **Explicit Commit Message Generation**: Never generate or update `temp/COMMIT_MSG.txt` autonomously or by default. Only prepare and write commit messages to `temp/COMMIT_MSG.txt` when the user explicitly asks for it.
- **Conventional Commits Standard**: When explicitly requested to prepare a commit message, follow the Conventional Commits specification:
  - Format: `<type>(<scope>): <short description>`
  - Permitted types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
  - Provide a concise summary line in imperative tense, followed by an explanatory body detailing the changes, context, and verification steps.

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

## 6. Responsive Landscape UI Customization & Interactive Consultation Protocol

- **Strict Landscape Architecture**: With landscape mode enforced across the game, all components, pages, and overlays must be crafted for super-responsiveness and playful UI across various landscape ratios (from ultra-wide mobile viewports to desktop 4K displays).
- **Interactive Interview Protocol**: Never make unilateral assumptions regarding UI/UX designs. Before starting customization on any page or component, the agent must ask queries via the interactive Question tool presenting multiple selectable options along with their architectural and UX trade-offs for the user to decide.
- **Document Length & Compression Guard**: This document must strictly stay within **200~250 lines**. Compress all instructions and guidelines tightly while retaining critical architectural details and rules.
- **Contradiction & Duplication Resolution**: Before overwriting or implementing requested behaviors, always search existing documentation and code. If an existing recorded pattern or doc contradicts the prompt (such as navigation audio autoplay), query the user with options and trade-offs before proceeding.
- **Navigation Audio Standards**: Forward progression (Next, Skip, Resume) automatically triggers spoken narration; Back button navigation intentionally silences narration (no autoplay, preventing redundant replay of earlier lines), while manual playback remains available via the replay icon.
