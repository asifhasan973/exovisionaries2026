# Development Debug Endpoints & Navigation Navigator

This document details the development debug URL endpoints, environment gating, and smart ephemeral mock seeding in **Zero To Beyond**.

---

## 1. Overview & Architecture

To accelerate development, debugging, and review without repeatedly playing through earlier mission gates, every screen, story module, standalone page, and demo chapter is accessible via client-side hash endpoints:

```text
#/debug/<page|step|demo>/:id
```

### Key Principles
1. **Hash-Based Routing**: Operates entirely client-side via `window.location.hash` and `hashchange` events. Requires no server rewrites on Cloudflare Pages or local static servers.
2. **Environment Variable Gated (`VITE_APP_ENV`)**:
   - In local development (`.env`), `VITE_APP_ENV=development`. All debug hash routes and the in-game debug toolbar are active.
   - On deployment, `.github/workflows/deploy.yml` injects `VITE_APP_ENV: production`. In production builds, debug hash routes are ignored and the debug toolbar is completely excluded, keeping production secure.
3. **Smart Auto-Seeded Ephemeral Sessions**:
   - Mid- and late-mission stages (e.g., `lunar-surface`, `ice-science`, `launch-ready`, `crew-return`) require valid upstream hardware, crew assignments, checks, and landing states.
   - The debug seeder (`createDebugSession`) automatically seeds fully valid mock sessions in memory.
   - **Local Storage Protection**: Debug sessions are strictly ephemeral. They will **never** mutate or overwrite the user's saved mission progress (`zero_to_beyond_script_story_v1`) in `localStorage`.
4. **Zero Impact on Production Navigation**:
   - Existing query parameters (`?experience=legacy`, `?module=3`, `?forcePortrait=true`) continue functioning normally.

---

## 2. In-Game Debug Toolbar

When running in development mode (`VITE_APP_ENV=development`), an aerospace Mission Control debug toolbar is available on screen:

- **Draggable & Dockable Pill**: The launcher pill can be dragged freely to any location on screen to avoid obstructing game action buttons (e.g., in the 3D workshop, launchpad, or flight deck).
  - **Edge Snapping**: Dragging near any viewport edge automatically snaps/docks the pill with smart highlight indicators.
  - **Position Persistence**: Pill placement is automatically preserved in `localStorage` across page navigations and reloads.
  - **Reset Position**: Click "Reset Pill" in the drawer header to restore default top-right placement.
- **Hotkey**: Press the **`~`** (backquote / tilde) key at any time to open or close the navigator drawer. Press **`Escape`** to dismiss.
- **Search & Filter**: Search by title, step ID, module number, or activity ID. Filter by category pills (**All**, **Pages**, **Story Steps**, **Demo Chapters**).
- **Direct Jump**: Click any card to navigate immediately.
- **Exit Debug**: Click "Exit Debug" or the header "Debug · [step] · Exit" button to return to standard gameplay.

---

## 3. URL Endpoints Reference

### Standalone Pages

| Hash URL | Destination | Description |
| :--- | :--- | :--- |
| `#/debug/page/home` | Mission Home | Main entry deck with Start New Mission and Continue |
| `#/debug/page/legacy` | Legacy Experience | Preserved Apollo-style 3-crew Moon explorer |
| `#/debug/page/preview` | Conversation Preview | Standalone dialogue scene & character preview |
| `#/debug/page/archive` | NASA Mission Archive | Historical missions interactive timeline & audio |

### Story Steps (`#/debug/step/:id`)

#### Module 4: Briefings & Choices
- `#/debug/step/player-name`: Enter astronaut callsign & gender
- `#/debug/step/appointment`: Commander introduction
- `#/debug/step/companion-intro`: AI companion dialogue
- `#/debug/step/destination`: Destination selection (Moon / Mars)
- `#/debug/step/objective-briefing`: Mission objective briefing
- `#/debug/step/objective`: Choose Mission A (Ice) or Mission B (Geology)
- `#/debug/step/site-briefing`: Landing site briefing
- `#/debug/step/site`: Crater Rim or Permanently Shadowed Region
- `#/debug/step/resource-briefing`: Resource allocation dialogue

#### Module 5: Spacecraft & Rover Workshop
- `#/debug/step/resource-limits`: Spacecraft design specifications
- `#/debug/step/lander-build`: 3D Lander propulsion & structure assembly
- `#/debug/step/rover-select`: Rover chassis selection & configuration
- `#/debug/step/science-build`: Science package installation
- `#/debug/step/power-build`: Battery and solar array configuration
- `#/debug/step/survival-build`: Thermal insulation and survival gear

#### Module 8: Astronaut Crew Selection
- `#/debug/step/crew-briefing`: Crew briefing dialogue
- `#/debug/step/crew-selection`: Crew dossier review & assignment
- `#/debug/step/crew-plan`: Final crew roster confirmation

#### Module 6: Flight Readiness & Rocket Packing
- `#/debug/step/crew-check`: Crew supplies telemetry check
- `#/debug/step/mass-check`: Spacecraft mass budget validation
- `#/debug/step/power-check`: Power margin & shadow trial check
- `#/debug/step/budget-check`: Mission financial accounting check
- `#/debug/step/systems-check`: Return trajectory & systems check
- `#/debug/step/stress-check`: Lunar decision stress scenarios
- `#/debug/step/rocket-pack`: 3D Rocket hardware packing
- `#/debug/step/launch-ready`: Launch approval & departure manifest

#### Module 7: Interactive Liftoff
- `#/debug/step/liftoff`: Launch sequence, stage separation & orbital ascent

#### Module 9: Orbit & Trans-Lunar Injection
- `#/debug/step/earth-orbit`: Earth parking orbit & departure burn selection
- `#/debug/step/moon-transfer`: Trans-lunar coast simulation
- `#/debug/step/lunar-orbit`: Lunar orbital capture

#### Module 10: Lunar Descent & Landing
- `#/debug/step/lunar-descent`: Braking burns, descent guidance & touchdown

#### Module 11: Lunar Surface Exploration
- `#/debug/step/lunar-surface`: Lander ramp deployment & rover rollout
- `#/debug/step/surface-explore`: Traverse route exploration & navigation
- `#/debug/step/surface-ready`: Surface traverse readiness

#### Module 12: Ice Science & Subsurface Drill
- `#/debug/step/ice-science`: Core drilling, thermal analysis & spectrometry
- `#/debug/step/science-ready`: Scientific data delivery confirmation

#### Module 13: Hazard Recovery & Safety
- `#/debug/step/surface-recovery`: Dust hazard mitigation & sensor recalibration
- `#/debug/step/surface-secured`: Surface hardware securing & packup

#### Module 14: Crew Return & Mission Debrief
- `#/debug/step/crew-return`: Ascent stage liftoff, rendezvous & Earth re-entry
- `#/debug/step/mission-debrief`: Final mission accomplishment debrief

---

### Demo Replay Chapters (`#/debug/demo/:id`)

| Hash URL | Chapter | Focus Area |
| :--- | :--- | :--- |
| `#/debug/demo/battery-challenge` | Battery Challenge | Power check rehearsal with intentional battery fault |
| `#/debug/demo/ice-build` | Ice Explorer | Pre-configured lunar ice rocket ready for crew selection |
| `#/debug/demo/geology-build` | Geology Explorer | Pre-configured geology rocket ready for crew selection |
| `#/debug/demo/journey` | Launch & Journey | Direct jump to countdown and liftoff |
| `#/debug/demo/landing` | Moon Landing | Direct jump to lunar descent maneuvering |
| `#/debug/demo/surface` | Deploy & Drive | Direct jump to surface rover rollout |
| `#/debug/demo/ice-science` | Ice Science | Direct jump to ice drilling & sample processing |
| `#/debug/demo/incidents` | Fault & Repair | Direct jump to dust hazard emergency response |
| `#/debug/demo/geology-science` | Rock Science | Direct jump to lunar geology analysis |
| `#/debug/demo/ice-return` | Ice Crew Return | Direct jump to lunar liftoff and return flight |
| `#/debug/demo/geology-return` | Rock Crew Return | Direct jump to return flight for geology mission |

Production builds always disable the debug navigator, even when a copied local environment file sets `VITE_APP_ENV=development`. Navigation remounts the selected experience so ephemeral sessions cannot be written to normal saved progress when exiting.
