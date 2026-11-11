import { ArrowLeft, ArrowRight, Rocket, SkipForward } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import "./viewport.css";
import { SettingsButton } from "./settings";
import {
  HintButton,
  LearningControls,
} from "@/game/moon/core/learning/Learning";
import { useMobileGame } from "./mobile";
import { useStoryNavigation } from "@/game/moon/core/storyNavigationContext";
import { MilestoneRing } from "@/game/moon/stages/milestones/MilestoneRing";

export interface StoryShellProps {
  children: ReactNode;
  controls: ReactNode;
  headerExtra?: ReactNode;
  pageHeader?: ReactNode;
  onHome?: () => void;
  exitURL?: string;
  voiceEnabled?: boolean;
  soundActive?: boolean;
  onToggleVoice?: () => void;
  voiceAvailable?: boolean;
  skipTarget?: string;
  isDebugSession?: boolean;
}

/** Shared navigation frame for conversations, mission cards and the workshop handoff. */
export function StoryShell({
  children,
  controls,
  headerExtra,
  pageHeader,
  onHome,
  exitURL = import.meta.env.BASE_URL,
  skipTarget = "story-content",
  isDebugSession,
}: StoryShellProps) {
  const mobileGame = useMobileGame();
  const navigation = useStoryNavigation(),
    shell = useRef<HTMLDivElement>(null);
  const isDebug = Boolean(
    isDebugSession ||
    (typeof window !== "undefined" &&
      (window.location.hash.includes("debug") ||
        window.location.search.includes("debug"))),
  );
  const reviewing = !isDebug && !!navigation?.reviewing && !navigation.card;
  useEffect(() => {
    if (!reviewing) return;
    const mains = Array.from(shell.current?.querySelectorAll("main") ?? []),
      previous = mains.map((main) => main.inert);
    mains.forEach((main) => {
      main.inert = true;
    });
    return () =>
      mains.forEach((main, i) => {
        main.inert = previous[i];
      });
  }, [reviewing, children]);
  const footer = reviewing ? (
    <StoryControls
      onBack={navigation!.back}
      onNext={navigation!.forward}
      nextLabel="Next"
      hintDisabled
    />
  ) : (
    (controls ??
    (navigation?.skip ? (
      <footer className="conversation-controls">
        <span />
        <span />
        <div className="next-control">
          <JudgeSkip />
        </div>
      </footer>
    ) : null))
  );
  useEffect(() => {
    const advance = (event: KeyboardEvent) => {
      if (
        event.key !== "Enter" ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      if (document.querySelector("dialog[open]")) return;
      const target = event.target as HTMLElement;
      if (target.closest(".moon-report")) return;
      // Native form submission and focused controls keep their keyboard behavior.
      if (
        target.closest(
          'input, textarea, select, button, a, [contenteditable="true"]',
        )
      )
        return;
      const action = document.querySelector<HTMLButtonElement>(
        ".conversation-game [data-primary-action]:not(:disabled):not([inert] *)",
      );
      if (action) {
        event.preventDefault();
        action.click();
      }
    };
    window.addEventListener("keydown", advance);
    return () => window.removeEventListener("keydown", advance);
  }, []);
  const brand = (
    <>
      <span>
        <Rocket size={25} />
      </span>
      Zero To Beyond
    </>
  );
  return (
    <div
      ref={shell}
      className={`conversation-game ${footer ? "" : "without-footer"} ${mobileGame.active ? "is-mobile-game" : ""} ${reviewing ? "is-review" : ""}`}
    >
      <a className="conversation-skip" href={`#${skipTarget}`}>
        Skip to mission
      </a>
      {pageHeader ??
        (!mobileGame.active || controls === null ? (
          <header className="conversation-header">
            {onHome ? (
              <button
                className="conversation-brand"
                onClick={onHome}
                aria-label="Zero To Beyond home"
              >
                {brand}
              </button>
            ) : (
              <a className="conversation-brand" href={exitURL}>
                {brand}
              </a>
            )}
            <nav aria-label="Mission controls">
              {headerExtra}
              <MilestoneRing />
              <LearningControls />
              <SettingsButton />
            </nav>
          </header>
        ) : null)}
      {children}
      {reviewing ? (
        <span className="story-review-note" role="status">
          Review · mission paused
        </span>
      ) : null}
      {footer}
    </div>
  );
}

export interface StoryControlsProps {
  onBack(): void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextForm?: string;
  extraActions?: ReactNode;
  progress?: ReactNode;
  dialog?: ReactNode;
  dialogHidden?: boolean;
  nextHint?: string;
  backHidden?: boolean;
  hintDisabled?: boolean;
  hintHidden?: boolean;
  skipHidden?: boolean;
  keepProgress?: boolean;
  skipWithHint?: boolean;
}

export function StoryControls({
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  nextForm,
  extraActions,
  progress,
  dialog,
  dialogHidden = false,
  nextHint,
  backHidden = false,
  hintDisabled = false,
  hintHidden = false,
  skipHidden = false,
  keepProgress = false,
  skipWithHint: _skipWithHint = false,
}: StoryControlsProps) {
  const navigation = useStoryNavigation();
  const showSkip = !skipHidden && !!navigation?.skip;
  const showDialog = !dialogHidden && Boolean(dialog);

  return (
    <footer
      className={`conversation-controls ${showDialog ? "has-bottom-dialog" : ""}`}
    >
      <div className="conversation-left-group">
        {backHidden ? (
          <span className="conversation-back-spacer" aria-hidden="true" />
        ) : (
          <button
            className="conversation-back"
            type="button"
            onClick={navigation && !navigation.card ? navigation.back : onBack}
          >
            <ArrowLeft size={21} />
            Back
          </button>
        )}
        {showDialog && (
          <div className="conversation-bottom-dialog">{dialog}</div>
        )}
      </div>
      <div className="conversation-progress">
        {!navigation || keepProgress ? progress : null}
      </div>
      <div className="next-control">
        {showSkip ? <JudgeSkip /> : null}
        {extraActions}
        {!hintHidden && !navigation?.card ? (
          <HintButton disabled={hintDisabled} />
        ) : null}
        <span className="next-hint" id="next-action-hint">
          {nextHint}
        </span>
        <button
          aria-describedby={nextHint ? "next-action-hint" : undefined}
          data-primary-action
          className="conversation-next"
          type={nextForm ? "submit" : "button"}
          form={nextForm}
          disabled={nextDisabled}
          onClick={onNext}
        >
          {nextLabel}
          <ArrowRight size={22} />
        </button>
      </div>
    </footer>
  );
}

export function StorySkip() {
  const navigation = useStoryNavigation();
  return navigation?.skip ? (
    <button
      type="button"
      className="conversation-judge-skip"
      onClick={navigation.skip}
      disabled={navigation.skipping}
      title="Skip this page and advance to the next mission stage."
    >
      <SkipForward size={17} />
      {navigation.skipping ? "Advancing…" : "Skip"}
    </button>
  ) : null;
}
export const JudgeSkip = StorySkip;
