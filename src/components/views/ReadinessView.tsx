// Mission Forge - NASA Flight Readiness Review (FRR) Console
import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Radio,
  ArrowRight,
  Flame,
  Info
} from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { validateLaunchReadiness } from '../../engine/validation';
import { useMissionStore } from '../../state/missionStore';
import { SlotInterface } from '../../types/mission';

export const ReadinessView: React.FC = () => {
  const {
    selectedMission,
    selectedSite,
    installedParts,
    crewAssignments,
    setPhase,
    selectSlot,
    selectPart,
    prepareLaunch
  } = useMissionStore();

  const report = validateLaunchReadiness(
    selectedMission,
    selectedSite,
    installedParts,
    crewAssignments
  );

  const handleFixBlocker = (targetStep?: string, targetSlotId?: SlotInterface, targetPartId?: string) => {
    sound.playClick(750);
    if (targetSlotId) selectSlot(targetSlotId);
    if (targetPartId) selectPart(targetPartId);
    if (targetStep === 'assembly') setPhase('assembly');
    if (targetStep === 'crew') setPhase('crew');
  };

  const handleProceedToPad = () => {
    if (!report.isClearToLaunch) {
      sound.playBoing();
      return;
    }
    sound.playFanfare();
    prepareLaunch();
    setPhase('launchpad');
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-8 bg-[#030712] overflow-y-auto select-none">
      {/* Header */}
      <div className="max-w-4xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3.5 py-1 text-cyan-300 font-mono text-[11px] font-semibold tracking-wider mb-2">
          <span>06 SYSTEMS READINESS</span>
          <span>•</span>
          <span>FLIGHT READINESS REVIEW (FRR)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
          Flight Readiness Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-1 font-normal">
          Verify critical vehicle staging parameters, volatile water-ice instrument payloads, and certified astronaut crew assignments.
        </p>

        {/* Polling Status Hero Banner */}
        <div className={`mt-5 p-5 rounded-2xl border text-center flex items-center justify-center gap-4 transition-all shadow-xl ${
          report.isClearToLaunch
            ? 'glass-panel border-emerald-500/50 shadow-emerald-500/10'
            : 'glass-panel border-rose-500/50 shadow-rose-500/10'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            report.isClearToLaunch ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          }`}>
            {report.isClearToLaunch ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2 font-mono text-xs uppercase font-semibold tracking-wider">
              <span className={`w-2 h-2 rounded-full ${report.isClearToLaunch ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className={report.isClearToLaunch ? 'text-emerald-400' : 'text-rose-400'}>
                {report.isClearToLaunch ? 'MISSION CONTROL POLL: ALL SYSTEMS GO' : 'LAUNCH HOLD: DISCREPANCIES DETECTED'}
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-100 mt-0.5">
              {report.isClearToLaunch
                ? 'Launch vehicle, ice prospecting instrumentation suite, and flight crew certified for terminal countdown.'
                : `${report.totalBlockerCount} mandatory constraint blocker(s) require engineering resolution before rollout.`}
            </div>
          </div>
        </div>
      </div>

      {/* Constraints & Advisory Panels */}
      <div className="max-w-4xl mx-auto w-full my-5 space-y-4 text-left">
        {/* Launch Blockers */}
        {report.blockers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[11px] font-mono uppercase text-rose-400 font-semibold tracking-wider flex items-center gap-2">
                <AlertTriangle size={13} />
                <span>Mandatory Flight Blockers ({report.blockers.length})</span>
              </h2>
            </div>

            <div className="space-y-2">
              {report.blockers.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3.5 glass-panel border border-rose-500/40 rounded-xl flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                      <span>{issue.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1 font-normal">
                      {issue.description}
                    </div>
                  </div>

                  {issue.actionText && (
                    <button
                      type="button"
                      onClick={() => handleFixBlocker(issue.targetStep, issue.targetSlotId, issue.targetPartId)}
                      className="btn-aerospace-gold px-3 py-1.5 text-xs font-mono whitespace-nowrap flex-shrink-0"
                    >
                      {issue.actionText} ➔
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mission Operational Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] font-mono uppercase text-cyan-400 font-semibold tracking-wider flex items-center gap-2">
              <Info size={13} />
              <span>Flight Planning Advisories ({report.notes.length})</span>
            </h2>
          </div>

          <div className="space-y-2">
            {report.notes.length > 0 ? (
              report.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 glass-panel border border-white/10 rounded-xl text-xs"
                >
                  <div className="font-semibold text-slate-200 flex items-center gap-2 mb-0.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{note.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed pl-3.5">
                    {note.description}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 glass-panel border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-mono flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Optimal alignment: All instrumentation parameters conform with NASA flight baselines.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => setPhase('crew')}
          className="btn-aerospace-dark px-3 py-1.5 text-xs font-mono flex items-center gap-1.5"
        >
          <ChevronLeft size={13} />
          <span>Crew Selection</span>
        </button>

        <button
          type="button"
          disabled={!report.isClearToLaunch}
          onClick={handleProceedToPad}
          className={`px-5 py-2 text-xs font-mono font-semibold flex items-center gap-2 shadow-lg transition-all ${
            report.isClearToLaunch
              ? 'btn-aerospace-primary'
              : 'btn-aerospace-dark opacity-40 cursor-not-allowed text-slate-500'
          }`}
        >
          <span>Rollout to Pad 39A</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
