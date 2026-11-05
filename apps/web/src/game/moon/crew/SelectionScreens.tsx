import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Play, RotateCcw, Check, LockKeyhole, Rocket, Sparkles, Compass, Download } from 'lucide-react';
import { sound } from '@exo/audio';
import { usePwaStore } from '@exo/ui';
import { CharacterStage } from '@/game/moon/narrative/components/CharacterStage';
import { SelectionArt } from './SelectionArt.tsx';
import { StoryControls, StoryShell } from '@/shared/shell';
import type { CharacterCue, ChoiceId, PlayerGender, StoryProgress, StoryStep } from '@/game/moon/core/types';
import { PlayerCharacterProvider } from '@/game/moon/narrative/hooks/playerCharacterContext';
import './selection.css';
import '@/shared/shell/missionExperience.css';
import '@/features/archive/nasaArchive.css';
import { Term } from '@/game/moon/core/learning/Learning';
import { useMobileGame } from '@/shared/shell';
import { GUIDE, READY, selectionSteps, type SelectionFrame } from './selectionConfig';

export { RestartStoryDialog } from './RestartStoryDialog';
export { MissionPlan } from './MissionPlan';
export type { SelectionFrame };

function ProgressDots({ index }: { index: number }) {
  return <><span>Plan · {index + 1}/3</span><div aria-hidden="true">{selectionSteps.map((step, i) => <i key={step.id} className={index === i ? 'current' : index > i ? 'done' : ''} />)}</div></>;
}
export function GuideStage({ cue = GUIDE }: { cue?: CharacterCue }) {
  return <div className="conversation-stage selection-guide">
    <div className="conversation-stage-orbit orbit-one" /><div className="conversation-stage-orbit orbit-two" />
    <CharacterStage cue={cue} active speaking={false} label="Commander" />
  </div>;
}

export function NameScreen({ playerName, playerGender, onSubmit, onBack, frame, onDemo }: {
  playerName: string; playerGender: PlayerGender; onSubmit(name: string, gender: PlayerGender): void; onBack(): void; frame: SelectionFrame;
  onDemo?: (gender: PlayerGender) => void;
}) {
  const { mobile } = useMobileGame();
  const [draft, setDraft] = useState(playerName);
  const [gender, setGender] = useState(playerGender);
  const [error, setError] = useState(false);
  return <StoryShell {...frame} controls={<StoryControls onBack={onBack} nextLabel="Start" nextForm="commander-name"
    nextDisabled={!draft.trim()} nextHint={!draft.trim() ? "Enter your name" : `Ready, ${draft.trim()}!`} progress={<span>NAME</span>} />}>
    <main className="conversation-main selection-main name-main" id="story-content" tabIndex={-1} aria-labelledby="name-title">
      <PlayerCharacterProvider value={gender}><GuideStage /></PlayerCharacterProvider>
      <section className="conversation-panel selection-name-panel">
        <span className="selection-eyebrow"><Sparkles size={17} />ZERO TO BEYOND</span>
        <h1 id="name-title">Your name</h1>
        <form id="commander-name" onSubmit={event => { event.preventDefault(); if (!draft.trim()) { setError(true); return; } onSubmit(draft, gender); }}>
          <label htmlFor="commander-name-input">Your explorer name</label>
          <input id="commander-name-input" name="commanderName" value={draft} placeholder="Charlie" maxLength={40} autoComplete="nickname"
            autoFocus={!mobile} required aria-describedby={error ? 'name-error' : undefined}
            onChange={event => { setDraft(event.target.value); setError(false); }} />
          {error ? <p id="name-error" role="alert">Enter a name to begin.</p> : null}
          <fieldset className="player-gender-picker">
            <legend>Choose your character</legend>
            <div>{(['male', 'female'] as const).map(option => <label key={option} className={gender === option ? 'is-selected' : ''}>
              <input type="radio" name="playerGender" value={option} checked={gender === option} onChange={() => setGender(option)} />
              <span>{option === 'male' ? 'Male' : 'Female'}</span>{gender === option ? <Check size={19} aria-hidden="true" /> : null}
            </label>)}</div>
          </fieldset>
        </form>
        {onDemo ? <button className="story-demo-button" onClick={() => onDemo(gender)}><Rocket size={18} />Judge demo <span>Try checks & launch</span></button> : null}
      </section>
    </main>
  </StoryShell>;
}

export function ChoiceScreen({ step, progress, onSelect, onNext, onBack, frame }: {
  step: Extract<StoryStep, { kind: 'choice' }>; progress: StoryProgress; onSelect(id: ChoiceId): void;
  onNext(): void; onBack(): void; frame: SelectionFrame;
}) {
  const index = selectionSteps.findIndex(item => item.id === step.id);
  const selected = (progress.selections as Record<string, string | null | undefined>)[step.choiceKey];
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus({ preventScroll: true }); }, [step.id]);
  return <StoryShell {...frame} controls={<StoryControls onBack={onBack} onNext={onNext}
    nextHint={!selected ? "Pick a card" : "Choice saved"} nextDisabled={!step.options.some((option: any) => option.available && option.id === selected)} progress={<ProgressDots index={index} />} />}>
    <main className="conversation-main selection-main" id="story-content" tabIndex={-1} aria-labelledby="selection-title">
      <GuideStage cue={step.choiceKey === 'site' ? READY : GUIDE} />
      <section className={`selection-board board-${step.choiceKey}`}>
        <span className="selection-eyebrow">MISSION {String(index + 1).padStart(2, '0')}</span>
        <h1 id="selection-title" tabIndex={-1} ref={title}>{step.choiceKey === 'destination' ? 'Where to?' : step.choiceKey === 'objective' ? 'Pick your mission' : 'Where shall we land?'}</h1>
        <div className="selection-cards" role="group" aria-label={step.title}>
          {step.options.filter((option: any) => option.id !== 'coming-soon').map((option: any) => <article className="selection-choice" key={option.id}><button type="button" key={option.id} disabled={!option.available}
            className={`selection-card ${selected === option.id ? 'is-selected' : ''}`} aria-pressed={selected === option.id}
            aria-label={option.label} onClick={() => onSelect(option.id)}>
            <span className="selection-card-state" aria-hidden="true">{!option.available ? <LockKeyhole size={19} /> : selected === option.id ? <Check size={20} /> : <ArrowMarker />}</span>
            <SelectionArt kind={option.id} />
            <span className="selection-card-copy"><strong>{option.id === 'lunar-ice' ? 'Find ice clues' : option.id === 'lunar-geology' ? 'Explore Moon rocks' : option.id === 'crater-rim' ? 'Crater rim' : option.id === 'permanent-shadow' ? 'Deep shadow' : option.id === 'coming-soon' ? 'Coming soon' : option.label}</strong>
              {option.description ? <span className="selection-card-description">{option.id === 'crater-rim' ? 'More light · safer route' : option.id === 'permanent-shadow' ? 'Dark & cold · harder route' : option.description}</span> : null}
              {!option.available && option.id === 'mars' ? <span className="selection-card-lock">Coming soon</span> : null}
            </span>
          </button><div className="selection-choice-hint">{option.id === 'moon' ? 'Tap to start →' : option.id === 'crater-rim' ? <Term term="crater">Sunlit start · solar can work</Term> : option.id === 'permanent-shadow' ? <Term term="shadow">No solar · better warmth needed</Term> : option.id === 'lunar-ice' ? <Term term="nss">Look for water clues</Term> : option.id === 'lunar-geology' ? <Term term="geology">Study rocks & soil</Term> : option.id==='lunar-highlands'?<Term term="geology">Explore old crust</Term>:option.id==='ancient-crater'?<Term term="crater">Explore impact clues</Term>:'Locked'}</div></article>)}
        </div>
        <div className="selection-word-help">{step.choiceKey === 'site'&&progress.selections.objective==='lunar-geology'?<Term term="geology">Rock origins</Term>:step.choiceKey === 'site' ? <><Term term="crater">Crater rim</Term><Term term="shadow">Permanent shadow</Term></> : step.choiceKey === 'objective' ? <Term term="geology">Geology</Term> : null}</div>
      </section>
    </main>
  </StoryShell>;
}
function ArrowMarker() {
  return <span className="selection-empty-marker" />;
}

export function MissionHome({
  progress,
  onContinue,
  onRestart,
  frame,
  onDemo,
  onOpenArchive,
}: {
  progress: StoryProgress;
  onContinue(): void;
  onBack(): void;
  onRestart(): void;
  frame: SelectionFrame;
  onDemo?: () => void;
  onOpenArchive?: () => void;
}) {
  const hasProgress = !!progress.playerName;
  const mobileGame = useMobileGame();
  const { isInstalled, promptInstall } = usePwaStore();
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
          {onDemo ? (
            <button
              type="button"
              onClick={() => {
                mobileGame.start();
                onDemo();
              }}
            >
              <Rocket size={18} />
              <span>Judge demo</span>
            </button>
          ) : null}
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
  </StoryShell>
);
}
