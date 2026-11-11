import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createCrewedPlatform } from "@/game/moon/crew/crewedMeshes";
import { disposeGroup } from "@/game/moon/workshop/lander/workshopMeshes";
import { returnFrameLimit } from "./return.ts";
import type { ReturnState } from "./return.ts";
import { useLoadingStore, SceneFallback, isEngineFrozen } from "@exo/ui";

/** Close mission cameras; world distances and elapsed flight time are compressed. */
export function ReturnViewport({
  flight,
  gentle,
}: {
  flight: ReturnState;
  gentle: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(flight),
    paint = useRef(() => {}),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    latest.current = flight;
    paint.current();
  }, [flight]);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      queueMicrotask(() => setFailed(true));
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#070d1c");
    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 250);
    scene.add(new THREE.HemisphereLight(0xdbeaff, 0x282337, 1.5));
    const sun = new THREE.DirectionalLight(0xfff3df, 3);
    sun.position.set(-6, 12, 10);
    scene.add(sun);
    const hardware = createCrewedPlatform(),
      ascent = hardware.ascentStage,
      descent = hardware.descentStage,
      csm = hardware.capsule;
    scene.add(ascent, descent, csm);
    scene.userData.materials = hardware.root.userData.materials;
    const silver = new THREE.MeshStandardMaterial({
        color: 0xe4e9ee,
        metalness: 0.55,
        roughness: 0.35,
      }),
      dark = new THREE.MeshStandardMaterial({
        color: 0x18283b,
        roughness: 0.6,
      });
    const capsule = new THREE.Group();
    scene.add(capsule);
    const add = (
      parent: THREE.Object3D,
      g: THREE.BufferGeometry,
      m: THREE.Material,
      x = 0,
      y = 0,
      z = 0,
    ) => {
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };
    add(
      capsule,
      new THREE.CylinderGeometry(0.19, 0.88, 1.4, 48),
      silver,
      0,
      0.7,
    );
    add(capsule, new THREE.CylinderGeometry(0.91, 0.86, 0.15, 48), dark);
    add(
      capsule,
      new THREE.CylinderGeometry(0.14, 0.19, 0.2, 24),
      silver,
      0,
      1.5,
    );
    add(
      capsule,
      new THREE.BoxGeometry(0.24, 0.22, 0.025),
      new THREE.MeshStandardMaterial({
        color: 0x143b62,
        emissive: 0x183b66,
        emissiveIntensity: 0.5,
      }),
      0,
      0.94,
      0.54,
    );
    const ground = new THREE.Group();
    scene.add(ground);
    const regolith = new THREE.MeshStandardMaterial({
      color: 0x555965,
      roughness: 1,
    });
    add(ground, new THREE.CircleGeometry(70, 96), regolith).rotation.x =
      -Math.PI / 2;
    const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
    const rocks = new THREE.InstancedMesh(rockGeometry, regolith, 46);
    const rockTransform = new THREE.Object3D();
    for (let i = 0; i < 46; i++) {
      const angle = i * 2.399;
      const radius = 4 + (i % 13) * 2.1;
      const size = 0.12 + (i % 5) * 0.15;
      rockTransform.position.set(
        Math.cos(angle) * radius,
        size * 0.3,
        Math.sin(angle) * radius,
      );
      rockTransform.scale.set(size, size * 0.65, size);
      rockTransform.rotation.y = angle;
      rockTransform.updateMatrix();
      rocks.setMatrixAt(i, rockTransform.matrix);
    }
    ground.add(rocks);
    const craterGeometry = new THREE.TorusGeometry(1, 0.06, 6, 32);
    const craters = new THREE.InstancedMesh(craterGeometry, regolith, 12);
    for (let i = 0; i < 12; i++) {
      const angle = i * 2.4;
      const radius = 7 + i * 2;
      rockTransform.position.set(
        Math.sin(angle) * radius,
        0.01,
        Math.cos(angle) * radius,
      );
      rockTransform.rotation.set(-Math.PI / 2, 0, 0);
      rockTransform.scale.setScalar(0.7 + (i % 3));
      rockTransform.updateMatrix();
      craters.setMatrixAt(i, rockTransform.matrix);
    }
    ground.add(craters);
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 128;
    const shadowContext = shadowCanvas.getContext("2d");
    if (shadowContext) {
      const fade = shadowContext.createRadialGradient(64, 64, 12, 64, 64, 64);
      fade.addColorStop(0, "rgba(12, 10, 20, 0.55)");
      fade.addColorStop(1, "rgba(12, 10, 20, 0)");
      shadowContext.fillStyle = fade;
      shadowContext.fillRect(0, 0, 128, 128);
    }
    const shadowMap = new THREE.CanvasTexture(shadowCanvas);
    const contactShadow = add(
      ground,
      new THREE.CircleGeometry(1.6, 48),
      new THREE.MeshBasicMaterial({
        map: shadowMap,
        transparent: true,
        depthWrite: false,
      }),
      -2,
      0.008,
      0,
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.scale.set(1, 0.65, 1);
    const stars = new THREE.BufferGeometry(),
      points = [];
    for (let i = 0; i < 650; i++)
      points.push(
        Math.sin(i * 32) * 90,
        Math.cos(i * 19) * 65,
        -30 - Math.abs(Math.sin(i * 7)) * 70,
      );
    stars.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    scene.add(
      new THREE.Points(
        stars,
        new THREE.PointsMaterial({ color: 0xdbeeff, size: 0.09 }),
      ),
    );
    let textureReady: () => void = () => {};
    const textureTask = new Promise<void>((resolve) => {
      textureReady = resolve;
    });
    useLoadingStore.getState().registerLoaderTask(textureTask);
    const earthMap = new THREE.TextureLoader().load(
      `${import.meta.env.BASE_URL}story/flight/earth-blue-marble.jpg`,
      textureReady,
      undefined,
      textureReady,
    );
    earthMap.colorSpace = THREE.SRGBColorSpace;
    const earth = add(
      scene,
      new THREE.SphereGeometry(10, 64, 48),
      new THREE.MeshStandardMaterial({ map: earthMap, roughness: 0.9 }),
    );
    const atmosphere = add(
      earth,
      new THREE.SphereGeometry(10.15, 48, 32),
      new THREE.MeshBasicMaterial({
        color: 0x5bafff,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
      }),
    );
    void atmosphere;
    const moon = add(scene, new THREE.SphereGeometry(9, 48, 32), regolith);
    const flame = add(
      ascent,
      new THREE.ConeGeometry(0.24, 2.4, 32),
      new THREE.MeshBasicMaterial({
        color: 0x93e4ff,
        transparent: true,
        opacity: 0.85,
      }),
    );
    flame.rotation.z = Math.PI;
    flame.position.y = -0.3;
    const burn = add(
      csm,
      new THREE.ConeGeometry(0.38, 3, 32),
      new THREE.MeshBasicMaterial({
        color: 0x9adfff,
        transparent: true,
        opacity: 0.85,
      }),
    );
    burn.rotation.z = Math.PI;
    burn.position.y = -1.2;
    const heat = add(
      capsule,
      new THREE.SphereGeometry(
        1.01,
        32,
        20,
        0,
        Math.PI * 2,
        Math.PI / 2,
        Math.PI / 2,
      ),
      new THREE.MeshBasicMaterial({
        color: 0xff6b30,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      }),
    );
    heat.scale.y = 0.4;
    const sea = add(
      scene,
      new THREE.PlaneGeometry(180, 180, 50, 50),
      new THREE.MeshStandardMaterial({
        color: 0x176a96,
        metalness: 0.3,
        roughness: 0.32,
      }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -0.05;
    const waves = sea.geometry.attributes.position;
    for (let i = 0; i < waves.count; i++)
      waves.setZ(
        i,
        Math.sin(waves.getX(i) * 0.7) * Math.cos(waves.getY(i) * 0.6) * 0.11,
      );
    sea.geometry.computeVertexNormals();
    const parachutes = new THREE.Group();
    capsule.add(parachutes);
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 2.3,
        z = i === 1 ? -1 : 0.3;
      add(
        parachutes,
        new THREE.SphereGeometry(1.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({
          color: i === 1 ? 0xf8f4e8 : 0xed784e,
          side: THREE.DoubleSide,
        }),
        x,
        5,
        z,
      );
      for (let j = 0; j < 8; j++) {
        const a = (j * Math.PI) / 4;
        parachutes.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0, 1.4, 0),
              new THREE.Vector3(
                x + Math.sin(a) * 1.4,
                5,
                z + Math.cos(a) * 1.4,
              ),
            ]),
            new THREE.LineBasicMaterial({ color: 0xf8eee0 }),
          ),
        );
      }
    }
    const recovery = new THREE.Group();
    scene.add(recovery);
    const hull = add(
      recovery,
      new THREE.BoxGeometry(2.4, 0.45, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xf1a335 }),
      4,
      0.25,
      -2,
    );
    hull.rotation.y = -0.3;
    add(recovery, new THREE.BoxGeometry(0.7, 0.8, 0.7), silver, 4, 0.8, -2);
    const splash = add(
      scene,
      new THREE.TorusGeometry(1.6, 0.035, 8, 64),
      new THREE.MeshBasicMaterial({
        color: 0xbce8ff,
        transparent: true,
        opacity: 0.8,
      }),
    );
    splash.rotation.x = -Math.PI / 2;
    splash.position.set(-2, 0.06, 0);
    const route = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(-4, -0.4, 1),
          new THREE.Vector3(1, 2, -4),
          new THREE.Vector3(5, -1, -12),
        ).getPoints(40),
      ),
      new THREE.LineDashedMaterial({
        color: 0xbedbd0,
        dashSize: 0.2,
        gapSize: 0.16,
        transparent: true,
        opacity: 0.35,
      }),
    );
    route.computeLineDistances();
    scene.add(route);
    let raf = 0,
      disposed = false;
    let displayedStage = latest.current.stage;
    let displayedFrame = latest.current.frame;
    const draw = () => {
      if (disposed) return;
      const r = latest.current;
      if (displayedStage !== r.stage || gentle) {
        displayedStage = r.stage;
        displayedFrame = r.frame;
      } else if (!r.paused && !isEngineFrozen()) {
        displayedFrame += (r.frame - displayedFrame) * 0.28;
      }
      const p = displayedFrame / returnFrameLimit(r),
        surface = ["ready", "ascending"].includes(r.stage),
        dock = ["rendezvous", "docked"].includes(r.stage),
        travel = ["burning", "coast"].includes(r.stage),
        entry = ["entry-ready", "entry", "chute-ready"].includes(r.stage),
        ocean = ["chutes", "splashdown"].includes(r.stage);
      route.visible = r.stage === "coast";
      contactShadow.visible = surface;
      earth.scale.setScalar(r.stage === "coast" ? 0.65 + p * 0.45 : 1);
      ground.visible = surface;
      descent.visible = surface;
      ascent.visible = surface || dock;
      csm.visible = dock || travel;
      capsule.visible = entry || ocean;
      sea.visible = ocean;
      recovery.visible = r.stage === "splashdown";
      splash.visible = r.stage === "splashdown";
      earth.visible = !surface && !dock;
      moon.visible = dock || travel;
      descent.position.set(-2, 0, 0);
      ascent.rotation.set(0, 0, 0);
      ascent.position.set(-2, r.stage === "ascending" ? p * 10 : 0, 0);
      flame.visible = r.stage === "ascending";
      burn.visible = r.stage === "burning";
      heat.visible = r.stage === "entry";
      parachutes.visible = r.stage === "chutes";
      const flicker = gentle ? 1 : 1 + Math.sin(displayedFrame * 2) * 0.1;
      flame.scale.y = flicker;
      burn.scale.y = flicker;
      csm.rotation.set(0, 0, -Math.PI / 2);
      csm.position.set(-3, 0, 0);
      capsule.rotation.set(
        0,
        0,
        r.stage === "entry-ready" && r.feedback === "wrongShield" ? Math.PI : 0,
      );
      capsule.position.set(
        -2,
        ocean ? (r.stage === "splashdown" ? 0.05 : 3 - p * 2.6) : 1,
        0,
      );
      if (surface) {
        const rise = r.stage === "ascending" ? p * 9 : 0;
        if (gentle && r.stage === "ascending") {
          camera.position.set(2.5, 6.8, 18);
          camera.lookAt(-2, 5.5, 0);
        } else {
          camera.position.set(2.5, 3.2 + rise, 7);
          camera.lookAt(-2, 1.3 + rise, 0);
        }
      }
      if (dock) {
        ascent.rotation.z = Math.PI / 2;
        ascent.position.set(
          // CSM nose: local y=4.28; ascent nose: local y=2.67.
          // Their opposing +Y axes must meet after the quarter-turn rotations.
          -3 + 4.28 + 2.67 + (r.stage === "docked" ? 0 : r.closingMS * 2),
          r.stage === "docked" ? 0 : r.alignment * 2,
          0,
        );
        moon.position.set(-8, -12, -17);
        camera.position.set(1, 2, 12);
        camera.lookAt(1, 0, 0);
      }
      if (travel) {
        earth.position.set(6, -2, -21);
        earth.rotation.y = 1.1 + (gentle ? 0 : p * 0.5);
        moon.position.set(-24, -4, -35);
        csm.position.set(r.stage === "coast" ? -3 + p * 1.5 : -3, 1, 2);
        camera.position.set(1, 3, 11);
        camera.lookAt(1, 1, 0);
      }
      if (entry) {
        earth.position.set(-3, -12, -13);
        capsule.position.x = -1;
        if (r.stage === "entry-ready" && r.feedback === "wrongShield") {
          capsule.position.y = 2.4;
        }
        camera.position.set(2, 2.4, 6.2);
        camera.lookAt(-0.6, 1.1, 0);
      }
      if (ocean) {
        earth.visible = false;
        scene.background = new THREE.Color("#83bfdc");
        camera.position.set(
          6,
          r.stage === "splashdown" ? 3.2 : 7,
          r.stage === "splashdown" ? 9 : 12,
        );
        camera.lookAt(0, r.stage === "splashdown" ? 0.7 : 3.5, 0);
      } else scene.background = new THREE.Color("#070d1c");
      renderer.render(scene, camera);
    };
    paint.current = draw;
    const resize = () => {
      const w = Math.max(1, mount.clientWidth),
        h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    const animate = () => {
      if (!document.hidden && !isEngineFrozen() && !latest.current.paused)
        draw();
      raf = requestAnimationFrame(animate);
    };
    animate();
    const lost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      disposed = true;
      paint.current = () => {};
      cancelAnimationFrame(raf);
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse((object) => {
        if (object instanceof THREE.Line || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      disposeGroup(scene);
      stars.dispose();
      earthMap.dispose();
      shadowMap.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [gentle]);
  return (
    <div
      className="return-canvas"
      ref={host}
      role="img"
      aria-label={`Crew return: ${flight.stage}. Three crew returning from the Moon to Earth.`}
    >
      {failed ? (
        <SceneFallback
          scene="return"
          label="Crew return"
          detail={flight.stage}
        />
      ) : null}
    </div>
  );
}
