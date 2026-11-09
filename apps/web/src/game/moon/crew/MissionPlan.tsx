import {
  CheckCircle2,
  LockKeyhole,
  MapPin,
  Moon,
  Sparkles,
} from "lucide-react";
import type { StoryProgress } from "@/game/moon/core/types";
import { StoryControls, StoryShell } from "@/shared/shell";
import type { SelectionFrame } from "./SelectionScreens";
import { GuideStage } from "./SelectionScreens";
import { READY, selectionSteps } from "./selectionConfig";

export function MissionPlan({
  progress,
  onBack,
  frame,
}: {
  progress: StoryProgress;
  onBack(): void;
  frame: SelectionFrame;
}) {
  const icons = [Moon, Sparkles, MapPin];
  return (
    <StoryShell
      {...frame}
      controls={
        <StoryControls
          onBack={onBack}
          nextLabel="Workshop"
          nextDisabled
          hintHidden
          skipHidden
          progress={<span>READY</span>}
        />
      }
    >
      <main
        className="conversation-main selection-main"
        id="story-content"
        tabIndex={-1}
        aria-labelledby="mission-plan-title"
      >
        <GuideStage cue={READY} />
        <section className="conversation-panel selection-plan-panel">
          <span className="selection-eyebrow">
            <CheckCircle2 size={18} />
            MISSION PLAN
          </span>
          <h1 id="mission-plan-title">Ready to build!</h1>
          <dl className="selection-plan-summary">
            {selectionSteps.map((step, index) => {
              const Icon = icons[index];
              const choice = step.options.find(
                (option) => option.id === progress.selections[step.choiceKey],
              );
              return (
                <div key={step.id}>
                  <dt>
                    <Icon size={19} />
                    {step.title}
                  </dt>
                  <dd>{choice?.label ?? "—"}</dd>
                </div>
              );
            })}
          </dl>
          <span className="selection-workshop-soon">
            <LockKeyhole size={16} />
            Workshop coming soon
          </span>
        </section>
      </main>
    </StoryShell>
  );
}
