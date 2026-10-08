# Module 3 — exact dialogue conversations

Open **http://127.0.0.1:5173/?module=3** with the existing Vite server. Click Start conversation, then Next or Back. Scenes opens a review-only scene picker. The preview name demonstrates the foundation’s permitted Charlie substitution; it is not Module 4’s saved name-entry screen.

## Delivered

- Five conversations, 18 complete source lines. One Next click advances one line; no text-reveal click or automatic advancement. Back restores the preceding line, including across review scenes. Source spelling and repetitions are unchanged.
- Large illustrated Chief and Commander. Stable actor positions within two-person scenes, listening reactions, active-speaker marker, expression and pose changes driven by `dialogue.ts`.
- Registered mouth/eye/forearm layers. Actual narration start/end/error/pause/cancel events gate talking; idle actors do not silently flap. Reduced-motion preference removes movement while preserving expression changes. Hidden tabs stop voice and RAF work; narration resumes only through replay or navigation.
- Header stays visible, Back is always bottom-left, Next bottom-right. Long dialogue wraps and scrolls on small screens without clipping or horizontal page overflow. Arrow keys navigate when focus is outside controls and inputs; button keyboard behavior remains native.
- English browser narration, distinct preferred Chief/Commander voice choices where available, mute and replay, failure fallback and timeout recovery. Narration cannot delay text navigation. Speech services are device-dependent. This is rhythmic speaking animation during the utterance, **not phoneme-accurate lip sync**, recorded dialogue or guaranteed voice quality.

## Module 4 integration contract

`ConversationScene.tsx` is controlled by `title`, `lines`, `lineIndex`, `playerName`, `onNext` and `onBack`. Feed it the conversation step from `STORY_FLOW` and the cursor from the saved story reducer. Dispatch `next`/`back` in the callbacks. Do not insert typewriter/reveal logic or auto-navigation. The preview’s scene-to-scene jumps deliberately omit pending choice/activity screens and must not be used as the real story router.

`headerExtra` is a navigation/settings slot. Keep the consistent shell when implementing choice screens. `exitURL` should point to the eventual story home. The preview does not alter any game save, theme or old mission progress. Module 4 controls narration through `narrationEnabled`/`onNarrationEnabledChange`, supplies `onHome`, and shares `StoryShell`/`StoryControls` with selection screens. The preview retains its local voice state and original scene picker.

`CharacterStage.tsx` loads the art once per character, retries failed loads, caps DPR at 2, redraws at 30fps without per-frame React updates, and cleans up observers and loops. `characterAssets.ts` bundles `characterRig.mjs`; only atlas/manifest data are fetched from the deployment base path. The public Module 2 rig is a matching snapshot protected by an equality test. `characterRig.d.mts` supplies the typed runtime API.

`NarrationController` owns one utterance and invalidates obsolete callbacks. The renderer defers initial speech one task to avoid duplicate utterances under React StrictMode. Mouth movement begins only after the browser sends `start`, ends with `end`, and stops on navigation, mute or hiding the page. It waits up to 10 seconds for voice startup before offering a retry; text remains immediately usable.

## Verification

21 source/art/narration tests passed. TypeScript/Vite production build and scoped lint passed. The build retains the pre-existing large Three.js chunk warning; the new renderer/art runtime are separate lazy chunks. The compositor's default relative asset URL is resolved at runtime; the game always supplies the configured asset root explicitly.

The browser review walked every source line, verified every expression/pose, checked Back/Next and literal-symbol name substitution, mute/replay/end/hidden-page handling, reduced motion and a 390px viewport. All seven atlas requests were successful and reused, with no browser errors or failed local requests. Native Chromium speech emitted `start`, and the speaking actor changed accordingly; automated checks do not claim audible voice quality. The production preview also renders the bundled rig successfully and retains the legacy root game.

- [Browser evidence](browser-review.json)
- [Desktop](desktop.png), [surprised reaction](surprised.png), [companion scene](companion.png), [mobile](mobile.png)
- Reproduce unit checks: `node --test tests/*.test.mjs`
- Build: `npm run build`
- Lint: `npm run lint -- src/App.tsx src/game/story`
- Browser harness: `node scripts/check-conversations.mjs` (uses this host’s bundled Playwright runtime; server must already be running on 5173).

Module 4 now consumes this controlled renderer in the active root story. Its evidence is in `../selection-review/`. The legacy game is available at `/?experience=legacy`; Modules 5/6 remain pending.
