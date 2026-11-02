import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SceneFallback } from './SceneFallback.tsx';
import { createCrewedPlatform } from './crewedMeshes.ts';
import { disposeGroup } from '../workshopMeshes.ts';
import { LANDING_PADS, LANDING_MODEL, terrainHeight } from './landing.ts';
import type { LandingState } from './landing.ts';
import { useLoadingStore } from '../../../state/loadingStore.ts';
import { isEngineFrozen } from '../../../state/orientationLifecycleStore.ts';

const SCALE = .32;
const terrainY = (x: number, z: number) => terrainHeight(x / SCALE) * SCALE + (Math.abs(z) > 8 ? Math.sin(x * .14) * Math.cos(z * .21) * Math.min(4, (Math.abs(z) - 8) * .17) : 0);
function regolithTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const pixels = ctx.createImageData(512, 512);
  let seed = 19;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
  for (let i = 0; i < pixels.data.length; i += 4) { const value = 125 + random() * 35; pixels.data[i] = value; pixels.data[i + 1] = value; pixels.data[i + 2] = value + 3; pixels.data[i + 3] = 255; }
  ctx.putImageData(pixels, 0, 0);
  for (let i = 0; i < 90; i++) {
    const x = random() * 512, y = random() * 512, radius = 3 + random() * 19;
    const shade = ctx.createRadialGradient(x - radius * .2, y + radius * .2, 1, x, y, radius);
    shade.addColorStop(0, '#39384480'); shade.addColorStop(.65, '#6e6c7220'); shade.addColorStop(.82, '#e5e2e04d'); shade.addColorStop(1, '#93909800');
    ctx.fillStyle = shade; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(3, 3); return texture;
}
function markerTexture(text: string, color: string) {
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#080f1de6'; ctx.beginPath(); ctx.roundRect(3, 3, 122, 58, 16); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = color; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 64, 33);
  return new THREE.CanvasTexture(canvas);
}
export function LandingViewport({ landing, shadow, gentle }: { landing: LandingState; shadow: boolean; gentle: boolean }) {
  const host = useRef<HTMLDivElement>(null), latest = useRef(landing), wake = useRef(() => {}), [failed, setFailed] = useState(false);
  useEffect(() => { latest.current = landing; wake.current(); }, [landing]);
  useEffect(() => {
    const mount = host.current; if (!mount) return;
    let disposed = false, frame = 0, renderer: THREE.WebGLRenderer | undefined, scene: THREE.Scene | undefined;
    let cleanup = () => {};
    const loading = useLoadingStore.getState();
    if (!loading.isLoading) void loading.startLoading('custom', 'Preparing the lunar landing field…');
    let finishTask = () => {};
    const task = new Promise<void>(resolve => { finishTask = resolve; }); useLoadingStore.getState().registerLoaderTask(task);
    const boot = () => {
      if (disposed) { finishTask(); return; }
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25; renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; mount.appendChild(renderer.domElement);
        scene = new THREE.Scene(); scene.background = new THREE.Color('#070c19'); scene.fog = new THREE.Fog('#070c19', 150, 240);
        const camera = new THREE.OrthographicCamera(-40, 40, 30, -30, .1, 400);
        scene.add(new THREE.HemisphereLight(0xc9d7ff, 0x292333, shadow ? 1.05 : 1.6));
        const sunlight = new THREE.DirectionalLight(0xfff0d9, shadow ? 2 : 3.5); sunlight.position.set(-45, 28, 25); sunlight.castShadow = true;
        sunlight.shadow.mapSize.set(2048, 2048); Object.assign(sunlight.shadow.camera, { left: -55, right: 55, top: 65, bottom: -45, far: 180 }); sunlight.shadow.bias = -.0004; sunlight.shadow.normalBias = .05; scene.add(sunlight);
        const rim = new THREE.DirectionalLight(0x9eaeff, 1); rim.position.set(20, 20, -40); scene.add(rim);
        const texture = regolithTexture();
        const groundGeometry = new THREE.PlaneGeometry(190, 140, 150, 100); groundGeometry.rotateX(-Math.PI / 2);
        const vertices = groundGeometry.attributes.position;
        for (let i = 0; i < vertices.count; i++) vertices.setY(i, terrainY(vertices.getX(i), vertices.getZ(i)));
        groundGeometry.computeVertexNormals();
        const ground = new THREE.Mesh(groundGeometry, new THREE.MeshStandardMaterial({ color: shadow ? 0x76727f : 0xa5a0a3, map: texture, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
        const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x76717c, roughness: 1, map: texture });
        const rockGeometry = new THREE.DodecahedronGeometry(1, 1);
        for (let i = 0; i < 110; i++) {
          const x = i < 18 ? Math.sin(i * 2.4) * 4.5 : Math.sin(i * 5.17) * 75;
          const z = i < 18 ? Math.cos(i * 3.9) * 3 : (i % 2 ? -1 : 1) * (10 + Math.abs(Math.cos(i * 2.13)) * 45);
          const rock = new THREE.Mesh(rockGeometry, rockMaterial), size = i < 18 ? .35 + i % 4 * .17 : .3 + i % 7 * .25;
          rock.position.set(x, terrainY(x, z) + size * .2, z); rock.scale.set(size * 1.2, size * .7, size); rock.rotation.set(i * .4, i * 1.7, .2); rock.castShadow = rock.receiveShadow = true; scene.add(rock);
        }
        // Navigation graphics share the exact safe radius and ground position used by collision checks.
        const pads = LANDING_PADS.map(p => {
          const group = new THREE.Group(); group.position.set(p.x * SCALE, terrainY(p.x * SCALE, 0) + .05, 0); scene!.add(group);
          const color = p.safe ? 0x85f4ce : 0xf17687;
          const ring = new THREE.Mesh(new THREE.RingGeometry(LANDING_MODEL.padRadius * SCALE - .08, LANDING_MODEL.padRadius * SCALE + .08, 96), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false, depthTest: false })); ring.rotation.x = -Math.PI / 2; ring.renderOrder = 4; group.add(ring);
          const dash = new THREE.Group(); group.add(dash);
          for (let j = 0; j < 12; j++) { const a = j / 12 * Math.PI * 2, tick = new THREE.Mesh(new THREE.BoxGeometry(.09, .02, .45), ring.material); tick.position.set(Math.cos(a) * 4.25, 0, Math.sin(a) * 4.25); tick.rotation.y = -a + Math.PI / 2; tick.renderOrder = 4; dash.add(tick); }
          const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTexture(p.id === 'left' ? 'A' : p.id === 'right' ? 'B' : 'ROCKS', p.safe ? '#a6ffe1' : '#ff9cac'), depthTest: false, transparent: true })); label.scale.set(p.safe ? 3.3 : 4, 1.65, 1); label.position.set(0, 2, -4.5); group.add(label);
          return { id: p.id, group, ring, dash, label };
        });
        const starsGeometry = new THREE.BufferGeometry(), starPositions: number[] = [];
        for (let i = 0; i < 260; i++) starPositions.push(Math.sin(i * 23.1) * 180, 15 + Math.abs(Math.cos(i * 7.3)) * 100, -100 - i % 11);
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3)); scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xc9d7f8, size: .14, sizeAttenuation: true })));
        const crew = createCrewedPlatform(); scene.add(crew.root); crew.lander.scale.setScalar(2.1); crew.capsule.scale.setScalar(1.3);
        const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xa7d8ff, transparent: true, opacity: .65, blending: THREE.AdditiveBlending, depthWrite: false });
        const plume = new THREE.Group(); crew.lander.add(plume); plume.position.set(0, .1, 0);
        const outer = new THREE.Mesh(new THREE.ConeGeometry(.63, 4.6, 32, 1, true), flameMaterial); outer.position.y = -2.3; plume.add(outer);
        const inner = new THREE.Mesh(new THREE.ConeGeometry(.22, 2.8, 24), new THREE.MeshBasicMaterial({ color: 0xe3f4ff, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false })); inner.position.y = -1.4; plume.add(inner);
        const engineGlow = new THREE.PointLight(0x8dcdff, 0, 18, 2); engineGlow.position.y = .5; crew.lander.add(engineGlow);
        const groundGlow = new THREE.Mesh(new THREE.CircleGeometry(5, 48), new THREE.MeshBasicMaterial({ color: 0xa5b9dd, transparent: true, opacity: .1, depthWrite: false })); groundGlow.rotation.x = -Math.PI / 2; scene.add(groundGlow);
        const dustGeometry = new THREE.BufferGeometry(), dustPositions = new Float32Array(160 * 3); dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
        const dustMaterial = new THREE.PointsMaterial({ color: 0xc0b8af, size: .19, transparent: true, opacity: .3, depthWrite: false }); const dust = new THREE.Points(dustGeometry, dustMaterial); scene.add(dust);
        const velocity = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 2, 0xffd986, .7, .35); scene.add(velocity);
        const trackMaterial = new THREE.LineDashedMaterial({ color: 0x8ee6c7, dashSize: .45, gapSize: .4, transparent: true, opacity: .36 });
        const track = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 40, 0)]), trackMaterial); track.computeLineDistances(); scene.add(track);
        let touchdownClock: number | null = null;
        let last = 0, clock = 0, first = true, displayX = 0, displayY = 30, displayTilt = 0, viewHeight = 55;
        const look = new THREE.Vector3(0, 20, 0), desiredLook = new THREE.Vector3();
        const render = (now: number) => {
          frame = 0; if (disposed || document.hidden) return;
          // Loading can freeze the engine between scheduling and drawing a frame.
          // Keep a pending draw so releasing the freeze cannot leave a blank canvas.
          if (isEngineFrozen()) { last = 0; frame = requestAnimationFrame(render); return; }
          const l = latest.current, dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
          const active = !l.paused && !['landed', 'failed', 'aborted'].includes(l.stage);
          if (active || l.stage === 'landed' && (touchdownClock === null || clock - touchdownClock < 1.5)) clock += dt;
          const orbital = ['ready', 'separating', 'separated'].includes(l.stage), intro = l.stage === 'ready';
          const phase = l.phaseSteps * LANDING_MODEL.step;
          const fraction = Math.min(1, phase / (l.version === 2 ? 2 : 4));
          let x = l.x * SCALE, y = Math.max(0, l.height) * SCALE;
          if (orbital) { x = -6 + (intro ? 0 : fraction * 3); y = 48 - (intro ? 0 : fraction * 4); }
          if (l.stage === 'braking') { x = -3.8; y = 44 - Math.min(1, phase / (l.version === 2 ? 4 : 10)) * 2.4; }
          if (l.stage === 'aborting') y += phase * 2;
          if (l.stage === 'aborted') { x = -4; y = 29; }
          const smooth = first ? 1 : 1 - Math.exp(-dt * 12);
          if (!l.paused || first) { displayX += (x - displayX) * smooth; displayY += (y - displayY) * smooth; displayTilt += ((orbital ? 0 : -l.steer * 20 * Math.PI / 180) - displayTilt) * smooth; }
          crew.lander.position.set(displayX, displayY, 0); crew.lander.rotation.z = displayTilt;
          crew.descentStage.visible = !['aborting', 'aborted'].includes(l.stage);
          crew.capsule.visible = orbital || l.stage === 'aborted'; crew.capsule.position.set(-12 - (intro ? 0 : fraction * 10), 52 + (intro ? 0 : fraction * 3), -6); crew.capsule.rotation.z = -.35;
          const firing = !l.paused && (l.stage === 'braking' || l.stage === 'aborting' || l.stage === 'descending' && l.throttle > .01);
          plume.visible = firing; const strength = l.stage === 'descending' ? l.throttle : .75;
          plume.scale.set(1, Math.max(.3, strength * 1.7) * (gentle ? 1 : 1 + Math.sin(clock * 45) * .045), 1); engineGlow.intensity = firing ? 6 * strength : 0;
          const dustStrength = Math.max(0, 1 - l.height / 26) * (firing ? strength : l.stage === 'landed' ? Math.max(0, 1 - (clock - (touchdownClock ?? clock)) / 1.3) : 0);
          if (l.stage === 'landed' && touchdownClock === null) touchdownClock = clock;
          dust.visible = dustStrength > .01; dustMaterial.opacity = .12 + dustStrength * .5;
          for (let i = 0; i < 160; i++) { const a = i * 2.399, r = 2.5 + ((clock * 8 + i * .39) % 11); dustPositions[i * 3] = displayX + Math.cos(a) * r; dustPositions[i * 3 + 1] = terrainY(displayX, 0) + .12 + (i % 7) * .045 * r; dustPositions[i * 3 + 2] = Math.sin(a) * r; } dustGeometry.attributes.position.needsUpdate = dust.visible;
          groundGlow.visible = firing && l.height < 38; groundGlow.position.set(displayX, terrainY(displayX, 0) + .025, 0); groundGlow.material.opacity = dustStrength * .12;
          const pad = LANDING_PADS.find(p => p.id === l.target)!;
          pads.forEach(p => { p.group.visible = l.hazardSeen || intro; p.label.visible = !(p.id === l.target && l.height < 15); p.ring.material.opacity = p.id === l.target ? 1 : .75; p.dash.rotation.y = gentle || l.paused ? 0 : clock * .1; });
          track.visible = l.hazardSeen && ['descending', 'landed'].includes(l.stage) && pad.safe; track.position.set(pad.x * SCALE, .12, 0); track.scale.y = Math.max(.01, l.height * SCALE / 40);
          velocity.visible = l.stage === 'descending' && !l.decisionPending && Math.abs(l.vx) > .3; velocity.position.set(displayX, displayY + 1.2, 0); velocity.setDirection(new THREE.Vector3(Math.sign(l.vx), 0, 0)); velocity.setLength(Math.min(5, Math.abs(l.vx) * .8), .7, .35);
          desiredLook.set(orbital ? -3 : displayX * .6, orbital ? 25 : Math.max(6, displayY * .47 + 3), 0);
          const cameraSmooth = first ? 1 : 1 - Math.exp(-dt * 2.7); look.lerp(desiredLook, cameraSmooth);
          const desiredHeight = orbital ? 65 : l.decisionPending ? 51 : Math.max(26, displayY + 17); viewHeight += (desiredHeight - viewHeight) * cameraSmooth;
          const aspect = Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight);
          camera.left = -viewHeight * aspect / 2; camera.right = viewHeight * aspect / 2; camera.top = viewHeight / 2; camera.bottom = -viewHeight / 2; camera.updateProjectionMatrix();
          camera.position.set(look.x + 8, look.y + 37, 65); camera.lookAt(look);
          try { renderer!.render(scene!, camera); } catch (error) { console.warn('Landing render unavailable', error); setFailed(true); return; }
          first = false;
          if (active || l.stage === 'landed' && clock - (touchdownClock ?? clock) < 1.5) frame = requestAnimationFrame(render);
        };
        const start = () => { if (!disposed && !frame && !document.hidden) { last = 0; frame = requestAnimationFrame(render); } };
        const stop = () => { cancelAnimationFrame(frame); frame = 0; last = 0; };
        const resize = () => { renderer!.setSize(Math.max(1, mount.clientWidth), Math.max(1, mount.clientHeight), false); start(); };
        const observer = new ResizeObserver(resize); observer.observe(mount); wake.current = start;
        const visibility = () => { if (document.hidden) stop(); else start(); };
        const lost = (event: Event) => { event.preventDefault(); stop(); setFailed(true); };
        renderer.domElement.addEventListener('webglcontextlost', lost); document.addEventListener('visibilitychange', visibility); window.addEventListener('game-orientation-pause', stop); window.addEventListener('game-orientation-resume', start);
        cleanup = () => { stop(); observer.disconnect(); renderer?.domElement.removeEventListener('webglcontextlost', lost); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('game-orientation-pause', stop); window.removeEventListener('game-orientation-resume', start); texture.dispose(); pads.forEach(p => p.group.traverse(node => { if (node instanceof THREE.Sprite) node.material.map?.dispose(); })); };
        resize(); renderer.compile(scene, camera); finishTask(); start();
      } catch (error) { console.warn('Landing view unavailable', error); finishTask(); setFailed(true); }
    };
    const bootFrame = requestAnimationFrame(boot);
    return () => { disposed = true; cancelAnimationFrame(bootFrame); cleanup(); wake.current = () => {}; if (scene) disposeGroup(scene); renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove(); finishTask(); };
  }, [shadow, gentle]);
  return <div className="landing-canvas" ref={host} role="img" aria-label="Lunar lander above a rocky Moon landscape. Green navigation circles mark clear ground; the arrow beside the craft shows sideways drift.">{failed ? <SceneFallback scene="landing" label="Moon landing" detail={`${landing.height.toFixed(0)} m high · ${Math.abs(landing.vy).toFixed(1)} m/s down`} position={Math.min(1, landing.height / 130)}/> : null}</div>;
}
