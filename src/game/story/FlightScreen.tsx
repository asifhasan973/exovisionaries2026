import { lazy, Suspense, useEffect, useState } from 'react';
import { Check, FastForward, Info, Pause, Play, Rocket, RotateCcw, SkipForward } from 'lucide-react';
import { sound } from '../../audio/soundEngine.ts';
import { StoryControls, StoryShell } from './StoryShell.tsx';
import { FLIGHT_DURATION, flightTelemetry, pendingFlightAction } from './flight.ts';
import type { WorkshopSession, MissionEvent } from './workshopSession.ts';
import type { SelectionFrame } from './SelectionScreens.tsx';
import './workshop.css';
import './flight.css';
import './playability.css';
import { GameInfo } from './GameInfo.tsx';
import { ReleaseWindow } from './ReleaseWindow.tsx';
const FlightViewport = lazy(() => import('./FlightViewport.tsx').then(m => ({ default: m.FlightViewport })));

export function FlightScreen({ session, dispatch, frame, onBack }: { session: WorkshopSession; dispatch(event: MissionEvent): void; frame: SelectionFrame; onBack(): void }) {
  const { flight, progress, preparation } = session;
  const telemetry = flightTelemetry(flight), gate = pendingFlightAction(flight), orbit = progress.stepId === 'earth-orbit';
  const [notesOpen, setNotesOpen] = useState(false);
  const [gentle, setGentle] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Mount/resume must never start a saved running flight without a user gesture.
  useEffect(() => { dispatch({ type: 'flight-pause' }); }, [dispatch]);
  useEffect(() => {
    if (flight.status !== 'running' || orbit) return;
    let previous = performance.now();
    const timer = setInterval(() => { const now = performance.now(); const seconds = (now - previous) / 1000; previous = now; if (!document.hidden) dispatch({ type: 'flight-tick', seconds }); }, 100);
    const hide = () => { if (document.hidden) dispatch({ type: 'flight-pause' }); };
    document.addEventListener('visibilitychange', hide);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', hide); };
  }, [flight.status, orbit, dispatch]);
  useEffect(() => {
    sound.setMuted(!frame.voiceEnabled);
    if (frame.voiceEnabled && flight.status === 'running' && telemetry.engineOn) sound.startRocketRoar();
    else sound.stopRocketRoar();
    return () => sound.stopRocketRoar();
  }, [frame.voiceEnabled, flight.status, telemetry.engineOn]);
  useEffect(() => { if (flight.status === 'running' && telemetry.engineOn) sound.updateRocketIntensity(.55, Math.min(1, telemetry.altitudeKm / 120)); }, [flight.status, telemetry.altitudeKm, telemetry.engineOn]);
  const act = (event: MissionEvent) => { sound.setMuted(!frame.voiceEnabled); sound.playRadioBeep(); dispatch(event); };
  const back = () => { dispatch({ type: 'flight-pause' }); onBack(); };
  return <StoryShell {...frame} controls={<StoryControls onBack={back} onNext={() => { sound.setMuted(!frame.voiceEnabled); sound.playFanfare(); dispatch({ type: 'next' }); }}
    nextDisabled={flight.status !== 'complete' || orbit} nextLabel={orbit ? 'Moon journey soon' : 'View orbit'} progress={<span>{orbit ? 'IN ORBIT' : 'FLIGHT'}</span>} />}>
    <main className="workshop-main flight-main" id="story-content" tabIndex={-1} aria-labelledby="flight-title">
      <div className="workshop-heading"><div><span className="selection-eyebrow">{orbit ? 'LAUNCH COMPLETE' : 'MISSION CONTROL'}</span><h1 id="flight-title">{orbit ? 'Earth orbit reached!' : telemetry.title}</h1></div>
        <span className="story-flight-live"><i />{flight.status === 'running' ? 'LIVE' : flight.status === 'awaiting' ? 'YOUR TURN' : flight.status === 'complete' ? 'IN ORBIT' : flight.status.toUpperCase()}</span></div>
      <div className="flight-layout"><section className="flight-console">
        <div className="flight-telemetry"><div><span>Above Earth</span><strong>{Math.round(telemetry.altitudeKm)}<small>km</small></strong></div><div><span>Speed</span><strong>{telemetry.speedKmS.toFixed(2)}<small>km/s</small></strong></div></div>
        <ol className="flight-events">{[['booster', 'Booster'], ['fairing', 'Fairing'], ['orbit', 'Orbit']].map(([id, label]) => <li key={id} className={id === 'orbit' ? flight.status === 'complete' ? 'done' : '' : flight.events.includes(id as 'booster' | 'fairing') ? 'done' : ''}><span><Check size={16} /></span>{label}</li>)}</ol>
        <progress value={flight.t} max={FLIGHT_DURATION} aria-label="Flight progress" />
        {orbit || flight.status === 'complete' ? <><span className="flight-orbit-badge"><Check />Earth parking orbit</span><p>{flight.skipped ? 'Flight skipped. Your explorer is in orbit.' : 'Great launch! Your explorer is circling Earth.'}</p><div className="flight-route"><span className="done">Earth</span><i /><span className="done">Orbit</span><i /><span>Moon</span></div>
          <p className="flight-short-note">Next: a Moon-bound burn, then lunar arrival.</p><button className="flight-secondary" onClick={() => act({ type: 'flight-replay' })}><RotateCcw size={18} />Replay launch</button></> :
          flight.status === 'ready' ? <><h2>You’re in control!</h2><p>{flight.mode === 'guided' ? 'We pause when it’s your turn.' : 'Watch the signals. Release inside the green band.'}</p>
            <div className="flight-mode" role="group" aria-label="Launch mode">{(['guided', 'challenge'] as const).map(mode => <button key={mode} aria-pressed={flight.mode === mode} onClick={() => dispatch({ type: 'flight-mode', mode })}>{mode === 'guided' ? 'Guided' : 'Challenge'}</button>)}</div>
            <button className="conversation-next flight-action" onClick={() => act({ type: 'flight-start' })}><Rocket />Start countdown</button></> :
          flight.status === 'awaiting' && gate && flight.mode === 'guided' ? <><h2>{gate.event === 'booster' ? 'Drop the empty stage.' : 'Open the protective cover.'}</h2><p>{gate.event === 'booster' ? 'The upper-stage engine takes over.' : 'Above the thick air, the fairing can go.'}</p><button className="conversation-next flight-action" onClick={() => act({ type: 'flight-action', action: gate.event })}><Rocket />{gate.label}</button></> :
          flight.status === 'awaiting' ? <><h2>Try this stage again.</h2><p>The safety system held the release.</p></> :
          <><h2>{telemetry.countdown ? `T − ${telemetry.countdown}` : 'Watch your explorer fly!'}</h2><p>{telemetry.countdown ? 'All checks green.' : 'Climb, turn, then gain speed around Earth.'}</p><button className="flight-secondary" onClick={() => act({ type: flight.status === 'paused' ? 'flight-resume' : 'flight-pause' })}>{flight.status === 'paused' ? <Play size={19} /> : <Pause size={19} />}{flight.status === 'paused' ? 'Resume flight' : 'Pause flight'}</button></>}
        {flight.mode === 'challenge' && !orbit && !['ready', 'complete'].includes(flight.status) ? <ReleaseWindow flight={flight} act={act} /> : null}
        {flight.status === 'complete' && flight.mode === 'challenge' && !flight.skipped ? <p>{flight.attempts === 0 ? 'Perfect timing! Both releases were safe.' : `${flight.attempts} practice attempts · both releases safe.`}</p> : null}
        {!orbit && flight.status !== 'complete' ? <><div className="flight-speed" role="group" aria-label="Flight speed"><FastForward size={19} />{[1, 1.5, 2].map(speed => <button key={speed} onClick={() => dispatch({ type: 'flight-speed', speed })} aria-pressed={flight.speed === speed}>{speed}×</button>)}</div>
          <button className="flight-skip" onClick={() => act({ type: 'flight-skip' })}><SkipForward size={18} />Skip flight</button></> : null}
        <label className="flight-gentle"><input type="checkbox" checked={gentle} onChange={e => setGentle(e.target.checked)} />Gentle motion</label>
        <button className="game-info-trigger flight-notes-trigger" onClick={() => setNotesOpen(true)}><Info size={16} />Flight notes</button>
        {notesOpen ? <GameInfo title="Flight notes" onClose={() => setNotesOpen(false)} pages={[
          <p key="model">This generic robotic carrier uses an authored, compressed ascent. It is not a trajectory solver or a verified real launcher.</p>,
          <div key="orbit"><p>Example orbit: 200 km, about 7.79 km/s, using v = √(μ/r). Orbit is sideways motion under gravity; gravity here is still about {telemetry.gravityMS2.toFixed(1)} m/s².</p><a href="https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/flight-to-orbit/" target="_blank" rel="noreferrer">NASA: flight to orbit</a></div>,
          <p key="illustration">No ISS stop. A later burn sends the spacecraft toward the Moon. Earth, rocket and Sun use illustrative scales. The Sun remains roughly 150 million km away. Engine audio is a game effect; sound cannot travel through a vacuum.</p>,
          <p key="credits">Earth imagery: NASA Earth Observatory · Reto Stöckli / Robert Simmon.</p>
        ]} /> : null}
      </section><div className="story-flight-scene"><Suspense fallback={<div className="workshop-render-fallback">Preparing launch view…</div>}><FlightViewport preparation={preparation} flight={flight} reducedMotion={gentle} /></Suspense>
        {flight.t < 4 && flight.status !== 'ready' ? <div className="flight-countdown" aria-live="polite"><span>T MINUS</span><strong>{telemetry.countdown}</strong></div> : null}
        {flight.status === 'awaiting' && flight.mode === 'guided' ? <div className="flight-awaiting">Your turn · {gate?.label}</div> : null}
        {flight.mode === 'challenge' && !orbit && !['ready', 'complete'].includes(flight.status) ? <div className="flight-mobile-controls"><ReleaseWindow flight={flight} act={act} compact /></div> : null}
        {flight.mode === 'guided' && flight.status === 'awaiting' && gate ? <button className="flight-guided-mobile conversation-next" onClick={() => act({ type: 'flight-action', action: gate.event })}>{gate.label}</button> : null}
      </div></div>
    </main>
  </StoryShell>;
}
