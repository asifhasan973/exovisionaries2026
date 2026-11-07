import React from 'react';
import { Check, PanelLeftClose } from 'lucide-react';
import type { DesignCategory } from '@/game/moon/core/design';
import type { WorkshopPart, WorkshopStage } from '@/game/moon/core/preparation';
import { drillPotential, partById } from '@/game/moon/core/preparation';
import type { ScienceFamily } from '@/game/moon/science/geology';
import { GEOLOGY_FAMILIES, SCIENCE_FAMILY_NAMES } from '@/game/moon/science/geology';
import { Term } from '@/game/moon/core/learning/Learning';
import type { EngineerReaction } from '@/game/moon/narrative/components/EngineerCompanion';
import type { MissionEvent, WorkshopSession } from '../workshopSession';
import type { ShelfNext } from '../workshopNavigation';
import { CATEGORY_NAMES } from '../workshopNavigation';
import { WorkshopPartCard } from './WorkshopPartCard';
import { ScienceFamilyDropdown } from './ScienceFamilyDropdown';

export interface WorkshopInventoryDrawerProps {
  drawerRef: React.RefObject<HTMLElement | null>;
  shelfOpen: boolean;
  toggleShelf: () => void;
  dragging: boolean;
  geology: boolean;
  stage?: WorkshopStage;
  depthOpen: boolean;
  scienceFamily: ScienceFamily;
  setScienceFamily: (family: ScienceFamily) => void;
  setShelfTab: (tab: DesignCategory | 'depth' | null) => void;
  setShelfPage: (page: number) => void;
  drill: WorkshopPart | null;
  parts: WorkshopPart[];
  ids: string[];
  categories: readonly DesignCategory[];
  activeCategory: DesignCategory;
  repair?: any;
  appliedRepair: boolean;
  categoryParts: WorkshopPart[];
  session: WorkshopSession;
  lastInstalled: string | null;
  multi: boolean;
  thumbnails: Record<string, string>;
  meshError: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>, id: string) => void;
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: () => void;
  dragRef: React.MutableRefObject<any>;
  suppressClickRef: React.MutableRefObject<boolean>;
  install: (ids: string[]) => void;
  dispatch: (event: MissionEvent) => void;
  setMessage: (msg: string) => void;
  setReaction: (r: EngineerReaction) => void;
  setReactionToken: React.Dispatch<React.SetStateAction<number>>;
  setInfoId: (id: string | null) => void;
  missionBudget: any;
  totals: any;
  nextAction: ShelfNext | null;
  message: string;
}

export function WorkshopInventoryDrawer({
  drawerRef, shelfOpen, toggleShelf, dragging, geology, stage, depthOpen,
  scienceFamily, setScienceFamily, setShelfTab, setShelfPage, drill,
  parts, ids, categories, activeCategory, repair, appliedRepair, categoryParts,
  session, lastInstalled, multi, thumbnails, meshError, onPointerDown,
  onPointerMove, onPointerUp, onPointerCancel, dragRef, suppressClickRef,
  install, dispatch, setMessage, setReaction, setReactionToken, setInfoId,
  missionBudget, totals, nextAction, message,
}: WorkshopInventoryDrawerProps) {
  return (
    <aside
      ref={drawerRef as any}
      className={`workshop-shelf workshop-inventory-drawer ${!shelfOpen ? 'is-collapsed' : ''}`}
      aria-label="Inventory side-drawer"
      inert={!shelfOpen && !dragging ? true : undefined}
      aria-hidden={!shelfOpen && !dragging || undefined}
    >
      <div className="workshop-shelf-header">
        <span className="workshop-shelf-title">INVENTORY</span>
        <button className="workshop-shelf-close" onClick={toggleShelf} aria-label="Close inventory drawer" title="Close inventory drawer">
          <PanelLeftClose size={18} />
        </button>
      </div>

      {geology && stage === 'science-build' ? (
        <ScienceFamilyDropdown
          depthOpen={depthOpen}
          scienceFamily={scienceFamily}
          parts={parts}
          ids={ids}
          drill={Boolean(drill)}
          onSelectFamily={family => {
            setScienceFamily(family);
            setShelfTab('science');
            setShelfPage(0);
          }}
          onSelectDepth={() => {
            setShelfTab('depth');
            setShelfPage(0);
          }}
        />
      ) : null}

      {geology && stage === 'science-build' ? (
        <nav className="geology-families" aria-label="Geology tool families">
          {GEOLOGY_FAMILIES.map(family => (
            <button
              key={family}
              aria-pressed={scienceFamily === family && !depthOpen}
              onClick={() => {
                setScienceFamily(family);
                setShelfTab('science');
                setShelfPage(0);
              }}
            >
              {SCIENCE_FAMILY_NAMES[family]}
              {ids.some(id => partById(id)?.scienceFamily === family) ? <Check size={12} /> : null}
            </button>
          ))}
        </nav>
      ) : null}

      <nav className="workshop-category-tabs" aria-label="Equipment categories">
        {categories.map(category => (
          <button
            key={category}
            aria-pressed={!depthOpen && activeCategory === category}
            onClick={() => { setShelfTab(category); setShelfPage(0); }}
          >
            {CATEGORY_NAMES[category]}
          </button>
        ))}
        {stage === 'science-build' && (!geology || !!drill) ? (
          <button aria-pressed={depthOpen} onClick={() => { setShelfTab('depth'); setShelfPage(0); }}>
            Drill plan
          </button>
        ) : null}
      </nav>

      <div className={`workshop-shelf-pages ${depthOpen ? 'is-depth-page' : ''}`}>
        {repair?.action === 'depth' && !appliedRepair ? <p className="repair-shelf-note">{repair.label}</p> : null}
        {!depthOpen ? (
          <section className="workshop-category" aria-label={CATEGORY_NAMES[activeCategory]}>
            <div className="workshop-part-grid">
              {categoryParts.map(part => (
                <WorkshopPartCard
                  key={part.id}
                  part={part}
                  ids={ids}
                  session={session}
                  lastInstalled={lastInstalled}
                  repair={repair}
                  appliedRepair={appliedRepair}
                  multi={multi}
                  geology={geology}
                  missionBudget={missionBudget}
                  thumbnails={thumbnails}
                  meshError={meshError}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerCancel}
                  dragRef={dragRef}
                  suppressClickRef={suppressClickRef}
                  install={install}
                  dispatch={dispatch}
                  setMessage={setMessage}
                  setReaction={setReaction}
                  setInfoId={setInfoId}
                />
              ))}
            </div>
          </section>
        ) : null}

        {depthOpen && !!drill ? (
          <div className={`workshop-depth ${repair?.action === 'depth' && !appliedRepair ? 'is-repair-target' : ''}`}>
            <label htmlFor="drill-depth"><Term term="drill">Drill depth</Term> <strong>{session.preparation.drillDepthCm} cm</strong></label>
            <input
              id="drill-depth"
              type="range"
              min={10}
              max={drill?.maxDepthCm ?? 100}
              step={10}
              value={session.preparation.drillDepthCm ?? 20}
              onChange={event => dispatch({ type: 'depth', cm: Number(event.target.value) })}
              onPointerUp={() => { setReaction('depth'); setReactionToken(value => value + 1); }}
              onKeyUp={event => {
                if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') {
                  setReaction('depth');
                  setReactionToken(value => value + 1);
                }
              }}
            />
            <div><span>10 cm</span><span>{drill?.maxDepthCm ?? 100} cm</span></div>
            <p>{geology ? `Limit ${drill.maxDepthCm} cm` : `Potential +${drillPotential(session.preparation.drillDepthCm)}`} · {totals.drillRisk.toLowerCase()} risk</p>
            <p role="status"><strong>{totals.drillEnergyWh} <Term term="wh">Wh</Term> needed</strong> · {totals.drillMinutes} min</p>
          </div>
        ) : depthOpen ? (
          <p className="workshop-depth-empty">Install a drill first, then choose your drill depth.</p>
        ) : null}
      </div>

      <div className="workshop-feedback" role="status" aria-live="polite">
        {repair
          ? appliedRepair ? 'Part changed! Retest mission.' : repair.action === 'depth' ? repair.label : repair.action === 'remove' ? 'Remove the yellow part.' : 'Pick the yellow part.'
          : nextAction?.kind === 'install' ? `Install ${nextAction.remaining === 1 ? 'a part' : `${nextAction.remaining} parts`}, then Next.`
          : nextAction?.kind === 'depth' ? 'Tools ready! Next: drill depth.'
          : nextAction?.kind === 'shelf' && !multi && !categoryParts.some(part => ids.includes(part.id)) ? 'Pick a part, or Next for more.'
          : message || 'Ready! Choose Next.'}
      </div>
    </aside>
  );
}
