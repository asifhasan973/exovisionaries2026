// Mission Forge - Professional Aerospace Assembly Bay & Engineering Studio
import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  ShieldCheck,
  Flame,
  Cpu,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  X,
  Play,
  Wrench,
  Radio,
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { PARTS, SLOTS } from '../../data/parts';
import { computeBudgetAccounting, computeMassAccounting, computePowerAccounting } from '../../engine/accounting';
import { HangarViewport } from '../../scene/HangarViewport';
import { useMissionStore } from '../../state/missionStore';
import { AssemblyViewMode, PartCategory, SlotInterface } from '../../types/mission';
import { RealisticPartIcon } from '../common/RealisticPartIcons';

// Grouping slots by aerospace engineering section
const LAUNCH_VEHICLE_SECTIONS = [
  {
    title: 'Crew & Escape Module',
    slots: [
      { id: 'launch-escape-system', label: 'Launch Escape System (LES)', subtitle: 'Solid Rocket Abort Tower' },
      { id: 'crew-capsule', label: 'Command Module (CM)', subtitle: '3-Astronaut Pressurized Cabin' },
      { id: 'service-module', label: 'Service Module (SM)', subtitle: 'SPS Engine, Fuel Cells & Life O2' }
    ]
  },
  {
    title: 'Upper Stage & Guidance',
    slots: [
      { id: 'lunar-payload-bay', label: 'Lunar Lander Fairing', subtitle: 'Trans-Lunar Extraction Bay' },
      { id: 'instrument-unit', label: 'Guidance Ring (IU)', subtitle: 'Digital Flight Computer & Gyros' },
      { id: 'booster-stage-3', label: 'Stage 3 (S-IVB)', subtitle: 'J-2 Restartable Cryogenic Engine' }
    ]
  },
  {
    title: 'Heavy Booster Stages',
    slots: [
      { id: 'interstage-2', label: 'Interstage 2-3 Adapter', subtitle: 'Dual-Plane Separation Ring' },
      { id: 'booster-stage-2', label: 'Stage 2 (S-II)', subtitle: '5x J-2 Liquid Hydrogen Engines' },
      { id: 'interstage-1', label: 'Interstage 1-2 Structure', subtitle: 'Corrugated Separation Ring' },
      { id: 'booster-stage-1', label: 'Stage 1 Booster (S-IC)', subtitle: '5x Giant F-1 Kerosene Engines' }
    ]
  }
];

const SCIENCE_PAYLOAD_SECTIONS = [
  {
    title: 'Volatile Water-Ice Instruments',
    slots: [
      { id: 'science-slot-1', label: 'Science Bay Alpha', subtitle: 'PNS Hydrogen Detector' },
      { id: 'science-slot-2', label: 'Science Bay Beta', subtitle: 'NIR Volatiles Spectrometer' },
      { id: 'science-slot-3', label: 'Science Bay Gamma', subtitle: 'Subsurface Core Regolith Drill' },
      { id: 'science-slot-4', label: 'Science Bay Delta', subtitle: 'Nav Context Stereo Cameras' },
      { id: 'upgrade-slot-1', label: 'Avionics Expansion 1', subtitle: 'Solid-State Battery Auxiliary' },
      { id: 'upgrade-slot-2', label: 'Avionics Expansion 2', subtitle: 'Deep Space Star Tracker' }
    ]
  }
];

export const AssemblyView: React.FC = () => {
  const {
    installedParts,
    assemblyViewMode,
    isExplodedView,
    selectedSlotId,
    selectedPartId,
    setAssemblyViewMode,
    toggleExplodedView,
    selectSlot,
    selectPart,
    installPart,
    uninstallPart,
    applyQuickLaunchManifest,
    setPhase
  } = useMissionStore();

  const [activeCategory, setActiveCategory] = useState<PartCategory>('science');
  const [slotViewTab, setSlotViewTab] = useState<'stack' | 'science'>('stack');
  const [isTestFiring, setIsTestFiring] = useState(false);
  const [isSlotTrayOpen, setIsSlotTrayOpen] = useState(true);

  // Global Drag-and-Drop Tracking
  const [draggedPartId, setDraggedPartId] = useState<string | null>(null);
  const [dragPointerPos, setDragPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredDropSlot, setHoveredDropSlot] = useState<SlotInterface | null>(null);

  // Accounting calculations
  const budget = computeBudgetAccounting(installedParts);
  const mass = computeMassAccounting(installedParts, {});
  const power = computePowerAccounting(installedParts);

  // Water-Ice Prospecting Suite Score (0 - 100%)
  const hasNeutron = Object.values(installedParts).includes('neutron-spectrometer');
  const hasNIR = Object.values(installedParts).includes('nir-spectrometer');
  const hasDrill = Object.values(installedParts).includes('subsurface-drill');
  const hasCam = Object.values(installedParts).includes('nav-context-camera');

  let iceScore = 0;
  if (hasNeutron) iceScore += 35;
  if (hasCam) iceScore += 20;
  if (hasDrill) iceScore += 25;
  if (hasNIR) iceScore += 20;

  const inspectedPart = selectedPartId ? PARTS[selectedPartId] : null;
  const categoryParts = Object.values(PARTS).filter((p) => p.category === activeCategory);

  // Drag-and-Drop Global Pointer Listener
  useEffect(() => {
    if (!draggedPartId) return;

    const handlePointerMove = (e: PointerEvent) => {
      setDragPointerPos({ x: e.clientX, y: e.clientY });

      const elementsUnder = document.elementsFromPoint(e.clientX, e.clientY);
      const slotElement = elementsUnder.find((el) => el.getAttribute('data-slot-id'));

      if (slotElement) {
        const targetSlot = slotElement.getAttribute('data-slot-id') as SlotInterface;
        const part = PARTS[draggedPartId];
        if (part && part.compatibleSlots.includes(targetSlot)) {
          setHoveredDropSlot(targetSlot);
          return;
        }
      }
      setHoveredDropSlot(null);
    };

    const handlePointerUp = () => {
      if (draggedPartId && hoveredDropSlot) {
        sound.playSnap();
        installPart(hoveredDropSlot, draggedPartId);
      }
      setDraggedPartId(null);
      setDragPointerPos(null);
      setHoveredDropSlot(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggedPartId, hoveredDropSlot, installPart]);

  const handleTestFire = () => {
    if (isTestFiring) return;
    setIsTestFiring(true);
    sound.startRocketRoar();
    setTimeout(() => {
      sound.stopRocketRoar();
      setIsTestFiring(false);
    }, 3200);
  };

  const categories: { key: PartCategory; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { key: 'science', label: 'Science', icon: FlaskConical },
    { key: 'crewSpacecraft', label: 'Crew & Pod', icon: ShieldCheck },
    { key: 'launchVehicle', label: 'Propulsion', icon: Flame },
    { key: 'avionics', label: 'Avionics', icon: Cpu }
  ];

  return (
    <div className="relative w-full h-full flex flex-col bg-[#030712] overflow-hidden select-none text-slate-100">
      {/* Ghost Preview during True Drag & Drop */}
      {draggedPartId && dragPointerPos && (
        <div
          style={{
            left: `${dragPointerPos.x}px`,
            top: `${dragPointerPos.y}px`
          }}
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 glass-panel p-2.5 flex items-center gap-3 border border-cyan-400 shadow-2xl shadow-cyan-500/30 scale-105 rounded-xl bg-slate-900/95"
        >
          <RealisticPartIcon partId={draggedPartId} size={42} />
          <div>
            <div className="font-semibold text-xs text-white">{PARTS[draggedPartId].name}</div>
            <div className="text-[10px] text-cyan-400 font-mono">
              {hoveredDropSlot ? `Target: ${hoveredDropSlot}` : 'Drag over rocket slot...'}
            </div>
          </div>
        </div>
      )}

      {/* Main Assembly Workspace: 3-column Layout */}
      <div className="flex-1 relative flex flex-row h-full overflow-hidden">
        {/* Left Drawer: Hardware Catalog (300px) */}
        <aside className="w-72 lg:w-80 glass-panel border-r border-white/10 flex flex-col z-20 flex-shrink-0 text-left">
          {/* Header & Quick Manifest */}
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                <Wrench size={12} />
                <span>HARDWARE CATALOG</span>
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-0.5">
                Certified Flight Hardware
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playFanfare();
                applyQuickLaunchManifest();
              }}
              className="btn-aerospace-dark px-2 py-1 text-[10px] font-mono flex items-center gap-1 text-amber-400 border-amber-500/30 hover:border-amber-400"
              title="Auto-seat standard baseline components"
            >
              <Sparkles size={11} />
              <span>Auto-Fit</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="grid grid-cols-4 p-1.5 gap-1 bg-black/40 border-b border-white/5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    sound.playClick(500);
                    setActiveCategory(cat.key);
                  }}
                  className={`py-1.5 px-1 rounded-md text-[10px] font-mono flex flex-col items-center gap-1 transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Parts List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {categoryParts.map((part) => {
              const isMountedSomewhere = Object.values(installedParts).includes(part.id);
              const isSelected = selectedPartId === part.id;

              return (
                <div
                  key={part.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', part.id);
                    setDraggedPartId(part.id);
                  }}
                  onClick={() => {
                    sound.playClick(650);
                    selectPart(part.id);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-800/50'
                  }`}
                >
                  {/* Hardware Icon Render */}
                  <div className="flex-shrink-0 bg-slate-950 p-1.5 rounded-lg border border-white/10 shadow-inner">
                    <RealisticPartIcon partId={part.id} size={44} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-semibold text-xs text-slate-100 truncate">
                        {part.name}
                      </span>
                      {isMountedSomewhere && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Mounted
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-cyan-400 font-mono truncate mb-1">
                      {part.subtitle}
                    </div>

                    {/* Hardware Metrics & Snap Action */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono">
                      <span className="text-slate-400">
                        {part.massKg >= 1000 ? `${(part.massKg / 1000).toFixed(1)}t` : `${part.massKg}kg`} •{' '}
                        {part.includedInParentPackage ? 'Standard' : `$${(part.costDollars / 1000000).toFixed(1)}M`}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const emptySlot = part.compatibleSlots.find((s) => !installedParts[s]);
                          if (emptySlot) {
                            sound.playSnap();
                            installPart(emptySlot, part.id);
                          } else if (part.compatibleSlots.length > 0) {
                            sound.playSnap();
                            installPart(part.compatibleSlots[0], part.id);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all ${
                          isMountedSomewhere
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                        }`}
                      >
                        {isMountedSomewhere ? 'Re-Seat' : '+ Mount'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center: Unobstructed 3D Rocket Viewport & Floating HUDs */}
        <main className="flex-1 relative h-full flex flex-col overflow-hidden">
          {/* 3D Hangar Canvas - Full Size */}
          <div className="absolute inset-0">
            <HangarViewport />
          </div>

          {/* Test Fire Exhaust Particle Glow */}
          {isTestFiring && (
            <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-end pb-24 animate-pulse">
              <div className="w-96 h-48 rounded-full bg-gradient-to-t from-amber-500 via-orange-600 to-transparent opacity-70 filter blur-2xl" />
              <div className="glass-panel px-4 py-1.5 rounded-full border border-amber-400 text-amber-300 font-mono text-xs font-semibold tracking-wider uppercase shadow-2xl flex items-center gap-2">
                <Flame size={14} className="text-amber-400 animate-bounce-sm" />
                <span>F-1 ENGINES AT FULL POWER • 34.5 MN THRUST</span>
              </div>
            </div>
          )}

          {/* Top Floating Viewport Control HUD */}
          <div className="relative z-10 m-3 flex items-center justify-between pointer-events-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 glass-panel p-1 rounded-lg border border-white/10 shadow-lg">
              {(['fullStack', 'crewSpacecraft', 'sciencePayload'] as AssemblyViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setAssemblyViewMode(mode);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                    assemblyViewMode === mode
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {mode === 'fullStack' ? 'Whole Rocket' : mode === 'crewSpacecraft' ? 'Command Pod' : 'Science Bay'}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  toggleExplodedView();
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                  isExplodedView
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {isExplodedView ? 'Exploded: ON' : 'Exploded: OFF'}
              </button>
            </div>

            {/* Test Fire Button */}
            <button
              type="button"
              onClick={handleTestFire}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 shadow-lg transition-all ${
                isTestFiring
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400 shadow-amber-500/30'
                  : 'btn-aerospace-dark border-emerald-500/30 text-emerald-400 hover:border-emerald-400 hover:text-emerald-300'
              }`}
            >
              <Flame size={13} className={isTestFiring ? 'text-amber-400' : 'text-emerald-400'} />
              <span>{isTestFiring ? 'Ignition Active' : 'Static Test Fire'}</span>
            </button>
          </div>

          {/* Bottom Floating Staging Dock (Non-blocking, collapsible, elegant) */}
          <div className="relative z-10 mx-auto mb-3 mt-auto max-w-4xl w-[94%] pointer-events-auto">
            <div className="glass-panel p-2.5 rounded-xl border border-white/10 shadow-2xl">
              {/* Dock Tab Selector & Collapse */}
              <div className="flex items-center justify-between pb-1.5 border-b border-white/5 mb-2">
                <div className="flex items-center gap-2">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Layers size={11} />
                    <span>INTEGRATION BLUEPRINT</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSlotViewTab('stack')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        slotViewTab === 'stack'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Rocket Stages (10)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlotViewTab('science')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        slotViewTab === 'science'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Science & Avionics (6)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                    Drop items onto slots below
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSlotTrayOpen(!isSlotTrayOpen)}
                    className="text-[10px] font-mono text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded bg-white/5"
                  >
                    {isSlotTrayOpen ? 'Minimize Dock ▼' : 'Expand Dock ▲'}
                  </button>
                </div>
              </div>

              {/* Slot Cards Grid */}
              {isSlotTrayOpen && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 max-h-40 overflow-y-auto">
                  {(slotViewTab === 'stack'
                    ? LAUNCH_VEHICLE_SECTIONS.flatMap((s) => s.slots)
                    : SCIENCE_PAYLOAD_SECTIONS.flatMap((s) => s.slots)
                  ).map((slotDef) => {
                    const installedPartId = installedParts[slotDef.id as SlotInterface];
                    const installedPart = installedPartId ? PARTS[installedPartId] : null;
                    const isHoveredTarget = hoveredDropSlot === slotDef.id;

                    return (
                      <div
                        key={slotDef.id}
                        data-slot-id={slotDef.id}
                        onClick={() => {
                          selectSlot(slotDef.id as SlotInterface);
                          if (installedPartId) selectPart(installedPartId);
                        }}
                        className={`p-1.5 rounded-lg border transition-all flex items-center justify-between text-left cursor-pointer ${
                          isHoveredTarget
                            ? 'bg-cyan-500/30 border-cyan-400 scale-102 shadow-lg shadow-cyan-500/30 animate-pulse'
                            : installedPart
                            ? 'bg-slate-900/80 border-slate-700/60 hover:border-cyan-500/50'
                            : 'bg-black/30 border-dashed border-white/10 hover:border-cyan-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {installedPart ? (
                            <RealisticPartIcon partId={installedPart.id} size={24} />
                          ) : (
                            <div className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-slate-500">
                              +
                            </div>
                          )}
                          <div className="truncate">
                            <div className="font-semibold text-slate-100 text-[10px] truncate leading-tight">
                              {installedPart ? installedPart.name : slotDef.label}
                            </div>
                            <div className="text-[8px] font-mono text-cyan-400 truncate">
                              {installedPart ? `${installedPart.massKg} kg` : 'Empty Slot'}
                            </div>
                          </div>
                        </div>

                        {installedPart && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sound.playClick(500);
                              uninstallPart(slotDef.id as SlotInterface);
                            }}
                            className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/20 text-[10px]"
                            title="Unmount component"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Drawer: Hardware Telemetry & Inspector (300px) */}
        <aside className="w-72 lg:w-80 glass-panel border-l border-white/10 flex flex-col z-20 flex-shrink-0 text-left">
          {/* Header */}
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
              <Radio size={12} />
              <span>VEHICLE TELEMETRY</span>
            </div>

            {inspectedPart && (
              <button
                type="button"
                onClick={() => selectPart(null)}
                className="text-[10px] font-mono text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Telemetry Readouts */}
          <div className="p-3 border-b border-white/10 space-y-2 bg-black/30">
            {/* Water-Ice Detection Capability */}
            <div>
              <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                <span className="text-slate-400">Ice Hunter Score</span>
                <span className={`font-semibold ${iceScore >= 55 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {iceScore}% / 100%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    iceScore >= 55 ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                  style={{ width: `${iceScore}%` }}
                />
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
              <div className="p-1.5 rounded bg-slate-900/60 border border-white/5">
                <span className="text-slate-500 block">Payload Mass</span>
                <span className="text-slate-200 font-semibold">167 / 250 kg</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900/60 border border-white/5">
                <span className="text-slate-500 block">Stack Mass</span>
                <span className="text-slate-200 font-semibold">2,970 tons</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900/60 border border-white/5">
                <span className="text-slate-500 block">Project Cost</span>
                <span className="text-emerald-400 font-semibold">$17.3M</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900/60 border border-white/5">
                <span className="text-slate-500 block">Power Draw</span>
                <span className="text-cyan-400 font-semibold">{power.totalScienceDrawWatts + power.totalAvionicsDrawWatts + power.totalLifeSupportDrawWatts} W</span>
              </div>
            </div>
          </div>

          {/* Inspector Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {inspectedPart ? (
              <div className="space-y-3">
                {/* Part Card Header */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-white/10">
                  <RealisticPartIcon partId={inspectedPart.id} size={48} />
                  <div>
                    <h3 className="text-xs font-semibold text-white leading-tight">
                      {inspectedPart.name}
                    </h3>
                    <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                      {inspectedPart.subtitle}
                    </div>
                  </div>
                </div>

                {/* Specs Readout */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Flight Mass:</span>
                    <span className="text-slate-200 font-medium">
                      {inspectedPart.massKg >= 1000 ? `${(inspectedPart.massKg / 1000).toFixed(1)} tons` : `${inspectedPart.massKg} kg`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Power Draw:</span>
                    <span className="text-slate-200 font-medium">{inspectedPart.powerWatts} W</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contract Cost:</span>
                    <span className="text-emerald-400 font-medium">
                      {inspectedPart.includedInParentPackage
                        ? 'Standard Heritage'
                        : `$${(inspectedPart.costDollars / 1000000).toFixed(2)}M`}
                    </span>
                  </div>
                </div>

                {/* Engineering Overview */}
                <div>
                  <div className="text-[10px] font-mono uppercase text-cyan-400 font-semibold mb-1">
                    Function & Purpose
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {inspectedPart.description}
                  </p>
                </div>

                {/* Real NASA Tech Note */}
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold mb-1">
                    NASA Mission Heritage
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/40 p-2 rounded-lg border border-white/5 font-mono">
                    {inspectedPart.educationalNote}
                  </p>
                </div>

                {/* Unmount Action */}
                {selectedSlotId && installedParts[selectedSlotId] && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick(500);
                      uninstallPart(selectedSlotId);
                    }}
                    className="w-full py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-mono font-medium transition-all"
                  >
                    Unmount Component
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                <Wrench size={24} className="mx-auto text-slate-600 mb-1" />
                <div className="font-semibold text-slate-300 text-xs">
                  Component Inspector Ready
                </div>
                <div className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Select or drag any component to inspect its flight specifications, mass distribution, and NASA engineering heritage.
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom Mission Navigation Bar */}
      <footer className="w-full glass-panel border-t border-white/10 px-4 py-2.5 flex items-center justify-between z-10 text-xs">
        <button
          type="button"
          onClick={() => setPhase('site')}
          className="btn-aerospace-dark px-3 py-1.5 text-xs font-mono flex items-center gap-1.5"
        >
          <ChevronLeft size={13} />
          <span>Landing Site</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-1.5">
            {iceScore >= 55 ? (
              <>
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span className="text-emerald-300">Ice Prospecting Sensor Suite Ready</span>
              </>
            ) : (
              <>
                <AlertTriangle size={13} className="text-amber-400" />
                <span className="text-amber-300">Minimum 55% Ice Suite Required</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playFanfare();
              setPhase('crew');
            }}
            className="btn-aerospace-primary px-4 py-1.5 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-lg"
          >
            <span>Astronaut Flight Crew</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </footer>
    </div>
  );
};
