import type { SlotInterface } from '../types/mission';

export interface AssemblyRound {
  id: string;
  title: string;
  short: string;
  subtitle: string;
  lesson: string;
  ids: string[];
  challengeIds: string[];
  sceneGroup: 0 | 1 | 2;
  briefing: string[];
  successTitle: string;
  successLine: string;
  badge: string;
}

export const ASSEMBLY_ROUNDS: AssemblyRound[] = [
  {
    id: 'lift',
    title: 'Build the lift system',
    short: 'Lift',
    subtitle: 'Build the rocket’s strongest lower stages.',
    lesson: 'Start at the bottom with the strongest stage.',
    ids: ['stage-1-booster', 'interstage-1-2', 'stage-2-cryo'],
    challengeIds: ['stage-1-booster'],
    sceneGroup: 0,
    briefing: [
      'Start with the booster. It gives the biggest push.',
      'Add the connector and lighter second stage.'
    ],
    successTitle: 'The giant can stand!',
    successLine: 'Great! The lift system is ready.',
    badge: 'HEAVY-LIFT BUILDER'
  },
  {
    id: 'orbit',
    title: 'Reach parking orbit',
    short: 'Orbit',
    subtitle: 'Add the upper stage and rocket brain.',
    lesson: 'The guidance ring keeps every burn on course.',
    ids: ['interstage-2-3', 'stage-3-departure', 'instrument-unit-ring'],
    challengeIds: ['instrument-unit-ring'],
    sceneGroup: 0,
    briefing: [
      'Add the upper stage for orbital speed.',
      'Then add the guidance ring—the rocket’s brain.'
    ],
    successTitle: 'Orbit has a brain!',
    successLine: 'Nice! The rocket can steer toward orbit.',
    badge: 'ORBIT ENGINEER'
  },
  {
    id: 'lander',
    title: 'Pack the lunar lander',
    short: 'Lander',
    subtitle: 'Pack the lander and sample vault.',
    lesson: 'The lander goes down, then lifts the crew back up.',
    ids: ['stowed-lunar-payload', 'lunar-docking-adapter', 'sample-return-vault'],
    challengeIds: ['stowed-lunar-payload'],
    sceneGroup: 2,
    briefing: [
      'Pack the smaller craft that lands on the Moon.',
      'Add its docking adapter and sample vault.'
    ],
    successTitle: 'Moon craft packed!',
    successLine: 'Perfect! The lander and samples are packed.',
    badge: 'LUNAR ARCHITECT'
  },
  {
    id: 'crew',
    title: 'Protect the crew',
    short: 'Crew',
    subtitle: 'Add the cabin, life support and escape tower.',
    lesson: 'The command module brings the crew home.',
    ids: ['service-module-core', 'crew-capsule-command', 'launch-escape-tower', 'eclss-primary-scrubber'],
    challengeIds: ['crew-capsule-command', 'launch-escape-tower'],
    sceneGroup: 1,
    briefing: [
      'Give the crew air, power and a safe cabin.',
      'Add the escape tower for launch emergencies.'
    ],
    successTitle: 'Crew safety locked!',
    successLine: 'Crew cabin and safety systems are ready!',
    badge: 'CREW PROTECTOR'
  },
  {
    id: 'science',
    title: 'Power the mission',
    short: 'Science',
    subtitle: 'Add power, radio and Moon science tools.',
    lesson: 'Power and navigation keep the mission working.',
    ids: ['primary-flight-avionics', 'fuel-cell-power-bus', 'high-gain-comm-array', 'neutron-spectrometer', 'nav-context-camera'],
    challengeIds: ['neutron-spectrometer'],
    sceneGroup: 2,
    briefing: [
      'Add navigation, power and the radio.',
      'Then pack two tools that search for Moon ice.'
    ],
    successTitle: 'Spacecraft ready!',
    successLine: 'Amazing! All 18 systems are connected.',
    badge: 'MISSION DESIGNER'
  }
];

export const STORY_PART_IDS = ASSEMBLY_ROUNDS.flatMap(round => round.ids);

export const STORY_BUILD_INSTALLED_PARTS: Partial<Record<SlotInterface, string>> = {
  'booster-stage-1': 'stage-1-booster',
  'interstage-1': 'interstage-1-2',
  'booster-stage-2': 'stage-2-cryo',
  'interstage-2': 'interstage-2-3',
  'booster-stage-3': 'stage-3-departure',
  'instrument-unit': 'instrument-unit-ring',
  'lunar-payload-bay': 'stowed-lunar-payload',
  'service-module': 'service-module-core',
  'crew-capsule': 'crew-capsule-command',
  'launch-escape-system': 'launch-escape-tower',
  'eclss-bay': 'eclss-primary-scrubber',
  'avionics-bay': 'primary-flight-avionics',
  'power-bay': 'fuel-cell-power-bus',
  'comms-mast': 'high-gain-comm-array',
  'science-slot-1': 'neutron-spectrometer',
  'science-slot-2': 'sample-return-vault',
  'science-slot-4': 'nav-context-camera',
  'upgrade-slot-1': 'lunar-docking-adapter'
};

export const ASSEMBLY_CLUES: Record<string, { question: string; hint: string }> = {
  'stage-1-booster': {
    question: 'Which part gives the biggest push?',
    hint: 'Find the largest stage with many engines.'
  },
  'instrument-unit-ring': {
    question: 'Which part is the rocket’s brain?',
    hint: 'Find the thin guidance ring.'
  },
  'stowed-lunar-payload': {
    question: 'Which craft lands on the Moon?',
    hint: 'Find the gold two-stage lander.'
  },
  'crew-capsule-command': {
    question: 'Which cabin brings the crew home?',
    hint: 'Find the cone with a heat shield.'
  },
  'launch-escape-tower': {
    question: 'Which part pulls the crew away in an emergency?',
    hint: 'Find the tower at the very top.'
  },
  'neutron-spectrometer': {
    question: 'Which tool searches for Moon ice?',
    hint: 'Choose the neutron detector.'
  }
};
