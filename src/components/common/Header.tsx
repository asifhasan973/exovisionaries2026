// Mission Forge - Next-Gen Aerospace Mission Control Header
import React from 'react';
import {
  Rocket,
  Globe,
  FlaskConical,
  MapPin,
  Wrench,
  Users,
  CheckCircle2,
  Clock,
  Flame,
  Orbit,
  BookOpen,
  Volume2,
  VolumeX,
  MessageSquare
} from 'lucide-react';
import { useMissionStore } from '../../state/missionStore';
import { MissionPhase } from '../../types/mission';

interface StepDef {
  phase: MissionPhase;
  code: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const STEPS: StepDef[] = [
  { phase: 'welcome', code: '00', label: 'BRIEF', icon: Rocket },
  { phase: 'destination', code: '01', label: 'TARGET', icon: Globe },
  { phase: 'mission', code: '02', label: 'SCIENCE', icon: FlaskConical },
  { phase: 'site', code: '03', label: 'SITE', icon: MapPin },
  { phase: 'assembly', code: '04', label: 'VEHICLE', icon: Wrench },
  { phase: 'crew', code: '05', label: 'CREW', icon: Users },
  { phase: 'readiness', code: '06', label: 'SYSTEMS', icon: CheckCircle2 },
  { phase: 'launchpad', code: '07', label: 'PAD 39A', icon: Clock },
  { phase: 'ascent', code: '08', label: 'ASCENT', icon: Flame },
  { phase: 'orbit', code: '09', label: 'ORBIT', icon: Orbit }
];

export const Header: React.FC = () => {
  const {
    currentPhase,
    setPhase,
    audioSettings,
    toggleMute,
    toggleCaptions,
    toggleSourcesDrawer
  } = useMissionStore();

  const currentIdx = STEPS.findIndex((s) => s.phase === currentPhase);

  const canNavigateTo = (targetPhase: MissionPhase, targetIdx: number) => {
    if (['launchpad', 'ascent', 'orbit'].includes(targetPhase) && currentIdx < targetIdx) {
      return false;
    }
    return true;
  };

  return (
    <header className="w-full glass-panel border-b border-white/10 px-3 sm:px-6 py-2.5 z-40 flex items-center justify-between gap-4 text-xs select-none shadow-xl">
      {/* Brand & Mission Designation */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPhase('welcome')}
          className="flex items-center gap-2.5 text-left group transition-all"
          title="Return to Mission Briefing"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400/60 transition-colors shadow-inner">
            <Rocket size={17} className="transform -rotate-45" />
          </div>
          <div>
            <div className="font-heading font-bold text-slate-100 tracking-wider text-xs flex items-center gap-2 leading-none">
              <span>MISSION FORGE</span>
              <span className="text-[9px] font-mono font-medium text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                PHASE 1
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5 tracking-tight">
              NASA SPACE APPS • CREWED LUNAR LAUNCH
            </div>
          </div>
        </button>
      </div>

      {/* Aerospace Mission Pipeline Sequence */}
      <nav aria-label="Mission Pipeline" className="hidden lg:flex items-center gap-1 p-1 rounded-lg bg-black/30 border border-white/5">
        {STEPS.map((step, idx) => {
          const isActive = step.phase === currentPhase;
          const isPassed = idx < currentIdx;
          const isNavigable = canNavigateTo(step.phase, idx);
          const Icon = step.icon;

          return (
            <button
              key={step.phase}
              type="button"
              disabled={!isNavigable}
              onClick={() => isNavigable && setPhase(step.phase)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20 font-semibold'
                  : isPassed
                  ? 'text-slate-300 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title={`Step ${step.code}: ${step.label}`}
            >
              <Icon size={12} className={isActive ? 'text-cyan-400' : isPassed ? 'text-emerald-400' : 'text-slate-600'} />
              <span>{step.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Flight Control Accessories */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => toggleSourcesDrawer()}
          className="btn-aerospace-dark px-2.5 py-1.5 text-xs flex items-center gap-1.5"
          title="Flight Manual & Scientific Heritage"
        >
          <BookOpen size={13} className="text-cyan-400" />
          <span className="hidden sm:inline font-mono text-[11px]">Flight Manual</span>
        </button>

        <button
          type="button"
          onClick={toggleMute}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            audioSettings.isMuted
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30'
          }`}
          title={audioSettings.isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {audioSettings.isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        <button
          type="button"
          onClick={toggleCaptions}
          className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-semibold transition-colors flex items-center gap-1 ${
            audioSettings.captionsEnabled
              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
              : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
          }`}
          title="Toggle CapCom Radio Subtitles"
        >
          <MessageSquare size={11} />
          <span>CC</span>
        </button>
      </div>
    </header>
  );
};
