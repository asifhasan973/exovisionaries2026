import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { STORY_DIALOGUE } from '../src/game/story/dialogue.ts';
import { requireCharacterPerformance, characterAssetRoot } from '../src/game/story/characterAssets.ts';
import { sampleRigMotion } from '../public/story/characters-v1/rig.mjs';

const assetRoot = new URL('../public/story/characters-v1/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', assetRoot)));
const provenance = JSON.parse(readFileSync(new URL('../docs/story/character-assets/provenance.json', import.meta.url)));

test('all seven shipped atlases match provenance, dimensions and real WebP alpha', () => {
  assert.equal(Object.keys(manifest.atlases).length, 7);
  for (const [id, atlas] of Object.entries(manifest.atlases)) {
    const buffer = readFileSync(new URL(atlas.file, assetRoot));
    assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
    assert.equal(buffer.toString('ascii', 8, 12), 'WEBP');
    const file = provenance.files.find(file => file.name === id);
    assert.equal(createHash('sha256').update(buffer).digest('hex'), file.sha256);
    assert.equal(file.alphaExactMatch, true);
    let alpha = false;
    let dimensions;
    for (let offset = 12; offset + 8 <= buffer.length;) {
      const type = buffer.toString('ascii', offset, offset + 4);
      const size = buffer.readUInt32LE(offset + 4);
      if (type === 'VP8L') {
        assert.equal(buffer[offset + 8], 0x2f);
        const bits = buffer.readUInt32LE(offset + 9);
        dimensions = [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
        alpha ||= Boolean((bits >>> 28) & 1);
      }
      if (type === 'VP8X') {
        alpha ||= Boolean(buffer[offset + 8] & 0x10);
        dimensions = [buffer.readUIntLE(offset + 12, 3) + 1, buffer.readUIntLE(offset + 15, 3) + 1];
      }
      if (type === 'ALPH') alpha = true;
      offset += 8 + size + (size % 2);
    }
    assert.ok(alpha, `${id} must be truly transparent`);
    assert.deepEqual(dimensions, [atlas.width, atlas.height]);
  }
});

test('every exact-script speaker and listener resolves to registered expression and pose art', () => {
  const expected = Object.values(STORY_DIALOGUE).flatMap(lines => lines.flatMap(line =>
    [['speaker', line.speaker], ['listener', line.listener]].filter(([, cue]) => cue).map(([role, cue]) => ({ lineId: line.id, role, ...cue }))));
  assert.deepEqual(manifest.cueBindings, expected);
  for (const cue of expected) assert.ok(requireCharacterPerformance(manifest, cue));
  assert.throws(() => requireCharacterPerformance(manifest, { character: 'chief', expression: 'surprised', pose: 'greet' }), /Missing character art/);
});

test('48 facial frames and nine poses have valid feature, crop and attachment coordinates', () => {
  let expressions = 0; let poses = 0;
  for (const character of Object.values(manifest.characters)) {
    const bodyAtlas = manifest.atlases[character.bodyAtlas];
    const [columns, rows] = character.bodyGrid;
    const cells = new Set();
    for (const pose of Object.values(character.poses)) {
      poses++; assert.ok(!cells.has(pose.cell)); cells.add(pose.cell);
      assert.ok(pose.cell >= 0 && pose.cell < columns * rows);
      for (const [x, y] of [...pose.arm, pose.neck, pose.pivot]) {
        assert.ok(x >= 0 && x < bodyAtlas.width / columns);
        assert.ok(y >= 0 && y < bodyAtlas.height / rows);
      }
    }
    for (const face of Object.values(character.expressions)) {
      expressions++;
      const atlas = manifest.atlases[face.atlas];
      const [x, y, width, height] = face.closed;
      assert.ok(x >= 0 && y >= 0 && x + width <= atlas.width && y + height <= atlas.height);
      assert.ok(face.anchor[0] >= 0 && face.anchor[0] <= width && face.anchor[1] >= 0 && face.anchor[1] <= height);
      assert.ok(face.scale > 0);
      const regions = [['ah', 1, face.mouth], ['oo', 2, face.mouth], ...(face.eyelids ?? [face.eyes]).map(region => ['blink', 3, region])];
      for (const [frame, column, region] of regions) {
        const [rx, ry, rw, rh] = region; const [dx, dy] = face.offsets[frame];
        assert.ok(rx >= 0 && ry >= 0 && rx + rw <= width && ry + rh <= height);
        assert.ok(x + face.columnWidth * column + rx + dx >= 0);
        assert.ok(x + face.columnWidth * column + rx + dx + rw <= atlas.width);
        assert.ok(y + ry + dy >= 0 && y + ry + dy + rh <= atlas.height);
      }
    }
  }
  assert.equal(expressions * 4, 48); assert.equal(poses, 9);
});

test('talking samples vary mouth and arm; idle and reduced motion cannot flap the mouth', () => {
  const mouths = new Set(); let gestures = false; let blinks = false;
  for (let time = 0; time < 7400; time += 20) {
    const active = sampleRigMotion(time, true);
    mouths.add(active.mouth); gestures ||= active.gesture !== 0; blinks ||= active.blink;
    assert.equal(sampleRigMotion(time, false).mouth, 'closed');
    assert.equal(sampleRigMotion(time, false).gesture, 0);
    assert.deepEqual(sampleRigMotion(time, true, true), { mouth: 'closed', blink: false, gesture: 0, nod: 0, breath: 0 });
  }
  assert.deepEqual([...mouths].sort(), ['ah', 'closed', 'oo']); assert.ok(gestures && blinks);
});

test('asset URLs support a deployed base path without a hardcoded localhost', () => {
  assert.equal(characterAssetRoot('/'), '/story/characters-v1/');
  assert.equal(characterAssetRoot('/game'), '/game/story/characters-v1/');
});

// The standalone Module 2 lab keeps a public snapshot; the game bundles the same compositor.
test('bundled conversation compositor matches the visually verified art lab snapshot', async () => {
  const { readFile } = await import('node:fs/promises');
  assert.equal(
    await readFile(new URL('../src/game/story/characterRig.mjs', import.meta.url), 'utf8'),
    await readFile(new URL('../public/story/characters-v1/rig.mjs', import.meta.url), 'utf8'),
  );
});
