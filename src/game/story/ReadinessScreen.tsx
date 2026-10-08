import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, Coins, Download, Info, Package, Rocket, Weight, Zap } from 'lucide-react';
import { StoryControls, StoryShell } from './StoryShell.tsx';
import { CHECK_IDS, checkAccepted, allChecksAccepted, evaluateReadiness, packingComplete, PACKING_ACTIONS, READINESS_ASSUMPTIONS, FAIRING_SOURCE, LAUNCH_CONFIGURATION } from './readiness.ts';
import type { PackingAction } from './readiness.ts';
import { WORKSHOP_STAGES, partById } from './preparation.ts';
import type { WorkshopStage } from './preparation.ts';
import type { WorkshopSession, MissionEvent } from './workshopSession.ts';
import type { SelectionFrame } from './SelectionScreens.tsx';
import { sound } from '../../audio/soundEngine.ts';
import './workshop.css';
import './readiness.css';
import { GameInfo } from './GameInfo.tsx';
import { ShadowTrial } from './ShadowTrial.tsx';
import { trialPassed } from './trial.ts';
import { missionSignature } from './readiness.ts';

const PackingViewport = lazy(() => import('./PackingViewport.tsx').then(m => ({ default: m.PackingViewport })));
const headings = { 'mass-check': 'Weigh your explorer', 'power-check': 'Test your power', 'budget-check': 'Check your credits', 'rocket-pack': 'Pack for launch', 'launch-ready': 'Mission approved!' };
const editLabels: Record<WorkshopStage, string> = { 'lander-build': 'Lander', 'rover-select': 'Rover', 'science-build': 'Science', 'power-build': 'Power', 'survival-build': 'Survival' };
const packLabels: Record<PackingAction, string> = { adapter: 'Fit adapter', payload: 'Load explorer', fairing: 'Close fairing' };
const packInfo: Record<PackingAction, string> = {
  adapter: 'The payload adapter joins your spacecraft to the carrier. This illustrative adapter is included in the supplied launch hardware.',
  payload: 'Your selected lander, rover and every installed instrument are loaded together. Parts are arranged and scaled for this illustration; this is not an engineering fit test.',
  fairing: 'The fairing protects the payload during ascent through the atmosphere. It is supplied with this illustrative carrier. Fairing release happens later, during flight.'
};
function EditDesign({ dispatch }: { dispatch(event: MissionEvent): void }) {
  const [open, setOpen] = useState(false);
  return <><button className="game-info-trigger" onClick={() => setOpen(true)}>Edit equipment</button>{open ? <GameInfo title="Change your equipment" onClose={() => setOpen(false)} pages={[<div key="edit" className="readiness-edit-options">{WORKSHOP_STAGES.map(stage => <button key={stage} onClick={() => dispatch({ type: 'visit-stage', stage })}>{editLabels[stage]}</button>)}<p>Changing a part resets checks and packing.</p></div>]} /> : null}</>;
}
function Notes() {
  const [open, setOpen] = useState(false);
  return <><button className="game-info-trigger" onClick={() => setOpen(true)}><Info size={16} />Science notes</button>{open ? <GameInfo title="Game rules & science" onClose={() => setOpen(false)} pages={[
    ...READINESS_ASSUMPTIONS.map((note, index) => <p key={index}>{note}</p>),
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
  const { progress, preparation, readiness } = session;
  const id = progress.stepId as keyof typeof headings;
  const check = CHECK_IDS.find(check => check === id);
  const result = evaluateReadiness(progress, preparation);
  const accepted = !!check && checkAccepted(check, progress, preparation, readiness);
  const ready = id === 'launch-ready' ? !!readiness.approved && packingComplete(progress, preparation, readiness) : id === 'rocket-pack' ? packingComplete(progress, preparation, readiness) : accepted;
  const [ran, setRan] = useState(false), [info, setInfo] = useState<PackingAction | null>(null);
  const [dragging, setDragging] = useState<{ action: PackingAction; x: number; y: number } | null>(null), [message, setMessage] = useState('');
  const bay = useRef<HTMLDivElement>(null), drag = useRef<{ action: PackingAction; pointerId: number; x: number; y: number; moved: boolean } | null>(null), suppress = useRef(false);
  useEffect(() => { const cancel = () => { drag.current = null; setDragging(null); }; window.addEventListener('blur', cancel); return () => window.removeEventListener('blur', cancel); }, []);
  const play = () => { sound.setMuted(!frame.voiceEnabled); sound.playSnap(); };
  const run = () => { setRan(true); dispatch({ type: 'run-check' }); sound.setMuted(!frame.voiceEnabled); if (check && result.pass[check]) sound.playFanfare(); else sound.playClick(); };
  const pack = (action: PackingAction) => { if (action !== PACKING_ACTIONS[readiness.packing.length] || !allChecksAccepted(progress, preparation, readiness)) return;
    dispatch({ type: 'pack', action }); play(); setMessage(`${packLabels[action]} complete!`); };
  const cancelDrag = () => { suppress.current = true; drag.current = null; setDragging(null); };
  const download = () => {
    if (!readiness.approved || !packingComplete(progress, preparation, readiness)) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(readiness.approved, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'zero-to-beyond-mission.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const packingScene = <div className={`readiness-bay ${dragging ? 'is-dragging' : ''}`} ref={bay} data-testid="packing-bay">
    <Suspense fallback={<div className="workshop-render-fallback">Opening the hangar…</div>}><PackingViewport preparation={preparation} packedCount={readiness.packing.length} /></Suspense>
    {dragging ? <span className="readiness-drop-beacon" aria-hidden="true" /> : null}
  </div>;
  return <StoryShell {...frame} controls={<StoryControls onBack={onBack} onNext={() => { play(); dispatch({ type: 'next' }); }}
    nextDisabled={!ready} nextLabel={id === 'launch-ready' ? 'Launch pad' : id === 'rocket-pack' ? 'Approve mission' : id === 'budget-check' ? 'Pack rocket' : 'Next'}
    progress={<span>{id === 'launch-ready' ? 'READY' : check ? `${CHECK_IDS.indexOf(check) + 1} / 3` : 'PACKING'}</span>} />}>
    <main className={`workshop-main readiness-main ${id === 'power-check' ? 'is-power-check' : ''}`} id="story-content" tabIndex={-1} aria-labelledby="readiness-title">
      <div className="workshop-heading"><div><span className="selection-eyebrow">{id === 'rocket-pack' ? 'LAUNCH PREPARATION' : id === 'launch-ready' ? 'BUILT BY YOU' : 'MISSION CHECKS'}</span><h1 id="readiness-title">{headings[id]}</h1></div>
        <span className="readiness-chip"><Rocket size={18} />Robotic Moon mission</span></div>
      <ol className="readiness-path" aria-label="Readiness stages">{['Mass', 'Power', 'Budget', 'Pack', 'Ready'].map((label, index) => {
        const active = ['mass-check', 'power-check', 'budget-check', 'rocket-pack', 'launch-ready'].indexOf(id);
        return <li key={label} aria-current={active === index ? 'step' : undefined} className={index < active ? 'done' : ''}><span>{index < active ? <Check size={16} /> : index + 1}</span>{label}</li>;
      })}</ol>
      {check ? <div className="readiness-check-layout">
        <section className={`readiness-lab ${ran || accepted ? 'is-scanned' : ''}`} aria-label="Live mission readings">
          {id === 'mass-check' ? <><Weight className="readiness-lab-icon" size={60} /><div className="readiness-dial"><strong>{result.massKg}<small>kg</small></strong><span>350 kg allowance</span></div>
            <progress value={Math.min(result.massKg, 350)} max={350} aria-label="Payload mass" /><span className="readiness-limit">{result.excessKg ? `${result.excessKg} kg too heavy` : `${350 - result.massKg} kg spare`}</span>
            <div className="readiness-breakdown">{['lander', 'rover', 'science', 'other'].map(category => {
              const ids = [...preparation.landerPartIds, ...preparation.sciencePartIds, preparation.roverId, preparation.solarId, preparation.batteryId, preparation.thermalId, preparation.navigationId, preparation.communicationId].filter((v): v is string => !!v);
              const mass = ids.map(partById).reduce((total, part) => total + (part && (category === 'other' ? !['lander', 'rover', 'science'].includes(part.category) : part.category === category) ? part.massKg : 0), 0);
              return <div key={category}><span>{category === 'other' ? 'Support' : category}</span><strong>{mass} kg</strong></div>;
            })}</div></> : null}
          {id === 'power-check' ? <ShadowTrial session={session} dispatch={dispatch} voiceEnabled={frame.voiceEnabled ?? true} /> : null}
          {id === 'budget-check' ? <><Coins className="readiness-lab-icon" size={60} /><div className="readiness-dial"><strong>{result.credits}<small>cr</small></strong><span>1,000 credit budget</span></div><progress value={Math.min(1000, result.credits)} max={1000} aria-label="Equipment budget" /><span className="readiness-limit">{result.remainingCredits >= 0 ? `${result.remainingCredits} credits left` : `${-result.remainingCredits} credits over`}</span>
            <Receipt ids={[...preparation.landerPartIds, ...preparation.sciencePartIds, preparation.roverId, preparation.solarId, preparation.batteryId, preparation.thermalId, preparation.navigationId, preparation.communicationId]} /></> : null}
        </section>
        <section className="readiness-console"><span className="selection-eyebrow">{check === 'mass-check' ? 'PAYLOAD SCALE' : check === 'power-check' ? 'POWER REHEARSAL' : 'MISSION LEDGER'}</span>
          <h2>{accepted ? 'Check complete!' : check === 'mass-check' ? 'Ready to weigh?' : check === 'power-check' ? 'Can your battery cope?' : 'Stay within budget.'}</h2>
          <p>{check === 'mass-check' ? readiness.radarConnected ? 'Sensor connected. Weigh your explorer.' : 'Find and fix the flashing connector.' : check === 'power-check' ? 'Drive, drill and return. Keep your battery reserve.' : 'Review the cost of your equipment.'}</p>
          {check === 'mass-check' ? <div className="readiness-connectors" role="group" aria-label="Repair disconnected sensor">
            {['Landing radar', 'Camera', 'Radio'].map((label, index) => <button key={label} className={index === 0 && !readiness.radarConnected ? 'is-unplugged' : 'is-connected'}
              onClick={() => { if (index === 0) { dispatch({ type: 'connect-radar' }); play(); setMessage('Radar connected! Now weigh the payload.'); } else setMessage(readiness.radarConnected ? 'All connectors are working.' : 'This connector is working. Find the flashing one.'); }}>
              <Zap size={24} /><strong>{label}</strong><span>{index === 0 && !readiness.radarConnected ? 'No signal' : 'Connected'}</span>
            </button>)}<p role="status">{message}</p>
          </div> : null}
          <button className="conversation-next readiness-action" onClick={run} disabled={accepted || check === 'mass-check' && !readiness.radarConnected || check === 'power-check' && !trialPassed(readiness.trial, missionSignature(progress, preparation), preparation, progress.selections.site === 'permanent-shadow')}>{accepted ? <CheckCheck size={23} /> : check === 'mass-check' ? <Weight size={23} /> : check === 'power-check' ? <Zap size={23} /> : <Coins size={23} />}{accepted ? 'Passed' : check === 'mass-check' ? 'Weigh payload' : check === 'power-check' ? 'Confirm rehearsal' : 'Check budget'}</button>
          <div className={`readiness-result ${accepted ? 'is-pass' : ''}`} role="status">
            {accepted ? <><Check size={24} />All set. Continue!</> : ran ? <><Info size={23} />Adjust your design below.</> : 'Run this check to unlock Next.'}
          </div>
          {check === 'mass-check' && result.excessKg > 0 ? <p className="readiness-warning">Remove {result.excessKg} kg. Try a lighter rover or battery.</p> : null}
          {check === 'power-check' ? <div className="readiness-power-notes">
            {!result.batteryOK ? <p className="readiness-warning">Battery is {Math.ceil(result.rehearsalWh - result.usableWh)} Wh short. Choose a bigger battery or a shallower drill.</p> : null}
            {!result.thermalOK ? <p className="readiness-warning">Shadow site: choose Advanced thermal protection.</p> : null}
            {result.marginW < 50 ? <p className="readiness-warning">Low peak margin: {result.marginW} W.</p> : null}
            <small>Rover-only game rehearsal. Separate lander descent load: {result.landerW} W. Lander battery sizing is outside this check.</small>
            {progress.selections.site === 'permanent-shadow' ? <small>This site cannot recharge solar. Your battery supports a finite visit.</small> : null}
          </div> : null}
          {check === 'budget-check' && result.remainingCredits < 0 ? <p className="readiness-warning">Save {-result.remainingCredits} credits. Swap upgrades or remove optional MSOLO.</p> : null}
          {!result.complete ? <p className="readiness-warning">Finish installing the required parts first.</p> : null}
          <div className="readiness-tools"><EditDesign dispatch={dispatch} /><Notes /></div>
        </section>
      </div> : <div className="readiness-pack-layout"><section className="readiness-console">
        {id === 'launch-ready' ? <><span className="readiness-approved"><CheckCheck />MISSION APPROVED</span><h2>Ready, {progress.playerName}!</h2><p>Your explorer is packed. Save your mission card.</p>
          <div className="readiness-passport"><div><span>Equipment mass</span><strong>{result.massKg} kg</strong></div><div><span>Credits used</span><strong>{result.credits} / 1,000</strong></div><div><span>Drilling peak</span><strong>{result.peakW} W</strong></div><div><span>Science earned</span><strong>0 · explore later</strong></div></div>
          <button className="conversation-next readiness-action" onClick={download} disabled={!readiness.approved}><Download size={20} />Save mission card</button>
          <p className="readiness-end-note">Explorer packed.<br />Head to the launch pad!</p>
        </> : <><span className="selection-eyebrow">ALL THREE CHECKS PASSED</span><h2>Secure your explorer.</h2><p>Drag each item into the hangar—or tap it.</p>
          <div className="readiness-pack-actions">{PACKING_ACTIONS.map((action, index) => <article key={action} className={index < readiness.packing.length ? 'done' : ''}>
            <button className="readiness-pack-button" disabled={index !== readiness.packing.length || !allChecksAccepted(progress, preparation, readiness)} aria-label={packLabels[action]}
              onPointerDown={event => { if (event.button !== 0 || !event.isPrimary) return; suppress.current = false; drag.current = { action, pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }}
              onPointerMove={event => { const active = drag.current; if (!active || active.pointerId !== event.pointerId) return; if (Math.hypot(event.clientX - active.x, event.clientY - active.y) > 7) active.moved = true; if (active.moved) { suppress.current = true; setDragging({ action, x: event.clientX, y: event.clientY }); } }}
              onPointerUp={event => { const active = drag.current, bounds = bay.current?.getBoundingClientRect(); if (!active || active.pointerId !== event.pointerId) return;
                if (active.moved && bounds) { if (event.clientX >= bounds.left - 65 && event.clientX <= bounds.right + 65 && event.clientY >= bounds.top - 65 && event.clientY <= bounds.bottom + 65) pack(active.action); else setMessage('Back on the shelf. Try again!'); }
                drag.current = null; setDragging(null); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
              onPointerCancel={cancelDrag} onLostPointerCapture={() => { if (drag.current?.action === action) cancelDrag(); }}
              onClick={() => { if (suppress.current) { suppress.current = false; return; } pack(action); }}>
              <span>{index < readiness.packing.length ? <Check /> : index + 1}</span>{action === 'payload' ? <Package size={28} /> : <Rocket size={28} />}<strong>{packLabels[action]}</strong>
            </button><button className="workshop-info" onClick={() => setInfo(action)} aria-label={`Details for ${packLabels[action]}`}><Info size={19} /></button>
          </article>)}</div><div className="readiness-result" role="status">{message || (readiness.packing.length === 3 ? 'Packed. Approve your mission!' : `Next: ${packLabels[PACKING_ACTIONS[readiness.packing.length]]}.`)}</div>
        </>}
        <small>{LAUNCH_CONFIGURATION.name} · supplied launch hardware</small><div className="readiness-tools"><EditDesign dispatch={dispatch} /><Notes /></div>
      </section>{packingScene}</div>}
    </main>
    {dragging ? <div className="readiness-drag-ghost" style={{ left: dragging.x, top: dragging.y }} aria-hidden="true"><Package size={35} /></div> : null}
    {info ? <PackingInfo action={info} onClose={() => setInfo(null)} /> : null}
  </StoryShell>;
}
