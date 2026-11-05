# Monorepo Architecture & Feature Modularization

This document outlines the Turborepo monorepo architecture and domain-driven feature modularization for **Zero To Beyond**.

---

## 1. Monorepo Overview

The repository is structured as a multi-package Turborepo workspace managed by **pnpm workspaces** (`pnpm-workspace.yaml`).

```
exovisionaries2026/
├── apps/
│   └── web/                     # Primary Vite + React 19 spaceflight application
├── packages/
│   ├── engine/                  # Pure NASA physics calculations, orbit models & mission data
│   ├── audio/                   # Web Audio synthesizer, sound cues & audio store
│   ├── ui/                      # Aerospace HUD components, OrientationGuard & LoadingScreen
│   └── tsconfig/                # Centralized TypeScript compiler configurations
├── temp/
│   └── old_backup/              # Preserved historical assets & retired legacy components
├── turbo.json                   # Turborepo task pipeline & caching configuration
└── pnpm-workspace.yaml          # Workspace definitions
```

---

## 2. Package Boundaries & Responsibilities

### `@exo/web` (`apps/web`)
- **Role**: Primary user-facing web application powered by React 19, Three.js, and Vite 8.
- **Features**: Houses the single canonical narrative experience (`ExactStory`), dialogue runners, 3D interactive viewports, and domain feature slices.
- **Path Aliases**:
  - `@/*` -> `apps/web/src/*`
  - `@exo/engine` -> `packages/engine/src`
  - `@exo/audio` -> `packages/audio/src`
  - `@exo/ui` -> `packages/ui/src`

### `@exo/engine` (`packages/engine`)
- **Role**: Platform-independent engineering, physics, and mission datasets.
- **Submodules**:
  - `data/`: Apollo mission specifications, candidate astronaut profiles, landing sites, and NASA archives.
  - `physics/`: Rocket mass/power budget accounting, ascent velocity profiles, and launch readiness validation.
  - `loadingEngine.ts`: Asset caching and preload scheduling.

### `@exo/audio` (`packages/audio`)
- **Role**: Procedural Web Audio API sound synthesis and playback controls.
- **Modules**:
  - `soundEngine.ts`: High-performance sine/noise synthesis for rocket thrusters, UI chirps, and telemetry chimes.
  - `audioStore.ts`: Global mute and volume state synchronization.

### `@exo/ui` (`packages/ui`)
- **Role**: Reusable aerospace HUD overlays, viewport guards, and design system components.
- **Components**:
  - `OrientationGuard`: Universal landscape orientation enforcer and game suspension trigger.
  - `LoadingScreen`: Multi-slide procedural loading sequence with asset preloading integration.
  - `InstallAppModal`: Cross-platform Progressive Web App installation prompts.
  - `CartoonIcons` & `RealisticPartIcons`: Authentic vector aerospace hardware symbology.

### `@exo/tsconfig` (`packages/tsconfig`)
- **Role**: Shared TypeScript configuration bases (`base.json`, `react-library.json`, `node-library.json`).

---

## 3. Story Feature Slices

The active story system in `apps/web/src/features/story/` is partitioned into distinct domain modules with clean barrel exports:

1. **`assembly/`**: Rocket design studio, 3D workshop viewports, component placement, and auto-build routines.
2. **`crew/`**: Astronaut selection, candidate profiles, seat assignments, and 3D crew models.
3. **`flight/`**: Trans-lunar injection, orbital ascent, trajectory visualization, and launch hardware telemetry.
4. **`landing/`**: Powered descent, hazard detection, shadow trials, and lunar surface touchdown.
5. **`surface/`**: Extravehicular activities (EVA), lunar geology sampling, and science instrument operations.
6. **`rover/`**: Lunar roving vehicle navigation, equipment bay, radar/radio telemetry, and driving physics.
7. **`readiness/`**: Launch checklist validation, flight readiness tests, emergency drills, and Earth return recovery.
8. **`archive/`**: Interactive NASA Mission Archive timeline and historical flight data.
9. **`shared/`**: Global story flow controller (`ExactStory`), character dialogue engine, narrative shell, and settings.

---

## 4. Build, Caching & Deployment Pipeline

- **Local Turbo Pipeline**:
  ```bash
  pnpm build  # Executes turbo run build with dependency graph resolution & caching
  pnpm lint   # Executes oxlint across all workspace packages
  pnpm dev    # Launches development server in apps/web
  ```
- **Cloudflare Pages CI/CD** (`.github/workflows/deploy.yml`):
  Configured to install dependencies via `pnpm/action-setup@v4`, run `pnpm run build`, and deploy `apps/web/dist` directly to Cloudflare Pages.


---

## 5. Static Public Asset Pipeline & Optimization

Static runtime assets are hosted in `apps/web/public/` and optimized for low-latency delivery:
- **Audio Voice & Sfx Library** (`apps/web/public/story/audio/`): 737 optimized `.mp3` narration and sound cue tracks indexed via `credits.json`.
- **Character Puppet Rigs** (`apps/web/public/story/characters-v1/`): Multi-part 2D sprite atlases (`chief-body.webp`, `commander-male-atlas.webp`, etc.) dynamically loaded via `manifest.json`.
- **High-Fidelity WebP Assets**: Heavy deep space and character graphics are encoded in modern WebP (`carina_nebula.webp` at 326 KB vs 2.43 MB original, `commander-male-atlas.webp` at 454 KB vs 2.19 MB original), saving over 3.8 MB with zero perceptual degradation.
- **Boot Preloading Shield**: Registered through `assetPreloader.ts`, critical carousel slides, 3D textures, and astronaut atlases are loaded behind `LoadingScreen` before interactive view rendering.
