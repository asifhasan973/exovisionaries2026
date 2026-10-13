# Module 4 — laptop Moon journey

Departure approval → crewed launch/staging → Earth parking orbit → three route choices → forward departure burn → coast → backward lunar braking burn → lunar orbit. Landing remains Module 5.

The existing launch controls, 1×/1.5×/2×, voice identities and purple palette are retained. The payload now represents the crew capsule and lunar lander, with an escape tower. Journey demo explicitly prepares an assisted valid kit through the readiness reducer and leaves the player's normal save alone.

## Simulation contract

- Profiles are authored: Fast 2.5 days / 3500 m/s departure / 1150 m/s arrival; Balanced 3.25 days / 3200 / 900; Efficient 4.5 days / 3080 / 750. These are not solved Lambert trajectories or measured Apollo flight plans.
- Fuel is `wetMass × (1 − exp(−deltaV / (g₀ × Isp)))`. Departure and insertion add 5% margins. The supplied upper stage has 6000 kg dry mass, 75000 kg fuel and 450 s Isp. Lunar insertion carries the full fueled lander. Service fuel is updated to an authored 18000 kg; the previous 8000 kg allocation did not adequately represent capture with the full lander and reserved Earth return. Platform revision 3 invalidates the old approval; equipment and valid crew choices remain reusable.
- Service reserve covers a 1200 m/s Earth-return budget after leaving the lander, plus a separately modeled 100 m/s correction. Fuel left in the upper stage is discarded with that stage; it cannot refill the service module.
- Profiles must fit the selected crew duration, kits and cabin energy, including a 3-day return allowance, 1-day surface allowance, 12-hour operations allowance and 2 contingency days. Two hours of Earth parking orbit are part of that operations allowance. Rover energy is separate and remains unspent during flight.
- Speed changes only screen time. Coast consumes actual virtual days, three-person kits and cabin Wh. Fuel is applied once at each completed burn. Wrong direction or timing consumes no fuel and permits retry. Guided mode and preview arrival are labeled assisted; arrival preview still requires a feasible confirmed route.
- Save v5 revalidates the human manifest, launch receipts and ordered departure/capture receipts. Resources are reconstructed from those receipts, not trusted totals. Refresh pauses an active journey. After departure, Back opens checkpoint controls; an explicit assisted retry restores Earth orbit. Crew/equipment editing is locked while flying. Actual science remains zero.
- Earth orbit uses the existing computed 200 km example; the endpoint uses an illustrative 100 km lunar orbit with `sqrt(4902.8 / (1737.4 + 100)) ≈ 1.63 km/s`. Scene sizes are exaggerated. Upper-stage disposal and lander retrieval/docking are compressed at departure. Inclination, ephemerides, three-body gravity, launch performance and entry heating are not solved.

## Checks

Per the user: laptop only; no automated tests, lint, production build, GitHub push or deployment. Verification is direct browser play plus source review. The previous version is preserved on `backup/module3-complete-20261012`.

NASA principles: [Apollo departure / arrival](https://www.nasa.gov/missions/apollo/apollo-10-mission-details/), [ideal rocket equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/). Numerical profiles above are game estimates.

## Manual laptop results

- Crewed launch completed through booster and fairing release, then reached the Earth parking-orbit route screen. An 8-day plan correctly blocked the Efficient route.
- Balanced guided departure and capture completed. Wrong direction was rejected without spending fuel. Arrival showed 20.0 crew day-kits, 252.0 kWh cabin energy, 6.7 t service fuel and 4.3 t Earth-return reserve.
- Challenge missed-window and retry worked with upper-stage fuel still at 75.0 t. The timing label remains visible over the green band.
- Fast assisted preview reached lunar orbit with 22.3 crew day-kits, 262.8 kWh cabin energy, 4.4 t service fuel and 3.6 t return reserve. Refresh/resume preserved the endpoint and these totals.
- Lunar-orbit animation is cosmetic; it does not drain mission resources. Landing is visibly disabled until Module 5. No automated checks were run.

Evidence: `lunar-orbit.jpg`.
