import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createCrewedPlatform} from './crewedMeshes.ts';
import {disposeGroup} from '../workshopMeshes.ts';
import {coastFraction} from './journey.ts';
import type {JourneyState} from './journey.ts';
import type {PreparationSelection} from '../design.ts';
import {transferSolution,TRANSFER_DATES,orbitPreview} from './transferModel.ts';
import solarData from './solarData.json';
import {useLoadingStore} from '../../../state/loadingStore.ts';
import {isEngineFrozen} from '../../../state/orientationLifecycleStore.ts';
import {SceneFallback} from './SceneFallback.tsx';

export function JourneyViewport({journey,gentle}:{journey:JourneyState;preparation:PreparationSelection;gentle:boolean}){
  const host=useRef<HTMLDivElement>(null),latest=useRef(journey),view=useRef<'chase'|'map'|'solar'>('chase');
  const [mode,setMode]=useState<'chase'|'map'|'solar'>('chase'),[failed,setFailed]=useState(false);
  useEffect(()=>{latest.current=journey;},[journey]);
  useEffect(()=>{view.current=mode;},[mode]);
  useEffect(()=>{
    const mount=host.current;if(!mount)return;
    let disposed=false,frame=0,renderer:THREE.WebGLRenderer|undefined,scene:THREE.Scene|undefined,controls:OrbitControls|undefined;
    let cleanup=()=>{};
    const task=(async()=>{
      try{
        renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor('#040814');renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;mount.appendChild(renderer.domElement);
        scene=new THREE.Scene();scene.add(new THREE.AmbientLight(0xa9bddc,1.3));const light=new THREE.DirectionalLight(0xfff1d8,3.5);scene.add(light);
        const camera=new THREE.PerspectiveCamera(45,1,.01,5000);controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=false;controls.minDistance=2;controls.maxDistance=1200;
        const earthTexture=await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}story/flight/earth-blue-marble.jpg`);earthTexture.colorSpace=THREE.SRGBColorSpace;
        if(disposed){earthTexture.dispose();return;}
        const earth=new THREE.Mesh(new THREE.SphereGeometry(6.378137,64,48),new THREE.MeshStandardMaterial({map:earthTexture,roughness:1}));scene.add(earth);
        const moon=new THREE.Mesh(new THREE.SphereGeometry(1.7374,64,48),new THREE.MeshStandardMaterial({color:0xaaa6a2,roughness:1}));scene.add(moon);
        // Procedural relief is illustrative; trajectory positions use the ephemeris.
        const pos=moon.geometry.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),f=1+.003*Math.sin(x*37)*Math.cos(z*29)*Math.sin(y*31);pos.setXYZ(i,x*f,y*f,z*f);}moon.geometry.computeVertexNormals();
        const crew=createCrewedPlatform(),ship=crew.root;crew.capsule.position.set(0,0,0);crew.lander.position.set(0,5.7,0);crew.lander.rotation.z=Math.PI;crew.lander.scale.setScalar(.7);ship.scale.setScalar(.22);scene.add(ship);
        const plume=new THREE.Mesh(new THREE.ConeGeometry(.5,5,24),new THREE.MeshBasicMaterial({color:0x96dbff,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));plume.position.y=-3.5;ship.add(plume);
        const guide=new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),2,0x8ce2c2,.25,.15);scene.add(guide);
        const starPositions=[];for(let i=0;i<1200;i++){const a=i*2.399,b=Math.acos(1-2*(i+.5)/1200);starPositions.push(1800*Math.sin(b)*Math.cos(a),1800*Math.cos(b),1800*Math.sin(b)*Math.sin(a));}const stars=new THREE.BufferGeometry();stars.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({size:1,color:0xbccdf0,sizeAttenuation:false})));
        const line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x8ce2c2,transparent:true,opacity:.7}));scene.add(line);
        const futureMoon=new THREE.Mesh(new THREE.SphereGeometry(1.78,32,24),new THREE.MeshBasicMaterial({color:0xffdf89,wireframe:true,transparent:true,opacity:.25}));scene.add(futureMoon);
        const solar=new THREE.Group();scene.add(solar);const sun=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),new THREE.MeshBasicMaterial({color:0xffd47e}));solar.add(sun);
        const planets=solarData.map((body,i)=>{const p=new THREE.Mesh(new THREE.SphereGeometry(i===4?.65:.3,24,16),new THREE.MeshBasicMaterial({color:[0xada49b,0xe8c7a0,0x76b8ff,0xe79c78,0xd2b69c,0xe1c58f,0x93ddd8,0x6089df][i]}));solar.add(p);return p;});
        const prediction=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xffd58a}));scene.add(prediction);
        let predictionKey='',orbitClock=0,lastTime=0;let orbitPoints:THREE.Vector3[]=[];
        let previous='',previousMode='',lastPosition=new THREE.Vector3(),dragged=false;
        const dragging=()=>{dragged=true;};controls.addEventListener('start',dragging);
        const resize=()=>{if(!renderer)return;renderer.setSize(Math.max(1,mount.clientWidth),Math.max(1,mount.clientHeight),false);camera.aspect=Math.max(1,mount.clientWidth)/Math.max(1,mount.clientHeight);camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(mount);resize();
        const paint=()=>{
          frame=0;if(disposed)return;frame=requestAnimationFrame(paint);if(document.hidden||isEngineFrozen()){lastTime=0;return;}const now=performance.now();if(lastTime&&!latest.current.paused&&!gentle)orbitClock+=Math.min(.05,(now-lastTime)/1000);lastTime=now;
          const j=latest.current,s=transferSolution(j.date,j.route??'balanced'),key=`${j.date}-${j.route}`,v=j.stage==='route'&&view.current==='chase'?'map':view.current;
          if(key!==previous){line.geometry.dispose();line.geometry=new THREE.BufferGeometry().setFromPoints(s?s.path.map(p=>new THREE.Vector3(p[0]/1000,p[2]/1000,-p[1]/1000)):[]);previous=key;previousMode='';}
          const index=s?Math.min(s.path.length-1,Math.round(coastFraction(j)*(s.path.length-1))):0;
          const point=(p:number[])=>new THREE.Vector3(p[0]/1000,p[2]/1000,-p[1]/1000);
          const shipPosition=s?point(s.path[index]):new THREE.Vector3(0,7,0),moonPosition=s?point(s.moonPath[index]):new THREE.Vector3(380,0,0);
          ship.position.copy(shipPosition);moon.position.copy(moonPosition);futureMoon.position.copy(s?point(s.moonPath[s.moonPath.length-1]):moonPosition);
          const delta=s&&index<s.path.length-1?point(s.path[index+1]).sub(shipPosition):new THREE.Vector3(1,0,0);delta.normalize();const arrival=j.stage.startsWith('loi')||j.stage==='complete';
          if(arrival&&s){delta.copy(shipPosition).sub(moonPosition).cross(new THREE.Vector3(0,1,0)).normalize().negate();}
          const previewKey=`${key}-${Math.round(j.dv??0)}-${Math.round(j.radialDv??0)}`;
          prediction.visible=arrival&&v!=='solar';
          if(arrival&&s&&previewKey!==predictionKey){
            const n=s.path.length-1,relative=point(s.path[n]).sub(point(s.moonPath[n]));
            const radial=relative.clone().normalize();
            const incoming=point(s.path[n]).sub(point(s.path[n-1])).sub(point(s.moonPath[n]).sub(point(s.moonPath[n-1])));
            const tangent=incoming.addScaledVector(radial,-incoming.dot(radial)).normalize();
            const velocity=tangent.multiplyScalar(s.arrivalSpeedKmS-(j.dv??0)/1000).addScaledVector(radial,(j.radialDv??0)/1000);
            const points=orbitPreview(relative.clone().multiplyScalar(1000).toArray(),velocity.toArray());
            orbitPoints=points.map(p=>new THREE.Vector3(...p as [number,number,number]).multiplyScalar(.001).add(moonPosition));prediction.geometry.dispose();prediction.geometry=new THREE.BufferGeometry().setFromPoints(orbitPoints);predictionKey=previewKey;
          }
          if(j.stage==='complete'&&orbitPoints.length){shipPosition.copy(orbitPoints[Math.floor(orbitClock*6)%orbitPoints.length]);ship.position.copy(shipPosition);}
          const direction=delta.clone().multiplyScalar(arrival?-1:1).applyAxisAngle(new THREE.Vector3(0,1,0),(j.angle??0)*Math.PI/180);ship.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);guide.position.copy(shipPosition);guide.setDirection(delta.clone().multiplyScalar(arrival?-1:1));
          plume.visible=j.version===2?!!j.firing&&!j.paused:j.stage.endsWith('burn');plume.scale.y=.5+(j.throttle??.5);light.position.fromArray((s?.sunDirection??[1,1,1]) as [number,number,number]).multiplyScalar(1000);
          const isSolar=v==='solar';solar.visible=isSolar;earth.visible=moon.visible=ship.visible=guide.visible=!isSolar;line.visible=futureMoon.visible=v==='map';
          if(isSolar){const day=Math.max(0,TRANSFER_DATES.indexOf(j.date??''));solarData.forEach((body,i)=>{const p=body.positions[day]??body.positions[0],r=Math.hypot(...p),radius=3+Math.log10(r/149597870.7+1)*16;planets[i].position.set(p[0]/r*radius,0,-p[1]/r*radius);});}
          earth.scale.setScalar(v==='map'?3:1);moon.scale.setScalar(v==='map'?5:1);futureMoon.scale.setScalar(5);
          if(v!==previousMode){dragged=false;if(v==='chase'){const outward=shipPosition.clone().sub(arrival?moonPosition:new THREE.Vector3()).normalize();camera.position.copy(shipPosition).addScaledVector(outward,5).add(new THREE.Vector3(1,1,0));controls!.target.copy(shipPosition);}else if(isSolar){camera.position.set(0,34,14);controls!.target.set(0,0,0);}else{const points=s?s.path.map(point):[new THREE.Vector3(),moonPosition];const bounds=new THREE.Box3().setFromPoints(points),sphere=bounds.getBoundingSphere(new THREE.Sphere());const distance=sphere.radius/Math.sin(THREE.MathUtils.degToRad(22.5))*1.15/Math.min(1,camera.aspect);camera.position.copy(sphere.center).add(new THREE.Vector3(0,distance*.65,distance*.76));controls!.target.copy(sphere.center);}previousMode=v;}
          else if(v==='chase'){const change=shipPosition.clone().sub(lastPosition);camera.position.add(change);controls!.target.copy(shipPosition);}
          lastPosition.copy(shipPosition);controls!.update();renderer!.render(scene!,camera);
        };
        frame=requestAnimationFrame(paint);
        cleanup=()=>{observer.disconnect();controls?.removeEventListener('start',dragging);earthTexture.dispose();};
      }catch(error){if(!disposed){console.warn('Journey view unavailable',error);setFailed(true);}}
    })();useLoadingStore.getState().registerLoaderTask(task);
    return()=>{disposed=true;cancelAnimationFrame(frame);cleanup();controls?.dispose();if(scene)disposeGroup(scene);renderer?.dispose();renderer?.domElement.remove();};
  },[gentle]);
  return <><div className="journey-canvas" ref={host} role="img" aria-label="Spacecraft flight along a NASA ephemeris based Moon transfer; drag to look around">{failed?<SceneFallback scene="journey" label="Flight view unavailable" detail="Flight controls remain available"/>:null}</div><div className="journey-camera-controls" aria-label="Flight camera">{(['chase','map','solar'] as const).map(v=><button key={v} aria-pressed={mode===v} onClick={()=>setMode(v)}>{v==='chase'?'Follow craft':v==='map'?'Trajectory':'Solar system'}</button>)}</div>{mode==='solar'?<div className="journey-solar-key">Sun · Mercury · Venus · Earth · Mars · Jupiter · Saturn · Uranus · Neptune<br/>NASA positions · radial distances compressed · body sizes exaggerated</div>:null}</>;
}
