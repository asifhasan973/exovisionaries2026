# NASA Mission Archive

The archive uses the home screen’s deep purple surfaces, lavender text, pink-purple highlights and warm gold year accents. The archive opens centered on the current calendar year. Scroll upward to see older missions and downward for newer catalog entries. The central year spine is flanked by circular mission thumbnails, with wider spacing and a subtle separator between year groups. Years with several missions show all their cards. Arrow controls move between catalog years and Back to the current year restores the opening position.

Mission titles, categories and the Explore mission cue appear only on hover or keyboard focus. Captions open outward: left of left-hand images and right of right-hand images. Narrow viewports place captions above the images, aligned toward their outer side to keep them inside the viewport. Touch users tap a thumbnail to open its details. An upward-moving arrow beside the scroll hint indicates how to reach older missions; it pauses during shared suspension and respects reduced motion. Clicking a card opens its year's existing mission details and scrolls to the selected record. Returning preserves the timeline position and restores focus to the originating control. Keyboard users can focus the timeline to scroll with arrow and page keys, or tab directly through cards and navigation buttons.

`apps/web/src/features/archive/TimelineSlider.tsx` owns the scroll position and focused year. `MissionEventTree.tsx` retains mission descriptions, official links and on-demand imagery. Native vertical scrolling stays inside the fixed landscape viewport; responsive image grids keep both sides of the spine visible on compact screens. Cards reserve their aspect ratio before images decode and use the existing placeholder on failure. Shared lifecycle suspension disables the timeline and holds its scroll position. Feedback uses the central sound engine and existing mute preferences; reduced motion disables card transitions.

Mission dates, descriptions and image sources remain supplied by `packages/data/src/archive/`; this layout change does not refresh the catalog's historical or future schedule claims.

## Page navigation

The archive header has a centered navigation row for Home, Play Mission, NASA Archive, Engineering Lab, Moon Atlas and Orbit & Signal Lab. NASA Archive is marked as the current page. Home returns to the mission home screen, Play Mission enters the existing saved mission through its loading sequence, and the lab links open the independent exploration pages. The same brand, page links and Settings header appears on Home and all exploration pages; see [Shared page navigation](site-navigation.md). On compact landscape viewports, the links scroll horizontally within the header. The archive also opens directly at `/?explore=archive`.

## Link validation

Run `node scripts/check-archive-links.mjs` from the repository root. The check requires curl and network access, follows redirects, and verifies HTTP 200 plus HTML or image content types for every unique bundled mission URL and thumbnail. It exits with a failure for broken links, unexpected response types or network errors.

On 9 November 2026, 21 broken mission destinations affecting 27 records were replaced with verified NASA mission and history pages. Catalog image URLs were checked separately; successful HTTP responses establish reachability, not the relevance of each photograph.
