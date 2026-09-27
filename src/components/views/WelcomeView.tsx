// Mission Forge - Next-Gen Cinematic Aerospace Welcome Console
import React, { useState } from 'react';
import {
  Rocket,
  Compass,
  FlaskConical,
  Users,
  Orbit,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { useMissionStore } from '../../state/missionStore';

export const WelcomeView: React.FC = () => {
  const {
    setPhase,
    applyQuickLaunchManifest,
    prepareLaunch,
    installedParts
  } = useMissionStore();

  const [showDemoDisclosure, setShowDemoDisclosure] = useState(false);
  const hasSavedProgress = Object.keys(installedParts).length > 0;

  const handleQuickLaunch = () => {
    sound.playFanfare();
    applyQuickLaunchManifest();
    prepareLaunch();
    setPhase('launchpad');
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8 bg-[#030712] overflow-hidden select-none">
      {/* Cinematic Starfield & Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-cyan-500/10 filter blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-blue-600/10 filter blur-3xl" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Main Console Hero */}
      <div className="relative z-10 max-w-3xl w-full glass-panel p-6 sm:p-10 text-center rounded-2xl border border-white/10 shadow-2xl">
        {/* Aerospace Badge */}
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3.5 py-1 text-cyan-300 font-mono text-[11px] font-semibold tracking-wider mb-4 shadow-inner">
          <Rocket size={13} className="text-cyan-400 transform -rotate-45" />
          <span>NASA SPACE APPS 2026 // PROJECT MISSION FORGE</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight leading-tight mb-3">
          Deep Space Moon Launch Console
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8 font-normal">
          Engineer an Apollo-derived heavy-lift launch vehicle, integrate volatile water-ice prospecting instruments, certify a 3-person flight crew, and execute launch to Earth parking orbit.
        </p>

        {/* 3 Core Capability Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-8 text-left">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FlaskConical size={15} />
            </div>
            <div className="font-semibold text-slate-100 text-xs font-heading">
              Water-Ice Prospecting
            </div>
            <div className="text-[11px] text-slate-400 font-mono leading-snug">
              PNS neutron scanner, NIR volatile spectrometer & core drill
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users size={15} />
            </div>
            <div className="font-semibold text-slate-100 text-xs font-heading">
              Astronaut Flight Roster
            </div>
            <div className="text-[11px] text-slate-400 font-mono leading-snug">
              Assign Commander, Command Module Pilot & Mission Specialist
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Orbit size={15} />
            </div>
            <div className="font-semibold text-slate-100 text-xs font-heading">
              Apollo Saturn V Ascent
            </div>
            <div className="text-[11px] text-slate-400 font-mono leading-snug">
              S-IC, S-II & S-IVB staging to 185 km Earth Parking Orbit
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playClick(700);
              setPhase('destination');
            }}
            className="btn-aerospace-primary w-full sm:w-auto px-6 py-3 text-xs font-mono font-semibold tracking-wide flex items-center justify-center gap-2 shadow-lg"
          >
            <span>Initiate Mission Sequence</span>
            <ArrowRight size={14} />
          </button>

          {hasSavedProgress && (
            <button
              type="button"
              onClick={() => {
                sound.playClick(600);
                setPhase('assembly');
              }}
              className="btn-aerospace-dark w-full sm:w-auto px-5 py-3 text-xs font-mono flex items-center justify-center gap-2"
            >
              <span>Resume Active Vehicle</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setShowDemoDisclosure(true);
            }}
            className="btn-aerospace-dark w-full sm:w-auto px-5 py-3 text-xs font-mono flex items-center justify-center gap-1.5 text-amber-400 border-amber-500/30 hover:border-amber-400"
            title="Launch immediately with verified baseline manifest"
          >
            <Sparkles size={13} />
            <span>Quick Flight Demo</span>
          </button>
        </div>

        {/* Baseline Verification Specs */}
        <div className="mt-8 pt-4 border-t border-white/10 text-[11px] font-mono text-slate-500 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>Phase 1: Parking Orbit Insertion</span>
          </span>
          <span>•</span>
          <span className="text-slate-400">3-Stage Saturn V Staging Physics</span>
          <span>•</span>
          <span className="text-slate-400">NASA Baseline Parameters</span>
        </div>
      </div>

      {/* Quick Launch Preconfigured Manifest Disclosure Modal */}
      {showDemoDisclosure && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 text-left rounded-2xl border border-cyan-500/40 shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-amber-400 font-semibold mb-2">
              <Sparkles size={14} />
              <span>PRECONFIGURED FLIGHT MANIFEST</span>
            </div>
            <h2 className="text-xl font-heading font-bold text-white mb-2">
              Verified Baseline Flight Profile
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Instantly deploys an engineering-verified Saturn V stack equipped with all primary water-ice prospecting instruments (PNS + NIR + Core Drill) and flight-certified crew.
            </p>

            <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-3 rounded-xl border border-white/10 text-xs mb-5 font-mono">
              <div className="p-1">
                <span className="text-slate-400 block text-[10px] uppercase">Landing Target</span>
                <span className="text-white font-semibold">Connecting Ridge (South Pole)</span>
              </div>
              <div className="p-1">
                <span className="text-slate-400 block text-[10px] uppercase">Payload Mass</span>
                <span className="text-cyan-400 font-semibold">171 kg / 250 kg max</span>
              </div>
              <div className="p-1">
                <span className="text-slate-400 block text-[10px] uppercase">Allocated Cost</span>
                <span className="text-emerald-400 font-semibold">$16.4M Flight Spec</span>
              </div>
              <div className="p-1">
                <span className="text-slate-400 block text-[10px] uppercase">Assigned Crew</span>
                <span className="text-amber-400 font-semibold">Vance • Rostova • Mansoor</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 font-mono">
              <button
                type="button"
                onClick={() => setShowDemoDisclosure(false)}
                className="btn-aerospace-dark px-4 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickLaunch}
                className="btn-aerospace-primary px-5 py-2 text-xs flex items-center gap-1.5 font-semibold"
              >
                <span>Deploy to Launch Pad</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
