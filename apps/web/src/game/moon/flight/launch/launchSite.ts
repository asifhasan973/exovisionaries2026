import * as THREE from 'three';

/** Local launch-site scenery. The camera follows the rocket as this ground drops out of view. */
export function createLaunchSite() {
  const root = new THREE.Group(), tower = new THREE.Group(); root.add(tower);
  const steel = new THREE.MeshStandardMaterial({ color:0x8b99a5,metalness:.68,roughness:.42 });
  const concrete = new THREE.MeshStandardMaterial({ color:0x9cabb6,roughness:.93 });
  const grass = new THREE.MeshStandardMaterial({ color:0x425d59,roughness:1 });
  const orange = new THREE.MeshStandardMaterial({ color:0xe9ae52,metalness:.25,roughness:.5 });
  const dark = new THREE.MeshStandardMaterial({ color:0x253345,metalness:.35,roughness:.65 });
  const box = (size: [number,number,number], pos: [number,number,number], material: THREE.Material, parent = root) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size),material); mesh.position.set(...pos); parent.add(mesh); return mesh;
  };
  const beam = (from: THREE.Vector3,to: THREE.Vector3,radius: number,parent = tower) => {
    const delta = to.clone().sub(from);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),8),steel);
    mesh.position.copy(from).add(to).multiplyScalar(.5); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()); parent.add(mesh);
  };
  const terrain = new THREE.Mesh(new THREE.PlaneGeometry(160,160),grass);
  terrain.rotation.x = -Math.PI / 2; terrain.position.y = -.75; terrain.receiveShadow = true; root.add(terrain);
  const apron = new THREE.Mesh(new THREE.CylinderGeometry(7.2,7.2,.15,64),concrete);
  apron.position.y = -.67; apron.receiveShadow = true; root.add(apron);
  box([3.4,.15,30],[0,-.68,16],concrete).receiveShadow = true;
  box([2,.08,15],[1,-.58,-10],dark);
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    const mark = box([.07,.025,.52],[Math.sin(angle)*5.8,-.575,Math.cos(angle)*5.8],orange); mark.rotation.y = angle;
  }
  const pad = new THREE.Mesh(new THREE.BoxGeometry(3.8,.22,3.8),concrete);
  pad.position.y = -.56; pad.receiveShadow = true; root.add(pad);
  const mount = new THREE.Mesh(new THREE.TorusGeometry(1.2,.1,8,32),steel);
  mount.rotation.x = Math.PI / 2; mount.position.y = -.32; root.add(mount);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    box([.2,.52,.2],[Math.sin(a)*1.12,-.15,Math.cos(a)*1.12],steel);
  }
  // Four-column steel truss with diagonal bracing, decks and safety rails.
  for (const x of [-3.65,-2.6]) for (const z of [-1.4,-.35]) {
    box([.13,11.8,.13],[x,5.18,z],steel,tower).castShadow = true;
    box([.5,.25,.5],[x,-.57,z],concrete,tower);
  }
  for (let level = 0; level < 6; level++) {
    const low = -.5 + level * 1.9, high = low + 1.9;
    for (const z of [-1.4,-.35]) {
      beam(new THREE.Vector3(-3.65,low,z),new THREE.Vector3(-2.6,high,z),.035);
      beam(new THREE.Vector3(-2.6,low,z),new THREE.Vector3(-3.65,high,z),.035);
      box([1.17,.075,.075],[-3.125,high,z],steel,tower);
    }
    beam(new THREE.Vector3(-3.65,low,-1.4),new THREE.Vector3(-3.65,high,-.35),.035);
  }
  for (const y of [3.2,6.9,10.5]) {
    box([1.45,.12,1.45],[-3.125,y,-.875],dark,tower);
    for (const z of [-1.55,-.2]) box([1.5,.045,.045],[-3.125,y+.5,z],orange,tower);
    for (const x of [-3.8,-2.45]) for (const z of [-1.55,-.2]) box([.045,.5,.045],[x,y+.25,z],steel,tower);
  }
  const arms = [5.2,8.1].map(y => {
    const arm = new THREE.Group(); arm.position.set(-2.6,y,-.35); tower.add(arm);
    box([1.7,.12,.16],[.85,0,0],steel,arm);
    box([.16,.28,.3],[1.72,0,0],orange,arm);
    return arm;
  });
  // Service buildings stay distant and low so they don't compete with the launcher.
  for (const [x,z] of [[-16,-19],[18,-25]]) {
    box([8,2.2,6],[x,.35,z],concrete);
    box([8.4,.2,6.4],[x,1.55,z],steel);
    box([3,1.4,.06],[x,0,z+3.04],dark);
  }
  const smoke = new THREE.Group(); root.add(smoke);
  const smokeGeometry = new THREE.SphereGeometry(1,12,8);
  for (let i = 0; i < 8; i++) {
    const cloud = new THREE.Mesh(smokeGeometry,new THREE.MeshBasicMaterial({ color:0xe7eaf0,transparent:true,opacity:.4,depthWrite:false }));
    smoke.add(cloud);
  }
  return { root,tower,arms,smoke };
}
