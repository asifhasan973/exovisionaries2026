# Moon transfer planning and piloting

The date planner covers 1–7 November 2026 (TDB, not local civil time). Its source dataset stores NASA/JPL Horizons request URLs, API signatures, source headers, generation time, reference frame and units. Reproduce it with Python, NumPy and SciPy: `python3 scripts/trajectory/generate.py`. The solar overview is generated separately with `python3 scripts/trajectory/solar.py`.

## Data and calculations

- Earth-centred geometric Moon and Sun vectors: NASA/JPL Horizons, ICRF, km/s, six-hour samples with cubic Hermite interpolation. Solar overview: heliocentric ecliptic vectors at daily samples.
- Constants: Earth GM 398600.435507, Moon GM 4902.800118, Sun GM 132712440041.279419 km³/s²; JPL Astrodynamic Parameters.
- Departure is from an ideal 200 km parking orbit whose plane and phase are chosen for the transfer. No Earth launch-site window or plane-change feasibility is claimed.
- A two-body Lambert estimate initializes numerical shooting with Earth, Moon and Sun differential accelerations. The endpoint targets a 100 km lunar perilune with zero radial arrival velocity. Convergence and sampled surface-intersection checks filter candidates. A missing candidate is a solver limitation, not proof that no physical flight exists.
- The displayed duration alternatives (2.5, 3.25, 4.5 days) are chosen search constraints. Their required velocities, trajectory samples and capture delta-v are computed, not NASA mission recommendations.
- Player burns integrate ideal rocket-equation delta-v and kg fuel from throttle, mass and authored thrust (upper stage 1 MN; service engine 90 kN). Burn time runs at 20 simulated seconds per real second.
- Departure is a guided maneuver at a fixed parking-orbit checkpoint. A 1.5% velocity-vector error tolerance is an authored game threshold. Coast follows the stored nominal transfer after that check; departure errors are not propagated through a fresh three-body solution.
- Lunar insertion resolves delivered delta-v into tangential and radial components. Capture status comes from local two-body orbital energy and angular momentum; success requires a bound orbit with at least 50 km periapsis and at most 1000 km apoapsis. Those thresholds are game requirements. This is an impulsive, local capture approximation, not full finite-burn navigation.
- Moon surface relief is procedural illustration. Earth uses the existing Blue Marble asset. Solar overview compresses radial distance and exaggerates body size; it is not a navigation frame.

## Controls and persistence

A/D adjusts alignment, W/S throttle, hold Space fires, Enter checks the resulting maneuver, P pauses. Sliders and a toggle engine button provide mouse and keyboard alternatives. Drag the 3D view to orbit the camera. Follow craft, trajectory and solar overview controls switch views. Cut the engine before checking; an incorrect result offers a local assisted retry with fuel restored to that burn checkpoint.

Version 1 saves retain their original route rules. Selecting a date before departure opts into version 2. Reload pauses flight and clears engine firing. Assisted preview consumes computed maneuver fuel. Rover and Earth-return systems continue to use their existing resource accounts.

## Limits

No launch certification, arbitrary-date search, radiation model, lunar gravity harmonics, terrain clearance certification, full navigation uncertainty or landing-site illumination optimization. Other planets provide solar-system context; their gravity is omitted from the Earth–Moon transfer solver. Vehicle masses, Isp, thrust, margins and support allocations are authored educational inputs. The short date range is intentional; the UI does not claim a globally optimal launch date.

## NASA references

- https://ssd.jpl.nasa.gov/horizons/manual.html
- https://ssd-api.jpl.nasa.gov/doc/horizons.html
- https://ssd-api.jpl.nasa.gov/doc/ (API usage policy; datasets are fetched ahead of play)
- https://ssd.jpl.nasa.gov/astro_par.html
- https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/A11_PAOMissionReport.html
- https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/

## Verification record

The stored run produced 8 converged candidates out of 21 attempted date/duration combinations. The largest retained endpoint targeting residual is 5.17 km; this is an educational candidate set, not precision flight navigation. No candidate converged for 3–4 November with this initialization. Those dates remain visible with an explicit solver limitation message.

Executed: `node scripts/check-transfer-pilot.mjs` (throttle/fuel, cutoff, retry, complete piloted departure/capture, tampered aggregate reconstruction, both objective save/resource integration); `node scripts/check-rover-sample-run.mjs` (both existing rover paths); production build. Browser inspection covered date selection, confirmation, chase/trajectory rendering, engine toggle and pause. Full manual piloted arrival, physical mobile devices and screen readers were not tested in this change.
