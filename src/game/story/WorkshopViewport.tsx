import { useEffect, useRef, useState } from 'react';
import { Expand, RotateCcw, RotateCw, Undo2, Redo2 } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { PreparationSelection } from './design.ts';
import { WORKSHOP_PARTS, installedIds, partById } from './preparation.ts';
import { attachmentPosition, buildAssembly, createPartMesh, disposeGroup } from './workshopMeshes.ts';
import { useGameSettings } from './gameSettingsContext.ts';

let thumbnailCache: Record<string, string> | undefined;

export function WorkshopViewport({ preparation, draggingId, lastInstalled, canUndo, canRedo, onUndo, onRedo, onThumbnails, onMeshError }: {
  preparation: PreparationSelection; draggingId: string | null; lastInstalled: string | null;
  canUndo: boolean; canRedo: boolean; onUndo(): void; onRedo(): void;
  onThumbnails(images: Record<string, string>): void; onMeshError(): void;
}) {
  const { gentle } = useGameSettings();
  const gentleMotion = useRef(gentle);
  const host = useRef<HTMLDivElement>(null);
  const model = useRef({ preparation, draggingId, lastInstalled });
  const repaint = useRef<() => void>(() => {});
  const fit = useRef<() => void>(() => {});
  const rotate = useRef<(direction: number) => void>(() => {});
  const thumbnailCallback = useRef(onThumbnails), errorCallback = useRef(onMeshError);
  const [failed, setFailed] = useState(false);
  useEffect(() => { gentleMotion.current = gentle; repaint.current(); }, [gentle]);
  useEffect(() => { thumbnailCallback.current = onThumbnails; errorCallback.current = onMeshError; }, [onThumbnails, onMeshError]);
  useEffect(() => { model.current = { preparation, draggingId, lastInstalled }; repaint.current(); }, [preparation, draggingId, lastInstalled]);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch { queueMicrotask(() => { if (!disposed) { setFailed(true); errorCallback.current(); } }); return () => { disposed = true; }; }
    let frame = 0, lastFrame = 0, dirty = true;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 80);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
    const light = new THREE.HemisphereLight(0xebddff, 0x241230, 2.6); scene.add(light);
    const key = new THREE.DirectionalLight(0xffffff, 3.7); key.position.set(3, 6, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x99cbff, 2.5); rim.position.set(-5, 2, -3); scene.add(rim);
    // One renderer generates the whole shelf, rather than one WebGL context per card.
    const images: Record<string, string> = {};
    renderer.setPixelRatio(1); renderer.setSize(180, 150, false);
    for (const part of thumbnailCache ? [] : WORKSHOP_PARTS) {
      const object = createPartMesh(part.id); scene.add(object);
      const bounds = new THREE.Box3().setFromObject(object), centre = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3()).length();
      camera.position.copy(centre).add(new THREE.Vector3(1.3, .85, 1.65).normalize().multiplyScalar(size * 1.8)); camera.lookAt(centre);
      camera.aspect = 1.2; camera.updateProjectionMatrix(); renderer.render(scene, camera);
      images[part.id] = renderer.domElement.toDataURL('image/png'); scene.remove(object); disposeGroup(object);
    }
    thumbnailCache ??= images;
    const shelfImages = thumbnailCache;
    queueMicrotask(() => { if (!disposed) thumbnailCallback.current(shelfImages); });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    mount.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true;
    const changed = () => { dirty = true; }; controls.addEventListener('change', changed);
    controls.minDistance = 3.8; controls.maxDistance = 80; controls.maxPolarAngle = Math.PI * .49; controls.target.set(0, 1, 0);
    let aspectScale = 1;
    fit.current = () => { controls.target.set(0, 1, 0); camera.position.copy(controls.target).add(new THREE.Vector3(8.3, 4.4, 10.5).multiplyScalar(aspectScale)); controls.update(); };
    fit.current();
    rotate.current = direction => { const relative = camera.position.clone().sub(controls.target); relative.applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * .35); camera.position.copy(controls.target).add(relative); controls.update(); };
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.1, .1, 64), new THREE.MeshStandardMaterial({ color: 0x25203e, metalness: .45, roughness: .7 }));
    platform.position.y = -.06; scene.add(platform);
    const grid = new THREE.GridHelper(10, 20, 0x78668d, 0x38304e); grid.position.y = .008;
    (grid.material as THREE.Material).transparent = true; (grid.material as THREE.Material).opacity = .22; scene.add(grid);
    const indicator = new THREE.Group(); scene.add(indicator);
    const point = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffdf60 })); indicator.add(point);
    for (let i = 0; i < 2; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(.19 + i * .11, .012, 6, 36), new THREE.MeshBasicMaterial({ color: 0xffdf60, transparent: true, opacity: .65, depthTest: false })); indicator.add(ring); }
    let assembly = new THREE.Group(); scene.add(assembly);
    let previousPreparation: PreparationSelection | null = null, animatedPart: THREE.Object3D | undefined, targetY = 0, snapStart = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      if (disposed) return;
      const state = model.current;
      if (previousPreparation !== state.preparation) {
        scene.remove(assembly); disposeGroup(assembly); assembly = buildAssembly(state.preparation); scene.add(assembly);
        previousPreparation = state.preparation;
        animatedPart = !gentleMotion.current && !reduced.matches && state.lastInstalled ? assembly.getObjectByName(state.lastInstalled) : undefined;
        if (animatedPart) { targetY = animatedPart.position.y; animatedPart.position.y += .5; snapStart = performance.now(); }
      }
      dirty = true;
      controls.enabled = !state.draggingId;
      indicator.visible = !!state.draggingId;
      if (state.draggingId) indicator.position.copy(attachmentPosition(state.draggingId));
      render(performance.now());
    };
    const render = (time: number) => {
      if (disposed || document.hidden) return;
      if (time - lastFrame > 30) {
        controls.enableDamping = !gentleMotion.current && !reduced.matches;
        controls.update();
        if (!dirty && !animatedPart && !indicator.visible) return;
        if (animatedPart) { const fraction = gentleMotion.current || reduced.matches ? 1 : Math.min(1, (time - snapStart) / 240); animatedPart.position.y = targetY + .5 * Math.pow(1 - fraction, 3); if (fraction === 1) animatedPart = undefined; }
        if (indicator.visible) { indicator.quaternion.copy(camera.quaternion); const scale = gentleMotion.current || reduced.matches ? 1 : 1 + Math.sin(time / 160) * .11; indicator.scale.setScalar(scale); }
        renderer.render(scene, camera); lastFrame = time; dirty = false;
      }
    };
    const animate = (time: number) => { render(time); if (!disposed && !document.hidden) frame = requestAnimationFrame(animate); };
    const resume = () => { cancelAnimationFrame(frame); if (!disposed && !document.hidden) frame = requestAnimationFrame(animate); };
    repaint.current = update;
    const resize = () => { const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
      // Preserve the viewing angle and user zoom when a tall/narrow bay is resized.
      const nextScale = Math.max(1, 1.2 / camera.aspect);
      camera.position.sub(controls.target).multiplyScalar(nextScale / aspectScale).add(controls.target);
      aspectScale = nextScale; controls.update(); lastFrame = 0; dirty = true; render(performance.now()); };
    const observer = new ResizeObserver(resize); observer.observe(mount);
    const contextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); setFailed(true); errorCallback.current(); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    document.addEventListener('visibilitychange', resume);
    resize(); update(); resume();
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); controls.removeEventListener('change', changed); controls.dispose();
      document.removeEventListener('visibilitychange', resume); renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      repaint.current = () => {}; fit.current = () => {}; rotate.current = () => {};
      disposeGroup(scene); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, []);
  return <div className="workshop-viewport">
    <div className="workshop-canvas" ref={host} role="img" aria-label={`3D assembly with ${installedIds(preparation).length} installed parts`} />
    {failed ? <div className="workshop-render-fallback" role="status">3D unavailable. Use the Install buttons to keep building.</div> : null}
    <span className="workshop-viewport-badge">3D WORKSHOP</span>
    <div className="workshop-camera-controls">
      <button className="conversation-icon" onClick={onUndo} disabled={!canUndo} aria-label="Undo installation" title="Undo"><Undo2 size={19} /></button>
      <button className="conversation-icon" onClick={onRedo} disabled={!canRedo} aria-label="Redo installation" title="Redo"><Redo2 size={19} /></button>
      <button className="conversation-icon" onClick={() => fit.current()} aria-label="Fit spacecraft" title="Fit spacecraft"><Expand size={19} /></button>
    </div>
    <div className="workshop-orbit-controls">
      <button className="conversation-icon" onClick={() => rotate.current(-1)} aria-label="Rotate view left"><RotateCcw size={18} /></button>
      <span>Drag to rotate · scroll to zoom</span>
      <button className="conversation-icon" onClick={() => rotate.current(1)} aria-label="Rotate view right"><RotateCw size={18} /></button>
    </div>
    {!installedIds(preparation).length ? <div className="workshop-empty">Your workbench is empty.</div> : null}
    <div className="workshop-vehicle-labels"><span>Lander</span><span>{partById(preparation.roverId)?.name ?? 'Rover bay'}</span></div>
  </div>;
}
