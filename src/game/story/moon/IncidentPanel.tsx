import {ShieldAlert} from 'lucide-react';
import type {WorkshopSession,MissionEvent} from '../workshopSession.ts';
import {Term} from '../Learning.tsx';
import {careKitAvailable,incidentEffects} from './incidents.ts';
import type {IncidentAction} from './incidents.ts';
import {surfaceTaskPower,surfacePosition,surfaceLink} from './surface.ts';
import {INCIDENT_LINES} from './incidentCopy.ts';
import './incidents.css';
const NAMES={dust:'Dust on the tools',radio:'Radio link blocked',power:'Protect the return energy',radiation:'Space-weather alert'};
export function IncidentPanel({session,dispatch}:{session:WorkshopSession;dispatch(e:MissionEvent):void}){
  const {moon,preparation}=session,s=moon.science,h=s.hazards,kind=h.pending;if(!kind)return null;
  const atBase=moon.surface.location==='base'&&moon.surface.stage==='idle',pos=surfacePosition(moon.surface),linked=surfaceLink(pos.x,pos.z,preparation)==='connected',kit=careKitAvailable(h,preparation),power=surfaceTaskPower(moon,preparation,'standby');
  const choice=(action:IncidentAction,label:string,disabled=false,recommended=false)=><button key={action} disabled={disabled} data-incident-recommended={recommended||undefined} onClick={()=>dispatch({type:'science-incident',action})}>{label}</button>;
  return <section className="incident-panel" aria-label="Mission incident" role="alert"><div className="incident-title"><ShieldAlert size={26}/><h2>{NAMES[kind]}</h2></div><p>{INCIDENT_LINES[kind]}</p>
    {kind==='dust'?<div className="incident-readings"><span>Solar {Math.round(incidentEffects(moon).solarMultiplier*100)}%</span><span>View: faint</span><span><Term term="care">Care kit</Term> {kit?'packed':h.kitUsed?'used up':'not packed'}</span></div>:kind==='radiation'?<div className="incident-readings"><span><Term term="radiation"/> warning</span><span>Crew sheltered ✓</span></div>:null}
    <div className="incident-choices">{kind==='dust'?<>
      {choice('continue-dust','Keep going · weaker readings',false,!kit)}
      {choice('return-clean','Return to Base first',false,kit&&!atBase)}
      {choice('brush',kit?'Clean at Base · 8 min':'Cleaning kit not packed',!atBase||!kit||h.evaBlocked,atBase&&kit)}
      {moon.crew.support==='systems-engineer'?choice('calibrate','Expert sensor check · 3 min',!linked||h.sensorCalibrated):null}
    </>:kind==='radio'?<>{choice('follow-plan','Follow saved route',false,true)}{choice('boost-radio','Try stronger radio')}</>:kind==='power'?<>
      {choice('shorter','Try a 20 cm sample',s.phase!=='plan'||s.depthCm<=20)}
      {choice('closer','Try the sunny lookout',s.phase!=='plan'||s.target==='lookout',s.phase==='plan'&&s.target!=='lookout')}
      {s.useGas?choice('shed-gas','Turn off the gas tool',s.phase==='analysis'):null}
      {choice('charge','Charge in sunlight',s.phase!=='plan'||!linked||power.solarW<=power.loadW||moon.surface.batteryWh>=moon.resources.capacityWh-.01,s.phase==='plan'&&power.solarW>power.loadW)}
    </>:<>{choice('robot-only','Robot works · crew stay inside',!moon.surface.crewSheltered)}{choice('shelter-wait',atBase?'Wait for all-clear':'Return to Base · then wait',false,true)}{choice('eva','Send crew outside')}</>}
      {kind!=='radio'?choice('safe-return','Stop fieldwork · return safely'):null}
    </div>
    {h.feedback&&h.feedback!==kind?<div className="incident-feedback" role="status">{INCIDENT_LINES[h.feedback]}</div>:null}
    {!linked?<small>Saved rover fallbacks · no live uplink</small>:null}
  </section>;
}
