import * as THREE from 'three';

/** Reusable illustrative crewed architecture. Not the lightweight workshop kit or a flight-certified Apollo replica. */
export function createCrewedPlatform() {
  const root = new THREE.Group(), capsule = new THREE.Group(), lander = new THREE.Group();
  capsule.name='command-service-spacecraft'; lander.name='crewed-lunar-lander'; root.add(capsule,lander);
  capsule.position.set(-2.1,0,0); lander.position.set(2.3,0,0);
  const silver=new THREE.MeshStandardMaterial({color:0xd0d8df,metalness:.75,roughness:.3});
  const white=new THREE.MeshStandardMaterial({color:0xe9e9df,metalness:.15,roughness:.55});
  const dark=new THREE.MeshStandardMaterial({color:0x17202d,metalness:.55,roughness:.5});
  const gold=new THREE.MeshStandardMaterial({color:0xb08a35,metalness:.7,roughness:.4});
  const glass=new THREE.MeshStandardMaterial({color:0x6bbbd0,metalness:.5,roughness:.2});
  root.userData.materials=[silver,white,dark,gold,glass];
  const mesh=(parent:THREE.Group, geometry:THREE.BufferGeometry, material:THREE.Material,x=0,y=0,z=0) => {const object=new THREE.Mesh(geometry,material);object.position.set(x,y,z);parent.add(object);return object;};
  const box=(parent:THREE.Group,w:number,h:number,d:number,material:THREE.Material,x=0,y=0,z=0) => mesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z);
  const cyl=(parent:THREE.Group,top:number,bottom:number,height:number,material:THREE.Material,x=0,y=0,z=0,segments=40) => mesh(parent,new THREE.CylinderGeometry(top,bottom,height,segments),material,x,y,z);
  const rod=(parent:THREE.Group,a:THREE.Vector3,b:THREE.Vector3,r=.04) => {const delta=b.clone().sub(a);const object=cyl(parent,r,r,delta.length(),silver);object.position.copy(a.clone().add(b).multiplyScalar(.5));object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());};
  const bell=(parent:THREE.Group,x:number,y:number,z:number,scale=1) => {const profile=[[.12,.38],[.1,.28],[.15,.17],[.28,0]].map(([r,h])=>new THREE.Vector2(r*scale,h*scale));return mesh(parent,new THREE.LatheGeometry(profile,32),dark,x,y,z);};
  cyl(capsule,.74,.74,1.9,white,0,1.65); bell(capsule,0,.25,0,1.6);
  for(const y of [.75,1.15,2.1,2.6]) cyl(capsule,.75,.75,.04,silver,0,y);
  for(let i=0;i<8;i++){const angle=i*Math.PI/4;const panel=box(capsule,.12,1.2,.025,silver,Math.sin(angle)*.745,1.6,Math.cos(angle)*.745);panel.rotation.y=angle;}
  const heatShield=cyl(capsule,.82,.68,.18,dark,0,2.73);heatShield.name='return-heat-shield';
  const cabin=cyl(capsule,.18,.81,1.3,silver,0,3.47);cabin.name='crew-capsule';cyl(capsule,.14,.16,.16,dark,0,4.2);
  for(const x of [-.23,.23]) box(capsule,.18,.17,.035,glass,x,3.36,.43).rotation.x=-.4;
  const hatch=box(capsule,.26,.36,.035,dark,0,3.12,.64); hatch.rotation.x=-.4;
  for(const side of [-1,1]) {rod(capsule,new THREE.Vector3(side*.5,2.4,0),new THREE.Vector3(side*.94,2.5,.15));cyl(capsule,.035,.035,.25,gold,side*.94,2.6,.15);}
  const descent=cyl(lander,.91,1.05,.74,gold,0,.85,0,8);descent.name='descent-stage';bell(lander,0,.3,0);
  box(lander,1.24,.8,1.05,silver,0,1.68);box(lander,.8,.34,.75,white,0,2.24);cyl(lander,.18,.18,.15,dark,0,2.52);
  for(const x of [-.35,.35]) {const window=box(lander,.26,.26,.04,glass,x,1.9,.548);window.rotation.z=x>0?.18:-.18;}
  box(lander,.36,.4,.08,dark,0,1.43,.57);
  for(let i=0;i<4;i++){const angle=i*Math.PI/2+Math.PI/4;const foot=new THREE.Vector3(Math.sin(angle)*1.65,.08,Math.cos(angle)*1.65);rod(lander,new THREE.Vector3(Math.sin(angle)*.65,1.2,Math.cos(angle)*.65),foot,.045);rod(lander,new THREE.Vector3(Math.sin(angle)*.9,.64,Math.cos(angle)*.9),foot,.03);cyl(lander,.2,.29,.05,silver,foot.x,foot.y,foot.z);}
  for(const x of [-.19,.19]) rod(lander,new THREE.Vector3(x,1.48,.62),new THREE.Vector3(x,.12,1.48),.022);
  for(let i=0;i<7;i++) rod(lander,new THREE.Vector3(-.19,.24+i*.17,1.39-i*.105),new THREE.Vector3(.19,.24+i*.17,1.39-i*.105),.018);
  rod(lander,new THREE.Vector3(-.5,2.18,0),new THREE.Vector3(-.66,2.68,.15),.025);
  const dish=mesh(lander,new THREE.SphereGeometry(.23,24,12,0,Math.PI*2,0,1),white,-.66,2.75,.15);dish.rotation.x=.8;
  root.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;}});
  return {root,capsule,lander,heatShield};
}
