import type { StoryLine } from '../types.ts';

/** Adapted from Final One's crew briefing; clarified for the supplied three-person architecture. */
export const CREW_BRIEFING: readonly StoryLine[] = [
  {id:'crew-briefing-1',text:'Your explorer is built. Time to choose your crew.',sourceSpeaker:'Chief',speaker:{character:'chief',expression:'proud',pose:'explain'},listener:{character:'commander',expression:'curious',pose:'listen'}},
  {id:'crew-briefing-2',text:'Who should come with us?',sourceSpeaker:'Commander',speaker:{character:'commander',expression:'curious',pose:'think'},listener:{character:'chief',expression:'encouraging',pose:'listen'}},
  {id:'crew-briefing-3',text:'Take one science expert and one support expert.',sourceSpeaker:'Chief',speaker:{character:'chief',expression:'confident',pose:'point'},listener:{character:'commander',expression:'thoughtful',pose:'listen'}},
  {id:'crew-briefing-4',text:'Two of us land. Our support expert stays in orbit.',sourceSpeaker:'Commander',speaker:{character:'commander',expression:'confident',pose:'explain'},listener:{character:'chief',expression:'encouraging',pose:'listen'}},
  {id:'crew-briefing-5',text:'Match each expert to the right job. You have this, Commander!',sourceSpeaker:'Chief',speaker:{character:'chief',expression:'encouraging',pose:'ready'},listener:{character:'commander',expression:'grateful',pose:'ready'}},
];

/** Short recorded reactions use the same character voices as the existing story. */
export const CREW_ADVICE = {
  intro: 'Match a scientist and a support expert.',
  complete: 'Great team! Our flight checks come next.',
  scienceSeat: 'Now tap the science seat.',
  supportSeat: 'Now tap the support seat.',
  wrongScience: 'That job needs a scientist. Try a science expert!',
  wrongSupport: 'That job needs a support expert. Try the other seat!',
  robotics: 'Our robotics expert helps save drive energy.',
  systems: 'Our engineer can help with power, heat and radio repairs.',
  geologist: 'Our geologist will help read rock clues.',
  astrobiologist: 'Our astrobiologist will help read water clues.',
  open: 'Seat open. Try another expert.',
} as const;
