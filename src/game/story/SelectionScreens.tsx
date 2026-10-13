import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowRight, Play, RotateCcw, Check, CheckCircle2, LockKeyhole, MapPin, Moon, Rocket, Sparkles } from 'lucide-react';
import { CharacterStage } from './CharacterStage.tsx';
import { SelectionArt } from './SelectionArt.tsx';
import { StoryControls, StoryShell } from './StoryShell.tsx';
import type { StoryShellProps } from './StoryShell.tsx';
import type { CharacterCue, ChoiceId, PlayerGender, StoryProgress, StoryStep } from './types.ts';
import { PlayerCharacterProvider } from './playerCharacter.tsx';
import { STORY_FLOW } from './flow.ts';
import './selection.css';
import './missionExperience.css';
const HomeViewport = lazy(() => import('./HomeViewport.tsx').then(module => ({ default: module.HomeViewport })));
import { Term } from './Learning.tsx';
import { useMobileGame } from './mobileGameContext.ts';

const GUIDE: CharacterCue = { character: 'commander', expression: 'encouraging', pose: 'point' };
const READY: CharacterCue = { character: 'commander', expression: 'confident', pose: 'ready' };
export type SelectionFrame = Omit<StoryShellProps, 'children' | 'controls'>;
const selectionSteps = STORY_FLOW.filter((step): step is Extract<StoryStep, { kind: 'choice' }> => step.kind === 'choice');

function ProgressDots({ index }: { index: number }) {
  return <><span>Plan · {index + 1}/3</span><div aria-hidden="true">{selectionSteps.map((step, i) => <i key={step.id} className={index === i ? 'current' : index > i ? 'done' : ''} />)}</div></>;
}
function GuideStage({ cue = GUIDE }: { cue?: CharacterCue }) {
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
  const selected = progress.selections[step.choiceKey];
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus({ preventScroll: true }); }, [step.id]);
  return <StoryShell {...frame} controls={<StoryControls onBack={onBack} onNext={onNext}
    nextHint={!selected ? "Pick a card" : "Choice saved"} nextDisabled={!step.options.some(option => option.available && option.id === selected)} progress={<ProgressDots index={index} />} />}>
    <main className="conversation-main selection-main" id="story-content" tabIndex={-1} aria-labelledby="selection-title">
      <GuideStage cue={step.choiceKey === 'site' ? READY : GUIDE} />
      <section className={`selection-board board-${step.choiceKey}`}>
        <span className="selection-eyebrow">MISSION {String(index + 1).padStart(2, '0')}</span>
        <h1 id="selection-title" tabIndex={-1} ref={title}>{step.choiceKey === 'destination' ? 'Where to?' : step.choiceKey === 'objective' ? 'Pick your mission' : 'Where shall we land?'}</h1>
        <div className="selection-cards" role="group" aria-label={step.title}>
          {step.options.filter(option => option.id !== 'coming-soon').map(option => <article className="selection-choice" key={option.id}><button type="button" key={option.id} disabled={!option.available}
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
function ArrowMarker() { return <span className="selection-empty-marker" />; }

export function MissionHome({ progress, onContinue, onRestart, frame, onDemo }: {
  progress: StoryProgress; onContinue(): void; onBack(): void; onRestart(): void; frame: SelectionFrame;
  onDemo?: () => void;
}) {
  const hasProgress = !!progress.playerName;
  const mobileGame = useMobileGame();
  return <StoryShell {...frame} controls={null}>
    <main className="mission-home" id="story-content" tabIndex={-1} aria-labelledby="mission-home-title">
      <section className="home-copy">
        <span className="home-mission-tag"><span/>YOUR FIRST MOON MISSION</span>
        <h1 id="mission-home-title">Small explorer.<br/><em>Big adventure.</em></h1>
        <p>Build it. Test it. Launch it.</p>
        <button className="home-play conversation-next" data-primary-action onClick={() => { mobileGame.start(); onContinue(); }}><Play size={25} fill="currentColor"/>Play now<ArrowRight size={25}/></button>
        <span className="home-play-note">{hasProgress ? `Continue ${progress.playerName}’s saved adventure` : 'Your adventure starts here'}</span>
        <div className="home-other-actions">
          {onDemo ? <button onClick={() => { mobileGame.start(); onDemo(); }}><Rocket size={18}/>Judge demo</button> : null}
          {hasProgress ? <button onClick={onRestart}><RotateCcw size={17}/>New mission</button> : null}
        </div>
        <div className="home-mission-trail" aria-label="Mission path"><span><span>01</span>Build</span><i/><span><span>02</span>Test</span><i/><span><span>03</span>Launch</span></div>
      </section>
      <section className="home-scene" aria-label="Moon mission preview">
        <div className="home-planet" aria-hidden="true"/><div className="home-orbit" aria-hidden="true"/>
        <Suspense fallback={<div className="home-world-fallback">Opening your Moon adventure…</div>}><HomeViewport/></Suspense>
        <div className="home-scene-badge"><span/>MISSION 01 <strong>THE MOON</strong></div>
        <span className="home-scene-note">Your rover. Your choices.</span>
      </section>
    </main>
  </StoryShell>;
}

export function MissionPlan({ progress, onBack, frame }: { progress: StoryProgress; onBack(): void; frame: SelectionFrame }) {
  const icons = [Moon, Sparkles, MapPin];
  return <StoryShell {...frame} controls={<StoryControls onBack={onBack} nextLabel="Workshop" nextDisabled progress={<span>READY</span>} />}>
    <main className="conversation-main selection-main" id="story-content" tabIndex={-1} aria-labelledby="mission-plan-title">
      <GuideStage cue={READY} />
      <section className="conversation-panel selection-plan-panel">
        <span className="selection-eyebrow"><CheckCircle2 size={18} />MISSION PLAN</span>
        <h1 id="mission-plan-title">Ready to build!</h1>
        <dl className="selection-plan-summary">{selectionSteps.map((step, index) => {
          const Icon = icons[index];
          const choice = step.options.find(option => option.id === progress.selections[step.choiceKey]);
          return <div key={step.id}><dt><Icon size={19} />{step.title}</dt><dd>{choice?.label ?? '—'}</dd></div>;
        })}</dl>
        <span className="selection-workshop-soon"><LockKeyhole size={16} />Workshop coming soon</span>
      </section>
    </main>
  </StoryShell>;
}

export function RestartStoryDialog({ open, onClose, onConfirm }: { open: boolean; onClose(): void; onConfirm(): void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
    return () => { if (dialog?.open) dialog.close(); };
  }, [open]);
  return <dialog ref={ref} className="selection-reset-dialog" aria-labelledby="restart-story-title"
    onCancel={onClose} onClose={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <h2 id="restart-story-title">Start a new mission?</h2><p>This clears your name, design, checks and flight.</p>
    <div><button className="conversation-back" autoFocus onClick={onClose}>Keep playing</button>
      <button className="conversation-next" onClick={onConfirm}>Start fresh</button></div>
  </dialog>;
}
