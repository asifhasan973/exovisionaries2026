import { installedIds, installPart, partById, preparationTotals } from './preparation.ts';
import type { PreparationSelection } from './design.ts';
/** Uses the same totals as installation, including replacement and drill peak load. */
export function comparePart(preparation: PreparationSelection, id: string, shadow = false) {
  const part = partById(id);
  const existing = part && !['lander', 'science'].includes(part.category)
    ? installedIds(preparation).map(partById).find(item => item?.category === part.category) : undefined;
  const before = preparationTotals(preparation, shadow), after = preparationTotals(installPart(preparation, id), shadow);
  return { replaces: existing?.id !== id ? existing?.name : undefined,
    credits: after.credits - before.credits, massKg: after.massKg - before.massKg, peakW: after.peakW - before.peakW,
    batteryWh: after.batteryWh, shadowMinutes: after.batteryMinutes };
}
export const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`;
export function optionBenefit(id: string, shadowMinutes: number | null) {
  const part = partById(id);
  if (!part) return '';
  if (part.category === 'battery') return `~${shadowMinutes ?? '—'} min at current load`;
  if (part.category === 'rover') return `${part.reliabilityPercent}% reliability`;
  if (part.category === 'solar') return '0 W in shadow';
  if (part.category === 'navigation') return id === 'stereo-hazard-camera' ? 'Two cameras · safer route' : 'Simple route view';
  if (part.category === 'thermal') return `${id === 'advanced-thermal' ? 'Extra warmth' : 'Rim warmth'} · ${part.nominalPowerW} W heater`;
  if (part.category === 'communication') return id === 'high-gain-communication' ? 'Stronger radio link' : 'Simple radio link';
  return '';
}
