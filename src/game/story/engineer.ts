import type { CharacterCue } from './types.ts';
import type { ENGINEER_LINES } from './voiceClips.ts';

/** Use only performances actually supplied for Commander in the art manifest. */
export function engineerCue(reaction: keyof typeof ENGINEER_LINES): CharacterCue {
  const celebrate = reaction === 'complete' || reaction === 'trialPass';
  const warn = reaction === 'warning' || reaction === 'trialFail';
  return { character: 'commander', expression: celebrate ? 'grateful' : warn ? 'thoughtful' : reaction === 'intro' ? 'confident' : 'encouraging', pose: celebrate ? 'ready' : warn ? 'think' : 'explain' };
}
