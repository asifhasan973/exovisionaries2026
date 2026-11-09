import type { NasaMissionEvent } from "./types";

export const EARLY_DECADE_EVENTS: NasaMissionEvent[] = [
  // 1958
  {
    id: "explorer-1",
    year: 1958,
    title: "Explorer 1 — First US Satellite in Orbit",
    period: "Jan 31, 1958",
    duration: "111 days operational (12 years in orbit)",
    category: "Solar & Space",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA04601/PIA04601~thumb.jpg",
    description:
      "Launched atop a Juno I rocket from Cape Canaveral, Explorer 1 made the monumental discovery of the Van Allen radiation belts surrounding Earth.",
    highlights: [
      "Discovered Earth’s Van Allen radiation belts",
      "First US scientific satellite in space",
      "Weighed only 13.97 kg",
    ],
    nasaUrl:
      "https://www.nasa.gov/history/65-years-ago-explorer-1-first-satellite-launched-by-the-united-states/",
  },
  {
    id: "nasa-establishment",
    year: 1958,
    title: "Establishment of NASA (National Aeronautics and Space Act)",
    period: "Jul 29 – Oct 1, 1958",
    duration: "Historical Agency Inception",
    category: "Infrastructure",
    thumbnail:
      "https://images-assets.nasa.gov/image/GRC-1997-C-03941/GRC-1997-C-03941~thumb.jpg",
    description:
      "President Dwight D. Eisenhower signed the National Aeronautics and Space Act, consolidating NACA and founding NASA to lead civilian space research.",
    highlights: [
      "Absorbed 8,000 employees from NACA",
      "Established purely civilian exploration doctrine",
      "Opened for operations on October 1, 1958",
    ],
    nasaUrl: "https://www.nasa.gov/history/the-birth-of-nasa/",
  },
  {
    id: "project-mercury-inauguration",
    year: 1958,
    title: "Project Mercury Authorized",
    period: "Oct 7, 1958",
    duration: "1958 – 1963 Program Arc",
    category: "Crewed",
    thumbnail:
      "https://images-assets.nasa.gov/image/LRC-1959-B701_P-02361/LRC-1959-B701_P-02361~thumb.jpg",
    description:
      "NASA’s first human spaceflight program was officially approved, with the objective of putting an astronaut into orbit and returning safely.",
    highlights: [
      "Selected Mercury 7 astronauts",
      "Laid ground communication networks",
      "Developed heat shield ablation technology",
    ],
    nasaUrl: "https://www.nasa.gov/mission/mercury/",
  },

  // 1961
  {
    id: "freedom-7",
    year: 1961,
    title: "Freedom 7 — Alan Shepard First American in Space",
    period: "May 5, 1961",
    duration: "15 min 28 sec suborbital flight",
    category: "Crewed",
    thumbnail: "https://images-assets.nasa.gov/image/6417075/6417075~thumb.jpg",
    description:
      "Alan B. Shepard Jr. piloted the Mercury capsule Freedom 7 to an altitude of 187 km, proving humans could endure launch and weightlessness.",
    highlights: [
      "Reached altitude of 187.5 km",
      "First pilot-controlled manual spacecraft attitude",
      "Splashdown safely in Atlantic Ocean",
    ],
    nasaUrl: "https://www.nasa.gov/mission/mercury-redstone-3/",
  },
  {
    id: "jfk-moon-goal",
    year: 1961,
    title: "President Kennedy’s Apollo Moon Challenge",
    period: "May 25, 1961",
    duration: "National Milestone",
    category: "Infrastructure",
    thumbnail:
      "https://images-assets.nasa.gov/image/NHQ201806010017/NHQ201806010017~thumb.jpg",
    description:
      "In an address to Congress, President John F. Kennedy committed the nation to landing an American astronaut on the Moon before the decade was out.",
    highlights: [
      "Sparked the Apollo lunar program",
      "Expanded NASA budget to 4.4% of federal budget",
      "Accelerated Saturn rocket development",
    ],
    nasaUrl: "https://www.nasa.gov/the-apollo-program/",
  },

  // 1962
  {
    id: "friendship-7",
    year: 1962,
    title: "Friendship 7 — John Glenn Orbits the Earth",
    period: "Feb 20, 1962",
    duration: "4 hours 55 min (3 orbits)",
    category: "Crewed",
    thumbnail: "https://images-assets.nasa.gov/image/9139490/9139490~thumb.jpg",
    description:
      "John Glenn became the first American to orbit Earth aboard Friendship 7, verifying orbital mechanics, telecommunications, and reentry survival.",
    highlights: [
      "3 complete orbits around Earth",
      "Manual fly-by-wire reentry attitude control",
      "Overcame faulty landing bag sensor alarm",
    ],
    nasaUrl: "https://www.nasa.gov/mission/mercury-atlas-6/",
  },
  {
    id: "mariner-2",
    year: 1962,
    title: "Mariner 2 — First Successful Venus Interplanetary Flyby",
    period: "Aug 27 – Dec 14, 1962",
    duration: "109 days cruise to Venus",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA02972/PIA02972~thumb.jpg",
    description:
      "First successful robotic spacecraft to visit another planet, confirming Venus’s extreme greenhouse surface temperature (~428°C) and dense atmosphere.",
    highlights: [
      "First encounter with another planet",
      "Measured continuous solar wind stream",
      "Passed within 34,773 km of Venus",
    ],
    nasaUrl: "https://www.nasa.gov/mission/mariner-2/",
  },

  // 1965
  {
    id: "gemini-4",
    year: 1965,
    title: "Gemini 4 — Ed White Performs First American Spacewalk",
    period: "Jun 3 – 7, 1965",
    duration: "4 days 1 hour (20 min EVA)",
    category: "Crewed",
    thumbnail:
      "https://images-assets.nasa.gov/image/s66-45605/s66-45605~thumb.jpg",
    description:
      "During Gemini 4, astronaut Ed White stepped outside the capsule tethered to oxygen, maneuvering with a handheld thruster gun for 20 minutes.",
    highlights: [
      "First US extravehicular activity (EVA)",
      "62 orbits around Earth",
      "First multi-day crewed endurance check",
    ],
    nasaUrl: "https://www.nasa.gov/mission/gemini-iv/",
  },
  {
    id: "mariner-4",
    year: 1965,
    title: "Mariner 4 — First Close-Up Images of Mars Surface",
    period: "Jul 15, 1965",
    duration: "228 days transit",
    category: "Planetary",
    thumbnail:
      "https://images-assets.nasa.gov/image/PIA02467/PIA02467~thumb.jpg",
    description:
      "Mariner 4 performed the first successful flyby of Mars, returning 21 historic photographs that revealed impact craters and an ultra-thin atmosphere.",
    highlights: [
      "Returned first 21 close-up digital pictures of Mars",
      "Measured thin CO2 atmospheric pressure (4-7 mbar)",
      "Passed within 9,846 km of Martian surface",
    ],
    nasaUrl: "https://www.nasa.gov/mission/mariner-4/",
  },

  // 1968
  {
    id: "apollo-7",
    year: 1968,
    title: "Apollo 7 — First Crewed Apollo Flight Test",
    period: "Oct 11 – 22, 1968",
    duration: "10 days 20 hours",
    category: "Crewed",
    thumbnail:
      "https://images-assets.nasa.gov/image/S68-50712/S68-50712~thumb.jpg",
    description:
      "Wally Schirra, Donn Eisele, and Walter Cunningham flight-certified the redesigned Apollo Command and Service Module in Earth orbit.",
    highlights: [
      "First live television broadcast from American space",
      "Validated Service Propulsion System (SPS) engine",
      "163 orbits of Earth",
    ],
    nasaUrl: "https://www.nasa.gov/mission/apollo-7/",
  },
  {
    id: "apollo-8",
    year: 1968,
    title: "Apollo 8 — First Humans to Orbit the Moon & Earthrise",
    period: "Dec 21 – 27, 1968",
    duration: "6 days 3 hours",
    category: "Crewed",
    thumbnail:
      "https://images-assets.nasa.gov/image/as08-14-2383/as08-14-2383~thumb.jpg",
    description:
      'Frank Borman, James Lovell, and William Anders became the first humans to leave low-Earth orbit, circle the Moon, and photograph the iconic "Earthrise".',
    highlights: [
      "First crewed translunar injection burn",
      "10 orbits around the Moon",
      "Captured the immortal Earthrise photograph",
    ],
    nasaUrl: "https://www.nasa.gov/mission/apollo-8/",
  },
];
