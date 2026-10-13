/** Capability references, not a claim that our balancing numbers are NASA specs. */
export const MISSION_SOURCES = [
  { id: 'apollo', title: 'Apollo: crew, rover & return', url: 'https://www.nasa.gov/missions/apollo/apollo-17-mission-details/', use: 'Crewed lunar exploration with a rover; ascent, rendezvous and return architecture.' },
  { id: 'return', title: 'Apollo 17 heads home', url: 'https://www.nasa.gov/history/50-years-ago-apollo-17-heads-home-to-earth/', use: 'Surface crew rejoin the orbiting crew before travelling back to Earth.' },
  { id: 'viper', title: 'VIPER instruments', url: 'https://science.nasa.gov/mission/viper/rover-and-instruments/', use: 'NSS hydrogen clues, NIRVSS spectra, TRIDENT cuttings and MSolo gas measurements.' },
  { id: 'operations', title: 'VIPER lunar operations', url: 'https://science.nasa.gov/mission/viper/lunar-operations/', use: 'Planning around sunlight, energy, cold terrain and communication.' },
  { id: 'water', title: 'Moon water & ice', url: 'https://science.nasa.gov/moon/moon-water-and-ices/', use: 'Polar ice evidence and the difference between a clue and confirmation.' },
  { id: 'rocks', title: 'Moon composition', url: 'https://science.nasa.gov/moon/composition/', use: 'Lunar rock and mineral context. The game’s sample signals are authored.' },
  { id: 'xray', title: 'X-ray element & crystal analysis', url: 'https://heasarc.gsfc.nasa.gov/docs/nicer/technology/spinoffs/materials-analysis.html', use: 'X-ray fluorescence and diffraction distinguish elements from crystal structure.' },
  { id: 'rocket', title: 'Ideal rocket equation', url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/', use: 'Fuel and mass calculations use this equation; our maneuver allowances are game inputs.' },
] as const;

export const MODEL_BOUNDARIES = [
  { title: 'Game money, not real prices', text: 'Credits, part masses, W/Wh values, crew bonuses and upgrade tiers are game allocations.' },
  { title: 'Practice, not a real discovery', text: 'Sites, rocks, readings, incidents and science points are simulated. No live NASA terrain or instrument dataset is queried.' },
  { title: 'A teaching spacecraft', text: 'The supplied three-person spacecraft uses authored fuel, mass and cabin accounts. Crew mass is separate from the 350-kg equipment kit.' },
  { title: 'Simplified flight', text: 'Burn allowances, landing terrain, docking tolerances, heat shielding and parachute gates teach a sequence; they are not a certified trajectory or thermal forecast.' },
  { title: 'Safe return reserve', text: 'The 20% battery reserve, cold-exposure limits, day kits and radiation shelter rules are game thresholds.' },
  { title: 'Honest demo results', text: 'Assisted chapters and auto-build are labeled. Science comes from performed measurements; crew recovery comes from splashdown.' },
] as const;
