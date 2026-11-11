import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const { chromium } = await import(
  process.env.RETURN_PLAYWRIGHT_MODULE ?? "playwright"
);
const base = process.env.RETURN_APP_URL ?? "http://127.0.0.1:5175";
const output = process.env.RETURN_UI_OUTPUT ?? ".impeccable/review/crew-return";
const saveKey = "zero_to_beyond_full_moon_v13";
const completedSave = readFileSync(
  process.env.RETURN_COMPLETED_SAVE ?? "/tmp/moon-report-completed-save.json",
  "utf8",
);
const splashdownSave = readFileSync(
  process.env.RETURN_SPLASHDOWN_SAVE ?? "/tmp/moon-return-splashdown-save.json",
  "utf8",
);
const viewports = [
  [667, 375],
  [1024, 600],
  [1196, 588],
  [1440, 900],
  [2560, 1080],
];
const evidence = { checks: [], layouts: [], failures: [], pageErrors: [] };
const phase = process.env.RETURN_UI_PHASE ?? "all";
const runReturn = phase === "all";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: ["--enable-unsafe-swiftshader"],
});

async function context(save, extra = {}) {
  const c = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    ...extra,
  });
  await c.addInitScript(
    ({ save, saveKey }) => {
      sessionStorage.setItem("exovisionaries_splash_session", "true");
      if (save && !localStorage.getItem(saveKey))
        localStorage.setItem(saveKey, save);
    },
    { save, saveKey },
  );
  const p = await c.newPage();
  p.on("pageerror", (error) => evidence.pageErrors.push(String(error)));
  return [c, p];
}
async function ready(p) {
  await p.waitForFunction(async () => {
    const url = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .find((name) => name.includes("/packages/ui/src/state/loadingStore.ts"));
    return url && !(await import(url)).useLoadingStore.getState().isLoading;
  });
  await p.locator(".loading-screen-root").waitFor({ state: "hidden" });
  await p.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((image) => image.decode().catch(() => {})),
    );
  });
  await p.waitForTimeout(250);
}
const primary = (p) => p.locator(".return-footer [data-primary-action]");
async function stage(p, name) {
  await p.locator(`[data-return-stage="${name}"]`).waitFor();
  await ready(p);
}
async function screenshot(p, name) {
  await p.screenshot({ path: `${output}/${name}.png` });
}
function check(condition, message) {
  if (!condition) evidence.failures.push(message);
}
async function layout(p, name, kind = "return") {
  const bounds = await p.evaluate((kind) => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return {
        x: r.x,
        y: r.y,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      };
    };
    const briefing = document.querySelector(".return-briefing");
    return {
      viewport: [innerWidth, innerHeight],
      scroll: [
        document.documentElement.scrollWidth,
        document.documentElement.scrollHeight,
      ],
      scene: rect(".return-scene-column"),
      rail: rect(".return-rail-column"),
      footer: rect(
        kind === "return" ? ".return-footer" : ".moon-report-footer",
      ),
      content: rect(".moon-report-content"),
      briefing: rect(".return-briefing"),
      primaryAction: rect(".return-footer [data-primary-action]"),
      replay: rect(".return-briefing .conversation-icon"),
      flightNotes: rect(".return-heading > button"),
      notesTouchTarget: (() => {
        const notes = document.querySelector(".return-heading > button");
        if (!notes) return null;
        const r = notes.getBoundingClientRect();
        const top = document.elementFromPoint(
          r.x + r.width / 2,
          r.y + r.height / 2,
        );
        return {
          reachable: notes.contains(top),
          coveredByDebug: !!top?.closest(".debug-toolbar-container"),
          coveringLabel: top?.closest("button")?.getAttribute("aria-label"),
        };
      })(),
      briefingOverflow: briefing
        ? briefing.scrollHeight > briefing.clientHeight + 1
        : false,
      primaryCount: document.querySelectorAll("[data-primary-action]").length,
    };
  }, kind);
  evidence.layouts.push({ name, ...bounds });
  const [width, height] = bounds.viewport;
  const label = `${name} ${width}×${height}`;
  check(
    bounds.scroll[0] <= width && bounds.scroll[1] <= height,
    `${label}: document scroll`,
  );
  check(
    bounds.footer &&
      bounds.footer.y >= 0 &&
      bounds.footer.bottom <= height + 1 &&
      bounds.footer.height > 0,
    `${label}: footer outside viewport`,
  );
  if (kind === "return") {
    check(
      bounds.scene &&
        bounds.rail &&
        bounds.scene.right <= bounds.rail.x + 1 &&
        bounds.scene.height > 60,
      `${label}: scene / rail overlap or crushed scene`,
    );
    check(!bounds.briefingOverflow, `${label}: briefing clipped`);
    if (width === 667) {
      check(
        bounds.primaryAction?.height >= 42,
        `${label}: primary action below 42px`,
      );
      check(bounds.replay?.height >= 42, `${label}: replay action below 42px`);
      check(
        bounds.flightNotes?.height >= 42,
        `${label}: Flight notes below 42px`,
      );
      check(
        bounds.notesTouchTarget?.reachable ||
          bounds.notesTouchTarget?.coveredByDebug,
        `${label}: Flight notes covered by another game control`,
      );
    }
    check(bounds.primaryCount === 1, `${label}: duplicate / missing primary`);
  } else {
    check(
      bounds.content?.width > 200 && bounds.content.height > 65,
      `${label}: report content too small`,
    );
  }
}
async function sizePass(p, name, kind = "return") {
  for (const [width, height] of viewports) {
    await p.setViewportSize({ width, height });
    await p.waitForTimeout(400);
    await layout(p, name, kind);
    if (width === 667) await screenshot(p, `${name}-compact`);
  }
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.waitForTimeout(400);
  await screenshot(p, name);
}
const stored = (p) => p.evaluate((key) => localStorage.getItem(key), saveKey);
async function freeze(p, blocked) {
  await p.evaluate(async (blocked) => {
    const url = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .find((name) =>
        name.includes("/packages/ui/src/state/orientationLifecycleStore.ts"),
      );
    (await import(url)).useOrientationLifecycleStore
      .getState()
      .setLoadingBlocked(blocked);
  }, blocked);
}

try {
  if (runReturn) {
    // Debug is a legitimate seeded mission. Every subsequent transition uses UI actions.
    const [debug, p] = await context();
    await p.goto(`${base}/#/debug/step/crew-return`);
    await stage(p, "ready");
    await sizePass(p, "readiness");
    await p.getByRole("button", { name: "Flight notes", exact: true }).click();
    await p.getByRole("dialog").filter({ hasText: "Crew return" }).waitFor();
    await p.keyboard.press("Escape");
    check(
      await p
        .getByRole("button", { name: "Flight notes", exact: true })
        .evaluate((element) => document.activeElement === element),
      "Flight notes Escape does not restore trigger focus",
    );
    check(
      (await primary(p).innerText()).includes("Resume"),
      "Notes lost manual pause",
    );
    await primary(p).click();
    await primary(p).click();
    await stage(p, "ascending");
    await primary(p).click();
    const progress = await p.getByRole("progressbar").getAttribute("value");
    await p.waitForTimeout(400);
    assert.equal(
      await p.getByRole("progressbar").getAttribute("value"),
      progress,
    );
    await screenshot(p, "ascent");
    await freeze(p, true);
    await primary(p).click();
    await p.waitForTimeout(300);
    assert.equal(
      await p.getByRole("progressbar").getAttribute("value"),
      progress,
    );
    await freeze(p, false);
    check(
      (await primary(p).innerText()).includes("Resume"),
      "Freeze resumed manual pause",
    );
    await primary(p).click();
    await stage(p, "rendezvous");
    await sizePass(p, "docking");
    for (
      let i = 0;
      i < 10 && (await p.locator('[data-return-stage="rendezvous"]').count());
      i++
    )
      await primary(p).click();
    await stage(p, "docked");
    await screenshot(p, "docked");
    await primary(p).click();
    await stage(p, "burning");
    await screenshot(p, "earth-burn");
    await stage(p, "coast");
    await primary(p).click();
    await stage(p, "entry-ready");
    await screenshot(p, "entry-choice");
    await p.getByRole("button", { name: "Nose first", exact: true }).click();
    await p.getByRole("alert").waitFor();
    assert.equal(
      await p.locator('[data-return-stage="entry-ready"]').count(),
      1,
    );
    await p
      .getByRole("button", { name: "Heat shield first", exact: true })
      .click();
    await stage(p, "entry");
    await screenshot(p, "atmospheric-entry");
    await stage(p, "chute-ready");
    await screenshot(p, "parachutes-ready");
    await primary(p).click();
    await stage(p, "chutes");
    await screenshot(p, "parachute-descent");
    await stage(p, "splashdown");
    await sizePass(p, "recovery");
    await primary(p).click();
    await p.locator(".moon-report").waitFor();
    await ready(p);
    check(
      (await p.locator(".milestone-card").count()) === 0,
      "Completion interstitial before report",
    );
    evidence.checks.push(
      "All eleven return stages, guided docking, wrong shield correction, pause/freeze, Flight notes Escape, direct recovery-to-report",
    );
    await debug.close();
  }

  if (!["tail", "smoke", "notes"].includes(phase)) {
    // Normal saved record: completed Home/report routes must not replay or credit a flight.
    const [normal, q] = await context(completedSave);
    await q.goto(`${base}/?play=1`);
    await q.locator(".moon-report").waitFor({ timeout: 60000 });
    await ready(q);
    const baseline = JSON.parse(await stored(q));
    const sections = [
      "Overview",
      "Findings",
      "Meaning",
      "Location",
      "Engineering",
      "Next mission",
    ];
    for (const [width, height] of viewports) {
      await q.setViewportSize({ width, height });
      await q.waitForTimeout(400);
      for (const section of sections) {
        await q
          .getByRole("navigation", { name: "Report sections" })
          .getByRole("button", { name: section, exact: true })
          .click();
        if (section === "Location") await ready(q);
        await layout(q, `report-${section}`, "report");
        const heading = q.locator(".moon-report-content > h3");
        await heading.focus();
        await q.keyboard.press("Enter");
        check(
          (await heading.innerText()) === section,
          `Enter leaves report section ${section}`,
        );
      }
    }
    await q.setViewportSize({ width: 1440, height: 900 });
    await q.getByRole("button", { name: "Overview", exact: true }).click();
    await screenshot(q, "report");
    await q.setViewportSize({ width: 667, height: 375 });
    await screenshot(q, "report-compact");
    await q.setViewportSize({ width: 1440, height: 900 });
    await q
      .getByRole("button", { name: "Plan another mission", exact: true })
      .click();
    await q.getByRole("dialog").waitFor();
    await q.getByRole("button", { name: "Cancel", exact: true }).click();
    assert.deepEqual(JSON.parse(await stored(q)), baseline);
    await q.getByRole("button", { name: "Back to Home", exact: true }).click();
    await q.locator(".home-completed-summary").waitFor();
    await ready(q);
    await screenshot(q, "completed-home");
    await q.setViewportSize({ width: 667, height: 375 });
    await screenshot(q, "completed-home-compact");
    check(
      await q
        .getByRole("button", { name: "View mission report", exact: true })
        .isVisible(),
      "Completed Home primary missing",
    );
    await q.setViewportSize({ width: 1440, height: 900 });
    await q.getByRole("button", { name: "New mission", exact: true }).click();
    await q.getByRole("dialog", { name: "Start a new mission?" }).waitFor();
    await q.getByRole("button", { name: "Keep playing", exact: true }).click();
    assert.deepEqual(JSON.parse(await stored(q)), baseline);
    await q
      .getByRole("button", { name: "View mission report", exact: true })
      .click();
    await q.locator(".moon-report").waitFor();
    await ready(q);
    check(
      (await q.locator(".milestone-card").count()) === 0,
      "Home report shows completion interstitial",
    );
    const after = JSON.parse(await stored(q));
    assert.deepEqual(
      after.moon.returnFlight.commands,
      baseline.moon.returnFlight.commands,
    );
    assert.deepEqual(after.moon.science, baseline.moon.science);
    evidence.checks.push(
      "Six report sections at five sizes, section heading Enter, normal completed ?play entry, retry/reset cancellation, Home report reopen without replay",
    );
    await normal.close();
  }

  const [compact, c] = await context(undefined, {
    viewport: { width: 667, height: 375 },
  });
  await c.goto(`${base}/#/debug/step/crew-return`);
  await stage(c, "ready");
  await layout(c, "readiness-final");
  const brief = await c.locator(".return-briefing").evaluate((element) => ({
    text: element.innerText,
    height: element.clientHeight,
    scrollHeight: element.scrollHeight,
    engineerHeight: element.querySelector(".workshop-engineer").clientHeight,
    engineerMaxHeight: getComputedStyle(
      element.querySelector(".workshop-engineer"),
    ).maxHeight,
  }));
  check(
    brief.scrollHeight <= brief.height + 1,
    "Final compact readiness briefing clipped",
  );
  evidence.checks.push({ compactReadinessBriefing: brief });
  await c.locator(".gesture-demo").waitFor({ state: "hidden", timeout: 5000 });
  await screenshot(c, "readiness-compact");
  await c.getByRole("button", { name: "Flight notes", exact: true }).focus();
  await c.keyboard.press("Enter");
  await c.getByRole("dialog").filter({ hasText: "Crew return" }).waitFor();
  await c.keyboard.press("Escape");
  evidence.checks.push("Compact Flight notes keyboard activation and Escape");
  await compact.close();

  if (!["smoke", "notes"].includes(phase)) {
    const [restored, s] = await context(splashdownSave);
    await s.goto(`${base}/?play=1`);
    await s.locator(".moon-report").waitFor();
    await ready(s);
    assert.equal(
      await s
        .getByRole("button", { name: "Resume flight", exact: true })
        .count(),
      0,
    );
    evidence.checks.push(
      "Restored paused splashdown opens report directly without Resume flight",
    );
    await restored.close();

    const incomplete = JSON.parse(splashdownSave);
    incomplete.stepId = "crew-return";
    incomplete.moon.returnFlight.commands = [];
    incomplete.moon.returnFlight.paused = true;
    incomplete.completedActivities = incomplete.completedActivities.filter(
      (id) => !["crew-return", "mission-debrief"].includes(id),
    );
    incomplete.milestones = { introduced: true, celebrated: [] };
    const [unfinished, u] = await context(JSON.stringify(incomplete));
    await u.goto(base);
    await u.getByRole("button", { name: "Resume", exact: true }).waitFor();
    await ready(u);
    assert.equal(await u.locator(".home-completed-summary").count(), 0);
    await u.getByRole("button", { name: "Resume", exact: true }).click();
    await ready(u);
    if (await u.locator(".milestone-page").count())
      await u
        .getByRole("button", { name: "Keep playing", exact: true })
        .click();
    await u.locator('[data-return-stage="ready"]').waitFor();
    evidence.checks.push(
      "Incomplete saved mission retains Resume and has no completed summary",
    );
    await unfinished.close();

    const coast = JSON.parse(splashdownSave);
    coast.stepId = "crew-return";
    coast.moon.returnFlight.commands = coast.moon.returnFlight.commands.slice(
      0,
      10,
    );
    coast.moon.returnFlight.paused = true;
    coast.completedActivities = incomplete.completedActivities;
    coast.milestones = incomplete.milestones;
    const [coasting, o] = await context(JSON.stringify(coast));
    await o.goto(`${base}/?play=1`);
    await o.locator(".milestone-page").waitFor();
    await ready(o);
    await o.getByRole("button", { name: "Keep playing", exact: true }).click();
    await stage(o, "coast");
    await primary(o).click();
    await o.getByRole("button", { name: "Pause flight", exact: true }).click();
    const coastProgress = await o
      .getByRole("progressbar")
      .getAttribute("value");
    await o.waitForTimeout(400);
    assert.equal(
      await o.getByRole("progressbar").getAttribute("value"),
      coastProgress,
    );
    assert.match(await primary(o).innerText(), /Resume/);
    await o.getByRole("button", { name: "2×", exact: true }).click();
    assert.equal(
      await o
        .getByRole("button", { name: "2×", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    evidence.checks.push(
      "Coast rail Pause freezes progress; footer Resume and supported 2× speed remain usable",
    );
    await coasting.close();
  }

  if (phase !== "notes") {
    const [fallback, f] = await context(undefined, {
      viewport: { width: 667, height: 375 },
    });
    await f.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (String(type).startsWith("webgl")) return null;
        return original.call(this, type, ...args);
      };
    });
    await f.goto(`${base}/#/debug/step/crew-return`);
    await stage(f, "ready");
    await f.locator(".return-scene .moon-flat-view").waitFor();
    assert.ok(await primary(f).isEnabled());
    await screenshot(f, "webgl-fallback-compact");
    await primary(f).click();
    await stage(f, "ascending");
    evidence.checks.push(
      "Reduced-motion browser; WebGL failure keeps status and enabled launch controls",
    );
    await fallback.close();
  }
} catch (error) {
  evidence.failures.push(error.stack ?? String(error));
} finally {
  for (const c of browser.contexts()) {
    const page = c.pages()[0];
    if (page && evidence.failures.length) {
      writeFileSync(
        `${output}/last-page.txt`,
        await page
          .locator("body")
          .innerText()
          .catch(() => "Page unavailable"),
      );
      await screenshot(page, "last-page").catch(() => {});
    }
  }
  await browser.close();
  writeFileSync(
    `${output}/evidence-${phase}.json`,
    JSON.stringify(evidence, null, 2),
  );
  writeFileSync(`${output}/evidence.json`, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}
if (evidence.failures.length || evidence.pageErrors.length)
  process.exitCode = 1;
