# Zero To Beyond · A Mission Forge Adventure

The active game covers the Moon mission from choosing an objective through spacecraft assembly, crew selection, engineering checks, launch, lunar travel, landing, surface science, crew return and debrief. Ice and Geology have different instruments and evidence tasks. The opening uses short playable dialogue beats; the longer source transcript remains archived. Hardware decisions affect power, mass, routes and repair. The flight scenes are educational game models, not certified mission planning. See the [Moon mission design](temp/old_backup/docs/story/FULL-MOON-MISSION-PLAN.md), [Geology economy](temp/old_backup/docs/story/geology-economy.md), and [Laptop rover driving game](temp/old_backup/docs/story/free-rover.md), and [Crew return game](temp/old_backup/docs/story/return-game.md). The surface chapter is a remote rover sample run with sequential targets, held charging and animated delivery/storage. A centered [Judge preview Skip](temp/old_backup/docs/story/milestones-and-navigation.md#judge-preview-skip) provides a separate assisted tour through the mission.

The adventure has eight milestones, introduced before play and celebrated between chapters. A small circular header indicator replaces the long stage strips and starts at 0% for each new milestone. Back/Next share one navigation policy across the full mission; reviewing earlier flight pages preserves the live checkpoint and resources. See [Milestones and navigation](temp/old_backup/docs/story/milestones-and-navigation.md).

The home scene now introduces both mission guides, the crew board uses individual specialist portraits, and the crew check shows a closing pressure hatch with visual and audio feedback. See [Mission visual systems](temp/old_backup/docs/story/visual-systems.md).

Return preparation now includes four playable rehearsals: hold ascent thrust, aim an orbital burn, orient a heat shield and deploy Earth parachutes. Each has visible motion, sound, retry and saved progress. See [Return test lab](temp/old_backup/docs/story/return-test-lab.md).

Spacecraft packing has three visual cargo games: fit and clamp the capsule, align and lower the lander, and match supply cases to their lockers. Receipts require completed gameplay. See [Packing lab](temp/old_backup/docs/story/packing-lab.md).

Pack now leads to a separate 3D rocket assembly game before Ready. Fit eleven launch/payload parts, recover from an early cover, inspect the bay or use animated Quick build. The built rocket shares its geometry and selected rover with ascent. See [Main rocket assembly](temp/old_backup/docs/story/main-rocket-assembly.md).

During ascent, fairing halves tip from their base rims and drift clear while the cargo stays clamped to a visible adapter frame. Back pauses and returns to the previous screen; Notes has its own button.

Open `http://127.0.0.1:5173/` to play the new story. Names, choices, dialogue position, installed hardware, drill depth and voice preference save separately from legacy progress. Hardware, checks, approval, flight and cursor are written atomically. Flight time saves at half-second checkpoints and on page exit; running saves resume paused. Refresh opens a Continue screen for an existing mission; Back restores previous lines/screens. The restart icon clears only the new mission after confirmation. Mars and Comming Soon are locked. Clicking Moon immediately enters the next conversation.

**Gameplay update:** Skip briefing jumps to required choices. Judge demo remains separate from the normal save. Geology uses one 10,000-MC mission ledger and a 100 kg science sub-limit; Ice keeps its earlier equipment and crew allocations. The Geology crew check lets players choose a cabin, life-support tier and transfer-fuel package, with mass, cost, capacity and return-feasibility consequences. Guided and Challenge modes, retry, hints and 1×/1.5×/2× flight speed remain available. Recorded lines are used where available, with browser speech as fallback.

The existing build-and-launch chapter is preserved at `/?experience=legacy`. The standalone conversation preview remains at `/?module=3`, and the character art lab at `/story/characters-v1/preview.html`. These previews do not write the active story save.

The legacy chapter follows a three-person ice-exploration mission from its first idea through an Apollo-inspired launch into Earth parking orbit. Mira, Leo and Kai guide players with short hints and clear scenes. Moon travel, landing, other lunar missions and Mars are marked Coming Soon.

## Play the legacy chapter

1. Pick the Moon and the ice mystery, then choose a future south-pole camp concept.
2. Build the rocket from an **empty workshop**. Drag a part to its glowing target, or tap the part and then the target. Each part has an actual compatible slot. Use the shelf arrows on touch screens. Undo or remove parts at any time.
3. Install air, navigation, power and radio systems. Pack an ice detector and mapping camera; optional science equipment has an authored game cost and mass allowance.
4. Choose a pilot, scientist and engineer, then check the launch passport.
5. Buckle the crew, check the radio and hatch, start the countdown, and release the first two spent stages when Kai asks. The launch ends in Earth parking orbit.

The **Field notes** button opens a normally closed sidebar. Click a part in the shelf or on the rocket to show its real-world name, learning note and model values. The workshop has both illustrated 2D and interactive 3D building views.

The flight is an educational story sequence with a compressed, authored timeline, not a trajectory solver. Hardware prices are game planning allocations and estimates, not verified vendor prices. The fictional crew and illustrative site concepts are labeled as such. Sources and assumptions are linked in Field notes and recorded in `temp/old_backup/ASSUMPTIONS.md`.

## Run locally

Requires Node.js 22+ and pnpm. From the repository root:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173/`. `pnpm build` produces production bundles across the workspace via Turborepo, and `pnpm lint` runs the code checker. The following settings describe the preserved legacy experience at `/?experience=legacy`: **Settings → Start a new adventure** clears it and returns to an empty workshop. Night mode is the default. The header moon/sun button and Settings can switch to the original light palette; the choice saves separately from mission progress. The home cover keeps the story focused without a journey strip. Field notes can be dragged wider or narrower on desktop, and its width is saved. The workshop has 2D and 3D tabs that build the same rocket; the 3D view uses interactive procedural hardware meshes and supports placing, inspecting, undoing, and removing parts. Settings also includes sound and gentle motion controls.

## Fixed-screen game layout

The active game now stays within one viewport: the header and Back/Next bar remain in place while the current stage changes. Equipment uses category tabs and previous/next page arrows instead of a scrolling shelf. Short screens show one part per page; taller desktop screens show two. Drill planning, equipment details, receipts and science notes remain reachable through tabs or paged dialogs. The 3D assembly camera adapts to narrow canvases.

Adjust the layout in `apps/web/src/game/story/viewport.css`; equipment pagination is in `WorkshopScreen.tsx`, and shared paged overlays are in `GameInfo.tsx`. The preserved legacy experience keeps its separate layout.

## Landscape mode enforcement

The mission flight deck, 3D workshop, and interactive launch screens require landscape orientation. Root-level orientation enforcement is provided by `OrientationGuard` (`@exo/ui`, `packages/ui/src/components/OrientationGuard.tsx`).

- **Automatic detection**: Portrait viewports and vertical screen orientations trigger a full-screen cosmic advisory overlay.
- **State safety**: Game components are safely set to `inert` during orientation lock, preventing accidental taps while preserving all active state.
- **Quick action**: Provides an **Enter Landscape Fullscreen** button that requests fullscreen and attempts orientation locking where supported.
- **Testing**: Append `?forcePortrait=true` to any URL to simulate portrait mode on desktop displays. See [Orientation Guard documentation](docs/orientation-guard.md) for full details.

## Space-themed loading screen & asset preloader

A high-performance cinematic loading screen (`@exo/ui`, `packages/ui/src/components/LoadingScreen.tsx`) displays upon initial application landing and prior to launching any mission.

- **Cinematic entry**: Displays an exclusive pitch-black `"ExoVisionaries-2k26 Presents"` intro splash on the user's first visit of the day/session, fading into a continuous looping carousel of authentic NASA space exploration imagery.
- **Real engineering preloader**: Progress tracks actual background subsystem preparation (`apps/web/src/services/assetPreloader.ts` and `@exo/engine`)—dynamic JS modules, Three.js 3D Moon & rocket meshes, textures, and audio synthesis—dismissing immediately when backend tasks hit 100%.
- **Orientation pause synchronization**: Carousel cycling pauses in portrait while background asset loading continues. Underlying game views and keyboard input stay inert during loading; manual mission pauses survive orientation changes.
- **Browser-managed cache with 7-day TTL**: Leverages the browser's Cache Storage API (`caches.open('exovisionaries-assets-v1')`) and automatically purges cached assets once they exceed their universal 7-day lifecycle.
- **Developer delay**: Configure `VITE_LOADING_PROGRESS_MULTIPLIER`, `VITE_SLIDE_DISPLAY_MIN_MS`, and `VITE_INTRO_SPLASH_DISPLAY_MS` in `.env.local`. See [Loading Screen documentation](docs/loading-screen.md).

## Progressive Web App (PWA) & Offline Asset Preloader

Zero To Beyond is a full Progressive Web App (PWA) with native desktop and mobile installation support via `vite-plugin-pwa`:

- **Standalone Landscape Game Viewport**: Running as an installed PWA removes browser URL bars and navigation controls, unlocking distraction-free, 60fps fullscreen landscape gaming.
- **Visuals-First Cache Storage**: 3D celestial sphere textures, character rig WebP atlases, and crew dossiers (~2.5 MB) are preloaded and stored in Cache Storage (`exovisionaries-assets-v1`), ensuring zero layout shifts and offline asset availability while keeping audio dialogue streaming bandwidth-friendly.
- **Event-Based Install Awareness**: Accessible via an "Install App" button in both the Mission Home landing view and Mission Control Header. When already running in installed mode, install buttons automatically hide to avoid redundant prompts. An interactive aerospace modal provides platform-specific steps for PC (Chrome/Edge), Android, and iOS Safari. See [PWA Integration Documentation](docs/pwa-integration.md).

## Continuous Deployment & Cloudflare Hosting

Automated deployments are managed by GitHub Actions at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

- **Automated Deployment**: Pushes to `main` (including merged pull requests) trigger an automated build and deploy to Cloudflare Pages.
- **Manual Trigger**: Supports `workflow_dispatch` with custom target branch names.
- **Safety Gate**: Fails deployment with a configuration error if `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are not configured in secrets. See [CI/CD Documentation](docs/ci-cd.md) for full configuration instructions.

## Development Debug Endpoints & Navigator

When developing locally (`VITE_APP_ENV=development`), every screen, module, standalone page, and chapter is directly accessible via hash endpoints:

- **Hash-Based Deep-Linking**: Jump directly to any mission screen without playing prior gates (e.g., `#/debug/step/lander-build`, `#/debug/step/liftoff`, `#/debug/step/lunar-surface`, `#/debug/page/legacy`, `#/debug/demo/ice-science`).
- **Interactive Debug Toolbar**: Press **`~`** (tilde / backquote) to toggle the in-game search & navigation drawer.
- **Production Guard**: In production builds (`VITE_APP_ENV=production`), debug routes are safely ignored and the toolbar is excluded. See [Debug Endpoints Documentation](docs/debug-endpoints.md) for full reference.

## Project layout

- `apps/web/`: Primary Vite 8 + React 19 spaceflight simulation and canonical narrative engine.
  - `src/game/story/`: Exact-script story, 3D interactive viewports, and domain-driven feature slices (assembly, crew, flight, landing, surface, rover, readiness, archive).
  - `src/services/assetPreloader.ts`: Coordinated background preloading for dynamic chunks, 3D meshes, textures, and audio.
  - `public/`: Public runtime assets, WebP sprite atlases, NASA image slides, and PWA manifest.
- `packages/engine/`: Platform-independent NASA physics, Apollo datasets, mass/power budget accounting, and asset cache management.
- `packages/audio/`: Web Audio API sound synthesis (`SoundEngine`) for rocket rumbles, UI chirps, and reactive `useAudioStore`.
- `packages/ui/`: Reusable aerospace HUD overlays, `OrientationGuard`, `LoadingScreen`, and `InstallAppModal`.
- `packages/tsconfig/`: Shared base TypeScript compiler configurations.
- `docs/`: Mission specifications, monorepo architecture, CI/CD pipelines, and debugging reference documents.
- `temp/old_backup/`: Preserved historical documents (`docs/story/`), validation suites, and legacy components.

The original view components are retained in `temp/old_backup/src/components/` for reference; `apps/web/src/App.tsx` selects the active story, legacy experience or conversation review route lazily.

The lunar landing now uses a single medium game with a full 3D landscape, A/D steering, a Space descent brake, mouse controls, contextual hints and touchdown feedback. See [Landing game](temp/old_backup/docs/story/landing-game.md) for handling, save compatibility and scene lifecycle.

## Current mission debrief and controls

The Ice and Geology rover runs use launched instruments for simulated evidence and the existing W/Wh power model. Samples, scientific findings and crew recovery are separate results. The final debrief explains saved engineering choices, resource use and next-attempt recommendations. Players can explicitly save one completed summary on their browser and compare it with a later same-objective attempt; no backend is used.

Driving requires a keyboard and mouse: W/S accelerate/brake/reverse, A/D steer, E interact/hold charge, M map, P/Escape pause, mouse drag look and C center. Compact landscape layouts are provided, but touch-only driving is unsupported. WebGL-capable laptop/desktop landscape browsers are the supported play target.

See [release verification and scientific limits](temp/old_backup/docs/story/release-readiness.md), [the 90-second judge walkthrough](temp/old_backup/docs/story/judge-demo-90-seconds.md), and [the rover model and compatibility notes](temp/old_backup/docs/story/free-rover.md). Preserved debrief verification checks: `node --experimental-strip-types temp/old_backup/scripts/check-mission-debrief.mjs`. Judge-tour checks use assistance and must not be represented as manual unassisted playthroughs.

The Moon route planner includes a bounded NASA/JPL ephemeris dataset, computed transfer candidates, throttle/alignment burn controls, a local lunar-capture orbit preview and a solar-system overview. See [Moon transfer game](temp/old_backup/docs/story/moon-transfer-game.md) for dates, controls, reproducibility, source URLs and the distinction between measured celestial data and educational spacecraft assumptions.

## Independent NASA exploration pages

Home and the shared navbar open [Engineering Lab](docs/engineering-lab.md) (`/?explore=engineering`), [Moon Atlas and Orbit & Signal Lab](docs/exploration.md) (`/?explore=atlas`, `/?explore=signal`), and the [NASA Mission Archive](docs/mission-archive.md) (`/?explore=archive`). These routes live in `apps/web/src/features/` and preserve saved mission progress. The standalone page frame and home navigation are documented in [Shared page navigation](docs/site-navigation.md); the existing game flow and mechanics remain separate.

### Your Moon Mission Report

The final Moon mission debrief is one report covering recorded outcomes, observations, physical sample return, evidence interpretation, engineering lessons and the existing previous-run comparison. “Explore the location” shows lazy-loaded NASA reference layers separately from simulated mission results. Moon Atlas is removed from primary navigation; its old URL remains a non-destructive preview. Completed reports reopen from the existing mission save at `/?report=1`. See [report data mapping and compatibility](docs/moon-mission-report.md).
