import type { Inventory } from '@/game/inventory';
import { calculateQualityValueMultiplier } from '@/game/quality';
import { ResourceType } from '@/game/resources';

export type FacilityMaterialRequirements = ReadonlyArray<{
  resourceType: ResourceType;
  requiredUnits: number;
}>;

/** Finds construction inputs still missing after applying their quality-adjusted inventory credits. */
export function getMissingFacilityMaterials(inventory: Inventory, requirements: FacilityMaterialRequirements) {
  return requirements.map(({ resourceType, requiredUnits }) => ({
    resourceType,
    requiredUnits: Math.max(0, requiredUnits),
    missingUnits: Math.max(0, requiredUnits - inventory.getAmount(resourceType) * calculateQualityValueMultiplier(inventory.getQuality(resourceType))),
  })).filter((input) => input.missingUnits > 0);
}

/** Converts construction-value units into the physical quantity to consume from inventory. */
export function getFacilityMaterialQuantityForUnits(inventory: Inventory, resourceType: ResourceType, requiredUnits: number): number {
  return Math.max(0, requiredUnits) / calculateQualityValueMultiplier(inventory.getQuality(resourceType));
}
