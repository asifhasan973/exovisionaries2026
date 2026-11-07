import { useState } from 'react';
import { ArrowRight, Play, RotateCcw, Sparkles, Compass, Download, Award } from 'lucide-react';
import { sound } from '@exo/audio';
import { usePwaStore } from '@exo/ui';
import { StoryShell } from '@/shared/shell';
import type { StoryProgress } from '@/game/moon/core/types';
import { useMobileGame } from '@/shared/shell';
import type { SelectionFrame } from './selectionConfig';
import { JudgeInstructionsDialog } from './JudgeInstructionsDialog';

export function MissionHome({
  progress,
  onContinue,
  onRestart,
  frame,
  onOpenArchive,
}: {
  progress: StoryProgress;
  onContinue(): void;
  onBack(): void;
  onRestart(): void;
  frame: SelectionFrame;
  onOpenArchive?: () => void;
}) {
  const hasProgress = !!progress.playerName;
  const mobileGame = useMobileGame();
  const { isInstalled, promptInstall } = usePwaStore();
  const [judgeInstructionsOpen, setJudgeInstructionsOpen] = useState(false);

  return (
    <StoryShell {...frame} controls={null}>
      <main className="mission-home" id="story-content" tabIndex={-1} aria-labelledby="mission-home-title">
        <div className="home-hero-backdrop" aria-hidden="true">
          <img src="/story/moon-mission-hero.webp" alt="" className="home-hero-full-img" />
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
              <span>{hasProgress ? 'Resume' : 'Play now'}</span>
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
                <span>New Game</span>
              </button>
            ) : null}
          </div>

          {/* Secondary entry button for NASA Mission Archive */}
          <div className="home-archive-wrapper">
            <button
              type="button"
              className="home-archive-button"
              onClick={() => {
                sound.playClick(650);
                onOpenArchive?.();
              }}
              title="Explore historical and upcoming NASA mission milestones"
            >
              <span className="archive-icon-wrapper">
                <Sparkles size={14} className="archive-sparkle" />
                <Compass size={18} />
              </span>
              <span className="archive-button-copy">
                <strong>NASA Mission Archive</strong>
                <small>1958 — 2030+ Historical Timeline</small>
              </span>
              <span className="archive-pill-tag">EXPLORE</span>
            </button>
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
        </section>
      </main>

      <JudgeInstructionsDialog
        open={judgeInstructionsOpen}
        onClose={() => setJudgeInstructionsOpen(false)}
      />
    </StoryShell>
  );
}

