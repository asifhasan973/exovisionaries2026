import { SceneFallback } from './SceneFallback.tsx';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {createCrewedPlatform} from './crewedMeshes.ts';
import {disposeGroup} from '../workshopMeshes.ts';
import {LANDING_PADS,terrainHeight} from './landing.ts';
import type {LandingState} from './landing.ts';

export function LandingViewport({landing,shadow,gentle}:{landing:LandingState;shadow:boolean;gentle:boolean}){
  const host=useRef<HTMLDivElement>(null),latest=useRef(landing),redraw=useRef(()=>{}),[failed,setFailed]=useState(false);
  useEffect(()=>{latest.current=landing;redraw.current();},[landing]);
  useEffect(()=>{
    const mount=host.current;if(!mount)return;let disposed=false,renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{queueMicrotask(()=>setFailed(true));return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;mount.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color('#100e20');scene.fog=new THREE.Fog('#100e20',130,240);
    const camera=new THREE.PerspectiveCamera(43,1,.1,300);
    const stars=new THREE.BufferGeometry();const positions=[];for(let i=0;i<120;i++)positions.push(Math.cos(i*12.3)*95,35+Math.sin(i*8.1)*55,-70-Math.abs(Math.sin(i*3))*35);stars.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const starfield=new THREE.Points(stars,new THREE.PointsMaterial({color:0xe5d9ef,size:.12}));scene.add(starfield);
    const orbitalMoon=new THREE.Mesh(new THREE.SphereGeometry(65,48,32),new THREE.MeshStandardMaterial({color:0x85818e,roughness:1}));orbitalMoon.position.set(0,-80,-25);scene.add(orbitalMoon);
    scene.add(new THREE.HemisphereLight(0xd6deed,0x282133,shadow?.7:1.3));
    const light=new THREE.DirectionalLight(0xffedd4,shadow?.35:3);light.position.set(-65,28,45);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-65;light.shadow.camera.right=65;light.shadow.camera.top=70;light.shadow.camera.bottom=-35;scene.add(light);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,130,72,36),new THREE.MeshStandardMaterial({color:shadow?0x403a50:0x85818c,roughness:1}));ground.rotation.x=-Math.PI/2;
    const vertices=ground.geometry.attributes.position;
    for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),z=vertices.getY(i);const distant=Math.abs(z)>18?Math.pow(Math.max(0,Math.abs(z)-18)/35,2)*(2+Math.sin(x*.15)*1.4):0;vertices.setZ(i,distant+Math.max(0,terrainHeight(x*2)-3)*.35);}
    ground.geometry.computeVertexNormals();ground.receiveShadow=true;scene.add(ground);
    // Fixed, illustrative obstacles. Collision coordinates come from the same landing terrain rules.
    const rocks=new THREE.Group();scene.add(rocks);
    for(let i=0;i<12;i++){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.7+(i%3)*.25,0),new THREE.MeshStandardMaterial({color:0x5d5768,roughness:1}));rock.position.set(Math.sin(i*2.1)*6,.7,Math.cos(i*3.4)*3);rock.scale.set(1,1+(i%2)*.4,1.2);rock.rotation.set(i*.2,i*1.7,i*.8);rock.castShadow=true;rock.receiveShadow=true;rocks.add(rock);}
    const pads=LANDING_PADS.map(p=>{const material=new THREE.MeshBasicMaterial({color:p.safe?0x54ffc0:0xff637d,toneMapped:false,transparent:true,opacity:.95,side:THREE.DoubleSide});const ring=new THREE.Mesh(new THREE.RingGeometry(5.7,6.1,64),material);ring.rotation.x=-Math.PI/2;ring.position.set(p.x*.5,.09,0);scene.add(ring);
      const canvas=document.createElement('canvas');canvas.width=96;canvas.height=64;const ctx=canvas.getContext('2d');if(ctx){ctx.fillStyle='#20112ee0';ctx.fillRect(0,0,96,64);ctx.font='bold 42px sans-serif';ctx.fillStyle=p.safe?'#8dffcc':'#ffadb8';ctx.textAlign='center';ctx.fillText(p.id==='left'?'A':p.id==='right'?'B':'!',48,48);}
      const texture=new THREE.CanvasTexture(canvas);const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));label.scale.set(3,2,1);label.position.set(p.x*.5,2.5,-4);scene.add(label);return {id:p.id,ring,label};});
    const crew=createCrewedPlatform();scene.add(crew.root);crew.lander.scale.setScalar(2.5);crew.capsule.scale.setScalar(2);
    const beam=new THREE.SpotLight(0xc8efff,shadow?40:4,65,.5,.4,1);beam.position.set(0,2,.5);crew.lander.add(beam);const beamTarget=new THREE.Object3D();scene.add(beamTarget);beam.target=beamTarget;
    const flame=new THREE.Mesh(new THREE.ConeGeometry(.7,6,24),new THREE.MeshBasicMaterial({color:0xa6deff,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));flame.rotation.z=Math.PI;flame.position.y=-2.4;crew.lander.add(flame);
    const dust=new THREE.Group();scene.add(dust);for(let i=0;i<12;i++){const particle=new THREE.Mesh(new THREE.SphereGeometry(.1,6,4),new THREE.MeshBasicMaterial({color:0xb7abb9,transparent:true,opacity:.4}));dust.add(particle);}
    const paint=()=>{
      if(disposed||document.hidden)return;const l=latest.current,orbit=['ready','separating','separated','braking','aborting','aborted'].includes(l.stage);
      const orbitalView=['ready','separating','separated','aborted'].includes(l.stage);
      starfield.visible=orbitalView;ground.visible=!orbitalView;rocks.visible=!orbitalView;orbitalMoon.visible=orbitalView;
      const separating=l.stage==='separating'?Math.min(1,l.phaseSteps/120):l.stage==='ready'?0:1;
      crew.capsule.visible=['ready','separating','separated','aborted'].includes(l.stage);crew.capsule.position.set(-9-separating*12,33+separating*4,-3);crew.capsule.rotation.z=-.35;
      crew.lander.position.set(orbit?4:l.x*.5,l.stage==='aborting'?8+l.phaseSteps/30*3:l.stage==='aborted'?40:l.stage==='braking'?40-l.phaseSteps/300*7:orbit?33:Math.max(0,l.height)*.35,0);
      crew.lander.rotation.z=orbit?0:-l.steer*20*Math.PI/180;
      crew.descentStage.visible=!['aborting','aborted'].includes(l.stage);
      const engine=l.stage==='braking'||l.stage==='aborting'||l.stage==='descending'&&l.throttle>.01;
      flame.position.y=l.stage==='aborting'?-1.5:-2.4;flame.visible=engine&&!l.paused;flame.scale.y=(l.stage==='descending'?Math.max(.25,l.throttle*1.8):1)*(gentle?1:1+Math.sin(l.steps*.7)*.05);
      beamTarget.position.set(crew.lander.position.x,0,0);
      pads.forEach(({id,ring,label})=>{ring.visible=l.hazardSeen||l.stage==='landed';label.visible=ring.visible;ring.material.opacity=id===l.target?1:.75;});
      dust.visible=engine&&!l.paused&&l.height<15&&l.stage==='descending';dust.children.forEach((p,i)=>{const a=i*2.4,r=1+(l.steps*.03+i)%7;p.position.set(l.x*.5+Math.cos(a)*r,.2+Math.sin(i)*.08,Math.sin(a)*r);});
      const near=!orbit&&l.height<45;camera.zoom=orbitalView?1.1:near?1.3:1.15;camera.updateProjectionMatrix();camera.position.set(orbitalView?12:near?18:25,orbitalView?40:near?28:43,orbitalView?40:near?65:90);camera.lookAt(near?l.x*.2:0,orbitalView?35:near?7:18,0);renderer.render(scene,camera);
    };
    redraw.current=paint;const resize=()=>{renderer.setSize(Math.max(1,mount.clientWidth),Math.max(1,mount.clientHeight),false);camera.aspect=mount.clientWidth/Math.max(1,mount.clientHeight);camera.updateProjectionMatrix();paint();};
    const observer=new ResizeObserver(resize);observer.observe(mount);const lost=(e:Event)=>{e.preventDefault();disposed=true;redraw.current=()=>{};setFailed(true);};renderer.domElement.addEventListener('webglcontextlost',lost);document.addEventListener('visibilitychange',paint);resize();
    return()=>{disposed=true;observer.disconnect();redraw.current=()=>{};renderer.domElement.removeEventListener('webglcontextlost',lost);document.removeEventListener('visibilitychange',paint);starfield.geometry.dispose();starfield.material.dispose();pads.forEach(({label})=>{label.material.map?.dispose();label.material.dispose();});disposeGroup(scene);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[shadow,gentle]);
  return <div className="landing-canvas" ref={host} role="img" aria-label="Crewed lunar lander descending toward clear patches beside a boulder field">{failed?<SceneFallback scene="landing" label={'Moon landing'} detail={`${landing.height.toFixed(0)} m high · ${landing.x.toFixed(0)} m across`} position={Math.min(1,landing.height/2000)}/>:null}</div>;
}
