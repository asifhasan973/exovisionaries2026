# Mission visual systems

The Moon mission entry uses one illustrated backdrop in `public/story/moon-mission-hero.webp`. Live headings and controls sit above it; the artwork has no baked-in interface text. Four square crew portraits in `public/story/crew-portraits/` replace the old generic SVG faces. `CrewScreen.tsx` keeps each candidate's existing role, drag/tap assignment and game data; portrait filenames match the specialist IDs.

`crewedMeshes.ts` builds a reusable command capsule and lunar lander for the crew board and later mission scenes. The lander has a square forward hatch, canted triangular windows, foil-toned descent stage and braced landing legs. The capsule has an offset observation window, a distinct pressure hatch (`hatchDoor`) and red/green indicator (`sealIndicator`). `CrewViewport.tsx` can focus that hatch during crew checks and animate the door shut when `hatchSealed` changes. Its render loop pauses when the game orientation lifecycle is frozen and resumes on `game-orientation-resume`.

`HumanReadinessScreen.tsx` pairs the 3D hatch with a close-up pressure-hatch view, one close-and-lock action, an air-pressure status readout and `SoundEngine.playHatchSeal()`. The sound respects the global effects setting and orientation suspension. The close-up and readout remain meaningful when audio, motion or WebGL are unavailable.

The systems-check stage uses the interactive [return test lab](return-test-lab.md), replacing the stationary 3D view and green status strip with a dedicated moving scene for each rehearsal. The packing stage uses the [packing lab](packing-lab.md) for capsule clamps, a crane alignment puzzle and supply lockers. `ReadinessVisuals.tsx` retains the shared parachute selector icon.

Packing now leads to the [main rocket assembly](main-rocket-assembly.md) hangar. One WebGL context renders the shared launch geometry, dotted empty parts and shelf thumbnails. The Ready screen shows the completed launch stack, and the flight scene uses the same stage, fairing and selected-payload meshes.
