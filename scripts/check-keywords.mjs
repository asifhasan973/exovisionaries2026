import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const require = createRequire(
  new URL("../apps/web/package.json", import.meta.url),
);
const { createServer } = await import(pathToFileURL(require.resolve("vite")));
const server = await createServer({
  root: "apps/web",
  cacheDir: "/tmp/space-keywords-check-vite",
  configFile: "apps/web/vite.config.ts",
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const data = await server.ssrLoadModule(
    "/src/game/moon/core/learning/glossary.ts",
  );
  assert.ok(data.GLOSSARY.deltav, "Moon transfer needs a Delta-v card");
  const { getContextualTerms, matchLearningTerms } = await server.ssrLoadModule(
    "/src/game/moon/core/learning/keywordContext.ts",
  );
  const transfer = getContextualTerms({ stepId: "moon-transfer" });
  for (const id of ["deltav", "burnwindow", "coasting"])
    assert.ok(transfer.includes(id), id);
  assert.ok(
    !transfer.includes("plagioclase"),
    "Transfer must not show unrelated rock terms",
  );
  const rock = getContextualTerms({
    stepId: "ice-science",
    objective: "lunar-geology",
  });
  for (const id of ["plagioclase", "xrf", "xrd"])
    assert.ok(rock.includes(id), id);
  assert.ok(
    getContextualTerms({
      stepId: "surface-explore",
      objective: "lunar-geology",
      activity: "sample-result",
    }).includes("xrf"),
    "Live rover sample review needs rock analysis keywords",
  );
  for (const id of ["descent", "braking", "throttle"])
    assert.ok(getContextualTerms({ stepId: "lunar-descent" }).includes(id), id);
  assert.deepEqual(
    matchLearningTerms(
      "Earth parking orbit, lunar orbit, orbit; XRF and Element scanner; Payload mount.",
    ).map((x) => x.term),
    ["parkingorbit", "lunarorbit", "orbit", "xrf", "adapter"],
  );
  assert.deepEqual(
    matchLearningTerms("High-gain communication and crystal pattern").map(
      (x) => x.term,
    ),
    ["highgain", "crystalpattern"],
  );
  assert.deepEqual(
    matchLearningTerms("Massive plants orbiting stars"),
    [],
    "No matches inside longer words",
  );
  assert.equal(
    getContextualTerms({
      stepId: "appointment",
      text: "A seismometer checks a moonquake.",
    })[0],
    "seismometer",
  );
  assert.equal(
    data.PART_TERMS["stereo-hazard-camera"],
    "stereocamera",
    "Stereo camera help should open its specific keyword",
  );
  assert.equal(
    data.PART_TERMS["high-gain-communication"],
    "highgain",
    "High-gain radio help should open its specific keyword",
  );
  const grouped = data.WORD_GROUPS.flatMap((x) => x.terms);
  assert.equal(
    new Set(grouped).size,
    Object.keys(data.GLOSSARY).length,
    "Every keyword must be in a category",
  );
  assert.equal(
    grouped.length,
    new Set(grouped).size,
    "No duplicate library entries",
  );
  for (const entry of Object.values(data.GLOSSARY)) {
    assert.ok(
      entry.text.length <= 150,
      entry.name + " needs a short explanation",
    );
    assert.equal(
      (entry.text.match(/[.!?](?:\s|$)/g) ?? []).length,
      1,
      entry.name + " needs one sentence",
    );
  }
  const { KEYWORD_MEDIA } = await server.ssrLoadModule(
    "/src/game/moon/core/learning/keywordMedia.ts",
  );
  for (const id of [
    "ascent",
    "braking",
    "hydroxyl",
    "crystalpattern",
    "lunarcapture",
  ])
    assert.ok(!KEYWORD_MEDIA[id]?.length, id + " must omit misleading media");
  assert.ok(KEYWORD_MEDIA.docking.length > 1);
  assert.ok(KEYWORD_MEDIA.crater.some((x) => x.kind === "youtube"));
  if (process.env.KEYWORD_SAVE_DIR) {
    const directory = process.env.KEYWORD_SAVE_DIR;
    mkdirSync(directory, { recursive: true });
    const load = (path) => server.ssrLoadModule("/src/game/moon/" + path);
    const seeder = await load(
      existsSync("apps/web/src/game/moon/core/missionCheckpoints.ts")
        ? "core/missionCheckpoints.ts"
        : "debug/debugSessionSeeder.ts",
    );
    const createMissionCheckpoint =
      seeder.createMissionCheckpoint ?? seeder.createDebugSession;
    const { writeSelectionSession, restoreSelectionProgress } = await load(
      "crew/selectionSession.ts",
    );
    const { createJourneyDemo, createLandingDemo } = await load(
      "flight/journey/journeyDemo.ts",
    );
    const { reduceMission } = await load("workshop/lander/workshopSession.ts");
    for (const [name, stepId, objective] of [
      ["site", "site", "lunar-ice"],
      ["moon-transfer", "moon-transfer", "lunar-ice"],
      ["lunar-descent", "lunar-descent", "lunar-ice"],
      ["ice-science", "science-build", "lunar-ice"],
      ["rock-science", "science-build", "lunar-geology"],
    ]) {
      let mission =
        stepId === "lunar-descent"
          ? createLandingDemo("female", objective, { playerName: "Explorer" })
          : createMissionCheckpoint(stepId, {
              objective,
              playerName: "Explorer",
            });
      if (stepId === "moon-transfer") {
        mission = createJourneyDemo("female", objective, {
          playerName: "Explorer",
        });
        for (const event of [
          { type: "flight-skip" },
          { type: "next" },
          { type: "journey-route", id: "balanced" },
          { type: "journey-confirm-route" },
        ])
          mission = reduceMission(mission, event);
      }
      const values = new Map();
      writeSelectionSession(
        {
          getItem: (key) => values.get(key) ?? null,
          setItem: (key, value) => values.set(key, value),
        },
        mission.progress,
        false,
        mission.preparation,
        mission.readiness,
        mission.flight,
        mission.moon,
        mission.repair,
      );
      assert.equal(
        restoreSelectionProgress([...values.values()][0]).stepId,
        stepId,
        "Scene fixtures must survive actual save restoration",
      );
      writeFileSync(`${directory}/${name}.json`, [...values.values()][0]);
    }
  }
  console.log(
    `Keywords: context, aliases, ${grouped.length} library cards, and media integrity passed.`,
  );
} finally {
  await server.close();
}
