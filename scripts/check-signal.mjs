import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import ts from "typescript";
const transpile = (file) =>
  ts.transpile(readFileSync(file, "utf8"), {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  });
const dataUrl = (code) =>
  "data:text/javascript;base64," + Buffer.from(code).toString("base64");
const scenarioCode = transpile(
  "apps/web/src/features/exploration/signalScenario.ts",
).replace("import.meta.env.BASE_URL", "'/'");
const scenarioUrl = dataUrl(scenarioCode),
  s = await import(scenarioUrl);
const g = await import(
  dataUrl(
    transpile("apps/web/src/features/exploration/signalGeometry.ts")
      .replace("'./signalScenario'", JSON.stringify(scenarioUrl))
      .replace('"./signalScenario"', JSON.stringify(scenarioUrl)),
  )
);
const root = "apps/web/public/exploration/signal/";
const manifest = JSON.parse(readFileSync(root + "manifest.json"));
const buffer = readFileSync(root + "states.bin");
assert.equal(
  createHash("sha256").update(buffer).digest("hex"),
  manifest.artifacts["states.bin"],
);
assert.equal(buffer.length, manifest.count * 42 * 8);
const states = new Float64Array(
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
);
const data = { manifest, states },
  r = manifest.radius;
assert.equal(g.elevation([r, 0, 0], [400000, 0, 0]), 90);
assert.equal(g.elevation([r, 0, 0], [-400000, 0, 0]), -90);
assert.equal(g.segmentClear([r + 100, 0, 0], [-400000, 0, 0], r), false);
assert.equal(g.segmentClear([r + 100, 0, 0], [400000, 0, 0], r), true);
assert.equal(g.segmentClear([r, 100, 0], [r, -100, 0], r), false);
assert.deepEqual(
  g
    .blockedEndpoint([r + 100, 0, 0], [-400000, 0, 0], r)
    .map((v) => Math.round(v)),
  [Math.round(r), 0, 0],
);
assert.throws(() => s.bodyAt(data, -1, 0), RangeError);
assert.throws(() => s.bodyAt(data, manifest.duration + 0.1, 0), RangeError);
for (let body = 0; body < 7; body++)
  for (const t of [0, 30, 129600, manifest.duration]) {
    const actual = s.bodyAt(data, t, body),
      offset = (t / 30) * 42 + body * 6;
    for (let k = 0; k < 3; k++)
      assert.ok(Math.abs(actual[k] - states[offset + k]) < 1e-7);
  }
assert.ok(manifest.validation.crossIntegratorMaxKm < 1);
assert.ok(manifest.validation.hermiteProbeMaxKm < 0.1);
const reference = JSON.parse(readFileSync(root + "reference-checks.json"));
for (const sample of reference.samples) {
  const site = g.STUDY_SITES.find((s) => s.id === sample.site),
    actual = g.geometryAt(data, sample.time, site, 1);
  for (const key of ["direct", "up", "down"])
    assert.equal(
      actual[key],
      sample[key],
      `${sample.site} ${sample.time}: ${key}`,
    );
  assert.ok(actual.delay > 1 && actual.delay < 2);
}
const reports = [];
for (const site of g.STUDY_SITES) {
  const a = g.analyzeContacts(data, site, 1);
  for (const change of a.changes) {
    const before = g.geometryAt(data, Math.max(0, change.time - 0.07), site, 1);
    const after = g.geometryAt(
      data,
      Math.min(manifest.duration, change.time + 0.07),
      site,
      1,
    );
    assert.notEqual(
      before[change.kind],
      after[change.kind],
      `${site.id} individual-leg transition`,
    );
    assert.equal(after[change.kind], change.visible);
  }
  for (const key of ["direct", "selected", "any"]) {
    let end = 0,
      total = 0;
    for (const interval of a[key].intervals) {
      assert.ok(
        interval.start >= end &&
          interval.end >= interval.start &&
          interval.end <= manifest.duration,
      );
      end = interval.end;
      total += interval.end - interval.start;
    }
    assert.ok(Math.abs(total - a[key].total) < 1e-6);
    assert.ok(a[key].total >= 0 && a[key].total <= manifest.duration);
  }
  assert.ok(a.any.total >= a.selected.total - 1e-7);
  const expected = reference.events[site.id];
  assert.equal(a.events.length, expected.length, `${site.id} event count`);
  let error = 0;
  for (let i = 0; i < expected.length; i++) {
    error = Math.max(error, Math.abs(a.events[i] - expected[i]));
    assert.ok(error < 1, `${site.id} event error ${error}`);
  }
  reports.push({
    site: site.id,
    directHours: a.direct.total / 3600,
    selectedHours: a.selected.total / 3600,
    anyHours: a.any.total / 3600,
    maxEventErrorSeconds: error,
  });
}
console.table(reports);
const thirdRelay = g.analyzeContacts(data, g.STUDY_SITES[0], 2);
const earthLegChange = thirdRelay.changes.find(
  (change) =>
    change.kind === "down" && change.time > 200300 && change.time < 200340,
);
assert.ok(
  earthLegChange,
  "SV-3 Earth-leg change must be available even while the full route stays blocked",
);
assert.ok(
  !thirdRelay.events.some((t) => Math.abs(t - earthLegChange.time) < 1),
  "This regression case changes only one leg",
);
console.log(
  "NASA input hashes, coverage, Hermite endpoints, external SPICE/dense-output geometry, event timing, interval union and tangent/occultation checks passed.",
);
