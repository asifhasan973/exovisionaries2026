import type { StoryStepId } from './types.ts';
import { repairApplied } from './repairGuidance.ts';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { PlayerCharacterProvider } from './playerCharacter.tsx';
import type { PlayerGender } from './types.ts';
import { GameSettingsProvider } from './GameSettings.tsx';
import { ConversationScene } from './ConversationScene.tsx';
import { ChoiceScreen, MissionHome, NameScreen, RestartStoryDialog } from './SelectionScreens.tsx';
import { getStoryStep } from './flow.ts';
import { createStoryProgress } from './progress.ts';
import { readBrowserSelectionSession, writeBrowserSelectionSession, readBrowserDemoSession, writeBrowserDemoSession, hasBrowserDemoCheckpoint } from './selectionSession.ts';
import { FlightScreen } from './FlightScreen.tsx';
import { ReadinessScreen } from './ReadinessScreen.tsx';
import { WorkshopScreen } from './WorkshopScreen.tsx';
import { createWorkshopSession, reduceMission } from './workshopSession.ts';
import { createDemoChapter } from './demoChapters.ts';
import type { DemoChapterId } from './demoChapters.ts';
import { DemoMenu } from './DemoMenu.tsx';
import { MissionBoundary } from './MissionBoundary.tsx';
import type { MissionEvent } from './workshopSession.ts';
import type { SelectionFrame } from './SelectionScreens.tsx';
import './conversation.css';
import './selection.css';
import './playability.css';
import { LearningProvider } from './Learning.tsx';
import { GestureGuide } from './GestureGuide.tsx';
import { MobileGameProvider } from './MobileGame.tsx';
import { trialActive } from './trial.ts';
import { useLoadingStore } from '../../state/loadingStore';
import { isEngineFrozen } from '../../state/orientationLifecycleStore';
import { useAudioStore } from '../../state/audioStore';
const ReturnScreen=lazy(()=>import('./moon/ReturnScreen.tsx').then(m=>({default:m.ReturnScreen})));
const RecoveryScreen=lazy(()=>import('./moon/RecoveryScreen.tsx').then(m=>({default:m.RecoveryScreen})));
const ScienceScreen=lazy(()=>import('./moon/ScienceScreen.tsx').then(m=>({default:m.ScienceScreen})));
const SurfaceScreen=lazy(()=>import('./moon/SurfaceScreen.tsx').then(m=>({default:m.SurfaceScreen})));
const LandingScreen=lazy(()=>import('./moon/LandingScreen.tsx').then(m=>({default:m.LandingScreen})));
const JourneyScreen=lazy(()=>import('./moon/JourneyScreen.tsx').then(m=>({default:m.JourneyScreen})));
const HumanReadinessScreen = lazy(() => import('./moon/HumanReadinessScreen.tsx').then(module => ({ default: module.HumanReadinessScreen })));
const CrewScreen = lazy(() => import('./moon/CrewScreen.tsx').then(module => ({ default: module.CrewScreen })));
const NasaMissionArchive = lazy(() => import('../../components/archive/NasaMissionArchive').then(module => ({ default: module.NasaMissionArchive })));

import { createDebugSession } from '../../debug/debugConfig';

export interface ExactStoryProps {
  debugStepId?: string;
  debugDemoChapter?: string;
  initialHome?: boolean;
  initialArchive?: boolean;
}

/** Exact dialogue and a real preparation manifest share one saved mission. */
export default function ExactStory({ debugStepId, debugDemoChapter, initialHome, initialArchive }: ExactStoryProps = {}) {
  const isDebugSession = Boolean(debugStepId || debugDemoChapter);
  const [archiveOpen, setArchiveOpen] = useState(() => Boolean(initialArchive));
  const [session] = useState(readBrowserSelectionSession);
  const [mission, setMission] = useState(() => {
    if (debugStepId) {
      return createDebugSession(debugStepId as StoryStepId);
    }
    return createWorkshopSession(session.progress, session.preparation, session.readiness, session.flight, session.moon, session.repair);
  });
  const { progress, preparation, readiness, flight, moon } = mission;
  const isMuted = useAudioStore((s) => s.isMuted);
  const voicesEnabled = useAudioStore((s) => s.voicesEnabled);
  const setAudioMuted = useAudioStore((s) => s.setMuted);
  const setVoicesEnabled = useAudioStore((s) => s.setVoicesEnabled);
  const voiceEnabled = !isMuted && voicesEnabled;
  const setVoiceEnabled = useCallback((valueOrUpdater: boolean | ((prev: boolean) => boolean)) => {
    const audio = useAudioStore.getState();
    const current = !audio.isMuted && audio.voicesEnabled;
    const nextVal = typeof valueOrUpdater === 'function' ? valueOrUpdater(current) : valueOrUpdater;
    setVoicesEnabled(nextVal);
    if (nextVal && audio.isMuted) setAudioMuted(false);
  }, [setAudioMuted, setVoicesEnabled]);
  const toggleAudioMute = useCallback(() => setVoiceEnabled(value => !value), [setVoiceEnabled]);

  useEffect(() => {
    if (session.voiceEnabled === false) {
      setVoicesEnabled(false);
    }
  }, [session.voiceEnabled, setVoicesEnabled]);
  const [storageAvailable, setStorageAvailable] = useState(session.storageAvailable);
  // A user gesture resumes saved narration; reloading cannot queue unsolicited speech.
  const [home, setHome] = useState(() => {
    if (initialHome) return true;
    if (debugStepId || debugDemoChapter || initialArchive) return false;
    return true;
  });
  const [autoBuilding, setAutoBuilding] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [restart, setRestart] = useState(false);
  const [demo, setDemo] = useState(false);
  const [demoAvailable, setDemoAvailable] = useState(hasBrowserDemoCheckpoint);
  const [demoGender, setDemoGender] = useState<PlayerGender | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const demoRequest = useRef(0);
  const normalMission = useRef(mission);
  const step = getStoryStep(progress.stepId,progress.selections.objective);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [progress.stepId, home]);
  const latest = useRef({ progress, voiceEnabled: voicesEnabled, preparation, readiness, flight, moon, demo, repair: mission.repair });
  useEffect(() => { latest.current = { progress, voiceEnabled: voicesEnabled, preparation, readiness, flight, moon, demo, repair: mission.repair }; }, [progress, voicesEnabled, preparation, readiness, flight, moon, demo, mission.repair]);

  useEffect(() => {
    if (debugStepId) {
      setMission(createDebugSession(debugStepId as StoryStepId));
      setHome(false);
      setAutoBuilding(false);
      setAutoplay(false);
    }
  }, [debugStepId]);

  useEffect(() => {
    if (debugDemoChapter) {
      startDemo(debugDemoChapter as DemoChapterId);
    }
  }, [debugDemoChapter]);

  const flightCheckpoint = Math.floor(flight.t * 2);
  const incident=moon.science.hazards;
  const incidentCheckpoint=[incident.pending,incident.dust,incident.kitUsed,incident.sensorCalibrated,incident.radiationUntil,incident.evaBlocked,incident.autoWaitAtBase,incident.recovery,incident.feedback,incident.roverParked,incident.dataArchived,incident.crewChecked,incident.log.map(r=>`${r.id}:${r.status}:${r.action}`).join(',')].join('|');
  const returnCheckpoint=[moon.returnFlight.stage,Math.floor(moon.returnFlight.frame/5),moon.returnFlight.paused,moon.returnFlight.speed,moon.returnFlight.mode,moon.returnFlight.mistakes,moon.returnFlight.alignment,moon.returnFlight.closingMS,moon.returnFlight.assisted].join('|');
  const scienceCheckpoint=Math.floor(moon.science.frame/5);
  const surfaceCheckpoint=Math.floor((moon.surface.phaseFrame+moon.surface.legFrame)/5);
  const landingInputCheckpoint=moon.landing.mode==='challenge'?`${moon.landing.throttle}|${moon.landing.steer}`:'';
  const landingCheckpoint=Math.floor(moon.landing.steps/30);
  const journeyCheckpoint=Math.floor(moon.journey.elapsed*2);
  const trialCheckpoint = Math.floor(readiness.trial.progress * 10);
  useEffect(() => {
    if (isDebugSession) return;
    const current = latest.current;
    const saved = current.demo ? writeBrowserDemoSession(current) : writeBrowserSelectionSession(current.progress, current.voiceEnabled, current.preparation, current.readiness, current.flight, current.moon, current.repair);
    // Report external storage results after this render. Cancel obsolete status updates.
    const timer = setTimeout(() => setStorageAvailable(saved), 0);
    return () => clearTimeout(timer);
  }, [isDebugSession, returnCheckpoint, mission.repair, progress, voiceEnabled, voicesEnabled, preparation, moon.designSignature, moon.human, moon.phase, moon.journey.stage, moon.journey.route, moon.journey.direction, moon.journey.mode, moon.journey.speed, moon.journey.paused, moon.journey.assisted, moon.journey.attempts, journeyCheckpoint, landingCheckpoint, surfaceCheckpoint, scienceCheckpoint, moon.science.phase, moon.science.target, moon.science.depthCm, moon.science.program, moon.science.useGas, moon.science.sensorPlan, moon.science.samples, moon.science.seismometerSite, moon.science.paused, moon.science.records, moon.science.accepted, moon.science.feedback, moon.science.attempts, moon.science.assisted, incidentCheckpoint, moon.science.committed, moon.science.fieldworkStopped, moon.surface.stage, moon.surface.location, moon.surface.selected, moon.surface.mode, moon.surface.pace, moon.surface.paused, moon.surface.held, moon.surface.autonomyArmed, moon.surface.assisted, moon.surface.attempts, moon.landing.stage, moon.landing.paused, moon.landing.mode, moon.landing.target, landingInputCheckpoint, moon.landing.assisted, moon.landing.attempts, moon.landing.decisionPending, readiness.checks, readiness.packing, readiness.approved, readiness.radarConnected, trialCheckpoint, readiness.trial.phase, readiness.trial.paused, flightCheckpoint, flight.status, flight.speed, flight.events, flight.skipped, flight.mode, flight.missedWindow, demo]);
  useEffect(() => {
    if (isDebugSession) return;
    const save = () => { const current = latest.current; if (current.demo) writeBrowserDemoSession(current); else writeBrowserSelectionSession(current.progress, current.voiceEnabled, current.preparation, current.readiness, current.flight, current.moon, current.repair); };
    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  }, [isDebugSession]);
  // Global suspension gates progress without changing a subsystem's manual pause.
  // Timers keep their wall-clock baseline current, so releasing it adds no time debt.
  const dispatch = useCallback((event: MissionEvent) => setMission(current =>
    isEngineFrozen() && !event.type.endsWith('-pause') ? current : reduceMission(current, event)), []);
  const pausedFromMenu = useRef({ flight: false, trial: false, journey:false,landing:false,surface:false,science:false,returning:false });
  const pauseGame = useCallback(() => {
    const current = latest.current;
    const shouldPause = {
      flight: current.flight.status === 'running',
      trial: trialActive(current.readiness.trial) && !current.readiness.trial.paused,
      returning: current.progress.stepId === 'crew-return' && !current.moon.returnFlight.paused,
      science: ['ice-science', 'surface-recovery'].includes(current.progress.stepId) && !current.moon.science.paused,
      surface: ['lunar-surface', 'surface-explore'].includes(current.progress.stepId) && !current.moon.surface.paused,
      landing: current.progress.stepId === 'lunar-descent' && !current.moon.landing.paused,
      journey: ['moon-transfer'].includes(current.progress.stepId) && !current.moon.journey.paused && current.moon.journey.stage !== 'complete',
    };

    if (shouldPause.flight) pausedFromMenu.current.flight = true;
    if (shouldPause.trial) pausedFromMenu.current.trial = true;
    if (shouldPause.returning) pausedFromMenu.current.returning = true;
    if (shouldPause.science) pausedFromMenu.current.science = true;
    if (shouldPause.surface) pausedFromMenu.current.surface = true;
    if (shouldPause.landing) pausedFromMenu.current.landing = true;
    if (shouldPause.journey) pausedFromMenu.current.journey = true;

    if (shouldPause.flight) dispatch({ type: 'flight-pause' });
    if (shouldPause.trial) dispatch({ type: 'trial-pause' });
    if (shouldPause.returning) dispatch({ type: 'return-pause' });
    if (shouldPause.science) dispatch({ type: 'science-pause' });
    if (shouldPause.surface) dispatch({ type: 'surface-pause' });
    if (shouldPause.landing) dispatch({ type: 'landing-pause' });
    if (shouldPause.journey) dispatch({ type: 'journey-pause' });

    window.dispatchEvent(new Event('game-help-open'));
  }, [dispatch]);
  const resumeGame = useCallback(() => {
    if (isEngineFrozen()) return;
    if (pausedFromMenu.current.flight) dispatch({ type: 'flight-resume' });
    if (pausedFromMenu.current.returning) dispatch({ type: 'return-resume' });
    if (pausedFromMenu.current.science) dispatch({ type: 'science-resume' });
    if (pausedFromMenu.current.surface) dispatch({ type: 'surface-resume' });
    if (pausedFromMenu.current.landing) dispatch({ type: 'landing-resume' });
    if (pausedFromMenu.current.journey) dispatch({ type: 'journey-resume' });
    if (pausedFromMenu.current.trial) dispatch({ type: 'trial-resume' });
    pausedFromMenu.current = { flight: false, trial: false, journey:false,landing:false,surface:false,science:false,returning:false };
  }, [dispatch]);

  const enterMission = () => {
    useLoadingStore.getState().startLoading('mission_start');
    setAutoplay(true);
    setHome(false);
  };
  const reset = () => {
    useLoadingStore.getState().startLoading('mission_start', 'Preparing fresh mission…');
    setAutoBuilding(false);
    setAutoplay(true);
    setMission(createWorkshopSession(createStoryProgress()));
    setDemo(false);
    setRestart(false);
    setHome(false);
  };
  const closeDemo = () => { demoRequest.current++; setDemoGender(null); setDemoBusy(false); setDemoError(null); };
  const startDemo = async (chapter: DemoChapterId) => {
    const request = ++demoRequest.current;
    setDemoBusy(true); setDemoError(null);
    try {
      // Show loading before executing a reducer-based chapter replay.
      useLoadingStore.getState().startLoading('mission_start', `Preparing ${chapter} demo…`);
      await new Promise(resolve => setTimeout(resolve, 0));
      const prepared = await createDemoChapter(chapter, demoGender ?? progress.playerGender);
      if (request !== demoRequest.current) return;
      if (!demo) normalMission.current = mission;
      setAutoBuilding(false); setDemo(true); setDemoAvailable(true); setMission(prepared);
      setDemoGender(null); setHome(false); setAutoplay(true);
    } catch {
      if (request === demoRequest.current) setDemoError('Chapter unavailable. Try Start here. Your saved game is safe.');
    } finally { if (request === demoRequest.current) setDemoBusy(false); }
  };
  const resumeDemo = () => {
    const saved = readBrowserDemoSession();
    if (!saved) { setDemoAvailable(false); return; }
    useLoadingStore.getState().startLoading('mission_start', 'Resuming demo mission…');
    normalMission.current = mission;
    setDemo(true);
    setAutoBuilding(false);
    setMission(createWorkshopSession(saved.progress,saved.preparation,saved.readiness,saved.flight,saved.moon,saved.repair));
    setDemoGender(null);
    setHome(false);
  };
  const goHome = () => { setAutoBuilding(false); if (demo) { setMission(normalMission.current); setDemo(false); } setHome(true); };
  const requestRestart = () => { if (progress.playerName) setRestart(true); else reset(); };
  const back = () => { setAutoBuilding(false);
    setAutoplay(false);
    if (progress.stepId === 'player-name') setHome(true);
    else dispatch({ type: 'back' });
  };
  useEffect(() => { const stop = () => setAutoBuilding(false); window.addEventListener('game-help-open', stop); return () => window.removeEventListener('game-help-open', stop); }, []);
  const frame: SelectionFrame = {
    onHome: goHome, voiceEnabled, onToggleVoice: toggleAudioMute,
    voiceAvailable: typeof Audio !== 'undefined',
    headerExtra: <>
      {isDebugSession ? (
        <button
          className="story-debug-exit"
          onClick={() => {
            window.location.hash = '';
            setHome(true);
          }}
          title="Exit debug session and return to normal user progress"
        >
          Debug · {debugStepId ?? debugDemoChapter} · Exit
        </button>
      ) : demo ? (
        <button className="story-demo-exit" onClick={goHome}>Demo · Exit</button>
      ) : null}
      <span className={`selection-save-status ${storageAvailable && !isDebugSession ? '' : 'is-unsaved'}`} role="status"
        title={isDebugSession ? 'Ephemeral debug session: local progress preserved' : storageAvailable ? 'Progress saved on this device' : 'Saving unavailable. Keep this tab open.'}>
        <i aria-hidden="true" /><span>{isDebugSession ? 'Debug Mode' : storageAvailable ? 'Saved' : 'Not saved'}</span>
      </span>

    </>,
  };
  let screen;
  if (home) screen = <MissionHome progress={progress} onContinue={enterMission} onBack={() => setHome(false)} onRestart={requestRestart} onDemo={() => setDemoGender(progress.playerGender)} onOpenArchive={() => setArchiveOpen(true)} frame={frame} />;
  else if (step.kind === 'name') screen = <NameScreen playerName={progress.playerName} playerGender={progress.playerGender} frame={frame} onBack={back} onDemo={gender => setDemoGender(gender)}
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
  else if (step.module === 8) screen = <Suspense fallback={<div className="crew-loading" role="status">Opening crew selection…</div>}><CrewScreen key={progress.stepId} session={mission} dispatch={dispatch} onBack={back} frame={frame} /></Suspense>;
  else if(step.module===14)screen=<Suspense fallback={<div className="crew-loading">Opening crew return…</div>}><ReturnScreen session={mission} dispatch={dispatch} frame={frame}/></Suspense>;
  else if(step.module===13)screen=<Suspense fallback={<div className="crew-loading">Opening recovery…</div>}><RecoveryScreen session={mission} dispatch={dispatch} frame={frame}/></Suspense>;
  else if(step.module===12)screen=<Suspense fallback={<div className="crew-loading">Opening science lab…</div>}><ScienceScreen session={mission} dispatch={dispatch} frame={frame}/></Suspense>;
  else if(step.module===11)screen=<Suspense fallback={<div className="crew-loading">Opening Moon surface…</div>}><SurfaceScreen session={mission} dispatch={dispatch} frame={frame}/></Suspense>;
  else if(step.module===10)screen=<Suspense fallback={<div className="crew-loading">Opening Moon landing…</div>}><LandingScreen session={mission} dispatch={dispatch} frame={frame}/></Suspense>;
  else if(step.module===9)screen=<Suspense fallback={<div className="crew-loading">Opening Moon journey…</div>}><JourneyScreen session={mission} dispatch={dispatch} frame={frame}/></Suspense>;
  else if (step.module === 7) screen = <FlightScreen session={mission} dispatch={dispatch} onBack={back} frame={frame} />;
  else if (['crew-check','systems-check','stress-check','rocket-pack','launch-ready'].includes(step.id)) screen = <Suspense fallback={<div className="crew-loading" role="status">Opening mission checks…</div>}><HumanReadinessScreen key={step.id} session={mission} dispatch={dispatch} onBack={back} frame={frame}/></Suspense>;
  else if (step.module === 6) screen = <ReadinessScreen key={progress.stepId} session={mission} dispatch={dispatch} onBack={back} frame={frame} />;
  else screen = <WorkshopScreen key={progress.stepId} session={mission} dispatch={dispatch} onBack={back} frame={frame}
    autoBuilding={autoBuilding} onStopAutoBuild={() => setAutoBuilding(false)} onAutoBuild={() => { dispatch({ type: 'begin-auto-build' }); setAutoBuilding(true); }} />;

  if (archiveOpen) {
    return (
      <Suspense fallback={<div className="fixed inset-0 w-screen h-screen bg-[#030712] flex items-center justify-center text-cyan-400 font-mono text-sm z-50">Opening NASA Mission Archive…</div>}>
        <NasaMissionArchive onBack={() => setArchiveOpen(false)} />
      </Suspense>
    );
  }

  return <PlayerCharacterProvider value={progress.playerGender}><GameSettingsProvider voiceEnabled={voiceEnabled} onToggleVoice={toggleAudioMute} onRestart={requestRestart}><LearningProvider>
    <MobileGameProvider active={!home} voiceEnabled={voiceEnabled} onToggleVoice={toggleAudioMute} onHome={goHome} onPause={pauseGame} onResume={resumeGame}>
      <MissionBoundary key={`${home}-${demo}-${progress.stepId}`} frame={frame} onReload={() => {
        const current = latest.current;
        const saved = current.demo ? writeBrowserDemoSession(current) : writeBrowserSelectionSession(current.progress,current.voiceEnabled,current.preparation,current.readiness,current.flight,current.moon,current.repair);
        if (saved) window.location.reload(); else { setStorageAvailable(false); goHome(); }
      }}>{screen}</MissionBoundary><GestureGuide key={`${progress.stepId}-${home}`} step={progress.stepId} repair={mission.repair && !repairApplied(mission.repair, mission.preparation, mission.moon.crew) ? mission.repair : undefined} hidden={home || restart || autoBuilding || demoGender !== null} /><RestartStoryDialog open={restart} onClose={() => setRestart(false)} onConfirm={reset} />
    {demoGender !== null ? <DemoMenu onClose={closeDemo} busy={demoBusy} error={demoError} resumeAvailable={demoAvailable} onResume={resumeDemo} onChoose={startDemo}/> : null}
    </MobileGameProvider>
  </LearningProvider></GameSettingsProvider></PlayerCharacterProvider>;
}
