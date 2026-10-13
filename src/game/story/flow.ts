import {GEOLOGY_SITE_BRIEFING} from './moon/geologyCopy.ts';
import { STORY_DIALOGUE } from './dialogue.ts';
import type { StoryLine, StoryStep, StoryStepId } from './types.ts';
import { CREW_BRIEFING } from './moon/crewDialogue.ts';

/** Ordered screen contract; the later modules implement these screens. */
export const STORY_FLOW: readonly StoryStep[] = [
  { id: 'player-name', title: 'Enter ur name', kind: 'name', module: 4 },
  { id: 'appointment', title: 'Mission Commander', kind: 'conversation', lines: STORY_DIALOGUE.appointment, module: 4 },
  { id: 'companion-intro', title: 'Your mission companion', kind: 'conversation', lines: STORY_DIALOGUE.companionIntro, module: 4 },
  { id: 'destination', title: 'Planet selection', kind: 'choice', choiceKey: 'destination', module: 4, options: [
    { id: 'moon', label: 'Moon', available: true },
    { id: 'mars', label: 'Mars', available: false },
    { id: 'coming-soon', label: 'Comming Soon', available: false }
  ] },
  { id: 'objective-briefing', title: 'Mission Objective', kind: 'conversation', lines: STORY_DIALOGUE.objectiveBriefing, module: 4 },
  { id: 'objective', title: 'Mission Objective', kind: 'choice', choiceKey: 'objective', module: 4, options: [
    { id: 'lunar-ice', label: 'Mission A — Lunar South Pole Ice Explorer', available: true },
    { id: 'lunar-geology', label: 'Mission B — Lunar Geology Explorer', available: true }
  ] },
  { id: 'site-briefing', title: 'Landing Site', kind: 'conversation', lines: STORY_DIALOGUE.siteBriefing, module: 4 },
  { id: 'site', title: 'Landing Site Selection', kind: 'choice', choiceKey: 'site', module: 4, options: [
    { id: 'crater-rim', label: '🧊 SITE A — Ice-Proximity Crater Rim', description: 'Balanced exploration mission ⭐\nModerate risk • Short ice traverse • High science', available: true },
    { id: 'permanent-shadow', label: '🌑 SITE B — Permanently Shadowed Region', description: 'Extreme science mission\nVery high risk • Maximum ice access • Severe power/thermal challenges', available: true }
  ] },
  { id: 'resource-briefing', title: 'Make every decision count', kind: 'conversation', lines: STORY_DIALOGUE.resourceBriefing, module: 4 },
  { id: 'resource-limits', title: 'Spacecraft Design Specifications', kind: 'activity', activity: 'resource-limits', module: 5 },
  { id: 'lander-build', title: '🚀 LANDER SYSTEM', kind: 'activity', activity: 'lander-build', module: 5 },
  { id: 'rover-select', title: '🤖 CHOOSE YOUR ROVER', kind: 'activity', activity: 'rover-select', module: 5 },
  { id: 'science-build', title: 'Choose science package - Mandatory', kind: 'activity', activity: 'science-build', module: 5 },
  { id: 'power-build', title: 'Power management', kind: 'activity', activity: 'power-build', module: 5 },
  { id: 'survival-build', title: 'Survival', kind: 'activity', activity: 'survival-build', module: 5 },
  { id: 'crew-briefing', title: 'Meet your crew', kind: 'conversation', lines: CREW_BRIEFING, module: 8 },
  { id: 'crew-selection', title: 'Choose your crew', kind: 'activity', activity: 'crew-selection', module: 8 },
  { id: 'crew-plan', title: 'Your crew is ready', kind: 'activity', activity: 'crew-plan', module: 8 },
  { id: 'crew-check', title: 'Crew & supplies', kind: 'activity', activity: 'crew-check', module: 6 },
  { id: 'mass-check', title: 'MASS CHECK', kind: 'activity', activity: 'mass-check', module: 6 },
  { id: 'power-check', title: 'POWER CHECK', kind: 'activity', activity: 'power-check', module: 6 },
  { id: 'budget-check', title: 'BUDGET CHECK', kind: 'activity', activity: 'budget-check', module: 6 },
  { id: 'systems-check', title: 'Check the return path', kind: 'activity', activity: 'systems-check', module: 6 },
  { id: 'stress-check', title: 'Practice Moon decisions', kind: 'activity', activity: 'stress-check', module: 6 },
  { id: 'rocket-pack', title: 'Rocket Design', kind: 'activity', activity: 'rocket-pack', module: 6 },
  { id: 'launch-ready', title: 'Departure plan ready', kind: 'activity', activity: 'launch-ready', module: 6 },
  { id: 'liftoff', title: 'Launch your explorer', kind: 'activity', activity: 'liftoff', module: 7 },
  { id: 'earth-orbit', title: 'Choose your Moon route', kind: 'activity', activity: 'earth-orbit', module: 9 },
  { id: 'moon-transfer', title: 'Journey to the Moon', kind: 'activity', activity: 'moon-transfer', module: 9 },
  { id: 'lunar-orbit', title: 'Lunar orbit reached', kind: 'activity', activity: 'lunar-orbit', module: 9 },
  { id: 'lunar-descent', title: 'Land on the Moon', kind: 'activity', activity: 'lunar-descent', module: 10 },
  { id: 'lunar-surface', title: 'Deploy your rover', kind: 'activity', activity: 'surface-deploy', module: 11 },
  { id: 'surface-explore', title: 'Explore your Moon route', kind: 'activity', activity: 'surface-explore', module: 11 },
  { id: 'surface-ready', title: 'Your surface route is ready', kind: 'activity', activity: 'surface-explore', module: 11 },
  { id: 'ice-science', title: 'Find the evidence', kind: 'activity', activity: 'ice-science', module: 12 },
  { id: 'science-ready', title: 'Science delivered', kind: 'activity', activity: 'ice-science', module: 12 },
  { id: 'surface-recovery', title: 'Secure the surface', kind: 'activity', activity: 'surface-recovery', module: 13 },
  { id: 'surface-secured', title: 'Surface secured', kind: 'activity', activity:'surface-recovery', module: 13 },
  {id:'crew-return',title:'Bring our crew home',kind:'activity',activity:'crew-return',module:14},
  {id:'mission-debrief',title:'Mission complete',kind:'endpoint',module:14}
];

export function getStoryStep(id: StoryStepId, objective?:string): StoryStep {
  const step = STORY_FLOW.find(item => item.id === id);
  if (!step) throw new Error(`Unknown story step: ${id}`);
  if(objective==='lunar-geology'&&step.kind==='choice'&&step.choiceKey==='site')return {...step,options:[{id:'lunar-highlands',label:'Lunar highlands',description:'Ancient crust · sunlit camp',available:true},{id:'ancient-crater',label:'Ancient impact crater',description:'Mixed rocks · impact clues',available:true}]};
  if(objective==='lunar-geology'&&step.id==='site-briefing'&&step.kind==='conversation')return {...step,lines:GEOLOGY_SITE_BRIEFING};
  return step;
}

export function getDialogueText(line: StoryLine, playerName: string): string {
  return line.nameSlots === 'greeting' && playerName
    ? line.text.replace(/^Charlie,/, () => `${playerName},`)
    : line.text;
}

/** All displayed Commander replies belong to the companion, not a playable astronaut. */
export function getSpeakerLabel(line: StoryLine, playerName: string): string {
  return line.sourceSpeaker === 'Charlie' ? playerName || 'Charlie' : line.sourceSpeaker;
}
