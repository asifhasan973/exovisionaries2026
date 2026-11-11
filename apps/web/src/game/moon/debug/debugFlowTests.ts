import { STORY_FLOW } from "../core/flow";
import { createDebugSession } from "./debugSessionSeeder";
import { advanceMissionSkip } from "../core/missionNavigation";
import { launchAuthorized } from "../flight/launch/flight";
import { returnAuthorized } from "../return/return";

export interface VerificationResult {
  totalSteps: number;
  directPassed: number;
  skipPassed: number;
  failures: string[];
}

/**
 * Validates all 41 steps in STORY_FLOW:
 * 1. Confirms direct createDebugSession() seeding produces valid and authorized session state.
 * 2. Confirms advanceMissionSkip() cleanly transitions across all stages without stalls.
 */
export function verifyAllMissionFlowSteps(): VerificationResult {
  const failures: string[] = [];
  let directPassed = 0;
  let skipPassed = 0;

  // 1. Direct Seeding Verification
  for (let i = 0; i < STORY_FLOW.length; i++) {
    const step = STORY_FLOW[i];
    try {
      const session = createDebugSession(step.id);
      if (!session) {
        failures.push(`Step ${i} (${step.id}): returned null session`);
        continue;
      }
      if (session.progress.stepId !== step.id) {
        failures.push(
          `Step ${i} (${step.id}): stepId mismatch: got "${session.progress.stepId}", expected "${step.id}"`,
        );
        continue;
      }

      if (step.module >= 5 && step.module <= 11) {
        const auth = launchAuthorized(
          session.progress,
          session.preparation,
          session.readiness,
          session.moon,
        );
        if (!auth) {
          failures.push(
            `Step ${i} (${step.id}, Mod ${step.module}): launchAuthorized is FALSE`,
          );
          continue;
        }
      }

      if (step.module === 11) {
        const retAuth = returnAuthorized(session.moon);
        if (!retAuth) {
          failures.push(
            `Step ${i} (${step.id}, Mod ${step.module}): returnAuthorized is FALSE`,
          );
          continue;
        }
      }

      directPassed++;
    } catch (err) {
      failures.push(
        `Step ${i} (${step.id}): exception in seeder: ${String(err)}`,
      );
    }
  }

  // 2. Sequential Skip Verification
  let current = createDebugSession(STORY_FLOW[0].id);
  for (let i = 0; i < STORY_FLOW.length - 1; i++) {
    const expectedNext = STORY_FLOW[i + 1];
    try {
      const nextSession = advanceMissionSkip(current);
      if (
        nextSession.progress.stepId === current.progress.stepId &&
        current.progress.lineIndex === nextSession.progress.lineIndex
      ) {
        failures.push(
          `Skip stall at step ${i} (${current.progress.stepId}): did not advance`,
        );
        break;
      }
      if (nextSession.progress.stepId !== expectedNext.id) {
        failures.push(
          `Skip mismatch at step ${i}: jumped to "${nextSession.progress.stepId}", expected "${expectedNext.id}"`,
        );
        break;
      }
      skipPassed++;
      current = nextSession;
    } catch (err) {
      failures.push(
        `Skip exception at step ${i} (${current.progress.stepId}): ${String(err)}`,
      );
      break;
    }
  }

  return {
    totalSteps: STORY_FLOW.length,
    directPassed,
    skipPassed,
    failures,
  };
}
