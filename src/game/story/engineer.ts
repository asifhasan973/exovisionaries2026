import type { CharacterCue } from './types.ts';
import type { ENGINEER_LINES } from './voiceClips.ts';

/** Use only performances actually supplied for Commander in the art manifest. */
export function engineerCue(reaction: keyof typeof ENGINEER_LINES, eventId = ''): CharacterCue {
  const celebrate = reaction === 'complete' || reaction === 'trialPass';
  const warn = reaction === 'warning' || reaction === 'trialFail';
  if (celebrate || /-(complete|landed|docked|splashdown|delivered|samplesStowed)$/.test(eventId)) return { character: 'commander', expression: 'grateful', pose: 'ready' };
  if (/-(clue|report|analysis|survey|listening|sampleFirst|inconclusive)$/.test(eventId)) return { character: 'commander', expression: 'curious', pose: 'think' };
  if (/-(paused|pause|hold|coast|wait)$/.test(eventId)) return { character: 'commander', expression: 'thoughtful', pose: 'listen' };
  if (/-(burn|tli|loi|drill|ascending|entry|flying|liftoff|countdown)$/.test(eventId)) return { character: 'commander', expression: 'determined', pose: 'point' };
  if (/-(ready|plan|route|scout|terrain|sensorSite)$/.test(eventId) && !warn) return { character: 'commander', expression: 'confident', pose: 'explain' };
  return { character: 'commander', expression: celebrate ? 'grateful' : warn ? 'thoughtful' : reaction === 'intro' ? 'confident' : 'encouraging', pose: celebrate ? 'ready' : warn ? 'think' : 'explain' };
}
