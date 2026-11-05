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
    title: 'NASA OIG Artemis Operating-Cost Reference',
    publisher: 'NASA Office of Inspector General',
    url: 'https://oig.nasa.gov/audits/ig-22-003/',
    scope: 'Published $4.1B per-flight reference: SLS $2.2B, Orion $1.0B, ESA service module $300M, and Exploration Ground Systems $568M',
    caveat: 'The fixed mission estimate uses this published program-level reference. Individual science-tool prices are labeled educational planning estimates because public supplier prices are generally unavailable.'
  },
  {
    id: 'apollo-duration',
    category: 'NASA Reference',
    title: 'Apollo 11 Mission Overview',
    publisher: 'NASA History Office',
    url: 'https://www.nasa.gov/history/apollo-11-mission-overview/',
    scope: 'Apollo 11 crew of three and mission duration of 8 days, 3 hours, 18 minutes',
    caveat: 'The game uses Apollo 11’s roughly 8-day mission as its minimum planning baseline. It is an educational starting point, not a universal minimum or launch approval rule.'
  },
  {
    id: 'crew-consumables',
    category: 'NASA Reference',
    title: 'Human Needs on Space Missions',
    publisher: 'NASA Technical Reports Server',
    url: 'https://ntrs.nasa.gov/api/citations/20220002574/downloads/SpaceHabitatEPO-final%20version_2_16.pdf',
    scope: 'Food, drinking water, food-preparation water, oxygen and clothing mass per crew member per day',
    caveat: 'The game combines the published daily values and adds a small packing margin. It does not model every recycled water stream or reserve case.'
  },
  {
    id: 'orion-capacity',
    category: 'NASA Reference',
    title: 'Orion Spacecraft Overview',
    publisher: 'NASA',
    url: 'https://www.nasa.gov/humans-in-space/orion-spacecraft/orion-overview/',
    scope: 'Modern reference for a four-person spacecraft capable of missions up to 21 days',
    caveat: 'Zero To Beyond uses an Apollo-inspired three-seat crew and Orion’s published 21-day planning limit.'
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
