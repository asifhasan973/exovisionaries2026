import { useEffect, useRef, useState } from "react";
import { Check, LockKeyhole, Sparkles } from "lucide-react";
import { sound } from "@exo/audio";
import { CharacterStage } from "@/game/moon/narrative/components/CharacterStage";
import { SelectionArt } from "./SelectionArt.tsx";
import { StoryControls, StoryShell } from "@/shared/shell";
import type {
  CharacterCue,
  ChoiceId,
  PlayerGender,
  StoryProgress,
  StoryStep,
} from "@/game/moon/core/types";
import { PlayerCharacterProvider } from "@/game/moon/narrative/hooks/playerCharacterContext";
import "./selection.css";
import "@/shared/shell/missionExperience.css";
import "@/features/archive/nasaArchive.css";
import { Term } from "@/game/moon/core/learning/Learning";
import { useMobileGame } from "@/shared/shell";
import {
  GUIDE,
  READY,
  selectionSteps,
  type SelectionFrame,
} from "./selectionConfig";

export { RestartStoryDialog } from "./RestartStoryDialog";
export { MissionPlan } from "./MissionPlan";
export { MissionHome } from "./MissionHome";
export type { SelectionFrame };

function ProgressDots({ index }: { index: number }) {
  return (
    <>
      <span>Plan · {index + 1}/3</span>
      <div aria-hidden="true">
        {selectionSteps.map((step, i) => (
          <i
            key={step.id}
            className={index === i ? "current" : index > i ? "done" : ""}
          />
        ))}
      </div>
    </>
  );
}
export function GuideStage({ cue = GUIDE }: { cue?: CharacterCue }) {
  return (
    <div className="conversation-stage selection-guide">
      <div className="conversation-stage-orbit orbit-one" />
      <div className="conversation-stage-orbit orbit-two" />
      <CharacterStage cue={cue} active speaking={false} label="Commander" />
    </div>
  );
}

export function NameScreen({
  playerName,
  playerGender,
  onSubmit,
  onBack,
  frame,
}: {
  playerName: string;
  playerGender: PlayerGender;
  onSubmit(name: string, gender: PlayerGender): void;
  onBack(): void;
  frame: SelectionFrame;
}) {
  const { mobile } = useMobileGame();
  const [draft, setDraft] = useState(playerName);
  const [gender, setGender] = useState(playerGender);
  const [error, setError] = useState(false);
  const isSubmitting = useRef(false);

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError(true);
      return;
    }
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    sound.playClick(880);
    onSubmit(trimmed, gender);
  };

  return (
    <StoryShell
      {...frame}
      controls={
        <StoryControls
          backHidden
          onBack={onBack}
          onNext={handleSubmit}
          nextLabel="Start"
          nextForm="commander-name"
          nextDisabled={!draft.trim()}
          nextHint={
            !draft.trim() ? "Enter your name" : `Ready, ${draft.trim()}!`
          }
          progress={<span>NAME</span>}
        />
      }
    >
      <main
        className="conversation-main selection-main name-main"
        id="story-content"
        tabIndex={-1}
        aria-labelledby="name-title"
      >
        <PlayerCharacterProvider value={gender}>
          <GuideStage />
        </PlayerCharacterProvider>
        <section className="conversation-panel selection-name-panel">
          <span className="selection-eyebrow">
            <Sparkles size={17} />
            ZERO TO BEYOND
          </span>
          <h1 id="name-title">Your name</h1>
          <form
            id="commander-name"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <label htmlFor="commander-name-input">Your explorer name</label>
            <input
              id="commander-name-input"
              name="commanderName"
              value={draft}
              placeholder="Charlie"
              maxLength={40}
              autoComplete="nickname"
              autoFocus={!mobile}
              required
              aria-describedby={error ? "name-error" : undefined}
              onChange={(event) => {
                setDraft(event.target.value);
                setError(false);
              }}
            />
            {error ? (
              <p id="name-error" role="alert">
                Enter a name to begin.
              </p>
            ) : null}
            <fieldset className="player-gender-picker">
              <legend>Choose your character</legend>
              <div>
                {(["male", "female"] as const).map((option) => (
                  <label
                    key={option}
                    className={gender === option ? "is-selected" : ""}
                  >
                    <input
                      type="radio"
                      name="playerGender"
                      value={option}
                      checked={gender === option}
                      onChange={() => setGender(option)}
                    />
                    <span>{option === "male" ? "Male" : "Female"}</span>
                    {gender === option ? (
                      <Check size={19} aria-hidden="true" />
                    ) : null}
                  </label>
                ))}
              </div>
            </fieldset>
          </form>
        </section>
      </main>
    </StoryShell>
  );
}

export function ChoiceScreen({
  step,
  progress,
  onSelect,
  onNext,
  onBack,
  frame,
}: {
  step: Extract<StoryStep, { kind: "choice" }>;
  progress: StoryProgress;
  onSelect(id: ChoiceId): void;
  onNext(): void;
  onBack(): void;
  frame: SelectionFrame;
}) {
  const index = selectionSteps.findIndex((item) => item.id === step.id);
  const selected = (
    progress.selections as Record<string, string | null | undefined>
  )[step.choiceKey];
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, [step.id]);
  return (
    <StoryShell
      {...frame}
      controls={
        <StoryControls
          skipHidden
          keepProgress
          onBack={onBack}
          onNext={onNext}
          nextHint={
            !selected
              ? step.choiceKey === "destination"
                ? "Select a planet"
                : "Pick a card"
              : "Choice saved"
          }
          nextDisabled={
            !step.options.some(
              (option: any) => option.available && option.id === selected,
            )
          }
          progress={<ProgressDots index={index} />}
        />
      }
    >
      <main
        className="conversation-main selection-main"
        id="story-content"
        tabIndex={-1}
        aria-labelledby="selection-title"
      >
        <GuideStage cue={step.choiceKey === "site" ? READY : GUIDE} />
        <section className={`selection-board board-${step.choiceKey}`}>
          <span className="selection-eyebrow">
            MISSION {String(index + 1).padStart(2, "0")}
          </span>
          <h1 id="selection-title" tabIndex={-1} ref={title}>
            {step.choiceKey === "destination"
              ? "Where to?"
              : step.choiceKey === "objective"
                ? "Pick your mission"
                : "Where shall we land?"}
          </h1>
          <div className="selection-cards" role="group" aria-label={step.title}>
            {step.options
              .filter((option: any) => option.id !== "coming-soon")
              .map((option: any) => (
                <article className="selection-choice" key={option.id}>
                  <button
                    type="button"
                    key={option.id}
                    disabled={!option.available}
                    className={`selection-card ${selected === option.id ? "is-selected" : ""}`}
                    aria-pressed={selected === option.id}
                    aria-label={option.label}
                    onClick={() => {
                      sound.playClick(660);
                      onSelect(option.id);
                    }}
                  >
                    <span className="selection-card-state" aria-hidden="true">
                      {!option.available ? (
                        <LockKeyhole size={19} />
                      ) : selected === option.id ? (
                        <Check size={20} />
                      ) : (
                        <ArrowMarker />
                      )}
                    </span>
                    <SelectionArt kind={option.id} />
                    <span className="selection-card-copy">
                      <strong>
                        {option.id === "lunar-ice"
                          ? "Find ice clues"
                          : option.id === "lunar-geology"
                            ? "Explore Moon rocks"
                            : option.id === "crater-rim"
                              ? "Crater rim"
                              : option.id === "permanent-shadow"
                                ? "Deep shadow"
                                : option.id === "coming-soon"
                                  ? "Coming soon"
                                  : option.label}
                      </strong>
                      {option.description ? (
                        <span className="selection-card-description">
                          {option.id === "crater-rim"
                            ? "More light · safer route"
                            : option.id === "permanent-shadow"
                              ? "Dark & cold · harder route"
                              : option.description}
                        </span>
                      ) : null}
                      {!option.available && option.id === "mars" ? (
                        <span className="selection-card-lock">Coming soon</span>
                      ) : null}
                    </span>
                  </button>
                  <div className="selection-choice-hint">
                    {option.id === "moon" ? (
                      selected === "moon" ? (
                        "Target selected"
                      ) : (
                        "Earth’s Moon"
                      )
                    ) : option.id === "crater-rim" ? (
                      <Term term="crater">Sunlit start · solar can work</Term>
                    ) : option.id === "permanent-shadow" ? (
                      <Term term="shadow">No solar · better warmth needed</Term>
                    ) : option.id === "lunar-ice" ? (
                      <Term term="nss">Look for water clues</Term>
                    ) : option.id === "lunar-geology" ? (
                      <Term term="geology">Study rocks & soil</Term>
                    ) : option.id === "lunar-highlands" ? (
                      <Term term="geology">Explore old crust</Term>
                    ) : option.id === "ancient-crater" ? (
                      <Term term="crater">Explore impact clues</Term>
                    ) : (
                      "Locked"
                    )}
                  </div>
                </article>
              ))}
          </div>
          <div className="selection-word-help">
            {step.choiceKey === "site" &&
            progress.selections.objective === "lunar-geology" ? (
              <Term term="geology">Rock origins</Term>
            ) : step.choiceKey === "site" ? (
              <>
                <Term term="crater">Crater rim</Term>
                <Term term="shadow">Permanent shadow</Term>
              </>
            ) : step.choiceKey === "objective" ? (
              <Term term="geology">Geology</Term>
            ) : null}
          </div>
        </section>
      </main>
    </StoryShell>
  );
}
function ArrowMarker() {
  return <span className="selection-empty-marker" />;
}
