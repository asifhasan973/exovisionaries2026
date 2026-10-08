import { reduceMission } from '../src/game/story/workshopSession.ts';
export function finishTrial(session) {
  session = reduceMission(session, { type: 'trial-drive' });
  for (const action of ['trial-drill', 'trial-return', null]) {
    for (let count = 0; count < 200 && ['outbound', 'drilling', 'returning'].includes(session.readiness.trial.phase); count++) session = reduceMission(session, { type: 'trial-tick', seconds: .25 });
    if (action) session = reduceMission(session, { type: action });
  }
  return session;
}
export function satisfyInteraction(session) {
  if (session.progress.stepId === 'mass-check') return reduceMission(session, { type: 'connect-radar' });
  if (session.progress.stepId === 'power-check') return finishTrial(session);
  return session;
}
