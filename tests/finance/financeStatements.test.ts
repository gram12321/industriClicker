import { describe, expect, it } from 'vitest';
import { Facility } from '@/game/facilities/facility';
import { FacilityCollection } from '@/game/facilities/facilityCollection';
import { getFacilityDefinition } from '@/game/facilities/facilityConstants';
import { getFacilityUpgradeInvestmentCost, getFacilityUpgradeResourceInvestmentCost } from '@/game/facilities/facilityUpgrades';
import { FacilityType } from '@/game/facilities/facilityTypes';
import { calculateFacilityAssetBreakdown, calculateFacilityAssetValue, buildFinanceStatementData, Finance } from '@/game/finance';
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
    facility.upgradeQuality();
    facility.upgradeQuality();

    const expectedUpgradeInvestment = getFacilityUpgradeInvestmentCost(definition.upgradeCost, 2)
      + getFacilityUpgradeInvestmentCost(definition.upgradeCost, 1)
      + getFacilityUpgradeInvestmentCost(definition.upgradeCost, 3)
      + getFacilityUpgradeInvestmentCost(definition.upgradeCost, 2)
      + (getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, 2)
        + getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, 1)
        + getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, 3)
        + getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, 2)) * market.getLocalPrice(ResourceType.ConstructionMaterials)
      + (getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, 2)
        + getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, 1)
        + getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, 3)
        + getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, 2)) * market.getLocalPrice(ResourceType.IndustrialMachines);
    const expectedConstructionValue = definition.landCost
      + definition.constructionMaterialsCost * market.getLocalPrice(ResourceType.ConstructionMaterials)
      + definition.industrialMachinesCost * market.getLocalPrice(ResourceType.IndustrialMachines);
    const expectedValue = expectedConstructionValue + expectedUpgradeInvestment;
    const finance = new Finance();
    expect(finance.applyTransaction({ amount: 0, description: 'Farm construction', detailLines: [], facilityAccounting: { facilityId: facility.id, classification: 'construction', historicalValue: expectedConstructionValue }, kind: 'investing', source: 'facility-construction', occurredAtGameTimeMs: 0 })).toBe(true);
    expect(finance.applyTransaction({ amount: 0, description: 'Farm upgrades', detailLines: [], facilityAccounting: { facilityId: facility.id, classification: 'upgrade', historicalValue: expectedUpgradeInvestment }, kind: 'investing', source: 'facility-upgrade', occurredAtGameTimeMs: 0 })).toBe(true);
    expect(finance.getFacilityAccounting(facility.id)).toEqual({ constructionInvestment: expectedConstructionValue, upgradeInvestment: expectedUpgradeInvestment, maintenanceExpense: 0 });
    const breakdown = calculateFacilityAssetBreakdown(facility, market, finance);

    expect(calculateFacilityAssetValue(facility, market, finance)).toBe(expectedValue);
    expect(breakdown).toMatchObject({ bookValue: expectedValue, capitalInvestment: expectedValue, constructionInvestment: expectedConstructionValue, currentMarketValue: expectedValue, currentReplacementValue: expectedValue, marketRevaluation: 0, upgradeInvestment: expectedUpgradeInvestment, wearAndTear: 0 });

    const wornSnapshot = facility.toSnapshot();
    wornSnapshot.facilityCondition = 0.5;
    const wornBreakdown = calculateFacilityAssetBreakdown(Facility.fromSnapshot(wornSnapshot), market, finance);

    expect(wornBreakdown).toMatchObject({ bookValue: expectedValue * 0.5, conditionMultiplier: 0.5, currentMarketValue: expectedValue * 0.5, marketRevaluation: 0, wearAndTear: expectedValue * 0.5 });

    expect(market.buyFromLocal(ResourceType.ConstructionMaterials, 1).success).toBe(true);
    expect(calculateFacilityAssetBreakdown(facility, market, finance).marketRevaluation).toBeGreaterThan(0);
  });
});

describe('facility operating performance', () => {
  it('separates operating profit from capital investment within a report period', () => {
    const finance = new Finance();
    expect(finance.applyTransaction({ amount: 0, description: 'Farm construction', detailLines: [], facilityAccounting: { facilityId: 'farm-1', classification: 'construction', historicalValue: 100 }, kind: 'investing', source: 'facility-construction', occurredAtGameTimeMs: 0 })).toBe(true);
    expect(finance.applyTransaction({ amount: 0, description: 'Farm output', detailLines: [], facilityPerformance: { facilityId: 'farm-1', outputValue: 30, sourceCost: 12 }, kind: 'operating', source: 'facility-production', occurredAtGameTimeMs: 30_000 })).toBe(true);
    expect(finance.applyTransaction({ amount: 0, description: 'Farm repair', detailLines: [], facilityAccounting: { facilityId: 'farm-1', classification: 'maintenance', historicalValue: 3 }, kind: 'operating', source: 'facility-repair', occurredAtGameTimeMs: 45_000 })).toBe(true);
    expect(finance.applyTransaction({ amount: -4, description: 'Farm staff wages', detailLines: [], facilityAccounting: { facilityId: 'farm-1', classification: 'staff-wage', historicalValue: 4 }, kind: 'operating', source: 'facility-staff-wage', occurredAtGameTimeMs: 50_000 })).toBe(true);

    expect(finance.getFacilityPerformance('farm-1', 'minute', 60_000)).toEqual({
      outputValue: 30,
      sourceCost: 12,
      maintenanceExpense: 3,
      staffWageExpense: 4,
      staffingExpense: 0,
      capitalInvestment: 100,
      operatingProfit: 14,
      investmentAdjustedResult: -86,
    });
    expect(finance.getFacilityPerformance('farm-1', 'minute', 120_000)).toMatchObject({
      outputValue: 0,
      sourceCost: 0,
      maintenanceExpense: 0,
      staffWageExpense: 0,
      capitalInvestment: 0,
      operatingProfit: 0,
    });
  });

  it('reports staff wages as an operating expense in the company statement', () => {
    const finance = new Finance();
    expect(finance.applyTransaction({ amount: -4, description: 'Farm staff wages', detailLines: [], facilityAccounting: { facilityId: 'farm-1', classification: 'staff-wage', historicalValue: 4 }, kind: 'operating', source: 'facility-staff-wage', occurredAtGameTimeMs: 1_000 })).toBe(true);

    const statement = buildFinanceStatementData({
      achievements: new AchievementLedger(),
      companyStartedAtGameTimeMs: 0,
      currentGameTimeMs: 1_000,
      facilities: new FacilityCollection(),
      finance,
      inventory: new Inventory(),
      market: new Market(),
      period: 'all-time',
      research: new ResearchLedger(),
    });

    expect(statement.incomeStatement).toMatchObject({ expenses: 4, netIncome: -4 });
    expect(statement.incomeStatement.expenseDetails).toContainEqual({ label: 'Staff wages', amount: 4 });
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
