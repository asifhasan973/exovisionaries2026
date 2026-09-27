// Mission Forge - Procedural Three.js Meshes & Materials
import * as THREE from 'three';

// Shared PBR Materials
export const materials = {
  whiteHull: new THREE.MeshStandardMaterial({
    color: 0xf4f7fa,
    roughness: 0.28,
    metalness: 0.12,
    name: 'whiteHull'
  }),
  darkStructure: new THREE.MeshStandardMaterial({
    color: 0x111620,
    roughness: 0.55,
    metalness: 0.35,
    name: 'darkStructure'
  }),
  metallicSilver: new THREE.MeshStandardMaterial({
    color: 0xc4cbd4,
    roughness: 0.25,
    metalness: 0.85,
    name: 'metallicSilver'
  }),
  engineNozzle: new THREE.MeshStandardMaterial({
    color: 0x242830,
    roughness: 0.45,
    metalness: 0.9,
    name: 'engineNozzle'
  }),
  nozzleInterior: new THREE.MeshStandardMaterial({
    color: 0x121418,
    emissive: 0x3d2008,
    emissiveIntensity: 0.15,
    roughness: 0.6,
    metalness: 0.8,
    name: 'nozzleInterior'
  }),
  goldThermalFoil: new THREE.MeshStandardMaterial({
    color: 0xdfab32,
    roughness: 0.2,
    metalness: 0.92,
    name: 'goldFoil'
  }),
  cyanGlow: new THREE.MeshBasicMaterial({
    color: 0x64d8ed,
    wireframe: true,
    name: 'cyanGlow'
  }),
  slotEmptyRing: new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
  }),
  slotActiveHover: new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  }),
  lensGlass: new THREE.MeshPhysicalMaterial({
    color: 0x0a1428,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.85,
    transparent: true,
    opacity: 0.85
  })
};

// Builder functions for rocket stages and spacecraft modules

export function createStage1Mesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'mesh_stage_1';

  // S-IC Main Tank (Diameter 10m -> scale radius 5, height 42m -> height 21)
  const tankGeo = new THREE.CylinderGeometry(3.6, 3.6, 18, 36);
  const tank = new THREE.Mesh(tankGeo, materials.whiteHull);
  tank.castShadow = true;
  tank.receiveShadow = true;
  group.add(tank);

  // Black and white roll pattern strips
  const stripGeo = new THREE.CylinderGeometry(3.61, 3.61, 4.5, 36, 1, false, 0, Math.PI * 0.5);
  const strip1 = new THREE.Mesh(stripGeo, materials.darkStructure);
  strip1.position.y = 4.5;
  group.add(strip1);

  const strip2 = new THREE.Mesh(stripGeo, materials.darkStructure);
  strip2.position.y = 4.5;
  strip2.rotation.y = Math.PI;
  group.add(strip2);

  // 4 Aerodynamic base fins
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(2.2, -3.5);
  finShape.lineTo(2.2, -6.5);
  finShape.lineTo(0, -6.5);
  finShape.closePath();

  const extrudeSettings = { depth: 0.12, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
  const finGeo = new THREE.ExtrudeGeometry(finShape, extrudeSettings);

  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(finGeo, materials.whiteHull);
    fin.rotation.y = (i * Math.PI) / 2;
    fin.position.set(0, -2.5, 0);
    // Offset along radial
    const angle = (i * Math.PI) / 2;
    fin.position.x = Math.cos(angle) * 3.6;
    fin.position.z = Math.sin(angle) * 3.6;
    fin.rotation.y = -angle + Math.PI / 2;
    group.add(fin);
  }

  // 5x F-1 Engine Nozzles
  const nozzlePositions = [
    [0, -9.8, 0],       // Center
    [1.8, -9.8, 0],     // +X
    [-1.8, -9.8, 0],    // -X
    [0, -9.8, 1.8],     // +Z
    [0, -9.8, -1.8]     // -Z
  ];

  nozzlePositions.forEach(([x, y, z]) => {
    const nozzleGeo = new THREE.CylinderGeometry(0.7, 1.4, 2.2, 24, 1, true);
    const nozzle = new THREE.Mesh(nozzleGeo, materials.engineNozzle);
    nozzle.position.set(x, y, z);
    nozzle.castShadow = true;
    group.add(nozzle);

    const interiorGeo = new THREE.CylinderGeometry(0.68, 1.35, 2.15, 24, 1, true);
    const interior = new THREE.Mesh(interiorGeo, materials.nozzleInterior);
    interior.position.set(x, y, z);
    group.add(interior);
  });

  return group;
}

export function createInterstage1Mesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'mesh_interstage_1_2';

  // Corrugated separation ring (3.6 radius, 2.8 height)
  const ringGeo = new THREE.CylinderGeometry(3.6, 3.6, 2.8, 36);
  const ring = new THREE.Mesh(ringGeo, materials.darkStructure);
  ring.castShadow = true;
  group.add(ring);

  // Retro-rocket blisters
  for (let i = 0; i < 4; i++) {
    const blisterGeo = new THREE.BoxGeometry(0.3, 0.9, 0.4);
    const blister = new THREE.Mesh(blisterGeo, materials.whiteHull);
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    blister.position.set(Math.cos(angle) * 3.7, 0, Math.sin(angle) * 3.7);
    blister.rotation.y = -angle;
    group.add(blister);
  }

  return group;
}

export function createStage2Mesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'mesh_stage_2';

  // S-II Cryogenic Tank
  const tankGeo = new THREE.CylinderGeometry(3.6, 3.6, 10.5, 36);
  const tank = new THREE.Mesh(tankGeo, materials.whiteHull);
  tank.castShadow = true;
  tank.receiveShadow = true;
  group.add(tank);

  // Forward dome
  const domeGeo = new THREE.SphereGeometry(3.58, 36, 12, 0, Math.PI * 2, 0, Math.PI * 0.25);
  const dome = new THREE.Mesh(domeGeo, materials.metallicSilver);
  dome.position.y = 5.25;
  group.add(dome);

  // 5x J-2 Engine Nozzles
  const nozzlePositions = [
    [0, -5.8, 0],
    [1.4, -5.8, 0],
    [-1.4, -5.8, 0],
    [0, -5.8, 1.4],
    [0, -5.8, -1.4]
  ];

  nozzlePositions.forEach(([x, y, z]) => {
    const nozzleGeo = new THREE.CylinderGeometry(0.45, 0.95, 1.4, 20, 1, true);
    const nozzle = new THREE.Mesh(nozzleGeo, materials.engineNozzle);
    nozzle.position.set(x, y, z);
    group.add(nozzle);
  });

  return group;
}

export function createInterstage2Mesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'mesh_interstage_2_3';

  // Conical taper from 3.6 to 2.4 radius
  const coneGeo = new THREE.CylinderGeometry(2.4, 3.6, 2.2, 36);
  const cone = new THREE.Mesh(coneGeo, materials.darkStructure);
  cone.castShadow = true;
  group.add(cone);

  return group;
}

export function createStage3Mesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'mesh_stage_3';

  // S-IVB Tank (2.4 radius, 6.5 height)
  const tankGeo = new THREE.CylinderGeometry(2.4, 2.4, 6.5, 32);
  const tank = new THREE.Mesh(tankGeo, materials.whiteHull);
  tank.castShadow = true;
  group.add(tank);

  // Auxiliary propulsion pods (APS)
  for (let i = 0; i < 2; i++) {
    const podGeo = new THREE.BoxGeometry(0.4, 1.2, 0.6);
    const pod = new THREE.Mesh(podGeo, materials.darkStructure);
    const angle = i * Math.PI;
    pod.position.set(Math.cos(angle) * 2.5, -1.5, Math.sin(angle) * 2.5);
    group.add(pod);
  }

  // Single J-2 Engine bell
  const engineGeo = new THREE.CylinderGeometry(0.5, 1.1, 1.5, 24, 1, true);
  const engine = new THREE.Mesh(engineGeo, materials.engineNozzle);
  engine.position.set(0, -3.9, 0);
  group.add(engine);

  return group;
}

export function createInstrumentUnitMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'mesh_instrument_unit';

  // 1-meter high guidance ring
  const ringGeo = new THREE.CylinderGeometry(2.4, 2.4, 1.0, 32);
  const ring = new THREE.Mesh(ringGeo, materials.darkStructure);
  ring.castShadow = true;
  group.add(ring);

  // Computer boxes around perimeter
  for (let i = 0; i < 8; i++) {
    const boxGeo = new THREE.BoxGeometry(0.3, 0.6, 0.35);
    const box = new THREE.Mesh(boxGeo, materials.metallicSilver);
    const angle = (i * Math.PI * 2) / 8;
    box.position.set(Math.cos(angle) * 2.1, 0, Math.sin(angle) * 2.1);
    box.rotation.y = -angle;
    group.add(box);
  }

  return group;
}

export function createLunarPayloadMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'mesh_lunar_payload';

  // Spacecraft-LM Adapter (SLA) stowed fairing cone (2.4 to 1.9 radius, 5.5 height)
  const slaGeo = new THREE.CylinderGeometry(1.9, 2.4, 5.5, 32);
  const sla = new THREE.Mesh(slaGeo, materials.whiteHull);
  sla.castShadow = true;
  group.add(sla);

  // Internal gold-foil stowed lander mockup visible when cutaway/exploded
  const landerCoreGeo = new THREE.BoxGeometry(1.6, 1.8, 1.6);
  const lander = new THREE.Mesh(landerCoreGeo, materials.goldThermalFoil);
  lander.position.y = -0.5;
  group.add(lander);

  // Science payload equipment shelf
  const shelfGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.2, 24);
  const shelf = new THREE.Mesh(shelfGeo, materials.darkStructure);
  shelf.position.y = 1.6;
  group.add(shelf);

  return group;
}

export function createServiceModuleMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'mesh_service_module';

  // Cylindrical hull (1.9 radius, 4.2 height)
  const smGeo = new THREE.CylinderGeometry(1.9, 1.9, 4.2, 32);
  const sm = new THREE.Mesh(smGeo, materials.metallicSilver);
  sm.castShadow = true;
  group.add(sm);

  // White radiator panels
  const radGeo = new THREE.CylinderGeometry(1.91, 1.91, 1.6, 32, 1, false, 0, Math.PI * 0.7);
  const rad1 = new THREE.Mesh(radGeo, materials.whiteHull);
  rad1.position.y = 0.4;
  group.add(rad1);

  const rad2 = new THREE.Mesh(radGeo, materials.whiteHull);
  rad2.position.y = 0.4;
  rad2.rotation.y = Math.PI;
  group.add(rad2);

  // 4x RCS Quads
  for (let i = 0; i < 4; i++) {
    const rcsBase = new THREE.BoxGeometry(0.3, 0.3, 0.2);
    const rcs = new THREE.Mesh(rcsBase, materials.darkStructure);
    const angle = (i * Math.PI) / 2;
    rcs.position.set(Math.cos(angle) * 1.98, 1.2, Math.sin(angle) * 1.98);
    rcs.rotation.y = -angle;
    group.add(rcs);
  }

  // Aerojet SPS Service Propulsion Engine bell
  const spsGeo = new THREE.CylinderGeometry(0.4, 0.9, 1.5, 24, 1, true);
  const sps = new THREE.Mesh(spsGeo, materials.engineNozzle);
  sps.position.set(0, -2.8, 0);
  group.add(sps);

  return group;
}

export function createCrewCapsuleMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'mesh_crew_capsule';

  // Apollo Command Module Conical shape (1.9 base radius, 0.4 top radius, 3.2 height)
  const cmGeo = new THREE.CylinderGeometry(0.4, 1.9, 3.2, 32);
  const cm = new THREE.Mesh(cmGeo, materials.whiteHull);
  cm.castShadow = true;
  group.add(cm);

  // Heat shield base (dark ablative curve)
  const heatShieldGeo = new THREE.CylinderGeometry(1.9, 1.88, 0.35, 32);
  const heatShield = new THREE.Mesh(heatShieldGeo, materials.darkStructure);
  heatShield.position.y = -1.65;
  group.add(heatShield);

  // Forward docking mechanism tunnel
  const tunnelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.5, 24);
  const tunnel = new THREE.Mesh(tunnelGeo, materials.metallicSilver);
  tunnel.position.y = 1.7;
  group.add(tunnel);

  // Cabin Windows
  for (let i = -1; i <= 1; i += 2) {
    const winGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
    const win = new THREE.Mesh(winGeo, materials.lensGlass);
    win.position.set(i * 0.45, 0.35, 1.25);
    win.rotation.x = 0.35;
    group.add(win);
  }

  return group;
}

export function createEscapeTowerMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'mesh_escape_tower';

  // Conical protective skirt over capsule apex
  const skirtGeo = new THREE.CylinderGeometry(0.35, 0.65, 1.2, 24);
  const skirt = new THREE.Mesh(skirtGeo, materials.whiteHull);
  skirt.position.y = -2.8;
  group.add(skirt);

  // Open lattice titanium truss
  for (let i = 0; i < 4; i++) {
    const strutGeo = new THREE.CylinderGeometry(0.04, 0.04, 4.2, 8);
    const strut = new THREE.Mesh(strutGeo, materials.metallicSilver);
    const angle = (i * Math.PI) / 2;
    strut.position.set(Math.cos(angle) * 0.25, -0.6, Math.sin(angle) * 0.25);
    group.add(strut);
  }

  // Solid rocket escape motor cylinder
  const motorGeo = new THREE.CylinderGeometry(0.3, 0.3, 3.6, 24);
  const motor = new THREE.Mesh(motorGeo, materials.whiteHull);
  motor.position.y = 2.4;
  group.add(motor);

  // 4x Canted exhaust nozzles
  for (let i = 0; i < 4; i++) {
    const nozGeo = new THREE.CylinderGeometry(0.06, 0.14, 0.45, 12);
    const noz = new THREE.Mesh(nozGeo, materials.engineNozzle);
    const angle = (i * Math.PI) / 2;
    noz.position.set(Math.cos(angle) * 0.38, 0.8, Math.sin(angle) * 0.38);
    noz.rotation.z = Math.cos(angle) * 0.6;
    noz.rotation.x = Math.sin(angle) * 0.6;
    group.add(noz);
  }

  // Aerodynamic nose cone and pitch-control canards
  const noseGeo = new THREE.ConeGeometry(0.3, 1.0, 24);
  const nose = new THREE.Mesh(noseGeo, materials.darkStructure);
  nose.position.y = 4.6;
  group.add(nose);

  return group;
}

// Subsystems and Science Instruments

export function createECLSSMesh(): THREE.Group {
  const group = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5), materials.metallicSilver);
  const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16), materials.whiteHull);
  cylinder.rotation.z = Math.PI / 2;
  cylinder.position.y = 0.18;
  group.add(box, cylinder);
  return group;
}

export function createAvionicsMesh(): THREE.Group {
  const group = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.5), materials.darkStructure);
  const wiring = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), materials.goldThermalFoil);
  wiring.position.z = 0.26;
  group.add(box, wiring);
  return group;
}

export function createFuelCellMesh(): THREE.Group {
  const group = new THREE.Group();
  const tank1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16), materials.metallicSilver);
  const tank2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16), materials.metallicSilver);
  tank1.position.x = -0.22;
  tank2.position.x = 0.22;
  const manifold = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.3), materials.goldThermalFoil);
  manifold.position.y = 0.32;
  group.add(tank1, tank2, manifold);
  return group;
}

export function createAntennaMesh(): THREE.Group {
  const group = new THREE.Group();
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), materials.metallicSilver);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.35), materials.whiteHull);
  dish.rotation.x = Math.PI;
  dish.position.set(0, 0.6, 0.2);
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), materials.goldThermalFoil);
  feed.position.set(0, 0.6, 0.35);
  group.add(mast, dish, feed);
  return group;
}

export function createScienceSpectrometerMesh(): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16), materials.goldThermalFoil);
  const sensor = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.2, 16), materials.metallicSilver);
  sensor.position.y = 0.35;
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.35), materials.darkStructure);
  bracket.position.y = -0.3;
  group.add(body, sensor, bracket);
  return group;
}

export function createScienceNIRMesh(): THREE.Group {
  const group = new THREE.Group();
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.5), materials.metallicSilver);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.15, 16), materials.lensGlass);
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.26;
  const ledRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 8, 16), materials.goldThermalFoil);
  ledRing.position.z = 0.26;
  group.add(housing, lens, ledRing);
  return group;
}

export function createScienceDrillMesh(): THREE.Group {
  const group = new THREE.Group();
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 12), materials.darkStructure);
  const auger = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 12), materials.metallicSilver);
  auger.position.y = -0.2;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), materials.goldThermalFoil);
  head.position.y = 0.45;
  group.add(mast, auger, head);
  return group;
}

export function createScienceMSoloMesh(): THREE.Group {
  const group = new THREE.Group();
  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.55, 16), materials.metallicSilver);
  chamber.rotation.z = Math.PI / 2;
  const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 12), materials.goldThermalFoil);
  inlet.position.y = 0.25;
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.35), materials.darkStructure);
  box.position.y = -0.25;
  group.add(chamber, inlet, box);
  return group;
}

export function createScienceCameraMesh(): THREE.Group {
  const group = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.15, 0.2), materials.darkStructure);
  const lensLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16), materials.lensGlass);
  lensLeft.rotation.x = Math.PI / 2;
  lensLeft.position.set(-0.22, 0, 0.12);
  const lensRight = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16), materials.lensGlass);
  lensRight.rotation.x = Math.PI / 2;
  lensRight.position.set(0.22, 0, 0.12);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8), materials.metallicSilver);
  mast.position.y = -0.22;
  group.add(bar, lensLeft, lensRight, mast);
  return group;
}

export function createScienceRadiationMesh(): THREE.Group {
  const group = new THREE.Group();
  const stack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.45), materials.darkStructure);
  const sensorWindow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.05), materials.goldThermalFoil);
  sensorWindow.position.z = 0.24;
  group.add(stack, sensorWindow);
  return group;
}

export function createUpgradeBatteryMesh(): THREE.Group {
  const group = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.45), materials.darkStructure);
  const fins = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.4), materials.metallicSilver);
  fins.position.y = 0.18;
  group.add(box, fins);
  return group;
}

export function createUpgradeTransceiverMesh(): THREE.Group {
  const group = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), materials.metallicSilver);
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 12), materials.goldThermalFoil);
  horn.rotation.x = -Math.PI / 2;
  horn.position.z = 0.25;
  group.add(box, horn);
  return group;
}

export function createUpgradeStarTrackerMesh(): THREE.Group {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.3), materials.darkStructure);
  const hood1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16), materials.engineNozzle);
  hood1.rotation.x = Math.PI / 4;
  hood1.position.set(-0.12, 0.15, 0.1);
  const hood2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16), materials.engineNozzle);
  hood2.rotation.x = Math.PI / 4;
  hood2.position.set(0.12, 0.15, 0.1);
  group.add(base, hood1, hood2);
  return group;
}

export function createUpgradeSparesMesh(): THREE.Group {
  const group = new THREE.Group();
  const locker = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.35), materials.whiteHull);
  const latch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.37), materials.goldThermalFoil);
  group.add(locker, latch);
  return group;
}

export function createPartMeshByType(meshType: string): THREE.Group {
  switch (meshType) {
    case 'stage1': return createStage1Mesh();
    case 'interstage1': return createInterstage1Mesh();
    case 'stage2': return createStage2Mesh();
    case 'interstage2': return createInterstage2Mesh();
    case 'stage3': return createStage3Mesh();
    case 'instrumentUnit': return createInstrumentUnitMesh();
    case 'lunarPayload': return createLunarPayloadMesh();
    case 'serviceModule': return createServiceModuleMesh();
    case 'crewCapsule': return createCrewCapsuleMesh();
    case 'escapeTower': return createEscapeTowerMesh();
    case 'eclss': return createECLSSMesh();
    case 'avionics': return createAvionicsMesh();
    case 'fuelCell': return createFuelCellMesh();
    case 'antenna': return createAntennaMesh();
    case 'scienceSpectrometer': return createScienceSpectrometerMesh();
    case 'scienceNIR': return createScienceNIRMesh();
    case 'scienceDrill': return createScienceDrillMesh();
    case 'scienceMSolo': return createScienceMSoloMesh();
    case 'scienceCamera': return createScienceCameraMesh();
    case 'scienceRadiation': return createScienceRadiationMesh();
    case 'upgradeBattery': return createUpgradeBatteryMesh();
    case 'upgradeTransceiver': return createUpgradeTransceiverMesh();
    case 'upgradeStarTracker': return createUpgradeStarTrackerMesh();
    case 'upgradeSpares': return createUpgradeSparesMesh();
    default:
      const fallback = new THREE.Group();
      fallback.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), materials.metallicSilver));
      return fallback;
  }
}
