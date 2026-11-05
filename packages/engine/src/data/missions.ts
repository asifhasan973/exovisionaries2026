// Mission Forge - Mission and Destination Definitions
import { DestinationId, MissionId } from '../types/mission';

export interface DestinationInfo {
  id: DestinationId;
  name: string;
  tagline: string;
  isPlayable: boolean;
  comingSoonReason?: string;
  description: string;
  targetDistance: string;
  surfaceGravity: string;
  atmosphere: string;
}

export interface MissionInfo {
  id: MissionId;
  destinationId: DestinationId;
  title: string;
  badgeSubtitle: string;
  isPlayable: boolean;
  comingSoonReason?: string;
  summary: string;
  briefingDialogue: string[];
  commanderCallout: string;
  primaryObjective: string;
  requiredPayloads: string[];
}

export const DESTINATIONS: Record<DestinationId, DestinationInfo> = {
  moon: {
    id: 'moon',
    name: 'Earth’s Moon (Luna)',
    tagline: 'The proving ground for deep space exploration and volatile resource recovery.',
    isPlayable: true,
    description: 'Target: South Pole-Aitken Basin periphery. Rich in water ice cold-traps, steep crater topography, and extreme thermal conditions.',
    targetDistance: '384,400 km',
    surfaceGravity: '1.62 m/s² (0.166 g)',
    atmosphere: 'Surface boundary exosphere (< 10⁻¹⁰ Pa)'
  },
  mars: {
    id: 'mars',
    name: 'Mars (The Red Planet)',
    tagline: 'Interplanetary exploration of ancient hydrological systems and potential biosignatures.',
    isPlayable: false,
    comingSoonReason: 'Mars interplanetary transit and entry/descent/landing will unlock in an upcoming expansion of Mission Forge.',
    description: 'Interplanetary trajectory requiring high delta-v departure stages and deep-space life support verification.',
    targetDistance: '225,000,000 km (avg)',
    surfaceGravity: '3.72 m/s² (0.38 g)',
    atmosphere: 'Thin CO2 atmosphere (~610 Pa)'
  }
};

export const MISSIONS: Record<MissionId, MissionInfo> = {
  'lunar-ice-explorer': {
    id: 'lunar-ice-explorer',
    destinationId: 'moon',
    title: 'Lunar South Pole Ice Explorer',
    badgeSubtitle: 'Crewed Expedition • Water-Ice Distribution',
    isPlayable: true,
    summary: 'Prepare and launch an expedition to investigate the accessibility and distribution of volatiles and subsurface water ice in the Moon’s south polar regions.',
    briefingDialogue: [
      'Commander, welcome to Mission Forge. Your expedition will pioneer long-duration science at the lunar south pole.',
      'We know volatiles exist in polar cold traps, but their concentration and accessibility remain unmapped.',
      'Commander, your crew needs a spacecraft that can carry the right science—not just reach the launch pad.',
      'Your task is to select an operational landing site concept, outfit the crew module with required life-support and science gear, verify your launch stack, and reach Earth parking orbit safely.'
    ],
    commanderCallout: '“Commander, your crew needs a spacecraft that can carry the right science—not just reach the launch pad.”',
    primaryObjective: 'Launch a 3-person crewed heavy-lift architecture into a 185-km circular Earth parking orbit equipped with hydrogen/ice spectrometer arrays and subsurface sampling systems.',
    requiredPayloads: ['neutron-spectrometer', 'nav-context-camera']
  },
  'lunar-geology': {
    id: 'lunar-geology',
    destinationId: 'moon',
    title: 'Moon Geology & Regolith Explorer',
    badgeSubtitle: 'Crewed Expedition • Impact Basin Stratigraphy',
    isPlayable: false,
    comingSoonReason: 'The Moon Geology & Regolith Explorer mission is scheduled for Phase 2 development.',
    summary: 'Deep core sampling and petrological investigation of the South Pole-Aitken basin ejecta blanket.',
    briefingDialogue: [],
    commanderCallout: '',
    primaryObjective: 'Investigate ancient lunar mantle exposures and crater central peak stratigraphy.',
    requiredPayloads: []
  },
  'lunar-volcanic': {
    id: 'lunar-volcanic',
    destinationId: 'moon',
    title: 'Moon Volcanic Features & Pyroclastics',
    badgeSubtitle: 'Crewed Expedition • Ancient Volcanism',
    isPlayable: false,
    comingSoonReason: 'The Moon Volcanic Features & Pyroclastics mission will be available in a future Mission Forge chapter.',
    summary: 'Exploration of lunar sinuous rilles, volcanic domes, and dark mantle pyroclastic deposits.',
    briefingDialogue: [],
    commanderCallout: '',
    primaryObjective: 'Analyze pyroclastic glass beads for mantle-derived volatile signatures.',
    requiredPayloads: []
  }
};
