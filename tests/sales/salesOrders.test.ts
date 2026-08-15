import { describe, expect, it } from 'vitest';
import { getResource, ResourceType, RESOURCE_TYPES } from '@/game/resources';
import { SALES_CUSTOMER_DOMAIN_PROFILES, SALES_ORDER_DURATION_MS, SalesOrders, calculateSalesCustomerAccessibility, calculateSalesOrderAcquisitionChance, calculateSalesOrderAcquisitionDetails, calculateSalesOrderBundleLineCount, calculateSalesOrderCustomerTypeMaturity, calculateSalesOrderMarketVolumeMultiplier, calculateSalesOrderSelectionWeight, calculateSalesOrderTargetValue, getEligibleSalesOrderResourceTypes } from '@/game/sales';

function quantities(resourceType: ResourceType, amount: number): Record<ResourceType, number> {
  return RESOURCE_TYPES.reduce((result, candidate) => { result[candidate] = candidate === resourceType ? amount : 0; return result; }, {} as Record<ResourceType, number>);
}
function prices(value: number): Record<ResourceType, number> { return RESOURCE_TYPES.reduce((result, resourceType) => { result[resourceType] = value; return result; }, {} as Record<ResourceType, number>); }
function benchmarkSupplies(): Record<ResourceType, number> { return RESOURCE_TYPES.reduce((result, resourceType) => { result[resourceType] = getResource(resourceType).market.globalBenchmarkSupply; return result; }, {} as Record<ResourceType, number>); }

describe('sales orders', () => {
  it('uses broad base target ranges for every customer domain', () => {
    expect(SALES_CUSTOMER_DOMAIN_PROFILES.food.targetOrderValue).toEqual([20, 240]);
    expect(SALES_CUSTOMER_DOMAIN_PROFILES['raw-materials'].targetOrderValue).toEqual([30, 360]);
    expect(SALES_CUSTOMER_DOMAIN_PROFILES['industrial-inputs'].targetOrderValue).toEqual([50, 650]);
    expect(SALES_CUSTOMER_DOMAIN_PROFILES['construction-materials'].targetOrderValue).toEqual([60, 800]);
    expect(SALES_CUSTOMER_DOMAIN_PROFILES.electronics.targetOrderValue).toEqual([75, 1_000]);
    expect(SALES_CUSTOMER_DOMAIN_PROFILES.utilities.targetOrderValue).toEqual([25, 450]);
  });

  it('returns defensive customer-catalogue views while retaining its generated catalogue', () => {
    const orders = new SalesOrders();
    const firstRead = orders.getCustomerCatalogue();
    const originalName = firstRead[0].name;
    firstRead[0].name = 'Changed by caller';

    const secondRead = orders.getCustomerCatalogue();

    expect(secondRead[0].name).toBe(originalName);
    expect(secondRead[0].operatingDomains).not.toBe(firstRead[0].operatingDomains);
  });

  it('requires a meaningful utility lot and locks bid, reference price, and premium', () => {
    const orders = new SalesOrders();
    const result = orders.advanceTime({ currentGameTimeMs: 60_000, maximumOpenOrders: 2, maximumOrderValue: 10_000, companyPrestige: 500, economyPhase: 'boom', inventoryByResource: quantities(ResourceType.Water, 1_000), globalPrices: prices(1), globalSupplies: benchmarkSupplies(), candidateResourceTypes: [ResourceType.Water], getResourceWeight: () => 1, bidResearchMultiplier: 1 });
    expect(result.ordersCreated).toBe(1);
    const order = orders.getOfferedOrders()[0];
    expect(order.lines).toHaveLength(1);
    expect(order.lines[0].resourceType).toBe(ResourceType.Water);
    expect(order.lines[0].quantity % 500).toBe(0);
    expect(order.lines[0].globalReferenceUnitPrice).toBe(1);
    expect(order.lines[0].bidUnitPrice).toBeGreaterThan(0);
    expect(order.reward).toBe(order.lines[0].quantity * order.lines[0].bidUnitPrice);
  });

  it('does not acquire orders without an inventory lot and lowers chance for pending orders', () => {
    expect(calculateSalesOrderAcquisitionChance({ openOrderCount: 0, maximumOpenOrders: 3, companyPrestige: 0, economyPhase: 'stable', hasEligibleInventory: false })).toBe(0);
    expect(calculateSalesOrderAcquisitionChance({ openOrderCount: 2, maximumOpenOrders: 3, companyPrestige: 0, economyPhase: 'stable', hasEligibleInventory: true })).toBeLessThan(calculateSalesOrderAcquisitionChance({ openOrderCount: 0, maximumOpenOrders: 3, companyPrestige: 0, economyPhase: 'stable', hasEligibleInventory: true }));
  });

  it('reports zero acquisition chance when every open-order slot is occupied', () => {
    expect(calculateSalesOrderAcquisitionChance({
      openOrderCount: 2,
      maximumOpenOrders: 2,
      companyPrestige: 0,
      economyPhase: 'stable',
      hasEligibleInventory: true,
    })).toBe(0);
  });

  it('starts inventory-ready companies at a visible, stable-economy acquisition rate', () => {
    const acquisition = calculateSalesOrderAcquisitionDetails({ openOrderCount: 0, maximumOpenOrders: 2, companyPrestige: 0, economyPhase: 'stable', hasEligibleInventory: true });

    expect(acquisition.baseChance).toBe(1);
    expect(acquisition.prestigeDiscoveryMultiplier).toBe(0.65);
    expect(acquisition.pendingMultiplier).toBe(1);
    expect(acquisition.economyMultiplier).toBe(1);
    expect(acquisition.chance).toBeCloseTo(0.65);
  });

  it('does not create a request when a meaningful lot alone exceeds the company-value cap', () => {
    const orders = new SalesOrders();
    const result = orders.advanceTime({ currentGameTimeMs: 60_000, maximumOpenOrders: 2, maximumOrderValue: 100, companyPrestige: 500, economyPhase: 'boom', inventoryByResource: quantities(ResourceType.Water, 1_000), globalPrices: prices(1), globalSupplies: benchmarkSupplies(), candidateResourceTypes: [ResourceType.Water], getResourceWeight: () => 1, bidResearchMultiplier: 1 });

    expect(result.ordersCreated).toBe(0);
    expect(result.acquisitionChance).toBe(0);
  });

  it('uses the same eligibility rule for acquisition display and order creation', () => {
    expect(getEligibleSalesOrderResourceTypes({
      candidateResourceTypes: [ResourceType.Water],
      inventoryByResource: quantities(ResourceType.Water, 1_000),
      globalPrices: prices(1),
      maximumOrderValue: 100,
    })).toEqual([]);
  });

  it('prefers customer-resource pairs with deeper stock and stronger relationships', () => {
    const baseline = calculateSalesOrderSelectionWeight({
      inventoryAmount: 100,
      standardOrderLot: 100,
      productionWeight: 1,
      customerMarketShare: 0.1,
      domainFrequency: 1,
      customerTypeFrequency: 1,
      relationship: 0,
    });
    const deeperStock = calculateSalesOrderSelectionWeight({
      inventoryAmount: 1_600,
      standardOrderLot: 100,
      productionWeight: 1,
      customerMarketShare: 0.1,
      domainFrequency: 1,
      customerTypeFrequency: 1,
      relationship: 0,
    });
    const strongerRelationship = calculateSalesOrderSelectionWeight({
      inventoryAmount: 100,
      standardOrderLot: 100,
      productionWeight: 1,
      customerMarketShare: 0.1,
      domainFrequency: 1,
      customerTypeFrequency: 1,
      relationship: 1,
    });

    expect(deeperStock).toBeGreaterThan(baseline);
    expect(strongerRelationship).toBeGreaterThan(baseline);
  });

  it('makes large customer types possible but exceptionally unlikely before prestige', () => {
    const earlyGovernmentAccess = calculateSalesCustomerAccessibility('government-procurement', 0);
    const earlyPrivateAccess = calculateSalesCustomerAccessibility('private-customer', 0);
    const lateGovernmentAccess = calculateSalesCustomerAccessibility('government-procurement', 1_000);

    expect(earlyGovernmentAccess).toBeGreaterThan(0);
    expect(earlyGovernmentAccess).toBeLessThan(earlyPrivateAccess * 0.01);
    expect(lateGovernmentAccess).toBeGreaterThan(earlyGovernmentAccess * 20);
  });

  it('calibrates major customer access to the project prestige scale', () => {
    expect(calculateSalesCustomerAccessibility('government-procurement', 20)).toBeCloseTo(0.0028, 4);
    expect(calculateSalesCustomerAccessibility('government-procurement', 100)).toBeCloseTo(0.0644, 4);
    expect(calculateSalesCustomerAccessibility('government-procurement', 300)).toBeCloseTo(0.3178, 4);
    expect(calculateSalesCustomerAccessibility('government-procurement', 1_000)).toBeCloseTo(0.6836, 4);
  });

  it('keeps a generated order at or below the company-value cap after lot rounding', () => {
    const orders = new SalesOrders();
    const result = orders.advanceTime({ currentGameTimeMs: 60_000, maximumOpenOrders: 2, maximumOrderValue: 500, companyPrestige: 500, economyPhase: 'boom', inventoryByResource: quantities(ResourceType.Grain, 1_000), globalPrices: prices(1), globalSupplies: benchmarkSupplies(), candidateResourceTypes: [ResourceType.Grain], getResourceWeight: () => 1, bidResearchMultiplier: 1 });

    expect(result.ordersCreated).toBe(1);
    expect(orders.getOfferedOrders()[0].reward).toBeLessThanOrEqual(500);
  });

  it('scales target offer value with prestige and gives a modest repeat-customer volume bonus', () => {
    const baseTargetValue = 100;
    const startingCompanyValue = calculateSalesOrderTargetValue({ baseTargetValue, companyPrestige: 0, relationship: 0 });
    const establishedCompanyValue = calculateSalesOrderTargetValue({ baseTargetValue, companyPrestige: 500, relationship: 0 });
    const loyalCustomerValue = calculateSalesOrderTargetValue({ baseTargetValue, companyPrestige: 500, relationship: 1 });

    expect(startingCompanyValue).toBe(baseTargetValue);
    expect(establishedCompanyValue).toBeGreaterThan(startingCompanyValue);
    expect(establishedCompanyValue).toBeCloseTo(300);
    expect(loyalCustomerValue).toBeCloseTo(establishedCompanyValue * 1.2);
  });

  it('matures large customer order multipliers with company prestige', () => {
    const earlyMaturity = calculateSalesOrderCustomerTypeMaturity('government-procurement', 0);
    const lateMaturity = calculateSalesOrderCustomerTypeMaturity('government-procurement', 1_000);
    const earlyValue = calculateSalesOrderTargetValue({ baseTargetValue: 100, companyPrestige: 0, relationship: 0, customerType: 'government-procurement', customerTypeMultiplier: 4 });
    const lateValue = calculateSalesOrderTargetValue({ baseTargetValue: 100, companyPrestige: 1_000, relationship: 0, customerType: 'government-procurement', customerTypeMultiplier: 4 });

    expect(earlyMaturity).toBeLessThan(0.02);
    expect(lateMaturity).toBeGreaterThan(0.5);
    expect(earlyValue).toBeLessThan(130);
    expect(lateValue).toBeGreaterThan(250);
  });

  it('keeps global supply pressure bounded while allowing both shortage and oversupply to request more lots', () => {
    const resourceType = ResourceType.Grain;
    const benchmark = getResource(resourceType).market.globalBenchmarkSupply;

    expect(calculateSalesOrderMarketVolumeMultiplier({ resourceType, globalSupply: benchmark })).toBe(1);
    expect(calculateSalesOrderMarketVolumeMultiplier({ resourceType, globalSupply: 0 })).toBeCloseTo(1.12);
    expect(calculateSalesOrderMarketVolumeMultiplier({ resourceType, globalSupply: benchmark * 3 })).toBeCloseTo(1.3);
  });

  it('keeps one line common while allowing more compatible lines as customer maturity rises', () => {
    expect(calculateSalesOrderBundleLineCount({ candidateCount: 1, companyPrestige: 300, relationship: 1, marketShare: 0.2, bundleAppetite: 1, seed: 'one' })).toBe(1);
    expect(calculateSalesOrderBundleLineCount({ candidateCount: 8, companyPrestige: 0, relationship: 0, marketShare: 0.001, bundleAppetite: 0.08, seed: 'early' })).toBe(1);
    const lateLineCounts = Array.from({ length: 40 }, (_, index) => calculateSalesOrderBundleLineCount({ candidateCount: 8, companyPrestige: 300, relationship: 1, marketShare: 0.2, bundleAppetite: 1, seed: `late-${index}` }));
    expect(lateLineCounts.some((lineCount) => lineCount > 1)).toBe(true);
  });

  it('changes relationship for fulfilment, rejection, and expiry', () => {
    const orders = new SalesOrders();
    orders.advanceTime({ currentGameTimeMs: 60_000, maximumOpenOrders: 2, maximumOrderValue: 10_000, companyPrestige: 500, economyPhase: 'boom', inventoryByResource: quantities(ResourceType.Water, 1_000), globalPrices: prices(1), globalSupplies: benchmarkSupplies(), candidateResourceTypes: [ResourceType.Water], getResourceWeight: () => 1, bidResearchMultiplier: 1 });
    const order = orders.getOfferedOrders()[0]; const before = orders.getCustomerState(order.customerId, 60_000, 500).relationship;
    orders.fulfill(order.id, 61_000, 500);
    expect(orders.getCustomerState(order.customerId, 61_000, 500).relationship).toBeGreaterThan(before);
    orders.createDevelopmentOrderForResource(ResourceType.Water, 500, 1, 2, 62_000, 500);
    const rejected = orders.getOfferedOrders()[0]; const beforeRejection = orders.getCustomerState(rejected.customerId, 62_000, 500).relationship;
    orders.reject(rejected.id, 62_500, 500);
    expect(orders.getCustomerState(rejected.customerId, 62_500, 500).relationship).toBeLessThan(beforeRejection);
    orders.createDevelopmentOrderForResource(ResourceType.Water, 500, 1, 2, 63_000, 500);
    const expiring = orders.getOfferedOrders()[0]; const beforeExpiry = orders.getCustomerState(expiring.customerId, 63_000, 500).relationship;
    orders.advanceTime({ currentGameTimeMs: expiring.expiresAtGameTimeMs + SALES_ORDER_DURATION_MS, maximumOpenOrders: 2, maximumOrderValue: 10_000, companyPrestige: 500, economyPhase: 'boom', inventoryByResource: quantities(ResourceType.Water, 1_000), globalPrices: prices(1), globalSupplies: benchmarkSupplies(), candidateResourceTypes: [ResourceType.Water], getResourceWeight: () => 1, bidResearchMultiplier: 1 });
    expect(orders.getCompletedOrders().some((candidate) => candidate.status === 'expired')).toBe(true);
    expect(orders.getCustomerState(expiring.customerId, expiring.expiresAtGameTimeMs + SALES_ORDER_DURATION_MS, 500).relationship).toBeLessThan(beforeExpiry);
  });

  it('persists company order and relationship state without persisting the customer catalogue', () => {
    const orders = new SalesOrders();
    orders.createDevelopmentOrderForResource(ResourceType.Water, 500, 1, 2, 60_000, 20);
    const offered = orders.getOfferedOrders()[0];
    orders.fulfill(offered.id, 61_000, 20);
    const snapshot = orders.toSnapshot();
    expect('customers' in snapshot).toBe(false);
    const restored = SalesOrders.fromSnapshot(snapshot);
    expect(restored.getCompletedOrders()).toHaveLength(1);
    expect(restored.getCustomerStates()).toHaveLength(1);
    expect(restored.getCustomerCatalogue().length).toBeGreaterThan(18);
  });
});
