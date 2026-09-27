// Mission Forge - Mass, Power, and Budget Accounting Engine
import { PLANNING_ALLOWANCE_PER_SEAT_KG } from '../data/crew';
import { PARTS, SLOTS } from '../data/parts';
import { CrewRole, SlotInterface } from '../types/mission';

export interface BudgetAccounting {
  baseLaunchVehicleDollars: number;      // $1,400M
  baseCrewCapsuleDollars: number;        // $350M
  baseServiceModuleDollars: number;      // $180M
  baseStowedLanderDollars: number;       // $300M
  integrationDollars: number;            // $100M
  groundOpsDollars: number;              // $70M
  fixedBaseTotalDollars: number;         // $2,400M
  contingencyReserveDollars: number;     // $200M
  discretionaryCapDollars: number;       // $20M
  discretionarySpentDollars: number;     // Sum of science & upgrade parts
  discretionaryRemainingDollars: number; // $20M - spent
  totalMissionCommittedDollars: number;  // $2,400M + spent
  gamePlanningCapDollars: number;        // $2,620M
  isOverBudget: boolean;
}

export interface MassAccounting {
  sciencePayloadMassKg: number;
  sciencePayloadLimitKg: number;
  isOverScienceMassLimit: boolean;
  crewConsumablesMassKg: number;
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
  const fixedBaseTotalDollars = 2400000000;
  const contingencyReserveDollars = 200000000;
  const discretionaryCapDollars = 20000000;
  const gamePlanningCapDollars = 2620000000;

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
    baseLaunchVehicleDollars: 1400000000,
    baseCrewCapsuleDollars: 350000000,
    baseServiceModuleDollars: 180000000,
    baseStowedLanderDollars: 300000000,
    integrationDollars: 100000000,
    groundOpsDollars: 70000000,
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
  crewAssignments: Partial<Record<CrewRole, string | null>>
): MassAccounting {
  const sciencePayloadLimitKg = 250;
  let sciencePayloadMassKg = 0;
  let launchStackTotalLiftoffMassKg = 0;
  let crewSpacecraftDryMassKg = 0;

  // Count active crew
  const crewCount = Object.values(crewAssignments).filter(Boolean).length;
  const crewConsumablesMassKg = crewCount * PLANNING_ALLOWANCE_PER_SEAT_KG;

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
  const fuelCellOutputWatts = 3500; // Continuous rating

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
