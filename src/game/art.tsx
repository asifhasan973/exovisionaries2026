import type { CSSProperties } from 'react';
import type { SlotInterface } from '../types/mission';

export function Planet({kind='moon',className=''}:{kind?:'moon'|'earth'|'mars';className?:string}) {
 return <div className={`planet ${kind} ${className}`} aria-hidden="true"><i/><i/><i/><i/><i/><span className="planet-shine"/></div>;
}
export function Portrait({person='mira',className=''}:{person?:'mira'|'leo'|'kai';className?:string}) {
 return <div className={`portrait portrait-${person} ${className}`}><img src={`/story/${person==='kai'?'pilot':person==='mira'?'mission-control':'crew-welcome'}.png`} alt={person==='mira'?'Mira, your mission guide':person==='leo'?'Leo, the astronaut':'Kai, the pilot'} draggable={false}/></div>;
}
export function Avatar({variant=0}:{variant?:number}) {
 const skin=['#b9754e','#f0bd92','#ce8f66','#edb494','#e5b992','#b87956'][variant%6];
 const hair=['#342a35','#804d3f','#242d38','#b67348','#272636','#40302e'][variant%6];
 return <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="57" fill={['#f8dba4','#ddcdef','#c1e6da'][variant%3]}/><path d="M20 120v-13Q24 78 60 78t40 29v13" fill="#7473cc" stroke="#393355" strokeWidth="3"/><path d="M49 74v14q11 14 22 0V74" fill={skin}/><ellipse cx="60" cy="48" rx="29" ry="34" fill={skin} stroke="#393355" strokeWidth="2.5"/><path d="M31 47Q20 8 57 12Q96 4 91 51L82 39Q62 42 48 27Q43 43 31 47" fill={hair}/><path d="M40 45l10-2m19 0 10 2" stroke={hair} strokeWidth="3" strokeLinecap="round"/><ellipse cx="47" cy="52" rx="3" ry="4" fill="#332e45"/><ellipse cx="73" cy="52" rx="3" ry="4" fill="#332e45"/><path d="M50 66q10 10 20 0" fill="white" stroke="#824e43" strokeWidth="2"/><path d="M42 95v25m36-25v25" stroke="#514d95" strokeWidth="3"/><circle cx="84" cy="101" r="8" fill="#f9d275"/><path d="m84 95 2 4 4 1-3 3v4l-3-2-4 2 1-4-3-3 4-1Z" fill="#fff8e3"/><path d="M60 96v24" stroke="#d5d4f3" strokeWidth="3"/></svg>;
}

const crewPortraits:Record<string,{src:string;name:string}>={
 'marcus-vance':{src:'/story/crew-welcome.png',name:'Marcus Vance'},
 'elena-rostova':{src:'/story/mission-control.png',name:'Elena Rostova'},
 'aisha-al-mansoor':{src:'/story/crew-welcome.png',name:'Aisha Al-Mansoor'},
 'sarah-jenkins':{src:'/story/sarah-jenkins.png',name:'Sarah Jenkins'},
 'kenji-takahashi':{src:'/story/mission-control.png',name:'Kenji Takahashi'},
 'mateo-silva':{src:'/story/pilot.png',name:'Mateo Silva'}
};

export function CrewPortrait({candidateId,className=''}:{candidateId:string;className?:string}) {
 const portrait=crewPortraits[candidateId]||crewPortraits['marcus-vance'];
 return <span className={`crew-portrait crew-portrait-${candidateId} ${className}`}><img src={portrait.src} alt={`${portrait.name}, fictional astronaut`} draggable={false}/></span>;
}
export function PartArt({id,className=''}:{id:string;className?:string}) {
 const stroke='#4e4167'; const shared={stroke,strokeWidth:2.5,strokeLinejoin:'round' as const};
 let drawing;
 if (id==='stage-1-booster') drawing=<><path d="M36 17h28l5 58H31Z" fill="#fffaf0" {...shared}/><path d="M35 32h30v12H35" fill="#8a7ad2"/><path d="m31 63-15 19h16m37-19 15 19H68" fill="#f1ab84" {...shared}/><path d="m35 76-3 12h13l-3-12m16 0-3 12h13l-3-12" fill="#746c87" {...shared}/></>;
 else if (id.includes('interstage')||id.includes('instrument-unit')) drawing=<><path d="M21 35 32 25h36l11 10v28H21Z" fill={id.includes('instrument')?'#b9a8eb':'#fff8ed'} {...shared}/><path d="M21 40h58m-50 0v23m10-23v23m11-23v23m11-23v23m10-23v23" fill="none" {...shared}/><ellipse cx="50" cy="29" rx="18" ry="5" fill="#77708d" {...shared}/></>;
 else if (id==='stage-2-cryo'||id==='stage-3-departure'||id==='service-module-core') drawing=<><rect x="28" y="18" width="44" height="53" rx="8" fill="#fffaf1" {...shared}/><path d="M28 27h44v12H28" fill={id.includes('2')?'#99cebf':'#b2a0e1'}/><path d="M37 71 30 85h40l-7-14" fill="#736982" {...shared}/><path d="M38 45v16m12-16v16m12-16v16" stroke="#c4bccd" strokeWidth="3"/></>;
 else if (id==='crew-capsule-command') drawing=<><path d="M43 18h14l24 52H19Z" fill="#fffaf1" {...shared}/><path d="M22 63h56l5 10H17Z" fill="#c49fe0" {...shared}/><circle cx="50" cy="43" r="12" fill="#97d2d7" {...shared}/><path d="m44 44 7-8" stroke="white" strokeWidth="4" strokeLinecap="round"/></>;
 else if (id==='launch-escape-tower') drawing=<><path d="m50 9 7 18H43Z" fill="#eda67f" {...shared}/><path d="M45 27 37 79m18-52 8 52M42 44h16M40 61h20m-18-17 18 17m-2-17L40 61" fill="none" {...shared}/><path d="M32 79h36v8H32Z" fill="#fff8ed" {...shared}/></>;
 else if (id==='stowed-lunar-payload') drawing=<><path d="M35 17h30l13 58H22Z" fill="#f4d798" {...shared}/><path d="M35 17 39 75m26-58L61 75" stroke="#bfa076" strokeWidth="2"/><path d="M22 68h56v9H22Z" fill="#a296b6" {...shared}/><path d="m48 33 9 8-4 13-13-2-2-12Z" fill="#fff0c7"/></>;
 else if (id.includes('camera')||id.includes('tracker')) drawing=<><path d="M22 32h49v42H22Z" fill="#b9aadf" {...shared}/><path d="M28 23h29v9H28Z" fill="#f0d498" {...shared}/><circle cx="64" cy="54" r="22" fill="#fff9e9" {...shared}/><circle cx="64" cy="54" r="14" fill="#73bcc6" {...shared}/><circle cx="67" cy="49" r="4" fill="white"/><path d="M31 43h9" stroke={stroke} strokeWidth="4"/></>;
 else if (id.includes('comm')||id.includes('radio')||id.includes('transceiver')) drawing=<><path d="M50 52v28H28m22 0h25" fill="none" {...shared}/><path d="M21 24q-7 43 37 43L74 46Z" fill="#f8f0de" {...shared}/><path d="m47 45 22-24" stroke={stroke} strokeWidth="3"/><circle cx="71" cy="19" r="5" fill="#edaa89"/><path d="M77 14q12 4 11 16" stroke="#9f8ac7" strokeWidth="3" fill="none"/></>;
 else if (id.includes('drill')) drawing=<><path d="M35 18h35v26H35Z" fill="#9dcfc3" {...shared}/><path d="M49 44v39m-9-31 18 7m-18 4 18 7m-18 4 15 6" fill="none" {...shared}/><path d="M35 25H22v25h12" fill="#d2c2ed" {...shared}/></>;
 else if (id.includes('scrubber')) drawing=<><rect x="25" y="21" width="25" height="61" rx="10" fill="#b0d7c8" {...shared}/><rect x="53" y="21" width="25" height="61" rx="10" fill="#d8ead7" {...shared}/><path d="M36 20V12h32v8M26 48h23m5 0h23" fill="none" {...shared}/><path d="M41 35q-8 8-3 13" fill="none" stroke="white" strokeWidth="3"/></>;
 else if(id.includes('battery')||id.includes('fuel-cell')) drawing=<><rect x="22" y="27" width="57" height="48" rx="9" fill="#b6d6be" {...shared}/><path d="M31 27v-9h11v9m18 0v-9h11v9" fill="#f5d396" {...shared}/><path d="m54 34-14 23h11l-4 13 16-24H52Z" fill="#fff3c1" {...shared}/></>;
 else if(id.includes('computer')||id.includes('avionics')) drawing=<><rect x="19" y="23" width="62" height="54" rx="7" fill="#b2a4d8" {...shared}/><rect x="27" y="32" width="46" height="29" rx="3" fill="#dcf3df" {...shared}/><path d="m33 48 7-6 8 9 7-13 11 9" fill="none" stroke="#4f937d" strokeWidth="2.5"/><circle cx="65" cy="69" r="3" fill="#f7ce72"/></>;
 else drawing=<><rect x="24" y="27" width="51" height="49" rx="10" fill="#d2bfe9" {...shared}/><path d="M35 27v-9h27v9" fill="none" {...shared}/><circle cx="50" cy="50" r="13" fill="#f6dc9d" {...shared}/><path d="M50 38v24m-12-12h24" stroke={stroke} strokeWidth="2"/><path d="M32 69h36" stroke="#9781b6" strokeWidth="3"/></>;
 return <svg className={`part-art ${className}`} viewBox="0 0 100 100" aria-hidden="true">{drawing}</svg>;
}

// The illustration uses exactly the installed structural slots, never a prebuilt vehicle.
export function RocketArt({installed,ghost=false,separated=0,escapeReleased=false,flame=false}:{installed:Partial<Record<SlotInterface,string>>;ghost?:boolean;separated?:number;escapeReleased?:boolean;flame?:boolean}) {
 const show=(id:SlotInterface)=>!!installed[id];
 const piece=(id:SlotInterface,body:React.ReactNode)=>show(id)?<g key={id}>{body}</g>:ghost?<g key={id} opacity=".12" strokeDasharray="4 5">{body}</g>:null;
 return <svg className="rocket-art" viewBox="0 0 200 520" aria-label="Your assembled rocket" role="img"><g stroke="#544564" strokeWidth="2.5" strokeLinejoin="round">
 {separated<1&&piece('booster-stage-1',<><path d="M60 360h80v121H60Z" fill="#fffaf0"/><path d="M61 377h78v20H61" fill="#9f8bc8" stroke="none"/><path d="m60 438-23 42h23m80-42 23 42h-23" fill="#e9a27e"/><path d="M69 481 64 496h25l-4-15m30 0-4 15h25l-5-15" fill="#706882"/><path d="M85 409v31m30-31v31" stroke="#d7cce0" strokeWidth="5"/></>)}
 {separated<1&&piece('interstage-1',<path d="M60 342h80v18H60Z" fill="#c8bddc"/>)}
 {separated<2&&piece('booster-stage-2',<><path d="M60 247h80v95H60Z" fill="#fffaf0"/><path d="M61 264h78v17H61" fill="#a9d5c5" stroke="none"/><path d="M81 294v32m19-32v32m19-32v32" stroke="#d7cce0" strokeWidth="3"/></>)}
 {separated<2&&piece('interstage-2',<path d="m73 227-13 20h80l-13-20Z" fill="#cfbfe5"/>)}
 {piece('booster-stage-3',<><path d="M73 169h54v58H73Z" fill="#fffaf0"/><path d="M74 184h52v12H74" fill="#a794d1" stroke="none"/></>)}
 {piece('instrument-unit',<path d="M73 158h54v11H73Z" fill="#817198"/>)}
 {piece('lunar-payload-bay',<><path d="m82 115-9 43h54l-9-43Z" fill="#f3d28e"/><path d="m90 116-3 40m23-40 3 40" stroke="#c2a575"/></>)}
 {piece('service-module',<><path d="M82 76h36v39H82Z" fill="#dfd6e8"/><path d="M89 82v27m22-27v27" stroke="#b0a0c3" strokeWidth="3"/></>)}
 {piece('crew-capsule',<><path d="M95 47h10l17 29H78Z" fill="#fffaf0"/><circle cx="100" cy="64" r="6" fill="#8bc5d0"/></>)}
 {!escapeReleased&&piece('launch-escape-system',<><path d="m97 19-4 28m10-28 4 28m-12-13h10M100 5l5 14H95Z" fill="#e8ab8d"/></>)}
 </g>{flame&&<g className="flames" style={{transformOrigin:`100px ${separated>=2?230:separated>=1?345:496}px` } as CSSProperties}><path d={separated>=2?'M82 228Q100 340 118 228Z':separated>=1?'M67 343Q100 475 133 343Z':'M67 496Q100 610 133 496Z'} fill="#f4ac63"/><path d={separated>=2?'M90 228Q100 300 110 228Z':separated>=1?'M83 343Q100 420 117 343Z':'M84 496Q100 565 116 496Z'} fill="#fff0a6"/></g>}</svg>;
}
