# Progressive Web App (PWA) & Visual Asset Preloading Architecture

This document details the PWA integration, visual asset caching strategy, and installation flow implemented in **Zero To Beyond**.

---

## 1. Architectural Overview

The application features a production-ready Progressive Web App (PWA) powered by `vite-plugin-pwa` with dedicated multi-platform installation awareness and background visual asset caching.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Zero To Beyond                                  │
├───────────────────────────────────┬─────────────────────────────────────────┤
│        Visual Asset Preloading    │           PWA Lifecycle & Install       │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ • Cache Storage: 'assets-v1'      │ • vite-plugin-pwa (Workbox SW)          │
│ • Earth Blue Marble 3D texture    │ • Web App Manifest (Landscape lock)     │
│ • Character rig WebP atlases      │ • usePwaStore (Event-based prompt state)│
│ • Crew portraits & sprite art     │ • InstallAppModal (PC, iOS, Android)    │
│ • Memory Image Element warming    │ • MissionHome & Header Install triggers │
└───────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 2. Visual Asset Preloading & Browser Caching

### Architectural Strategy
To guarantee instant scene transitions and zero layout shifts without penalizing users on cellular or metered connections, visual mission assets are preloaded and cached in the browser's Cache Storage API (`exovisionaries-assets-v1`):

1. **Precached Visual Assets (~2.5 MB total)**:
   - **3D Celestial Flight Textures**: `/story/flight/earth-blue-marble.jpg`
   - **Character Rig Atlases (WebP)**: `/story/characters-v1/chief-body.webp`, `chief-faces-a.webp`, `chief-faces-b.webp`, `commander-body.webp`, `commander-faces-a.webp`, `commander-faces-b.webp`, `commander-faces-c.webp`, `commander-male-atlas.png`.
   - **Rig Manifest**: `/story/characters-v1/manifest.json`.
   - **Astronaut Dossiers & Expressions**: `/story/pilot.png`, `/story/sarah-jenkins.png`, `/story/kai-briefing.webp`, `/story/mira-briefing.webp`, and emotion cutouts.

2. **Decoupled Audio Streaming**:
   - Audio dialogue files (~600+ MP3 clips) stream through standard browser HTTP cache on demand rather than blocking the loading screen, saving bandwidth while ensuring instant speech synthesis playback.

3. **In-Memory & Cache Storage Dual Warming with 7-Day TTL**:
   - `preloadImage()` warms the browser's image decoder (`img.decode()`), caches the decoded `HTMLImageElement` in memory, and persists the raw asset response in `window.caches` for offline resilience.
   - **Universal 7-Day Cache TTL**: In accordance with the project storage policy, `maintainBrowserAssetCache()` tracks `CACHE_CREATED_AT_KEY` (`exovisionaries_cache_created_at_v1`) and enforces a strict 7-day lifecycle (`CACHE_TTL_MS = 604,800,000 ms`). When the cache exceeds 7 days, it is automatically purged and renewed without any user inactivity reset prolonging stale assets.

---

## 3. PWA Configuration & Web App Manifest

Configured in `vite.config.ts`:
- **Display Mode**: `standalone` (removes browser URL bar, tabs, and navigation controls for genuine game immersion).
- **Orientation**: `landscape` (locks horizontal game viewport on mobile devices).
- **Service Worker Strategy**: `generateSW` with `registerType: 'autoUpdate'`.
- **Precache Glob Pattern**: JS, CSS, HTML, WebP, PNG, SVG, JPG, JSON.
- **Icons**: High-resolution raster PNG icons (`/pwa-192x192.png`, `/pwa-512x512.png`), maskable padded icon (`/pwa-maskable-512x512.png`), Apple touch icon (`/apple-touch-icon.png`), and vector fallback (`/pwa-512x512.svg`). This satisfies native OS desktop and Android launcher shortcut requirements, preventing browser fallback to HTML favicons.

---

## 4. State Management (`usePwaStore`)

The PWA store (`src/state/pwaStore.ts`) provides centralized reactive state:

- `isInstalled`: Boolean indicating whether the game is currently running in standalone mode (checked via `matchMedia('(display-mode: standalone)')`, iOS `navigator.standalone`, or Android referrer).
- `canInstall`: Boolean indicating whether installation is possible.
- `deferredPrompt`: Captured `beforeinstallprompt` event (default mini-infobar is prevented to give developers full UX control).
- `promptInstall()`:
  - If already installed: immediately no-ops to prevent redundant prompts.
  - If `deferredPrompt` is available: triggers native browser install prompt directly.
  - If unsupported or on iOS Safari: opens the step-by-step aerospace install modal.
- `appinstalled` listener: Automatically marks `isInstalled = true`, disposes the prompt, and closes any open modal.

---

## 5. UI Integration & Multi-Platform Awareness Modal

1. **Mission Home View (`MissionHome`)**:
   - Prominently displays an "Install App" button in `.home-other-actions` next to "Judge demo" and "New mission".
   - Automatically hides when the application is already running in installed standalone mode.
2. **Mission Control Aerospace Header (`Header.tsx`)**:
   - Integrated in the flight control accessories bar with a glowing cyan download icon.
   - Auto-hides when installed.
3. **Aerospace Install Guidance Modal (`InstallAppModal.tsx`)**:
   - Glassmorphic aerospace styling with deep space neon borders (`#8ce2c2`, `#863bff`).
   - Platform-specific tab switching with exhaustive real-world edge-case coverage:
     - **PC & Mac**:
       - *Fullscreen Tip*: Advises pressing `F11` or `Esc` to reveal browser address bar.
       - *Method 1 (Address Bar)*: Click the Install icon in the browser URL bar.
       - *Method 2 (3-Dots Menu)*: Chrome/Brave: Three dots (`⋮`) -> "Save and share" -> "Install Zero To Beyond..." / Edge: Three dots (`…`) -> "Apps" -> "Install Zero To Beyond".
       - *Direct One-Click Card*: Triggers native browser install prompt when available.
     - **Android**:
       - *Important First Step*: Instructs user to swipe down from the top edge of their screen to exit fullscreen and reveal the Chrome toolbar.
       - *Menu Steps*: Three dots (`⋮`) -> "Install app" or "Add to Home screen" (Samsung Internet: `≡` -> Add page to -> Home screen).
       - *Direct One-Click Card*: Triggers native Android install dialog.
     - **iPhone / iPad (iOS Safari)**:
       - *Prerequisite*: Explains Safari requirement and how to break out of in-app social browsers.
       - *Toolbar Reveal*: Tap screen edge to reveal bottom toolbar.
       - *Walkthrough*: Tap Share (`⎋`), scroll down to "Add to Home Screen" (`[+]`), tap "Add".
   - Highlights key PWA advantages: **Zero UI Clutter**, **Visuals Cached**, and **Instant Launch**.

