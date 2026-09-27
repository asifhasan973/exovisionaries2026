// Mission Forge - Cartoon Ascent & Earth Parking Orbit 3D Simulation (Kids Edition)
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { sound } from '../audio/soundEngine';
import { ASCENT_MILESTONES, TOTAL_ASCENT_FLIGHT_SECONDS, sampleAscentTelemetry } from '../engine/ascent-profile';
import { useMissionStore } from '../state/missionStore';
import {
  createCrewCapsuleMesh,
  createEscapeTowerMesh,
  createInstrumentUnitMesh,
  createInterstage1Mesh,
  createInterstage2Mesh,
  createLunarPayloadMesh,
  createServiceModuleMesh,
  createStage1Mesh,
  createStage2Mesh,
  createStage3Mesh
} from './RocketMeshes';

export const AscentScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    ascentProgress,
    isAscentPaused,
    setAscentProgress,
    setPhase,
    audioSettings
  } = useMissionStore();

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Flight Objects
  const rocketGroupRef = useRef<THREE.Group | null>(null);
  const stage1Ref = useRef<THREE.Group | null>(null);
  const interstage1Ref = useRef<THREE.Group | null>(null);
  const stage2Ref = useRef<THREE.Group | null>(null);
  const interstage2Ref = useRef<THREE.Group | null>(null);
  const stage3Ref = useRef<THREE.Group | null>(null);
  const iuRef = useRef<THREE.Group | null>(null);
  const slaRef = useRef<THREE.Group | null>(null);
  const smRef = useRef<THREE.Group | null>(null);
  const cmRef = useRef<THREE.Group | null>(null);
  const lesRef = useRef<THREE.Group | null>(null);

  // Celestial & Environment
  const earthRef = useRef<THREE.Mesh | null>(null);
  const cloudsRef = useRef<THREE.Mesh | null>(null);
  const atmosphereRef = useRef<THREE.Mesh | null>(null);
  const padRef = useRef<THREE.Group | null>(null);
  const plumeRef = useRef<THREE.Group | null>(null);

  const lastMilestoneIdxRef = useRef<number>(-1);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060920); // Vibrant deep space indigo
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    // Warm Sun & Colorful Space Lighting
    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.8);
    sunLight.position.set(200, 150, 250);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x283568, 0.8);
    scene.add(ambientLight);

    // Deep Space Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3500;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 1200 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Beautiful Colorful Earth Sphere
    const earthRadius = 600;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x1d5ba8,
      roughness: 0.45,
      metalness: 0.15
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.set(0, -680, 0);
    scene.add(earth);
    earthRef.current = earth;

    // Glowing Cyan Atmospheric Ring
    const atmoGeo = new THREE.SphereGeometry(earthRadius + 8, 64, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45,
      side: THREE.BackSide
    });
    const atmo = new THREE.Mesh(atmoGeo, atmoMat);
    earth.add(atmo);
    atmosphereRef.current = atmo;

    // Rotating Clouds
    const cloudGeo = new THREE.SphereGeometry(earthRadius + 4, 48, 48);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      roughness: 0.8
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    earth.add(clouds);
    cloudsRef.current = clouds;

    // Launch Pad Surface
    const padGroup = new THREE.Group();
    const padSurfaceGeo = new THREE.PlaneGeometry(800, 800);
    const padSurfaceMat = new THREE.MeshStandardMaterial({ color: 0x111638, roughness: 0.9 });
    const padSurface = new THREE.Mesh(padSurfaceGeo, padSurfaceMat);
    padSurface.rotation.x = -Math.PI / 2;
    padSurface.position.y = -22;
    padGroup.add(padSurface);

    // Red Launch Umbilical Tower
    const towerGeo = new THREE.BoxGeometry(4.5, 75, 4.5);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.3 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-14, 15, 0);
    padGroup.add(tower);
    scene.add(padGroup);
    padRef.current = padGroup;

    // Rocket Stack Group
    const rocket = new THREE.Group();
    scene.add(rocket);
    rocketGroupRef.current = rocket;

    // Assemble Staged Rocket Modules
    const s1 = createStage1Mesh();
    s1.position.y = -18;
    rocket.add(s1);
    stage1Ref.current = s1;

    const is1 = createInterstage1Mesh();
    is1.position.y = -7.5;
    rocket.add(is1);
    interstage1Ref.current = is1;

    const s2 = createStage2Mesh();
    s2.position.y = -1.5;
    rocket.add(s2);
    stage2Ref.current = s2;

    const is2 = createInterstage2Mesh();
    is2.position.y = 4.5;
    rocket.add(is2);
    interstage2Ref.current = is2;

    const s3 = createStage3Mesh();
    s3.position.y = 8.5;
    rocket.add(s3);
    stage3Ref.current = s3;

    const iu = createInstrumentUnitMesh();
    iu.position.y = 13.0;
    rocket.add(iu);
    iuRef.current = iu;

    const sla = createLunarPayloadMesh();
    sla.position.y = 16.5;
    rocket.add(sla);
    slaRef.current = sla;

    const sm = createServiceModuleMesh();
    sm.position.y = 21.0;
    rocket.add(sm);
    smRef.current = sm;

    const cm = createCrewCapsuleMesh();
    cm.position.y = 25.2;
    rocket.add(cm);
    cmRef.current = cm;

    const les = createEscapeTowerMesh();
    les.position.y = 31.0;
    rocket.add(les);
    lesRef.current = les;

    // Dynamic Rocket Plume
    const plumeGroup = new THREE.Group();
    const flameGeo = new THREE.ConeGeometry(2.8, 16, 16);
    flameGeo.rotateX(Math.PI);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.9
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = -8;
    plumeGroup.add(flame);

    const coreGeo = new THREE.ConeGeometry(1.4, 12, 16);
    coreGeo.rotateX(Math.PI);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.98 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = -6;
    plumeGroup.add(core);

    rocket.add(plumeGroup);
    plumeRef.current = plumeGroup;

    if (!audioSettings.isMuted) {
      sound.startRocketRoar();
    }

    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const currentProg = useMissionStore.getState().ascentProgress;
      const isPaused = useMissionStore.getState().isAscentPaused;

      let nextProg = currentProg;
      if (!isPaused && currentProg < 1.0) {
        const rate = 1.0 / 50.0; // Playful, fast-paced 50s flight
        nextProg = Math.min(1.0, currentProg + delta * rate);
        setAscentProgress(nextProg);
      }

      const met = nextProg * TOTAL_ASCENT_FLIGHT_SECONDS;
      const telem = sampleAscentTelemetry(nextProg);

      const currentMilestoneIdx = ASCENT_MILESTONES.findIndex(
        (m, idx) =>
          met >= m.timeSeconds &&
          (idx === ASCENT_MILESTONES.length - 1 || met < ASCENT_MILESTONES[idx + 1].timeSeconds)
      );

      if (currentMilestoneIdx !== -1 && currentMilestoneIdx !== lastMilestoneIdxRef.current) {
        lastMilestoneIdxRef.current = currentMilestoneIdx;
        const milestone = ASCENT_MILESTONES[currentMilestoneIdx];
        if (milestone.isStagingEvent) {
          sound.playStagingThud();
        } else if (milestone.cameraCue === 'orbitCoast') {
          sound.stopRocketRoar();
          sound.playFanfare();
          setPhase('orbit');
        } else {
          sound.playRadioBeep(true);
        }
      }

      const vacuumRatio = Math.min(1, telem.altitudeKm / 120);
      sound.updateRocketIntensity(telem.activeEngines > 0 ? 1.0 : 0.0, vacuumRatio);

      if (cloudsRef.current) {
        cloudsRef.current.rotation.y += 0.0004;
      }

      // Stage 1 separation
      if (stage1Ref.current && interstage1Ref.current) {
        if (met > 162) {
          const sepT = (met - 162);
          stage1Ref.current.position.y = -18 - sepT * 2.5;
          stage1Ref.current.rotation.z += 0.003;
          stage1Ref.current.visible = sepT < 30;

          if (met > 192) {
            interstage1Ref.current.position.y = -7.5 - (met - 192) * 2.2;
          }
        }
      }

      // LES Jettison
      if (lesRef.current) {
        if (met > 195) {
          const lesT = (met - 195);
          lesRef.current.position.y = 31.0 + lesT * 4.5;
          lesRef.current.position.x = lesT * 1.5;
          lesRef.current.rotation.z -= 0.008;
          lesRef.current.visible = lesT < 25;
        }
      }

      // Stage 2 separation
      if (stage2Ref.current && interstage2Ref.current) {
        if (met > 520) {
          const sep2T = (met - 520);
          stage2Ref.current.position.y = -1.5 - sep2T * 3.0;
          stage2Ref.current.rotation.x += 0.002;
          stage2Ref.current.visible = sep2T < 30;
        }
      }

      // Plume behavior
      if (plumeRef.current) {
        if (telem.activeEngines === 0) {
          plumeRef.current.visible = false;
        } else {
          plumeRef.current.visible = true;
          const expansion = 1.0 + vacuumRatio * 2.5;
          plumeRef.current.scale.set(expansion, 1.0 + Math.random() * 0.15, expansion);

          if (met <= 162) {
            plumeRef.current.position.y = -20;
          } else if (met <= 520) {
            plumeRef.current.position.y = -6.5;
          } else {
            plumeRef.current.position.y = 4.5;
          }
        }
      }

      // Camera transitions
      if (cameraRef.current && rocketGroupRef.current) {
        const cam = cameraRef.current;
        const rocket = rocketGroupRef.current;

        if (met < 15) {
          padRef.current!.visible = true;
          const liftH = (met / 15) * 8;
          rocket.position.set(0, liftH, 0);
          rocket.rotation.set(0, 0, 0);

          cam.position.set(18, liftH + 6, 26);
          cam.lookAt(0, liftH + 12, 0);
        } else if (met < 162) {
          padRef.current!.visible = met < 40;
          const pitchAngle = Math.min(0.65, ((met - 15) / 147) * 0.65);
          rocket.rotation.z = -pitchAngle;

          cam.position.set(22, 12, 38);
          cam.lookAt(0, 12, 0);
          earthRef.current!.position.y = -680 - telem.altitudeKm * 3.5;
        } else if (met < 520) {
          rocket.rotation.z = -0.75;
          cam.position.set(16, 18, 28);
          cam.lookAt(0, 18, 0);
          earthRef.current!.position.y = -900 - (telem.altitudeKm - 67) * 1.5;
        } else {
          rocket.rotation.z = -Math.PI / 2;
          cam.position.set(12, 22, 22);
          cam.lookAt(0, 20, 0);
          earthRef.current!.position.set(0, -620, -100);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

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
      sound.stopRocketRoar();
      renderer.dispose();
    };
  }, []);

  const telem = sampleAscentTelemetry(ascentProgress);

  return (
    <div ref={containerRef} className="relative w-full h-full select-none bg-black overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Aerospace Flight Telemetry HUD */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        {/* Mission Status Badge */}
        <div className="glass-panel p-3 min-w-[280px] rounded-xl border border-cyan-500/40 shadow-xl">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
            <span className="text-cyan-400 font-semibold tracking-wider uppercase">MET CLOCK</span>
            <span className="font-bold text-white text-xs font-mono">
              T+{String(Math.floor(telem.metSeconds / 60)).padStart(2, '0')}:
              {String(telem.metSeconds % 60).padStart(2, '0')}
            </span>
          </div>
          <div className="text-sm font-heading font-bold text-white">{telem.phaseTitle}</div>
          <div className="text-[11px] font-mono text-cyan-300 mt-0.5">{telem.stageName}</div>
        </div>

        {/* Flight Dynamics Gauges */}
        <div className="grid grid-cols-2 gap-1.5 glass-panel p-2.5 rounded-xl border border-white/10 text-xs font-mono">
          <div className="p-1 rounded bg-black/30">
            <span className="text-slate-400 text-[10px] uppercase block">Altitude</span>
            <strong className="text-slate-100 text-xs">{telem.altitudeKm} km</strong>
          </div>
          <div className="p-1 rounded bg-black/30">
            <span className="text-slate-400 text-[10px] uppercase block">Velocity</span>
            <strong className="text-emerald-400 text-xs">
              {telem.velocityMs} m/s
              <span className="text-[9px] text-slate-400 block font-normal">
                ({telem.velocityKmh.toLocaleString()} km/h)
              </span>
            </strong>
          </div>
          <div className="p-1 rounded bg-black/30">
            <span className="text-slate-400 text-[10px] uppercase block">Acceleration</span>
            <strong className="text-amber-400 text-xs">{telem.gForce} G</strong>
          </div>
          <div className="p-1 rounded bg-black/30">
            <span className="text-slate-400 text-[10px] uppercase block">Propellant</span>
            <strong className="text-slate-100 text-xs">{telem.propellantPercent}%</strong>
          </div>
        </div>
      </div>

      {/* Flight Control Bar */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            sound.playClick(600);
            useMissionStore.getState().toggleAscentPause();
          }}
          className="btn-aerospace-dark px-3 py-1.5 text-xs font-mono font-medium"
        >
          {isAscentPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          onClick={() => {
            sound.stopRocketRoar();
            sound.playFanfare();
            setAscentProgress(1.0);
            setPhase('orbit');
          }}
          className="btn-aerospace-primary px-3.5 py-1.5 text-xs font-mono font-semibold"
        >
          Skip to Orbit ➔
        </button>
      </div>

      {/* CapCom Radio Chatter Subtitles */}
      {audioSettings.captionsEnabled && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-lg w-[90%] glass-panel p-3 rounded-xl border border-cyan-500/40 flex items-center gap-3 shadow-2xl">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 font-mono text-[10px] font-bold">
            TX
          </div>
          <div className="text-left font-mono">
            <div className="text-[10px] uppercase font-semibold text-cyan-400 tracking-wider">
              CAPCOM FLIGHT LOOP
            </div>
            <div className="text-xs text-white leading-snug mt-0.5">
              {telem.callout}
            </div>
          </div>
        </div>
      )}

      {/* Staging Flash Banner */}
      {telem.isStagingEvent && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 glass-panel text-amber-300 font-mono font-semibold text-xs uppercase px-4 py-1.5 rounded-full shadow-2xl border border-amber-400 shadow-amber-500/20">
          ⚡ {telem.stagingMessage || 'STAGE SEPARATION!'}
        </div>
      )}
    </div>
  );
};
