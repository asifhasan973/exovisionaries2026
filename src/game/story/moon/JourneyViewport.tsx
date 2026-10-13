import { SceneFallback } from './SceneFallback.tsx';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {createCrewedPlatform} from './crewedMeshes.ts';
import {createLaunchHardware} from '../launchHardware.ts';
import {disposeGroup} from '../workshopMeshes.ts';
import {coastFraction} from './journey.ts';
import type {JourneyState} from './journey.ts';
import type {PreparationSelection} from '../design.ts';

export function JourneyViewport({journey,preparation,gentle}:{journey:JourneyState;preparation:PreparationSelection;gentle:boolean}){
  const host=useRef<HTMLDivElement>(null),latest=useRef(journey),redraw=useRef(()=>{}),[failed,setFailed]=useState(false);
  useEffect(()=>{latest.current=journey;redraw.current();},[journey]);
  useEffect(()=>{
    const mount=host.current;if(!mount)return;let disposed=false,frame=0,lastFrame=0,renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{queueMicrotask(()=>setFailed(true));return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.outputColorSpace=THREE.SRGBColorSpace;mount.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,200);
    scene.add(new THREE.HemisphereLight(0xcbdcfa,0x211233,1.6));const sun=new THREE.DirectionalLight(0xffefd3,3.4);sun.position.set(-12,10,18);scene.add(sun);
    const texture=new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}story/flight/earth-blue-marble.jpg`,()=>{if(!disposed)redraw.current();});texture.colorSpace=THREE.SRGBColorSpace;
    const earth=new THREE.Mesh(new THREE.SphereGeometry(3,48,32),new THREE.MeshStandardMaterial({map:texture,roughness:1}));earth.position.x=-9;earth.rotation.y=1.2;scene.add(earth);
    const moon=new THREE.Mesh(new THREE.SphereGeometry(1.25,48,32),new THREE.MeshStandardMaterial({color:0xb8b4b5,roughness:1}));moon.position.x=9;scene.add(moon);
    // Deterministic shaded craters, no uncredited external Moon texture.
    for(let i=0;i<18;i++){const a=i*2.4,b=.25+(i%6)*.48;const crater=new THREE.Mesh(new THREE.CircleGeometry(.07+(i%4)*.025,16),new THREE.MeshStandardMaterial({color:0x777480,side:THREE.DoubleSide}));const point=new THREE.Vector3(Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a));crater.position.copy(point.multiplyScalar(1.255));crater.lookAt(point.clone().multiplyScalar(2));moon.add(crater);}
    const starPositions=[];for(let i=0;i<250;i++)starPositions.push(Math.sin(i*17)*45,Math.cos(i*31)*25,-25-Math.abs(Math.sin(i*8))*30);
    const stars=new THREE.BufferGeometry();stars.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xffffff,size:.07})));
    const path=new THREE.CatmullRomCurve3([new THREE.Vector3(-9,3.6,0),new THREE.Vector3(-2,5,0),new THREE.Vector3(4,4,0),new THREE.Vector3(9,2.5,0)]);
    const routeLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(path.getPoints(100)),new THREE.LineDashedMaterial({color:0xba70da,dashSize:.3,gapSize:.2}));routeLine.computeLineDistances();scene.add(routeLine);
    const orbitPoints=Array.from({length:65},(_,i)=>new THREE.Vector3(9+Math.cos(i/64*Math.PI*2)*2.5,Math.sin(i/64*Math.PI*2)*2.5,0));
    const orbit=new THREE.Line(new THREE.BufferGeometry().setFromPoints(orbitPoints),new THREE.LineBasicMaterial({color:0x83dbc1,transparent:true,opacity:.65}));scene.add(orbit);
    const ship=new THREE.Group();scene.add(ship);ship.scale.setScalar(.48);
    const crew=createCrewedPlatform();crew.capsule.position.set(0,0,0);crew.lander.position.set(0,6.1,0);crew.lander.rotation.z=Math.PI;crew.lander.scale.setScalar(.75);crew.root.position.y=-3;ship.add(crew.root);
    const launch=createLaunchHardware(preparation,true);launch.booster.visible=false;launch.halves.forEach(h=>h.visible=false);launch.escapeTower.visible=false;launch.platform.visible=false;launch.root.position.y=-6.3;launch.root.scale.setScalar(.7);ship.add(launch.root);
    const plume=new THREE.Mesh(new THREE.ConeGeometry(.28,2,20),new THREE.MeshBasicMaterial({color:0x80cfff,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));plume.position.y=-3.9;ship.add(plume);
    let orbitStart=performance.now(),orbiting=false;
    const paint=()=>{
      if(disposed||document.hidden)return;const j=latest.current,fraction=coastFraction(j),arrival=['loi-window','loi-burn','complete'].includes(j.stage);
      ship.position.copy(path.getPoint(fraction));ship.rotation.z=j.direction==='retrograde'?Math.PI/2:-Math.PI/2;
      if(j.stage==='complete'&&!gentle){if(!orbiting){orbitStart=performance.now();orbiting=true;}const angle=Math.PI/2-(performance.now()-orbitStart)*.0003;ship.position.set(9+Math.cos(angle)*2.5,Math.sin(angle)*2.5,0);ship.rotation.z=Math.PI+angle;}else orbiting=false;
      const departure=['route','tli-window','tli-burn'].includes(j.stage);launch.root.visible=departure;crew.root.visible=!departure;
      plume.visible=['tli-burn','loi-burn'].includes(j.stage);plume.scale.y=gentle?1:1+Math.sin(j.elapsed*30)*.08;
      orbit.material.opacity=arrival?.8:.18;
      camera.position.set(arrival?9:0,arrival?6:12,arrival?14:27);camera.lookAt(arrival?9:0,1,0);renderer.render(scene,camera);
    };
    const animate=(time:number)=>{if(disposed||document.hidden||latest.current.stage!=='complete'||gentle)return;if(time-lastFrame>32){paint();lastFrame=time;}frame=requestAnimationFrame(animate);};
    const wake=()=>{cancelAnimationFrame(frame);paint();if(!document.hidden&&latest.current.stage==='complete'&&!gentle)frame=requestAnimationFrame(animate);};
    redraw.current=wake;
    const resize=()=>{renderer.setSize(Math.max(1,mount.clientWidth),Math.max(1,mount.clientHeight),false);camera.aspect=mount.clientWidth/Math.max(1,mount.clientHeight);camera.updateProjectionMatrix();wake();};
    const observer=new ResizeObserver(resize);observer.observe(mount);const lost=(e:Event)=>{e.preventDefault();disposed=true;cancelAnimationFrame(frame);redraw.current=()=>{};setFailed(true);};renderer.domElement.addEventListener('webglcontextlost',lost);document.addEventListener('visibilitychange',wake);resize();
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();redraw.current=()=>{};document.removeEventListener('visibilitychange',wake);renderer.domElement.removeEventListener('webglcontextlost',lost);disposeGroup(scene);texture.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[preparation,gentle]);
  return <div className="journey-canvas" ref={host} role="img" aria-label="Crew spacecraft travelling from Earth toward the Moon">{failed?<SceneFallback scene="journey" label={journey.stage} detail={'Earth → Moon · controls stay live'} position={.5}/>:null}</div>;
}
