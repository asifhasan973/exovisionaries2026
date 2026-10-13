import { MOON_RULES } from './rules.ts';

export type OperatingMode = 'descent' | 'traverse' | 'drilling' | 'analysis' | 'charging' | 'standby' | 'crew-return' | 'rehearsal' | 'rehearsal-drill';
export interface ElectricalPart {
  id: string; category: string; nominalPowerW: number; peakPowerW?: number | null;
  outputW?: number; capacityWh?: number; dischargeLimitW?: number;
}
export function finiteNonnegative(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= 0; }
export function energyWh(watts: number, seconds: number): number {
  if (!finiteNonnegative(watts) || !finiteNonnegative(seconds)) throw new RangeError('Power and mission seconds must be finite and nonnegative.');
  const result = watts / 3600 * seconds;
  if (!Number.isFinite(result)) throw new RangeError('Energy exceeds the finite simulation range.');
  return result;
}
export function drillDurationSeconds(depthCm: number): number {
  if (!Number.isInteger(depthCm) || depthCm < 10 || depthCm > 100 || depthCm % 10) throw new RangeError('Drill depth must be 10–100 cm in 10-cm steps.');
  return depthCm / 10 * MOON_RULES.drillSecondsPer10Cm;
}

/** Illumination is a usable fraction; a blocked/PSR Sun gives zero regardless of array tier. */
export interface CrewPowerProfile { driveLoadMultiplier: 1 | .9 }
export const NO_CREW_POWER: CrewPowerProfile = { driveLoadMultiplier: 1 };
export function operatingPower(parts: readonly ElectricalPart[], mode: OperatingMode, illumination = 0, activeScienceIds: readonly string[] = [], crew: CrewPowerProfile = NO_CREW_POWER) {
  if (!finiteNonnegative(illumination) || illumination > 1) throw new RangeError('Illumination must be between zero and one.');
  const active = parts.filter(part => {
    if (mode === 'descent') return part.category === 'lander';
    if (mode === 'crew-return') return false; // Supplied spacecraft power is a separate, currently unspecified account.
    if (part.category === 'lander') return false;
    if (mode === 'rehearsal' || mode === 'rehearsal-drill') return true;
    if (part.category === 'rover') return mode === 'traverse';
    if (part.category === 'navigation') return mode === 'traverse';
    if (part.category === 'science') return mode === 'drilling'
      ? part.id === 'trident' || part.id.startsWith('geo-drill-') || activeScienceIds.includes(part.id)
      : mode === 'analysis' && activeScienceIds.includes(part.id);
    return part.category === 'thermal' || part.category === 'communication';
  });
  const loadW = active.reduce((sum, part) => {
    const watts = ['drilling', 'rehearsal-drill'].includes(mode) && (part.id === 'trident' || part.id.startsWith('geo-drill-')) ? part.peakPowerW ?? part.nominalPowerW : part.nominalPowerW;
    return sum + watts * (part.category === 'rover' && ['traverse','rehearsal'].includes(mode) ? crew.driveLoadMultiplier : 1);
  }, 0);
  const solarW = mode === 'descent' || mode === 'crew-return' ? 0 : parts.reduce((sum, part) => sum + (part.outputW ?? 0), 0) * illumination;
  const battery = parts.find(part => part.category === 'battery');
  const dischargeLimitW = Math.min(MOON_RULES.equipmentPeakW, battery?.dischargeLimitW ?? 0);
  return { loadW, solarW, deficitW: Math.max(0, loadW - solarW), surplusW: Math.max(0, solarW - loadW),
    dischargeLimitW, peakOK: Math.max(0, loadW - solarW) <= dischargeLimitW,
    account: mode === 'crew-return' ? 'supplied-platform-unmodeled' as const : 'equipment' as const };
}

/** Preview and runtime use the identical integral, independent of animation/playback speed. */
export function batteryStep(currentWh: number, capacityWh: number, loadW: number, solarW: number, missionSeconds: number) {
  if (![currentWh, capacityWh, loadW, solarW, missionSeconds].every(finiteNonnegative) || currentWh > capacityWh) throw new RangeError('Invalid battery account.');
  const netWh = energyWh(loadW - Math.min(loadW, solarW), missionSeconds) - energyWh(Math.max(0, solarW - loadW), missionSeconds);
  const requestedWh = currentWh - netWh;
  const remainingWh = Math.min(capacityWh, Math.max(0, requestedWh));
  return { remainingWh, spentWh: Math.max(0, currentWh - remainingWh), chargedWh: Math.max(0, remainingWh - currentWh),
    unmetWh: Math.max(0, -requestedWh), reserveWh: capacityWh * MOON_RULES.reserveFraction,
    reserveOK: remainingWh + 1e-9 >= capacityWh * MOON_RULES.reserveFraction };
}

export function rehearsalBudget(parts: readonly ElectricalPart[], depthCm: number | null, crew: CrewPowerProfile = NO_CREW_POWER) {
  const normal = operatingPower(parts, 'rehearsal', 0, [], crew);
  const drill = operatingPower(parts, 'rehearsal-drill');
  const hasDrill = parts.some(part => part.id === 'trident' || part.id.startsWith('geo-drill-'));
  const hasScoop=parts.some(part=>part.id==='geo-scoop-basic');
  const drillSeconds = hasDrill ? drillDurationSeconds(depthCm ?? 20) : hasScoop ? 60 : 0;
  const legWh = energyWh(normal.loadW, MOON_RULES.rehearsalTravelSeconds / 2);
  const drillWh = energyWh(drill.loadW, drillSeconds);
  const batteryWh = parts.find(part => part.category === 'battery')?.capacityWh ?? 0;
  const usableWh = batteryWh * (1 - MOON_RULES.reserveFraction);
  return { normalW: normal.loadW, peakW: drill.loadW, batteryWh, usableWh, drillSeconds, legWh, drillWh,
    requiredWh: 2 * legWh + drillWh, availableW: drill.dischargeLimitW,
    peakOK: drill.peakOK, energyOK: 2 * legWh + drillWh <= usableWh + 1e-9 };
}

/** Ideal rocket equation; the trajectory's required delta-v is a separate input. */
export function availableDeltaV(exhaustVelocityMS: number, dryMassKg: number, propellantKg: number) {
  if (![exhaustVelocityMS, dryMassKg, propellantKg].every(finiteNonnegative) || dryMassKg === 0) throw new RangeError('Invalid propulsion account.');
  return exhaustVelocityMS * Math.log((dryMassKg + propellantKg) / dryMassKg);
}
