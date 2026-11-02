# Rover expedition

This describes the retained waypoint/science path for existing saves. New surface sessions use the [free-driving astronaut rover](free-rover.md).

## Player flow

Scouting now uses the landscape as the main play area. A short objective, three-step progress strip, battery percentage and the next useful destination replace the large route console. New trips use one pace and hold-to-drive controls: hold W, Up or the on-screen Drive button; release to stop. Charging appears when useful. Detailed power and crew figures remain in Expedition details.

Ice scouting follows Base → Lookout → Shadow edge. Geology follows Base → rock lookout → Base. Equipment-dependent radio limits still require a saved out-and-back route where applicable. Such autonomous legs remain visibly identified and do not accept manual driving. Existing saves on other waypoints retain valid onward routes. Back uses shared mission review.

Completing the scouting route opens discovery through the existing progression events. Science and departure preparation now use the same full-width world and compact objective/action cards through `MoonStage.tsx`. A site recommendation is previewed against the current equipment, energy, cold exposure and route home. Only feasible alternative sites can be selected. If the selected cold site cannot support sampling, the game recommends a feasible depth/site rather than leaving a blocked choice on screen. Sample depth, optional gas use and ground-sensor placement are configured through recorded commands when the player begins. Hardware is never upgraded or replaced.

Discovery presents one expedition: travel, scan, collect, test, return, interpret and send. Instrument readings remain visible at the interpretation step; the player chooses a finding. No result is automatically accepted. Detailed power, mission time and the full measurement log are available through the information button. Scouting itself awards no discovery or science points.

Recovery offers one unfinished item at a time: park, relay, seal physical geology samples, then check the crew. Each item still runs the real resource/evidence reducer. The return screen uses a full-width scene with a compact current-task card. Its main action changes from braking to alignment to docking as the approach becomes safe; shield orientation remains a player choice. Fuel, supply checks, recorded assistance, crew accounting and the mission debrief remain intact. Back uses shared review across these stages.

If no sample expedition is feasible, the player can charge, return to base or explicitly finish fieldwork safely. The new `end-fieldwork` receipt reuses the existing safe-return calculation, preserves collected records and grants no invented samples or science points. Existing receipts keep their original behavior.

## World presentation

`SurfaceViewport.tsx` shares the scene between scouting and science. `surfaceTerrain.ts` creates repeatable regolith detail, a raised lookout, crater relief, shadow-region ground colors and rock clusters that leave route corridors clear. Terrain relief is visual; authored route lengths and resource calculations are unchanged.

The camera follows above and behind the rover with a stable heading for each leg and a small look ahead. Map is an optional single-button toggle. The normal view shows the current destination marker and route; Map exposes the complete waypoint network. Completed and partial trips reconstruct bounded wheel tracks. Wheels rotate with travel and adjust slightly to local relief. Moving vehicles produce a small dust effect; gentle mode removes suspension motion and dust. Science scans move the sensor, and a sample container appears only after recorded collection.

Scene creation is registered with shared loading before procedural work begins. Rendering stops during global suspension and hidden tabs; simulation and held controls stop on pause, focus loss and suspension. Geometry, materials, textures, shadow maps, renderer, observers and listeners are released on unmount. Sound continues through the central sound engine.

## Verification

Run `node --experimental-strip-types scripts/check-moon-expedition.mjs` with a Node runtime that supports TypeScript stripping. The checks cover Ice and Geology recommendations, instrument records, receipt replay, sequential recovery, contextual docking, splashdown and an early finish without invented evidence. TypeScript compilation, focused lint and whitespace checks also cover the changed code. Visual appearance, responsive layout and frame rate require a later browser review.
