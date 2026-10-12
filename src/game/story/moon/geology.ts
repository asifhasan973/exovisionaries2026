import type { ScriptComponent } from '../design.ts';

export type ScienceFamily = 'camera' | 'ir' | 'xrf' | 'xrd' | 'seismometer' | 'gpr' | 'sample';
export const GEOLOGY_FAMILIES: readonly ScienceFamily[] = ['camera', 'ir', 'xrf', 'sample', 'xrd', 'gpr', 'seismometer'];
export const SCIENCE_FAMILY_NAMES: Record<ScienceFamily, string> = {
  camera: 'Camera', ir: 'Rock scanner', xrf: 'Elements', sample: 'Sample tools', xrd: 'Crystals', gpr: 'Layers', seismometer: 'Moonquakes',
};
export interface GeologyPart extends ScriptComponent {
  massKg: number; credits: number; nominalPowerW: number; scienceFamily: ScienceFamily;
  replaceGroup: string; tier: 'basic' | 'balanced' | 'advanced'; objective: 'lunar-geology';
  description: string; assumption: string; needsSample?: boolean; detailLevel: number; capability: string;
}
const rows = [
  ['ir','Rock scanner',[[8,60,20,8],[12,100,35,15],[16,160,50,22]],'Uses light to spot different kinds of rock.','Finer mineral clues'],
  ['xrf','Element scanner',[[5,45,15,6],[8,80,25,12],[12,130,40,18]],'Looks for the tiny building blocks inside rocks.','More element detail'],
  ['xrd','Crystal lab',[[7,75,25,10],[10,120,40,18],[14,190,60,26]],'Tests a collected sample to identify its minerals.','Clearer crystal patterns'],
  ['seismometer','Moonquake sensor',[[4,50,4,8],[6,90,8,16],[9,150,12,23]],'Listens for tiny shakes after you place it on the ground.','Fainter shakes detected'],
  ['gpr','Layer radar',[[12,90,35,11],[18,150,60,20],[25,230,90,29]],'Uses radio echoes to look for layers under your wheels.','More layer detail'],
  ['camera','Science camera',[[2,20,5,4],[4,40,12,8],[7,75,20,13]],'Photographs rocks so you can choose a good target.','Sharper rock pictures'],
  ['drill','Sample drill',[[15,100,30,10],[25,170,50,18],[35,260,80,27]],'Collects soil from below the surface.','Reach deeper samples'],
] as const;
const tiers = ['basic','balanced','advanced'] as const;
export const GEOLOGY_PARTS: readonly GeologyPart[] = [...rows.flatMap(([family,name,values,description,capability]) => values.map(([massKg,credits,nominalPowerW,scienceBonus],index): GeologyPart => ({
  id: `geo-${family}-${tiers[index]}`, name: `${tiers[index][0].toUpperCase()}${tiers[index].slice(1)} ${name}`,
  category: 'science', scienceFamily: family === 'drill' ? 'sample' : family, replaceGroup: `geo-${family === 'drill' ? 'sample' : family}`,
  tier: tiers[index], objective: 'lunar-geology', massKg, credits, nominalPowerW, scienceBonus,
  description, capability: family === 'drill' ? `Up to ${[30,60,100][index]} cm` : `${capability} · level ${index + 1}`,
  detailLevel: index + 1, needsSample: family === 'xrd', maxDepthCm: family === 'drill' ? [30,60,100][index] : undefined,
  assumption: 'Numeric tiers, detail levels and drill depth limits are illustrative game upgrades, not verified NASA flight specifications. Science is earned only after successful use.',
}))), {
  id: 'geo-scoop-basic', name: 'Surface scoop', category: 'science', scienceFamily: 'sample', replaceGroup: 'geo-sample', tier: 'basic',
  objective: 'lunar-geology', massKg: 3, credits: 20, nominalPowerW: 5, scienceBonus: 3, detailLevel: 1,
  description: 'Picks up a surface sample for your rock lab.', capability: 'Surface samples · no deep drilling',
  assumption: 'The source requires sample handling but omits this option. The 3 kg, 20 credits and 5 W are authored game estimates.',
}];
export const geologyPart = (id: string) => GEOLOGY_PARTS.find(part => part.id === id);
export function geologyMissing(ids: readonly string[]) {
  const parts = ids.map(geologyPart).filter((part): part is GeologyPart => !!part);
  const missing: ScienceFamily[] = [];
  if (!parts.some(part => part.scienceFamily === 'camera')) missing.push('camera');
  if (!parts.some(part => ['ir','xrf','xrd'].includes(part.scienceFamily))) missing.push('ir');
  if (!parts.some(part => part.scienceFamily === 'sample')) missing.push('sample');
  return missing;
}
