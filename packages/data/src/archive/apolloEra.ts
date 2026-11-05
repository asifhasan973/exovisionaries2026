import type { NasaMissionEvent } from './types';

export const APOLLO_ERA_EVENTS: NasaMissionEvent[] = [
// 1969
  {
    id: 'apollo-11',
    year: 1969,
    title: 'Apollo 11 — First Human Moon Landing',
    period: 'Jul 16 – 24, 1969',
    duration: '8 days 3 hours (2h 31m on Moon)',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~thumb.jpg',
    description: 'Neil Armstrong and Buzz Aldrin landed the Lunar Module Eagle at the Sea of Tranquility, making "one giant leap for mankind" while Michael Collins orbited above.',
    highlights: ['First humans to set foot on another celestial body', 'Collected 21.55 kg of lunar rock and soil', 'Observed by over 650 million viewers worldwide'],
    nasaUrl: 'https://www.nasa.gov/mission/apollo-11/'
  },
  {
    id: 'apollo-12',
    year: 1969,
    title: 'Apollo 12 — Precision Landing in Ocean of Storms',
    period: 'Nov 14 – 24, 1969',
    duration: '10 days 4 hours',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/as12-48-7099/as12-48-7099~thumb.jpg',
    description: 'Pete Conrad and Alan Bean performed a pinpoint lunar touchdown within walking distance of the Surveyor 3 robotic probe, recovering scientific parts.',
    highlights: ['Precision touchdown 180m from Surveyor 3 probe', 'Deployed first full ALSEP scientific instrument package', 'Conducted 2 Moonwalks totalling 7h 45m'],
    nasaUrl: 'https://www.nasa.gov/mission/apollo-12/'
  },
  {
    id: 'mariner-6-7',
    year: 1969,
    title: 'Mariner 6 & 7 — Dual Close Mars Reconnaissance',
    period: 'Feb – Aug 1969',
    duration: '6 months transit',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA02973/PIA02973~thumb.jpg',
    description: 'Dual spacecraft photographed Mars’s south polar cap and equator, measuring atmospheric composition and temperature.',
    highlights: ['Returned 201 close-up photographs', 'Confirmed polar caps are primarily solid frozen CO2', 'Covered 20% of Martian terrain'],
    nasaUrl: 'https://www.nasa.gov/mission/mariner-6/'
  },

  // 1970
  {
    id: 'apollo-13',
    year: 1970,
    title: 'Apollo 13 — "Houston, We’ve Had a Problem" Survival',
    period: 'Apr 11 – 17, 1970',
    duration: '5 days 22 hours',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/as13-59-8500/as13-59-8500~thumb.jpg',
    description: 'An oxygen tank exploded en route to the Moon. Through ingenuity, ground controllers converted the Lunar Module Aquarius into a lifeboat, safely returning all three crew.',
    highlights: ['Used lunar gravity assist slingshot trajectory', 'Improvised CO2 lithium hydroxide filter adapter', 'Triumph of aerospace engineering under crisis'],
    nasaUrl: 'https://www.nasa.gov/mission/apollo-13/'
  },

  // 1972
  {
    id: 'pioneer-10',
    year: 1972,
    title: 'Pioneer 10 Launch — First to Outer Solar System',
    period: 'Mar 2, 1972',
    duration: '31 years active mission',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA01475/PIA01475~thumb.jpg',
    description: 'Pioneer 10 was the first spacecraft to navigate the Asteroid Belt and head for Jupiter, carrying the iconic Pioneer Golden Plaque greeting extraterrestrials.',
    highlights: ['First human-made craft to traverse Asteroid Belt', 'First craft to reach Jupiter escape velocity', 'Carries Carl Sagan’s pictorial interstellar plaque'],
    nasaUrl: 'https://www.nasa.gov/mission/pioneer-10/'
  },
  {
    id: 'apollo-17',
    year: 1972,
    title: 'Apollo 17 — Final Apollo Lunar Surface Expedition',
    period: 'Dec 7 – 19, 1972',
    duration: '12 days 13 hours (75h on Moon)',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/as17-148-22727/as17-148-22727~thumb.jpg',
    description: 'Gene Cernan and geologist Harrison Schmitt spent over 3 days in Taurus-Littrow valley, driving the Lunar Rover 35.7 km and collecting orange volcanic soil.',
    highlights: ['Longest lunar stay: 75 hours on surface', 'Returned 110.5 kg of lunar samples including orange soil', 'Captured the famous "Blue Marble" whole-Earth photo'],
    nasaUrl: 'https://www.nasa.gov/mission/apollo-17/'
  },

  // 1973
  {
    id: 'skylab-station',
    year: 1973,
    title: 'Skylab — First American Orbital Space Station',
    period: 'May 14, 1973 – Feb 8, 1974',
    duration: '3 crewed missions (171 days total)',
    category: 'Infrastructure',
    thumbnail: 'https://images-assets.nasa.gov/image/sl3-114-1682/sl3-114-1682~thumb.jpg',
    description: 'A converted Saturn V third stage became America’s first orbital laboratory. Astronauts repaired a damaged micrometeoroid shield and conducted long-duration biology and solar research.',
    highlights: ['Proved humans can thrive for 84 consecutive days in orbit', 'Observed solar flares with Apollo Telescope Mount', 'First in-space emergency sunshade repair'],
    nasaUrl: 'https://www.nasa.gov/mission/skylab/'
  },
  {
    id: 'pioneer-10-jupiter',
    year: 1973,
    title: 'Pioneer 10 — First Close Encounter with Jupiter',
    period: 'Dec 3, 1973',
    duration: 'Flyby closest approach',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA01476/PIA01476~thumb.jpg',
    description: 'Pioneer 10 swept within 130,000 km of Jupiter’s cloud tops, mapping its ferocious magnetic radiation belts and photographing the Great Red Spot.',
    highlights: ['Took first high-resolution pictures of Jupiter', 'Discovered Jovian radiation is 10,000x Earth levels', 'Charted Galilean moons Io, Europa, Ganymede, Callisto'],
    nasaUrl: 'https://www.nasa.gov/mission/pioneer-10/'
  },

  // 1975
  {
    id: 'apollo-soyuz',
    year: 1975,
    title: 'Apollo-Soyuz Test Project — First International Handshake',
    period: 'Jul 15 – 24, 1975',
    duration: '9 days mission (44 hours docked)',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/S74-17843/S74-17843~thumb.jpg',
    description: 'An Apollo Command Module docked with a Soviet Soyuz capsule in orbit. Astronauts Thomas Stafford and Alexey Leonov exchanged a historic handshake through the docking tunnel.',
    highlights: ['First joint US-Soviet space mission', 'Universal docking system engineering breakthrough', 'Ended the Space Race through scientific cooperation'],
    nasaUrl: 'https://www.nasa.gov/history/apollo-soyuz-test-project/'
  },
  {
    id: 'viking-1-launch',
    year: 1975,
    title: 'Viking 1 Launch to Mars',
    period: 'Aug 20, 1975',
    duration: '10-month interplanetary cruise',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA10738/PIA10738~thumb.jpg',
    description: 'Viking 1 launched from Titan IIIE/Centaur towards Mars equipped with an orbiter and biological life-detection surface lander.',
    highlights: ['Twin orbiter-lander architecture', 'Automated biological chemistry labs', 'Paved the way for modern robotic surface operations'],
    nasaUrl: 'https://www.nasa.gov/mission/viking-1/'
  }
];
