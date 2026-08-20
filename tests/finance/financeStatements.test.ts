import { describe, expect, it } from 'vitest';
import { Facility } from '@/game/facilities/facility';
import { FacilityCollection } from '@/game/facilities/facilityCollection';
import { getFacilityDefinition } from '@/game/facilities/facilityConstants';
import { getFacilityUpgradeInvestmentCost, getFacilityUpgradeResourceInvestmentCost } from '@/game/facilities/facilityUpgrades';
import { FacilityType } from '@/game/facilities/facilityTypes';
import { calculateFacilityAssetValue, buildFinanceStatementData, Finance } from '@/game/finance';
import { AchievementLedger } from '@/game/achievements';
import { Inventory } from '@/game/inventory';
import { ResearchLedger } from '@/game/research';
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

describe('cash-flow market details', () => {
  it('keeps resource icons and weighted average quality for grouped market trades', () => {
    const finance = new Finance();
    finance.applyTransaction({ amount: 2, description: 'Sold 1 grain to local market', detailLines: ['Quality: Q2.00'], kind: 'operating', source: 'market-sale', occurredAtGameTimeMs: 1 });
    finance.applyTransaction({ amount: 8, description: 'Sold 4 grain to local market', detailLines: ['Quality: Q4.00'], kind: 'operating', source: 'market-sale', occurredAtGameTimeMs: 2 });

    const data = buildFinanceStatementData({
      achievements: new AchievementLedger(),
      companyStartedAtGameTimeMs: 0,
      currentGameTimeMs: 2,
      facilities: new FacilityCollection(),
      finance,
      inventory: new Inventory(),
      market: new Market(),
      period: 'all-time',
      research: new ResearchLedger(),
    });
    const detail = data.cashFlowRows[0]?.detailGroups[0]?.details[0];

    expect(detail).toMatchObject({ resourceType: ResourceType.Grain, totalQuantity: 5, totalQualityQuantity: 5, totalQualityAmount: 18 });
  });
});
