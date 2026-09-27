// Mission Forge - Interactive 3D Assembly Hangar Viewport
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PARTS, SLOTS } from '../data/parts';
import { useMissionStore } from '../state/missionStore';
import { AssemblyViewMode, SlotDefinition, SlotInterface } from '../types/mission';
import { createPartMeshByType, materials } from './RocketMeshes';

interface HangarViewportProps {
  onSlotClick?: (slotId: SlotInterface) => void;
  onPartClick?: (partId: string) => void;
}

export const HangarViewport: React.FC<HangarViewportProps> = ({ onSlotClick, onPartClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    installedParts,
    assemblyViewMode,
    isExplodedView,
    selectedSlotId,
    selectedPartId,
    isDraggingPartId,
    installPart,
    selectSlot,
    selectPart,
    setDraggingPartId
  } = useMissionStore();

  const [hoveredSlotId, setHoveredSlotId] = useState<SlotInterface | null>(null);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rocketGroupRef = useRef<THREE.Group | null>(null);
  const slotMeshesRef = useRef<Map<SlotInterface, THREE.Object3D>>(new Map());
  const installedMeshMapRef = useRef<Map<SlotInterface, THREE.Group>>(new Map());
  const ghostPreviewRef = useRef<THREE.Group | null>(null);

  // Target camera positions per view mode
  const cameraTargets: Record<AssemblyViewMode, { camY: number; camDist: number; lookAtY: number }> = {
    sciencePayload: { camY: 17, camDist: 6.8, lookAtY: 15.5 },
    crewSpacecraft: { camY: 26, camDist: 14.5, lookAtY: 23.5 },
    fullStack: { camY: 10, camDist: 48, lookAtY: 8.0 }
  };

  // Exploded view offsets along Y
  const getExplodedYOffset = (slot: SlotDefinition, isExploded: boolean): number => {
    if (!isExploded) return 0;
    const y = slot.position[1];
    if (y > 28) return 5.5; // Escape tower lifts high
    if (y > 23) return 3.5; // Capsule lifts
    if (y > 18) return 2.0; // Service module
    if (y > 14) return 1.0; // Lunar payload / science bay
    if (y > 6) return 0.0;
    if (y > -4) return -1.5;
    return -3.0; // Booster
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080d16); // Deep aerospace navy
    scene.fog = new THREE.FogExp2(0x080d16, 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const initialConfig = cameraTargets[assemblyViewMode];
    camera.position.set(0, initialConfig.camY, initialConfig.camDist);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, initialConfig.lookAtY, 0);
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Do not go under hangar floor
    controls.minDistance = 3.5;
    controls.maxDistance = 75;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x2d3a4f, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff6ea, 2.2);
    keyLight.position.set(25, 40, 30);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x64d8ed, 1.1);
    fillLight.position.set(-25, 20, -20);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.8);
    rimLight.position.set(0, -10, -35);
    scene.add(rimLight);

    // Hangar Floor & Grid
    const floorGeo = new THREE.PlaneGeometry(160, 160);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a101d,
      roughness: 0.85,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -20;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(120, 60, 0x1e293b, 0x0f172a);
    grid.position.y = -19.98;
    scene.add(grid);

    // Launch Pad / Assembly Stand
    const standGeo = new THREE.CylinderGeometry(8.5, 9.5, 2.5, 36);
    const stand = new THREE.Mesh(standGeo, materials.darkStructure);
    stand.position.y = -18.75;
    stand.receiveShadow = true;
    stand.castShadow = true;
    scene.add(stand);

    // Rocket Root Group
    const rocketGroup = new THREE.Group();
    rocketGroup.name = 'assembly_rocket_group';
    scene.add(rocketGroup);
    rocketGroupRef.current = rocketGroup;

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth camera interpolation towards target
      if (cameraRef.current && controlsRef.current) {
        controlsRef.current.update();
      }

      // Slot indicator animations (subtle breathing pulse)
      const time = performance.now() * 0.003;
      slotMeshesRef.current.forEach((slotObj) => {
        if (slotObj.visible) {
          const scale = 1.0 + Math.sin(time) * 0.05;
          slotObj.scale.set(scale, scale, scale);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Smooth camera repositioning when view mode changes
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const targetConfig = cameraTargets[assemblyViewMode];
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    // Animate smoothly
    const startCamPos = camera.position.clone();
    const endCamPos = new THREE.Vector3(0, targetConfig.camY, targetConfig.camDist);
    const startTarget = controls.target.clone();
    const endTarget = new THREE.Vector3(0, targetConfig.lookAtY, 0);

    let t = 0;
    const startTime = performance.now();
    const duration = 750;

    const tweenCam = () => {
      const elapsed = performance.now() - startTime;
      t = Math.min(1, elapsed / duration);
      const ease = 0.5 - Math.cos(t * Math.PI) * 0.5;

      camera.position.lerpVectors(startCamPos, endCamPos, ease);
      controls.target.lerpVectors(startTarget, endTarget, ease);
      controls.update();

      if (t < 1) {
        requestAnimationFrame(tweenCam);
      }
    };
    tweenCam();
  }, [assemblyViewMode]);

  // Update Installed Meshes and Slot Hit Targets
  useEffect(() => {
    const rocketGroup = rocketGroupRef.current;
    if (!rocketGroup) return;

    // Clear previous dynamic meshes
    installedMeshMapRef.current.forEach((mesh) => rocketGroup.remove(mesh));
    installedMeshMapRef.current.clear();

    slotMeshesRef.current.forEach((mesh) => rocketGroup.remove(mesh));
    slotMeshesRef.current.clear();

    // Rebuild parts and slot markers
    SLOTS.forEach((slot) => {
      const isVisibleInView =
        assemblyViewMode === 'fullStack' ||
        slot.viewMode === assemblyViewMode ||
        (assemblyViewMode === 'crewSpacecraft' && slot.category === 'crewSupport');

      const yOffset = getExplodedYOffset(slot, isExplodedView);
      const slotPos = new THREE.Vector3(
        slot.position[0],
        slot.position[1] + yOffset,
        slot.position[2]
      );

      const installedPartId = installedParts[slot.id];

      // If part is installed, create its 3D mesh
      if (installedPartId) {
        const partDef = PARTS[installedPartId];
        if (partDef) {
          const partMesh = createPartMeshByType(partDef.meshType);
          partMesh.position.copy(slotPos);
          partMesh.userData = { slotId: slot.id, partId: installedPartId };

          // Visual highlight if selected
          if (selectedPartId === installedPartId || selectedSlotId === slot.id) {
            const bbox = new THREE.Box3().setFromObject(partMesh);
            const helper = new THREE.Box3Helper(bbox, new THREE.Color(0x64d8ed));
            partMesh.add(helper);
          }

          rocketGroup.add(partMesh);
          installedMeshMapRef.current.set(slot.id, partMesh);
        }
      }

      // Slot target marker (visible when empty or dragging compatible part)
      if (isVisibleInView) {
        const isHovered = hoveredSlotId === slot.id;
        const isSelected = selectedSlotId === slot.id;
        const isDragging = Boolean(isDraggingPartId);
        const draggingPart = isDraggingPartId ? PARTS[isDraggingPartId] : null;
        const isCompatible = draggingPart?.compatibleSlots.includes(slot.id);

        const slotMarkerGroup = new THREE.Group();
        slotMarkerGroup.position.copy(slotPos);
        slotMarkerGroup.userData = { slotId: slot.id, isSlotTarget: true };

        // Invisible raycast hit box for reliable pointer interaction
        const hitBoxGeo = new THREE.BoxGeometry(2.4, 1.8, 2.4);
        const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
        hitBox.userData = { slotId: slot.id, isSlotTarget: true };
        slotMarkerGroup.add(hitBox);

        // Visible indicator ring
        const ringGeo = new THREE.RingGeometry(0.7, 0.9, 32);
        ringGeo.rotateX(-Math.PI / 2);

        let ringColor = 0x3b82f6; // steel blue
        let ringOpacity = 0.55;

        if (isHovered || (isDragging && isCompatible)) {
          ringColor = 0x10b981; // vibrant emerald snap target
          ringOpacity = 0.95;
        } else if (isSelected) {
          ringColor = 0x64d8ed; // cyan
          ringOpacity = 0.9;
        } else if (!installedPartId && slot.isMandatory) {
          ringColor = 0x38bdf8; // pulsing sky blue
          ringOpacity = 0.75;
        }

        const ringMat = new THREE.MeshBasicMaterial({
          color: ringColor,
          transparent: true,
          opacity: ringOpacity,
          side: THREE.DoubleSide
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        slotMarkerGroup.add(ringMesh);

        rocketGroup.add(slotMarkerGroup);
        slotMeshesRef.current.set(slot.id, slotMarkerGroup);
      }
    });
  }, [
    installedParts,
    assemblyViewMode,
    isExplodedView,
    selectedSlotId,
    selectedPartId,
    hoveredSlotId,
    isDraggingPartId
  ]);

  // Handle Drag & Drop Hover / Raycasting
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!rendererRef.current || !cameraRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const hitTargets: THREE.Object3D[] = [];
    slotMeshesRef.current.forEach((obj) => hitTargets.push(obj));
    installedMeshMapRef.current.forEach((obj) => hitTargets.push(obj));

    const intersects = raycaster.intersectObjects(hitTargets, true);

    if (intersects.length > 0) {
      // Find closest object with slotId
      let current: THREE.Object3D | null = intersects[0].object;
      while (current && !current.userData?.slotId) {
        current = current.parent;
      }
      if (current?.userData?.slotId) {
        const slotId = current.userData.slotId as SlotInterface;
        setHoveredSlotId(slotId);
        return;
      }
    }

    setHoveredSlotId(null);
  };

  const handlePointerUp = () => {
    if (isDraggingPartId && hoveredSlotId) {
      const part = PARTS[isDraggingPartId];
      if (part && part.compatibleSlots.includes(hoveredSlotId)) {
        installPart(hoveredSlotId, isDraggingPartId);
      }
      setDraggingPartId(null);
      setHoveredSlotId(null);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!rendererRef.current || !cameraRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const hitTargets: THREE.Object3D[] = [];
    slotMeshesRef.current.forEach((obj) => hitTargets.push(obj));
    installedMeshMapRef.current.forEach((obj) => hitTargets.push(obj));

    const intersects = raycaster.intersectObjects(hitTargets, true);

    if (intersects.length > 0) {
      let current: THREE.Object3D | null = intersects[0].object;
      while (current && !current.userData?.slotId) {
        current = current.parent;
      }
      if (current?.userData?.slotId) {
        const slotId = current.userData.slotId as SlotInterface;
        selectSlot(slotId);
        if (onSlotClick) onSlotClick(slotId);

        const installedPartId = installedParts[slotId];
        if (installedPartId) {
          selectPart(installedPartId);
          if (onPartClick) onPartClick(installedPartId);
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden bg-[#060a12]"
      onPointerLeave={() => {
        setHoveredSlotId(null);
        if (isDraggingPartId) setDraggingPartId(null);
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />

      {/* Floating View Controls Overlay */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#0d1522]/90 backdrop-blur-md border border-[#1e293b] rounded-lg p-1.5 shadow-xl text-xs text-[#a7b6c9]">
        <span className="font-mono text-[10px] uppercase text-[#64d8ed] px-2 font-semibold">
          3D Assembly Studio
        </span>
        <div className="h-4 w-[1px] bg-[#1e293b]" />
        <button
          type="button"
          onClick={() => {
            if (controlsRef.current && cameraRef.current) {
              const target = cameraTargets[assemblyViewMode];
              cameraRef.current.position.set(0, target.camY, target.camDist);
              controlsRef.current.target.set(0, target.lookAtY, 0);
              controlsRef.current.update();
            }
          }}
          className="px-2.5 py-1 rounded bg-[#142032] hover:bg-[#1e2f46] text-[#f2f5fa] transition-colors"
          title="Reset Camera Orientation"
        >
          Reset View
        </button>
      </div>

      {/* Viewport Hint */}
      <div className="absolute bottom-4 right-4 pointer-events-none bg-[#0d1522]/80 backdrop-blur-sm border border-[#1e293b] rounded-md px-3 py-1.5 text-[11px] text-[#a7b6c9]">
        <span>Left-click + drag to orbit • Right-click to pan • Scroll to zoom</span>
      </div>

      {/* Hovered Slot Banner */}
      {hoveredSlotId && (
        <div className="absolute top-4 right-4 pointer-events-none bg-[#0d1522]/95 border border-[#64d8ed] rounded-lg px-3 py-2 shadow-2xl animate-in fade-in duration-150">
          <div className="text-[10px] uppercase tracking-wider text-[#64d8ed] font-mono">
            Target Slot
          </div>
          <div className="text-xs font-semibold text-[#f2f5fa]">
            {SLOTS.find((s) => s.id === hoveredSlotId)?.name}
          </div>
          {installedParts[hoveredSlotId] ? (
            <div className="text-[11px] text-[#10b981]">
              Mounted: {PARTS[installedParts[hoveredSlotId]!]?.name}
            </div>
          ) : (
            <div className="text-[11px] text-[#93c5fd]">Empty (Ready for Installation)</div>
          )}
        </div>
      )}
    </div>
  );
};
