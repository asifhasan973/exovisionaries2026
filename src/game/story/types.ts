/** The supplied script is the copy authority for the new pre-launch adventure. */
export type StoryCharacterId = 'chief' | 'commander';
export type PlayerGender = 'male' | 'female';
export type StoryExpression = 'welcoming' | 'grateful' | 'proud' | 'surprised' | 'confident' | 'thoughtful' | 'encouraging' | 'determined' | 'curious' | 'focused';
export type StoryPose = 'greet' | 'listen' | 'explain' | 'think' | 'point' | 'ready';

export interface CharacterCue {
  character: StoryCharacterId;
  expression: StoryExpression;
  pose: StoryPose;
}

export interface StoryLine {
  id: string;
  /** Full source sentence, including original punctuation and spelling. */
  text: string;
  sourceSpeaker: 'Chief' | 'Charlie' | 'Commander';
  speaker: CharacterCue;
  listener?: CharacterCue;
  /** Only the source's example name changes when a player enters their name. */
  nameSlots?: 'greeting';
}

export type ChoiceKey = 'destination' | 'objective' | 'site';
export type ChoiceId = 'moon' | 'mars' | 'coming-soon' | 'lunar-ice' | 'lunar-geology' | 'crater-rim' | 'permanent-shadow' | 'lunar-highlands' | 'ancient-crater';
export interface StoryChoice {
  id: ChoiceId;
  label: string;
  description?: string;
  available: boolean;
}

export type StoryStepId = 'player-name' | 'appointment' | 'companion-intro' | 'destination' | 'objective-briefing' | 'objective' | 'site-briefing' | 'site' | 'resource-briefing' | 'resource-limits' | 'lander-build' | 'rover-select' | 'science-build' | 'power-build' | 'survival-build' | 'crew-briefing' | 'crew-selection' | 'crew-plan' | 'crew-check' | 'systems-check' | 'stress-check' | 'mass-check' | 'power-check' | 'budget-check' | 'rocket-pack' | 'launch-ready' | 'liftoff' | 'earth-orbit' | 'moon-transfer' | 'lunar-orbit' | 'lunar-descent' | 'lunar-surface' | 'surface-explore' | 'surface-ready' | 'ice-science' | 'science-ready' | 'surface-recovery' | 'surface-secured' | 'crew-return' | 'mission-debrief';
export type ActivityId = 'resource-limits' | 'lander-build' | 'rover-select' | 'science-build' | 'power-build' | 'survival-build' | 'crew-selection' | 'crew-plan' | 'crew-check' | 'systems-check' | 'stress-check' | 'mass-check' | 'power-check' | 'budget-check' | 'rocket-pack' | 'launch-ready' | 'liftoff' | 'earth-orbit' | 'moon-transfer' | 'lunar-orbit' | 'lunar-descent' | 'surface-deploy' | 'surface-explore' | 'ice-science' | 'surface-recovery' | 'crew-return';

interface BaseStep { id: StoryStepId; title: string; module: 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 }
export type StoryStep =
  | (BaseStep & { kind: 'name' })
  | (BaseStep & { kind: 'conversation'; lines: readonly StoryLine[] })
  | (BaseStep & { kind: 'choice'; choiceKey: ChoiceKey; options: readonly StoryChoice[] })
  | (BaseStep & { kind: 'activity'; activity: ActivityId })
  | (BaseStep & { kind: 'endpoint' });

export interface StoryProgress {
  version: 1;
  playerName: string;
  playerGender: PlayerGender;
  stepId: StoryStepId;
  lineIndex: number;
  selections: Partial<Record<ChoiceKey, ChoiceId>>;
  completedActivities: ActivityId[];
  history: { stepId: StoryStepId; lineIndex: number }[];
  /** Optional for old saves. Assistance labels never award mission completion. */
  assistance?: ('auto-build' | 'judge-demo')[];
}

export type StoryEvent =
  | { type: 'set-name'; name: string; gender?: PlayerGender }
  | { type: 'next' }
  | { type: 'skip-briefing' }
  | { type: 'back' }
  | { type: 'select'; choiceId: ChoiceId }
  | { type: 'complete-activity'; activity: ActivityId };
