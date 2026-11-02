# Playable spacecraft packing

The crewed `rocket-pack` screen contains three short cargo games in one hangar. It replaces the old click-to-secure list and static payload status strip.

- **Capsule:** drag the capsule onto the glowing adapter ring, then close the two mounting clamps. Each clamp visibly moves and plays a mechanical sound. Keyboard players can select the capsule, focus the mounting ring, and press Enter before locking the clamps.
- **Lander:** turn the suspended lander until the gold alignment marks agree, then hold the lowering control. The crane descends into the cargo mount and the mounting ring locks. Misalignment blocks lowering; release, adjust and try again.
- **Supplies:** match three shuffled cases to food, water and oxygen lockers. The case order changes on entry and Play again, and remains stable during a round. Dragging works alongside a select-case/select-locker keyboard path. Wrong placements bounce back without costing progress. Correct cases appear strapped inside their lockers.

## State and completion

`packingGame.ts` owns versioned `PackingGameState`, the pure reducer, socket coordinates and restoration. `HumanValidation.packingGame` stores the active game, clamp receipts, crane alignment/progress and stowed cases. Live drag coordinates remain local to the playfield. Saved holds restore released; completed state is recalculated from the actual game conditions.

`readinessEvents.ts` accepts `packing-game-*` only at `rocket-pack` after all required crew, equipment, return and quiz checks. A packing receipt is added only when that game's completion condition passes, and only in capsule–lander–supplies order. The old `human-pack` event cannot bypass these conditions. Next selects the next unfinished game; all three receipts unlock the separate [main rocket assembly](main-rocket-assembly.md) activity. Departure approval follows that assembly. Completed games can be replayed without discarding earned receipts.

Old saves still on the packing page replay these new games. Valid saves beyond preparation retain their existing packing receipts. Changing the equipment or restarting the quiz resets packing through the normal validation flow. Chapter demos and development previews exercise the same gameplay events.

## Presentation and lifecycle

`PackingLab.tsx` exports `PackingLabControls`, `PackingLabScene` and `PACK_GAME_NAMES`. The shaded SVG hangar includes the selected rover beside the lander. `useCargoRoverImage.ts` renders that static image from the shared `buildRoverAssembly(preparation)` mesh factory under the loading screen, then disposes its temporary WebGL context. Packing, launcher payload and lunar driving share the same chassis and selected instrument geometry. `packingLab.css` keeps the controls and hangar inside the laptop viewport, with compact landscape and reduced-motion variants. A contextual hand hint points to the current drag target, clamp, alignment control or lowering button.

The optional `supplyLayout` field stores one of six source orders; old saves default to the original order. Locker meanings and drop validation stay fixed. Randomness is chosen by the UI and recorded in the select/reset action, keeping reducer behavior and save restoration deterministic.

The crane clock checks the centralized orientation/loading freeze and pauses during dialogs or hidden tabs. Holds release on blur, visibility changes, orientation blocks and Back. Pointer drags cancel when focus or orientation changes. Sounds use the existing muted/suspended `SoundEngine` methods. The game is a simplified visual cargo-handling puzzle; the mounts, alignment tolerance and timings are authored game values rather than spacecraft assembly procedures.
