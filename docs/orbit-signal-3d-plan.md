# Orbit & Signal Lab — 3D Design Plan and Implementation Prompt

Status: design approved for implementation. The current scientific model, disclosed interpretations and validation are documented in `docs/exploration.md`. Performance targets below remain targets unless backed by measured results.

## 1. Product decision

Redesign the existing Orbit & Signal Lab as **Lunar Signal Explorer**, an understandable 3D explanation of how lunar surface locations communicate with Earth directly or through a relay. Retain “Orbit & Signal Lab” in the shared navigation for continuity.

The central question is: **“Can this lunar site see Earth, and how can an orbiting relay help?”**

Use NASA's published **LCRNS Reference Constellation 3.1** as the recommended relay scenario. This preserves the purpose of the current lab while replacing arbitrary relay orbits with a documented NASA reference design. It is a design study, not an operational network or live telemetry. Calculated trajectories must be identified as calculations from NASA initial conditions, not NASA-provided flight ephemerides.

Build around three tasks: **Explore → Trace signal → Compare**. A realistic Moon, readable labels, an explicit signal route, and a plain-language explanation should carry the experience. Decorative effects must not obscure the science.

### Options considered

| Direction                                                       | Benefit                                                                                    | Limitation                                                                                                       | Decision                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Convert the existing schematic to 3D without changing its model | Lowest implementation effort                                                               | Retains arbitrary radios, energy assumptions, simplified rotation and invented orbit presets                     | Reject as the final solution                           |
| Show a real LRO trajectory                                      | Archived NASA geometry; useful for explaining occultation                                  | LRO's orbit does not establish an available surface relay service; repurposing it would misrepresent the mission | Reserve as a separately named future spacecraft lesson |
| Reproduce a NASA lunar relay reference design                   | Directly matches the lab's educational question and supplies documented initial conditions | Requires offline propagation and scientific validation; not live or final operational geometry                   | Recommended                                            |
| Build a full communications operations simulator                | Could include station schedules and RF performance                                         | Requires many additional verified hardware inputs and much more validation                                       | Outside this redesign                                  |

## 2. Current implementation audit

The relevant current files are `src/exploration/SignalLab.tsx`, `signalModel.ts`, `Exploration.tsx`, `exploration.css`, `scripts/exploration/prepare.py`, and `scripts/check-exploration.mjs`.

Confirmed issues from source inspection:

- The scene is a 2D polar projection. Moon radius is drawn using `/32`, while local positions use `/52`; Earth positions are further compressed by `/55`. The rendered surface marker and apparent obstruction therefore cannot reliably explain the numerical geometry.
- Most meanings are communicated through a color legend after the picture. Objects lack direct descriptive labels, and projected points can overlap.
- Configuration controls, queues, battery results, contact strips and predictions appear before users have learned the basic route.
- Circular and elliptical relay paths are teaching models. Their Moon-fixed transformation approximates lunar rotation with a constant period.
- Radio rates/power, file sizes, relay capacity, relay forwarding rate, battery capacity and scheduling rules are authored assumptions. They are not NASA hardware specifications.
- Hourly NASA SVS Earth geometry supports the existing dated lesson; it does not validate those relay or radio assumptions.
- The existing tests check useful conservation invariants, but they do not establish agreement with an external orbital reference or visual correctness.

Reuse the standalone route, existing shared navbar, settings, loading integration, lifecycle events and separation from main-game resources. Preserve unrelated edits and the Moon Atlas.

## 3. Intended first-minute experience

1. Open a paused, composed lunar overview. Show the selected surface point, Moon, selected reference relay, its trajectory, and an Earth-direction indicator.
2. Display one sentence: “Explore when a lunar site has a clear path toward Earth.” Show the scenario date and “NASA reference design · calculated geometry”.
3. Offer three short, dismissible steps: **Find the site**, **Follow the relay**, **Watch the path change**. Each step highlights the corresponding label and gently reframes the camera.
4. Select **Trace signal**. Show `Surface site → Relay → Earth direction` with a status and explanation for each leg. Direct-to-Earth appears as a separate route for comparison.
5. Select **Next visibility change** or scrub the timeline. If a transition exists in the loaded interval, the scene and explanation update together.
6. Select **Compare** to contrast direct versus relay-assisted geometric visibility for the same location, time interval and horizon model.

Do not require orbit vocabulary to begin. Explain “orbit”, “line of sight”, “occultation”, “elevation” and “one-way delay” beside the relevant controls. Hover may reveal extra detail, but essential meaning must be visible and accessible by touch and keyboard.

## 4. Layout and visual direction

### Desktop composition

```text
Shared website navbar: brand | all existing page links | Settings
Title + one-sentence purpose          Reference design / epoch
Explore | Trace signal | Compare     Site selector
┌──────────────────────────────────┬───────────────────────────┐
│                                  │ What is happening?        │
│           3D MOON VIEW            │ Plain-language reason     │
│ Moon / surface / relay labels     │                           │
│ Selected orbit and signal legs    │ Surface → Relay → Earth   │
│ Earth-direction inset            │ Three relevant metrics    │
│                                  │ Selected-object details   │
│ Overview / Site / Earth–Moon      │                           │
└──────────────────────────────────┴───────────────────────────┘
Play/Pause | Next change | UTC time | playback speed | Reset view
Visibility timeline with labeled routes and a shared playhead
NASA sources: relay design · Moon imagery · geometry · methods
```

- Use roughly 68% of desktop content width for the scene and 32% for the inspector, with a readable inspector minimum width. Center content within approximately 1680 px on wide displays.
- Match the existing purple website: deep background `#100b26`, restrained lavender panels, pink active states, warm white text. Use mint for an unobstructed path, amber for a margin or explanation, and a crossed/dashed muted line for obstruction. Never communicate state by color alone.
- Keep the Moon physically recognizable and mostly neutral. Avoid a purple-painted Moon, atmospheric glow, dense particles, fake nebulae and heavy bloom around scientific objects.
- Use clear typography, tabular numbers, subtle panel borders and restrained depth. Animate camera transitions over approximately 500–800 ms; shorten or eliminate them under reduced motion.
- Show no more than three primary metric cards: selected-leg distance, geometric elevation or clearance, and estimated vacuum propagation delay. Detailed values belong in the inspector.
- Keep the NASA source strip visibly at the bottom of the workspace, outside the canvas. Full provenance can expand into an accessible panel.

### Landscape adaptation

| Tier                        | Proposed arrangement                                                                                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compact, height ≤450 px     | Existing compact navbar; scene and narrow inspector side by side; one inspector section at a time; compact timeline; source strip remains reachable; no vertical document scrolling |
| Tablet, height 451–720 px   | Scene around 60%, inspector around 40%; 48 px touch targets; compact explanatory copy                                                                                               |
| Desktop, height 721–1080 px | Full scene, inspector, timeline and bottom source strip together                                                                                                                    |
| Ultrawide / 4K              | Centered content, limited panel widths and larger usable scene; no stretched text or detached controls                                                                              |

For long source tables, allow scrolling within a bounded drawer rather than stretching the document. At very narrow landscape widths, switch inspector sections with tabs instead of shrinking text beyond readability. Preserve the application's portrait orientation guard.

## 5. The 3D scene

Use the existing Three.js dependency and repository rendering conventions. Do not introduce another 3D framework simply for this page.

### Objects and scale

- Moon: use NASA SVS CGI Moon Kit imagery, with its published map orientation and credit. Start with a modest resolution; use a derived normal map only after verifying its orientation. Use a sphere for the documented geometric visibility calculation unless a separate terrain model is validated.
- Surface site: a clearly labeled pin with latitude/longitude and “selected study point”. A pin is a location marker, not a real lander. Preserve Moon Atlas selections, including Malapert; the current signal preset list does not cover every Atlas preset.
- Relay: use a simple satellite symbol labeled “Reference relay SV-n”. Its exaggerated icon size is for readability, not a hardware model or measured spacecraft attitude.
- Orbit: draw the selected trajectory brightly; show the remaining constellation faintly only when enabled. Do not force a sampled trajectory to close if its endpoints do not coincide.
- Earth: in local Moon view, show an off-scene direction arrow and a clearly separated inset. Do not place Earth at an artificially shortened distance in the same spatial scene.
- Earth–Moon overview: use one consistent distance scale for both bodies and their positions. Permit oversized labeled markers, clearly identified as markers. Use scene-relative coordinates or suitable precision handling.
- Lighting: obtain Sun direction from the same ephemeris and epoch as the geometry. Modest ambient fill is an illustrative visibility aid; it must not be interpreted as illumination available for solar power. The Moon has no atmospheric rim.

### Camera and labels

Provide **Overview**, **Selected site**, and **Earth–Moon** presets; drag to orbit, scroll/pinch to zoom, and a visible **Reset view** button. Avoid unrestricted roll and accidental camera entry into the Moon. Do not auto-orbit the camera while users read.

Use projected HTML labels with short leader lines, collision avoidance and stable priorities. Hide or mark a far-side object as occluded; do not draw its pin as if it were on the visible surface. Clicking its label can reframe the camera. Essential labels: Moon, selected site, selected relay, Earth direction.

Link lines must terminate at the correct modeled points. Stop an obstructed visual ray at the Moon intersection and label the obstruction. An optional dashed continuation must be clearly illustrative. Do not use renderer raycasting against decorative terrain as the authoritative science calculation.

## 6. Interaction and explanation states

**Explore:** select a site or relay and inspect its role. Keep unrelated paths dimmed. An “All relays” control reveals constellation context without enabling a tangled web of every possible link.

**Trace signal:** show each route as an accessible DOM sequence synchronized with the scene. Examples:

- “The Moon blocks the direct path toward Earth.”
- “This relay is above the site's geometric horizon.”
- “The site can see this relay, but the relay's Earth-directed path is blocked.”
- “Both legs are unobstructed in this geometric model. Radio service is not evaluated.”
- “No visibility change occurs within the loaded interval.”

Use **Geometrically clear**, **Below horizon**, **Moon-blocked**, and **Outside data coverage** as distinct states. Do not call a path “Connected”, “Transmitting” or “Delivered” solely because it has line of sight.

Small animated pulses may demonstrate direction, but label them “illustrative signal motion”. Do not imply their visual speed equals light speed. Display the independently calculated propagation estimate beside the route. Reduced motion uses static directional arrows.

**Compare:** default to direct versus any available reference relay at the same site and epoch. Show geometric visibility fraction, total visible duration and longest gap. The relay-assisted value is the union of simultaneous two-leg opportunities; never add overlapping satellite intervals. Pin a baseline with scenario version, site coordinates, horizon definition and time bounds. Reject incompatible comparisons or explain every changed variable.

Playback must be paused initially. Supply UTC date/time, speed multiplier, Play/Pause, a keyboard-accessible timeline, and Next visibility change. Scrubbing pauses playback and updates the same scientific state used by the scene and metrics. No hidden automatic scenario resets.

Route decorative click/hover feedback through the existing sound engine; honor global settings. Avoid continuous radio noise and unsolicited narration. Haptics are optional for primary actions and respect existing project preferences. Camera movement and sound must not run during global suspension.

## 7. NASA data and scientific contract

“NASA data” means attributable NASA observations, published NASA design inputs, or calculations whose inputs and method are disclosed. It does not mean every computed result was supplied or validated by NASA.

### Reference scenario

The reviewed LCRNS paper provides five initial states at **2027-03-01 00:00:00 UTC**, with Cartesian states in Moon-centered ICRF and a separate orbital-element representation. Use the Cartesian table to avoid an unnecessary element/frame conversion. Confirm units from the source context and dimensional checks before ingestion. The reference describes approximately 30-hour orbits and explicitly says the design is not final.

Use a proposed **72-hour exploration interval** starting at that epoch. The interval is a product choice, not a NASA requirement. Do not reuse the existing November 2026 Earth geometry for this scenario, and do not extrapolate outside a prepared dataset.

### Propagation strategy and feasibility gate

Before detailed rendering, prove that a reproducible offline pipeline can generate and validate the intended reference trajectories. Prefer NASA GMAT or a validated equivalent whose force settings can be reproduced; investigate actual support before promising a particular tool configuration.

The source's recommended dynamics include DE421, lunar GRGM900C gravity truncated to degree/order 25, specified third bodies and spherical solar radiation pressure; it also supplies spacecraft parameters and disabled forces. Transcribe the complete table with units, source location and settings. Do not silently replace it with a two-body ellipse, substitute a different lunar gravity solution, or claim long-term frozen-orbit stability from a short animation.

Resolve the exact gravity coefficient file, its normalization, lunar frame conventions, ephemeris kernels and radiation/eclipse conventions. The paper alone is not a complete executable configuration; record any implementation interpretation and its effect. Choose and justify integrator settings through convergence tests.

This is the largest implementation risk. If required inputs or validation are unavailable, complete the source/geometry investigation and report the specific missing item. Do not publish an animated “NASA relay” with an invented trajectory. An explicitly labeled static reference-epoch scene may support review, but is not completion of the planned lab. A real LRO replay is a separate scope choice, not a silent fallback.

### Frames and timing

- Maintain a canonical physical state in km and seconds, independent of display scaling.
- Record UTC labels and the ephemeris time scale, leap-second kernel and conversion method. Do not treat JavaScript wall-clock milliseconds as a complete ephemeris time conversion.
- Use compatible NASA/JPL ephemerides for Moon, Earth and Sun. Transform inertial vectors to the chosen lunar body-fixed frame with verified kernels, not a constant-rate rotation.
- State whether site coordinates are planetocentric and east-positive, their reference radius, and whether their map uses lunar mean-Earth or principal-axis coordinates. Convert between frames before combining them.
- Use one documented geometric convention for instantaneous visibility. Do not mix apparent Earth coordinates, uncorrected relay states and arbitrary lunar rotations.
- Store frame identifiers and kernel versions, not just the string “Moon-fixed”. Validate known axes and landmark orientation.

### Visibility, terrain and delay

For a surface point `s`, target `q`, and outward unit normal `n`, calculate geometric elevation as `asin(dot(normalize(q-s), n))`. Use a documented spherical surface and 0° geometric horizon as the introductory model. A nonzero mask, if offered later, is an explicit user-defined analysis parameter rather than a NASA hardware fact.

Check segment–Moon intersection for orbital links. Handle a surface endpoint and tangency with an explicit numerical tolerance; a ray leaving the surface must not block itself. Compute simultaneous site-to-relay and relay-to-Earth-direction visibility for each relay before constructing a route.

Earth-center visibility is only a directional proxy. It is not equivalent to visibility of every Earth station, especially near the lunar limb. Label the endpoint “Earth direction (center reference)” in details. Actual ground-station availability requires Earth rotation, station coordinates, station horizon limits and schedules, and is outside the first version.

Use path length divided by the NASA toolkit's speed-of-light constant for an **instantaneous vacuum propagation estimate**. For a two-leg route sum the leg distances. Exclude relay processing, buffering, RF loss and retransmission delay. If implementing transmission-time light-time iteration later, validate its moving-endpoint and frame conventions separately.

State openly that local crater rims and terrain blockage are not included in the spherical model. A NASA texture or visual normal map does not establish terrain-aware visibility. Never infer landing safety, ice presence, actual radio performance or guaranteed south-pole coverage from this view.

### Remove unsupported numeric claims from the redesigned experience

Do not carry over the authored radio presets, 36 Wh battery, 64 MB buffer, arbitrary packet sizes or delivered-MB score into the NASA-backed mode. Preserve old code only where still required elsewhere; do not delete unrelated behavior casually.

A future data-transfer experiment needs compatible documented transmitter and receiver parameters, antenna patterns, frequency, noise, bandwidth, coding, pointing, power accounting and scheduling. A headline NASA maximum data rate is insufficient. No fake strength percentages, Mbps estimates or battery results should fill gaps in the evidence.

Study coordinates selected by users are scenario inputs, not claimed NASA landing locations. Reused Atlas locations must retain their existing coordinate and dataset provenance.

## 8. Source register and bottom-of-page credits

The following public NASA sources were reviewed for this plan. Exact downloadable files and hashes must be pinned during implementation; candidate references are not a claim that datasets have already been imported or trajectories validated.

| Source                                                                                                                                       | Purpose and restriction                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [NASA LCRNS Reference Constellation 3.1](https://ntrs.nasa.gov/citations/20250002698)                                                        | Primary initial states and recommended propagation model; non-final reference design         |
| [Reference paper download](https://ntrs.nasa.gov/api/citations/20250002698/downloads/LCRNS_Reference_Constellation_White_Paper_03_2025.docx) | Tables for reproducible input extraction; retain the landing-page link too                   |
| [NASA Commercial Lunar Relay / LCRNS](https://www.nasa.gov/goddard/esc/lcrns/)                                                               | Explain the role of lunar relays; not a numeric trajectory or link-budget dataset            |
| [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/)                                                                                     | Lunar color and elevation assets; record the particular asset and its credits                |
| [NASA NAIF SPICE reference frames](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/frames.html)                                        | Frame transformation conventions                                                             |
| [NASA NAIF aberration corrections](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/abcorr.html)                                        | Distinguish geometric states from received/transmitted light-time calculations               |
| [NASA GRGM900C publication](https://ntrs.nasa.gov/citations/20160005754)                                                                     | Gravity model identity; resolve the actual coefficient product before propagation            |
| [NASA GMAT](https://etd.gsfc.nasa.gov/capabilities/capabilities-listing/general-mission-analysis-tool-gmat/)                                 | Candidate offline analysis tool; verify supported model settings                             |
| [NASA NAIF PDS archives](https://naif.jpl.nasa.gov/naif/data_archived.html)                                                                  | Official kernel archive discovery and coverage metadata                                      |
| [NASA LRO SPICE archive](https://naif.jpl.nasa.gov/pub/naif/pds/data/lro-l-spice-6-v1.0/lrosp_1000/)                                         | Optional future real-spacecraft lesson; do not substitute LRO for a relay service            |
| [NASA SVS Moon Phase and Libration 2026](https://svs.gsfc.nasa.gov/5587/)                                                                    | Existing lab's dated geometry source; not the geometry source for the proposed 2027 scenario |

Show a bottom strip titled **NASA data & sources** with short clickable names for the sources actually used in the displayed scenario. The expanded panel must explain “what this source supplies” and distinguish source input, derived calculation and display illustration. Do not list unused references as imported data.

Each imported asset or dataset needs: title, NASA organization, landing URL, exact download URL, dataset/version, coverage dates, retrieval date, original units/frame, transformations, SHA-256 checksum and attribution. Include numerical/model limitations and validation results in the downloadable or expanded manifest. Use ordinary external links with accessible names and safe new-tab behavior. Verify both landing links and asset URLs; provide a recovery path for unavailable sources without inventing replacement data.

## 9. Implementation architecture

Keep computation, rendering and explanation separate without creating a general-purpose simulation platform.

Proposed responsibilities, adapting names to existing conventions:

- `SignalLab.tsx`: page-level orchestration, mode/site selection and playback controls.
- `SignalViewport.tsx`: Three.js scene, camera presets, picking and resource disposal.
- `signalGeometry.ts`: pure frame-consistent visibility, distance and route functions.
- `signalScenario.ts`: validated scenario/manifest types, interpolation and coverage guards.
- `SignalInspector.tsx`: accessible labels, route explanation and selected-object details.
- `SignalTimeline.tsx`: event intervals, playhead and keyboard scrubbing.
- `SignalSources.tsx`: source strip and expandable provenance.
- `signalLab.css`: scoped styles that do not alter Moon Atlas or global navigation.
- `scripts/exploration/prepare-signal.*`: reproducible offline input download, propagation, transformation and compact export.
- `public/exploration/signal/`: bounded precomputed data and optimized NASA texture derivatives.

Avoid splitting trivial components just to match this list. Continue using `Exploration.tsx` for loading and routing integration. Load signal-only heavy resources only when needed; prevent the signal redesign from slowing Atlas navigation.

Precompute dynamics outside the browser. Start with 10–30 second state samples, then choose spacing based on measured interpolation error. Adaptive event refinement must resolve short visibility intervals instead of relying on the current 15-minute strip snapshots. Compute full-duration comparisons once per valid scenario/input change, not on every animation frame.

A scenario record must identify its source type (`reference-design`), epoch, coverage, frames, units, Moon shape, sample method, source IDs and validated error bounds. Each sample must support all displayed objects at a common time. Keep geometry precision sufficient for the measured error budget; do not round positions for storage without quantifying the effect.

## 10. Loading, lifecycle and failure handling

- Register data, texture and scene preparation promises with the existing loading store. Await required resource completion before revealing the scene; verify late task registration cannot let the loading screen disappear too early.
- Background asset preparation continues during orientation blocks. Playback, camera tweens, visual pulses and audio freeze through the central lifecycle store and existing pause/resume events.
- Keep manual pause independent from global suspension. Unfreezing must not start an intentionally paused lesson or jump the playhead forward by blocked wall time.
- Avoid a React state update every render frame. Use one canonical simulation time and a bounded UI update rate; rendering interpolates the corresponding state.
- Dispose geometries, materials, textures, controls, observers and listeners on unmount. Cancel pending work safely when navigating away.
- On unsupported WebGL or context loss, offer a labeled 2D view and the same route explanation/timeline using the same geometry. It must not reuse the inconsistent old display scales.
- On absent or invalid scientific data, show a useful error with Retry and Sources. Never fabricate coordinates or silently extrapolate.

## 11. Performance and accessibility targets

Treat these as targets to measure, not results already achieved:

- Smooth 60 fps on the documented desktop test device; aim for at least 30 fps on the documented compact-device test. Reduce rendering quality before reducing scientific sampling accuracy.
- Cap device pixel ratio by quality tier; start with 2K lunar imagery and restrained geometry. Avoid expensive global postprocessing and dynamic shadows unless measurements justify them.
- Target an initial compressed signal asset payload under roughly 8 MB; record actual bundle/texture/data sizes. Do not ship raw gravity models or SPICE kernels to the browser.
- No layout shifts after the loading screen closes; allocate fixed scene and panel bounds.
- All meaningful state must be available in DOM text, not only the canvas. Provide a useful canvas description, logical tab order, visible focus, keyboard camera presets and a screen-reader-friendly route summary.
- Keep normal text contrast at least 4.5:1 and meaningful UI boundaries at least 3:1. Use icons/patterns as well as color.
- Respect both reduced-motion preferences and existing gentle-motion settings. Do not rapidly announce every playback tick; announce selected events and deliberate changes.

## 12. Verification and acceptance gates

### Science

1. Trace every physical constant, trajectory initial condition, texture and scientific claim to a source or explicitly declared scenario input.
2. Reproduce all five initial Cartesian states at the published epoch within source rounding. Verify units and time conversion independently.
3. Confirm every necessary kernel covers the complete interval. Reject gaps and frame mismatches.
4. Compare the offline propagator with an independently configured calculation using matched forces at several epochs. Proposed target: position disagreement below 1 km over the 72-hour lesson, with separately documented reasons if a stricter threshold is required. This is a numerical consistency target, not proof of real flight accuracy.
5. Compare browser interpolation with withheld offline states. Target under 100 m position error and under 1 second disagreement for resolved visibility-event boundaries; refine sampling where needed. Report grazing cases separately.
6. Test known clear, blocked, tangent, surface-endpoint, near-side and far-side cases; confirm no self-obstruction at the transmitting surface point.
7. Validate coordinate orientation with known landmarks and transformed axes. Moon texture, pin, orbit, Sun lighting and geometric calculations must agree.
8. Check union-of-relay intervals, simultaneous two-leg logic, zero-duration events, timeline endpoints, and no-event states. Playback speed must not change any result.
9. Compare selected geometric delays against independent distance calculations and verify the displayed endpoint convention.
10. Record the limits of spherical geometry, Earth-center targeting and unmodeled hardware. Do not describe passing tests as NASA certification.

### UX and integration

- A first-time reviewer can identify the surface point, relay, Moon and Earth direction without consulting a color legend.
- The reviewer can explain an obstruction from the scene and adjacent sentence, then find the next change with one action.
- Source links remain reachable at the bottom across all four landscape tiers.
- Inspect at representative dimensions: 667×375, 844×390, 1024×600, 1280×720, 1440×900, 1920×1080, 2560×1080 and 3840×2160. Check label collisions, clipping, pointer targets and drawer bounds. Record tested browsers/devices.
- Verify keyboard-only use, touch selection, reduced motion, pause/resume, orientation/loading overlap, manual pause persistence, source drawer focus, and camera reset.
- Verify direct entry at `/?explore=signal`, shared navbar navigation, settings, Moon Atlas site handoff and unchanged main-game resources/saves.
- Inspect the running page and browser console. A successful build alone does not establish visual quality or scientific acceptance.
- Run the relevant model checks, `npm run build`, and scoped lint. Update `scripts/check-exploration.mjs` deliberately if the old model is retired; preserve Atlas checks. Do not delete failing assertions merely to make the suite pass.

## 13. Delivery sequence

| Phase                     | Deliverable                                                                                              | Exit criterion                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| A. Scientific feasibility | Source manifest, reference-state ingestion, force-model/tool assessment and bounded trajectory prototype | No invented inputs; propagation and frame risks resolved or explicitly blocked    |
| B. Layout prototype       | Neutral 3D Moon scene, stable labels, source strip, responsive inspector and camera controls             | Objects and route are understandable at compact and desktop sizes                 |
| C. Scientific integration | Validated trajectories, frame conversions, visibility states, delay estimates and event timeline         | Numeric and rendering states agree; validation report meets declared tolerances   |
| D. Learning experience    | Guided steps, Trace signal explanations and controlled comparison                                        | Beginner walkthrough succeeds without reading technical documentation             |
| E. Integration and polish | Lifecycle, loading, accessible fallback, settings, performance tuning and NASA credits                   | Responsive/manual checks, relevant tests and build pass with limitations recorded |

Update `docs/exploration.md` and the relevant README description only when implemented behavior changes. Keep this design document distinguishable from the as-built documentation. Deliver the final local preview URL, change summary, source manifest and validation evidence; no automatic commit, push or deployment.

## 14. Copy-ready English implementation prompt

Implement the approved Lunar Signal Explorer design described in this document in the existing Zero To Beyond repository. Preserve the shared navigation, Settings, Moon Atlas integration and main-game state. Begin with the scientific feasibility gate; do not start by decorating the old schematic.

Build a clear, polished, landscape-first Three.js learning experience centered on the Moon, a selected surface point, NASA LCRNS reference relays and Earth-directed visibility. Use Explore, Trace signal and Compare modes. Keep labels and plain-language cause-and-effect explanations visible. Match the website's existing purple visual identity while rendering lunar imagery neutrally. Keep controls tactile and restrained, with accessible keyboard/touch alternatives and reduced-motion behavior.

Use NASA LCRNS Reference Constellation 3.1 as a published, non-final design study. Reproduce its initial states and recommended dynamics through a validated offline pipeline. Export bounded trajectories and geometry for browser playback; identify calculated results accurately. Use NASA lunar imagery and compatible NASA/JPL geometry, document coordinate frames and time scales, and never present an illustrative or predicted state as live flight telemetry.

Follow Sections 5–7 for scale, obstruction, horizon, frame and delay semantics. In local view use an Earth-direction inset; in global view use consistent physical scale. Distinguish geometric visibility from actual communication service. Do not invent NASA radio performance, battery results, packet sizes or guaranteed coverage. If scientific inputs cannot be verified, stop the dependent feature at the feasibility gate and report the precise gap rather than replacing the data with a plausible animation.

Provide the bottom NASA source strip and detailed provenance specified in Section 8. Integrate heavy preparation with the loading screen and all animation/playback with the central lifecycle store. Keep data preparation independent from rendering, preserve manual pause, dispose GPU resources and provide an accessible fallback.

Complete the phases and acceptance gates in Sections 12–13. Inspect the running UI across the listed landscape sizes, validate numerical calculations against independent references, and record measured performance and limitations. Preserve unrelated working-tree changes. Keep implementation documentation accurate and do not commit, push or deploy automatically.
