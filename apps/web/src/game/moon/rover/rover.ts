import { roverPower, roverCapability } from "./roverEquipment.ts";
import { batteryStep } from "@/game/moon/shared/resources";
import { COURSE_HOLES, COURSE_ROCKS, courseHeight } from "./roverCourse.ts";
import type { MoonSession, MissionResources } from "@/game/moon/shared/session";
import { landingResources } from "@/game/moon/landing/landing";
import { PLATFORM_MODEL } from "@/game/moon/shared/platform";

export { reduceRover, restoreRover, roverInteraction } from "./roverReducer.ts";

export const ROVER_MODEL = {
  id: "crew-rover-v1",
  step: 0.1,
  speed: 5,
  gameplaySpeed: 7.5,
  // NASA VIPER design top speed (m/s), used only as an educational reference.
  // https://science.nasa.gov/mission/viper/in-depth/
  referenceSpeed: 0.2,
  turn: 1.65,
  radius: 1,
  drillSeconds: 6,
  required: 2,
  bounds: 46,
  virtualRate: 10,
} as const;
export const ROVER_BASE = {
  id: "base",
  name: "Lander",
  x: -32,
  z: 25,
} as const;
export const ROVER_SITES = [
  { id: "A", name: "Sunny Flats", x: -13, z: 18, hard: false },
  { id: "B", name: "Rocky Edge", x: 8, z: 3, hard: true },
  { id: "C", name: "Sunlit Ridge", x: -28, z: -23, hard: false },
  { id: "D", name: "Dark Crater", x: 27, z: -24, hard: false },
  { id: "E", name: "Crater Trail", x: 37, z: 23, hard: false },
  { id: "F", name: "Backup Basin", x: 0, z: -34, hard: false },
] as const;
export type RoverSiteId = (typeof ROVER_SITES)[number]["id"];
export const ROVER_CAMPS = [
  ROVER_BASE,
  { id: "west", name: "Sunny Camp", x: -20, z: -3 },
  { id: "east", name: "Solar Ridge", x: 28, z: 6 },
] as const;
export const RUN_SITES = [
  ROVER_SITES[0],
  { id: "B", name: "Shadow Outcrop", x: 27, z: -24, hard: true },
  { id: "C", name: "Shadow Edge", x: 18, z: -19, hard: false },
] as const;
export const ROVER_CHARGER = ROVER_CAMPS[2];
export const roverSites = (s: { version?: number }) =>
  (s.version ?? 0) >= 3 ? RUN_SITES : ROVER_SITES;
export const ROVER_HOLES = [
  { id: "h1", x: 1, z: 18, radius: 4 },
  { id: "h2", x: 12, z: -11, radius: 4.4 },
  { id: "h3", x: 25, z: 32, radius: 3.8 },
  { id: "h4", x: -13, z: -29, radius: 3.2 },
] as const;
export const ROVER_ROCKS = Array.from({ length: 46 }, (_, i) => ({
  id: `r${i}`,
  x: Math.sin(i * 7.13) * 40,
  z: Math.cos(i * 3.71) * 39,
  radius: 0.8 + (i % 4) * 0.25,
})).filter(
  (rock) =>
    ![...ROVER_SITES, ...ROVER_CAMPS].some(
      (site) => Math.hypot(site.x - rock.x, site.z - rock.z) < 5,
    ) &&
    !ROVER_HOLES.some(
      (hole) => Math.hypot(hole.x - rock.x, hole.z - rock.z) < hole.radius + 2,
    ),
);
export function roverLight(x: number, z: number) {
  return ((x - 27) / 18) ** 2 + ((z + 24) / 17) ** 2 < 1 ||
    (x > 29 && z > 14) ||
    (x > -7 && z < -27)
    ? 0
    : 1;
}
export const roverHeight = (x: number, z: number) =>
  Math.sin(x * 0.12) * Math.cos(z * 0.1) * 0.55 +
  0.6 * Math.exp(-((x + 28) ** 2 + (z + 23) ** 2) / 110);
export type RoverPhase =
  | "charging"
  | "delivering"
  | "delivery-result"
  | "stowing"
  | "collecting"
  | "sample-result"
  | "intro"
  | "deploying"
  | "exploring"
  | "drilling"
  | "failed"
  | "cabin"
  | "boarding"
  | "ready"
  | "complete";
export const roverActive = (s: Pick<RoverState, "phase">) =>
  [
    "deploying",
    "exploring",
    "drilling",
    "collecting",
    "charging",
    "delivering",
    "stowing",
    "boarding",
  ].includes(s.phase);
export interface RoverCheckpoint {
  camp: number;
  cargo: RoverSiteId[];
  deposited: RoverSiteId[];
  drilled: RoverSiteId[];
  hardSeen: boolean;
  debriefed: boolean;
  elapsed: number;
  chargeDone?: boolean;
}
export interface RoverState {
  version: 1 | 2 | 3 | 4;
  originVersion?: 1 | 2 | 3 | 4;
  signature: string;
  phase: RoverPhase;
  deployed: boolean;
  x: number;
  z: number;
  heading: number;
  sampleTimes?: Record<string, number>;
  chargeDone?: boolean;
  chargeHeld?: boolean;
  chargeSeconds?: number;
  stowed?: boolean;
  deliveryIds?: RoverSiteId[];
  throttle: number;
  steer: number;
  drillHeld: boolean;
  speed: number;
  batteryWh: number;
  capacityWh: number;
  paused: boolean;
  elapsed: number;
  frames: number;
  remainder: number;
  phaseTime: number;
  drillSite: RoverSiteId | null;
  drillProgress: number;
  heat: number;
  steerAngle: number;
  sampleStage: "aim" | "extract" | "result";
  sampleResult: "success" | "hard" | null;
  aimMisses: number;
  cargo: RoverSiteId[];
  deposited: RoverSiteId[];
  drilled: RoverSiteId[];
  hardSeen: boolean;
  debriefed: boolean;
  talk: "intro" | "setback" | "launch";
  line: number;
  failedReason: "battery" | "hole" | "supplies" | null;
  checkpoint: RoverCheckpoint;
  campTime: number;
  attempts: number;
  assisted: boolean;
  notice:
    | "ready"
    | "rock"
    | "edge"
    | "hard"
    | "sample"
    | "deposit"
    | "checkpoint"
    | "heat"
    | null;
  commands: RoverCommand[];
}
export type RoverCommand =
  | { type: "tour" }
  | { type: "charge"; held: boolean }
  | { type: "upgrade" }
  | { type: "aim" }
  | { type: "continue" }
  | { type: "restart" }
  | { type: "stop" }
  | { type: "talk" }
  | { type: "control"; throttle: number; steer: number; drill: boolean }
  | { type: "advance"; frames: number }
  | { type: "drill" }
  | { type: "cancel" }
  | { type: "unload" }
  | { type: "prepare" }
  | { type: "retry" }
  | { type: "launch" };
export type RoverEvent =
  | { type: "rover-tour" }
  | { type: "rover-charge"; held: boolean }
  | { type: "rover-upgrade" }
  | { type: "rover-aim" }
  | { type: "rover-continue" }
  | { type: "rover-restart" }
  | { type: "rover-talk" }
  | { type: "rover-control"; throttle: number; steer: number; drill: boolean }
  | { type: "rover-tick"; seconds: number; timeScale?: number }
  | { type: "rover-drill" }
  | { type: "rover-cancel" }
  | { type: "rover-unload" }
  | { type: "rover-prepare" }
  | { type: "rover-retry" }
  | { type: "rover-launch" }
  | { type: "rover-input-pause" }
  | { type: "rover-pause" }
  | { type: "rover-resume" };
export const roverAtBase = (s: Pick<RoverState, "x" | "z">) =>
  Math.hypot(s.x - ROVER_BASE.x, s.z - ROVER_BASE.z) < 4;
export const nearbyRoverSite = (
  s: Pick<RoverState, "x" | "z"> & { version?: number },
) => roverSites(s).find((site) => Math.hypot(site.x - s.x, site.z - s.z) < 2.7);
export const roverReady = (s: RoverState | undefined) =>
  !!s &&
  ["ready", "complete"].includes(s.phase) &&
  roverAtBase(s) &&
  new Set(s.deposited).size >= ROVER_MODEL.required &&
  (s.version < 3 || (!!s.stowed && s.hardSeen && s.debriefed));
export function freshRover(
  moon: MoonSession,
  version: 1 | 2 | 3 | 4 = 4,
): RoverState {
  const account = landingResources(moon, moon.landing);
  return {
    version,
    originVersion: version,
    ...(version >= 3
      ? {
          chargeDone: false,
          chargeHeld: false,
          chargeSeconds: 0,
          stowed: false,
          deliveryIds: [],
        }
      : {}),
    steerAngle: 0,
    sampleStage: "aim",
    sampleResult: null,
    aimMisses: 0,
    signature: moon.designSignature,
    phase: "intro",
    deployed: false,
    x: ROVER_BASE.x,
    z: ROVER_BASE.z,
    heading:
      version >= 2
        ? Math.atan2(
            ROVER_SITES[0].x - ROVER_BASE.x,
            -(ROVER_SITES[0].z - ROVER_BASE.z),
          )
        : 0,
    throttle: 0,
    steer: 0,
    drillHeld: false,
    speed: 0,
    batteryWh: account.batteryWh,
    capacityWh: account.capacityWh,
    paused: false,
    elapsed: 0,
    frames: 0,
    remainder: 0,
    phaseTime: 0,
    drillSite: null,
    drillProgress: 0,
    heat: 0,
    cargo: [],
    deposited: [],
    drilled: [],
    hardSeen: false,
    debriefed: false,
    talk: "intro",
    line: 0,
    failedReason: null,
    checkpoint: {
      camp: 0,
      cargo: [],
      deposited: [],
      drilled: [],
      hardSeen: false,
      debriefed: false,
      elapsed: 0,
    },
    campTime: 0,
    attempts: 0,
    assisted: moon.landing.assisted,
    notice: null,
    commands: [],
  };
}
export function roverResources(
  moon: MoonSession,
  s: RoverState,
): MissionResources {
  const base = landingResources(moon, moon.landing),
    cabinW =
      moon.human.approved?.accounting.lifeSupportLoadW ??
      PLATFORM_MODEL.lifeSupportLoadW;
  return {
    ...base,
    batteryWh: s.batteryWh,
    elapsedMissionSeconds: base.elapsedMissionSeconds + s.elapsed,
    platformEnergyWh: Math.max(
      0,
      (base.platformEnergyWh ?? 0) - (cabinW * s.elapsed) / 3600,
    ),
    supportUnitsRemaining: Math.max(
      0,
      (base.supportUnitsRemaining ?? 0) - (3 * s.elapsed) / 86400,
    ),
  };
}
export const stopped = {
  throttle: 0,
  steer: 0,
  drillHeld: false,
  speed: 0,
  chargeHeld: false,
};
export function saveCamp(s: RoverState, camp: number): RoverCheckpoint {
  return {
    camp,
    cargo: [...s.cargo],
    deposited: [...s.deposited],
    drilled: [...s.drilled],
    hardSeen: s.hardSeen,
    debriefed: s.debriefed,
    elapsed: s.elapsed,
    ...(s.version >= 3 ? { chargeDone: s.chargeDone } : {}),
  };
}
export function advance(
  s: RoverState,
  count: number,
  moon: MoonSession,
): RoverState {
  if (s.version >= 2) return advanceArcade(s, count, moon);
  let next = { ...s };
  for (let i = 0; i < count; i++) {
    if (
      next.paused ||
      ![
        "deploying",
        "exploring",
        "drilling",
        "collecting",
        "boarding",
      ].includes(next.phase)
    )
      break;
    const dt = ROVER_MODEL.step;
    next = {
      ...next,
      frames: next.frames + 1,
      elapsed: next.elapsed + dt * ROVER_MODEL.virtualRate,
      phaseTime: next.phaseTime + dt,
    };
    if (next.phase === "deploying") {
      if (next.phaseTime >= 3)
        next = {
          ...next,
          deployed: true,
          phase: "exploring",
          phaseTime: 0,
          notice: "ready",
        };
      continue;
    }
    if (next.phase === "boarding") {
      if (next.phaseTime >= 4)
        next = { ...next, phase: "ready", phaseTime: 0, ...stopped };
      continue;
    }
    const light = roverLight(next.x, next.z),
      drilling = next.phase === "drilling";
    const rate = light
      ? drilling
        ? 0.4
        : Math.abs(next.throttle) > 0
          ? 0.23
          : 0.035
      : drilling
        ? 1.15
        : 0.9;
    next.batteryWh = Math.max(
      0,
      next.batteryWh - ((next.capacityWh * rate) / 100) * dt,
    );
    const account = roverResources(moon, next);
    if (
      next.batteryWh <= 0 ||
      (account.supportUnitsRemaining ?? 0) < 12 ||
      (account.platformEnergyWh ?? 0) < 600 * 72
    ) {
      next = {
        ...next,
        phase: "failed",
        failedReason: next.batteryWh <= 0 ? "battery" : "supplies",
        ...stopped,
      };
      break;
    }
    if (drilling) {
      const site = ROVER_SITES.find((site) => site.id === next.drillSite)!;
      if (next.drillHeld && next.heat < 1) {
        next.drillProgress += dt;
        next.heat = Math.min(1, next.heat + dt * 0.13);
      } else next.heat = Math.max(0, next.heat - dt * 0.35);
      if (site.hard && next.drillProgress >= 3)
        next = {
          ...next,
          phase: "exploring",
          hardSeen: true,
          drilled: [...new Set([...next.drilled, site.id])],
          drillProgress: 0,
          notice: "hard",
          ...stopped,
        };
      else if (next.drillProgress >= ROVER_MODEL.drillSeconds)
        next = {
          ...next,
          phase: "exploring",
          cargo: [...new Set([...next.cargo, site.id])],
          drilled: [...new Set([...next.drilled, site.id])],
          drillProgress: 0,
          notice: "sample",
          ...stopped,
        };
      continue;
    }
    next.heading += next.steer * ROVER_MODEL.turn * dt;
    next.speed += (next.throttle * ROVER_MODEL.speed - next.speed) * 0.5;
    if (Math.abs(next.speed) < 0.02) next.speed = 0;
    const x = next.x + Math.sin(next.heading) * next.speed * dt,
      z = next.z - Math.cos(next.heading) * next.speed * dt;
    const rock = ROVER_ROCKS.find(
      (rock) =>
        Math.hypot(x - rock.x, z - rock.z) < rock.radius + ROVER_MODEL.radius,
    );
    if (Math.abs(x) > ROVER_MODEL.bounds || Math.abs(z) > ROVER_MODEL.bounds)
      next = { ...next, speed: 0, notice: "edge" };
    else if (rock) next = { ...next, speed: 0, notice: "rock" };
    else {
      next.x = x;
      next.z = z;
      if (next.notice === "rock" || next.notice === "edge") next.notice = null;
    }
    if (
      ROVER_HOLES.some(
        (hole) =>
          Math.hypot(next.x - hole.x, next.z - hole.z) < hole.radius - 0.35,
      )
    ) {
      next = { ...next, phase: "failed", failedReason: "hole", ...stopped };
      break;
    }
    const camp = ROVER_CAMPS.findIndex(
      (camp) => Math.hypot(camp.x - next.x, camp.z - next.z) < 3.5,
    );
    if (camp >= 0 && next.throttle === 0 && Math.abs(next.speed) < 0.1) {
      next.campTime += dt;
      next.batteryWh = Math.min(
        next.capacityWh,
        next.batteryWh + next.capacityWh * 0.035 * dt,
      );
      if (
        next.campTime >= 1 &&
        (next.checkpoint.elapsed === 0 ||
          next.checkpoint.camp !== camp ||
          next.checkpoint.cargo.join() !== next.cargo.join() ||
          next.checkpoint.drilled.join() !== next.drilled.join())
      )
        next = {
          ...next,
          checkpoint: saveCamp(next, camp),
          notice: "checkpoint",
        };
    } else next.campTime = 0;
  }
  return next;
}
export const roverAim = (s: Pick<RoverState, "phaseTime">) =>
  1 - Math.abs(((s.phaseTime * 0.72) % 2) - 1);
export const roverRocks = (s: Pick<RoverState, "version">) =>
  s.version >= 2 ? COURSE_ROCKS : ROVER_ROCKS;
export const roverHoles = (s: Pick<RoverState, "version">) =>
  s.version >= 2 ? COURSE_HOLES : ROVER_HOLES;
export const roverElevation = (
  s: Pick<RoverState, "version">,
  x: number,
  z: number,
) => (s.version >= 2 ? courseHeight(x, z) : roverHeight(x, z));

export function roverGoal(s: RoverState) {
  if (s.cargo.length)
    return {
      ...ROVER_BASE,
      kind: "base" as const,
      label: "Bring the sample back to base",
    };
  if (s.deposited.length === 0)
    return {
      ...RUN_SITES[0],
      kind: "sample" as const,
      label: "Collect the sunlit sample",
    };
  if (!s.hardSeen)
    return {
      ...RUN_SITES[1],
      kind: "sample" as const,
      label: "Investigate the shadow outcrop",
    };
  if (s.deposited.length < 2)
    return {
      ...RUN_SITES[2],
      kind: "sample" as const,
      label: "Collect at the nearby shadow edge",
    };
  return {
    ...ROVER_BASE,
    kind: s.stowed ? ("launch" as const) : ("stow" as const),
    label: s.stowed
      ? "Samples secured. Ready for ascent."
      : "Return to base and park the rover inside",
  };
}
export function visibleRoverSites(s: RoverState) {
  if (s.version < 3) return [...ROVER_SITES];
  const goal = roverGoal(s);
  return goal.kind === "sample"
    ? RUN_SITES.filter((site) => site.id === goal.id)
    : [];
}
export function advanceArcade(
  s: RoverState,
  count: number,
  moon: MoonSession,
): RoverState {
  let next = { ...s };
  const dt = 0.05;
  for (let i = 0; i < count; i++) {
    if (next.paused || !roverActive(next)) break;
    next = {
      ...next,
      frames: next.frames + 1,
      elapsed:
        next.elapsed +
        dt *
          (next.version === 4
            ? next.phase === "charging"
              ? 600
              : next.phase === "collecting"
                ? 120
                : ROVER_MODEL.virtualRate
            : ROVER_MODEL.virtualRate),
      phaseTime: next.phaseTime + dt,
    };
    if (next.phase === "deploying") {
      if (next.phaseTime >= 3)
        next = {
          ...next,
          deployed: true,
          phase: "exploring",
          phaseTime: 0,
          notice: "ready",
        };
      continue;
    }
    if (next.phase === "boarding") {
      if (next.phaseTime >= 4)
        next = { ...next, phase: "ready", phaseTime: 0, ...stopped };
      continue;
    }
    if (next.version >= 3 && next.phase === "charging") {
      if (!next.chargeHeld) {
        next = { ...next, phase: "exploring", phaseTime: 0, ...stopped };
        continue;
      }
      next.chargeSeconds = (next.chargeSeconds ?? 0) + dt;
      next.batteryWh =
        next.version === 4
          ? batteryStep(
              next.batteryWh,
              next.capacityWh,
              roverPower(moon, "charging", roverLight(next.x, next.z)).loadW,
              roverPower(moon, "charging", roverLight(next.x, next.z)).solarW,
              dt * 600,
            ).remainingWh
          : Math.min(
              next.capacityWh,
              next.batteryWh + next.capacityWh * 0.17 * dt,
            );
      if (next.chargeSeconds >= 2 && next.batteryWh >= next.capacityWh * 0.95) {
        next = {
          ...next,
          chargeDone: true,
          phase: "exploring",
          phaseTime: 0,
          notice: "checkpoint",
          ...stopped,
        };
        next.checkpoint = saveCamp(next, 2);
      }
      continue;
    }
    if (next.version >= 3 && next.phase === "delivering") {
      if (next.phaseTime >= 3.8) {
        next = {
          ...next,
          phase: "delivery-result",
          phaseTime: 0,
          deposited: [
            ...new Set([...next.deposited, ...(next.deliveryIds ?? [])]),
          ],
          cargo: [],
          notice: "deposit",
          ...stopped,
        };
        next.checkpoint = saveCamp(next, 0);
      }
      continue;
    }
    if (next.version >= 3 && next.phase === "stowing") {
      if (next.phaseTime >= 6) {
        next = {
          ...next,
          stowed: true,
          phase: "cabin",
          talk: "launch",
          line: 0,
          phaseTime: 0,
          ...stopped,
        };
        next.checkpoint = saveCamp(next, 0);
      }
      continue;
    }
    const rate =
      next.version >= 3
        ? next.phase !== "exploring"
          ? 0
          : roverLight(next.x, next.z)
            ? Math.abs(next.speed) > 0.1
              ? 0.6
              : 0.02
            : Math.abs(next.speed) > 0.1
              ? 1.35
              : 0.4
        : roverLight(next.x, next.z)
          ? next.phase === "collecting"
            ? 0.4
            : Math.abs(next.speed) > 0.1
              ? 0.2
              : 0.025
          : next.phase === "collecting"
            ? 1.1
            : 0.75;
    if (next.version === 4) {
      const mode =
          next.phase === "collecting"
            ? "drilling"
            : next.phase === "drilling"
              ? "analysis"
              : Math.abs(next.speed) > 0.1
                ? "traverse"
                : "standby",
        power = roverPower(moon, mode, roverLight(next.x, next.z));
      next.batteryWh = batteryStep(
        next.batteryWh,
        next.capacityWh,
        power.loadW,
        0, // Reserve solar charging for stationary panel deployment.
        dt * (next.phase === "collecting" ? 120 : ROVER_MODEL.virtualRate),
      ).remainingWh;
    } else
      next.batteryWh = Math.max(
        0,
        next.batteryWh - ((next.capacityWh * rate) / 100) * dt,
      );
    const account = roverResources(moon, next);
    if (
      next.batteryWh <= 0 ||
      (account.supportUnitsRemaining ?? 0) < 12 ||
      (account.platformEnergyWh ?? 0) < 600 * 72
    ) {
      next = {
        ...next,
        phase: "failed",
        failedReason: next.batteryWh <= 0 ? "battery" : "supplies",
        ...stopped,
      };
      break;
    }
    if (next.phase === "drilling") continue;
    if (next.phase === "collecting") {
      next.drillProgress = next.phaseTime;
      if (
        next.phaseTime >=
        (next.version === 4 ? 2.6 + roverCapability(moon).depth / 40 : 2.6)
      ) {
        const site = roverSites(next).find(
          (site) => site.id === next.drillSite,
        )!;
        next = {
          ...next,
          phase: "sample-result",
          sampleStage: "result",
          sampleResult: site.hard ? "hard" : "success",
          hardSeen: next.hardSeen || site.hard,
          cargo: site.hard
            ? next.cargo
            : [...new Set([...next.cargo, site.id])],
          drilled: [...new Set([...next.drilled, site.id])],
          notice: site.hard ? "hard" : "sample",
          phaseTime: 0,
          ...stopped,
        };
        if (next.version === 4 && !site.hard)
          next.sampleTimes = { ...next.sampleTimes, [site.id]: next.elapsed };
        if (next.version >= 3 && site.hard) next.checkpoint = saveCamp(next, 2);
      }
      continue;
    }
    const speed = next.speed,
      forward = { x: Math.sin(next.heading), z: -Math.cos(next.heading) },
      grade =
        (courseHeight(next.x + forward.x, next.z + forward.z) -
          courseHeight(next.x - forward.x, next.z - forward.z)) /
        2;
    const top =
        ROVER_MODEL.gameplaySpeed *
        Math.max(
          0.5,
          1 -
            Math.abs(grade) *
              (next.version === 4 ? 1.2 / roverCapability(moon).terrain : 0.45),
        ),
      target = next.throttle > 0 ? top : next.throttle < 0 ? -3.2 : 0;
    const braking =
      next.throttle !== 0 &&
      Math.sign(next.throttle) !== Math.sign(speed) &&
      Math.abs(speed) > 0.1;
    const acceleration = braking ? 12 : next.throttle === 0 ? 6 : 5;
    next.speed =
      speed +
      Math.max(-acceleration * dt, Math.min(acceleration * dt, target - speed));
    if (Math.abs(next.speed) < 0.04) next.speed = 0;
    next.steerAngle +=
      (next.steer * 0.55 * (1 - 0.2 * Math.min(1, Math.abs(next.speed) / 7.5)) -
        next.steerAngle) *
      0.45;
    next.heading += (next.speed / 2.1) * Math.tan(next.steerAngle) * dt;
    const x = next.x + Math.sin(next.heading) * next.speed * dt,
      z = next.z - Math.cos(next.heading) * next.speed * dt;
    const blocked = COURSE_ROCKS.some(
      (rock) =>
        Math.hypot(x - rock.x, z - rock.z) <
        rock.radius + (next.version >= 3 ? 0.85 : ROVER_MODEL.radius),
    );
    if (Math.abs(x) > ROVER_MODEL.bounds || Math.abs(z) > ROVER_MODEL.bounds)
      next = { ...next, speed: 0, notice: "edge" };
    else if (blocked) next = { ...next, speed: 0, notice: "rock" };
    else {
      next.x = x;
      next.z = z;
      if (next.notice === "rock" || next.notice === "edge") next.notice = null;
    }
    if (
      COURSE_HOLES.some(
        (hole) =>
          Math.hypot(next.x - hole.x, next.z - hole.z) < hole.radius - 0.35,
      )
    ) {
      next = { ...next, phase: "failed", failedReason: "hole", ...stopped };
      break;
    }
    const camp = ROVER_CAMPS.findIndex(
      (camp) => Math.hypot(camp.x - next.x, camp.z - next.z) < 3.5,
    );
    if (camp >= 0 && next.throttle === 0 && Math.abs(next.speed) < 0.1) {
      next.campTime += dt;
      if (next.version < 3)
        next.batteryWh = Math.min(
          next.capacityWh,
          next.batteryWh + next.capacityWh * 0.035 * dt,
        );
      if (
        next.campTime >= 1 &&
        (next.checkpoint.elapsed === 0 ||
          next.checkpoint.camp !== camp ||
          next.checkpoint.cargo.join() !== next.cargo.join() ||
          next.checkpoint.drilled.join() !== next.drilled.join())
      )
        next = {
          ...next,
          checkpoint: saveCamp(next, camp),
          notice: "checkpoint",
        };
    } else next.campTime = 0;
  }
  return next;
}
