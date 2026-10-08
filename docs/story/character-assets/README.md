# Module 2 — Chief and Commander art

The Commander keeps the existing Mira identity: brown skin, dark hair bun, star earrings and sapphire flight suit. The new Chief has silver hair, a short silver beard and a navy suit. Character labels and roles follow the exact supplied script. Artwork was generated using the built-in `image_gen` tool, not the image-generation CLI or an API key.

## Deliverables

- Seven genuinely transparent WebP atlases in `public/story/characters-v1/`.
- Commander: seven expressions × four facial states = 28 frames; five body poses.
- Chief: five expressions × four facial states = 20 frames; four body poses.
- Four facial states: closed mouth/open eyes, ah/open eyes, oo/open eyes, closed mouth/blinking eyes.
- Each of the 18 exact dialogue lines and all listener reactions binds to available art. There are 16 unique character/expression/pose combinations in the script.
- Interactive art lab: `/story/characters-v1/preview.html`. Select a character, expression or gesture; inspect talking, listening or individual frames; cycle through actual script cues.
- Desktop/mobile screenshots, two face contact sheets, a 48-frame animated review loop, and browser review evidence in this directory.

The source body frames are intentionally headless, framed from collar to below knees. The runtime assembles the registered head, mouth, eyelid, body and free-forearm layers. These are illustrated 2D characters; this module does not make 3D character models, walking cycles or a full skeletal animation editor.

## Animation contract

`public/story/characters-v1/rig.mjs` is the standalone art-lab compositor snapshot. Module 3 bundles the identical `src/game/story/characterRig.mjs` through the typed lazy bridge in `characterAssets.ts`: Vite cannot import runtime modules from `public/`. An equality test protects these two copies from drift; update both when changing the compositor. The Module 3 review and Module 4 active root load this art on demand; the legacy route does not use the new characters.

```ts
const compositor = await loadCharacterCompositor();
const art = await compositor.loadRigAssets('commander', characterAssetRoot(), signal);
const motion = compositor.sampleRigMotion(elapsedMs, isSpeaking, reduceMotion);
context.clearRect(0, 0, context.canvas.width, context.canvas.height);
compositor.drawCharacterRig(context, art, cue, motion);
```

The renderer draws the closed-expression head as the stable base. Only a small mouth window changes for speaking; eye windows replace the open lashes during blinks. Masks feather the edges and preserve the hair/nose/head outside the feature windows. A free forearm is clipped into its own layer and rotates around its elbow/wrist attachment while speaking. Listeners keep their mouths closed and their arms steady. A small head nod and breathing movement are secondary motions, not substitutes for the mouth and arm layers.

The preview's speech motion is **rhythmic talking, not phoneme-accurate lip sync**. There is no recorded voice or timed speech in Module 2. Module 3 owns dialogue rendering, click-to-next interaction, audio/speaking lifecycle and any audio-derived timing. The speaking state must follow actual narration start/end/cancel events when narration is introduced; never keep a silent character flapping forever in the story.

The caller owns resizing, a single animation loop and unmount cleanup. Use device pixel ratio with a sensible cap when integrating. Suspend the loop when the page is hidden. Reduced-motion mode renders a still expression; manual frame inspection remains available in the art lab. The compositor caches only the small feature patches, and loads atlases per character, not the full game.

## Editing and provenance

- `prompts.json`: the complete seven-prompt set and built-in tool provenance.
- `provenance.json`: generated source paths, output hashes, dimensions and compression evidence.
- `scripts/create-character-manifest.mjs`: frame rectangles, attachment points, source offsets, feature masks and forearm polygons. Edit this file, then run it to regenerate `public/story/characters-v1/manifest.json`.
- `manifest.json`: runtime metadata and exact-script cue bindings. Do not manually change the generated cue binding list.
- `preview.css`: art-lab styling only; it does not restyle the live game.

The generated PNGs were only transcoded for delivery; no faces were repainted by code. The shipped WebP set is **2,723,460 bytes** in total, down from 12,226,868 generated PNG bytes. Quality 94 compression keeps every source alpha value and original dimensions; RGB is compressed and is not claimed to be byte-identical. No new npm dependencies were added to the game.

## Verification

Run the focused checks after changes:

```sh
node --test tests/story-foundation.test.mjs tests/character-assets.test.mjs
npm run build
npm run lint -- src/game/story public/story/characters-v1 scripts/create-character-manifest.mjs tests
git diff --check
```

`browser-review.json` records rendered pixel evidence for all 12 expressions: the ah, oo and blink states change the intended feature windows, while pixels outside those windows stay identical. It also records visible movement for all seven non-listening arm poses, steady listening arms, mobile overflow checks, reduced-motion behavior and browser/network errors. The transparent body and face sheets were inspected visually in the assembled preview, not just counted as files.

The new art is integrated in Module 3’s conversation preview at `/?module=3`. Module 4 also uses the art in the active root flow. Existing dialogue and old character assets remain available in the legacy game at `/?experience=legacy`.

Delivery checks passed: 15 focused tests (10 story + 5 art), TypeScript/production build, scoped lint and diff whitespace checks. Browser review passed for 12 expression sets, 9 poses, all 16 script cue combinations, 390 px mobile layout and reduced motion, with no browser or failed-request errors. The existing Three.js bundle-size warning remains in the unchanged game build.
