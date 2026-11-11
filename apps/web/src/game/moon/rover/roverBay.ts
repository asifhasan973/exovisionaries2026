import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createCrewedPlatform } from "@/game/moon/crew/crewedMeshes";
import { ROVER_BASE } from "./rover.ts";
import type { RoverState, RoverSiteId } from "./rover.ts";

export const ROVER_BAY = { x: ROVER_BASE.x - 5.7, z: ROVER_BASE.z - 1.7 };
export const sampleColor = (id: RoverSiteId) =>
  id === "A" ? 0xe4bb73 : 0xa7dce0;
const smooth = (value: number) => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

/** The lander is static; batch its solid pieces without changing the animated doors or tracks. */
function batchLander(lander: THREE.Group) {
  lander.updateMatrixWorld(true);
  const inverse = lander.matrixWorld.clone().invert();
  const batches = new Map<THREE.Material, THREE.Mesh[]>();
  lander.traverse((object) => {
    if (object instanceof THREE.Mesh && !Array.isArray(object.material)) {
      const batch = batches.get(object.material) ?? [];
      batch.push(object);
      batches.set(object.material, batch);
    }
  });
  for (const [material, pieces] of batches) {
    if (pieces.length < 2) continue;
    const geometries = pieces.map((piece) =>
      piece.geometry
        .clone()
        .applyMatrix4(
          new THREE.Matrix4().multiplyMatrices(inverse, piece.matrixWorld),
        ),
    );
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach((part) => part.dispose());
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    const originals = new Set<THREE.BufferGeometry>();
    pieces.forEach((piece) => {
      piece.removeFromParent();
      originals.add(piece.geometry);
    });
    originals.forEach((part) => part.dispose());
    lander.add(mesh);
  }
}

/** Cargo handling is driven entirely by recorded phase time, including after reload. */
export function createRoverBay(height: (x: number, z: number) => number) {
  const root = new THREE.Group();
  root.name = "lander-rover-cargo-bay";
  root.position.set(ROVER_BAY.x, height(ROVER_BAY.x, ROVER_BAY.z), ROVER_BAY.z);
  const platform = createCrewedPlatform({ roverCargo: true });
  platform.capsule.visible = false;
  batchLander(platform.lander);
  platform.lander.position.set(0, 0, -3);
  platform.lander.scale.setScalar(2.4);
  root.add(platform.root);
  const alloy = new THREE.MeshStandardMaterial({
    color: 0xa8b3bd,
    metalness: 0.7,
    roughness: 0.4,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xb69550,
    metalness: 0.65,
    roughness: 0.5,
  });
  const doors = [-1, 1].map((side) => {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.45, 0.12), gold);
    panel.position.set(side * 0.65, 1.68, -0.5);
    panel.castShadow = true;
    root.add(panel);
    return panel;
  });
  const dock = new THREE.Vector3(
    ROVER_BAY.x,
    root.position.y + 0.44,
    ROVER_BAY.z - 2.2,
  );
  const approach = new THREE.Vector3(
    ROVER_BAY.x,
    height(ROVER_BAY.x, ROVER_BAY.z + 5.1),
    ROVER_BAY.z + 5.1,
  );
  const length = dock.distanceTo(approach);
  const incline = Math.atan2(dock.y - approach.y, approach.z - dock.z);
  const tracks = new THREE.Group();
  tracks.name = "folding-rover-wheel-tracks";
  tracks.position.set(0, dock.y - root.position.y, dock.z - ROVER_BAY.z);
  root.add(tracks);
  for (const x of [-0.9, 0.9]) {
    const track = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.08, length),
      alloy,
    );
    track.position.set(x, -0.04, length / 2);
    track.receiveShadow = true;
    track.castShadow = true;
    tracks.add(track);
    for (const side of [-1, 1]) {
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.08, length),
        alloy,
      );
      edge.position.set(x + side * 0.3, 0.025, length / 2);
      tracks.add(edge);
    }
  }
  function pose(s: RoverState) {
    if (s.version < 3) return null;
    if (s.stowed && s.phase !== "stowing")
      return { position: dock.clone(), heading: 0 };
    if (s.phase === "stowing") {
      const from = new THREE.Vector3(s.x, height(s.x, s.z), s.z),
        t = s.phaseTime;
      const position =
        t < 2.3
          ? from.lerp(approach, smooth((t - 1.5) / 0.8))
          : approach.clone().lerp(dock, smooth((t - 2.3) / 2.5));
      const angle = Math.atan2(Math.sin(-s.heading), Math.cos(-s.heading));
      return { position, heading: s.heading + angle * smooth((t - 1.5) / 0.8) };
    }
    if (s.phase === "deploying") {
      const t = s.phaseTime,
        home = new THREE.Vector3(s.x, height(s.x, s.z), s.z);
      return {
        position:
          t < 2.3
            ? dock.clone().lerp(approach, smooth((t - 0.9) / 1.4))
            : approach.clone().lerp(home, smooth((t - 2.3) / 0.7)),
        heading: THREE.MathUtils.lerp(
          Math.PI,
          s.heading,
          smooth((t - 2.3) / 0.7),
        ),
      };
    }
    return null;
  }
  function update(
    s: RoverState,
    _craft: THREE.Group,
    _sourceLocal: THREE.Vector3,
  ) {
    const t = s.phaseTime;
    const opening =
      s.phase === "stowing"
        ? smooth(t / 1.1) * (1 - smooth((t - 4.9) / 1.1))
        : s.phase === "deploying"
          ? smooth(t / 0.6) * (1 - smooth((t - 2.65) / 0.35))
          : 0;
    const extension =
      s.phase === "stowing"
        ? smooth((t - 0.7) / 0.8) * (1 - smooth((t - 4.8) / 0.8))
        : s.phase === "deploying"
          ? smooth((t - 0.3) / 0.6) * (1 - smooth((t - 2.6) / 0.4))
          : 0;
    doors.forEach((door, index) => {
      door.position.x = (index ? 1 : -1) * (0.65 + opening * 1.45);
    });
    tracks.visible = extension > 0.001;
    tracks.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, incline, extension);
    tracks.scale.z = THREE.MathUtils.lerp(0.2, 1, extension);
  }
  return { root, pose, update, dock };
}
