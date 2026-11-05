// Mission Forge - Fictional Astronaut Roster
import { AstronautCandidate } from '../types/mission';

export const PLANNING_ALLOWANCE_PER_SEAT_KG = 120; // 82 kg crew member + 38 kg suit, personal kit, and ascent consumables

export const CANDIDATES: AstronautCandidate[] = [
  {
    id: 'marcus-vance',
    name: 'Marcus Vance',
    callsign: 'Atlas',
    primaryRole: 'commander',
    secondaryRole: 'engineer',
    nationality: 'United States',
    age: 44,
    avatarSeed: 'vance',
    flightExperience: '2 Space Station Long-Duration Expeditions (310 days in LEO)',
    specialization: 'Manual Rendezvous & Heavy-Lift Manual Trajectory Control',
    biography: 'Former naval experimental test pilot and veteran space station commander. Specializes in manual trajectory steering during high-dynamic-pressure ascent and emergency abort staging procedures.',
    readinessAdvice: {
      ridgeSite: 'Vance approves the Ridge approach: “The steady line of sight makes trajectory abort corridors cleaner during trans-lunar injection.”',
      craterRimSite: 'Vance notes: “Crater rim approach leaves narrow margins for visual horizon reference during late approach. We need star trackers verified before orbit insertion.”'
    }
  },
  {
    id: 'elena-rostova',
    name: 'Dr. Elena Rostova',
    callsign: 'Vesper',
    primaryRole: 'scientist',
    nationality: 'Canada / Ukraine',
    age: 38,
    avatarSeed: 'rostova',
    flightExperience: '1 Suborbital Research Flight, 4 Polar Deep-Field Geochemical Seasons',
    specialization: 'Cryogenic Volatile Mineralogy & Neutron Spectrometry',
    biography: 'Field geochemist who led Antarctic blue-ice meteorite recovery expeditions. Expert in interpreting real-time pulsed neutron spectrometer readings and near-infrared volatile spectra in cryogenic conditions.',
    readinessAdvice: {
      ridgeSite: 'Rostova advises: “At the Ridge, we will rely heavily on Context Multi-Spectral Cameras to map traversable boulder corridors into shadowed ice traps.”',
      craterRimSite: 'Rostova emphasizes: “Crater rim proximity gives us direct lines into subsurface volatiles. Ensure our Subsurface Drill and MSolo Mass Spectrometer are securely packed.”'
    }
  },
  {
    id: 'aisha-al-mansoor',
    name: 'Dr. Aisha Al-Mansoor',
    callsign: 'Cipher',
    primaryRole: 'engineer',
    secondaryRole: 'scientist',
    nationality: 'United Arab Emirates',
    age: 36,
    avatarSeed: 'mansoor',
    flightExperience: '1 Orbital Mission (180 days), Lead ECLSS Test Architect',
    specialization: 'Closed-Loop ECLSS Revitalization & Cryogenic Fuel Cells',
    biography: 'Aerospace systems architect who designed closed-loop oxygen revitalization loops and fuel cell reactant buses for deep space exploration vehicles. Uncompromising on hardware redundancy.',
    readinessAdvice: {
      ridgeSite: 'Al-Mansoor notes: “Continuous ridge solar illumination reduces battery stress. Core systems will maintain nominal bus voltage through parking orbit insertion.”',
      craterRimSite: 'Al-Mansoor warns: “Rapid thermal drops along crater edges will cycle fuel cell thermal loops. The Auxiliary Battery Pack is strongly recommended for power stability.”'
    }
  },
  {
    id: 'sarah-jenkins',
    name: 'Sarah Jenkins',
    callsign: 'Apex',
    primaryRole: 'commander',
    nationality: 'United Kingdom',
    age: 42,
    avatarSeed: 'jenkins',
    flightExperience: '1 Space Station Command Tour, Senior Test Pilot (2,800+ supersonic jet hours)',
    specialization: 'High-G Flight Dynamics & Ascent Staging Abort Modes',
    biography: 'Aeronautical engineer and military test pilot instructor. Known for precision flight control under high acceleration and comprehensive mastery of Apollo-class staging systems.',
    readinessAdvice: {
      ridgeSite: 'Jenkins comments: “Ridge approach provides clear communication windows with Houston and Madrid ground stations throughout ascent and orbital checkout.”',
      craterRimSite: 'Jenkins cautions: “Low solar angles at the rim create extreme optical contrast. Ensure guidance IMUs and optical star trackers are properly calibrated.”'
    }
  },
  {
    id: 'kenji-takahashi',
    name: 'Dr. Kenji Takahashi',
    callsign: 'Kestrel',
    primaryRole: 'scientist',
    secondaryRole: 'engineer',
    nationality: 'Japan',
    age: 40,
    avatarSeed: 'takahashi',
    flightExperience: 'Payload Specialist on Asteroid Sample Return Operations',
    specialization: 'Volatile Isotope Analysis & Mass Spectrometry',
    biography: 'Planetary scientist specializing in mass spectrometer calibrations and volatile isotopic ratios (D/H ratios) in extraterrestrial regolith. Passionate about uncovering the origin of lunar water.',
    readinessAdvice: {
      ridgeSite: 'Takahashi notes: “The ridge will offer excellent calibration baselines against illuminated reference regolith before we sample shadowed ice.”',
      craterRimSite: 'Takahashi recommends: “At the crater rim, volatile sublimations happen rapidly when samples are exposed. The mass spectrometer sampling train must remain hermetically sealed.”'
    }
  },
  {
    id: 'mateo-silva',
    name: 'Mateo Silva',
    callsign: 'Forge',
    primaryRole: 'engineer',
    nationality: 'Brazil',
    age: 39,
    avatarSeed: 'silva',
    flightExperience: '2 Orbital Flights, Chief Propulsion Integration Specialist',
    specialization: 'Cryogenic Stage 2/3 Propulsion & Pyrotechnic Separation',
    biography: 'Propulsion engineer with extensive experience in cryogenic hydrolox engine restart sequences and vacuum staging dynamics. Focuses on structural load limits and vehicle mass margins.',
    readinessAdvice: {
      ridgeSite: 'Silva reports: “With Ridge payloads, vehicle liftoff mass stays comfortably within the 119-ton third stage orbital insertion envelope.”',
      craterRimSite: 'Silva reminds the crew: “Adding heavy auxiliary batteries and redundant radios brings our science rack near the 250 kg limit. Keep mass balanced within the payload adapter.”'
    }
  }
];
