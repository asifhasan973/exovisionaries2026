import "./homeHero.css";
import { navigatePage } from "@/shared/site/siteNavigation";
import "@/features/exploration/exploration.css";
import { SiteNavbar } from "@/shared/site/SiteNavbar";
import { useOrientationLifecycleStore } from "@exo/ui";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Play, RotateCcw, Download, Award } from "lucide-react";
import { sound } from "@exo/audio";
import { usePwaStore } from "@exo/ui";
import { StoryShell } from "@/shared/shell";
import type { StoryProgress } from "@/game/moon/core/types";
import { useMobileGame } from "@/shared/shell";
import type { SelectionFrame } from "./selectionConfig";
import { JudgeInstructionsDialog } from "./JudgeInstructionsDialog";
import type { WorkshopSession } from "@/game/moon/workshop/lander/workshopSession";
import {
  completedMission,
  missionReport,
} from "@/game/moon/return/debrief/missionReport";

export function MissionHome({
  progress,
  session,
  onContinue,
  onRestart,
  frame,
  onOpenArchive: _onOpenArchive,
}: {
  progress: StoryProgress;
  session?: WorkshopSession;
  onContinue(): void;
  onBack(): void;
  onRestart(): void;
  frame: SelectionFrame;
  onOpenArchive?: () => void;
}) {
  const completed =
    !!session &&
    !frame.isDebugSession &&
    !session.review &&
    completedMission(session);
  const lastMission = completed ? missionReport(session) : null;
  const hasProgress = completed || !!progress.playerName;
  const mobileGame = useMobileGame();
  const { isInstalled, promptInstall } = usePwaStore();
  const [judgeInstructionsOpen, setJudgeInstructionsOpen] = useState(false);

  const frozen = useOrientationLifecycleStore((s) => s.isFrozen);
  const entryAction = useRef<"play" | "restart" | null>(null);
  useEffect(() => {
    if (frozen) return;
    const query = new URLSearchParams(location.search);
    const action =
      query.get("play") === "1"
        ? "play"
        : query.get("restart") === "1"
          ? "restart"
          : null;
    if (!action || entryAction.current) return;
    entryAction.current = action;
    window.history.replaceState(null, "", "/");
    if (action === "play") onContinue();
    else onRestart();
  }, [frozen, onContinue, onRestart]);
  return (
    <StoryShell
      {...frame}
      controls={null}
      pageHeader={
        <SiteNavbar
          activePage="home"
          onNavigate={(page) => {
            if (page === "mission") {
              mobileGame.start();
              onContinue();
            } else navigatePage(page);
          }}
        />
      }
    >
      <main
        className="mission-home"
        id="story-content"
        tabIndex={-1}
        aria-labelledby="mission-home-title"
      >
        <div className="home-hero-backdrop" aria-hidden="true">
          <img
            src="/story/moon-mission-hero.webp"
            alt=""
            className="home-hero-full-img"
          />
        </div>
        <section className="home-copy">
          <span className="home-mission-tag">
            <span />
            YOUR FIRST MOON MISSION
          </span>
          <h1 id="mission-home-title">
            Build a mission.
            <br />
            <em>Go beyond.</em>
          </h1>
          <p>Choose your crew. Explore the Moon. Bring everyone home.</p>
          <div className="home-play-group">
            <button
              type="button"
              className="home-play"
              data-primary-action
              onClick={() => {
                sound.playClick(880);
                mobileGame.start();
                onContinue();
              }}
            >
              <Play size={14} fill="currentColor" />
              <span>
                {completed
                  ? "View mission report"
                  : hasProgress
                    ? "Resume"
                    : "Play now"}
              </span>
              <ArrowRight size={14} />
            </button>
            {hasProgress ? (
              <button
                type="button"
                className="home-new-game-btn"
                onClick={() => {
                  sound.playClick(620);
                  onRestart();
                }}
                title="Start a new mission from scratch"
              >
                <RotateCcw size={13} />
                <span>{completed ? "New mission" : "New Game"}</span>
              </button>
            ) : null}
          </div>

          <div className="home-other-actions">
            {!isInstalled ? (
              <button
                type="button"
                className="home-install-app-btn"
                onClick={() => {
                  sound.playClick(720);
                  promptInstall();
                }}
                title="Install app on your device for fast fullscreen offline play"
              >
                <Download size={17} />
                <span>Install App</span>
              </button>
            ) : null}
            <button
              type="button"
              className="home-judge-demo-btn"
              onClick={() => {
                sound.playClick(720);
                setJudgeInstructionsOpen(true);
              }}
              title="Open evaluator guide & mission walkthrough protocol"
            >
              <Award size={17} />
              <span>Judge Demo</span>
            </button>
          </div>
          {lastMission ? (
            <div
              className="home-completed-summary"
              aria-label="Last mission completed"
            >
              <strong>Last mission completed</strong>
              <span>
                {lastMission.objective} · {lastMission.location.name} · Crew
                recovered
              </span>
              <p>
                {lastMission.outcome?.reasons[1] ??
                  `${lastMission.deliveredCount} observations delivered. ${lastMission.returnedCount} samples returned.`}
              </p>
            </div>
          ) : (
            <div className="home-mission-trail" aria-label="Mission path">
              <span>
                <span>01</span>Build
              </span>
              <i />
              <span>
                <span>02</span>Test
              </span>
              <i />
              <span>
                <span>03</span>Launch
              </span>
            </div>
          )}
        </section>
      </main>

      <JudgeInstructionsDialog
        open={judgeInstructionsOpen}
        onClose={() => setJudgeInstructionsOpen(false)}
      />
    </StoryShell>
  );
}
