import assert from "node:assert/strict";
import { writeFileSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
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
  const load = (p) => server.ssrLoadModule("/src/game/moon/" + p);
  const demo = await load("flight/journey/journeyDemo.ts");
  const { reduceReturnMission } = await load("return/returnSession.ts");
  const { nextReturnAction } = await load(
    "shared/expedition/moonExpedition.ts",
  );
  const { returnComplete } = await load("return/return.ts");
  const { missionReport, completedMission, reportLocation } = await load(
    "return/debrief/missionReport.ts",
  );
  const { readComparison, comparisonRecord, COMPARISON_KEY } = await load(
    "return/debrief/missionDebrief.ts",
  );
  const { writeSelectionSession, readSelectionSession, FULL_MOON_SAVE_KEY } =
    await load("crew/selectionSession.ts");
  const finish = (initial) => {
    let s = initial;
    for (let i = 0; i < 1500 && !completedMission(s); i++) {
      const r = s.moon.returnFlight;
      const action = r.stage === "entry-ready" ? "shield" : nextReturnAction(r);
      s = reduceReturnMission(
        s,
        action
          ? { type: "return-action", action }
          : { type: "return-tick", seconds: 0.25 },
      );
    }
    assert.ok(
      returnComplete(s.moon.returnFlight, s.moon.designSignature),
      "reducer-driven return completes",
    );
    return { ...s, progress: { ...s.progress, stepId: "mission-debrief" } };
  };
  const ice = finish(demo.createReturnDemo("female")),
    geo = finish(demo.createGeologyReturnDemo("female"));
  for (const session of [ice, geo]) {
    const before = JSON.stringify(session),
      r = missionReport(session);
    assert.equal(r.recovered, true);
    assert.ok(r.outcome);
    assert.equal(JSON.stringify(session), before);
    assert.equal(reportLocation(session.moon.site).atlasSite, null);
    assert.ok(r.observations.every((x) => !x.receivedOnEarth || x.transmitted));
    const record = comparisonRecord(session);
    assert.deepEqual(readComparison(JSON.stringify(record)), record);
    assert.equal(record.version, 1);
  }
  const incomplete = structuredClone(ice);
  incomplete.moon.returnFlight.signature = "wrong";
  assert.equal(completedMission(incomplete), false);
  assert.equal(missionReport(incomplete).returnedCount, 0);
  assert.equal(missionReport(incomplete).debrief.card.crewRecovered, 0);
  const sampleRun = structuredClone(geo);
  sampleRun.moon.science.samples = [
    { id: "a", locationId: "lookout", depthCm: 10, massKg: 0.2, stowed: false },
    { id: "b", locationId: "edge", depthCm: 10, massKg: 0.2, stowed: true },
    { id: "b", locationId: "edge", depthCm: 10, massKg: 0.2, stowed: true },
  ];
  assert.equal(missionReport(sampleRun).samples.length, 2);
  assert.equal(missionReport(sampleRun).returnedCount, 1);
  assert.equal(missionReport(sampleRun).returnedKg, 0.2);
  assert.equal(comparisonRecord(sampleRun).samples, 1);
  const { freshRover } = await load("rover/rover.ts");
  const roverRun = structuredClone(ice);
  roverRun.moon.rover = {
    ...freshRover(roverRun.moon),
    cargo: ["A", "B"],
    deposited: ["A", "A"],
    sampleTimes: undefined,
  };
  assert.equal(missionReport(roverRun).samples.length, 2);
  assert.equal(missionReport(roverRun).returnedCount, 1);
  assert.equal(
    missionReport(roverRun).samples.find((sample) => sample.location === "B")
      .returned,
    false,
  );
  const base = {
    objective: "lunar-ice",
    locationId: "edge",
    depthCm: 20,
    confidence: "high",
    quality: "high",
    points: 2,
    transmitted: true,
    missionSeconds: 10,
  };
  const optics = {
    ...base,
    id: "optics",
    instrumentId: "nirvss",
    kind: "water-evidence",
    signal: "Water signature",
    result: "confirmed",
  };
  const gas = {
    ...base,
    id: "gas",
    instrumentId: "msolo",
    kind: "water-evidence",
    signal: "Water gas",
    result: "confirmed",
  };
  const evidence = structuredClone(ice);
  evidence.moon.science.records = [optics, gas, gas];
  let r = missionReport(evidence);
  assert.equal(r.deliveredCount, 2);
  assert.equal(r.debrief.card.deliveredSciencePoints, 4);
  assert.match(
    r.observations[0].meaning,
    /confirmation within this simulation/,
  );
  evidence.moon.science.records = [optics, { ...gas, transmitted: false }];
  r = missionReport(evidence);
  assert.match(r.observations[0].meaning, /inconclusive/);
  assert.equal(r.observations[1].receivedOnEarth, false);
  evidence.moon.science.records = [
    { ...optics, signal: "Minerals only", result: "negative" },
    { ...gas, signal: "No water gas", result: "negative" },
  ];
  assert.match(
    missionReport(evidence).observations[0].meaning,
    /do not detect water/,
  );
  evidence.moon.science.records = [
    { ...base, id: "hydrogen", instrumentId: "nss", kind: "hydrogen-clue" },
  ];
  assert.match(
    missionReport(evidence).observations[0].meaning,
    /alone does not establish/,
  );
  evidence.moon.science.records = [
    { ...optics, missionSeconds: undefined, quality: undefined },
  ];
  assert.match(missionReport(evidence).observations[0].meaning, /older record/);
  const geology = structuredClone(geo);
  geology.moon.science.records = [
    {
      ...base,
      objective: "lunar-geology",
      id: "rock",
      instrumentId: "visnir",
      kind: "mineral-evidence",
      classification: "inconclusive",
    },
  ];
  assert.match(
    missionReport(geology).observations[0].meaning,
    /does not support/,
  );
  geology.moon.science.records[0].classification = "basalt";
  assert.match(
    missionReport(geology).observations[0].meaning,
    /simulated basalt/,
  );
  const missingBalances = structuredClone(ice);
  for (const key of [
    "supportUnitsRemaining",
    "platformEnergyWh",
    "returnPropellantKg",
    "descentPropellantKg",
  ])
    missingBalances.moon.resources[key] = null;
  const missingResources = missionReport(missingBalances).debrief.resources;
  for (const key of [
    "crewDaysUsed",
    "cabinUsedKWh",
    "serviceUsedKg",
    "descentUsedKg",
  ])
    assert.equal(missingResources[key], null);
  const zeros = structuredClone(ice);
  zeros.moon.resources.supportUnitsRemaining = 0;
  zeros.moon.resources.platformEnergyWh = 0;
  zeros.moon.resources.returnPropellantKg = 0;
  zeros.moon.resources.descentPropellantKg = 0;
  const zeroResources = missionReport(zeros).debrief.resources;
  for (const key of [
    "crewDaysUsed",
    "cabinUsedKWh",
    "serviceUsedKg",
    "descentUsedKg",
  ])
    assert.ok(
      zeroResources[key] > 0,
      "recorded zero remains a real exhausted balance",
    );
  assert.equal(
    missionReport(ice).debrief.resources.serviceUsedKg,
    ice.moon.human.approved.accounting.service.propellantKg -
      ice.moon.resources.returnPropellantKg,
  );
  const { emptyJourney, reduceJourney, restoreJourney } = await load(
    "flight/journey/journey.ts",
  );
  const { TRANSFER_DATES } = await load("flight/journey/transferModel.ts");
  let chosen = reduceJourney(
    { ...emptyJourney(), signature: ice.moon.designSignature },
    { type: "journey-date", date: TRANSFER_DATES[0] },
    ice.moon,
  );
  chosen = reduceJourney(
    chosen,
    { type: "journey-select-orbit", tier: "high" },
    ice.moon,
  );
  assert.equal(
    restoreJourney(chosen, ice.moon).orbitTier,
    "high",
    "selected orbit survives command replay",
  );
  const historical = {
    ...chosen,
    date: "2026-11-01",
    commands: chosen.commands.map((command) =>
      command.type === "journey-date"
        ? { ...command, date: "2026-11-01" }
        : command,
    ),
  };
  assert.equal(
    restoreJourney(historical, ice.moon).date,
    "2026-11-01",
    "saved departures do not expire when the calendar advances",
  );
  const storage = new Map(),
    adapter = {
      getItem: (k) => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, v),
    };
  assert.ok(
    writeSelectionSession(
      adapter,
      ice.progress,
      false,
      ice.preparation,
      ice.readiness,
      ice.flight,
      ice.moon,
    ),
  );
  const restored = readSelectionSession(adapter);
  assert.ok(
    completedMission(restored),
    "existing save supports reopening without a new store",
  );
  const stored = storage.get(FULL_MOON_SAVE_KEY);
  assert.ok(stored);
  writeFileSync("/tmp/moon-report-completed-save.json", stored);
  assert.equal(storage.has(COMPARISON_KEY), false);
  const oldEnvelope = JSON.parse(stored);
  oldEnvelope.sessionVersion = 12;
  storage.set(FULL_MOON_SAVE_KEY, JSON.stringify(oldEnvelope));
  assert.ok(
    completedMission(readSelectionSession(adapter)),
    "supported previous save reopens",
  );
  const { sampleAtlas } = await server.ssrLoadModule(
    "/@fs" + process.cwd() + "/packages/engine/src/atlas/index.ts",
  );
  const data = JSON.parse(
    readFileSync("apps/web/public/exploration/atlas.json", "utf8"),
  );
  assert.equal(sampleAtlas(data, 90, 0).temperature, null);
  const missing = structuredClone(data);
  missing.presets.shackleton.temperature = null;
  assert.equal(sampleAtlas(missing, -89.5, 0).temperature, null);
  console.log(
    "Passed: completed Ice/Geology, recovery/signature gates, deduplication, stow/return, negative/inconclusive/undelivered evidence, older optional fields and saves, reference coverage, read-only derivation and comparison v1.",
  );
} finally {
  await server.close();
}
