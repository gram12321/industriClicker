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

describe('foreground finance aggregation', () => {
  it('keeps cloned aggregated history isolated from later writes', () => {
    const finance = new Finance();
    const transaction = { aggregationKey: 'staff-wage:farm-1', amount: -1, description: 'Staff wages for Farm #1', detailLines: ['Workers: 1'], facilityAccounting: { facilityId: 'farm-1', classification: 'staff-wage' as const, historicalValue: 1 }, kind: 'operating' as const, source: 'facility-staff-wage' as const };
    finance.applyTransaction({ ...transaction, occurredAtGameTimeMs: 1_000 });

    const clone = finance.clone();
    clone.applyTransaction({ ...transaction, occurredAtGameTimeMs: 2_000 });

    expect(finance.getTransactions()[0]).toMatchObject({ amount: -1, occurrenceCount: 1 });
    expect(clone.getTransactions()[0]).toMatchObject({ amount: -2, occurrenceCount: 2 });
  });

  it('combines repeated facility wages and production performance without changing totals', () => {
    const finance = new Finance();

    expect(finance.applyTransaction({ aggregationKey: 'staff-wage:farm-1', amount: -1, description: 'Staff wages for Farm #1', detailLines: ['Workers: 1', 'Wage: €60.00 per worker/min'], facilityAccounting: { facilityId: 'farm-1', classification: 'staff-wage', historicalValue: 1 }, kind: 'operating', source: 'facility-staff-wage', occurredAtGameTimeMs: 1_000 })).toBe(true);
    expect(finance.applyTransaction({ aggregationKey: 'staff-wage:farm-1', amount: -1, description: 'Staff wages for Farm #1', detailLines: ['Workers: 1', 'Wage: €60.00 per worker/min'], facilityAccounting: { facilityId: 'farm-1', classification: 'staff-wage', historicalValue: 1 }, kind: 'operating', source: 'facility-staff-wage', occurredAtGameTimeMs: 2_000 })).toBe(true);
    expect(finance.applyTransaction({ aggregationKey: 'facility-production:farm-1', amount: 0, description: 'Production completed by Farm #1', detailLines: ['Output market value: €2.00', 'Input cost + production wear: €1.00'], facilityPerformance: { facilityId: 'farm-1', outputValue: 2, sourceCost: 1 }, kind: 'operating', source: 'facility-production', occurredAtGameTimeMs: 3_000 })).toBe(true);
    expect(finance.applyTransaction({ aggregationKey: 'facility-production:farm-1', amount: 0, description: 'Production completed by Farm #1', detailLines: ['Output market value: €3.00', 'Input cost + production wear: €1.50'], facilityPerformance: { facilityId: 'farm-1', outputValue: 3, sourceCost: 1.5 }, kind: 'operating', source: 'facility-production', occurredAtGameTimeMs: 4_000 })).toBe(true);

    const transactions = finance.getTransactions();
    expect(transactions).toHaveLength(2);
    expect(transactions.find((transaction) => transaction.source === 'facility-staff-wage')).toMatchObject({ amount: -2, occurrenceCount: 2 });
    expect(transactions.find((transaction) => transaction.source === 'facility-production')).toMatchObject({ occurrenceCount: 2, facilityPerformance: { outputValue: 5, sourceCost: 2.5 } });
    expect(finance.getFacilityPerformance('farm-1', 'all-time', 4_000)).toMatchObject({ outputValue: 5, sourceCost: 2.5, staffWageExpense: 2, operatingProfit: 0.5 });
  });

  it('keeps aggregated market quantities, quality, and event counts in cash flow', () => {
    const finance = new Finance();
    const common = { aggregationKey: 'autobuy:water', description: 'Autobought water', kind: 'operating' as const, source: 'market-purchase' as const };
    finance.applyTransaction({ ...common, amount: -2, detailLines: ['Unit price: €2.00', 'Quality: Q2.00'], marketTrade: { resourceType: ResourceType.Water, quantity: 1, qualityQuantity: 1, qualityAmount: 2 }, occurredAtGameTimeMs: 1_000 });
    finance.applyTransaction({ ...common, amount: -8, detailLines: ['Unit price: €4.00', 'Quality: Q4.00'], marketTrade: { resourceType: ResourceType.Water, quantity: 2, qualityQuantity: 2, qualityAmount: 8 }, occurredAtGameTimeMs: 2_000 });

    const data = buildFinanceStatementData({ achievements: new AchievementLedger(), companyStartedAtGameTimeMs: 0, currentGameTimeMs: 2_000, facilities: new FacilityCollection(), finance, inventory: new Inventory(), market: new Market(), period: 'all-time', research: new ResearchLedger() });
    expect(data.cashFlowRows[0]?.detailGroups[0]?.details[0]).toMatchObject({ count: 2, resourceType: ResourceType.Water, totalQuantity: 3, totalQualityQuantity: 3, totalQualityAmount: 10 });
  });

  it('keeps a 90-minute per-second wage stream to one entry per foreground minute', () => {
    const finance = new Finance();
    for (let second = 0; second < 90 * 60; second += 1) {
      finance.applyTransaction({ aggregationKey: 'staff-wage:farm-1:1:1', amount: -1 / 60, description: 'Staff wages for Farm #1', detailLines: ['Workers: 1', 'Wage: €1.00 per worker/min'], facilityAccounting: { facilityId: 'farm-1', classification: 'staff-wage', historicalValue: 1 / 60 }, kind: 'operating', source: 'facility-staff-wage', occurredAtGameTimeMs: second * 1_000 });
    }

    const wageTransactions = finance.getTransactions();
    expect(wageTransactions).toHaveLength(90);
    expect(wageTransactions.reduce((total, transaction) => total + transaction.occurrenceCount, 0)).toBe(90 * 60);
    expect(finance.getFacilityPerformance('farm-1', 'all-time', 90 * 60 * 1_000).staffWageExpense).toBeCloseTo(90);
  });

  it('assigns aggregated minute entries to their bucket start in rolling reports', () => {
    const finance = new Finance();
    for (let second = 0; second < 120; second += 1) {
      finance.applyTransaction({ aggregationKey: 'staff-wage:farm-1:1:1', amount: -1 / 60, description: 'Staff wages for Farm #1', detailLines: ['Workers: 1'], facilityAccounting: { facilityId: 'farm-1', classification: 'staff-wage', historicalValue: 1 / 60 }, kind: 'operating', source: 'facility-staff-wage', occurredAtGameTimeMs: second * 1_000 });
    }

    expect(finance.getFacilityPerformance('farm-1', 'minute', 119_000).staffWageExpense).toBeCloseTo(1);
    expect(finance.getFacilityPerformance('farm-1', 'minute', 120_000).staffWageExpense).toBeCloseTo(1);
  });
});
