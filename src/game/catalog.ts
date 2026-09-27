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
 'stage-3-departure':'Orbit engine','instrument-unit-ring':'Rocket brain','stowed-lunar-payload':'Moon cargo',
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
 'stowed-lunar-payload':'Our Moon equipment travels safely inside this shell.',
 'service-module-core':'The crew needs supplies, power and a small engine.',
 'crew-capsule-command':'A safe little home for three brave astronauts!',
 'launch-escape-tower':'This tower can pull the capsule away in an emergency.',
 'eclss-primary-scrubber':'Clean air helps our astronauts breathe.',
 'primary-flight-avionics':'This computer helps the crew navigate.',
 'fuel-cell-power-bus':'Fuel cells turn chemical energy into electricity.',
 'high-gain-comm-array':'Now our crew can talk to mission control!',
 'neutron-spectrometer':'This detector finds clues to hydrogen, which can point to water ice.',
 'nav-context-camera':'Pictures help scientists map the ground around an ice clue.'
 ,'lunar-docking-adapter':'The docking ring makes a sealed bridge between two spacecraft.',
 'surface-comm-beacon':'A relay helps the crew talk around crater walls and ridges.',
 'eva-suit-support-kit':'This kit keeps Moon suits powered, sealed and ready for dusty work.',
 'sample-return-vault':'The sealed vault protects precious Moon samples on the way home.',
 'laser-retroreflector':'Earth scientists can bounce lasers from this mirror for decades.',
 'passive-seismometer':'Tiny ground vibrations reveal what the Moon is like inside.',
 'thermal-control-field-kit':'Heaters and blankets protect tools from hot sunlight and cold shadow.',
 'lunar-navigation-beacon':'A local beacon helps explorers navigate where there is no GPS.'
};
export function partName(id:string) { return shortNames[id] || id.split('-').map(w=>w[0]?.toUpperCase()+w.slice(1)).join(' '); }
