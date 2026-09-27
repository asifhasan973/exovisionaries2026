// Mission Forge - Scientific Documentation & Sources Drawer
import React from 'react';
import { BookOpen, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { SOURCES_DATA } from '../../data/sources';
import { useMissionStore } from '../../state/missionStore';

export const SourcesDrawer: React.FC = () => {
  const { isSourcesDrawerOpen, toggleSourcesDrawer } = useMissionStore();

  if (!isSourcesDrawerOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Educational Space Guide"
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      onClick={() => toggleSourcesDrawer(false)}
    >
      <div
        className="w-full max-w-lg h-full glass-panel border-l border-white/10 p-6 overflow-y-auto shadow-2xl flex flex-col text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-base font-heading font-bold text-white">Flight Manual & Sources</h2>
              <p className="text-xs text-slate-400 font-mono">NASA references & engineering heritage</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => toggleSourcesDrawer(false)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center border border-white/10"
            aria-label="Close guide"
          >
            <X size={15} />
          </button>
        </div>

        <div className="mt-4 p-3.5 bg-slate-900/60 border border-cyan-500/30 rounded-xl text-xs text-slate-300 leading-relaxed font-mono">
          <strong className="text-cyan-400 block mb-1 text-[11px] uppercase">
            NASA Scientific Heritage:
          </strong>
          Mission Forge incorporates authentic Apollo 10 Saturn V flight ascent physics and current NASA VIPER/Artemis lunar volatile prospecting instruments (pulsed neutron spectroscopy, near-infrared volatile imaging, and subsurface rotary-percussive coring).
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {SOURCES_DATA.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-900/40 border border-white/10 rounded-xl text-xs text-slate-300 space-y-1.5 font-mono"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase text-cyan-400 px-2 py-0.5 bg-cyan-500/15 rounded border border-cyan-500/30">
                  {item.category}
                </span>
                <span className="text-[10px] text-slate-500">{item.publisher}</span>
              </div>

              <h3 className="font-semibold text-xs text-white pt-0.5">{item.title}</h3>

              <div className="text-[11px] text-slate-400">
                <span className="text-slate-300">Scope: </span>
                <span>{item.scope}</span>
              </div>

              <div className="text-[10px] text-slate-400 bg-black/30 p-2 rounded border border-white/5">
                <span className="text-cyan-400 font-medium">Design Note: </span>
                {item.caveat}
              </div>

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline pt-1"
                >
                  <span>Open NASA Reference</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="mt-auto pt-6 text-[10px] font-mono text-slate-600 text-center">
          Exovisionaries • NASA Space Apps Challenge 2026
        </div>
      </div>
    </div>
  );
};
