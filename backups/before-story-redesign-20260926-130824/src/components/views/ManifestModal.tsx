// Mission Forge - Official NASA Flight Manifest Modal
import React from 'react';
import {
  FileText,
  X,
  CheckCircle2,
  Users,
  Layers,
  DollarSign
} from 'lucide-react';
import { CANDIDATES } from '../../data/crew';
import { MISSIONS } from '../../data/missions';
import { PARTS, SLOTS } from '../../data/parts';
import { SITE_CONCEPTS } from '../../data/sites';
import { computeBudgetAccounting, computeMassAccounting } from '../../engine/accounting';
import { useMissionStore } from '../../state/missionStore';
import { CrewRole } from '../../types/mission';
import { RealisticPartIcon } from '../common/RealisticPartIcons';

export const ManifestModal: React.FC = () => {
  const {
    isManifestModalOpen,
    toggleManifestModal,
    installedParts,
    crewAssignments,
    selectedMission,
    selectedSite
  } = useMissionStore();

  if (!isManifestModalOpen) return null;

  const budget = computeBudgetAccounting(installedParts);
  const mass = computeMassAccounting(installedParts, crewAssignments);
  const mission = MISSIONS[selectedMission];
  const site = SITE_CONCEPTS[selectedSite];

  return (
    <div
      role="dialog"
      aria-label="Mission Launch Manifest"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none"
      onClick={() => toggleManifestModal(false)}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] glass-panel p-6 sm:p-7 rounded-2xl overflow-y-auto shadow-2xl flex flex-col text-left text-xs border border-cyan-500/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div>
            <div className="text-[10px] uppercase text-cyan-400 tracking-wider font-mono font-semibold flex items-center gap-1.5">
              <FileText size={12} />
              <span>OFFICIAL FLIGHT INTEGRATION MANIFEST</span>
            </div>
            <h2 className="text-xl font-heading font-bold text-white mt-0.5">{mission.title}</h2>
            <div className="text-xs text-slate-400 font-mono">Target Coordinates: {site.name}</div>
          </div>
          <button
            type="button"
            onClick={() => toggleManifestModal(false)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center border border-white/10"
          >
            <X size={15} />
          </button>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 my-4">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Liftoff Mass</div>
            <div className="text-white font-bold text-sm mt-0.5">
              {(mass.launchStackTotalLiftoffMassKg / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} t
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Payload Weight</div>
            <div className="text-cyan-400 font-bold text-sm mt-0.5">
              {mass.sciencePayloadMassKg} / {mass.sciencePayloadLimitKg} kg
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Mission Allocation</div>
            <div className="text-emerald-400 font-bold text-sm mt-0.5">
              ${(budget.discretionarySpentDollars / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Program Total</div>
            <div className="text-amber-400 font-bold text-sm mt-0.5">
              ${(budget.totalMissionCommittedDollars / 1000000).toLocaleString()}M
            </div>
          </div>
        </div>

        {/* Crew Roster */}
        <div className="mb-4">
          <h3 className="text-[11px] font-mono font-semibold text-cyan-400 mb-2 uppercase flex items-center gap-1.5">
            <Users size={12} />
            <span>Assigned Flight Crew (3 Astronauts)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {(['commander', 'scientist', 'engineer'] as CrewRole[]).map((role) => {
              const astronautId = crewAssignments[role];
              const candidate = CANDIDATES.find((c) => c.id === astronautId);
              return (
                <div key={role} className="p-2.5 bg-slate-900/60 rounded-xl border border-white/5">
                  <div className="text-[9px] uppercase font-mono font-semibold text-cyan-400">
                    {role === 'commander' ? 'Mission Commander' : role === 'scientist' ? 'Science Specialist' : 'Lunar Module Pilot'}
                  </div>
                  {candidate ? (
                    <div className="mt-1">
                      <div className="font-semibold text-white text-xs">{candidate.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">“{candidate.callsign}” • {candidate.nationality}</div>
                    </div>
                  ) : (
                    <div className="text-rose-400 font-mono text-[10px] mt-1">Unassigned Seat</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Installed Hardware List */}
        <div className="mb-4">
          <h3 className="text-[11px] font-mono font-semibold text-cyan-400 mb-2 uppercase flex items-center gap-1.5">
            <Layers size={12} />
            <span>Configured Flight Hardware Components</span>
          </h3>
          <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/50">
            <table className="w-full text-left border-collapse">
              <thead className="bg-black/40 text-slate-400 font-mono text-[10px] uppercase border-b border-white/10">
                <tr>
                  <th className="p-2">Location / Slot</th>
                  <th className="p-2">Component Name</th>
                  <th className="p-2">Mass</th>
                  <th className="p-2">Contract Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono">
                {SLOTS.map((slot) => {
                  const partId = installedParts[slot.id];
                  const part = partId ? PARTS[partId] : null;
                  return (
                    <tr key={slot.id} className="hover:bg-white/5">
                      <td className="p-2 font-semibold text-slate-300">
                        {slot.name}
                      </td>
                      <td className="p-2 text-cyan-400">
                        {part ? part.name : <span className="text-slate-600 italic">Empty Slot</span>}
                      </td>
                      <td className="p-2 text-slate-300">
                        {part ? (part.massKg >= 1000 ? `${(part.massKg / 1000).toFixed(1)} t` : `${part.massKg} kg`) : '—'}
                      </td>
                      <td className="p-2">
                        {part ? (
                          part.includedInParentPackage ? (
                            <span className="text-slate-400">Baseline</span>
                          ) : (
                            <span className="text-emerald-400">${(part.costDollars / 1000000).toFixed(1)}M</span>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-2 flex justify-end font-mono">
          <button
            type="button"
            onClick={() => toggleManifestModal(false)}
            className="btn-aerospace-primary px-5 py-2 text-xs font-semibold"
          >
            Close Flight Manifest
          </button>
        </div>
      </div>
    </div>
  );
};
