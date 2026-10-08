import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createLaunchHardware } from './launchHardware.ts';
import { disposeGroup } from './workshopMeshes.ts';
import type { PreparationSelection } from './design.ts';
import { flightTelemetry } from './flight.ts';
import type { FlightState } from './flight.ts';

export function FlightViewport({ preparation, flight, reducedMotion }: { preparation: PreparationSelection; flight: FlightState; reducedMotion: boolean }) {
  const host = useRef<HTMLDivElement>(null), model = useRef({ flight, reducedMotion }), repaint = useRef(() => {});
  const [failed, setFailed] = useState(false);
  useEffect(() => { model.current = { flight, reducedMotion }; repaint.current(); }, [flight, reducedMotion]);
  useEffect(() => {
    const mount = host.current; if (!mount) return;
    let disposed = false, frame = 0;
    let renderer: THREE.WebGLRenderer;
    const fail = () => queueMicrotask(() => { if (!disposed) setFailed(true); });
    try { renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'low-power' }); } catch { fail(); return () => { disposed = true; }; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25; mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, .1, 250); camera.position.set(15, 10, 24); camera.lookAt(0, 6, 0);
    scene.add(new THREE.HemisphereLight(0xdcd9ff, 0x21133e, 2.4));
    const sunlight = new THREE.DirectionalLight(0xfff4da, 4); sunlight.position.set(-20, 20, 15); scene.add(sunlight);
    const rim = new THREE.DirectionalLight(0x96c7ff, 2); rim.position.set(8, 3, -5); scene.add(rim);
    const hardware = createLaunchHardware(preparation); scene.add(hardware.root);
    const tower = new THREE.Group(); scene.add(tower);
    const towerMaterial = new THREE.MeshStandardMaterial({ color: 0x6c5387, metalness: .5, roughness: .5 });
    for (const x of [-3.2, -2.4]) { const beam = new THREE.Mesh(new THREE.BoxGeometry(.2, 13, .2), towerMaterial); beam.position.set(x, 6, -1.5); tower.add(beam); }
    for (let i = 0; i < 6; i++) { const beam = new THREE.Mesh(new THREE.BoxGeometry(2.8, .12, .15), towerMaterial); beam.position.set(-1.95, 1.6 + i * 1.9, -1.5); tower.add(beam); }
    const map = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}story/flight/earth-blue-marble.jpg`, texture => {
      if (disposed) texture.dispose(); else repaint.current();
    });
    map.colorSpace = THREE.SRGBColorSpace;
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), new THREE.MeshStandardMaterial({ map, color: 0x999999, roughness: 1, metalness: 0 })); earth.rotation.set(-.8, -1.4, .1); scene.add(earth);
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshBasicMaterial({ color: 0x5094d0, transparent: true, opacity: .12, side: THREE.BackSide })); scene.add(atmosphere);
    const starsGeometry = new THREE.BufferGeometry(); const stars = [];
    for (let i = 0; i < 360; i++) { const random = (n: number) => Math.sin(n * 127.1 + 17) * 43758.5453 % 1; stars.push(random(i + 1) * 100, Math.abs(random(i + 500)) * 70 - 20, -55 - Math.abs(random(i + 1000)) * 60); }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3)); const starsMaterial = new THREE.PointsMaterial({ color: 0xe7e6ff, size: .14, transparent: true }); scene.add(new THREE.Points(starsGeometry, starsMaterial));
    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff0b5 })); sun.position.set(-21, 23, -60); scene.add(sun);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(1.8, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffce64, transparent: true, opacity: .12 })); glow.position.copy(sun.position); scene.add(glow);
    const plume = new THREE.Group(); hardware.root.add(plume);
    const flameMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { time: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float time; varying vec2 vUv; void main(){float n=.7+.3*sin(vUv.y*75.-time*22.+vUv.x*15.);float a=pow(vUv.y,.6)*n*.68;vec3 c=mix(vec3(1.,.25,.03),vec3(.55,.75,1.),pow(vUv.y,3.));gl_FragColor=vec4(c,a);}' });
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
      earth.scale.setScalar(radius); earth.position.set(-5, -radius - 2 - progress * 5, -18); atmosphere.scale.setScalar(radius * 1.018); atmosphere.position.copy(earth.position);
      starsMaterial.opacity = THREE.MathUtils.clamp((telemetry.altitudeKm - 30) / 80, 0, 1);
      scene.background = new THREE.Color(0x353051).lerp(new THREE.Color(0x060c1c), progress);
      const angle = progress * Math.PI * .47;
      hardware.root.rotation.z = -angle; hardware.root.position.set(-Math.sin(angle) * 5, 6 - Math.cos(angle) * 6, 0);
      const fall = Math.max(0, visualT - 16);
      hardware.booster.position.set(state.events.includes('booster') ? -fall * .4 : 0, state.events.includes('booster') ? -fall * .8 : 0, 0);
      hardware.booster.rotation.z = state.events.includes('booster') ? -fall * .04 : 0; hardware.booster.visible = fall < 10;
      const opening = state.events.includes('fairing') ? Math.min(9, Math.max(0, visualT - 24) * 1.1 + .1) : 0;
      hardware.halves.forEach((half, i) => { half.position.x = (i ? -1 : 1) * opening; half.position.y = -opening * .25; half.rotation.z = (i ? 1 : -1) * opening * .08; half.visible = opening < 8; });
      const upperBurn = state.events.includes('booster'); plume.position.y = upperBurn ? 5.4 : 0;
      plume.visible = telemetry.engineOn && (state.status === 'running' || state.status === 'paused' || state.status === 'awaiting'); flameMaterial.uniforms.time.value = quiet ? 0 : visualT * 2;
      const spread = 1 + progress * .9; plume.scale.set(spread, 1 + progress * .3, spread);
      hardware.platform.visible = visualT < 7; hardware.platform.position.y = -(visualT > 4 ? (visualT - 4) * 2 : 0);
      tower.visible = visualT < 10; tower.position.y = -Math.max(0, visualT - 4) * 2;
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
      camera.position.copy(new THREE.Vector3(15, 4, 24).normalize().multiplyScalar(distance).add(new THREE.Vector3(0, 6, 0)));
      camera.lookAt(0, 6, 0); camera.updateProjectionMatrix(); wake();
    };
    const observer = new ResizeObserver(resize); observer.observe(mount);
    const lost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(frame); fail(); };
    renderer.domElement.addEventListener('webglcontextlost', lost); document.addEventListener('visibilitychange', wake); resize();
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener('visibilitychange', wake); renderer.domElement.removeEventListener('webglcontextlost', lost);
      repaint.current = () => {}; disposeGroup(scene); map.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); };
  }, [preparation]);
  return <div className="flight-viewport"><div ref={host} className="flight-canvas" role="img" aria-label={`${flightTelemetry(flight).title} — Earth ascent scene`} />
    {failed ? <div className="flight-fallback" role="status"><span>3D unavailable</span><RocketFallback /><p>Flight controls and telemetry still work.</p></div> : null}
    <span className="story-flight-scene-note">ILLUSTRATIVE FLIGHT · TIME COMPRESSED</span><span className="flight-sun-note">SUN · ≈150 million km away</span>
  </div>;
}
function RocketFallback() { return <svg viewBox="0 0 120 240" role="img" aria-label="Spacecraft"><path d="M40 205V65Q60 5 80 65V205Z" fill="#ddddea" /><path d="M40 155h40v15H40Z" fill="#4f3a65" /><path d="M40 205 25 228h30m25-23 15 23H65" fill="#9d76bd" /><circle cx="60" cy="82" r="10" fill="#5699b7" /></svg>; }
