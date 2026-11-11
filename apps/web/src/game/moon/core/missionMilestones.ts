import { getStoryStep } from "./flow";
import type { StoryStepId } from "./types";
import type { WorkshopSession } from "@/game/moon/workshop/lander/workshopSession";

export const MILESTONES = [
  {
    id: "plan",
    name: "Plan",
    caption: "Choose your Moon mission",
    icon: "compass",
    steps: [
      "player-name",
      "appointment",
      "companion-intro",
      "destination",
      "objective-briefing",
      "objective",
      "site-briefing",
      "site",
      "resource-briefing",
    ],
  },
  {
    id: "build",
    name: "Build",
    caption: "Create your explorer",
    icon: "rover",
    steps: [
      "resource-limits",
      "lander-build",
      "rover-select",
      "science-build",
      "power-build",
      "survival-build",
    ],
  },
  {
    id: "prepare",
    name: "Prepare",
    caption: "Crew up and test",
    icon: "crew",
    steps: [
      "crew-briefing",
      "crew-selection",
      "crew-plan",
      "crew-check",
      "mass-check",
      "power-check",
      "budget-check",
      "systems-check",
      "stress-check",
    ],
  },
  {
    id: "rocket",
    name: "Rocket",
    caption: "Pack and assemble",
    icon: "rocket",
    steps: ["rocket-pack", "rocket-assembly", "launch-ready"],
  },
  {
    id: "fly",
    name: "Fly",
    caption: "Reach lunar orbit",
    icon: "orbit",
    steps: ["liftoff", "earth-orbit", "moon-transfer", "lunar-orbit"],
  },
  {
    id: "explore",
    name: "Explore",
    caption: "Land and scout",
    icon: "flag",
    steps: [
      "lunar-descent",
      "lunar-surface",
      "surface-explore",
      "surface-ready",
    ],
  },
  {
    id: "discover",
    name: "Discover",
    caption: "Find and protect evidence",
    icon: "science",
    steps: [
      "ice-science",
      "science-ready",
      "surface-recovery",
      "surface-secured",
    ],
  },
  {
    id: "home",
    name: "Home",
    caption: "Bring everyone home",
    icon: "earth",
    steps: ["crew-return", "mission-debrief"],
  },
] as const satisfies readonly {
  id: string;
  name: string;
  caption: string;
  icon: string;
  steps: readonly StoryStepId[];
}[];
export type MilestoneId = (typeof MILESTONES)[number]["id"];
export interface MilestoneState {
  introduced: boolean;
  celebrated: MilestoneId[];
  pending?: MilestoneId;
}
export function milestoneFor(step: StoryStepId) {
  return MILESTONES.find((m) => (m.steps as readonly string[]).includes(step))!;
}
export function restoreMilestones(
  raw: unknown,
  step: StoryStepId,
): MilestoneState {
  const data =
    raw && typeof raw === "object" ? (raw as Partial<MilestoneState>) : {};
  const valid = (id: unknown): id is MilestoneId =>
    MILESTONES.some((m) => m.id === id);
  return {
    introduced: data.introduced === true || step !== "player-name",
    celebrated: Array.isArray(data.celebrated)
      ? [...new Set(data.celebrated.filter(valid))]
      : [],
    ...(valid(data.pending) ? { pending: data.pending } : {}),
  };
}

/** Displayed progress measures the current chapter, never science points. */
export function milestoneProgress(s: WorkshopSession) {
  const m = milestoneFor(s.progress.stepId),
    step = getStoryStep(s.progress.stepId, s.progress.selections.objective);
  let fraction = 0;
  if (step.kind === "conversation")
    fraction = s.progress.lineIndex / Math.max(1, step.lines.length);
  if (step.kind === "choice" && s.progress.selections[step.choiceKey])
    fraction = 1;
  if (
    step.kind === "activity" &&
    s.progress.completedActivities.includes(step.activity)
  )
    fraction = 1;
  const p = s.preparation,
    h = s.moon.human;
  switch (step.id) {
    case "lander-build":
      fraction = p.landerPartIds.length / 6;
      break;
    case "rover-select":
      fraction = p.roverId ? 1 : 0;
      break;
    case "science-build":
      fraction = Math.max(
        fraction,
        Math.min(
          0.9,
          p.sciencePartIds.length /
            (s.moon.objective === "lunar-geology" ? 4 : 3),
        ),
      );
      break;
    case "power-build":
      fraction = (Number(!!p.solarId) + Number(!!p.batteryId)) / 2;
      break;
    case "survival-build":
      fraction =
        (Number(!!p.navigationId) +
          Number(!!p.thermalId) +
          Number(!!p.communicationId)) /
        3;
      break;
    case "rocket-assembly":
      fraction = h.rocketBuild.installed.length / 11;
      break;
    case "rocket-pack":
      fraction = h.packing.length / 3;
      break;
    case "systems-check":
      fraction = h.connected.length / 4;
      break;
    case "stress-check":
      fraction = h.stress.passed.length / 4;
      break;
    case "crew-selection":
      fraction =
        Number(!!s.moon.crew.scientist) / 2 + Number(!!s.moon.crew.support) / 2;
      break;
    case "liftoff":
      fraction = s.flight.t / 38;
      break;
    case "power-check": {
      const t = s.readiness.trial;
      fraction = Math.max(
        fraction,
        t.phase === "complete"
          ? 1
          : t.phase === "returning"
            ? (2 + t.progress) / 3
            : t.phase === "sampled"
              ? 2 / 3
              : t.phase === "drilling"
                ? (1 + t.progress) / 3
                : t.phase === "at-sample"
                  ? 1 / 3
                  : t.phase === "outbound"
                    ? t.progress / 3
                    : 0,
      );
      break;
    }
    case "moon-transfer": {
      const j = s.moon.journey;
      fraction =
        j.stage === "complete"
          ? 1
          : j.stage === "loi-burn"
            ? 0.75 + (0.25 * j.elapsed) / 3
            : j.stage === "loi-window"
              ? 0.75
              : j.stage === "coast"
                ? 0.35 + (0.4 * j.elapsed) / 14
                : j.stage === "tli-burn"
                  ? 0.1 + (0.25 * j.elapsed) / 3
                  : 0;
      break;
    }
    case "lunar-orbit":
      fraction = s.moon.journey.stage === "complete" ? 1 : 0;
      break;
    case "lunar-descent":
      fraction =
        s.moon.landing.stage === "landed"
          ? 1
          : Math.min(0.95, Math.max(0, (130 - s.moon.landing.height) / 130));
      break;
    case "lunar-surface":
      fraction = s.moon.surface.deployed ? 1 : s.moon.surface.phaseFrame / 30;
      break;
    case "surface-explore":
      fraction = s.moon.rover
        ? Math.min(1, s.moon.rover.deposited.length / 2)
        : Math.min(0.9, s.moon.surface.visited.length / 4);
      break;
    case "ice-science":
      fraction = Math.max(
        fraction,
        s.moon.science.committed
          ? 1
          : s.moon.science.records.length
            ? 0.75
            : s.moon.science.phase === "plan"
              ? 0
              : 0.25,
      );
      break;
    case "surface-recovery":
      fraction =
        (Number(s.moon.science.hazards.roverParked) +
          Number(s.moon.science.hazards.dataArchived) +
          Number(s.moon.science.hazards.crewChecked)) /
        3;
      break;
    case "crew-return": {
      const stages = [
        "ready",
        "ascending",
        "rendezvous",
        "docked",
        "burning",
        "coast",
        "entry-ready",
        "entry",
        "chute-ready",
        "chutes",
        "splashdown",
      ];
      fraction = stages.indexOf(s.moon.returnFlight.stage) / 10;
      break;
    }
    case "launch-ready":
      fraction = h.approved ? 1 : 0;
      break;
    case "mission-debrief":
      fraction = 1;
      break;
  }
  const index = (m.steps as readonly string[]).indexOf(step.id);
  const percent = Math.floor(
    ((index + Math.max(0, Math.min(1, fraction))) / m.steps.length) * 100,
  );
  return {
    milestone: m,
    index: MILESTONES.indexOf(m),
    percent: Math.min(100, percent),
  };
}

/** Reducer replays used by demos stay free of presentation gates. */
export function trackMilestoneTransition(
  previous: WorkshopSession,
  next: WorkshopSession,
): WorkshopSession {
  if (
    previous.review ||
    next.review ||
    previous.progress.stepId === next.progress.stepId
  )
    return next;
  const from = milestoneFor(previous.progress.stepId),
    to = milestoneFor(next.progress.stepId);
  const state =
    next.progress.milestones ??
    restoreMilestones(undefined, next.progress.stepId);
  const forward =
    MILESTONES.indexOf(to) > MILESTONES.indexOf(from) ||
    (next.progress.stepId === "mission-debrief" &&
      previous.progress.stepId === "crew-return");
  if (!forward) return next;
  const finalReturn =
    previous.progress.stepId === "crew-return" &&
    next.progress.stepId === "mission-debrief";
  return {
    ...next,
    progress: {
      ...next.progress,
      milestones: finalReturn
        ? {
            ...state,
            introduced: true,
            pending: undefined,
            celebrated: [...new Set([...state.celebrated, from.id])],
          }
        : { ...state, introduced: true, pending: from.id },
    },
  };
}
