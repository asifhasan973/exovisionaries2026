import assert from "node:assert/strict";
import {
  evaluatePower,
  REFERENCE,
  validateExperiment,
} from "../apps/web/src/features/engineering/powerModel.ts";
const copy = (x) => structuredClone(x);
const e = copy(REFERENCE);
e.design = {
  ...e.design,
  capacityWh: 100,
  startPercent: 100,
  reservePercent: 20,
  solarW: 0,
  dischargeW: 1000,
  chargeEfficiency: 100,
  dischargeEfficiency: 100,
};
e.phases = [
  { id: "a", name: "Test", minutes: 30, loadW: 100, light: 0 },
  { id: "b", name: "Zero", minutes: 0, loadW: 0, light: 0 },
  { id: "c", name: "Zero", minutes: 0, loadW: 0, light: 0 },
];
assert.equal(evaluatePower(e).endWh, 50); // 100 W for half an hour = 50 Wh.
e.phases[0].minutes = 90;
let r = evaluatePower(e);
assert.equal(r.unmetWh, 50);
assert.equal(r.endWh, 0);
e.phases[0].minutes = 30;
e.design.dischargeW = 40;
r = evaluatePower(e);
assert.equal(r.unmetWh, 30);
assert.equal(r.endWh, 80);
assert.equal(r.peakOK, false);
e.design.dischargeW = 1000;
e.design.startPercent = 10;
e.design.solarW = 100;
e.phases[0] = { ...e.phases[0], minutes: 120, loadW: 0, light: 1 };
r = evaluatePower(e);
assert.equal(r.endWh, 100);
assert.equal(r.curtailedWh, 110);
assert.equal(r.reserveOK, false); // Later recharge does not erase initial reserve breach.
e.design.startPercent = 100;
e.design.solarW = 0;
e.design.dischargeEfficiency = 80;
e.phases[0] = { ...e.phases[0], minutes: 30, loadW: 100, light: 0 };
r = evaluatePower(e);
assert.equal(r.endWh, 37.5);
assert.equal(r.lossWh, 12.5);
for (const capacity of [100, 220, 400])
  for (const light of [0, 0.3, 1]) {
    const a = copy(REFERENCE);
    a.design.capacityWh = capacity;
    a.phases.forEach((p) => (p.light = light));
    const v = evaluatePower(a);
    assert.ok(
      Math.abs(
        v.initialWh +
          v.generatedWh -
          (v.demandWh - v.unmetWh) -
          v.lossWh -
          v.curtailedWh -
          v.endWh,
      ) < 1e-7,
      "Energy is conserved.",
    );
    assert.ok(v.points.every((p) => p.wh >= 0 && p.wh <= capacity));
  }
assert.ok(
  validateExperiment({ ...e, design: { ...e.design, chargeEfficiency: 0 } })
    .length,
);
assert.ok(
  validateExperiment({
    ...e,
    phases: e.phases.map((p) => ({ ...p, minutes: 0 })),
  }).length,
);
const before = JSON.stringify(REFERENCE);
const current = evaluatePower(REFERENCE);
assert.equal(JSON.stringify(REFERENCE), before);
const fixed = copy(REFERENCE);
fixed.design.capacityWh = 400;
assert.ok(evaluatePower(fixed).marginWh > current.marginWh);
console.log(
  "Engineering model passed: analytical references, power limit, exhaustion, recharge/reserve, efficiencies, 9 conservation cases, validation, and immutable inputs.",
);
console.log(
  "Reference:",
  current.status,
  current.marginWh.toFixed(2),
  "Wh margin; 400 Wh battery:",
  evaluatePower(fixed).status,
);
