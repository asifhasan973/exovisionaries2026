import { STORY_DIALOGUE } from './dialogue.ts';
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
export const VOICE_CLIPS: Record<string, { text: string; character: StoryCharacterId }> = Object.fromEntries([
  ...Object.values(STORY_DIALOGUE).flat().map(line => [line.id, { text: line.text, character: line.speaker.character }]),
  ...Object.entries(ENGINEER_LINES).map(([id, text]) => [`engineer-${id}`, { text, character: 'commander' as const }]),
]);

/** Fixed local recordings; a personalized greeting uses the browser's selected male voice. */
export function recordedVoiceURL(id: string | undefined, text: string, character: StoryCharacterId) {
  const clip = id ? VOICE_CLIPS[id] : undefined;
  return clip?.text === text && clip.character === character ? `${import.meta.env?.BASE_URL ?? '/'}story/audio/${id}.mp3` : null;
}
