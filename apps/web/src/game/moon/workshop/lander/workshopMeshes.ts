import * as THREE from "three";
import { partById } from "@/game/moon/core/preparation";
import type { PreparationSelection } from "@/game/moon/core/design";

function material(color: number, metallic = 0.7) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: metallic,
    roughness: 0.33,
  });
}
export function createPartMesh(id: string): THREE.Group {
  const group = new THREE.Group();
  const silver = material(0xc8cfda),
    dark = material(0x242c40),
    gold = material(0xb28d32),
    blue = material(0x1c417c),
    white = material(0xe3e5df, 0.2);
  const mesh = (
    geometry: THREE.BufferGeometry,
    mat: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x, y, z);
    group.add(object);
    return object;
  };
  const box = (
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  const cylinder = (
    r1: number,
    r2: number,
    h: number,
    mat: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) => mesh(new THREE.CylinderGeometry(r1, r2, h, 24), mat, x, y, z);
  const rod = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    radius: number,
    mat: THREE.Material,
  ) => {
    const direction = b.clone().sub(a);
    const piece = cylinder(radius, radius, direction.length(), mat);
    piece.position.copy(a.clone().add(b).multiplyScalar(0.5));
    piece.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    );
  };
  const part = partById(id),
    category = part?.category;
  if (id === "lander-body") {
    cylinder(1.1, 1.2, 0.75, gold, 0, 1.25);
    cylinder(1.22, 1.22, 0.09, dark, 0, 0.83);
    cylinder(1.15, 1.15, 0.1, silver, 0, 1.65);
    box(0.75, 0.65, 0.6, white, 0, 1.9);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      const foot = new THREE.Vector3(
        Math.cos(a) * 1.65,
        0.12,
        Math.sin(a) * 1.65,
      );
      rod(
        new THREE.Vector3(Math.cos(a) * 0.9, 1.3, Math.sin(a) * 0.9),
        foot,
        0.055,
        silver,
      );
      rod(
        new THREE.Vector3(Math.cos(a) * 0.65, 0.88, Math.sin(a) * 0.65),
        foot,
        0.038,
        dark,
      );
      cylinder(0.22, 0.3, 0.06, silver, foot.x, foot.y, foot.z);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      box(
        0.13,
        0.5,
        0.06,
        dark,
        Math.cos(a) * 1.12,
        1.25,
        Math.sin(a) * 1.12,
      ).rotation.y = -a + Math.PI / 2;
    }
  } else if (category === "rover") {
    const heavy = id === "heavy-rover",
      basic = id === "basic-rover";
    const width = heavy ? 1.25 : basic ? 0.95 : 1.1;
    box(width, 0.55, 1.35, gold, 0, 0.9);
    box(width + 0.12, 0.1, 1.45, silver, 0, 1.22);
    const count = basic ? 2 : 3;
    for (const side of [-1, 1])
      for (let i = 0; i < count; i++) {
        const z = count === 2 ? (i - 0.5) * 1 : (i - 1) * 0.65;
        const start = group.children.length;
        const wheel = cylinder(
          0.32,
          0.32,
          0.19,
          dark,
          side * (width / 2 + 0.27),
          0.37,
          z,
        );
        wheel.rotation.z = Math.PI / 2;
        const hub = cylinder(
          0.11,
          0.11,
          0.22,
          silver,
          side * (width / 2 + 0.27),
          0.37,
          z,
        );
        hub.rotation.z = Math.PI / 2;
        for (let k = 0; k < 12; k++) {
          const angle = (k * Math.PI) / 6;
          box(
            0.22,
            0.04,
            0.055,
            silver,
            side * (width / 2 + 0.27),
            0.37 + Math.cos(angle) * 0.31,
            z + Math.sin(angle) * 0.31,
          ).rotation.x = -angle;
        }
        const pieces = group.children.slice(start);
        const pivot = new THREE.Group();
        pivot.position.set(side * (width / 2 + 0.27), 0.37, z);
        pivot.userData.wheelPivot = true;
        group.add(pivot);
        for (const piece of pieces) {
          piece.position.sub(pivot.position);
          pivot.add(piece);
        }
        rod(
          new THREE.Vector3((side * width) / 2, 0.85, z * 0.4),
          new THREE.Vector3(side * (width / 2 + 0.27), 0.37, z),
          0.05,
          silver,
        );
      }
    cylinder(0.055, 0.055, 0.55, silver, 0, 1.52, -0.3);
    box(0.45, 0.15, 0.22, white, 0, 1.83, -0.3);
    for (const x of [-0.12, 0.12]) {
      const eye = cylinder(0.06, 0.06, 0.035, blue, x, 1.84, -0.44);
      eye.rotation.x = Math.PI / 2;
    }
  } else if (id === "landing-engines") {
    for (const x of [-0.3, 0.3]) {
      cylinder(0.09, 0.23, 0.45, dark, x, 0.15);
      cylinder(0.1, 0.1, 0.19, silver, x, 0.47);
      cylinder(0.035, 0.035, 0.35, gold, x + 0.13, 0.4);
    }
  } else if (
    id === "landing-radar" ||
    category === "navigation" ||
    id === "landing-cameras" ||
    part?.scienceFamily === "camera"
  ) {
    box(0.48, 0.24, 0.3, silver);
    const count = id === "stereo-hazard-camera" ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const lens = cylinder(
        0.09,
        0.09,
        0.15,
        dark,
        count === 2 ? (i - 0.5) * 0.24 : 0,
        0,
        0.19,
      );
      lens.rotation.x = Math.PI / 2;
      const glass = cylinder(
        0.065,
        0.065,
        0.16,
        blue,
        count === 2 ? (i - 0.5) * 0.24 : 0,
        0,
        0.2,
      );
      glass.rotation.x = Math.PI / 2;
    }
    box(0.06, 0.22, 0.06, dark, 0, -0.2);
  } else if (id === "lander-antenna" || category === "communication") {
    cylinder(0.035, 0.04, 0.5, silver, 0, 0.12);
    if (id === "basic-communication") {
      cylinder(0.018, 0.018, 0.45, gold, 0, 0.55);
      box(0.23, 0.18, 0.18, white, 0, -0.15);
    } else {
      const dish = mesh(
        new THREE.SphereGeometry(0.33, 28, 16, 0, Math.PI * 2, 0, 0.9),
        white,
        0,
        0.5,
      );
      dish.rotation.x = 0.8;
      rod(
        new THREE.Vector3(0, 0.45, 0),
        new THREE.Vector3(0, 0.68, 0.25),
        0.025,
        gold,
      );
    }
  } else if (id === "trident" || id.startsWith("geo-drill-")) {
    box(0.32, 0.42, 0.3, gold, 0, 0.3);
    box(0.18, 1, 0.16, silver, 0.2, -0.05);
    const start = group.children.length;
    cylinder(0.07, 0.07, 1, dark, 0, -0.45);
    for (let i = 0; i < 9; i++) {
      const ring = mesh(
        new THREE.TorusGeometry(0.075, 0.019, 6, 18),
        silver,
        0,
        -0.08 - i * 0.09,
      );
      ring.rotation.x = Math.PI / 2 + 0.25;
    }
    mesh(new THREE.ConeGeometry(0.08, 0.15, 16), silver, 0, -0.99).rotation.z =
      Math.PI;
    const pieces = group.children.slice(start),
      bit = new THREE.Group();
    bit.name = "drill-bit";
    group.add(bit);
    pieces.forEach((piece) => bit.add(piece));
  } else if (id === "field-care-kit") {
    box(0.45, 0.3, 0.28, blue);
    box(0.49, 0.04, 0.32, silver, 0, 0.18);
    box(0.22, 0.04, 0.09, gold, 0, 0.23);
    box(0.09, 0.13, 0.02, white, 0, 0, 0.15);
    box(0.13, 0.05, 0.02, white, 0, 0.04, 0.15);
  } else if (id === "nss") {
    cylinder(0.14, 0.14, 0.5, gold);
    cylinder(0.15, 0.15, 0.07, silver, 0, 0.28);
    box(0.35, 0.08, 0.35, dark, 0, -0.3);
  } else if (id === "nirvss" || part?.scienceFamily === "ir") {
    box(0.4, 0.25, 0.3, silver);
    const lens = cylinder(0.08, 0.08, 0.22, gold, 0, 0, 0.24);
    lens.rotation.x = Math.PI / 2;
    box(0.06, 0.2, 0.06, dark, 0, -0.2);
  } else if (id === "geo-scoop-basic") {
    rod(
      new THREE.Vector3(0, 0.3, 0),
      new THREE.Vector3(0.4, -0.15, 0.2),
      0.045,
      silver,
    );
    box(0.25, 0.26, 0.23, gold, 0, 0.35);
    const scoop = mesh(
      new THREE.SphereGeometry(0.18, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      silver,
      0.4,
      -0.2,
      0.2,
    );
    scoop.rotation.z = Math.PI;
  } else if (part?.scienceFamily === "xrf" || part?.scienceFamily === "xrd") {
    box(0.5, 0.3, 0.38, white);
    box(0.42, 0.03, 0.3, gold, 0, 0.17);
    cylinder(0.12, 0.12, 0.24, dark, 0, 0.05, 0.22);
    cylinder(0.09, 0.09, 0.05, blue, 0, 0.19, 0.22);
    if (part.scienceFamily === "xrd") {
      box(0.22, 0.14, 0.18, silver, 0.28, 0);
      cylinder(0.07, 0.07, 0.16, gold, 0.28, 0.15);
    }
  } else if (part?.scienceFamily === "gpr") {
    box(0.55, 0.1, 0.48, silver);
    for (const x of [-0.22, 0.22]) {
      rod(
        new THREE.Vector3(x, 0, -0.4),
        new THREE.Vector3(x, 0, 0.4),
        0.045,
        gold,
      );
    }
    box(0.24, 0.18, 0.2, white, 0, 0.14);
  } else if (part?.scienceFamily === "seismometer") {
    cylinder(0.23, 0.3, 0.16, white);
    cylinder(0.11, 0.11, 0.2, gold, 0, 0.18);
    for (const angle of [0, 2.1, 4.2])
      rod(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.sin(angle) * 0.4, -0.12, Math.cos(angle) * 0.4),
        0.03,
        silver,
      );
  } else if (id === "msolo") {
    cylinder(0.14, 0.14, 0.4, silver);
    cylinder(0.045, 0.045, 0.22, gold, 0, 0.3);
    box(0.35, 0.13, 0.3, dark, 0, -0.25);
  } else if (category === "solar") {
    const panels = id === "efficient-solar" ? 2 : 1;
    for (let i = 0; i < panels; i++) {
      const x = (i - (panels - 1) / 2) * 0.77;
      box(0.72, 0.055, 0.9, silver, x);
      box(0.67, 0.07, 0.84, blue, x, 0.03);
      for (let row = 0; row < 4; row++)
        box(0.69, 0.01, 0.009, silver, x, 0.071, (row - 1.5) * 0.2);
      for (let col = 0; col < 3; col++)
        box(0.009, 0.01, 0.87, silver, x + (col - 1) * 0.21, 0.071);
    }
    cylinder(0.035, 0.035, 0.3, dark, 0, -0.17);
  } else if (category === "battery") {
    const cells = id === "large-battery" ? 4 : id === "medium-battery" ? 3 : 2;
    box(cells * 0.12 + 0.07, 0.32, 0.29, dark);
    for (let i = 0; i < cells; i++)
      cylinder(0.048, 0.048, 0.27, silver, (i - (cells - 1) / 2) * 0.12, 0.05);
    box(0.2, 0.04, 0.25, gold, 0, 0.23);
  } else if (category === "thermal") {
    box(0.56, 0.36, 0.4, gold);
    box(0.4, 0.04, 0.31, silver, 0, 0.22);
    for (let i = 0; i < 4; i++) box(0.02, 0.32, 0.41, white, (i - 1.5) * 0.11);
  } else {
    box(0.42, 0.24, 0.35, silver);
    box(0.3, 0.02, 0.27, blue, 0, 0.14);
    for (let i = 0; i < 3; i++) box(0.03, 0.25, 0.36, gold, (i - 1) * 0.13);
  }
  // Unused materials are also owned by the group for deterministic disposal.
  group.userData.materials = [silver, dark, gold, blue, white];
  if (part?.tier)
    group.scale.setScalar(
      part.tier === "advanced" ? 1.16 : part.tier === "balanced" ? 1.05 : 0.9,
    );
  return group;
}
export function disposeGroup(group: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>();
  group.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      geometries.add(object.geometry);
      (Array.isArray(object.material)
        ? object.material
        : [object.material]
      ).forEach((m) => materials.add(m));
    }
    (object.userData.materials ?? []).forEach((m: THREE.Material) =>
      materials.add(m),
    );
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}
export function attachmentPosition(id: string): THREE.Vector3 {
  const part = partById(id);
  const positions: Record<string, number[]> = {
    "field-care-kit": [1.85, 0.88, -0.9],
    "lander-body": [-2.1, 1.2, 0],
    "landing-engines": [-2.1, 0.43, 0],
    "landing-radar": [-1.38, 1.6, 0.6],
    "navigation-computer": [-2.7, 1.7, 0.5],
    "lander-antenna": [-2.65, 2.1, -0.5],
    "landing-cameras": [-1.5, 1.65, -0.6],
    nss: [1.36, 1.02, -0.5],
    nirvss: [2.62, 1.35, -0.2],
    trident: [2.72, 1.15, 0.6],
    msolo: [1.65, 1.38, 0.1],
  };
  const categories: Record<string, number[]> = {
    rover: [2.1, 0, 0],
    navigation: [2.1, 2.04, -0.3],
    solar: [2.1, 1.6, 0.55],
    battery: [2.1, 0.74, 0.76],
    thermal: [2.12, 1.28, 0.13],
    communication: [1.55, 1.35, 0.3],
  };
  if (part?.scienceFamily) {
    const scienceSlots: Record<string, number[]> = {
      camera: [2.35, 1.5, -0.6],
      ir: [2.66, 1.32, -0.15],
      xrf: [1.5, 1.34, -0.1],
      sample: [2.85, 1.15, 0.6],
      xrd: [1.75, 1.38, 0.42],
      gpr: [2.1, 0.56, -0.72],
      seismometer: [1.5, 0.87, 0.55],
    };
    return new THREE.Vector3(
      ...(scienceSlots[part.scienceFamily] as [number, number, number]),
    );
  }
  return new THREE.Vector3(
    ...((positions[id] ?? categories[part?.category ?? ""] ?? [0, 1, 0]) as [
      number,
      number,
      number,
    ]),
  );
}
export function buildAssembly(preparation: PreparationSelection) {
  const group = new THREE.Group();
  const ids = [
    ...preparation.landerPartIds,
    ...preparation.sciencePartIds,
    preparation.roverId,
    preparation.navigationId,
    preparation.solarId,
    preparation.batteryId,
    preparation.thermalId,
    preparation.communicationId,
  ].filter((id): id is string => !!id);
  for (const id of ids) {
    const mesh = createPartMesh(id);
    mesh.position.copy(attachmentPosition(id));
    mesh.name = id;
    // Body and rover already use their own ground-level coordinates.
    if (id === "lander-body") mesh.position.y = 0;
    group.add(mesh);
  }
  return group;
}

/** The same selected rover and instruments are used in every cargo/surface scene. */
export function buildRoverAssembly(preparation: PreparationSelection) {
  const kit = buildAssembly(preparation),
    rover = new THREE.Group();
  for (const part of [...kit.children]) {
    if (
      preparation.landerPartIds.includes(part.name) ||
      partById(part.name)?.category === "lander"
    )
      continue;
    part.position.x -= 2.1;
    rover.add(part);
  }
  disposeGroup(kit);
  return rover;
}
