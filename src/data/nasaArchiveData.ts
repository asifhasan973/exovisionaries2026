// NASA Mission Archive Data Catalog (1958 - 2030)
// Complete historical archive with high-fidelity milestone events, durations, and official links

export interface NasaMissionEvent {
  id: string;
  year: number;
  title: string;
  period: string;
  duration: string;
  category: 'Crewed' | 'Planetary' | 'Astrophysics' | 'Solar & Space' | 'Infrastructure' | 'Defense';
  thumbnail: string;
  description: string;
  highlights: string[];
  nasaUrl: string;
  badge?: string;
}

export interface TimelineBubble {
  id: string;
  title?: string;
  thumbnail?: string;
  isMore?: boolean;
  moreCount?: number;
}

export interface TimelineYearItem {
  year: number;
  hasEvents: boolean;
  events: NasaMissionEvent[];
  bubbles: TimelineBubble[];
}

export const NASA_BUBBLE_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><radialGradient id="bg" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%231e293b"/><stop offset="70%" stop-color="%230f172a"/><stop offset="100%" stop-color="%23020617"/></radialGradient><linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238ce2c2"/><stop offset="100%" stop-color="%230891b2"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(%23bg)"/><circle cx="28" cy="24" r="1.5" fill="%23ffffff" opacity="0.8"/><circle cx="76" cy="30" r="1.5" fill="%238ce2c2" opacity="0.9"/><circle cx="34" cy="74" r="1.2" fill="%23ffffff" opacity="0.6"/><circle cx="72" cy="70" r="1.8" fill="%23ffdf89" opacity="0.8"/><circle cx="50" cy="50" r="22" fill="%23091428" stroke="%2338bdf8" stroke-width="1.5"/><ellipse cx="50" cy="50" rx="34" ry="10" fill="none" stroke="url(%23ring)" stroke-width="2.5" transform="rotate(-24 50 50)"/><circle cx="50" cy="50" r="17" fill="none" stroke="%238ce2c2" stroke-width="0.8" opacity="0.4"/><polygon points="50,40 54,48 62,50 56,56 57,64 50,60 43,64 44,56 38,50 46,48" fill="%23ffdf89" opacity="0.95"/></svg>`;

export const NASA_MISSION_EVENTS: NasaMissionEvent[] = [
  // 1958
  {
    id: 'explorer-1',
    year: 1958,
    title: 'Explorer 1 — First US Satellite in Orbit',
    period: 'Jan 31, 1958',
    duration: '111 days operational (12 years in orbit)',
    category: 'Solar & Space',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA04601/PIA04601~thumb.jpg',
    description: 'Launched atop a Juno I rocket from Cape Canaveral, Explorer 1 made the monumental discovery of the Van Allen radiation belts surrounding Earth.',
    highlights: ['Discovered Earth’s Van Allen radiation belts', 'First US scientific satellite in space', 'Weighed only 13.97 kg'],
    nasaUrl: 'https://www.nasa.gov/history/65-years-ago-explorer-1-first-satellite-launched-by-the-united-states/'
  },
  {
    id: 'nasa-establishment',
    year: 1958,
    title: 'Establishment of NASA (National Aeronautics and Space Act)',
    period: 'Jul 29 – Oct 1, 1958',
    duration: 'Historical Agency Inception',
    category: 'Infrastructure',
    thumbnail: 'https://images-assets.nasa.gov/image/GRC-1997-C-03941/GRC-1997-C-03941~thumb.jpg',
    description: 'President Dwight D. Eisenhower signed the National Aeronautics and Space Act, consolidating NACA and founding NASA to lead civilian space research.',
    highlights: ['Absorbed 8,000 employees from NACA', 'Established purely civilian exploration doctrine', 'Opened for operations on October 1, 1958'],
    nasaUrl: 'https://www.nasa.gov/history/the-birth-of-nasa/'
  },
  {
    id: 'project-mercury-inauguration',
    year: 1958,
    title: 'Project Mercury Authorized',
    period: 'Oct 7, 1958',
    duration: '1958 – 1963 Program Arc',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/LRC-1959-B701_P-02361/LRC-1959-B701_P-02361~thumb.jpg',
    description: 'NASA’s first human spaceflight program was officially approved, with the objective of putting an astronaut into orbit and returning safely.',
    highlights: ['Selected Mercury 7 astronauts', 'Laid ground communication networks', 'Developed heat shield ablation technology'],
    nasaUrl: 'https://www.nasa.gov/mission/mercury/'
  },

  // 1961
  {
    id: 'freedom-7',
    year: 1961,
    title: 'Freedom 7 — Alan Shepard First American in Space',
    period: 'May 5, 1961',
    duration: '15 min 28 sec suborbital flight',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/6417075/6417075~thumb.jpg',
    description: 'Alan B. Shepard Jr. piloted the Mercury capsule Freedom 7 to an altitude of 187 km, proving humans could endure launch and weightlessness.',
    highlights: ['Reached altitude of 187.5 km', 'First pilot-controlled manual spacecraft attitude', 'Splashdown safely in Atlantic Ocean'],
    nasaUrl: 'https://www.nasa.gov/mission/mercury-redstone-3/'
  },
  {
    id: 'jfk-moon-goal',
    year: 1961,
    title: 'President Kennedy’s Apollo Moon Challenge',
    period: 'May 25, 1961',
    duration: 'National Milestone',
    category: 'Infrastructure',
    thumbnail: 'https://images-assets.nasa.gov/image/NHQ201806010017/NHQ201806010017~thumb.jpg',
    description: 'In an address to Congress, President John F. Kennedy committed the nation to landing an American astronaut on the Moon before the decade was out.',
    highlights: ['Sparked the Apollo lunar program', 'Expanded NASA budget to 4.4% of federal budget', 'Accelerated Saturn rocket development'],
    nasaUrl: 'https://www.nasa.gov/the-apollo-program/'
  },

  // 1962
  {
    id: 'friendship-7',
    year: 1962,
    title: 'Friendship 7 — John Glenn Orbits the Earth',
    period: 'Feb 20, 1962',
    duration: '4 hours 55 min (3 orbits)',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/9139490/9139490~thumb.jpg',
    description: 'John Glenn became the first American to orbit Earth aboard Friendship 7, verifying orbital mechanics, telecommunications, and reentry survival.',
    highlights: ['3 complete orbits around Earth', 'Manual fly-by-wire reentry attitude control', 'Overcame faulty landing bag sensor alarm'],
    nasaUrl: 'https://www.nasa.gov/mission/mercury-atlas-6/'
  },
  {
    id: 'mariner-2',
    year: 1962,
    title: 'Mariner 2 — First Successful Venus Interplanetary Flyby',
    period: 'Aug 27 – Dec 14, 1962',
    duration: '109 days cruise to Venus',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA02972/PIA02972~thumb.jpg',
    description: 'First successful robotic spacecraft to visit another planet, confirming Venus’s extreme greenhouse surface temperature (~428°C) and dense atmosphere.',
    highlights: ['First encounter with another planet', 'Measured continuous solar wind stream', 'Passed within 34,773 km of Venus'],
    nasaUrl: 'https://www.nasa.gov/mission/mariner-2/'
  },

  // 1965
  {
    id: 'gemini-4',
    year: 1965,
    title: 'Gemini 4 — Ed White Performs First American Spacewalk',
    period: 'Jun 3 – 7, 1965',
    duration: '4 days 1 hour (20 min EVA)',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/s66-45605/s66-45605~thumb.jpg',
    description: 'During Gemini 4, astronaut Ed White stepped outside the capsule tethered to oxygen, maneuvering with a handheld thruster gun for 20 minutes.',
    highlights: ['First US extravehicular activity (EVA)', '62 orbits around Earth', 'First multi-day crewed endurance check'],
    nasaUrl: 'https://www.nasa.gov/mission/gemini-iv/'
  },
  {
    id: 'mariner-4',
    year: 1965,
    title: 'Mariner 4 — First Close-Up Images of Mars Surface',
    period: 'Jul 15, 1965',
    duration: '228 days transit',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA02467/PIA02467~thumb.jpg',
    description: 'Mariner 4 performed the first successful flyby of Mars, returning 21 historic photographs that revealed impact craters and an ultra-thin atmosphere.',
    highlights: ['Returned first 21 close-up digital pictures of Mars', 'Measured thin CO2 atmospheric pressure (4-7 mbar)', 'Passed within 9,846 km of Martian surface'],
    nasaUrl: 'https://www.nasa.gov/mission/mariner-4/'
  },

  // 1968
  {
    id: 'apollo-7',
    year: 1968,
    title: 'Apollo 7 — First Crewed Apollo Flight Test',
    period: 'Oct 11 – 22, 1968',
    duration: '10 days 20 hours',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/S68-50712/S68-50712~thumb.jpg',
    description: 'Wally Schirra, Donn Eisele, and Walter Cunningham flight-certified the redesigned Apollo Command and Service Module in Earth orbit.',
    highlights: ['First live television broadcast from American space', 'Validated Service Propulsion System (SPS) engine', '163 orbits of Earth'],
    nasaUrl: 'https://www.nasa.gov/mission/apollo-7/'
  },
  {
    id: 'apollo-8',
    year: 1968,
    title: 'Apollo 8 — First Humans to Orbit the Moon & Earthrise',
    period: 'Dec 21 – 27, 1968',
    duration: '6 days 3 hours',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/as08-14-2383/as08-14-2383~thumb.jpg',
    description: 'Frank Borman, James Lovell, and William Anders became the first humans to leave low-Earth orbit, circle the Moon, and photograph the iconic "Earthrise".',
    highlights: ['First crewed translunar injection burn', '10 orbits around the Moon', 'Captured the immortal Earthrise photograph'],
    nasaUrl: 'https://www.nasa.gov/mission/apollo-8/'
  },

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
  },

  // 1976
  {
    id: 'viking-1-landing',
    year: 1976,
    title: 'Viking 1 — First Successful Mars Surface Touchdown',
    period: 'Jul 20, 1976 – Nov 11, 1982',
    duration: '6 years 116 days on Mars',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA00563/PIA00563~thumb.jpg',
    description: 'Viking 1 touched down in Chryse Planitia and transmitted the first color panoramic photo from the surface of Mars, analyzing Martian soil composition.',
    highlights: ['First operational landing on Mars surface', 'Returned over 50,000 photographs', 'Sampled soil for metabolic and organic signatures'],
    nasaUrl: 'https://www.nasa.gov/mission/viking-1/'
  },
  {
    id: 'viking-2-landing',
    year: 1976,
    title: 'Viking 2 — Touchdown in Utopia Planitia',
    period: 'Sep 3, 1976 – Apr 11, 1980',
    duration: '3 years 221 days',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA00396/PIA00396~thumb.jpg',
    description: 'Viking 2 landed 6,400 km away from Viking 1 in Utopia Planitia, operating a seismometer and analyzing water frost that coated the winter rocks.',
    highlights: ['Recorded Martian marsquakes and wind tremors', 'Photographed pure water frost on Martian rocks', 'Radioed weather station data across 4 seasons'],
    nasaUrl: 'https://www.nasa.gov/mission/viking-2/'
  },

  // 1977
  {
    id: 'voyager-2-launch',
    year: 1977,
    title: 'Voyager 2 Launch — Grand Tour of Outer Planets',
    period: 'Aug 20, 1977',
    duration: '47+ years active mission',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA01486/PIA01486~thumb.jpg',
    description: 'Launched 16 days before Voyager 1, Voyager 2 took advantage of a rare 175-year planetary alignment to visit Jupiter, Saturn, Uranus, and Neptune.',
    highlights: ['Only spacecraft to explore Uranus and Neptune', 'Discovered active nitrogen geysers on Triton', 'Entered interstellar space in November 2018'],
    nasaUrl: 'https://www.nasa.gov/mission/voyager-2/'
  },
  {
    id: 'voyager-1-launch',
    year: 1977,
    title: 'Voyager 1 Launch — Interstellar Voyager & Golden Record',
    period: 'Sep 5, 1977',
    duration: '47+ years active mission',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA21644/PIA21644~thumb.jpg',
    description: 'Voyager 1 was propelled onto a hyper-speed trajectory past Jupiter and Saturn’s moon Titan, carrying the Golden Record of Earth’s sounds and culture.',
    highlights: ['Most distant human-made object from Earth (>24 billion km)', 'First spacecraft to cross into interstellar space (2012)', 'Discovered active volcanic eruption plumes on Io'],
    nasaUrl: 'https://www.nasa.gov/mission/voyager-1/'
  },

  // 1981
  {
    id: 'sts-1',
    year: 1981,
    title: 'STS-1 — First Flight of Space Shuttle Columbia',
    period: 'Apr 12 – 14, 1981',
    duration: '2 days 6 hours (36 orbits)',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/8111969/8111969~thumb.jpg',
    description: 'Astronauts John Young and Robert Crippen launched on the maiden flight of Space Shuttle Columbia, inaugurating the reusable winged orbiter era.',
    highlights: ['First human orbital flight of a reusable winged spaceplane', 'Flew with solid rocket boosters on a crewed flight for the first time', 'Glided to unpowered landing at Edwards AFB'],
    nasaUrl: 'https://www.nasa.gov/mission/sts-1/'
  },

  // 1986
  {
    id: 'voyager-2-uranus',
    year: 1986,
    title: 'Voyager 2 — Historic Close-up Encounter with Uranus',
    period: 'Jan 24, 1986',
    duration: 'Flyby closest approach',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA01360/PIA01360~thumb.jpg',
    description: 'Voyager 2 arrived within 81,500 km of Uranus’s cloud tops, discovering 10 new moons, 2 new rings, and an intensely tilted magnetic field.',
    highlights: ['First and only encounter with ice giant Uranus', 'Photographed bizarre fractured canyons on moon Miranda', 'Discovered Uranus’s unique 60° tilted magnetic axis'],
    nasaUrl: 'https://www.nasa.gov/mission/voyager-2/'
  },

  // 1989
  {
    id: 'voyager-2-neptune',
    year: 1989,
    title: 'Voyager 2 — Discovery of Neptune and Triton Geysers',
    period: 'Aug 25, 1989',
    duration: 'Flyby closest approach',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA01492/PIA01492~thumb.jpg',
    description: 'Voyager 2 dipped just 4,950 km above Neptune’s north pole, revealing the Great Dark Spot, supersonic winds, and cryogenic nitrogen geysers on Triton.',
    highlights: ['Discovered supersonic winds of up to 2,100 km/h', 'Found 6 new moons and complete ring arcs', 'Photographed nitrogen ice geysers shooting 8 km high on Triton'],
    nasaUrl: 'https://www.nasa.gov/mission/voyager-2/'
  },
  {
    id: 'galileo-launch',
    year: 1989,
    title: 'Galileo Mission Launch to Jupiter',
    period: 'Oct 18, 1989',
    duration: '14-year mission life',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/S89-44173/S89-44173~thumb.jpg',
    description: 'Deployed from Space Shuttle Atlantis (STS-34), Galileo set out for Jupiter to deliver an atmospheric probe and become the first craft to orbit the giant planet.',
    highlights: ['First spacecraft to fly past an asteroid (Gaspra & Ida)', 'Discovered first asteroid moon (Dactyl)', 'Deployed first probe into Jupiter’s stormy atmosphere'],
    nasaUrl: 'https://www.nasa.gov/mission/galileo/'
  },

  // 1990
  {
    id: 'hubble-deployment',
    year: 1990,
    title: 'Hubble Space Telescope Deployed into Orbit (STS-31)',
    period: 'Apr 24 – 25, 1990',
    duration: '34+ years active observing',
    category: 'Astrophysics',
    thumbnail: 'https://images-assets.nasa.gov/image/s31-10-018/s31-10-018~thumb.jpg',
    description: 'Space Shuttle Discovery lifted the Hubble Space Telescope into low Earth orbit above atmospheric distortion, opening a revolutionary window onto the cosmos.',
    highlights: ['Over 1.5 million scientific observations', 'Determined the expansion rate of the universe (Hubble constant)', 'Produced iconic images like the Pillars of Creation'],
    nasaUrl: 'https://www.nasa.gov/mission/hubble-space-telescope/'
  },
  {
    id: 'pale-blue-dot',
    year: 1990,
    title: 'Voyager 1 Photographs Earth as "Pale Blue Dot"',
    period: 'Feb 14, 1990',
    duration: 'Interstellar Portrait',
    category: 'Solar & Space',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA00452/PIA00452~thumb.jpg',
    description: 'From 6 billion km away, Voyager 1 turned its camera back towards Earth upon Carl Sagan’s request, capturing Earth suspended as a tiny speck of light in a sunbeam.',
    highlights: ['Captured at distance of 6.05 billion km (40.5 AU)', 'Subject of Carl Sagan’s famous philosophical reflection', 'Part of the final Solar System Family Portrait'],
    nasaUrl: 'https://science.nasa.gov/resource/voyager-1s-pale-blue-dot/'
  },

  // 1995
  {
    id: 'galileo-probe',
    year: 1995,
    title: 'Galileo Probe Penetrates Jupiter’s Atmosphere',
    period: 'Dec 7, 1995',
    duration: '58 min extreme plunge',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA00227/PIA00227~thumb.jpg',
    description: 'The Galileo atmospheric probe slammed into Jupiter at 170,000 km/h, surviving deceleration forces of 228 g and transmitting data through 156 km of raging atmosphere.',
    highlights: ['Survived temperatures hotter than the surface of the Sun', 'Measured winds exceeding 650 km/h deep in the atmosphere', 'Found Jupiter atmosphere is drier and windier than modeled'],
    nasaUrl: 'https://www.nasa.gov/mission/galileo/'
  },

  // 1997
  {
    id: 'mars-pathfinder',
    year: 1997,
    title: 'Mars Pathfinder & Sojourner — First Mars Micro-Rover',
    period: 'Jul 4 – Sep 27, 1997',
    duration: '83 days operating on Mars',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA00609/PIA00609~thumb.jpg',
    description: 'Mars Pathfinder used an innovative airbag cocoon landing system to deploy Sojourner, the first wheeled rover on Mars, which drove 100 meters analyzing rocks.',
    highlights: ['First robotic wheeled rover on Mars', 'Used groundbreaking airbag impact cushioning', 'Streamed live images to millions on the early World Wide Web'],
    nasaUrl: 'https://www.nasa.gov/mission/mars-pathfinder/'
  },
  {
    id: 'cassini-launch',
    year: 1997,
    title: 'Cassini-Huygens Launch to Saturn and Titan',
    period: 'Oct 15, 1997',
    duration: '20-year mission lifetime',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA03463/PIA03463~thumb.jpg',
    description: 'A joint NASA/ESA flagship mission launched on a Titan IVB rocket, carrying the Cassini Saturn orbiter and ESA’s Huygens Titan atmospheric lander.',
    highlights: ['Most sophisticated interplanetary flagship probe', 'Discovered liquid methane lakes on Titan', 'Detected hydrothermal water geysers erupting from Enceladus'],
    nasaUrl: 'https://science.nasa.gov/mission/cassini/'
  },

  // 1998
  {
    id: 'iss-assembly-begins',
    year: 1998,
    title: 'International Space Station (ISS) Assembly Begins',
    period: 'Nov 20 – Dec 4, 1998',
    duration: '26+ years continuous operations',
    category: 'Infrastructure',
    thumbnail: 'https://images-assets.nasa.gov/image/KSC-98pc1413/KSC-98pc1413~thumb.jpg',
    description: 'Zarya and Unity modules mated in orbit during STS-88, inaugurating the largest cooperative peacetime engineering project in human history.',
    highlights: ['Over 270 astronauts from 21 nations have visited', 'Continuously occupied by humans since November 2, 2000', 'Travels at 28,000 km/h orbiting Earth every 90 minutes'],
    nasaUrl: 'https://www.nasa.gov/international-space-station/'
  },
  {
    id: 'deep-space-1',
    year: 1998,
    title: 'Deep Space 1 — Ion Engine & Autonomous Navigation',
    period: 'Oct 24, 1998',
    duration: '3-year technology testbed',
    category: 'Solar & Space',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA02450/PIA02450~thumb.jpg',
    description: 'Tested electrostatic xenon ion propulsion and autonomous artificial intelligence navigation, flyby of comet Borrelly and asteroid Braille.',
    highlights: ['First primary operational ion drive on deep-space probe', 'Achieved 16,265 hours of continuous thrusting', 'Paved the way for Dawn mission to Vesta & Ceres'],
    nasaUrl: 'https://www.nasa.gov/mission/deep-space-1/'
  },

  // 2004
  {
    id: 'spirit-rover',
    year: 2004,
    title: 'Spirit Rover (MER-A) Lands in Gusev Crater',
    period: 'Jan 4, 2004 – Mar 22, 2010',
    duration: '6 years 2 months (designed for 90 days)',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA05527/PIA05527~thumb.jpg',
    description: 'Spirit touched down using an airbag array in Gusev Crater, exploring Columbia Hills and uncovering silica deposits proving ancient volcanic hot springs.',
    highlights: ['Outlived 90-day design lifetime by 25x', 'Drove 7.73 km across rugged Martian terrain', 'Uncovered pure silica deposit indicating ancient hot water hydrothermal activity'],
    nasaUrl: 'https://science.nasa.gov/mission/mer-spirit/'
  },
  {
    id: 'opportunity-rover',
    year: 2004,
    title: 'Opportunity Rover (MER-B) Lands in Meridiani Planum',
    period: 'Jan 25, 2004 – Jun 10, 2018',
    duration: '14 years 136 days on Mars',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA20285/PIA20285~thumb.jpg',
    description: 'Opportunity scored an interplanetary hole-in-one in Eagle Crater, discovering hematite "blueberries" and rock layers formed in acidic standing water.',
    highlights: ['Drove an all-time interplanetary marathon of 45.16 km', 'Proved ancient liquid water pooled on Mars surface', 'Operated for more than 5,000 Martian sols'],
    nasaUrl: 'https://science.nasa.gov/mission/mer-opportunity/'
  },
  {
    id: 'cassini-saturn-insertion',
    year: 2004,
    title: 'Cassini-Huygens Enters Saturn Orbit',
    period: 'Jul 1, 2004',
    duration: '13-year orbital exploration',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA06077/PIA06077~thumb.jpg',
    description: 'Cassini slipped between Saturn’s F and G rings, igniting its main engine to become Saturn’s first artificial satellite, revealing ring dynamics.',
    highlights: ['First orbiter around Saturn', 'Released Huygens probe which landed on Titan (Jan 2005)', 'Discovered global ocean beneath Enceladus’s icy crust'],
    nasaUrl: 'https://science.nasa.gov/mission/cassini/'
  },

  // 2006
  {
    id: 'new-horizons-launch',
    year: 2006,
    title: 'New Horizons Launch to Pluto and the Kuiper Belt',
    period: 'Jan 19, 2006',
    duration: '9.5-year voyage to Pluto',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA19717/PIA19717~thumb.jpg',
    description: 'Launched at 58,536 km/h—the fastest launch departure velocity in history—New Horizons sped towards the dwarf planet Pluto and the Kuiper Belt.',
    highlights: ['Fastest spacecraft ever launched from Earth', 'Used Jupiter gravity assist to shave 3 years off transit', 'Carries ashes of Pluto discoverer Clyde Tombaugh'],
    nasaUrl: 'https://science.nasa.gov/mission/new-horizons/'
  },

  // 2011
  {
    id: 'sts-135-final-shuttle',
    year: 2011,
    title: 'STS-135 Atlantis — Final Flight of the Space Shuttle',
    period: 'Jul 8 – 21, 2011',
    duration: '12 days 18 hours',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/sts135-s-072/sts135-s-072~thumb.jpg',
    description: 'Space Shuttle Atlantis concluded 30 years of Shuttle service, delivering the Raffaello logistics module to the ISS and returning with museum honors.',
    highlights: ['135th and final Space Shuttle mission', 'Concluded 30-year operational history of Shuttle fleet', 'Delivered 4,260 kg of spare parts to ISS'],
    nasaUrl: 'https://www.nasa.gov/mission/sts-135/'
  },
  {
    id: 'curiosity-launch',
    year: 2011,
    title: 'Curiosity Rover (Mars Science Laboratory Launch)',
    period: 'Nov 26, 2011',
    duration: '8.5-month cruise to Mars',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA14156/PIA14156~thumb.jpg',
    description: 'An Atlas V rocket hurled the 1-ton, nuclear-powered Curiosity rover towards Mars, carrying laser spectrometers, wet chemistry, and sample drills.',
    highlights: ['Largest rover ever sent to Mars up to that time (899 kg)', 'Powered by multi-mission radioisotope thermoelectric generator (MMRTG)', 'Equipped with ChemCam rock-vaporizing laser'],
    nasaUrl: 'https://science.nasa.gov/mission/msl-curiosity/'
  },
  {
    id: 'juno-launch',
    year: 2011,
    title: 'Juno Launch — Journey to Jupiter’s Core',
    period: 'Aug 5, 2011',
    duration: '5-year cruise to Jupiter',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA14556/PIA14556~thumb.jpg',
    description: 'Juno launched to investigate Jupiter’s origins, deep interior structure, atmospheric water content, and enormous polar auroral storms.',
    highlights: ['Most distant solar-powered mission (9m solar panels)', 'Peered beneath Jupiter’s clouds to map gravity harmonics', 'Found a fuzzy, diluted core extending across half the planet’s radius'],
    nasaUrl: 'https://science.nasa.gov/mission/juno/'
  },

  // 2012
  {
    id: 'curiosity-landing',
    year: 2012,
    title: 'Curiosity Rover Lands in Gale Crater via Sky Crane',
    period: 'Aug 6, 2012 – Present',
    duration: '12+ years active science on Mars',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA15981/PIA15981~thumb.jpg',
    description: 'Curiosity executed the heart-stopping "7 Minutes of Terror" landing, lowered gently to the floor of Gale Crater by a rocket-powered Sky Crane.',
    highlights: ['Pioneered rocket Sky Crane descent architecture', 'Proved Gale Crater once hosted a freshwater lake suitable for microbial life', 'Has climbed over 800m up Mount Sharp'],
    nasaUrl: 'https://science.nasa.gov/mission/msl-curiosity/'
  },
  {
    id: 'voyager-1-interstellar',
    year: 2012,
    title: 'Voyager 1 Crosses into Interstellar Space',
    period: 'Aug 25, 2012',
    duration: 'Historical Milestone',
    category: 'Solar & Space',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA17046/PIA17046~thumb.jpg',
    description: 'Voyager 1 became the first human-made object to cross the heliopause and enter interstellar space, detecting a 40x jump in galactic cosmic ray density.',
    highlights: ['Left the Sun’s protective magnetic bubble (heliosphere)', 'First direct sampling of pristine interstellar medium', 'Transmitting data across 22 light-hours distance'],
    nasaUrl: 'https://www.nasa.gov/mission/voyager-1/'
  },

  // 2015
  {
    id: 'new-horizons-pluto',
    year: 2015,
    title: 'New Horizons Historical Pluto Flyby — The Heart of Pluto',
    period: 'Jul 14, 2015',
    duration: '12,500 km closest approach',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA19952/PIA19952~thumb.jpg',
    description: 'New Horizons flew past Pluto, revealing a dynamic world with towering water-ice mountains, glaciers of nitrogen ice in Tombaugh Regio, and blue skies.',
    highlights: ['First close-up reconnaissance of Pluto & Charon', 'Discovered active nitrogen convection cells in Sputnik Planitia', 'Revealed Charon’s dark red tholin-covered north pole (Mordor Macula)'],
    nasaUrl: 'https://science.nasa.gov/mission/new-horizons/'
  },
  {
    id: 'dawn-ceres',
    year: 2015,
    title: 'Dawn Orbit Insertion at Dwarf Planet Ceres',
    period: 'Mar 6, 2015 – Nov 1, 2018',
    duration: '3.5 years in orbit',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA19547/PIA19547~thumb.jpg',
    description: 'Dawn became the first spacecraft to orbit two different extraterrestrial bodies (Vesta and Ceres), discovering bright sodium carbonate salt deposits in Occator Crater.',
    highlights: ['First probe to orbit two separate celestial bodies', 'Discovered subterranean brine reservoir on Ceres', 'Mapped bright reflective salt deposits in Occator Crater'],
    nasaUrl: 'https://science.nasa.gov/mission/dawn/'
  },

  // 2018
  {
    id: 'parker-solar-probe',
    year: 2018,
    title: 'Parker Solar Probe Launch — Touching the Sun',
    period: 'Aug 12, 2018 – Present',
    duration: '7-year nominal mission',
    category: 'Solar & Space',
    thumbnail: 'https://images-assets.nasa.gov/image/KSC-20180419-PH_KLS01_0009/KSC-20180419-PH_KLS01_0009~thumb.jpg',
    description: 'Parker Solar Probe is swooping within 6.1 million km of the Sun’s surface at up to 690,000 km/h, protected by an 11.4 cm carbon-composite heat shield.',
    highlights: ['Fastest human-made object ever built (up to 692,000 km/h)', 'First spacecraft to fly inside the Sun’s corona', 'Discovered magnetic "switchbacks" in the solar wind'],
    nasaUrl: 'https://science.nasa.gov/mission/parker-solar-probe/'
  },
  {
    id: 'insight-mars',
    year: 2018,
    title: 'InSight Mars Lander — The First Mars Seismometer',
    period: 'Nov 26, 2018 – Dec 15, 2022',
    duration: '4 years 19 days on Mars',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/PIA22872/PIA22872~thumb.jpg',
    description: 'InSight touched down on Elysium Planitia, deploying an ultra-sensitive seismometer (SEIS) that recorded over 1,300 marsquakes and mapped Mars’s crust and liquid core.',
    highlights: ['Recorded largest marsquake ever observed (magnitude 4.7)', 'Measured Mars’s molten metallic core radius (~1,830 km)', 'Mapped subsurface layers down to 200 km depth'],
    nasaUrl: 'https://science.nasa.gov/mission/insight/'
  },

  // 2020
  {
    id: 'perseverance-launch',
    year: 2020,
    title: 'Perseverance & Ingenuity Launch to Mars',
    period: 'Jul 30, 2020',
    duration: '7-month cruise to Mars',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/NHQ202007300004/NHQ202007300004~thumb.jpg',
    description: 'Launched atop an Atlas V from Cape Canaveral, Perseverance set off on a mission to seek signs of ancient life and cache sample tubes for future return to Earth.',
    highlights: ['Carried Ingenuity Mars Helicopter beneath rover belly', 'Equipped with MOXIE oxygen generation experiment', 'Fitted with PIXL and SHERLOC biosignature spectrometers'],
    nasaUrl: 'https://science.nasa.gov/mission/mars-2020-perseverance/'
  },
  {
    id: 'osiris-rex-tag',
    year: 2020,
    title: 'OSIRIS-REx Touch-And-Go Sample Collection at Asteroid Bennu',
    period: 'Oct 20, 2020',
    duration: 'TAG sampling event',
    category: 'Planetary',
    thumbnail: 'https://images-assets.nasa.gov/image/DSCN0120/DSCN0120~thumb.jpg',
    description: 'OSIRIS-REx extended its robotic sampling arm TAGSAM, tapped asteroid Bennu’s surface, and fired pressurized nitrogen gas to collect over 120 grams of carbon-rich regolith.',
    highlights: ['First US mission to sample an asteroid surface', 'Collected over twice the required sample mass (>120 grams)', 'Discovered Bennu behaves like a fluid ball of pebbles'],
    nasaUrl: 'https://science.nasa.gov/mission/osiris-rex/'
  },
  {
    id: 'crew-dragon-demo-2',
    year: 2020,
    title: 'Crew Dragon Demo-2 — First Commercial Crew Human Launch',
    period: 'May 30 – Aug 2, 2020',
    duration: '64 days orbital mission',
    category: 'Crewed',
    thumbnail: 'https://images-assets.nasa.gov/image/NHQ202005300010/NHQ202005300010~thumb.jpg',
    description: 'NASA astronauts Bob Behnken and Doug Hurley launched to the ISS aboard SpaceX Crew Dragon, restoring American human orbital launch capability from US soil.',
    highlights: ['First human orbital launch from US soil since Shuttle retirement (2011)', 'Certified Commercial Crew public-private partnership', 'Safe parachute splashdown in Gulf of Mexico'],
    nasaUrl: 'https://www.nasa.gov/commercial-crew-program/'
  },

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

// Fallback high-res fallback thumbnails if remote URL is blocked by network
export const FALLBACK_THUMBNAILS: Record<string, string> = {
  'explorer-1': '/assets/loading/artemis_launch.jpg',
  'apollo-11': '/assets/loading/apollo_bootprint.jpg',
  'apollo-17': '/assets/loading/apollo_bootprint.jpg',
  'perseverance-landing': '/assets/loading/mars_perseverance.jpg',
  'jwst-first-images': '/assets/loading/carina_nebula.png',
  'artemis-1': '/assets/loading/orion_earth_view.jpg',
  'artemis-2': '/assets/loading/artemis_launch.jpg',
  'artemis-base-camp': '/assets/loading/orion_earth_view.jpg'
};

/**
 * Returns complete timeline year structures from 1958 to 2030.
 * Formulates the exact bubble representation:
 * - If 1 event: 1 thumbnail bubble
 * - If 2 events: 2 thumbnail bubbles
 * - If > 2 events: 2 thumbnail bubbles + 3rd bubble with dots '...' and moreCount
 */
export function buildTimelineYears(startYear = 1958, endYear = 2030): TimelineYearItem[] {
  const eventMap = new Map<number, NasaMissionEvent[]>();
  NASA_MISSION_EVENTS.forEach(ev => {
    const list = eventMap.get(ev.year) ?? [];
    list.push(ev);
    eventMap.set(ev.year, list);
  });

  const timeline: TimelineYearItem[] = [];
  for (let y = startYear; y <= endYear; y++) {
    const events = eventMap.get(y) ?? [];
    const bubbles: TimelineBubble[] = [];

    if (events.length === 1) {
      bubbles.push({
        id: events[0].id,
        title: events[0].title,
        thumbnail: events[0].thumbnail
      });
    } else if (events.length === 2) {
      bubbles.push(
        { id: events[0].id, title: events[0].title, thumbnail: events[0].thumbnail },
        { id: events[1].id, title: events[1].title, thumbnail: events[1].thumbnail }
      );
    } else if (events.length > 2) {
      // First 2 events get thumbnail bubbles
      bubbles.push(
        { id: events[0].id, title: events[0].title, thumbnail: events[0].thumbnail },
        { id: events[1].id, title: events[1].title, thumbnail: events[1].thumbnail },
        // 3rd bubble represents '...' for the rest
        { id: `${y}-more`, isMore: true, moreCount: events.length - 2 }
      );
    }

    timeline.push({
      year: y,
      hasEvents: events.length > 0,
      events,
      bubbles
    });
  }

  return timeline;
}

/** Get all event thumbnail URLs for preloading */
export function getAllBubbleThumbnailUrls(): string[] {
  const set = new Set<string>();
  NASA_MISSION_EVENTS.forEach(ev => {
    if (ev.thumbnail) set.add(ev.thumbnail);
  });
  return Array.from(set);
}
