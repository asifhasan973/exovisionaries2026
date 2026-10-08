import { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, LockKeyhole, MapPin, Moon, Rocket, Sparkles } from 'lucide-react';
import { CharacterStage } from './CharacterStage.tsx';
import { SelectionArt } from './SelectionArt.tsx';
import { StoryControls, StoryShell } from './StoryShell.tsx';
import type { StoryShellProps } from './StoryShell.tsx';
import type { CharacterCue, ChoiceId, StoryProgress, StoryStep } from './types.ts';
import { STORY_FLOW } from './flow.ts';
import './selection.css';

const GUIDE: CharacterCue = { character: 'commander', expression: 'encouraging', pose: 'point' };
const READY: CharacterCue = { character: 'commander', expression: 'confident', pose: 'ready' };
export type SelectionFrame = Omit<StoryShellProps, 'children' | 'controls'>;
const selectionSteps = STORY_FLOW.filter((step): step is Extract<StoryStep, { kind: 'choice' }> => step.kind === 'choice');

function ProgressDots({ index }: { index: number }) {
  return <><span>{index + 1} / 3</span><div aria-hidden="true">{selectionSteps.map((step, i) => <i key={step.id} className={index === i ? 'current' : index > i ? 'done' : ''} />)}</div></>;
}
function GuideStage({ cue = GUIDE }: { cue?: CharacterCue }) {
  return <div className="conversation-stage selection-guide">
    <div className="conversation-stage-orbit orbit-one" /><div className="conversation-stage-orbit orbit-two" />
    <CharacterStage cue={cue} active speaking={false} label="Commander" />
  </div>;
}

export function NameScreen({ playerName, onSubmit, onBack, frame, onDemo }: {
  playerName: string; onSubmit(name: string): void; onBack(): void; frame: SelectionFrame;
  onDemo?: () => void;
}) {
  const [draft, setDraft] = useState(playerName);
  const [error, setError] = useState(false);
  return <StoryShell {...frame} controls={<StoryControls onBack={onBack} nextLabel="Start" nextForm="commander-name"
    nextDisabled={!draft.trim()} progress={<span>NAME</span>} />}>
    <main className="conversation-main selection-main name-main" id="story-content" tabIndex={-1} aria-labelledby="name-title">
      <GuideStage />
      <section className="conversation-panel selection-name-panel">
        <span className="selection-eyebrow"><Sparkles size={17} />ZERO TO BEYOND</span>
        <h1 id="name-title">Enter ur name</h1>
        <form id="commander-name" onSubmit={event => { event.preventDefault(); if (!draft.trim()) { setError(true); return; } onSubmit(draft); }}>
          <label htmlFor="commander-name-input">Commander name</label>
          <input id="commander-name-input" name="commanderName" value={draft} placeholder="Charlie" maxLength={40} autoComplete="nickname"
            autoFocus required aria-describedby={error ? 'name-error' : undefined}
            onChange={event => { setDraft(event.target.value); setError(false); }} />
          {error ? <p id="name-error" role="alert">Enter a name to begin.</p> : null}
        </form>
        {onDemo ? <button className="story-demo-button" onClick={onDemo}><Rocket size={18} />Judge demo <span>Try checks & launch</span></button> : null}
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
    nextDisabled={!step.options.some(option => option.available && option.id === selected)} progress={<ProgressDots index={index} />} />}>
    <main className="conversation-main selection-main" id="story-content" tabIndex={-1} aria-labelledby="selection-title">
      <GuideStage cue={step.choiceKey === 'site' ? READY : GUIDE} />
      <section className={`selection-board board-${step.choiceKey}`}>
        <span className="selection-eyebrow">MISSION {String(index + 1).padStart(2, '0')}</span>
        <h1 id="selection-title" tabIndex={-1} ref={title}>{step.title}</h1>
        <div className="selection-cards" role="group" aria-label={step.title}>
          {step.options.map(option => <button type="button" key={option.id} disabled={!option.available}
            className={`selection-card ${selected === option.id ? 'is-selected' : ''}`} aria-pressed={selected === option.id}
            aria-label={option.label} onClick={() => onSelect(option.id)}>
            <span className="selection-card-state" aria-hidden="true">{!option.available ? <LockKeyhole size={19} /> : selected === option.id ? <Check size={20} /> : <ArrowMarker />}</span>
            <SelectionArt kind={option.id} />
            <span className="selection-card-copy"><strong>{option.label}</strong>
              {option.description ? <span className="selection-card-description">{option.description}</span> : null}
              {!option.available && option.id === 'mars' ? <span className="selection-card-lock">Comming Soon</span> : null}
            </span>
          </button>)}
        </div>
      </section>
    </main>
  </StoryShell>;
}
function ArrowMarker() { return <span className="selection-empty-marker" />; }

export function MissionHome({ progress, onContinue, onBack, onRestart, frame, onDemo }: {
  progress: StoryProgress; onContinue(): void; onBack(): void; onRestart(): void; frame: SelectionFrame;
  onDemo?: () => void;
}) {
  const hasProgress = !!progress.playerName;
  return <StoryShell {...frame} controls={<StoryControls onBack={onBack} onNext={onContinue}
    nextLabel={hasProgress ? 'Continue' : 'Start'} progress={<span>MISSION</span>} />}>
    <main className="conversation-main selection-main" id="story-content" tabIndex={-1} aria-labelledby="mission-home-title">
      <GuideStage />
      <section className="conversation-panel selection-home-panel">
        <span className="selection-eyebrow"><Rocket size={18} />A SPACE ADVENTURE</span>
        <h1 id="mission-home-title">{hasProgress ? `Ready, ${progress.playerName}?` : 'Your mission awaits.'}</h1>
        {hasProgress ? <p>Your adventure is saved. Let’s continue!</p> : <p>Pick a destination. Prepare your spacecraft.</p>}
        {hasProgress ? <button className="selection-new-mission" onClick={onRestart}>Start a new mission</button> : null}
        {onDemo ? <button className="story-demo-button" onClick={onDemo}><Rocket size={18} />Judge demo <span>Try checks & launch</span></button> : null}
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
