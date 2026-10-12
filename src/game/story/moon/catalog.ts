import { WORKSHOP_PARTS, installedIds } from '../preparation.ts';
import type { PreparationSelection } from '../design.ts';
import type { ElectricalPart } from './resources.ts';
import { MOON_RULES, MOON_SOURCES } from './rules.ts';

export type MoonObjective = 'lunar-ice' | 'lunar-geology';
export type DataOrigin = 'script-game-value' | 'game-estimate' | 'nasa-capability';
export interface MoonPart extends ElectricalPart {
  name: string; massKg: number; credits: number; potentialSP: number;
  objectives: readonly MoonObjective[]; family: string; tier?: 'basic' | 'balanced' | 'advanced';
  needsSample?: boolean;
  replaceGroup?: string;
  provenance: { values: DataOrigin; reference: string; assumptions: readonly string[]; capabilitySource?: string };
}

const shared = WORKSHOP_PARTS.map((part): MoonPart => ({
  ...part, potentialSP: part.scienceBonus ?? 0, family: part.id.startsWith('geo-drill-') ? 'drill' : part.scienceFamily ?? part.category,
  objectives: part.category === 'science' ? [part.objective ?? 'lunar-ice'] : ['lunar-ice', 'lunar-geology'],
  provenance: { values: part.specGaps?.length || part.id === 'geo-scoop-basic' ? 'game-estimate' : 'script-game-value', reference: MOON_SOURCES.script,
    capabilitySource: part.source, assumptions: [part.assumption ?? 'Numeric values are illustrative game allocations, not measured flight hardware.'] },
}));
export const MOON_PARTS: readonly MoonPart[] = shared;
export const moonPart = (id: string) => MOON_PARTS.find(part => part.id === id);

export interface EquipmentReport {
  parts: MoonPart[]; credits: number; massKg: number; scienceMassKg: number; potentialSP: number; errors: string[];
}
export function equipmentReport(ids: readonly string[], objective: MoonObjective): EquipmentReport {
  const errors: string[] = [], parts: MoonPart[] = [];
  const seen = new Set<string>(), familiesSeen = new Set<string>();
  for (const id of ids) {
    const part = moonPart(id);
    if (!part) { errors.push(`Unknown equipment: ${id}`); continue; }
    if (seen.has(id)) { errors.push(`Duplicate equipment: ${id}`); continue; }
    seen.add(id);
    if (!part.objectives.includes(objective)) errors.push(`Wrong objective: ${id}`);
    const single = part.tier || !['lander', 'science'].includes(part.category);
    const family = part.replaceGroup ?? (part.tier ? `geo-${part.family}` : part.category);
    if (single && familiesSeen.has(family)) errors.push(`Choose one option for ${family}`);
    if (single) familiesSeen.add(family);
    parts.push(part);
  }
  const credits = parts.reduce((sum, part) => sum + part.credits, 0);
  const massKg = parts.reduce((sum, part) => sum + part.massKg, 0);
  const scienceMassKg = parts.filter(part => part.category === 'science').reduce((sum, part) => sum + part.massKg, 0);
  if (credits > MOON_RULES.equipmentCredits) errors.push('Equipment exceeds its credit allocation.');
  if (massKg > MOON_RULES.equipmentMassKg) errors.push('Equipment exceeds its mass allocation.');
  if (objective === 'lunar-geology' && scienceMassKg > MOON_RULES.geologyScienceMassKg) errors.push('Geology science exceeds 100 kg.');
  return { parts, credits, massKg, scienceMassKg, potentialSP: parts.reduce((sum, part) => sum + part.potentialSP, 0), errors };
}

export function equipmentIds(preparation: PreparationSelection, objective: MoonObjective, _legacyGeologyIds: readonly string[] = []) {
  const installed = installedIds(preparation);
  return installed.filter(id => moonPart(id)?.objectives.includes(objective));
}
export function missingEquipment(report: EquipmentReport, objective: MoonObjective) {
  const ids = new Set(report.parts.map(part => part.id));
  const missing = WORKSHOP_PARTS.filter(part => part.category === 'lander' && !ids.has(part.id)).map(part => part.id);
  for (const category of ['rover', 'navigation', 'solar', 'battery', 'thermal', 'communication']) {
    if (!report.parts.some(part => part.category === category)) missing.push(category);
  }
  if (objective === 'lunar-ice') {
    for (const id of ['nss', 'nirvss', 'trident']) if (!ids.has(id)) missing.push(id);
  } else {
    if (!report.parts.some(part => part.id.startsWith('geo-camera-'))) missing.push('geology-camera');
    if (!report.parts.some(part => ['ir', 'xrf', 'xrd'].includes(part.family) && part.tier)) missing.push('geology-analysis');
    if (!report.parts.some(part => ['drill','sample'].includes(part.family) && part.tier)) missing.push('sample-collector');
  }
  return missing;
}

/** Examples use arithmetic from their parts, never the incorrect totals in the source table. */
export const GEOLOGY_LOADOUTS = Object.freeze({
  budget: ['geo-camera-basic','geo-ir-basic','geo-xrf-basic','geo-drill-basic'],
  balanced: ['geo-camera-balanced','geo-ir-balanced','geo-xrf-balanced','geo-xrd-balanced','geo-seismometer-basic'],
  deep: ['geo-ir-advanced','geo-xrf-advanced','geo-xrd-advanced','geo-gpr-balanced','geo-drill-advanced','geo-camera-balanced'],
});

export const CREW_CANDIDATES = [
  { id: 'commander', role: 'command', massKg: 85, credits: 80, supportUnits: 100, benefit: 'mission-coordination' },
  { id: 'geologist', role: 'science', massKg: 75, credits: 70, supportUnits: 90, benefit: 'geology-interpretation' },
  { id: 'astrobiologist', role: 'science', massKg: 70, credits: 75, supportUnits: 90, benefit: 'volatile-interpretation' },
  { id: 'robotics-specialist', role: 'support', massKg: 72, credits: 65, supportUnits: 85, benefit: 'rover-assistance' },
  { id: 'systems-engineer', role: 'support', massKg: 78, credits: 65, supportUnits: 90, benefit: 'systems-repair' },
] as const;
export type CrewId = typeof CREW_CANDIDATES[number]['id'];
export interface CrewAssignment { commander: 'commander'; scientist: CrewId | null; support: CrewId | null }
export const emptyCrew = (): CrewAssignment => ({ commander: 'commander', scientist: null, support: null });
export function crewReport(crew: CrewAssignment) {
  const members = [crew.commander, crew.scientist, crew.support].map(id => CREW_CANDIDATES.find(person => person.id === id));
  const complete = members[0]?.role === 'command' && members[1]?.role === 'science' && members[2]?.role === 'support';
  return { complete, massKg: members.reduce((sum, person) => sum + (person?.massKg ?? 0), 0),
    credits: members.reduce((sum, person) => sum + (person?.credits ?? 0), 0),
    supportUnits: members.reduce((sum, person) => sum + (person?.supportUnits ?? 0), 0),
    account: 'crew-allocation' as const, surface: [crew.commander, crew.scientist], orbit: crew.support };
}
/** Bounded authored abilities; they never override physical resource limits or scientific evidence. */
export function crewCapabilities(crew: CrewAssignment) {
  return { driveLoadMultiplier: crew.support === 'robotics-specialist' ? .9 as const : 1 as const,
    repairAdvice: crew.support === 'systems-engineer' ? ['power','thermal','communication'] as const : ['communication'] as const,
    interpretation: crew.scientist === 'geologist' ? 'minerals' as const : crew.scientist === 'astrobiologist' ? 'volatiles' as const : null };
}
