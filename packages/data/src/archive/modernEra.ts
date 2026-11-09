import type { NasaMissionEvent } from "./types";

export const MODERN_ERA_EVENTS: NasaMissionEvent[] = [
  // 2004
  {
    id: "spirit-rover",
    year: 2004,
    title: "Spirit Rover (MER-A) Lands in Gusev Crater",
    period: "Jan 4, 2004 – Mar 22, 2010",
    duration: "6 years 2 months (designed for 90 days)",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA05527/PIA05527~thumb.jpg",
    description:
      "Spirit touched down using an airbag array in Gusev Crater, exploring Columbia Hills and uncovering silica deposits proving ancient volcanic hot springs.",
    highlights: [
      "Outlived 90-day design lifetime by 25x",
      "Drove 7.73 km across rugged Martian terrain",
      "Uncovered pure silica deposit indicating ancient hot water hydrothermal activity",
    ],
    nasaUrl: "https://science.nasa.gov/mission/mer-spirit/",
  },
  {
    id: "opportunity-rover",
    year: 2004,
    title: "Opportunity Rover (MER-B) Lands in Meridiani Planum",
    period: "Jan 25, 2004 – Jun 10, 2018",
    duration: "14 years 136 days on Mars",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA20285/PIA20285~thumb.jpg",
    description:
      'Opportunity scored an interplanetary hole-in-one in Eagle Crater, discovering hematite "blueberries" and rock layers formed in acidic standing water.',
    highlights: [
      "Drove an all-time interplanetary marathon of 45.16 km",
      "Proved ancient liquid water pooled on Mars surface",
      "Operated for more than 5,000 Martian sols",
    ],
    nasaUrl: "https://science.nasa.gov/mission/mer-opportunity/",
  },
  {
    id: "cassini-saturn-insertion",
    year: 2004,
    title: "Cassini-Huygens Enters Saturn Orbit",
    period: "Jul 1, 2004",
    duration: "13-year orbital exploration",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA06077/PIA06077~thumb.jpg",
    description:
      "Cassini slipped between Saturn’s F and G rings, igniting its main engine to become Saturn’s first artificial satellite, revealing ring dynamics.",
    highlights: [
      "First orbiter around Saturn",
      "Released Huygens probe which landed on Titan (Jan 2005)",
      "Discovered global ocean beneath Enceladus’s icy crust",
    ],
    nasaUrl: "https://science.nasa.gov/mission/cassini/",
  },

  // 2006
  {
    id: "new-horizons-launch",
    year: 2006,
    title: "New Horizons Launch to Pluto and the Kuiper Belt",
    period: "Jan 19, 2006",
    duration: "9.5-year voyage to Pluto",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA19717/PIA19717~thumb.jpg",
    description:
      "Launched at 58,536 km/h—the fastest launch departure velocity in history—New Horizons sped towards the dwarf planet Pluto and the Kuiper Belt.",
    highlights: [
      "Fastest spacecraft ever launched from Earth",
      "Used Jupiter gravity assist to shave 3 years off transit",
      "Carries ashes of Pluto discoverer Clyde Tombaugh",
    ],
    nasaUrl: "https://science.nasa.gov/mission/new-horizons/",
  },

  // 2011
  {
    id: "sts-135-final-shuttle",
    year: 2011,
    title: "STS-135 Atlantis — Final Flight of the Space Shuttle",
    period: "Jul 8 – 21, 2011",
    duration: "12 days 18 hours",
    category: "Crewed",
    thumbnail:
      "https://images-assets.nasa.gov/image/sts135-s-072/sts135-s-072~thumb.jpg",
    description:
      "Space Shuttle Atlantis concluded 30 years of Shuttle service, delivering the Raffaello logistics module to the ISS and returning with museum honors.",
    highlights: [
      "135th and final Space Shuttle mission",
      "Concluded 30-year operational history of Shuttle fleet",
      "Delivered 4,260 kg of spare parts to ISS",
    ],
    nasaUrl: "https://www.nasa.gov/mission/sts-135/",
  },
  {
    id: "curiosity-launch",
    year: 2011,
    title: "Curiosity Rover (Mars Science Laboratory Launch)",
    period: "Nov 26, 2011",
    duration: "8.5-month cruise to Mars",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA14156/PIA14156~thumb.jpg",
    description:
      "An Atlas V rocket hurled the 1-ton, nuclear-powered Curiosity rover towards Mars, carrying laser spectrometers, wet chemistry, and sample drills.",
    highlights: [
      "Largest rover ever sent to Mars up to that time (899 kg)",
      "Powered by multi-mission radioisotope thermoelectric generator (MMRTG)",
      "Equipped with ChemCam rock-vaporizing laser",
    ],
    nasaUrl: "https://science.nasa.gov/mission/msl-curiosity/",
  },
  {
    id: "juno-launch",
    year: 2011,
    title: "Juno Launch — Journey to Jupiter’s Core",
    period: "Aug 5, 2011",
    duration: "5-year cruise to Jupiter",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA14556/PIA14556~thumb.jpg",
    description:
      "Juno launched to investigate Jupiter’s origins, deep interior structure, atmospheric water content, and enormous polar auroral storms.",
    highlights: [
      "Most distant solar-powered mission (9m solar panels)",
      "Peered beneath Jupiter’s clouds to map gravity harmonics",
      "Found a fuzzy, diluted core extending across half the planet’s radius",
    ],
    nasaUrl: "https://science.nasa.gov/mission/juno/",
  },

  // 2012
  {
    id: "curiosity-landing",
    year: 2012,
    title: "Curiosity Rover Lands in Gale Crater via Sky Crane",
    period: "Aug 6, 2012 – Present",
    duration: "12+ years active science on Mars",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA15981/PIA15981~thumb.jpg",
    description:
      'Curiosity executed the heart-stopping "7 Minutes of Terror" landing, lowered gently to the floor of Gale Crater by a rocket-powered Sky Crane.',
    highlights: [
      "Pioneered rocket Sky Crane descent architecture",
      "Proved Gale Crater once hosted a freshwater lake suitable for microbial life",
      "Has climbed over 800m up Mount Sharp",
    ],
    nasaUrl: "https://science.nasa.gov/mission/msl-curiosity/",
  },
  {
    id: "voyager-1-interstellar",
    year: 2012,
    title: "Voyager 1 Crosses into Interstellar Space",
    period: "Aug 25, 2012",
    duration: "Historical Milestone",
    category: "Solar & Space",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA17046/PIA17046~thumb.jpg",
    description:
      "Voyager 1 became the first human-made object to cross the heliopause and enter interstellar space, detecting a 40x jump in galactic cosmic ray density.",
    highlights: [
      "Left the Sun’s protective magnetic bubble (heliosphere)",
      "First direct sampling of pristine interstellar medium",
      "Transmitting data across 22 light-hours distance",
    ],
    nasaUrl: "https://www.nasa.gov/mission/voyager-1/",
  },

  // 2015
  {
    id: "new-horizons-pluto",
    year: 2015,
    title: "New Horizons Historical Pluto Flyby — The Heart of Pluto",
    period: "Jul 14, 2015",
    duration: "12,500 km closest approach",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA19952/PIA19952~thumb.jpg",
    description:
      "New Horizons flew past Pluto, revealing a dynamic world with towering water-ice mountains, glaciers of nitrogen ice in Tombaugh Regio, and blue skies.",
    highlights: [
      "First close-up reconnaissance of Pluto & Charon",
      "Discovered active nitrogen convection cells in Sputnik Planitia",
      "Revealed Charon’s dark red tholin-covered north pole (Mordor Macula)",
    ],
    nasaUrl: "https://science.nasa.gov/mission/new-horizons/",
  },
  {
    id: "dawn-ceres",
    year: 2015,
    title: "Dawn Orbit Insertion at Dwarf Planet Ceres",
    period: "Mar 6, 2015 – Nov 1, 2018",
    duration: "3.5 years in orbit",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA19547/PIA19547~thumb.jpg",
    description:
      "Dawn became the first spacecraft to orbit two different extraterrestrial bodies (Vesta and Ceres), discovering bright sodium carbonate salt deposits in Occator Crater.",
    highlights: [
      "First probe to orbit two separate celestial bodies",
      "Discovered subterranean brine reservoir on Ceres",
      "Mapped bright reflective salt deposits in Occator Crater",
    ],
    nasaUrl: "https://science.nasa.gov/mission/dawn/",
  },

  // 2018
  {
    id: "parker-solar-probe",
    year: 2018,
    title: "Parker Solar Probe Launch — Touching the Sun",
    period: "Aug 12, 2018 – Present",
    duration: "7-year nominal mission",
    category: "Solar & Space",
    thumbnail:
      "https://images-assets.nasa.gov/image/KSC-20180419-PH_KLS01_0009/KSC-20180419-PH_KLS01_0009~thumb.jpg",
    description:
      "Parker Solar Probe is swooping within 6.1 million km of the Sun’s surface at up to 690,000 km/h, protected by an 11.4 cm carbon-composite heat shield.",
    highlights: [
      "Fastest human-made object ever built (up to 692,000 km/h)",
      "First spacecraft to fly inside the Sun’s corona",
      'Discovered magnetic "switchbacks" in the solar wind',
    ],
    nasaUrl: "https://science.nasa.gov/mission/parker-solar-probe/",
  },
  {
    id: "insight-mars",
    year: 2018,
    title: "InSight Mars Lander — The First Mars Seismometer",
    period: "Nov 26, 2018 – Dec 15, 2022",
    duration: "4 years 19 days on Mars",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA22872/PIA22872~thumb.jpg",
    description:
      "InSight touched down on Elysium Planitia, deploying an ultra-sensitive seismometer (SEIS) that recorded over 1,300 marsquakes and mapped Mars’s crust and liquid core.",
    highlights: [
      "Recorded largest marsquake ever observed (magnitude 4.7)",
      "Measured Mars’s molten metallic core radius (~1,830 km)",
      "Mapped subsurface layers down to 200 km depth",
    ],
    nasaUrl: "https://science.nasa.gov/mission/insight/",
  },

  // 2020
  {
    id: "perseverance-launch",
    year: 2020,
    title: "Perseverance & Ingenuity Launch to Mars",
    period: "Jul 30, 2020",
    duration: "7-month cruise to Mars",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/NHQ202007300004/NHQ202007300004~thumb.jpg",
    description:
      "Launched atop an Atlas V from Cape Canaveral, Perseverance set off on a mission to seek signs of ancient life and cache sample tubes for future return to Earth.",
    highlights: [
      "Carried Ingenuity Mars Helicopter beneath rover belly",
      "Equipped with MOXIE oxygen generation experiment",
      "Fitted with PIXL and SHERLOC biosignature spectrometers",
    ],
    nasaUrl: "https://science.nasa.gov/mission/mars-2020-perseverance/",
  },
  {
    id: "osiris-rex-tag",
    year: 2020,
    title: "OSIRIS-REx Touch-And-Go Sample Collection at Asteroid Bennu",
    period: "Oct 20, 2020",
    duration: "TAG sampling event",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/DSCN0120/DSCN0120~thumb.jpg",
    description:
      "OSIRIS-REx extended its robotic sampling arm TAGSAM, tapped asteroid Bennu’s surface, and fired pressurized nitrogen gas to collect over 120 grams of carbon-rich regolith.",
    highlights: [
      "First US mission to sample an asteroid surface",
      "Collected over twice the required sample mass (>120 grams)",
      "Discovered Bennu behaves like a fluid ball of pebbles",
    ],
    nasaUrl: "https://science.nasa.gov/mission/osiris-rex/",
  },
  {
    id: "crew-dragon-demo-2",
    year: 2020,
    title: "Crew Dragon Demo-2 — First Commercial Crew Human Launch",
    period: "May 30 – Aug 2, 2020",
    duration: "64 days orbital mission",
    category: "Crewed",
    thumbnail:
      "https://images-assets.nasa.gov/image/NHQ202005300010/NHQ202005300010~thumb.jpg",
    description:
      "NASA astronauts Bob Behnken and Doug Hurley launched to the ISS aboard SpaceX Crew Dragon, restoring American human orbital launch capability from US soil.",
    highlights: [
      "First human orbital launch from US soil since Shuttle retirement (2011)",
      "Certified Commercial Crew public-private partnership",
      "Safe parachute splashdown in Gulf of Mexico",
    ],
    nasaUrl: "https://www.nasa.gov/commercial-crew-program/",
  },
];
