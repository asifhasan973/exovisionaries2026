import { RepairAlert } from './RepairAlert.tsx';
import { recommendRepair } from './repairGuidance.ts';
import { useGameSettings } from './gameSettingsContext.ts';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { Battery, Drill, Flag, Pause, Play, RotateCcw, MoveLeft, MoveRight } from 'lucide-react';
import { crewCapabilities } from './moon/catalog.ts';
import { selectedDrill } from './preparation.ts';
import { trialActive, trialPlan } from './trial.ts';
import { sound } from '../../audio/soundEngine.ts';
import { Term } from './Learning.tsx';
const TrialViewport = lazy(() => import('./TrialViewport.tsx').then(module => ({ default: module.TrialViewport })));
import type { WorkshopSession, MissionEvent } from './workshopSession.ts';
import './playability.css';

export function ShadowTrial({ session, dispatch }: { session: WorkshopSession; dispatch(event: MissionEvent): void; voiceEnabled: boolean }) {
  const { effects } = useGameSettings();
  const { trial } = session.readiness;
  const plan = trialPlan(session.preparation, session.progress.selections.site === 'permanent-shadow', crewCapabilities(session.moon.crew));
  const hasDrill = !!selectedDrill(session.preparation);
  const active = trialActive(trial);
  const previousPhase = useRef(trial.phase);
  useEffect(() => {
    if (trial.phase !== previousPhase.current) {
      sound.setMuted(!effects);
      if (trial.phase === 'complete') sound.playFanfare();
      else if (trial.phase === 'at-sample') sound.playRadioBeep(true);
      else if (trial.phase === 'sampled') sound.playSnap();
      else if (trial.phase === 'failed') sound.playBoing();
    }
    previousPhase.current = trial.phase;
  }, [trial.phase, effects]);
  useEffect(() => {
    sound.setMuted(!effects);
    if (active && !trial.paused && !document.hidden) sound.startRoverSound(trial.phase === 'drilling' ? 'drill' : 'drive');
    const silence = () => { if (document.hidden) sound.stopRoverSound(); };
    document.addEventListener('visibilitychange', silence);
    return () => { sound.stopRoverSound(); document.removeEventListener('visibilitychange', silence); };
  }, [active, trial.phase, trial.paused, effects]);
  const act = (type: 'trial-drive' | 'trial-drill' | 'trial-return' | 'trial-pause' | 'trial-resume') => {
    sound.setMuted(!effects); sound.playClick(); dispatch({ type });
  };
  useEffect(() => { const pause = () => dispatch({ type: 'trial-pause' }); window.addEventListener('game-help-open', pause); return () => window.removeEventListener('game-help-open', pause); }, [dispatch]);
  useEffect(() => {
    if (!active || trial.paused) return;
    let previous = performance.now();
    const timer = setInterval(() => { const now = performance.now(); if (!document.hidden) dispatch({ type: 'trial-tick', seconds: (now - previous) / 1000 }); previous = now; }, 100);
    const hide = () => { if (document.hidden) dispatch({ type: 'trial-pause' }); };
    document.addEventListener('visibilitychange', hide);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', hide); };
  }, [active, trial.paused, dispatch]);
  useEffect(() => () => dispatch({ type: 'trial-pause' }), [dispatch]);
  const failedPosition = trial.spentWh <= plan.legWh ? trial.spentWh / (plan.legWh || 1) : trial.spentWh <= plan.legWh + plan.drillWh ? 1 : 1 - (trial.spentWh - plan.legWh - plan.drillWh) / (plan.legWh || 1);
  const position = trial.phase === 'ready' ? 0 : trial.phase === 'outbound' ? trial.progress : trial.phase === 'returning' ? 1 - trial.progress : trial.phase === 'complete' ? 0 : trial.phase === 'failed' ? Math.max(0, Math.min(1, failedPosition)) : 1;
  const failedPhase = trial.fault === 'thermal' ? 0 : trial.fault === 'peak' ? 1 : trial.spentWh <= plan.legWh ? 0 : trial.spentWh < plan.legWh + plan.drillWh ? 1 : 2;
  const left = Math.max(0, plan.batteryWh - trial.spentWh);
  const instructions = trial.phase === 'ready' ? hasDrill ? 'Drive → Drill → Return' : 'Drive → Collect → Return' : trial.phase === 'outbound' ? 'Driving into shadow…' : trial.phase === 'at-sample' ? 'Sample reached!' : trial.phase === 'drilling' ? 'Drilling… watch your battery.' : trial.phase === 'sampled' ? 'Sample packed! Bring it home.' : trial.phase === 'returning' ? 'Returning to the lander…' : trial.phase === 'complete' ? 'Home safe!' : trial.fault === 'thermal' ? 'Too cold! Fit Advanced thermal protection.' : trial.fault === 'energy' ? 'Battery too small—upgrade it or drill less.' : 'Peak power is too high. Swap equipment.';
  return <div className={`shadow-trial ${trial.phase === 'failed' ? 'is-failed' : ''}`}>
    <div className="trial-hud"><div className="trial-energy"><Battery size={23} /><strong>{Math.round(plan.batteryWh ? left / plan.batteryWh * 100 : 0)}% · {left.toFixed(0)} <Term term="wh">Wh</Term></strong><span>☀ 0 <Term term="watts">W</Term></span></div>
      <div className="trial-battery-track" role="meter" aria-label="Battery energy" aria-valuenow={Math.round(left)} aria-valuemin={0} aria-valuemax={plan.batteryWh}><span style={{ width: `${plan.batteryWh ? left / plan.batteryWh * 100 : 0}%` }} /><i style={{ left: '20%' }} /></div>
      <span className="trial-reserve"><Term term="reserve">Save {Math.round(plan.batteryWh * .2)} Wh · 20%</Term></span>
    </div>
    <Suspense fallback={<div className="trial-world workshop-render-fallback">Opening Moon practice…</div>}><TrialViewport preparation={session.preparation} trial={trial} position={position} /></Suspense>
    <ol className="trial-phases" aria-label="Practice steps">{['Drive',hasDrill?'Drill':'Collect','Return'].map((label,index) => { const phase = trial.phase === 'failed' ? failedPhase : ['ready','outbound'].includes(trial.phase) ? 0 : ['at-sample','drilling'].includes(trial.phase) ? 1 : 2; return <li key={label} className={trial.phase === 'complete' || index < phase ? 'done' : index === phase ? 'active' : ''}>{trial.phase === 'complete' || index < phase ? '✓' : index + 1} {label}</li>; })}</ol>
    <div className="trial-command"><>{trial.phase === 'failed' && trial.fault ? <RepairAlert problem={trial.fault} session={session} dispatch={dispatch}/> : <p className="trial-instruction" role="status">{instructions}</p>}</>
      <div className="trial-actions">
        {trial.phase === 'ready' ? <button className="conversation-next" data-primary-action onClick={() => act('trial-drive')}><MoveRight />Drive</button> : null}
        {trial.phase === 'at-sample' ? <button className="conversation-next" data-primary-action onClick={() => act('trial-drill')}><Drill />{hasDrill ? `Drill ${session.preparation.drillDepthCm} cm` : 'Collect surface sample'}</button> : null}
        {trial.phase === 'sampled' ? <button className="conversation-next" data-primary-action onClick={() => act('trial-return')}><MoveLeft />Return</button> : null}
        {active ? <button className="flight-secondary" onClick={() => act(trial.paused ? 'trial-resume' : 'trial-pause')}>{trial.paused ? <Play /> : <Pause />}{trial.paused ? 'Resume' : 'Pause'}</button> : null}
        {trial.phase === 'failed' && trial.fault === 'energy' && recommendRepair(session, 'depth') ? <button className="flight-secondary" onClick={() => dispatch({ type: 'fix-problem', problem: 'depth' })}>Drill less →</button> : null}
        {trial.phase === 'failed' ? <button className="flight-secondary" onClick={() => dispatch({ type: 'trial-retry' })}><RotateCcw />Retry</button> : null}
        {trial.phase === 'complete' ? <span className="trial-success"><Flag />Home safe · {Math.round(plan.batteryWh ? left / plan.batteryWh * 100 : 0)}% left</span> : null}
      </div>
    </div>
  </div>;
}
