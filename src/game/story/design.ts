/** Values copied from the script: authored game values, not verified NASA specifications. */
export const SCRIPT_RESOURCES = {
  budgetCredits: 1000,
  payloadMassLimitKg: 350,
  peakPowerLimitW: 450,
  initialRoverHealthPercent: 100,
  initialScienceScore: 0,
  mandatoryLanderCredits: 285,
  mandatoryLanderMassKg: 134
} as const;

export type DesignCategory = 'lander' | 'rover' | 'science' | 'navigation' | 'solar' | 'battery' | 'thermal' | 'communication';
export interface ScriptComponent {
  id: string;
  name: string;
  category: DesignCategory;
  credits: number | null;
  massKg: number | null;
  nominalPowerW: number | null;
  peakPowerW?: number | null;
  scienceBonus?: number;
  mandatory?: boolean;
  terrainStars?: number;
  reliabilityPercent?: number;
  safetyBonus?: number;
  outputW?: number;
  /** Unit is unspecified in the supplied script: do not silently assume Wh. */
  batteryCapacity?: number;
  maxDepthCm?: number;
  specGaps?: readonly string[];
}

export const SCRIPT_COMPONENTS: readonly ScriptComponent[] = [
  { id: 'lander-body', name: 'Lander body', category: 'lander', credits: 100, massKg: 80, nominalPowerW: null, mandatory: true },
  { id: 'landing-engines', name: 'Landing engines', category: 'lander', credits: 60, massKg: 25, nominalPowerW: null, mandatory: true },
  { id: 'landing-radar', name: 'Landing radar/altimeter', category: 'lander', credits: 35, massKg: 8, nominalPowerW: 15, scienceBonus: 2, mandatory: true },
  { id: 'navigation-computer', name: 'Navigation computer', category: 'lander', credits: 30, massKg: 6, nominalPowerW: 20, scienceBonus: 2, mandatory: true },
  { id: 'lander-antenna', name: 'Communication antenna', category: 'lander', credits: 40, massKg: 10, nominalPowerW: 15, scienceBonus: 3, mandatory: true },
  { id: 'landing-cameras', name: 'Landing cameras', category: 'lander', credits: 20, massKg: 5, nominalPowerW: 10, scienceBonus: 3, mandatory: true },
  { id: 'basic-rover', name: 'Basic Rover', category: 'rover', credits: 120, massKg: 55, nominalPowerW: 100, scienceBonus: 5, terrainStars: 2, reliabilityPercent: 70 },
  { id: 'polar-rover', name: 'Polar Explorer', category: 'rover', credits: 190, massKg: 85, nominalPowerW: 130, scienceBonus: 15, terrainStars: 4, reliabilityPercent: 90 },
  { id: 'heavy-rover', name: 'Heavy Science Rover', category: 'rover', credits: 250, massKg: 115, nominalPowerW: 160, scienceBonus: 25, terrainStars: 5, reliabilityPercent: 94 },
  { id: 'nss', name: 'Neutron Spectrometer — NSS', category: 'science', credits: 65, massKg: 2, nominalPowerW: 5, mandatory: true },
  { id: 'nirvss', name: 'Near-Infrared Spectrometer — NIRVSS', category: 'science', credits: 75, massKg: 5, nominalPowerW: 30, mandatory: true },
  { id: 'trident', name: 'TRIDENT DRILL', category: 'science', credits: 110, massKg: 18, nominalPowerW: 20, peakPowerW: 175, scienceBonus: 35, maxDepthCm: 100, mandatory: true },
  { id: 'msolo', name: 'MSOLO', category: 'science', credits: null, massKg: null, nominalPowerW: null, specGaps: ['cost', 'mass', 'power', 'mandatory status'] },
  { id: 'basic-navigation-camera', name: 'Basic Navigation Camera', category: 'navigation', credits: 20, massKg: 3, nominalPowerW: 8, scienceBonus: 3, safetyBonus: 10 },
  { id: 'stereo-hazard-camera', name: 'Stereo Hazard Camera', category: 'navigation', credits: 40, massKg: 6, nominalPowerW: 15, scienceBonus: 8, safetyBonus: 25 },
  { id: 'standard-solar', name: 'Standard', category: 'solar', credits: 40, massKg: null, nominalPowerW: null, outputW: 150, specGaps: ['mass'] },
  { id: 'efficient-solar', name: 'High-efficiency', category: 'solar', credits: 75, massKg: null, nominalPowerW: null, outputW: 250, specGaps: ['mass', 'whether +250 W is an upgrade increment or total output'] },
  { id: 'small-battery', name: 'Small', category: 'battery', credits: 30, massKg: 6, nominalPowerW: null, batteryCapacity: 100, specGaps: ['capacity unit', 'maximum discharge power'] },
  { id: 'medium-battery', name: 'Medium', category: 'battery', credits: 60, massKg: 12, nominalPowerW: null, batteryCapacity: 220, specGaps: ['capacity unit', 'maximum discharge power'] },
  { id: 'large-battery', name: 'Large', category: 'battery', credits: 100, massKg: 20, nominalPowerW: null, batteryCapacity: 400, specGaps: ['capacity unit', 'maximum discharge power'] },
  { id: 'basic-thermal', name: 'Basic thermal protection', category: 'thermal', credits: 35, massKg: null, nominalPowerW: null, specGaps: ['mass', 'heater power'] },
  { id: 'advanced-thermal', name: 'Advanced thermal protection', category: 'thermal', credits: 75, massKg: null, nominalPowerW: null, specGaps: ['mass', 'heater power'] },
  { id: 'basic-communication', name: 'Basic', category: 'communication', credits: 25, massKg: null, nominalPowerW: null, specGaps: ['mass', 'power', 'relationship to mandatory lander antenna'] },
  { id: 'high-gain-communication', name: 'High-gain', category: 'communication', credits: 55, massKg: null, nominalPowerW: null, specGaps: ['mass', 'power', 'relationship to mandatory lander antenna'] }
];

export const SCRIPT_DRILL_DEPTHS_CM = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;
/** Preserve only the explicitly specified points; no interpolation rule is in the script. */
export const SCRIPT_DRILL_SCIENCE_EXAMPLES = { 20: 5, 50: 15, 100: 35 } as const;

export interface PreparationSelection {
  landerPartIds: string[];
  roverId: string | null;
  sciencePartIds: string[];
  drillDepthCm: number | null;
  navigationId: string | null;
  solarId: string | null;
  batteryId: string | null;
  thermalId: string | null;
  communicationId: string | null;
}

/** Module 5 starts from an empty workbench and zero purchased hardware. */
export function createPreparationSelection(): PreparationSelection {
  return { landerPartIds: [], roverId: null, sciencePartIds: [], drillDepthCm: null, navigationId: null, solarId: null, batteryId: null, thermalId: null, communicationId: null };
}
