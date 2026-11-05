import type { NasaMissionEvent } from './types';

export const ARTEMIS_ERA_EVENTS: NasaMissionEvent[] = [
// 2021
  {
    id: 'perseverance-landing',
    year: 2021,
    title: 'Perseverance Rover Lands in Jezero Crater',
    period: 'Feb 18, 2021 – Present',
    duration: '3+ years active exploration',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA24427/PIA24427~thumb.jpg',
    description: 'Perseverance executed a flawless automated touchdown in Jezero Crater using Terrain-Relative Navigation, targeting an ancient river delta deposit.',
    highlights: ['Successfully landed in rugged Jezero Crater delta', 'Produced breathable oxygen from Martian CO2 using MOXIE', 'Has sealed 24+ geological sample cores in titanium tubes'],
    nasaUrl: 'https://science.nasa.gov/mission/mars-2020-perseverance/'
  },
  {
    id: 'ingenuity-flight',
    year: 2021,
    title: 'Ingenuity Helicopter — First Powered Flight on Another Planet',
    period: 'Apr 19, 2021 – Jan 25, 2024',
    duration: '72 flights (designed for 5)',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA24497/PIA24497~thumb.jpg',
    description: 'Ingenuity spun its counter-rotating carbon blades at 2,500 RPM in Mars’s ultra-thin atmosphere (1% of Earth’s), soaring 3 meters high for 39 seconds.',
    highlights: ['First powered controlled flight on an extraterrestrial world', 'Flew 72 times, logging 128.8 flight minutes and 17 km distance', 'Paved the way for future aerial planetary exploration'],
    nasaUrl: 'https://science.nasa.gov/mission/ingenuity/'
  },
  {
    id: 'jwst-launch',
    year: 2021,
    title: 'James Webb Space Telescope (JWST) Launch',
    period: 'Dec 25, 2021',
    duration: '29-day deployment to Sun-Earth L2',
    category: 'Astrophysics',
    thumbnail: 'https://images-assets.nasa.gov/image/NHQ202112250005/NHQ202112250005~thumb.jpg',
    description: 'JWST lifted off on an Ariane 5 rocket on Christmas Day, beginning a complex 344-single-point-of-failure origami unfolding sequence on its way to Lagrange point 2.',
    highlights: ['6.5-meter gold-coated beryllium primary mirror array', 'Tennis-court-sized 5-layer Kapton sunshield', 'Orbits 1.5 million km from Earth at Sun-Earth L2'],
    nasaUrl: 'https://science.nasa.gov/mission/webb/'
  },

  // 2022
  {
    id: 'jwst-first-images',
    year: 2022,
    title: 'JWST First Deep Field & Science Imagery Revealed',
    period: 'Jul 12, 2022',
    duration: 'Operational Milestone',
    category: 'Astrophysics',
    thumbnail: 'https://images-assets.nasa.gov/image/carina_nebula/carina_nebula~thumb.jpg',
    description: 'NASA released the deepest and sharpest infrared images of the early universe, including galaxy cluster SMACS 0723 peering back over 13 billion years.',
    highlights: ['Detected light from galaxies born 300 million years after Big Bang', 'Identified atmospheric water vapor and carbon dioxide on exoplanets', 'Detailed star formation in Carina Nebula Cosmic Cliffs'],
    nasaUrl: 'https://science.nasa.gov/mission/webb/'
  },
  {
    id: 'dart-impact',
    year: 2022,
    title: 'DART Asteroid Deflection Planetary Defense Test',
    period: 'Sep 26, 2022',
    duration: 'Kinetic impact event',
    category: 'Defense',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA25442/PIA25442~thumb.jpg',
    description: 'NASA’s Double Asteroid Redirection Test intentionally collided with asteroid Dimorphos at 22,500 km/h, altering its orbital period by 33 minutes.',
    highlights: ['First planetary defense kinetic impactor test in history', 'Shortened Dimorphos orbit around Didymos by 33 minutes', 'Proved humanity can deflect hazardous near-Earth asteroids'],
    nasaUrl: 'https://www.nasa.gov/planetary-defense/dart/'
  },
  {
    id: 'artemis-1',
    year: 2022,
    title: 'Artemis I — Orion Uncrewed Lunar Flyby & Splashdown',
    period: 'Nov 16 – Dec 11, 2022',
    duration: '25 days 10 hours',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/art001e000673/art001e000673~thumb.jpg',
    description: 'The Space Launch System (SLS) rocket made its roaring maiden flight, sending the Orion spacecraft 432,210 km from Earth into a distant retrograde lunar orbit.',
    highlights: ['SLS produced 8.8 million pounds of liftoff thrust', 'Orion traveled farther than any human-rated spacecraft in history', 'Tested 40,000 km/h lunar skip reentry and heat shield'],
    nasaUrl: 'https://www.nasa.gov/mission/artemis-i/'
  },

  // 2023
  {
    id: 'osiris-rex-sample-return',
    year: 2023,
    title: 'OSIRIS-REx Bennu Asteroid Sample Lands on Earth',
    period: 'Sep 24, 2023',
    duration: 'Sample return capsule recovery',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/NHQ202309240003/NHQ202309240003~thumb.jpg',
    description: 'The OSIRIS-REx sample capsule parachuted into the Utah Test and Training Range carrying 121.6 grams of pristine carbonaceous asteroid regolith.',
    highlights: ['Delivered largest asteroid sample ever collected', 'Initial lab tests confirmed abundant water and carbon compounds', 'Spacecraft redirected as OSIRIS-APEX to intercept asteroid Apophis'],
    nasaUrl: 'https://science.nasa.gov/mission/osiris-rex/'
  },
  {
    id: 'psyche-launch',
    year: 2023,
    title: 'Psyche Launch — Journey to a Metal World',
    period: 'Oct 13, 2023',
    duration: '6-year cruise to main asteroid belt',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA21499/PIA21499~thumb.jpg',
    description: 'Launched atop a Falcon Heavy, Psyche is travelling 3.5 billion km to explore a unique metallic asteroid thought to be the exposed core of an ancient planetesimal.',
    highlights: ['Exploring an asteroid made of nickel-iron metal rather than rock or ice', 'Demonstrating Deep Space Optical Laser Communications (DSOC)', 'Scheduled to arrive at asteroid Psyche in 2029'],
    nasaUrl: 'https://science.nasa.gov/mission/psyche/'
  },

  // 2024
  {
    id: 'europa-clipper',
    year: 2024,
    title: 'Europa Clipper Launch — Searching for Habitable Oceans',
    period: 'Oct 14, 2024',
    duration: '5.5-year journey to Jupiter',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA25125/PIA25125~thumb.jpg',
    description: 'NASA’s largest planetary mission ever built launched on Falcon Heavy to perform 49 low-altitude flybys of Jupiter’s moon Europa, assessing its subsurface ocean habitability.',
    highlights: ['Equipped with ice-penetrating radar (REASON) to sound through the crust', 'Features 30-meter solar array wingspan for Jupiter distance', 'Will fly as close as 25 km above Europa’s icy surface'],
    nasaUrl: 'https://science.nasa.gov/mission/europa-clipper/'
  },

  // 2026 (Present Era in Space Apps 2026)
  {
    id: 'artemis-2',
    year: 2026,
    title: 'Artemis II — Crewed Lunar Orbital Voyage',
    period: 'Late 2025 / 2026',
    duration: '10-day crewed lunar flyby',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/KSC-20230602-PH-GEB01-0010/KSC-20230602-PH-GEB01-0010~thumb.jpg',
    description: 'Four astronauts—Reid Wiseman, Victor Glover, Christina Koch, and Jeremy Hansen—will become the first humans to journey to the Moon in over 50 years.',
    highlights: ['First crewed flight of SLS and Orion', 'Christina Koch will be first woman to fly to the Moon', 'Conducting high-apogee proximity operations in Earth orbit before lunar burn'],
    nasaUrl: 'https://www.nasa.gov/mission/artemis-ii/'
  },
  {
    id: 'viper-polar-rover',
    year: 2026,
    title: 'VIPER / Commercial Lunar Water-Ice Prospector',
    period: '2026 Deployment',
    duration: '100-day polar mission',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA23893/PIA23893~thumb.jpg',
    description: 'Equipped with the TRIDENT 1-meter drill and NIRVSS spectrometer to enter permanently shadowed lunar craters and map volatile water-ice deposits.',
    highlights: ['First robotic rover equipped with 1-meter sub-surface ice drill', 'Navigates extreme darkness and -250°C cold traps at Lunar South Pole', 'Provides ground-truth calibration for lunar resource extraction'],
    nasaUrl: 'https://science.nasa.gov/mission/viper/'
  },
  {
    id: 'roman-space-telescope',
    year: 2026,
    title: 'Nancy Grace Roman Space Telescope Integration',
    period: '2026 / 2027',
    duration: '5-year primary mission',
    category: 'Astrophysics',
    thumbnail: 'https://images-assets.nasa.gov/image/GSFC_20170331_2017-11028_014/GSFC_20170331_2017-11028_014~thumb.jpg',
    description: 'With a view 100 times greater than Hubble at equivalent sharpness, the Roman Space Telescope will survey billions of galaxies to unravel Dark Energy.',
    highlights: ['100x field of view of Hubble Space Telescope with same clarity', 'Equipped with starlight-blocking Coronagraph exoplanet instrument', 'Will survey 1 billion galaxies across cosmic time'],
    nasaUrl: 'https://roman.gsfc.nasa.gov/'
  },

  // 2027
  {
    id: 'artemis-3',
    year: 2027,
    title: 'Artemis III — First Human Lunar South Pole Landing',
    period: 'Target 2027',
    duration: '30-day mission (6.5 days on Moon)',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/art002e009283/art002e009283~thumb.jpg',
    description: 'Astronauts will land at the Moon’s South Pole, utilizing advanced surface spacesuits to explore permanent shadow craters and harvest water-ice samples.',
    highlights: ['First human landing at the Lunar South Pole', 'First woman and first person of color to walk on the Moon', 'Field sampling of primordial volatiles in permanent shadow traps'],
    nasaUrl: 'https://www.nasa.gov/mission/artemis-iii/'
  },

  // 2028
  {
    id: 'dragonfly-titan',
    year: 2028,
    title: 'Dragonfly Rotorcraft Mission to Saturn’s Moon Titan',
    period: 'Target 2028',
    duration: '3-year aerial exploration on Titan',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA23880/PIA23880~thumb.jpg',
    description: 'An 8-rotor nuclear-powered octocopter will fly through Titan’s dense atmosphere, landing at dozens of organic-rich sites from dunes to impact craters.',
    highlights: ['First multi-rotor aerial science vehicle on an outer planet moon', 'Flies across dense nitrogen atmosphere with 1/7th Earth gravity', 'Investigates prebiotic organic chemistry and potential biosignatures'],
    nasaUrl: 'https://science.nasa.gov/mission/dragonfly/'
  },

  // 2030
  {
    id: 'artemis-base-camp',
    year: 2030,
    title: 'Artemis Base Camp & Permanent Lunar Gateway Hub',
    period: 'Target 2030',
    duration: 'Sustained Lunar Presence',
    category: 'Infrastructure',
    thumbnail: 'https://images-assets.nasa.gov/image/Gateway-Set-1-IAC7-4k-BG_10/Gateway-Set-1-IAC7-4k-BG_10~thumb.jpg',
    description: 'Establishes a permanent surface habitat, pressurized lunar rover, and orbiting Lunar Gateway space station as the staging ground for human missions to Mars.',
    highlights: ['Sustained human living habitat at Lunar South Pole', 'Commercial in-situ resource utilization (ISRU) water fuel extraction', 'Crucial proving ground for 500-day human missions to Mars'],
    nasaUrl: 'https://www.nasa.gov/specials/artemis/'
  }
];
