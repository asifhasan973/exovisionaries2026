# Zero To Beyond · A Mission Forge Adventure

The exact-script robotic mission rebuild is being implemented module by module. **Modules 1–7 are complete**: the main entry follows name entry → exact Chief/Commander conversations → Moon → objective → site → resource briefing → lander → rover → science → power → survival → mass/power/budget checks → 3D rocket packing → launch readiness → interactive liftoff → Earth parking orbit. The workshop starts empty and saves a real preparation manifest. An approved, downloadable game mission manifest unlocks liftoff. Players release the spent booster and fairing; 1×/1.5×/2×, pause/resume, replay and skip are available. The authored flight ends in an illustrative 200 km Earth parking orbit; Moon transfer, landing and exploration remain future modules. Editing equipment invalidates checks and packing. See [the rebuild roadmap](docs/story/IMPLEMENTATION.md), [flight rules and verification](docs/story/flight-review/README.md), [readiness rules and verification](docs/story/readiness-review/README.md), [workshop rules and verification](docs/story/workshop-review/README.md), and [mission selection verification](docs/story/selection-review/README.md).

Open `http://127.0.0.1:5173/` to play the new story. Names, choices, dialogue position, installed hardware, drill depth and voice preference save separately from legacy progress. Hardware, checks, approval, flight and cursor are written atomically. Flight time saves at half-second checkpoints and on page exit; running saves resume paused. Refresh opens a Continue screen for an existing mission; Back restores previous lines/screens. The restart icon clears only the new mission after confirmation. Mars and Comming Soon are locked. Clicking Moon immediately enters the next conversation.

**Gameplay update:** Skip briefing keeps every original script line and stops at required choices. Judge demo starts with a built explorer, but still requires sensor repair, a drive–drill–return shadow rehearsal, budget checks and packing. Demo progress never replaces the normal save. Battery capacity and drilling depth affect energy failure and retry; equipment edits reset checks. Guided launch pauses for actions; Challenge uses safe release windows with stage retry. Workshop reactions use the animated Commander and local recordings: Guy for Chief, Sonia for Commander. A personalized greeting uses the browser's male-voice fallback. Voice assets are generated with `scripts/generate-story-voices.py`; there is no runtime cloud TTS dependency.

The existing build-and-launch chapter is preserved at `/?experience=legacy`. The standalone conversation preview remains at `/?module=3`, and the character art lab at `/story/characters-v1/preview.html`. These previews do not write the active story save.

The legacy chapter follows a three-person ice-exploration mission from its first idea through an Apollo-inspired launch into Earth parking orbit. Mira, Leo and Kai guide players with short hints and clear scenes. Moon travel, landing, other lunar missions and Mars are marked Coming Soon.

## Play the legacy chapter

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

Open `http://localhost:5173/`. `npm run build` produces a production bundle, and `npm run lint` runs the code checker. The following settings describe the preserved legacy experience at `/?experience=legacy`: **Settings → Start a new adventure** clears it and returns to an empty workshop. Night mode is the default. The header moon/sun button and Settings can switch to the original light palette; the choice saves separately from mission progress. The home cover keeps the story focused without a journey strip. Field notes can be dragged wider or narrower on desktop, and its width is saved. The workshop has 2D and 3D tabs that build the same rocket; the 3D view uses interactive procedural hardware meshes and supports placing, inspecting, undoing, and removing parts. Settings also includes sound and gentle motion controls.

## Fixed-screen game layout

The active game now stays within one viewport: the header and Back/Next bar remain in place while the current stage changes. Equipment uses category tabs and previous/next page arrows instead of a scrolling shelf. Short screens show one part per page; taller desktop screens show two. Drill planning, equipment details, receipts and science notes remain reachable through tabs or paged dialogs. The 3D assembly camera adapts to narrow canvases.

Adjust the layout in `src/game/story/viewport.css`; equipment pagination is in `WorkshopScreen.tsx`, and shared paged overlays are in `GameInfo.tsx`. The preserved legacy experience keeps its separate layout.

## Project layout

- `src/game/story/`: the active exact-script story, character renderer, shared frame, five workshop stages, procedural lander/rover/part meshes, validated preparation reducer, resource calculations, correctable readiness checks, lazy 3D packing, immutable approval snapshots, gated interactive flight and atomic saved progress.
- `src/game/`: preserved legacy screens, 2D rocket and part art, interactive 3D builder, launch sequence, responsive styles in `src/index.css`. The 3D shelf renders part thumbnails from the same hardware meshes as the rocket; the enlarged drop bay accepts nearby releases and shows a quick snap animation. A full compatible bay offers a reversible swap.
- `src/state/missionStore.ts`: validated placements, crew choices, launch readiness gate and a versioned local save. Earlier `mission_forge_save_v1` data is left intact.
- `src/data/` and `src/engine/`: catalogue, mission references, budget and mass accounting, readiness checks and authored ascent values.
- `public/story/`: the character illustrations supplied by the project team.
- `backups/before-story-redesign-20260926-130824/`: a local copy of the previous source and documentation.

The original view components are retained in `src/components/` for reference; `src/App.tsx` selects the active story, legacy experience or conversation review route lazily.
