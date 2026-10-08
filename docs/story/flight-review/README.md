# Module 7 — liftoff to Earth parking orbit

The player completes equipment checks and rocket packing, approves the current mission, then clicks **Launch pad**. Start countdown → release the empty booster → release the fairing → gain orbital speed → View orbit. Both release gates wait for a player click. The actual selected lander, rover and instruments remain visible under the fairing.

1×, 1.5×, 2×, pause/resume, skip and replay are available. The authored 38-second timeline takes about 19 seconds at 2× plus player interaction. Skip marks the save as skipped; it does not pretend the player performed the releases. Gentle motion shows milestone poses instead of continuous ascent. Controls, navbar, Back and final action share the existing story frame.

## Scientific boundary

This is a generic illustrative robotic carrier, not a named or certified launcher. No real fuel/mass-flow thrust integration or complete Earth–Moon trajectory is claimed. Equipment approval remains the Module 6 short-rehearsal gate. Ascent samples are authored. Only the final example circular orbit is calculated: μ=398600.4418 km³/s², r=6371+200 km, v=√(μ/r)≈7.79 km/s. Gravity remains about 9.2 m/s². A later Moon-bound burn is required; no ISS stop is included.

Earth/rocket/Sun scales are illustrative and sunlight direction is artistic. The Sun remains distant, not an object approached during ascent. Fairing release occurs above the thick atmosphere while the upper stage burns; the scene freezes while waiting for the player. Audio is a game effect; sound cannot propagate through vacuum. The subsequent transfer, lunar arrival, landing and exploration are not implemented in this module. No additional character dialogue was invented where the screenplay provides none.

Sources:

- [NASA Glenn: flight to orbit](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/flight-to-orbit/)
- [NASA Apollo 10: parking orbit then translunar injection](https://www.nasa.gov/missions/apollo/apollo-10-mission-details/)
- [NASA Earth-to-Moon trajectory strategy](https://ntrs.nasa.gov/citations/20120000635)
- [NASA GRACE-FO: fairing release during upper-stage burn](https://gracefo.jpl.nasa.gov/news/133/ground-controllers-acquire-signals-for-both-grace-fo-satellites/)
- [NASA Earth Observatory Blue Marble imagery and credits](https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/)

## Verification

The pure-state checks cover approval gates, ordered actions, invalid/stalled ticks, speed/pause, skip/replay, orbital values, save restoration and hardware-change invalidation. Source dialogue remains byte-for-byte checked. A dedicated isolated browser context seeds a real approved mission through the reducer, then exercises launch, both release gates, 2×, pause/reload/resume, orbit, replay/Back and skip. It checks 390/320px mobile views and WebGL failure fallback. It does not touch the user's existing browser save.

Results are in `browser-review.json` and screenshots in this directory. Build output and unit/lint results are recorded in `verification.json`. Production verification exercises bundled lazy scenes and the locally served Earth image; no NASA runtime request is needed.

The Three dependency remains a large lazy shared chunk (~586 KB uncompressed). Existing character compositor URL and chunk-size build warnings are unchanged.
