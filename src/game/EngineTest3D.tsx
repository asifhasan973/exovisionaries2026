import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function EngineTest3D({ firing, throttle, passed, reducedMotion }: { firing: boolean; throttle: number; passed: boolean; reducedMotion: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef({ firing, throttle, passed });

  useEffect(() => { state.current = { firing, throttle, passed }; }, [firing, throttle, passed]);

  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);
    scene.fog = new THREE.FogExp2(0x0b1020, 0.035);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(5.8, 3.7, 8.8);
    camera.lookAt(0, -0.4, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xc8e4ff, 0x21152f, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 4.2); key.position.set(4, 7, 5); scene.add(key);
    const rim = new THREE.PointLight(0x6fcfff, 65, 14); rim.position.set(-4, 0, 3); scene.add(rim);

    const metal = new THREE.MeshStandardMaterial({ color: 0xaeb8c7, metalness: 0.92, roughness: 0.22 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x202938, metalness: 0.88, roughness: 0.3 });
    const copper = new THREE.MeshStandardMaterial({ color: 0x9b6a3e, metalness: 0.85, roughness: 0.3 });
    const stand = new THREE.Group(); scene.add(stand);

    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, .38, 64), metal); plate.position.y = 2.15; stand.add(plate);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.05, .17, 18, 72), darkMetal); ring.rotation.x = Math.PI / 2; ring.position.y = 1.9; stand.add(ring);
    for (let i = 0; i < 8; i++) {
      const angle = i / 8 * Math.PI * 2;
      const pipe = new THREE.Mesh(new THREE.TorusGeometry(.48, .055, 10, 30, Math.PI * 1.35), copper);
      pipe.position.set(Math.cos(angle) * 1.58, 2.25, Math.sin(angle) * 1.58);
      pipe.rotation.set(Math.PI / 2, angle, angle);
      stand.add(pipe);
    }

    const nozzles: THREE.Mesh[] = [];
    const flames: THREE.Mesh[] = [];
    const positions = [[0,0],[-.92,-.1],[.92,-.1],[-.45,.78],[.45,.78]];
    for (const [x,z] of positions) {
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(.34, .68, 1.55, 48, 1, true), darkMetal);
      bell.position.set(x, .95, z); stand.add(bell); nozzles.push(bell);
      const throat = new THREE.Mesh(new THREE.CylinderGeometry(.22, .34, .55, 36), metal); throat.position.set(x, 1.78, z); stand.add(throat);
      const flameMaterial = new THREE.MeshBasicMaterial({ color: 0x88ddff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(.4, 2.9, 36, 1, true), flameMaterial);
      flame.rotation.z = Math.PI; flame.position.set(x, -.45, z); stand.add(flame); flames.push(flame);
    }
    const floor = new THREE.Mesh(new THREE.CircleGeometry(4.8, 72), new THREE.MeshStandardMaterial({ color: 0x222a3b, metalness: .35, roughness: .7 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -2.05; scene.add(floor);
    const glow = new THREE.PointLight(0x71cfff, 0, 10); glow.position.set(0, -1.2, 0); scene.add(glow);

    let frame = 0;
    const startedAt = performance.now();
    const resize = () => { const width = mount.clientWidth, height = mount.clientHeight; renderer.setSize(width, height, false); camera.aspect = width / Math.max(1, height); camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(mount); resize();
    const animate = () => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const active = state.current.firing;
      const strength = active ? .68 + state.current.throttle / 180 : 0;
      flames.forEach((flame, index) => {
        const material = flame.material as THREE.MeshBasicMaterial;
        material.opacity = active ? .6 + Math.sin(elapsed * 31 + index) * .12 : 0;
        flame.scale.y = active ? strength * (reducedMotion ? 1 : .91 + Math.sin(elapsed * 38 + index) * .09) : .02;
      });
      glow.intensity = active ? 75 + state.current.throttle * 1.4 : state.current.passed ? 12 : 0;
      stand.rotation.y = reducedMotion ? -.16 : -.16 + Math.sin(elapsed * .35) * .08;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); renderer.dispose();
      scene.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(material => material.dispose()); } });
      renderer.domElement.remove();
    };
  }, [reducedMotion]);

  return <div ref={host} className="engine-test-3d" aria-hidden="true" />;
}
