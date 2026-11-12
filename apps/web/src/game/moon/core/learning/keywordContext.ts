import type { StoryStepId } from "../types";
import { GLOSSARY, type LearningTerm } from "./glossary";

export interface KeywordScene {
  stepId?: StoryStepId;
  text?: string;
  objective?: string;
  activity?: string;
}

const ALIASES: Partial<Record<LearningTerm, string[]>> = {
  xrf: ["XRF", "Element scanner", "X-ray fluorescence"],
  xrd: ["XRD", "Crystal lab", "X-ray diffraction"],
  gpr: ["GPR", "Layer radar", "Ground-penetrating radar"],
  seismometer: ["Moonquake sensor", "Seismometer"],
  adapter: ["Adapter", "Payload mount"],
  anorthosite: ["Ancient crust rock", "Anorthosite"],
  basalt: ["Lava rock", "Basalt"],
  breccia: ["Impact-mixed rock", "Breccia"],
  deltav: ["Delta-v", "Delta v", "Δv"],
  thrust: ["Engine thrust", "Thrust"],
  eva: ["EVA", "Extravehicular activity", "Suit time"],
  nss: ["NSS", "Neutron Spectrometer System"],
  nirvss: ["NIRVSS", "Near-Infrared Volatiles Spectrometer System"],
  msolo: ["MSOLO", "Mass Spectrometer Observing Lunar Operations"],
  isp: ["Isp", "Specific impulse"],
  tdb: ["TDB", "Barycentric Dynamical Time"],
  watts: ["Watts"],
  wh: ["Watt-hours", "Watt hours", "Wh"],
  solar: ["Solar array", "Solar panels", "Solar panel"],
  shadow: [
    "Permanent shadow",
    "Permanently shadowed region",
    "Permanently shadowed",
  ],
  objective: ["Mission objective", "Objective"],
  peak: ["Peak load", "Peak power"],
  battery: ["Battery", "Batteries"],
  sample: ["Rock sample", "Soil sample"],
};
const phrases = (Object.keys(GLOSSARY) as LearningTerm[])
  .flatMap((term) =>
    (ALIASES[term] ?? [GLOSSARY[term].name]).map((name) => ({ term, name })),
  )
  .sort((a, b) => b.name.length - a.name.length);
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pattern = new RegExp(
  `(?<![\\p{L}\\p{N}_])(?:${phrases.map((p) => escape(p.name)).join("|")})(?![\\p{L}\\p{N}_])`,
  "giu",
);
const termByName = new Map(phrases.map((p) => [p.name.toLowerCase(), p.term]));

/** Longer aliases win; each keyword gets only one inline help button. */
export function matchLearningTerms(
  text: string,
): { term: LearningTerm; start: number; end: number }[] {
  const seen = new Set<LearningTerm>();
  return [...text.matchAll(pattern)].flatMap((match) => {
    const term = termByName.get(match[0].toLowerCase())!;
    if (seen.has(term)) return [];
    seen.add(term);
    return [{ term, start: match.index, end: match.index + match[0].length }];
  });
}

const STAGE_TERMS: Partial<Record<StoryStepId, LearningTerm[]>> = {
  appointment: ["mission", "objective"],
  "companion-intro": ["mission"],
  destination: ["mission", "gravity"],
  "objective-briefing": ["objective", "evidence"],
  objective: ["objective", "geology", "hydrogen"],
  "site-briefing": ["crater", "shadow"],
  site: ["crater", "shadow", "geology"],
  "resource-briefing": ["mass", "power", "budget"],
  "resource-limits": ["mass", "power", "budget"],
  "lander-build": ["lander", "thrust", "radar", "navigation"],
  "rover-select": ["rover", "reliability", "stereocamera"],
  "science-build": ["nss", "nirvss", "trident", "msolo"],
  "power-build": ["solar", "battery", "peak", "wh"],
  "survival-build": ["thermal", "communication", "radiation"],
  "crew-briefing": ["astrobiologist", "eva", "crewdays"],
  "crew-selection": ["astrobiologist", "geology", "eva"],
  "crew-plan": ["crewdays", "eva", "contingency"],
  "crew-check": ["crewdays", "eva", "reserve"],
  "mass-check": ["mass", "drymass", "payload"],
  "power-check": ["power", "peak", "wh", "reserve"],
  "budget-check": ["budget", "credits"],
  "systems-check": ["contingency", "docking", "communication"],
  "stress-check": ["evidence", "reliability"],
  "rocket-pack": ["adapter", "payload", "fairing"],
  "rocket-assembly": ["booster", "upperstage", "escapetower", "propellant"],
  "launch-ready": ["thrust", "propellant", "contingency"],
  liftoff: ["booster", "thrust", "upperstage", "fairing"],
  "earth-orbit": ["parkingorbit", "moontransfer", "deltav", "trajectory"],
  "moon-transfer": [
    "deltav",
    "burnwindow",
    "coasting",
    "moontransfer",
    "lunarcapture",
  ],
  "lunar-orbit": ["lunarorbit", "lunarcapture", "braking"],
  "lunar-descent": ["descent", "braking", "throttle", "radar", "gravity"],
  "lunar-surface": ["rover", "eva", "dust"],
  "surface-explore": ["navigation", "stereocamera", "battery", "reserve"],
  "surface-ready": ["evidence", "sample"],
  "ice-science": ["hydrogen", "hydroxyl", "nss", "nirvss", "trident", "msolo"],
  "science-ready": ["evidence", "confidence", "communication"],
  "surface-recovery": ["dust", "care", "calibration", "spaceweather"],
  "surface-secured": ["reserve", "contingency"],
  "crew-return": [
    "ascent",
    "rendezvous",
    "docking",
    "reentry",
    "heatshield",
    "parachutes",
  ],
  "mission-debrief": ["evidence", "confidence", "objective"],
};

export function getContextualTerms({
  stepId,
  text = "",
  objective,
  activity,
}: KeywordScene): LearningTerm[] {
  const sampling =
    [
      "lunar-surface",
      "surface-explore",
      "surface-ready",
      "ice-science",
      "science-ready",
    ].includes(stepId ?? "") &&
    ["drilling", "collecting", "sample-result"].includes(activity ?? "");
  const science =
    stepId === "ice-science" || stepId === "science-build" || sampling;
  const defaults =
    objective === "lunar-geology" && science
      ? ([
          "plagioclase",
          "xrf",
          "xrd",
          "gpr",
          "seismometer",
          "interpretation",
        ] as LearningTerm[])
      : science
        ? STAGE_TERMS["ice-science"]!
        : ((stepId ? STAGE_TERMS[stepId] : []) ?? []);
  return [
    ...new Set([...matchLearningTerms(text).map((x) => x.term), ...defaults]),
  ].slice(0, 8);
}
