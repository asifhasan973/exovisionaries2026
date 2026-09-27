import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PARTS, SLOTS } from '../data/parts';
import {
  createCrewCapsuleMesh,
  createEscapeTowerMesh,
  createInstrumentUnitMesh,
  createInterstage1Mesh,
  createInterstage2Mesh,
  createLunarPayloadMesh,
  createPartMeshByType,
  createServiceModuleMesh,
  createStage1Mesh,
  createStage2Mesh,
  createStage3Mesh
} from '../scene/RocketMeshes';
import { sampleAscentTelemetry } from '../engine/ascent-profile';
import type { SlotInterface } from '../types/mission';
import './flight3d.css';

type Installed = Partial<Record<SlotInterface, string>>;

export type FlightScene3DProps = {
  installed: Installed;
  phase: 'launchpad' | 'ascent';
  metSeconds: number;
  released: number;
  escapeReleased: boolean;
  enginesOn: boolean;
  reducedMotion: boolean;
  countdown: number | null;
};

const STACK_SLOTS: SlotInterface[] = [
  'booster-stage-1',
  'interstage-1',
  'booster-stage-2',
  'interstage-2',
  'booster-stage-3',
  'instrument-unit',
  'lunar-payload-bay',
  'service-module',
  'crew-capsule',
  'launch-escape-system'
];

function hideSlotParts(rocket: THREE.Group, slot: SlotInterface) {
  const part = rocket.getObjectByName(`flight_${slot}`);
  if (part) part.visible = false;
}

function plumeYOffset(met: number, released: number): number {
  if (released >= 2) return 4.5;
  if (released >= 1 || met > 162) return -6.5;
  return -20;
}

function disposeObject3D(root: THREE.Object3D) {
  root.traverse(obj => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
    }
  });
}

function rebuildRocket(rocket: THREE.Group, installed: Installed) {
  for (let i = rocket.children.length - 1; i >= 0; i--) {
    const child = rocket.children[i];
    if (!child.name.startsWith('flight_')) continue;
    rocket.remove(child);
    disposeObject3D(child);
  }
  for (const slotDef of SLOTS) {
    const partId = installed[slotDef.id];
    if (!partId || !PARTS[partId]) continue;
    const mesh = createPartMeshByType(PARTS[partId].meshType);
    mesh.name = `flight_${slotDef.id}`;
    mesh.position.set(slotDef.position[0], slotDef.position[1], slotDef.position[2]);
    mesh.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    rocket.add(mesh);
  }
  if (!rocket.children.some(c => c.name.startsWith('flight_'))) {
    const defaults: [SlotInterface, THREE.Group][] = [
      ['booster-stage-1', createStage1Mesh()],
      ['interstage-1', createInterstage1Mesh()],
      ['booster-stage-2', createStage2Mesh()],
      ['interstage-2', createInterstage2Mesh()],
      ['booster-stage-3', createStage3Mesh()],
      ['instrument-unit', createInstrumentUnitMesh()],
      ['lunar-payload-bay', createLunarPayloadMesh()],
      ['service-module', createServiceModuleMesh()],
      ['crew-capsule', createCrewCapsuleMesh()],
      ['launch-escape-system', createEscapeTowerMesh()]
    ];
    for (const [slot, mesh] of defaults) {
      mesh.name = `flight_${slot}`;
      const slotDef = SLOTS.find(s => s.id === slot);
      if (slotDef) mesh.position.set(slotDef.position[0], slotDef.position[1], slotDef.position[2]);
      rocket.add(mesh);
    }
  }
}

function spawnDebris(scene: THREE.Scene, slot: SlotInterface, installed: Installed, origin: THREE.Vector3) {
  const partId = installed[slot];
  if (!partId || !PARTS[partId]) return;
  const mesh = createPartMeshByType(PARTS[partId].meshType);
  mesh.position.copy(origin);
  mesh.userData.debris = true;
  mesh.userData.spin = (Math.random() - 0.5) * 0.02;
  mesh.userData.drift = new THREE.Vector3((Math.random() - 0.5) * 0.08, -0.35 - Math.random() * 0.2, (Math.random() - 0.5) * 0.08);
  scene.add(mesh);
}

export function FlightScene3D(props: FlightScene3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  const rebuildRef = useRef<(installed: Installed) => void>(() => {});
  useEffect(() => { propsRef.current = props; }, [props]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x6a8fc4, 0.0018);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 8000);
    camera.position.set(52, 24, 105);

    const hemi = new THREE.HemisphereLight(0xb8d4ff, 0x3a4258, 1.1);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff4e8, 2.4);
    sun.position.set(-120, 100, -250);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 400;
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x88b4ff, 0.85);
    rim.position.set(-40, 20, -30);
    scene.add(rim);

    const starsGeo = new THREE.BufferGeometry();
    const starCount = 2800;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 900 + Math.random() * 700;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i + 2] = r * Math.cos(phi);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false }));
    stars.visible = false;
    scene.add(stars);

    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 256;
    sunCanvas.height = 256;
    const sunContext = sunCanvas.getContext('2d');
    if (sunContext) {
      const glow = sunContext.createRadialGradient(128, 128, 10, 128, 128, 124);
      glow.addColorStop(0, 'rgba(255,255,238,1)');
      glow.addColorStop(.18, 'rgba(255,232,150,.95)');
      glow.addColorStop(.45, 'rgba(255,188,74,.35)');
      glow.addColorStop(1, 'rgba(255,174,55,0)');
      sunContext.fillStyle = glow;
      sunContext.fillRect(0, 0, 256, 256);
    }
    const sunGlowTexture = new THREE.CanvasTexture(sunCanvas);
    sunGlowTexture.colorSpace = THREE.SRGBColorSpace;
    const sunGlowMaterial = new THREE.SpriteMaterial({ map: sunGlowTexture, transparent: true, opacity: .32, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const sunGlow = new THREE.Sprite(sunGlowMaterial);
    sunGlow.position.set(-360, 220, -1250);
    sunGlow.scale.set(220, 220, 1);
    scene.add(sunGlow);
    const sunCoreMaterial = new THREE.MeshBasicMaterial({ color: 0xfff8d4, transparent: true, opacity: .5, depthWrite: false, toneMapped: false });
    const sunCore = new THREE.Mesh(new THREE.SphereGeometry(22, 24, 18), sunCoreMaterial);
    sunCore.position.copy(sunGlow.position);
    scene.add(sunCore);

    const earthRadius = 520;
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(earthRadius, 64, 64),
      new THREE.MeshStandardMaterial({ color: 0x1a5a9e, roughness: 0.55, metalness: 0.08 })
    );
    earth.position.set(0, -earthRadius - 40, 0);
    earth.receiveShadow = true;
    scene.add(earth);
    const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, roughness: 0.9 });
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(earthRadius + 3, 48, 48),
      cloudMaterial
    );
    earth.add(clouds);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({ color: 0x4fc3ff, transparent: true, opacity: 0.28, side: THREE.BackSide });
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(earthRadius + 10, 48, 32),
      atmosphereMaterial
    );
    earth.add(atmosphere);

    const pad = new THREE.Group();
    const padMat = new THREE.MeshStandardMaterial({ color: 0x2a3344, roughness: 0.82, metalness: 0.35 });
    const padDeck = new THREE.Mesh(new THREE.CylinderGeometry(28, 30, 2.2, 48), padMat);
    padDeck.position.y = -0.4;
    padDeck.receiveShadow = true;
    pad.add(padDeck);
    const flameTrench = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 22), new THREE.MeshStandardMaterial({ color: 0x151a24, roughness: 0.95 }));
    flameTrench.position.set(0, -0.2, 6);
    pad.add(flameTrench);
    for (let i = 0; i < 8; i++) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.15, 8), new THREE.MeshStandardMaterial({ color: 0x8fa3bc, metalness: 0.9, roughness: 0.25 }));
      const a = (i / 8) * Math.PI * 2;
      bolt.position.set(Math.cos(a) * 24, 0.75, Math.sin(a) * 24);
      pad.add(bolt);
    }
    const tower = new THREE.Group();
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xc41e3a, metalness: 0.25, roughness: 0.55 });
    const mast = new THREE.Mesh(new THREE.BoxGeometry(2.2, 72, 2.2), towerMat);
    mast.position.set(-16, 36, 0);
    tower.add(mast);
    for (let y = 4; y < 70; y += 7) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 0.5), towerMat);
      arm.position.set(-11, y, 0);
      tower.add(arm);
    }
    pad.add(tower);
    pad.position.y = -30.5;
    scene.add(pad);

    const rocket = new THREE.Group();
    scene.add(rocket);
    rebuildRocket(rocket, propsRef.current.installed);
    rebuildRef.current = (installed: Installed) => rebuildRocket(rocket, installed);

    const plume = new THREE.Group();
    const outerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(3.2, 18, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xff8c00, transparent: true, opacity: 0.82, depthWrite: false, side: THREE.DoubleSide })
    );
    outerFlame.rotation.x = Math.PI;
    outerFlame.position.y = -9;
    plume.add(outerFlame);
    const innerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 14, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff6e8, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide })
    );
    innerFlame.rotation.x = Math.PI;
    innerFlame.position.y = -7;
    plume.add(innerFlame);
    const shock = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 6.5, 2.5, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide })
    );
    shock.position.y = -1.2;
    plume.add(shock);
    rocket.add(plume);

    const smokeCount = 120;
    const smokeGeo = new THREE.BufferGeometry();
    const smokePos = new Float32Array(smokeCount * 3);
    const smokeVel: THREE.Vector3[] = [];
    for (let i = 0; i < smokeCount; i++) {
      smokePos[i * 3] = (Math.random() - 0.5) * 3;
      smokePos[i * 3 + 1] = -2 - Math.random() * 2;
      smokePos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      smokeVel.push(new THREE.Vector3((Math.random() - 0.5) * 0.05, -0.16 - Math.random() * 0.22, (Math.random() - 0.5) * 0.05));
    }
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
    const smoke = new THREE.Points(
      smokeGeo,
      new THREE.PointsMaterial({ color: 0xdde8f5, size: 2.4, transparent: true, opacity: 0.55, depthWrite: false })
    );
    rocket.add(smoke);

    let lastReleased = propsRef.current.released;
    let lesDetached = false;
    let lastFrameTime = performance.now();
    const sky = new THREE.Color();
    const daySky = new THREE.Color(0x5a8ec8);
    const spaceSky = new THREE.Color(0x030712);
    let frame = 0;

    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();
    requestAnimationFrame(resize);

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastFrameTime) / 1000, .05);
      lastFrameTime = now;
      const p = propsRef.current;
      const telem = sampleAscentTelemetry(p.metSeconds / 720);
      const met = p.metSeconds;
      const altitudeKm = telem.altitudeKm;
      const spaceBlend = THREE.MathUtils.smoothstep(altitudeKm, 12, 135);
      const starBlend = THREE.MathUtils.smoothstep(altitudeKm, 65, 135);

      sky.lerpColors(daySky, spaceSky, spaceBlend);
      scene.background = sky;
      scene.fog!.color.copy(scene.background as THREE.Color);
      (scene.fog as THREE.FogExp2).density = 0.0018 * (1 - spaceBlend * 0.92);
      stars.visible = starBlend > .02;
      (stars.material as THREE.PointsMaterial).opacity = starBlend;
      (stars.material as THREE.PointsMaterial).transparent = true;
      sunGlowMaterial.opacity = .3 + spaceBlend * .7;
      sunCoreMaterial.opacity = .5 + spaceBlend * .5;
      cloudMaterial.opacity = .45 - spaceBlend * .17;
      atmosphereMaterial.opacity = .28 + spaceBlend * .12;
      pad.visible = p.phase === 'launchpad' || altitudeKm < 6;

      if (p.released > lastReleased) {
        if (lastReleased < 1 && p.released >= 1) {
          spawnDebris(scene, 'booster-stage-1', p.installed, rocket.localToWorld(new THREE.Vector3(0, -18, 0)));
          hideSlotParts(rocket, 'booster-stage-1');
          hideSlotParts(rocket, 'interstage-1');
        }
        if (lastReleased < 2 && p.released >= 2) {
          spawnDebris(scene, 'booster-stage-2', p.installed, rocket.localToWorld(new THREE.Vector3(0, -1.5, 0)));
          hideSlotParts(rocket, 'booster-stage-2');
          hideSlotParts(rocket, 'interstage-2');
        }
        lastReleased = p.released;
      }

      if (p.escapeReleased && !lesDetached) {
        spawnDebris(scene, 'launch-escape-system', p.installed, rocket.localToWorld(new THREE.Vector3(0, 31, 0)));
        hideSlotParts(rocket, 'launch-escape-system');
        lesDetached = true;
      }

      for (const slot of STACK_SLOTS) {
        const part = rocket.getObjectByName(`flight_${slot}`);
        if (!part) continue;
        if (p.released >= 1 && (slot === 'booster-stage-1' || slot === 'interstage-1')) part.visible = false;
        if (p.released >= 2 && (slot === 'booster-stage-2' || slot === 'interstage-2')) part.visible = false;
        if (p.escapeReleased && slot === 'launch-escape-system') part.visible = false;
      }

      const lift = p.phase === 'launchpad' ? 0 : Math.min(340, Math.sqrt(Math.max(0, altitudeKm)) * 25);
      const pitch = p.phase === 'ascent' ? Math.min(0.78, Math.max(0, (met - 12) / 180) * 0.78) : 0;
      rocket.position.set(0, lift, 0);
      rocket.rotation.set(0, 0, -pitch);

      plume.visible = p.enginesOn;
      smoke.visible = p.enginesOn && spaceBlend < .8;
      if (p.enginesOn) {
        const py = plumeYOffset(met, p.released);
        plume.position.y = py;
        const expansion = 1 + spaceBlend * 2.2;
        const flameWave = Math.sin(performance.now() * .018);
        plume.scale.set(expansion * (1 + flameWave * .04), 1 + flameWave * .035, expansion);
        (outerFlame.material as THREE.MeshBasicMaterial).opacity = .82 + flameWave * .06;
      }

      if (p.enginesOn && !p.reducedMotion) {
        const positions = smokeGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < smokeCount; i++) {
          positions.setX(i, positions.getX(i) + smokeVel[i].x);
          positions.setY(i, positions.getY(i) + smokeVel[i].y * (1 + spaceBlend));
          positions.setZ(i, positions.getZ(i) + smokeVel[i].z);
          if (positions.getY(i) < -28) {
            positions.setX(i, (Math.random() - 0.5) * 2);
            positions.setY(i, -2);
            positions.setZ(i, (Math.random() - 0.5) * 2);
          }
        }
        positions.needsUpdate = true;
      }

      clouds.rotation.y += dt * 0.015;
      earth.rotation.y += dt * 0.008;

      scene.traverse(obj => {
        if (obj.userData.debris) {
          obj.position.add(obj.userData.drift as THREE.Vector3);
          obj.rotation.x += obj.userData.spin as number;
          obj.rotation.z += (obj.userData.spin as number) * 0.7;
        }
      });

      const focusY = lift + 8;
      let offX = 48;
      let offY = 18;
      let offZ = 92;

      if (p.phase === 'launchpad') {
        offX = 52;
        offY = 16;
        offZ = 105;
        if (p.countdown !== null && p.countdown <= 2 && !p.reducedMotion) {
          const shake = (3 - p.countdown) * 0.08;
          offX += (Math.random() - 0.5) * shake;
          offY += (Math.random() - 0.5) * shake;
        }
      } else if (met < 25) {
        offX = 46;
        offY = 14;
        offZ = 125;
        if (!p.reducedMotion) offX += Math.sin(performance.now() * 0.025) * 0.35;
      } else if (met < 180) {
        offX = 60;
        offY = 20;
        offZ = 200 + Math.min(260, altitudeKm * 3.5);
      } else if (met < 520) {
        offX = 48;
        offY = 18;
        offZ = 320;
      } else {
        offX = 42;
        offY = 18;
        offZ = 275;
      }

      const desiredCam = new THREE.Vector3(offX, focusY + offY, offZ);
      camera.position.lerp(desiredCam, p.reducedMotion ? 1 : 0.1);
      const highAltitudeBlend = THREE.MathUtils.smoothstep(altitudeKm, 70, 125);
      const earthFrameBias = (focusY + 32) * .5;
      const horizonBias = p.phase === 'launchpad' ? 0 : earthFrameBias * (1 - highAltitudeBlend * .72);
      camera.lookAt(-18, focusY - horizonBias, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      });
      starsGeo.dispose();
      sunGlowTexture.dispose();
      sunGlowMaterial.dispose();
      sunCoreMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    rebuildRef.current(props.installed);
  }, [props.installed]);

  return <div className="flight-scene-canvas" ref={hostRef} aria-hidden="true" data-flight-scene="3d" />;
}

export function OrbitScene3D() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 5000);
    camera.position.set(0, 7, 48);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0x446688, 0.5));
    const key = new THREE.DirectionalLight(0xfff0dd, 2.2);
    key.position.set(30, 40, 20);
    scene.add(key);

    const starGeo = new THREE.BufferGeometry();
    const n = 1800;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i += 3) {
      arr[i] = (Math.random() - 0.5) * 800;
      arr[i + 1] = (Math.random() - 0.5) * 800;
      arr[i + 2] = (Math.random() - 0.5) * 800;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: false })));

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(22, 64, 64),
      new THREE.MeshStandardMaterial({ color: 0x1c5fa8, roughness: 0.5, emissive: 0x061428, emissiveIntensity: 0.35 })
    );
    earth.position.set(12, -18, -14);
    scene.add(earth);
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(22.8, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0x3ecfff, transparent: true, opacity: 0.22, side: THREE.BackSide })
    );
    earth.add(atmo);

    const ship = new THREE.Group();
    const body = createPartMeshByType(PARTS['crew-capsule-command'].meshType);
    body.scale.setScalar(.55);
    body.position.y = .8;
    ship.add(body);
    const service = createServiceModuleMesh();
    service.scale.setScalar(.5);
    service.position.y = -.35;
    ship.add(service);
    const stage = createPartMeshByType(PARTS['stage-3-departure'].meshType);
    stage.scale.setScalar(.48);
    stage.position.y = -3.68;
    ship.add(stage);
    ship.position.set(5, 6, 0);
    scene.add(ship);

    const orbitPath = new THREE.Mesh(
      new THREE.TorusGeometry(25, 0.05, 8, 160),
      new THREE.MeshBasicMaterial({ color: 0x66d4ff, transparent: true, opacity: 0.35 })
    );
    orbitPath.rotation.x = Math.PI / 2.3;
    orbitPath.position.copy(earth.position);
    scene.add(orbitPath);

    let frame = 0;
    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const tick = () => {
      frame = requestAnimationFrame(tick);
      earth.rotation.y += 0.002;
      const t = performance.now() * 0.00035;
      ship.position.set(5 + Math.cos(t) * 1.6, 6 + Math.sin(t * 2) * .45, Math.sin(t) * 1.6);
      ship.rotation.y = -.32 + Math.sin(t) * .12;
      ship.rotation.z = -.18;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="orbit-scene-3d" ref={hostRef} aria-hidden="true" />;
}
