import * as THREE from "three";

/** Stylised mission hardware with identifiable closed hatches, pressure seals and landing gear. */
export function createCrewedPlatform() {
  const root = new THREE.Group(),
    capsule = new THREE.Group(),
    lander = new THREE.Group();
  capsule.name = "command-service-spacecraft";
  lander.name = "crewed-lunar-lander";
  root.add(capsule, lander);
  const descentStage = new THREE.Group(),
    ascentStage = new THREE.Group();
  descentStage.name = "lunar-descent-stage";
  ascentStage.name = "lunar-ascent-stage";
  lander.add(descentStage, ascentStage);
  capsule.position.set(-2.1, 0, 0);
  lander.position.set(2.3, 0, 0);

  const silver = new THREE.MeshStandardMaterial({
    color: 0xc7d1d9,
    metalness: 0.78,
    roughness: 0.33,
  });
  const white = new THREE.MeshStandardMaterial({
    color: 0xf1f0e9,
    metalness: 0.25,
    roughness: 0.48,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x172334,
    metalness: 0.52,
    roughness: 0.42,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xb9944b,
    metalness: 0.72,
    roughness: 0.45,
    flatShading: true,
  });
  const goldBright = new THREE.MeshStandardMaterial({
    color: 0xd4b36a,
    metalness: 0.78,
    roughness: 0.37,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x204c6a,
    metalness: 0.4,
    roughness: 0.13,
    emissive: 0x0c3448,
    emissiveIntensity: 0.2,
  });
  const gasket = new THREE.MeshStandardMaterial({
    color: 0x252833,
    metalness: 0.25,
    roughness: 0.78,
  });
  const openLight = new THREE.MeshStandardMaterial({
    color: 0xff8c70,
    emissive: 0xec442d,
    emissiveIntensity: 0.8,
  });
  const sealedLight = new THREE.MeshStandardMaterial({
    color: 0x8cf1bc,
    emissive: 0x35bb82,
    emissiveIntensity: 0.65,
  });
  root.userData.materials = [
    silver,
    white,
    dark,
    gold,
    goldBright,
    glass,
    gasket,
    openLight,
    sealedLight,
  ];

  const mesh = (
    parent: THREE.Group,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  };
  const box = (
    parent: THREE.Group,
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) => mesh(parent, new THREE.BoxGeometry(w, h, d), material, x, y, z);
  const cyl = (
    parent: THREE.Group,
    top: number,
    bottom: number,
    height: number,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    segments = 40,
  ) =>
    mesh(
      parent,
      new THREE.CylinderGeometry(top, bottom, height, segments),
      material,
      x,
      y,
      z,
    );
  const ring = (
    parent: THREE.Group,
    radius: number,
    tube: number,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
  ) =>
    mesh(
      parent,
      new THREE.TorusGeometry(radius, tube, 10, 40),
      material,
      x,
      y,
      z,
    );
  const rod = (
    parent: THREE.Group,
    a: THREE.Vector3,
    b: THREE.Vector3,
    r = 0.04,
    material = silver,
  ) => {
    const delta = b.clone().sub(a);
    const object = cyl(parent, r, r, delta.length(), material);
    object.position.copy(a.clone().add(b).multiplyScalar(0.5));
    object.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize(),
    );
    return object;
  };
  const bell = (
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    scale = 1,
  ) => {
    const profile = [
      [0.12, 0.38],
      [0.1, 0.28],
      [0.15, 0.17],
      [0.28, 0],
    ].map(([r, h]) => new THREE.Vector2(r * scale, h * scale));
    return mesh(parent, new THREE.LatheGeometry(profile, 32), dark, x, y, z);
  };

  // Service cylinder and conical Earth-return capsule.
  cyl(capsule, 0.74, 0.74, 1.9, white, 0, 1.65);
  bell(capsule, 0, 0.25, 0, 1.6);
  for (const y of [0.75, 1.15, 2.1, 2.6])
    cyl(capsule, 0.75, 0.75, 0.035, silver, 0, y);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const panel = box(
      capsule,
      0.09,
      1.2,
      0.023,
      silver,
      Math.sin(angle) * 0.745,
      1.6,
      Math.cos(angle) * 0.745,
    );
    panel.rotation.y = angle;
  }
  const heatShield = cyl(capsule, 0.82, 0.68, 0.18, dark, 0, 2.73);
  heatShield.name = "return-heat-shield";
  const cabin = cyl(capsule, 0.18, 0.81, 1.3, silver, 0, 3.47);
  cabin.name = "crew-capsule";
  cyl(capsule, 0.14, 0.16, 0.16, dark, 0, 4.2);
  // One offset triangular observation window avoids a face-like pair on the nose.
  const capsuleWindowShape = new THREE.Shape();
  capsuleWindowShape.moveTo(-0.15, -0.07);
  capsuleWindowShape.lineTo(0.13, -0.07);
  capsuleWindowShape.lineTo(0.04, 0.14);
  capsuleWindowShape.closePath();
  const capsuleWindow = mesh(
    capsule,
    new THREE.ShapeGeometry(capsuleWindowShape),
    glass,
    0.38,
    3.75,
    0.34,
  );
  capsuleWindow.rotation.y = 0.48;
  capsuleWindow.rotation.x = -0.28;
  const capsuleWindowFrame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.ShapeGeometry(capsuleWindowShape)),
    new THREE.LineBasicMaterial({ color: 0xd8bc7d }),
  );
  capsuleWindowFrame.position.set(0.38, 3.75, 0.345);
  capsule.add(capsuleWindowFrame);
  capsuleWindowFrame.rotation.copy(capsuleWindow.rotation);

  // The actual crew pressure hatch: visible opening, hinged door, clamps and status lamp.
  mesh(capsule, new THREE.CircleGeometry(0.265, 40), gasket, 0, 3.27, 0.635);
  ring(capsule, 0.27, 0.037, goldBright, 0, 3.27, 0.655);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    cyl(
      capsule,
      0.021,
      0.021,
      0.035,
      silver,
      Math.cos(a) * 0.27,
      3.27 + Math.sin(a) * 0.27,
      0.695,
    ).rotation.x = Math.PI / 2;
  }
  const hatchDoor = new THREE.Group();
  hatchDoor.position.set(-0.29, 3.27, 0.69);
  hatchDoor.rotation.y = -1.22;
  capsule.add(hatchDoor);
  cyl(hatchDoor, 0.23, 0.23, 0.065, white, 0.29, 0, 0).rotation.x = Math.PI / 2;
  ring(hatchDoor, 0.19, 0.018, silver, 0.29, 0, 0.045);
  box(hatchDoor, 0.15, 0.035, 0.035, goldBright, 0.29, 0, 0.07);
  const sealIndicator = mesh(
    capsule,
    new THREE.SphereGeometry(0.047, 12, 10),
    openLight,
    0.38,
    3.02,
    0.63,
  );
  for (const side of [-1, 1]) {
    rod(
      capsule,
      new THREE.Vector3(side * 0.5, 2.4, 0),
      new THREE.Vector3(side * 0.94, 2.5, 0.15),
    );
    cyl(capsule, 0.035, 0.035, 0.25, gold, side * 0.94, 2.6, 0.15);
  }

  // Lunar descent stage: foil-wrapped octagon, engine, triangulated legs and broad footpads.
  const descent = cyl(descentStage, 0.91, 1.05, 0.74, gold, 0, 0.85, 0, 8);
  descent.name = "descent-stage";
  cyl(descentStage, 1.035, 1.035, 0.06, goldBright, 0, 1.24, 0, 8);
  cyl(descentStage, 1.05, 1.05, 0.035, dark, 0, 0.47, 0, 8);
  bell(descentStage, 0, 0.24, 0);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const panel = box(
      descentStage,
      0.14,
      0.53,
      0.014,
      goldBright,
      Math.sin(angle) * 0.945,
      0.85,
      Math.cos(angle) * 0.945,
    );
    panel.rotation.y = angle;
  }
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const foot = new THREE.Vector3(
      Math.sin(angle) * 1.62,
      0.09,
      Math.cos(angle) * 1.62,
    );
    rod(
      descentStage,
      new THREE.Vector3(Math.sin(angle) * 0.65, 1.25, Math.cos(angle) * 0.65),
      foot,
      0.05,
    );
    rod(
      descentStage,
      new THREE.Vector3(Math.sin(angle) * 0.95, 0.65, Math.cos(angle) * 0.95),
      foot,
      0.028,
    );
    cyl(descentStage, 0.18, 0.23, 0.055, silver, foot.x, foot.y, foot.z);
  }

  // Apollo-style lunar cabin: two small canted triangular viewports, never square "eyes".
  bell(ascentStage, 0, 1.11, 0, 0.75);
  cyl(ascentStage, 0.64, 0.82, 0.97, silver, 0, 1.74, 0, 8);
  cyl(ascentStage, 0.43, 0.64, 0.32, white, 0, 2.38, 0, 8);
  cyl(ascentStage, 0.16, 0.16, 0.12, dark, 0, 2.61);
  for (const side of [-1, 1]) {
    const windowShape = new THREE.Shape();
    windowShape.moveTo(-0.15, 0.11);
    windowShape.lineTo(0.15, 0.11);
    windowShape.lineTo(side * 0.08, -0.15);
    windowShape.closePath();
    const pane = mesh(
      ascentStage,
      new THREE.ShapeGeometry(windowShape),
      glass,
      side * 0.34,
      2.03,
      0.6,
    );
    pane.rotation.z = -side * 0.13;
    pane.rotation.y = side * 0.28;
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.ShapeGeometry(windowShape)),
      new THREE.LineBasicMaterial({ color: 0xe4e9e6 }),
    );
    frame.position.set(side * 0.34, 2.03, 0.606);
    frame.rotation.copy(pane.rotation);
    ascentStage.add(frame);
  }
  for (const side of [-1, 1])
    box(ascentStage, 0.09, 0.43, 0.14, goldBright, side * 0.73, 1.48, 0.12);
  // A square forward hatch reads as hardware rather than a round mouth.
  box(ascentStage, 0.43, 0.46, 0.04, dark, 0, 1.55, 0.75);
  box(ascentStage, 0.37, 0.4, 0.045, white, 0, 1.55, 0.78);
  box(ascentStage, 0.48, 0.045, 0.05, goldBright, 0, 1.8, 0.8);
  box(ascentStage, 0.48, 0.045, 0.05, goldBright, 0, 1.3, 0.8);
  for (const side of [-1, 1])
    box(ascentStage, 0.045, 0.5, 0.05, goldBright, side * 0.23, 1.55, 0.8);
  box(ascentStage, 0.055, 0.12, 0.05, dark, 0.12, 1.54, 0.83);
  for (const x of [-0.19, 0.19])
    rod(
      descentStage,
      new THREE.Vector3(x, 1.35, 0.86),
      new THREE.Vector3(x, 0.08, 1.54),
      0.023,
    );
  for (let i = 0; i < 7; i++)
    rod(
      descentStage,
      new THREE.Vector3(-0.19, 0.15 + i * 0.17, 1.5 - i * 0.09),
      new THREE.Vector3(0.19, 0.15 + i * 0.17, 1.5 - i * 0.09),
      0.016,
    );
  rod(
    ascentStage,
    new THREE.Vector3(-0.45, 2.35, 0),
    new THREE.Vector3(-0.73, 2.75, 0.1),
    0.023,
  );
  const dish = mesh(
    ascentStage,
    new THREE.SphereGeometry(0.2, 24, 12, 0, Math.PI * 2, 0, 1),
    white,
    -0.73,
    2.75,
    0.1,
  );
  dish.rotation.x = 0.8;

  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return {
    root,
    capsule,
    lander,
    heatShield,
    descentStage,
    ascentStage,
    hatchDoor,
    sealIndicator,
    openLight,
    sealedLight,
  };
}
