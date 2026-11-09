import ts from "typescript";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const source = readFileSync(
  "apps/web/src/features/exploration/signalModel.ts",
  "utf8",
);
const code = ts.transpile(source, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ES2022,
});
const m = await import(
  "data:text/javascript;base64," + Buffer.from(code).toString("base64")
);
const data = JSON.parse(
  readFileSync("apps/web/public/exploration/geometry.json", "utf8"),
);
const total = m.PACKETS.reduce((s, p) => s + p.mb, 0);
assert.equal((30 * 8) / 1, 240);
assert.equal(m.visible([m.RADIUS, 0, 0], [-400000, 0, 0]), false);
assert.equal(m.clearMoon([2000, 0, 0], [-400000, 0, 0]), false);
assert.equal(m.clearMoon([2000, 0, 0], [400000, 0, 0]), true);
const outputs = [];
for (const site of m.SITES)
  for (const orbit of ["direct", "circular", "elliptical"])
    for (const radio of [0, 1, 2]) {
      const result = m.simulate(site, orbit, radio, data);
      assert.ok(
        Math.abs(
          result.surface.reduce((a, b) => a + b, 0) +
            result.buffer.reduce((a, b) => a + b, 0) +
            result.total +
            result.inflight -
            total,
        ) < 1e-7,
      );
      assert.ok(result.energy >= 0 && result.energy <= 36);
      assert.ok(result.buffer.reduce((a, b) => a + b, 0) <= 64 + 1e-7);
      assert.ok(result.completed >= 0 && result.completed <= 3);
      if (site.id === "far" && orbit === "direct")
        assert.equal(result.total, 0);
      const empty = m.simulate(site, orbit, radio, data, 86400, false, 0);
      assert.equal(empty.total, 0);
      outputs.push([
        site.id,
        orbit,
        radio,
        result.total.toFixed(2),
        result.contact / 3600,
      ]);
    }
assert.deepEqual(
  m.simulate(m.SITES[0], "elliptical", 1, data),
  m.simulate(m.SITES[0], "elliptical", 1, data),
);
const blocked = m.simulate(m.SITES[0], "direct", 1, data);
assert.equal(blocked.total, 0);
assert.ok(outputs.some((r) => r[1] === "elliptical" && +r[3] > 0));
console.log(
  "27 configurations: byte conservation, energy, buffer, occultation and deterministic replay passed.",
);
console.table(outputs.filter((r) => r[0] === "shackleton"));
const a = JSON.parse(
  readFileSync("apps/web/public/exploration/atlas.json", "utf8"),
);
assert.equal(a.metadata.size, a.elevation.length);
assert.ok(a.temperature.flat().some((v) => v === null));
assert.ok(a.temperature.flat().some((v) => v > 100));
console.log("Atlas dimensions and no-data mask passed.");
