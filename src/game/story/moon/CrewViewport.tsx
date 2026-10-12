import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCrewedPlatform } from './crewedMeshes.ts';
import { disposeGroup } from '../workshopMeshes.ts';
import { useGameSettings } from '../gameSettingsContext.ts';

export function CrewViewport(){
  const host=useRef<HTMLDivElement>(null),[failed,setFailed]=useState(false);const {gentle}=useGameSettings();
  useEffect(()=>{
    const mount=host.current;if(!mount)return;let disposed=false,frame=0;let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{queueMicrotask(()=>{if(!disposed)setFailed(true);});return()=>{disposed=true;};}
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.outputColorSpace=THREE.SRGBColorSpace;mount.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,100);scene.add(new THREE.HemisphereLight(0xcde8ff,0x221327,2.5));
    const key=new THREE.DirectionalLight(0xfff2da,3.6);key.position.set(4,8,7);scene.add(key);const rim=new THREE.DirectionalLight(0x9b9eff,2.2);rim.position.set(-4,4,-4);scene.add(rim);
    const hardware=createCrewedPlatform();scene.add(hardware.root);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(5,5.1,.1,60),new THREE.MeshStandardMaterial({color:0x23203d,roughness:.65,metalness:.4}));base.position.y=-.06;scene.add(base);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=!gentle;controls.minDistance=6;controls.maxDistance=24;controls.maxPolarAngle=Math.PI*.49;controls.target.set(0,1.8,0);
    let dirty=true,last=0;const redraw=()=>{dirty=true;};controls.addEventListener('change',redraw);
    const resize=()=>{const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.set(7,5,10).multiplyScalar(Math.max(1,1.15/camera.aspect));camera.lookAt(0,1.8,0);camera.updateProjectionMatrix();controls.update();redraw();};
    const observer=new ResizeObserver(resize);observer.observe(mount);resize();
    const draw=(time:number)=>{if(disposed||document.hidden)return;controls.update();if(time-last>32&&dirty){renderer.render(scene,camera);dirty=false;last=time;}frame=requestAnimationFrame(draw);};
    const resume=()=>{cancelAnimationFrame(frame);if(!document.hidden)frame=requestAnimationFrame(draw);};
    const lost=(event:Event)=>{event.preventDefault();cancelAnimationFrame(frame);setFailed(true);};renderer.domElement.addEventListener('webglcontextlost',lost);document.addEventListener('visibilitychange',resume);resume();
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.removeEventListener('change',redraw);controls.dispose();document.removeEventListener('visibilitychange',resume);renderer.domElement.removeEventListener('webglcontextlost',lost);disposeGroup(scene);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[gentle]);
  return <div className="crew-spacecraft" ref={host} role="img" aria-label="Crew capsule with return heat shield and a separate lunar lander">{failed?<div className="crew-model-fallback">Crew capsule ↔ Lunar lander<br/>Two land. One stays in orbit.</div>:null}</div>;
}
