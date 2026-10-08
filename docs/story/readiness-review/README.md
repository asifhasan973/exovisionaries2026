# Module 6 — Launch readiness

Play at `http://127.0.0.1:5173/`. The root story now reaches launch readiness before liftoff. Existing Module 5 hardware survives migration. Finish Survival (or use confirmed Quick Build) to enter Mass → Power → Budget → Pack → Mission approved.

## What the player does

- Press Weigh payload, Run rehearsal and Check budget. Next unlocks only when that live check passes.
- Open Edit equipment to swap hardware. Every actual edit invalidates all checks, packing and approval, even if the totals still fit.
- Pack adapter, explorer and fairing in order. Drag anywhere in the hangar, including a 65px outer margin, or tap/use keyboard. An invalid release cancels the drag and returns the item.
- Approve the packed game mission and download its JSON card. No liftoff runs in this module.

The same header and Back/Next frame persist throughout. The new scene lazily loads Three.js and the existing component mesh factory. It animates snaps for 550ms and then renders only on interaction/resize; no continuous idle rendering. Reduced motion snaps immediately. GPU resources, controls, animation frames and listeners are released on exit. Without WebGL, buttons still complete packing.

## Actual calculations and scope

All equipment credits/masses/loads are the preserved script values or the explicitly authored estimates listed in the workshop notes. They are not retail quotes, measured NASA hardware specifications or flight certification.

| Quantity | Rule |
|---|---|
| Mass | Sum selected lander + rover + instruments + support; 350 kg allowance |
| Budget | Sum each installed part once; exclusive swaps replace cost; 1,000 credits |
| Peak | Whole rover normal load − TRIDENT normal 20 W + TRIDENT peak 175 W |
| Discharge limit | 450 W authored game limit for all battery choices |
| Shadow rehearsal | 15 min × rover normal W / 60 + drilling minutes × rover peak W / 60; solar 0 W |
| Drilling time | Authored 30 seconds per 10 cm; full simultaneous peak is conservative |
| Reserve | Rehearsal energy must fit 80% of selected battery Wh |
| Shadow thermal rule | Advanced thermal protection required; no computed temperature/lifetime guarantee |
| Carrier | Supplied illustrative two-stage robotic carrier, adapter and fairing; excluded from modeled equipment budget/mass |
| Science | Earned score stays zero; workshop potential is not earned science |

The 15-minute interval is a game rehearsal, not an inferred traverse distance, a mission duration, or a promise of autonomous survival inside permanent shadow. Lander descent load is a separate operating mode; lander storage/propellant, return routes, eclipse duration, communication geometry, temperatures and flight mechanics remain outside this model. Sunlight preview shows ideal array output; the battery rehearsal always uses zero solar. Landing in permanent shadow cannot support indefinite solar-recharged operation.

The reference Quick Build is 280 kg, 960 credits, 218 W normal rover load, 373 W drill peak, 60 W separate lander avionics, 220 Wh battery, and 60.7 Wh rehearsal draw (20 cm drill). The shadow-compatible Advanced thermal swap becomes 284 kg, 1,000 credits and 378 W peak. Expensive valid equipment can exceed the budget; heavy/deep drilling with the small battery can fail the reserve check. All current legal mass combinations fit 350 kg, so the script's 386 kg example is not displayed as a fake outcome.

The 3D carrier is explicitly illustrative. Each selected component is retained in a folded display arrangement; the scene does not claim real dimensions, a qualified mechanical fit or payload-to-Moon capability. [NASA's DART fairing account](https://science.nasa.gov/blogs/dart/2021/11/22/nasas-dart-spacecraft-secured-in-payload-fairing-flight-readiness-review-complete/) supports the protection role of the fairing; [NASA VIPER operations](https://science.nasa.gov/mission/viper/lunar-operations/) explains lunar lighting and operational challenges. Neither source supplies these authored credits or balancing rules.

## Session and snapshot integrity

`readiness.ts` holds versioned rules, calculations, ordered packing gates and canonical design signatures. `workshopSession.ts` owns player events; an external complete-activity event cannot grant checks. A changed design clears all readiness state. Approval produces a detached recursively frozen snapshot. Both progress and hardware/readiness save atomically under the existing isolated story key. Restoration rechecks actual hardware, current rules/signature and the complete approval snapshot, then reconstructs the cursor through valid gates. No obsolete Approved flag is trusted.

## Verification

- 39 unique unit checks across foundation, assets, narration, selection, workshop and readiness; the focused readiness suite checks calculations, failed budget/energy/thermal designs, ordering, frozen snapshots, edit invalidation, partial saves and corrupt approval recovery.
- Production build passes. Story-specific lint has no warnings/errors. Existing build warnings remain for the lazy shared Three chunk (>500 KB) and the character compositor's runtime URL fallback.
- `scripts/check-readiness.mjs` exercises the actual browser flow from Survival through scans, a far drop, invalid drop cancellation, packing info, partial reload, mission approval, JSON download, endpoint reload and edit invalidation. It also corrects a failed shadow design on mobile and verifies a blocked over-budget design at 320px. No page errors or failed local requests.
- `scripts/check-readiness-production.mjs` verifies production lazy loading, restored packing and approval with reduced motion, and completes the same final steps with WebGL disabled. See JSON reports and screenshots beside this file.
- Previous workshop harnesses are updated to expect the live Mass handoff rather than the now-superseded build summary; their prior Module 5 verification evidence remains in `workshop-review/`.

No commit, push or deployment was performed for this module.
