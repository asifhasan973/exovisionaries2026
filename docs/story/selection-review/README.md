# Module 4 — active mission selection

Open **http://127.0.0.1:5173/**. A fresh mission starts with Enter ur name. Enter a name, press Start (or Enter), and follow the exact script with Next/Back.

## Delivered

- The exact order: name → 7 appointment lines → 2 companion lines → destination → 3 objective lines → objective choice → 1 site line → site choice → 5 resource lines → saved plan. All 18 lines are unchanged, apart from the authorized example-name substitution.
- Moon is live and its card immediately advances. Mars and Comming Soon are disabled. Both objective/site options are available, with exact labels and source site descriptions; Next requires a choice. Mission cards use lightweight illustrative SVG art rather than survey maps or scientific claims.
- Every conversation/choice/name/home/handoff screen uses the same `StoryShell`/`StoryControls`, purple palette, visible header and bottom Back/Next positions. Mobile content scrolls, with navigation remaining visible and text wrapping naturally. Card choices are native buttons with selected state and keyboard activation.
- `zero_to_beyond_script_story_v1` persists the name, current step, exact dialogue cursor and validated choices. A saved mission opens Continue first, allowing a user gesture before any narration. Back then refresh retains later choices, including when revising an objective. Voice preference uses `zero_to_beyond_story_voice_v1` and survives choice screens/reloads.
- Storage denial/quota failure reports Not saved and permits play for the current session. Reset uses an in-game confirmation; Escape/cancel preserves the mission. It clears only this story's progress, preserves voice preference and leaves legacy saves alone.
- The previous build/launch game is preserved at `/?experience=legacy`; the Module 3 conversation review remains at `/?module=3`.

## Boundary and Module 5 handoff

This module stops at `resource-limits`, rendered as **Ready to build!** with the saved destination/objective/site summary. Workshop is disabled and marked coming soon. This is not a flight approval, and no hardware purchase, activity completion, crew selection or launch is invented.

`ExactStory.tsx` is the active router. It uses the pure story reducer and performs name submission and Moon select+next as atomic state transitions. A stale click from a departed choice screen cannot advance the next dialogue. `ConversationScene` accepts controlled narration preference and uses the shared shell. `SelectionScreens.tsx` contains the name, cards, resume, plan and reset views; `SelectionArt.tsx` supplies decorative, illustrative art.

`selectionSession.ts` isolates storage access and bounds restored progress to this module's handoff. Module 5 must extend that boundary when adding its preparation manifest and actual activity validation; it must not send completion events based only on entering a screen. The current handoff has zero completed activities and preserves all three selections. Source resource data and missing specs remain unchanged in `design.ts`; resolve those before resource accounting. The foundation restore now validates and retains valid future choices during Back/reload, without bypassing name/choice/activity gates.

## Verification

**26** source/art/narration/session tests passed. TypeScript/Vite production build and scoped lint passed without lint warnings. The existing Three.js chunk-size warning and intentional runtime compositor default-URL warning remain; the new root does not eagerly load the legacy 3D experience.

Browser checks traversed the whole active story and all 18 source lines; both Ice/Crater Rim and Geology/Permanent Shadow branches were selected. Name validation, Enter submission, locked cards, direct Moon entry, Back across screen/line boundaries, refresh/resume, preserved future choices, voice preference, cancel/reset and legacy-key preservation passed. Denied storage and absent voice remain playable. There were no browser errors or failed local requests.

390 × 844 views have no horizontal overflow. Production verification also confirmed the new root, deployed character loading, name substitution, saved-plan resume, the conversation preview and the legacy route. At 320 × 740, header and all footer controls remain inside the viewport without overlap. Evidence is in [browser-review.json](browser-review.json).

Screenshots: [name](name-desktop.png), [destination](destination-desktop.png), [objective](objective-desktop.png), [site](site-desktop.png), [shadow selection](shadow-selected-desktop.png), [plan](plan-desktop.png), [mobile name](name-mobile.png), [mobile destination](destination-mobile.png), [mobile objective](objective-mobile.png), [mobile site](site-mobile.png), [mobile plan](plan-mobile.png).

Reproduce the focused checks with `node --test tests/*.test.mjs`, `npm run build`, and `npm run lint -- src/App.tsx src/game/story`. `node scripts/check-selection.mjs` uses this host's bundled Playwright runtime and an already-running dev server on 5173. Its injected speech events verify state transitions, not audible voice quality. Module 3's native speech-start evidence remains separately documented; mouth animation is still rhythmic during narration, not phoneme-accurate lip sync.

No GitHub commit/push or deployment was performed for Module 4. Modules 5/6 await the user's next module instruction.
