import { installedIds, quickPreparation } from './preparation.ts';

export function autoBuildParts(shadow: boolean) {
  // A shadow route needs warmer protection. Use lighter navigation to stay in budget.
  return installedIds(quickPreparation()).map(id => shadow && id === 'basic-thermal' ? 'advanced-thermal' : shadow && id === 'stereo-hazard-camera' ? 'basic-navigation-camera' : id);
}
