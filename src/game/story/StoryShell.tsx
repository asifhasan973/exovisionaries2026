import { ArrowLeft, ArrowRight, Rocket, Volume2, VolumeX } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import './viewport.css';
import { SettingsButton } from './GameSettings.tsx';
import { HintButton, LearningControls } from './Learning.tsx';

export interface StoryShellProps {
  children: ReactNode;
  controls: ReactNode;
  headerExtra?: ReactNode;
  onHome?: () => void;
  exitURL?: string;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  voiceAvailable?: boolean;
  skipTarget?: string;
}

/** Shared navigation frame for conversations, mission cards and the workshop handoff. */
export function StoryShell({ children, controls, headerExtra, onHome, exitURL = import.meta.env.BASE_URL,
  voiceEnabled = true, onToggleVoice, voiceAvailable = true, skipTarget = 'story-content' }: StoryShellProps) {
  useEffect(() => {
    const advance = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.defaultPrevented || event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (document.querySelector('dialog[open]')) return;
      const target = event.target as HTMLElement;
      // Native form submission and focused controls keep their keyboard behavior.
      if (target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
      const action = document.querySelector<HTMLButtonElement>('.conversation-game [data-primary-action]:not(:disabled):not([inert] *)');
      if (action) { event.preventDefault(); action.click(); }
    };
    window.addEventListener('keydown', advance);
    return () => window.removeEventListener('keydown', advance);
  }, []);
  const brand = <><span><Rocket size={25} /></span>Zero To Beyond</>;
  return <div className={`conversation-game ${controls ? '' : 'without-footer'}`}>
    <a className="conversation-skip" href={`#${skipTarget}`}>Skip to mission</a>
    <header className="conversation-header">
      {onHome ? <button className="conversation-brand" onClick={onHome} aria-label="Zero To Beyond home">{brand}</button>
        : <a className="conversation-brand" href={exitURL}>{brand}</a>}
      <nav aria-label="Mission controls">
        {headerExtra}
        <LearningControls /><SettingsButton />
        {onToggleVoice ? <button className="conversation-icon labeled-control" onClick={onToggleVoice} disabled={!voiceAvailable}
          aria-label={!voiceAvailable ? 'Narration unavailable' : voiceEnabled ? 'Mute narration' : 'Enable narration'}
          aria-pressed={voiceEnabled && voiceAvailable} title={!voiceAvailable ? 'Narration unavailable' : voiceEnabled ? 'Mute narration' : 'Enable narration'}>
          {voiceEnabled && voiceAvailable ? <Volume2 size={21} /> : <VolumeX size={21} />}<span>Voice</span>
        </button> : null}
      </nav>
    </header>
    {children}
    {controls}
  </div>;
}

export function StoryControls({ onBack, onNext, nextLabel = 'Next', nextDisabled = false, nextForm, progress, nextHint, backHidden = false, hintDisabled = false }: {
  onBack(): void; onNext?: () => void; nextLabel?: string; nextDisabled?: boolean; nextForm?: string; progress?: ReactNode; nextHint?: string; backHidden?: boolean; hintDisabled?: boolean;
}) {
  return <footer className="conversation-controls">
    {backHidden ? <span /> : <button className="conversation-back" type="button" onClick={onBack}><ArrowLeft size={21} />Back</button>}
    <div className="conversation-progress">{progress}</div>
    <div className="next-control"><HintButton disabled={hintDisabled} /><span className="next-hint" id="next-action-hint">{nextHint}</span><button aria-describedby={nextHint ? "next-action-hint" : undefined} data-primary-action className="conversation-next" type={nextForm ? 'submit' : 'button'} form={nextForm} disabled={nextDisabled} onClick={onNext}>
      {nextLabel}<ArrowRight size={22} />
    </button></div>
  </footer>;
}
