import { registerDebugCategories, type DebugCategory, type DebugItem } from '@exo/debug';
import { STORY_FLOW } from '../core/flow';
import { DEMO_CHAPTERS } from '../stages/demo/demoChapters';

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
    hash: '#/debug/page/home',
  },
  {
    id: 'preview',
    label: 'Conversation Preview',
    description: 'Standalone dialogue renderer & character art inspection',
    badge: 'Review',
    type: 'page',
    hash: '#/debug/page/preview',
  },
  {
    id: 'archive',
    label: 'NASA Mission Archive',
    description: 'Interactive historical missions modal, timeline audio, and flight manifests',
    badge: 'Archive',
    type: 'page',
    hash: '#/debug/page/archive',
  },
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
    items: [...DEBUG_PAGES],
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
    14: { title: '🏆 Module 14 · Crew Return & Mission Debrief', description: 'Ascent staging, Earth re-entry, recovery, and final mission debrief', steps: [] },
  };

  for (const step of STORY_FLOW) {
    if (step.module && moduleGroups[step.module]) {
      moduleGroups[step.module].steps.push(step);
    }
  }

  for (const group of Object.values(moduleGroups)) {
    if (group.steps.length > 0) {
      categories.push({
        title: group.title,
        description: group.description,
        items: group.steps.map(step => ({
          id: step.id,
          label: step.title,
          badge: `Mod ${step.module}`,
          type: 'step',
          hash: `#/debug/step/${step.id}`,
        })),
      });
    }
  }

  // Demo Chapters
  categories.push({
    title: '🎬 Stage Demo Checkpoints',
    description: 'Jump directly to key chapter milestones with pre-configured mission states',
    items: DEMO_CHAPTERS.map(ch => ({
      id: ch.id,
      label: ch.label,
      description: `${ch.group} · ${ch.objective}`,
      badge: 'Demo',
      type: 'demo',
      hash: `#/debug/demo/${ch.id}`,
    })),
  });

  return categories;
}

// Auto-register categories on load with safety guard
try {
  registerDebugCategories(getDebugCategories());
} catch (err) {
  console.warn('Debug category registration deferred:', err);
}
