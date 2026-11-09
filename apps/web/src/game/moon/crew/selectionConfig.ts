import type { CharacterCue, StoryStep } from "@/game/moon/core/types";
import { STORY_FLOW } from "@/game/moon/core/flow";
import type { StoryShellProps } from "@/shared/shell";

export const GUIDE: CharacterCue = {
  character: "commander",
  expression: "encouraging",
  pose: "point",
};
export const READY: CharacterCue = {
  character: "commander",
  expression: "confident",
  pose: "ready",
};
export type SelectionFrame = Omit<StoryShellProps, "children" | "controls">;
export const selectionSteps = STORY_FLOW.filter(
  (step: StoryStep): step is Extract<StoryStep, { kind: "choice" }> =>
    step.kind === "choice",
);
