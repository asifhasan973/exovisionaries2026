import type { PreparationSelection } from '@/game/moon/core/design';
import { installedIds, partById, preparationTotals, type WorkshopPart } from '@/game/moon/core/preparation';
import type { CrewAssignment } from '@/game/moon/shared/catalog';
import { crewReport } from '@/game/moon/shared/catalog';
import type { FlightPlan } from '@/game/moon/shared/platform';

/** Fictional geology mission credits. Each platform system is charged once. */
export const GEOLOGY_MISSION_CAP = 10_000;
export const GEOLOGY_CABINS = {
  basic: { label:'Basic', capacity:2, massKg:1800, credits:500, powerW:150, safetyPoints:10 },
  standard: { label:'Standard', capacity:4, massKg:2400, credits:750, powerW:220, safetyPoints:20 },
  extended: { label:'Extended', capacity:4, massKg:3200, credits:1000, powerW:300, safetyPoints:25 },
} as const;
export const GEOLOGY_LIFE_SUPPORT = {
  basic: { label:'Basic', massKg:450, credits:300, powerW:350, safetyPoints:10, maxCrewDays:27 },
  standard: { label:'Standard', massKg:700, credits:500, powerW:500, safetyPoints:20, maxCrewDays:36 },
  extended: { label:'Extended', massKg:950, credits:750, powerW:700, safetyPoints:25, maxCrewDays:48 },
} as const;
export type GeologyCabin = keyof typeof GEOLOGY_CABINS;
export type GeologyLifeSupport = keyof typeof GEOLOGY_LIFE_SUPPORT;
export const GEOLOGY_SAFETY = { massKg:567, credits:890, powerW:270, safetyPoints:80 } as const;
export const GEOLOGY_BASE_COSTS = [
  ['Crew systems', 2140], ['Launch service', 1200], ['Lunar landing', 700],
  ['Ascent & Earth return', 1500], ['Rover mobility', 600], ['Main power', 600],
  ['Radio & navigation', 250], ['Thermal & dust', 180],
] as const;
const baseChoice: Record<string, string> = {
  rover: 'basic-rover', solar: 'standard-solar', battery: 'medium-battery',
  navigation: 'basic-navigation-camera', communication: 'basic-communication', thermal: 'basic-thermal',
};
export function geologyUpgradeForPart(id: string) {
  const part = partById(id);
  if (!part || !(part.category in baseChoice)) return 0;
  return Math.max(0, part.credits - (partById(baseChoice[part.category])?.credits ?? 0));
}
export const GEOLOGY_PROPULSION = {
  compact: { label: 'Compact', credits: 1100, gameFuelUnits: 650, packageKg: 450 },
  standard: { label: 'Standard', credits: 1200, gameFuelUnits: 850, packageKg: 600 },
  extended: { label: 'Extended', credits: 1400, gameFuelUnits: 1100, packageKg: 750 },
} as const;
export type GeologyPropulsion = keyof typeof GEOLOGY_PROPULSION;
export const GEOLOGY_FUEL_STAGES = [
  ['Moon transfer', 100], ['Lunar landing', 120], ['Lunar ascent', 110],
  ['Earth return', 150], ['Emergency reserve', 50],
] as const;
export const GEOLOGY_FUEL_REQUIRED = GEOLOGY_FUEL_STAGES.reduce((sum, [, amount]) => sum + amount, 0);

export function geologyBudget(preparation: PreparationSelection, crew?: CrewAssignment, plan?: FlightPlan) {
  const ids = installedIds(preparation);
  const parts = ids.map(partById).filter((part): part is WorkshopPart => !!part);
  const propulsion = GEOLOGY_PROPULSION[plan?.propulsionPack as GeologyPropulsion ?? 'standard'];
  const cabin=GEOLOGY_CABINS[plan?.cabinPack as GeologyCabin ?? 'standard'];
  const lifeSupport=GEOLOGY_LIFE_SUPPORT[plan?.lifeSupportPack as GeologyLifeSupport ?? 'standard'];
  const crewSystems=cabin.credits+lifeSupport.credits+GEOLOGY_SAFETY.credits;
  const science = parts.filter((part: any) => part.category === 'science').reduce((sum: number, part: any) => sum + part.credits, 0);
  // Base categories already pay for their standard hardware. Only the difference for a selected upgrade is added.
  const upgrades = parts.reduce((sum: number, part: any) => sum + geologyUpgradeForPart(part.id), 0);
  // The 2,140-MC crew-systems line includes a standard three-person roster, so only roster upgrades cost extra.
  const rosterUpgrade = crew && crewReport(crew).complete ? Math.max(0, crewReport(crew).credits - 215) : 0;
  const suppliesUpgrade = plan?.supplyPack === 'extended' ? 160 : 0;
  const fixed = GEOLOGY_BASE_COSTS.reduce((sum: number, [, amount]) => sum + amount, 0);
  const spent = fixed + crewSystems - 2140 + propulsion.credits + science + upgrades + rosterUpgrade + suppliesUpgrade;
  const scienceMassKg = parts.filter((part: any) => part.category === 'science').reduce((sum: number, part: any) => sum + part.massKg, 0);
  const hardwareMassUpgradeKg=parts.filter((part: any)=>part.category in baseChoice).reduce((sum: number,part: any)=>sum+Math.max(0,part.massKg-(partById(baseChoice[part.category])?.massKg??0)),0);
  const plannedSpacecraftMassKg=cabin.massKg+lifeSupport.massKg+GEOLOGY_SAFETY.massKg+propulsion.packageKg+3240+scienceMassKg+hardwareMassUpgradeKg;
  const missionPeakW=cabin.powerW+lifeSupport.powerW+GEOLOGY_SAFETY.powerW+preparationTotals(preparation).peakW;
  return { cap: GEOLOGY_MISSION_CAP, spent, remaining: GEOLOGY_MISSION_CAP - spent,
    fixed, crewSystems, cabin, lifeSupport, safety:GEOLOGY_SAFETY, propulsion, science, upgrades, rosterUpgrade, suppliesUpgrade, scienceMassKg,
    crewSystemsMassKg:cabin.massKg+lifeSupport.massKg+GEOLOGY_SAFETY.massKg,
    crewSystemsPowerW:cabin.powerW+lifeSupport.powerW+GEOLOGY_SAFETY.powerW,
    crewSafetyPoints:cabin.safetyPoints+lifeSupport.safetyPoints+GEOLOGY_SAFETY.safetyPoints,
    plannedSpacecraftMassKg,missionPeakW,mainPowerCapacityW:2000,
    fuelRequired: GEOLOGY_FUEL_REQUIRED, fuelReserve: propulsion.gameFuelUnits - GEOLOGY_FUEL_REQUIRED,
    valid: spent <= GEOLOGY_MISSION_CAP && scienceMassKg <= 100 && missionPeakW <= 2000 && propulsion.gameFuelUnits >= GEOLOGY_FUEL_REQUIRED };
}
