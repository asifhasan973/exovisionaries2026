import type { SlotInterface } from '../types/mission';

export const CORE_SLOTS: SlotInterface[] = ['booster-stage-1','interstage-1','booster-stage-2','interstage-2','booster-stage-3','instrument-unit','lunar-payload-bay','service-module','crew-capsule','launch-escape-system'];
export const SYSTEM_SLOTS: SlotInterface[] = ['eclss-bay','avionics-bay','power-bay','comms-mast'];
export const MOON_MISSION_PARTS = [
 'neutron-spectrometer','nav-context-camera','nir-spectrometer','subsurface-drill','mass-spectrometer','radiation-monitor',
 'lunar-docking-adapter','surface-comm-beacon','eva-suit-support-kit','sample-return-vault','laser-retroreflector',
 'passive-seismometer','thermal-control-field-kit','lunar-navigation-beacon','aux-battery-pack','redundant-transceiver',
 'precision-star-tracker','modular-spare-kit'
];
export const MARS_PREVIEW_PARTS = [
 {id:'mars-aeroshell',name:'Mars Entry Aeroshell',note:'Heat protection for high-speed atmospheric entry'},
 {id:'supersonic-parachute',name:'Supersonic Parachute',note:'Slows a heavy vehicle in thin Martian air'},
 {id:'powered-descent-stage',name:'Powered Descent Stage',note:'Engines finish the landing after atmospheric braking'},
 {id:'moxie-oxygen-plant',name:'MOXIE Oxygen Plant',note:'Makes oxygen from the carbon-dioxide atmosphere'},
 {id:'radiation-shelter',name:'Deep-Space Radiation Shelter',note:'Protects crew during the long interplanetary cruise'},
 {id:'mars-ascent-vehicle',name:'Mars Ascent Vehicle',note:'Launches the crew from Mars back to orbit'}
];
export const shortNames: Record<string, string> = {
 'stage-1-booster':'Booster','interstage-1-2':'Big connector','stage-2-cryo':'Second stage','interstage-2-3':'Small connector',
 'stage-3-departure':'Orbit engine','instrument-unit-ring':'Rocket brain','stowed-lunar-payload':'Two-stage lunar lander',
 'service-module-core':'Service module','crew-capsule-command':'Crew capsule','launch-escape-tower':'Escape tower',
 'eclss-primary-scrubber':'Air recycler','primary-flight-avionics':'Flight computer','fuel-cell-power-bus':'Fuel cells','high-gain-comm-array':'Radio dish',
 'neutron-spectrometer':'Ice detector','nav-context-camera':'Mapping camera','subsurface-drill':'Moon drill','mass-spectrometer':'Gas detective',
 'nir-spectrometer':'Light scanner','radiation-monitor':'Radiation sensor','aux-battery-pack':'Extra battery','redundant-transceiver':'Backup radio',
 'precision-star-tracker':'Star tracker','modular-spare-kit':'Repair kit'
 ,'lunar-docking-adapter':'Docking ring','surface-comm-beacon':'Surface relay','eva-suit-support-kit':'EVA suit kit','sample-return-vault':'Sample vault',
 'laser-retroreflector':'Laser mirror','passive-seismometer':'Moonquake sensor','thermal-control-field-kit':'Thermal kit','lunar-navigation-beacon':'Nav beacon'
};
export const partLesson: Record<string,string> = {
 'stage-1-booster':'Five big engines give us our first push off Earth!',
 'interstage-1-2':'This strong ring joins our first two stages.',
 'stage-2-cryo':'A lighter stage keeps pushing when the booster is empty.',
 'interstage-2-3':'A smaller connector joins the next stage.',
 'stage-3-departure':'This engine gives us the speed to circle Earth.',
 'instrument-unit-ring':'The rocket brain helps us follow the right path.',
 'stowed-lunar-payload':'One stage lands; the other lifts off.',
 'service-module-core':'The crew needs supplies, power and a small engine.',
 'crew-capsule-command':'A safe cabin for three astronauts.',
 'launch-escape-tower':'This tower can pull the capsule away in an emergency.',
 'eclss-primary-scrubber':'Clean air helps our astronauts breathe.',
 'primary-flight-avionics':'This computer helps the crew navigate.',
 'fuel-cell-power-bus':'Fuel cells turn chemical energy into electricity.',
 'high-gain-comm-array':'Now our crew can talk to mission control!',
 'neutron-spectrometer':'Hydrogen clues can point to water ice.',
 'nav-context-camera':'Pictures map the ground around ice clues.'
 ,'lunar-docking-adapter':'The ring joins two spacecraft safely.',
 'surface-comm-beacon':'A relay sends signals around crater walls.',
 'eva-suit-support-kit':'This kit keeps Moon suits ready.',
 'sample-return-vault':'The vault protects Moon samples.',
 'laser-retroreflector':'Earth can bounce lasers from this mirror.',
 'passive-seismometer':'Moonquakes reveal the Moon’s inside.',
 'thermal-control-field-kit':'Heaters protect tools from extreme temperatures.',
 'lunar-navigation-beacon':'A beacon guides explorers without GPS.'
};
export function partName(id:string) { return shortNames[id] || id.split('-').map(w=>w[0]?.toUpperCase()+w.slice(1)).join(' '); }
