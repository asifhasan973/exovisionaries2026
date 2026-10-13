import { SceneFallback } from './SceneFallback.tsx';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {createCrewedPlatform} from './crewedMeshes.ts';
import {disposeGroup} from '../workshopMeshes.ts';
import {returnFrameLimit} from './return.ts';
import type {ReturnState} from './return.ts';

/** Cinematic scene units are deliberately not an Earth–Moon distance scale. */
export function ReturnViewport({flight,gentle}:{flight:ReturnState;gentle:boolean}){
  const host=useRef<HTMLDivElement>(null),latest=useRef(flight),paintRef=useRef(()=>{}),[failed,setFailed]=useState(false);
  useEffect(()=>{latest.current=flight;paintRef.current();},[flight]);
  useEffect(()=>{
    const mount=host.current;if(!mount)return;let disposed=false;let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{queueMicrotask(()=>setFailed(true));return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;mount.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,150);
    scene.add(new THREE.HemisphereLight(0xc6ddff,0x24163e,2));const sun=new THREE.DirectionalLight(0xffedcf,3);sun.position.set(-8,12,14);scene.add(sun);
    const earthTexture=new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}story/flight/earth-blue-marble.jpg`,()=>{if(!disposed)paintRef.current();});earthTexture.colorSpace=THREE.SRGBColorSpace;
    const earth=new THREE.Mesh(new THREE.SphereGeometry(3,48,32),new THREE.MeshStandardMaterial({map:earthTexture,roughness:1}));earth.position.set(-9,0,-2);earth.rotation.y=1.2;scene.add(earth);
    const moon=new THREE.Mesh(new THREE.SphereGeometry(1.9,40,30),new THREE.MeshStandardMaterial({color:0xa8a4ad,roughness:1}));moon.position.set(9,0,-2);scene.add(moon);
    const starGeometry=new THREE.BufferGeometry(),stars:number[]=[];for(let i=0;i<230;i++)stars.push(Math.sin(i*17)*45,Math.cos(i*31)*22,-25-Math.abs(Math.sin(i*8))*30);
    starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));scene.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({size:.07,color:0xf3eeff})));
    const ground=new THREE.Mesh(new THREE.CircleGeometry(25,80),new THREE.MeshStandardMaterial({color:0x5c5668,roughness:1}));ground.rotation.x=-Math.PI/2;scene.add(ground);
    const sea=new THREE.Mesh(new THREE.PlaneGeometry(80,80,1,1),new THREE.MeshStandardMaterial({color:0x16516a,roughness:.3,metalness:.35}));sea.rotation.x=-Math.PI/2;sea.position.y=-1.2;scene.add(sea);
    const hardware=createCrewedPlatform(),ascent=new THREE.Group(),descent=hardware.descentStage,csm=new THREE.Group(),cm=new THREE.Group(),service=new THREE.Group();
    for(const child of [...hardware.capsule.children]){if(child.position.y>=2.7){cm.add(child);child.position.y-=3.45;}else{service.add(child);child.position.y-=1.5;}}
    cm.position.y=1.95;csm.add(service,cm);scene.add(csm);
    hardware.ascentStage.position.y=-1.7;ascent.add(hardware.ascentStage);scene.add(ascent,descent);
    scene.userData.materials=hardware.root.userData.materials;
    const plumeMaterial=new THREE.MeshBasicMaterial({color:0x8ad8ff,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false});
    const ascentPlume=new THREE.Mesh(new THREE.ConeGeometry(.23,1.5,24),plumeMaterial);ascentPlume.rotation.z=Math.PI;ascentPlume.position.y=-1.45;ascent.add(ascentPlume);
    const servicePlume=new THREE.Mesh(new THREE.ConeGeometry(.32,2,24),plumeMaterial);servicePlume.rotation.z=Math.PI;servicePlume.position.y=-2.1;csm.add(servicePlume);
    const trail=new THREE.Mesh(new THREE.ConeGeometry(.8,3.5,32),new THREE.MeshBasicMaterial({color:0xff954d,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}));trail.position.y=1.7;cm.add(trail);
    const glow=new THREE.Mesh(new THREE.TorusGeometry(.75,.06,12,48),new THREE.MeshBasicMaterial({color:0xffc168,transparent:true,opacity:.8}));glow.rotation.x=Math.PI/2;glow.position.y=-.67;cm.add(glow);
    const chutes=new THREE.Group();scene.add(chutes);
    for(let i=0;i<3;i++){
      const x=(i-1)*2.4,z=i===1?-1.2:.4;
      const canopy=new THREE.Mesh(new THREE.SphereGeometry(1.3,32,16,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:i%2?0xf4e2d3:0xe98651,side:THREE.DoubleSide,roughness:.9}));canopy.position.set(x,6,z);chutes.add(canopy);
      for(let j=0;j<8;j++){const a=j*Math.PI/4,points=[new THREE.Vector3(0,1.95,0),new THREE.Vector3(x+Math.cos(a)*1.3,6,z+Math.sin(a)*1.3)];chutes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xddd3c5})));}
    }
    const collar=new THREE.Mesh(new THREE.TorusGeometry(.85,.12,12,48),new THREE.MeshStandardMaterial({color:0xffbd68}));collar.rotation.x=Math.PI/2;scene.add(collar);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.6,.025,12,48),new THREE.MeshBasicMaterial({color:0x8eeac4}));ring.rotation.y=Math.PI/2;scene.add(ring);
    const path=new THREE.CatmullRomCurve3([new THREE.Vector3(9,2.7,0),new THREE.Vector3(3,5,0),new THREE.Vector3(-3,4,0),new THREE.Vector3(-9,3.8,0)]);
    const pathLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(path.getPoints(80)),new THREE.LineDashedMaterial({color:0xb174d1,dashSize:.3,gapSize:.2,transparent:true,opacity:.7}));pathLine.computeLineDistances();scene.add(pathLine);
    const draw=()=>{
      if(disposed||document.hidden)return;const r=latest.current,p=r.frame/returnFrameLimit(r),surface=['ready','ascending'].includes(r.stage),dock=['rendezvous','docked'].includes(r.stage),coast=['burning','coast'].includes(r.stage),entry=['entry-ready','entry','chute-ready'].includes(r.stage),ocean=['chutes','splashdown'].includes(r.stage);
      ground.visible=surface;sea.visible=ocean;earth.visible=coast||entry;moon.visible=dock||coast;pathLine.visible=coast;
      descent.visible=surface;descent.position.set(-1.5,0,0);
      ascent.visible=surface||dock;ascent.scale.setScalar(surface?1:.9);ascent.position.set(-1.5,surface?1.7+(r.stage==='ascending'?p*9:0):1,0);ascent.rotation.set(0,0,surface?0:Math.PI/2);
      csm.visible=!surface;csm.scale.setScalar(coast?.55:1);csm.rotation.set(0,0,dock?-Math.PI/2:coast?-Math.PI/2:0);csm.position.set(0,0,0);
      service.visible=(!entry||r.stage==='entry-ready')&&!ocean;service.position.set(0,0,0);cm.position.set(0,1.95,0);cm.rotation.set(0,0,0);
      if(dock){csm.position.set(-2,1,0);ascent.position.set(r.stage==='docked'?2.0:3.5+r.closingMS,1+r.alignment*2,0);moon.position.set(1,-5,-8);ring.visible=r.stage==='rendezvous';ring.position.set(.6,1,0);}
      else ring.visible=false;
      if(coast){moon.position.set(9,0,-2);earth.position.set(-9,0,-2);csm.position.copy(path.getPoint(r.stage==='burning'?0:p));}
      if(entry){earth.position.set(0,-17,-6);earth.scale.setScalar(5);csm.position.set(0,0,0);cm.rotation.x=-.28;}
      else earth.scale.setScalar(1);
      if(ocean){csm.position.y=r.stage==='splashdown'?-2.5:.2-p*2.7;chutes.position.y=csm.position.y;collar.position.y=-1.08;}
      chutes.visible=r.stage==='chutes';collar.visible=r.stage==='splashdown';
      ascentPlume.visible=r.stage==='ascending';servicePlume.visible=r.stage==='burning';trail.visible=r.stage==='entry';glow.visible=r.stage==='entry';
      const pulse=gentle?1:1+Math.sin(r.frame*2)*.07;ascentPlume.scale.y=pulse;servicePlume.scale.y=pulse;
      if(surface){camera.position.set(5,5.5,12);camera.lookAt(-1.5,r.stage==='ascending'?1.5+p*6:1.3,0);}
      else if(dock){camera.position.set(2,5,14);camera.lookAt(0,1,0);}
      else if(coast){camera.position.set(0,11,29);camera.lookAt(0,1,0);}
      else {camera.position.set(6,ocean?5:4,12);camera.lookAt(0,ocean?1:1.5,0);}
      renderer.render(scene,camera);
    };
    paintRef.current=draw;
    const resize=()=>{renderer.setSize(Math.max(1,mount.clientWidth),Math.max(1,mount.clientHeight),false);camera.aspect=mount.clientWidth/Math.max(1,mount.clientHeight);camera.updateProjectionMatrix();draw();};
    const observer=new ResizeObserver(resize);observer.observe(mount);const lost=(e:Event)=>{e.preventDefault();disposed=true;paintRef.current=()=>{};setFailed(true);};renderer.domElement.addEventListener('webglcontextlost',lost);document.addEventListener('visibilitychange',draw);resize();
    return()=>{disposed=true;paintRef.current=()=>{};observer.disconnect();document.removeEventListener('visibilitychange',draw);renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(o=>{if(o instanceof THREE.Line||o instanceof THREE.Points){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose());}});disposeGroup(scene);earthTexture.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[gentle]);
  return <div className="return-canvas" ref={host} role="img" aria-label={`Crew return: ${flight.stage}. ${flight.crewLocation==='ocean'?'All three crew recovered on Earth.':'Two crew ascend to meet their orbit specialist, then return in the command module.'}`}>{failed?<SceneFallback scene="return" label={'Crew return'} detail={flight.stage} position={.5}/>:null}</div>;
}
