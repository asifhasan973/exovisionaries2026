import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ConversationScene } from './ConversationScene.tsx';
import { ChoiceScreen, MissionHome, NameScreen, RestartStoryDialog } from './SelectionScreens.tsx';
import { getStoryStep } from './flow.ts';
import { createStoryProgress } from './progress.ts';
import { readBrowserSelectionSession, writeBrowserSelectionSession } from './selectionSession.ts';
import { FlightScreen } from './FlightScreen.tsx';
import { ReadinessScreen } from './ReadinessScreen.tsx';
import { WorkshopScreen } from './WorkshopScreen.tsx';
import { createWorkshopSession, reduceMission } from './workshopSession.ts';
import { createJudgeMission } from './demo.ts';
import type { MissionEvent } from './workshopSession.ts';
import type { SelectionFrame } from './SelectionScreens.tsx';
import './conversation.css';
import './selection.css';
import './playability.css';

/** Exact dialogue and a real preparation manifest share one saved mission. */
export default function ExactStory() {
  const [session] = useState(readBrowserSelectionSession);
  const [mission, setMission] = useState(() => createWorkshopSession(session.progress, session.preparation, session.readiness, session.flight));
  const { progress, preparation, readiness, flight } = mission;
  const [voiceEnabled, setVoiceEnabled] = useState(session.voiceEnabled);
  const [storageAvailable, setStorageAvailable] = useState(session.storageAvailable);
  // A user gesture resumes saved narration; reloading cannot queue unsolicited speech.
  const [home, setHome] = useState(!!session.progress.playerName && session.progress.stepId !== 'player-name');
  const [restart, setRestart] = useState(false);
  const [demo, setDemo] = useState(false);
  const normalMission = useRef(mission);
  const step = getStoryStep(progress.stepId);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [progress.stepId, home]);
  const latest = useRef({ progress, voiceEnabled, preparation, readiness, flight, demo });
  useEffect(() => { latest.current = { progress, voiceEnabled, preparation, readiness, flight, demo }; }, [progress, voiceEnabled, preparation, readiness, flight, demo]);
  const flightCheckpoint = Math.floor(flight.t * 2);
  const trialCheckpoint = Math.floor(readiness.trial.progress * 10);
  useEffect(() => {
    const current = latest.current;
    if (current.demo) return;
    const saved = writeBrowserSelectionSession(current.progress, current.voiceEnabled, current.preparation, current.readiness, current.flight);
    // Report external storage results after this render. Cancel obsolete status updates.
    const timer = setTimeout(() => setStorageAvailable(saved), 0);
    return () => clearTimeout(timer);
  }, [progress, voiceEnabled, preparation, readiness.checks, readiness.packing, readiness.approved, readiness.radarConnected, trialCheckpoint, readiness.trial.phase, readiness.trial.paused, flightCheckpoint, flight.status, flight.speed, flight.events, flight.skipped, flight.mode, flight.missedWindow, demo]);
  useEffect(() => {
    const save = () => { const current = latest.current; if (!current.demo) writeBrowserSelectionSession(current.progress, current.voiceEnabled, current.preparation, current.readiness, current.flight); };
    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  }, []);
  const dispatch = useCallback((event: MissionEvent) => setMission(current => reduceMission(current, event)), []);
  const reset = () => { setMission(createWorkshopSession(createStoryProgress())); setDemo(false); setRestart(false); setHome(false); };
  const startDemo = () => { normalMission.current = mission; setDemo(true); setMission(createJudgeMission()); setHome(false); };
  const goHome = () => { if (demo) { setMission(normalMission.current); setDemo(false); } setHome(true); };
  const requestRestart = () => { if (progress.playerName) setRestart(true); else reset(); };
  const back = () => {
    if (progress.stepId === 'player-name') setHome(true);
    else dispatch({ type: 'back' });
  };
  const frame: SelectionFrame = {
    onHome: goHome, voiceEnabled, onToggleVoice: () => setVoiceEnabled(value => !value),
    voiceAvailable: typeof window.SpeechSynthesisUtterance !== 'undefined' && !!window.speechSynthesis,
    headerExtra: <>
      {demo ? <button className="story-demo-exit" onClick={goHome}>Demo · Exit</button> : null}
      <span className={`selection-save-status ${storageAvailable ? '' : 'is-unsaved'}`} role="status"
        title={storageAvailable ? 'Progress saved on this device' : 'Saving unavailable. Keep this tab open.'}>
        <i aria-hidden="true" /><span>{storageAvailable ? 'Saved' : 'Not saved'}</span>
      </span>
      <button className="conversation-icon" onClick={requestRestart} aria-label="Start a new mission" title="Start a new mission"><RotateCcw size={20} /></button>
    </>,
  };
  let screen;
  if (home) screen = <MissionHome progress={progress} onContinue={() => setHome(false)} onBack={() => setHome(false)} onRestart={requestRestart} onDemo={startDemo} frame={frame} />;
  else if (step.kind === 'name') screen = <NameScreen playerName={progress.playerName} frame={frame} onBack={back} onDemo={startDemo}
    onSubmit={name => setMission(current => {
      if (current.progress.stepId !== 'player-name') return current;
      return reduceMission(reduceMission(current, { type: 'set-name', name }), { type: 'next' });
    })} />;
  else if (step.kind === 'conversation') screen = <ConversationScene title={step.title} lines={step.lines}
    lineIndex={progress.lineIndex} playerName={progress.playerName} onNext={() => dispatch({ type: 'next' })} onBack={back}
    onHome={frame.onHome} headerExtra={frame.headerExtra} narrationEnabled={voiceEnabled} onNarrationEnabledChange={setVoiceEnabled}
    onSkip={() => dispatch({ type: 'skip-briefing' })} />;
  else if (step.kind === 'choice') screen = <ChoiceScreen key={step.id} step={step} progress={progress} frame={frame}
    onNext={() => dispatch({ type: 'next' })} onBack={back} onSelect={choiceId => setMission(current => {
      // Ignore a second click delivered from an already departed selection screen.
      if (current.progress.stepId !== step.id) return current;
      const selected = reduceMission(current, { type: 'select', choiceId });
      return step.choiceKey === 'destination' && selected.progress.selections.destination === 'moon'
        ? reduceMission(selected, { type: 'next' }) : selected;
    })} />;
  else if (step.module === 7) screen = <FlightScreen session={mission} dispatch={dispatch} onBack={back} frame={frame} />;
  else if (step.module === 6) screen = <ReadinessScreen key={progress.stepId} session={mission} dispatch={dispatch} onBack={back} frame={frame} />;
  else screen = <WorkshopScreen key={progress.stepId} session={mission} dispatch={dispatch} onBack={back} frame={frame} />;
  return <>{screen}<RestartStoryDialog open={restart} onClose={() => setRestart(false)} onConfirm={reset} /></>;
}
