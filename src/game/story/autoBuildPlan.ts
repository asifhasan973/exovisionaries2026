import { installedIds, quickPreparation } from './preparation.ts';

export function autoBuildParts(shadow: boolean, objective = 'lunar-ice') {
  // A shadow route needs warmer protection. Use lighter navigation to stay in budget.
  return installedIds(quickPreparation(objective)).map(id => shadow && id === 'basic-thermal' ? 'advanced-thermal' : shadow && id === 'stereo-hazard-camera' ? 'basic-navigation-camera' : id);
}
