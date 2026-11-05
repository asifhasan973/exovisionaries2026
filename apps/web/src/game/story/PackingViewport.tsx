import { useGameSettings } from './gameSettingsContext.ts';
import { useEffect, useRef, useState } from 'react';
import { Expand } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { PreparationSelection } from './design.ts';
import { disposeGroup } from './workshopMeshes.ts';
import { createLaunchHardware } from './launchHardware.ts';

/** Only this packing scene loads Three. It visualizes equipment; it is not a flight simulator. */
export function PackingViewport({ preparation, packedCount, onThumbnails }: { preparation: PreparationSelection; packedCount: number; onThumbnails?: (images: Record<string,string>) => void }) {
  const { gentle } = useGameSettings();
  const thumbnailCallback = useRef(onThumbnails);
  useEffect(() => { thumbnailCallback.current = onThumbnails; }, [onThumbnails]);
  const host = useRef<HTMLDivElement>(null), update = useRef<(count: number) => void>(() => {}), fit = useRef(() => {});
  const count = useRef(packedCount);
  useEffect(() => { count.current = packedCount; }, [packedCount]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let disposed = false, frame = 0;
    let renderer: THREE.WebGLRenderer;
    const fail = () => queueMicrotask(() => { if (!disposed) setFailed(true); });
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch { fail(); return () => { disposed = true; }; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
    scene.add(new THREE.HemisphereLight(0xecf0ff, 0x262031, 1.5));
    const light = new THREE.DirectionalLight(0xffffff, 4); light.position.set(5, 12, 6); scene.add(light);
    const rim = new THREE.DirectionalLight(0xa6c7ff, 2); rim.position.set(-5, 8, -3); scene.add(rim);
    const { root, adapter, payload, halves } = createLaunchHardware(preparation); scene.add(root);
    const thumbnails: Record<string,string> = {};
    renderer.setSize(180,150,false); camera.aspect = 1.2; camera.updateProjectionMatrix();
    for (const [name, source] of [['adapter',adapter],['payload',payload],['fairing',halves[0]]] as const) {
      const imageScene = new THREE.Scene();
      scene.children.filter(item => item instanceof THREE.Light).forEach(item => imageScene.add(item.clone()));
      const model = source.clone(true); imageScene.add(model); model.visible = true;
      const bounds = new THREE.Box3().setFromObject(model), centre = bounds.getCenter(new THREE.Vector3());
      camera.position.copy(centre).add(new THREE.Vector3(1.3,.9,1.7).normalize().multiplyScalar(bounds.getSize(new THREE.Vector3()).length()*1.6)); camera.lookAt(centre);
      renderer.render(imageScene,camera); thumbnails[name] = renderer.domElement.toDataURL('image/png');
    }
    queueMicrotask(() => { if (!disposed) thumbnailCallback.current?.(thumbnails); });
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = false; controls.minDistance = 8; controls.maxDistance = 38; controls.maxPolarAngle = Math.PI * .65;
    const render = () => { if (!disposed && !document.hidden) renderer.render(scene, camera); };
    fit.current = () => { camera.position.set(15, 10, 22); controls.target.set(0, 6, 0); controls.update(); render(); }; fit.current();
    controls.addEventListener('change', render);
    let targetCount = count.current, current = count.current, start = 0, from = count.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pose = (value: number) => {
      adapter.visible = targetCount >= 1;
      payload.position.set((1 - THREE.MathUtils.clamp(value - 1, 0, 1)) * 5, 8.1, 0);
      const close = THREE.MathUtils.clamp(value - 2, 0, 1);
      halves.forEach((half, i) => { half.position.x = (i ? -1 : 1) * 3.6 * (1 - close); });
      render();
    };
    const animate = (time: number) => {
      const t = Math.min(1, (time - start) / 550); current = from + (targetCount - from) * (1 - Math.pow(1 - t, 3)); pose(current);
      if (t < 1 && !disposed && !document.hidden) frame = requestAnimationFrame(animate);
    };
    update.current = count => {
      cancelAnimationFrame(frame); targetCount = count; from = current;
      if (gentle || reduced.matches || document.hidden) { current = count; pose(count); }
      else { start = performance.now(); frame = requestAnimationFrame(animate); }
    };
    const resize = () => { renderer.setSize(Math.max(1, mount.clientWidth), Math.max(1, mount.clientHeight), false); camera.aspect = Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight); camera.updateProjectionMatrix(); render(); };
    const observer = new ResizeObserver(resize); observer.observe(mount);
    const visibility = () => { cancelAnimationFrame(frame); current = targetCount; pose(current); };
    const lost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); fail(); };
    document.addEventListener('visibilitychange', visibility); renderer.domElement.addEventListener('webglcontextlost', lost);
    resize(); pose(current);
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); controls.removeEventListener('change', render); controls.dispose();
      document.removeEventListener('visibilitychange', visibility); renderer.domElement.removeEventListener('webglcontextlost', lost);
      update.current = () => {}; fit.current = () => {}; disposeGroup(scene); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); };
  }, [preparation, gentle]);
  useEffect(() => { update.current(packedCount); }, [packedCount]);
  return <div className="readiness-3d"><div ref={host} className="readiness-canvas" role="img" aria-label={`Robotic carrier: ${packedCount} of 3 packing steps complete`} />
    <span className="readiness-scene-label">PAYLOAD HANGAR · 3D</span><button className="conversation-icon readiness-fit" onClick={() => fit.current()} aria-label="Fit carrier"><Expand size={20} /></button>
    <span className="readiness-scene-caption">Drag to rotate · illustrative scale</span>
    {failed ? <div className="workshop-render-fallback" role="status">3D unavailable. Use the packing buttons to continue.</div> : null}
  </div>;
}
