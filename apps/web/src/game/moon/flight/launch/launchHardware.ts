import * as THREE from 'three';
import { createCrewedPlatform } from '@/game/moon/crew/crewedMeshes';
import { buildAssembly, buildRoverAssembly } from '@/game/moon/workshop/lander/workshopMeshes';
import { partById } from '@/game/moon/core/preparation';
import type { PreparationSelection } from '@/game/moon/core/design';

/** Shared two-stage game launcher. Dimensions are illustrative, not a vehicle replica. */
export function createLaunchHardware(preparation: PreparationSelection, crewed = false) {
  const white = new THREE.MeshStandardMaterial({ color: 0xe8e9eb, metalness: .18, roughness: .46 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xa7adb6, metalness: .82, roughness: .34 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x20252c, metalness: .5, roughness: .43 });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x454950, metalness: .3, roughness: .7 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xbda36a, metalness: .66, roughness: .4 });
  const root = new THREE.Group(), booster = new THREE.Group(), upper = new THREE.Group();
  root.add(booster, upper);
  const engines=new THREE.Group(),core=new THREE.Group(),interstage=new THREE.Group();
  booster.add(engines,core,interstage);
  const cylinder = (top: number, bottom: number, height: number, y: number, material: THREE.Material, parent: THREE.Group) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, 64), material);
    mesh.position.y = y; parent.add(mesh); return mesh;
  };
  const ring = (radius: number, y: number, parent: THREE.Group, thickness = .014, material: THREE.Material = silver) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 6, 64), material);
    mesh.rotation.x = Math.PI / 2; mesh.position.y = y; parent.add(mesh);
  };
  const rail = (radius: number, y: number, height: number, angle: number, parent: THREE.Group) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(.065, height, .04), white);
    mesh.position.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius); mesh.rotation.y = angle; parent.add(mesh);
  };

  // Continuous tank diameter, recessed joints, and a short interstage replace the exposed skinny neck.
  cylinder(.91, .91, 4.6, 2.75, white, core);
  cylinder(.91, .86, .42, .25, graphite, engines);
  cylinder(.91, .91, .78, 5.44, dark, interstage);
  for (const y of [.46, 1.2, 3.94, 5.05, 5.83]) ring(.916, y, y>5.1?interstage:core);
  rail(.925, 2.76, 4.45, -1.1, core);
  rail(.925, 2.76, 4.45, Math.PI - 1.1, core);
  // Small flush access panels and hold-down fittings, rather than full-height decorative ribs.
  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(.19, .32, .018), silver);
    panel.position.set(Math.sin(angle) * .915, .72, Math.cos(angle) * .915); panel.rotation.y = angle; core.add(panel);
    const fitting = new THREE.Mesh(new THREE.BoxGeometry(.14, .12, .09), dark);
    fitting.position.set(Math.sin(angle) * .9, .14, Math.cos(angle) * .9); fitting.rotation.y = angle; engines.add(fitting);
  }
  const engineBell = (x: number, y: number, z: number, scale: number, parent: THREE.Group) => {
    const profile = [[.12,.52],[.11,.43],[.13,.32],[.2,.16],[.28,.04],[.3,0]].map(([r,h]) => new THREE.Vector2(r * scale, h * scale));
    const bellMaterial = graphite.clone(); bellMaterial.side = THREE.DoubleSide;
    const bell = new THREE.Mesh(new THREE.LatheGeometry(profile, 32), bellMaterial);
    bell.position.set(x,y,z); parent.add(bell);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(.3 * scale,.012 * scale,6,32), silver);
    lip.rotation.x = Math.PI / 2; lip.position.set(x,y,z); parent.add(lip);
    // A dark recessed throat keeps the bell hollow when viewed from below.
    const throat = new THREE.Mesh(new THREE.CircleGeometry(.12 * scale,24), dark);
    throat.rotation.x = Math.PI / 2; throat.position.set(x,y + .43 * scale,z); parent.add(throat);
  };
  engineBell(0,-.18,0,1,engines);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    engineBell(Math.sin(a) * .56,-.18,Math.cos(a) * .56,.8,engines);
  }
  engineBell(0,5.37,0,1.45,upper);
  cylinder(.91, .91, 1.96, 6.8, white, upper);
  cylinder(.91, .91, .16, 7.7, dark, upper);
  for (const y of [5.83,6.05,7.5,7.79]) ring(.917,y,upper);
  rail(.925,6.7,1.65,-1.1,upper);

  const adapter = new THREE.Group(); root.add(adapter);
  cylinder(1.08,.91,.3,7.95,white,adapter);
  cylinder(.74,.85,.13,8.1,gold,adapter);
  ring(1.086,8.075,adapter,.019,dark);

  const payload = crewed ? new THREE.Group() : buildAssembly(preparation); root.add(payload);
  let crewCapsule:THREE.Group|undefined,lunarLander:THREE.Group|undefined,roverCargo:THREE.Group|undefined;
  if(crewed){
    const crew=createCrewedPlatform();crew.hatchDoor.rotation.y=0;crew.sealIndicator.material=crew.sealedLight;
    crew.capsule.position.set(0,1.8,0);crew.capsule.scale.setScalar(.45);crew.lander.position.set(-.25,0,0);crew.lander.scale.setScalar(.48);
    const rover=buildRoverAssembly(preparation);
    rover.position.set(.62,.2,.15);rover.scale.setScalar(.32);
    payload.add(crew.capsule,crew.lander,rover);crewCapsule=crew.capsule;lunarLander=crew.lander;roverCargo=rover;
    payload.userData.materials=crew.root.userData.materials;
  }

  for (const child of crewed ? [] : payload.children) {
    const lander = partById(child.name)?.category === 'lander';
    child.position.x += lander ? 2.1 : -2.1;
    if (!lander) { child.position.multiplyScalar(.5); child.position.y += 2.05; child.scale.multiplyScalar(.5); }
  }
  // Fit the folded equipment inside the cylindrical part of the fairing, including wide solar panels.
  const bounds = new THREE.Box3().setFromObject(payload);
  if (!bounds.isEmpty()) {
    const size = bounds.getSize(new THREE.Vector3()), centre = bounds.getCenter(new THREE.Vector3());
    const scale = Math.min(1, (crewed?2.2:1.82) / Math.hypot(size.x,size.z), (crewed?3.5:2.15) / Math.max(size.y,.001));
    for (const child of payload.children) {
      child.position.sub(new THREE.Vector3(centre.x,bounds.min.y,centre.z)).multiplyScalar(scale);
      child.scale.multiplyScalar(scale);
    }
  }
  payload.position.y = 8.1;

  // Fairings carry aerodynamic loads, not the cargo. A separate adapter frame
  // holds the spacecraft and rover throughout ascent, including fairing release.
  const retention = new THREE.Group(); retention.name = 'payload-retention-frame'; retention.position.y = payload.position.y;
  adapter.add(retention);
  const brace = (from: THREE.Vector3, to: THREE.Vector3, radius = .025) => {
    const direction = to.clone().sub(from), length = direction.length();
    if (length < .001) return;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,10),silver);
    beam.position.copy(from).lerp(to,.5); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()); retention.add(beam);
  };
  ring(.84,.025,retention,.035,dark);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(.82,.82,.07,32),graphite); deck.position.y = .035; retention.add(deck);
  payload.updateMatrixWorld(true);
  const toBay = payload.matrixWorld.clone().invert();
  for (const cargo of crewed ? [lunarLander,roverCargo,crewCapsule] : [payload]) {
    if (!cargo) continue;
    // Compute the real contact plane after the common payload fit transform.
    const box = new THREE.Box3().setFromObject(cargo).applyMatrix4(toBay);
    const centre = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    const capsuleSupport = cargo===crewCapsule;
    const y = capsuleSupport ? cargo.position.y+.7*cargo.scale.y : Math.max(.08,box.min.y);
    const halfX = Math.min(.64,Math.max(.1,size.x*(capsuleSupport ? .25 : .32))), halfZ = Math.min(.64,Math.max(.1,size.z*(capsuleSupport ? .25 : .32)));
    if(capsuleSupport){
      const collar = new THREE.Mesh(new THREE.TorusGeometry(.75*cargo.scale.x,.04,8,40),silver);
      collar.rotation.x = Math.PI/2; collar.position.set(centre.x,y,centre.z); retention.add(collar);
    }
    for (const sx of [-1,1]) for (const sz of [-1,1]) {
      const x = centre.x + sx*halfX, z = centre.z + sz*halfZ;
      brace(new THREE.Vector3(sx*.67,.06,sz*.67),new THREE.Vector3(x,y,z),capsuleSupport ? .065 : .035);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(.16,.065,.14),gold); pad.position.set(x,y+.015,z); retention.add(pad);
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(.04,.13,.16),dark); clamp.position.set(x+sx*.055,y+.07,z); retention.add(clamp);
    }
    for (const sz of [-1,1]) brace(new THREE.Vector3(centre.x-halfX,y,centre.z+sz*halfZ),new THREE.Vector3(centre.x+halfX,y,centre.z+sz*halfZ),.035);
  }

  // Tangent ogive: the shoulder flows smoothly into the curved nose instead of ending in a cone.
  const fairingRadius = 1.08, shoulder = 10.5, noseLength = 2.45;
  const ogiveRadius = (fairingRadius ** 2 + noseLength ** 2) / (2 * fairingRadius);
  const profile = [new THREE.Vector2(fairingRadius,8.08),new THREE.Vector2(fairingRadius,shoulder)];
  for (let i = 1; i <= 32; i++) {
    const h = noseLength * i / 32;
    profile.push(new THREE.Vector2(Math.max(0,Math.sqrt(ogiveRadius ** 2 - h ** 2) + fairingRadius - ogiveRadius),shoulder + h));
  }
  const halves = [-1,1].map(sign => {
    const half = new THREE.Group(); root.add(half);
    const start = sign === -1 ? 0 : Math.PI;
    const shellMaterial = white.clone(); shellMaterial.side = THREE.DoubleSide;
    half.add(new THREE.Mesh(new THREE.LatheGeometry(profile,48,start,Math.PI),shellMaterial));
    for (const y of [8.13,9.1]) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(1.084,1.084,.028,48,1,true,start,Math.PI), y < 9 ? silver : white);
      band.position.y = y; half.add(band);
    }
    // Separation seams follow the curved nose; both halves remain independent for jettison.
    for (const angle of [start,start + Math.PI]) {
      const points = profile.map(p => new THREE.Vector3(Math.sin(angle) * (p.x + .003),p.y,Math.cos(angle) * (p.x + .003)));
      const seam = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,.008,4,false),silver);
      half.add(seam);
      for (const y of [8.3,8.8,9.4,10]) {
        const latch = new THREE.Mesh(new THREE.BoxGeometry(.055,.075,.026),silver);
        latch.position.set(Math.sin(angle) * 1.084,y,Math.cos(angle) * 1.084); latch.rotation.y = angle; half.add(latch);
      }
    }
    return half;
  });

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#e8e9eb'; ctx.fillRect(0,0,256,1024);
      ctx.fillStyle = '#20252c'; ctx.textAlign = 'center'; ctx.font = 'bold 122px sans-serif';
      ['Z','T','B'].forEach((letter,i) => ctx.fillText(letter,128,360 + i * 152));
      ctx.fillStyle = '#756282'; ctx.fillRect(62,100,132,18);
      ctx.fillStyle = '#20252c'; ctx.font = 'bold 25px sans-serif'; ctx.fillText('BEYOND',128,827); ctx.fillText('01',128,905);
      const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshStandardMaterial({ map,roughness:.46,metalness:.18 });
      material.addEventListener('dispose',() => map.dispose());
      const decal = new THREE.Mesh(new THREE.CylinderGeometry(.918,.918,2.85,24,1,true,.17,.7),material);
      decal.position.y = 2.74; core.add(decal);
    }
  }
  const escapeTower=new THREE.Group();root.add(escapeTower);escapeTower.visible=crewed;
  cylinder(.075,.075,.8,13.4,dark,escapeTower);cylinder(.15,.1,.4,13.94,white,escapeTower);
  for(const x of [-.16,.16]){const strut=new THREE.Mesh(new THREE.BoxGeometry(.025,.65,.025),silver);strut.position.set(x,13.13,0);strut.rotation.z=x>0?-.15:.15;escapeTower.add(strut);}
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.55,2.65,.15,64),dark);
  platform.position.y = -.37; root.add(platform); platform.name = 'launch-platform';
  const platformRing = new THREE.Mesh(new THREE.TorusGeometry(2.35,.015,6,64),silver);
  platformRing.rotation.x = Math.PI / 2; platformRing.position.y = .08; platform.add(platformRing);
  return { root,booster,upper,adapter,payload,halves,platform,escapeTower,
    assemblyParts:{engines,core,interstage,upper,adapter,lander:lunarLander,rover:roverCargo,capsule:crewCapsule,'cover-left':halves[0],'cover-right':halves[1],tower:escapeTower} };
}
