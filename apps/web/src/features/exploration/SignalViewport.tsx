import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  Maximize2,
  LocateFixed,
  RotateCcw,
  Globe2,
  Orbit as OrbitIcon,
} from "lucide-react";
import { useLoadingStore } from "@exo/ui";
import { isEngineFrozen } from "@exo/ui";
import { bodyAt, SIGNAL_ROOT } from "./signalScenario";
import type { SignalScenario, Vec3 } from "./signalScenario";
import { blockedEndpoint, geometryAt } from "./signalGeometry";
import type { StudySite } from "./signalGeometry";
import type { ExplanationState } from "./SignalDiagram";

export type SignalPresentation = "direct" | "relay" | "engineering";
export type CameraView = "overview" | "site" | "earth";
interface Props {
  data: SignalScenario;
  site: StudySite;
  relay: number;
  time: number;
  presentation: SignalPresentation;
  explanation: ExplanationState;
  gentle: boolean;
  all: boolean;
  onReady(): void;
  onToggleAll(): void;
  onSelectRelay(index: number): void;
}
let moonImage: Promise<HTMLImageElement> | undefined;
function loadMoon() {
  return (moonImage ??= new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      moonImage = undefined;
      reject(new Error("NASA Moon texture could not load."));
    };
    image.src = SIGNAL_ROOT + "moon.webp";
  }));
}

export function SignalViewport(props: Props) {
  const mount = useRef<HTMLDivElement>(null),
    siteLabel = useRef<HTMLButtonElement>(null),
    relayLabel = useRef<HTMLButtonElement>(null),
    earthLabel = useRef<HTMLButtonElement>(null);
  const invalidate = useRef<() => void>(() => {});
  const current = useRef(props);
  useEffect(() => {
    current.current = props;
    invalidate.current();
  }, [props]);
  const [view, setView] = useState<CameraView>("site"),
    [failure, setFailure] = useState(""),
    [retry, setRetry] = useState(0);
  const controller = useRef<(view: CameraView) => void>(() => {});
  const choose = (next: CameraView) => {
    if (!isEngineFrozen()) {
      setView(next);
      controller.current(next);
    }
  };
  useEffect(() => {
    controller.current(props.presentation === "direct" ? "site" : "overview");
  }, [props.presentation, props.site.id, props.relay]);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let disposed = false,
      frame = 0,
      cleanup = () => {},
      renderer: THREE.WebGLRenderer | undefined,
      scene: THREE.Scene | undefined;
    const task = (async () => {
      try {
        const image = await loadMoon();
        if (disposed) return;
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          powerPreference: "low-power",
        });
        renderer.setPixelRatio(
          Math.min(devicePixelRatio || 1, innerHeight <= 450 ? 1.25 : 1.75),
        );
        renderer.setClearColor(0x090816, 0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        renderer.domElement.tabIndex = 0;
        renderer.domElement.setAttribute(
          "aria-label",
          "Interactive lunar geometry. Drag to orbit, scroll or pinch to zoom. Use the adjacent route summary for visibility states.",
        );
        host.prepend(renderer.domElement);
        scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, 1, 0.005, 1000);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableDamping = false;
        controls.minDistance = 1.15;
        controls.maxDistance = 700;
        const texture = new THREE.Texture(image);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        texture.anisotropy = Math.min(
          8,
          renderer.capabilities.getMaxAnisotropy(),
        );
        const moon = new THREE.Mesh(
          new THREE.SphereGeometry(1, 96, 64),
          new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }),
        );
        scene.add(moon);
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambient);
        const light = new THREE.DirectionalLight(0xfff7ea, 2.8);
        scene.add(light);
        const earth = new THREE.Mesh(
          new THREE.SphereGeometry(
            props.data.manifest.earthRadius / props.data.manifest.radius,
            48,
            32,
          ),
          new THREE.MeshStandardMaterial({ color: 0x6b9fbd, roughness: 1 }),
        );
        scene.add(earth);
        const siteMarker = new THREE.Mesh(
          new THREE.SphereGeometry(0.023, 16, 12),
          new THREE.MeshBasicMaterial({ color: 0xffdf89 }),
        );
        scene.add(siteMarker);
        const siteHalo = new THREE.Mesh(
          new THREE.RingGeometry(0.045, 0.052, 48),
          new THREE.MeshBasicMaterial({
            color: 0xffdf89,
            side: THREE.DoubleSide,
          }),
        );
        scene.add(siteHalo);
        const relays = Array.from({ length: 5 }, () => {
          const group = new THREE.Group();
          const core = new THREE.Mesh(
            new THREE.BoxGeometry(0.055, 0.065, 0.055),
            new THREE.MeshBasicMaterial({ color: 0xf5b1ed }),
          );
          group.add(core);
          const panel = new THREE.Mesh(
            new THREE.BoxGeometry(0.23, 0.045, 0.008),
            new THREE.MeshBasicMaterial({ color: 0xb687dd }),
          );
          group.add(panel);
          scene!.add(group);
          return group;
        });
        const v = (p: Vec3) =>
          new THREE.Vector3(p[0], p[2], -p[1]).divideScalar(
            props.data.manifest.radius,
          );
        const orbitBounds: THREE.Sphere[] = [];
        const orbitLines = Array.from({ length: 5 }, (_, index) => {
          const points = Array.from({ length: 433 }, (_, i) =>
            v(
              bodyAt(
                props.data,
                (props.data.manifest.duration * i) / 432,
                index,
              ),
            ),
          );
          const box = new THREE.Box3().setFromPoints(points);
          box.expandByPoint(new THREE.Vector3(-1, -1, -1));
          box.expandByPoint(new THREE.Vector3(1, 1, 1));
          orbitBounds.push(box.getBoundingSphere(new THREE.Sphere()));
          const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({
              color: 0xb986d9,
              transparent: true,
              opacity: 0.2,
            }),
          );
          scene!.add(line);
          return line;
        });
        const lines = Array.from({ length: 3 }, () => {
          const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(),
              new THREE.Vector3(),
            ]),
            new THREE.LineDashedMaterial({
              color: 0x8ce2c2,
              transparent: true,
              dashSize: 0.08,
              gapSize: 0.04,
            }),
          );
          scene!.add(line);
          return line;
        });
        const pulse = new THREE.Mesh(
          new THREE.SphereGeometry(0.024, 12, 8),
          new THREE.MeshBasicMaterial({ color: 0xa1f2d3 }),
        );
        scene.add(pulse);
        const blockMarker = new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-1, -1, 0),
            new THREE.Vector3(1, 1, 0),
            new THREE.Vector3(-1, 1, 0),
            new THREE.Vector3(1, -1, 0),
          ]),
          new THREE.LineBasicMaterial({ color: 0xffa6af, depthTest: false }),
        );
        scene.add(blockMarker);
        let dirty = true,
          rendered = false,
          geometrySignature = "";
        invalidate.current = () => {
          dirty = true;
        };
        const targetPosition = new THREE.Vector3(),
          targetLook = new THREE.Vector3();
        let tween = false,
          cameraView: CameraView = "site";
        controller.current = (next) => {
          dirty = true;
          cameraView = next;
          setView(next);
          const p = current.current,
            g = geometryAt(p.data, p.time, p.site, p.relay),
            surface = v(g.surface),
            e = v(g.earth);
          if (next === "earth") {
            targetLook.copy(e).multiplyScalar(0.5);
            const perpendicular = new THREE.Vector3(0, 1, 0)
              .cross(e)
              .normalize();
            targetPosition
              .copy(targetLook)
              .addScaledVector(perpendicular, e.length() * 1.22)
              .add(new THREE.Vector3(0, e.length() * 0.15, 0));
          } else if (next === "overview") {
            const bound = orbitBounds[p.relay];
            targetLook.copy(bound.center);
            const aspect =
              host.clientWidth && host.clientHeight
                ? host.clientWidth / host.clientHeight
                : camera.aspect;
            const halfFov = Math.atan(
              Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
                Math.min(1, aspect),
            );
            const distance = (bound.radius / Math.sin(halfFov)) * 1.35;
            targetPosition
              .copy(targetLook)
              .addScaledVector(
                new THREE.Vector3(1, -0.4, 1.3).normalize(),
                distance,
              );
          } else {
            targetLook.copy(surface).multiplyScalar(0.2);
            targetPosition
              .copy(surface)
              .multiplyScalar(3.4)
              .add(new THREE.Vector3(1.7, 0.2, 2.1));
          }
          controls.minDistance = next === "earth" ? 20 : 1.15;
          controls.maxDistance =
            next === "earth"
              ? 700
              : Math.max(45, targetPosition.distanceTo(targetLook) * 1.6);
          tween = !p.gentle;
          if (!tween) {
            camera.position.copy(targetPosition);
            controls.target.copy(targetLook);
            controls.update();
          }
        };
        controller.current(
          current.current.presentation === "direct" ? "site" : "overview",
        );
        camera.position.copy(targetPosition);
        controls.target.copy(targetLook);
        controls.update();
        tween = false;
        const stopTween = () => {
          tween = false;
        };
        controls.addEventListener("start", stopTween);
        const controlsChanged = () => {
          dirty = true;
        };
        controls.addEventListener("change", controlsChanged);
        const labelBoxes: {
          x: number;
          y: number;
          width: number;
          height: number;
        }[] = [];
        const label = (
          element: HTMLElement | null,
          point: THREE.Vector3,
          kind: "site" | "relay" | "earth",
        ) => {
          if (!element) return;
          const projected = point.clone().project(camera),
            w = host.clientWidth,
            h = host.clientHeight;
          const cameraPoint = point
              .clone()
              .applyMatrix4(camera.matrixWorldInverse),
            behindCamera = cameraPoint.z > 0;
          const offscreen =
            behindCamera ||
            projected.z > 1 ||
            Math.abs(projected.x) > 0.88 ||
            Math.abs(projected.y) > 0.76;
          const occluded =
            point.clone().sub(camera.position).dot(point) > 0 &&
            camera.position.clone().cross(point).length() /
              point.clone().sub(camera.position).length() <
              0.99;
          const width = element.offsetWidth,
            height = element.offsetHeight;
          let rawX = (projected.x * 0.5 + 0.5) * w,
            rawY = (-projected.y * 0.5 + 0.5) * h;
          if (kind === "earth" && offscreen) {
            const dx = cameraPoint.x,
              dy = -cameraPoint.y,
              edge = Math.min(
                (w * 0.5 - width * 0.5 - 12) / Math.max(0.001, Math.abs(dx)),
                (h * 0.5 - height * 0.5 - 58) / Math.max(0.001, Math.abs(dy)),
              );
            rawX = w * 0.5 + dx * Math.max(0, edge) - width * 0.5;
            rawY = h * 0.5 + dy * Math.max(0, edge) - height * 0.5;
          }
          const bearing = element.querySelector<HTMLElement>("[data-bearing]");
          if (bearing)
            bearing.style.transform = `rotate(${Math.atan2(-cameraPoint.y, cameraPoint.x)}rad)`;
          const clampX = (x: number) =>
            Math.max(10, Math.min(w - width - 10, x));
          const clampY = (y: number) =>
            Math.max(
              innerHeight <= 450 ? 28 : 42,
              Math.min(h - height - (innerHeight <= 450 ? 76 : 85), y),
            );
          const candidateX = clampX(rawX),
            candidateY = clampY(rawY);
          const candidates = [
            [candidateX, candidateY],
            [candidateX, candidateY - height - 12],
            [candidateX, candidateY + height + 12],
            [candidateX - width - 14, candidateY],
            [10, 42],
            [w - width - 10, 42],
            [10, h - height - 85],
          ];
          const scored = candidates
            .map(([x, y]) => {
              x = clampX(x);
              y = clampY(y);
              const overlap = labelBoxes.some(
                (box) =>
                  x < box.x + box.width + 8 &&
                  x + width > box.x &&
                  y < box.y + box.height + 8 &&
                  y + height > box.y,
              );
              return {
                x,
                y,
                score:
                  (overlap ? 1e8 : 0) +
                  (x - candidateX) ** 2 +
                  (y - candidateY) ** 2,
              };
            })
            .sort((a, b) => a.score - b.score);
          const { x, y } = scored[0];
          labelBoxes.push({ x, y, width, height });
          element.style.transform = `translate(${x}px,${y}px)`;
          element.dataset.position = offscreen
            ? "offscreen"
            : occluded
              ? "behind"
              : "visible";
          const note = element.querySelector("[data-note]");
          if (note)
            note.textContent =
              kind === "earth"
                ? behindCamera
                  ? "Behind camera · show Earth"
                  : offscreen
                    ? "Outside view · show Earth"
                    : "Earth center reference"
                : offscreen
                  ? "Outside view · locate"
                  : occluded
                    ? "Behind the Moon · locate"
                    : kind === "site"
                      ? "Selected study point"
                      : "Reference design · enlarged icon";
        };
        let last = 0;
        const draw = (now: number) => {
          if (disposed || !renderer || !scene) return;
          const frozen = isEngineFrozen(),
            dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
          last = now;
          controls.enabled = !frozen;
          if ((frozen && rendered) || (!dirty && !tween)) {
            frame = requestAnimationFrame(draw);
            return;
          }
          const p = current.current,
            g = geometryAt(p.data, p.time, p.site, p.relay),
            surface = v(g.surface),
            r = v(g.relay),
            e = v(g.earth);
          siteMarker.position.copy(surface).multiplyScalar(1.008);
          siteHalo.position.copy(surface).multiplyScalar(1.004);
          siteHalo.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            surface.clone().normalize(),
          );
          earth.position.copy(e);
          earth.visible = cameraView === "earth";
          light.position.copy(v(g.sun)).normalize().multiplyScalar(100);
          relays.forEach((object, i) => {
            object.visible =
              p.presentation !== "direct" && (p.all || i === p.relay);
            object.position.copy(v(bodyAt(p.data, p.time, i)));
            object.scale.setScalar(
              Math.max(1, camera.position.distanceTo(object.position) * 0.035),
            );
            orbitLines[i].visible =
              p.presentation !== "direct" && (p.all || i === p.relay);
            orbitLines[i].material.opacity = i === p.relay ? 0.65 : 0.12;
            orbitLines[i].material.color.set(
              i === p.relay ? "#e7a3ed" : "#81708e",
            );
          });
          const pairs: [Vec3, Vec3, boolean][] = [
            [g.surface, g.relay, g.up],
            [g.relay, g.earth, g.down],
            [g.surface, g.earth, g.direct],
          ];
          const signature = `${p.time}:${p.site.id}:${p.relay}:${p.presentation}`;
          if (signature !== geometrySignature)
            pairs.forEach(([a, b, clear], i) => {
              const line = lines[i];
              // Dashed red rays are explanatory blocked-path guides, not propagated signals.
              line.geometry.setFromPoints([v(a), v(b)]);
              line.geometry.computeBoundingSphere();
              line.computeLineDistances();
              line.material.color.set(
                clear ? (i === 2 ? "#ffdf89" : "#8ce2c2") : "#ee979f",
              );
              line.material.depthTest = clear;
              line.material.opacity = clear ? 1 : 0.65;
              line.material.dashSize = clear ? 1000 : 0.07;
              line.material.gapSize = clear ? 0 : 0.07;
            });
          geometrySignature = signature;
          const engineering = p.presentation === "engineering",
            checked = engineering || p.explanation.phase !== "idle";
          const second =
            engineering ||
            (checked &&
              g.up &&
              (p.explanation.phase === "complete" ||
                p.explanation.progress >= 1));
          lines.forEach((line, i) => {
            line.visible =
              engineering ||
              (checked &&
                (p.presentation === "direct"
                  ? i === 2
                  : i === 0 || (i === 1 && second)));
          });
          const blocked = p.presentation === "direct" ? !g.direct : !g.route;
          blockMarker.visible =
            checked &&
            blocked &&
            (p.presentation === "direct" || !g.up || second);
          if (blockMarker.visible) {
            const impact =
              p.presentation === "direct" || !g.up
                ? g.surface
                : blockedEndpoint(g.relay, g.earth, p.data.manifest.radius);
            blockMarker.position.copy(v(impact));
            blockMarker.quaternion.copy(camera.quaternion);
            blockMarker.scale.setScalar(
              camera.position.distanceTo(blockMarker.position) * 0.009,
            );
          }
          const leg =
            p.presentation === "direct"
              ? 2
              : Math.min(1, Math.floor(p.explanation.progress));
          pulse.visible =
            !engineering &&
            p.explanation.phase === "running" &&
            !p.gentle &&
            (leg !== 1 || g.up);
          if (pulse.visible) {
            const [a, b, clear] = pairs[leg];
            const end = clear
              ? b
              : blockedEndpoint(a, b, p.data.manifest.radius);
            const fraction = Math.min(
              1,
              p.explanation.progress - (p.presentation === "direct" ? 0 : leg),
            );
            pulse.position.copy(v(a)).lerp(v(end), Math.max(0, fraction));
          }
          if (tween && !frozen) {
            const alpha = 1 - Math.exp(-dt * 8);
            camera.position.lerp(targetPosition, alpha);
            controls.target.lerp(targetLook, alpha);
            if (camera.position.distanceTo(targetPosition) < 0.005)
              tween = false;
          }
          controls.update();
          labelBoxes.length = 0;
          label(siteLabel.current, surface, "site");
          if (p.presentation !== "direct")
            label(relayLabel.current, r, "relay");
          label(earthLabel.current, e, "earth");
          renderer.render(scene, camera);
          rendered = true;
          dirty = false;
          frame = requestAnimationFrame(draw);
        };
        const resize = () => {
          dirty = true;
          if (renderer) {
            if (!host.clientWidth || !host.clientHeight) return;
            renderer.setSize(host.clientWidth, host.clientHeight);
            camera.aspect = host.clientWidth / host.clientHeight;
            camera.updateProjectionMatrix();
            if (
              current.current.presentation === "engineering" &&
              cameraView === "overview"
            )
              controller.current("overview");
          }
        };
        const observer = new ResizeObserver(resize);
        observer.observe(host);
        resize();
        const lost = (event: Event) => {
          event.preventDefault();
          cancelAnimationFrame(frame);
          setFailure(
            "The 3D view lost its graphics context. The geometry summary below remains available.",
          );
        };
        renderer.domElement.addEventListener("webglcontextlost", lost);
        let pointerStart: [number, number] | undefined;
        const pointerDown = (event: PointerEvent) => {
          pointerStart = [event.clientX, event.clientY];
        };
        const pick = (event: PointerEvent) => {
          if (isEngineFrozen()) return;
          if (
            pointerStart &&
            Math.hypot(
              event.clientX - pointerStart[0],
              event.clientY - pointerStart[1],
            ) > 5
          )
            return;
          const rect = renderer!.domElement.getBoundingClientRect(),
            ray = new THREE.Raycaster();
          ray.params.Line.threshold = 0.05;
          ray.setFromCamera(
            new THREE.Vector2(
              ((event.clientX - rect.left) / rect.width) * 2 - 1,
              (-(event.clientY - rect.top) / rect.height) * 2 + 1,
            ),
            camera,
          );
          const hits = ray.intersectObjects(
            [moon, ...relays.filter((object) => object.visible)],
            true,
          );
          if (hits.length) {
            const i = relays.findIndex(
              (group) => group === hits[0].object.parent,
            );
            if (i >= 0) current.current.onSelectRelay(i);
          }
        };
        renderer.domElement.addEventListener("pointerdown", pointerDown);
        renderer.domElement.addEventListener("click", pick);
        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          controls.dispose();
          texture.dispose();
          renderer?.domElement.removeEventListener("webglcontextlost", lost);
          renderer?.domElement.removeEventListener("click", pick);
          renderer?.domElement.removeEventListener("pointerdown", pointerDown);
        };
        await renderer.compileAsync(scene, camera);
        if (!disposed) draw(performance.now());
      } catch (error) {
        if (!disposed) setFailure(`3D view unavailable. ${String(error)}`);
      } finally {
        if (!disposed) current.current.onReady();
      }
    })();
    useLoadingStore.getState().registerLoaderTask(task);
    return () => {
      disposed = true;
      invalidate.current = () => {};
      cleanup();
      scene?.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [props.data, retry]);

  const g = geometryAt(props.data, props.time, props.site, props.relay);
  const fallbackScale =
    110 / Math.max(props.data.manifest.radius, Math.hypot(...g.relay));
  const projected = (p: Vec3) => [
    200 + p[0] * fallbackScale,
    140 - p[2] * fallbackScale,
  ];
  const fs = projected(g.surface),
    fr = projected(g.relay);
  const showRelay = props.presentation !== "direct";
  return (
    <section className="lunar-stage" aria-label="Lunar orbit visualization">
      <div className="lunar-stage-top">
        <span>
          <i /> {failure ? "GEOMETRY VIEW" : "3D EXPLORER"}
        </span>
        <span>Reference study · Mar 2027</span>
      </div>
      <div className="lunar-canvas" ref={mount}>
        {!failure && (
          <>
            <div className="lunar-moon-label">
              THE MOON<span>NASA LRO surface imagery</span>
            </div>
            <button
              className="lunar-object-label lunar-site-label"
              ref={siteLabel}
              onClick={() => choose("site")}
            >
              <i />
              {props.site.name}
              <small data-note>Selected study point</small>
            </button>
            {showRelay && (
              <button
                className="lunar-object-label lunar-relay-label"
                ref={relayLabel}
                onClick={() => choose("overview")}
              >
                <i />
                Satellite {props.relay + 1}
                <small data-note>Reference satellite</small>
              </button>
            )}
            <button
              className="lunar-object-label lunar-earth-label"
              aria-label="Locate Earth in the Earth–Moon view"
              ref={earthLabel}
              onClick={() => choose("earth")}
            >
              <span data-bearing>→</span>
              {view === "earth" ? "EARTH" : "EARTH DIRECTION"}
              <small data-note>Earth center reference</small>
            </button>
          </>
        )}
        {failure && (
          <div className="lunar-fallback" role="status">
            <h2>2D geometry view</h2>
            <svg
              viewBox="0 0 400 280"
              role="img"
              aria-label="Moon-centered X-Z projection with a consistent distance scale. Earth direction is a separate reference."
            >
              <circle
                cx="200"
                cy="140"
                r={props.data.manifest.radius * fallbackScale}
                fill="#968d9c"
              />
              {showRelay && (
                <line
                  x1={fs[0]}
                  y1={fs[1]}
                  x2={fr[0]}
                  y2={fr[1]}
                  stroke={g.up ? "#a2e8ce" : "#eea3ab"}
                  strokeDasharray={g.up ? undefined : "4 4"}
                />
              )}
              <circle cx={fs[0]} cy={fs[1]} r="4" fill="#ffdf89" />
              {showRelay && (
                <>
                  <circle cx={fr[0]} cy={fr[1]} r="5" fill="#ed9ae7" />
                  <text x={fr[0] + 9} y={fr[1] + 4} fill="#ed9ae7">
                    Satellite {props.relay + 1}
                  </text>
                </>
              )}
              <text x="10" y="20" fill="#c9b6d3">
                X–Z PROJECTION · POSITIONS TO ONE SCALE
              </text>
            </svg>
            <p>{failure}</p>
            <p>
              {props.presentation === "direct"
                ? `Direct path: ${g.direct ? "clear" : "Moon-blocked"}.`
                : `Site → satellite: ${g.up ? "clear" : "Moon-blocked"}. Satellite → Earth: ${g.down ? "clear" : "Moon-blocked"}.`}{" "}
              Direct to Earth: {g.direct ? "clear" : "Moon-blocked"}. Positions
              use the same calculated geometry.
            </p>
            <button
              onClick={() => {
                setFailure("");
                setRetry((n) => n + 1);
              }}
            >
              Retry 3D view
            </button>
          </div>
        )}
      </div>
      <div className="lunar-stage-bottom">
        <div className="lunar-camera-controls" aria-label="Camera presets">
          <button
            aria-label="Site view"
            aria-pressed={view === "site"}
            onClick={() => choose("site")}
          >
            <LocateFixed size={15} />
            <span>Moon site</span>
          </button>
          {showRelay && (
            <button
              aria-label="Orbit view"
              aria-pressed={view === "overview"}
              onClick={() => choose("overview")}
            >
              <Maximize2 size={15} />
              <span>Satellite orbit</span>
            </button>
          )}
          <button
            aria-label="Earth–Moon"
            aria-pressed={view === "earth"}
            onClick={() => choose("earth")}
          >
            <Globe2 size={15} />
            <span>Earth</span>
          </button>
          <button aria-label="Reset camera view" onClick={() => choose(view)}>
            <RotateCcw size={15} />
          </button>
          {showRelay && (
            <button
              aria-label="Show the whole constellation"
              aria-pressed={props.all}
              onClick={() => {
                if (!isEngineFrozen()) props.onToggleAll();
              }}
            >
              <OrbitIcon />
              <span>All satellites</span>
            </button>
          )}
        </div>
        <span className="lunar-camera-hint">
          Drag to orbit · scroll to zoom
        </span>
      </div>
      <div className="lunar-scale-note">
        {(props.presentation === "engineering" ||
          props.explanation.phase !== "idle") &&
        (props.presentation === "direct"
          ? !g.direct
          : !g.route || (props.presentation === "engineering" && !g.direct)) ? (
          <strong>× Dashed red = blocked path guide</strong>
        ) : view === "earth" ? (
          "One distance scale · enlarged markers"
        ) : (
          "Positions to scale · enlarged markers"
        )}
      </div>
    </section>
  );
}
