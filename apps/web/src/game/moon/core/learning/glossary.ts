import { GEOLOGY_PARTS } from "@/game/moon/science/geology";
/** Small explanations: game balance values stay distinct from real hardware data. */
export const GLOSSARY = {
  ascent: {
    name: "Ascent",
    icon: "🚀",
    text: "Going up from the Moon.",
    example:
      "The upper cabin takes two explorers back to their friend in orbit.",
  },
  docking: {
    name: "Docking",
    icon: "🧩",
    text: "Joining two spacecraft gently.",
    example: "Line them up and move slowly, like joining two toy blocks.",
  },
  heatshield: {
    name: "Heat shield",
    icon: "🛡️",
    text: "A special layer that protects the cabin from very hot air.",
    example: "Point the wide shield forward when coming back to Earth.",
  },
  reentry: {
    name: "Re-entry",
    icon: "🌍",
    text: "Coming back into the air around Earth.",
    example: "Earth’s air slows our cabin. The shield keeps the heat outside.",
  },
  parachutes: {
    name: "Parachutes",
    icon: "🪂",
    text: "Big cloth shapes that catch air and slow a falling cabin.",
    example:
      "They open near Earth. The Moon has no thick air, so we use engines there.",
  },
  mineral: {
    name: "Mineral",
    icon: "💎",
    text: "A natural solid that is one of the ingredients in a rock.",
    example:
      "One rock can contain several minerals. Matching tools help us find which ones.",
  },
  plagioclase: {
    name: "Plagioclase",
    icon: "⬜",
    text: "A pale natural crystal found in many Moon rocks.",
    example:
      "It can be in other rock types too. Check a second kind of clue before naming the rock.",
  },
  elements: {
    name: "Elements",
    icon: "🧱",
    text: "Tiny kinds of building pieces that make up rocks and other things.",
    example:
      "Calcium and aluminium are two kinds. A scanner checks which pieces a rock contains.",
  },
  anorthosite: {
    name: "Ancient crust rock \u00b7 Anorthosite",
    icon: "⬜",
    text: "A pale rock that makes up much of the Moon’s oldest outer layer.",
    example:
      "Many Moon highland rocks are like this. Light and element clues help us check.",
  },
  basalt: {
    name: "Lava rock \u00b7 Basalt",
    icon: "🌋",
    text: "Rock made when hot melted rock cools.",
    example: "We look for matching mineral and element clues before naming it.",
  },
  breccia: {
    name: "Impact-mixed rock \u00b7 Breccia",
    icon: "🧩",
    text: "Different broken rock pieces joined together.",
    example:
      "A big space-rock crash can break and mix Moon rocks. A mixed soil sample alone is not proof.",
  },
  xrf: {
    name: "XRF \u00b7 Element scanner",
    icon: "🧱",
    text: "A tool that checks which tiny building pieces are in a rock.",
    example:
      "Elements are like ingredients. This tool checks them, not how the crystals are arranged.",
  },
  xrd: {
    name: "XRD \u00b7 Crystal lab",
    icon: "💎",
    text: "A tool that finds what a rock is made of by checking its tiny crystal shapes.",
    example: "First collect a sample. Then the lab checks its crystal pattern.",
  },
  gpr: {
    name: "GPR \u00b7 Ground-penetrating radar",
    icon: "📡",
    text: "A tool that listens for radio echoes from under the ground.",
    example:
      "An echo can show a boundary. It cannot name a rock’s ingredients.",
  },
  seismometer: {
    name: "Moonquake sensor \u00b7 Seismometer",
    icon: "〰️",
    text: "A tool that records tiny shakes in the ground.",
    example:
      "Put it away from moving wheels. One short reading cannot tell us everything inside the Moon.",
  },
  sample: {
    name: "Rock sample",
    icon: "🪨",
    text: "A small piece of rock or soil saved for testing.",
    example:
      "A scoop takes a surface piece. A drill can take deeper material. Keep its place and depth label.",
  },
  mission: {
    name: "Mission",
    icon: "🚀",
    text: "A job to do in space.",
    example: "Our job: look for clues of ice on the Moon.",
  },
  objective: {
    name: "Objective",
    icon: "🎯",
    text: "The thing you want to find or do.",
    example: "Like a treasure hunt: your goal is to find ice clues.",
  },
  lander: {
    name: "Lander",
    icon: "🛬",
    text: "A spacecraft that lands on the ground.",
    example: "It carries our rover safely down to the Moon.",
  },
  rover: {
    name: "Rover",
    icon: "🛞",
    text: "A robot with wheels that explores the ground.",
    example: "Like a little car that can work on the Moon!",
  },
  mass: {
    name: "Mass",
    icon: "⚖️",
    text: "How much stuff is in something, measured in kilograms (kg).",
    example: "More parts add more mass. Our rocket can only carry so much.",
  },
  budget: {
    name: "Budget",
    icon: "🪙",
    text: "How many game coins you can spend.",
    example: "Your mission shows a coin limit. Keep your choices under it.",
  },
  credits: {
    name: "Credits",
    icon: "🪙",
    text: "The pretend coins we use to buy game parts.",
    example: "100 credits means 100 game coins. It is not a real price.",
  },
  power: {
    name: "Power",
    icon: "⚡",
    text: "How fast something uses energy.",
    example: "A busy drill uses energy faster than a small camera.",
  },
  peak: {
    name: "Peak load",
    icon: "⚡",
    text: "The most power your equipment needs at one time.",
    example: "When the drill starts, it may need a big burst of power.",
  },
  energy: {
    name: "Energy",
    icon: "🔋",
    text: "The stored supply that helps things work.",
    example: "A full battery holds more energy than an empty one.",
  },
  battery: {
    name: "Battery",
    icon: "🔋",
    text: "A box that stores energy to run your robot.",
    example: "In a dark crater, the battery keeps the rover moving.",
  },
  watts: {
    name: "W · Watts",
    icon: "⚡",
    text: "A number that tells us how fast energy is used or made.",
    example: "A 100 W robot uses energy faster than a 50 W robot.",
  },
  wh: {
    name: "Wh · Watt-hours",
    icon: "🔋",
    text: "A number that tells us how much energy a battery holds.",
    example:
      "For the same robot, a bigger Wh number means the battery lasts longer.",
  },
  reserve: {
    name: "Reserve",
    icon: "🏠",
    text: "Energy you save for later.",
    example:
      "We leave 20% in the battery, like saving a snack for the trip home.",
  },
  solar: {
    name: "Solar array",
    icon: "☀️",
    text: "Panels that turn sunlight into electricity.",
    example:
      "They need sunlight. In dark shadow, they cannot charge our battery.",
  },
  shadow: {
    name: "Permanent shadow",
    icon: "🌑",
    text: "A place where sunlight never reaches the ground.",
    example: "Some deep Moon craters stay dark and very cold.",
  },
  thermal: {
    name: "Thermal protection",
    icon: "🧥",
    text: "Layers that protect a spacecraft or robot from too much heat or cold.",
    example: "Like a warm coat and a heater for our rover.",
  },
  navigation: {
    name: "Navigation",
    icon: "🧭",
    text: "Finding the way to a place.",
    example: "Cameras help our rover spot rocks and choose a safe path.",
  },
  communication: {
    name: "Communication",
    icon: "📡",
    text: "Sending messages to someone far away.",
    example: "The rover uses a radio to send its discoveries to the lander.",
  },
  radar: {
    name: "Radar",
    icon: "📡",
    text: "A tool that sends out radio waves and listens for them to bounce back.",
    example: "It helps the lander tell how close the ground is.",
  },
  antenna: {
    name: "Antenna",
    icon: "📡",
    text: "A part that sends and catches radio messages.",
    example: "Like ears for the robot’s radio.",
  },
  drill: {
    name: "Drill depth",
    icon: "🪛",
    text: "How far your tool digs into the ground.",
    example: "A deeper hole takes more time and battery energy.",
  },
  reliability: {
    name: "Reliability",
    icon: "🛡️",
    text: "How often something works without trouble.",
    example: "A higher game rating means a better chance of working well.",
  },
  geology: {
    name: "Geology",
    icon: "🪨",
    text: "Learning about rocks and the ground.",
    example: "Moon rocks can tell us what happened there long ago.",
  },
  crater: {
    name: "Crater rim",
    icon: "🌙",
    text: "The raised edge of a large bowl-shaped hole in the ground.",
    example:
      "A Moon crater’s edge can get light while its deep floor stays dark.",
  },
  payload: {
    name: "Payload",
    icon: "📦",
    text: "The things a rocket is carrying to space.",
    example: "Our lander, rover and tools travel inside the rocket.",
  },
  adapter: {
    name: "Adapter \u00b7 Payload mount",
    icon: "🧩",
    text: "A joining piece that holds two things together.",
    example: "It holds our explorer firmly inside the rocket.",
  },
  fairing: {
    name: "Fairing",
    icon: "🛡️",
    text: "The rocket’s protective cover.",
    example: "It protects our explorer from fast-moving air during launch.",
  },
  booster: {
    name: "Booster",
    icon: "🚀",
    text: "A rocket part that gives a big push at launch.",
    example: "When its fuel is used up, we let it go to carry less mass.",
  },
  eva: {
    name: "EVA \u00b7 Extravehicular activity",
    icon: "🧑‍🚀",
    text: "Time astronauts spend outside their spacecraft.",
    example:
      "Their suits carry a limited supply. They go back inside before it runs low.",
  },
  thrust: {
    name: "Thrust",
    icon: "🚀",
    text: "The push made by a rocket engine.",
    example: "More upward push helps our lander slow down.",
  },
  gravity: {
    name: "Gravity",
    icon: "⬇️",
    text: "The pull that brings things toward a moon or planet.",
    example:
      "Moon gravity pulls our lander down. The engine helps it land softly.",
  },
  abort: {
    name: "Abort",
    icon: "🛡️",
    text: "Stop the landing when it is unsafe.",
    example:
      "With enough fuel and height, our crew can climb back toward orbit.",
  },
  orbit: {
    name: "Orbit",
    icon: "🌍",
    text: "A path around a planet, moon, or star.",
    example:
      "Our spacecraft moves sideways fast enough to keep going around Earth.",
  },
  rehearsal: {
    name: "Rehearsal",
    icon: "🎮",
    text: "A practice run before the real adventure.",
    example:
      "Try driving and drilling here. Practice samples earn no science points.",
  },
  dust: {
    name: "Moon dust",
    icon: "🪨",
    text: "Tiny, sharp bits of Moon soil that stick to tools.",
    example:
      "Digging can put dust on a camera or solar panel. The Moon has no wind like Earth.",
  },
  radiation: {
    name: "Space radiation",
    icon: "🛡️",
    text: "Tiny fast particles and energy from space that can hurt people.",
    example:
      "During a space-weather alert, our crew stays inside a protective shelter.",
  },
  care: {
    name: "Care kit",
    icon: "🧹",
    text: "Cleaning tools packed before launch.",
    example:
      "Our crew can use one cleaning kit at Base. It improves the view, but some sticky dust stays.",
  },
  hydrogen: {
    name: "Hydrogen",
    icon: "🔎",
    text: "A tiny building piece of many things, including water.",
    example: "Finding it is a clue. It does not always mean there is ice.",
  },
  hydroxyl: {
    name: "Hydroxyl",
    icon: "🧩",
    text: "An oxygen piece joined to a hydrogen piece, which is only part of water.",
    example:
      "It is not a whole water molecule. We need more clues before saying there is water.",
  },
  evidence: {
    name: "Evidence",
    icon: "🕵️",
    text: "Clues that help us check an answer.",
    example: "Two tools agreeing gives us a stronger clue than guessing.",
  },
  confidence: {
    name: "Confidence",
    icon: "✅",
    text: "How sure we are about what a clue means.",
    example: "A faint or mixed clue means we should say we are not sure yet.",
  },
  nss: {
    name: "NSS \u00b7 Neutron Spectrometer System",
    icon: "🔎",
    text: "A tool that looks for tiny particle clues to help find water’s building pieces.",
    example:
      "It can find hydrogen clues. More tools must check whether there is water ice.",
  },
  nirvss: {
    name: "NIRVSS \u00b7 Near-Infrared Volatiles Spectrometer System",
    icon: "🌈",
    text: "A tool that uses light we cannot see to look for water and rock clues.",
    example: "The light can give clues about water and minerals.",
  },
  trident: {
    name: "TRIDENT",
    icon: "🪛",
    text: "A drill that brings little pieces of Moon soil up to the surface.",
    example: "Other tools can study the pieces it digs up.",
  },
  msolo: {
    name: "MSOLO \u00b7 Mass Spectrometer Observing Lunar Operations",
    icon: "🫧",
    text: "A tool that checks gases coming from Moon soil.",
    example: "It helps scientists look for clues of water and other gases.",
  },
  astrobiologist: {
    name: "Astrobiologist",
    icon: "🔎",
    text: "A scientist who looks for signs of life beyond Earth.",
    example: "",
  },
  braking: {
    name: "Braking burn",
    icon: "🔎",
    text: "An engine push that slows a spacecraft down.",
    example: "",
  },
  burnwindow: {
    name: "Burn window",
    icon: "🔎",
    text: "The right time to fire a spacecraft’s engine.",
    example: "",
  },
  calibration: {
    name: "Calibration",
    icon: "🔎",
    text: "Checking a tool so its readings are right.",
    example: "",
  },
  coasting: {
    name: "Coasting",
    icon: "🔎",
    text: "Moving through space with the engines turned off.",
    example: "",
  },
  contingency: {
    name: "Contingency",
    icon: "🔎",
    text: "A backup plan for when something goes wrong.",
    example: "",
  },
  ejecta: {
    name: "Crater ejecta",
    icon: "🔎",
    text: "Rock and dust thrown out when something crashes into the ground.",
    example: "",
  },
  crewdays: {
    name: "Crew-days",
    icon: "🔎",
    text: "A way to count supplies, where one person for one day uses one crew-day.",
    example: "",
  },
  crystalpattern: {
    name: "Crystal pattern",
    icon: "🔎",
    text: "The repeating way tiny pieces fit together inside a crystal.",
    example: "",
  },
  deltav: {
    name: "Delta-v · Change in speed",
    icon: "🔎",
    text: "How much a spacecraft can change its speed or direction.",
    example: "",
  },
  descent: {
    name: "Descent",
    icon: "🔎",
    text: "Moving down toward the ground.",
    example: "",
  },
  drymass: {
    name: "Dry mass",
    icon: "🔎",
    text: "How much a spacecraft and its cargo weigh without fuel.",
    example: "",
  },
  parkingorbit: {
    name: "Earth parking orbit",
    icon: "🔎",
    text: "A path around Earth where a spacecraft waits before flying farther.",
    example: "",
  },
  ephemeris: {
    name: "Ephemeris",
    icon: "🔎",
    text: "A timetable showing where planets and moons will be.",
    example: "",
  },
  escapetower: {
    name: "Escape tower",
    icon: "🔎",
    text: "A small rocket that pulls the crew’s cabin away from danger at launch.",
    example: "",
  },
  flyby: {
    name: "Flyby",
    icon: "🔎",
    text: "Flying past a planet or moon without landing or staying there.",
    example: "",
  },
  highgain: {
    name: "High-gain communication",
    icon: "🔎",
    text: "Sending a radio message in a narrow beam to reach far away.",
    example: "",
  },
  rocketequation: {
    name: "Ideal rocket equation",
    icon: "🔎",
    text: "A rule that links a rocket’s fuel and mass to how much it can change speed.",
    example: "",
  },
  isp: {
    name: "Isp · Specific impulse",
    icon: "🔎",
    text: "A measure of how much push an engine gets from its fuel.",
    example: "",
  },
  lunarcapture: {
    name: "Lunar capture",
    icon: "🔎",
    text: "Slowing down near the Moon so the spacecraft stays around it.",
    example: "",
  },
  lunarorbit: {
    name: "Lunar orbit",
    icon: "🔎",
    text: "A path that goes around the Moon.",
    example: "",
  },
  interpretation: {
    name: "Mineral interpretation",
    icon: "🔎",
    text: "Using rock clues to work out what a rock is made of.",
    example: "",
  },
  moontransfer: {
    name: "Moon transfer",
    icon: "🔎",
    text: "The trip from a path around Earth to the Moon.",
    example: "",
  },
  neutrons: {
    name: "Neutrons",
    icon: "🔎",
    text: "Tiny pieces inside most atoms that can help us look for water clues.",
    example: "",
  },
  propellant: {
    name: "Propellant",
    icon: "🔎",
    text: "The material a rocket throws out to push itself along.",
    example: "",
  },
  rendezvous: {
    name: "Rendezvous",
    icon: "🔎",
    text: "Bringing two spacecraft close together in the same part of space.",
    example: "",
  },
  spaceweather: {
    name: "Space weather",
    icon: "🔎",
    text: "Changes from the Sun that can affect people and machines in space.",
    example: "",
  },
  stereocamera: {
    name: "Stereo hazard camera",
    icon: "🔎",
    text: "Two cameras that work together to spot bumps and holes ahead.",
    example: "",
  },
  tdb: {
    name: "TDB · Barycentric Dynamical Time",
    icon: "🔎",
    text: "A shared space clock used to work out where planets and moons will be.",
    example: "",
  },
  throttle: {
    name: "Throttle",
    icon: "🔎",
    text: "The control that makes an engine push more or less.",
    example: "",
  },
  trajectory: {
    name: "Trajectory",
    icon: "🔎",
    text: "The path a spacecraft follows as it moves.",
    example: "",
  },
  upperstage: {
    name: "Upper stage",
    icon: "🔎",
    text: "The top rocket section that keeps pushing after the lower sections fall away.",
    example: "",
  },
  volatiles: {
    name: "Volatiles",
    icon: "🔎",
    text: "Materials such as water that can turn into gas when warmed.",
    example: "",
  },
} as const;
export type LearningTerm = keyof typeof GLOSSARY;
export const PART_TERMS: Record<string, LearningTerm> = {
  "lander-body": "lander",
  "landing-engines": "lander",
  "landing-radar": "radar",
  "navigation-computer": "navigation",
  "lander-antenna": "antenna",
  "landing-cameras": "navigation",
  "basic-rover": "rover",
  "polar-rover": "rover",
  "heavy-rover": "rover",
  nss: "nss",
  nirvss: "nirvss",
  trident: "trident",
  msolo: "msolo",
  "field-care-kit": "care",
  "standard-solar": "solar",
  "efficient-solar": "solar",
  "small-battery": "battery",
  "medium-battery": "battery",
  "large-battery": "battery",
  "basic-navigation-camera": "navigation",
  "stereo-hazard-camera": "stereocamera",
  "basic-thermal": "thermal",
  "advanced-thermal": "thermal",
  "basic-communication": "communication",
  "high-gain-communication": "highgain",
};

for (const p of GEOLOGY_PARTS)
  PART_TERMS[p.id] =
    p.scienceFamily === "sample"
      ? "sample"
      : p.scienceFamily === "ir"
        ? "geology"
        : p.scienceFamily === "camera"
          ? "evidence"
          : p.scienceFamily;

export const WORD_GROUPS: {
  name: string;
  icon: string;
  terms: LearningTerm[];
}[] = [
  {
    name: "Rocket",
    icon: "🚀",
    terms: [
      "braking",
      "burnwindow",
      "coasting",
      "contingency",
      "deltav",
      "descent",
      "drymass",
      "parkingorbit",
      "ephemeris",
      "escapetower",
      "flyby",
      "rocketequation",
      "isp",
      "lunarcapture",
      "lunarorbit",
      "moontransfer",
      "propellant",
      "rendezvous",
      "tdb",
      "throttle",
      "trajectory",
      "upperstage",

      "ascent",
      "docking",
      "heatshield",
      "reentry",
      "parachutes",
      "mission",
      "objective",
      "lander",
      "payload",
      "adapter",
      "fairing",
      "booster",
      "orbit",
      "thrust",
      "gravity",
      "abort",
      "mass",
      "budget",
      "credits",
    ],
  },
  {
    name: "Energy",
    icon: "🔋",
    terms: [
      "power",
      "peak",
      "energy",
      "battery",
      "watts",
      "wh",
      "reserve",
      "solar",
    ],
  },
  {
    name: "Rock lab",
    icon: "🪨",
    terms: [
      "ejecta",
      "crystalpattern",
      "interpretation",

      "mineral",
      "plagioclase",
      "elements",
      "anorthosite",
      "basalt",
      "breccia",
      "sample",
      "xrf",
      "xrd",
      "gpr",
      "seismometer",
    ],
  },
  {
    name: "Moon",
    icon: "🌙",
    terms: [
      "astrobiologist",
      "crewdays",
      "spaceweather",
      "volatiles",

      "dust",
      "radiation",
      "care",
      "shadow",
      "thermal",
      "geology",
      "crater",
      "eva",
      "rehearsal",
    ],
  },
  {
    name: "Rover & tools",
    icon: "🛞",
    terms: [
      "calibration",
      "highgain",
      "neutrons",
      "stereocamera",

      "hydrogen",
      "hydroxyl",
      "evidence",
      "confidence",
      "rover",
      "navigation",
      "communication",
      "radar",
      "antenna",
      "drill",
      "reliability",
      "nss",
      "nirvss",
      "trident",
      "msolo",
    ],
  },
];
