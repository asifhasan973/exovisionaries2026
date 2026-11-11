import { canDock, returnActive } from "./return";
import type { ReturnStage, ReturnState } from "./return";
import { nextReturnAction } from "@/game/moon/shared/expedition/moonExpedition";

const STAGES: Record<ReturnStage, [string, string, number]> = {
  ready: [
    "Time to come home",
    "Bring your Moon explorers back to the orbiting spacecraft.",
    0,
  ],
  ascending: [
    "Lift off from the Moon",
    "The ascent cabin rises. The rover and landing legs stay behind.",
    0,
  ],
  rendezvous: [
    "Meet your orbit crew",
    "Slow the approach, line up the cabins, then dock.",
    1,
  ],
  docked: [
    "Next stop: Earth",
    "All three crew are together. Prepare the command spacecraft for departure.",
    1,
  ],
  burning: [
    "Next stop: Earth",
    "The service engine fires to begin the journey home.",
    2,
  ],
  coast: [
    "On our way home",
    "Follow the crew’s time-compressed journey toward Earth.",
    2,
  ],
  "entry-ready": [
    "Prepare for re-entry",
    "Choose which side of the capsule should face the atmosphere.",
    3,
  ],
  entry: [
    "Through Earth’s atmosphere",
    "The capsule slows down, protected by its broad heat shield.",
    3,
  ],
  "chute-ready": [
    "Ready for parachutes",
    "The capsule is now low and slow enough to deploy its parachutes.",
    3,
  ],
  chutes: [
    "Nearly home",
    "Parachutes carry the capsule toward the recovery ocean.",
    3,
  ],
  splashdown: [
    "Recovery",
    "Review the recorded recovery and your mission’s evidence.",
    4,
  ],
};

/** Presentation follows the return ledger; it never advances a mission. */
export function returnPresentation(flight: ReturnState, recovered: boolean) {
  const [stageTitle, instruction, stepIndex] = STAGES[flight.stage];
  const primaryAction =
    flight.stage === "rendezvous" && flight.mode === "challenge"
      ? ("dock" as const)
      : nextReturnAction(flight);
  const primaryLabel = recovered
    ? "View mission report"
    : flight.paused
      ? "Resume flight"
      : flight.stage === "ready"
        ? "Launch ascent cabin"
        : flight.stage === "rendezvous"
          ? primaryAction === "brake"
            ? "Slow the approach"
            : primaryAction === "dock"
              ? "Dock spacecraft"
              : "Align spacecraft"
          : flight.stage === "docked"
            ? "Start Earth-return burn"
            : flight.stage === "coast"
              ? "Continue to Earth"
              : flight.stage === "chute-ready"
                ? "Deploy parachutes"
                : returnActive(flight)
                  ? "Pause flight"
                  : "Choose an orientation above";
  return {
    title: recovered ? "Everyone’s home" : stageTitle,
    instruction,
    stepIndex,
    primaryAction,
    primaryLabel,
    primaryDisabled:
      !flight.paused &&
      flight.stage === "rendezvous" &&
      flight.mode === "challenge" &&
      !canDock(flight),
    awaitingChoice: flight.stage === "entry-ready",
  };
}
