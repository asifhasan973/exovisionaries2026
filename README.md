# Zero To Beyond · A Mission Forge Adventure

Zero To Beyond is a character-guided game for young explorers. The playable chapter follows a three-person ice-exploration mission from the first idea through an Apollo-inspired launch into Earth parking orbit. Mira, Leo and Kai guide players with short hints and clear scenes. Moon travel, landing, other lunar missions and Mars are marked Coming Soon.

## Play the chapter

1. Pick the Moon and the ice mystery, then choose a future south-pole camp concept.
2. Build the rocket from an **empty workshop**. Drag a part to its glowing target, or tap the part and then the target. Each part has an actual compatible slot. Use the shelf arrows on touch screens. Undo or remove parts at any time.
3. Install air, navigation, power and radio systems. Pack an ice detector and mapping camera; optional science equipment has an authored game cost and mass allowance.
4. Choose a pilot, scientist and engineer, then check the launch passport.
5. Buckle the crew, check the radio and hatch, start the countdown, and release the first two spent stages when Kai asks. The launch ends in Earth parking orbit.

The **Field notes** button opens a normally closed sidebar. Click a part in the shelf or on the rocket to show its real-world name, learning note and model values. The workshop has both illustrated 2D and interactive 3D building views.

The flight is an educational story sequence with a compressed, authored timeline, not a trajectory solver. Hardware prices are game planning allocations and estimates, not verified vendor prices. The fictional crew and illustrative site concepts are labeled as such. Sources and assumptions are linked in Field notes and recorded in `ASSUMPTIONS.md`.

## Run locally

Requires Node.js and npm. From the project folder:

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`. `npm run build` produces a production bundle, and `npm run lint` runs the code checker. Progress saves in this browser; **Settings → Start a new adventure** clears it and returns to an empty workshop. Night mode is the default. The header moon/sun button and Settings can switch to the original light palette; the choice saves separately from mission progress. The home cover keeps the story focused without a journey strip. Field notes can be dragged wider or narrower on desktop, and its width is saved. The workshop has 2D and 3D tabs that build the same rocket; the 3D view uses interactive procedural hardware meshes and supports placing, inspecting, undoing, and removing parts. Settings also includes sound and gentle motion controls.

## Project layout

- `src/game/`: active story screens, 2D rocket and part art, interactive 3D builder, launch sequence, responsive styles in `src/index.css`. The 3D shelf renders part thumbnails from the same hardware meshes as the rocket; the enlarged drop bay accepts nearby releases and shows a quick snap animation. A full compatible bay offers a reversible swap.
- `src/state/missionStore.ts`: validated placements, crew choices, launch readiness gate and a versioned local save. Earlier `mission_forge_save_v1` data is left intact.
- `src/data/` and `src/engine/`: catalogue, mission references, budget and mass accounting, readiness checks and authored ascent values.
- `public/story/`: the character illustrations supplied by the project team.
- `backups/before-story-redesign-20260926-130824/`: a local copy of the previous source and documentation.

The original view components are retained in `src/components/` for reference; `src/App.tsx` renders the Zero To Beyond experience.
