# MISSION FORGE — Development Progress & Roadmap

## Phase 1 Status: Completed (Earth Parking Orbit Milestone)

| Implementation Module | Status | Deliverables / Notes |
|---|---|---|
| **Functional Chapter & Navigation** | ✅ Completed | 10-step mission flow state machine with back/forward navigation and state preservation (`src/state/missionStore.ts`). |
| **Data Models & Package Accounting** | ✅ Completed | Authored budget tree ($2,400M base packages + $200M reserve + $20M discretionary allowance), mass accounting, and electrical margins (`src/engine/accounting.ts`). |
| **Launch Readiness Engine** | ✅ Completed | Pass/fail qualification rules separating critical launch blockers from non-blocking later-mission planning notes (`src/engine/validation.ts`). |
| **Fictional Crew Roster** | ✅ Completed | 6 fictional astronaut candidates with custom vector portraits, role qualifications, and documented 120 kg/seat planning allowance (`src/data/crew.ts`). |
| **3D Assembly Studio** | ✅ Completed | Three.js procedural meshes, PBR materials, orbit controls, cutaway/exploded view, and drag-and-drop raycast slot snapping (`src/scene/HangarViewport.tsx`). |
| **Audio Synthesizer** | ✅ Completed | Zero-dependency Web Audio synthesizer for UI clicks, countdown beeps, engine rumble, staging clunks, and orbit chimes (`src/audio/soundEngine.ts`). |
| **Cinematic Ascent Simulation** | ✅ Completed | Saturn V / Apollo 10 reference profile, staging mechanics, dynamic HUD, CapCom captions, and Skip to Orbit control (`src/scene/AscentScene.tsx`). |
| **Earth Parking Orbit Endpoint** | ✅ Completed | Circular 185 km orbit view with procedural Earth, departure stack intact, manifest inspector, and Coming Soon gate for Chapter 2 (`src/components/views/OrbitEndpointView.tsx`). |
| **Coming Soon Dialogs** | ✅ Completed | Accessible modals for Mars, Moon Geology, Moon Volcanic, Shadowed Crater, and Lunar Departure with focus trapping and return focus (`src/components/common/ComingSoonModal.tsx`). |
| **Persistence** | ✅ Completed | LocalStorage versioned schema (`mission_forge_save_v1`) supporting save, resume, reset, and Quick Launch demo manifest (`src/state/missionStore.ts`). |

---

## Chapter 2 Continuation Interface (Planned Extension)

The Phase 1 save snapshot stores the full approved vehicle state, crew roster, science manifest, and orbital telemetry:
```typescript
interface LaunchSnapshot {
  timestamp: number;
  missionId: 'lunar-ice-explorer';
  siteId: 'ridge' | 'crater-rim';
  installedParts: Record<SlotInterface, string>;
  crewAssignments: Record<CrewRole, string>;
  totalDiscretionaryCost: number;
  scienceMassKg: number;
  grossLiftoffMassKg: number;
  profileId: 'saturn-v-polar-insertion';
}
```

Chapter 2 will read this exact snapshot to initiate:
1. Systems checkout in Earth parking orbit.
2. S-IVB third stage restart for Translunar Injection (TLI).
3. Transposition, docking, and extraction of the stowed lunar package.
4. Cis-lunar navigation, mid-course corrections, and Lunar Orbit Insertion (LOI).

## Story redesign · 26 September 2026

Replaced the active interface with **Moonbound**, a character-guided illustrated adventure. The earlier interface is retained in source for reference; App now renders `src/game/StoryGame.tsx`.

- Warm cream, lavender, mint and yellow; short hints, large original part illustrations, and the team's supplied character artwork.
- A new versioned save begins with zero installed parts and zero assigned astronauts. Old saves remain untouched under their original key.
- DOM-based pointer capture replaces the unreliable 3D drop interaction. Mouse/touch drag and keyboard/tap-to-place share the same validated installation action. Undo, remove and shelf navigation remain available.
- Full component details live in an optional Field notes sidebar, closed initially. Selecting parts does not open it.
- Guided stages: story → destination → ice mission → campsite planning → build → life support → science → crew → readiness → pad → ascent → Earth parking orbit.
- Player checks the hatch, radio and belts, starts a holdable countdown, and releases spent stages during an illustrated flight. Flight time pauses at teaching moments and when the page is hidden. Lunar travel, other missions, and Mars remain Coming Soon.
- Three.js loads only on demand for a separate rotatable preview; normal gameplay uses 2D SVG/CSS. Device motion preference and a gentle-motion setting are respected.
- Prices remain educational allocations, clearly labeled in Field notes. The existing flight model is authored, not an orbital physics solver.
- Safety checks now guard launch snapshots; missing fuel cells produce zero power; incompatible/duplicate parts are rejected. Third-stage speed reaches its final value at engine cutoff rather than increasing during coast.

Original files preserved in `backups/before-story-redesign-20260926-130824/`.
