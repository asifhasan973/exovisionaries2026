// Mission Forge - Classified & Future Chapter Modal
import React, { useEffect, useRef } from 'react';
import { Lock, X, Info } from 'lucide-react';
import { useMissionStore } from '../../state/missionStore';

export const ComingSoonModal: React.FC = () => {
  const { comingSoon, closeComingSoon } = useMissionStore();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (comingSoon.isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      setTimeout(() => closeButtonRef.current?.focus(), 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeComingSoon();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        previouslyFocusedRef.current?.focus();
      };
    }
  }, [comingSoon.isOpen, closeComingSoon]);

  if (!comingSoon.isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="coming-soon-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none"
    >
      <div
        className="relative w-full max-w-md glass-panel p-6 sm:p-7 text-left rounded-2xl border border-amber-500/40 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-[10px] uppercase font-semibold tracking-wider">
            <Lock size={12} />
            <span>FUTURE CHAPTER OPERATIONAL ROADMAP</span>
          </div>

          <button
            type="button"
            onClick={closeComingSoon}
            className="text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <h2 id="coming-soon-title" className="text-xl font-heading font-bold text-white mb-2">
          {comingSoon.title}
        </h2>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {comingSoon.description}
        </p>

        <div className="p-3 bg-slate-900/60 border border-white/10 rounded-xl text-xs text-slate-400 font-mono">
          <span className="text-cyan-400 font-semibold block mb-0.5 text-[10px] uppercase">
            Phase 1 Operational Scope:
          </span>
          Current flight certification covers Saturn V launch through 185-km circular Earth parking orbit with volatile prospecting instrument integration.
        </div>

        <div className="mt-5 flex justify-end font-mono">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeComingSoon}
            className="btn-aerospace-primary px-5 py-2 text-xs font-semibold"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
