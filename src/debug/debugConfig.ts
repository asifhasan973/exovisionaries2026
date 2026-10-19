import { STORY_FLOW, getStoryStep } from '../game/story/flow.ts';
import type { StoryStepId } from '../game/story/types.ts';
import { createStoryProgress, reduceStoryProgress } from '../game/story/progress.ts';
import { quickPreparation } from '../game/story/preparation.ts';
import { createWorkshopSession } from '../game/story/workshopSession.ts';
import type { WorkshopSession } from '../game/story/workshopSession.ts';
import { createJudgeMission } from '../game/story/demo.ts';
import {
  createJourneyDemo,
  createLandingDemo,
  createSurfaceDemo,
  createScienceDemo,
  createIncidentDemo,
  createReturnDemo
} from '../game/story/moon/journeyDemo.ts';
import { DEMO_CHAPTERS } from '../game/story/demoChapters.ts';

/**
 * Environment resolution:
 * Debug navigation is available only in the Vite development server.
 * VITE_APP_ENV=production can also disable it locally.
 */
export const isDevelopment: boolean =
  import.meta.env.DEV && import.meta.env.VITE_APP_ENV !== 'production';

export type DebugTargetType = 'page' | 'step' | 'demo';

export interface DebugRoute {
  type: DebugTargetType;
  id: string;
}

export interface DebugItem {
  id: string;
  label: string;
  description?: string;
  badge?: string;
  type: DebugTargetType;
  hash: string;
}

export interface DebugCategory {
  title: string;
  description: string;
  items: DebugItem[];
}

/**
 * Pages catalogue outside of standard linear mission steps
 */
export const DEBUG_PAGES: readonly DebugItem[] = [
  {
    id: 'home',
    label: 'Mission Home',
    description: 'Landing deck with Start New Mission, Continue, and Chapter replay',
    badge: 'Hub',
    type: 'page',
    hash: '#/debug/page/home'
  },
  {
    id: 'legacy',
    label: 'Legacy Experience',
    description: 'Preserved 3-person Apollo-style Moon explorer with 2D/3D workshop',
    badge: 'Experience',
    type: 'page',
    hash: '#/debug/page/legacy'
  },
  {
    id: 'preview',
    label: 'Conversation Preview',
    description: 'Standalone dialogue renderer & character art inspection',
    badge: 'Review',
    type: 'page',
    hash: '#/debug/page/preview'
  },
  {
    id: 'archive',
    label: 'NASA Mission Archive',
    description: 'Interactive historical missions modal, timeline audio, and flight manifests',
    badge: 'Archive',
    type: 'page',
    hash: '#/debug/page/archive'
  }
];

/**
 * Categorized listing of all available endpoints for development navigation
 */
export function getDebugCategories(): DebugCategory[] {
  const categories: DebugCategory[] = [];

  // Standalone Pages
  categories.push({
    title: '🌐 Standalone App Pages',
    description: 'Main game entry points and standalone previews',
    items: [...DEBUG_PAGES]
  });

  // Story Steps grouped by Module
  const moduleGroups: Record<number, { title: string; description: string; steps: typeof STORY_FLOW[number][] }> = {
    4: { title: '🎙️ Module 4 · Briefings & Mission Choices', description: 'Name entry, commander dialogue, destination & site choices', steps: [] },
    5: { title: '🛠️ Module 5 · Spacecraft & Rover Workshop', description: 'Lander assembly, rover chassis, science package, power & survival', steps: [] },
    8: { title: '👨‍🚀 Module 8 · Astronaut Crew Selection', description: 'Dossier reviews and astronaut crew assignments', steps: [] },
    6: { title: '📋 Module 6 · Flight Readiness & Rocket Packing', description: 'Crew supplies, mass/power/budget telemetry checks, rocket packing', steps: [] },
    7: { title: '🚀 Module 7 · Interactive Liftoff & Flight', description: 'Countdown, engine burn, staging, and Earth orbit insertion', steps: [] },
    9: { title: '🌍 Module 9 · Orbit & Trans-Lunar Injection', description: 'Route selection, translunar coast, and lunar orbital entry', steps: [] },
    10: { title: '🌕 Module 10 · Lunar Descent & Landing', description: 'Braking maneuvers, descent steering, and touchdown', steps: [] },
    11: { title: '🚜 Module 11 · Lunar Surface Exploration', description: 'Lander ramp deployment, rover driving, and navigation', steps: [] },
    12: { title: '🔬 Module 12 · Ice Science & Subsurface Drill', description: 'Core sampling, thermal profiling, and spectrometry', steps: [] },
    13: { title: '⚠️ Module 13 · Hazard Recovery & Safety', description: 'Dust mitigation, sensor recalibration, and site securing', steps: [] },
    14: { title: '🏆 Module 14 · Crew Return & Mission Debrief', description: 'Ascent staging, Earth re-entry, recovery, and final mission debrief', steps: [] }
  };

  for (const step of STORY_FLOW) {
    const mod = step.module;
    if (moduleGroups[mod]) {
      moduleGroups[mod].steps.push(step);
    }
  }

  for (const mod of [4, 5, 8, 6, 7, 9, 10, 11, 12, 13, 14]) {
    const group = moduleGroups[mod];
    if (group && group.steps.length > 0) {
      categories.push({
        title: group.title,
        description: group.description,
        items: group.steps.map(step => ({
          id: step.id,
          label: step.title,
          description: `Kind: ${step.kind}${step.kind === 'activity' ? ` · Activity: ${step.activity}` : ''}`,
          badge: `Mod ${step.module}`,
          type: 'step',
          hash: `#/debug/step/${step.id}`
        }))
      });
    }
  }

  // Demo Chapters
  categories.push({
    title: '🎮 Demo Replay Chapters',
    description: 'Pre-configured test chapters with tailored hardware & conditions',
    items: DEMO_CHAPTERS.map(ch => ({
      id: ch.id,
      label: ch.label,
      description: `Objective: ${ch.objective} · Group: ${ch.group}`,
      badge: ch.group,
      type: 'demo',
      hash: `#/debug/demo/${ch.id}`
    }))
  });

  return categories;
}

/**
 * Parses hash routes matching:
 * - #/debug/page/:id (e.g. #/debug/page/legacy)
 * - #/debug/step/:id (e.g. #/debug/step/lander-build)
 * - #/debug/demo/:id (e.g. #/debug/demo/ice-return)
 * - #/debug/:id (shorthand fallback)
 */
export function parseDebugHash(hash: string): DebugRoute | null {
  if (!isDevelopment) return null;
  const clean = hash.replace(/^#\/?/, '').trim();
  if (!clean.startsWith('debug')) return null;

  const parts = clean.split('/').filter(Boolean);
  // parts[0] is 'debug'
  if (parts.length < 2) return null;

  if (parts.length >= 3) {
    const type = parts[1];
    const id = parts[2];
    if (type === 'page' || type === 'step' || type === 'demo') {
      return { type, id };
    }
  }

  // Shorthand #/debug/<id>
  const shorthand = parts[1];
  if (DEBUG_PAGES.some(p => p.id === shorthand)) {
    return { type: 'page', id: shorthand };
  }
  if (DEMO_CHAPTERS.some(d => d.id === shorthand)) {
    return { type: 'demo', id: shorthand };
  }
  return { type: 'step', id: shorthand };
}

/**
 * Smart Auto-Seeded Ephemeral Session:
 * Seeds fully valid, realistic upstream game states (hardware, crew assignments, checks, physics checkpoints)
 * so that any mid/late-mission stage opens completely populated and interactive without crashes.
 */
export function createDebugSession(stepId: StoryStepId): WorkshopSession {
  // 1. Validate if step exists
  let targetStep;
  try {
    targetStep = getStoryStep(stepId, 'lunar-ice');
  } catch {
    targetStep = STORY_FLOW[0];
    stepId = 'player-name';
  }

  const moduleNum = targetStep.module;

  // Module 4: Initial Briefings & Mission Choices
  if (moduleNum === 4) {
    let progress = createStoryProgress();
    progress = reduceStoryProgress(progress, { type: 'set-name', name: 'Charlie', gender: 'female' });
    if (['destination', 'objective-briefing', 'objective', 'site-briefing', 'site', 'resource-briefing'].includes(stepId)) {
      progress = reduceStoryProgress(progress, { type: 'select', choiceId: 'moon' });
    }
    if (['site-briefing', 'site', 'resource-briefing'].includes(stepId)) {
      progress = reduceStoryProgress(progress, { type: 'select', choiceId: 'lunar-ice' });
      progress = reduceStoryProgress(progress, { type: 'select', choiceId: 'crater-rim' });
    }
    progress = { ...progress, stepId, lineIndex: 0 };
    return createWorkshopSession(progress);
  }

  // Module 5: Workshop Lander & Rover Assembly
  if (moduleNum === 5) {
    const preparation = quickPreparation('lunar-ice');
    let progress = createStoryProgress();
    progress = reduceStoryProgress(progress, { type: 'set-name', name: 'Charlie', gender: 'female' });
    progress = reduceStoryProgress(progress, { type: 'select', choiceId: 'moon' });
    progress = reduceStoryProgress(progress, { type: 'select', choiceId: 'lunar-ice' });
    progress = reduceStoryProgress(progress, { type: 'select', choiceId: 'crater-rim' });
    progress = { ...progress, stepId, lineIndex: 0 };
    return createWorkshopSession(progress, preparation);
  }

  // Module 8: Crew Briefing & Selection
  if (moduleNum === 8) {
    const base = createJudgeMission('female', 'lunar-ice');
    return {
      ...base,
      progress: {
        ...base.progress,
        stepId,
        lineIndex: 0
      }
    };
  }

  // Module 6: Telemetry Checks, Human Readiness & Packing
  if (moduleNum === 6) {
    const base = createJudgeMission('female', 'lunar-ice');
    return {
      ...base,
      progress: {
        ...base.progress,
        stepId,
        lineIndex: 0
      }
    };
  }

  // Module 7: Interactive Liftoff
  if (moduleNum === 7) {
    const base = createJourneyDemo('female', 'lunar-ice');
    return {
      ...base,
      progress: {
        ...base.progress,
        stepId: 'liftoff',
        lineIndex: 0
      }
    };
  }

  // Module 9: Earth Orbit & Trans-Lunar Journey
  if (moduleNum === 9) {
    const base = createJourneyDemo('female', 'lunar-ice');
    return {
      ...base,
      progress: {
        ...base.progress,
        stepId,
        lineIndex: 0
      }
    };
  }

  // Module 10: Lunar Descent & Touchdown
  if (moduleNum === 10) {
    const base = createLandingDemo('female', 'lunar-ice');
    return {
      ...base,
      progress: {
        ...base.progress,
        stepId: 'lunar-descent',
        lineIndex: 0
      }
    };
  }

  // Module 11: Lunar Surface Deployment & Route Exploration
  if (moduleNum === 11) {
    const base = createSurfaceDemo('female', 'lunar-ice');
    return {
      ...base,
      progress: {
        ...base.progress,
        stepId,
        lineIndex: 0
      }
    };
  }

  // Module 12: Subsurface Ice Science
  if (moduleNum === 12) {
    const base = createScienceDemo('female');
    return {
      ...base,
      progress: {
        ...base.progress,
        stepId,
        lineIndex: 0
      }
    };
  }

  // Module 13: Surface Hazard Recovery
  if (moduleNum === 13) {
    const base = createIncidentDemo('female');
    return {
      ...base,
      progress: {
        ...base.progress,
        stepId,
        lineIndex: 0
      }
    };
  }

  // Module 14: Crew Return Flight & Mission Debrief
  const base = createReturnDemo('female');
  return {
    ...base,
    progress: {
      ...base.progress,
      stepId,
      lineIndex: 0
    }
  };
}
