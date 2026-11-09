import type { NasaMissionEvent } from "./types";

export const SHUTTLE_ERA_EVENTS: NasaMissionEvent[] = [
  // 1976
  {
    id: "viking-1-landing",
    year: 1976,
    title: "Viking 1 — First Successful Mars Surface Touchdown",
    period: "Jul 20, 1976 – Nov 11, 1982",
    duration: "6 years 116 days on Mars",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA00563/PIA00563~thumb.jpg",
    description:
      "Viking 1 touched down in Chryse Planitia and transmitted the first color panoramic photo from the surface of Mars, analyzing Martian soil composition.",
    highlights: [
      "First operational landing on Mars surface",
      "Returned over 50,000 photographs",
      "Sampled soil for metabolic and organic signatures",
    ],
    nasaUrl: "https://www.nasa.gov/mission/viking-1/",
  },
  {
    id: "viking-2-landing",
    year: 1976,
    title: "Viking 2 — Touchdown in Utopia Planitia",
    period: "Sep 3, 1976 – Apr 11, 1980",
    duration: "3 years 221 days",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA00396/PIA00396~thumb.jpg",
    description:
      "Viking 2 landed 6,400 km away from Viking 1 in Utopia Planitia, operating a seismometer and analyzing water frost that coated the winter rocks.",
    highlights: [
      "Recorded Martian marsquakes and wind tremors",
      "Photographed pure water frost on Martian rocks",
      "Radioed weather station data across 4 seasons",
    ],
    nasaUrl: "https://www.nasa.gov/mission/viking-2/",
  },

  // 1977
  {
    id: "voyager-2-launch",
    year: 1977,
    title: "Voyager 2 Launch — Grand Tour of Outer Planets",
    period: "Aug 20, 1977",
    duration: "47+ years active mission",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA01486/PIA01486~thumb.jpg",
    description:
      "Launched 16 days before Voyager 1, Voyager 2 took advantage of a rare 175-year planetary alignment to visit Jupiter, Saturn, Uranus, and Neptune.",
    highlights: [
      "Only spacecraft to explore Uranus and Neptune",
      "Discovered active nitrogen geysers on Triton",
      "Entered interstellar space in November 2018",
    ],
    nasaUrl: "https://www.nasa.gov/mission/voyager-2/",
  },
  {
    id: "voyager-1-launch",
    year: 1977,
    title: "Voyager 1 Launch — Interstellar Voyager & Golden Record",
    period: "Sep 5, 1977",
    duration: "47+ years active mission",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA21644/PIA21644~thumb.jpg",
    description:
      "Voyager 1 was propelled onto a hyper-speed trajectory past Jupiter and Saturn’s moon Titan, carrying the Golden Record of Earth’s sounds and culture.",
    highlights: [
      "Most distant human-made object from Earth (>24 billion km)",
      "First spacecraft to cross into interstellar space (2012)",
      "Discovered active volcanic eruption plumes on Io",
    ],
    nasaUrl: "https://www.nasa.gov/mission/voyager-1/",
  },

  // 1981
  {
    id: "sts-1",
    year: 1981,
    title: "STS-1 — First Flight of Space Shuttle Columbia",
    period: "Apr 12 – 14, 1981",
    duration: "2 days 6 hours (36 orbits)",
    category: "Crewed",
    thumbnail: "https://images-assets.nasa.gov/image/8111969/8111969~thumb.jpg",
    description:
      "Astronauts John Young and Robert Crippen launched on the maiden flight of Space Shuttle Columbia, inaugurating the reusable winged orbiter era.",
    highlights: [
      "First human orbital flight of a reusable winged spaceplane",
      "Flew with solid rocket boosters on a crewed flight for the first time",
      "Glided to unpowered landing at Edwards AFB",
    ],
    nasaUrl: "https://www.nasa.gov/mission/sts-1/",
  },

  // 1986
  {
    id: "voyager-2-uranus",
    year: 1986,
    title: "Voyager 2 — Historic Close-up Encounter with Uranus",
    period: "Jan 24, 1986",
    duration: "Flyby closest approach",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA01360/PIA01360~thumb.jpg",
    description:
      "Voyager 2 arrived within 81,500 km of Uranus’s cloud tops, discovering 10 new moons, 2 new rings, and an intensely tilted magnetic field.",
    highlights: [
      "First and only encounter with ice giant Uranus",
      "Photographed bizarre fractured canyons on moon Miranda",
      "Discovered Uranus’s unique 60° tilted magnetic axis",
    ],
    nasaUrl: "https://www.nasa.gov/mission/voyager-2/",
  },

  // 1989
  {
    id: "voyager-2-neptune",
    year: 1989,
    title: "Voyager 2 — Discovery of Neptune and Triton Geysers",
    period: "Aug 25, 1989",
    duration: "Flyby closest approach",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA01492/PIA01492~thumb.jpg",
    description:
      "Voyager 2 dipped just 4,950 km above Neptune’s north pole, revealing the Great Dark Spot, supersonic winds, and cryogenic nitrogen geysers on Triton.",
    highlights: [
      "Discovered supersonic winds of up to 2,100 km/h",
      "Found 6 new moons and complete ring arcs",
      "Photographed nitrogen ice geysers shooting 8 km high on Triton",
    ],
    nasaUrl: "https://www.nasa.gov/mission/voyager-2/",
  },
  {
    id: "galileo-launch",
    year: 1989,
    title: "Galileo Mission Launch to Jupiter",
    period: "Oct 18, 1989",
    duration: "14-year mission life",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/S89-44173/S89-44173~thumb.jpg",
    description:
      "Deployed from Space Shuttle Atlantis (STS-34), Galileo set out for Jupiter to deliver an atmospheric probe and become the first craft to orbit the giant planet.",
    highlights: [
      "First spacecraft to fly past an asteroid (Gaspra & Ida)",
      "Discovered first asteroid moon (Dactyl)",
      "Deployed first probe into Jupiter’s stormy atmosphere",
    ],
    nasaUrl: "https://www.nasa.gov/mission/galileo/",
  },

  // 1990
  {
    id: "hubble-deployment",
    year: 1990,
    title: "Hubble Space Telescope Deployed into Orbit (STS-31)",
    period: "Apr 24 – 25, 1990",
    duration: "34+ years active observing",
    category: "Astrophysics",
    thumbnail:
      "https://images-assets.nasa.gov/image/s31-10-018/s31-10-018~thumb.jpg",
    description:
      "Space Shuttle Discovery lifted the Hubble Space Telescope into low Earth orbit above atmospheric distortion, opening a revolutionary window onto the cosmos.",
    highlights: [
      "Over 1.5 million scientific observations",
      "Determined the expansion rate of the universe (Hubble constant)",
      "Produced iconic images like the Pillars of Creation",
    ],
    nasaUrl: "https://www.nasa.gov/mission/hubble-space-telescope/",
  },
  {
    id: "pale-blue-dot",
    year: 1990,
    title: 'Voyager 1 Photographs Earth as "Pale Blue Dot"',
    period: "Feb 14, 1990",
    duration: "Interstellar Portrait",
    category: "Solar & Space",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA00452/PIA00452~thumb.jpg",
    description:
      "From 6 billion km away, Voyager 1 turned its camera back towards Earth upon Carl Sagan’s request, capturing Earth suspended as a tiny speck of light in a sunbeam.",
    highlights: [
      "Captured at distance of 6.05 billion km (40.5 AU)",
      "Subject of Carl Sagan’s famous philosophical reflection",
      "Part of the final Solar System Family Portrait",
    ],
    nasaUrl: "https://science.nasa.gov/resource/voyager-1s-pale-blue-dot/",
  },

  // 1995
  {
    id: "galileo-probe",
    year: 1995,
    title: "Galileo Probe Penetrates Jupiter’s Atmosphere",
    period: "Dec 7, 1995",
    duration: "58 min extreme plunge",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA00227/PIA00227~thumb.jpg",
    description:
      "The Galileo atmospheric probe slammed into Jupiter at 170,000 km/h, surviving deceleration forces of 228 g and transmitting data through 156 km of raging atmosphere.",
    highlights: [
      "Survived temperatures hotter than the surface of the Sun",
      "Measured winds exceeding 650 km/h deep in the atmosphere",
      "Found Jupiter atmosphere is drier and windier than modeled",
    ],
    nasaUrl: "https://www.nasa.gov/mission/galileo/",
  },

  // 1997
  {
    id: "mars-pathfinder",
    year: 1997,
    title: "Mars Pathfinder & Sojourner — First Mars Micro-Rover",
    period: "Jul 4 – Sep 27, 1997",
    duration: "83 days operating on Mars",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA00609/PIA00609~thumb.jpg",
    description:
      "Mars Pathfinder used an innovative airbag cocoon landing system to deploy Sojourner, the first wheeled rover on Mars, which drove 100 meters analyzing rocks.",
    highlights: [
      "First robotic wheeled rover on Mars",
      "Used groundbreaking airbag impact cushioning",
      "Streamed live images to millions on the early World Wide Web",
    ],
    nasaUrl: "https://www.nasa.gov/mission/mars-pathfinder/",
  },
  {
    id: "cassini-launch",
    year: 1997,
    title: "Cassini-Huygens Launch to Saturn and Titan",
    period: "Oct 15, 1997",
    duration: "20-year mission lifetime",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA03463/PIA03463~thumb.jpg",
    description:
      "A joint NASA/ESA flagship mission launched on a Titan IVB rocket, carrying the Cassini Saturn orbiter and ESA’s Huygens Titan atmospheric lander.",
    highlights: [
      "Most sophisticated interplanetary flagship probe",
      "Discovered liquid methane lakes on Titan",
      "Detected hydrothermal water geysers erupting from Enceladus",
    ],
    nasaUrl: "https://science.nasa.gov/mission/cassini/",
  },

  // 1998
  {
    id: "iss-assembly-begins",
    year: 1998,
    title: "International Space Station (ISS) Assembly Begins",
    period: "Nov 20 – Dec 4, 1998",
    duration: "26+ years continuous operations",
    category: "Infrastructure",
    thumbnail:
      "https://images-assets.nasa.gov/image/KSC-98pc1413/KSC-98pc1413~thumb.jpg",
    description:
      "Zarya and Unity modules mated in orbit during STS-88, inaugurating the largest cooperative peacetime engineering project in human history.",
    highlights: [
      "Over 270 astronauts from 21 nations have visited",
      "Continuously occupied by humans since November 2, 2000",
      "Travels at 28,000 km/h orbiting Earth every 90 minutes",
    ],
    nasaUrl: "https://www.nasa.gov/international-space-station/",
  },
  {
    id: "deep-space-1",
    year: 1998,
    title: "Deep Space 1 — Ion Engine & Autonomous Navigation",
    period: "Oct 24, 1998",
    duration: "3-year technology testbed",
    category: "Solar & Space",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA02450/PIA02450~thumb.jpg",
    description:
      "Tested electrostatic xenon ion propulsion and autonomous artificial intelligence navigation, flyby of comet Borrelly and asteroid Braille.",
    highlights: [
      "First primary operational ion drive on deep-space probe",
      "Achieved 16,265 hours of continuous thrusting",
      "Paved the way for Dawn mission to Vesta & Ceres",
    ],
    nasaUrl: "https://www.nasa.gov/mission/deep-space-1/",
  },
];
