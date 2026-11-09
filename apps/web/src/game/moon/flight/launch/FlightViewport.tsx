import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { LockKeyhole } from "lucide-react";
import { createLaunchHardware } from "./launchHardware.ts";
import { createLaunchSite } from "./launchSite.ts";
import { disposeGroup } from "@/game/moon/workshop/lander/workshopMeshes";
import type { PreparationSelection } from "@/game/moon/core/design";
import { flightTelemetry } from "./flight.ts";
import type { FlightState } from "./flight.ts";
import { isEngineFrozen, useOrientationLifecycleStore } from "@exo/ui";

export function FlightViewport({
  preparation,
  flight,
  reducedMotion,
  crewed = false,
}: {
  preparation: PreparationSelection;
  flight: FlightState;
  reducedMotion: boolean;
  crewed?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    model = useRef({ flight, reducedMotion }),
    repaint = useRef(() => {});
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    model.current = { flight, reducedMotion };
    repaint.current();
  }, [flight, reducedMotion]);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let disposed = false,
      frame = 0;
    let renderer: THREE.WebGLRenderer;
    const fail = () =>
      queueMicrotask(() => {
        if (!disposed) setFailed(true);
      });
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: false,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "low-power",
      });
    } catch {
      fail();
      return () => {
        disposed = true;
      };
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(35, 1, 0.1, 250);
    camera.position.set(15, 10, 24);
    camera.lookAt(0, 6, 0);
    scene.add(new THREE.HemisphereLight(0xc2def4, 0x263348, 1.4));
    const sunlight = new THREE.DirectionalLight(0xfff4da, 4);
    sunlight.position.set(-18, 26, -8);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(1024, 1024);
    sunlight.shadow.camera.left = -13;
    sunlight.shadow.camera.right = 13;
    sunlight.shadow.camera.top = 18;
    sunlight.shadow.camera.bottom = -10;
    sunlight.shadow.camera.far = 80;
    sunlight.shadow.normalBias = 0.035;
    scene.add(sunlight);
    const rim = new THREE.DirectionalLight(0x96c7ff, 2);
    rim.position.set(8, 3, -5);
    scene.add(rim);
    const hardware = createLaunchHardware(preparation, crewed);
    scene.add(hardware.root);
    hardware.root.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) object.castShadow = true;
    });
    // Each fairing first tips about its base rim, then becomes an independent
    // inertial body. Cargo never belongs to either removable shell.
    hardware.halves.forEach((half: THREE.Group, i: number) => {
      const sign = i ? -1 : 1;
      for (const child of half.children) {
        child.position.x -= sign * 1.08;
        child.position.y -= 8.08;
      }
      half.matrixAutoUpdate = false;
      scene.add(half);
    });
    const ejectionFrame = new THREE.Object3D(),
      hinge = new THREE.Object3D();
    const rocketPose = (object: THREE.Object3D, t: number) => {
      const progress = THREE.MathUtils.clamp((t - 4) / 34, 0, 1),
        angle = progress * Math.PI * 0.47;
      object.rotation.z = -angle;
      object.position.set(-Math.sin(angle) * 5, 6 - Math.cos(angle) * 6, 0);
      object.updateMatrixWorld(true);
    };
    const site = createLaunchSite();
    scene.add(site.root);
    site.root.add(hardware.platform);
    hardware.platform.visible = false;
    const map = new THREE.TextureLoader().load(
      `${import.meta.env.BASE_URL}story/flight/earth-blue-marble.jpg`,
      (texture) => {
        if (disposed) texture.dispose();
        else repaint.current();
      },
    );
    map.colorSpace = THREE.SRGBColorSpace;
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 40),
      new THREE.MeshStandardMaterial({
        map,
        color: 0xc3cbd7,
        roughness: 1,
        metalness: 0,
        transparent: true,
      }),
    );
    earth.rotation.set(-0.8, -1.4, 0.1);
    scene.add(earth);
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 32),
      new THREE.MeshBasicMaterial({
        color: 0x5094d0,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
      }),
    );
    scene.add(atmosphere);
    const starsGeometry = new THREE.BufferGeometry();
    const stars = [];
    for (let i = 0; i < 360; i++) {
      const random = (n: number) => (Math.sin(n * 127.1 + 17) * 43758.5453) % 1;
      stars.push(
        random(i + 1) * 100,
        Math.abs(random(i + 500)) * 70 - 20,
        -55 - Math.abs(random(i + 1000)) * 60,
      );
    }
    starsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(stars, 3),
    );
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xe7e6ff,
      size: 0.14,
      transparent: true,
    });
    scene.add(new THREE.Points(starsGeometry, starsMaterial));
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff0b5 }),
    );
    sun.position.set(-35, 31, -70);
    scene.add(sun);
    sunlight.position.copy(sun.position).normalize().multiplyScalar(40);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 24, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffce64,
        transparent: true,
        opacity: 0.12,
      }),
    );
    glow.position.copy(sun.position);
    scene.add(glow);
    const plume = new THREE.Group();
    hardware.root.add(plume);
    const flameMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { time: { value: 0 } },
      vertexShader:
        "varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "uniform float time; varying vec2 vUv; void main(){float n=.82+.18*sin(vUv.y*25.-time*18.+vUv.x*15.);float a=pow(vUv.y,.7)*n*.58;vec3 c=mix(vec3(1.,.45,.08),vec3(.65,.8,1.),pow(vUv.y,2.));gl_FragColor=vec4(c,a);}",
    });
    const flame = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.75, 4, 32, 12, true),
      flameMaterial,
    );
    flame.position.y = -2.1;
    plume.add(flame);
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.4, 2.6, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xd8eeff,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    inner.position.y = -1.3;
    plume.add(inner);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visualT = model.current.flight.t,
      previousTime = 0;
    const paint = (time: number) => {
      const state = model.current.flight,
        quiet = reduced.matches || model.current.reducedMotion;
      if (!isEngineFrozen() && !document.hidden) {
        visualT =
          state.status === "ready"
            ? 0
            : quiet
              ? state.t < 4
                ? 0
                : state.t < 16
                  ? 8
                  : state.t < 24
                    ? 16
                    : state.t < 38
                      ? 24
                      : 38
              : !previousTime
                ? state.t
                : visualT + (state.t - visualT) * 0.28;
        previousTime = time;
      }
      const telemetry = flightTelemetry({ ...state, t: visualT });
      const progress = THREE.MathUtils.clamp((visualT - 4) / 34, 0, 1),
        radius = THREE.MathUtils.lerp(80, 16, progress);
      const reveal = THREE.MathUtils.smoothstep(visualT, 10, 16);
      earth.visible = atmosphere.visible = reveal > 0;
      earth.material.opacity = reveal;
      earth.scale.setScalar(radius);
      earth.position.set(-8, -radius - 10, -28);
      atmosphere.material.opacity = 0.12 * reveal;
      atmosphere.scale.setScalar(radius * 1.018);
      atmosphere.position.copy(earth.position);
      starsMaterial.opacity = THREE.MathUtils.clamp(
        (telemetry.altitudeKm - 30) / 80,
        0,
        1,
      );
      scene.background = new THREE.Color(0x759bb7).lerp(
        new THREE.Color(0x060c1c),
        THREE.MathUtils.smoothstep(visualT, 4, 20),
      );
      rocketPose(hardware.root, visualT);
      const fall = Math.max(0, visualT - (state.releaseTimes?.booster ?? 16));
      hardware.booster.position.set(
        state.events.includes("booster") ? -fall * 0.4 : 0,
        state.events.includes("booster") ? -fall * 0.8 : 0,
        0,
      );
      hardware.booster.rotation.z = state.events.includes("booster")
        ? -fall * 0.04
        : 0;
      hardware.booster.visible = fall < 10;
      const released = state.events.includes("fairing"),
        releasedAt = state.releaseTimes?.fairing ?? 24;
      const age = released ? Math.max(0, visualT - releasedAt) : 0;
      const tip = THREE.MathUtils.smoothstep(age, 0, 0.75),
        freeTime = Math.max(0, age - 0.75);
      rocketPose(
        ejectionFrame,
        released && age > 0.75 ? releasedAt + 0.75 : visualT,
      );
      hardware.halves.forEach((half: THREE.Group, i: number) => {
        const sign = i ? -1 : 1;
        hinge.position.set(
          sign * (1.08 + 0.06 * tip + 0.65 * freeTime),
          8.08 - 0.015 * tip - 0.25 * freeTime,
          sign * 0.05 * freeTime,
        );
        hinge.rotation.set(0, 0, -sign * (0.52 * tip + 0.1 * freeTime));
        hinge.updateMatrix();
        half.matrix.multiplyMatrices(ejectionFrame.matrixWorld, hinge.matrix);
        half.matrixWorldNeedsUpdate = true;
        half.visible = !released || (!quiet && age < 7);
      });
      hardware.escapeTower.visible = crewed && visualT < 21;
      hardware.escapeTower.position.set(
        Math.max(0, visualT - 18) * 0.6,
        Math.max(0, visualT - 18) * 1.2,
        0,
      );
      const upperBurn = state.events.includes("booster");
      plume.position.y = upperBurn ? 5.4 : 0;
      plume.visible =
        telemetry.engineOn &&
        (state.status === "running" ||
          state.status === "paused" ||
          state.status === "awaiting");
      flameMaterial.uniforms.time.value = quiet ? 0 : visualT * 2;
      const spread = 1 + progress * 0.9;
      plume.scale.set(spread, 1 + progress * 0.3, spread);
      site.root.visible = visualT < 13;
      site.root.position.y = -Math.max(0, visualT - 4) * 3;
      site.arms.forEach((arm: THREE.Group) => {
        arm.rotation.y = -THREE.MathUtils.smoothstep(visualT, 3, 5) * 1.2;
      });
      site.smoke.visible = visualT >= 4 && visualT < 10;
      site.smoke.children.forEach((cloud: THREE.Object3D, i: number) => {
        const age = Math.max(0, visualT - 4),
          angle = (i * Math.PI) / 4;
        cloud.position.set(
          Math.sin(angle) * age * 0.85,
          age * 0.25 - 0.2,
          Math.cos(angle) * age * 0.85,
        );
        cloud.scale.setScalar(0.35 + age * 0.38 + i * 0.07);
        (
          cloud as THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
        ).material.opacity = 0.42 * (1 - age / 7);
      });
      renderer.render(scene, camera);
    };
    let last = 0;
    const animate = (time: number) => {
      if (disposed || document.hidden || isEngineFrozen()) return;
      if (time - last >= 32) {
        paint(time);
        last = time;
      }
      if (
        !reduced.matches &&
        !model.current.reducedMotion &&
        (model.current.flight.status === "running" ||
          Math.abs(visualT - model.current.flight.t) > 0.01)
      )
        frame = requestAnimationFrame(animate);
    };
    // A remounted or resized canvas still needs its frozen pose drawn once.
    const wake = () => {
      cancelAnimationFrame(frame);
      paint(performance.now());
      if (
        !document.hidden &&
        !isEngineFrozen() &&
        !reduced.matches &&
        !model.current.reducedMotion &&
        (model.current.flight.status === "running" ||
          Math.abs(visualT - model.current.flight.t) > 0.01)
      )
        frame = requestAnimationFrame(animate);
    };
    const unsubscribe = useOrientationLifecycleStore.subscribe(
      (state, previous) => {
        if (state.isFrozen !== previous.isFrozen) wake();
      },
    );
    repaint.current = wake;
    const resize = () => {
      renderer.setSize(
        Math.max(1, mount.clientWidth),
        Math.max(1, mount.clientHeight),
        false,
      );
      camera.aspect =
        Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight);
      // Fit the full stack and its tilted upper stage on narrow screens too.
      const vertical = THREE.MathUtils.degToRad(camera.fov / 2),
        horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
      const distance = Math.max(
        28.6,
        8 / Math.sin(Math.min(vertical, horizontal)),
      );
      camera.position.copy(
        new THREE.Vector3(10, 3.5, 27)
          .normalize()
          .multiplyScalar(distance)
          .add(new THREE.Vector3(-0.8, 6, 0)),
      );
      camera.lookAt(-0.8, 6, 0);
      camera.updateProjectionMatrix();
      wake();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    const lost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(frame);
      fail();
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    document.addEventListener("visibilitychange", wake);
    resize();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      unsubscribe();
      observer.disconnect();
      document.removeEventListener("visibilitychange", wake);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      repaint.current = () => {};
      disposeGroup(scene);
      map.dispose();
      sunlight.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [preparation, crewed]);
  return (
    <div className="flight-viewport">
      <div
        ref={host}
        className="flight-canvas"
        role="img"
        aria-label={`${flightTelemetry(flight).title} — Earth ascent scene`}
      />
      {failed ? (
        <div className="flight-fallback" role="status">
          <span>3D unavailable</span>
          <RocketFallback />
          <p>Flight controls and telemetry still work.</p>
        </div>
      ) : null}
      <span className="story-flight-scene-note">
        ILLUSTRATIVE FLIGHT · TIME COMPRESSED
      </span>
      {flight.t > 10 ? (
        <span className="flight-sun-note">SUN · ≈150 million km away</span>
      ) : null}
      {flight.events.includes("fairing") ? (
        <span className="flight-cargo-lock">
          <LockKeyhole size={15} />
          Cargo locked
        </span>
      ) : null}
    </div>
  );
}
function RocketFallback() {
  return (
    <svg viewBox="0 0 120 240" role="img" aria-label="Spacecraft">
      <path d="M40 205V65Q60 5 80 65V205Z" fill="#ddddea" />
      <path d="M40 155h40v15H40Z" fill="#4f3a65" />
      <path d="M40 205 25 228h30m25-23 15 23H65" fill="#9d76bd" />
      <circle cx="60" cy="82" r="10" fill="#5699b7" />
    </svg>
  );
}
