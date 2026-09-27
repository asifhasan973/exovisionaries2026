// Mission Forge - Sources, Citations and Assumptions
export interface CitationItem {
  id: string;
  category: 'NASA Reference' | 'Architecture History' | 'Science & Sensors' | 'Budget & Assumptions';
  title: string;
  publisher: string;
  url?: string;
  scope: string;
  caveat: string;
}

export const SOURCES_DATA: CitationItem[] = [
  {
    id: 'apollo-10',
    category: 'Architecture History',
    title: '50 Years Ago: Apollo 10 to Sort Out the Unknowns',
    publisher: 'NASA History Division',
    url: 'https://www.nasa.gov/history/50-years-ago-apollo-10-to-sort-out-the-unknowns/',
    scope: 'Ascent timeline, Earth parking orbit staging, and pre-TLI checkout protocol',
    caveat: 'Historical Apollo 10 parked in a circular 185 km orbit while still attached to the S-IVB third stage. Translunar injection occurred as a distinct second burn ~1.5 orbits later.'
  },
  {
    id: 'saturn-v-profile',
    category: 'NASA Reference',
    title: 'Saturn V Flight Evaluation & Step-by-Step Trajectory',
    publisher: 'NASA Marshall Space Flight Center',
    url: 'https://www.nasa.gov/wp-content/uploads/static/history/afj/pdf/saturn-V-step-by-step.pdf',
    scope: 'Staging altitudes, velocities, staging times, and escape tower jettison',
    caveat: 'Used for educational flight events in this game. Real rocket trajectories vary based on payload mass, launch azimuth, atmospheric density, and flight safety constraints.'
  },
  {
    id: 'apollo-spacecraft',
    category: 'Architecture History',
    title: 'Apollo Program Spacecraft Architecture (CM, SM, LM)',
    publisher: 'NASA National Air and Space Museum',
    url: 'https://www.nasa.gov/the-apollo-program/',
    scope: 'Three-seat command module, service module life-support and propulsion integration',
    caveat: 'Historical lunar module supported 2 crew on surface; Mission Forge models a generic modern 3-person heavy-lift architecture.'
  },
  {
    id: 'lunar-ice-science',
    category: 'Science & Sensors',
    title: 'Volatiles Investigating Polar Exploration Rover (VIPER) Science Payload',
    publisher: 'NASA Ames Research Center',
    url: 'https://science.nasa.gov/mission/viper/',
    scope: 'Neutron spectrometer (NSS), NIR spectrometer (NIRVSS), MSolo mass spectrometer, and TRIDENT drill specs',
    caveat: 'Sensor masses, power ratings, and sampling capabilities adapt VIPER instruments for educational spacecraft integration. Instrument presence alone does not guarantee ice discovery.'
  },
  {
    id: 'planning-budget',
    category: 'Budget & Assumptions',
    title: 'Educational Planning Budget Model ($2,620M Game Cap)',
    publisher: 'Exovisionaries Game Design Model',
    scope: 'Authored game cost allocation tree (Launch vehicle $1,400M, Crew Capsule $350M, SM $180M, Lander $300M, Integration $100M, Ground Ops $70M, Reserve $200M, Discretionary $20M)',
    caveat: 'Authored educational cost caps, explicitly NOT actual government or commercial vendor price quotes. Subsystem costs use authentic orders of magnitude without claiming commercial price verification.'
  },
  {
    id: 'moon-polar-env',
    category: 'NASA Reference',
    title: 'NASA Lunar Reconnaissance Orbiter (LRO) Polar Environmental Data',
    publisher: 'NASA Goddard Space Flight Center',
    url: 'https://science.nasa.gov/moon/facts/',
    scope: 'Illumination maps, cryogenic temperatures in PSRs, crater rim topography',
    caveat: 'Site concepts are illustrative planning models, not certified real-time landing coordinates or definitive terrain hazard maps.'
  }
];
