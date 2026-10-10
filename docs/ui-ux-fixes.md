# Zero To Beyond — UI/UX fixes

Implemented the 35-item review across the current story game. The original dialogue script, mission calculations, required hardware, check gates and saved player mission remain intact. Short display copy is still separate from the source script.

| # | Fix | Result |
|---|---|---|
| 1 | Text hierarchy | Consistent body, caption and title sizes; compact screens use readable horizontal cards. |
| 2 | Disabled Next | Visible button plus a specific instruction: enter a name, choose a card, install parts or finish the check. |
| 3 | Status colors | Green with checks for success, yellow for targets/reserve, red for faults; meaning also appears in words/icons. |
| 4 | Progress | Named Plan, Build, Checks, Pack and Flight stages replace ambiguous numbers. |
| 5 | Header | Words, Show me, Settings and Voice have labels on roomy screens and accessible names on compact screens. Reset lives in Settings. |
| 6 | Home | Continue is the main action; New mission and Judge demo are secondary. No redundant Home Back button. |
| 7 | Name | Explorer-name label and live Ready feedback; empty names cannot advance. |
| 8 | Roles | Chief is Mission director, Commander is Mission engineer and the named player is You. |
| 9 | Dialogue navigation | Shared footer; Back cancels speech and does not autoplay the earlier line. Next/Skip restore forward narration. |
| 10 | Destination | Removed the extra generic Coming soon card; Mars remains clearly locked. |
| 11 | Moon entry | Tap-to-start cue and direct entry on Moon click. |
| 12 | Landing art | Sunlit ridge versus dark crater floor, with distinct rover positions. |
| 13 | Choice consequences | One short consequence beneath each card; its related word opens help outside the selection button. |
| 14 | Shelf | More desktop shelf width; compact screens show a single horizontal hardware card. |
| 15 | Part hierarchy | Larger previews, prominent names, clearer prices/specs, less decorative text. |
| 16 | Workshop Next | Next navigates parts, categories, drill planning and stages. Required installation gates remain enforced. |
| 17 | Part requirements | Required, Optional and Choose one badges; optional MSOLO never blocks advancement. |
| 18 | Option comparison | Real replacement cost/mass deltas, rover peak changes, battery runtime and option-specific benefits before installation. |
| 19 | Replacement | Replace label when an option replaces installed equipment; both options are never charged together. |
| 20 | Installation feedback | Confirmed-card highlight, exact cost/mass change, varied contextual engineer response and completed-system response when revisiting. |
| 21 | Removal | Direct Remove on every installed card; calculations and checks update through the same mission reducer. |
| 22 | Drill planning | Potential science, risk, drilling minutes and energy; removed irrelevant initial Science 0/Rover health labels. |
| 23 | Limit checks | Compact mass and budget consoles instead of oversized empty panels. |
| 24 | Recovery | Failed checks link directly to relevant equipment; power failures offer battery, tool, warmth or shallower-drill corrections. |
| 25 | Battery rehearsal | Percent and Wh remaining, explicit return reserve, actual 3D lander/sample labels and Drive/Drill/Return phases. |
| 26 | Rehearsal completion | Home-safe remaining battery and highlighted, genuinely unlocked Next. |
| 27 | Packing | Thumbnails rendered from the actual adapter, selected explorer and fairing geometry; matching drop cue and ordered packing. |
| 28 | Approval | Launch pad is primary. Mission card is a secondary PNG preview/download, not a JSON dump. |
| 29 | Launch layout | Telemetry, release actions and help fit compact screens; speed, pause/resume and skip stay accessible. |
| 30 | Completion | Milestone reward, honest Guided/Challenge/Skipped result, Replay launch and Mission home; no disabled placeholder CTA. |
| 31 | Word help | Easy explanation, illustrative diagram/example and explicit Read aloud. |
| 32 | Word index | Rocket, Energy, Moon and Rover/tools topics; all 35 terms covered once. |
| 33 | Responsive fit | Stack scene above shelf on phones; measured clipping fixed for comparison cards and headings; no document scrolling. |
| 34 | Interaction targets | Enlarged info, checkbox, page and action controls with visible keyboard focus; native drawer focus trapping/restoration. |
| 35 | Preferences/help | Character voices, sound effects and gentle motion controlled independently; Show me replays the ghost-hand tutorial. |

## Validation

- 58 tests pass: source-script preservation, narration cancellation, option replacement, real resource totals, mandatory/optional navigation, faults, rehearsal, packing, save restoration and launch gates.
- Production build succeeds; story component lint and `git diff --check` pass.
- Browser checks on the dev app: full mass repair → power rehearsal → budget → ordered packing → approval → guided 2× flight → both releases → orbit → result; also replacement, removal, optional science, drill planning and glossary/settings.
- Production browser checks: name → dialogue Next/Back/Skip → Moon direct entry → objective → landing site → mission limits → bulk installation. Screenshot saved alongside this report.
- Production demo also passed repair, weighing, Drive/Drill/Return, budget and all packing steps. The Download PNG action saved a valid 1000×700 PNG in Downloads; inspected the resulting card.
- Gentle motion was tested with an actual remove/reinstall; hardware retains its correct assembled position.
- Measured responsive layouts include 333×721, 389×843, 522×711, 837×500 and 1440×900. Checked document overflow, clipped cards and footer controls.
- Judge demo is isolated from the existing player save; the original dev mission was restored on exit.

## Adjusting appearance

Edit `src/game/story/gamePolish.css` for shared font sizes, shelf width, card spacing, compact layouts and colors. The audit rules start at the `UI audit` comment. Mobile and shallow-screen rules follow those shared styles.

Gameplay messages: `WorkshopScreen.tsx`, `ShadowTrial.tsx`, `ReadinessScreen.tsx`, `FlightScreen.tsx`. Easy word explanations and topics: `glossary.ts`. Settings: `GameSettings.tsx`. Replacement calculations: `partComparison.ts`.

The production build still reports the existing large shared Three.js bundle and a legacy runtime URL warning; neither prevents the build. No GitHub push or live deployment is included in this UI-fix task.
