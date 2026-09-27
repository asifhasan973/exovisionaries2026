// Mission Forge - Celestial Target Destination Console
import React from 'react';
import {
  Globe,
  Lock,
  Compass,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Orbit,
  ArrowRight
} from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { DESTINATIONS } from '../../data/missions';
import { useMissionStore } from '../../state/missionStore';
import { DestinationId } from '../../types/mission';

export const DestinationView: React.FC = () => {
  const {
    selectedDestination,
    selectDestination,
    setPhase,
    openComingSoon
  } = useMissionStore();

  const handleSelect = (destId: DestinationId) => {
    const dest = DESTINATIONS[destId];
    if (!dest.isPlayable) {
      sound.playBoing();
      openComingSoon(
        dest.name,
        dest.comingSoonReason || 'Mars is locked! Our engineers are building the Chapter 2 interplanetary ship!'
      );
      return;
    }
    sound.playClick(750);
    selectDestination(destId);
    setPhase('mission');
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-8 bg-[#030712] overflow-y-auto select-none">
      {/* Header */}
      <div className="max-w-4xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3.5 py-1 text-cyan-300 font-mono text-[11px] font-semibold tracking-wider mb-2">
          <span>01 TARGET RECONNAISSANCE</span>
          <span>•</span>
          <span>CELESTIAL DESTINATION</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
          Select Mission Destination
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-1 font-normal">
          Phase 1 operations focus on human return to Earth’s Moon with volatile water-ice prospecting at the lunar south pole.
        </p>
      </div>

      {/* Destination Cards Grid */}
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
        {/* The Moon (Luna) - Active Playable */}
        <div
          onClick={() => handleSelect('moon')}
          className="glass-panel p-6 sm:p-7 rounded-2xl border-cyan-500/50 shadow-xl shadow-cyan-500/10 cursor-pointer transition-all hover:border-cyan-400 flex flex-col justify-between text-left relative overflow-hidden group"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                <Globe size={24} />
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 size={11} />
                <span>Active Target</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-heading font-bold text-white mb-1">
              Earth’s Moon (Luna)
            </h2>
            <div className="text-[11px] font-mono text-cyan-400 mb-3 uppercase tracking-wider">
              South Pole Volatile Prospecting Zone
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Earth's primary natural satellite. Deep south pole impact craters create permanently shadowed regions (PSRs) harboring billions of kilograms of primordial water-ice deposits.
            </p>

            {/* Telemetry Specs */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-black/40 rounded-xl border border-white/5 text-xs font-mono text-center mb-5">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Distance</span>
                <strong className="text-slate-200">384,400 km</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Gravity</span>
                <strong className="text-emerald-400">0.166 g</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Atmosphere</span>
                <strong className="text-slate-200">Vacuum</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-aerospace-primary w-full py-2.5 text-xs font-mono font-semibold flex items-center justify-center gap-2"
          >
            <span>Proceed to Science Objectives</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Mars - Locked / Chapter 2 */}
        <div
          onClick={() => handleSelect('mars')}
          className="glass-panel p-6 sm:p-7 rounded-2xl border-white/5 opacity-70 hover:opacity-90 cursor-pointer transition-all flex flex-col justify-between text-left"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Orbit size={24} />
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Lock size={10} />
                <span>Chapter 2 Exploration</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-300 mb-1">
              Mars (The Red Planet)
            </h2>
            <div className="text-[11px] font-mono text-amber-400/80 mb-3 uppercase tracking-wider">
              Future Deep Space Expedition
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Interplanetary destination featuring Olympus Mons and ancient fluvial channels. Requires multi-month trans-Mars injection and specialized aerocapture infrastructure.
            </p>

            {/* Telemetry Specs */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-black/40 rounded-xl border border-white/5 text-xs font-mono text-center mb-5">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Distance</span>
                <strong className="text-slate-400">225M km</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Gravity</span>
                <strong className="text-slate-400">0.38 g</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Atmosphere</span>
                <strong className="text-slate-400">CO2 (0.6 kPa)</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-aerospace-dark w-full py-2.5 text-xs font-mono flex items-center justify-center gap-1.5 text-slate-400"
          >
            <Lock size={12} />
            <span>Classified Objective</span>
          </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => setPhase('welcome')}
          className="btn-aerospace-dark px-3 py-1.5 text-xs font-mono flex items-center gap-1.5"
        >
          <ChevronLeft size={13} />
          <span>Mission Briefing</span>
        </button>

        <div className="text-[11px] font-mono text-slate-500">
          Selected Target: Earth’s Moon (Luna)
        </div>
      </div>
    </div>
  );
};
