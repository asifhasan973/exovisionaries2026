import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const { chromium } = await import(
  process.env.REPORT_PLAYWRIGHT_MODULE ?? "playwright"
);
const base = process.env.REPORT_APP_URL ?? "http://127.0.0.1:5175";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: ["--enable-unsafe-swiftshader"],
});
const report = { checks: [], layouts: [], pageErrors: [] };
const save = readFileSync("/tmp/moon-report-completed-save.json", "utf8");
const ready = async (p) => {
  await p.waitForFunction(async () => {
    const u = performance
      .getEntriesByType("resource")
      .map((e) => e.name)
      .find((n) => n.includes("/packages/ui/src/state/loadingStore.ts"));
    return u && !(await import(u)).useLoadingStore.getState().isLoading;
  });
  await p.waitForTimeout(300);
};
mkdirSync(".impeccable/review", { recursive: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await context.addInitScript((save) => {
    sessionStorage.setItem("exovisionaries_splash_session", "true");
    if (!localStorage.getItem("zero_to_beyond_full_moon_v13"))
      localStorage.setItem("zero_to_beyond_full_moon_v13", save);
  }, save);
  const p = await context.newPage();
  p.on("pageerror", (e) => report.pageErrors.push(String(e)));
  await p.goto(base + "/?report=1");
  await p
    .getByRole("heading", { name: "Your Moon mission report", exact: true })
    .waitFor();
  await ready(p);
  const stored = await p.evaluate(() =>
    localStorage.getItem("zero_to_beyond_full_moon_v13"),
  );
  assert.equal(
    await p
      .getByRole("navigation", { name: "Main pages" })
      .getByRole("link", { name: "Moon Atlas", exact: true })
      .count(),
    0,
  );
  const section = (name) =>
    p
      .getByRole("navigation", { name: "Report sections" })
      .getByRole("button", { name, exact: true })
      .click();
  for (const [width, height] of [
    [667, 375],
    [1024, 600],
    [1196, 588],
    [1440, 900],
    [2560, 1080],
  ]) {
    await p.setViewportSize({ width, height });
    for (const name of [
      "Overview",
      "Findings",
      "Meaning",
      "Location",
      "Engineering",
      "Next mission",
    ]) {
      await section(name);
      if (name === "Location") {
        await p
          .getByRole("img", { name: /overview. Reference coordinate/ })
          .waitFor();
        await ready(p);
      }
      const bounds = await p.evaluate(() => {
        const rect = (e) => {
          const r = e.getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            right: r.right,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
          };
        };
        const c = document.querySelector(".moon-report");
        return {
          viewport: [innerWidth, innerHeight],
          scroll: [
            document.documentElement.scrollWidth,
            document.documentElement.scrollHeight,
          ],
          report: rect(c),
          content: rect(document.querySelector(".moon-report-content")),
          footer: rect(document.querySelector(".moon-report-footer")),
          sectionLinks: [
            ...document.querySelectorAll(".moon-report-sections button"),
          ].map(rect),
        };
      });
      assert.ok(
        bounds.scroll[0] <= width && bounds.scroll[1] <= height,
        JSON.stringify(bounds),
      );
      assert.ok(bounds.footer.bottom <= height + 1);
      assert.ok(bounds.content.width > 200);
      assert.ok(bounds.content.height > 65);
      report.layouts.push({ ...bounds, section: name });
      if (["Overview", "Location"].includes(name))
        await p.screenshot({
          path: `.impeccable/review/${name === "Overview" ? (width === 1440 ? "desktop" : width === 667 ? "mobile" : `user-${width}`) : `location-${width}`}.png`,
        });
    }
  }
  await p.setViewportSize({ width: 1440, height: 900 });
  await section("Location");
  await p
    .getByRole("button", { name: "Historical temperature", exact: true })
    .click();
  await p
    .getByRole("button", { name: "Temperature in Celsius", exact: true })
    .click();
  await p
    .getByRole("combobox", { name: "Reference region", exact: true })
    .selectOption("cabeus");
  assert.match(
    await p.locator(".report-reference-values").innerText(),
    /85.30/,
  );
  await p.getByRole("button", { name: "Zoom to region", exact: true }).click();
  await p.getByRole("button", { name: "Overview", exact: true }).click();
  await p.waitForFunction(
    () =>
      document.querySelector(".moon-report-content > h3") ===
      document.activeElement,
  );
  assert.equal(
    await p.evaluate(() =>
      localStorage.getItem("zero_to_beyond_full_moon_v13"),
    ),
    stored,
  );
  report.checks.push(
    "All six sections at five landscape sizes; NASA layers, units, region, zoom; focus and immutable mission save",
  );
  await section("Next mission");
  await p.getByText("Compare with a saved attempt", { exact: true }).click();
  await p
    .getByRole("button", {
      name: "Save this attempt for comparison",
      exact: true,
    })
    .click();
  assert.ok(
    await p.evaluate(
      () =>
        JSON.parse(localStorage.getItem("zero_to_beyond_mission_comparison_v1"))
          .version === 1,
    ),
  );
  assert.equal(
    await p.evaluate(() =>
      localStorage.getItem("zero_to_beyond_full_moon_v13"),
    ),
    stored,
  );
  await p.goto(base + "/?explore=atlas");
  await p
    .getByRole("button", {
      name: "Open your completed mission report",
      exact: true,
    })
    .waitFor();
  await ready(p);
  await p
    .getByRole("button", {
      name: "Open your completed mission report",
      exact: true,
    })
    .click();
  await p
    .getByRole("heading", { name: "Your Moon mission report", exact: true })
    .waitFor();
  await ready(p);
  assert.equal(
    await p.evaluate(() =>
      localStorage.getItem("zero_to_beyond_full_moon_v13"),
    ),
    stored,
  );
  report.checks.push(
    "Comparison v1 save, legacy Atlas to completed report, no mission overwrite",
  );
  await p.goto(base + "/#/debug/step/mission-debrief");
  await p.getByRole("navigation", { name: "Report sections" }).waitFor();
  await ready(p);
  assert.ok(
    await p.getByText("Preview / review record", { exact: true }).isVisible(),
  );
  await p.screenshot({ path: ".impeccable/review/debrief-live.png" });
  await section("Findings");
  await section("Location");
  await p
    .getByRole("img", { name: /overview. Reference coordinate/ })
    .waitFor();
  await ready(p);
  await p.getByRole("button", { name: "Overview", exact: true }).click();
  assert.equal(
    await p.evaluate(() =>
      localStorage.getItem("zero_to_beyond_full_moon_v13"),
    ),
    stored,
  );
  report.checks.push(
    "Debrief → overview → findings → reference → overview; preview distinguished from real recovery",
  );
  await p
    .getByRole("navigation", { name: "Report sections" })
    .getByRole("button", { name: "Engineering", exact: true })
    .focus();
  await p.keyboard.press("Enter");
  assert.equal(
    await p.locator(".moon-report-content > h3").innerText(),
    "Engineering",
  );
  await p.evaluate(async () => {
    const path = performance
      .getEntriesByType("resource")
      .map((e) => e.name)
      .find((n) =>
        n.includes("/packages/ui/src/state/orientationLifecycleStore.ts"),
      );
    window.reportLifecycle = (await import(path)).useOrientationLifecycleStore;
    window.reportLifecycle.getState().setOrientationBlocked(true);
  });
  await section("Overview");
  assert.equal(
    await p.locator(".moon-report-content > h3").innerText(),
    "Engineering",
  );
  await p.evaluate(() => {
    window.reportLifecycle.getState().setLoadingBlocked(true);
    window.reportLifecycle.getState().setOrientationBlocked(false);
  });
  await section("Overview");
  assert.equal(
    await p.locator(".moon-report-content > h3").innerText(),
    "Engineering",
  );
  await p.evaluate(() =>
    window.reportLifecycle.getState().setLoadingBlocked(false),
  );
  await section("Overview");
  report.checks.push(
    "Keyboard Enter, section focus, reduced motion and overlapping loading/orientation freeze",
  );
  const broken = await context.newPage();
  await broken.route("**/exploration/atlas.json", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await broken.goto(base + "/?report=1");
  await broken
    .getByRole("heading", { name: "Your Moon mission report", exact: true })
    .waitFor();
  await ready(broken);
  await broken
    .getByRole("navigation", { name: "Report sections" })
    .getByRole("button", { name: "Location", exact: true })
    .click();
  await broken
    .getByRole("button", { name: "Retry reference data", exact: true })
    .waitFor();
  await ready(broken);
  await broken
    .getByRole("navigation", { name: "Report sections" })
    .getByRole("button", { name: "Overview", exact: true })
    .click();
  assert.equal(
    await broken
      .getByRole("heading", {
        name: "Useful data delivered; water was not confirmed.",
        exact: true,
      })
      .isVisible(),
    true,
  );
  assert.equal(
    await broken.evaluate(() =>
      localStorage.getItem("zero_to_beyond_full_moon_v13"),
    ),
    stored,
  );
  report.checks.push(
    "NASA data failure inside a completed report leaves overview and mission save intact",
  );
  await broken.close();
  const fresh = await browser.newContext({
    viewport: { width: 1196, height: 588 },
    reducedMotion: "reduce",
  });
  await fresh.addInitScript(() =>
    sessionStorage.setItem("exovisionaries_splash_session", "true"),
  );
  const q = await fresh.newPage();
  await q.route("**/exploration/atlas.json", (r) =>
    r.fulfill({ status: 503, body: "unavailable" }),
  );
  await q.goto(base + "/?explore=atlas");
  await q
    .getByRole("button", { name: "Retry reference data", exact: true })
    .waitFor();
  await ready(q);
  assert.equal(
    await q
      .getByRole("button", {
        name: "Open your completed mission report",
        exact: true,
      })
      .count(),
    0,
  );
  await q.unroute("**/exploration/atlas.json");
  await q
    .getByRole("button", { name: "Retry reference data", exact: true })
    .click();
  await q
    .getByRole("img", { name: /overview. Reference coordinate/ })
    .waitFor();
  await ready(q);
  assert.equal(
    await q.evaluate(() =>
      localStorage.getItem("zero_to_beyond_full_moon_v13"),
    ),
    null,
  );
  await q.goto(base + "/?report=1");
  await q
    .getByRole("heading", {
      name: "No completed mission report is available",
      exact: true,
    })
    .waitFor();
  report.checks.push(
    "Missing NASA data and Retry; fresh legacy reference does not create or claim a completed save",
  );
  await p.goto(base + "/?report=1");
  await p
    .getByRole("heading", { name: "Your Moon mission report", exact: true })
    .waitFor();
  await ready(p);
  await p.evaluate(async () => {
    const resources = performance
      .getEntriesByType("resource")
      .map((e) => e.name);
    const saved = await import(
      resources.find((u) =>
        u.includes("/src/game/moon/crew/selectionSession.ts"),
      )
    );
    const workshop = await import(
      resources.find((u) =>
        u.includes("/src/game/moon/workshop/lander/workshopSession.ts"),
      )
    );
    const { MissionDebrief } = await import(
      resources.find((u) =>
        u.includes("/src/game/moon/return/debrief/MissionDebrief.tsx"),
      )
    );
    const react = await import(resources.find((u) => /\/react\.js/.test(u)));
    const client = await import(
      resources.find((u) => /react-dom_client\.js/.test(u))
    );
    const savedState = saved.readBrowserSelectionSession();
    const state = workshop.createWorkshopSession(
      savedState.progress,
      savedState.preparation,
      savedState.readiness,
      savedState.flight,
      savedState.moon,
    );
    for (const key of [
      "supportUnitsRemaining",
      "platformEnergyWh",
      "returnPropellantKg",
      "descentPropellantKg",
    ])
      state.moon.resources[key] = null;
    const host = document.createElement("div");
    host.id = "missing-balances-fixture";
    host.style.cssText =
      "position:fixed;inset:0;z-index:999999;background:#100b26;padding:16px";
    document.body.append(host);
    (client.createRoot ?? client.default.createRoot)(host).render(
      (react.createElement ?? react.default.createElement)(MissionDebrief, {
        session: state,
      }),
    );
  });
  const fixture = p.locator("#missing-balances-fixture");
  await fixture
    .getByRole("button", { name: "Engineering", exact: true })
    .click();
  await fixture
    .getByText("Complete resource accounting & design trade-offs", {
      exact: true,
    })
    .click();
  for (const name of [
    "Supplies used",
    "Cabin energy used",
    "Descent propellant used",
    "Service maneuvers propellant used",
  ])
    assert.match(
      await fixture
        .locator(".report-resource-list div")
        .filter({ hasText: name })
        .locator("dd")
        .innerText(),
      /Unavailable/,
    );
  await p.screenshot({ path: ".impeccable/review/missing-balances.png" });
  report.checks.push(
    "Rendered report fixture: missing resource balances show Unavailable, not fabricated consumption",
  );
  assert.deepEqual(report.pageErrors, []);
  writeFileSync("/tmp/mission-report-ui.json", JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        checks: report.checks,
        layouts: report.layouts.length,
        pageErrors: report.pageErrors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
