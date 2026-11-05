import { useEffect, useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import type { WorkshopSession, MissionEvent } from '../workshopSession.ts';
import type { SelectionFrame } from '../SelectionScreens.tsx';
import { StoryShell, StoryControls } from '../StoryShell.tsx';
import { useStoryNavigation } from '../storyNavigationContext.ts';
import { GameInfo } from '../GameInfo.tsx';
import { useGameSettings } from '../gameSettingsContext.ts';
import { MoonStage } from './MoonStage.tsx';
import { nextSurfaceTask } from './moonExpedition.ts';
import { scienceActive, deliveredPoints } from './science.ts';
import { IncidentPanel } from './IncidentPanel.tsx';
import { surfaceSecured, INCIDENT_MODEL } from './incidents.ts';
import { sound } from '@exo/audio';
import { isEngineFrozen } from '@exo/ui';

const TASKS = {
  rover: { title: 'Park the rover', detail: 'Leave it safely at base. Its heaters will stay on.' },
  data: { title: 'Save the discovery', detail: 'Relay every stored record to the mission team.' },
  samples: { title: 'Seal the rock samples', detail: 'Stow the samples in their return container.' },
  crew: { title: 'Check our three explorers', detail: 'Two are sheltered on the Moon. One is waiting in orbit.' },
};
export function RecoveryScreen({ session, dispatch, frame }: { session: WorkshopSession; dispatch(e: MissionEvent): void; frame: SelectionFrame }) {
  const { moon, preparation } = session, s = moon.science, h = s.hazards, { effects } = useGameSettings();
  const [notes, setNotes] = useState(false), navigation = useStoryNavigation(), reviewing = !!navigation?.reviewing;
  const endpoint = session.progress.stepId === 'surface-secured', active = scienceActive(s), ready = surfaceSecured(moon), task = nextSurfaceTask(moon);
  const actions = moon.objective === 'lunar-geology' && s.samples.length ? ['rover', 'data', 'samples', 'crew'] as const : ['rover', 'data', 'crew'] as const;
  const index = task ? actions.findIndex(action => action === task) : actions.length;
  const act = (event: MissionEvent) => { if (isEngineFrozen() || reviewing) return; sound.setMuted(!effects); sound.playClick(); dispatch(event); };
  useEffect(() => {
    if (!active || s.paused || notes || reviewing) return;
    let last = performance.now();
    const timer = setInterval(() => { const now = performance.now(); if (!document.hidden && !isEngineFrozen()) dispatch({ type: 'science-tick', seconds: (now - last) / 1000 }); last = now; }, 100);
    return () => clearInterval(timer);
  }, [active, s.paused, notes, reviewing, dispatch]);
  useEffect(() => {
    const pause = () => dispatch({ type: 'science-pause' }), hide = () => { if (document.hidden) pause(); };
    const hint = () => { pause(); dispatch({ type: 'science-hint' }); setNotes(true); };
    window.addEventListener('game-help-open', pause); window.addEventListener('blur', pause); window.addEventListener('replay-game-help', hint); document.addEventListener('visibilitychange', hide);
    return () => { window.removeEventListener('game-help-open', pause); window.removeEventListener('blur', pause); window.removeEventListener('replay-game-help', hint); document.removeEventListener('visibilitychange', hide); };
  }, [dispatch]);
  const next = () => {
    if (reviewing) { dispatch({ type: 'next' }); return; }
    if (active) act({ type: s.paused ? 'science-resume' : 'science-pause' });
    else if (h.evaBlocked) act({ type: 'science-incident', action: 'shelter-wait' });
    else if (ready || endpoint) { if (!endpoint) act({ type: 'next' }); act({ type: 'next' }); }
    else if (task) act({ type: 'science-secure', item: task });
  };
  const label = ready || endpoint ? 'Leave the Moon' : h.pending ? 'Choose your next move' : active ? s.paused ? 'Resume' : 'Pause' : h.evaBlocked ? 'Wait safely in shelter' : task ? TASKS[task].title : 'Preparing departure';
  const objective = ready || endpoint ? 'Everything is safe. Bring the crew back to their orbiting teammate.' : h.evaBlocked ? 'Stay sheltered until the space-weather alert clears.' : active ? s.phase === 'transmitting' ? 'Sending the discovery to the mission team.' : 'Wait safely while the current task finishes.' : task ? TASKS[task].detail : 'Finish the surface checks before departure.';
  return <StoryShell {...frame} controls={<StoryControls onBack={() => { dispatch({ type: 'science-pause' }); dispatch({ type: 'back' }); }} onNext={next} nextLabel={label} nextDisabled={!reviewing && !!h.pending} progress={<span>Moon expedition · Pack up</span>} />}>
    <MoonStage session={session} title={ready || endpoint ? 'Ready for the journey home' : 'Leave the Moon safely'} objective={objective} step={2} advice={objective} voiceEnabled={frame.voiceEnabled ?? true} onDetails={() => { dispatch({ type: 'science-pause' }); setNotes(true); }} destination="base" science={{ geology: moon.objective === 'lunar-geology', sampleCount: moon.objective === 'lunar-geology' ? s.samples.length : s.records.filter(record => record.instrumentId === 'trident').length, seismometerSite: s.seismometerSite, phase: s.phase, frame: s.frame, frameLimit: INCIDENT_MODEL.recoveryFrames, depthCm: s.depthCm, paused: s.paused || reviewing || notes, target: s.target, dust: h.dust, recovery: h.recovery, radiation: h.evaBlocked }}>
      {h.pending ? <IncidentPanel session={session} dispatch={act} compact/> : ready || endpoint ? <><Check size={32}/><h2>All set!</h2><p>Rover parked. Evidence saved. Crew accounted for.</p><small>{deliveredPoints(s)} science points delivered.</small></> : active ? <><ShieldCheck size={30}/><h2>{s.phase === 'transmitting' ? 'Saving every record' : 'Crew sheltered safely'}</h2><progress aria-label="Departure preparation" max={s.phase === 'transmitting' ? 25 : INCIDENT_MODEL.recoveryFrames} value={s.frame}/><p>{s.paused ? 'Paused. Resume when ready.' : objective}</p></> : h.evaBlocked ? <><ShieldCheck size={30}/><h2>Wait for the all-clear</h2><p>Our crew stays inside. The mission clock and supplies still count while waiting.</p></> : task ? <><span className="moon-eyebrow">ONE THING AT A TIME · {index + 1} / {actions.length}</span><div className="moon-task-count" aria-label="Departure checklist">{actions.map((action, i) => <span key={action} className={i < index ? 'is-done' : i === index ? 'is-current' : ''}/>)}</div><h2>{TASKS[task].title}</h2><p>{TASKS[task].detail}</p>{index > 0 ? <small>Previous steps complete. Your evidence stays saved.</small> : null}</> : null}
    </MoonStage>
    {notes ? <GameInfo title="Moon mission log" onClose={() => setNotes(false)} pages={[
      <div key="summary"><p>{deliveredPoints(s)} science points delivered. {s.records.length} instrument records.</p><p>Rover parked: {h.roverParked ? 'yes' : 'pending'}. Data archived: {h.dataArchived ? 'yes' : 'pending'}. Crew checked: {h.crewChecked ? 'yes' : 'pending'}.</p><p>{moon.objective === 'lunar-geology' ? `${s.samples.length} physical rock samples; ${s.samples.filter(sample => sample.stowed).length} sealed.` : 'Ice readings come from exposed cuttings. This mission returns the evidence as data.'}</p><p>The rover and descent stage remain on the Moon. The ascent cabin carries two crew back to their orbiting teammate.</p></div>,
      ...h.log.map(log => <div key={log.id}><h3>{log.kind} · {log.status}</h3><p>{log.reason}</p><p>{log.actions.map(action => action.action).join(' → ')}</p></div>),
      <div key="equipment"><p>Your installed equipment stays unchanged. {preparation.sciencePartIds.includes('field-care-kit') ? 'A packed care kit can clean tools when safe.' : 'No care kit was packed.'} Radiation alerts keep the crew inside; waiting uses mission supplies.</p></div>,
    ]}/> : null}
  </StoryShell>;
}
