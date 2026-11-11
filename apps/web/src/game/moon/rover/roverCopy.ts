export const ROVER_TALKS = {
  intro: [
    { speaker: "Commander", text: "We’ll control the rover from here." },
    { speaker: "Scientist", text: "First, collect the sample in sunlight." },
  ],
  setback: [
    { speaker: "Scientist", text: "Too hard to drill. Try the nearby site." },
    { speaker: "Commander", text: "New target marked. Let’s try there." },
  ],
  launch: [
    { speaker: "Scientist", text: "Both samples secured." },
    { speaker: "Commander", text: "Ready for ascent." },
  ],
} as const;
export const ROVER_NOTICES = {
  ready: "Choose any site. You’re driving.",
  rock: "Rock ahead. Reverse or steer around it.",
  edge: "Survey boundary. Turn back into the map.",
  hard: "Too hard to drill. Try another site.",
  sample: "Sample secured. Bring it back to the lander.",
  deposit: "Samples unloaded and saved.",
  checkpoint: "Sunny checkpoint saved. Stop here to recharge.",
  heat: "Let the drill cool.",
} as const;

export const ROVER_RADIO = {
  charge: {
    speaker: "Scientist",
    text: "Hold the charge control. Then head into shadow.",
  },
  charged: {
    speaker: "Scientist",
    text: "Charged. The shadow outcrop is marked.",
  },
  first: {
    speaker: "Commander",
    text: "First sample delivered. Stop anywhere in sunlight to recharge when needed.",
  },
  second: {
    speaker: "Commander",
    text: "Both samples delivered. Park the rover inside.",
  },
} as const;
