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
  reduceMission,
  type WorkshopSession,
} from "../workshop/lander/workshopSession";
import { createBaseMission } from "../core/baseMission";
import { scienceResult } from "../science/science";
import {
  createReadinessDemo,
  createLandingDemo,
  createSurfaceDemo,
  createScienceDemo,
  createIncidentDemo,
  createReturnDemo,
} from "../flight/journey/journeyDemo";

export interface DebugSessionOptions {
  objective?: MoonObjective;
  gender?: PlayerGender;
  site?: ChoiceId;
  playerName?: string;
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
      const assigned = reduceMission(session, {
        type: "moon-assign-crew",
        role: "scientist",
        id: scientistId,
      });
      return reduceMission(assigned, {
        type: "moon-assign-crew",
        role: "support",
        id: "robotics-specialist",
      });
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

  // Module 06: Orbit & Trans-Lunar Injection
  if (moduleNum === 6) {
    let s = createReadinessDemo(gender, objective, "liftoff", {
      preparation: quickPreparation(objective),
      playerName,
    });
    s = reduceMission(s, { type: "flight-skip" });
    s = reduceMission(s, { type: "next" });

    if (validStepId === "earth-orbit") {
      s.progress = { ...s.progress, stepId: "earth-orbit", lineIndex: 0 };
      return s;
    }

    s = reduceMission(s, { type: "journey-route", id: "balanced" });
    s = reduceMission(s, { type: "journey-confirm-route" });

    if (validStepId === "moon-transfer") {
      s.progress = { ...s.progress, stepId: "moon-transfer", lineIndex: 0 };
      return s;
    }

    s = reduceMission(s, { type: "journey-skip" });
    s = reduceMission(s, { type: "next" });
    s.progress = { ...s.progress, stepId: "lunar-orbit", lineIndex: 0 };
    return s;
  }

  // Module 07: Lunar Descent & Touchdown
  if (moduleNum === 7) {
    const session = createLandingDemo(gender, objective, {
      preparation: quickPreparation(objective),
      playerName,
    });
    session.progress = {
      ...session.progress,
      stepId: "lunar-descent",
      lineIndex: 0,
      milestones: {
        introduced: true,
        celebrated: session.progress.milestones?.celebrated ?? [],
      },
    };
    return session;
  }

  // Module 08: Lunar Surface Deployment & Exploration
  if (moduleNum === 8) {
    let s = createSurfaceDemo(gender, objective, {
      preparation: quickPreparation(objective),
      playerName,
    });

    if (validStepId === "lunar-surface") {
      s.progress = { ...s.progress, stepId: "lunar-surface", lineIndex: 0 };
      return s;
    }

    s = reduceMission(s, { type: "surface-deploy" });
    for (let i = 0; i < 40 && s.moon.surface.stage === "deploying"; i++) {
      s = reduceMission(s, { type: "surface-tick", seconds: 0.25 });
    }
    s = reduceMission(s, { type: "next" });

    if (validStepId === "surface-explore") {
      s.progress = { ...s.progress, stepId: "surface-explore", lineIndex: 0 };
      return s;
    }

    s = reduceMission(s, { type: "surface-select", edge: "base-ridge" });
    s = reduceMission(s, { type: "surface-start" });
    for (let i = 0; i < 50 && s.moon.surface.stage === "driving"; i++) {
      s = reduceMission(s, { type: "surface-tick", seconds: 0.25 });
    }
    s = reduceMission(s, { type: "surface-arm" });
    s = reduceMission(s, { type: "surface-select", edge: "ridge-edge" });
    s = reduceMission(s, { type: "surface-start" });
    for (let i = 0; i < 90 && s.moon.surface.stage === "driving"; i++) {
      s = reduceMission(s, { type: "surface-tick", seconds: 0.25 });
    }
    s = reduceMission(s, { type: "surface-home" });
    for (let i = 0; i < 90 && s.moon.surface.stage === "driving"; i++) {
      s = reduceMission(s, { type: "surface-tick", seconds: 0.25 });
    }
    s = reduceMission(s, { type: "surface-charge" });
    for (let i = 0; i < 40 && s.moon.surface.stage === "charging"; i++) {
      s = reduceMission(s, { type: "surface-tick", seconds: 0.25 });
    }
    s = reduceMission(s, { type: "next" });
    s.progress = { ...s.progress, stepId: "surface-ready", lineIndex: 0 };
    return s;
  }

  // Module 09: Ice Drilling & Spectrometry Science
  if (moduleNum === 9) {
    let s = createScienceDemo(gender, {
      preparation: quickPreparation(objective),
      playerName,
    });

    if (validStepId === "ice-science") {
      s.progress = { ...s.progress, stepId: "ice-science", lineIndex: 0 };
      return s;
    }

    s = reduceMission(s, { type: "science-program", program: "sample" });
    s = reduceMission(s, { type: "science-start" });
    for (
      let i = 0;
      i < 240 &&
      !s.moon.science.hazards.pending &&
      s.moon.science.phase !== "failed";
      i++
    ) {
      s = reduceMission(s, { type: "science-tick", seconds: 0.25 });
    }
    if (s.moon.science.hazards.pending) {
      s = reduceMission(s, {
        type: "science-incident",
        action: "continue-dust",
      });
    }
    for (
      let i = 0;
      i < 1600 &&
      [
        "outbound",
        "survey",
        "drilling",
        "analysis",
        "returning",
        "recovering",
        "transmitting",
      ].includes(s.moon.science.phase);
      i++
    ) {
      s = reduceMission(s, { type: "science-tick", seconds: 0.25 });
    }
    if (s.moon.science.phase === "report") {
      s = reduceMission(s, {
        type: "science-claim",
        finding: scienceResult(s.moon.science),
      });
      s = reduceMission(s, { type: "science-transmit" });
    }
    s = reduceMission(s, { type: "next" });
    s.progress = { ...s.progress, stepId: "science-ready", lineIndex: 0 };
    return s;
  }

  // Module 10: Surface Incident & Recovery
  if (moduleNum === 10) {
    let s = createIncidentDemo(gender);
    const science = s.moon.science;
    if (science.hazards.pending) {
      s = reduceMission(s, {
        type: "science-incident",
        action: "continue-dust",
      });
    }
    for (
      let i = 0;
      i < 1600 &&
      [
        "outbound",
        "survey",
        "drilling",
        "analysis",
        "returning",
        "recovering",
        "transmitting",
      ].includes(s.moon.science.phase);
      i++
    ) {
      s = reduceMission(s, { type: "science-tick", seconds: 0.25 });
    }
    if (s.moon.science.phase === "report") {
      s = reduceMission(s, {
        type: "science-claim",
        finding: scienceResult(s.moon.science),
      });
      s = reduceMission(s, { type: "science-transmit" });
    }
    s = reduceMission(s, { type: "next" }); // to science-ready
    s = reduceMission(s, { type: "next" }); // to surface-recovery

    if (validStepId === "surface-recovery") {
      s.progress = { ...s.progress, stepId: "surface-recovery", lineIndex: 0 };
      return s;
    }

    s = reduceMission(s, { type: "science-secure", item: "rover" });
    s = reduceMission(s, { type: "science-secure", item: "data" });
    for (let i = 0; i < 100 && s.moon.science.phase === "transmitting"; i++) {
      s = reduceMission(s, { type: "science-tick", seconds: 0.25 });
    }
    s = reduceMission(s, { type: "science-secure", item: "crew" });
    s = reduceMission(s, { type: "next" }); // to surface-secured
    s.progress = { ...s.progress, stepId: "surface-secured", lineIndex: 0 };
    return s;
  }

  // Module 11: Crew Return & Mission Debrief
  if (moduleNum === 11) {
    let s = createReturnDemo(gender);

    if (validStepId === "crew-return") {
      s.progress = { ...s.progress, stepId: "crew-return", lineIndex: 0 };
      return s;
    }

    for (
      let i = 0;
      i < 600 && s.moon.returnFlight.stage !== "splashdown";
      i++
    ) {
      const stage = s.moon.returnFlight.stage;
      if (stage === "ready") {
        s = reduceMission(s, { type: "return-action", action: "launch" });
      } else if (stage === "rendezvous") {
        s = reduceMission(s, { type: "return-action", action: "assist" });
        s = reduceMission(s, { type: "return-action", action: "dock" });
      } else if (stage === "docked") {
        s = reduceMission(s, { type: "return-action", action: "depart" });
      } else if (stage === "coast") {
        s = reduceMission(s, { type: "return-action", action: "skip-coast" });
      } else if (stage === "entry-ready") {
        s = reduceMission(s, { type: "return-action", action: "shield" });
      } else if (stage === "chute-ready") {
        s = reduceMission(s, { type: "return-action", action: "chutes" });
      } else {
        s = reduceMission(s, { type: "return-tick", seconds: 0.5 });
      }
    }
    s = reduceMission(s, { type: "next" }); // to mission-debrief
    s.progress = { ...s.progress, stepId: "mission-debrief", lineIndex: 0 };
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
