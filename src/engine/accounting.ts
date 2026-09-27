// Mission Forge - Mass, Power, and Budget Accounting Engine
import { PLANNING_ALLOWANCE_PER_SEAT_KG } from '../data/crew';
import { PARTS, SLOTS } from '../data/parts';
import { CrewRole, SlotInterface } from '../types/mission';

export interface BudgetAccounting {
  baseLaunchVehicleDollars: number;      // NASA OIG SLS operating estimate
  baseCrewCapsuleDollars: number;        // NASA OIG Orion operating estimate
  baseServiceModuleDollars: number;      // NASA OIG ESA service module valuation
  baseStowedLanderDollars: number;
  integrationDollars: number;
  groundOpsDollars: number;              // NASA OIG Exploration Ground Systems estimate
  fixedBaseTotalDollars: number;         // Published SLS + Orion + ESM + EGS reference
  contingencyReserveDollars: number;
  discretionaryCapDollars: number;       // Authored payload-game allowance
  discretionarySpentDollars: number;     // Sum of science & upgrade parts
  discretionaryRemainingDollars: number; // $25M - spent
  totalMissionCommittedDollars: number;  // $4.068B + selected equipment
  gamePlanningCapDollars: number;
  isOverBudget: boolean;
}

export interface MassAccounting {
  sciencePayloadMassKg: number;
  sciencePayloadLimitKg: number;
  isOverScienceMassLimit: boolean;
  crewConsumablesMassKg: number;
  crewDailyConsumablesKg: number;
  missionDurationDays: number;
  crewCount: number;
  crewSpacecraftDryMassKg: number;
  crewSpacecraftLaunchMassKg: number;
  launchStackTotalLiftoffMassKg: number;
}

export interface PowerAccounting {
  totalScienceDrawWatts: number;
  totalAvionicsDrawWatts: number;
  totalLifeSupportDrawWatts: number;
  fuelCellOutputWatts: number;
  netPowerMarginWatts: number;
}

export function computeBudgetAccounting(
  installedParts: Partial<Record<SlotInterface, string>>
): BudgetAccounting {
  // NASA OIG IG-22-003: SLS $2.2B + Orion $1.0B + ESA service module
  // $300M + Exploration Ground Systems $568M = $4.068B per-launch reference.
  const fixedBaseTotalDollars = 4068000000;
  const contingencyReserveDollars = 0;
  const discretionaryCapDollars = 25000000;
  const gamePlanningCapDollars = fixedBaseTotalDollars + discretionaryCapDollars;

  let discretionarySpentDollars = 0;

  Object.values(installedParts).forEach((partId) => {
    if (!partId) return;
    const part = PARTS[partId];
    if (part && !part.includedInParentPackage && part.costDollars > 0) {
      discretionarySpentDollars += part.costDollars;
    }
  });

  const discretionaryRemainingDollars = Math.max(0, discretionaryCapDollars - discretionarySpentDollars);
  const totalMissionCommittedDollars = fixedBaseTotalDollars + discretionarySpentDollars;
  const isOverBudget = discretionarySpentDollars > discretionaryCapDollars;

  return {
    baseLaunchVehicleDollars: 2200000000,
    baseCrewCapsuleDollars: 1000000000,
    baseServiceModuleDollars: 300000000,
    baseStowedLanderDollars: 0,
    integrationDollars: 0,
    groundOpsDollars: 568000000,
    fixedBaseTotalDollars,
    contingencyReserveDollars,
    discretionaryCapDollars,
    discretionarySpentDollars,
    discretionaryRemainingDollars,
    totalMissionCommittedDollars,
    gamePlanningCapDollars,
    isOverBudget
  };
}

export function computeMassAccounting(
  installedParts: Partial<Record<SlotInterface, string>>,
  crewAssignments: Partial<Record<CrewRole, string | null>>,
  missionDurationDays = 8
): MassAccounting {
  const sciencePayloadLimitKg = 250;
  let sciencePayloadMassKg = 0;
  let launchStackTotalLiftoffMassKg = 0;
  let crewSpacecraftDryMassKg = 0;

  // Count active crew
  const crewCount = Object.values(crewAssignments).filter(Boolean).length;
  // NASA human-needs planning reference: food, potable/food water, oxygen and
  // clothing total about 6.8 kg per person-day; the game carries a 9% packing margin.
  const crewDailyConsumablesKg = crewCount * missionDurationDays * 7.4;
  const crewConsumablesMassKg = crewCount * PLANNING_ALLOWANCE_PER_SEAT_KG + crewDailyConsumablesKg;

  // Tally parts
  Object.entries(installedParts).forEach(([slotId, partId]) => {
    if (!partId) return;
    const part = PARTS[partId];
    if (!part) return;

    const slot = SLOTS.find((s) => s.id === slotId);
    if (!slot) return;

    if (slot.viewMode === 'sciencePayload') {
      sciencePayloadMassKg += part.massKg;
    }

    if (slot.category === 'crewSpacecraft' || slot.category === 'crewSupport' || slot.category === 'avionics') {
      crewSpacecraftDryMassKg += part.massKg;
    }

    launchStackTotalLiftoffMassKg += part.massKg;
  });

  // Include crew in spacecraft and liftoff mass
  crewSpacecraftDryMassKg += crewConsumablesMassKg;
  launchStackTotalLiftoffMassKg += crewConsumablesMassKg;

  const isOverScienceMassLimit = sciencePayloadMassKg > sciencePayloadLimitKg;
  const crewSpacecraftLaunchMassKg = crewSpacecraftDryMassKg + sciencePayloadMassKg;

  return {
    sciencePayloadMassKg,
    sciencePayloadLimitKg,
    isOverScienceMassLimit,
    crewConsumablesMassKg,
    crewDailyConsumablesKg,
    missionDurationDays,
    crewCount,
    crewSpacecraftDryMassKg,
    crewSpacecraftLaunchMassKg,
    launchStackTotalLiftoffMassKg
  };
}

export function computePowerAccounting(
  installedParts: Partial<Record<SlotInterface, string>>
): PowerAccounting {
  let totalScienceDrawWatts = 0;
  let totalAvionicsDrawWatts = 0;
  let totalLifeSupportDrawWatts = 0;
  const fuelCellOutputWatts = Object.values(installedParts).includes('fuel-cell-power-bus') ? 3500 : 0; // No power source until the child installs it.

  Object.values(installedParts).forEach((partId) => {
    if (!partId) return;
    const part = PARTS[partId];
    if (!part) return;

    if (part.category === 'science' || part.category === 'upgrades') {
      totalScienceDrawWatts += part.powerWatts;
    } else if (part.category === 'avionics') {
      totalAvionicsDrawWatts += part.powerWatts;
    } else if (part.category === 'crewSupport') {
      totalLifeSupportDrawWatts += part.powerWatts;
    }
  });

  const totalDemand = totalScienceDrawWatts + totalAvionicsDrawWatts + totalLifeSupportDrawWatts;
  const netPowerMarginWatts = fuelCellOutputWatts - totalDemand;

  return {
    totalScienceDrawWatts,
    totalAvionicsDrawWatts,
    totalLifeSupportDrawWatts,
    fuelCellOutputWatts,
    netPowerMarginWatts
  };
}
