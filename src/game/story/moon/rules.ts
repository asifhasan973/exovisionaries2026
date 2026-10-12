import { SCRIPT_RESOURCES } from '../design.ts';

/** These are balancing rules, not NASA hardware specifications or flight certification. */
export const MOON_RULES = Object.freeze({
  version: 1,
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
  grossMassKg: null,
  propellantKg: null,
  lifeSupportWh: null,
  explanation: 'Supplied game architecture, separately accounted from the equipment kit. Gross mass, propellant and life support must be modeled before crewed departure is enabled.',
});

/** Later modules enable their own gates only after implementing and validating their gameplay. */
export const MOON_IMPLEMENTED = Object.freeze({ crewDeparture: false, journey: false, landing: false, surface: false, return: false });

export const MOON_ASSUMPTIONS = [
  'Credits, lightweight equipment allocations, crew support units and upgrade tiers are authored game values.',
  'The 1,000-credit / 350-kg kit allocation excludes crew bodies and the supplied full-size human spacecraft; crew has a separate 240-credit roster allocation.',
  'The geology 100-kg limit is a science sub-limit, not another free 1,000-credit budget.',
  'Battery energy is Wh; instantaneous loads are W. The 450-W discharge ceiling and 20% reserve are game rules.',
  'A rehearsal conservatively runs all rover loads for 15 minutes plus drilling. Actual operating modes select active loads.',
  'Hydrogen is a clue, not confirmed water. Instruments, samples and valid observations determine earned science.',
  'More mass can reduce available delta-v at fixed fuel; it does not increase required delta-v for the same maneuver.',
  'Platform mass, propellant, supply duration, terrain geometry and thermal survival are not validated by Module 1.',
] as const;
