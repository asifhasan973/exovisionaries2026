import { useGameSettings } from './gameSettingsContext.ts';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Info, Pause, Play, Rocket, RotateCcw, SkipForward, Trophy } from 'lucide-react';
import { sound } from '../../audio/soundEngine.ts';
import { StoryShell } from './StoryShell.tsx';
import { FLIGHT_DURATION, flightTelemetry, pendingFlightAction, nextFlightGate, releaseIsSafe } from './flight.ts';
import type { WorkshopSession, MissionEvent } from './workshopSession.ts';
import type { SelectionFrame } from './SelectionScreens.tsx';
import { HintButton, Term } from './Learning.tsx';
import { GameInfo } from './GameInfo.tsx';
import { ReleaseWindow } from './ReleaseWindow.tsx';
import { FlightGuide } from './FlightGuide.tsx';
import './launch.css';
const FlightViewport = lazy(() => import('./FlightViewport.tsx').then(m => ({ default: m.FlightViewport })));

export function FlightScreen({ session, dispatch, frame, onBack }: { session: WorkshopSession; dispatch(event: MissionEvent): void; frame: SelectionFrame; onBack(): void }) {
  const { effects, gentle } = useGameSettings();
  const { flight, progress, preparation } = session;
  const telemetry = flightTelemetry(flight), gate = pendingFlightAction(flight), orbit = progress.stepId === 'earth-orbit';
  const complete = flight.status === 'complete', ready = flight.status === 'ready', challenge = flight.mode === 'challenge';
  const nextGate = nextFlightGate(flight), safe = challenge && releaseIsSafe(flight);
  const incorrect = challenge && flight.feedback && !flight.feedback.startsWith('Clean release');
  const [notesOpen,setNotesOpen] = useState(false);
  const heard = useRef({ countdown: telemetry.countdown, events: flight.events.length, complete });
  useEffect(() => { dispatch({ type: 'flight-pause' }); },[dispatch]);
  useEffect(() => {
    if (flight.status !== 'running' || orbit) return;
    let previous = performance.now();
    const timer = setInterval(() => { const now = performance.now(); const seconds = (now - previous) / 1000; previous = now; if (!document.hidden) dispatch({ type: 'flight-tick',seconds }); },100);
    const hide = () => { if (document.hidden) dispatch({ type: 'flight-pause' }); };
    document.addEventListener('visibilitychange',hide);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange',hide); };
  },[flight.status,orbit,dispatch]);
  useEffect(() => {
    sound.setMuted(!effects);
    if (effects && flight.status === 'running' && telemetry.engineOn) sound.startRocketRoar(); else sound.stopRocketRoar();
    return () => sound.stopRocketRoar();
  },[effects,flight.status,telemetry.engineOn]);
  useEffect(() => { if (flight.status === 'running' && telemetry.engineOn) sound.updateRocketIntensity(.55,Math.min(1,telemetry.altitudeKm / 120)); },[flight.status,telemetry.altitudeKm,telemetry.engineOn]);
  useEffect(() => {
    sound.setMuted(!effects);
    if (!flight.skipped) {
      if (heard.current.countdown !== telemetry.countdown && flight.status === 'running' && flight.t <= 5) sound.playCountdownBeep(telemetry.countdown === 0);
      if (heard.current.events < flight.events.length) sound.playStagingThud();
      if (!heard.current.complete && complete) sound.playOrbitHarmony();
    }
    heard.current = { countdown: telemetry.countdown,events: flight.events.length,complete };
  },[effects,telemetry.countdown,flight.events.length,complete,flight.skipped,flight.status,flight.t]);
  useEffect(() => { const pause = () => dispatch({ type: 'flight-pause' }); window.addEventListener('game-help-open',pause); return () => window.removeEventListener('game-help-open',pause); },[dispatch]);
  const act = (event: MissionEvent) => { sound.setMuted(!effects); if (event.type !== 'flight-action') sound.playRadioBeep(); dispatch(event); };
  const back = () => { dispatch({ type: 'flight-pause' }); onBack(); };
  const next = () => { if (orbit) frame.onHome?.(); else dispatch({ type: 'next' }); };
  const phase = complete ? 'orbit' : ready ? `ready-${flight.mode}` : flight.missedWindow ? `retry-${flight.attempts}` : flight.status === 'paused' ? 'paused'
    : flight.status === 'awaiting' ? `release-${gate?.event}` : safe ? `safe-${nextGate?.event}` : incorrect ? `feedback-${flight.attempts}-${flight.events.length}` : telemetry.countdown ? 'countdown' : `burn-${flight.events.length}`;
  const advice = complete ? 'We made it! Earth orbit!' : ready ? challenge ? 'Release when the band turns green. Ready?' : 'All systems go! We’ll pause when it’s your turn.'
    : flight.missedWindow ? 'Missed it? Retry this stage. You’ve got this!' : flight.status === 'paused' ? 'Flight paused. Continue when you’re ready.'
    : flight.status === 'awaiting' ? gate?.event === 'booster' ? 'Empty booster! Let’s drop that extra weight.' : 'Clear of thick air. Open the cover!'
    : safe ? nextGate?.event === 'booster' ? 'Green! Separate the empty booster now.' : 'Green! Release the fairing now.' : incorrect ? flight.feedback! : telemetry.countdown ? 'Countdown started. Here we go!' : flight.events.includes('fairing') ? 'Explorer uncovered. Next stop: Earth orbit!' : flight.events.includes('booster') ? 'Clean release! Our upper stage is pushing.' : 'Liftoff! Watch Earth fall away.';
  const action = complete ? <button data-primary-action className="conversation-next launch-primary" onClick={next}>{orbit ? 'Mission home' : 'View result'}<ArrowRight size={21}/></button>
    : ready ? <button data-primary-action className="conversation-next launch-primary is-start" onClick={() => { sound.setMuted(!effects); sound.playCountdownBeep(); dispatch({ type: 'flight-start' }); }}><Rocket size={22}/>Start countdown</button>
    : challenge && nextGate ? <div className="launch-release"><ReleaseWindow flight={flight} act={act} compact/></div>
    : flight.status === 'awaiting' && gate ? <button data-primary-action className="conversation-next launch-primary is-release" onClick={() => act({ type:'flight-action',action:gate.event })}><Rocket size={21}/>{gate.label}</button>
    : <button data-primary-action className="conversation-next launch-primary" onClick={() => act({ type: flight.status === 'paused' ? 'flight-resume' : 'flight-pause' })}>{flight.status === 'paused' ? <Play size={21}/> : <Pause size={21}/>} {flight.status === 'paused' ? 'Resume flight' : 'Pause flight'}</button>;
  const footer = <footer className="conversation-controls launch-controls">
    <button className="conversation-back" onClick={back}><ArrowLeft size={21}/>Back</button>
    <div className="launch-options">
      {ready ? <div className="launch-mode" role="group" aria-label="Launch mode">{(['guided','challenge'] as const).map(mode => <button key={mode} aria-pressed={flight.mode === mode} onClick={() => dispatch({ type:'flight-mode',mode })}>{mode === 'guided' ? 'Guided' : 'Challenge'}</button>)}</div> : null}
      {!complete ? <div className="launch-speed" role="group" aria-label="Flight speed">{[1,1.5,2].map(speed => <button key={speed} onClick={() => dispatch({ type:'flight-speed',speed })} aria-pressed={flight.speed === speed}>{speed}×</button>)}</div> : null}
      <div className="launch-utilities">
        {challenge && nextGate && !ready && !complete && flight.status !== 'awaiting' ? <button aria-label={flight.status === 'paused' ? 'Resume flight' : 'Pause flight'} onClick={() => act({ type: flight.status === 'paused' ? 'flight-resume' : 'flight-pause' })}>{flight.status === 'paused' ? <Play size={19}/> : <Pause size={19}/>}</button> : null}
        {complete ? <button onClick={() => act({ type:'flight-replay' })} aria-label="Replay flight"><RotateCcw size={18}/><span>Replay</span></button> : <button onClick={() => act({ type:'flight-skip' })} aria-label="Skip flight"><SkipForward size={18}/><span>Skip</span></button>}
        <button onClick={() => setNotesOpen(true)} aria-label="Flight notes"><Info size={19}/><span>Notes</span></button>
      </div>
    </div>
    <div className="launch-command"><HintButton/>{action}</div>
  </footer>;
  return <StoryShell {...frame} controls={footer}>
    <main className="workshop-main launch-main" id="story-content" tabIndex={-1} aria-labelledby="flight-title">
      <section className="launch-stage" aria-label="Mission flight">
        <Suspense fallback={<div className="workshop-render-fallback">Preparing launchpad…</div>}><FlightViewport preparation={preparation} flight={flight} reducedMotion={gentle}/></Suspense>
        <div className="launch-topline"><div className="launch-title"><span>MISSION 01 · EARTH TO ORBIT</span><h1 id="flight-title">{orbit ? 'Milestone 1 complete!' : telemetry.title}</h1></div><span className={`launch-status ${flight.status === 'awaiting' ? 'is-turn' : ''}`}><i/>{complete ? 'IN ORBIT' : ready ? 'READY' : flight.status === 'awaiting' ? 'YOUR TURN' : flight.status === 'paused' ? 'PAUSED' : 'LIVE'}</span></div>
        <div className="launch-hud"><div className="launch-readings" aria-label="Live flight readings"><div><span>Above Earth</span><strong>{Math.round(telemetry.altitudeKm)}<small> km</small></strong></div><div><span>Speed</span><strong>{telemetry.speedKmS.toFixed(2)}<small> km/s</small></strong></div></div>
          <ol className="launch-milestones" aria-label="Flight stages">{['Launch','Separate','Orbit'].map((name,index) => {
            const done = index === 0 ? flight.events.includes('booster') : index === 1 ? flight.events.includes('fairing') : complete;
            const active = !complete && index === (flight.events.includes('fairing') ? 2 : flight.events.includes('booster') || gate ? 1 : 0);
            return <li key={name} className={done ? 'is-done' : active ? 'is-active' : ''} aria-current={active ? 'step' : undefined}><span className="launch-step-number">{done ? <Check size={13}/> : index + 1}</span>{index === 2 ? <Term term="orbit">{name}</Term> : name}</li>;
          })}</ol><progress value={flight.t} max={FLIGHT_DURATION} aria-label="Flight progress"/>
        </div>
        <FlightGuide text={advice} phase={phase} celebrate={complete} warning={flight.missedWindow || !!flight.attempts} voiceEnabled={!!frame.voiceEnabled && !!frame.voiceAvailable}/>
        {flight.t < 4 && !ready ? <div className="launch-countdown" aria-live="polite"><span>LIFTOFF IN</span><strong>{telemetry.countdown}</strong></div> : null}
        {complete ? <div className="launch-orbit"><Trophy size={29}/><div><strong>Earth orbit reached!</strong><span>{flight.skipped ? 'Preview complete' : 'Built · tested · launched'}</span></div></div> : null}
      </section>
      {notesOpen ? <GameInfo title="Flight notes" onClose={() => setNotesOpen(false)} pages={[
        <div key="stages"><p><Term term="booster">Booster</Term> gives the first push. Drop it when empty.</p><p><Term term="fairing">Fairing</Term> protects the explorer. Release it above the thick air.</p><p><Term term="orbit">Orbit</Term> means moving sideways fast enough to keep falling around Earth.</p></div>,
        <div key="orbit"><p>This is a compressed game flight, not a trajectory solver. Example orbit: 200 km, about 7.79 km/s. No ISS stop; a later burn heads toward the Moon.</p><a href="https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/flight-to-orbit/" target="_blank" rel="noreferrer">NASA: flight to orbit</a></div>,
        <p key="credits">Scales are illustrative. The Sun stays roughly 150 million km away. Audio is a game effect; sound cannot travel through a vacuum. Earth imagery: NASA Earth Observatory · Reto Stöckli / Robert Simmon.</p>
      ]}/> : null}
    </main>
  </StoryShell>;
}
