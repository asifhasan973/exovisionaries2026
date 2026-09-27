// Mission Forge - Earth Parking Orbit Insertion Terminal
import React, { useEffect } from 'react';
import {
  Orbit,
  CheckCircle2,
  FileText,
  RotateCcw,
  Wrench,
  ArrowRight,
  Radio,
  Lock
} from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { AscentScene } from '../../scene/AscentScene';
import { useMissionStore } from '../../state/missionStore';

export const OrbitEndpointView: React.FC = () => {
  const {
    openComingSoon,
    toggleManifestModal,
    setPhase,
    resetAscent,
    returnToHangar
  } = useMissionStore();

  useEffect(() => {
    sound.stopRocketRoar();
    sound.playFanfare();
  }, []);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col select-none">
      {/* 3D Earth Orbit Backdrop */}
      <div className="absolute inset-0">
        <AscentScene />
      </div>

      {/* Orbit Reached Hero Victory Card */}
      <div className="relative z-10 m-auto max-w-xl w-[92%] glass-panel p-6 sm:p-8 text-center rounded-2xl border border-emerald-500/50 shadow-2xl shadow-emerald-500/10 animate-in fade-in duration-300">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3.5 py-1 text-emerald-300 font-mono text-[11px] font-semibold tracking-wider mb-3">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <span>PHASE 1 COMPLETE • ORBITAL INSERTION CONFIRMED</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight mb-2">
          Earth Parking Orbit Established
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5 max-w-lg mx-auto">
          The Saturn V launch vehicle successfully completed third-stage (S-IVB) orbit insertion burn, placing the crewed Command & Service Module into a stable 185-km circular parking orbit.
        </p>

        {/* Orbit Telemetry Snapshot Card */}
        <div className="grid grid-cols-3 gap-2 bg-black/50 border border-white/10 rounded-xl p-3 text-center font-mono text-xs mb-5">
          <div className="p-1">
            <span className="text-slate-400 text-[10px] block uppercase">Perigee / Apogee</span>
            <strong className="text-white text-xs">184.8 x 185.2 km</strong>
          </div>
          <div className="p-1">
            <span className="text-slate-400 text-[10px] block uppercase">Orbital Velocity</span>
            <strong className="text-emerald-400 text-xs">7,800 m/s</strong>
          </div>
          <div className="p-1">
            <span className="text-slate-400 text-[10px] block uppercase">Inclination</span>
            <strong className="text-cyan-300 text-xs">28.5° North</strong>
          </div>
        </div>

        {/* Apollo Historical Fact Note */}
        <div className="p-3 bg-slate-900/60 border border-white/10 rounded-xl text-xs text-slate-300 text-left mb-6 font-mono">
          <span className="text-cyan-400 font-semibold block mb-0.5 uppercase text-[10px]">
            APOLLO FLIGHT PROFILE NOTE:
          </span>
          Apollo lunar missions maintained an initial 1.5 to 2 revolutions in Earth parking orbit to verify systems telemetry, navigation alignment, and cryogenic venting before committing to Trans-Lunar Injection (TLI).
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              sound.playClick(700);
              toggleManifestModal(true);
            }}
            className="btn-aerospace-dark px-3.5 py-2 flex items-center gap-1.5"
          >
            <FileText size={13} />
            <span>Flight Manifest</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick(700);
              resetAscent();
              setPhase('ascent');
            }}
            className="btn-aerospace-dark px-3.5 py-2 flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Replay Ascent</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick(700);
              returnToHangar();
            }}
            className="btn-aerospace-dark px-3.5 py-2 flex items-center gap-1.5"
          >
            <Wrench size={13} />
            <span>Vehicle Hangar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playBoing();
              openComingSoon(
                'Trans-Lunar Injection (Chapter 2)',
                'Trans-Lunar Injection (TLI), transposition and docking, lunar orbit insertion, and surface descent unlock in Chapter 2 of Mission Forge!'
              );
            }}
            className="btn-aerospace-primary px-4 py-2 flex items-center gap-1.5 font-semibold"
          >
            <Lock size={12} />
            <span>Commit to TLI (Chapter 2)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
