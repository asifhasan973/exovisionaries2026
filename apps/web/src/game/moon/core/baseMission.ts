import { STORY_FLOW, getStoryStep } from "./flow";
import { createStoryProgress, reduceStoryProgress } from "./progress";
import { quickPreparation, verifiedActivities } from "./preparation";
import { createWorkshopSession } from "../workshop/lander/workshopSession";
import type { PlayerGender } from "./types";
import type { PreparationSelection } from "./design";
import type { MoonObjective } from "../shared/catalog";
import type { WorkshopSession } from "../workshop/lander/workshopSession";

/** Authoritative in-engine baseline session built through real reducers up to crew selection. */
export function createBaseMission(
  gender: PlayerGender = "female",
  objective: MoonObjective = "lunar-ice",
  options?: { preparation?: PreparationSelection; playerName?: string },
): WorkshopSession {
  const preparation = options?.preparation ?? quickPreparation(objective);
  let progress = reduceStoryProgress(createStoryProgress(), {
    type: "set-name",
    name: options?.playerName ?? "Charlie",
    gender,
  });

  for (
    let i = 0;
    i < STORY_FLOW.length && progress.stepId !== "crew-selection";
    i++
  ) {
    const step = getStoryStep(progress.stepId, objective);
    if (step.kind === "choice") {
      progress = reduceStoryProgress(progress, {
        type: "select",
        choiceId:
          step.choiceKey === "objective"
            ? objective
            : step.options.find((option) => option.available)!.id,
      });
    }
    if (step.kind === "activity") {
      progress = {
        ...progress,
        completedActivities: verifiedActivities(preparation, objective),
      };
    }
    const next = reduceStoryProgress(progress, {
      type: step.kind === "conversation" ? "skip-briefing" : "next",
    });
    if (next.stepId === progress.stepId) break;
    progress = next;
  }
  return createWorkshopSession(progress, preparation);
}
