import React from 'react';
import { BatteryCharging, Coins, Weight, Zap } from 'lucide-react';
import { SCRIPT_RESOURCES } from '@/game/moon/core/design';
import { preparationTotals, selectedDrill } from '@/game/moon/core/preparation';
import { geologyBudget } from '@/game/moon/science/geologyBudget';
import { Term } from '@/game/moon/core/learning/Learning';
import type { LearningTerm } from '@/game/moon/core/learning/glossary';
import type { WorkshopSession } from '../workshopSession';

export function Meter({ label, value, limit, unit, icon: Icon, term }: {
  term?: LearningTerm;
  label: string;
  value: number;
  limit: number;
  unit: string;
  icon: typeof Coins;
}) {
  const over = value > limit;
  return (
    <div className={`workshop-meter ${over ? 'is-over' : ''}`}>
      <span>
        <Icon size={17} />
        {term ? <Term term={term}>{label}</Term> : label}
      </span>
      <strong>
        {value}
        <small> / {limit} {unit}</small>
      </strong>
      <progress value={Math.min(value, limit)} max={limit} aria-label={`${label}: ${value} of ${limit} ${unit}`} />
      {over ? <small role="status">{value - limit} {unit} over · swap a part</small> : null}
    </div>
  );
}

export function ManifestMeters({ session }: { session: WorkshopSession }) {
  const totals = preparationTotals(session.preparation, session.progress.selections.site === 'permanent-shadow');
  const geology = session.progress.selections.objective === 'lunar-geology'
    ? geologyBudget(session.preparation, session.moon.crew, session.moon.plan)
    : null;

  return (
    <div className="workshop-meters">
      <Meter
        term="budget"
        label={geology ? 'Mission budget' : 'Budget'}
        value={geology?.spent ?? totals.credits}
        limit={geology?.cap ?? SCRIPT_RESOURCES.budgetCredits}
        unit={geology ? 'MC' : 'cr'}
        icon={Coins}
      />
      <Meter
        term="mass"
        label="Mass"
        value={totals.massKg}
        limit={SCRIPT_RESOURCES.payloadMassLimitKg}
        unit="kg"
        icon={Weight}
      />
      {session.progress.stepId === 'science-build' && selectedDrill(session.preparation) ? (
        <div className="workshop-meter drill-energy-meter" role="status">
          <span>
            <BatteryCharging size={17} />
            <Term term="wh">Drill energy</Term>
          </span>
          <strong>{totals.drillEnergyWh}<small> Wh</small></strong>
          <small>{totals.drillMinutes} min · {totals.peakW} W</small>
        </div>
      ) : (
        <Meter
          term="peak"
          label="Peak"
          value={totals.peakW}
          limit={SCRIPT_RESOURCES.peakPowerLimitW}
          unit="W"
          icon={Zap}
        />
      )}
    </div>
  );
}

