import { SCRIPT_COMPONENTS, SCRIPT_DRILL_DEPTHS_CM, SCRIPT_RESOURCES, createPreparationSelection } from './design.ts';
import type { DesignCategory, PreparationSelection, ScriptComponent } from './design.ts';
import type { ActivityId, StoryStepId } from './types.ts';
import { MOON_RULES } from './moon/rules.ts';
import { drillDurationSeconds, energyWh, operatingPower } from './moon/resources.ts';
import { GEOLOGY_PARTS, geologyMissing } from './moon/geology.ts';
import type { ScienceFamily } from './moon/geology.ts';

export const NASA_INSTRUMENTS = 'https://science.nasa.gov/mission/viper/rover-and-instruments/';
export const NASA_OPERATIONS = 'https://science.nasa.gov/mission/viper/lunar-operations/';
export interface WorkshopPart extends Omit<ScriptComponent, 'massKg' | 'credits' | 'nominalPowerW'> {
  massKg: number; credits: number; nominalPowerW: number;
  description: string; assumption?: string; source?: string;
  capacityWh?: number; dischargeLimitW?: number;
  objective?: 'lunar-ice' | 'lunar-geology'; scienceFamily?: ScienceFamily; replaceGroup?: string;
  tier?: 'basic' | 'balanced' | 'advanced'; detailLevel?: number; capability?: string; needsSample?: boolean;
}
// The source catalogue stays untouched. These are explicit authored balancing rules,
// never NASA mass measurements, vendor prices or certification of a lunar mission.
const extras: Record<string, Partial<WorkshopPart>> = {
  'lander-body': { nominalPowerW: 0, description: 'Carries your rover and equipment to the surface.' },
  'landing-engines': { nominalPowerW: 0, description: 'Slow the lander before touchdown. Propellant is included in its game mass.', assumption: 'Thruster propulsion is not an electrical load; propellant is included in the scripted 25 kg game part.' },
  'landing-radar': { description: 'Measures height above the ground during landing.' },
  'navigation-computer': { description: 'Guides the lander during its descent.' },
  'lander-antenna': { description: 'Connects the lander to mission control.' },
  'landing-cameras': { description: 'Look for a safe touchdown spot.' },
  'basic-rover': { description: 'Light and affordable. Less capable on rough terrain.' },
  'polar-rover': { description: 'A balanced rover for rough polar terrain.', source: NASA_INSTRUMENTS },
  'heavy-rover': { description: 'Strong mobility. Leaves less room for other equipment.' },
  nss: { description: 'Finds hydrogen clues by measuring neutrons. Hydrogen alone does not confirm water ice.', source: NASA_INSTRUMENTS },
  nirvss: { description: 'Uses infrared light to study water, hydroxyl and minerals in soil.', source: NASA_INSTRUMENTS },
  trident: { description: 'Drills up to 1 metre and brings soil cuttings to the surface.', assumption: 'Depth planning uses 30 seconds per 10 cm at conservative peak load; risk bands and interpolated potential points are authored game rules. Actual drilling time depends on soil.', source: NASA_INSTRUMENTS },
  msolo: { credits: 70, massKg: 12, nominalPowerW: 20, description: 'Measures gases released from the soil. Optional in this game.', assumption: 'Optional status, 70 credits, 12 kg and 20 W are game estimates; the script has no values.', source: NASA_INSTRUMENTS },
  'basic-navigation-camera': { description: 'Helps the rover see its route.' },
  'stereo-hazard-camera': { description: 'Two views help the rover judge nearby obstacles.' },
  'standard-solar': { massKg: 8, nominalPowerW: 0, description: 'Makes up to 150 W in sunlight. Makes 0 W in permanent shadow.', assumption: '8 kg is a game estimate. Output is ideal sunlight output, not constant lunar generation.', source: NASA_OPERATIONS },
  'efficient-solar': { massKg: 12, nominalPowerW: 0, description: 'Makes up to 250 W in sunlight. Makes 0 W in permanent shadow.', assumption: '12 kg is a game estimate. The script’s +250 W is interpreted as 250 W total, replacing the Standard array.', source: NASA_OPERATIONS },
  'small-battery': { nominalPowerW: 0, capacityWh: 100, dischargeLimitW: MOON_RULES.equipmentPeakW, description: 'A light battery for short trips into shadow.', assumption: 'Script capacity is interpreted as Wh. The 450 W discharge ceiling is a game rule.' },
  'medium-battery': { nominalPowerW: 0, capacityWh: 220, dischargeLimitW: MOON_RULES.equipmentPeakW, description: 'More energy for longer trips into shadow.', assumption: 'Script capacity is interpreted as Wh. The 450 W discharge ceiling is a game rule.' },
  'large-battery': { nominalPowerW: 0, capacityWh: 400, dischargeLimitW: MOON_RULES.equipmentPeakW, description: 'Most stored energy. Also the heaviest battery.', assumption: 'Script capacity is interpreted as Wh. The 450 W discharge ceiling is a game rule.' },
  'basic-thermal': { massKg: 4, nominalPowerW: 10, description: 'Insulation and a small heater. Limited protection in deep cold.', assumption: '4 kg and 10 W heater load are game estimates.' },
  'advanced-thermal': { massKg: 8, nominalPowerW: 15, description: 'Better insulation, heaters and temperature monitoring.', assumption: '8 kg and 15 W heater load are game estimates. This does not guarantee survival in a shadowed crater.' },
  'basic-communication': { massKg: 2, nominalPowerW: 8, description: 'A simple rover radio link to the lander.', assumption: '2 kg and 8 W are game estimates. This is the rover radio, separate from the mandatory lander antenna.' },
  'high-gain-communication': { massKg: 4, nominalPowerW: 15, description: 'A stronger rover radio link for science data.', assumption: '4 kg and 15 W are game estimates. Terrain can still block a radio link.' },
};
export const WORKSHOP_PARTS: readonly WorkshopPart[] = [...SCRIPT_COMPONENTS.map(part => ({
  ...part, massKg: part.massKg ?? 0, credits: part.credits ?? 0, nominalPowerW: part.nominalPowerW ?? 0,
  description: '', ...extras[part.id],
})), ...GEOLOGY_PARTS];
export function partsForObjective(objective: string = 'lunar-ice') {
  return WORKSHOP_PARTS.filter(part => part.category !== 'science' || (objective === 'lunar-geology' ? part.objective === objective : !part.objective));
}
export function selectedDrill(preparation: PreparationSelection) { return preparation.sciencePartIds.map(partById).find(part => part?.id === 'trident' || part?.id.startsWith('geo-drill-')); }
export function normalizeObjective(preparation: PreparationSelection, objective: string): PreparationSelection {
  const allowed = new Set(partsForObjective(objective).map(part => part.id));
  const sciencePartIds = preparation.sciencePartIds.filter(id => allowed.has(id));
  if (sciencePartIds.length === preparation.sciencePartIds.length) return preparation;
  const next = { ...preparation, sciencePartIds };
  return { ...next, drillDepthCm: selectedDrill(next) ? next.drillDepthCm : null };
}
export const partById = (id: string | null | undefined) => WORKSHOP_PARTS.find(part => part.id === id);
export const WORKSHOP_STAGES = ['lander-build', 'rover-select', 'science-build', 'power-build', 'survival-build'] as const;
export type WorkshopStage = typeof WORKSHOP_STAGES[number];
export const STAGE_CATEGORIES: Record<WorkshopStage, readonly DesignCategory[]> = {
  'lander-build': ['lander'], 'rover-select': ['rover'], 'science-build': ['science'],
  'power-build': ['solar', 'battery'], 'survival-build': ['navigation', 'thermal', 'communication'],
};
const singleFields = { rover: 'roverId', navigation: 'navigationId', solar: 'solarId', battery: 'batteryId', thermal: 'thermalId', communication: 'communicationId' } as const;
export function installedIds(preparation: PreparationSelection): string[] {
  return [...preparation.landerPartIds, ...preparation.sciencePartIds,
    preparation.roverId, preparation.navigationId, preparation.solarId, preparation.batteryId, preparation.thermalId, preparation.communicationId]
    .filter((id): id is string => !!id);
}
export function installPart(current: PreparationSelection, id: string): PreparationSelection {
  const part = partById(id);
  if (!part) return current;
  if (part.category === 'lander' || part.category === 'science') {
    const key = part.category === 'lander' ? 'landerPartIds' : 'sciencePartIds';
    if (current[key].includes(id)) return current;
    const existing = part.replaceGroup ? current[key].filter(value => partById(value)?.replaceGroup !== part.replaceGroup) : current[key];
    const next = { ...current, [key]: [...existing, id] };
    const drill = selectedDrill(next);
    return { ...next, drillDepthCm: drill ? Math.min(current.drillDepthCm ?? 20, drill.maxDepthCm ?? 100) : null };
  }
  const key = singleFields[part.category];
  return current[key] === id ? current : { ...current, [key]: id };
}
export function removePart(current: PreparationSelection, id: string): PreparationSelection {
  if (!installedIds(current).includes(id)) return current;
  const part = partById(id)!;
  if (part.category === 'lander' || part.category === 'science') {
    const key = part.category === 'lander' ? 'landerPartIds' : 'sciencePartIds';
    const next = { ...current, [key]: current[key].filter(value => value !== id) };
    return { ...next, drillDepthCm: selectedDrill(next) ? current.drillDepthCm : null };
  }
  return { ...current, [singleFields[part.category]]: null };
}
export function restorePreparation(raw: unknown): PreparationSelection {
  const clean = createPreparationSelection();
  if (!raw || typeof raw !== 'object') return clean;
  const saved = raw as Record<string, unknown>;
  for (const [category, field] of [['lander', 'landerPartIds'], ['science', 'sciencePartIds']] as const) {
    const values = saved[field];
    clean[field] = Array.isArray(values) ? [...new Set(values.filter((id): id is string => typeof id === 'string' && partById(id)?.category === category))] : [];
  }
  for (const [category, field] of Object.entries(singleFields)) {
    const value = saved[field];
    if (typeof value === 'string' && partById(value)?.category === category) clean[field as typeof singleFields[keyof typeof singleFields]] = value;
  }
  // Keep one upgrade per geology family, even for hand-edited or older saves.
  const canonicalScience = clean.sciencePartIds.reduce((state,id) => installPart(state,id), createPreparationSelection());
  clean.sciencePartIds = canonicalScience.sciencePartIds;
  const drill = selectedDrill(clean);
  if (drill) {
    clean.drillDepthCm = typeof saved.drillDepthCm === 'number' && SCRIPT_DRILL_DEPTHS_CM.some(depth => depth === saved.drillDepthCm) ? Math.min(saved.drillDepthCm,drill.maxDepthCm ?? 100) : 20;
  }
  return clean;
}
export function stageReady(id: StoryStepId, preparation: PreparationSelection, objective: string = 'lunar-ice'): boolean {
  switch (id) {
    case 'resource-limits': return true;
    case 'lander-build': return WORKSHOP_PARTS.filter(p => p.category === 'lander').every(p => preparation.landerPartIds.includes(p.id));
    case 'rover-select': return !!preparation.roverId;
    case 'science-build': return objective === 'lunar-geology' ? !geologyMissing(preparation.sciencePartIds).length && (!selectedDrill(preparation) || preparation.drillDepthCm !== null)
      : ['nss', 'nirvss', 'trident'].every(id => preparation.sciencePartIds.includes(id)) && preparation.drillDepthCm !== null;
    case 'power-build': return !!preparation.solarId && !!preparation.batteryId;
    case 'survival-build': return !!preparation.navigationId && !!preparation.thermalId && !!preparation.communicationId;
    default: return false; // Approval and packing belong to Module 6.
  }
}
export function verifiedActivities(preparation: PreparationSelection, objective: string = 'lunar-ice'): ActivityId[] {
  return ['resource-limits' as const, ...WORKSHOP_STAGES].filter(id => stageReady(id, preparation, objective));
}
/** Potential points only: no science has been conducted in the workshop. */
export function drillPotential(depth: number | null): number {
  if (!depth) return 0;
  const anchors = [[0, 0], [20, 5], [50, 15], [100, 35]];
  const upper = anchors.findIndex(([cm]) => cm >= depth);
  const [a, pointsA] = anchors[Math.max(0, upper - 1)];
  const [b, pointsB] = anchors[upper < 0 ? anchors.length - 1 : upper];
  return b === a ? pointsB : Math.round(pointsA + (pointsB - pointsA) * (Math.min(depth, b) - a) / (b - a));
}
export function preparationTotals(preparation: PreparationSelection, shadow = false) {
  const parts = installedIds(preparation).map(partById).filter((p): p is WorkshopPart => !!p);
  const normalW = operatingPower(parts, 'rehearsal').loadW;
  const drill = selectedDrill(preparation);
  const peakW = operatingPower(parts, 'rehearsal-drill').loadW;
  const solarW = operatingPower(parts, 'rehearsal', shadow ? 0 : 1).solarW;
  const batteryWh = partById(preparation.batteryId)?.capacityWh ?? 0;
  const deficitW = Math.max(0, normalW - solarW);
  const drillSeconds = drill ? drillDurationSeconds(preparation.drillDepthCm ?? 20) : 0;
  const drillMinutes = drillSeconds / 60;
  const drillEnergyWh = Math.round(energyWh(peakW, drillSeconds) * 10) / 10;
  const landerW = operatingPower(parts, 'descent').loadW;
  return {
    credits: parts.reduce((sum, p) => sum + p.credits, 0), massKg: parts.reduce((sum, p) => sum + p.massKg, 0), normalW, peakW, landerW,
    solarW, batteryWh, deficitW, drillMinutes, drillEnergyWh,
    drillRisk: !drill ? 'None' : (preparation.drillDepthCm ?? 20) <= 30 ? 'Low' : (preparation.drillDepthCm ?? 20) <= 60 ? 'Medium' : 'High',
    // 20% energy reserve; ideal arithmetic, not flight-qualified runtime.
    batteryMinutes: batteryWh && deficitW ? Math.floor(batteryWh * (1 - MOON_RULES.reserveFraction) / deficitW * 60) : null,
    potentialScience: parts.reduce((sum, p) => sum + (p.id === 'trident' ? drillPotential(preparation.drillDepthCm) : p.scienceBonus ?? 0), 0),
    scienceMassKg: parts.filter(part => part.category === 'science').reduce((sum,part) => sum + part.massKg,0),
    spentScience: SCRIPT_RESOURCES.initialScienceScore,
  };
}
export function quickPreparation(objective: string = 'lunar-ice'): PreparationSelection {
  const ids = ['lander-body', 'landing-engines', 'landing-radar', 'navigation-computer', 'lander-antenna', 'landing-cameras',
    'polar-rover', 'nss', 'nirvss', 'trident', 'stereo-hazard-camera', 'efficient-solar', 'medium-battery', 'basic-thermal', 'basic-communication'];
  const plan = objective === 'lunar-geology' ? ids.filter(id => !['nss','nirvss','trident'].includes(id)).map(id => id === 'polar-rover' ? 'basic-rover' : id)
    .concat(['geo-camera-basic','geo-ir-basic','geo-xrf-basic','geo-drill-basic']) : ids;
  return plan.reduce(installPart, createPreparationSelection());
}
