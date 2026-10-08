import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createStoryProgress, STORY_SAVE_KEY } from '../src/game/story/progress.ts';
import { quickPreparation, verifiedActivities } from '../src/game/story/preparation.ts';
import { createWorkshopSession, reduceMission } from '../src/game/story/workshopSession.ts';
const { chromium } = createRequire('/Users/asifhasan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright');
const browser = await chromium.launch({ headless: true });
const output = new URL('../docs/story/readiness-review/', import.meta.url);
let session = createWorkshopSession({ ...createStoryProgress(), playerName: 'Asha', stepId: 'mass-check', selections: { destination: 'moon', objective: 'lunar-ice', site: 'crater-rim' }, completedActivities: verifiedActivities(quickPreparation()) }, quickPreparation());
for (let i = 0; i < 3; i++) session = reduceMission(reduceMission(session, { type: 'run-check' }), { type: 'next' });
session = reduceMission(reduceMission(session, { type: 'pack', action: 'adapter' }), { type: 'pack', action: 'payload' });
const save = { ...session.progress, preparationVersion: 1, preparation: session.preparation, readinessVersion: 1, readiness: session.readiness };
const errors = [], failedRequests = [], results = [];
try {
  for (const fallback of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    await context.addInitScript(({ save, key, fallback }) => {
      localStorage.setItem(key, JSON.stringify(save)); localStorage.setItem('zero_to_beyond_story_voice_v1', 'off');
      if (fallback) { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.startsWith('webgl') ? null : original.call(this, type, ...args); }; }
    }, { save, key: STORY_SAVE_KEY, fallback });
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message)); page.on('requestfailed', r => failedRequests.push(r.url()));
    await page.goto('http://127.0.0.1:4173/'); await page.getByRole('button', { name: 'Continue', exact: true }).click();
    if (fallback) await page.getByText('3D unavailable. Use the packing buttons to continue.', { exact: true }).waitFor();
    else { await page.locator('.readiness-canvas canvas').waitFor(); await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: fileURLToPath(new URL('packing-desktop.png', output)), fullPage: true }); }
    await page.getByRole('button', { name: 'Close fairing', exact: true }).click(); await page.getByRole('button', { name: 'Approve mission', exact: true }).click();
    assert.equal(await page.getByRole('heading', { name: 'Mission approved!', exact: true }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Launch later', exact: true }).isDisabled(), true);
    if (!fallback) { await page.locator('.readiness-canvas canvas').waitFor(); await page.screenshot({ path: fileURLToPath(new URL('approved-desktop.png', output)), fullPage: true }); }
    results.push(fallback ? 'No-WebGL fallback still packs and approves; no runtime crash' : 'Production lazy scene, packing resume, approval endpoint and reduced motion'); await context.close();
  }
  assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []);
  await writeFile(new URL('production-review.json', output), JSON.stringify({ results, errors, failedRequests }, null, 2)); console.log(JSON.stringify({ results, errors, failedRequests }));
} finally { await browser.close(); }
