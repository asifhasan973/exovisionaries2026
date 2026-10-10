import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildAssembly, disposeGroup } from './workshopMeshes.ts';
import { quickPreparation } from './preparation.ts';
import { useGameSettings } from './gameSettingsContext.ts';

/** Existing playable hardware, shown in a lightweight Moon diorama. */
export function HomeViewport() {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const { gentle } = useGameSettings();
  useEffect(() => {
    const mount = host.current; if (!mount) return;
    let disposed = false, frame = 0;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { queueMicrotask(() => { if (!disposed) setFailed(true); }); return () => { disposed = true; }; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; mount.append(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enablePan = controls.enableZoom = false; controls.enableDamping = !gentle;
    controls.minPolarAngle = .6; controls.maxPolarAngle = 1.4; controls.autoRotate = !gentle; controls.autoRotateSpeed = .35; controls.target.set(0, .5, 0);
    scene.add(new THREE.HemisphereLight(0xc6d4ff, 0x36304e, 2.4));
    const light = new THREE.DirectionalLight(0xffeccb, 4); light.position.set(-6, 10, 7); light.castShadow = true; light.shadow.mapSize.set(1024,1024);
    light.shadow.camera.left = light.shadow.camera.bottom = -8; light.shadow.camera.right = light.shadow.camera.top = 8; scene.add(light);
    const rim = new THREE.DirectionalLight(0xa298ff, 3); rim.position.set(5, 3, -7); scene.add(rim);
    const ground = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5, .45, 80), new THREE.MeshStandardMaterial({ color: 0x77778c, roughness: .95 })); ground.position.y = -.28; ground.receiveShadow = true; scene.add(ground);
    const edge = new THREE.Mesh(new THREE.TorusGeometry(5.25,.025,8,96),new THREE.MeshBasicMaterial({ color:0x8b80d5 })); edge.rotation.x = -Math.PI/2; edge.position.y = -.05; scene.add(edge);
    const assembly = buildAssembly(quickPreparation()); scene.add(assembly); assembly.rotation.y = -.35;
    for (let i=0;i<24;i++) {
      const angle=i*2.399, radius=3.6+(i%5)*.27;
      const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.06+(i%4)*.035),new THREE.MeshStandardMaterial({color: i%2 ? 0x9993a3 : 0x575466,roughness:1}));
      rock.position.set(Math.cos(angle)*radius,.025,Math.sin(angle)*radius); rock.rotation.set(i,i*.4,i*.8); rock.castShadow=true; scene.add(rock);
    }
    const stars = new THREE.BufferGeometry(), points=[];
    for(let i=0;i<140;i++) points.push(Math.sin(i*5.3)*23,6+(i%17)*.9,-10-Math.abs(Math.cos(i))*15);
    stars.setAttribute('position',new THREE.Float32BufferAttribute(points,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xd4d2f5,size:.045,transparent:true,opacity:.65})));
    const resize=()=>{ const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight); renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();camera.position.set(10,6.8,12).multiplyScalar(Math.max(1,1.1/camera.aspect));controls.update(); };
    const observer=new ResizeObserver(resize);observer.observe(mount);resize();
    let last=0;
    const render=(now:number)=>{ if(disposed||document.hidden)return; if(now-last>32){controls.update();renderer.render(scene,camera);last=now;}frame=requestAnimationFrame(render);};
    const resume=()=>{cancelAnimationFrame(frame);if(!document.hidden)frame=requestAnimationFrame(render);};
    const lost=(event:Event)=>{event.preventDefault();cancelAnimationFrame(frame);setFailed(true);};
    renderer.domElement.addEventListener('webglcontextlost',lost);document.addEventListener('visibilitychange',resume);resume();
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',resume);renderer.domElement.removeEventListener('webglcontextlost',lost);controls.dispose();disposeGroup(scene);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[gentle]);
  return <div className="home-world" role="img" aria-label="A 3D lunar lander and rover waiting for your Moon adventure"><div ref={host} className="home-world-canvas"/>{failed ? <div className="home-world-fallback" aria-hidden="true">🌕<span>🚀</span></div> : null}</div>;
}
