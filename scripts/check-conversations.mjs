import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { STORY_DIALOGUE } from '../src/game/story/dialogue.ts';
const require = createRequire('/Users/asifhasan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => {
  const utterances = []; let active = null; let cancellations = 0;
  class Utterance { constructor(text) { this.text = text; } }
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: Utterance, configurable: true });
  Object.defineProperty(window, 'speechSynthesis', { value: {
    getVoices: () => [],
    speak(utterance) { utterances.push(utterance); active = utterance; setTimeout(() => { if (active === utterance) utterance.onstart?.(); }, 0); },
    cancel() { cancellations++; const old = active; active = null; old?.onerror?.(); },
  }, configurable: true });
  window.__voiceReview = { utterances, end() { active?.onend?.(); active = null; }, get cancellations() { return cancellations; } };
});
const page = await context.newPage();
const errors = [], failedRequests = [], assetRequests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('requestfailed', request => { if (request.url().startsWith('http://127.0.0.1')) failedRequests.push(request.url()); });
page.on('request', request => { if (request.url().includes('.webp')) assetRequests.push(request.url()); });
const output = new URL('../docs/story/conversation-review/', import.meta.url);
const report = { speechVerification: 'Injected speech lifecycle events; real browser voice availability checked separately. Audible quality is not asserted.', lines: [], errors, failedRequests };
try {
  await page.goto('http://127.0.0.1:5173/?module=3');
  await page.getByRole('button', { name: 'Start conversation' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.actor-status').length === 0);
  await page.locator('[data-speaking="true"]').waitFor();
  const footer = await page.locator('.conversation-controls').boundingBox();
  await page.screenshot({ path: fileURLToPath(new URL('desktop.png', output)) });
  const sourceLines = Object.values(STORY_DIALOGUE).flat();
  for (let index = 0; index < sourceLines.length; index++) {
    const expected = sourceLines[index];
    const displayed = page.locator('[data-line-id]');
    await displayed.waitFor();
    assert.equal(await displayed.getAttribute('data-line-id'), expected.id);
    assert.equal(await displayed.textContent(), expected.text);
    const actor = page.locator(`[data-character="${expected.speaker.character}"]`);
    assert.equal(await actor.getAttribute('data-expression'), expected.speaker.expression);
    assert.equal(await actor.getAttribute('data-pose'), expected.speaker.pose);
    const currentFooter = await page.locator('.conversation-controls').boundingBox();
    assert.ok(Math.abs(currentFooter.y - footer.y) < 2, 'Desktop controls remain in a consistent position');
    report.lines.push(expected.id);
    if (index === 3) {
      await page.getByRole('button', { name: 'Back', exact: true }).click();
      assert.equal(await displayed.getAttribute('data-line-id'), sourceLines[2].id);
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      assert.equal(await displayed.getAttribute('data-line-id'), expected.id);
      await page.screenshot({ path: fileURLToPath(new URL('surprised.png', output)) });
    }
    await page.getByRole('button', { name: index === sourceLines.length - 1 ? 'Finish' : 'Next', exact: true }).click();
  }
  await page.getByRole('heading', { name: 'Briefing complete!' }).waitFor();
  report.exactDialogueCount = report.lines.length;
  await page.locator('#preview-name').fill('Sam $&');
  await page.getByRole('button', { name: 'Play again' }).click();
  assert.equal(await page.locator('[data-line-id]').textContent(), 'Sam $&, good to see you.');
  await page.getByRole('button', { name: 'Mute narration' }).click();
  assert.equal(await page.locator('[data-speaking="true"]').count(), 0);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  assert.equal(await page.locator('.conversation-speaker strong').textContent(), 'Sam $&');
  await page.getByRole('button', { name: 'Enable narration' }).click();
  await page.locator('[data-speaking="true"]').waitFor();
  await page.evaluate(() => window.__voiceReview.end());
  assert.equal(await page.locator('[data-speaking="true"]').count(), 0);
  await page.getByRole('button', { name: 'Replay this line' }).click();
  await page.locator('[data-speaking="true"]').waitFor();
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal(await page.locator('[data-speaking="true"]').count(), 0);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.getByRole('button', { name: 'Replay this line' }).click();
  await page.locator('[data-speaking="true"]').waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Scenes', exact: true }).click();
  await page.getByRole('button', { name: '3. Mission Objective', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: fileURLToPath(new URL('mobile.png', output)) });
  const dimensions = await page.evaluate(() => ({ width: innerWidth, docWidth: document.documentElement.scrollWidth, text: document.querySelector('.conversation-dialogue p').textContent, panelHeight: document.querySelector('.conversation-dialogue').clientHeight, contentHeight: document.querySelector('.conversation-dialogue').scrollHeight }));
  assert.ok(dimensions.docWidth <= dimensions.width, 'Mobile has no horizontal overflow');
  assert.equal(dimensions.text, STORY_DIALOGUE.objectiveBriefing[1].text);
  assert.ok(dimensions.contentHeight > dimensions.panelHeight, 'Long text remains scrollable, never truncated');
  report.mobile = dimensions;
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(100);
  const reducedCanvas = await page.locator('.conversation-actor canvas').first().evaluate(canvas => canvas.toDataURL());
  await page.waitForTimeout(350);
  assert.equal(await page.locator('.conversation-actor canvas').first().evaluate(canvas => canvas.toDataURL()), reducedCanvas, 'Reduced motion stops canvas animation');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  assert.equal(await page.locator('[data-character="commander"]').getAttribute('data-expression'), 'thoughtful');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Scenes', exact: true }).click();
  await page.getByRole('button', { name: '2. Your mission companion', exact: true }).click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: fileURLToPath(new URL('companion.png', output)) });
  report.uniqueAtlasRequests = new Set(assetRequests).size;
  report.totalAtlasRequests = assetRequests.length;
  assert.equal(report.uniqueAtlasRequests, 7);
  assert.equal(report.totalAtlasRequests, 7, 'Characters reuse decoded atlases');
  assert.equal(errors.length, 0); assert.equal(failedRequests.length, 0);
  const realContext = await browser.newContext();
  await realContext.addInitScript(() => {
    const Original = window.SpeechSynthesisUtterance;
    window.__actualSpeechEvents = [];
    if (Original) window.SpeechSynthesisUtterance = new Proxy(Original, { construct(target, args) {
      const utterance = Reflect.construct(target, args);
      ['start', 'end', 'error'].forEach(type => utterance.addEventListener(type, event => window.__actualSpeechEvents.push({ type, error: event.error ?? null })));
      return utterance;
    } });
  });
  const realPage = await realContext.newPage();
  await realPage.goto('http://127.0.0.1:5173/?module=3');
  await realPage.getByRole('button', { name: 'Start conversation' }).click();
  await realPage.waitForFunction(() => window.__actualSpeechEvents.some(event => event.type === 'start' || event.type === 'error'));
  report.realBrowserSpeech = await realPage.evaluate(() => ({ voiceCount: window.speechSynthesis?.getVoices().length ?? 0, events: window.__actualSpeechEvents, status: document.querySelector('.conversation-audio-status').textContent, speakingActors: document.querySelectorAll('[data-speaking="true"]').length }));
  await realPage.getByRole('button', { name: 'Next', exact: true }).click();
  assert.equal(await realPage.locator('[data-line-id]').textContent(), STORY_DIALOGUE.appointment[1].text);
  await realContext.close();
  await writeFile(new URL('browser-review.json', output), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
