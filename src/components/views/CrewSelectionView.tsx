// Mission Forge - NASA Astronaut Flight Roster & Crew Assignment Console
import React from 'react';
import {
  Users,
  ShieldCheck,
  Award,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  User,
  ArrowRight
} from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { CANDIDATES } from '../../data/crew';
import { useMissionStore } from '../../state/missionStore';
import { AstronautCandidate, CrewRole } from '../../types/mission';

// High-Tech Aerospace Astronaut Avatar Badge
const AstronautDossierAvatar: React.FC<{ candidate: AstronautCandidate; isSelected: boolean }> = ({ candidate, isSelected }) => {
  return (
    <div className={`relative w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center border transition-all flex-shrink-0 ${
      isSelected
        ? 'border-cyan-400 bg-cyan-500/15 shadow-md shadow-cyan-500/20'
        : 'border-white/10 bg-slate-900/80 hover:border-white/20'
    }`}>
      <div className="flex flex-col items-center justify-center text-slate-300">
        <User size={22} className={isSelected ? 'text-cyan-400' : 'text-slate-400'} />
        <span className="text-[9px] font-mono font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
          {candidate.avatarSeed.slice(0, 3)}
        </span>
      </div>
    </div>
  );
};

export const CrewSelectionView: React.FC = () => {
  const {
    crewAssignments,
    assignCrew,
    unassignCrew,
    selectedSite,
    setPhase
  } = useMissionStore();

  const assignedCount = Object.values(crewAssignments).filter(Boolean).length;
  const isComplete = assignedCount === 3;

  const roleLabels: Record<CrewRole, { title: string; subtitle: string }> = {
    commander: { title: 'Mission Commander (CDR)', subtitle: 'Flight Dynamics & Spacecraft Systems' },
    scientist: { title: 'Mission Specialist (MS)', subtitle: 'Volatile Hydration & Regolith Science' },
    engineer: { title: 'Lunar Module Pilot (LMP)', subtitle: 'Avionics, Power & Cryogenic Propulsion' }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-8 bg-[#030712] overflow-y-auto select-none">
      {/* Header */}
      <div className="max-w-5xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3.5 py-1 text-cyan-300 font-mono text-[11px] font-semibold tracking-wider mb-2">
          <span>05 CREW ASSIGNMENT</span>
          <span>•</span>
          <span>ASTRONAUT FLIGHT ROSTER</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
          Certify 3-Person Flight Crew
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-1 font-normal">
          Assign verified NASA astronauts to command the Saturn V vehicle, operate the lunar volatiles suite, and manage cryogenic propulsion systems.
        </p>
      </div>

      {/* Flight Roster Assignment Status Strip */}
      <div className="max-w-5xl mx-auto w-full my-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['commander', 'scientist', 'engineer'] as CrewRole[]).map((role) => {
          const assignedId = crewAssignments[role];
          const candidate = CANDIDATES.find((c) => c.id === assignedId);

          return (
            <div
              key={role}
              className={`p-3.5 rounded-xl border transition-all text-left flex items-center gap-3 ${
                candidate
                  ? 'glass-panel border-cyan-500/50 shadow-md shadow-cyan-500/10'
                  : 'glass-panel border-dashed border-white/10'
              }`}
            >
              {candidate ? (
                <>
                  <AstronautDossierAvatar candidate={candidate} isSelected={true} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold uppercase text-cyan-400">
                        {roleLabels[role].title}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick(500);
                          unassignCrew(role);
                        }}
                        className="text-[10px] font-mono text-slate-400 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="text-sm font-semibold text-white truncate mt-0.5">
                      {candidate.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      Callsign: “{candidate.callsign}” • {candidate.nationality}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={10} />
                      <span>Flight Certified</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full text-center py-2">
                  <div className="text-[10px] font-mono font-semibold text-amber-400 uppercase">
                    Unassigned: {roleLabels[role].title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Select an astronaut candidate below
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Candidate Dossiers (6 Astronauts) */}
      <div className="max-w-5xl mx-auto w-full my-2">
        <div className="text-[10px] font-mono font-semibold uppercase text-cyan-400 tracking-wider mb-2.5 text-left flex items-center gap-1.5">
          <ShieldCheck size={12} />
          <span>ASTRONAUT CANDIDATE POOL</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CANDIDATES.map((candidate) => {
            const assignedRole = (Object.keys(crewAssignments) as CrewRole[]).find(
              (r) => crewAssignments[r] === candidate.id
            );

            const siteAdvice =
              selectedSite === 'crater-rim'
                ? candidate.readinessAdvice.craterRimSite
                : candidate.readinessAdvice.ridgeSite;

            return (
              <div
                key={candidate.id}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  assignedRole
                    ? 'glass-panel border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                    : 'glass-panel border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <AstronautDossierAvatar candidate={candidate} isSelected={Boolean(assignedRole)} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {candidate.name}
                      </div>
                      <div className="text-[10px] text-cyan-400 font-mono truncate">
                        “{candidate.callsign}” • {candidate.nationality}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Primary: {candidate.primaryRole === 'commander' ? 'Command Pilot' : candidate.primaryRole === 'scientist' ? 'Science Specialist' : 'Systems Engineer'}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5 line-clamp-2">
                    {candidate.biography}
                  </p>

                  {/* Surface Advice */}
                  <div className="text-[10px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-white/5 mb-2 font-mono">
                    <span className="text-cyan-400 font-semibold block mb-0.5">
                      Operational Note:
                    </span>
                    {siteAdvice}
                  </div>
                </div>

                {/* Seat Assignment Buttons */}
                <div className="pt-2 border-t border-white/10 flex items-center gap-1 font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playSnap();
                      assignCrew('commander', candidate.id);
                    }}
                    className={`flex-1 py-1 rounded transition-all ${
                      assignedRole === 'commander'
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400 font-semibold'
                        : 'btn-aerospace-dark text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    CDR
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playSnap();
                      assignCrew('scientist', candidate.id);
                    }}
                    className={`flex-1 py-1 rounded transition-all ${
                      assignedRole === 'scientist'
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400 font-semibold'
                        : 'btn-aerospace-dark text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    MS
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playSnap();
                      assignCrew('engineer', candidate.id);
                    }}
                    className={`flex-1 py-1 rounded transition-all ${
                      assignedRole === 'engineer'
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400 font-semibold'
                        : 'btn-aerospace-dark text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    LMP
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => setPhase('assembly')}
          className="btn-aerospace-dark px-3 py-1.5 text-xs font-mono flex items-center gap-1.5"
        >
          <ChevronLeft size={13} />
          <span>Vehicle Assembly</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-1.5">
            {isComplete ? (
              <>
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span className="text-emerald-300">All 3 Flight Seats Certified</span>
              </>
            ) : (
              <>
                <AlertTriangle size={13} className="text-amber-400" />
                <span className="text-amber-300">{3 - assignedCount} Astronaut Seats Remaining</span>
              </>
            )}
          </div>

          <button
            type="button"
            disabled={!isComplete}
            onClick={() => {
              sound.playFanfare();
              setPhase('readiness');
            }}
            className={`px-4 py-1.5 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-lg transition-all ${
              isComplete
                ? 'btn-aerospace-primary'
                : 'btn-aerospace-dark opacity-50 cursor-not-allowed text-slate-500'
            }`}
          >
            <span>Flight Readiness Review</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
