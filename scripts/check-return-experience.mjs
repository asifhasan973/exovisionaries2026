import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const require = createRequire(
  new URL("../apps/web/package.json", import.meta.url),
);
const { createServer } = await import(pathToFileURL(require.resolve("vite")));
const server = await createServer({
  configFile: "apps/web/vite.config.ts",
  root: "apps/web",
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const load = (path) => server.ssrLoadModule("/src/game/moon/" + path);
  const { createReturnDemo } = await load("flight/journey/journeyDemo.ts");
  const { reduceMission } = await load("workshop/lander/workshopSession.ts");
  const { trackMilestoneTransition } = await load("core/missionMilestones.ts");
  const { nextReturnAction } = await load(
    "shared/expedition/moonExpedition.ts",
  );
  const { completedMission } = await load("return/debrief/missionReport.ts");
  let session = createReturnDemo("female");
  for (let i = 0; i < 1500 && !completedMission(session); i++) {
    const r = session.moon.returnFlight;
    const action = r.stage === "entry-ready" ? "shield" : nextReturnAction(r);
    session = reduceMission(
      session,
      action
        ? { type: "return-action", action }
        : { type: "return-tick", seconds: 0.25 },
    );
  }
  assert.ok(completedMission(session));
  session = reduceMission(session, { type: "return-pause" });
  const { writeSelectionSession, FULL_MOON_SAVE_KEY } = await load(
    "crew/selectionSession.ts",
  );
  const saveFixture = (state, name) => {
    const storage = new Map();
    writeSelectionSession(
      {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      },
      state.progress,
      false,
      state.preparation,
      state.readiness,
      state.flight,
      state.moon,
      state.repair,
    );
    writeFileSync(`/tmp/${name}.json`, storage.get(FULL_MOON_SAVE_KEY));
  };
  saveFixture(session, "moon-return-splashdown-save");
  const completed = trackMilestoneTransition(
    session,
    reduceMission(session, { type: "next" }),
  );
  assert.equal(completed.progress.stepId, "mission-debrief");
  saveFixture(completed, "moon-report-completed-save");
  assert.equal(
    completed.progress.milestones?.pending,
    undefined,
    "recovery opens report directly",
  );
  assert.ok(
    completed.progress.milestones?.celebrated.includes("home"),
    "final milestone remains credited",
  );
  assert.equal(
    completed.moon.returnFlight.elapsedSeconds,
    session.moon.returnFlight.elapsedSeconds,
  );
  const { returnPresentation } = await load("return/returnPresentation.ts");
  assert.equal(
    returnPresentation(session.moon.returnFlight, true).primaryLabel,
    "View mission report",
    "completed paused save never asks to resume",
  );
  const challenge = {
    ...session.moon.returnFlight,
    stage: "rendezvous",
    paused: false,
    mode: "challenge",
    closingMS: 1.2,
    alignment: 0.6,
  };
  assert.equal(returnPresentation(challenge, false).primaryAction, "dock");
  assert.equal(
    returnPresentation(challenge, false).primaryDisabled,
    true,
    "challenge footer cannot silently align or brake",
  );
  const retry = reduceMission(completed, { type: "return-new-attempt" });
  assert.deepEqual(retry.moon.crew, completed.moon.crew);
  assert.deepEqual(retry.preparation, completed.preparation);
  assert.equal(completedMission(retry), false);
  console.log(
    "Passed: direct report transition, final milestone credit, paused recovery action, challenge docking gate, blueprint retry scope.",
  );
} finally {
  await server.close();
}
