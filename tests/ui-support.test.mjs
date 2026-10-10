import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreparationSelection } from '../src/game/story/design.ts';
import { installPart, quickPreparation, preparationTotals } from '../src/game/story/preparation.ts';
import { comparePart, optionBenefit } from '../src/game/story/partComparison.ts';
import { GLOSSARY, WORD_GROUPS, PART_TERMS } from '../src/game/story/glossary.ts';

test('option preview shows replacement deltas without adding both choices or mutating design', () => {
  const design = installPart(createPreparationSelection(), 'basic-rover');
  const before = structuredClone(design);
  const comparison = comparePart(design, 'polar-rover', true);
  assert.equal(comparison.replaces, 'Basic Rover');
  assert.equal(comparison.credits, 70);
  assert.equal(comparison.massKg, 30);
  assert.equal(comparison.peakW, 30);
  assert.deepEqual(design, before);
  assert.equal(comparePart(design, 'basic-rover').credits, 0);
  assert.equal(comparePart(design, 'basic-rover').replaces, undefined);
  // A cheaper option must never claim the upgrade's benefit.
  assert.equal(optionBenefit('basic-communication', null), 'Simple radio link');
  assert.equal(optionBenefit('basic-navigation-camera', null), 'Simple route view');
});
test('battery preview follows the actual shadow energy model and mandatory add-on totals', () => {
  const design = quickPreparation('crater-rim');
  const preview = comparePart(design, 'large-battery', true);
  const actual = preparationTotals(installPart(design, 'large-battery'), true);
  assert.equal(preview.batteryWh, 400);
  assert.equal(preview.shadowMinutes, actual.batteryMinutes);
  assert.equal(preview.massKg, actual.massKg - preparationTotals(design, true).massKg);
  const empty = createPreparationSelection();
  assert.equal(comparePart(empty, 'lander-body').massKg, 80);
});
test('every learning word is available exactly once through topics and every part has help', () => {
  const words = WORD_GROUPS.flatMap(group => group.terms);
  assert.equal(words.length, new Set(words).size);
  assert.deepEqual([...words].sort(), Object.keys(GLOSSARY).sort());
  for (const term of Object.values(PART_TERMS)) assert.ok(GLOSSARY[term]);
});
