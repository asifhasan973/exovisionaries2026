// Mission Forge - Saturn V / Apollo-Inspired Ascent Profile Engine
import { AscentTelemetry } from '../types/mission';

export interface AscentMilestone {
  timeSeconds: number; // Mission Elapsed Time in seconds
  title: string;
  stageName: string;
  cameraCue: 'pad' | 'liftoff' | 'pitchover' | 'maxq' | 'staging1' | 'lesJettison' | 'staging2' | 'orbitInsertion' | 'orbitCoast';
  callout: string;
  narration: string;
  isStagingEvent?: boolean;
}

export const ASCENT_MILESTONES: AscentMilestone[] = [
  {
    timeSeconds: 0,
    title: 'Liftoff & Tower Clearance',
    stageName: 'Stage 1 (S-IC Booster)',
    cameraCue: 'liftoff',
    callout: '“Tower cleared. PGNCS has primary guidance. Vehicle roll and pitch initiated.”',
    narration: 'Five F-1 engines ignite delivering 34.5 MN of thrust. All hold-down arms released.'
  },
  {
    timeSeconds: 72,
    title: 'Max-Q (Maximum Dynamic Pressure)',
    stageName: 'Stage 1 (S-IC Booster)',
    cameraCue: 'maxq',
    callout: '“Passing through Max-Q. Aerodynamic loads nominal. Structure holding green.”',
    narration: 'The vehicle passes Mach 1.6 at 13 km altitude, experiencing peak aerodynamic resistance.'
  },
  {
    timeSeconds: 162,
    title: 'Stage 1 Cutoff & Separation (S-IC)',
    stageName: 'Stage 2 (S-II Cryogenic)',
    cameraCue: 'staging1',
    callout: '“Inboard cutoff... Outboard cutoff. Staging! S-IC separation confirmed. S-II ignition!”',
    narration: 'Booster drops away at 67 km altitude. Second stage five hydrolox engines ignite.',
    isStagingEvent: true
  },
  {
    timeSeconds: 195,
    title: 'Launch Escape System (LES) Jettison',
    stageName: 'Stage 2 (S-II Cryogenic)',
    cameraCue: 'lesJettison',
    callout: '“Tower jettison! LES pitch motor fired, escape tower discarded into the Atlantic.”',
    narration: 'Above the dense atmosphere at 95 km, the escape tower is safely released, shedding 4.2 tons of deadweight.',
    isStagingEvent: true
  },
  {
    timeSeconds: 520,
    title: 'Stage 2 Cutoff & Separation (S-II)',
    stageName: 'Stage 3 (S-IVB Departure)',
    cameraCue: 'staging2',
    callout: '“S-II cutoff! Second stage separation confirmed. S-IVB engine start.”',
    narration: 'Second stage spent at 175 km. S-IVB third stage single restartable engine begins orbital insertion burn.',
    isStagingEvent: true
  },
  {
    timeSeconds: 695,
    title: 'Orbital Insertion Cutoff (SECO-1)',
    stageName: 'Stage 3 (S-IVB Departure)',
    cameraCue: 'orbitInsertion',
    callout: '“SECO! S-IVB engine cutoff. Telemetry confirms Earth parking orbit achieved.”',
    narration: 'Target orbital velocity of 7,800 m/s reached. Engine shut down for orbital checkout.'
  },
  {
    timeSeconds: 720,
    title: 'Earth Parking Orbit Reached',
    stageName: 'Orbital Stack (S-IVB + CSM)',
    cameraCue: 'orbitCoast',
    callout: '“CapCom, Forge 1 is stable in circular parking orbit. All systems nominal for post-insertion checkout.”',
    narration: 'Stable 185-km circular orbit achieved. Departure stage remains attached for Chapter 2 lunar transit.'
  }
];

export const TOTAL_ASCENT_FLIGHT_SECONDS = 720; // 12 minutes compressed for gameplay

export function sampleAscentTelemetry(progress: number): AscentTelemetry {
  const clamped = Math.max(0, Math.min(1, progress));
  const metSeconds = Math.round(clamped * TOTAL_ASCENT_FLIGHT_SECONDS);

  let altitudeKm = 0;
  let velocityMs = 0;
  let stageName = 'Stage 1 (S-IC Booster)';
  let activeEngines = 5;
  let propellantPercent = 100;
  let gForce = 1.0;
  let dynamicPressureKpa = 0;
  let phaseTitle = 'Liftoff & Initial Climb';
  let callout = '“Flight computers report nominal thrust across all chambers.”';
  let isStagingEvent = false;
  let stagingMessage = '';

  if (metSeconds <= 162) {
    // Stage 1 (0 to 162s)
    const t = metSeconds / 162;
    altitudeKm = Math.pow(t, 2) * 67;
    velocityMs = t * 2750;
    propellantPercent = Math.max(0, 100 - t * 98);
    activeEngines = 5;
    gForce = 1.2 + Math.pow(t, 1.8) * 2.8; // G-force peaks near 4.0g at burnout
    stageName = 'Stage 1 (S-IC Booster)';

    if (metSeconds < 60) {
      phaseTitle = 'Liftoff & Roll Maneuver';
      callout = '“Good roll program into launch azimuth. Vehicle is on target.”';
      dynamicPressureKpa = (metSeconds / 60) * 30;
    } else if (metSeconds < 100) {
      phaseTitle = 'Transonic Flight / Max-Q';
      callout = '“Approaching Mach 2. Dynamic pressure within structural margins.”';
      dynamicPressureKpa = 33 - Math.abs(metSeconds - 72) * 0.4;
    } else {
      phaseTitle = 'High-Altitude Booster Burn';
      callout = '“Center engine cutoff confirmed. Outboard engines burning clean.”';
      dynamicPressureKpa = Math.max(1, 15 * (1 - (metSeconds - 100) / 62));
    }
  } else if (metSeconds <= 520) {
    // Stage 2 (162 to 520s)
    const t = (metSeconds - 162) / (520 - 162);
    altitudeKm = 67 + t * (175 - 67);
    velocityMs = 2750 + Math.pow(t, 1.2) * (6850 - 2750);
    propellantPercent = Math.max(0, 100 - t * 95);
    activeEngines = 5;
    gForce = 1.1 + t * 0.9;
    dynamicPressureKpa = 0.5 * (1 - t);
    stageName = 'Stage 2 (S-II Hydrolox)';

    if (metSeconds < 220) {
      phaseTitle = 'Stage 2 Burn / Escape Tower Separation';
      callout = '“LES jettison complete. Spacecraft nose exposed to space environment.”';
      if (Math.abs(metSeconds - 195) <= 5) {
        isStagingEvent = true;
        stagingMessage = 'LES Escape Tower Jettisoned';
      }
    } else {
      phaseTitle = 'Exo-Atmospheric Ascent';
      callout = '“S-II performance is optimal. Trajectory angle adjusting for orbital insertion.”';
    }
  } else {
    // Stage 3 (520 to 720s)
    const t = Math.min(1, (metSeconds - 520) / (695 - 520));
    altitudeKm = 175 + Math.sin(t * Math.PI * 0.5) * 10; // Settles precisely at 185 km
    velocityMs = 6850 + t * (7800 - 6850);
    propellantPercent = Math.max(68, 100 - t * 32); // Keeps 68% propellant for Translunar Injection in Chapter 2!
    activeEngines = 1;
    gForce = 1.0 + Math.sin(t * Math.PI) * 0.5;
    dynamicPressureKpa = 0;
    stageName = 'Stage 3 (S-IVB Insertion)';

    if (metSeconds < 695) {
      phaseTitle = 'Orbital Insertion Burn';
      callout = '“S-IVB single J-2 engine firing smoothly. Pitch leveling off to circularize.”';
    } else {
      phaseTitle = 'Earth Parking Orbit Insertion Complete';
      callout = '“SECO-1! Engine shutdown. We are in a stable 185 km parking orbit.”';
      activeEngines = 0;
      gForce = 0.0; // Weightlessness in orbit
    }
  }

  const downrangeKm = Math.round(Math.pow(clamped, 1.6) * 1850);
  const velocityKmh = Math.round(velocityMs * 3.6);

  return {
    metSeconds,
    altitudeKm: Number(altitudeKm.toFixed(1)),
    velocityMs: Math.round(velocityMs),
    velocityKmh,
    downrangeKm,
    stageName,
    activeEngines,
    propellantPercent: Math.round(propellantPercent),
    gForce: Number(gForce.toFixed(2)),
    dynamicPressureKpa: Number(dynamicPressureKpa.toFixed(1)),
    phaseTitle,
    callout,
    isStagingEvent,
    stagingMessage
  };
}
