import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { STORY_DIALOGUE } from '../src/game/story/dialogue.ts';
import { STORY_SAVE_KEY } from '../src/game/story/progress.ts';

const require = createRequire('/Users/asifhasan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => {
  const utterances = []; let active = null;
  class Utterance { constructor(text) { this.text = text; } }
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: Utterance, configurable: true });
  Object.defineProperty(window, 'speechSynthesis', { value: {
    getVoices: () => [], speak(utterance) { utterances.push(utterance); active = utterance; setTimeout(() => { if (active === utterance) utterance.onstart?.(); }, 0); },
    cancel() { const old = active; active = null; old?.onerror?.(); },
  }, configurable: true });
  window.__selectionSpeech = { utterances };
});
const page = await context.newPage();
const errors = [], failedRequests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('requestfailed', request => { if (request.url().startsWith('http://127.0.0.1')) failedRequests.push(request.url()); });
const output = new URL('../docs/story/selection-review/', import.meta.url);
const report = { exactLines: [], errors, failedRequests };
const next = () => page.getByRole('button', { name: 'Next', exact: true }).click();
const back = () => page.getByRole('button', { name: 'Back', exact: true }).click();
const legacyKey = 'zero_to_beyond_save_v1';
async function dialogue(lines, playerName = 'Asha Rahman') {
  for (const line of lines) {
    const text = line.nameSlots === 'greeting' ? line.text.replace(/^Charlie,/, () => `${playerName},`) : line.text;
    assert.equal(await page.locator('[data-line-id]').getAttribute('data-line-id'), line.id);
    assert.equal(await page.locator('[data-line-id]').textContent(), text);
    const current = page.locator(`[data-character="${line.speaker.character}"]`);
    assert.equal(await current.getAttribute('data-expression'), line.speaker.expression);
    assert.equal(await current.getAttribute('data-pose'), line.speaker.pose);
    report.exactLines.push(line.id);
    await next();
  }
}
async function resume() { await page.getByRole('button', { name: 'Continue', exact: true }).click(); }
async function screenshot(name) {
  await page.waitForFunction(() => !document.querySelector('.actor-status'));
  await page.screenshot({ path: fileURLToPath(new URL(name, output)) });
}
try {
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(({ legacyKey }) => localStorage.setItem(legacyKey, 'preserve-existing-mission'), { legacyKey });
  await page.getByRole('heading', { name: 'Enter ur name', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Start', exact: true }).isDisabled(), true);
  await page.locator('#commander-name-input').fill('   ');
  assert.equal(await page.getByRole('button', { name: 'Start', exact: true }).isDisabled(), true);
  await page.locator('#commander-name-input').fill('Asha Rahman');
  await screenshot('name-desktop.png');
  await page.locator('#commander-name-input').press('Enter');
  await page.locator('[data-line-id="appointment-01"]').waitFor();
  await dialogue(STORY_DIALOGUE.appointment);
  await dialogue(STORY_DIALOGUE.companionIntro);
  await page.getByRole('heading', { name: 'Planet selection', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Mars', exact: true }).isDisabled(), true);
  assert.equal(await page.getByRole('button', { name: 'Comming Soon', exact: true }).isDisabled(), true);
  assert.equal(await page.getByRole('button', { name: 'Next', exact: true }).isDisabled(), true);
  await screenshot('destination-desktop.png');
  await page.getByRole('button', { name: 'Moon', exact: true }).click();
  await page.locator('[data-line-id="objectiveBriefing-01"]').waitFor();
  assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).selections.destination, STORY_SAVE_KEY), 'moon');
  await back();
  await page.getByRole('heading', { name: 'Planet selection', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Moon', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Moon', exact: true }).click();
  assert.equal(await page.locator('[data-line-id]').getAttribute('data-line-id'), 'objectiveBriefing-01');
  await dialogue(STORY_DIALOGUE.objectiveBriefing);
  assert.equal(await page.getByRole('button', { name: 'Next', exact: true }).isDisabled(), true);
  await page.getByRole('button', { name: 'Mission A — Lunar South Pole Ice Explorer', exact: true }).click();
  await screenshot('objective-desktop.png');
  await next();
  await dialogue(STORY_DIALOGUE.siteBriefing);
  await page.getByRole('button', { name: '🧊 SITE A — Ice-Proximity Crater Rim', exact: true }).click();
  await screenshot('site-desktop.png');
  await next();
  await dialogue(STORY_DIALOGUE.resourceBriefing);
  await page.getByRole('heading', { name: 'Your mission kit', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Build', exact: true }).isDisabled(), false);
  await screenshot('plan-desktop.png');
  report.primaryRoute = 'Name → appointment → companion → Moon → objective briefing → objective → site briefing → site → resource briefing → saved plan';
  assert.equal(report.exactLines.length, 18);
  const plan = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORY_SAVE_KEY);
  assert.deepEqual(plan.selections, { destination: 'moon', objective: 'lunar-ice', site: 'crater-rim' });
  assert.deepEqual(plan.completedActivities, []);
  report.plan = plan;
  await page.getByRole('button', { name: 'Mute narration', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Continue', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Enable narration', exact: true }).count(), 1);
  assert.equal(await page.evaluate(() => window.__selectionSpeech.utterances.length), 0);
  await resume();
  await page.getByRole('heading', { name: 'Your mission kit', exact: true }).waitFor();
  await back();
  assert.equal(await page.locator('[data-line-id]').getAttribute('data-line-id'), 'resourceBriefing-05');
  await back();
  await page.reload(); await resume();
  assert.equal(await page.locator('[data-line-id]').getAttribute('data-line-id'), 'resourceBriefing-04');
  while (await page.locator('[data-line-id]').count()) await back();
  await page.getByRole('heading', { name: 'Landing Site Selection', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '🧊 SITE A — Ice-Proximity Crater Rim', exact: true }).getAttribute('aria-pressed'), 'true');
  await back();
  await page.locator('[data-line-id="siteBriefing-01"]').waitFor();
  await back();
  await page.getByRole('heading', { name: 'Mission Objective', exact: true }).waitFor();
  await page.reload(); await resume();
  assert.equal(await page.getByRole('button', { name: 'Mission A — Lunar South Pole Ice Explorer', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).selections.site, STORY_SAVE_KEY), 'crater-rim');
  await page.getByRole('button', { name: 'Mission B — Lunar Geology Explorer', exact: true }).click();
  await next(); await next();
  await page.getByRole('button', { name: '🌑 SITE B — Permanently Shadowed Region', exact: true }).click();
  await screenshot('shadow-selected-desktop.png');
  await next();
  for (let index = 0; index < STORY_DIALOGUE.resourceBriefing.length; index++) await next();
  const alternate = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).selections, STORY_SAVE_KEY);
  assert.deepEqual(alternate, { destination: 'moon', objective: 'lunar-geology', site: 'permanent-shadow' });
  report.alternateSelections = alternate;
  assert.equal(await page.evaluate(key => localStorage.getItem(key), legacyKey), 'preserve-existing-mission');
  await page.setViewportSize({ width: 390, height: 844 });
  await screenshot('plan-mobile.png');
  await page.getByRole('button', { name: 'Start a new mission', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  await page.getByRole('button', { name: 'Start a new mission', exact: true }).click();
  await page.getByRole('button', { name: 'Start fresh', exact: true }).click();
  await page.getByRole('heading', { name: 'Enter ur name', exact: true }).waitFor();
  assert.equal(await page.locator('#commander-name-input').inputValue(), '');
  assert.equal(await page.evaluate(key => localStorage.getItem(key), legacyKey), 'preserve-existing-mission');
  await screenshot('name-mobile.png');
  await page.locator('#commander-name-input').fill('Sam $&');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  for (let index = 0; index < 9; index++) await next();
  await screenshot('destination-mobile.png');
  const mobileWidths = [await page.evaluate(() => [innerWidth, document.documentElement.scrollWidth])];
  await page.getByRole('button', { name: 'Moon', exact: true }).click();
  for (let index = 0; index < 3; index++) await next();
  await screenshot('objective-mobile.png');
  mobileWidths.push(await page.evaluate(() => [innerWidth, document.documentElement.scrollWidth]));
  await page.getByRole('button', { name: 'Mission A — Lunar South Pole Ice Explorer', exact: true }).click(); await next(); await next();
  await screenshot('site-mobile.png');
  mobileWidths.push(await page.evaluate(() => [innerWidth, document.documentElement.scrollWidth]));
  assert.ok(mobileWidths.every(([width, scrollWidth]) => scrollWidth <= width));
  report.mobile = { viewport: '390 × 844', noHorizontalOverflow: true, widths: mobileWidths };
  // Storage failure must not strand a learner behind a disabled loading screen.
  const blocked = await browser.newContext();
  await blocked.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); }, configurable: true });
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
  });
  const blockedPage = await blocked.newPage();
  blockedPage.on('pageerror', error => errors.push(error.message));
  await blockedPage.goto('http://127.0.0.1:5173/');
  await blockedPage.locator('#commander-name-input').fill('Offline learner');
  await blockedPage.getByRole('button', { name: 'Start', exact: true }).click();
  assert.equal(await blockedPage.locator('[data-line-id]').textContent(), 'Offline learner, good to see you.');
  await blockedPage.getByRole('button', { name: 'Next', exact: true }).click();
  assert.equal(await blockedPage.locator('[data-line-id]').getAttribute('data-line-id'), 'appointment-02');
  assert.equal(await blockedPage.locator('.selection-save-status').textContent(), 'Not saved');
  await blocked.close();
  report.storageFailurePlayable = true;
  assert.equal(errors.length, 0); assert.equal(failedRequests.length, 0);
  await writeFile(new URL('browser-review.json', output), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ exactLineCount: report.exactLines.length, primaryRoute: report.primaryRoute, alternateSelections: alternate, mobile: report.mobile, storageFailurePlayable: true, errors, failedRequests }, null, 2));
} finally { await browser.close(); }
