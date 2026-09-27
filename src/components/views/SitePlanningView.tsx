// Mission Forge - Lunar Landing Site Reconnaissance Console
import React from 'react';
import {
  MapPin,
  Sun,
  ThermometerSnowflake,
  Radio,
  Lock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { SITE_CONCEPTS } from '../../data/sites';
import { useMissionStore } from '../../state/missionStore';
import { SiteId } from '../../types/mission';

export const SitePlanningView: React.FC = () => {
  const {
    selectedSite,
    selectSite,
    setPhase,
    openComingSoon
  } = useMissionStore();

  const handleSelectSite = (siteId: SiteId) => {
    const site = SITE_CONCEPTS[siteId];
    if (!site.isPlayable) {
      sound.playBoing();
      openComingSoon(
        site.name,
        site.comingSoonReason || 'This deep interior crater site requires nuclear surface power systems planned for Chapter 2.'
      );
      return;
    }
    sound.playClick(800);
    selectSite(siteId);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-8 bg-[#030712] overflow-y-auto select-none">
      {/* Header */}
      <div className="max-w-5xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3.5 py-1 text-cyan-300 font-mono text-[11px] font-semibold tracking-wider mb-2">
          <span>03 SITE RECONNAISSANCE</span>
          <span>•</span>
          <span>LUNAR SOUTH POLE COORDINATES</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
          Select Lunar Landing Site
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-1 font-normal">
          Evaluate solar illumination availability, thermal extremes, and transit proximity to permanently shadowed water-ice craters.
        </p>
      </div>

      {/* Engineering Guidance Panel */}
      <div className="max-w-5xl mx-auto w-full my-3 p-3.5 rounded-xl glass-panel border border-cyan-500/30 shadow-md flex items-center gap-3 text-left">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
          <Radio size={16} />
        </div>
        <div className="text-xs text-slate-300 font-normal">
          <strong className="text-cyan-400 font-mono font-semibold block uppercase text-[10px]">
            LUNAR TOPOGRAPHIC DIRECTIVE:
          </strong>
          The <strong>Connecting Ridge</strong> provides up to 86% peak solar illumination for lunar surface solar arrays while situated within 5 km of prime cold-trap sampling deposits.
        </div>
      </div>

      {/* Sites Grid */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-4 my-3">
        {(Object.keys(SITE_CONCEPTS) as SiteId[]).map((siteId) => {
          const site = SITE_CONCEPTS[siteId];
          const isSelected = selectedSite === siteId;

          return (
            <div
              key={site.id}
              onClick={() => handleSelectSite(site.id)}
              className={`p-5 rounded-2xl cursor-pointer flex flex-col justify-between text-left transition-all ${
                isSelected && site.isPlayable
                  ? 'glass-panel border-cyan-500/60 shadow-xl shadow-cyan-500/10'
                  : site.isPlayable
                  ? 'glass-panel border-white/10 hover:border-cyan-500/40'
                  : 'glass-panel border-white/5 opacity-65 hover:opacity-85'
              }`}
            >
              <div>
                {/* Header & Badges */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-mono font-semibold uppercase px-2.5 py-0.5 rounded ${
                    site.isRecommended
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : site.isPlayable
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}>
                    {site.isRecommended ? 'Baseline Recommended' : site.badge}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      <span>SELECTED</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                    <MapPin size={14} className="text-cyan-400" />
                  </div>
                  <h3 className="text-base font-heading font-bold text-white leading-tight">
                    {site.name}
                  </h3>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {site.tagline}
                </p>

                {/* Telemetry Metrics Grid */}
                <div className="space-y-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5 text-[11px] font-mono mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Sun size={11} className="text-amber-400" />
                      <span>Solar Power:</span>
                    </span>
                    <strong className="text-slate-200">
                      {site.id === 'ridge' ? '86% High' : site.id === 'crater-rim' ? '55% Moderate' : '0% (Shadowed)'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1">
                      <ThermometerSnowflake size={11} className="text-cyan-400" />
                      <span>Thermal Floor:</span>
                    </span>
                    <strong className="text-cyan-300">
                      {site.id === 'ridge' ? '-130°C' : site.id === 'crater-rim' ? '-180°C' : '-233°C (Cryo)'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Volatile Proximity:</span>
                    <strong className="text-amber-300">
                      {site.id === 'ridge' ? '5 km' : site.id === 'crater-rim' ? '1 km' : '0 km'}
                    </strong>
                  </div>
                </div>

                {/* Technical Tradeoff Note */}
                <div className="text-[11px] text-slate-300 bg-slate-900/40 p-2 rounded-lg border border-white/5 font-mono">
                  <span className="text-cyan-400 font-semibold block mb-0.5">
                    Engineering Note:
                  </span>
                  {site.engineeringTradeoffs.readinessRecommendation}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10">
                {site.isPlayable ? (
                  <button
                    type="button"
                    className={`w-full py-2 text-xs font-mono font-semibold transition-all ${
                      isSelected ? 'btn-aerospace-green' : 'btn-aerospace-dark'
                    }`}
                  >
                    {isSelected ? 'Confirmed Landing Site' : 'Select Site'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-aerospace-dark w-full py-2 text-xs font-mono text-amber-400 flex items-center justify-center gap-1"
                  >
                    <Lock size={11} />
                    <span>Future Mission Site</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => setPhase('mission')}
          className="btn-aerospace-dark px-3 py-1.5 text-xs font-mono flex items-center gap-1.5"
        >
          <ChevronLeft size={13} />
          <span>Science Goals</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playFanfare();
            setPhase('assembly');
          }}
          className="btn-aerospace-primary px-4 py-1.5 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-lg"
        >
          <span>Proceed to Vehicle Assembly</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
