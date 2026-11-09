import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  solarOutput,
  crewBudget,
  parseEvents,
  fetchWeather,
  SOLAR_REFERENCE,
} from "../apps/web/src/features/engineering/nasaModel.ts";
import {
  evaluatePower,
  REFERENCE,
} from "../apps/web/src/features/engineering/powerModel.ts";
assert.equal(solarOutput(1, 100, 0), 1361);
assert.equal(solarOutput(0.5, 30, 0), 204.15);
assert.ok(Math.abs(solarOutput(0.5, 30, 60) - 102.075) < 1e-8);
assert.ok(solarOutput(1, 100, 90) < 1e-10);
assert.equal(solarOutput(-1, 30, 0), null);
assert.equal(solarOutput(1, NaN, 0), null);
const crew = crewBudget(4, 7);
assert.ok(Math.abs(crew.oxygenKg - 22.96) < 1e-10);
assert.ok(Math.abs(crew.co2Kg - 29.12) < 1e-10);
assert.ok(Math.abs(crew.metabolicHeatW - 555.5555555556) < 1e-7);
assert.equal(crewBudget(1.5, 7), null);
assert.equal(crewBudget(4, 0), null);
assert.equal(crewBudget(4, 31), null);
const changed = structuredClone(REFERENCE);
changed.design.solarW = solarOutput(0.5, 30, 0);
changed.design.solarBasis = {
  ...SOLAR_REFERENCE,
  areaM2: 0.5,
  efficiencyPercent: 30,
  incidenceDegrees: 0,
};
assert.ok(
  evaluatePower(changed).marginWh > evaluatePower(REFERENCE).marginWh,
  "Applied NASA solar input must affect actual electrical results.",
);
const parsed = parseEvents([
  {
    flrID: "flare-1",
    beginTime: "2026-11-05T18:21Z",
    classType: "M3.5",
    link: "https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/1",
  },
  {
    sepID: "sep-1",
    eventTime: "2026-11-05T18:21Z",
    link: "javascript:alert(1)",
  },
  { flrID: "bad", beginTime: "unknown" },
  null,
]);
assert.equal(parsed.length, 2);
assert.equal(parsed[1].link, null);
assert.throws(() => parseEvents({ error: "API error" }));
const fetchOriginal = globalThis.fetch;
try {
  globalThis.fetch = async (url) =>
    url.includes("/CME?")
      ? new Response("", { status: 503 })
      : new Response("[]", { status: 200 });
  const partial = await fetchWeather(new Date("2026-11-08T12:00:00Z"));
  assert.equal(partial.startDate, "2026-11-02");
  assert.equal(partial.endDate, "2026-11-08");
  assert.deepEqual(
    partial.channels.map((c) => c.available),
    [true, false, true],
  );
} finally {
  globalThis.fetch = fetchOriginal;
}
const data = JSON.parse(
  await readFile(
    new URL(
      "../apps/web/src/features/engineering/nasaReference.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
assert.equal(data.geometry.rows.length, 25);
assert.ok(
  data.geometry.rows.every((v) => v.distance > 350000 && v.distance < 410000),
);
assert.equal(data.sites.cabeus.temperature, 122.8);
assert.ok(data.weather.channels.every((c) => c.available || c.error));
console.log(
  "NASA engineering passed: solar geometry, invalid inputs, BVAD units, power integration, event sanitization, partial API failure and bundled data provenance.",
);
