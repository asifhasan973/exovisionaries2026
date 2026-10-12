import { RepairAlert } from './RepairAlert.tsx';
import { useGameSettings } from './gameSettingsContext.ts';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Check, Coins, Download, Info, Package, Rocket, Weight } from 'lucide-react';
import { StoryControls, StoryShell } from './StoryShell.tsx';
import { CHECK_IDS, checkAccepted, allChecksAccepted, evaluateReadiness, packingComplete, PACKING_ACTIONS, READINESS_ASSUMPTIONS, FAIRING_SOURCE } from './readiness.ts';
import type { PackingAction } from './readiness.ts';
import { WORKSHOP_STAGES, partById } from './preparation.ts';
import type { WorkshopStage } from './preparation.ts';
import type { WorkshopSession, MissionEvent } from './workshopSession.ts';
import type { SelectionFrame } from './SelectionScreens.tsx';
import { sound } from '../../audio/soundEngine.ts';
import './workshop.css';
import './readiness.css';
import { GameInfo } from './GameInfo.tsx';
import { RadarRepair } from './RadarRepair.tsx';
import { ShadowTrial } from './ShadowTrial.tsx';
import { missionCardPNG } from './missionCard.ts';
import { CHECK_PATH } from './moon/checkPathData.ts';
import { CheckPath } from './moon/CheckPath.tsx';
import { PLATFORM_NOTES } from './moon/platform.ts';
import './moon/checks.css';
import { Term } from './Learning.tsx';

const PackingViewport = lazy(() => import('./PackingViewport.tsx').then(m => ({ default: m.PackingViewport })));
const headings = { 'mass-check': 'Weigh your explorer', 'power-check': 'Test your power', 'budget-check': 'Check your credits', 'rocket-pack': 'Pack for launch', 'launch-ready': 'Mission approved!' };
const editLabels: Record<WorkshopStage, string> = { 'lander-build': 'Lander', 'rover-select': 'Rover', 'science-build': 'Science', 'power-build': 'Power', 'survival-build': 'Survival' };
const packLabels: Record<PackingAction, string> = { adapter: 'Fit adapter', payload: 'Load explorer', fairing: 'Close fairing' };
const packInfo: Record<PackingAction, string> = {
  adapter: 'A joining piece that holds your explorer firmly inside the rocket.',
  payload: 'Your lander, rover and tools are the payload—the things the rocket carries.',
  fairing: 'The rocket’s protective cover. It keeps fast-moving air away from your explorer during launch.'
};
function EditDesign({ dispatch }: { dispatch(event: MissionEvent): void }) {
  const [open, setOpen] = useState(false);
  return <><button className="game-info-trigger" onClick={() => setOpen(true)}>Edit equipment</button>{open ? <GameInfo title="Change your equipment" onClose={() => setOpen(false)} pages={[<div key="edit" className="readiness-edit-options">{WORKSHOP_STAGES.map(stage => <button key={stage} onClick={() => dispatch({ type: 'visit-stage', stage })}>{editLabels[stage]}</button>)}<p>Changing a part resets checks and packing.</p></div>]} /> : null}</>;
}
function Notes() {
  const [open, setOpen] = useState(false);
  return <><button className="game-info-trigger" onClick={() => setOpen(true)}><Info size={16} />Science notes</button>{open ? <GameInfo title="Game rules & science" onClose={() => setOpen(false)} pages={[
    ...[...READINESS_ASSUMPTIONS.slice(0,5),...PLATFORM_NOTES].map((note, index) => <p key={index}>{note}</p>),
    <div key="sources"><a href="https://science.nasa.gov/mission/viper/lunar-operations/" target="_blank" rel="noreferrer">NASA: lunar operations</a><a href={FAIRING_SOURCE} target="_blank" rel="noreferrer">NASA: payload fairings</a></div>
  ]} /> : null}</>;
}
function Receipt({ ids }: { ids: (string | null)[] }) {
  const [open, setOpen] = useState(false);
  const parts = ids.map(partById).filter(part => !!part);
  const pages = Array.from({ length: Math.ceil(parts.length / 4) }, (_, page) => <dl key={page}>{parts.slice(page * 4, page * 4 + 4).map(part => <div key={part.id}><dt>{part.name}</dt><dd>{part.credits} cr</dd></div>)}</dl>);
  return <><button className="game-info-trigger" onClick={() => setOpen(true)}>Equipment receipt</button>{open ? <GameInfo title="Equipment receipt" pages={pages} onClose={() => setOpen(false)} /> : null}</>;
}
function PackingInfo({ action, onClose }: { action: PackingAction; onClose(): void }) {
  return <GameInfo title={packLabels[action]} onClose={onClose} pages={[<div key="packing"><p>{packInfo[action]}</p><p>Supplied hardware · no extra credits.</p><a href={FAIRING_SOURCE} target="_blank" rel="noreferrer">NASA: payload fairings</a></div>]} />;
}
export function ReadinessScreen({ session, dispatch, frame, onBack }: { session: WorkshopSession; dispatch(event: MissionEvent): void; frame: SelectionFrame; onBack(): void }) {
  const { effects } = useGameSettings();
  const { progress, preparation, readiness } = session;
  const id = progress.stepId as keyof typeof headings;
  const check = CHECK_IDS.find(check => check === id);
  const result = evaluateReadiness(progress, preparation, session.moon);
  const accepted = !!check && checkAccepted(check, progress, preparation, readiness, session.moon);
  const ready = id === 'launch-ready' ? !!readiness.approved && packingComplete(progress, preparation, readiness) : id === 'rocket-pack' ? packingComplete(progress, preparation, readiness) : accepted;
  const [card, setCard] = useState<string | null>(null);
  const [packImages, setPackImages] = useState<Record<string,string>>({});
  const [ran, setRan] = useState(false), [info, setInfo] = useState<PackingAction | null>(null);
  const [dragging, setDragging] = useState<{ action: PackingAction; x: number; y: number } | null>(null), [message, setMessage] = useState('');
  const bay = useRef<HTMLDivElement>(null), drag = useRef<{ action: PackingAction; pointerId: number; x: number; y: number; moved: boolean } | null>(null), suppress = useRef(false);
  useEffect(() => { const cancel = () => { drag.current = null; setDragging(null); }; window.addEventListener('blur', cancel); return () => window.removeEventListener('blur', cancel); }, []);
  const play = () => { sound.setMuted(!effects); sound.playSnap(); };
  const run = () => { setRan(true); dispatch({ type: 'run-check' }); sound.setMuted(!effects); if (check && result.pass[check]) sound.playFanfare(); else sound.playClick(); };
  const pack = (action: PackingAction) => { if (action !== PACKING_ACTIONS[readiness.packing.length] || !allChecksAccepted(progress, preparation, readiness, session.moon)) return;
    dispatch({ type: 'pack', action }); play(); setMessage(`${packLabels[action]} complete!`); };
  const cancelDrag = () => { suppress.current = true; drag.current = null; setDragging(null); };
  const download = () => {
    if (!readiness.approved || !packingComplete(progress, preparation, readiness)) return;
    setCard(missionCardPNG(session));
  };
  const packingScene = <div className={`readiness-bay ${dragging ? 'is-dragging' : ''}`} ref={bay} data-testid="packing-bay">
    <Suspense fallback={<div className="workshop-render-fallback">Opening the hangar…</div>}><PackingViewport preparation={preparation} packedCount={readiness.packing.length} onThumbnails={setPackImages} /></Suspense>
    {dragging ? <><span className="readiness-drop-beacon" aria-hidden="true" /><span className="packing-drop-label">{packLabels[dragging.action]} →</span></> : null}
  </div>;
  return <StoryShell {...frame} controls={<StoryControls onBack={onBack} onNext={() => { if (check && !accepted && check !== 'power-check') run(); else { play(); dispatch({ type: 'next' }); } }}
    nextHint={!ready ? check === 'power-check' ? "Drive · Drill · Return" : id === 'rocket-pack' ? `${readiness.packing.length}/3 packed` : check === 'mass-check' && !readiness.radarConnected ? "Connect the flashing sensor" : undefined : "All set!"} nextDisabled={check === 'mass-check' && !accepted ? !readiness.radarConnected : check === 'budget-check' && !accepted ? !result.complete : !ready} nextLabel={check && !accepted && check !== 'power-check' ? check === 'mass-check' ? 'Weigh explorer' : 'Check budget' : id === 'launch-ready' ? 'Launch pad' : id === 'rocket-pack' ? 'Approve mission' : id === 'budget-check' ? 'Check return' : 'Next'}
    progress={<span>{id === 'launch-ready' ? 'READY' : check ? `Checks · ${CHECK_PATH.findIndex(([stage])=>stage===check)+1}/8` : 'PACKING'}</span>} />}>
    <main className={`workshop-main readiness-main ${id === 'power-check' ? 'is-power-check' : ''}`} id="story-content" tabIndex={-1} aria-labelledby="readiness-title">
      <div className="workshop-heading"><div><span className="selection-eyebrow">{id === 'rocket-pack' ? 'LAUNCH PREPARATION' : id === 'launch-ready' ? 'BUILT BY YOU' : 'MISSION CHECKS'}</span><h1 id="readiness-title">{headings[id]}</h1></div>
        <div className="readiness-heading-tools">{check === 'power-check' ? <><EditDesign dispatch={dispatch} /><Notes /></> : null}<span className="readiness-chip"><Rocket size={18} /><Term term="mission">Moon mission</Term></span></div></div>
      <CheckPath step={id}/>
      {check ? <div className="readiness-check-layout">
        <section className={`readiness-lab ${ran || accepted ? 'is-scanned' : ''}`} aria-label="Live mission readings">
          {id === 'mass-check' ? <><Weight className="readiness-lab-icon" size={60} /><div className="readiness-dial"><strong>{result.massKg}<small>kg</small></strong><span>350 kg <Term term="mass">limit</Term></span></div>
            <progress value={Math.min(result.massKg, 350)} max={350} aria-label="Payload mass" /><span className="readiness-limit">{result.excessKg ? `${result.excessKg} kg too heavy` : `${350 - result.massKg} kg spare`}</span>
            <div className="readiness-breakdown">{['lander', 'rover', 'science', 'other'].map(category => {
              const ids = [...preparation.landerPartIds, ...preparation.sciencePartIds, preparation.roverId, preparation.solarId, preparation.batteryId, preparation.thermalId, preparation.navigationId, preparation.communicationId].filter((v): v is string => !!v);
              const mass = ids.map(partById).reduce((total, part) => total + (part && (category === 'other' ? !['lander', 'rover', 'science'].includes(part.category) : part.category === category) ? part.massKg : 0), 0);
              return <div key={category}><span>{category === 'other' ? 'Support' : category}</span><strong>{mass} kg</strong></div>;
            })}</div></> : null}
          {id === 'power-check' ? <ShadowTrial session={session} dispatch={dispatch} voiceEnabled={frame.voiceEnabled ?? true} /> : null}
          {id === 'budget-check' ? <><Coins className="readiness-lab-icon" size={60} /><div className="readiness-dial"><strong>{result.credits}<small>cr</small></strong><span>1,000 <Term term="credits">credits</Term></span></div><progress value={Math.min(1000, result.credits)} max={1000} aria-label="Equipment budget" /><span className="readiness-limit">{result.remainingCredits >= 0 ? `${result.remainingCredits} credits left` : `${-result.remainingCredits} credits over`}</span>
            <Receipt ids={[...preparation.landerPartIds, ...preparation.sciencePartIds, preparation.roverId, preparation.solarId, preparation.batteryId, preparation.thermalId, preparation.navigationId, preparation.communicationId]} /></> : null}
        </section>
        {check !== 'power-check' ? <section className="readiness-console"><span className="selection-eyebrow">{check === 'mass-check' ? 'PAYLOAD SCALE' : 'MISSION LEDGER'}</span>
          <p>{accepted ? '' : check === 'mass-check' ? readiness.radarConnected ? 'Ready to weigh!' : 'Fix the flashing connector.' : 'Keep under 1,000 credits.'}</p>
          {check === 'mass-check' ? <RadarRepair connected={readiness.radarConnected} onConnect={() => dispatch({ type: 'connect-radar' })}/> : null}

          <div className={`readiness-result ${accepted ? 'is-pass' : ''}`} role="status">
            {accepted ? <><Check size={24} />All set. Continue!</> : ran && !result.excessKg && result.remainingCredits >= 0 ? <><Info size={23} />Change a part and retry.</> : ''}
          </div>
          {check === 'mass-check' && progress.selections.objective === 'lunar-geology' && result.scienceMassKg > 100 ? <RepairAlert problem="science-mass" session={session} dispatch={dispatch}/> : null}
          {check === 'mass-check' && result.excessKg > 0 ? <RepairAlert problem="mass" session={session} dispatch={dispatch}/> : null}
          {check === 'budget-check' && result.remainingCredits < 0 ? <RepairAlert problem="budget" session={session} dispatch={dispatch}/> : null}
          {!result.complete ? <p className="readiness-warning">Finish installing the required parts first.</p> : null}
          <div className="readiness-tools"><EditDesign dispatch={dispatch} /><Notes /></div>
        </section> : null}
      </div> : <div className="readiness-pack-layout"><section className="readiness-console">
        {id === 'launch-ready' ? <><h2>Ready, {progress.playerName}!</h2>
          <div className="readiness-passport"><div><span><Term term="mass">Mass</Term></span><strong>{result.massKg} kg</strong></div><div><span>Credits used</span><strong>{result.credits} / 1,000</strong></div><div><span><Term term="peak">Peak power</Term></span><strong>{result.peakW} W</strong></div><div><span>Checks</span><strong>✓ 3/3 passed</strong></div></div>
          <button className="game-info-trigger readiness-save-card" onClick={download} disabled={!readiness.approved}><Download size={20} />Save mission card</button>
          <p className="readiness-end-note">Explorer packed.<br />Head to the launch pad!</p>
        </> : <><span className="selection-eyebrow">ALL THREE CHECKS PASSED</span><h2>Load your explorer.</h2>
          <div className="readiness-pack-actions">{PACKING_ACTIONS.map((action, index) => <article key={action} className={index < readiness.packing.length ? 'done' : ''}>
            <button className="readiness-pack-button" disabled={index !== readiness.packing.length || !allChecksAccepted(progress, preparation, readiness, session.moon)} aria-label={packLabels[action]}
              onPointerDown={event => { if (event.button !== 0 || !event.isPrimary) return; suppress.current = false; drag.current = { action, pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }}
              onPointerMove={event => { const active = drag.current; if (!active || active.pointerId !== event.pointerId) return; if (Math.hypot(event.clientX - active.x, event.clientY - active.y) > 7) active.moved = true; if (active.moved) { suppress.current = true; setDragging({ action, x: event.clientX, y: event.clientY }); } }}
              onPointerUp={event => { const active = drag.current, bounds = bay.current?.getBoundingClientRect(); if (!active || active.pointerId !== event.pointerId) return;
                if (active.moved && bounds) { if (event.clientX >= bounds.left - 65 && event.clientX <= bounds.right + 65 && event.clientY >= bounds.top - 65 && event.clientY <= bounds.bottom + 65) pack(active.action); else setMessage('Back on the shelf. Try again!'); }
                drag.current = null; setDragging(null); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
              onPointerCancel={cancelDrag} onLostPointerCapture={() => { if (drag.current?.action === action) cancelDrag(); }}
              onClick={() => { if (suppress.current) { suppress.current = false; return; } pack(action); }}>
              <span>{index < readiness.packing.length ? <Check /> : index + 1}</span>{packImages[action] ? <img src={packImages[action]} alt="" draggable={false}/> : action === 'payload' ? <Package size={28}/> : <Rocket size={28}/>}<strong>{packLabels[action]}</strong>
            </button><button className="workshop-info" onClick={() => setInfo(action)} aria-label={`Details for ${packLabels[action]}`}><Info size={19} /></button>
          </article>)}</div><div className="readiness-result" role="status">{message || (readiness.packing.length === 3 ? 'Packed. Approve your mission!' : `Next: ${packLabels[PACKING_ACTIONS[readiness.packing.length]]}.`)}</div>
        </>}
        <div className="readiness-tools"><EditDesign dispatch={dispatch} /><Notes /></div>
      </section>{packingScene}</div>}
    </main>
    {dragging ? <div className="readiness-drag-ghost" style={{ left: dragging.x, top: dragging.y }} aria-hidden="true">{packImages[dragging.action] ? <img src={packImages[dragging.action]} alt=""/> : <Package size={35}/>}</div> : null}
    {card ? <GameInfo title="Your mission card" onClose={() => setCard(null)} pages={[<div key="card"><img className="mission-card-preview" src={card} alt={`Mission card for ${progress.playerName}: ${result.massKg} kg, ${result.credits} credits, checks passed`}/><a className="game-info-trigger" download="zero-to-beyond-mission.png" href={card}><Download size={20}/>Download PNG</a></div>]}/> : null}
    {info ? <PackingInfo action={info} onClose={() => setInfo(null)} /> : null}
  </StoryShell>;
}
