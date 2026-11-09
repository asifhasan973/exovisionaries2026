import * as THREE from "three";
import { ROVER_BASE } from "./rover.ts";
import type { RoverState, RoverSiteId } from "./rover.ts";

export const ROVER_BAY = { x: ROVER_BASE.x - 5.7, z: ROVER_BASE.z - 1.7 };
export const sampleColor = (id: RoverSiteId) =>
  id === "A" ? 0xe4bb73 : 0xa7dce0;
const smooth = (value: number) => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

/** Cargo handling is driven entirely by recorded phase time, including after reload. */
export function createRoverBay(height: (x: number, z: number) => number) {
  const root = new THREE.Group();
  root.name = "lander-rover-cargo-bay";
  root.position.set(ROVER_BAY.x, height(ROVER_BAY.x, ROVER_BAY.z), ROVER_BAY.z);
  const metal = new THREE.MeshStandardMaterial({
      color: 0x3d4858,
      roughness: 0.65,
      metalness: 0.5,
    }),
    trim = new THREE.MeshStandardMaterial({
      color: 0xb29b65,
      roughness: 0.5,
      metalness: 0.6,
    });
  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material = metal,
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };
  box(3.6, 0.18, 4.4, 0, 0.28, 0);
  box(0.15, 2.6, 4.4, -1.72, 1.65, 0);
  box(0.15, 2.6, 4.4, 1.72, 1.65, 0);
  box(3.6, 2.6, 0.15, 0, 1.65, -2.15);
  box(3.6, 0.15, 4.5, 0, 2.95, 0);
  box(0.13, 2.8, 0.18, -1.65, 1.6, 2.25, trim);
  box(0.13, 2.8, 0.18, 1.65, 1.6, 2.25, trim);
  const door = box(3.3, 2.6, 0.12, 0, 1.65, 2.2, trim);
  const ramp = new THREE.Group();
  ramp.position.set(0, 0.34, 2.2);
  root.add(ramp);
  const rampDeck = new THREE.Mesh(
    new THREE.BoxGeometry(3.25, 0.12, 3.4),
    metal,
  );
  rampDeck.position.z = 1.7;
  rampDeck.receiveShadow = true;
  ramp.add(rampDeck);
  for (const x of [-1.4, 1.4]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 3.4), trim);
    edge.position.set(x, 0.1, 1.7);
    ramp.add(edge);
  }
  const glow = new THREE.MeshBasicMaterial({ color: 0xa5f3d0 });
  box(2.8, 0.06, 0.08, 0, 2.75, 1.9, glow);
  const lamp = new THREE.PointLight(0x9debd3, 9, 7);
  lamp.position.set(0, 2.5, 0.8);
  root.add(lamp);
  const label = document.createElement("canvas");
  label.width = 512;
  label.height = 100;
  const ctx = label.getContext("2d")!;
  ctx.fillStyle = "#17252d";
  ctx.fillRect(0, 0, 512, 100);
  ctx.fillStyle = "#cbf4df";
  ctx.font = "bold 44px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ROVER BAY", 256, 65);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 0.53),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(label) }),
  );
  sign.position.set(0, 3.18, 2.3);
  root.add(sign);
  const post = box(0.18, 1.8, 0.18, 2, 1.25, 1.4, trim),
    arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 1, 12),
      metal,
    );
  root.add(arm);
  const gripper = new THREE.Group();
  root.add(gripper);
  for (const side of [-1, 1]) {
    const finger = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.3, 0.09),
      trim,
    );
    finger.position.set(side * 0.19, -0.13, 0);
    gripper.add(finger);
  }
  const tubeMaterial = new THREE.MeshStandardMaterial({
    color: sampleColor("A"),
    metalness: 0.45,
    roughness: 0.4,
  });
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.4, 16),
    tubeMaterial,
  );
  tube.position.y = -0.32;
  gripper.add(tube);
  const rack = box(1.45, 0.12, 0.7, 0.5, 0.65, 0.5, metal);
  const stored = [0, 1].map((index) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 0.4, 16),
      new THREE.MeshStandardMaterial({
        color: sampleColor(index ? "C" : "A"),
        metalness: 0.45,
        roughness: 0.4,
      }),
    );
    mesh.position.set(0.15 + index * 0.65, 0.91, 0.5);
    root.add(mesh);
    return mesh;
  });
  const dock = new THREE.Vector3(
      ROVER_BAY.x,
      root.position.y + 0.36,
      ROVER_BAY.z,
    ),
    approach = new THREE.Vector3(
      ROVER_BAY.x,
      height(ROVER_BAY.x, ROVER_BAY.z + 5.6),
      ROVER_BAY.z + 5.6,
    );
  function pose(s: RoverState) {
    if (s.version < 3) return null;
    if (s.stowed && s.phase !== "stowing")
      return { position: dock.clone(), heading: 0 };
    if (s.phase === "stowing") {
      const from = new THREE.Vector3(s.x, height(s.x, s.z), s.z),
        t = s.phaseTime;
      const position =
        t < 2.3
          ? from.lerp(approach, smooth((t - 0.7) / 1.6))
          : approach.clone().lerp(dock, smooth((t - 2.3) / 2.5));
      const angle = Math.atan2(Math.sin(-s.heading), Math.cos(-s.heading));
      return { position, heading: s.heading + angle * smooth((t - 0.7) / 1.6) };
    }
    if (s.phase === "deploying") {
      const t = s.phaseTime,
        home = new THREE.Vector3(s.x, height(s.x, s.z), s.z);
      return {
        position:
          t < 1.6
            ? dock.clone().lerp(approach, smooth((t - 0.45) / 1.15))
            : approach.clone().lerp(home, smooth((t - 1.6) / 1.4)),
        heading: THREE.MathUtils.lerp(
          Math.PI,
          s.heading,
          smooth((t - 1.6) / 1.4),
        ),
      };
    }
    return null;
  }
  function update(
    s: RoverState,
    craft: THREE.Group,
    sourceLocal: THREE.Vector3,
  ) {
    const transfer = s.version >= 3 && s.phase === "delivering",
      t = s.phaseTime;
    const opening =
      s.phase === "stowing"
        ? smooth(t / 0.7) * (1 - smooth((t - 4.8) / 1.2))
        : s.phase === "deploying"
          ? smooth(t / 0.4) * (1 - smooth((t - 2.6) / 0.4))
          : transfer
            ? smooth(t / 0.7) * (1 - smooth((t - 3.1) / 0.7))
            : 0;
    const doorScale = Math.max(0.01, 1 - opening);
    door.scale.y = doorScale;
    door.position.y = 2.95 - 1.3 * doorScale;
    door.visible = opening < 0.99;
    ramp.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, 0.1, opening);
    arm.visible = gripper.visible = transfer;
    post.visible = rack.visible = true;
    const progress = THREE.MathUtils.clamp(t / 3.8, 0, 1);
    stored.forEach((mesh, index) => {
      mesh.visible =
        index < s.deposited.length ||
        (transfer && progress > 0.88 && index === s.deposited.length);
    });
    if (!transfer) return;
    root.updateMatrixWorld(true);
    craft.updateMatrixWorld(true);
    const source = root
        .worldToLocal(craft.localToWorld(sourceLocal.clone()))
        .add(new THREE.Vector3(0, 0.32, 0)),
      destination = new THREE.Vector3(
        0.15 + s.deposited.length * 0.65,
        1.25,
        0.5,
      );
    const point =
      progress < 0.25
        ? destination.clone().lerp(source, smooth(progress / 0.25))
        : source.clone().lerp(destination, smooth((progress - 0.38) / 0.45));
    point.y += Math.sin(smooth((progress - 0.38) / 0.45) * Math.PI) * 0.75;
    gripper.position.copy(point);
    tube.visible = progress >= 0.25 && progress < 0.88;
    tubeMaterial.color.setHex(sampleColor(s.deliveryIds?.[0] ?? "A"));
    const pivot = post.position.clone().add(new THREE.Vector3(0, 0.9, 0)),
      direction = point.clone().sub(pivot);
    arm.position.copy(pivot).lerp(point, 0.5);
    arm.scale.y = direction.length();
    arm.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    );
  }
  return { root, pose, update, dock };
}
