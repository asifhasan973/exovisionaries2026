import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createLaunchHardware } from "@/game/moon/flight/launch/launchHardware";
import { disposeGroup } from "@/game/moon/workshop/lander/workshopMeshes";
import type { PreparationSelection } from "@/game/moon/core/design";
import { ROCKET_PARTS, COVERS } from "./rocketAssembly";
import type { RocketPartId } from "./rocketAssembly";
import { isEngineFrozen, useOrientationLifecycleStore } from "@exo/ui";
import { useLoadingStore } from "@exo/ui";
import "./rocketAssembly.css";

export interface RocketSocket {
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  width: number;
  height: number;
}
export type RocketSockets = Partial<Record<RocketPartId, RocketSocket>>;
interface Props {
  preparation: PreparationSelection;
  installed: readonly RocketPartId[];
  inside?: boolean;
  bayView?: boolean;
  gentle?: boolean;
  readOnly?: boolean;
  viewKey?: number;
  onSockets?(sockets: RocketSockets): void;
  onThumbnails?(images: Record<string, string>): void;
  onReady?(): void;
}

/** The workshop and ascent share all stage geometry, fairings and stowed payloads. */
export function MainRocketViewport(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(props),
    repaint = useRef(() => {});
  const [failed, setFailed] = useState(false);
  const frozen = useOrientationLifecycleStore((state) => state.isFrozen);
  useEffect(() => {
    latest.current = props;
    repaint.current();
  }, [props, frozen]);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let disposed = false,
      frame = 0,
      renderer: THREE.WebGLRenderer | undefined,
      scene: THREE.Scene | undefined,
      observer: ResizeObserver | undefined,
      controls: OrbitControls | undefined;
    const loading = useLoadingStore.getState();
    if (!loading.isLoading)
      void loading.startLoading("custom", "Opening the rocket hangar…");
    let resolveTask: () => void = () => {};
    const task = new Promise<void>((resolve) => {
      resolveTask = resolve;
    });
    useLoadingStore.getState().registerLoaderTask(task);
    let cleanupScene = () => {};
    const boot = () => {
      if (disposed) {
        resolveTask();
        return;
      }
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: false,
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: "low-power",
        });
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.22;
        mount.appendChild(renderer.domElement);
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x151426);
        const camera = new THREE.OrthographicCamera(
          -10,
          10,
          8.5,
          -8.5,
          0.1,
          150,
        );
        const target = new THREE.Vector3(0, 6.8, 0);
        const hemisphere = new THREE.HemisphereLight(0xe7eaff, 0x302337, 2.2);
        scene.add(hemisphere);
        const key = new THREE.DirectionalLight(0xfff0da, 4.4);
        key.position.set(7, 14, 10);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0x95c7ff, 3);
        rim.position.set(-6, 8, -5);
        scene.add(rim);
        const hardware = createLaunchHardware(latest.current.preparation, true);
        scene.add(hardware.root);
        hardware.root.updateMatrixWorld(true);
        for (const cover of hardware.halves)
          cover.traverse((object: THREE.Object3D) => {
            if (object instanceof THREE.Mesh)
              object.material = Array.isArray(object.material)
                ? object.material.map((material) => material.clone())
                : object.material.clone();
          });
        const parts = hardware.assemblyParts as Record<
          RocketPartId,
          THREE.Group
        >;
        const bounds = {} as Record<RocketPartId, THREE.Box3>,
          ghosts = {} as Record<RocketPartId, THREE.Group>;
        const poses = {} as Record<RocketPartId, THREE.Vector3>,
          startTime = {} as Partial<Record<RocketPartId, number>>;
        for (const part of ROCKET_PARTS) {
          const source = parts[part.id];
          poses[part.id] = source.position.clone();
          bounds[part.id] = new THREE.Box3().setFromObject(source);
          const ghost = new THREE.Group();
          ghost.matrixAutoUpdate = false;
          ghost.matrix.copy(source.matrixWorld);
          scene.add(ghost);
          ghosts[part.id] = ghost;
          const inverse = source.matrixWorld.clone().invert(),
            dots: THREE.Vector3[] = [];
          source.traverse((object: THREE.Object3D) => {
            if (!(object instanceof THREE.Mesh)) return;
            const edges = new THREE.EdgesGeometry(object.geometry, 25),
              positions = edges.getAttribute("position");
            const transform = new THREE.Matrix4().multiplyMatrices(
              inverse,
              object.matrixWorld,
            );
            for (let i = 0; i < positions.count; i += 2) {
              const a = new THREE.Vector3()
                  .fromBufferAttribute(positions, i)
                  .applyMatrix4(transform),
                b = new THREE.Vector3()
                  .fromBufferAttribute(positions, i + 1)
                  .applyMatrix4(transform);
              const steps = Math.max(
                1,
                Math.min(60, Math.ceil(a.distanceTo(b) / 0.12)),
              );
              for (let n = 0; n <= steps; n++)
                if (dots.length < 10000)
                  dots.push(a.clone().lerp(b, n / steps));
            }
            edges.dispose();
          });
          ghost.add(
            new THREE.Points(
              new THREE.BufferGeometry().setFromPoints(dots),
              new THREE.PointsMaterial({
                color: part.color,
                size: 0.045,
                transparent: true,
                opacity: 0.4,
                sizeAttenuation: true,
                depthWrite: false,
              }),
            ),
          );
        }
        // One WebGL context also renders the shelf previews before the loading screen closes.
        const images: Record<string, string> = {},
          thumbCamera = new THREE.PerspectiveCamera(32, 1.6, 0.01, 1000);
        const thumbScene = new THREE.Scene();
        thumbScene.add(hemisphere.clone(), key.clone(), rim.clone());
        renderer.setPixelRatio(1);
        renderer.setSize(240, 150, false);
        renderer.setClearColor(0x20182d, 0);
        for (const part of latest.current.onThumbnails ? ROCKET_PARTS : []) {
          const model = parts[part.id].clone(true);
          model.position.set(0, 0, 0);
          model.visible = true;
          thumbScene.add(model);
          const box = new THREE.Box3().setFromObject(model),
            centre = box.getCenter(new THREE.Vector3()),
            size = box.getSize(new THREE.Vector3());
          const distance = Math.max(size.y, size.x / 1.6, size.z) * 2.2;
          thumbCamera.position
            .copy(centre)
            .add(
              new THREE.Vector3(1, 0.45, 1.9)
                .normalize()
                .multiplyScalar(Math.max(0.7, distance)),
            );
          thumbCamera.lookAt(centre);
          renderer.render(thumbScene, thumbCamera);
          images[part.id] = renderer.domElement.toDataURL("image/webp");
          thumbScene.remove(model);
        }
        latest.current.onThumbnails?.(images);
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
        renderer.setClearColor(0x151426, 1);
        const floor = new THREE.Mesh(
          new THREE.CircleGeometry(9, 64),
          new THREE.MeshStandardMaterial({
            color: 0x25213b,
            metalness: 0.35,
            roughness: 0.65,
          }),
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.47;
        scene.add(floor);
        const grid = new THREE.GridHelper(18, 18, 0x625477, 0x302c46);
        grid.position.y = -0.46;
        scene.add(grid);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = false;
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.minPolarAngle = Math.PI * 0.35;
        controls.maxPolarAngle = Math.PI * 0.54;
        let seenInstalled = new Set<RocketPartId>(latest.current.installed),
          lastBay: boolean | undefined,
          lastViewKey: number | undefined,
          dirty = true,
          last = 0;
        const project = () => {
          if (!latest.current.onSockets) return;
          const w = Math.max(1, mount.clientWidth),
            h = Math.max(1, mount.clientHeight),
            sockets: RocketSockets = {};
          for (const part of ROCKET_PARTS) {
            const box = bounds[part.id],
              centre = box.getCenter(new THREE.Vector3()),
              p = centre.project(camera);
            const points: THREE.Vector3[] = [];
            for (const x of [box.min.x, box.max.x])
              for (const y of [box.min.y, box.max.y])
                for (const z of [box.min.z, box.max.z])
                  points.push(new THREE.Vector3(x, y, z).project(camera));
            const width =
                (Math.max(...points.map((p) => p.x)) -
                  Math.min(...points.map((p) => p.x))) *
                50,
              height =
                (Math.max(...points.map((p) => p.y)) -
                  Math.min(...points.map((p) => p.y))) *
                50;
            const ax = (p.x + 1) * 50,
              ay = (1 - p.y) * 50;
            const offset =
              part.id === "cover-left"
                ? -66
                : part.id === "cover-right"
                  ? 66
                  : part.id === "lander"
                    ? -65
                    : part.id === "rover"
                      ? 65
                      : part.id === "capsule"
                        ? -60
                        : 0;
            sockets[part.id] = {
              x: ax + (offset / w) * 100,
              y: ay,
              anchorX: ax,
              anchorY: ay,
              width: Math.max((28 / w) * 100, width),
              height: Math.max((28 / h) * 100, height),
            };
          }
          latest.current.onSockets(sockets);
        };
        const fit = () => {
          const bay = !!latest.current.bayView,
            w = Math.max(1, mount.clientWidth),
            h = Math.max(1, mount.clientHeight),
            height = bay ? 5.7 : 16.1;
          camera.left = (-height * w) / h / 2;
          camera.right = (height * w) / h / 2;
          camera.top = height / 2;
          camera.bottom = -height / 2;
          target.set(0, bay ? 10 : 6.75, 0);
          camera.position.set(6, target.y + 1.2, 24);
          controls!.target.copy(target);
          camera.lookAt(target);
          camera.updateProjectionMatrix();
          controls!.update();
          lastBay = bay;
          lastViewKey = latest.current.viewKey;
          project();
          dirty = true;
        };
        const apply = () => {
          controls!.enabled = !isEngineFrozen();
          const installed = new Set(latest.current.installed);
          for (const part of ROCKET_PARTS) {
            const present = installed.has(part.id),
              object = parts[part.id];
            object.visible = present;
            ghosts[part.id].visible = !present && !latest.current.readOnly;
            if (present && !seenInstalled.has(part.id))
              startTime[part.id] = performance.now();
            object.traverse((child) => {
              if (!(child instanceof THREE.Mesh) || !COVERS.includes(part.id))
                return;
              const materials = Array.isArray(child.material)
                ? child.material
                : [child.material];
              for (const material of materials) {
                material.transparent = !!latest.current.inside;
                material.opacity = latest.current.inside ? 0.12 : 1;
                material.depthWrite = !latest.current.inside;
              }
            });
          }
          seenInstalled = installed;
          if (
            lastBay !== !!latest.current.bayView ||
            lastViewKey !== latest.current.viewKey
          )
            fit();
          dirty = true;
          wake();
        };
        const render = (time: number) => {
          frame = 0;
          if (disposed || document.hidden || isEngineFrozen()) return;
          const animate =
            !latest.current.gentle &&
            !matchMedia("(prefers-reduced-motion: reduce)").matches;
          let moving = false;
          for (const part of ROCKET_PARTS) {
            const started = startTime[part.id],
              object = parts[part.id];
            const t =
              started === undefined ? 1 : Math.min(1, (time - started) / 320);
            object.position.copy(poses[part.id]);
            if (t < 1 && animate) {
              object.position.x +=
                (part.id === "cover-right" ? -1 : 1) * 1.4 * (1 - t) ** 3;
              moving = true;
            }
          }
          if (dirty || moving || time - last > 400) {
            renderer!.render(scene!, camera);
            last = time;
            dirty = false;
          }
          if (moving) frame = requestAnimationFrame(render);
        };
        function wake() {
          if (frame) cancelAnimationFrame(frame);
          if (!disposed && !document.hidden && !isEngineFrozen())
            frame = requestAnimationFrame(render);
        }
        let pausedAt: number | null = null;
        const pause = () => {
          if (pausedAt === null) pausedAt = performance.now();
          if (frame) cancelAnimationFrame(frame);
          frame = 0;
        };
        const resume = () => {
          if (document.hidden || isEngineFrozen()) {
            pause();
            return;
          }
          if (pausedAt !== null) {
            const delta = performance.now() - pausedAt;
            for (const part of ROCKET_PARTS)
              if (startTime[part.id] !== undefined)
                startTime[part.id]! += delta;
            pausedAt = null;
          }
          dirty = true;
          wake();
        };
        const changed = () => {
          project();
          dirty = true;
          wake();
        };
        controls.addEventListener("change", changed);
        repaint.current = apply;
        const resize = () => {
          renderer!.setSize(
            Math.max(1, mount.clientWidth),
            Math.max(1, mount.clientHeight),
            false,
          );
          fit();
          wake();
        };
        observer = new ResizeObserver(resize);
        observer.observe(mount);
        const contextLost = (event: Event) => {
          event.preventDefault();
          pause();
          setFailed(true);
        };
        renderer.domElement.addEventListener("webglcontextlost", contextLost);
        document.addEventListener("visibilitychange", resume);
        window.addEventListener("game-orientation-pause", pause);
        window.addEventListener("game-orientation-resume", resume);
        cleanupScene = () => {
          controls?.removeEventListener("change", changed);
          renderer?.domElement.removeEventListener(
            "webglcontextlost",
            contextLost,
          );
          document.removeEventListener("visibilitychange", resume);
          window.removeEventListener("game-orientation-pause", pause);
          window.removeEventListener("game-orientation-resume", resume);
        };
        resize();
        apply();
        renderer.compile(scene, camera);
        renderer.render(scene, camera);
        latest.current.onReady?.();
        resolveTask();
      } catch {
        if (!disposed) {
          setFailed(true);
          latest.current.onReady?.();
        }
        resolveTask();
      }
    };
    // Yield once so the shared loading shield paints before geometry and shader work.
    const bootstrap = requestAnimationFrame(boot);
    return () => {
      disposed = true;
      cancelAnimationFrame(bootstrap);
      cancelAnimationFrame(frame);
      resolveTask();
      cleanupScene();
      observer?.disconnect();
      controls?.dispose();
      repaint.current = () => {};
      if (scene) disposeGroup(scene);
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
    };
  }, [props.preparation]);
  return (
    <>
      <div
        ref={host}
        className="main-rocket-canvas"
        role="img"
        aria-label="3D launch rocket assembly"
      />
      {failed ? (
        <div className="main-rocket-fallback" role="status">
          <svg viewBox="0 0 180 500" aria-hidden="true">
            <path d="M65 460V172Q65 60 90 22q25 38 25 150v288Z" />
            <path d="M65 210h50M65 270h50M65 400h50M65 460l-7 19m57-19 7 19" />
          </svg>
          <span>3D unavailable. Match the labelled sockets.</span>
        </div>
      ) : null}
    </>
  );
}
