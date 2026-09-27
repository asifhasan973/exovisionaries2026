// Mission Forge - Kennedy Space Center Pad 39A Launch Console
import React, { useEffect, useState } from 'react';
import {
  Clock,
  Flame,
  Radio,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { useMissionStore } from '../../state/missionStore';

export const LaunchPadView: React.FC = () => {
  const { setPhase, resetAscent } = useMissionStore();

  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [calloutIndex, setCalloutIndex] = useState(0);

  const groundCallouts = [
    '“CapCom: Launch pad safety perimeter verified secure. Terminal sequencer initialized.”',
    '“Launch Director: Range safety report confirms clear flight corridor down east coast.”',
    '“Commander: Flight crew ingress complete. Hatch sealed, cabin pressure nominal at 5.0 psi.”',
    '“Booster: Cryogenic chilldown complete on all five Stage 1 F-1 engine manifolds.”'
  ];

  useEffect(() => {
    if (countdownSeconds !== null) return;
    const interval = setInterval(() => {
      setCalloutIndex((prev) => (prev + 1) % groundCallouts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [countdownSeconds, groundCallouts.length]);

  useEffect(() => {
    if (countdownSeconds === null || isHolding) return;

    if (countdownSeconds === 0) {
      sound.playCountdownBeep(true);
      const timeout = setTimeout(() => {
        resetAscent();
        setPhase('ascent');
      }, 1000);
      return () => clearTimeout(timeout);
    }

    sound.playCountdownBeep(false);

    const timer = setTimeout(() => {
      setCountdownSeconds((sec) => (sec !== null ? sec - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdownSeconds, isHolding, resetAscent, setPhase]);

  const handleStartCountdown = () => {
    sound.playClick(800);
    setCountdownSeconds(10);
    setIsHolding(false);
  };

  const handleToggleHold = () => {
    sound.playClick(850);
    setIsHolding((prev) => !prev);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-8 bg-[#030712] overflow-hidden select-none">
      {/* Header */}
      <div className="relative z-10 max-w-4xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3.5 py-1 text-cyan-300 font-mono text-[11px] font-semibold tracking-wider mb-2">
          <span>07 COUNTDOWN SEQUENCE</span>
          <span>•</span>
          <span>LAUNCH COMPLEX 39A</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
          Kennedy Space Center Launch Pad
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-1 font-normal">
          Saturn V launch vehicle fueled with cryogenic liquid oxygen & RP-1. Terminal auto-sequencer standing by.
        </p>
      </div>

      {/* Main Countdown Terminal Card */}
      <div className="relative z-10 max-w-xl mx-auto w-full glass-panel p-6 sm:p-8 text-center rounded-2xl border border-white/10 shadow-2xl">
        {/* Terminal Digital Clock Display */}
        <div className="mb-6">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-400 mb-2 flex items-center justify-center gap-2">
            <Clock size={13} />
            <span>
              {countdownSeconds === null
                ? 'TERMINAL COUNTDOWN AUTO-SEQUENCER IDLE'
                : isHolding
                ? 'MANUAL COUNTDOWN HOLD ACTIVE'
                : 'TERMINAL COUNTDOWN SEQUENCE ACTIVE'}
            </span>
          </div>

          <div className="text-6xl sm:text-8xl font-black font-mono tracking-tight text-white py-3 flex items-center justify-center gap-2 bg-black/50 rounded-xl border border-white/10">
            <span className="text-cyan-400">T-</span>
            <span>
              {countdownSeconds === null ? '00:10' : `00:${String(countdownSeconds).padStart(2, '0')}`}
            </span>
          </div>

          {countdownSeconds !== null && (
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden p-0.5 border border-white/10 mt-3">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all duration-1000 ease-linear shadow-sm shadow-cyan-400/50"
                style={{ width: `${((10 - countdownSeconds) / 10) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* CapCom Audio Radio Telemetry */}
        <div className="p-3.5 bg-slate-900/60 border border-white/10 rounded-xl flex items-center gap-3 text-left mb-6 min-h-[64px]">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Radio size={16} />
          </div>
          <div className="text-xs text-slate-300 font-mono">
            {countdownSeconds === null ? (
              groundCallouts[calloutIndex]
            ) : countdownSeconds > 0 ? (
              isHolding ? (
                <span className="text-amber-400 font-semibold">
                  HOLD: Countdown held at T-{countdownSeconds}s. Pad systems safe. Resume when cleared.
                </span>
              ) : (
                <span className="text-cyan-300 font-semibold">
                  T-{countdownSeconds}s: Turbopumps spinning up. All vehicle systems report nominal.
                </span>
              )
            ) : (
              <span className="text-emerald-400 font-semibold animate-pulse">
                ALL ENGINES RUNNING: LIFTOFF OF APOLLO SATURN V!
              </span>
            )}
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {countdownSeconds === null ? (
            <button
              type="button"
              onClick={handleStartCountdown}
              className="btn-aerospace-primary w-full sm:w-auto px-8 py-3 text-xs font-mono font-semibold tracking-wider flex items-center justify-center gap-2 shadow-lg"
            >
              <Flame size={14} />
              <span>START TERMINAL COUNTDOWN (T-10s)</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleToggleHold}
                className={`w-full sm:w-auto px-6 py-2.5 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  isHolding ? 'btn-aerospace-green' : 'btn-aerospace-gold'
                }`}
              >
                {isHolding ? <Play size={13} /> : <Pause size={13} />}
                <span>{isHolding ? 'Resume Count' : 'Hold Count'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCountdownSeconds(null)}
                className="btn-aerospace-dark w-full sm:w-auto px-5 py-2.5 text-xs font-mono flex items-center justify-center gap-1.5 text-slate-400"
              >
                <RotateCcw size={12} />
                <span>Reset to T-10s</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => setPhase('readiness')}
          className="btn-aerospace-dark px-3 py-1.5 text-xs font-mono flex items-center gap-1.5"
        >
          <ChevronLeft size={13} />
          <span>Readiness Review</span>
        </button>

        <div className="text-[11px] font-mono text-slate-500">
          Range Status: GREEN • Flight Path Clear
        </div>
      </div>
    </div>
  );
};
