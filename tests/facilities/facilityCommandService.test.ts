import { describe, expect, it } from 'vitest';
import { Inventory } from '@/game/inventory';
import { ResourceType } from '@/game/resources';
import { getFacilityMaterialQuantityForUnits, getMissingFacilityMaterials } from '@/game/facilities';

describe('quality-adjusted construction inputs', () => {
  const requirements = [{ resourceType: ResourceType.ConstructionMaterials, requiredUnits: 100 }];

  it('lets Q2 inventory satisfy twice as many construction units per item', () => {
    const inventory = new Inventory();
    inventory.add(ResourceType.ConstructionMaterials, 50, 2);

    expect(getMissingFacilityMaterials(inventory, requirements)).toHaveLength(0);
    expect(getFacilityMaterialQuantityForUnits(inventory, ResourceType.ConstructionMaterials, 100)).toBe(50);
  });

  it('uses the quantity-weighted inventory quality for mixed stock', () => {
    const inventory = new Inventory();
    inventory.add(ResourceType.ConstructionMaterials, 50, 1);
    inventory.add(ResourceType.ConstructionMaterials, 25, 3);

    const missing = getMissingFacilityMaterials(inventory, requirements);
    expect(missing).toHaveLength(0);
    expect(getFacilityMaterialQuantityForUnits(inventory, ResourceType.ConstructionMaterials, 100)).toBeCloseTo(60);
  });
});
