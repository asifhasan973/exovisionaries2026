import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { SceneBoundary, SceneFallback } from '@exo/ui';
import { EngineerCompanion } from '@/game/moon/narrative/components/EngineerCompanion';
import type { WorkshopSession } from '@/game/moon/workshop/lander/workshopSession';
import type { ScienceAnimation } from '@/game/moon/surface/SurfaceViewport';
import type { SurfaceNodeId } from '@/game/moon/surface/surface';
import { useGameSettings } from '@/shared/shell';
import '@/game/moon/surface/surface.css';
import './moonExpedition.css';

const SurfaceViewport = lazy(() => import('@/game/moon/surface/SurfaceViewport').then(module => ({ default: module.SurfaceViewport })));
const STEPS = ['Explore', 'Discover', 'Pack up', 'Go home'];

export function MoonStage({ session, title, objective, step, advice, voiceEnabled, onDetails, science, destination, children }: {
  session: WorkshopSession; title: string; objective: string; step: number; advice: string;
  voiceEnabled: boolean; onDetails(): void; science?: ScienceAnimation; destination?: SurfaceNodeId; children: ReactNode;
}) {
  const { gentle } = useGameSettings(), { moon, preparation } = session;
  const percent = Math.max(0, Math.min(100, moon.resources.capacityWh ? moon.surface.batteryWh / moon.resources.capacityWh * 100 : 0));
  return (
    <main className="workshop-main surface-main expedition-main moon-stage" id="story-content" tabIndex={-1} aria-labelledby="moon-stage-title">
      <div className="surface-heading"><h1 id="moon-stage-title">{title}</h1><button className="game-info-trigger" aria-label="Mission details" onClick={onDetails}><Info size={20} /></button></div>
      <section className="surface-scene expedition-world" aria-label="Moon mission world">
        <SceneBoundary fallback={<SceneFallback scene="surface" label="Moon mission" detail={objective} />}>
          <Suspense fallback={<div className="surface-fallback">Opening the lunar landscape…</div>}>
            <SurfaceViewport surface={moon.surface} preparation={preparation} moon={moon} gentle={gentle} science={science} destination={destination} />
          </Suspense>
        </SceneBoundary>
        <div className="expedition-objective"><span>ON THE MOON · {step + 1} / 4</span><h2>{objective}</h2><ol aria-label="Moon mission progress">{STEPS.map((label, index) => <li key={label} className={index < step ? 'is-done' : index === step ? 'is-current' : ''} aria-current={index === step ? 'step' : undefined}>{label}</li>)}</ol></div>
        <div className={`surface-battery expedition-battery ${percent < 25 ? 'is-low' : ''}`}><div><span>Rover battery</span><strong>{Math.round(percent)}%</strong></div><div className="surface-energy-track" role="meter" aria-label="Rover battery" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}><i style={{ width: `${percent}%` }} /><b /></div><small>Return energy checked before travel</small></div>
        <div className="moon-action">{children}</div>
        <div className="expedition-advice"><EngineerCompanion token={moon.science.expedition + moon.science.attempts} voiceEnabled={voiceEnabled} reaction={moon.science.hazards.pending ? 'warning' : 'intro'} scriptedReply={{ id: `moon-${step}-${moon.science.phase}-${moon.science.hazards.pending ?? 'clear'}-${advice}`, text: advice }} /></div>
      </section>
    </main>
  );
}
