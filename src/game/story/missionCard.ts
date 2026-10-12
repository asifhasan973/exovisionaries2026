import { preparationTotals, partById } from './preparation.ts';
import type { WorkshopSession } from './workshopSession.ts';
/** A shareable image drawn from the approved design; no raw state or private metadata. */
export function missionCardPNG(session: WorkshopSession) {
  const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 700;
  const ctx = canvas.getContext('2d'); if (!ctx) return '';
  const totals = preparationTotals(session.preparation);
  ctx.fillStyle = '#140e29'; ctx.fillRect(0,0,1000,700);
  ctx.strokeStyle = '#9c54ba'; ctx.lineWidth = 3; ctx.strokeRect(28,28,944,644);
  ctx.fillStyle = '#ec8cef'; ctx.font = 'bold 30px sans-serif'; ctx.fillText('ZERO TO BEYOND',65,95);
  ctx.fillStyle = '#ffdf68'; ctx.font = 'bold 48px sans-serif'; ctx.fillText(session.moon.human.approved ? 'MOON DEPARTURE PLAN · READY' : 'MOON MISSION · APPROVED',65,175,870);
  ctx.fillStyle = '#f4e9ff'; ctx.font = 'bold 35px sans-serif'; ctx.fillText(session.progress.playerName,65,238,800);
  ctx.font = '24px sans-serif';
  const rows = session.moon.human.approved ? [session.progress.selections.objective === 'lunar-geology' ? 'Geology Explorer · crewed Moon mission' : 'Ice Explorer · crewed Moon mission', `${totals.massKg} kg equipment · ${totals.credits} / 1,000 game credits`, 'Three crew · two land · one stays in lunar orbit', `${session.moon.plan.days} days planned + 2 spare · supplies loaded`, 'Crew ✓  Power ✓  Budget ✓  Return ✓  Rehearsal ✓', 'Departure plan locked · no flight executed yet'] : [partById(session.preparation.roverId)?.name ?? 'Explorer', session.progress.selections.site === 'permanent-shadow' ? 'Deep shadow route' : 'Crater rim route', `${totals.massKg} kg · ${totals.credits} / 1,000 game credits`, `${totals.batteryWh} Wh battery · ${session.preparation.drillDepthCm} cm drill plan`, 'Mass ✓  Power practice ✓  Budget ✓', 'Explorer packed · ready for launch'];
  rows.forEach((row,i) => ctx.fillText(row,65,302+i*49,860));
  ctx.fillStyle = '#b4a0c2'; ctx.font = '18px sans-serif'; ctx.fillText(session.moon.human.approved ? 'Crewed Moon plan · authored game values · preparation only' : 'Robotic Moon mission · game design values · Milestone 1',65,638);
  return canvas.toDataURL('image/png');
}
