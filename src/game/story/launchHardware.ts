import * as THREE from 'three';
import { buildAssembly } from './workshopMeshes.ts';
import { partById } from './preparation.ts';
import type { PreparationSelection } from './design.ts';

/** Shared illustrative hardware: packing and flight display the same installed payload. */
export function createLaunchHardware(preparation: PreparationSelection) {
    const silver = new THREE.MeshStandardMaterial({ color: 0xcfd5df, metalness: .75, roughness: .29 });
    const white = new THREE.MeshStandardMaterial({ color: 0xe4e5ea, metalness: .35, roughness: .4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x202238, metalness: .65, roughness: .3 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xd1a243, metalness: .7, roughness: .32 });
    const root = new THREE.Group(), booster = new THREE.Group(), upper = new THREE.Group(); root.add(booster, upper);
    const cylinder = (top: number, bottom: number, height: number, y: number, material: THREE.Material, parent: THREE.Group = y <= 5.25 ? booster : upper) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, 48), material); mesh.position.y = y; parent.add(mesh); return mesh;
    };
    cylinder(1.35, 1.35, 4.6, 2.65, white); cylinder(.9, 1.35, .65, 5.25, dark);
    cylinder(.3, .67, .62, 5.3, dark, upper);
    cylinder(.9, .9, 1.65, 6.4, white); cylinder(1.65, .9, .45, 7.45, silver);
    for (const y of [.45, 1.2, 4.1, 4.9, 5.63, 7.2]) cylinder(y > 5.5 ? .92 : 1.37, y > 5.5 ? .92 : 1.37, .085, y, dark);
    for (const [x, z] of [[-.55, -.4], [.55, -.4], [0, .55]]) { const nozzle = cylinder(.22, .4, .55, .1, dark); nozzle.position.set(x, .1, z); }
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(.035, 4.1, .025), silver); strip.position.set(Math.cos(a) * 1.355, 2.6, Math.sin(a) * 1.355); strip.rotation.y = -a; booster.add(strip);
    }
    for (const y of [1.25, 4.15]) for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12;
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(.025, 6, 4), silver); rivet.position.set(Math.cos(a) * 1.39, y, Math.sin(a) * 1.39); booster.add(rivet); }
    const adapter = new THREE.Group(); root.add(adapter);
    cylinder(1.6, 1.65, .22, 7.82, gold, adapter); cylinder(1.35, 1.4, .08, 7.97, dark, adapter);
    const payload = buildAssembly(preparation); root.add(payload);
    // Folded display arrangement keeps every selected component; scale is explicitly illustrative.
    for (const child of payload.children) {
      const lander = partById(child.name)?.category === 'lander';
      child.position.x += lander ? 2.1 : -2.1;
      if (!lander) { child.position.multiplyScalar(.5); child.position.y += 2.05; child.scale.multiplyScalar(.5); }
    }
    const halves = [-1, 1].map(sign => {
      const half = new THREE.Group(); root.add(half);
      const start = sign === -1 ? 0 : Math.PI;
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 3.5, 48, 1, true, start, Math.PI), white); shell.material.side = THREE.DoubleSide; shell.position.y = 9.7; half.add(shell);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(.04, 1.85, 1.5, 48, 1, true, start, Math.PI), white); tip.position.y = 12.2; half.add(tip);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(1.87, 1.87, .08, 48, 1, true, start, Math.PI), dark); band.position.y = 8; half.add(band);
      return half;
    });
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.9, .16, 48), dark); platform.position.y = -.23; root.add(platform);
    platform.name = 'launch-platform';
  payload.position.y = 8.1;
  return { root, booster, upper, adapter, payload, halves, platform };
}
