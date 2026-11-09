import { useGameSettings } from "@/shared/shell";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  buildAssembly,
  disposeGroup,
} from "@/game/moon/workshop/lander/workshopMeshes";
import { partById } from "@/game/moon/core/preparation";
import type { PreparationSelection } from "@/game/moon/core/design";
import type { TrialState } from "./trial.ts";

/** Visualizes the authoritative trial state; the renderer never advances the test. */
export function TrialViewport({
  preparation,
  trial,
  position,
}: {
  preparation: PreparationSelection;
  trial: TrialState;
  position: number;
}) {
  const { gentle } = useGameSettings();
  const host = useRef<HTMLDivElement>(null),
    current = useRef({ trial, position });
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    current.current = { trial, position };
  }, [trial, position]);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      queueMicrotask(() => {
        if (!disposed) setFailed(true);
      });
      return () => {
        disposed = true;
      };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.append(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x110e25);
    scene.fog = new THREE.Fog(0x110e25, 22, 48);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 70);
    scene.add(new THREE.HemisphereLight(0xcac6ee, 0x251a33, 2));
    const sun = new THREE.DirectionalLight(0xffe4b9, 3.2);
    sun.position.set(-10, 8, -8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x98afff, 2.2);
    rim.position.set(4, 5, -8);
    scene.add(rim);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x625f72, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    // A real raised ridge casts a long shadow over the sampling area.
    const terrain = new THREE.PlaneGeometry(28, 10, 60, 20);
    terrain.rotateX(-Math.PI / 2);
    const vertices = terrain.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i),
        z = vertices.getZ(i);
      const crest = Math.exp(-Math.pow((z + 0.5) / 2.5, 2));
      vertices.setY(
        i,
        crest * (2.8 + Math.sin(x * 0.55) * 0.7 + Math.cos(x * 1.4) * 0.35) +
          Math.sin(x * 2.1 + z) * 0.08,
      );
    }
    terrain.computeVertexNormals();
    const ridge = new THREE.Mesh(
      terrain,
      new THREE.MeshStandardMaterial({
        color: 0x4d465b,
        roughness: 1,
        side: THREE.DoubleSide,
      }),
    );
    ridge.position.set(3, 0, -4.7);
    ridge.castShadow = true;
    ridge.receiveShadow = true;
    scene.add(ridge);
    for (let i = 0; i < 30; i++) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.1 + (i % 4) * 0.08, 0),
        new THREE.MeshStandardMaterial({
          color: i % 2 ? 0x80748f : 0x443d55,
          roughness: 1,
        }),
      );
      rock.position.set(((i * 7) % 23) - 11, 0.1, -1.8 - (i % 5) * 0.65);
      rock.rotation.set(i, i * 0.8, i * 0.3);
      rock.castShadow = true;
      scene.add(rock);
    }
    const lander = new THREE.Group(),
      rover = new THREE.Group();
    scene.add(lander, rover);
    const assembly = buildAssembly(preparation);
    assembly.updateMatrixWorld(true);
    for (const part of [...assembly.children]) {
      if (partById(part.name)?.category === "lander") {
        lander.add(part);
        part.position.x += 2.1;
      } else {
        rover.add(part);
        part.position.x -= 2.1;
      }
    }
    lander.position.set(-4.8, 0, 0);
    lander.scale.setScalar(0.9);
    rover.rotation.y = -Math.PI / 2;
    const path = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2.6, 0.03, 0.2),
      new THREE.Vector3(4.6, 0.03, 0.2),
    ]);
    const trail = new THREE.Line(
      path,
      new THREE.LineDashedMaterial({
        color: 0xfbe18b,
        dashSize: 0.22,
        gapSize: 0.2,
        transparent: true,
        opacity: 0.35,
      }),
    );
    trail.computeLineDistances();
    scene.add(trail);
    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.03, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0xffdf68 }),
    );
    marker.rotation.x = Math.PI / 2;
    marker.position.set(4.7, 0.04, 0.2);
    scene.add(marker);
    const beacon = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16),
      new THREE.MeshBasicMaterial({ color: 0xffdf68 }),
    );
    beacon.position.set(4.7, 1.15, 0.2);
    scene.add(beacon);
    for (const [text, x, y] of [
      ["LANDER", -4.8, 2.6],
      ["SAMPLE", 4.7, 1.9],
    ] as const) {
      const label = document.createElement("canvas");
      label.width = 256;
      label.height = 64;
      const ctx = label.getContext("2d")!;
      ctx.fillStyle = "#21152fe0";
      ctx.fillRect(0, 0, 256, 64);
      ctx.fillStyle = "#fff0b4";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(text, 128, 42);
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: new THREE.CanvasTexture(label),
          depthTest: false,
        }),
      );
      sprite.position.set(x, y, 0.2);
      sprite.scale.set(1.8, 0.45, 1);
      scene.add(sprite);
    }
    const drill = rover.getObjectByName("drill-bit");
    const dust = new THREE.Group();
    scene.add(dust);
    for (let i = 0; i < 12; i++) {
      const grain = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.035),
        new THREE.MeshBasicMaterial({
          color: 0xb3a3bf,
          transparent: true,
          opacity: 0.6,
        }),
      );
      dust.add(grain);
    }
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      last = 0,
      previousX = -2.6;
    const resize = () => {
      const w = Math.max(1, mount.clientWidth),
        h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      camera.position
        .set(7, 5.8, 11)
        .multiplyScalar(Math.max(1, 1.7 / camera.aspect));
      camera.lookAt(0, 0.7, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    const animate = (now: number) => {
      if (disposed || document.hidden) return;
      if (now - last > 30) {
        const state = current.current,
          drilling = state.trial.phase === "drilling" && !state.trial.paused;
        rover.position.x = -2.6 + state.position * 7.2;
        const moving =
          ["outbound", "returning"].includes(state.trial.phase) &&
          !state.trial.paused;
        if (moving && !(gentle || reduced.matches))
          rover.rotation.y =
            state.trial.phase === "returning" ? Math.PI / 2 : -Math.PI / 2;
        const distance = Math.abs(rover.position.x - previousX);
        previousX = rover.position.x;
        rover.traverse((obj) => {
          if (obj.userData.wheelPivot && moving && !(gentle || reduced.matches))
            obj.rotation.x += distance / 0.32;
        });
        if (drill) {
          drill.rotation.y =
            drilling && !(gentle || reduced.matches) ? now / 180 : 0;
          drill.position.y = -(drilling
            ? Math.min(0.23, state.trial.progress * 0.23)
            : 0);
        }
        dust.visible = drilling && !(gentle || reduced.matches);
        dust.position.set(rover.position.x + 0.6, 0.08, -0.6);
        dust.children.forEach((obj, i) => {
          const t = (now / 700 + i / 12) % 1;
          obj.position.set(
            Math.sin(i * 3.1) * t * 0.5,
            Math.sin(t * Math.PI) * 0.35,
            Math.cos(i * 3.1) * t * 0.5,
          );
        });
        beacon.rotation.y = gentle || reduced.matches ? 0 : now / 700;
        beacon.visible = !["sampled", "returning", "complete"].includes(
          state.trial.phase,
        );
        renderer.render(scene, camera);
        last = now;
      }
      frame = requestAnimationFrame(animate);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(animate);
    };
    const lost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    document.addEventListener("visibilitychange", resume);
    resume();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", resume);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      disposeGroup(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [preparation, gentle]);
  return (
    <div
      className="trial-world"
      role="img"
      aria-label={`Your ${partById(preparation.roverId)?.name ?? "rover"} on a Moon practice route: ${trial.phase}`}
    >
      <div className="trial-world-canvas" ref={host} />
      <span className="trial-world-note">Moon practice · time sped up</span>
      {failed ? (
        <div className="trial-fallback">
          <span aria-hidden="true" style={{ left: `${10 + position * 75}%` }}>
            🛞
          </span>
          <p>3D unavailable · keep testing</p>
        </div>
      ) : null}
    </div>
  );
}
