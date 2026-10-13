import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createLaunchHardware } from './launchHardware.ts';
import { createLaunchSite } from './launchSite.ts';
import { disposeGroup } from './workshopMeshes.ts';
import type { PreparationSelection } from './design.ts';
import { flightTelemetry } from './flight.ts';
import type { FlightState } from './flight.ts';

export function FlightViewport({ preparation, flight, reducedMotion, crewed = false }: { preparation: PreparationSelection; flight: FlightState; reducedMotion: boolean; crewed?: boolean }) {
  const host = useRef<HTMLDivElement>(null), model = useRef({ flight, reducedMotion }), repaint = useRef(() => {});
  const [failed, setFailed] = useState(false);
  useEffect(() => { model.current = { flight, reducedMotion }; repaint.current(); }, [flight, reducedMotion]);
  useEffect(() => {
    const mount = host.current; if (!mount) return;
    let disposed = false, frame = 0;
    let renderer: THREE.WebGLRenderer;
    const fail = () => queueMicrotask(() => { if (!disposed) setFailed(true); });
    try { renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'low-power' }); } catch { fail(); return () => { disposed = true; }; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, .1, 250); camera.position.set(15, 10, 24); camera.lookAt(0, 6, 0);
    scene.add(new THREE.HemisphereLight(0xc2def4, 0x263348, 1.4));
    const sunlight = new THREE.DirectionalLight(0xfff4da, 4); sunlight.position.set(-18, 26, -8); sunlight.castShadow = true; sunlight.shadow.mapSize.set(1024,1024); sunlight.shadow.camera.left = -13; sunlight.shadow.camera.right = 13; sunlight.shadow.camera.top = 18; sunlight.shadow.camera.bottom = -10; sunlight.shadow.camera.far = 80; sunlight.shadow.normalBias = .035; scene.add(sunlight);
    const rim = new THREE.DirectionalLight(0x96c7ff, 2); rim.position.set(8, 3, -5); scene.add(rim);
    const hardware = createLaunchHardware(preparation,crewed); scene.add(hardware.root);
    hardware.root.traverse(object => { if (object instanceof THREE.Mesh) object.castShadow = true; });
    const site = createLaunchSite(); scene.add(site.root);
    site.root.add(hardware.platform); hardware.platform.visible = false;
    const map = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}story/flight/earth-blue-marble.jpg`, texture => {
      if (disposed) texture.dispose(); else repaint.current();
    });
    map.colorSpace = THREE.SRGBColorSpace;
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), new THREE.MeshStandardMaterial({ map, color: 0xc3cbd7, roughness: 1, metalness: 0, transparent: true })); earth.rotation.set(-.8, -1.4, .1); scene.add(earth);
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshBasicMaterial({ color: 0x5094d0, transparent: true, opacity: .12, side: THREE.BackSide })); scene.add(atmosphere);
    const starsGeometry = new THREE.BufferGeometry(); const stars = [];
    for (let i = 0; i < 360; i++) { const random = (n: number) => Math.sin(n * 127.1 + 17) * 43758.5453 % 1; stars.push(random(i + 1) * 100, Math.abs(random(i + 500)) * 70 - 20, -55 - Math.abs(random(i + 1000)) * 60); }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3)); const starsMaterial = new THREE.PointsMaterial({ color: 0xe7e6ff, size: .14, transparent: true }); scene.add(new THREE.Points(starsGeometry, starsMaterial));
    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff0b5 })); sun.position.set(-35, 31, -70); scene.add(sun); sunlight.position.copy(sun.position).normalize().multiplyScalar(40);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(1.8, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffce64, transparent: true, opacity: .12 })); glow.position.copy(sun.position); scene.add(glow);
    const plume = new THREE.Group(); hardware.root.add(plume);
    const flameMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { time: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float time; varying vec2 vUv; void main(){float n=.82+.18*sin(vUv.y*25.-time*18.+vUv.x*15.);float a=pow(vUv.y,.7)*n*.58;vec3 c=mix(vec3(1.,.45,.08),vec3(.65,.8,1.),pow(vUv.y,2.));gl_FragColor=vec4(c,a);}' });
    const flame = new THREE.Mesh(new THREE.CylinderGeometry(.28, .75, 4, 32, 12, true), flameMaterial); flame.position.y = -2.1; plume.add(flame);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(.15, .4, 2.6, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xd8eeff, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false })); inner.position.y = -1.3; plume.add(inner);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visualT = model.current.flight.t, previousTime = 0;
    const paint = (time: number) => {
      const state = model.current.flight, quiet = reduced.matches || model.current.reducedMotion;
      visualT = quiet ? state.t < 4 ? 0 : state.t < 16 ? 8 : state.t < 24 ? 16 : state.t < 38 ? 24 : 38
        : !previousTime ? state.t : visualT + (state.t - visualT) * .28; previousTime = time;
      const telemetry = flightTelemetry({ ...state, t: visualT });
      const progress = THREE.MathUtils.clamp((visualT - 4) / 34, 0, 1), radius = THREE.MathUtils.lerp(80, 16, progress);
      const reveal = THREE.MathUtils.smoothstep(visualT,10,16);
      earth.visible = atmosphere.visible = reveal > 0;
      earth.material.opacity = reveal;
      earth.scale.setScalar(radius); earth.position.set(-8,-radius - 10,-28);
      atmosphere.material.opacity = .12 * reveal; atmosphere.scale.setScalar(radius * 1.018); atmosphere.position.copy(earth.position);
      starsMaterial.opacity = THREE.MathUtils.clamp((telemetry.altitudeKm - 30) / 80, 0, 1);
      scene.background = new THREE.Color(0x759bb7).lerp(new THREE.Color(0x060c1c), THREE.MathUtils.smoothstep(visualT,4,20));
      const angle = progress * Math.PI * .47;
      hardware.root.rotation.z = -angle; hardware.root.position.set(-Math.sin(angle) * 5, 6 - Math.cos(angle) * 6, 0);
      const fall = Math.max(0, visualT - 16);
      hardware.booster.position.set(state.events.includes('booster') ? -fall * .4 : 0, state.events.includes('booster') ? -fall * .8 : 0, 0);
      hardware.booster.rotation.z = state.events.includes('booster') ? -fall * .04 : 0; hardware.booster.visible = fall < 10;
      const opening = state.events.includes('fairing') ? Math.min(9, Math.max(0, visualT - 24) * 1.1 + .1) : 0;
      hardware.halves.forEach((half, i) => { half.position.x = (i ? -1 : 1) * opening; half.position.y = -opening * .25; half.rotation.z = (i ? 1 : -1) * opening * .08; half.visible = opening < 8; });
      hardware.escapeTower.visible=crewed&&visualT<21;hardware.escapeTower.position.set(Math.max(0,visualT-18)*.6,Math.max(0,visualT-18)*1.2,0);
      const upperBurn = state.events.includes('booster'); plume.position.y = upperBurn ? 5.4 : 0;
      plume.visible = telemetry.engineOn && (state.status === 'running' || state.status === 'paused' || state.status === 'awaiting'); flameMaterial.uniforms.time.value = quiet ? 0 : visualT * 2;
      const spread = 1 + progress * .9; plume.scale.set(spread, 1 + progress * .3, spread);
      site.root.visible = visualT < 13;
      site.root.position.y = -Math.max(0,visualT - 4) * 3;
      site.arms.forEach(arm => { arm.rotation.y = -THREE.MathUtils.smoothstep(visualT,3,5) * 1.2; });
      site.smoke.visible = visualT >= 4 && visualT < 10;
      site.smoke.children.forEach((cloud,i) => {
        const age = Math.max(0,visualT - 4), angle = i * Math.PI / 4;
        cloud.position.set(Math.sin(angle) * age * .85,age * .25 - .2,Math.cos(angle) * age * .85);
        cloud.scale.setScalar(.35 + age * .38 + i * .07);
        (cloud as THREE.Mesh<THREE.SphereGeometry,THREE.MeshBasicMaterial>).material.opacity = .42 * (1 - age / 7);
      });
      renderer.render(scene, camera);
    };
    let last = 0;
    const animate = (time: number) => { if (disposed || document.hidden) return; if (time - last >= 32) { paint(time); last = time; }
      if (!reduced.matches && !model.current.reducedMotion && (model.current.flight.status === 'running' || Math.abs(visualT - model.current.flight.t) > .01)) frame = requestAnimationFrame(animate); };
    const wake = () => { cancelAnimationFrame(frame); if (!document.hidden) { paint(performance.now()); if (!reduced.matches && !model.current.reducedMotion && (model.current.flight.status === 'running' || Math.abs(visualT - model.current.flight.t) > .01)) frame = requestAnimationFrame(animate); } };
    repaint.current = wake;
    const resize = () => {
      renderer.setSize(Math.max(1, mount.clientWidth), Math.max(1, mount.clientHeight), false);
      camera.aspect = Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight);
      // Fit the full stack and its tilted upper stage on narrow screens too.
      const vertical = THREE.MathUtils.degToRad(camera.fov / 2), horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
      const distance = Math.max(28.6, 8 / Math.sin(Math.min(vertical, horizontal)));
      camera.position.copy(new THREE.Vector3(10, 3.5, 27).normalize().multiplyScalar(distance).add(new THREE.Vector3(-.8, 6, 0)));
      camera.lookAt(-.8, 6, 0); camera.updateProjectionMatrix(); wake();
    };
    const observer = new ResizeObserver(resize); observer.observe(mount);
    const lost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(frame); fail(); };
    renderer.domElement.addEventListener('webglcontextlost', lost); document.addEventListener('visibilitychange', wake); resize();
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener('visibilitychange', wake); renderer.domElement.removeEventListener('webglcontextlost', lost);
      repaint.current = () => {}; disposeGroup(scene); map.dispose(); sunlight.shadow.map?.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); };
  }, [preparation,crewed]);
  return <div className="flight-viewport"><div ref={host} className="flight-canvas" role="img" aria-label={`${flightTelemetry(flight).title} — Earth ascent scene`} />
    {failed ? <div className="flight-fallback" role="status"><span>3D unavailable</span><RocketFallback /><p>Flight controls and telemetry still work.</p></div> : null}
    <span className="story-flight-scene-note">ILLUSTRATIVE FLIGHT · TIME COMPRESSED</span>{flight.t > 10 ? <span className="flight-sun-note">SUN · ≈150 million km away</span> : null}
  </div>;
}
function RocketFallback() { return <svg viewBox="0 0 120 240" role="img" aria-label="Spacecraft"><path d="M40 205V65Q60 5 80 65V205Z" fill="#ddddea" /><path d="M40 155h40v15H40Z" fill="#4f3a65" /><path d="M40 205 25 228h30m25-23 15 23H65" fill="#9d76bd" /><circle cx="60" cy="82" r="10" fill="#5699b7" /></svg>; }
