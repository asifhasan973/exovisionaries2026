import {returnedSampleKg} from './geologyScience.ts';
import type {WorkshopSession} from '../workshopSession.ts';
import {deliveredPoints} from './science.ts';
import {returnResources,missionOutcome,RETURN_MODEL} from './return.ts';
import {equipmentIds,equipmentReport} from './catalog.ts';
import {missionAssistance} from './assistance.ts';
import {MISSION_SOURCES,MODEL_BOUNDARIES} from './missionSources.ts';
export function missionCard(s:WorkshopSession){
  const m=s.moon,r=m.returnFlight,equipment=equipmentReport(equipmentIds(s.preparation,m.objective??'lunar-ice',m.geologyPartIds),m.objective??'lunar-ice'),resources=returnResources(m,r);
  const sources=MISSION_SOURCES.filter(source=>['apollo','return','rocket',...(m.objective==='lunar-geology'?['rocks','xray']:['viper','operations','water'])].includes(source.id));
  return {title:'Zero To Beyond · Moon mission',player:s.progress.playerName,objective:m.objective,site:m.site,seed:m.scenarioSeed,model:RETURN_MODEL.id,scienceModel:m.science.model,
    outcome:missionOutcome(m),crew:[m.crew.commander,m.crew.scientist,m.crew.support].map(id=>id==='commander'?s.progress.playerName:id?.replaceAll('-',' ')??'unassigned'),
    crewRecovered:r.crewLocation==='ocean'?3:0,deliveredSciencePoints:deliveredPoints(m.science),physicalSampleReturnedKg:r.crewLocation==='ocean'?returnedSampleKg(m):0,samples:m.science.samples,seismometerSite:m.science.seismometerSite,
    measurements:m.science.records.map(record=>({...record})),interpretations:{...m.science.accepted},
    equipment:equipment.parts.map(p=>({id:p.id,name:p.name})),credits:equipment.credits,massKg:equipment.massKg,drillDepthCm:s.preparation.drillDepthCm,
    route:m.journey.route,elapsedDays:resources.elapsedMissionSeconds/86400,crewDaysRemaining:resources.supportUnitsRemaining,
    cabinEnergyKWh:(resources.platformEnergyWh??0)/1000,ascentFuelUsedKg:r.ascentUsedKg,earthReturnFuelUsedKg:r.serviceUsedKg,
    assisted:missionAssistance(s).length>0,assistance:missionAssistance(s),corrections:r.mistakes,incidents:m.science.hazards.log,
    decisions:r.commands.filter(c=>c.type==='action'),fieldworkStopped:m.science.fieldworkStopped,
    assumptions:['Authored game masses and timing, not a certified mission trajectory.','Rover and descent stage remain on the Moon.',m.objective==='lunar-geology'?`Sealed samples: ${returnedSampleKg(m).toFixed(1)} kg. Data and sample receipts required.`:'Data returned; no physical sample was collected for Earth return.','Cabin food and power include the three-day coast.'],modelBoundaries:MODEL_BOUNDARIES,sources:sources.map(source=>source.url),sourceDetails:sources};
}
export function downloadMissionCard(s:WorkshopSession){
  const card=missionCard(s);if(card.crewRecovered!==3)return;
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=820;const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.fillStyle='#141027';ctx.fillRect(0,0,1200,820);ctx.strokeStyle='#a662bf';ctx.lineWidth=3;ctx.strokeRect(26,26,1148,768);
  ctx.fillStyle='#ef91f4';ctx.font='bold 22px sans-serif';ctx.fillText('ZERO TO BEYOND · MOON MISSION CARD',60,76);
  ctx.fillStyle='#fff4ff';ctx.font='bold 42px sans-serif';ctx.fillText(`${card.player.slice(0,32)} · Crew home!`,60,141);
  ctx.fillStyle='#a5edcf';ctx.font='bold 28px sans-serif';ctx.fillText(`3 crew recovered   •   ${card.deliveredSciencePoints} SP delivered   •   ${card.elapsedDays.toFixed(2)} days`,60,199);
  ctx.fillStyle='#eed0ff';ctx.font='22px sans-serif';
  const rows=[`Finding: ${card.outcome?.status} · ${card.outcome?.reasons[1]??''}`,`Route: ${card.route}   |   Site: ${card.site}   |   ${card.assisted?'Assisted play':'Challenge play'}`,`Equipment: ${card.credits} credits · ${card.massKg} kg · drilling ${card.drillDepthCm??0} cm`,
    `Cabin reserve: ${card.crewDaysRemaining?.toFixed(1)} crew-days · ${card.cabinEnergyKWh.toFixed(1)} kWh`,
    `Fuel used: ascent ${card.ascentFuelUsedKg.toFixed(0)} kg · Earth burn ${card.earthReturnFuelUsedKg.toFixed(0)} kg`,
    `Incidents: ${card.incidents.length} · corrected return choices: ${card.corrections}`];
  rows.forEach((line,i)=>ctx.fillText(line,60,252+i*38));
  ctx.fillStyle='#ffdc86';ctx.font='bold 22px sans-serif';ctx.fillText('ACTUAL MEASUREMENTS',60,506);ctx.font='18px sans-serif';ctx.fillStyle='#eee0fb';
  card.measurements.slice(0,6).forEach((r,i)=>ctx.fillText(`${r.instrumentId.toUpperCase()} · ${r.locationId} · ${r.kind==='mineral-evidence'?r.classification??'unclassified':r.kind==='water-evidence'?r.result??'unclassified':'field clue'} · ${r.quality??r.confidence} quality · ${r.transmitted?'sent':'not sent'}`,60,544+i*27));
  if(!card.measurements.length)ctx.fillText('No measurement returned. Safe crew recovery is recorded separately.',60,544);
  ctx.fillStyle='#c4b2d4';ctx.font='18px sans-serif';ctx.fillText(`Data returned. ${card.physicalSampleReturnedKg.toFixed(1)} kg samples. Rover stays on the Moon.`,60,747);ctx.font='14px sans-serif';ctx.fillText(`Game model ${card.model} · seed ${card.seed} · NASA-inspired architecture; authored values`,60,775);
  canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=card.objective==='lunar-geology'?'zero-to-beyond-geology-card.png':'zero-to-beyond-moon-card.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');
}
export function downloadMissionLog(s:WorkshopSession){const card=missionCard(s);if(card.crewRecovered!==3)return;const url=URL.createObjectURL(new Blob([JSON.stringify(card,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=card.objective==='lunar-geology'?'zero-to-beyond-geology-log.json':'zero-to-beyond-moon-log.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function returnLesson(s:WorkshopSession){const m=s.moon;if(m.objective==='lunar-geology')return m.science.fieldworkStopped?'Try a closer rock patch with more reserve.':Object.values(m.science.accepted).some(f=>f!=='inconclusive')?'Try another rock patch. Compare its mineral and element clues.':'Pack two agreeing mineral or element tools.';return m.science.fieldworkStopped?'Try a closer site with more reserve.':m.science.records.some(r=>r.quality==='low')?(s.preparation.sciencePartIds.includes('field-care-kit')?m.science.hazards.kitUsed?'Repeat a reading after cleaning. Old clues stay fuzzy.':'Use your care kit before another reading.':'Pack a care kit. Protect your tools from dust.'):!m.science.records.some(r=>r.result==='confirmed'&&r.kind==='water-evidence')?'Try another site. A clue needs a matching measurement.':'Compare a lighter kit. Keep the same safe return reserve.';}
export const reserveDays=(s:WorkshopSession)=>(returnResources(s.moon,s.moon.returnFlight).supportUnitsRemaining??0)/3;
