import {
  transferSolution,
  TRANSFER_DATES,
  LUNAR_ORBIT_TIERS,
  type LunarOrbitTierId,
} from "./transferModel.ts";
import type { MoonSession, MissionResources } from "@/game/moon/shared/session";
import { PLATFORM_MODEL, platformReport } from "@/game/moon/shared/platform";

/** Authored transfer profiles, not Lambert solutions. Fuel uses the ideal rocket equation. */
export const ROUTES = [
  {
    id: "fast",
    name: "Fast",
    days: 2.5,
    tliMS: 3500,
    loiMS: 1150,
    risk: "Higher arrival burn",
  },
  {
    id: "balanced",
    name: "Balanced",
    days: 3.25,
    tliMS: 3200,
    loiMS: 900,
    risk: "Balanced fuel & time",
  },
  {
    id: "efficient",
    name: "Efficient",
    days: 4.5,
    tliMS: 3080,
    loiMS: 750,
    risk: "More supplies needed",
  },
] as const;
export type RouteId = (typeof ROUTES)[number]["id"];
export type JourneyStage =
  | "route"
  | "tli-window"
  | "tli-burn"
  | "coast"
  | "loi-window"
  | "loi-burn"
  | "complete";
export type BurnDirection = "prograde" | "retrograde";
export interface JourneyState {
  version: 1 | 2;
  commands?: JourneyEvent[];
  burnSeconds?: number;
  date?: string;
  orbitTier?: LunarOrbitTierId;
  angle?: number;
  throttle?: number;
  firing?: boolean;
  dv?: number;
  radialDv?: number;
  tliUsed?: number;
  loiUsed?: number;
  signature: string | null;
  route: RouteId | null;
  stage: JourneyStage;
  elapsed: number;
  mode: "guided" | "challenge";
  speed: 1 | 1.5 | 2;
  direction: BurnDirection;
  paused: boolean;
  burns: ("tli" | "loi")[];
  attempts: number;
  feedback: string | null;
  assisted: boolean;
}
export const emptyJourney = (): JourneyState => ({
  version: 2,
  signature: null,
  route: null,
  stage: "route",
  orbitTier: "low",
  elapsed: 0,
  mode: "guided",
  speed: 1,
  direction: "prograde",
  paused: false,
  burns: [],
  attempts: 0,
  feedback: null,
  assisted: false,
});
export const TRANSFER_MODEL = {
  id: "moon-transfer-v1",
  upperDryKg: 6000,
  upperFuelKg: 75000,
  upperIspSeconds: 450,
  parkingSeconds: 7200,
  coastScreenSeconds: 14,
  burnScreenSeconds: 3,
  returnDays: 3,
  surfaceDays: 1,
  operationsDays: 0.5,
  earthReturnMS: 1200,
  courseCorrectionMS: 100,
} as const;
const g0 = 9.80665;
export function fuelForBurn(
  wetKg: number,
  deltaVMS: number,
  ispSeconds: number,
) {
  return wetKg * (1 - Math.exp(-deltaVMS / (g0 * ispSeconds)));
}
export function routeReport(moon: MoonSession, id: RouteId) {
  const authored = ROUTES.find((r) => r.id === id)!;
  const solution = transferSolution(moon.journey.date, id);
  const route =
    moon.journey.version === 2 && solution
      ? { ...authored, ...solution }
      : authored;
  const account =
    moon.human.approved?.accounting ?? platformReport(moon.crew, 0, moon.plan);
  const wet = account.grossSpacecraftKg;
  const tliFuelKg = fuelForBurn(
    wet + TRANSFER_MODEL.upperDryKg + TRANSFER_MODEL.upperFuelKg,
    route.tliMS * 1.05,
    TRANSFER_MODEL.upperIspSeconds,
  );
  // Lunar insertion carries the full lander AND its descent/ascent propellant.
  const loiFuelKg = fuelForBurn(
    wet,
    route.loiMS * 1.05,
    PLATFORM_MODEL.serviceIspSeconds,
  );
  const correctionsFuelKg = fuelForBurn(
    wet - loiFuelKg,
    TRANSFER_MODEL.courseCorrectionMS,
    PLATFORM_MODEL.serviceIspSeconds,
  );
  const returnReserveKg = fuelForBurn(
    account.service.dryKg +
      account.service.propellantKg -
      loiFuelKg -
      correctionsFuelKg,
    TRANSFER_MODEL.earthReturnMS * 1.05,
    PLATFORM_MODEL.serviceIspSeconds,
  );
  const serviceRemainingKg =
    account.service.propellantKg - loiFuelKg - correctionsFuelKg;
  const neededDays = Math.ceil(
    route.days +
      TRANSFER_MODEL.returnDays +
      TRANSFER_MODEL.surfaceDays +
      TRANSFER_MODEL.operationsDays,
  );
  const suppliesOK =
    moon.plan.days >= neededDays &&
    account.capacityCrewDays >= 3 * (neededDays + 2);
  const powerOK =
    (neededDays + 2) * 24 * account.lifeSupportLoadW <= account.usableSupportWh;
  const fuelOK =
    tliFuelKg <= TRANSFER_MODEL.upperFuelKg &&
    serviceRemainingKg >= returnReserveKg;
  return {
    ...route,
    tliFuelKg,
    loiFuelKg,
    correctionsFuelKg,
    returnReserveKg,
    serviceRemainingKg,
    neededDays,
    suppliesOK,
    powerOK,
    fuelOK,
    solution,
    feasible:
      suppliesOK &&
      powerOK &&
      fuelOK &&
      (moon.journey.version !== 2 || !!solution),
  };
}
export function burnSafe(j: JourneyState) {
  return j.mode === "guided" || (j.elapsed >= 1.2 && j.elapsed <= 2.8);
}
export function coastFraction(j: JourneyState) {
  return ["loi-window", "loi-burn", "complete"].includes(j.stage)
    ? 1
    : j.stage === "coast"
      ? Math.min(1, j.elapsed / TRANSFER_MODEL.coastScreenSeconds)
      : 0;
}
/** Rebuild accounting from receipts. Repeated ticks/reloads cannot double-spend fuel. */
export function journeyResources(
  moon: MoonSession,
  j: JourneyState,
): MissionResources {
  const start: MissionResources = {
    ...moon.resources,
    batteryWh: moon.resources.capacityWh,
    roverHealth: 100,
    upperStagePropellantKg: TRANSFER_MODEL.upperFuelKg,
    descentPropellantKg: PLATFORM_MODEL.descentPropellantKg,
    ascentPropellantKg: PLATFORM_MODEL.ascentPropellantKg,
  };
  const account = moon.human.approved!.accounting;
  const fraction = coastFraction(j),
    route = j.route ? routeReport({ ...moon, journey: j }, j.route) : null;
  const seconds =
    TRANSFER_MODEL.parkingSeconds +
    (j.burnSeconds ?? 0) +
    (route ? route.days * 86400 * fraction : 0);
  const captured = j.stage === "complete";
  if (j.version === 2)
    return {
      ...start,
      upperStagePropellantKg: Math.max(
        0,
        TRANSFER_MODEL.upperFuelKg - (j.tliUsed ?? 0),
      ),
      elapsedMissionSeconds: seconds,
      supportUnitsRemaining: account.capacityCrewDays - (3 * seconds) / 86400,
      platformEnergyWh:
        account.lifeSupportCapacityWh -
        (account.lifeSupportLoadW * seconds) / 3600,
      returnPropellantKg: account.service.propellantKg - (j.loiUsed ?? 0),
    };
  return {
    ...start,
    upperStagePropellantKg: [
      "coast",
      "loi-window",
      "loi-burn",
      "complete",
    ].includes(j.stage)
      ? 0
      : TRANSFER_MODEL.upperFuelKg,
    elapsedMissionSeconds: seconds,
    supportUnitsRemaining: account.capacityCrewDays - (3 * seconds) / 86400,
    platformEnergyWh:
      account.lifeSupportCapacityWh -
      (account.lifeSupportLoadW * seconds) / 3600,
    returnPropellantKg:
      account.service.propellantKg -
      (captured && route ? route.loiFuelKg + route.correctionsFuelKg : 0),
  };
}
export type JourneyEvent =
  | { type: "journey-confirm" }
  | { type: "journey-select-orbit"; tier: LunarOrbitTierId }
  | { type: "journey-date"; date: string }
  | {
      type: "journey-pilot";
      angle?: number;
      throttle?: number;
      firing?: boolean;
    }
  | { type: "journey-finish-burn" }
  | { type: "journey-route"; id: RouteId }
  | { type: "journey-direction"; direction: BurnDirection }
  | { type: "journey-mode"; mode: "guided" | "challenge" }
  | { type: "journey-speed"; speed: number }
  | { type: "journey-tick"; seconds: number }
  | { type: "journey-burn" }
  | { type: "journey-pause" }
  | { type: "journey-resume" }
  | { type: "journey-retry" }
  | { type: "journey-skip" }
  | { type: "journey-hint" };
export function randomInitialAngle(): number {
  const sign = Math.random() < 0.5 ? -1 : 1;
  return sign * Math.floor(35 + Math.random() * 40);
}

export function getLoiRequiredDv(j: JourneyState, baseLoiMS: number): number {
  const tier = LUNAR_ORBIT_TIERS[j.orbitTier ?? "low"];
  return tier ? tier.loiDvMS : baseLoiMS;
}

function reduceJourneyCore(
  j: JourneyState,
  event: JourneyEvent,
  moon: MoonSession,
): JourneyState {
  if (event.type === "journey-confirm")
    return j.stage === "route" &&
      j.route &&
      routeReport({ ...moon, journey: j }, j.route).feasible
      ? { ...j, stage: "tli-window", elapsed: 0, paused: false }
      : j;
  if (event.type === "journey-select-orbit")
    return {
      ...j,
      orbitTier: event.tier,
      feedback: null,
    };
  if (event.type === "journey-date")
    return j.stage === "route" && TRANSFER_DATES.includes(event.date)
      ? {
          ...j,
          version: 2,
          date: event.date,
          angle: 0,
          throttle: 0.5,
          firing: false,
          dv: 0,
          radialDv: 0,
          tliUsed: 0,
          loiUsed: 0,
          burnSeconds: 0,
        }
      : j;
  if (event.type === "journey-pilot")
    return j.version === 2 && !j.paused
      ? {
          ...j,
          angle: Math.max(-180, Math.min(180, event.angle ?? j.angle ?? 0)),
          throttle: Math.max(
            0,
            Math.min(1, event.throttle ?? j.throttle ?? 0.5),
          ),
          firing: event.firing ?? j.firing,
        }
      : j;
  if (j.version === 2 && event.type === "journey-finish-burn") {
    const report = j.route ? routeReport(moon, j.route) : null;
    if (!report || j.paused || !j.stage.endsWith("burn")) return j;
    const arrival = j.stage === "loi-burn",
      required = arrival ? getLoiRequiredDv(j, report.loiMS) : report.tliMS;
    const ok = arrival
      ? Math.abs((j.dv ?? 0) - required) <= Math.max(60, required * 0.1) ||
        (j.dv ?? 0) >= required * 0.94
      : Math.hypot((j.dv ?? 0) - required, j.radialDv ?? 0) <= required * 0.015;
    if (!ok)
      return {
        ...j,
        paused: true,
        firing: false,
        feedback: arrival
          ? "Orbit unsafe. Retry the arrival burn checkpoint."
          : "Transfer missed. Retry departure; aim at the marker and match the required delta-v.",
      };
    return {
      ...j,
      stage: arrival ? "complete" : "coast",
      burns: arrival ? ["tli", "loi"] : ["tli"],
      elapsed: 0,
      firing: false,
      dv: arrival ? j.dv : 0,
      radialDv: arrival ? j.radialDv : 0,
    };
  }
  if (event.type === "journey-route")
    return j.stage === "route" && ROUTES.some((r) => r.id === event.id)
      ? { ...j, route: event.id, feedback: null }
      : j;
  if (event.type === "journey-speed")
    return [1, 1.5, 2].includes(event.speed)
      ? { ...j, speed: event.speed as JourneyState["speed"] }
      : j;
  if (event.type === "journey-hint") return { ...j, assisted: true };
  if (event.type === "journey-mode")
    return j.stage === "route" ? { ...j, mode: event.mode } : j;
  if (event.type === "journey-direction")
    return ["tli-window", "loi-window"].includes(j.stage) &&
      ["prograde", "retrograde"].includes(event.direction)
      ? { ...j, direction: event.direction, feedback: null }
      : j;
  if (event.type === "journey-pause")
    return { ...j, paused: true, firing: false };
  if (event.type === "journey-retry" && j.version === 2)
    return {
      ...j,
      paused: false,
      feedback: null,
      firing: false,
      dv: 0,
      radialDv: 0,
      angle: randomInitialAngle(),
      elapsed: 0,
      burnSeconds: Math.max(0, (j.burnSeconds ?? 0) - j.elapsed),
      ...(j.stage === "loi-burn" ? { loiUsed: 0 } : { tliUsed: 0 }),
      attempts: j.attempts + 1,
      assisted: true,
    };
  if (event.type === "journey-resume" || event.type === "journey-retry")
    return {
      ...j,
      paused: false,
      elapsed: event.type === "journey-retry" ? 0 : j.elapsed,
      feedback: null,
    };
  const route = j.route ? routeReport(moon, j.route) : null;
  if (event.type === "journey-skip")
    return j.stage !== "route" && route?.feasible
      ? {
          ...j,
          stage: "complete",
          burns: ["tli", "loi"],
          elapsed: TRANSFER_MODEL.burnScreenSeconds,
          assisted: true,
          paused: false,
          firing: false,
          ...(j.version === 2
            ? {
                tliUsed: fuelForBurn(
                  (moon.human.approved?.accounting.grossSpacecraftKg ?? 0) +
                    TRANSFER_MODEL.upperDryKg +
                    TRANSFER_MODEL.upperFuelKg,
                  route.tliMS,
                  TRANSFER_MODEL.upperIspSeconds,
                ),
                loiUsed: fuelForBurn(
                  moon.human.approved?.accounting.grossSpacecraftKg ?? 0,
                  getLoiRequiredDv(j, route.loiMS),
                  PLATFORM_MODEL.serviceIspSeconds,
                ),
                dv: getLoiRequiredDv(j, route.loiMS),
                radialDv: 0,
              }
            : {}),
          feedback: null,
        }
      : j;
  if (event.type === "journey-burn") {
    if (
      !["tli-window", "loi-window"].includes(j.stage) ||
      j.paused ||
      !route?.feasible
    )
      return j;
    if (j.version === 2)
      return {
        ...j,
        stage: j.stage === "tli-window" ? "tli-burn" : "loi-burn",
        angle: randomInitialAngle(),
        dv: 0,
        radialDv: 0,
        firing: false,
        elapsed: 0,
      };
    const correct = j.stage === "tli-window" ? "prograde" : "retrograde";
    if (j.direction !== correct || !burnSafe(j))
      return {
        ...j,
        attempts: j.attempts + 1,
        feedback:
          j.direction !== correct
            ? correct === "prograde"
              ? "Point forward to head for the Moon."
              : "Point backward to slow down at the Moon."
            : "Wait for the green window. No fuel spent.",
      };
    return {
      ...j,
      stage: j.stage === "tli-window" ? "tli-burn" : "loi-burn",
      burns: j.stage === "tli-window" ? ["tli"] : ["tli", "loi"],
      elapsed: 0,
      feedback: null,
      assisted: j.assisted || j.mode === "guided",
    };
  }
  if (
    event.type !== "journey-tick" ||
    j.paused ||
    !Number.isFinite(event.seconds) ||
    event.seconds <= 0
  )
    return j;
  if (j.version === 2 && j.stage.endsWith("burn")) {
    if (!j.firing || !route) return j;
    const arrival = j.stage === "loi-burn",
      account = moon.human.approved?.accounting;
    const isp = arrival
      ? PLATFORM_MODEL.serviceIspSeconds
      : TRANSFER_MODEL.upperIspSeconds;
    const used = arrival ? (j.loiUsed ?? 0) : (j.tliUsed ?? 0);
    const prior = arrival
      ? 0
      : TRANSFER_MODEL.upperDryKg + TRANSFER_MODEL.upperFuelKg;
    const grossKg = account?.grossSpacecraftKg ?? 45000;
    const mass = grossKg + prior - used;
    // Authored engine thrust and simulation time compression; fuel remains kg.
    const seconds = Math.min(event.seconds, 0.25) * 20;
    const fuelLimit = arrival
      ? (account?.service.propellantKg ?? 4500) - route.returnReserveKg
      : TRANSFER_MODEL.upperFuelKg;
    const flow =
      ((arrival ? 90000 : 1000000) * (j.throttle ?? 0.5)) / (g0 * isp);
    const fuel = Math.max(0, Math.min(flow * seconds, fuelLimit - used));
    const delta = g0 * isp * Math.log(mass / (mass - fuel)),
      a = ((j.angle ?? 0) * Math.PI) / 180;
    const isAligned = Math.abs(j.angle ?? 0) <= 8;
    return {
      ...j,
      elapsed: j.elapsed + seconds,
      burnSeconds: (j.burnSeconds ?? 0) + seconds,
      dv: (j.dv ?? 0) + (isAligned ? delta * Math.cos(a) : 0),
      radialDv: (j.radialDv ?? 0) + delta * Math.sin(a),
      ...(arrival ? { loiUsed: used + fuel } : { tliUsed: used + fuel }),
      firing: fuel > 0,
    };
  }
  const window = ["tli-window", "loi-window"].includes(j.stage);
  if (
    j.stage === "route" ||
    j.stage === "complete" ||
    (window && (j.mode === "guided" || j.version === 2))
  )
    return j;
  const limit = window
    ? 4
    : j.stage === "coast"
      ? TRANSFER_MODEL.coastScreenSeconds
      : TRANSFER_MODEL.burnScreenSeconds;
  const elapsed = Math.min(
    limit,
    j.elapsed + Math.min(event.seconds, 0.25) * j.speed,
  );
  if (elapsed < limit) return { ...j, elapsed };
  if (window)
    return {
      ...j,
      elapsed,
      paused: true,
      feedback: "Window missed. Retry this burn; no fuel spent.",
    };
  return {
    ...j,
    stage:
      j.stage === "tli-burn"
        ? "coast"
        : j.stage === "coast"
          ? "loi-window"
          : "complete",
    elapsed: 0,
    direction: j.stage === "coast" ? "prograde" : j.direction,
    feedback: null,
  };
}
/** Bounded inputs allow a saved pilot run to be reconstructed without trusting fuel flags. */
export function reduceJourney(
  j: JourneyState,
  event: JourneyEvent,
  moon: MoonSession,
): JourneyState {
  if (j.version === 2 && (j.commands?.length ?? 0) >= 15000) return j;
  const next = reduceJourneyCore(j, event, moon);
  if (next === j || next.version !== 2) return next;
  const command =
    event.type === "journey-tick"
      ? { ...event, seconds: Math.min(0.25, event.seconds) }
      : event;
  const prefix =
    j.version === 1 && j.route
      ? [{ type: "journey-route" as const, id: j.route }]
      : [];
  return { ...next, commands: [...(j.commands ?? []), ...prefix, command] };
}
export function restoreJourney(raw: unknown, moon: MoonSession): JourneyState {
  const clean = emptyJourney();
  if (!raw || typeof raw !== "object") return clean;
  const saved = raw as JourneyState;
  if (
    ![1, 2].includes(saved.version) ||
    saved.signature !== moon.designSignature ||
    ![
      "route",
      "tli-window",
      "tli-burn",
      "coast",
      "loi-window",
      "loi-burn",
      "complete",
    ].includes(saved.stage) ||
    !Number.isFinite(saved.elapsed) ||
    saved.elapsed < 0 ||
    !Number.isInteger(saved.attempts) ||
    saved.attempts < 0
  )
    return clean;
  if (
    saved.version === 2 &&
    (!TRANSFER_DATES.includes(saved.date ?? "") ||
      ![
        saved.angle,
        saved.throttle,
        saved.dv,
        saved.radialDv,
        saved.tliUsed,
        saved.loiUsed,
      ].every(Number.isFinite) ||
      (saved.throttle ?? 0) < 0 ||
      (saved.throttle ?? 0) > 1 ||
      Math.abs(saved.angle ?? 0) > 180 ||
      (saved.dv ?? 0) < -10000 ||
      (saved.tliUsed ?? 0) < 0 ||
      (saved.tliUsed ?? 0) > TRANSFER_MODEL.upperFuelKg ||
      (saved.loiUsed ?? 0) < 0)
  )
    return clean;
  if (saved.version === 2) {
    if (!Array.isArray(saved.commands) || saved.commands.length > 15000)
      return clean;
    let rebuilt: JourneyState = {
      ...emptyJourney(),
      signature: moon.designSignature,
    };
    const allowed = [
      "journey-date",
      "journey-route",
      "journey-confirm",
      "journey-pilot",
      "journey-finish-burn",
      "journey-direction",
      "journey-mode",
      "journey-speed",
      "journey-tick",
      "journey-burn",
      "journey-pause",
      "journey-resume",
      "journey-retry",
      "journey-skip",
      "journey-hint",
    ];
    for (const command of saved.commands) {
      if (
        !command ||
        !allowed.includes(command.type) ||
        Object.values(command).some(
          (value) => typeof value === "number" && !Number.isFinite(value),
        )
      )
        return clean;
      rebuilt = reduceJourneyCore(rebuilt, command, {
        ...moon,
        journey: rebuilt,
      });
    }
    return {
      ...rebuilt,
      commands: [...saved.commands],
      paused: !["route", "complete"].includes(rebuilt.stage),
      firing: false,
    };
  }
  const expected = ["route", "tli-window"].includes(saved.stage)
    ? ""
    : ["loi-burn", "complete"].includes(saved.stage)
      ? "tli,loi"
      : "tli";
  if (saved.version === 1 && (saved.burns ?? []).join(",") !== expected)
    return clean;
  const route = ROUTES.find((r) => r.id === saved.route),
    limit = saved.stage.endsWith("window")
      ? 4
      : saved.stage === "coast"
        ? TRANSFER_MODEL.coastScreenSeconds
        : TRANSFER_MODEL.burnScreenSeconds;
  if (
    (saved.version === 1 && saved.elapsed > limit) ||
    (saved.stage !== "route" &&
      (!route || !routeReport({ ...moon, journey: saved }, route.id).feasible))
  )
    return clean;
  return {
    ...clean,
    signature: moon.designSignature,
    route: route?.id ?? null,
    stage: saved.stage,
    elapsed: saved.elapsed,
    burns: [...(saved.burns ?? [])],
    attempts: saved.attempts,
    mode: saved.mode === "challenge" ? "challenge" : "guided",
    speed: [1, 1.5, 2].includes(saved.speed) ? saved.speed : 1,
    direction: saved.direction === "retrograde" ? "retrograde" : "prograde",
    assisted: saved.assisted === true,
    paused: saved.stage !== "route" && saved.stage !== "complete",
  };
}

export const lunarOrbitSpeedKmS = Math.sqrt(4902.8 / (1737.4 + 100));
