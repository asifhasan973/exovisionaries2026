import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const { chromium } = await import(
  process.env.KEYWORD_PLAYWRIGHT_MODULE ?? "playwright"
);
const output = process.env.KEYWORD_UI_OUTPUT ?? "/tmp/space-keywords-ui";
const fixtures = process.env.KEYWORD_SAVE_DIR ?? "/tmp/space-keywords-fixtures";
const base = process.env.KEYWORD_URL ?? "http://127.0.0.1:5173";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: ["--enable-unsafe-swiftshader"],
});
const errors = [],
  checks = [];
const key = "zero_to_beyond_full_moon_v13";
const dialog = (page) => page.locator("dialog.keyword-drawer[open]");
async function enter(step) {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const save = readFileSync(`${fixtures}/${step}.json`, "utf8");
  await context.addInitScript(
    ({ save, key }) => {
      sessionStorage.setItem("exovisionaries_splash_session", "true");
      localStorage.setItem(key, save);
    },
    { save, key },
  );
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto(base);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "Keep playing", exact: true }).click();
  await page
    .locator(".loading-screen-root")
    .waitFor({ state: "hidden", timeout: 60000 });
  await page
    .getByRole("button", { name: "Open space keywords", exact: true })
    .waitFor();
  return { page, context };
}
async function openWord(page, category, name) {
  const panel = dialog(page);
  await panel
    .getByRole("button", { name: "All keywords", exact: true })
    .click();
  await panel.getByRole("button", { name: category, exact: true }).click();
  const button = panel.getByRole("button", { name, exact: true });
  for (let i = 0; i < 12 && !(await button.count()); i++) {
    const next = panel.getByRole("button", { name: "Next keyword page" });
    assert.ok(
      await next.isEnabled(),
      `${name} must be accessible in ${category}`,
    );
    await next.click();
  }
  await button.click();
  await panel.getByRole("article", { name, exact: true }).waitFor();
  return panel.getByRole("article", { name, exact: true });
}
async function layout(page, name) {
  for (const [width, height] of [
    [1366, 768],
    [1024, 600],
    [844, 390],
    [667, 375],
  ]) {
    await page.setViewportSize({ width, height });
    const result = await dialog(page).evaluate((element) => {
      const r = element.getBoundingClientRect(),
        section = element.querySelector(".game-info-page");
      return {
        x: r.x,
        y: r.y,
        right: r.right,
        bottom: r.bottom,
        innerWidth: section.clientWidth,
        scrollWidth: section.scrollWidth,
        body: document.documentElement.scrollHeight,
        height: window.innerHeight,
      };
    });
    assert.ok(
      result.x >= -1 &&
        result.y >= -1 &&
        result.right <= width + 1 &&
        result.bottom <= height + 1,
      JSON.stringify(result),
    );
    assert.ok(
      result.scrollWidth <= result.innerWidth + 1,
      "No horizontal content clipping",
    );
    assert.ok(result.body <= result.height + 1, "Outer game must not scroll");
    await page.screenshot({ path: `${output}/${name}-${width}x${height}.png` });
  }
}
try {
  const { page, context } = await enter("moon-transfer");
  await page
    .getByRole("button", { name: "Open space keywords", exact: true })
    .click();
  for (const name of ["Delta-v · Change in speed", "Burn window", "Coasting"])
    assert.ok(
      await dialog(page).getByRole("heading", { name, exact: true }).count(),
    );
  assert.equal(
    await dialog(page)
      .getByRole("heading", { name: "Plagioclase", exact: true })
      .count(),
    0,
  );
  const before = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    key,
  );
  await layout(page, "transfer");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.keyboard.press("Escape");
  assert.equal(await dialog(page).count(), 0);
  assert.equal(
    await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    ),
    "Open space keywords",
  );
  const after = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    key,
  );
  assert.equal(after.stepId, before.stepId);
  assert.deepEqual(after.moon.journey, before.moon.journey);
  checks.push(
    "Transfer context, four viewport tiers, Escape, focus, and saved journey preservation",
  );
  await page
    .getByRole("button", { name: "Open space keywords", exact: true })
    .click();
  let card = await openWord(page, "Rocket", "Docking");
  await card.locator("img").waitFor();
  await card.locator("img").evaluate((image) => image.decode());
  assert.equal(
    await card
      .locator("img")
      .evaluate((image) => getComputedStyle(image).objectFit),
    "contain",
  );
  await layout(page, "docking");
  await page.setViewportSize({ width: 1366, height: 768 });
  const first = await card.locator("img").getAttribute("src");
  await card.getByRole("button", { name: "Next media", exact: true }).click();
  assert.notEqual(await card.locator("img").getAttribute("src"), first);
  await card.locator(".keyword-media-stage").focus();
  await page.keyboard.press("ArrowLeft");
  assert.equal(await card.locator("img").getAttribute("src"), first);
  await card.locator(".keyword-media-stage").evaluate((element) => {
    const touch = (x) =>
      new Touch({ identifier: 1, target: element, clientX: x, clientY: 100 });
    element.dispatchEvent(
      new TouchEvent("touchstart", { touches: [touch(280)], bubbles: true }),
    );
    element.dispatchEvent(
      new TouchEvent("touchend", {
        changedTouches: [touch(80)],
        bubbles: true,
      }),
    );
  });
  assert.notEqual(await card.locator("img").getAttribute("src"), first);
  checks.push(
    "Multiple images, arrows, keyboard, swipe, and contained image proportions",
  );
  card = await openWord(page, "Rocket", "Lander");
  await card.locator("img").evaluate((image) => image.decode());
  assert.equal(
    await card.getByRole("button", { name: "Next media" }).count(),
    0,
  );
  card = await openWord(page, "Rocket", "Burn window");
  assert.equal(await card.locator("figure").count(), 0);
  assert.equal(await card.locator("p").count(), 1);
  checks.push(
    "Single image without carousel controls; no-media card without empty frame or example",
  );
  card = await openWord(page, "Moon", "Crater rim");
  await card.getByRole("button", { name: "Next media", exact: true }).click();
  assert.equal(
    await card.locator("iframe").count(),
    0,
    "No player before Play",
  );
  await card.getByRole("button", { name: /^Play video/ }).click();
  await card.locator("iframe, .keyword-video > a").waitFor({ timeout: 20000 });
  await card
    .locator(".keyword-video > span")
    .waitFor({ state: "hidden", timeout: 20000 });
  await page.screenshot({ path: `${output}/supplied-video.png` });
  await card.getByRole("button", { name: /^Read aloud/ }).click();
  assert.equal(
    await card.locator("iframe").count(),
    0,
    "Read aloud must stop video",
  );
  await card.getByRole("button", { name: /^Play video/ }).click();
  await card.locator("iframe, .keyword-video > a").waitFor({ timeout: 20000 });
  await card
    .getByRole("button", { name: "Previous media", exact: true })
    .click();
  assert.equal(
    await card.locator("iframe").count(),
    0,
    "Changing slides must stop video",
  );
  checks.push(
    "Supplied video is opt-in; Read aloud and slide changes remove its player",
  );
  // Real browser speech boundary captures exactly what the application asks to speak.
  await page.evaluate(
    async (audioPath) => {
      const { useAudioStore } = await import(audioPath);
      useAudioStore.setState({ isMuted: false, voicesEnabled: true });
      window.__keywordSpeech = [];
      window.speechSynthesis.speak = (utterance) =>
        window.__keywordSpeech.push(utterance.text);
    },
    "/@fs" + process.cwd() + "/packages/audio/src/audioStore.ts",
  );
  await card.getByRole("button", { name: /^Read aloud/ }).click();
  await page.waitForFunction(() => window.__keywordSpeech.length > 0);
  assert.deepEqual(await page.evaluate(() => window.__keywordSpeech), [
    "Crater rim. The raised edge of a large bowl-shaped hole in the ground.",
  ]);
  checks.push("Read aloud speaks only the title and short explanation");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 844, height: 390 });
  await page.getByRole("button", { name: "Pause menu", exact: true }).click();
  await page
    .getByRole("button", { name: "Open space keywords", exact: true })
    .click();
  await dialog(page).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(
    await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    ),
    "Pause menu",
  );
  checks.push(
    "Mobile menu keeps its existing Keywords entry and restores focus",
  );
  await context.close();
  for (const [step, names] of [
    ["lunar-descent", ["Descent", "Braking burn", "Throttle"]],
    [
      "rock-science",
      ["Plagioclase", "XRF · Element scanner", "XRD · Crystal lab"],
    ],
    [
      "ice-science",
      ["Hydrogen", "Hydroxyl", "NSS · Neutron Spectrometer System"],
    ],
  ]) {
    const scene = await enter(step);
    await scene.page
      .getByRole("button", { name: "Open space keywords", exact: true })
      .click();
    for (const name of names)
      assert.ok(
        await dialog(scene.page)
          .getByRole("heading", { name, exact: true })
          .count(),
        name,
      );
    assert.equal(
      await scene.page.locator("button button, a button").count(),
      0,
    );
    await scene.context.close();
    checks.push(`${step} context and no nested interactive help`);
  }
  const inline = await enter("site");
  await inline.page
    .getByRole("button", { name: "Explain Crater rim", exact: true })
    .first()
    .click();
  card = dialog(inline.page).getByRole("article", {
    name: "Crater rim",
    exact: true,
  });
  await card.waitFor();
  assert.equal(
    await card.locator("p").innerText(),
    "The raised edge of a large bowl-shaped hole in the ground.",
  );
  await inline.page.route("https://www.youtube.com/iframe_api", (route) =>
    route.abort(),
  );
  await card.getByRole("button", { name: "Next media", exact: true }).click();
  await card.getByRole("button", { name: /^Play video/ }).click();
  const fallback = card.locator(".keyword-video > a");
  await fallback.waitFor({ timeout: 20000 });
  assert.match(await fallback.getAttribute("href"), /youtu\.be\/2iSZMv64wuU/);
  assert.equal(await card.locator("iframe").count(), 0);
  await inline.page.route("**/clps-nova-d-1.png*", (route) => route.abort());
  card = await openWord(inline.page, "Rocket", "Lander");
  await inline.page.waitForFunction(
    () => !document.querySelector('.keyword-card[aria-label="Lander"] figure'),
  );
  assert.equal(await card.locator("p").count(), 1);
  await inline.context.close();
  checks.push(
    "Inline help uses the shared card; blocked video provides its supplied link; broken image leaves no frame",
  );
  assert.deepEqual(errors, []);
  writeFileSync(
    `${output}/results.json`,
    JSON.stringify({ checks, errors }, null, 2),
  );
  console.log(checks.join("\n"));
} finally {
  await browser.close();
}
