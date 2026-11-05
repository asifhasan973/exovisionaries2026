import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { PreparationSelection } from '@/game/moon/core/design';
import { buildRoverAssembly } from '@/game/moon/workshop/lander/workshopMeshes';
import { createCrewedPlatform } from '@/game/moon/crew/crewedMeshes';
import { regolithTexture } from '@/game/moon/surface/surfaceTerrain';
import { ROVER_BASE, ROVER_CAMPS, ROVER_SITES, roverLight, roverRocks, roverHoles, roverElevation, roverSites, visibleRoverSites, roverActive, ROVER_CHARGER } from '../rover';
import { createRoverBay, sampleColor } from '../roverBay';
import { COURSE_PATHS, courseGroundHeight } from '../roverCourse';
import type { RoverState } from '../rover';
import { useLoadingStore } from '@exo/ui';
import { isEngineFrozen } from '@exo/ui';

function disposeScene(scene: THREE.Scene) {
  const geometry = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  scene.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points || object instanceof THREE.Sprite) {
      geometry.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) { materials.add(material); for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value); }
    }
    if (object instanceof THREE.DirectionalLight) object.shadow.map?.dispose();
    for (const material of object.userData.materials ?? []) materials.add(material);
  });
  geometry.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); textures.forEach(value => value.dispose());
}
export function RoverViewport({ rover, preparation, gentle }: { rover: RoverState; preparation: PreparationSelection; gentle: boolean }) {
  const host = useRef<HTMLDivElement>(null), latest = useRef(rover), wake = useRef(() => {}), [failed, setFailed] = useState(false);
  useEffect(() => { latest.current = rover; wake.current(); }, [rover]);
  useEffect(() => {
    const mount = host.current; if (!mount) return;
    let disposed = false, frame = 0, renderer: THREE.WebGLRenderer | undefined, scene: THREE.Scene | undefined, cleanup = () => {};
    const loading = useLoadingStore.getState(); if (!loading.isLoading) void loading.startLoading('custom', 'Preparing your Moon driving grounds…');
    let finish = () => {}; const task = new Promise<void>(resolve => { finish = resolve; }); useLoadingStore.getState().registerLoaderTask(task);
    const boot = () => {
      if (disposed) { finish(); return; }
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' }); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; mount.append(renderer.domElement);
        scene = new THREE.Scene(); scene.background = new THREE.Color('#0b101b'); scene.fog = new THREE.Fog('#141a26', 65, 145);
        const camera = new THREE.PerspectiveCamera(58,1,.1,180);
        const rocks=roverRocks(latest.current),holes=roverHoles(latest.current),elevation=(x:number,z:number)=>roverElevation(latest.current,x,z);
        scene.add(new THREE.HemisphereLight(0xc4d8f5, 0x29282c, 1.35));
        const sun = new THREE.DirectionalLight(0xffedd6, 3.3); sun.position.set(-30, 40, -18); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, far: 160 }); sun.shadow.normalBias = .04; scene.add(sun);
        const terrain = new THREE.PlaneGeometry(280, 280, 256, 256); terrain.rotateX(-Math.PI / 2);
        const points = terrain.attributes.position, colors: number[] = [], lightColor = new THREE.Color('#ada8a0'), darkColor = new THREE.Color('#454b5c');
        const height = (x: number, z: number) => latest.current.version>=2?courseGroundHeight(x,z):elevation(x,z) - holes.reduce((depth: number, hole: any) => depth + 3.2 * Math.exp(-((x - hole.x) ** 2 + (z - hole.z) ** 2) / (hole.radius * .7) ** 2), 0);
        for (let i = 0; i < points.count; i++) { const x = points.getX(i), z = points.getZ(i); points.setY(i, height(x, z)); const color = roverLight(x, z) ? lightColor : darkColor; colors.push(color.r, color.g, color.b); }
        terrain.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); terrain.computeVertexNormals();
        const texture=regolithTexture();texture.repeat.set(45,45);
        const ground = new THREE.Mesh(terrain, new THREE.MeshStandardMaterial({ map: texture, roughness: 1, vertexColors: true })); ground.receiveShadow = true; scene.add(ground);
        const rockGeometry = new THREE.DodecahedronGeometry(1, 0), rockMaterial = new THREE.MeshStandardMaterial({ color: 0x686b76, roughness: .95, flatShading: true });
        const rockMeshes:THREE.Mesh<THREE.DodecahedronGeometry,THREE.MeshStandardMaterial>[]=[];
        for (const rock of rocks) { const material=rockMaterial.clone();material.transparent=true;const mesh = new THREE.Mesh(rockGeometry, material); mesh.position.set(rock.x, elevation(rock.x, rock.z) + rock.radius * .4, rock.z); mesh.scale.set(rock.radius, rock.radius * .8, rock.radius); mesh.rotation.y = rock.x; mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);rockMeshes.push(mesh); }
        for (const hole of holes) { const rim = new THREE.Mesh(new THREE.RingGeometry(hole.radius - .1, hole.radius + .22, 72), new THREE.MeshStandardMaterial({ color: 0x7b6b60, side: THREE.DoubleSide, roughness: 1 })); rim.rotation.x = -Math.PI / 2; rim.position.set(hole.x, elevation(hole.x, hole.z) + .025, hole.z); scene.add(rim); }
        if(latest.current.version>=2)for(const path of COURSE_PATHS){
          const curve=new THREE.CatmullRomCurve3(path.points.map(([x,z]: readonly [number, number])=>new THREE.Vector3(x,0,z))),vertices:number[]=[];
          for(let i=0;i<=180;i++){const t=i/180,p=curve.getPoint(t),tangent=curve.getTangent(t);for(const side of [-1,1]){const x=p.x-tangent.z*2.5*side,z=p.z+tangent.x*2.5*side;vertices.push(x,height(x,z)+.035,z);}}
          const geometry=new THREE.BufferGeometry(),indices:number[]=[];geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));for(let i=0;i<180;i++){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}geometry.setIndex(indices);geometry.computeVertexNormals();
          const road=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xa7a297,roughness:1,transparent:true,opacity:.4,depthWrite:false,side:THREE.DoubleSide}));scene.add(road);
        }
        for(let i=0;i<22;i++){const angle=i*Math.PI*2/22,backdrop=new THREE.Mesh(rockGeometry,rockMaterial);backdrop.position.set(Math.sin(angle)*69,1,Math.cos(angle)*69);backdrop.scale.set(8+i%4,5+i%5,7+i%3);backdrop.rotation.y=angle;scene.add(backdrop);}
        const edge=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-46,-46],[46,-46],[46,46],[-46,46]].map(([x,z])=>new THREE.Vector3(x,elevation(x,z)+.12,z))),new THREE.LineDashedMaterial({color:0xd4bb83,dashSize:1,gapSize:1,transparent:true,opacity:.28}));edge.computeLineDistances();scene.add(edge);
        const markers = roverSites(latest.current).map((site: any) => {
          const group = new THREE.Group(); group.position.set(site.x, elevation(site.x, site.z) + .07, site.z); scene!.add(group);
          const material = new THREE.MeshBasicMaterial({ color: 0xffdc8f, transparent: true, opacity: .8, side: THREE.DoubleSide });
          const ring = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.35, 64), material); ring.rotation.x = -Math.PI / 2; group.add(ring);
          const flag = new THREE.Mesh(new THREE.BoxGeometry(.65, .4, .04), material); flag.position.set(.3, 1.4, 0); group.add(flag);
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1.7, 8), rockMaterial); pole.position.y = .85; group.add(pole);
          const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;const context=canvas.getContext('2d')!;context.fillStyle='#102030e8';context.beginPath();context.roundRect(5,5,118,54,12);context.fill();context.fillStyle='#ffe2a4';context.font='bold 40px sans-serif';context.textAlign='center';context.fillText(site.id,64,47);
          const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));label.position.set(0,2.8,0);label.scale.set(2.6,1.3,1);group.add(label);
          return { group, material, site, label };
        });
        for (const camp of ROVER_CAMPS.filter((camp: any)=>latest.current.version<3||camp.id!=='west')) {
          const pad = new THREE.Mesh(new THREE.RingGeometry(2.8, 3, 64), new THREE.MeshBasicMaterial({ color: 0x8deac9, side: THREE.DoubleSide })); pad.rotation.x = -Math.PI / 2; pad.position.set(camp.x, elevation(camp.x, camp.z) + .04, camp.z); scene.add(pad);
          if (camp.id !== 'base') { const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, .08, 1), new THREE.MeshStandardMaterial({ color: 0x254c80, metalness: .5, roughness: .35 })); panel.position.set(camp.x + 2, elevation(camp.x + 2, camp.z) + .8, camp.z); panel.rotation.x = -.35; scene.add(panel); }
        }
        const platform = createCrewedPlatform(); platform.capsule.visible = false; platform.root.position.set(ROVER_BASE.x - 8, elevation(ROVER_BASE.x - 8, ROVER_BASE.z-4), ROVER_BASE.z-4); platform.lander.scale.setScalar(1.6); scene.add(platform.root);
        const landerMaterials=new Map<THREE.Material,number>();platform.root.traverse((object: any)=>{if(object instanceof THREE.Mesh)for(const material of Array.isArray(object.material)?object.material:[object.material]){landerMaterials.set(material,material.opacity);material.transparent=true;}});
        const ramp = new THREE.Mesh(new THREE.BoxGeometry(7, .12, 1.5), new THREE.MeshStandardMaterial({ color: 0x9095a0, roughness: .6 })); ramp.rotation.z = -.15;ramp.rotation.y=-.46; ramp.position.set(ROVER_BASE.x - 4, elevation(ROVER_BASE.x, ROVER_BASE.z) + .55, ROVER_BASE.z-2); scene.add(ramp);
        const bay=createRoverBay(elevation);bay.root.visible=latest.current.version>=3;scene.add(bay.root);
        const chargeWireGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()]);
        const chargeWire=new THREE.Line(chargeWireGeometry,new THREE.LineBasicMaterial({color:0x9dffd4}));scene.add(chargeWire);
        const craft=buildRoverAssembly(preparation);craft.scale.setScalar(.85);craft.rotation.order='YXZ';scene.add(craft);
        const wheelPivots:THREE.Object3D[]=[];craft.traverse((object: any)=>{if(object.userData.wheelPivot){object.rotation.order='YXZ';object.userData.restY=object.position.y;wheelPivots.push(object);}});
        const installedBit=craft.getObjectByName('drill-bit'),scoop=craft.children.find((part: any)=>part.name==='geo-scoop-basic');
        const tool=installedBit??scoop,toolRestY=tool?.position.y??0;
        const sampleTube=new THREE.Group();const tubeGlass=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.45,16),new THREE.MeshStandardMaterial({color:0xc5e7ea,transparent:true,opacity:.35,roughness:.2}));sampleTube.add(tubeGlass);const soilCore=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.38,16),new THREE.MeshStandardMaterial({color:0xb8a68b,roughness:1}));sampleTube.add(soilCore);sampleTube.position.set(.7,1.25,.8);craft.add(sampleTube);
        const tubeCap=new THREE.Mesh(new THREE.CylinderGeometry(.145,.145,.06,16),new THREE.MeshStandardMaterial({color:0xd6ad66,metalness:.6,roughness:.4}));sampleTube.add(tubeCap);
        const cargo = ROVER_SITES.map((site: any, index: number) => { const box = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .4,16), new THREE.MeshStandardMaterial({ color: sampleColor(site.id), metalness: .5, roughness: .4 })); box.position.set((index % 3 - 1) * .32, 1.35, .7 + Math.floor(index / 3) * .32); craft.add(box); return { site, box }; });
        const baseSamples=(latest.current.version>=3?[]:ROVER_SITES).map((_: any,index: number)=>{const box=new THREE.Mesh(new THREE.BoxGeometry(.42,.28,.45),new THREE.MeshStandardMaterial({color:0xc7d6cc,metalness:.5,roughness:.4}));box.position.set(ROVER_BASE.x-4+(index%3)*.45,elevation(ROVER_BASE.x-4,ROVER_BASE.z)+.75,ROVER_BASE.z+1.5+Math.floor(index/3)*.5);scene!.add(box);return box;});
        const lamp = new THREE.SpotLight(0xdeefff, 100, 18, .65, .7, 1), lampTarget = new THREE.Object3D(); lamp.position.set(0, 1.2, -.8); craft.add(lamp); scene.add(lampTarget); lamp.target = lampTarget;
        craft.traverse((object: any)=>{if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;}});tubeGlass.castShadow=false;
        const trackData = new Float32Array(4096 * 6), trackGeometry = new THREE.BufferGeometry(); trackGeometry.setAttribute('position', new THREE.BufferAttribute(trackData, 3)); trackGeometry.setDrawRange(0, 0); const tracks = new THREE.LineSegments(trackGeometry, new THREE.LineBasicMaterial({ color: 0x4a4645, transparent: true, opacity: .55 })); tracks.frustumCulled = false; scene.add(tracks);
        let trackCount = 0, old = new THREE.Vector3(latest.current.x, 0, latest.current.z), lastAttempts = latest.current.attempts;
        const dustGeometry = new THREE.BufferGeometry(), dustData = new Float32Array(32 * 3); dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustData, 3)); const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0xb6ada1, size: .1, transparent: true, opacity: .25, depthWrite: false })); scene.add(dust);
        const orbit={yaw:0,pitch:.42,distance:6.8,drag:false,lastX:0,lastY:0,lastLook:0};
        const cameraPosition=new THREE.Vector3(),lookTarget=new THREE.Vector3(),raycaster=new THREE.Raycaster(),collisionObjects:THREE.Object3D[]=[ground,...rockMeshes,...(latest.current.version>=3?[bay.root]:[])];let cameraReady=false;const previousCraftPosition=new THREE.Vector3(latest.current.x,0,latest.current.z);
        const resetCamera=()=>{orbit.yaw=0;orbit.pitch=.42;orbit.distance=6.8;orbit.drag=false;};
        const pointerDown=(event:PointerEvent)=>{if(![0,2].includes(event.button)||isEngineFrozen()||latest.current.paused)return;event.preventDefault();orbit.drag=true;orbit.lastX=event.clientX;orbit.lastY=event.clientY;renderer?.domElement.setPointerCapture(event.pointerId);};
        const pointerMove=(event:PointerEvent)=>{if(!orbit.drag||isEngineFrozen()||latest.current.paused)return;orbit.yaw-=(event.clientX-orbit.lastX)*.007;orbit.pitch=THREE.MathUtils.clamp(orbit.pitch+(event.clientY-orbit.lastY)*.005,.16,.85);orbit.lastX=event.clientX;orbit.lastY=event.clientY;orbit.lastLook=performance.now();};
        const pointerUp=()=>{orbit.drag=false;orbit.lastLook=performance.now();};
        const wheel=(event:WheelEvent)=>{if(isEngineFrozen()||latest.current.paused)return;event.preventDefault();orbit.distance=THREE.MathUtils.clamp(orbit.distance+event.deltaY*.008,5,10);};
        const context=(event:Event)=>event.preventDefault();
        const center=(event:KeyboardEvent)=>{if(event.key.toLowerCase()==='c'&&!isEngineFrozen())resetCamera();};
        const draw = () => {
          if (disposed || !renderer || !scene || isEngineFrozen() || document.hidden) return;
          const s = latest.current, y = elevation(s.x, s.z), moving = Math.abs(s.speed) > .1 && !s.paused;
          const deployment = s.phase === 'deploying' ? Math.min(1, s.phaseTime / 3) : s.deployed ? 1 : 0;
          const bayPose=bay.pose(s),position=bayPose?.position??new THREE.Vector3(s.x-(1-deployment)*3,y+(1-deployment),s.z-(1-deployment)*1.5);
          craft.visible=!(s.version>=3&&s.stowed);
          if(!s.paused&&!gentle&&s.attempts===lastAttempts&&craft.position.distanceTo(position)<5)craft.position.lerp(position,.3);else craft.position.copy(position);
          const autoDistance=previousCraftPosition.distanceTo(craft.position);if(bayPose&&!s.paused&&autoDistance<1)wheelPivots.forEach(wheel=>{wheel.rotation.x+=autoDistance/.3;});previousCraftPosition.copy(craft.position);
          const turn=Math.atan2(Math.sin(-(bayPose?.heading??s.heading)-craft.rotation.y),Math.cos(-(bayPose?.heading??s.heading)-craft.rotation.y));craft.rotation.y+=s.paused||gentle?turn:turn*.35;
          const dx = s.x - old.x, dz = s.z - old.z, distance = Math.hypot(dx, dz);
          if (lastAttempts !== s.attempts) { trackCount = 0; trackGeometry.setDrawRange(0, 0); lastAttempts = s.attempts; }
          if (moving && distance > .12 && distance < 2) {
            for (const side of [-1, 1]) { const x = s.x + Math.cos(s.heading) * side * .75, z = s.z - Math.sin(s.heading) * side * .75; const slot = trackCount++ % 4096; trackData.set([x - dx, elevation(x - dx, z - dz) + .025, z - dz, x, elevation(x, z) + .025, z], slot * 6); }
            trackGeometry.attributes.position.needsUpdate = true; trackGeometry.setDrawRange(0, Math.min(trackCount, 4096) * 2);
            wheelPivots.forEach(wheel => { wheel.rotation.x += distance / .35 * Math.sign(s.speed); });
          }
          old.set(s.x, y, s.z);
          const dy = elevation(s.x + Math.sin(s.heading), s.z - Math.cos(s.heading)) - elevation(s.x - Math.sin(s.heading), s.z + Math.cos(s.heading)); craft.rotation.x = gentle||bayPose ? 0 : Math.atan2(dy, 2) * .6;
          wheelPivots.forEach(wheel=>{wheel.rotation.y=wheel.position.z<0?-(s.steerAngle??0):(s.steerAngle??0)*.2;});
          ramp.visible = s.version<3&&!s.deployed;
          const baseX=platform.root.position.x-s.x,baseZ=platform.root.position.z-s.z,backX=-Math.sin(s.heading+orbit.yaw),backZ=Math.cos(s.heading+orbit.yaw);const along=baseX*backX+baseZ*backZ,across=Math.abs(baseX*backZ-baseZ*backX);const behindBase=s.phase==='exploring'&&along>0&&along<orbit.distance+2&&across<3;
          landerMaterials.forEach((opacity,material)=>{material.opacity=behindBase?opacity*.3:opacity;material.depthWrite=!behindBase;});
          rockMeshes.forEach(mesh=>{const dx=mesh.position.x-s.x,dz=mesh.position.z-s.z,along=dx*backX+dz*backZ,across=Math.abs(dx*backZ-dz*backX),obscures=along>0&&along<orbit.distance&&across<2.4;mesh.material.opacity=obscures?.25:1;mesh.material.depthWrite=!obscures;});
          const extracting=s.version===1?s.phase==='drilling':s.phase==='collecting',progress=THREE.MathUtils.clamp(s.drillProgress/(s.version===1?6:2.6),0,1);
          if(tool){tool.position.y=toolRestY-(extracting?Math.sin(progress*Math.PI)*.2:0);if(installedBit)installedBit.rotation.y=extracting?s.drillProgress*22:0;if(scoop)scoop.rotation.z=extracting?Math.sin(progress*Math.PI)*.55:0;}
          const hard=roverSites(s).find((site: any)=>site.id===s.drillSite)?.hard;
          const sampleSlot=cargo.find((entry: any)=>entry.site.id===s.drillSite)?.box.position??new THREE.Vector3(.3,1.35,.7);
          sampleTube.visible=extracting&&!hard&&progress>.2;tubeCap.position.y=.25+(1-THREE.MathUtils.smoothstep(progress,.75,1))*.4;
          soilCore.scale.y=Math.max(.02,progress);soilCore.position.y=-.19+progress*.19;
          sampleTube.position.copy(new THREE.Vector3(.7,.35+Math.min(1,progress*2)*1.3,.8).lerp(sampleSlot,THREE.MathUtils.smoothstep(progress,.65,1)));
          cargo.forEach(({site,box}: any)=>{box.visible=s.cargo.includes(site.id)&&!(s.phase==='delivering'&&s.phaseTime>=.95&&s.deliveryIds?.includes(site.id));});
          const source=cargo.find((entry: any)=>entry.site.id===s.deliveryIds?.[0])?.box.position??sampleSlot;bay.update(s,craft,source);
          chargeWire.visible=s.phase==='charging';
          if(chargeWire.visible){const vertices=chargeWireGeometry.attributes.position;vertices.setXYZ(0,ROVER_CHARGER.x+2,elevation(ROVER_CHARGER.x+2,ROVER_CHARGER.z)+.8,ROVER_CHARGER.z);vertices.setXYZ(1,(ROVER_CHARGER.x+s.x)/2,y+.2,s.z+.8);vertices.setXYZ(2,craft.position.x,craft.position.y+.85,craft.position.z+.4);vertices.needsUpdate=true;chargeWireGeometry.computeBoundingSphere();}
          baseSamples.forEach((box: any,index: number)=>{box.visible=index<s.deposited.length;box.position.y=elevation(ROVER_BASE.x-4,ROVER_BASE.z)+.75+(['boarding','ready','complete'].includes(s.phase)?s.phase==='boarding'?Math.min(1,s.phaseTime/4)*1.8:1.8:0);});
          markers.forEach(({ group, material, site, label }: any) => { group.visible=!['drilling','collecting','sample-result'].includes(s.phase)&&(s.version<3||visibleRoverSites(s).some((active: any)=>active.id===site.id)); label.visible=!s.drilled.includes(site.id)&&Math.hypot(site.x-s.x,site.z-s.z)<24; material.color.setHex(s.drilled.includes(site.id) ? site.hard ? 0xe58b7e : 0x8dddb8 : 0xffdc8f); material.opacity = s.drilled.includes(site.id) ? .35 : .8; });
          lamp.visible = roverLight(s.x, s.z) === 0; lampTarget.position.set(s.x + Math.sin(s.heading) * 8, y, s.z - Math.cos(s.heading) * 8);
          dust.visible = !gentle && (moving || extracting && !s.paused);
          if (dust.visible) { for (let i = 0; i < 32; i++) { const life = (s.frames * .07 + i * .618) % 1; dustData[i * 3] = s.x + Math.sin(i * 2.4) * (life + .4); dustData[i * 3 + 1] = y + .08 + Math.sin(life * Math.PI) * .4; dustData[i * 3 + 2] = s.z + Math.cos(i * 2.4) * (life + .4); } dustGeometry.attributes.position.needsUpdate = true; dustGeometry.computeBoundingSphere(); }
          if(!orbit.drag&&performance.now()-orbit.lastLook>1400&&moving)orbit.yaw*=.93;
          const sampleView=s.version>=2&&['drilling','collecting','sample-result'].includes(s.phase),viewHeading=s.heading+orbit.yaw;
          const desiredLook=craft.position.clone().add(new THREE.Vector3(Math.sin(s.heading)*1.1,1.15,-Math.cos(s.heading)*1.1));
          let desiredPosition:THREE.Vector3;
          if(s.version>=3&&(['deploying','delivering','delivery-result','stowing'].includes(s.phase)||s.stowed)){if(['deploying','stowing'].includes(s.phase)||s.stowed)desiredLook.copy(bay.dock).add(new THREE.Vector3(0,1.4,2.7));else desiredLook.copy(craft.position).lerp(bay.dock,.55).add(new THREE.Vector3(0,1.1,.6));desiredPosition=desiredLook.clone().add(new THREE.Vector3(5.8,3.8,7.8));}
          else if(sampleView){craft.updateMatrixWorld(true);desiredLook.copy(craft.localToWorld(new THREE.Vector3(1.6,1,.7)));desiredPosition=craft.localToWorld(new THREE.Vector3(3.8,2.9,3.4));}
          else{const horizontal=orbit.distance*Math.cos(orbit.pitch);desiredPosition=craft.position.clone().add(new THREE.Vector3(-Math.sin(viewHeading)*horizontal,1+Math.sin(orbit.pitch)*orbit.distance,Math.cos(viewHeading)*horizontal));}
          const direction=desiredPosition.clone().sub(desiredLook),length=direction.length();raycaster.set(desiredLook,direction.normalize());raycaster.far=length;
          const hit=raycaster.intersectObjects(collisionObjects,true).find(hit=>hit.distance>1.2);if(hit&&hit.distance<length){if(hit.distance<4.8)desiredPosition.y+=2;else desiredPosition.copy(desiredLook).addScaledVector(direction,hit.distance-.45);}
          desiredPosition.y=Math.max(desiredPosition.y,height(desiredPosition.x,desiredPosition.z)+.65);
          if(!cameraReady||s.paused||gentle){cameraPosition.copy(desiredPosition);lookTarget.copy(desiredLook);cameraReady=true;}else{cameraPosition.lerp(desiredPosition,.2);lookTarget.lerp(desiredLook,.24);}
          camera.position.copy(cameraPosition);camera.lookAt(lookTarget);const field=58+Math.min(4,Math.abs(s.speed)*.45);if(Math.abs(camera.fov-field)>.1){camera.fov=field;camera.updateProjectionMatrix();}if(import.meta.env.DEV){mount.dataset.cameraDistance=camera.position.distanceTo(craft.position).toFixed(2);mount.dataset.cameraMode=s.version>=3&&['deploying','delivering','delivery-result','stowing'].includes(s.phase)?'cargo':sampleView?'collection':'chase';mount.dataset.cameraYaw=orbit.yaw.toFixed(2);}
          renderer.render(scene,camera);
        };
        const active=()=>!latest.current.paused&&roverActive(latest.current)&&!isEngineFrozen()&&!document.hidden;
        let lastPaint=0;
        const animate=(time:number)=>{if(disposed||!active())return;if(time-lastPaint>30){draw();lastPaint=time;}frame=requestAnimationFrame(animate);};
        const repaint=()=>{cancelAnimationFrame(frame);draw();if(active())frame=requestAnimationFrame(animate);};
        wake.current = repaint;
        const resize = () => { if (!renderer) return; const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight), aspect = width / height; camera.aspect=aspect; camera.updateProjectionMatrix(); renderer.setSize(width, height, false); repaint(); };
        const observer = new ResizeObserver(resize); observer.observe(mount);
        const lost = (event: Event) => { event.preventDefault(); setFailed(true); };
        renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointercancel',pointerUp);renderer.domElement.addEventListener('contextmenu',context);renderer.domElement.addEventListener('wheel',wheel,{passive:false});window.addEventListener('keydown',center);window.addEventListener('blur',pointerUp);window.addEventListener('game-orientation-pause',pointerUp);
        renderer.domElement.addEventListener('webglcontextlost', lost); document.addEventListener('visibilitychange', repaint); window.addEventListener('game-orientation-pause',repaint);window.addEventListener('game-orientation-resume', repaint); resize();
        cleanup = () => { observer.disconnect();renderer?.domElement.removeEventListener('pointerdown',pointerDown);renderer?.domElement.removeEventListener('pointermove',pointerMove);renderer?.domElement.removeEventListener('pointerup',pointerUp);renderer?.domElement.removeEventListener('pointercancel',pointerUp);renderer?.domElement.removeEventListener('contextmenu',context);renderer?.domElement.removeEventListener('wheel',wheel);window.removeEventListener('keydown',center);window.removeEventListener('blur',pointerUp);window.removeEventListener('game-orientation-pause',pointerUp); renderer?.domElement.removeEventListener('webglcontextlost', lost); document.removeEventListener('visibilitychange', repaint);window.removeEventListener('game-orientation-pause',repaint); window.removeEventListener('game-orientation-resume', repaint); };
      } catch { if (!disposed) setFailed(true); } finally { finish(); }
    };
    const firstFrame = requestAnimationFrame(() => { frame = requestAnimationFrame(boot); });
    return () => { disposed = true; cancelAnimationFrame(firstFrame); cancelAnimationFrame(frame); finish(); cleanup(); wake.current = () => {}; if (scene) disposeScene(scene); renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove(); };
  }, [preparation, gentle, rover.version]);
  return <div className="rover-canvas" ref={host} role="img" aria-label="Your assembled uncrewed rover, remotely controlled by astronauts inside the lunar lander">{failed ? <div className="rover-visual-fallback">3D view unavailable. Use the map and driving controls to continue.</div> : null}</div>;
}
