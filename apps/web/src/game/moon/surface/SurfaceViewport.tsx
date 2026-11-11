import { SceneFallback, useLoadingStore, isEngineFrozen } from "@exo/ui";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  buildAssembly,
  disposeGroup,
} from "@/game/moon/workshop/lander/workshopMeshes";
import { partById } from "@/game/moon/core/preparation";
import type { PreparationSelection } from "@/game/moon/core/design";
import type { MoonSession } from "@/game/moon/shared/session";
import { createCrewedPlatform } from "@/game/moon/crew/crewedMeshes";
import {
  SURFACE_NODES,
  SURFACE_EDGES,
  SURFACE_MODEL,
  surfacePosition,
  surfaceLight,
  legPoint,
  surfaceNode,
  surfaceNodeName,
} from "./surface";
import type { SurfaceState, SurfaceNodeId } from "./surface";
import {
  createSurfaceTerrain,
  surfaceHeight,
  writeSurfaceTracks,
} from "./surfaceTerrain";

function disposeSurfaceWorld(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>(),
    textures = new Set<THREE.Texture>();
  scene.traverse((object) => {
    if (
      object instanceof THREE.Mesh ||
      object instanceof THREE.Line ||
      object instanceof THREE.Points ||
      object instanceof THREE.Sprite
    ) {
      if ("geometry" in object) geometries.add(object.geometry);
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material]) {
        materials.add(material);
        for (const value of Object.values(material))
          if (value instanceof THREE.Texture) textures.add(value);
      }
    }
    if (
      object instanceof THREE.DirectionalLight ||
      object instanceof THREE.SpotLight
    )
      object.shadow.map?.dispose();
  });
  textures.forEach((texture) => texture.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

export interface ScienceAnimation {
  geology?: boolean;
  scoop?: boolean;
  seismometerSite?: "lookout" | "edge" | "target" | null;
  sampleCount?: number;
  target: "lookout" | "edge" | "target";
  phase: string;
  frame: number;
  frameLimit: number;
  depthCm: number;
  paused: boolean;
  dust?: number;
  recovery?: "brush" | "calibrate" | "wait" | null;
  radiation?: boolean;
}
export function SurfaceViewport({
  surface,
  preparation,
  moon,
  gentle,
  science,
  destination,
}: {
  surface: SurfaceState;
  preparation: PreparationSelection;
  moon: MoonSession;
  gentle: boolean;
  science?: ScienceAnimation;
  destination?: SurfaceNodeId;
}) {
  const scienceRef = useRef(science),
    destinationRef = useRef(destination),
    moonRef = useRef(moon);
  useEffect(() => {
    moonRef.current = moon;
  }, [moon]);
  useEffect(() => {
    destinationRef.current = destination;
    redraw.current();
  }, [destination]);
  useEffect(() => {
    scienceRef.current = science;
    redraw.current();
  }, [science]);
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(surface),
    redraw = useRef(() => {}),
    [view, setView] = useState<"follow" | "map">("follow"),
    viewRef = useRef(view),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    latest.current = surface;
    redraw.current();
  }, [surface]);
  useEffect(() => {
    viewRef.current = view;
    redraw.current();
  }, [view]);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let disposed = false,
      frame = 0,
      last = 0,
      renderer: THREE.WebGLRenderer;
    const loading = useLoadingStore.getState();
    if (!loading.isLoading)
      void loading.startLoading("custom", "Preparing your Moon expedition…");
    let finishTask = () => {};
    const task = new Promise<void>((resolve) => {
      finishTask = resolve;
    });
    useLoadingStore.getState().registerLoaderTask(task);
    let cleanScene = () => {};
    const boot = () => {
      if (disposed) {
        finishTask();
        return;
      }
      try {
        cleanScene = initialize();
      } catch {
        cleanScene();
        if (!disposed) setFailed(true);
      } finally {
        finishTask();
      }
    };
    const initialize = () => {
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "low-power",
        });
      } catch {
        queueMicrotask(() => setFailed(true));
        return () => {};
      }
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mount.append(renderer.domElement);
      const scene = new THREE.Scene();
      cleanScene = () => {
        disposeSurfaceWorld(scene);
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      };
      scene.background = new THREE.Color("#070b14");
      scene.fog = new THREE.Fog("#151a25", 48, 95);
      const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 180);
      renderer.toneMappingExposure = 1.15;
      scene.add(new THREE.HemisphereLight(0xcbdcf2, 0x30303a, 1.25));
      const sun = new THREE.DirectionalLight(0xffeed6, 3.2);
      sun.position.set(-22, 18, -25);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, {
        left: -42,
        right: 42,
        top: 36,
        bottom: -36,
        far: 120,
      });
      sun.shadow.bias = -0.0003;
      sun.shadow.normalBias = 0.04;
      scene.add(sun);
      const rim = new THREE.DirectionalLight(0xa7c8f2, 0.65);
      rim.position.set(12, 8, 16);
      scene.add(rim);
      scene.add(createSurfaceTerrain(moonRef.current));
      const labels: THREE.Sprite[] = [],
        routeLines: THREE.Line[] = [];
      SURFACE_EDGES.forEach((e) => {
        const leg = { edge: e.id, from: e.a, to: e.b },
          points = Array.from({ length: 30 }, (_, i) => {
            const p = legPoint(leg, i / 29);
            return new THREE.Vector3(
              p.x / 6,
              surfaceHeight(p.x / 6, p.z / 6) + 0.045,
              p.z / 6,
            );
          });
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineDashedMaterial({
            color: 0xa1e5ce,
            dashSize: 0.18,
            gapSize: 0.25,
            transparent: true,
            opacity: 0.5,
          }),
        );
        line.computeLineDistances();
        scene.add(line);
        routeLines.push(line);
      });
      for (const node of SURFACE_NODES) {
        const marker = new THREE.Mesh(
          new THREE.RingGeometry(0.5, 0.56, 48),
          new THREE.MeshBasicMaterial({
            color: node.id === "target" ? 0xffd56a : 0x92dfbb,
            side: THREE.DoubleSide,
            toneMapped: false,
          }),
        );
        marker.rotation.x = -Math.PI / 2;
        marker.position.set(
          node.x / 6,
          surfaceHeight(node.x / 6, node.z / 6) + 0.06,
          node.z / 6,
        );
        marker.userData.node = node.id;
        scene.add(marker);
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#21112ee8";
          ctx.fillRect(0, 0, 256, 64);
          ctx.font = "bold 27px sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff1ca";
          ctx.fillText(surfaceNodeName(node.id, moonRef.current), 128, 42);
        }
        const label = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(canvas),
            depthTest: false,
          }),
        );
        label.position.set(
          node.x / 6,
          surfaceHeight(node.x / 6, node.z / 6) + 2.6,
          node.z / 6 - 0.7,
        );
        label.scale.set(2.8, 0.7, 1);
        scene.add(label);
        labels.push(label);
      }
      const crew = createCrewedPlatform();
      crew.capsule.visible = false;
      crew.lander.position.set(0, 0, 0);
      crew.root.position.set(-35 / 6 - 3, surfaceHeight(-35 / 6 - 3, 0), 0);
      crew.lander.scale.setScalar(1.7);
      scene.add(crew.root);
      const ramp = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.08, 1.2),
        new THREE.MeshStandardMaterial({
          color: 0x91929d,
          metalness: 0.5,
          roughness: 0.5,
        }),
      );
      ramp.rotation.z = -0.28;
      ramp.position.set(-35 / 6 - 1.7, surfaceHeight(-35 / 6, 0) + 0.5, 0);
      ramp.receiveShadow = true;
      scene.add(ramp);
      const rover = new THREE.Group(),
        assembly = buildAssembly(preparation);
      scene.add(rover);
      for (const part of [...assembly.children]) {
        if (partById(part.name)?.category === "lander") continue;
        rover.add(part);
        part.position.x -= 2.1;
      }
      disposeGroup(assembly);
      const wheels: THREE.Object3D[] = [];
      rover.traverse((object) => {
        if (object.userData.wheelPivot) {
          object.userData.restY = object.position.y;
          wheels.push(object);
        }
      });
      const wheelPoint = new THREE.Vector3(),
        sensorHead = rover.children.find(
          (part) => partById(part.name)?.category === "navigation",
        );
      const sensorHeading = sensorHead?.rotation.y ?? 0;
      if (moonRef.current.objective === "lunar-geology")
        for (const [i, id] of (
          ["lookout", "edge", "target"] as const
        ).entries()) {
          const point = surfaceNode(id),
            patch = new THREE.Group();
          patch.position.set(
            point.x / 6,
            surfaceHeight(point.x / 6, point.z / 6) + 0.08,
            point.z / 6,
          );
          const colors =
            id === "edge"
              ? [0x3e3b47, 0x55505c]
              : id === "target" || moon.site === "ancient-crater"
                ? [0x9e979d, 0x494650]
                : [0xd5d1c8, 0xb6b1b4];
          for (let j = 0; j < 9; j++) {
            const fragment = new THREE.Mesh(
              new THREE.DodecahedronGeometry(0.18 + (j % 3) * 0.05),
              new THREE.MeshStandardMaterial({
                color: colors[j % 2],
                roughness: 0.95,
              }),
            );
            fragment.position.set(
              Math.sin(j * 2.3) * 0.65,
              0.16,
              Math.cos(j * 2.3) * 0.65,
            );
            fragment.rotation.set(i + j * 0.2, j, j * 0.5);
            fragment.castShadow = true;
            patch.add(fragment);
          }
          scene.add(patch);
        }
      const scoopArm = new THREE.Group();
      rover.add(scoopArm);
      scoopArm.position.set(0.5, 0.8, 0.3);
      const armBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.8),
        new THREE.MeshStandardMaterial({
          color: 0xc3cbd5,
          metalness: 0.6,
          roughness: 0.4,
        }),
      );
      armBar.position.z = 0.4;
      scoopArm.add(armBar);
      const scoopBowl = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.18, 0.3),
        new THREE.MeshStandardMaterial({
          color: 0xbba677,
          metalness: 0.4,
          roughness: 0.6,
        }),
      );
      scoopBowl.position.z = 0.88;
      scoopArm.add(scoopBowl);
      const sensor = new THREE.Group();
      const sensorBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.3, 0.12, 24),
        new THREE.MeshStandardMaterial({
          color: 0xc5a346,
          metalness: 0.55,
          roughness: 0.5,
        }),
      );
      sensorBase.position.y = 0.08;
      sensor.add(sensorBase);
      const sensorTop = new THREE.Mesh(
        new THREE.BoxGeometry(0.27, 0.22, 0.27),
        new THREE.MeshStandardMaterial({
          color: 0xbac3cb,
          metalness: 0.5,
          roughness: 0.5,
        }),
      );
      sensorTop.position.y = 0.21;
      sensor.add(sensorTop);
      scene.add(sensor);
      const scan = new THREE.Mesh(
        new THREE.RingGeometry(0.6, 0.66, 64),
        new THREE.MeshBasicMaterial({
          color: 0x8feec9,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
      );
      scan.rotation.x = -Math.PI / 2;
      scene.add(scan);
      const drill = new THREE.Group(),
        shaft = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.055, 1.2, 16),
          new THREE.MeshStandardMaterial({
            color: 0xd2d8df,
            metalness: 0.85,
            roughness: 0.3,
          }),
        );
      drill.add(shaft);
      for (let i = 0; i < 12; i++) {
        const tooth = new THREE.Mesh(
          new THREE.TorusGeometry(0.09, 0.018, 6, 12, Math.PI * 1.5),
          shaft.material,
        );
        tooth.position.y = -0.55 + i * 0.09;
        tooth.rotation.y = i * 0.7;
        drill.add(tooth);
      }
      rover.add(drill);
      drill.position.set(0.2, 0.5, 0.4);
      const cuttings = new THREE.Group();
      for (let i = 0; i < 14; i++) {
        const chip = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.04 + (i % 3) * 0.015),
          new THREE.MeshStandardMaterial({ color: 0x968d9e, roughness: 1 }),
        );
        chip.position.set(Math.sin(i * 5) * 0.35, 0.06, Math.cos(i * 7) * 0.35);
        cuttings.add(chip);
      }
      scene.add(cuttings);
      const scienceGlow = new THREE.PointLight(0x9cffce, 0, 3);
      scienceGlow.position.set(0, 0.8, 0);
      rover.add(scienceGlow);
      const lamp = new THREE.SpotLight(0xc7e8ff, 24, 14, 0.55, 0.5, 1);
      lamp.position.set(0, 1.7, -0.7);
      rover.add(lamp);
      const lampTarget = new THREE.Object3D();
      scene.add(lampTarget);
      lamp.target = lampTarget;
      const dustColour = new THREE.Color(0x8a8084),
        paint = new Map<THREE.MeshStandardMaterial, THREE.Color>();
      rover.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          const materials = Array.isArray(o.material)
            ? o.material
            : [o.material];
          materials.forEach((m) => {
            if (m instanceof THREE.MeshStandardMaterial && !paint.has(m))
              paint.set(m, m.color.clone());
          });
        }
      });
      const tracksGeometry = new THREE.BufferGeometry();
      tracksGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(8 * 72 * 4 * 3), 3),
      );
      tracksGeometry.setDrawRange(0, 0);
      const tracks = new THREE.LineSegments(
        tracksGeometry,
        new THREE.LineBasicMaterial({
          color: 0x383740,
          transparent: true,
          opacity: 0.55,
        }),
      );
      scene.add(tracks);
      let trackKey = "";
      const dustGeometry = new THREE.BufferGeometry(),
        dustPositions = new Float32Array(36 * 3);
      dustGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(dustPositions, 3),
      );
      const dust = new THREE.Points(
        dustGeometry,
        new THREE.PointsMaterial({
          color: 0xb6aba0,
          size: 0.07,
          transparent: true,
          opacity: 0.24,
          depthWrite: false,
        }),
      );
      scene.add(dust);
      const sampleBox = new THREE.Group();
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.2, 0.32),
        new THREE.MeshStandardMaterial({
          color: 0xa5b5bd,
          metalness: 0.5,
          roughness: 0.4,
        }),
      );
      sampleBox.add(box);
      const seal = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.025, 0.33),
        new THREE.MeshStandardMaterial({
          color: 0xddbc7e,
          metalness: 0.5,
          roughness: 0.4,
        }),
      );
      seal.position.y = 0.12;
      sampleBox.add(seal);
      sampleBox.position.set(-0.35, 0.95, 0.3);
      rover.add(sampleBox);
      rover.position.set(-35 / 6, surfaceHeight(-35 / 6, 0), 0);
      let oldPosition = rover.position.clone();
      const cameraPosition = new THREE.Vector3(),
        cameraFocus = new THREE.Vector3();
      let cameraReady = false;
      const draw = (snap = false) => {
        if (disposed || document.hidden || isEngineFrozen()) return;
        const s = latest.current,
          activity = scienceRef.current,
          p = surfacePosition(s),
          deployment =
            s.stage === "stowed"
              ? 0
              : s.stage === "deploying"
                ? s.phaseFrame / SURFACE_MODEL.deployFrames
                : 1;
        const target = new THREE.Vector3(
          s.deployed ? p.x / 6 : -35 / 6 - 2.5 * (1 - deployment),
          s.deployed
            ? surfaceHeight(p.x / 6, p.z / 6)
            : surfaceHeight(-35 / 6, 0) + 1.3 * (1 - deployment),
          s.deployed ? p.z / 6 : 0,
        );
        if (snap || gentle || s.paused) rover.position.copy(target);
        else rover.position.lerp(target, 0.35);
        const delta = rover.position.clone().sub(oldPosition);
        oldPosition.copy(rover.position);
        const rolling = s.stage === "driving" && !s.paused;
        if (rolling && s.legs[0]) {
          const ahead = legPoint(
            s.legs[0],
            Math.min(1, (s.legFrame + 1) / SURFACE_MODEL.legFrames),
          );
          const behind = legPoint(
            s.legs[0],
            Math.max(0, (s.legFrame - 1) / SURFACE_MODEL.legFrames),
          );
          rover.rotation.y = Math.atan2(behind.x - ahead.x, behind.z - ahead.z);
        }
        if (delta.length() > 0.001 && rolling)
          rover.traverse((o) => {
            if (o.userData.wheelPivot) o.rotation.x += delta.length() / 0.32;
          });
        const forwardSlope = new THREE.Vector3(0, 0, -0.55).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          rover.rotation.y,
        );
        rover.rotation.x = gentle
          ? 0
          : Math.atan2(
              surfaceHeight(
                rover.position.x + forwardSlope.x,
                rover.position.z + forwardSlope.z,
              ) -
                surfaceHeight(
                  rover.position.x - forwardSlope.x,
                  rover.position.z - forwardSlope.z,
                ),
              1.1,
            ) * -0.45;
        rover.updateMatrixWorld(true);
        wheels.forEach((wheel) => {
          wheel.getWorldPosition(wheelPoint);
          wheel.position.y =
            wheel.userData.restY +
            (gentle
              ? 0
              : THREE.MathUtils.clamp(
                  surfaceHeight(wheelPoint.x, wheelPoint.z) - rover.position.y,
                  -0.12,
                  0.12,
                ));
        });
        if (sensorHead)
          sensorHead.rotation.y =
            sensorHeading +
            (activity?.phase === "survey"
              ? Math.sin(activity.frame * 0.2) * 0.35
              : 0);
        sampleBox.visible = (activity?.sampleCount ?? 0) > 0;
        const nextTrackKey =
          s.traversed.join("|") +
          ":" +
          s.legs[0]?.edge +
          ":" +
          s.legFrame +
          ":" +
          s.legs[0]?.from;
        if (nextTrackKey !== trackKey) {
          writeSurfaceTracks(tracksGeometry, s);
          trackKey = nextTrackKey;
        }
        dust.visible = rolling && !gentle;
        if (dust.visible) {
          for (let i = 0; i < 36; i++) {
            const life = (s.legFrame * 0.13 + i * 0.618) % 1,
              angle = i * 2.4;
            dustPositions[i * 3] =
              rover.position.x + Math.cos(angle) * (0.3 + life * 0.65);
            dustPositions[i * 3 + 1] =
              surfaceHeight(rover.position.x, rover.position.z) +
              0.06 +
              Math.sin(life * Math.PI) * 0.28;
            dustPositions[i * 3 + 2] =
              rover.position.z + Math.sin(angle) * (0.3 + life * 0.6);
          }
          dustGeometry.attributes.position.needsUpdate = true;
          dustGeometry.computeBoundingSphere();
        }
        paint.forEach((color, material) =>
          material.color
            .copy(color)
            .lerp(dustColour, (activity?.dust ?? 0) * 0.45),
        );
        const working = activity && !activity.paused,
          progress = activity
            ? Math.min(1, activity.frame / Math.max(1, activity.frameLimit))
            : 0;
        scan.visible =
          !!activity &&
          !!working &&
          ["survey", "analysis", "transmitting", "listening"].includes(
            activity.phase,
          );
        scan.position.set(
          rover.position.x,
          surfaceHeight(rover.position.x, rover.position.z) + 0.08,
          rover.position.z,
        );
        scan.scale.setScalar(1 + ((activity?.frame ?? 0) % 12) / 5);
        (scan.material as THREE.MeshBasicMaterial).opacity =
          0.8 * (1 - ((activity?.frame ?? 0) % 12) / 14);
        drill.visible = activity?.phase === "drilling" && !activity.scoop;
        scoopArm.visible =
          !!activity?.geology &&
          !!activity.scoop &&
          activity.phase === "drilling";
        scoopArm.rotation.x =
          activity?.phase === "drilling"
            ? Math.sin(progress * Math.PI) * 0.75
            : 0;
        sensor.visible = !!activity?.geology && !!activity.seismometerSite;
        if (activity?.seismometerSite) {
          const place = surfaceNode(activity.seismometerSite);
          sensor.position.set(
            place.x / 6 - 0.6,
            surfaceHeight(place.x / 6 - 0.6, place.z / 6 - 0.8),
            place.z / 6 - 0.8,
          );
        }
        drill.position.y =
          0.9 - (progress * Math.min(100, activity?.depthCm ?? 20)) / 100;
        drill.rotation.y = working
          ? (activity?.frame ?? 0) * 1.8
          : drill.rotation.y;
        cuttings.visible =
          !!activity &&
          ["drilling", "analysis", "report", "ready"].includes(activity.phase);
        const samplePlace = activity ? surfaceNode(activity.target) : p;
        cuttings.position.set(
          samplePlace.x / 6 + 0.2,
          surfaceHeight(samplePlace.x / 6 + 0.2, samplePlace.z / 6 + 0.4) +
            0.01,
          samplePlace.z / 6 + 0.4,
        );
        cuttings.scale.setScalar(
          activity?.phase === "drilling" ? Math.max(0.1, progress) : 1,
        );
        scienceGlow.intensity =
          working && ["survey", "analysis"].includes(activity.phase) ? 2 : 0;
        ramp.visible = !s.deployed;
        const light = surfaceLight(p.x, p.z, moonRef.current);
        lamp.visible = s.deployed && light === 0;
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
          rover.quaternion,
        );
        lampTarget.position.copy(rover.position).add(forward.multiplyScalar(6));
        lampTarget.position.y = 0.05;
        const focusNode =
          (s.deployed ? destinationRef.current : undefined) ??
          (activity &&
          ["outbound", "survey", "drilling", "analysis"].includes(
            activity.phase,
          )
            ? activity.target
            : s.legs[0]?.to);
        labels.forEach((label, i) => {
          label.visible =
            viewRef.current === "map" || SURFACE_NODES[i].id === focusNode;
          label.material.opacity = 1;
        });
        scene.children.forEach((o) => {
          if (o.userData.node)
            o.visible =
              viewRef.current === "map" || o.userData.node === focusNode;
        });
        routeLines.forEach((line, i) => {
          const edge = SURFACE_EDGES[i];
          line.visible =
            viewRef.current === "map" ||
            s.legs[0]?.edge === edge.id ||
            (!!focusNode &&
              ((edge.a === s.location && edge.b === focusNode) ||
                (edge.b === s.location && edge.a === focusNode)));
        });
        let desiredPosition: THREE.Vector3, desiredFocus: THREE.Vector3;
        if (viewRef.current === "map") {
          desiredPosition = new THREE.Vector3(9, 37, 29);
          desiredFocus = new THREE.Vector3(8, 0, -2);
        } else {
          const ahead = focusNode ? surfaceNode(focusNode) : p;
          const lookAhead = new THREE.Vector3(ahead.x / 6, 0, ahead.z / 6).sub(
            rover.position,
          );
          lookAhead.y = 0;
          lookAhead.clampLength(0, 2.7);
          const from = surfaceNode(s.legs[0]?.from ?? s.location),
            to = focusNode ? surfaceNode(focusNode) : null;
          const heading = to
            ? new THREE.Vector3(to.x - from.x, 0, to.z - from.z).normalize()
            : new THREE.Vector3(-0.6, 0, -0.8);
          const offset = heading
            .clone()
            .multiplyScalar(s.deployed ? -6 : 6)
            .add(
              new THREE.Vector3(
                -heading.z * 2,
                s.deployed ? 3.2 : 4,
                heading.x * 2,
              ),
            );
          desiredPosition = rover.position.clone().add(offset);
          desiredFocus = rover.position
            .clone()
            .add(lookAhead.multiplyScalar(0.65));
          desiredFocus.y += 0.65;
        }
        if (!cameraReady || snap || gentle) {
          cameraPosition.copy(desiredPosition);
          cameraFocus.copy(desiredFocus);
          cameraReady = true;
        } else {
          cameraPosition.lerp(desiredPosition, 0.12);
          cameraFocus.lerp(desiredFocus, 0.12);
        }
        camera.position.copy(cameraPosition);
        camera.lookAt(cameraFocus);
        renderer.render(scene, camera);
      };
      const active = () =>
        !isEngineFrozen() &&
        !document.hidden &&
        ((["driving", "deploying"].includes(latest.current.stage) &&
          !latest.current.paused) ||
          (!!scienceRef.current &&
            !scienceRef.current.paused &&
            [
              "survey",
              "drilling",
              "analysis",
              "transmitting",
              "recovering",
              "listening",
            ].includes(scienceRef.current.phase)));
      const animate = (time: number) => {
        if (disposed || !active()) return;
        if (time - last > 32) {
          draw();
          last = time;
        }
        frame = requestAnimationFrame(animate);
      };
      const wake = () => {
        cancelAnimationFrame(frame);
        if (isEngineFrozen() || document.hidden) return;
        draw(!active());
        if (active()) frame = requestAnimationFrame(animate);
      };
      redraw.current = wake;
      const resize = () => {
        renderer.setSize(
          Math.max(1, mount.clientWidth),
          Math.max(1, mount.clientHeight),
          false,
        );
        camera.aspect = mount.clientWidth / Math.max(1, mount.clientHeight);
        camera.updateProjectionMatrix();
        wake();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(mount);
      const lost = (e: Event) => {
        e.preventDefault();
        disposed = true;
        cancelAnimationFrame(frame);
        redraw.current = () => {};
        setFailed(true);
      };
      renderer.domElement.addEventListener("webglcontextlost", lost);
      document.addEventListener("visibilitychange", wake);
      window.addEventListener("game-orientation-pause", wake);
      window.addEventListener("game-orientation-resume", wake);
      resize();
      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        observer.disconnect();
        redraw.current = () => {};
        document.removeEventListener("visibilitychange", wake);
        window.removeEventListener("game-orientation-pause", wake);
        window.removeEventListener("game-orientation-resume", wake);
        renderer.domElement.removeEventListener("webglcontextlost", lost);
        disposeSurfaceWorld(scene);
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      };
    };
    const bootFrame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(boot);
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(bootFrame);
      cancelAnimationFrame(frame);
      finishTask();
      cleanScene();
    };
  }, [preparation, moon.site, moon.objective, gentle]);
  return (
    <>
      <div
        className="surface-canvas"
        ref={host}
        role="img"
        aria-label="Your selected rover and equipment exploring a lunar route with sunlight, shadow, rocks and a crewed lander"
      >
        {failed ? (
          <SceneFallback
            scene="surface"
            label={`At ${surface.location}`}
            detail={science?.phase ?? surface.stage}
            position={
              surface.location === "base"
                ? 0
                : surface.location === "lookout"
                  ? 0.35
                  : surface.location === "edge"
                    ? 0.65
                    : 1
            }
          />
        ) : null}
      </div>
      <div className="surface-view-switch">
        <button
          aria-pressed={view === "map"}
          onClick={() => setView(view === "map" ? "follow" : "map")}
        >
          {view === "map" ? "Back to rover" : "Map"}
        </button>
      </div>
    </>
  );
}
