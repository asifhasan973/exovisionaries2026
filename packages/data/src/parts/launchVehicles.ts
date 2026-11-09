import type { PartDefinition } from "../types";

export const LAUNCH_VEHICLE_PARTS: Record<string, PartDefinition> = {
  // Heavy Launch Vehicle Package (NASA OIG SLS $2,200M per-flight reference)
  "stage-1-booster": {
    id: "stage-1-booster",
    name: "Heavy Booster Stage 1 (S-IC Class)",
    subtitle: "5x High-Thrust RP-1/LOX Booster Assembly",
    category: "launchVehicle",
    compatibleSlots: ["booster-stage-1"],
    costDollars: 0,
    priceStatus: "includedInPackage",
    packageParentName:
      "Heavy-Lift Launch Vehicle Package (NASA OIG $2,200M SLS reference)",
    massKg: 2280000,
    massStatus: "sourced",
    powerWatts: 0,
    description:
      "Provides 34.5 MN (7.7 million lbf) of initial liftoff thrust via 5 liquid oxygen/kerosene engines to break through the dense lower atmosphere.",
    educationalNote:
      "Historical reference: Saturn V S-IC stage. Burns for approximately 160 seconds to reach 68 km altitude at Mach 6.9.",
    sourceCitation: "NASA Saturn V Step-by-Step History (S-IC Stage Profile)",
    meshType: "stage1",
  },
  "interstage-1-2": {
    id: "interstage-1-2",
    name: "Corrugated Structural Interstage 1-2",
    subtitle: "Dual-Plane Separation Ring & Retro-Rockets",
    category: "launchVehicle",
    compatibleSlots: ["interstage-1"],
    costDollars: 0,
    priceStatus: "includedInPackage",
    packageParentName:
      "Heavy-Lift Launch Vehicle Package (NASA OIG $2,200M SLS reference)",
    massKg: 5200,
    massStatus: "sourced",
    powerWatts: 0,
    description:
      "Maintains structural load path between first and second stages during atmospheric ascent and carries solid retro-motors for clean stage separation.",
    educationalNote:
      "Separates in two planes: stage 1 drops away, then interstage skirt drops 30s later to shed unnecessary inert mass.",
    sourceCitation: "NASA Apollo Reference Architecture",
    meshType: "interstage1",
  },
  "stage-2-cryo": {
    id: "stage-2-cryo",
    name: "Cryogenic Stage 2 (S-II Class)",
    subtitle: "5x Liquid Hydrogen/Liquid Oxygen High-Efficiency Stage",
    category: "launchVehicle",
    compatibleSlots: ["booster-stage-2"],
    costDollars: 0,
    priceStatus: "includedInPackage",
    packageParentName:
      "Heavy-Lift Launch Vehicle Package (NASA OIG $2,200M SLS reference)",
    massKg: 490000,
    massStatus: "sourced",
    powerWatts: 0,
    description:
      "Generates 5.1 MN of vacuum thrust utilizing high specific impulse (Isp ~421 s) hydrolox propulsion to push the vehicle nearly to orbital velocity.",
    educationalNote:
      "Burns for ~360 seconds through the upper atmosphere to an altitude of 175 km and velocity of 6,800 m/s.",
    sourceCitation: "NASA Apollo 10 Flight Evaluation Report",
    meshType: "stage2",
  },
  "interstage-2-3": {
    id: "interstage-2-3",
    name: "Conical Interstage Adapter 2-3",
    subtitle: "Cryogenic Inter-Stage Fairing Ring",
    category: "launchVehicle",
    compatibleSlots: ["interstage-2"],
    costDollars: 0,
    priceStatus: "includedInPackage",
    packageParentName:
      "Heavy-Lift Launch Vehicle Package (NASA OIG $2,200M SLS reference)",
    massKg: 3800,
    massStatus: "sourced",
    powerWatts: 0,
    description:
      "Smooth structural transition between the 10-meter second stage and the 6.6-meter third stage with pyrotechnic tension-tie separation joints.",
    educationalNote:
      "Houses ullage motors that settle propellant in the third stage tanks prior to ignition.",
    sourceCitation: "NASA SP-4206 Stages to Saturn",
    meshType: "interstage2",
  },
  "stage-3-departure": {
    id: "stage-3-departure",
    name: "Orbital Insertion Stage 3 (S-IVB Class)",
    subtitle: "Restartable Cryogenic Departure Stage",
    category: "launchVehicle",
    compatibleSlots: ["booster-stage-3"],
    costDollars: 0,
    priceStatus: "includedInPackage",
    packageParentName:
      "Heavy-Lift Launch Vehicle Package (NASA OIG $2,200M SLS reference)",
    massKg: 119000,
    massStatus: "sourced",
    powerWatts: 0,
    description:
      "Completes insertion into 185-km circular Earth parking orbit. Crucially preserved in orbit with restartable propellant for the future translunar injection burn in Chapter 2.",
    educationalNote:
      "As in Apollo 10 and 11, the spacecraft remains attached to stage 3 throughout Earth parking orbit. It is not discarded until after TLI.",
    sourceCitation: "NASA Apollo 10 Overview; Apollo by the Numbers",
    meshType: "stage3",
  },
  "instrument-unit-ring": {
    id: "instrument-unit-ring",
    name: "Guidance & Instrument Unit (IU)",
    subtitle: "Autonomous Flight Computer & Launch Navigation Ring",
    category: "launchVehicle",
    compatibleSlots: ["instrument-unit"],
    costDollars: 0,
    priceStatus: "includedInPackage",
    packageParentName:
      "Heavy-Lift Launch Vehicle Package (NASA OIG $2,200M SLS reference)",
    massKg: 2000,
    massStatus: "sourced",
    powerWatts: 600,
    description:
      "Contains triple-redundant digital launch computers, inertial measuring platforms, and telemetry transmitters to command staging and orbital insertion.",
    educationalNote:
      "Acts as the launch vehicle’s nervous system, directing all stage gimbals during ascent independently of the crew capsule.",
    sourceCitation: "NASA IBM Saturn V Instrument Unit Technical Manual",
    meshType: "instrumentUnit",
  },
  "stowed-lunar-payload": {
    id: "stowed-lunar-payload",
    name: "Stowed Two-Stage Lunar Lander",
    subtitle: "Descent Stage, Ascent Stage & Protective Spacecraft Adapter",
    category: "launchVehicle",
    compatibleSlots: ["lunar-payload-bay"],
    costDollars: 0,
    priceStatus: "includedInPackage",
    packageParentName: "Lunar payload carried inside the fixed flight package",
    massKg: 15100,
    massStatus: "sourced",
    powerWatts: 0,
    description:
      "The complete lunar lander travels folded beneath protective adapter panels. Its descent stage lands the crew; its ascent stage later lifts them back to the command spacecraft in lunar orbit.",
    educationalNote:
      "The lander stays enclosed throughout Earth parking orbit. It is extracted only after the translunar injection burn in Milestone 2.",
    sourceCitation:
      "NASA Apollo 11 Mission Overview (SLA Fairing Architecture)",
    meshType: "lunarPayload",
  },
};
