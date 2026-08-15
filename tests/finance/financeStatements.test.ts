import { describe, expect, it } from 'vitest';
import { Facility } from '@/game/facilities/facility';
import { getFacilityDefinition } from '@/game/facilities/facilityConstants';
import { getFacilityUpgradeInvestmentCost, getFacilityUpgradeResourceInvestmentCost } from '@/game/facilities/facilityUpgrades';
import { FacilityType } from '@/game/facilities/facilityTypes';
import { calculateFacilityAssetValue } from '@/game/finance';
import { Market } from '@/game/market';
import { ResourceType } from '@/game/resources';

describe('calculateFacilityAssetValue', () => {
  it('includes each upgrade track at its cumulative paid cost', () => {
    const facility = new Facility('farm-1', FacilityType.Farm);
    const market = new Market();
    const definition = getFacilityDefinition(FacilityType.Farm);

    facility.upgradeSpeed();
    facility.upgradeSpeed();
    facility.upgradeOutput();
    facility.upgradeConditionDecay();
    facility.upgradeConditionDecay();
    facility.upgradeConditionDecay();

    const expectedUpgradeInvestment = getFacilityUpgradeInvestmentCost(definition.upgradeCost, 2)
      + getFacilityUpgradeInvestmentCost(definition.upgradeCost, 1)
      + getFacilityUpgradeInvestmentCost(definition.upgradeCost, 3)
      + (getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, 2)
        + getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, 1)
        + getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, 3)) * market.getLocalPrice(ResourceType.ConstructionMaterials)
      + (getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, 2)
        + getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, 1)
        + getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, 3)) * market.getLocalPrice(ResourceType.IndustrialMachines);
    const expectedValue = definition.landCost
      + definition.constructionMaterialsCost * market.getLocalPrice(ResourceType.ConstructionMaterials)
      + definition.industrialMachinesCost * market.getLocalPrice(ResourceType.IndustrialMachines)
      + expectedUpgradeInvestment;

    expect(calculateFacilityAssetValue(facility, market)).toBe(expectedValue);
  });
});
