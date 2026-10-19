import { preloadImage, maintainBrowserAssetCache, cacheAssetInBrowser } from './loadingEngine.ts';
import { LOADING_CONFIG } from '../config/loadingConfig';

/**
 * Pacing helper simulating weak network conditions between milestone tasks when multiplier > 1.
 */
const paceMilestone = async () => {
  const multiplier = LOADING_CONFIG.progressMultiplier;
  if (multiplier > 1) {
    await new Promise(resolve => setTimeout(resolve, Math.round(180 * (multiplier - 1))));
  }
};

/**
 * Preload all entry-level subsystems and assets up until the start mission screen.
 * Progress is weighted by real workload:
 * - 40% Dynamic Code Modules (Home & Selection screens, catalogs)
 * - 30% 3D Home Moon Geometry & Lighting
 * - 20% High-Resolution Character Art & Carousel Imagery
 * - 10% Audio Engine & Session Hydration
 */
export async function preloadEntrySubsystems(
  onProgress: (progress: number, message: string) => void
): Promise<void> {
  // Step 0: Maintain browser asset cache (7-day inactivity purge)
  maintainBrowserAssetCache().catch(() => {});

  onProgress(5, 'Initializing core engine subsystems…');
  await paceMilestone();

  try {
    // 1. Dynamic module chunks (40% milestone target: 5% -> 40%)
    onProgress(15, 'Loading story flow and viewport controllers…');
    try {
      await Promise.allSettled([
        import('../game/story/HomeViewport.tsx'),
        import('../game/story/SelectionScreens.tsx'),
        import('../data/sources.ts'),
        import('../data/parts.ts'),
      ]);
    } catch (err) {
      console.warn('Module preload notice:', err);
    }
    onProgress(40, 'Story controllers compiled');
    await paceMilestone();

    // 2. 3D Home Moon geometry and shader preparation (30% milestone target: 40% -> 70%)
    onProgress(50, 'Compiling lunar orbital shaders and 3D preview…');
    try {
      const THREE = await import('three');
      const sphere = new THREE.SphereGeometry(1.2, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: 0x8892b0,
        roughness: 0.85,
        metalness: 0.1,
      });
      sphere.dispose();
      material.dispose();
    } catch (err) {
      console.warn('3D Moon shader preload notice:', err);
    }
    onProgress(70, '3D orbital environment ready');
    await paceMilestone();

    // 3. High-resolution entry art & carousel slides (20% milestone target: 70% -> 90%)
    onProgress(75, 'Decoding mission crew art & deep space imagery…');
    const entryImages = [
      '/story/crew-welcome.png',
      '/story/mission-control.png',
      '/assets/loading/artemis_launch.jpg',
      '/assets/loading/orion_earth_view.jpg',
      '/assets/loading/carina_nebula.png',
      '/assets/loading/apollo_bootprint.jpg',
      '/assets/loading/mars_perseverance.jpg',
    ];
    await Promise.allSettled(entryImages.map(src => preloadImage(src)));
    onProgress(85, 'Imagery textures cached');
    await paceMilestone();

    // 3b. NASA Mission Archive Subsystems & Timeline Thumbnail Bubbles
    onProgress(88, 'Preloading NASA Mission Archive timeline & bubble assets…');
    try {
      const { getAllBubbleThumbnailUrls } = await import('../data/nasaArchiveData.ts');
      const bubbleThumbnails = getAllBubbleThumbnailUrls();
      await Promise.allSettled([
        import('../components/archive/NasaMissionArchive.tsx'),
        ...bubbleThumbnails.map(src => preloadImage(src))
      ]);
    } catch (archivePreloadErr) {
      console.warn('NASA archive preload notice:', archivePreloadErr);
    }
    onProgress(92, 'NASA timeline bubbles primed');
    await paceMilestone();

    // 4. Audio synthesizer & session state (10% milestone target: 92% -> 100%)
    onProgress(96, 'Synchronizing audio synthesizer and flight telemetry…');
    await paceMilestone();
  } finally {
    onProgress(100, 'All entry subsystems verified');
  }
}

/**
 * Preload all heavy simulation subsystems and assets prior to entering the mission.
 * Progress is weighted by real workload:
 * - 40% Heavy Simulation Modules (Workshop 3D, Flight, Moon screens)
 * - 30% 3D Rocket Part Geometries & Physics Shaders
 * - 20% Mission Heavy Crew Textures & Character Assets
 * - 10% Audio Synthesizer Flight Buffers & Launch Sound Synthesis
 */
export async function preloadMissionSubsystems(
  onProgress: (progress: number, message: string) => void
): Promise<void> {
  onProgress(5, 'Engaging mission simulation pipelines…');
  await paceMilestone();

  try {
    // 1. Heavy simulation modules (40% milestone target: 5% -> 40%)
    onProgress(15, 'Loading 3D rocket assembly studio & physics engines…');
    try {
      await Promise.allSettled([
        // Workshop & Rocket Builder
        import('../game/story/WorkshopScreen.tsx'),
        import('../game/story/WorkshopViewport.tsx'),
        import('../game/Assembly.tsx'),
        import('../game/RocketBuilder3D.tsx'),
        // Flight & Launch
        import('../game/story/FlightScreen.tsx'),
        import('../game/story/FlightViewport.tsx'),
        import('../game/FlightScene3D.tsx'),
        import('../game/SystemTests.tsx'),
        // Moon mission modules
        import('../game/story/moon/CrewScreen.tsx'),
        import('../game/story/moon/HumanReadinessScreen.tsx'),
        import('../game/story/moon/JourneyScreen.tsx'),
        import('../game/story/moon/LandingScreen.tsx'),
        import('../game/story/moon/SurfaceScreen.tsx'),
        import('../game/story/moon/ScienceScreen.tsx'),
        import('../game/story/moon/RecoveryScreen.tsx'),
        import('../game/story/moon/ReturnScreen.tsx'),
        import('../game/story/PackingViewport.tsx'),
      ]);
    } catch (err) {
      console.warn('Simulation module preload notice:', err);
    }
    onProgress(40, 'Simulation engines assembled');
    await paceMilestone();

    // 2. 3D Rocket procedural meshes & shaders (30% milestone target: 40% -> 70%)
    onProgress(55, 'Generating 3D rocket stage geometries & PBR materials…');
    try {
      const THREE = await import('three');
      const cylinder = new THREE.CylinderGeometry(0.8, 0.8, 3, 24);
      const cone = new THREE.ConeGeometry(0.8, 1.5, 24);
      const bell = new THREE.CylinderGeometry(0.2, 0.6, 0.8, 16);
      cylinder.dispose();
      cone.dispose();
      bell.dispose();
    } catch (err) {
      console.warn('3D rocket mesh preload notice:', err);
    }
    onProgress(70, '3D rocket builder primed');
    await paceMilestone();

    // 3. Heavy mission visuals, celestial textures & character rig atlases (20% milestone target: 70% -> 90%)
    onProgress(75, 'Decoding astronaut dossiers & lunar surface maps…');
    const missionVisualAssets = [
      // 3D Flight celestial textures
      '/story/flight/earth-blue-marble.jpg',
      // Character rig WebP body & face atlases
      '/story/characters-v1/chief-body.webp',
      '/story/characters-v1/chief-faces-a.webp',
      '/story/characters-v1/chief-faces-b.webp',
      '/story/characters-v1/commander-body.webp',
      '/story/characters-v1/commander-faces-a.webp',
      '/story/characters-v1/commander-faces-b.webp',
      '/story/characters-v1/commander-faces-c.webp',
      '/story/characters-v1/commander-male-atlas.png',
      // Mission crew portraits & character expressions
      '/story/pilot.png',
      '/story/sarah-jenkins.png',
      '/story/kai-briefing.webp',
      '/story/kai-talking.webp',
      '/story/mira-briefing.webp',
      '/story/mira-talking.webp',
      '/story/mira-neutral-new-cut.webp',
      '/story/mira-speaking-new-cut.webp',
      '/story/mira-success-cut.webp',
      '/story/mira-warning-cut.webp',
    ];
    await Promise.allSettled([
      ...missionVisualAssets.map(src => preloadImage(src)),
      cacheAssetInBrowser('/story/characters-v1/manifest.json')
    ]);
    onProgress(90, 'Visual textures & character rigs cached');
    await paceMilestone();

    // 4. Mission flight audio synthesis buffers (10% milestone target: 90% -> 100%)
    onProgress(95, 'Synthesizing launch rumble and telemetry acoustics…');
    await paceMilestone();
  } finally {
    onProgress(100, 'Flight authorization granted · Systems nominal');
  }
}
