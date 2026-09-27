// Mission Forge - Quick Launch Preconfigured Manifest
import { CrewRole, SlotInterface } from '../types/mission';

export const QUICK_LAUNCH_INSTALLED_PARTS: Record<SlotInterface, string> = {
  // Launch Vehicle Stack
  'booster-stage-1': 'stage-1-booster',
  'interstage-1': 'interstage-1-2',
  'booster-stage-2': 'stage-2-cryo',
  'interstage-2': 'interstage-2-3',
  'booster-stage-3': 'stage-3-departure',
  'instrument-unit': 'instrument-unit-ring',
  'lunar-payload-bay': 'stowed-lunar-payload',

  // Crew Spacecraft
  'service-module': 'service-module-core',
  'crew-capsule': 'crew-capsule-command',
  'launch-escape-system': 'launch-escape-tower',

  // Spacecraft Systems
  'eclss-bay': 'eclss-primary-scrubber',
  'avionics-bay': 'primary-flight-avionics',
  'power-bay': 'fuel-cell-power-bus',
  'comms-mast': 'high-gain-comm-array',

  // Science Payload
  'science-slot-1': 'neutron-spectrometer',
  'science-slot-2': 'nir-spectrometer',
  'science-slot-3': 'subsurface-drill',
  'science-slot-4': 'nav-context-camera',

  // Upgrades
  'upgrade-slot-1': 'aux-battery-pack',
  'upgrade-slot-2': 'precision-star-tracker'
};

export const QUICK_LAUNCH_CREW: Record<CrewRole, string> = {
  commander: 'marcus-vance',
  scientist: 'elena-rostova',
  engineer: 'aisha-al-mansoor'
};

export const QUICK_LAUNCH_DISCLOSURE = {
  title: 'Preconfigured Demonstration Manifest',
  summary: 'This manifest equips a fully qualified, flight-ready Lunar South Pole Ice Explorer with complete three-stage launch vehicle, mandatory crew life support, four primary science instruments (Neutron Spectrometer, NIR Spectrometer, Core Drill, Context Cameras), two upgrades (Aux Battery, Star Tracker), and a balanced crew of veteran astronauts.',
  siteId: 'ridge' as const,
  totalCost: 16400000, // $16.4M discretionary spend (within $20M allowance)
  scienceMass: 171 // 171 kg (within 250 kg allowance)
};
