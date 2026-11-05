import * as THREE from 'three';

/** Stylised mission hardware with identifiable closed hatches, pressure seals and landing gear. */
export function createCrewedPlatform() {
  const root = new THREE.Group(), capsule = new THREE.Group(), lander = new THREE.Group();
  capsule.name = 'command-service-spacecraft'; lander.name = 'crewed-lunar-lander'; root.add(capsule, lander);
  const descentStage = new THREE.Group(), ascentStage = new THREE.Group();
  descentStage.name = 'lunar-descent-stage'; ascentStage.name = 'lunar-ascent-stage'; lander.add(descentStage, ascentStage);
  capsule.position.set(-2.1, 0, 0); lander.position.set(2.3, 0, 0);

  const silver = new THREE.MeshStandardMaterial({ color: 0xc7d1d9, metalness: .78, roughness: .33 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf1f0e9, metalness: .25, roughness: .48 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x172334, metalness: .52, roughness: .42 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xb9944b, metalness: .72, roughness: .45, flatShading: true });
  const goldBright = new THREE.MeshStandardMaterial({ color: 0xd4b36a, metalness: .78, roughness: .37 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x204c6a, metalness: .4, roughness: .13, emissive: 0x0c3448, emissiveIntensity: .2 });
  const gasket = new THREE.MeshStandardMaterial({ color: 0x252833, metalness: .25, roughness: .78 });
  const openLight = new THREE.MeshStandardMaterial({ color: 0xff8c70, emissive: 0xec442d, emissiveIntensity: .8 });
  const sealedLight = new THREE.MeshStandardMaterial({ color: 0x8cf1bc, emissive: 0x35bb82, emissiveIntensity: .65 });
  root.userData.materials = [silver, white, dark, gold, goldBright, glass, gasket, openLight, sealedLight];

  const mesh = (parent: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) => {
    const object = new THREE.Mesh(geometry, material); object.position.set(x, y, z); parent.add(object); return object;
  };
  const box = (parent: THREE.Group, w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0) => mesh(parent, new THREE.BoxGeometry(w, h, d), material, x, y, z);
  const cyl = (parent: THREE.Group, top: number, bottom: number, height: number, material: THREE.Material, x = 0, y = 0, z = 0, segments = 40) => mesh(parent, new THREE.CylinderGeometry(top, bottom, height, segments), material, x, y, z);
  const ring = (parent: THREE.Group, radius: number, tube: number, material: THREE.Material, x: number, y: number, z: number) => mesh(parent, new THREE.TorusGeometry(radius, tube, 10, 40), material, x, y, z);
  const rod = (parent: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, r = .04, material = silver) => {
    const delta = b.clone().sub(a); const object = cyl(parent, r, r, delta.length(), material);
    object.position.copy(a.clone().add(b).multiplyScalar(.5)); object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return object;
  };
  const bell = (parent: THREE.Group, x: number, y: number, z: number, scale = 1) => {
    const profile = [[.12, .38], [.1, .28], [.15, .17], [.28, 0]].map(([r, h]) => new THREE.Vector2(r * scale, h * scale));
    return mesh(parent, new THREE.LatheGeometry(profile, 32), dark, x, y, z);
  };

  // Service cylinder and conical Earth-return capsule.
  cyl(capsule, .74, .74, 1.9, white, 0, 1.65); bell(capsule, 0, .25, 0, 1.6);
  for (const y of [.75, 1.15, 2.1, 2.6]) cyl(capsule, .75, .75, .035, silver, 0, y);
  for (let i = 0; i < 8; i++) { const angle = i * Math.PI / 4; const panel = box(capsule, .09, 1.2, .023, silver, Math.sin(angle) * .745, 1.6, Math.cos(angle) * .745); panel.rotation.y = angle; }
  const heatShield = cyl(capsule, .82, .68, .18, dark, 0, 2.73); heatShield.name = 'return-heat-shield';
  const cabin = cyl(capsule, .18, .81, 1.3, silver, 0, 3.47); cabin.name = 'crew-capsule'; cyl(capsule, .14, .16, .16, dark, 0, 4.2);
  // One offset triangular observation window avoids a face-like pair on the nose.
  const capsuleWindowShape = new THREE.Shape();
  capsuleWindowShape.moveTo(-.15,-.07); capsuleWindowShape.lineTo(.13,-.07); capsuleWindowShape.lineTo(.04,.14); capsuleWindowShape.closePath();
  const capsuleWindow=mesh(capsule,new THREE.ShapeGeometry(capsuleWindowShape),glass,.38,3.75,.34);
  capsuleWindow.rotation.y=.48;capsuleWindow.rotation.x=-.28;
  const capsuleWindowFrame=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.ShapeGeometry(capsuleWindowShape)),new THREE.LineBasicMaterial({color:0xd8bc7d}));capsuleWindowFrame.position.set(.38,3.75,.345);capsule.add(capsuleWindowFrame);
  capsuleWindowFrame.rotation.copy(capsuleWindow.rotation);

  // The actual crew pressure hatch: visible opening, hinged door, clamps and status lamp.
  mesh(capsule, new THREE.CircleGeometry(.265, 40), gasket, 0, 3.27, .635);
  ring(capsule, .27, .037, goldBright, 0, 3.27, .655);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; cyl(capsule, .021, .021, .035, silver, Math.cos(a) * .27, 3.27 + Math.sin(a) * .27, .695).rotation.x = Math.PI / 2; }
  const hatchDoor = new THREE.Group(); hatchDoor.position.set(-.29, 3.27, .69); hatchDoor.rotation.y = -1.22; capsule.add(hatchDoor);
  cyl(hatchDoor, .23, .23, .065, white, .29, 0, 0).rotation.x = Math.PI / 2;
  ring(hatchDoor, .19, .018, silver, .29, 0, .045);
  box(hatchDoor, .15, .035, .035, goldBright, .29, 0, .07);
  const sealIndicator = mesh(capsule, new THREE.SphereGeometry(.047, 12, 10), openLight, .38, 3.02, .63);
  for (const side of [-1, 1]) { rod(capsule, new THREE.Vector3(side * .5, 2.4, 0), new THREE.Vector3(side * .94, 2.5, .15)); cyl(capsule, .035, .035, .25, gold, side * .94, 2.6, .15); }

  // Lunar descent stage: foil-wrapped octagon, engine, triangulated legs and broad footpads.
  const descent = cyl(descentStage, .91, 1.05, .74, gold, 0, .85, 0, 8); descent.name = 'descent-stage';
  cyl(descentStage, 1.035, 1.035, .06, goldBright, 0, 1.24, 0, 8);
  cyl(descentStage, 1.05, 1.05, .035, dark, 0, .47, 0, 8); bell(descentStage, 0, .24, 0);
  for (let i = 0; i < 8; i++) { const angle = i * Math.PI / 4; const panel = box(descentStage, .14, .53, .014, goldBright, Math.sin(angle) * .945, .85, Math.cos(angle) * .945); panel.rotation.y = angle; }
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2 + Math.PI / 4;
    const foot = new THREE.Vector3(Math.sin(angle) * 1.62, .09, Math.cos(angle) * 1.62);
    rod(descentStage, new THREE.Vector3(Math.sin(angle) * .65, 1.25, Math.cos(angle) * .65), foot, .05);
    rod(descentStage, new THREE.Vector3(Math.sin(angle) * .95, .65, Math.cos(angle) * .95), foot, .028);
    cyl(descentStage, .18, .23, .055, silver, foot.x, foot.y, foot.z);
  }

  // Apollo-style lunar cabin: two small canted triangular viewports, never square "eyes".
  bell(ascentStage, 0, 1.11, 0, .75);
  cyl(ascentStage, .64, .82, .97, silver, 0, 1.74, 0, 8);
  cyl(ascentStage, .43, .64, .32, white, 0, 2.38, 0, 8);
  cyl(ascentStage, .16, .16, .12, dark, 0, 2.61);
  for(const side of [-1,1]){
    const windowShape=new THREE.Shape();windowShape.moveTo(-.15,.11);windowShape.lineTo(.15,.11);windowShape.lineTo(side*.08,-.15);windowShape.closePath();
    const pane=mesh(ascentStage,new THREE.ShapeGeometry(windowShape),glass,side*.34,2.03,.6);pane.rotation.z=-side*.13;pane.rotation.y=side*.28;
    const frame=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.ShapeGeometry(windowShape)),new THREE.LineBasicMaterial({color:0xe4e9e6}));frame.position.set(side*.34,2.03,.606);frame.rotation.copy(pane.rotation);ascentStage.add(frame);
  }
  for(const side of [-1,1])box(ascentStage,.09,.43,.14,goldBright,side*.73,1.48,.12);
  // A square forward hatch reads as hardware rather than a round mouth.
  box(ascentStage,.43,.46,.04,dark,0,1.55,.75);
  box(ascentStage,.37,.4,.045,white,0,1.55,.78);
  box(ascentStage,.48,.045,.05,goldBright,0,1.8,.8);
  box(ascentStage,.48,.045,.05,goldBright,0,1.3,.8);
  for(const side of [-1,1])box(ascentStage,.045,.5,.05,goldBright,side*.23,1.55,.8);
  box(ascentStage,.055,.12,.05,dark,.12,1.54,.83);
  for (const x of [-.19, .19]) rod(descentStage, new THREE.Vector3(x, 1.35, .86), new THREE.Vector3(x, .08, 1.54), .023);
  for (let i = 0; i < 7; i++) rod(descentStage, new THREE.Vector3(-.19, .15 + i * .17, 1.5 - i * .09), new THREE.Vector3(.19, .15 + i * .17, 1.5 - i * .09), .016);
  rod(ascentStage, new THREE.Vector3(-.45, 2.35, 0), new THREE.Vector3(-.73, 2.75, .1), .023);
  const dish = mesh(ascentStage, new THREE.SphereGeometry(.2, 24, 12, 0, Math.PI * 2, 0, 1), white, -.73, 2.75, .1); dish.rotation.x = .8;

  root.traverse(object => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } });
  return { root, capsule, lander, heatShield, descentStage, ascentStage, hatchDoor, sealIndicator, openLight, sealedLight };
}
