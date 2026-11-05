import type { PartDefinition } from '../types';
import { LAUNCH_VEHICLE_PARTS } from './launchVehicles';
import { SPACECRAFT_PARTS } from './spacecraft';
import { PAYLOAD_PARTS } from './payloads';
import { UPGRADE_PARTS } from './upgrades';

export * from './slots';
export * from './launchVehicles';
export * from './spacecraft';
export * from './payloads';
export * from './upgrades';

export const PARTS: Record<string, PartDefinition> = {
  ...LAUNCH_VEHICLE_PARTS,
  ...SPACECRAFT_PARTS,
  ...PAYLOAD_PARTS,
  ...UPGRADE_PARTS
};
