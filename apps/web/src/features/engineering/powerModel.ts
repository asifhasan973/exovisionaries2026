import type { SolarBasis } from "./nasaModel";
import { energyWh } from "../../game/moon/shared/resources.ts";

export interface Phase {
  id: string;
  name: string;
  minutes: number;
  loadW: number;
  light: number;
}
export interface PowerDesign {
  solarBasis?: SolarBasis;
  capacityWh: number;
  startPercent: number;
  reservePercent: number;
  solarW: number;
  dischargeW: number;
  chargeEfficiency: number;
  dischargeEfficiency: number;
}
export interface Experiment {
  name: string;
  design: PowerDesign;
  phases: Phase[];
}
export const REFERENCE: Experiment = {
  name: "South-pole sample traverse",
  design: {
    capacityWh: 220,
    startPercent: 100,
    reservePercent: 20,
    solarW: 150,
    dischargeW: 450,
    chargeEfficiency: 90,
    dischargeEfficiency: 95,
  },
  phases: [
    {
      id: "out",
      name: "Outbound traverse",
      minutes: 20,
      loadW: 160,
      light: 0.7,
    },
    {
      id: "science",
      name: "Shadow science",
      minutes: 30,
      loadW: 220,
      light: 0,
    },
    { id: "home", name: "Return to base", minutes: 20, loadW: 160, light: 0.3 },
  ],
};
export function validateExperiment(e: Experiment): string[] {
  const d = e.design,
    errors: string[] = [];
  if (typeof e.name !== "string" || e.name.length > 100)
    errors.push("Study name must be text of at most 100 characters.");
  const bound = (n: number, lo: number, hi: number) =>
    Number.isFinite(n) && n >= lo && n <= hi;
  if (!bound(d.capacityWh, 1, 100000))
    errors.push("Battery capacity must be 1–100,000 Wh.");
  for (const k of ["startPercent", "reservePercent"] as const)
    if (!bound(d[k], 0, 100))
      errors.push("Charge and reserve must be between 0 and 100%.");
  for (const k of ["chargeEfficiency", "dischargeEfficiency"] as const)
    if (!bound(d[k], 1, 100))
      errors.push("Efficiency must be between 1 and 100%.");
  if (!bound(d.solarW, 0, 100000) || !bound(d.dischargeW, 0, 100000))
    errors.push("Power ratings must be between 0 and 100,000 W.");
  if (
    e.phases.length !== 3 ||
    e.phases.some(
      (p) =>
        typeof p.id !== "string" ||
        typeof p.name !== "string" ||
        !bound(p.minutes, 0, 1440) ||
        !bound(p.loadW, 0, 100000) ||
        !bound(p.light, 0, 1),
    )
  )
    errors.push(
      "Use three phases with duration 0–1440 min, nonnegative load and usable sunlight 0–1.",
    );
  if (!e.phases.some((p) => p.minutes > 0))
    errors.push("At least one phase must have a positive duration.");
  return errors;
}
/** Exact constant-load segments; unmet demand and conversion losses are separate accounts. */
export function evaluatePower(e: Experiment) {
  const errors = validateExperiment(e);
  if (errors.length) throw new RangeError(errors.join(" "));
  const d = e.design,
    initialWh = (d.capacityWh * d.startPercent) / 100,
    reserveWh = (d.capacityWh * d.reservePercent) / 100;
  let wh = initialWh,
    minute = 0,
    minimumWh = wh;
  const points = [{ minute: 0, wh }];
  const phases = e.phases.map((p) => {
    const startWh = wh,
      seconds = p.minutes * 60,
      solarW = d.solarW * p.light,
      deficitW = Math.max(0, p.loadW - solarW);
    const demandWh = energyWh(p.loadW, seconds),
      generatedWh = energyWh(solarW, seconds);
    let unmetWh = 0,
      lossWh = 0,
      curtailedWh = 0;
    const peakOK = seconds === 0 || deficitW <= d.dischargeW;
    if (deficitW > 0) {
      const outputW = Math.min(deficitW, d.dischargeW),
        eta = d.dischargeEfficiency / 100;
      const suppliedWh = Math.min(energyWh(outputW, seconds), wh * eta);
      const drainedWh = suppliedWh / eta;
      const boundaryMinutes =
        outputW > 0 ? ((wh * eta) / outputW) * 60 : Infinity;
      if (boundaryMinutes < p.minutes && boundaryMinutes > 0)
        points.push({ minute: minute + boundaryMinutes, wh: 0 });
      wh = Math.max(0, wh - drainedWh);
      unmetWh = energyWh(deficitW, seconds) - suppliedWh;
      lossWh = drainedWh - suppliedWh;
    } else {
      const surplusWh = Math.max(0, generatedWh - demandWh),
        eta = d.chargeEfficiency / 100;
      const storedWh = Math.min(d.capacityWh - wh, surplusWh * eta);
      const boundaryMinutes =
        solarW > p.loadW
          ? ((d.capacityWh - wh) / ((solarW - p.loadW) * eta)) * 60
          : Infinity;
      if (boundaryMinutes < p.minutes && boundaryMinutes > 0)
        points.push({ minute: minute + boundaryMinutes, wh: d.capacityWh });
      wh += storedWh;
      lossWh = storedWh / eta - storedWh;
      curtailedWh = surplusWh - storedWh / eta;
    }
    minimumWh = Math.min(minimumWh, wh);
    minute += p.minutes;
    points.push({ minute, wh });
    return {
      ...p,
      startWh,
      endWh: wh,
      solarW,
      demandWh,
      generatedWh,
      unmetWh,
      lossWh,
      curtailedWh,
      peakOK,
    };
  });
  const total = (
    key: "unmetWh" | "lossWh" | "demandWh" | "generatedWh" | "curtailedWh",
  ) => phases.reduce((s, p) => s + p[key], 0);
  const served = total("unmetWh") < 1e-7,
    peakOK = phases.every((p) => p.peakOK),
    reserveOK = minimumWh + 1e-7 >= reserveWh;
  return {
    phases,
    points,
    initialWh,
    endWh: wh,
    minimumWh,
    reserveWh,
    marginWh: minimumWh - reserveWh,
    durationMinutes: minute,
    demandWh: total("demandWh"),
    generatedWh: total("generatedWh"),
    unmetWh: total("unmetWh"),
    lossWh: total("lossWh"),
    curtailedWh: total("curtailedWh"),
    served,
    peakOK,
    reserveOK,
    status: !served
      ? "Unserved load"
      : !reserveOK
        ? "Reserve breached"
        : "Passes this power test",
  };
}
