import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Maximize2, MousePointer2, Redo2, RotateCcw, Undo2, Trash2 } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createPartMeshByType } from '../scene/RocketMeshes';
import { PARTS, SLOTS } from '../data/parts';
import type { SlotInterface } from '../types/mission';
import { partName } from './catalog';

type Installed = Partial<Record<SlotInterface, string>>;
type Props = { installed: Installed; selectedId: string | null; targetSlot: SlotInterface | undefined; group: number; canUndo: boolean; canRedo: boolean; dragging: boolean; dropReady: boolean; onPlace: (id: string, slot: SlotInterface) => void; onInspect: (id: string) => void; onUndo: () => void; onRedo: () => void; onRemove: (slot: SlotInterface) => void };
type SceneHandle = { scene: THREE.Scene; rocket: THREE.Group; ghost: THREE.Group; preview: THREE.Group; camera: THREE.OrthographicCamera; controls: OrbitControls; render: () => void; resize: () => void; dispose: () => void; setView: (target: number, span?: number) => void; project: (point: THREE.Vector3) => { x: number; y: number } };
const metal = new THREE.MeshStandardMaterial({ color: 0x7e8797, metalness: .88, roughness: .28 });
const seam = new THREE.MeshStandardMaterial({ color: 0x3b4456, metalness: .82, roughness: .38 });
const lightMetal = new THREE.MeshStandardMaterial({ color: 0xd9dfe8, metalness: .64, roughness: .3 });
const ghostMaterial = new THREE.MeshStandardMaterial({ color: 0x74deef, emissive: 0x216b8a, emissiveIntensity: .32, metalness: .5, roughness: .25, transparent: true, opacity: .36, depthWrite: false, side: THREE.DoubleSide });
const focus: { target: number; span: number }[] = [{ target: 3.5, span: 74 }, { target: 22, span: 29 }, { target: 16, span: 28 }];
function detailPart(group: THREE.Group, slot: SlotInterface) {
  const ring = (radius: number, y: number, tube = .055) => { const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 7, 48), metal); mesh.rotation.x = Math.PI / 2; mesh.position.y = y; group.add(mesh); };
  const stencil = (words: string, radius: number, y: number) => { const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128; const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.clearRect(0, 0, 512, 128); ctx.font = '700 48px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#202838'; ctx.fillText(words, 256, 78); const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide }); for (const angle of [0, Math.PI / 2]) { const label = new THREE.Mesh(new THREE.PlaneGeometry(3.4, .85), mat); label.position.set(Math.sin(angle) * (radius + .04), y, Math.cos(angle) * (radius + .04)); label.rotation.y = angle; if (angle === 0) label.userData.temporaryTexture = texture; group.add(label); } };
  if (slot === 'booster-stage-1' || slot === 'booster-stage-2') {
    const height = slot === 'booster-stage-1' ? 18 : 10.5;
    for (const y of [-height * .42, -height * .26, 0, height * .26, height * .42]) ring(3.62, y, .035);
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(.055, height * .71, .06), lightMetal);
      rib.position.set(Math.sin(a) * 3.62, 0, Math.cos(a) * 3.62); rib.rotation.y = a; group.add(rib);
    }
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(3.63, 3.63, .28, 48), seam); lower.position.y = -height * .48; group.add(lower);
    stencil(slot === 'booster-stage-1' ? 'UNITED STATES' : 'STAGE II', 3.62, slot === 'booster-stage-1' ? -1 : 0);
  } else if (slot === 'booster-stage-3') {
    for (const y of [-2.8, -1.7, 1.8, 2.8]) ring(2.42, y, .038);
  } else if (slot === 'service-module') {
    for (const y of [-1.6, 1.65]) ring(1.93, y, .045);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4; const panel = new THREE.Mesh(new THREE.BoxGeometry(.46, 1.9, .08), i % 2 ? lightMetal : metal);
      panel.position.set(Math.sin(a) * 1.94, -.4, Math.cos(a) * 1.94); panel.rotation.y = a; group.add(panel);
    }
  } else if (slot === 'lunar-payload-bay' || slot === 'instrument-unit') {
    ring(slot === 'instrument-unit' ? 2.42 : 2.12, -.38, .045);
  }
  group.traverse(obj => { if (obj instanceof THREE.Mesh) { obj.castShadow = true; obj.receiveShadow = true; } });
}
function disposeMeshes(root: THREE.Object3D) { const materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>(); root.traverse(obj => { if (obj instanceof THREE.Mesh) { obj.geometry.dispose(); if (obj.userData.temporaryMaterial || obj.userData.temporaryTexture) materials.add(obj.material as THREE.Material); if (obj.userData.temporaryTexture) textures.add(obj.userData.temporaryTexture as THREE.Texture); } }); for (const material of materials) material.dispose(); for (const texture of textures) texture.dispose(); }
function buildScene(host: HTMLDivElement): SceneHandle | null {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); renderer.setClearColor(0x0b1123, 0); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.45; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D rocket assembly model'); host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x11162d, .006);
  const camera = new THREE.OrthographicCamera(-30, 30, 37, -37, .1, 300); camera.position.set(58, 26, 92);
  const rocket = new THREE.Group(); scene.add(rocket); const ghost = new THREE.Group(); scene.add(ghost); const preview = new THREE.Group(); scene.add(preview);
  scene.add(new THREE.HemisphereLight(0xc8deff, 0x555368, 2.2));
  const key = new THREE.DirectionalLight(0xfff2dd, 4.5); key.position.set(-19, 57, 36); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -45; key.shadow.camera.right = 45; key.shadow.camera.top = 58; key.shadow.camera.bottom = -58; key.shadow.bias = -.00015; scene.add(key);
  const rimLight = new THREE.DirectionalLight(0x78a7ff, 4); rimLight.position.set(23, 10, -18); scene.add(rimLight);
  const magenta = new THREE.PointLight(0xe090ff, 85, 100); magenta.position.set(-17, 8, 26); scene.add(magenta);
  const platform = new THREE.Group(); scene.add(platform);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(8.6, 64), new THREE.MeshStandardMaterial({ color: 0x394255, metalness: .82, roughness: .35 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -29.6; floor.receiveShadow = true; platform.add(floor);
  const platformSide = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 8.7, 1.2, 64), new THREE.MeshStandardMaterial({ color: 0x151c2d, metalness: .75, roughness: .38 })); platformSide.position.y = -30.25; platform.add(platformSide);
  for (let r of [5.1, 7.9]) { const track = new THREE.Mesh(new THREE.TorusGeometry(r, .065, 6, 64), new THREE.MeshBasicMaterial({ color: 0x8fb9dd })); track.rotation.x = Math.PI / 2; track.position.y = -29.52; platform.add(track); }
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8; const bolt = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .025, 8), metal); bolt.position.set(Math.sin(a) * 8.2, -29.48, Math.cos(a) * 8.2); platform.add(bolt);
  }
  const grid = new THREE.GridHelper(110, 24, 0x536280, 0x283049); grid.position.y = -30.88; scene.add(grid);
  const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(0, 3.5, 0); controls.enableDamping = true; controls.dampingFactor = .08; controls.enablePan = false; controls.minZoom = .72; controls.maxZoom = 4.2; controls.maxPolarAngle = Math.PI * .78; controls.update();
  let frame = 0, remaining = 0; const render = () => renderer.render(scene, camera);
  const tick = () => { controls.update(); render(); if (remaining-- > 0) frame = requestAnimationFrame(tick); else frame = 0; };
  const wake = () => { remaining = 90; if (!frame) frame = requestAnimationFrame(tick); };
  controls.addEventListener('start', wake); controls.addEventListener('end', wake); controls.addEventListener('change', render);
  const resize = () => { const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight); renderer.setSize(width, height, false); const aspect = width / height; camera.left = -37 * aspect; camera.right = 37 * aspect; camera.top = 37; camera.bottom = -37; camera.updateProjectionMatrix(); render(); };
  const setView = (target: number, span?: number) => { const delta = target - controls.target.y; camera.position.y += delta; controls.target.y = target; if (span) camera.zoom = 74 / span; camera.updateProjectionMatrix(); controls.update(); render(); };
  const project = (point: THREE.Vector3) => { const projected = point.clone().project(camera); return { x: (projected.x * .5 + .5) * host.clientWidth, y: (-projected.y * .5 + .5) * host.clientHeight }; };
  const dispose = () => { controls.enabled = false; cancelAnimationFrame(frame); controls.removeEventListener('start', wake); controls.removeEventListener('end', wake); controls.removeEventListener('change', render); controls.dispose(); disposeMeshes(rocket); disposeMeshes(ghost); disposeMeshes(preview); platform.traverse(obj => { if (obj instanceof THREE.Mesh) { obj.geometry.dispose(); if (obj.material instanceof THREE.Material) obj.material.dispose(); } }); grid.geometry.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  return { scene, rocket, ghost, preview, camera, controls, render, resize, dispose, setView, project };
}
export default function RocketBuilder3D({ installed, selectedId, targetSlot, group, canUndo, canRedo, dragging, dropReady, onPlace, onInspect, onUndo, onRedo, onRemove }: Props) {
  const [available, setAvailable] = useState(true);
  const [cameraTargetY, setCameraTargetY] = useState(focus[0].target);
  const [targetPosition, setTargetPosition] = useState<{ x: number; y: number } | null>(null);
  const host = useRef<HTMLDivElement>(null); const sceneRef = useRef<SceneHandle | null>(null); const pickRef = useRef<{ x: number; y: number } | null>(null);
  const installedRef = useRef(installed); const selectionRef = useRef({ selectedId, targetSlot, onPlace, onInspect });
  useEffect(() => { installedRef.current = installed; selectionRef.current = { selectedId, targetSlot, onPlace, onInspect }; }, [installed, selectedId, targetSlot, onPlace, onInspect]);
  const updateTargetPosition = useCallback(() => {
    const view = sceneRef.current;
    const target = selectionRef.current.targetSlot;
    const element = host.current;
    if (!view || !target || !element) { setTargetPosition(null); return; }
    const slot = SLOTS.find(item => item.id === target);
    if (!slot) { setTargetPosition(null); return; }
    const projected = view.project(new THREE.Vector3(...slot.position));
    setTargetPosition({ x: Math.max(92, Math.min(element.clientWidth - 92, projected.x)), y: Math.max(100, Math.min(element.clientHeight - 150, projected.y)) });
  }, []);
  useEffect(() => {
    const element = host.current; if (!element) return; const view = buildScene(element); if (!view) { setAvailable(false); return; } sceneRef.current = view; const observer = new ResizeObserver(() => { view.resize(); updateTargetPosition(); }); observer.observe(element); view.resize();
    const refreshTarget = () => updateTargetPosition();
    view.controls.addEventListener('change', refreshTarget);
    const pointerDown = (event: globalThis.PointerEvent) => { pickRef.current = { x: event.clientX, y: event.clientY }; };
    const pointerUp = (event: globalThis.PointerEvent) => { const origin = pickRef.current; pickRef.current = null; if (!origin || Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 5) return; const rect = element.getBoundingClientRect(); const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1), view.camera); const hits = ray.intersectObjects([...view.rocket.children, ...view.ghost.children], true); for (const hit of hits) { let item: THREE.Object3D | null = hit.object; while (item && item.parent !== view.rocket && item.parent !== view.ghost) item = item.parent; if (!item) continue; const slot = item.userData.slot as SlotInterface | undefined; if (!slot) continue; const installedId = installedRef.current[slot]; if (installedId) { selectionRef.current.onInspect(installedId); return; } const { selectedId: id, targetSlot: target } = selectionRef.current; if (id && target === slot) { selectionRef.current.onPlace(id, slot); return; } } };
    element.addEventListener('pointerdown', pointerDown); element.addEventListener('pointerup', pointerUp);
    return () => { observer.disconnect(); view.controls.removeEventListener('change', refreshTarget); element.removeEventListener('pointerdown', pointerDown); element.removeEventListener('pointerup', pointerUp); view.dispose(); sceneRef.current = null; };
  }, [updateTargetPosition]);
  useEffect(() => {
    const view = sceneRef.current; if (!view) return; while (view.rocket.children.length) { const child = view.rocket.children[0]; view.rocket.remove(child); disposeMeshes(child); }
    for (const slot of SLOTS) { const id = installed[slot.id]; if (!id || !PARTS[id]) continue; const part = createPartMeshByType(PARTS[id].meshType); part.position.set(...slot.position); part.userData.slot = slot.id; detailPart(part, slot.id); if (group === 2 && slot.id === 'lunar-payload-bay') { part.traverse(obj => { if (obj instanceof THREE.Mesh && obj.material !== ghostMaterial) { const mat = (obj.material as THREE.Material).clone(); mat.transparent = true; mat.opacity = .2; mat.depthWrite = false; obj.material = mat; obj.userData.temporaryMaterial = true; } }); } view.rocket.add(part); }
    view.render();
  }, [installed, group]);
  useEffect(() => {
    const view = sceneRef.current; if (!view) return; for (const parent of [view.ghost, view.preview]) while (parent.children.length) { const child = parent.children[0]; parent.remove(child); disposeMeshes(child); }
    if (selectedId && targetSlot && PARTS[selectedId] && !installed[targetSlot]) { const definition = SLOTS.find(s => s.id === targetSlot); if (definition) { const ghost = createPartMeshByType(PARTS[selectedId].meshType); ghost.position.set(...definition.position); ghost.userData.slot = targetSlot; ghost.traverse(obj => { if (obj instanceof THREE.Mesh) obj.material = ghostMaterial; }); view.ghost.add(ghost); } }
    if (selectedId && PARTS[selectedId] && !Object.values(installed).includes(selectedId)) { const sample = createPartMeshByType(PARTS[selectedId].meshType); const bounds = new THREE.Box3().setFromObject(sample); const size = bounds.getSize(new THREE.Vector3()); const scale = Math.min(13, Math.max(.48, group === 0 ? 8 / Math.max(size.x, size.y, size.z) : 10 / Math.max(size.x, size.y, size.z))); sample.scale.setScalar(scale); sample.position.set(group === 0 ? 15 : 14, focus[group].target + 1, 0); sample.traverse(obj => { if (obj instanceof THREE.Mesh) obj.castShadow = true; }); view.preview.add(sample); const bench = new THREE.Mesh(new THREE.CylinderGeometry(group === 0 ? 4.5 : 5, group === 0 ? 4.5 : 5, .38, 48), seam); bench.position.set(group === 0 ? 15 : 14, focus[group].target - 4.7, 0); view.preview.add(bench); const halo = new THREE.Mesh(new THREE.TorusGeometry(group === 0 ? 4.1 : 4.6, .045, 6, 48), new THREE.MeshBasicMaterial({ color: 0x66d7e8 })); halo.rotation.x = Math.PI / 2; halo.position.set(group === 0 ? 15 : 14, focus[group].target - 4.48, 0); halo.userData.temporaryMaterial = true; view.preview.add(halo); }
    view.render(); updateTargetPosition();
  }, [installed, selectedId, targetSlot, group, updateTargetPosition]);
  useEffect(() => { const view = sceneRef.current; if (!view) return; const { target, span } = focus[group]; setCameraTargetY(target); view.setView(target, span); updateTargetPosition(); }, [group,updateTargetPosition]);
  const moveVertically = (value: number) => { const next = Math.max(-46, Math.min(56, value)); setCameraTargetY(next); const view = sceneRef.current; if (!view) return; view.setView(next); updateTargetPosition(); };
  const fitView = () => { const { target, span } = focus[group]; setCameraTargetY(target); const view = sceneRef.current; if (view) { view.setView(target, span); updateTargetPosition(); } };
  const selectedSlot = selectedId && targetSlot ? targetSlot : undefined;
  const installedSlot = selectedId ? Object.entries(installed).find(([, id]) => id === selectedId)?.[0] as SlotInterface | undefined : undefined;
  const replacing = selectedSlot ? installed[selectedSlot] : undefined;
  return <section className={`rocket-builder-3d ${selectedSlot ? 'has-target' : ''} ${dragging ? 'dragging-part' : ''} ${dropReady ? 'drop-ready' : ''}`} aria-label="Realistic 3D assembly bay" data-slot={selectedSlot}>
    <div className="rocket-builder-canvas" ref={host} />
    {!available && <p className="builder-unavailable">3D is unavailable on this device. Choose the 2D tab to keep building your rocket.</p>}
    <div className="rocket-builder-top"><span className="builder-tag"><span /> REALISTIC 3D · ROCKET LAB</span><div className="builder-toolbar"><button className="builder-fit builder-icon-button" onClick={onUndo} disabled={!canUndo} aria-label="Undo last part" title="Undo"><Undo2 size={17} /></button><button className="builder-fit builder-icon-button" onClick={onRedo} disabled={!canRedo} aria-label="Redo last part" title="Redo"><Redo2 size={17} /></button><button className="builder-fit builder-icon-button" onClick={fitView} aria-label="Centre whole rocket" title="Centre rocket"><Maximize2 size={17} /></button></div></div>
    <div className="builder-side-label">{group === 0 ? 'YOUR ROCKET' : group === 1 ? 'CREW SYSTEMS' : 'DISCOVERY KIT'}<small>Drag to spin · wheel to zoom</small></div>
    {selectedId && !installedSlot && <div className="builder-bench-label">ON THE WORKBENCH<small>{partName(selectedId)} · not installed yet</small></div>}
    {selectedSlot && targetPosition && <button className={`builder-target ${replacing ? 'swap-target' : ''}`} style={{left:targetPosition.x,top:targetPosition.y}} data-slot={selectedSlot} onClick={() => onPlace(selectedId!, selectedSlot)} aria-label={replacing ? `Swap ${partName(replacing)} for ${partName(selectedId!)}` : `Place ${partName(selectedId!)}`}><span className="target-rings" aria-hidden="true"><span /></span></button>}
    <div className="builder-pan-slider" title="Move the camera along the whole rocket"><button type="button" onClick={()=>moveVertically(cameraTargetY+8)} aria-label="Move camera up"><ArrowUp size={15} /></button><input type="range" min="-46" max="56" step="1" value={cameraTargetY} onChange={event => moveVertically(Number(event.target.value))} aria-label="Move camera along the rocket" aria-valuetext={`Camera height ${Math.round(cameraTargetY)}`} /><button type="button" onClick={()=>moveVertically(cameraTargetY-8)} aria-label="Move camera down"><ArrowDown size={15} /></button></div>
    <div className="builder-bottom"><div className="builder-instructions"><MousePointer2 size={18} /><span>Spin your rocket<small>{selectedSlot ? replacing ? 'The yellow marker is ready to swap this bay.' : 'Follow the yellow marker.' : installedSlot ? 'This part is already on your rocket.' : 'Choose a part from the shelf.'}</small></span></div>{selectedSlot ? <button className={`builder-install ${replacing ? 'swap-install' : ''}`} data-slot={selectedSlot} onClick={() => onPlace(selectedId!, selectedSlot)}><Check size={18} />{replacing ? `Swap ${partName(replacing)}` : `Snap in ${partName(selectedId!)}`}</button> : installedSlot ? <button className="builder-remove" onClick={() => onRemove(installedSlot)}><Trash2 size={15} /> Remove {partName(selectedId!)}</button> : <span className="builder-ready"><RotateCcw size={16} /> {Object.keys(installed).length} parts installed</span>}</div>
  </section>;
}
