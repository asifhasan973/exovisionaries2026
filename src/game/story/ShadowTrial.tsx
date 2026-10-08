import { useEffect } from 'react';
import { Battery, Check, Drill, Flag, Pause, Play, RotateCcw, MoveLeft, MoveRight } from 'lucide-react';
import { trialActive, trialPlan } from './trial.ts';
import { EngineerCompanion } from './EngineerCompanion.tsx';
import type { WorkshopSession, MissionEvent } from './workshopSession.ts';
import './playability.css';

export function ShadowTrial({ session, dispatch, voiceEnabled }: { session: WorkshopSession; dispatch(event: MissionEvent): void; voiceEnabled: boolean }) {
  const { trial } = session.readiness;
  const plan = trialPlan(session.preparation, session.progress.selections.site === 'permanent-shadow');
  const active = trialActive(trial);
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
  const left = Math.max(0, plan.batteryWh - trial.spentWh);
  const instructions = trial.phase === 'ready' ? 'Drive to the sample. Drill. Bring the rover back.' : trial.phase === 'outbound' ? 'Driving into shadow…' : trial.phase === 'at-sample' ? 'Sample reached! Start your drill.' : trial.phase === 'drilling' ? 'Drilling… watch your battery.' : trial.phase === 'sampled' ? 'Sample packed! Bring it home.' : trial.phase === 'returning' ? 'Returning to the lander…' : trial.phase === 'complete' ? 'Home safe! Your battery kept its reserve.' : trial.fault === 'thermal' ? 'Too cold! Fit Advanced thermal protection.' : trial.fault === 'energy' ? 'Return energy is short! Use a bigger battery or drill less.' : 'Peak power is too high. Swap equipment.';
  return <div className={`shadow-trial ${trial.phase === 'failed' ? 'is-failed' : ''}`}>
    <span className="selection-eyebrow">SHADOW REHEARSAL · TIME COMPRESSED</span>
    <div className="trial-energy"><Battery size={24} /><strong>{left.toFixed(1)} / {plan.batteryWh} Wh</strong><span>Solar 0 W</span></div>
    <div className="trial-battery-track"><span style={{ width: `${plan.batteryWh ? left / plan.batteryWh * 100 : 0}%` }} /><i style={{ left: '20%' }} /></div>
    <small>Yellow mark: 20% return reserve</small>
    <svg className="trial-map" viewBox="0 0 500 210" role="img" aria-label={`Rover rehearsal: ${trial.phase}, ${left.toFixed(1)} watt-hours remaining`}>
      <defs><linearGradient id="trial-shadow"><stop stopColor="#65528a" /><stop offset="1" stopColor="#100d29" /></linearGradient></defs>
      <path d="M0 100 70 70 145 105 240 63 325 111 420 42 500 79V210H0Z" fill="url(#trial-shadow)" />
      <path d="M0 173Q95 158 185 178T500 174V210H0Z" fill="#554969" />
      <path d="M70 169H428" stroke="#d4b6ec" strokeWidth="2" strokeDasharray="6 8" opacity=".5" />
      <g transform="translate(55 117)" fill="#ccd4df" stroke="#8090a8" strokeWidth="2"><path d="M-18 27-28 52M18 27 28 52M-23 0H23V28H-23Z" /><path d="M0 0V-24M0-16 18-26" /><path d="M-28 52H-16M16 52H28" /></g>
      <g transform="translate(430 110)"><path d="M0 0V53M0 0H30V20H0" stroke="#ffdf68" strokeWidth="3" fill="#9a47b0" /></g>
      <g transform={`translate(${78 + position * 313} 149)`}>
        <path d="M-29-16H27V5H-29Z" fill="#d3dce3" stroke="#758b9c" strokeWidth="2" /><path d="M-15-17V-34H13V-17" fill="#364e76" stroke="#bdd6ef" strokeWidth="2" />
        <path d="M21-17V-33L38-28" stroke="#dfb861" strokeWidth="4" fill="none" />
        {[-24, 0, 24].map(x => <g key={x}><circle cx={x} cy={10} r="10" fill="#131b27" stroke="#8495a9" strokeWidth="3" /><circle cx={x} cy={10} r="3" fill="#c7d1db" /></g>)}
        {trial.phase === 'drilling' ? <path d="M38-28V28" stroke="#ffdf68" strokeWidth="3" strokeDasharray="4 3" /> : null}
      </g>
      <text x="24" y="198" fill="#eee0fa" fontSize="13">LANDER</text><text x="387" y="198" fill="#ffdf68" fontSize="13">SAMPLE</text>
    </svg>
    <ol className="trial-stages">{[['Drive', 0], ['Drill', 1], ['Return', 2]].map(([label, index]) => <li key={label} className={trial.phase === 'complete' || ['sampled', 'returning'].includes(trial.phase) && Number(index) < 2 || ['at-sample', 'drilling'].includes(trial.phase) && index === 0 ? 'done' : ''}><Check size={14} />{label}</li>)}</ol>
    <p className="trial-instruction" role="status">{instructions}</p>
    <div className="trial-actions">
      {trial.phase === 'ready' ? <button className="conversation-next" onClick={() => dispatch({ type: 'trial-drive' })}><MoveRight />Drive to sample</button> : null}
      {trial.phase === 'at-sample' ? <button className="conversation-next" onClick={() => dispatch({ type: 'trial-drill' })}><Drill />Drill {session.preparation.drillDepthCm} cm</button> : null}
      {trial.phase === 'sampled' ? <button className="conversation-next" onClick={() => dispatch({ type: 'trial-return' })}><MoveLeft />Return to lander</button> : null}
      {active ? <button className="flight-secondary" onClick={() => dispatch({ type: trial.paused ? 'trial-resume' : 'trial-pause' })}>{trial.paused ? <Play /> : <Pause />}{trial.paused ? 'Resume rehearsal' : 'Pause rehearsal'}</button> : null}
      {trial.phase === 'failed' ? <button className="flight-secondary" onClick={() => dispatch({ type: 'trial-retry' })}><RotateCcw />Retry test</button> : null}
      {trial.phase === 'complete' ? <span className="trial-success"><Flag />Rehearsal passed · {trial.spentWh.toFixed(1)} Wh used</span> : null}
    </div>
    <small>15 min travel + {session.preparation.drillDepthCm! / 20} min drilling · simulated sample, no science points earned.</small>
    {trial.phase === 'complete' || trial.phase === 'failed' ? <EngineerCompanion reaction={trial.phase === 'complete' ? 'trialPass' : 'trialFail'} token={1} voiceEnabled={voiceEnabled} /> : null}
  </div>;
}
