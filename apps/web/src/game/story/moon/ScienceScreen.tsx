import { useEffect, useMemo, useState } from 'react';
import { Check, FlaskConical, Radio, ScanLine } from 'lucide-react';
import type { WorkshopSession, MissionEvent } from '../workshopSession.ts';
import type { SelectionFrame } from '../SelectionScreens.tsx';
import { StoryShell, StoryControls } from '../StoryShell.tsx';
import { useStoryNavigation } from '../storyNavigationContext.ts';
import { GameInfo } from '../GameInfo.tsx';
import { useGameSettings } from '../gameSettingsContext.ts';
import { sound } from '@exo/audio';
import { isEngineFrozen } from '@exo/ui';
import { MoonStage } from './MoonStage.tsx';
import { IncidentPanel } from './IncidentPanel.tsx';
import { expeditionSites } from './moonExpedition.ts';
import { scienceActive, scienceTask, scienceFrameLimit, currentEvidence, sciencePoints, deliveredPoints, scienceComplete } from './science.ts';
import type { ScienceFinding, ScienceTarget } from './science.ts';
import { surfacePosition, surfaceLink, surfaceNodeName, surfaceLight, surfacePower, SURFACE_MODEL } from './surface.ts';
import { geoCollector } from './geologyScience.ts';
import { geologyPart } from './geology.ts';
import { GEOLOGY_LABELS, GEOLOGY_LINES } from './geologyCopy.ts';
import { SCIENCE_LINES } from './scienceCopy.ts';
import { INCIDENT_LINES } from './incidentCopy.ts';

const ICE_FINDINGS: { id: ScienceFinding; label: string }[] = [
  { id: 'confirmed', label: 'Water detected' }, { id: 'negative', label: 'No water detected' }, { id: 'inconclusive', label: 'Need more evidence' },
];
const ROCK_FINDINGS: { id: ScienceFinding; label: string }[] = [
  { id: 'anorthosite', label: GEOLOGY_LABELS.anorthosite }, { id: 'basalt', label: GEOLOGY_LABELS.basalt },
  { id: 'breccia', label: GEOLOGY_LABELS.breccia }, { id: 'inconclusive', label: GEOLOGY_LABELS.inconclusive },
];
export function ScienceScreen({ session, dispatch, frame }: { session: WorkshopSession; dispatch(e: MissionEvent): void; frame: SelectionFrame }) {
  const { moon, preparation } = session, s = moon.science, vehicle = moon.surface, h = s.hazards;
  const { effects } = useGameSettings(), navigation = useStoryNavigation(), reviewing = !!navigation?.reviewing;
  const [notes, setNotes] = useState(false), [chosenTarget, setChosenTarget] = useState<ScienceTarget | null>(null);
  const geo = moon.objective === 'lunar-geology', lines = geo ? GEOLOGY_LINES : SCIENCE_LINES;
  const endpoint = session.progress.stepId === 'science-ready', active = scienceActive(s), complete = scienceComplete(s, vehicle);
  const sites = useMemo(() => s.phase === 'plan' ? expeditionSites(s, moon, preparation) : [], [s, moon, preparation]);
  const proposed = sites.find(site => site.target === chosenTarget && site.plan.feasible) ?? sites.find(site => site.target === s.target && site.plan.feasible) ?? sites.find(site => site.plan.feasible) ?? sites[0];
  const available = sites.filter(site => site.plan.feasible), records = currentEvidence(s);
  const evidence = records.filter(record => geo ? true : ['nss', 'nirvss', 'msolo'].includes(record.instrumentId));
  const accepted = s.accepted[`${s.target}:${s.depthCm}`], findings = geo ? ROCK_FINDINGS : ICE_FINDINGS;
  const point = surfacePosition(vehicle), linked = surfaceLink(point.x, point.z, preparation) === 'connected';
  const charging = surfacePower(moon, preparation, 'charging', surfaceLight(point.x, point.z, moon));
  const canCharge = linked && vehicle.stage === 'idle' && charging.surplusW > 0 && vehicle.batteryWh < moon.resources.capacityWh - .01;
  const task = scienceTask(s, preparation), sampleCount = geo ? s.samples.length : s.records.filter(record => record.instrumentId === 'trident').length;
  const act = (event: MissionEvent) => { if (reviewing || isEngineFrozen()) return; sound.setMuted(!effects); sound.playClick(); dispatch(event); };
  const details = () => { dispatch({ type: 'science-pause' }); setNotes(true); };
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
  useEffect(() => {
    sound.setMuted(!effects);
    if (active && !s.paused && !reviewing && ['outbound', 'returning'].includes(s.phase) && vehicle.stage === 'driving') sound.startRoverSound('drive');
    else if (s.phase === 'drilling' && !s.paused && !reviewing) sound.startRoverSound('drill'); else sound.stopRoverSound();
    return () => sound.stopRoverSound();
  }, [active, s.paused, s.phase, vehicle.stage, effects, reviewing]);
  const start = () => {
    if (!proposed?.plan.feasible) { act({ type: canCharge ? 'science-charge' : vehicle.location !== 'base' ? 'science-home' : 'science-end-fieldwork' }); return; }
    act({ type: 'science-target', target: proposed.target }); act({ type: 'science-program', program: 'sample' });
    if (proposed.depthCm > 0) act({ type: 'science-depth', cm: proposed.depthCm });
    if (preparation.sciencePartIds.includes('msolo')) act({ type: 'science-gas', enabled: proposed.useGas });
    if (geo) act({ type: 'science-sensor-plan', placement: 'ground' });
    act({ type: 'science-start' });
  };
  const continueMission = () => {
    if (reviewing) { dispatch({ type: 'next' }); return; }
    if (endpoint || complete) { if (!endpoint) act({ type: 'next' }); act({ type: 'next' }); }
    else if (active) act({ type: s.paused ? 'science-resume' : 'science-pause' });
    else if (s.phase === 'plan') start();
    else if (s.phase === 'failed') act({ type: 'science-retry' });
    else if (s.phase === 'sensor-site') act(linked ? { type: 'science-place-sensor', placement: 'ground' } : { type: 'science-home' });
    else if (s.phase === 'report') act({ type: 'science-transmit' });
    else if (s.phase === 'ready' && vehicle.location !== 'base') act({ type: 'science-home' });
    else act({ type: 'science-new-trip' });
  };
  const label = endpoint || complete ? 'Pack up for home' : h.pending ? 'Choose your next move' : active ? s.paused ? 'Resume' : 'Pause' : s.phase === 'plan' ? proposed?.plan.feasible ? 'Begin discovery' : canCharge ? 'Charge in sunlight' : vehicle.location !== 'base' ? 'Return to base' : 'Finish fieldwork safely' : s.phase === 'failed' ? 'Retry this expedition' : s.phase === 'sensor-site' ? linked ? 'Place sensor on the ground' : 'Return to radio range' : s.phase === 'report' ? s.program === 'survey' || s.fieldworkStopped || accepted ? 'Send our findings' : 'Choose what the clues mean' : vehicle.location !== 'base' ? 'Return to base' : 'Collect a sample';
  const disabled = !reviewing && (!!h.pending || s.phase === 'report' && s.program === 'sample' && !s.fieldworkStopped && !accepted);
  const title = endpoint || complete ? 'Discovery saved!' : h.pending ? 'A change of plan' : s.phase === 'plan' ? 'Make a Moon discovery' : s.phase === 'outbound' ? 'Follow the trail' : s.phase === 'survey' ? 'Read the ground' : s.phase === 'drilling' ? geo ? 'Collect a Moon rock' : 'Collect some Moon soil' : s.phase === 'analysis' ? 'What is in our sample?' : s.phase === 'returning' ? vehicle.stage === 'charging' ? 'Catch some sunlight' : 'Bring the rover home' : s.phase === 'report' ? 'What did we discover?' : s.phase === 'sensor-site' || s.phase === 'listening' ? 'Listen to the Moon' : s.phase === 'transmitting' ? 'Share our discovery' : s.phase === 'failed' ? 'Try the expedition again' : 'Our findings are safe';
  const objective = h.pending ? INCIDENT_LINES[h.pending] : s.phase === 'plan' ? 'Investigate one safe site. Bring your evidence back.' : s.phase === 'report' ? accepted || s.fieldworkStopped || s.program === 'survey' ? 'Your evidence is stored. Send it to the mission team.' : 'Read the instrument clues, then choose a finding.' : s.phase === 'ready' && !complete ? 'The scan gave us a clue. Collect and test a sample next.' : endpoint || complete ? 'Evidence delivered. Time to prepare the crew for home.' : s.phase === 'returning' ? vehicle.stage === 'charging' ? 'Let sunlight refill the rover battery.' : 'Your rover is following its saved route back.' : s.phase === 'sensor-site' ? 'Place the sensor away from shaking wheels.' : s.phase === 'failed' ? 'Retry from this expedition’s saved starting point.' : 'Watch your instruments work. Your return route is saved.';
  const advice = s.feedback === 'wrong' ? lines.wrong : h.pending ? INCIDENT_LINES[h.pending] : s.phase === 'plan' ? proposed?.plan.feasible ? 'This site fits the equipment you brought. Begin when you are ready.' : 'Protect the trip home. Recharge or end fieldwork safely.' : objective;
  const traveling = ['outbound', 'returning'].includes(s.phase), limit = traveling ? vehicle.stage === 'charging' ? SURFACE_MODEL.chargeFrames : SURFACE_MODEL.legFrames : scienceFrameLimit(s.phase);
  const progress = traveling ? vehicle.stage === 'charging' ? vehicle.phaseFrame : vehicle.legFrame : s.frame;
  return <StoryShell {...frame} controls={<StoryControls onBack={() => { dispatch({ type: 'science-pause' }); dispatch({ type: 'back' }); }} onNext={continueMission} nextLabel={label} nextDisabled={disabled} progress={<span>Moon expedition · Discover</span>} />}>
    <MoonStage session={session} title={title} objective={objective} step={1} advice={advice} voiceEnabled={frame.voiceEnabled ?? true} onDetails={details} destination={s.phase === 'plan' ? proposed?.target : undefined} science={{ geology: geo, scoop: geoCollector(preparation)?.id === 'geo-scoop-basic', sampleCount, seismometerSite: s.seismometerSite, dust: h.dust, recovery: h.recovery, radiation: h.evaBlocked, target: s.target, phase: s.phase, frame: s.frame, frameLimit: scienceFrameLimit(s.phase), depthCm: s.depthCm, paused: s.paused || reviewing || notes }}>
      {h.pending ? <IncidentPanel session={session} dispatch={act} compact/> : s.phase === 'plan' ? <>
        <span className="moon-eyebrow">YOUR NEXT STOP</span><h2>{proposed?.plan.feasible ? surfaceNodeName(proposed.target, moon) : 'Keep a safe way home'}</h2>
        <p>{proposed?.plan.feasible ? proposed.target === 'lookout' ? 'A nearby sunlit site. Scan, collect a sample and check it with your tools.' : 'A cold site your equipment can reach safely. Scan and test a sample.' : canCharge ? 'Recharge before collecting more evidence.' : 'This kit cannot complete another sample trip safely. Bring the rover back and keep what you learned.'}</p>
        {proposed?.plan.feasible ? <><div className="moon-itinerary"><span>Scan</span><span>Collect</span><span>Return</span></div><small>Return route and battery reserve checked.</small>{available.length > 1 ? <button className="moon-secondary" onClick={() => setChosenTarget(available[(available.findIndex(site => site.target === proposed.target) + 1) % available.length].target)}>Try another safe site →</button> : null}</> : null}
      </> : s.phase === 'report' || s.phase === 'ready' || endpoint ? <>
        <span className="moon-eyebrow">{accepted ? 'FINDING RECORDED' : 'YOUR EVIDENCE'}</span>
        {complete || endpoint ? <h2><Check size={24}/>Discovery delivered</h2> : null}
        <div className="moon-evidence">{evidence.map(record => <article key={record.id}><span>{geo ? geologyPart(record.instrumentId)?.name ?? record.instrumentId : record.instrumentId.toUpperCase()}</span><strong>{record.signal}</strong><small>{record.quality} quality</small></article>)}</div>
        {s.phase === 'report' && s.program === 'sample' && !s.fieldworkStopped && !accepted ? <div className="moon-findings" aria-label="Interpret the evidence">{findings.map(finding => <button key={finding.id} onClick={() => act({ type: 'science-claim', finding: finding.id })}>{finding.label}</button>)}</div> : accepted ? <p className="moon-success">{findings.find(finding => finding.id === accepted)?.label}. {s.phase === 'ready' ? 'Safely sent to the mission team.' : 'Send the evidence to the mission team.'}</p> : <p>{s.fieldworkStopped ? 'Fieldwork ended safely. Keep and send the evidence already collected.' : 'A scan gives clues. Collect and test a sample to learn more.'}</p>}
        {s.feedback === 'wrong' ? <p className="moon-feedback" role="alert">{lines.wrong}</p> : null}
      </> : s.phase === 'sensor-site' ? <><span className="moon-eyebrow">ONE MORE MEASUREMENT</span><h2>Quiet ground, clearer signal</h2><p>The sensor needs to rest on the ground, away from the rover’s wheels.</p></> : s.phase === 'failed' ? <><h2>Our rover stopped</h2><p>{lines.failed}</p></> : <>
        {s.phase === 'transmitting' ? <Radio size={30}/> : s.phase === 'survey' ? <ScanLine size={30}/> : <FlaskConical size={30}/>}
        <h2>{s.phase === 'recovering' ? 'Crew and rover are safe' : title}</h2><progress aria-label={title} max={limit} value={progress}/>
        <p>{s.paused ? 'Paused. Resume when you are ready.' : s.phase === 'survey' ? geo ? 'Looking at the rock and its surroundings.' : 'A hydrogen signal is a clue. The sample test comes next.' : s.phase === 'drilling' ? 'A small sample goes into the rover’s instrument tray.' : s.phase === 'analysis' ? 'Comparing the sample with your instrument readings.' : s.phase === 'listening' ? 'Recording ground vibrations.' : s.phase === 'transmitting' ? 'Sending the measurements and your finding together.' : traveling ? 'Follow the rover’s progress across the landscape.' : 'Completing the current task.'}</p>
      </>}
    </MoonStage>
    {notes ? <GameInfo title="Your Moon field notebook" onClose={() => setNotes(false)} pages={[
      <div key="mission"><p>{objective}</p><p>{moon.objective === 'lunar-geology' ? 'Rock types come from instrument evidence, not the appearance of the terrain.' : 'Hydrogen alone does not prove ice. Compare optical and gas readings; inconclusive is a valid finding.'}</p><p>Sites are checked against your actual hardware, cold exposure, energy and a reserved route home. A shorter sample or an unused gas tool can make a trip feasible. No new equipment is added.</p></div>,
      <div key="resources"><p>Battery {vehicle.batteryWh.toFixed(1)} / {moon.resources.capacityWh} Wh. {Math.round(vehicle.elapsedSeconds / 60)} simulated surface minutes.</p><p>{sciencePoints(s)} science points measured; {deliveredPoints(s)} delivered. Current operation: {task.mode}.</p><p>Scenery and readings are authored game scenarios. Only recorded measurements count as evidence.</p></div>,
      ...s.records.map(record => <div key={record.id}><h3>{record.instrumentId.toUpperCase()}</h3><p>{record.signal} · {record.quality} quality · {record.transmitted ? 'delivered' : 'stored on rover'}.</p></div>),
    ]}/> : null}
  </StoryShell>;
}
