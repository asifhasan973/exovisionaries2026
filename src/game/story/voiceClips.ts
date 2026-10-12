import { CHECK_LINES } from './moon/checkCopy.ts';
import { CREW_ADVICE, CREW_BRIEFING } from './moon/crewDialogue.ts';
import { STORY_DIALOGUE } from './dialogue.ts';
import { GLOSSARY } from './glossary.ts';
import { COMPACT_DIALOGUE } from './compactCopy.ts';
import type { StoryCharacterId } from './types.ts';

export const ENGINEER_LINES = {
  lander: 'Nice fit! Our lander is coming together.',
  rover: 'Rover ready! Its power use changes our battery time.',
  science: 'Tool secured! Choose how deep we should drill.',
  power: 'Power connected! Watch our time in shadow.',
  survival: 'Good choice! Your explorer is better protected.',
  complete: 'You did it! This system is ready.',
  warning: 'Over budget! Swap an upgrade before launch.',
  depth: 'Deeper drilling uses more energy. Save enough to come back.',
  intro: 'Let’s build! Pick a part and drag it into the bay.',
  trialPass: 'We made it back with energy to spare. Great planning!',
  trialFail: 'Our test found a problem. Change the equipment and try again.',
} as const;
export type EngineerReaction = keyof typeof ENGINEER_LINES;
const EXTRA_ENGINEER_LINES: Partial<Record<EngineerReaction, readonly string[]>> = {
  lander: [
    'Great work! Another piece of our lander is ready.',
    'Locked in! Let’s keep building.',
    'Perfect! Our lander is taking shape.',
    'You’ve got it! That part is secure.',
    'Looking good, Explorer! What comes next?',
  ],
  rover: ['Wheels ready! Let’s explore.', 'Good pick! Our rover is ready to roll.', 'Explorer on board! Let’s pack its tools.'],
  science: ['Science gear ready! Keep building.', 'Tool locked in! Great work, Explorer.', 'Another tool ready for discovery!'],
  power: ['Connected! Our explorer has more power.', 'Power ready! Keep an eye on the battery.', 'Good work! Let’s keep our explorer running.'],
  survival: ['Protected! Ready for the next challenge.', 'System secure! Great planning.', 'Good pick! One step closer to launch.'],
  complete: ['Mission step complete! You’re doing great.', 'All set! Let’s tackle the next step.', 'Brilliant work! This system is ready to go.'],
};
export const ENGINEER_REPLIES = Object.fromEntries(Object.entries(ENGINEER_LINES).map(([reaction, text]) => [reaction,
  [text, ...(EXTRA_ENGINEER_LINES[reaction as EngineerReaction] ?? [])].map((reply, index) => ({
    id: `engineer-${reaction}${index ? `-${index}` : ''}`, text: reply,
  })),
])) as Record<EngineerReaction, { id: string; text: string }[]>;

/** Random replies stay within the same event and never repeat the preceding reply. */
export function pickEngineerReply(reaction: EngineerReaction, previousId?: string, random = Math.random) {
  const replies = ENGINEER_REPLIES[reaction];
  const candidates = replies.filter(reply => reply.id !== previousId);
  const pool = candidates.length ? candidates : replies;
  return pool[Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))];
}
export const FLIGHT_LINES = {
  'flight-ready-guided': 'All systems go! We’ll pause when it’s your turn.',
  'flight-ready-challenge': 'Release when the band turns green. Ready?',
  'flight-retry': 'Missed it? Retry this stage. You’ve got this!',
  'flight-paused': 'Flight paused. Continue when you’re ready.',
  'flight-drop-booster': 'Empty booster! Let’s drop that extra weight.',
  'flight-open-cover': 'Clear of thick air. Open the cover!',
  'flight-green-booster': 'Green! Separate the empty booster now.',
  'flight-green-fairing': 'Green! Release the fairing now.',
  'flight-countdown': 'Countdown started. Here we go!',
  'flight-orbit-burn': 'Explorer uncovered. Next stop: Earth orbit!',
  'flight-upper-burn': 'Clean release! Our upper stage is pushing.',
  'flight-liftoff': 'Liftoff! Watch Earth fall away.',
  'flight-complete': 'We made it! Earth orbit!',
  'flight-wrong-order': 'Wrong order. Separate the booster first.',
  'flight-too-soon-booster': 'Too soon! The booster is still pushing. Wait for green.',
  'flight-too-soon-fairing': 'Too soon! Keep the fairing through the thick air.',
  'flight-try-green': 'Try again. Release while the band is green.',
} as const;
export function flightVoiceId(text: string) {
  return Object.entries(FLIGHT_LINES).find(([,line]) => line === text)?.[0];
}
export const REPAIR_LINES = {
  'repair-science-mass': 'Choose a lighter science tool or leave an extra one behind.',
  'repair-thermal': 'Advanced protection keeps us warm in cold shadows.',
  'repair-energy': 'A bigger battery saves enough energy to get home.',
  'repair-depth': 'A shorter drill uses less energy. Save enough for the trip home.',
  'repair-peak': 'This part needs less power at once. Our battery can handle it better.',
  'repair-mass': 'This lighter part saves weight so our rocket can carry everything.',
  'repair-budget': 'This part costs less. Keep our mission within budget.',
  'repair-remove-mass': 'Leave this extra tool behind to save weight.',
  'repair-remove-budget': 'Leave this extra tool behind to save credits.',
  'repair-remove-peak': 'Leave this extra tool behind so we use less power at once.',
} as const;
export const VOICE_CLIPS: Record<string, { text: string; character: StoryCharacterId }> = Object.fromEntries([
  ...Object.entries(CHECK_LINES).map(([id,text]) => [`check-${id}`, {text,character:'commander' as const}]),
  ...CREW_BRIEFING.map(line => [line.id, { text: line.text, character: line.speaker.character }]),
  ...Object.entries(CREW_ADVICE).map(([id,text]) => [`crew-advice-${id}`, {text,character:'commander' as const}]),
  ...Object.values(STORY_DIALOGUE).flat().map(line => [line.id, { text: line.text, character: line.speaker.character }]),
  ...Object.values(STORY_DIALOGUE).flat().filter(line => COMPACT_DIALOGUE[line.id]).map(line => [`short-${line.id}`, { text: COMPACT_DIALOGUE[line.id], character: line.speaker.character }]),
  ...Object.values(ENGINEER_REPLIES).flat().map(({ id, text }) => [id, { text, character: 'commander' as const }]),
  ...Object.entries(GLOSSARY).map(([id, term]) => [`word-${id}`, { text: `${term.name}. ${term.text} ${term.example}`, character: 'commander' as const }]),
  ...Object.entries(REPAIR_LINES).map(([id,text]) => [id, {text,character:'commander' as const}]),
  ...Object.entries(FLIGHT_LINES).map(([id,text]) => [id, {text,character:'commander' as const}]),
  ['greeting-welcome', {text:'Good to see you, Commander.',character:'chief' as const}],
]);

/** Use the same recorded Chief for custom names; the on-screen greeting keeps the player's name. */
export function recordedVoiceURL(id: string | undefined, text: string, character: StoryCharacterId, gender: 'male' | 'female' = 'female') {
  if ((id === 'short-appointment-01' || id === 'appointment-01') && character === 'chief' && text !== VOICE_CLIPS[id]?.text && /^.+, good to see you\.$/.test(text)) {
    return `${import.meta.env?.BASE_URL ?? '/'}story/audio/greeting-welcome.mp3`;
  }
  const clip = id ? VOICE_CLIPS[id] : undefined;
  return clip?.text === text && clip.character === character ? `${import.meta.env?.BASE_URL ?? '/'}story/audio/${character === 'commander' && gender === 'male' ? 'male-' : ''}${id}.mp3` : null;
}
