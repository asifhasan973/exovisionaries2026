import { setDebugSessionSeeder } from "@exo/debug";
import { STORY_FLOW, getStoryStep } from "../core/flow";
import type {
  StoryStepId,
  ActivityId,
  PlayerGender,
  ChoiceId,
} from "../core/types";
import type { MoonObjective } from "../shared/catalog";
import { createStoryProgress, reduceStoryProgress } from "../core/progress";
import { quickPreparation } from "../core/preparation";
import {
  createWorkshopSession,
  type WorkshopSession,
} from "../workshop/lander/workshopSession";
import { createBaseMission } from "../core/baseMission";
import { createReadinessDemo } from "../flight/journey/journeyDemo";
import { emptyLanding, LANDING_MODEL } from "../landing/landing";
import { freshSurface } from "../surface/surface";
import { freshScience } from "../science/science";
import { freshReturn } from "../return/return";
import { emptyIncidents } from "../hazards/incidents";
import { randomInitialAngle, routeReport } from "../flight/journey/journey";
import { FLIGHT_DURATION } from "../flight/launch/flight";
import { departureResources } from "../shared/validation";

export interface DebugSessionOptions {
  objective?: MoonObjective;
  gender?: PlayerGender;
  site?: ChoiceId;
  playerName?: string;
}

/**
 * Returns all activities that canonically precede the given story step.
 */
export function getCompletedActivitiesUpToStep(
  targetStepId: StoryStepId,
): ActivityId[] {
  const targetIndex = STORY_FLOW.findIndex((item) => item.id === targetStepId);
  if (targetIndex <= 0) return [];

  const completed: ActivityId[] = [];
  for (let i = 0; i < targetIndex; i++) {
    const item = STORY_FLOW[i];
    if (
      item.kind === "activity" &&
      item.activity &&
      !completed.includes(item.activity)
    ) {
      completed.push(item.activity);
    }
  }
  return completed;
}

/**
 * Finalizes session by preserving player selections, name, gender, and setting stepId.
 */
function finalizeSession(
  session: WorkshopSession,
  targetStepId: string,
  options?: DebugSessionOptions,
): WorkshopSession {
  const objective: MoonObjective = options?.objective ?? "lunar-ice";
  const gender: PlayerGender = options?.gender ?? "female";
  const defaultSite: ChoiceId =
    objective === "lunar-ice" ? "crater-rim" : "lunar-highlands";
  const site: ChoiceId = options?.site ?? defaultSite;
  const playerName = options?.playerName ?? "Charlie";

  const targetStep = getStoryStep(targetStepId as StoryStepId, objective);
  const moduleNum = targetStep.module;

  const selections: Record<string, string> = { ...session.progress.selections };
  if (
    moduleNum > 1 ||
    [
      "objective-briefing",
      "objective",
      "site-briefing",
      "site",
      "resource-briefing",
    ].includes(targetStepId)
  ) {
    selections.destination = selections.destination || "moon";
  }
  if (
    options?.objective &&
    (moduleNum > 1 ||
      ["site-briefing", "site", "resource-briefing"].includes(targetStepId))
  ) {
    selections.objective = options.objective;
  } else if (
    moduleNum > 1 ||
    ["site-briefing", "site", "resource-briefing"].includes(targetStepId)
  ) {
    selections.objective = selections.objective || objective;
  }

  if (
    options?.site &&
    (moduleNum > 1 || ["resource-briefing"].includes(targetStepId))
  ) {
    selections.site = options.site;
  } else if (moduleNum > 1 || ["resource-briefing"].includes(targetStepId)) {
    selections.site = selections.site || site;
  }

  const priorActivities = getCompletedActivitiesUpToStep(
    targetStepId as StoryStepId,
  );

  return {
    ...session,
    progress: {
      ...session.progress,
      stepId: targetStepId as StoryStepId,
      lineIndex: 0,
      playerName:
        options?.playerName ?? session.progress.playerName ?? playerName,
      playerGender: options?.gender ?? session.progress.playerGender ?? gender,
      selections,
      completedActivities: [
        ...new Set([
          ...(session.progress.completedActivities ?? []),
          ...priorActivities,
        ]),
      ],
    },
  };
}

/**
 * Smart Auto-Seeded Ephemeral Session:
 * Seeds fully valid, realistic upstream game states (hardware, crew assignments, checks, physics checkpoints)
 * so that any mid/late-mission stage opens completely populated and interactive without crashes.
 *
 * Supports optional context preservation so skipping in-game keeps the player's chosen narrative path,
 * while debug tool hopping initializes clean defaults.
 */
export function createDebugSession(
  stepId: string,
  options?: DebugSessionOptions,
): WorkshopSession {
  const rawSession = createDebugSessionInternal(stepId, options);
  return finalizeSession(rawSession, stepId, options);
}

function createDebugSessionInternal(
  stepId: string,
  options?: DebugSessionOptions,
): WorkshopSession {
  const objective: MoonObjective = options?.objective ?? "lunar-ice";
  const gender: PlayerGender = options?.gender ?? "female";
  const defaultSite: ChoiceId =
    objective === "lunar-ice" ? "crater-rim" : "lunar-highlands";
  const site: ChoiceId = options?.site ?? defaultSite;
  const playerName = options?.playerName ?? "Charlie";

  // 1. Validate if step exists
  let targetStep;
  try {
    targetStep = getStoryStep(stepId as StoryStepId, objective);
  } catch {
    targetStep = STORY_FLOW[0];
  }

  const validStepId = targetStep.id;
  const moduleNum = targetStep.module;

  // Module 01: Initial Briefings & Mission Choices
  if (moduleNum === 1) {
    let progress = createStoryProgress();
    progress = reduceStoryProgress(progress, {
      type: "set-name",
      name: playerName,
      gender,
    });
    if (
      [
        "destination",
        "objective-briefing",
        "objective",
        "site-briefing",
        "site",
        "resource-briefing",
      ].includes(validStepId)
    ) {
      progress = reduceStoryProgress(progress, {
        type: "select",
        choiceId: "moon",
      });
    }
    if (["site-briefing", "site", "resource-briefing"].includes(validStepId)) {
      progress = reduceStoryProgress(progress, {
        type: "select",
        choiceId: objective,
      });
      progress = reduceStoryProgress(progress, {
        type: "select",
        choiceId: site,
      });
    }
    progress = { ...progress, stepId: validStepId, lineIndex: 0 };
    return createWorkshopSession(progress);
  }

  // Module 02: Spacecraft & Rover Workshop
  if (moduleNum === 2) {
    const preparation = quickPreparation(objective);
    let progress = createStoryProgress();
    progress = reduceStoryProgress(progress, {
      type: "set-name",
      name: playerName,
      gender,
    });
    progress = reduceStoryProgress(progress, {
      type: "select",
      choiceId: "moon",
    });
    progress = reduceStoryProgress(progress, {
      type: "select",
      choiceId: objective,
    });
    progress = reduceStoryProgress(progress, {
      type: "select",
      choiceId: site,
    });

    const workshopOrder: ActivityId[] = [
      "resource-limits",
      "lander-build",
      "rover-select",
      "science-build",
      "power-build",
      "survival-build",
    ];
    const currentIndex = workshopOrder.indexOf(validStepId as ActivityId);
    const completedActivities =
      currentIndex > 0 ? workshopOrder.slice(0, currentIndex) : [];

    progress = {
      ...progress,
      stepId: validStepId,
      lineIndex: 0,
      completedActivities,
      milestones: { introduced: true, celebrated: [] },
    };
    return createWorkshopSession(progress, preparation);
  }

  // Module 03: Astronaut Crew Selection & Mission Plan
  if (moduleNum === 3) {
    const preparation = quickPreparation(objective);
    const session = createBaseMission(gender, objective, {
      preparation,
      playerName,
    });
    session.progress = {
      ...session.progress,
      stepId: validStepId,
      lineIndex: 0,
      milestones: { introduced: true, celebrated: [] },
    };

    if (validStepId === "crew-plan") {
      // Crew must be assigned so crewReport.complete is true and Next is enabled
      const scientistId =
        objective === "lunar-ice" ? "astrobiologist" : "geologist";
      const supportId = "robotics-specialist";
      session.moon = {
        ...session.moon,
        crew: {
          ...session.moon.crew,
          scientist: scientistId,
          support: supportId,
        },
      };
      return session;
    }
    return session;
  }

  // Module 04: Flight Readiness & Pre-Flight Checklist
  if (moduleNum === 4) {
    const session = createReadinessDemo(gender, objective, validStepId, {
      preparation: quickPreparation(objective),
      playerName,
    });
    session.progress = {
      ...session.progress,
      stepId: validStepId,
      lineIndex: 0,
      milestones: {
        introduced: true,
        celebrated: session.progress.milestones?.celebrated ?? [],
      },
    };
    return session;
  }

  // Module 05: Liftoff & Earth Orbit Ascent
  if (moduleNum === 5) {
    const session = createReadinessDemo(gender, objective, "liftoff", {
      preparation: quickPreparation(objective),
      playerName,
    });
    session.progress = {
      ...session.progress,
      stepId: "liftoff",
      lineIndex: 0,
      milestones: {
        introduced: true,
        celebrated: session.progress.milestones?.celebrated ?? [],
      },
    };
    return session;
  }

  // Helper to construct a robust base flight-ready session with all hardware, crew, and authorizations signed
  const createFlightBase = () => {
    const s = createReadinessDemo(gender, objective, "liftoff", {
      preparation: quickPreparation(objective),
      playerName,
    });
    s.flight = {
      ...s.flight,
      signature: s.moon.designSignature,
      status: "complete",
      t: FLIGHT_DURATION,
      events: ["booster", "fairing"],
      skipped: true,
    };
    s.moon = {
      ...s.moon,
      launchSnapshot: {
        signature: s.moon.designSignature,
        platformId: s.moon.human.approved?.platformId ?? "crewed-lander",
        equipmentIds: s.moon.human.approved?.equipment.map((p) => p.id) ?? [],
        crew: s.moon.crew,
      },
    };
    const res = departureResources(s.moon, s.preparation);
    s.moon.checkpoints = [
      {
        id: "pre-departure",
        phase: "validate",
        designSignature: s.moon.designSignature,
        resources: { ...res },
      },
    ];
    return s;
  };

  // Module 06: Orbit & Trans-Lunar Injection
  if (moduleNum === 6) {
    const s = createFlightBase();
    s.moon.phase =
      validStepId === "earth-orbit"
        ? "earth-orbit"
        : validStepId === "moon-transfer"
          ? "transfer"
          : "lunar-orbit";
    const report = routeReport(s.moon, "balanced");

    if (validStepId === "earth-orbit") {
      s.moon.journey = {
        ...s.moon.journey,
        signature: s.moon.designSignature,
        stage: "tli-burn",
        version: 2,
        route: "balanced",
        angle: randomInitialAngle(),
        throttle: 0.5,
        firing: false,
        dv: 0,
        radialDv: 0,
      };
      s.progress = { ...s.progress, stepId: "earth-orbit", lineIndex: 0 };
      return s;
    }

    if (validStepId === "moon-transfer") {
      s.moon.journey = {
        ...s.moon.journey,
        signature: s.moon.designSignature,
        stage: "coast",
        version: 2,
        route: "balanced",
        burns: ["tli"],
        dv: report.tliMS,
        radialDv: 0,
        firing: false,
      };
      s.progress = { ...s.progress, stepId: "moon-transfer", lineIndex: 0 };
      return s;
    }

    s.moon.journey = {
      ...s.moon.journey,
      signature: s.moon.designSignature,
      stage: "complete",
      version: 2,
      route: "balanced",
      burns: ["tli", "loi"],
      dv: report.tliMS + report.loiMS,
      radialDv: 0,
      firing: false,
    };
    s.progress = { ...s.progress, stepId: "lunar-orbit", lineIndex: 0 };
    return s;
  }

  // Module 07: Lunar Descent & Touchdown
  if (moduleNum === 7) {
    const s = createFlightBase();
    s.moon.journey = {
      ...s.moon.journey,
      signature: s.moon.designSignature,
      stage: "complete",
      route: "balanced",
      burns: ["tli", "loi"],
    };
    s.moon.landing = {
      ...emptyLanding(),
      signature: s.moon.designSignature,
      stage: "descending",
      mode: "medium",
      target: "left",
      hazardSeen: true,
      decisionPending: false,
      height: LANDING_MODEL.initialHeight,
      vy: -5.5,
      x: -12,
      vx: 0,
      fuelKg: 420,
      throttle: 0.3,
      commands: [],
    };
    s.moon.phase = "descent";
    s.progress = {
      ...s.progress,
      stepId: "lunar-descent",
      lineIndex: 0,
      milestones: {
        introduced: true,
        celebrated: s.progress.milestones?.celebrated ?? [],
      },
    };
    return s;
  }

  // Module 08: Lunar Surface Deployment & Exploration
  if (moduleNum === 8) {
    const s = createFlightBase();
    s.moon.journey = {
      ...s.moon.journey,
      signature: s.moon.designSignature,
      stage: "complete",
      route: "balanced",
      burns: ["tli", "loi"],
    };
    s.moon.landing = {
      ...emptyLanding(),
      signature: s.moon.designSignature,
      stage: "landed",
      mode: "medium",
      target: "left",
      x: -45,
      height: 0,
      vx: 0,
      vy: 0,
      fuelKg: 350,
      commands: [],
    };
    s.moon.phase = "surface";

    const isExplore = validStepId === "surface-explore";
    const isReady = validStepId === "surface-ready";

    s.moon.surface = {
      ...freshSurface(s.moon),
      signature: s.moon.designSignature,
      stage: isExplore ? "driving" : "idle",
      location: isReady ? "lookout" : "base",
      deployed: validStepId !== "lunar-surface",
      crewSheltered: true,
      visited: isReady
        ? objective === "lunar-geology"
          ? ["base", "lookout"]
          : ["base", "lookout", "edge"]
        : ["base"],
      traversed: isReady
        ? objective === "lunar-geology"
          ? ["base-lookout"]
          : ["base-lookout", "lookout-edge"]
        : [],
      batteryWh: s.moon.resources.capacityWh || 800,
    };
    s.progress = {
      ...s.progress,
      stepId: validStepId as StoryStepId,
      lineIndex: 0,
    };
    return s;
  }

  // Module 09: Ice Drilling & Spectrometry Science
  if (moduleNum === 9) {
    const s = createFlightBase();
    s.moon.landing = {
      ...emptyLanding(),
      signature: s.moon.designSignature,
      stage: "landed",
      mode: "medium",
      target: "left",
      x: -45,
      height: 0,
      vx: 0,
      vy: 0,
      fuelKg: 350,
      commands: [],
    };
    s.moon.phase = "surface";
    s.moon.surface = {
      ...freshSurface(s.moon),
      signature: s.moon.designSignature,
      stage: "idle",
      location: "lookout",
      deployed: true,
      crewSheltered: true,
      visited: ["base", "lookout"],
      traversed: ["base-lookout"],
      batteryWh: s.moon.resources.capacityWh || 800,
    };
    const isScienceReady = validStepId === "science-ready";
    s.moon.science = {
      ...freshScience(s.moon, s.preparation),
      signature: s.moon.designSignature,
      phase: isScienceReady ? "ready" : "survey",
      target: "lookout",
      program: "sample",
      committed: isScienceReady,
      fieldworkStopped: isScienceReady,
      records: isScienceReady
        ? [
            {
              id: "rec-lookout-01",
              objective,
              locationId: "lookout",
              instrumentId: "nirvss",
              depthCm: 35,
              kind:
                objective === "lunar-geology"
                  ? "mineral-evidence"
                  : "water-evidence",
              confidence: "high",
              points: 25,
              transmitted: true,
            },
          ]
        : [],
      hazards: {
        ...emptyIncidents(),
        pending: null,
        recovery: null,
      },
    };
    s.progress = {
      ...s.progress,
      stepId: validStepId as StoryStepId,
      lineIndex: 0,
    };
    return s;
  }

  // Module 10: Surface Incident & Recovery
  if (moduleNum === 10) {
    const s = createFlightBase();
    s.moon.landing = {
      ...emptyLanding(),
      signature: s.moon.designSignature,
      stage: "landed",
      mode: "medium",
      target: "left",
      x: -45,
      height: 0,
      vx: 0,
      vy: 0,
      fuelKg: 350,
      commands: [],
    };
    s.moon.surface = {
      ...freshSurface(s.moon),
      signature: s.moon.designSignature,
      stage: "idle",
      location: "base",
      deployed: true,
      crewSheltered: true,
      visited: ["base", "lookout"],
      traversed: ["base-lookout"],
      batteryWh: s.moon.resources.capacityWh || 800,
    };
    const secured = validStepId === "surface-secured";
    s.moon.science = {
      ...freshScience(s.moon, s.preparation),
      signature: s.moon.designSignature,
      committed: true,
      fieldworkStopped: true,
      phase: "ready",
      records: [
        {
          id: "rec-lookout-01",
          objective,
          locationId: "lookout",
          instrumentId: "nirvss",
          depthCm: 35,
          kind:
            objective === "lunar-geology"
              ? "mineral-evidence"
              : "water-evidence",
          confidence: "high",
          points: 25,
          transmitted: true,
        },
      ],
      hazards: {
        ...emptyIncidents(),
        pending: null,
        recovery: null,
        roverParked: secured,
        dataArchived: secured,
        crewChecked: secured,
      },
    };
    s.moon.phase = "surface";
    s.progress = {
      ...s.progress,
      stepId: validStepId as StoryStepId,
      lineIndex: 0,
    };
    return s;
  }

  // Module 11: Crew Return & Mission Debrief
  if (moduleNum === 11) {
    const s = createFlightBase();
    s.moon.landing = {
      ...emptyLanding(),
      signature: s.moon.designSignature,
      stage: "landed",
      mode: "medium",
      target: "left",
      x: -45,
      height: 0,
      vx: 0,
      vy: 0,
      fuelKg: 350,
      commands: [],
    };
    s.moon.surface = {
      ...freshSurface(s.moon),
      signature: s.moon.designSignature,
      stage: "idle",
      location: "base",
      deployed: true,
      crewSheltered: true,
      visited: ["base", "lookout"],
      traversed: ["base-lookout"],
      batteryWh: s.moon.resources.capacityWh || 800,
    };
    s.moon.science = {
      ...freshScience(s.moon, s.preparation),
      signature: s.moon.designSignature,
      committed: true,
      fieldworkStopped: true,
      phase: "ready",
      records: [
        {
          id: "rec-lookout-01",
          objective,
          locationId: "lookout",
          instrumentId: "nirvss",
          depthCm: 35,
          kind:
            objective === "lunar-geology"
              ? "mineral-evidence"
              : "water-evidence",
          confidence: "high",
          points: 25,
          transmitted: true,
        },
      ],
      hazards: {
        ...emptyIncidents(),
        pending: null,
        recovery: null,
        roverParked: true,
        dataArchived: true,
        crewChecked: true,
      },
    };
    const isDebrief = validStepId === "mission-debrief";
    s.moon.phase = isDebrief ? "debrief" : "ascent";
    s.moon.returnFlight = {
      ...freshReturn(s.moon),
      signature: s.moon.designSignature,
      stage: isDebrief ? "splashdown" : "ready",
      crewLocation: isDebrief ? "ocean" : "moon-and-orbit",
      assisted: false,
    };
    if (isDebrief) {
      s.moon.outcome = {
        status: "success",
        reasons: [
          "All crew safely recovered",
          "Scientific objectives achieved",
        ],
      };
    }
    s.progress = {
      ...s.progress,
      stepId: validStepId as StoryStepId,
      lineIndex: 0,
    };
    return s;
  }

  // Fallback: Full Mission Session
  const fallback = createBaseMission(gender, objective, { playerName });
  fallback.progress = {
    ...fallback.progress,
    stepId: validStepId,
    lineIndex: 0,
  };
  return fallback;
}

// Auto-register session seeder with debug store
setDebugSessionSeeder(createDebugSession);
