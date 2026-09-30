import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createPartMeshByType } from '../scene/RocketMeshes';
import { PARTS, SLOTS } from '../data/parts';
import type { SlotInterface } from '../types/mission';
export default function RocketPreview({installed}:{installed:Partial<Record<SlotInterface,string>>}) {
 const container=useRef<HTMLDivElement>(null);
 useEffect(()=>{const host=container.current;if(!host)return;let renderer:THREE.WebGLRenderer;
 try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{return;}
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));host.appendChild(renderer.domElement);
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(38,1,.1,400);camera.position.set(55,22,72);
 scene.add(new THREE.HemisphereLight(0xffffff,0xc1aecb,3));const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(20,50,40);scene.add(key);
 const rocket=new THREE.Group();scene.add(rocket);
 for(const slot of SLOTS){const id=installed[slot.id];if(!id||!PARTS[id])continue;const mesh=createPartMeshByType(PARTS[id].meshType);if(mesh){mesh.position.set(...slot.position);rocket.add(mesh);}}
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,3,0);controls.enablePan=false;controls.minDistance=35;controls.maxDistance=130;controls.update();
 const render=()=>renderer.render(scene,camera);controls.addEventListener('change',render);
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render();};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 return()=>{observer.disconnect();controls.dispose();rocket.traverse(obj=>{if(obj instanceof THREE.Mesh)obj.geometry.dispose();});renderer.dispose();renderer.domElement.remove();};
 },[installed]);
 return <div className="model-preview" ref={container}><p>3D is unavailable. Use the 2D rocket.</p></div>;
}
