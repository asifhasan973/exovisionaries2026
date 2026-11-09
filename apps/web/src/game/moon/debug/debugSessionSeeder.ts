import { setDebugSessionSeeder } from "@exo/debug";
import { STORY_FLOW, getStoryStep } from "../core/flow";
import type { StoryStepId } from "../core/types";
import { createStoryProgress, reduceStoryProgress } from "../core/progress";
import { quickPreparation } from "../core/preparation";
import {
  createWorkshopSession,
  type WorkshopSession,
} from "../workshop/lander/workshopSession";
import { createBaseMission } from "../core/baseMission";
import {
  createJourneyDemo,
  createReadinessDemo,
  createLandingDemo,
  createSurfaceDemo,
  createScienceDemo,
  createIncidentDemo,
  createReturnDemo,
} from "../flight/journey/journeyDemo";

/**
 * Smart Auto-Seeded Ephemeral Session:
 * Seeds fully valid, realistic upstream game states (hardware, crew assignments, checks, physics checkpoints)
 * so that any mid/late-mission stage opens completely populated and interactive without crashes.
 */
export function createDebugSession(stepId: StoryStepId): WorkshopSession {
  // 1. Validate if step exists
  let targetStep;
  try {
    targetStep = getStoryStep(stepId, "lunar-ice");
  } catch {
    targetStep = STORY_FLOW[0];
    stepId = "player-name";
  }

  const moduleNum = targetStep.module;

  // Module 01: Initial Briefings & Mission Choices
  if (moduleNum === 1) {
    let progress = createStoryProgress();
    progress = reduceStoryProgress(progress, {
      type: "set-name",
      name: "Charlie",
      gender: "female",
    });
    if (
      [
        "destination",
        "objective-briefing",
        "objective",
        "site-briefing",
        "site",
        "resource-briefing",
      ].includes(stepId)
    ) {
      progress = reduceStoryProgress(progress, {
        type: "select",
        choiceId: "moon",
      });
    }
    if (["site-briefing", "site", "resource-briefing"].includes(stepId)) {
      progress = reduceStoryProgress(progress, {
        type: "select",
        choiceId: "lunar-ice",
      });
      progress = reduceStoryProgress(progress, {
        type: "select",
        choiceId: "crater-rim",
      });
    }
    progress = { ...progress, stepId, lineIndex: 0 };
    return createWorkshopSession(progress);
  }

  // Module 02: Workshop Lander & Rover Assembly
  if (moduleNum === 2) {
    const preparation = quickPreparation("lunar-ice");
    let progress = createStoryProgress();
    progress = reduceStoryProgress(progress, {
      type: "set-name",
      name: "Charlie",
      gender: "female",
    });
    progress = reduceStoryProgress(progress, {
      type: "select",
      choiceId: "moon",
    });
    progress = reduceStoryProgress(progress, {
      type: "select",
      choiceId: "lunar-ice",
    });
    progress = reduceStoryProgress(progress, {
      type: "select",
      choiceId: "crater-rim",
    });
    progress = { ...progress, stepId, lineIndex: 0 };
    return createWorkshopSession(progress, preparation);
  }

  // Module 03: Astronaut Crew Selection
  if (moduleNum === 3) {
    const preparation = quickPreparation("lunar-ice");
    let progress = createStoryProgress();
    progress = reduceStoryProgress(progress, {
      type: "set-name",
      name: "Charlie",
      gender: "female",
    });
    progress = reduceStoryProgress(progress, {
      type: "select",
      choiceId: "moon",
    });
    progress = reduceStoryProgress(progress, {
      type: "select",
      choiceId: "lunar-ice",
    });
    progress = reduceStoryProgress(progress, {
      type: "select",
      choiceId: "crater-rim",
    });
    progress = { ...progress, stepId, lineIndex: 0 };
    return createWorkshopSession(progress, preparation);
  }

  // Module 04: Flight Readiness & Pre-Flight Checklist
  if (moduleNum === 4) {
    const session = createReadinessDemo("female", "lunar-ice", "crew-check");
    session.progress = { ...session.progress, stepId, lineIndex: 0 };
    return session;
  }

  // Module 05: Liftoff & Ascent Staging
  if (moduleNum === 5) {
    const session = createJourneyDemo("female", "lunar-ice");
    session.progress = { ...session.progress, stepId: "liftoff", lineIndex: 0 };
    return session;
  }

  // Module 06: Orbit & Trans-Lunar Injection
  if (moduleNum === 6) {
    const session = createJourneyDemo("female", "lunar-ice");
    session.progress = { ...session.progress, stepId, lineIndex: 0 };
    return session;
  }

  // Module 07: Lunar Descent & Touchdown
  if (moduleNum === 7) {
    const session = createLandingDemo("female", "lunar-ice");
    session.progress = { ...session.progress, stepId, lineIndex: 0 };
    return session;
  }

  // Module 08: Lunar Surface Deployment & Rover Fieldwork
  if (moduleNum === 8) {
    const session = createSurfaceDemo("female", "lunar-ice");
    session.progress = { ...session.progress, stepId, lineIndex: 0 };
    return session;
  }

  // Module 09: Ice Drilling & Spectrometry Science
  if (moduleNum === 9) {
    const session = createScienceDemo("female");
    session.progress = { ...session.progress, stepId, lineIndex: 0 };
    return session;
  }

  // Module 10: Emergency Hazard & Solar Recovery
  if (moduleNum === 10) {
    const session = createIncidentDemo("female");
    session.progress = { ...session.progress, stepId, lineIndex: 0 };
    return session;
  }

  // Module 11: Earth Return & Mission Debrief
  if (moduleNum === 11) {
    const session = createReturnDemo("female");
    session.progress = { ...session.progress, stepId, lineIndex: 0 };
    return session;
  }

  // Fallback: Full Mission Session
  const fallback = createBaseMission("female");
  fallback.progress = { ...fallback.progress, stepId, lineIndex: 0 };
  return fallback;
}

// Auto-register session seeder with debug store
setDebugSessionSeeder(createDebugSession as any);
