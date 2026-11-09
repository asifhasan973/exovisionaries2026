import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
const { chromium } = await import(
  process.env.SIGNAL_PLAYWRIGHT_MODULE ?? "playwright"
);
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: ["--enable-unsafe-swiftshader"],
});
const base =
  process.env.SIGNAL_LAB_URL ?? "http://127.0.0.1:5175/?explore=signal";
const report = {
  date: "2026-11-09",
  browser: "Headless Chromium with software WebGL",
  checks: [],
  layouts: [],
  pageErrors: [],
};
const ready = async (p) => {
  await p.goto(base);
  await p
    .getByRole("button", { name: "Check direct path", exact: true })
    .waitFor();
  await p.waitForFunction(async () => {
    const u = performance
      .getEntriesByType("resource")
      .map((e) => e.name)
      .find((n) => n.includes("/packages/ui/src/state/loadingStore.ts"));
    return u && !(await import(u)).useLoadingStore.getState().isLoading;
  });
};
const step = (p, n) =>
  p
    .getByRole("navigation", { name: "Learning steps" })
    .getByRole("button")
    .nth(n - 1)
    .click();
const open = (p) =>
  p.getByRole("button", { name: "Engineering details", exact: true }).click();
const close = (p) =>
  p.getByRole("button", { name: "Done", exact: true }).click();
const setTime = (p, t) =>
  p.locator(".signal-engineering-panel input[type=range]").evaluate((e, t) => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(e, String(t));
    e.dispatchEvent(new Event("input", { bubbles: true }));
  }, t);
const time = (p) =>
  p.locator(".signal-engineering-panel input[type=range]").inputValue();
const chosen = (p, site, relay) =>
  Promise.all([
    p
      .getByRole("combobox", { name: "Moon location", exact: true })
      .inputValue(),
    p
      .getByRole("combobox", { name: "Reference satellite", exact: true })
      .inputValue(),
  ]).then((v) => assert.deepEqual(v, [site, String(relay)]));
try {
  const p = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  p.on("pageerror", (e) => report.pageErrors.push(String(e)));
  await ready(p);
  await p.evaluate(async () => {
    const resources = performance
        .getEntriesByType("resource")
        .map((e) => e.name),
      T = await import(resources.find((n) => /\/three\.js/.test(n)));
    window.signalThree = T;
    T.Scene.prototype.onBeforeRender = function (r, s, c) {
      window.signalScene = s;
      window.signalRenderer = r;
      window.signalCamera = c;
    };
    window.signalLifecycle = (
      await import(
        resources.find((n) =>
          n.includes("/packages/ui/src/state/orientationLifecycleStore.ts"),
        )
      )
    ).useOrientationLifecycleStore;
    window.signalCanvas = document.querySelector(".lunar-canvas canvas");
    window.signalData = await (
      await import("/src/features/exploration/signalScenario.ts")
    ).loadSignalScenario();
    window.signalGeometry =
      await import("/src/features/exploration/signalGeometry.ts");
    window.signalScenario =
      await import("/src/features/exploration/signalScenario.ts");
  });
  for (const n of [1, 2, 3]) {
    await step(p, n);
    await open(p);
    assert.ok(await p.locator(".lunar-canvas canvas").isVisible());
    assert.equal(await p.locator("dialog[open]").count(), 0);
    assert.ok(
      await p
        .getByText("Changes appear immediately", { exact: true })
        .isVisible(),
    );
    await p
      .getByRole("combobox", { name: "Moon location", exact: true })
      .selectOption(n === 2 ? "far" : "near");
    await p
      .getByRole("combobox", { name: "Reference satellite", exact: true })
      .selectOption(String(n - 1));
    await setTime(p, n * 1200);
    await p.waitForFunction(
      () =>
        window.signalScene?.children.filter((o) => o.isGroup && o.visible)
          .length === 1,
    );
    const live = await p.evaluate(() => {
      const site = window.signalGeometry.STUDY_SITES.find(
          (s) =>
            s.id ===
            document.querySelector('[aria-label="Moon location"]').value,
        ),
        relay = +document.querySelector('[aria-label="Reference satellite"]')
          .value,
        t = +document.querySelector("input[type=range]").value;
      const g = window.signalGeometry.geometryAt(
          window.signalData,
          t,
          site,
          relay,
        ),
        r = window.signalData.manifest.radius;
      const actual = window.signalScene.children.filter(
        (o) => o.isGroup && o.visible,
      )[0].position;
      return {
        error: Math.hypot(
          actual.x - g.relay[0] / r,
          actual.y - g.relay[2] / r,
          actual.z + g.relay[1] / r,
        ),
        paths: window.signalScene.children.filter(
          (o) => o.isLine && o.material.isLineDashedMaterial && o.visible,
        ).length,
        canvasSame:
          window.signalCanvas ===
          document.querySelector(".lunar-canvas canvas"),
        direct: g.direct,
      };
    });
    assert.ok(live.error < 1e-8);
    assert.equal(live.paths, 3);
    assert.equal(live.canvasSame, true);
    assert.match(
      await p.locator(".signal-path-status").innerText(),
      live.direct
        ? /Direct to Earth: Clear/
        : /Direct to Earth: Moon blocks path/,
    );
    await close(p);
    assert.equal(
      await p.locator(".lunar-workspace").getAttribute("data-step"),
      String(n),
    );
    assert.ok(
      await p.evaluate(() =>
        window.signalCamera.position.toArray().every(Number.isFinite),
      ),
      "Camera remains finite when Step 3 hides the scene",
    );
    assert.equal(
      await p
        .getByRole("button", { name: "Engineering details", exact: true })
        .evaluate((e) => e === document.activeElement),
      true,
    );
    await open(p);
    assert.equal(await time(p), String(n * 1200));
    assert.ok(
      await p
        .getByRole("button", { name: "Play playback", exact: true })
        .isVisible(),
    );
    await close(p);
  }
  report.checks.push(
    "All three steps show one existing renderer, selected satellite and three live paths; Done preserves edits, step and manual pause",
  );
  await open(p);
  // Every selected reference track and the Moon fit the default engineering camera at a narrow aspect.
  for (const relay of ["0", "1", "2", "3", "4"]) {
    await p
      .getByRole("combobox", { name: "Reference satellite", exact: true })
      .selectOption(relay);
    await p.waitForTimeout(50);
    const framing = await p.evaluate(() => {
      const T = window.signalThree,
        c = window.signalCamera,
        d = window.signalData,
        r = d.manifest.radius,
        relay = +document.querySelector('[aria-label="Reference satellite"]')
          .value;
      let max = 0;
      for (let t = 0; t <= d.manifest.duration; t += 600) {
        const a = window.signalScenario.bodyAt(d, t, relay),
          v = new T.Vector3(a[0] / r, a[2] / r, -a[1] / r).project(c);
        max = Math.max(max, Math.abs(v.x), Math.abs(v.y));
      }
      return max;
    });
    assert.ok(
      framing < 0.85,
      `Full SV-${Number(relay) + 1} track exceeds camera margin: ${framing}`,
    );
  }
  // Keyboard focus can leave the panel and reach the still-interactive scene.
  await p
    .getByRole("button", { name: "Close engineering details", exact: true })
    .focus();
  await p.keyboard.press("Shift+Tab");
  assert.ok(
    await p
      .locator(".lunar-stage")
      .evaluate((e) => e.contains(document.activeElement)),
  );
  const beforeDrag = await p.evaluate(() =>
    window.signalCamera.position.toArray(),
  );
  const box = await p.locator(".lunar-canvas canvas").boundingBox();
  await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.55);
  await p.mouse.down();
  await p.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, {
    steps: 5,
  });
  await p.mouse.up();
  assert.notDeepEqual(
    await p.evaluate(() => window.signalCamera.position.toArray()),
    beforeDrag,
  );
  await p.mouse.wheel(0, 100);
  await p.keyboard.press("Escape");
  assert.equal(await p.locator(".signal-engineering-panel").count(), 0);
  assert.equal(
    await p
      .getByRole("button", { name: "Engineering details", exact: true })
      .evaluate((e) => e === document.activeElement),
    true,
  );
  report.checks.push(
    "Whole reference tracks fit; scene pointer rotation/zoom, keyboard movement outside panel and Escape focus return",
  );
  await open(p);
  await p
    .getByRole("combobox", { name: "Reference satellite", exact: true })
    .selectOption("3");
  await setTime(p, 5000);
  await close(p);
  await step(p, 3);
  const picker = async () => {
    await p
      .getByRole("button", { name: "Try another Moon location", exact: true })
      .click();
    await p.getByRole("dialog", { name: "Choose a Moon location" }).waitFor();
  };
  await picker();
  assert.ok(
    await p.getByRole("dialog", { name: "Choose a Moon location" }).isVisible(),
  );
  assert.equal(await p.locator(".signal-location-card").count(), 5);
  assert.equal(
    await p.locator(".signal-location-card[aria-current=location]").count(),
    1,
  );
  await p.keyboard.press("Shift+Tab");
  await p.keyboard.press("Tab");
  assert.ok(
    await p
      .locator(".signal-location-picker")
      .evaluate((e) => e.contains(document.activeElement)),
  );
  await p
    .getByRole("button", { name: "Engineering details", exact: true })
    .focus();
  assert.ok(
    await p
      .locator(".signal-location-picker")
      .evaluate((e) => e.contains(document.activeElement)),
  );
  await p.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(
    await p.locator(".lunar-workspace").getAttribute("data-step"),
    "3",
  );
  assert.equal(
    await p
      .getByRole("button", { name: "Try another Moon location", exact: true })
      .evaluate((e) => e === document.activeElement),
    true,
  );
  await picker();
  await p
    .getByRole("button", { name: "Close location picker", exact: true })
    .click();
  await picker();
  await p.keyboard.press("Escape");
  await open(p);
  await chosen(p, "near", 3);
  assert.equal(await time(p), "5000");
  await close(p);
  await picker();
  await p
    .locator(".signal-location-picker")
    .click({ position: { x: 10, y: 200 } });
  assert.ok(await p.locator(".signal-location-picker").evaluate((e) => e.open));
  await p.getByRole("button", { name: /Far-side reference/ }).focus();
  await p.keyboard.press("Enter");
  await p
    .getByRole("button", { name: "Check direct path", exact: true })
    .waitFor();
  assert.equal(
    await p.locator(".lunar-workspace").getAttribute("data-step"),
    "1",
  );
  assert.match(
    await p.locator(".signal-instruction").innerText(),
    /Far-side reference/,
  );
  assert.match(
    await p.locator(".signal-verdict").innerText(),
    /Will the Moon block/,
  );
  await p
    .getByRole("button", { name: "Check direct path", exact: true })
    .click();
  assert.match(
    await p.locator(".signal-verdict").innerText(),
    /Moon blocks the direct path/,
  );
  await open(p);
  await chosen(p, "far", 3);
  assert.equal(await time(p), "5000");
  assert.ok(
    await p
      .getByRole("button", { name: "Play playback", exact: true })
      .isVisible(),
  );
  await close(p);
  report.checks.push(
    "Native full-viewport picker has five study coordinates, current badge, keyboard activation/trap, Cancel/close/Escape focus return, no background dismissal; selection resets Step 1 and preserves satellite/time",
  );
  // Check all responsive tiers, panel footer bounds, all picker cards and document scroll.
  for (const [width, height] of [
    [667, 375],
    [1024, 600],
    [1440, 900],
    [2560, 1080],
  ]) {
    await p.setViewportSize({ width, height });
    await step(p, 3);
    await open(p);
    const bounds = await p.evaluate(() => {
      const box = (e) => {
        const r = e.getBoundingClientRect();
        return {
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          right: r.right,
          bottom: r.bottom,
        };
      };
      return {
        scene: box(document.querySelector(".lunar-stage")),
        panel: box(document.querySelector(".signal-engineering-panel")),
        done: box(
          document.querySelector(".signal-engineering-panel>footer button"),
        ),
        scroll: [
          document.documentElement.scrollWidth,
          document.documentElement.scrollHeight,
        ],
        canvasSame:
          window.signalCanvas ===
          document.querySelector(".lunar-canvas canvas"),
      };
    });
    assert.ok(bounds.scene.right <= bounds.panel.x);
    assert.ok(bounds.done.bottom <= height && bounds.done.y >= bounds.panel.y);
    assert.ok(
      Math.abs(
        bounds.panel.width -
          (height <= 450 ? 300 : Math.min(420, Math.max(300, width * 0.32))),
      ) < 1,
    );
    assert.deepEqual(bounds.scroll, [width, height]);
    assert.equal(bounds.canvasSame, true);
    if (process.env.SIGNAL_UI_SCREENSHOTS)
      await p.screenshot({
        path: `${process.env.SIGNAL_UI_SCREENSHOTS}/signal-panel-${width}.png`,
      });
    await close(p);
    await picker();
    if (process.env.SIGNAL_UI_SCREENSHOTS)
      await p.screenshot({
        path: `${process.env.SIGNAL_UI_SCREENSHOTS}/signal-picker-${width}.png`,
      });
    const modal = await p.locator(".signal-location-picker").boundingBox();
    assert.deepEqual(
      [modal.x, modal.y, modal.width, modal.height],
      [0, 0, width, height],
    );
    for (const card of await p.locator(".signal-location-card").all()) {
      await card.scrollIntoViewIfNeeded();
      const b = await card.boundingBox(),
        footer = await p
          .locator(".signal-location-picker>footer")
          .boundingBox();
      assert.ok(b.y >= 0 && b.y + b.height <= footer.y + 1);
      assert.ok(
        await card.evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
        "Location card must contain its full description",
      );
    }
    assert.ok(
      await p.getByRole("button", { name: "Cancel", exact: true }).isVisible(),
    );
    await p.getByRole("button", { name: "Cancel", exact: true }).click();
    report.layouts.push({ size: [width, height], ...bounds });
  }
  report.checks.push(
    "667×375, 1024×600, 1440×900, 2560×1080: separate scene/panel bounds, persistent Done, full picker and all cards reachable, no document scroll",
  );
  await p.setViewportSize({ width: 1440, height: 900 });
  await open(p);
  await setTime(p, 1000);
  await p.getByRole("button", { name: "Play playback", exact: true }).click();
  await p.waitForFunction(
    () =>
      +document.querySelector(".signal-engineering-panel input[type=range]")
        .value > 1000,
  );
  await p.evaluate(() =>
    window.signalLifecycle.getState().setOrientationBlocked(true),
  );
  const stopped = await time(p);
  await p.waitForTimeout(200);
  assert.equal(await time(p), stopped);
  await p.evaluate(() => {
    window.signalLifecycle.getState().setLoadingBlocked(true);
    window.signalLifecycle.getState().setOrientationBlocked(false);
  });
  await p.waitForTimeout(200);
  assert.equal(await time(p), stopped);
  await p.evaluate(() =>
    window.signalLifecycle.getState().setLoadingBlocked(false),
  );
  await p.waitForFunction(
    (t) =>
      +document.querySelector(".signal-engineering-panel input[type=range]")
        .value > +t,
    stopped,
  );
  await close(p);
  await open(p);
  const paused = await time(p);
  await p.waitForTimeout(200);
  assert.equal(await time(p), paused);
  await p.evaluate(() => {
    window.signalLifecycle.getState().setOrientationBlocked(true);
    window.signalLifecycle.getState().setOrientationBlocked(false);
  });
  await p.waitForTimeout(150);
  assert.equal(await time(p), paused);
  const memory = await p.evaluate(() => ({
    ...window.signalRenderer.info.memory,
  }));
  const entries = await p.evaluate(
    () =>
      performance
        .getEntriesByType("resource")
        .filter((e) => /moon.webp|states.bin|manifest.json/.test(e.name))
        .length,
  );
  for (let i = 0; i < 8; i++) {
    await close(p);
    await open(p);
  }
  await p.waitForTimeout(100);
  assert.deepEqual(
    await p.evaluate(() => ({ ...window.signalRenderer.info.memory })),
    memory,
  );
  assert.equal(
    await p.evaluate(
      () =>
        performance
          .getEntriesByType("resource")
          .filter((e) => /moon.webp|states.bin|manifest.json/.test(e.name))
          .length,
    ),
    entries,
  );
  assert.equal(await p.locator(".lunar-canvas canvas").count(), 1);
  assert.equal(
    await p
      .locator(".signal-engineering-panel")
      .evaluate((e) => getComputedStyle(e).animationName),
    "none",
  );
  report.checks.push(
    "Overlapping orientation/loading freeze, manual pause persistence, reduced motion, eight open/close cycles keep one canvas and stable GPU memory/asset requests",
  );
  // Rapid selection must show the pending selection, never previous totals.
  await p
    .getByRole("combobox", { name: "Moon location", exact: true })
    .selectOption("shackleton");
  await p
    .getByRole("combobox", { name: "Moon location", exact: true })
    .selectOption("malapert");
  await p
    .getByRole("combobox", { name: "Moon location", exact: true })
    .selectOption("near");
  await close(p);
  await step(p, 3);
  await p.waitForFunction(
    () =>
      document.querySelector("[data-route=direct] dd")?.textContent ===
      "72 h 0 min",
  );
  assert.match(
    await p.locator(".signal-comparison-intro").innerText(),
    /Near-side reference/,
  );
  await open(p);
  await p
    .getByRole("combobox", { name: "Moon location", exact: true })
    .selectOption("far");
  assert.ok(
    await p
      .getByText("Calculating 3 days for Far-side reference…", { exact: true })
      .isVisible(),
  );
  assert.equal(await p.locator(".signal-engineering-timeline").count(), 0);
  await close(p);
  await p
    .getByRole("button", { name: "Methods & credits", exact: true })
    .click();
  const methods = await p
    .getByRole("dialog", { name: "NASA sources & methods" })
    .boundingBox();
  assert.ok(methods.width < 1440 && methods.height < 900);
  await p.keyboard.press("Escape");
  assert.equal(
    await p
      .getByRole("button", { name: "Methods & credits", exact: true })
      .evaluate((e) => e === document.activeElement),
    true,
  );
  // A failed analysis is retryable for the selected site and cannot expose old totals.
  await p.evaluate(() => {
    const Native = window.Worker;
    window.Worker = class extends Native {
      constructor(...args) {
        super(...args);
        window.signalFailWorker = this;
      }
    };
  });
  await open(p);
  await p
    .getByRole("combobox", { name: "Moon location", exact: true })
    .selectOption("cabeus");
  await p.evaluate(() =>
    window.signalFailWorker.dispatchEvent(new ErrorEvent("error")),
  );
  await p
    .getByRole("button", { name: "Retry calculation", exact: true })
    .waitFor();
  assert.equal(await p.locator(".signal-engineering-timeline").count(), 0);
  await p
    .getByRole("button", { name: "Retry calculation", exact: true })
    .click();
  await p.locator(".signal-engineering-timeline").waitFor();
  await close(p);
  report.checks.push(
    "Rapid selection and pending/error analysis hide stale totals; retry recovers selected analysis; Methods dialog styling and focus return",
  );
  await p.getByRole("button", { name: "Start over", exact: true }).click();
  assert.equal(
    await p.locator(".lunar-workspace").getAttribute("data-step"),
    "1",
  );
  await open(p);
  await chosen(p, "shackleton", 1);
  assert.equal(await time(p), "0");
  assert.equal(
    await p
      .getByRole("combobox", { name: "Playback speed", exact: true })
      .inputValue(),
    "600",
  );
  await close(p);
  const fallback = await browser.newPage({
    viewport: { width: 667, height: 375 },
    reducedMotion: "reduce",
  });
  fallback.on("pageerror", (e) => report.pageErrors.push(String(e)));
  await fallback.route("**/moon.webp", (r) => r.abort());
  await ready(fallback);
  await step(fallback, 3);
  await open(fallback);
  await fallback
    .getByRole("heading", { name: "2D geometry view", exact: true })
    .waitFor();
  await fallback
    .getByRole("combobox", { name: "Moon location", exact: true })
    .selectOption("near");
  assert.match(
    await fallback.locator(".lunar-fallback").innerText(),
    /Direct to Earth: clear/,
  );
  assert.ok(
    await fallback
      .getByRole("button", { name: "Done", exact: true })
      .isVisible(),
  );
  await fallback.close();
  report.checks.push(
    "Start over restores complete defaults; WebGL fallback remains available from Step 3 and updates live",
  );
  assert.deepEqual(report.pageErrors, []);
  if (process.env.SIGNAL_UI_REPORT)
    writeFileSync(
      process.env.SIGNAL_UI_REPORT,
      JSON.stringify(report, null, 2) + "\n",
    );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
