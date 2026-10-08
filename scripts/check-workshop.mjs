import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { STORY_FLOW } from '../src/game/story/flow.ts';
import { createStoryProgress, reduceStoryProgress, STORY_SAVE_KEY } from '../src/game/story/progress.ts';
import { quickPreparation, verifiedActivities, preparationTotals } from '../src/game/story/preparation.ts';
const require = createRequire('/Users/asifhasan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [], failedRequests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('requestfailed', request => { if (request.url().startsWith('http://127.0.0.1')) failedRequests.push(request.url()); });
const output = new URL('../docs/story/workshop-review/', import.meta.url);
const report = { errors, failedRequests };
const next = () => page.getByRole('button', { name: 'Next', exact: true }).click();
const read = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORY_SAVE_KEY);
const install = id => page.locator(`[data-part-id="${id}"] .workshop-pick`).click();
async function screenshot(name) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: fileURLToPath(new URL(name, output)), fullPage: true });
}
async function dragPart(id, target) {
  const pick = page.locator(`[data-part-id="${id}"] .workshop-pick`);
  await pick.scrollIntoViewIfNeeded();
  const rect = await pick.boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + 70); await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 10 });
  assert.equal(await page.locator('.workshop-drag-ghost').count(), 1);
  await page.mouse.up();
  assert.equal(await page.locator('.workshop-drag-ghost').count(), 0);
}
try {
  let progress = reduceStoryProgress(createStoryProgress(), { type: 'set-name', name: 'Asha' });
  const choices = { destination: 'moon', objective: 'lunar-ice', site: 'crater-rim' };
  while (progress.stepId !== 'resource-limits') {
    const step = STORY_FLOW.find(step => step.id === progress.stepId);
    if (step.kind === 'choice') progress = reduceStoryProgress(progress, { type: 'select', choiceId: choices[step.choiceKey] });
    progress = reduceStoryProgress(progress, { type: 'next' });
  }
  const fromScience = process.argv.includes('--from-science');
  const prepared = quickPreparation();
  const partial = { ...prepared, drillDepthCm: 100, solarId: null, batteryId: null, navigationId: null, thermalId: null, communicationId: null };
  if (fromScience) progress = { ...progress, stepId: 'science-build', completedActivities: ['resource-limits', 'lander-build', 'rover-select'], preparationVersion: 1, preparation: partial };
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(({ key, progress }) => { localStorage.setItem(key, JSON.stringify(progress)); localStorage.setItem('zero_to_beyond_story_voice_v1', 'off'); }, { key: STORY_SAVE_KEY, progress });
  await page.reload(); await page.getByRole('button', { name: 'Continue', exact: true }).click();
  if (!fromScience) {
  await page.getByRole('heading', { name: 'Your mission kit', exact: true }).waitFor();
  await screenshot('resources-desktop.png');
  await page.getByRole('button', { name: 'Build', exact: true }).click();
  await page.locator('.workshop-pick img').first().waitFor();
  assert.equal(await page.locator('.workshop-pick img').count(), 6);
  assert.equal(await page.locator('.workshop-canvas canvas').count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Next', exact: true }).isDisabled(), true);
  assert.deepEqual((await read()).preparation.landerPartIds, []);
  await screenshot('empty-lander-desktop.png');
  const bay = await page.locator('.workshop-drop-zone').boundingBox();
  await dragPart('lander-body', { x: bay.x + 65, y: bay.y + 170 }); // far from physical attach point
  assert.deepEqual((await read()).preparation.landerPartIds, ['lander-body']);
  await page.getByRole('button', { name: 'Undo installation', exact: true }).click();
  assert.deepEqual((await read()).preparation.landerPartIds, []);
  await page.getByRole('button', { name: 'Redo installation', exact: true }).click();
  assert.deepEqual((await read()).preparation.landerPartIds, ['lander-body']);
  await page.getByRole('checkbox', { name: 'Select all shelf parts', exact: true }).check();
  await page.getByRole('button', { name: 'Add 5', exact: true }).click();
  assert.equal((await read()).preparation.landerPartIds.length, 6);
  assert.equal(preparationTotals((await read()).preparation).credits, 285);
  await next();
  await install('basic-rover'); await install('heavy-rover');
  assert.equal(preparationTotals((await read()).preparation).credits, 535);
  await install('polar-rover');
  await screenshot('rover-desktop.png');
  await next();
  await dragPart('nss', { x: 20, y: 30 }); // released outside the bay: return to shelf
  assert.deepEqual((await read()).preparation.sciencePartIds, []);
  assert.equal(await page.locator('.workshop-feedback').textContent(), 'Back on the shelf. Try again!');
  const scienceBay = await page.locator('.workshop-drop-zone').boundingBox();
  await dragPart('nss', { x: scienceBay.x + 14, y: scienceBay.y + 160 });
  await page.getByRole('checkbox', { name: 'Mark Near-Infrared Spectrometer — NIRVSS', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Mark TRIDENT DRILL', exact: true }).check();
  await page.getByRole('button', { name: 'Add 2', exact: true }).click();
  assert.equal((await read()).preparation.drillDepthCm, 20);
  await page.locator('#drill-depth').focus(); await page.keyboard.press('End');
  assert.equal((await read()).preparation.drillDepthCm, 100);
  }
  await page.getByRole('button', { name: 'Details for TRIDENT DRILL', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  assert.ok((await page.getByRole('dialog').textContent()).includes('175 W peak'));
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  await screenshot('science-desktop.png');
  await next();
  await install('efficient-solar'); await install('medium-battery');
  await page.reload(); await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: 'Power your explorer', exact: true }).waitFor();
  assert.equal((await read()).preparation.solarId, 'efficient-solar');
  assert.equal((await read()).preparation.drillDepthCm, 100);
  await page.setViewportSize({ width: 390, height: 844 });
  await screenshot('power-mobile.png');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.setViewportSize({ width: 320, height: 760 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const backRect = await page.getByRole('button', { name: 'Back', exact: true }).boundingBox();
  const nextRect = await page.getByRole('button', { name: 'Next', exact: true }).boundingBox();
  assert.ok(backRect.x + backRect.width <= nextRect.x);
  await next();
  await install('stereo-hazard-camera'); await install('basic-thermal');
  const radio = page.locator('[data-part-id="basic-communication"] .workshop-pick');
  await radio.focus(); await page.keyboard.press('Enter'); // keyboard install alternative
  await page.getByRole('button', { name: 'Finish build', exact: true }).click();
  await page.getByRole('heading', { name: 'Weigh your explorer', exact: true }).waitFor();
  const built = await read();
  assert.equal(built.stepId, 'mass-check');
  assert.equal(preparationTotals(built.preparation).credits, 960);
  assert.equal(built.completedActivities.includes('budget-check'), false);
  assert.equal(await page.getByRole('button', { name: 'Next', exact: true }).isDisabled(), true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await screenshot('assembly-mass-handoff-desktop.png');
  await page.reload(); await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: 'Weigh your explorer', exact: true }).waitFor();
  assert.equal((await read()).stepId, 'mass-check');
  await page.getByText('Edit equipment', { exact: true }).click();
  await page.getByRole('button', { name: 'Lander', exact: true }).click();
  await page.getByRole('button', { name: 'Quick build', exact: true }).click();
  await page.getByRole('dialog').waitFor(); await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('heading', { name: 'Build your lander', exact: true }).count(), 1);
  await page.getByRole('button', { name: 'Quick build', exact: true }).click();
  await page.getByRole('button', { name: 'Auto-build', exact: true }).click();
  await page.getByRole('heading', { name: 'Weigh your explorer', exact: true }).waitFor();
  assert.equal((await read()).preparation.drillDepthCm, 20);
  report.totals = preparationTotals((await read()).preparation);
  report.verificationScope = fromScience ? 'Continue at the repaired details-dialog boundary; previous stages verified in the earlier browser pass.' : 'Full workshop flow';
  report.features = ['initial empty bay', 'forgiving far drop', 'out-of-bay returns to shelf', 'undo/redo', 'select all', 'multi install', 'single-choice replacement', 'depth keyboard control', 'NASA info dialog', 'persist hardware and cursor on reload', '390/320 responsive', 'keyboard install', 'assembly checkpoint before approval', 'confirmed Quick Build'];
  assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []);
  await writeFile(new URL('browser-review.json', output), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.log(JSON.stringify({ errors, failedRequests, body: await page.locator('body').innerText(), saved: await read() }, null, 2));
  await screenshot('failure.png');
  throw error;
} finally { await browser.close(); }
