import { SCRIPT_RESOURCES } from '@/game/moon/core/design';

/** These are balancing rules, not NASA hardware specifications or flight certification. */
export const MOON_RULES = Object.freeze({
  version: 3,
  equipmentCredits: SCRIPT_RESOURCES.budgetCredits,
  equipmentMassKg: SCRIPT_RESOURCES.payloadMassLimitKg,
  equipmentPeakW: SCRIPT_RESOURCES.peakPowerLimitW,
  geologyScienceMassKg: 100,
  crewCredits: 240,
  crewSlots: 3,
  surfaceCrewSlots: 2,
  reserveFraction: .2,
  rehearsalTravelSeconds: 15 * 60,
  drillSecondsPer10Cm: 30,
});

export const MOON_SOURCES = Object.freeze({
  script: 'https://docs.google.com/document/d/14OlD6AqRhN-i2wRsvcLuLBGgkDYLVBCeYxlHJytqwvg/edit?tab=t.ndqefx7tshay',
  instruments: 'https://science.nasa.gov/mission/viper/rover-and-instruments/',
  operations: 'https://science.nasa.gov/mission/viper/lunar-operations/',
  apollo: 'https://www.nasa.gov/the-apollo-program/',
  propulsion: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/',
});

export const CREW_PLATFORM = Object.freeze({
  id: 'apollo-inspired-game-platform-v1',
  supplied: true,
  crewCapacity: 3,
  surfaceCapacity: 2,
  included: ['command-service-spacecraft', 'crewed-descent-stage', 'lunar-ascent-stage',
    'life-support', 'return-heat-shield', 'earth-parachutes'] as const,
  explanation: 'Apollo-inspired game architecture with three crew, a lunar lander and an Earth-return capsule. Geology charges these standard systems in one mission ledger; Ice retains its earlier kit and crew allocations. Flight masses and resources use authored simulation inputs.',
});

/** Later modules enable their own gates only after implementing and validating their gameplay. */
export const MOON_IMPLEMENTED = Object.freeze({ readiness: true, crewDeparture: true, journey: true, landing: true, surface: true, iceScience: true, geologyScience: true, incidents: true, return: true });

export const MOON_ASSUMPTIONS = [
  'Credits, lightweight equipment allocations, crew support units and upgrade tiers are authored game values.',
  'The Ice mission keeps its 1,000-credit equipment kit and separate 240-credit crew roster allocation.',
  'The Geology mission uses one fictional 10,000-MC ledger for platform, launch, crew systems, rover, power, science and upgrades. Base hardware is charged once.',
  'The Geology 100-kg science limit is a payload sub-limit; the existing 350-kg Moon equipment mass cap still applies.',
  'Geology fuel units are fictional planning points. The flight simulator maps a chosen pack to its authored service-propellant mass and still checks route and return feasibility.',
  'Battery energy is Wh; instantaneous loads are W. The 450-W discharge ceiling and 20% reserve are game rules.',
  'A rehearsal conservatively runs all rover loads for 15 minutes plus drilling, or 60 seconds collecting a surface sample. Actual operating modes select active loads.',
  'Hydrogen is a clue, not confirmed water. Instruments, samples and valid observations determine earned science.',
  'More mass can reduce available delta-v at fixed fuel; it does not increase required delta-v for the same maneuver.',
  'Platform mass, propellant, supply duration, terrain and thermal thresholds are simplified authored game models, not validated Apollo hardware or flight certification.',
] as const;
