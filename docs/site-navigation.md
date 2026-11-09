# Shared page navigation

`apps/web/src/shared/site/SiteNavbar.tsx` renders the Zero To Beyond brand, centered page links and Settings. Home, NASA Archive, Engineering Lab and Orbit & Signal Lab share this header. Play Mission enters the existing mission flow; the active game retains its own HUD and controls.

`SitePage.tsx` owns the standalone route frame. `App.tsx` routes `/?explore=archive`, `engineering`, `atlas` and `signal` before mounting the game. The navbar uses normal same-origin page navigation, so reloads and direct links reach the same destinations. Play Mission uses `/?play=1`; the Home entry passes control to the existing mission-start callback after the loading/orientation freeze clears. The game router, reducers, checkpoints and gameplay screens are unchanged. Moon Atlas switches to Signal Lab inside the exploration view so its selected study point survives the transition. Settings shares the game's audio and gentle-motion preferences.

The home screen supplies the header through `StoryShell`'s optional `pageHeader` slot. Independent pages use a shared viewport frame with the header outside the scrollable content. Their previous standalone headers are removed. No saved-status, glossary, sources or voice controls are rendered in the shared header; audio preferences remain available in Settings.

`siteNavbar.css` uses the game's purple surfaces, pink highlights and lavender text. The page links occupy the center grid column and scroll horizontally when space is limited. Brand and Settings stay visible. Compact landscape uses a 52px header and 42px link targets; larger viewports use a 72px header and 48px targets. Native focus indicators and reduced-motion behavior are retained.

The shared navbar shows Settings as an icon button, retaining its accessible name and tooltip. Home page destinations are available in the navbar; duplicate exploration links and the archive card are omitted from the hero. When the shared header is present, the development debug launcher is hidden to avoid covering navigation; the backquote shortcut still opens the debug drawer.

Home destinations use internal scrolling if their content exceeds a compact landscape viewport; the document remains fixed. Local source additions are restored under the monorepo paths, without replacing the existing mission implementation.

## Mission report and legacy Atlas URL

Moon Atlas is no longer a primary navbar destination. The final mission report contains “Explore the location”, labeled NASA reference data. `/?explore=atlas` remains a read-only compatibility preview; when the existing validated save establishes recovery it offers “Open your completed mission report”. `/?report=1` reopens the same report component from that save and otherwise explains that no completed report is available. Neither path creates or overwrites mission progress. The report uses Home navigation; new-attempt actions in the live debrief retain the existing confirmation.
