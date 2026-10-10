import * as THREE from 'three';
import { buildAssembly } from './workshopMeshes.ts';
import { partById } from './preparation.ts';
import type { PreparationSelection } from './design.ts';

/** A generic two-stage robotic launcher. Dimensions are illustrative, not a vehicle replica. */
export function createLaunchHardware(preparation: PreparationSelection) {
  const white = new THREE.MeshStandardMaterial({ color: 0xe8e9eb, metalness: .18, roughness: .46 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xa7adb6, metalness: .82, roughness: .34 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x20252c, metalness: .5, roughness: .43 });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x454950, metalness: .3, roughness: .7 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xbda36a, metalness: .66, roughness: .4 });
  const root = new THREE.Group(), booster = new THREE.Group(), upper = new THREE.Group();
  root.add(booster, upper);
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
  cylinder(.91, .91, 4.6, 2.75, white, booster);
  cylinder(.91, .86, .42, .25, graphite, booster);
  cylinder(.91, .91, .78, 5.44, dark, booster);
  for (const y of [.46, 1.2, 3.94, 5.05, 5.83]) ring(.916, y, booster);
  rail(.925, 2.76, 4.45, -1.1, booster);
  rail(.925, 2.76, 4.45, Math.PI - 1.1, booster);
  // Small flush access panels and hold-down fittings, rather than full-height decorative ribs.
  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(.19, .32, .018), silver);
    panel.position.set(Math.sin(angle) * .915, .72, Math.cos(angle) * .915); panel.rotation.y = angle; booster.add(panel);
    const fitting = new THREE.Mesh(new THREE.BoxGeometry(.14, .12, .09), dark);
    fitting.position.set(Math.sin(angle) * .9, .14, Math.cos(angle) * .9); fitting.rotation.y = angle; booster.add(fitting);
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
  engineBell(0,-.18,0,1,booster);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    engineBell(Math.sin(a) * .56,-.18,Math.cos(a) * .56,.8,booster);
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

  const payload = buildAssembly(preparation); root.add(payload);
  for (const child of payload.children) {
    const lander = partById(child.name)?.category === 'lander';
    child.position.x += lander ? 2.1 : -2.1;
    if (!lander) { child.position.multiplyScalar(.5); child.position.y += 2.05; child.scale.multiplyScalar(.5); }
  }
  // Fit the folded equipment inside the cylindrical part of the fairing, including wide solar panels.
  const bounds = new THREE.Box3().setFromObject(payload);
  if (!bounds.isEmpty()) {
    const size = bounds.getSize(new THREE.Vector3()), centre = bounds.getCenter(new THREE.Vector3());
    const scale = Math.min(1, 1.82 / Math.hypot(size.x,size.z), 2.15 / Math.max(size.y,.001));
    for (const child of payload.children) {
      child.position.sub(new THREE.Vector3(centre.x,bounds.min.y,centre.z)).multiplyScalar(scale);
      child.scale.multiplyScalar(scale);
    }
  }
  payload.position.y = 8.1;

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
      decal.position.y = 2.74; booster.add(decal);
    }
  }
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.55,2.65,.15,64),dark);
  platform.position.y = -.37; root.add(platform); platform.name = 'launch-platform';
  const platformRing = new THREE.Mesh(new THREE.TorusGeometry(2.35,.015,6,64),silver);
  platformRing.rotation.x = Math.PI / 2; platformRing.position.y = .08; platform.add(platformRing);
  return { root,booster,upper,adapter,payload,halves,platform };
}
