// Mission Forge - Core Types

export type MissionPhase =
  | 'welcome'
  | 'destination'
  | 'mission'
  | 'site'
  | 'assembly'
  | 'crew'
  | 'readiness'
  | 'launchpad'
  | 'ascent'
  | 'orbit';

export type DestinationId = 'moon' | 'mars';

export type MissionId = 'lunar-ice-explorer' | 'lunar-geology' | 'lunar-volcanic';

export type SiteId = 'ridge' | 'crater-rim' | 'shadowed-crater';

export type PartCategory =
  | 'launchVehicle'
  | 'crewSpacecraft'
  | 'crewSupport'
  | 'avionics'
  | 'science'
  | 'upgrades';

export type AssemblyViewMode = 'sciencePayload' | 'crewSpacecraft' | 'fullStack';

export type SlotInterface =
  | 'booster-stage-1'
  | 'interstage-1'
  | 'booster-stage-2'
  | 'interstage-2'
  | 'booster-stage-3'
  | 'instrument-unit'
  | 'lunar-payload-bay'
  | 'service-module'
  | 'crew-capsule'
  | 'launch-escape-system'
  | 'eclss-bay'
  | 'avionics-bay'
  | 'power-bay'
  | 'comms-mast'
  | 'science-slot-1'
  | 'science-slot-2'
  | 'science-slot-3'
  | 'science-slot-4'
  | 'upgrade-slot-1'
  | 'upgrade-slot-2';

export interface SlotDefinition {
  id: SlotInterface;
  name: string;
  category: PartCategory;
  viewMode: AssemblyViewMode;
  position: [number, number, number];
  orientation?: [number, number, number];
  acceptedCategories: PartCategory[];
  acceptedPartIds?: string[];
  isMandatory: boolean;
  isInternal?: boolean;
}

export type PriceStatus = 'published' | 'historical' | 'educationalEstimate' | 'includedInPackage';
export type SpecStatus = 'sourced' | 'assumed';

export interface PartDefinition {
  id: string;
  name: string;
  subtitle: string;
  category: PartCategory;
  compatibleSlots: SlotInterface[];
  costDollars: number; // Integer USD
  priceStatus: PriceStatus;
  massKg: number;
  massStatus: SpecStatus;
  powerWatts: number; // Peak or nominal draw
  includedInParentPackage?: boolean;
  packageParentName?: string;
  description: string;
  educationalNote: string;
  sourceCitation: string;
  meshType: string;
  color?: string;
  dimensions?: [number, number, number];
}

export type CrewRole = 'commander' | 'scientist' | 'engineer';

export interface AstronautCandidate {
  id: string;
  name: string;
  callsign: string;
  primaryRole: CrewRole;
  secondaryRole?: CrewRole;
  nationality: string;
  age: number;
  avatarSeed: string;
  flightExperience: string;
  specialization: string;
  biography: string;
  readinessAdvice: {
    ridgeSite: string;
    craterRimSite: string;
  };
}

export interface ReadinessIssue {
  id: string;
  type: 'blocker' | 'note';
  title: string;
  description: string;
  actionText?: string;
  targetStep?: MissionPhase;
  targetSlotId?: SlotInterface;
  targetPartId?: string;
}

export interface LaunchSnapshot {
  timestamp: number;
  missionId: MissionId;
  siteId: SiteId;
  installedParts: Record<SlotInterface, string>;
  crewAssignments: Record<CrewRole, string>;
  totalDiscretionaryCost: number;
  scienceMassKg: number;
  grossLiftoffMassKg: number;
  missionDurationDays: number;
  profileId: string;
}

export interface AscentTelemetry {
  metSeconds: number; // Mission elapsed time
  altitudeKm: number;
  velocityMs: number;
  velocityKmh: number;
  downrangeKm: number;
  stageName: string;
  activeEngines: number;
  propellantPercent: number;
  gForce: number;
  dynamicPressureKpa: number;
  phaseTitle: string;
  callout: string;
  isStagingEvent?: boolean;
  stagingMessage?: string;
}
