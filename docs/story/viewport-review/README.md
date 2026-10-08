# One-viewport game review

The active Zero To Beyond story uses a 100dvh shell with bounded main content, a compact header and persistent Back/Next controls. The browser document and active shelves do not scroll. Equipment category tabs and part pagination replace the old shelf overflow. Multi-select and select-all still include all eligible parts across pages. Science includes a separate Drill plan tab. Supplemental explanations use native, keyboard-accessible paged dialogs.

Workshop camera resizing preserves the viewing angle and relative zoom while compensating for narrow aspect ratios. Short-height launch layouts put the active release window over the flight canvas, leaving playback controls in the console. Exact screenplay lines and readiness/flight rules are unchanged.

## Focused verification

- Desktop workshop: viewport 1422 × 800, document exactly 1422 × 800; shelf and visible part content contained.
- Laptop workshop: viewport 1094 × 615; shelf 335px, part 110px, no content overflow.
- Phone workshop: viewport 433 × 666; one part per page, category switching and drill plan accessible alongside the 3D canvas.
- Phone checks: mass sensor repair, drive/drill/return rehearsal, budget receipt paging, three packing actions, mission approval and launch controls exercised.
- Landscape: viewport 1000 × 400; workshop shelf 205px and part 71px, no part overflow. Challenge retry panel, speed/skip and orbit notes accessible. Flight console and scene 229px each with no overflow after compact adjustments.
- Narrow phone: 320 × 666 mission site choices fit above the persistent footer.
- Short landscape: 769 × 342 site choice board 214px within a 246px main region; dialogue and relocated Skip briefing reviewed.
- Existing 51 functional tests passed; story code lint passed; production build passed. Existing Three.js chunk-size and public character URL warnings remain non-blocking.

Judge demo testing was isolated from the normal saved spacecraft. Normal play was returned to the existing lander build, with its installed hardware retained.
