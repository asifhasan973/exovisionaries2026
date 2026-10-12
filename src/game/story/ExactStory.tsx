import { repairApplied } from './repairGuidance.ts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PlayerCharacterProvider } from './playerCharacter.tsx';
import type { PlayerGender } from './types.ts';
import { GameSettingsProvider } from './GameSettings.tsx';
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
import { LearningProvider } from './Learning.tsx';
import { GestureGuide } from './GestureGuide.tsx';
import { MobileGameProvider } from './MobileGame.tsx';
import { trialActive } from './trial.ts';

/** Exact dialogue and a real preparation manifest share one saved mission. */
export default function ExactStory() {
  const [session] = useState(readBrowserSelectionSession);
  const [mission, setMission] = useState(() => createWorkshopSession(session.progress, session.preparation, session.readiness, session.flight, session.moon));
  const { progress, preparation, readiness, flight, moon } = mission;
  const [voiceEnabled, setVoiceEnabled] = useState(session.voiceEnabled);
  const [storageAvailable, setStorageAvailable] = useState(session.storageAvailable);
  // A user gesture resumes saved narration; reloading cannot queue unsolicited speech.
  const [home, setHome] = useState(true);
  const [autoBuilding, setAutoBuilding] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [restart, setRestart] = useState(false);
  const [demo, setDemo] = useState(false);
  const normalMission = useRef(mission);
  const step = getStoryStep(progress.stepId);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [progress.stepId, home]);
  const latest = useRef({ progress, voiceEnabled, preparation, readiness, flight, moon, demo });
  useEffect(() => { latest.current = { progress, voiceEnabled, preparation, readiness, flight, moon, demo }; }, [progress, voiceEnabled, preparation, readiness, flight, moon, demo]);
  const flightCheckpoint = Math.floor(flight.t * 2);
  const trialCheckpoint = Math.floor(readiness.trial.progress * 10);
  useEffect(() => {
    const current = latest.current;
    if (current.demo) return;
    const saved = writeBrowserSelectionSession(current.progress, current.voiceEnabled, current.preparation, current.readiness, current.flight, current.moon);
    // Report external storage results after this render. Cancel obsolete status updates.
    const timer = setTimeout(() => setStorageAvailable(saved), 0);
    return () => clearTimeout(timer);
  }, [progress, voiceEnabled, preparation, moon, readiness.checks, readiness.packing, readiness.approved, readiness.radarConnected, trialCheckpoint, readiness.trial.phase, readiness.trial.paused, flightCheckpoint, flight.status, flight.speed, flight.events, flight.skipped, flight.mode, flight.missedWindow, demo]);
  useEffect(() => {
    const save = () => { const current = latest.current; if (!current.demo) writeBrowserSelectionSession(current.progress, current.voiceEnabled, current.preparation, current.readiness, current.flight, current.moon); };
    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  }, []);
  const dispatch = useCallback((event: MissionEvent) => setMission(current => reduceMission(current, event)), []);
  const pausedFromMenu = useRef({ flight: false, trial: false });
  const pauseGame = useCallback(() => {
    const current = latest.current;
    pausedFromMenu.current = { flight: current.flight.status === 'running', trial: trialActive(current.readiness.trial) && !current.readiness.trial.paused };
    window.dispatchEvent(new Event('game-help-open'));
  }, []);
  const resumeGame = useCallback(() => {
    if (pausedFromMenu.current.flight) dispatch({ type: 'flight-resume' });
    if (pausedFromMenu.current.trial) dispatch({ type: 'trial-resume' });
    pausedFromMenu.current = { flight: false, trial: false };
  }, [dispatch]);
  const reset = () => { setAutoBuilding(false); setAutoplay(true); setMission(createWorkshopSession(createStoryProgress())); setDemo(false); setRestart(false); setHome(false); };
  const startDemo = (gender: PlayerGender = progress.playerGender) => { setAutoBuilding(false); normalMission.current = mission; setDemo(true); setMission(createJudgeMission(gender)); setHome(false); };
  const goHome = () => { setAutoBuilding(false); if (demo) { setMission(normalMission.current); setDemo(false); } setHome(true); };
  const requestRestart = () => { if (progress.playerName) setRestart(true); else reset(); };
  const back = () => { setAutoBuilding(false);
    setAutoplay(false);
    if (progress.stepId === 'player-name') setHome(true);
    else dispatch({ type: 'back' });
  };
  useEffect(() => { const stop = () => setAutoBuilding(false); window.addEventListener('game-help-open', stop); return () => window.removeEventListener('game-help-open', stop); }, []);
  const frame: SelectionFrame = {
    onHome: goHome, voiceEnabled, onToggleVoice: () => setVoiceEnabled(value => !value),
    voiceAvailable: typeof window.SpeechSynthesisUtterance !== 'undefined' && !!window.speechSynthesis,
    headerExtra: <>
      {demo ? <button className="story-demo-exit" onClick={goHome}>Demo · Exit</button> : null}
      <span className={`selection-save-status ${storageAvailable ? '' : 'is-unsaved'}`} role="status"
        title={storageAvailable ? 'Progress saved on this device' : 'Saving unavailable. Keep this tab open.'}>
        <i aria-hidden="true" /><span>{storageAvailable ? 'Saved' : 'Not saved'}</span>
      </span>

    </>,
  };
  let screen;
  if (home) screen = <MissionHome progress={progress} onContinue={() => { setAutoplay(true); setHome(false); }} onBack={() => setHome(false)} onRestart={requestRestart} onDemo={() => startDemo()} frame={frame} />;
  else if (step.kind === 'name') screen = <NameScreen playerName={progress.playerName} playerGender={progress.playerGender} frame={frame} onBack={back} onDemo={startDemo}
    onSubmit={(name, gender) => { setAutoplay(true); setMission(current => {
      if (current.progress.stepId !== 'player-name') return current;
      return reduceMission(reduceMission(current, { type: 'set-name', name, gender }), { type: 'next' });
    }); }} />;
  else if (step.kind === 'conversation') screen = <ConversationScene title={step.title} lines={step.lines}
    lineIndex={progress.lineIndex} playerName={progress.playerName} onNext={() => { setAutoplay(true); dispatch({ type: 'next' }); }} onBack={back}
    onHome={frame.onHome} headerExtra={frame.headerExtra} narrationEnabled={voiceEnabled} onNarrationEnabledChange={setVoiceEnabled}
    autoplay={autoplay} onSkip={() => { setAutoplay(true); dispatch({ type: 'skip-briefing' }); }} />;
  else if (step.kind === 'choice') screen = <ChoiceScreen key={step.id} step={step} progress={progress} frame={frame}
    onNext={() => { setAutoplay(true); dispatch({ type: 'next' }); }} onBack={back} onSelect={choiceId => { setAutoplay(true); setMission(current => {
      // Ignore a second click delivered from an already departed selection screen.
      if (current.progress.stepId !== step.id) return current;
      const selected = reduceMission(current, { type: 'select', choiceId });
      return step.choiceKey === 'destination' && selected.progress.selections.destination === 'moon'
        ? reduceMission(selected, { type: 'next' }) : selected;
    }); }} />;
  else if (step.module === 7) screen = <FlightScreen session={mission} dispatch={dispatch} onBack={back} frame={frame} />;
  else if (step.module === 6) screen = <ReadinessScreen key={progress.stepId} session={mission} dispatch={dispatch} onBack={back} frame={frame} />;
  else screen = <WorkshopScreen key={progress.stepId} session={mission} dispatch={dispatch} onBack={back} frame={frame}
    autoBuilding={autoBuilding} onStopAutoBuild={() => setAutoBuilding(false)} onAutoBuild={() => { dispatch({ type: 'begin-auto-build' }); setAutoBuilding(true); }} />;
  return <PlayerCharacterProvider value={progress.playerGender}><GameSettingsProvider voiceEnabled={voiceEnabled} onToggleVoice={() => setVoiceEnabled(value => !value)} onRestart={requestRestart}><LearningProvider>
    <MobileGameProvider active={!home} voiceEnabled={voiceEnabled} onToggleVoice={() => setVoiceEnabled(value => !value)} onHome={goHome} onPause={pauseGame} onResume={resumeGame}>
      {screen}<GestureGuide key={`${progress.stepId}-${home}`} step={progress.stepId} repair={mission.repair && !repairApplied(mission.repair, mission.preparation) ? mission.repair : undefined} hidden={home || restart || autoBuilding} /><RestartStoryDialog open={restart} onClose={() => setRestart(false)} onConfirm={reset} />
    </MobileGameProvider>
  </LearningProvider></GameSettingsProvider></PlayerCharacterProvider>;
}
