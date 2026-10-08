import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BatteryCharging, ChevronLeft, ChevronRight, Check, CheckCheck, Coins, Info, PackageCheck, Plus, ShieldCheck, Sparkles, Sun, WandSparkles, Weight, Zap } from 'lucide-react';
import { sound } from '../../audio/soundEngine.ts';
import { CharacterStage } from './CharacterStage.tsx';
import { StoryControls, StoryShell } from './StoryShell.tsx';
import { SCRIPT_RESOURCES } from './design.ts';
import { drillPotential, installedIds, installPart, partById, preparationTotals, stageReady, STAGE_CATEGORIES, WORKSHOP_PARTS, WORKSHOP_STAGES } from './preparation.ts';
import { EngineerCompanion } from './EngineerCompanion.tsx';
import type { EngineerReaction } from './EngineerCompanion.tsx';
import type { WorkshopPart, WorkshopStage } from './preparation.ts';
import type { SelectionFrame } from './SelectionScreens.tsx';
import type { MissionEvent, WorkshopSession } from './workshopSession.ts';
import type { DesignCategory } from './design.ts';
import './workshop.css';
import { GameInfo } from './GameInfo.tsx';

const WorkshopViewport = lazy(() => import('./WorkshopViewport.tsx').then(module => ({ default: module.WorkshopViewport })));
const headings: Record<WorkshopStage, string> = { 'lander-build': 'Build your lander', 'rover-select': 'Choose your rover', 'science-build': 'Pack your science tools', 'power-build': 'Power your explorer', 'survival-build': 'Protect your explorer' };
const instructions: Record<WorkshopStage, string> = { 'lander-build': 'Install all six lander parts.', 'rover-select': 'Pick one rover. Try different options!', 'science-build': 'Install the three required tools. Choose a drill depth.', 'power-build': 'Choose one solar array and one battery.', 'survival-build': 'Choose cameras, thermal protection and a radio.' };
const categoryNames: Record<DesignCategory, string> = { lander: 'Lander parts', rover: 'Rover', science: 'Science tools', navigation: 'Navigation', solar: 'Solar array', battery: 'Battery', thermal: 'Thermal protection', communication: 'Communication' };
const stageNames = ['Lander', 'Rover', 'Science', 'Power', 'Survival'];
const cue = { character: 'commander', expression: 'confident', pose: 'point' } as const;

function Meter({ label, value, limit, unit, icon: Icon }: { label: string; value: number; limit: number; unit: string; icon: typeof Coins }) {
  const over = value > limit;
  return <div className={`workshop-meter ${over ? 'is-over' : ''}`}>
    <span><Icon size={17} />{label}</span><strong>{value}<small> / {limit} {unit}</small></strong>
    <progress value={Math.min(value, limit)} max={limit} aria-label={`${label}: ${value} of ${limit} ${unit}`} />
    {over ? <small role="status">{value - limit} {unit} over · swap a part</small> : null}
  </div>;
}
function ManifestMeters({ session }: { session: WorkshopSession }) {
  const totals = preparationTotals(session.preparation, session.progress.selections.site === 'permanent-shadow');
  return <div className="workshop-meters">
    <Meter label="Budget" value={totals.credits} limit={SCRIPT_RESOURCES.budgetCredits} unit="cr" icon={Coins} />
    <Meter label="Mass" value={totals.massKg} limit={SCRIPT_RESOURCES.payloadMassLimitKg} unit="kg" icon={Weight} />
    <Meter label="Peak load" value={totals.peakW} limit={SCRIPT_RESOURCES.peakPowerLimitW} unit="W" icon={Zap} />
  </div>;
}
export function WorkshopScreen({ session, dispatch, frame, onBack }: {
  session: WorkshopSession; dispatch(event: MissionEvent): void; frame: SelectionFrame; onBack(): void;
}) {
  const stage = WORKSHOP_STAGES.find(id => id === session.progress.stepId);
  const stageIndex = stage ? WORKSHOP_STAGES.indexOf(stage) : -1;
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<string[]>([]);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [lastInstalled, setLastInstalled] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; x: number; y: number } | null>(null);
  const [quickConfirm, setQuickConfirm] = useState(false);
  const [meshError, setMeshError] = useState(false);
  const [reaction, setReaction] = useState<EngineerReaction>('intro');
  const [reactionToken, setReactionToken] = useState(0);
  const drag = useRef<{ id: string; x: number; y: number; pointerId: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const dropZone = useRef<HTMLDivElement>(null);
  const [shelfTab, setShelfTab] = useState<DesignCategory | 'depth' | null>(null);
  const [shelfPage, setShelfPage] = useState(0);
  const [shortScreen, setShortScreen] = useState(() => window.matchMedia('(max-height: 760px), (max-width: 700px)').matches);
  const ids = installedIds(session.preparation);
  const totals = preparationTotals(session.preparation, session.progress.selections.site === 'permanent-shadow');
  const categories = stage ? STAGE_CATEGORIES[stage] : [];
  const parts = WORKSHOP_PARTS.filter(part => categories.includes(part.category));
  const missing = parts.filter(part => !ids.includes(part.id));
  const multi = stage === 'lander-build' || stage === 'science-build';
  useEffect(() => {
    const query = window.matchMedia('(max-height: 760px), (max-width: 700px)');
    const update = () => setShortScreen(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const activeCategory = shelfTab && shelfTab !== 'depth' && categories.includes(shelfTab) ? shelfTab : categories[0];
  const depthOpen = shelfTab === 'depth' && stage === 'science-build';
  const pageSize = shortScreen ? 1 : 2;
  const categoryParts = parts.filter(part => part.category === activeCategory);
  const pageCount = Math.ceil(categoryParts.length / pageSize);
  const currentPage = Math.min(shelfPage, Math.max(0, pageCount - 1));
  const visibleParts = categoryParts.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  useEffect(() => {
    const cancel = () => { drag.current = null; setDragging(null); };
    window.addEventListener('blur', cancel);
    return () => { window.removeEventListener('blur', cancel); };
  }, []);
  const install = (selected: string[]) => {
    if (!selected.length) return;
    dispatch({ type: 'install', ids: selected }); setLastInstalled(selected.at(-1)!); setMarked([]);
    sound.setMuted(!frame.voiceEnabled); sound.playSnap();
    setMessage(`${selected.length === 1 ? partById(selected[0])?.name : `${selected.length} parts`} installed!`);
    const updated = selected.reduce(installPart, session.preparation);
    const overBudget = preparationTotals(updated).credits > SCRIPT_RESOURCES.budgetCredits;
    const category = partById(selected.at(-1))?.category;
    const response: EngineerReaction = overBudget ? 'warning' : stage && stageReady(stage, updated) && !stageReady(stage, session.preparation) ? 'complete'
      : category === 'lander' ? 'lander' : category === 'rover' ? 'rover' : category === 'science' ? 'science'
      : category === 'solar' || category === 'battery' ? 'power' : 'survival';
    setReaction(response); setReactionToken(value => value + 1);
  };
  const next = () => { sound.setMuted(!frame.voiceEnabled); sound.playFanfare(); dispatch({ type: 'next' }); };
  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>, id: string) => {
    if (event.button !== 0 || !event.isPrimary) return;
    suppressClick.current = false;
    drag.current = { id, x: event.clientX, y: event.clientY, pointerId: event.pointerId, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - active.x, event.clientY - active.y) > 7) active.moved = true;
    if (active.moved) { suppressClick.current = true; setDragging({ id: active.id, x: event.clientX, y: event.clientY }); }
  };
  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const bounds = dropZone.current?.getBoundingClientRect();
    if (active.moved && bounds) {
      // Whole bay plus a forgiving outer margin: tiny hardware needs no precision hit.
      const inside = event.clientX >= bounds.left - 45 && event.clientX <= bounds.right + 65 && event.clientY >= bounds.top - 65 && event.clientY <= bounds.bottom + 65;
      if (inside) install([active.id]); else setMessage('Back on the shelf. Try again!');
    }
    drag.current = null; setDragging(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const onPointerCancel = () => { suppressClick.current = true; drag.current = null; setDragging(null); };
  const scene = <div className={`workshop-drop-zone ${dragging ? 'is-dragging' : ''}`} ref={dropZone} data-testid="workshop-drop-zone">
    <Suspense fallback={<div className="workshop-render-fallback">Opening the workshop…</div>}>
      <WorkshopViewport preparation={session.preparation} draggingId={dragging?.id ?? null} lastInstalled={lastInstalled}
        canUndo={!!stage && !!session.past.length} canRedo={!!stage && !!session.future.length} onUndo={() => dispatch({ type: 'undo' })} onRedo={() => dispatch({ type: 'redo' })}
        onThumbnails={setThumbnails} onMeshError={() => setMeshError(true)} />
    </Suspense>
  </div>;
  if (session.progress.stepId === 'resource-limits') return <StoryShell {...frame} controls={<StoryControls onBack={onBack} onNext={() => dispatch({ type: 'next' })} nextLabel="Build" progress={<span>WORKSHOP</span>} />}>
    <main className="conversation-main workshop-resource-main" id="story-content" tabIndex={-1}>
      <div className="conversation-stage"><CharacterStage cue={cue} active speaking={false} label="Commander" /></div>
      <section className="conversation-panel workshop-resources"><span className="selection-eyebrow">SPACECRAFT DESIGN SPECIFICATIONS</span><h1>Your mission kit</h1>
        <p>Build a lander. Pack a rover. Stay within your limits.</p>
        <div className="workshop-resource-cards"><div><Coins /><strong>1,000</strong><span>credits</span></div><div><Weight /><strong>350 kg</strong><span>payload limit</span></div><div><Zap /><strong>450 W</strong><span>peak power limit</span></div></div>
        <div className="workshop-resource-start"><span><ShieldCheck size={19} />Rover health 100%</span><span><Sparkles size={19} />Science score 0</span></div>
        <small>Credits and part specifications are game values. NASA-inspired instrument details are in ⓘ.</small>
      </section>
    </main>
  </StoryShell>;
  if (!stage) return <StoryShell {...frame} controls={<StoryControls onBack={onBack} nextLabel="Checks soon" nextDisabled progress={<span>BUILT</span>} />}>
    <main className="workshop-main" id="story-content" tabIndex={-1}>
      <div className="workshop-heading"><div><span className="selection-eyebrow">WORKSHOP COMPLETE</span><h1>Built by you!</h1><p>Your design is saved. Mission checks come next.</p></div><PackageCheck size={48} /></div>
      <div className="workshop-layout workshop-summary-layout"><section className="workshop-shelf workshop-handoff"><ManifestMeters session={session} />
        <h2>Your explorer</h2><p>{ids.length} parts · {session.preparation.drillDepthCm} cm drill plan</p>
        <div className="workshop-edit-stages">{WORKSHOP_STAGES.map((id, index) => <button key={id} onClick={() => dispatch({ type: 'visit-stage', stage: id })}><Check size={18} />{stageNames[index]}<span>Edit</span></button>)}</div>
        <small>Mission checks and rocket packing are coming soon.</small>
      </section>{scene}</div>
    </main>
  </StoryShell>;
  return <StoryShell {...frame} controls={<StoryControls onBack={onBack} onNext={next} nextDisabled={!stageReady(stage, session.preparation)}
    nextLabel={stage === 'survival-build' ? 'Finish build' : 'Next'} progress={<span>{stageIndex + 1} / 5</span>} />}>
    <main className="workshop-main" id="story-content" tabIndex={-1} aria-labelledby="workshop-title">
      <div className="workshop-top-row"><div className="workshop-heading"><div><span className="selection-eyebrow">MISSION WORKSHOP</span><h1 id="workshop-title">{headings[stage]}</h1><p>{stage === 'science-build' && session.progress.selections.objective === 'lunar-geology' ? 'Pack the three tools. Study minerals with NIRVSS.' : instructions[stage]}</p></div>
        <button className="workshop-quick" onClick={() => setQuickConfirm(true)}><WandSparkles size={18} />Quick build</button>
      </div><EngineerCompanion reaction={reaction} token={reactionToken} voiceEnabled={frame.voiceEnabled ?? true} /></div>
      <nav className="workshop-stage-tabs" aria-label="Build stages">{WORKSHOP_STAGES.map((id, index) => <button key={id} aria-current={id === stage ? 'step' : undefined} disabled={index > stageIndex}
        onClick={() => dispatch({ type: 'visit-stage', stage: id })}><span>{stageReady(id, session.preparation) ? <Check size={14} /> : index + 1}</span>{stageNames[index]}</button>)}</nav>
      <div className="workshop-layout"><section className="workshop-shelf" aria-label="Parts shelf"><ManifestMeters session={session} />
        <nav className="workshop-category-tabs" aria-label="Equipment categories">{categories.map(category => <button key={category} aria-pressed={!depthOpen && activeCategory === category} onClick={() => { setShelfTab(category); setShelfPage(0); }}>{categoryNames[category]}</button>)}{stage === 'science-build' ? <button aria-pressed={depthOpen} onClick={() => { setShelfTab('depth'); setShelfPage(0); }}>Drill plan</button> : null}</nav>
        <div className={`workshop-shelf-pages ${depthOpen ? 'is-depth-page' : ''}`}>
          {multi && !depthOpen ? <div className="workshop-bulk"><label><input type="checkbox" aria-label="Select all shelf parts" checked={!!missing.length && missing.every(p => marked.includes(p.id))}
            onChange={event => setMarked(event.target.checked ? missing.map(p => p.id) : [])} disabled={!missing.length} />Select all</label>
            <button disabled={!marked.length} onClick={() => install(marked)}><CheckCheck size={17} />Add {marked.length || 'selected'}</button></div> : null}
          {!depthOpen ? <section className="workshop-category" aria-label={categoryNames[activeCategory]}>
            <div className="workshop-part-grid">{visibleParts.map(part => {
              const installed = ids.includes(part.id);
              return <article key={part.id} className={`workshop-part ${installed ? 'is-installed' : ''}`} data-part-id={part.id}>
                <div className="workshop-part-top">{multi && !installed ? <input type="checkbox" aria-label={`Mark ${part.name}`} checked={marked.includes(part.id)}
                  onChange={event => setMarked(current => event.target.checked ? [...current, part.id] : current.filter(id => id !== part.id))} /> : <span>{installed ? <Check size={16} /> : <Plus size={16} />}</span>}
                  <button className="workshop-info" aria-label={`Details for ${part.name}`} onClick={() => setInfoId(part.id)}><Info size={17} /></button></div>
                <button className="workshop-pick" disabled={installed} aria-label={`Install ${part.name}`} onPointerDown={event => onPointerDown(event, part.id)} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
                  onPointerCancel={onPointerCancel} onLostPointerCapture={() => { if (drag.current?.id === part.id) onPointerCancel(); }}
                  onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } install([part.id]); }}>
                  {thumbnails[part.id] ? <img draggable={false} src={thumbnails[part.id]} alt="" /> : <div className="workshop-part-placeholder"><PackageCheck size={38} /></div>}
                  <strong>{part.name}</strong><span className="workshop-part-price">{part.credits} cr · {part.massKg} kg</span>
                  {part.category === 'rover' ? <span className="workshop-part-spec">{part.nominalPowerW} W · {'★'.repeat(part.terrainStars ?? 0)}<br />{part.reliabilityPercent}% reliability</span> : null}
                  {part.outputW ? <span className="workshop-part-spec">{part.outputW} W sunlight</span> : null}
                  {part.capacityWh ? <span className="workshop-part-spec">{part.capacityWh} Wh</span> : null}
                  <span className="workshop-part-action">{installed ? 'Installed' : part.mandatory ? 'Required · install' : 'Install'}</span>
                </button>
              </article>;
            })}</div></section> : null}
          {!depthOpen ? <nav className="workshop-part-pages" aria-label="Parts pages"><button className="conversation-icon" aria-label="Previous parts page" disabled={currentPage === 0} onClick={() => setShelfPage(currentPage - 1)}><ChevronLeft size={20} /></button><span>{currentPage + 1} / {pageCount}</span><button className="conversation-icon" aria-label="Next parts page" disabled={currentPage === pageCount - 1} onClick={() => setShelfPage(currentPage + 1)}><ChevronRight size={20} /></button></nav> : null}
          {depthOpen && session.preparation.sciencePartIds.includes('trident') ? <div className="workshop-depth">
            <label htmlFor="drill-depth">Drill depth <strong>{session.preparation.drillDepthCm} cm</strong></label>
            <input id="drill-depth" type="range" min={10} max={100} step={10} value={session.preparation.drillDepthCm ?? 20} onChange={event => dispatch({ type: 'depth', cm: Number(event.target.value) })}
              onPointerUp={() => { setReaction('depth'); setReactionToken(value => value + 1); }} onKeyUp={event => { if (event.key.startsWith('Arrow')) { setReaction('depth'); setReactionToken(value => value + 1); } }} />
            <div><span>10 cm</span><span>100 cm</span></div><p>Potential +{drillPotential(session.preparation.drillDepthCm)} · {totals.drillRisk.toLowerCase()} risk</p><p>~{totals.drillMinutes} min · ~{totals.drillEnergyWh} Wh at peak load</p>
          </div> : depthOpen ? <p className="workshop-depth-empty">Install TRIDENT first, then choose your drill depth.</p> : null}
        </div>
        <div className="workshop-feedback" role="status" aria-live="polite">{message || (stageReady(stage, session.preparation) ? 'Ready! Choose Next.' : 'Hold and drag, or tap to install.')}</div>
      </section><section className="workshop-view-column" aria-label="Spacecraft assembly">
        {scene}
        <div className="workshop-live-strip"><span><Check size={17} />{ids.length} installed</span><span><Sparkles size={17} />Science {totals.spentScience} <small>· potential +{totals.potentialScience}</small></span></div>
        {(stage === 'power-build' || stage === 'survival-build') ? <div className="workshop-power-strip"><span><Sun size={20} />{totals.solarW} W solar</span><span><BatteryCharging size={20} />{totals.batteryWh} Wh stored</span><span>{totals.normalW} W normal · {totals.peakW} W peak</span>
          <small>{session.progress.selections.site === 'permanent-shadow' ? 'Permanent shadow: no solar charging. Plan a return to sunlight.' : 'Shadow trips use the battery. Keep energy for the return.'}
            {totals.batteryMinutes !== null ? ` ~${totals.batteryMinutes} min at steady load, with 20% reserve; drilling uses ~${totals.drillEnergyWh} Wh separately.` : ''}</small>
        </div> : null}
        {meshError ? <small className="workshop-model-note">3D could not start. Every part still has a working Install button.</small> : null}
      </section></div>
      {dragging ? <div className="workshop-drag-ghost" style={{ left: dragging.x, top: dragging.y }} aria-hidden="true">{thumbnails[dragging.id] ? <img src={thumbnails[dragging.id]} alt="" /> : <PackageCheck />}</div> : null}
    </main>
    {infoId ? <PartDetails part={partById(infoId)!} installed={ids.includes(infoId)} onClose={() => setInfoId(null)} onRemove={() => { dispatch({ type: 'remove', id: infoId }); setInfoId(null); setMessage('Part returned to the shelf.'); }} /> : null}
    {quickConfirm ? <QuickBuildDialog onClose={() => setQuickConfirm(false)} onConfirm={() => { dispatch({ type: 'quick-build' }); setQuickConfirm(false); sound.setMuted(!frame.voiceEnabled); sound.playFanfare(); }} /> : null}
  </StoryShell>;
}
function PartDetails({ part, installed, onClose, onRemove }: { part: WorkshopPart; installed: boolean; onClose(): void; onRemove(): void }) {
  return <GameInfo title={part.name} onClose={onClose} pages={[
    <div key="overview"><span className="selection-eyebrow">{categoryNames[part.category]}</span><p>{part.description}</p>
      <dl><div><dt>Cost</dt><dd>{part.credits} credits</dd></div><div><dt>Mass</dt><dd>{part.massKg} kg</dd></div><div><dt>Electrical load</dt><dd>{part.nominalPowerW} W{part.peakPowerW ? ` / ${part.peakPowerW} W peak` : ''}</dd></div>
      {part.outputW ? <div><dt>Sunlight output</dt><dd>{part.outputW} W · 0 W in shadow</dd></div> : null}{part.capacityWh ? <div><dt>Battery energy</dt><dd>{part.capacityWh} Wh</dd></div> : null}</dl>
      {installed ? <button className="workshop-remove" onClick={onRemove}>Remove part</button> : null}</div>,
    <div key="notes"><p>Prices, masses, loads, reliability and bonus points are authored game values, not real hardware quotations.</p>{part.safetyBonus ? <p>Game safety bonus: +{part.safetyBonus}</p> : null}{part.assumption ? <p>{part.assumption}</p> : null}{part.source ? <a href={part.source} target="_blank" rel="noreferrer">NASA: learn about the real system ↗</a> : null}</div>
  ]} />;
}
function QuickBuildDialog({ onClose, onConfirm }: { onClose(): void; onConfirm(): void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const target = dialog.current; target?.showModal(); return () => target?.close(); }, []);
  return <dialog className="workshop-dialog" ref={dialog} onCancel={onClose} onClose={event => { if (!event.currentTarget.open) onClose(); }} aria-labelledby="quick-build-title">
    <span className="selection-eyebrow">QUICK PREVIEW</span><h2 id="quick-build-title">Auto-build this explorer?</h2><p>Replaces this design with a complete example. You can edit it afterward.</p>
    <div className="workshop-dialog-actions"><button onClick={onClose} autoFocus>Keep building</button><button className="conversation-next" onClick={onConfirm}>Auto-build</button></div>
  </dialog>;
}
