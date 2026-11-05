import { ArrowLeft, ArrowRight, Rocket, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import './viewport.css';
import { SettingsButton } from './GameSettings.tsx';
import { HintButton, LearningControls } from './Learning.tsx';
import { useMobileGame } from './mobileGameContext.ts';
import { SourcesButton } from './MissionSources.tsx';
import { useStoryNavigation } from './storyNavigationContext.ts';
import { MilestoneRing } from './MilestoneRing.tsx';

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
  const mobileGame = useMobileGame();
  const navigation=useStoryNavigation(),shell=useRef<HTMLDivElement>(null);
  const reviewing=!!navigation?.reviewing&&!navigation.card;
  useEffect(()=>{
    if(!reviewing)return;
    const mains=Array.from(shell.current?.querySelectorAll('main')??[]),previous=mains.map(main=>main.inert);
    mains.forEach(main=>{main.inert=true;});return()=>mains.forEach((main,i)=>{main.inert=previous[i];});
  },[reviewing,children]);
  const footer=reviewing?<StoryControls onBack={navigation!.back} onNext={navigation!.forward} nextLabel="Next" hintDisabled/>:controls??(navigation?.skip?<footer className="conversation-controls"><span/><div className="conversation-progress"><JudgeSkip/></div><span/></footer>:null);
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
  return <div ref={shell} className={`conversation-game ${footer ? '' : 'without-footer'} ${mobileGame.active ? 'is-mobile-game' : ''} ${reviewing?'is-review':''}`}>
    <a className="conversation-skip" href={`#${skipTarget}`}>Skip to mission</a>
    {!mobileGame.active ? <header className="conversation-header">
      {onHome ? <button className="conversation-brand" onClick={onHome} aria-label="Zero To Beyond home">{brand}</button>
        : <a className="conversation-brand" href={exitURL}>{brand}</a>}
      <nav aria-label="Mission controls">
        {headerExtra}
        <MilestoneRing/>
        <LearningControls /><SourcesButton /><SettingsButton />
        {onToggleVoice ? <button className="conversation-icon labeled-control" onClick={onToggleVoice} disabled={!voiceAvailable}
          aria-label={!voiceAvailable ? 'Narration unavailable' : voiceEnabled ? 'Mute narration' : 'Enable narration'}
          aria-pressed={voiceEnabled && voiceAvailable} title={!voiceAvailable ? 'Narration unavailable' : voiceEnabled ? 'Mute narration' : 'Enable narration'}>
          {voiceEnabled && voiceAvailable ? <Volume2 size={21} /> : <VolumeX size={21} />}<span>Voice</span>
        </button> : null}
      </nav>
    </header> : null}
    {children}
    {reviewing?<span className="story-review-note" role="status">Review · mission paused</span>:null}
    {footer}
  </div>;
}

export function StoryControls({ onBack, onNext, nextLabel = 'Next', nextDisabled = false, nextForm, progress, nextHint, backHidden = false, hintDisabled = false, keepProgress=false }: {
  onBack(): void; onNext?: () => void; nextLabel?: string; nextDisabled?: boolean; nextForm?: string; progress?: ReactNode; nextHint?: string; backHidden?: boolean; hintDisabled?: boolean;keepProgress?:boolean;
}) {
  const navigation=useStoryNavigation();
  return <footer className="conversation-controls">
    {backHidden&&!navigation ? <span /> : <button className="conversation-back" type="button" onClick={navigation&&!navigation.card?navigation.back:onBack}><ArrowLeft size={21} />Back</button>}
    <div className="conversation-progress">{navigation?.skip?<JudgeSkip/>:!navigation||keepProgress?progress:null}</div>
    <div className="next-control">{!navigation?.card?<HintButton disabled={hintDisabled} />:null}<span className="next-hint" id="next-action-hint">{nextHint}</span><button aria-describedby={nextHint ? "next-action-hint" : undefined} data-primary-action className="conversation-next" type={nextForm ? 'submit' : 'button'} form={nextForm} disabled={nextDisabled} onClick={onNext}>
      {nextLabel}<ArrowRight size={22} />
    </button></div>
  </footer>;
}

export function JudgeSkip(){
  const navigation=useStoryNavigation();
  return navigation?.skip?<button type="button" className="conversation-judge-skip" onClick={navigation.skip} disabled={navigation.skipping} title="Skip this page in an assisted judge preview. Your main mission is saved separately."><SkipForward size={17}/>{navigation.skipping?'Opening…':'Skip'}</button>:null;
}
