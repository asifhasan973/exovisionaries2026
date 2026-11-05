import { installedIds, STAGE_CATEGORIES, partsForObjective, selectedDrill } from './preparation.ts';
import { geologyMissing } from './moon/geology.ts';
import type { ScienceFamily } from './moon/geology.ts';
import type { WorkshopStage } from './preparation.ts';
import type { DesignCategory, PreparationSelection } from './design.ts';

export type ShelfNext = { kind: 'install'; remaining: number } | { kind: 'shelf'; category: DesignCategory; page: number; family?: ScienceFamily }
  | { kind: 'depth' } | { kind: 'advance' };

/** Next guides the player through required hardware, choices and drill planning. */
export function nextWorkshopAction(stage: WorkshopStage, preparation: PreparationSelection,
  category: DesignCategory, page: number, pageSize: number, depthOpen = false, objective = 'lunar-ice', family: ScienceFamily = 'camera'): ShelfNext {
  const installed = new Set(installedIds(preparation));
  const catalog = partsForObjective(objective);
  const parts = catalog.filter(part => part.category === category);
  if (stage === 'science-build' && objective === 'lunar-geology') {
    const missing = geologyMissing(preparation.sciencePartIds);
    const familyOptions = parts.filter(part => part.scienceFamily === family);
    const chosen = familyOptions.some(part => installed.has(part.id));
    if (!depthOpen && !chosen && missing.includes(family)) {
      if ((page + 1) * pageSize < familyOptions.length) return { kind: 'shelf', category: 'science', family, page: page + 1 };
      return { kind: 'install', remaining: 1 };
    }
    if (missing.length) return { kind: 'shelf', category: 'science', family: missing[0], page: 0 };
    return selectedDrill(preparation) && !depthOpen ? { kind: 'depth' } : { kind: 'advance' };
  }
  const multi = category === 'lander' || category === 'science';
  const visible = parts.slice(page * pageSize, (page + 1) * pageSize);
  const remaining = multi ? visible.filter(part => part.mandatory && !installed.has(part.id)).length : Number(!parts.some(part => installed.has(part.id)));
  if (!depthOpen && remaining) {
    // A choice can live on a later page (e.g. the third rover). Next also browses
    // those options, so no player has to discover the small shelf arrows.
    if (!multi && (page + 1) * pageSize < parts.length) return { kind: 'shelf', category, page: page + 1 };
    return { kind: 'install', remaining };
  }
  const categories = STAGE_CATEGORIES[stage];
  // Revisit any missing earlier category after an edit, too. Readiness gates remain authoritative.
  for (const nextCategory of [category, ...categories.filter(value => value !== category)]) {
    const candidates = catalog.filter(part => part.category === nextCategory);
    const missing = nextCategory === 'lander' || nextCategory === 'science'
      ? candidates.findIndex(part => part.mandatory && !installed.has(part.id))
      : candidates.some(part => installed.has(part.id)) ? -1 : 0;
    if (missing >= 0) return { kind: 'shelf', category: nextCategory, page: Math.floor(missing / pageSize) };
  }
  // On a one-card shelf, still offer the optional science tool before drill planning.
  if (multi && !depthOpen && parts.slice((page + 1) * pageSize).some(part => !part.mandatory && !installed.has(part.id))) {
    return { kind: 'shelf', category, page: page + 1 };
  }
  return stage === 'science-build' && !depthOpen ? { kind: 'depth' } : { kind: 'advance' };
}
