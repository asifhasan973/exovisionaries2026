// Mission Forge - Launch Readiness Validation Engine
import { MISSIONS } from '../data/missions';
import { PARTS, SLOTS } from '../data/parts';
import { SITE_CONCEPTS } from '../data/sites';
import { CrewRole, MissionId, ReadinessIssue, SiteId, SlotInterface } from '../types/mission';
import { computeBudgetAccounting, computeMassAccounting, computePowerAccounting } from './accounting';

export interface ReadinessReport {
  isClearToLaunch: boolean;
  blockers: ReadinessIssue[];
  notes: ReadinessIssue[];
  totalBlockerCount: number;
  totalNoteCount: number;
  budgetSummary: ReturnType<typeof computeBudgetAccounting>;
  massSummary: ReturnType<typeof computeMassAccounting>;
  powerSummary: ReturnType<typeof computePowerAccounting>;
}

export function validateLaunchReadiness(
  missionId: MissionId,
  siteId: SiteId,
  installedParts: Partial<Record<SlotInterface, string>>,
  crewAssignments: Partial<Record<CrewRole, string | null>>
): ReadinessReport {
  const blockers: ReadinessIssue[] = [];
  const notes: ReadinessIssue[] = [];

  const budget = computeBudgetAccounting(installedParts);
  const mass = computeMassAccounting(installedParts, crewAssignments);
  const power = computePowerAccounting(installedParts);

  // 1. Mandatory Core Hardware Slots
  const mandatorySlots = SLOTS.filter((s) => s.isMandatory);
  for (const slot of mandatorySlots) {
    const installedPartId = installedParts[slot.id];
    if (!installedPartId) {
      blockers.push({
        id: `missing-slot-${slot.id}`,
        type: 'blocker',
        title: `Missing Required Hardware: ${slot.name}`,
        description: `Flight rules mandate that ${slot.name} must be structurally installed and tested prior to rollout.`,
        actionText: 'Install in Hangar',
        targetStep: 'assembly',
        targetSlotId: slot.id
      });
    }
  }

  // 2. Launch Escape System Check (Safety Rule)
  if (!installedParts['launch-escape-system']) {
    blockers.push({
      id: 'missing-les',
      type: 'blocker',
      title: 'No Launch Escape System Installed',
      description: 'Human-rated launch criteria require a solid-rocket escape tower to guarantee crew survival during pad or early atmospheric aborts.',
      actionText: 'Install Escape Tower',
      targetStep: 'assembly',
      targetSlotId: 'launch-escape-system',
      targetPartId: 'launch-escape-tower'
    });
  }

  // 3. Crew Count & Role Coverage
  const assignedRoles = Object.keys(crewAssignments).filter(
    (role) => crewAssignments[role as CrewRole]
  ) as CrewRole[];

  if (assignedRoles.length < 3) {
    blockers.push({
      id: 'crew-incomplete',
      type: 'blocker',
      title: `Incomplete Crew Roster (${assignedRoles.length}/3 Seats Assigned)`,
      description: 'The lunar expedition vehicle is configured for three flight astronauts. All seats must be assigned.',
      actionText: 'Assign Crew Roster',
      targetStep: 'crew'
    });
  } else {
    // Check role coverage
    const hasCommander = Boolean(crewAssignments.commander);
    const hasScientist = Boolean(crewAssignments.scientist);
    const hasEngineer = Boolean(crewAssignments.engineer);

    if (!hasCommander || !hasScientist || !hasEngineer) {
      blockers.push({
        id: 'crew-role-gap',
        type: 'blocker',
        title: 'Missing Essential Crew Role Coverage',
        description: 'Flight rules require one Commander/Pilot, one Mission Scientist, and one Systems Engineer for flight qualification.',
        actionText: 'Adjust Roles',
        targetStep: 'crew'
      });
    }
  }

  // 4. Mission Science Payload Requirements
  const mission = MISSIONS[missionId];
  if (mission && mission.requiredPayloads) {
    const installedPartIds = Object.values(installedParts);
    for (const reqId of mission.requiredPayloads) {
      if (!installedPartIds.includes(reqId)) {
        const requiredPart = PARTS[reqId];
        blockers.push({
          id: `missing-science-${reqId}`,
          type: 'blocker',
          title: `Mission Payload Requirement Unmet: ${requiredPart?.name || reqId}`,
          description: `The ${mission.title} mission cannot fulfill primary science objectives without the ${requiredPart?.name || reqId}.`,
          actionText: 'Equip Science',
          targetStep: 'assembly',
          targetPartId: reqId
        });
      }
    }
  }

  // 5. Science Payload Mass Envelope
  if (mass.isOverScienceMassLimit) {
    blockers.push({
      id: 'science-mass-exceeded',
      type: 'blocker',
      title: `Science Payload Mass Exceeds Allowance (+${mass.sciencePayloadMassKg - mass.sciencePayloadLimitKg} kg)`,
      description: `Total science and upgrade hardware mass is ${mass.sciencePayloadMassKg} kg, exceeding the 250 kg payload rack rating.`,
      actionText: 'Rebalance Payload',
      targetStep: 'assembly'
    });
  }

  // 6. Discretionary Budget Envelope
  if (budget.isOverBudget) {
    const overage = (budget.discretionarySpentDollars - budget.discretionaryCapDollars) / 1000000;
    blockers.push({
      id: 'discretionary-budget-exceeded',
      type: 'blocker',
      title: `Discretionary Science Budget Exceeded (+$${overage.toFixed(1)}M)`,
      description: `Discretionary spending on scientific sensors and mission upgrades exceeds the authored $20.0M allocation.`,
      actionText: 'Adjust Manifest',
      targetStep: 'assembly'
    });
  }

  // 7. Power Generation Balance
  if (power.netPowerMarginWatts < 500) {
    blockers.push({
      id: 'insufficient-power-margin',
      type: 'blocker',
      title: 'Insufficient Service Module Electrical Margin',
      description: `Total electrical load leaves less than 500 W reserve on the primary fuel cell bus.`,
      actionText: 'Review Electronics',
      targetStep: 'assembly'
    });
  }

  // ================= Later-Mission Planning Notes (Not Blockers) =================
  const installedPartIds = Object.values(installedParts);
  const site = SITE_CONCEPTS[siteId];

  // Note A: Site Planning vs Equipment
  if (siteId === 'crater-rim' && !installedPartIds.includes('aux-battery-pack')) {
    notes.push({
      id: 'note-crater-battery',
      type: 'note',
      title: 'Planning Advisory: Low Solar Illumination at Crater Rim',
      description: 'The Crater Rim concept experiences frequent thermal and solar shadow dips. An Auxiliary Battery Pack is recommended for extended operations in later phases.'
    });
  }

  if (siteId === 'crater-rim' && !installedPartIds.includes('precision-star-tracker')) {
    notes.push({
      id: 'note-crater-star-tracker',
      type: 'note',
      title: 'Planning Advisory: Low-Sun Angle Attitude Reference',
      description: 'Low solar elevation near crater rims can obscure horizon sensors. Precision Star Tracker upgrade would assist optical attitude hold.'
    });
  }

  // Note B: Deep Sampling Coverage
  if (!installedPartIds.includes('subsurface-drill')) {
    notes.push({
      id: 'note-no-drill',
      type: 'note',
      title: 'Scientific Note: Surface vs Subsurface Volatiles',
      description: 'Without the 1.5m Core Drill, science results in later phases will be limited to surface frost and cannot sample buried permafrost ice.'
    });
  }

  if (installedPartIds.includes('subsurface-drill') && !installedPartIds.includes('mass-spectrometer')) {
    notes.push({
      id: 'note-drill-without-msolo',
      type: 'note',
      title: 'Scientific Note: Core Sample Volatile Analysis',
      description: 'Drill is equipped without the MSolo Mass Spectrometer; volatile gases released during core extraction will not be analyzed in real time.'
    });
  }

  // Note C: Spares Kit
  if (!installedPartIds.includes('modular-spare-kit')) {
    notes.push({
      id: 'note-no-spares',
      type: 'note',
      title: 'Maintenance Note: No Modular Hardware Spares Package',
      description: 'No emergency mechanical spares carried on the equipment rack. In-flight repairs during cis-lunar transit will be constrained.'
    });
  }

  return {
    isClearToLaunch: blockers.length === 0,
    blockers,
    notes,
    totalBlockerCount: blockers.length,
    totalNoteCount: notes.length,
    budgetSummary: budget,
    massSummary: mass,
    powerSummary: power
  };
}
