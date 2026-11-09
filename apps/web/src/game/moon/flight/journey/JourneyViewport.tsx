import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createCrewedPlatform } from "@/game/moon/crew/crewedMeshes";
import { disposeGroup } from "@/game/moon/workshop/lander/workshopMeshes";
import { coastFraction, getLoiRequiredDv } from "./journey.ts";
import type { JourneyState } from "./journey.ts";
import type { PreparationSelection } from "@/game/moon/core/design";
import { transferSolution, LUNAR_ORBIT_TIERS } from "./transferModel.ts";
import { useLoadingStore } from "@exo/ui";
import { isEngineFrozen } from "@exo/ui";
import { SceneFallback } from "@exo/ui";

export function JourneyViewport({
  journey,
  gentle,
}: {
  journey: JourneyState;
  preparation: PreparationSelection;
  gentle: boolean;
}) {
  const initialMode = journey.stage === "route" ? "trajectory" : "craft";
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(journey),
    view = useRef<"craft" | "trajectory">(initialMode);
  const [mode, setMode] = useState<"craft" | "trajectory">(initialMode),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    latest.current = journey;
  }, [journey]);
  useEffect(() => {
    view.current = mode;
  }, [mode]);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let disposed = false,
      frame = 0,
      renderer: THREE.WebGLRenderer | undefined,
      scene: THREE.Scene | undefined,
      controls: OrbitControls | undefined;
    let cleanup = () => {};
    const task = (async () => {
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          powerPreference: "low-power",
        });
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
        renderer.setClearColor("#040814");
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        mount.appendChild(renderer.domElement);
        scene = new THREE.Scene();
        scene.add(new THREE.AmbientLight(0xa9bddc, 1.3));
        const light = new THREE.DirectionalLight(0xfff1d8, 3.5);
        scene.add(light);
        const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 5000);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableDamping = false;
        controls.minDistance = 2;
        controls.maxDistance = 1200;
        let earthTexture: THREE.Texture | undefined;
        try {
          earthTexture = await new THREE.TextureLoader().loadAsync(
            `${import.meta.env.BASE_URL}story/flight/earth-blue-marble.jpg`,
          );
          earthTexture.colorSpace = THREE.SRGBColorSpace;
        } catch (e) {
          console.warn(
            "Could not load earth texture, falling back to blue marble tone",
            e,
          );
        }
        if (disposed) {
          earthTexture?.dispose();
          return;
        }
        const earthMat = earthTexture
          ? new THREE.MeshStandardMaterial({ map: earthTexture, roughness: 1 })
          : new THREE.MeshStandardMaterial({
              color: 0x274e82,
              roughness: 0.9,
              metalness: 0.1,
            });
        const earth = new THREE.Mesh(
          new THREE.SphereGeometry(6.378137, 64, 48),
          earthMat,
        );
        scene.add(earth);
        const moon = new THREE.Mesh(
          new THREE.SphereGeometry(1.7374, 64, 48),
          new THREE.MeshStandardMaterial({ color: 0xaaa6a2, roughness: 1 }),
        );
        scene.add(moon);
        // Procedural relief is illustrative; trajectory positions use the ephemeris.
        const pos = moon.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i),
            y = pos.getY(i),
            z = pos.getZ(i),
            f =
              1 +
              0.003 * Math.sin(x * 37) * Math.cos(z * 29) * Math.sin(y * 31);
          pos.setXYZ(i, x * f, y * f, z * f);
        }
        moon.geometry.computeVertexNormals();
        const crew = createCrewedPlatform(),
          ship = crew.root;
        crew.capsule.position.set(0, 0, 0);
        crew.lander.position.set(0, 5.7, 0);
        crew.lander.rotation.z = Math.PI;
        crew.lander.scale.setScalar(0.7);
        ship.scale.setScalar(0.22);
        scene.add(ship);
        const plume = new THREE.Mesh(
          new THREE.ConeGeometry(0.5, 5, 24),
          new THREE.MeshBasicMaterial({
            color: 0x96dbff,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        plume.position.y = -3.5;
        ship.add(plume);
        const guide = new THREE.ArrowHelper(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(),
          2,
          0x8ce2c2,
          0.25,
          0.15,
        );
        scene.add(guide);
        const starPositions = [];
        for (let i = 0; i < 1200; i++) {
          const a = i * 2.399,
            b = Math.acos(1 - (2 * (i + 0.5)) / 1200);
          starPositions.push(
            1800 * Math.sin(b) * Math.cos(a),
            1800 * Math.cos(b),
            1800 * Math.sin(b) * Math.sin(a),
          );
        }
        const stars = new THREE.BufferGeometry();
        stars.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(starPositions, 3),
        );
        scene.add(
          new THREE.Points(
            stars,
            new THREE.PointsMaterial({
              size: 1,
              color: 0xbccdf0,
              sizeAttenuation: false,
            }),
          ),
        );
        const line = new THREE.Line(
          new THREE.BufferGeometry(),
          new THREE.LineBasicMaterial({
            color: 0x8ce2c2,
            transparent: true,
            opacity: 0.7,
          }),
        );
        scene.add(line);
        const beacon = new THREE.Group();
        const beaconMat = new THREE.MeshBasicMaterial({
          color: 0x8ce2c2,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const outerRing = new THREE.Mesh(
          new THREE.RingGeometry(5.8, 7.2, 48),
          beaconMat,
        );
        beacon.add(outerRing);
        const innerRing = new THREE.Mesh(
          new THREE.RingGeometry(2.8, 3.6, 32),
          beaconMat,
        );
        beacon.add(innerRing);
        for (let i = 0; i < 4; i++) {
          const tick = new THREE.Mesh(
            new THREE.PlaneGeometry(0.5, 2.2),
            beaconMat,
          );
          const ang = (i * Math.PI) / 2;
          tick.position.set(Math.cos(ang) * 8.2, Math.sin(ang) * 8.2, 0);
          tick.rotation.z = ang + Math.PI / 2;
          beacon.add(tick);
        }
        beacon.visible = false;
        scene.add(beacon);
        const lunarOrbitRing = new THREE.LineLoop(
          new THREE.BufferGeometry(),
          new THREE.LineBasicMaterial({
            color: 0x8ce2c2,
            transparent: true,
            opacity: 0.85,
          }),
        );
        lunarOrbitRing.visible = false;
        scene.add(lunarOrbitRing);
        let orbitClock = 0,
          lastTime = 0;
        let previous = "",
          previousMode = "",
          previousArrival = false,
          lastPosition = new THREE.Vector3();
        controls.addEventListener("start", () => {});
        const resize = () => {
          if (!renderer) return;
          renderer.setSize(
            Math.max(1, mount.clientWidth),
            Math.max(1, mount.clientHeight),
            false,
          );
          camera.aspect =
            Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight);
          camera.updateProjectionMatrix();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(mount);
        resize();
        const paint = () => {
          frame = 0;
          if (disposed) return;
          frame = requestAnimationFrame(paint);
          if (document.hidden || isEngineFrozen()) {
            lastTime = 0;
            return;
          }
          try {
            const now = performance.now();
            if (lastTime && !latest.current.paused && !gentle)
              orbitClock += Math.min(0.05, (now - lastTime) / 1000);
            lastTime = now;
            const j = latest.current,
              s = transferSolution(j.date, j.route ?? "balanced"),
              key = `${j.date}-${j.route}-${j.orbitTier ?? "low"}`,
              v = view.current;
            const isTrajectory = v === "trajectory";
            const rawPoint = (p: number[]) => {
              if (!p || p.length < 3) return new THREE.Vector3(0, 0, 0);
              return new THREE.Vector3(p[0] / 1000, p[2] / 1000, -p[1] / 1000);
            };
            const targetDest =
              s && s.moonPath && s.moonPath.length > 0
                ? rawPoint(s.moonPath[s.moonPath.length - 1])
                : new THREE.Vector3(380, 0, 0);
            const lunarTier =
              LUNAR_ORBIT_TIERS[j.orbitTier ?? "low"] ?? LUNAR_ORBIT_TIERS.low;
            const lunarClearance = lunarTier.clearanceOffset;
            const targetRadius = 1.7374 + lunarClearance;
            const approachDist = targetRadius + 6.0;
            const clearanceRadius = 6.378137 + 1.45;
            const point = (p: number[], idx?: number) => {
              const pt = rawPoint(p);
              const r = pt.length();
              if (r < clearanceRadius && r > 0.01) {
                pt.multiplyScalar(clearanceRadius / r);
              } else if (idx !== undefined && idx < 6 && r < 30) {
                const t = idx / 6;
                const base = pt
                  .clone()
                  .normalize()
                  .multiplyScalar(clearanceRadius);
                pt.lerp(base, (1 - t) * 0.4);
              }
              if (targetDest) {
                const rel = pt.clone().sub(targetDest);
                const moonDist = rel.length();
                if (moonDist < 25 && moonDist > 0.01) {
                  const factor = Math.max(0, Math.min(1, (25 - moonDist) / 20));
                  const targetD = THREE.MathUtils.lerp(
                    moonDist,
                    approachDist,
                    factor,
                  );
                  pt.copy(
                    targetDest
                      .clone()
                      .add(rel.multiplyScalar(targetD / moonDist)),
                  );
                }
              }
              return pt;
            };

            const arrival = j.stage.startsWith("loi") || j.stage === "complete";
            lunarOrbitRing.visible = arrival;

            if (key !== previous) {
              line.geometry.dispose();
              line.geometry = new THREE.BufferGeometry().setFromPoints(
                s ? s.path.map((p, idx) => point(p, idx)) : [],
              );
              const ringPts: THREE.Vector3[] = [];
              const segs = 128;
              for (let i = 0; i <= segs; i++) {
                const theta = (i / segs) * Math.PI * 2;
                ringPts.push(
                  new THREE.Vector3(
                    targetDest.x - Math.cos(theta) * targetRadius,
                    targetDest.y + Math.sin(theta) * 0.35 * targetRadius,
                    targetDest.z - Math.sin(theta) * targetRadius,
                  ),
                );
              }
              lunarOrbitRing.geometry.dispose();
              lunarOrbitRing.geometry =
                new THREE.BufferGeometry().setFromPoints(ringPts);
              previous = key;
              previousMode = "";
            }

            const isAligned = Math.abs(j.angle ?? 0) <= 8;
            const isTliBurn = j.stage === "tli-burn" && !!s;
            const isLoiBurn = j.stage === "loi-burn" && !!s;

            let shipPosition: THREE.Vector3;
            let delta: THREE.Vector3;

            if (isTliBurn && s) {
              const reqTli = s?.tliMS || 3149;
              const burnProgress = isAligned
                ? Math.min(1, Math.max(0, (j.dv ?? 0) / reqTli))
                : 0;
              const tliPointsCount = Math.min(6, s.path.length - 1);
              const tliStep = burnProgress * tliPointsCount;
              const pA = Math.floor(tliStep);
              const pB = Math.min(s.path.length - 1, pA + 1);
              const f = tliStep - pA;
              const p1 = point(s.path[pA], pA);
              const p2 = point(s.path[pB], pB);
              shipPosition = p1.clone().lerp(p2, f);
              delta = p2.clone().sub(p1);
              if (delta.lengthSq() < 1e-4) delta.set(1, 0, 0);
              delta.normalize();
            } else if (isLoiBurn && s) {
              const reqLoi = getLoiRequiredDv(j, s?.loiMS || 890);
              const burnProgress = isAligned
                ? Math.min(1, Math.max(0, (j.dv ?? 0) / reqLoi))
                : 0;
              const smoothP = THREE.MathUtils.smoothstep(burnProgress, 0, 1);
              const currentR = THREE.MathUtils.lerp(
                approachDist,
                targetRadius,
                smoothP,
              );
              const currentAngle = smoothP * Math.PI * 0.9;
              shipPosition = new THREE.Vector3(
                targetDest.x - Math.cos(currentAngle) * currentR,
                targetDest.y + Math.sin(currentAngle) * 0.35 * currentR,
                targetDest.z - Math.sin(currentAngle) * currentR,
              );
              const dTheta = 0.05;
              const nextR = THREE.MathUtils.lerp(
                approachDist,
                targetRadius,
                Math.min(1, smoothP + 0.02),
              );
              const nextPos = new THREE.Vector3(
                targetDest.x - Math.cos(currentAngle + dTheta) * nextR,
                targetDest.y + Math.sin(currentAngle + dTheta) * 0.35 * nextR,
                targetDest.z - Math.sin(currentAngle + dTheta) * nextR,
              );
              delta = nextPos.sub(shipPosition);
              if (delta.lengthSq() < 1e-4) delta.set(1, 0, 0);
              delta.normalize();
            } else if (j.stage === "complete") {
              const orbitAngle = Math.PI * 0.9 + orbitClock * 0.35;
              shipPosition = new THREE.Vector3(
                targetDest.x - Math.cos(orbitAngle) * targetRadius,
                targetDest.y + Math.sin(orbitAngle) * 0.35 * targetRadius,
                targetDest.z - Math.sin(orbitAngle) * targetRadius,
              );
              const nextPos = new THREE.Vector3(
                targetDest.x - Math.cos(orbitAngle + 0.05) * targetRadius,
                targetDest.y +
                  Math.sin(orbitAngle + 0.05) * 0.35 * targetRadius,
                targetDest.z - Math.sin(orbitAngle + 0.05) * targetRadius,
              );
              delta = nextPos.sub(shipPosition);
              if (delta.lengthSq() < 1e-4) delta.set(1, 0, 0);
              delta.normalize();
            } else if (j.stage === "loi-window" && s) {
              shipPosition = new THREE.Vector3(
                targetDest.x - approachDist,
                targetDest.y,
                targetDest.z,
              );
              delta = new THREE.Vector3(0, 0.35, -1).normalize();
            } else if (s) {
              const index = Math.min(
                s.path.length - 1,
                Math.round(coastFraction(j) * (s.path.length - 1)),
              );
              shipPosition = point(s.path[index], index);
              delta =
                index < s.path.length - 1
                  ? point(s.path[index + 1], index + 1)
                      .clone()
                      .sub(shipPosition)
                  : new THREE.Vector3(1, 0, 0);
              if (delta.lengthSq() < 1e-4) delta.set(1, 0, 0);
              delta.normalize();
            } else {
              shipPosition = new THREE.Vector3(0, clearanceRadius, 0);
              delta = new THREE.Vector3(1, 0, 0);
            }

            ship.position.copy(shipPosition);
            moon.position.copy(targetDest);

            // In Trajectory view, scale craft and animate locator beacon
            ship.scale.setScalar(isTrajectory ? 2.4 : 0.22);
            if (isTrajectory) {
              beacon.visible = true;
              beacon.position.copy(shipPosition);
              beacon.quaternion.copy(camera.quaternion);
              const pulse = 1 + 0.12 * Math.sin(performance.now() * 0.006);
              beacon.scale.setScalar(pulse);
            } else {
              beacon.visible = false;
            }

            const outward = shipPosition
              .clone()
              .sub(arrival ? targetDest : new THREE.Vector3());
            if (outward.lengthSq() < 1e-4) outward.set(0, 1, 0);
            outward.normalize();

            // In LOI burn, backward thrust (nozzle at -Y) points OPPOSITE to Moon:
            // Therefore forward nose (+Y) points toward the Moon:
            const toMoon = targetDest.clone().sub(shipPosition).normalize();
            const prograde = isLoiBurn
              ? toMoon
              : delta.clone().multiplyScalar(arrival ? -1 : 1);
            if (prograde.lengthSq() < 1e-4) prograde.set(1, 0, 0);
            prograde.normalize();

            let right = prograde.clone().cross(outward);
            if (right.lengthSq() < 1e-4) {
              right = prograde.clone().cross(new THREE.Vector3(0, 1, 0));
              if (right.lengthSq() < 1e-4) right = new THREE.Vector3(0, 0, 1);
            }
            right.normalize();

            let normalUp = right.clone().cross(prograde);
            if (normalUp.lengthSq() < 1e-4) normalUp.set(0, 1, 0);
            normalUp.normalize();

            // Steering (A/D): apply yaw angle around normalUp (local zenith):
            const steeredDirection = prograde
              .clone()
              .applyAxisAngle(normalUp, ((j.angle ?? 0) * Math.PI) / 180)
              .normalize();

            let steeredRight = steeredDirection.clone().cross(normalUp);
            if (steeredRight.lengthSq() < 1e-4) steeredRight = right.clone();
            steeredRight.normalize();

            let steeredUp = steeredRight.clone().cross(steeredDirection);
            if (steeredUp.lengthSq() < 1e-4) steeredUp = normalUp.clone();
            steeredUp.normalize();

            // Construct 3D orientation: Forward = steeredDirection (Y+ in mesh), Up = steeredUp (Z+), Right = steeredRight (X+)
            const rotMatrix = new THREE.Matrix4().makeBasis(
              steeredRight,
              steeredDirection,
              steeredUp,
            );
            ship.quaternion.setFromRotationMatrix(rotMatrix);

            guide.position.copy(shipPosition);
            guide.setDirection(prograde);

            const firing =
              j.version === 2
                ? !!j.firing && !j.paused
                : j.stage.endsWith("burn");
            plume.visible = firing;
            if (firing) {
              const time = performance.now() * 0.02;
              const throttle = j.throttle ?? 0.5;
              const pulse = 1 + 0.08 * Math.sin(time * 3);
              if (isTrajectory) {
                plume.scale.set(
                  (1.2 + throttle * 0.6) * pulse,
                  (2.0 + throttle * 3.5) * (1 + 0.12 * Math.sin(time * 5)),
                  (1.2 + throttle * 0.6) * pulse,
                );
              } else {
                plume.scale.set(
                  (0.7 + throttle * 0.3) * pulse,
                  (0.8 + throttle * 2.2) * (1 + 0.12 * Math.sin(time * 5)),
                  (0.7 + throttle * 0.3) * pulse,
                );
              }
              (plume.material as THREE.MeshBasicMaterial).opacity =
                0.8 + 0.2 * Math.sin(time * 4);
            }

            light.position
              .fromArray(
                (s?.sunDirection ?? [1, 1, 1]) as [number, number, number],
              )
              .multiplyScalar(1000);

            earth.visible = true;
            moon.visible = true;
            ship.visible = true;
            guide.visible = !isTrajectory;
            line.visible = true;

            earth.scale.setScalar(isTrajectory ? 1.4 : 1);
            moon.scale.setScalar(isTrajectory ? 4 : 1);

            if (arrival !== previousArrival) {
              previousMode = "";
              previousArrival = arrival;
            }

            if (v !== previousMode) {
              if (v === "craft") {
                if (arrival) {
                  const camDist = Math.max(targetRadius * 2.8, 14);
                  camera.position.set(
                    targetDest.x - camDist * 0.85,
                    targetDest.y + camDist * 0.45,
                    targetDest.z + camDist * 0.75,
                  );
                  controls!.target.copy(targetDest);
                } else {
                  let corridorDir = targetDest.clone().sub(shipPosition);
                  if (corridorDir.lengthSq() < 1e-4)
                    corridorDir = new THREE.Vector3(1, 0, 0);
                  corridorDir.normalize();

                  let corridorRight = corridorDir.clone().cross(normalUp);
                  if (corridorRight.lengthSq() < 1e-4) {
                    corridorRight = corridorDir
                      .clone()
                      .cross(new THREE.Vector3(0, 1, 0));
                    if (corridorRight.lengthSq() < 1e-4)
                      corridorRight = new THREE.Vector3(0, 0, 1);
                  }
                  corridorRight.normalize();

                  let corridorUp = corridorRight.clone().cross(corridorDir);
                  if (corridorUp.lengthSq() < 1e-4)
                    corridorUp = normalUp.clone();
                  corridorUp.normalize();

                  const camOffset = corridorDir
                    .clone()
                    .multiplyScalar(-5.5)
                    .add(corridorUp.clone().multiplyScalar(2.0))
                    .add(corridorRight.clone().multiplyScalar(0.4));
                  camera.position.copy(shipPosition).add(camOffset);
                  controls!.target.copy(shipPosition);
                }
              } else {
                const points = s
                  ? [...s.path.map((p, idx) => point(p, idx)), targetDest]
                  : [new THREE.Vector3(), targetDest];
                const bounds = new THREE.Box3().setFromPoints(points),
                  sphere = bounds.getBoundingSphere(new THREE.Sphere());
                const aspect = Math.max(0.1, camera.aspect || 1);
                const distance =
                  ((sphere.radius / Math.sin(THREE.MathUtils.degToRad(22.5))) *
                    1.15) /
                  Math.min(1, aspect);
                camera.position
                  .copy(sphere.center)
                  .add(new THREE.Vector3(0, distance * 0.65, distance * 0.76));
                controls!.target.copy(sphere.center);
              }
              previousMode = v;
            } else if (v === "craft") {
              if (arrival) {
                // In arrival, Moon is centered at targetDest. Keep controls target on targetDest
                // so the Moon remains 100% stationary and does not drift as the craft moves.
                controls!.target.copy(targetDest);
                if (j.firing && !j.paused) {
                  const shake = 0.015 * (j.throttle ?? 0.5);
                  camera.position.x += (Math.random() - 0.5) * shake;
                  camera.position.y += (Math.random() - 0.5) * shake;
                  camera.position.z += (Math.random() - 0.5) * shake;
                }
              } else {
                const change = shipPosition.clone().sub(lastPosition);
                camera.position.add(change);
                controls!.target.copy(shipPosition);

                if (j.firing && !j.paused) {
                  const shake = 0.015 * (j.throttle ?? 0.5);
                  camera.position.x += (Math.random() - 0.5) * shake;
                  camera.position.y += (Math.random() - 0.5) * shake;
                  camera.position.z += (Math.random() - 0.5) * shake;
                }
              }
            }
            lastPosition.copy(shipPosition);
            controls!.update();
            renderer!.render(scene!, camera);
          } catch (paintErr) {
            console.error("JourneyViewport paint error:", paintErr);
          }
        };
        frame = requestAnimationFrame(paint);
        cleanup = () => {
          observer.disconnect();
          earthTexture?.dispose();
        };
      } catch (error) {
        if (!disposed) {
          console.warn("Journey view unavailable", error);
          setFailed(true);
        }
      }
    })();
    useLoadingStore.getState().registerLoaderTask(task);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cleanup();
      controls?.dispose();
      if (scene) disposeGroup(scene);
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [gentle]);
  return (
    <>
      <div
        className="journey-canvas"
        ref={host}
        role="img"
        aria-label="Spacecraft flight along a NASA ephemeris based Moon transfer; drag to look around"
      >
        {failed ? (
          <SceneFallback
            scene="journey"
            label="Flight view unavailable"
            detail="Flight controls remain available"
          />
        ) : null}
      </div>
      <div className="journey-camera-controls" aria-label="Flight camera">
        <button
          aria-pressed={mode === "craft"}
          onClick={() => setMode("craft")}
        >
          Craft view
        </button>
        <button
          aria-pressed={mode === "trajectory"}
          onClick={() => setMode("trajectory")}
        >
          Trajectory view
        </button>
      </div>
    </>
  );
}

export default JourneyViewport;
