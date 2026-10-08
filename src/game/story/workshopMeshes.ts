import * as THREE from 'three';
import { partById } from './preparation.ts';
import type { PreparationSelection } from './design.ts';

function material(color: number, metallic = .7) { return new THREE.MeshStandardMaterial({ color, metalness: metallic, roughness: .33 }); }
export function createPartMesh(id: string): THREE.Group {
  const group = new THREE.Group();
  const silver = material(0xc8cfda), dark = material(0x242c40), gold = material(0xb28d32), blue = material(0x1c417c), white = material(0xe3e5df, .2);
  const mesh = (geometry: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    const object = new THREE.Mesh(geometry, mat); object.position.set(x, y, z); group.add(object); return object;
  };
  const box = (w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  const cylinder = (r1: number, r2: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0) => mesh(new THREE.CylinderGeometry(r1, r2, h, 24), mat, x, y, z);
  const rod = (a: THREE.Vector3, b: THREE.Vector3, radius: number, mat: THREE.Material) => {
    const direction = b.clone().sub(a);
    const piece = cylinder(radius, radius, direction.length(), mat);
    piece.position.copy(a.clone().add(b).multiplyScalar(.5)); piece.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  };
  const category = partById(id)?.category;
  if (id === 'lander-body') {
    cylinder(1.1, 1.2, .75, gold, 0, 1.25); cylinder(1.22, 1.22, .09, dark, 0, .83); cylinder(1.15, 1.15, .1, silver, 0, 1.65);
    box(.75, .65, .6, white, 0, 1.9);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const foot = new THREE.Vector3(Math.cos(a) * 1.65, .12, Math.sin(a) * 1.65);
      rod(new THREE.Vector3(Math.cos(a) * .9, 1.3, Math.sin(a) * .9), foot, .055, silver);
      rod(new THREE.Vector3(Math.cos(a) * .65, .88, Math.sin(a) * .65), foot, .038, dark);
      cylinder(.22, .3, .06, silver, foot.x, foot.y, foot.z);
    }
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; box(.13, .5, .06, dark, Math.cos(a) * 1.12, 1.25, Math.sin(a) * 1.12).rotation.y = -a + Math.PI / 2; }
  } else if (category === 'rover') {
    const heavy = id === 'heavy-rover', basic = id === 'basic-rover';
    const width = heavy ? 1.25 : basic ? .95 : 1.1;
    box(width, .55, 1.35, gold, 0, .9); box(width + .12, .1, 1.45, silver, 0, 1.22);
    const count = basic ? 2 : 3;
    for (const side of [-1, 1]) for (let i = 0; i < count; i++) {
      const z = count === 2 ? (i - .5) * 1 : (i - 1) * .65;
      const wheel = cylinder(.32, .32, .19, dark, side * (width / 2 + .27), .37, z); wheel.rotation.z = Math.PI / 2;
      const hub = cylinder(.11, .11, .22, silver, side * (width / 2 + .27), .37, z); hub.rotation.z = Math.PI / 2;
      rod(new THREE.Vector3(side * width / 2, .85, z * .4), new THREE.Vector3(side * (width / 2 + .27), .37, z), .05, silver);
      for (let k = 0; k < 12; k++) { const angle = k * Math.PI / 6; box(.22, .04, .055, silver, side * (width / 2 + .27), .37 + Math.cos(angle) * .31, z + Math.sin(angle) * .31).rotation.x = -angle; }
    }
    cylinder(.055, .055, .55, silver, 0, 1.52, -.3); box(.45, .15, .22, white, 0, 1.83, -.3);
    for (const x of [-.12, .12]) { const eye = cylinder(.06, .06, .035, blue, x, 1.84, -.44); eye.rotation.x = Math.PI / 2; }
  } else if (id === 'landing-engines') {
    for (const x of [-.3, .3]) { cylinder(.09, .23, .45, dark, x, .15); cylinder(.1, .1, .19, silver, x, .47); cylinder(.035, .035, .35, gold, x + .13, .4); }
  } else if (id === 'landing-radar' || category === 'navigation' || id === 'landing-cameras') {
    box(.48, .24, .3, silver); const count = id === 'stereo-hazard-camera' ? 2 : 1;
    for (let i = 0; i < count; i++) { const lens = cylinder(.09, .09, .15, dark, count === 2 ? (i - .5) * .24 : 0, 0, .19); lens.rotation.x = Math.PI / 2; const glass = cylinder(.065, .065, .16, blue, count === 2 ? (i - .5) * .24 : 0, 0, .2); glass.rotation.x = Math.PI / 2; }
    box(.06, .22, .06, dark, 0, -.2);
  } else if (id === 'lander-antenna' || category === 'communication') {
    cylinder(.035, .04, .5, silver, 0, .12);
    if (id === 'basic-communication') { cylinder(.018, .018, .45, gold, 0, .55); box(.23, .18, .18, white, 0, -.15); }
    else { const dish = mesh(new THREE.SphereGeometry(.33, 28, 16, 0, Math.PI * 2, 0, .9), white, 0, .5); dish.rotation.x = .8; rod(new THREE.Vector3(0, .45, 0), new THREE.Vector3(0, .68, .25), .025, gold); }
  } else if (id === 'trident') {
    box(.32, .42, .3, gold, 0, .3); box(.18, 1, .16, silver, .2, -.05); cylinder(.07, .07, 1, dark, 0, -.45);
    for (let i = 0; i < 9; i++) { const ring = mesh(new THREE.TorusGeometry(.075, .019, 6, 18), silver, 0, -.08 - i * .09); ring.rotation.x = Math.PI / 2 + .25; }
    mesh(new THREE.ConeGeometry(.08, .15, 16), silver, 0, -.99).rotation.z = Math.PI;
  } else if (id === 'nss') {
    cylinder(.14, .14, .5, gold); cylinder(.15, .15, .07, silver, 0, .28); box(.35, .08, .35, dark, 0, -.3);
  } else if (id === 'nirvss') {
    box(.4, .25, .3, silver); const lens = cylinder(.08, .08, .22, gold, 0, 0, .24); lens.rotation.x = Math.PI / 2; box(.06, .2, .06, dark, 0, -.2);
  } else if (id === 'msolo') {
    cylinder(.14, .14, .4, silver); cylinder(.045, .045, .22, gold, 0, .3); box(.35, .13, .3, dark, 0, -.25);
  } else if (category === 'solar') {
    const panels = id === 'efficient-solar' ? 2 : 1;
    for (let i = 0; i < panels; i++) {
      const x = (i - (panels - 1) / 2) * .77; box(.72, .055, .9, silver, x); box(.67, .07, .84, blue, x, .03);
      for (let row = 0; row < 4; row++) box(.69, .01, .009, silver, x, .071, (row - 1.5) * .2);
      for (let col = 0; col < 3; col++) box(.009, .01, .87, silver, x + (col - 1) * .21, .071);
    }
    cylinder(.035, .035, .3, dark, 0, -.17);
  } else if (category === 'battery') {
    const cells = id === 'large-battery' ? 4 : id === 'medium-battery' ? 3 : 2;
    box(cells * .12 + .07, .32, .29, dark);
    for (let i = 0; i < cells; i++) cylinder(.048, .048, .27, silver, (i - (cells - 1) / 2) * .12, .05);
    box(.2, .04, .25, gold, 0, .23);
  } else if (category === 'thermal') {
    box(.56, .36, .4, gold); box(.4, .04, .31, silver, 0, .22);
    for (let i = 0; i < 4; i++) box(.02, .32, .41, white, (i - 1.5) * .11);
  } else { box(.42, .24, .35, silver); box(.3, .02, .27, blue, 0, .14); for (let i = 0; i < 3; i++) box(.03, .25, .36, gold, (i - 1) * .13); }
  // Unused materials are also owned by the group for deterministic disposal.
  group.userData.materials = [silver, dark, gold, blue, white];
  return group;
}
export function disposeGroup(group: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  group.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      geometries.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
    }
    (object.userData.materials ?? []).forEach((m: THREE.Material) => materials.add(m));
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}
export function attachmentPosition(id: string): THREE.Vector3 {
  const part = partById(id);
  const positions: Record<string, number[]> = {
    'lander-body': [-2.1, 1.2, 0], 'landing-engines': [-2.1, .43, 0], 'landing-radar': [-1.38, 1.6, .6],
    'navigation-computer': [-2.7, 1.7, .5], 'lander-antenna': [-2.65, 2.1, -.5], 'landing-cameras': [-1.5, 1.65, -.6],
    nss: [1.36, 1.02, -.5], nirvss: [2.62, 1.35, -.2], trident: [2.72, 1.15, .6], msolo: [1.65, 1.38, .1],
  };
  const categories: Record<string, number[]> = { rover: [2.1, 0, 0], navigation: [2.1, 2.04, -.3], solar: [2.1, 1.6, .55], battery: [2.1, .74, .76], thermal: [2.12, 1.28, .13], communication: [1.55, 1.35, .3] };
  return new THREE.Vector3(...(positions[id] ?? categories[part?.category ?? ''] ?? [0, 1, 0]) as [number, number, number]);
}
export function buildAssembly(preparation: PreparationSelection) {
  const group = new THREE.Group();
  const ids = [...preparation.landerPartIds, ...preparation.sciencePartIds, preparation.roverId, preparation.navigationId, preparation.solarId, preparation.batteryId, preparation.thermalId, preparation.communicationId].filter((id): id is string => !!id);
  for (const id of ids) {
    const mesh = createPartMesh(id); mesh.position.copy(attachmentPosition(id)); mesh.name = id;
    // Body and rover already use their own ground-level coordinates.
    if (id === 'lander-body') mesh.position.y = 0;
    group.add(mesh);
  }
  return group;
}
