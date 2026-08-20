import type { Inventory } from '@/game/inventory';
import { ResourceType } from '@/game/resources';

export type FacilityMaterialRequirements = {
  constructionMaterials: number;
  industrialMachines: number;
};

/** Finds the only two facility material inputs that must be sourced from the market. */
export function getMissingFacilityMaterials(inventory: Inventory, requirements: FacilityMaterialRequirements) {
  return [
    { resourceType: ResourceType.ConstructionMaterials, amount: Math.max(0, requirements.constructionMaterials - inventory.getAmount(ResourceType.ConstructionMaterials)) },
    { resourceType: ResourceType.IndustrialMachines, amount: Math.max(0, requirements.industrialMachines - inventory.getAmount(ResourceType.IndustrialMachines)) },
  ].filter((input) => input.amount > 0);
}
