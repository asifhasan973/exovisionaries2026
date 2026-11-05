import { TriangleAlert, ArrowRight } from 'lucide-react';
import { recommendRepair, REPAIR_TITLES } from './repairGuidance.ts';
import type { RepairProblem } from './repairGuidance.ts';
import type { MissionEvent, WorkshopSession } from './workshopSession.ts';
import './repair.css';

export function RepairAlert({ problem, session, dispatch }: { problem: RepairProblem; session: WorkshopSession; dispatch(event: MissionEvent): void }) {
  const guide = recommendRepair(session, problem);
  return <section className="mission-repair-alert" role="alert" aria-label="Mission problem">
    <TriangleAlert className="repair-alert-icon" size={32} aria-hidden="true" />
    <div><strong>{REPAIR_TITLES[problem]}</strong><p>{guide?.label ?? 'Change equipment, then try again.'}</p></div>
    {guide ? <button className="repair-fix" data-primary-action onClick={() => dispatch({ type: 'fix-problem', problem })}>Fix <ArrowRight size={21}/></button> : null}
  </section>;
}
