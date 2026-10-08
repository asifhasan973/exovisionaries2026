/** Module 2 asset compositor. No dialogue routing, speech or game state lives here. */
const patchCache = new WeakMap();

export async function loadRigAssets(characterId, baseURL = new URL('./', import.meta.url), signal) {
  const root = new URL(baseURL, globalThis.location?.href ?? import.meta.url);
  const response = await fetch(new URL('manifest.json', root), { signal });
  if (!response.ok) throw new Error(`Character manifest: ${response.status}`);
  const manifest = await response.json();
  const character = manifest.characters[characterId];
  if (!character || manifest.version !== 1) throw new Error('Unknown character or asset version');
  const atlasIds = [...new Set([character.bodyAtlas, ...Object.values(character.expressions).map(face => face.atlas)])];
  const images = new Map();
  await Promise.all(atlasIds.map(async id => {
    signal?.throwIfAborted();
    const image = new Image();
    image.src = new URL(manifest.atlases[id].file, root).href;
    await image.decode();
    signal?.throwIfAborted();
    const atlas = manifest.atlases[id];
    if (image.naturalWidth !== atlas.width || image.naturalHeight !== atlas.height) throw new Error(`Atlas dimensions differ: ${id}`);
    images.set(id, image);
  }));
  return { manifest, characterId, character, images };
}

/** Rhythmic talking sample, not audio/phoneme-accurate lip sync. */
export function sampleRigMotion(elapsedMs, speaking = false, reducedMotion = false) {
  if (reducedMotion) return { mouth: 'closed', blink: false, gesture: 0, nod: 0, breath: 0 };
  const time = Math.max(0, elapsedMs);
  const mouthCycle = [
    ['closed', 110], ['ah', 155], ['oo', 115], ['ah', 135],
    ['closed', 170], ['ah', 130], ['closed', 120], ['oo', 125], ['closed', 200],
  ];
  let phase = time % 1260;
  let mouth = 'closed';
  if (speaking) for (const [frame, duration] of mouthCycle) {
    if (phase < duration) { mouth = frame; break; }
    phase -= duration;
  }
  const blinkPhase = time % 7300;
  return {
    mouth,
    blink: (blinkPhase >= 2630 && blinkPhase < 2750) || (blinkPhase >= 6920 && blinkPhase < 7020),
    gesture: speaking ? Math.sin(time / 420) * Math.max(0, Math.sin(time / 1150)) : 0,
    nod: speaking ? Math.sin(time / 770) * .008 : 0,
    breath: Math.sin(time / 1900) * .85,
  };
}

function featurePatch(image, face, region, frame) {
  let cache = patchCache.get(image);
  if (!cache) { cache = new Map(); patchCache.set(image, cache); }
  const key = JSON.stringify([face.closed, face.offsets, region, frame]);
  if (cache.has(key)) return cache.get(key);
  const [x, y, width, height] = region;
  const column = { ah: 1, oo: 2, blink: 3 }[frame];
  const [dx, dy] = face.offsets[frame];
  const patch = document.createElement('canvas');
  patch.width = width; patch.height = height;
  const context = patch.getContext('2d');
  context.drawImage(image, face.closed[0] + column * face.columnWidth + x + dx,
    face.closed[1] + y + dy, width, height, 0, 0, width, height);
  // Feather only the patch boundary; the nose, silhouette and rest of the head stay fixed.
  const mask = document.createElement('canvas'); mask.width = width; mask.height = height;
  const matte = mask.getContext('2d'); matte.fillStyle = '#000'; matte.fillRect(0, 0, width, height);
  matte.globalCompositeOperation = 'destination-in';
  const edge = frame === 'blink' ? 4 : 7;
  for (const [x1, y1, x2, y2] of [[0, 0, width, 0], [0, 0, 0, height]]) {
    const gradient = matte.createLinearGradient(x1, y1, x2, y2);
    const length = x2 || y2;
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(edge / length, 'rgba(0,0,0,1)');
    gradient.addColorStop(1 - edge / length, 'rgba(0,0,0,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    matte.fillStyle = gradient; matte.fillRect(0, 0, width, height);
  }
  if (frame !== 'blink') {
    matte.save(); matte.scale(width, height);
    const ellipse = matte.createRadialGradient(.5, .5, .36, .5, .5, .5);
    ellipse.addColorStop(0, 'rgba(0,0,0,1)'); ellipse.addColorStop(1, 'rgba(0,0,0,0)');
    matte.fillStyle = ellipse; matte.fillRect(0, 0, 1, 1); matte.restore();
  }
  context.globalCompositeOperation = 'destination-in'; context.drawImage(mask, 0, 0);
  const result = { image: patch, mask };
  cache.set(key, result);
  return result;
}

function drawFace(context, assets, face, motion) {
  const image = assets.images.get(face.atlas);
  const [, , width, height] = face.closed;
  context.drawImage(image, ...face.closed, 0, 0, width, height);
  if (motion.mouth === 'ah' || motion.mouth === 'oo') {
    const patch = featurePatch(image, face, face.mouth, motion.mouth);
    context.drawImage(patch.image, face.mouth[0], face.mouth[1]);
  }
  if (motion.blink) {
    for (const region of face.eyelids ?? [face.eyes]) {
      const patch = featurePatch(image, face, region, 'blink');
      // Remove open-eye lashes even where the blink sprite is transparent.
      context.save(); context.globalCompositeOperation = 'destination-out';
      context.drawImage(patch.mask, region[0], region[1]);
      // Add the premultiplied replacement to the remaining base. Source-over would
      // double-multiply the feather alpha and leave a dark rectangular seam.
      context.globalCompositeOperation = 'lighter';
      context.drawImage(patch.image, region[0], region[1]); context.restore();
    }
  }
}

function armPath(context, points) {
  context.moveTo(...points[0]);
  for (const point of points.slice(1)) context.lineTo(...point);
  context.closePath();
}

/** Draws the selected face with independently composited mouth and blink layers. */
export function drawCharacterPortrait(context, assets, expression, motion = {}) {
  const face = assets.character.expressions[expression];
  if (!face) throw new Error(`Missing expression: ${assets.characterId}/${expression}`);
  context.save();
  const scale = Math.min(context.canvas.width / face.closed[2], context.canvas.height / face.closed[3]);
  context.translate((context.canvas.width - face.closed[2] * scale) / 2, (context.canvas.height - face.closed[3] * scale) / 2);
  context.scale(scale, scale);
  drawFace(context, assets, face, motion);
  context.restore();
}

/** Canvas caller owns resizing, RAF and cleanup. Artwork stays stable between speech frames. */
export function drawCharacterRig(context, assets, cue, motion = {}) {
  if (cue.character !== assets.characterId) throw new Error('Cue belongs to another character');
  const { character, manifest } = assets;
  const pose = character.poses[cue.pose];
  const face = character.expressions[cue.expression];
  if (!pose || !face) throw new Error(`Missing performance: ${cue.character}/${cue.expression}/${cue.pose}`);
  const atlas = manifest.atlases[character.bodyAtlas];
  const [columns, rows] = character.bodyGrid;
  const column = pose.cell % columns; const row = Math.floor(pose.cell / columns);
  const left = Math.round(column * atlas.width / columns); const top = Math.round(row * atlas.height / rows);
  const width = Math.round((column + 1) * atlas.width / columns) - left;
  const height = Math.round((row + 1) * atlas.height / rows) - top;
  const image = assets.images.get(character.bodyAtlas);
  const bodyX = character.neckTarget[0] - pose.neck[0] * character.bodyScale;
  const bodyY = character.neckTarget[1] - pose.neck[1] * character.bodyScale;
  const angle = cue.pose === 'listen' ? 0 : (motion.gesture ?? 0) * .023;
  const drawBody = () => context.drawImage(image, left, top, width, height, 0, 0, width, height);
  const stageScale = Math.min(context.canvas.width / manifest.stage.width, context.canvas.height / manifest.stage.height);
  context.save();
  context.translate((context.canvas.width - manifest.stage.width * stageScale) / 2,
    (context.canvas.height - manifest.stage.height * stageScale) / 2);
  context.scale(stageScale, stageScale);
  context.translate(0, motion.breath ?? 0);

  context.save();
  context.translate(bodyX, bodyY); context.scale(character.bodyScale, character.bodyScale);
  context.beginPath(); context.rect(0, 0, width, height); armPath(context, pose.arm);
  context.clip('evenodd'); drawBody(); context.restore();

  context.save();
  context.translate(...character.neckTarget); context.rotate(motion.nod ?? 0); context.scale(face.scale, face.scale);
  context.translate(-face.anchor[0], -face.anchor[1]);
  drawFace(context, assets, face, motion); context.restore();

  // The free forearm is a separate layer and pivot. Thinking fingers can sit in front of the chin.
  context.save();
  context.translate(bodyX, bodyY); context.scale(character.bodyScale, character.bodyScale);
  context.translate(...pose.pivot); context.rotate(angle); context.translate(-pose.pivot[0], -pose.pivot[1]);
  context.beginPath(); armPath(context, pose.arm); context.clip(); drawBody(); context.restore();
  context.restore();
}
