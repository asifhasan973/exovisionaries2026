// Mission Forge - Scientific Mission Briefing Console
import React from 'react';
import {
  FlaskConical,
  Layers,
  Flame,
  Lock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Radio
} from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { MISSIONS } from '../../data/missions';
import { useMissionStore } from '../../state/missionStore';
import { MissionId } from '../../types/mission';

export const MissionSelectView: React.FC = () => {
  const {
    selectedMission,
    selectMission,
    setPhase,
    openComingSoon
  } = useMissionStore();

  const handleSelect = (missionId: MissionId) => {
    const mission = MISSIONS[missionId];
    if (!mission.isPlayable) {
      sound.playBoing();
      openComingSoon(
        mission.title,
        mission.comingSoonReason || 'This mission will unlock in Chapter 2!'
      );
      return;
    }
    sound.playClick(750);
    selectMission(missionId);
    setPhase('site');
  };

  const activeMission = MISSIONS['lunar-ice-explorer'];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-8 bg-[#030712] overflow-y-auto select-none">
      {/* Header */}
      <div className="max-w-4xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3.5 py-1 text-cyan-300 font-mono text-[11px] font-semibold tracking-wider mb-2">
          <span>02 SCIENCE OBJECTIVES</span>
          <span>•</span>
          <span>PAYLOAD DIRECTIVE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
          Select Scientific Flight Mission
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-1 font-normal">
          Determine the primary scientific payloads, spectrometer sensors, and extraction drills required for the expedition.
        </p>
      </div>

      {/* Flight Director Telemetry Directive */}
      <div className="max-w-4xl mx-auto w-full my-4 p-4 rounded-xl glass-panel border border-cyan-500/30 shadow-lg flex items-center gap-4 text-left">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
          <Radio size={20} />
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase text-cyan-400 font-semibold tracking-wider">
            FLIGHT DIRECTOR OPERATIONAL DIRECTIVE
          </div>
          <div className="text-xs sm:text-sm font-medium text-slate-200 leading-snug mt-0.5">
            {activeMission.commanderCallout}
          </div>
        </div>
      </div>

      {/* 3 Mission Cards */}
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-4 my-2">
        {/* Playable: Lunar South Pole Ice Explorer */}
        <div
          onClick={() => handleSelect('lunar-ice-explorer')}
          className="glass-panel p-5 rounded-2xl border-cyan-500/50 shadow-xl shadow-cyan-500/10 cursor-pointer flex flex-col justify-between text-left transition-all hover:border-cyan-400 group relative"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <FlaskConical size={18} />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 size={10} />
                <span>Primary</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-heading font-bold text-white mb-1">
              Lunar Ice Explorer
            </h3>
            <div className="text-[11px] text-cyan-400 font-mono mb-2">
              Volatiles & Cryogenic Water-Ice
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Equip pulsed neutron spectrometers, NIR volatiles sensors, and a 1.5m rotary-percussive core drill to quantify sub-surface water ice.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-white/10">
            <button
              type="button"
              className="btn-aerospace-primary w-full py-2 text-xs font-mono font-semibold flex items-center justify-center gap-1.5"
            >
              <span>Select Directive</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Coming Soon: Geology Explorer */}
        <div
          onClick={() => handleSelect('lunar-geology')}
          className="glass-panel p-5 rounded-2xl border-white/5 opacity-70 hover:opacity-90 cursor-pointer flex flex-col justify-between text-left transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Layers size={18} />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Lock size={10} />
                <span>Chapter 2</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-heading font-bold text-slate-300 mb-1">
              Bedrock Geology Survey
            </h3>
            <div className="text-[11px] text-slate-500 font-mono mb-2">
              Impact Melt & Stratigraphy
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Investigate peak ring uplifting, sample ancient anorthosite crustal strata, and calibrate early Solar System bombardment epochs.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-white/10">
            <button
              type="button"
              className="btn-aerospace-dark w-full py-2 text-xs font-mono flex items-center justify-center gap-1 text-slate-400"
            >
              <Lock size={11} />
              <span>Future Chapter</span>
            </button>
          </div>
        </div>

        {/* Coming Soon: Volcanic Features */}
        <div
          onClick={() => handleSelect('lunar-volcanic')}
          className="glass-panel p-5 rounded-2xl border-white/5 opacity-70 hover:opacity-90 cursor-pointer flex flex-col justify-between text-left transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Flame size={18} />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Lock size={10} />
                <span>Chapter 2</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-heading font-bold text-slate-300 mb-1">
              Volcanic Pyroclastic Survey
            </h3>
            <div className="text-[11px] text-slate-500 font-mono mb-2">
              Lava Tubes & Glass Beads
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Survey subsurface lava tubes for radiation shelter suitability and sample ancient explosive fire-fountain titanium glass deposits.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-white/10">
            <button
              type="button"
              className="btn-aerospace-dark w-full py-2 text-xs font-mono flex items-center justify-center gap-1 text-slate-400"
            >
              <Lock size={11} />
              <span>Future Chapter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => setPhase('destination')}
          className="btn-aerospace-dark px-3 py-1.5 text-xs font-mono flex items-center gap-1.5"
        >
          <ChevronLeft size={13} />
          <span>Destination Target</span>
        </button>

        <div className="text-[11px] font-mono text-slate-500">
          Selected Objective: Lunar South Pole Ice Explorer
        </div>
      </div>
    </div>
  );
};
