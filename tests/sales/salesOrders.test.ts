import { describe, expect, it } from 'vitest';
import { getResource, ResourceType, RESOURCE_TYPES } from '@/game/resources';
import { MARKET_SALES_ORDER_BID_MULTIPLIER } from '@/game/market';
import { SALES_CUSTOMER_DOMAIN_PROFILES, SALES_ORDER_DURATION_MS, SalesOrders, calculateSalesCustomerAccessibility, calculateSalesOrderAcquisitionRate, calculateSalesOrderAcquisitionDetails, calculateSalesOrderBaseTargetValue, calculateSalesOrderBidPremium, calculateSalesOrderBundleLineCount, calculateSalesOrderCustomerSizeFitMultiplier, calculateSalesOrderCustomerTypeMaturity, calculateSalesOrderCustomerSelectionWeight, calculateSalesOrderDomainSelectionWeight, calculateSalesOrderEstimatedWaitMinutes, calculateSalesOrderInventoryReadiness, calculateSalesOrderInventoryValueReadiness, calculateSalesOrderMarketVolumeMultiplier, calculateSalesOrderResourceSelectionWeight, calculateSalesOrderTargetValue, getOfferableSalesOrderResourceTypes, getSalesResourceProfile, sampleSalesOrderArrivalCount } from '@/game/sales';

function quantities(resourceType: ResourceType, amount: number): Record<ResourceType, number> {
  return RESOURCE_TYPES.reduce((result, candidate) => { result[candidate] = candidate === resourceType ? amount : 0; return result; }, {} as Record<ResourceType, number>);
}
function prices(value: number): Record<ResourceType, number> { return RESOURCE_TYPES.reduce((result, resourceType) => { result[resourceType] = value; return result; }, {} as Record<ResourceType, number>); }
function benchmarkSupplies(): Record<ResourceType, number> { return RESOURCE_TYPES.reduce((result, resourceType) => { result[resourceType] = getResource(resourceType).market.globalBenchmarkSupply; return result; }, {} as Record<ResourceType, number>); }

describe('sales orders', () => {
  const waterStandardLot = getSalesResourceProfile(ResourceType.Water).standardOrderLot;
  it('spreads bid bonuses across company progression and customer conditions', () => {
    const bidBonusPercent = (premium: number) => ((1 + premium) * MARKET_SALES_ORDER_BID_MULTIPLIER - 1) * 100;
    const scenarioGroups = [
      { name: 'Early game', companyPrestige: 2.5 },
      { name: 'Mid game', companyPrestige: 20 },
      { name: 'Late game', companyPrestige: 120 },
    ] as const;
    const relationships = [
      { name: 'No relationship', value: 0 },
      { name: 'Established relationship', value: 0.5 },
      { name: 'Maximum relationship', value: 1 },
    ] as const;
    const customerFactors = [
      { name: 'Low customer factors', value: 0.5 },
      { name: 'Neutral customer factors', value: 1 },
      { name: 'High customer factors', value: 1.5 },
    ] as const;
    const economyPhases = ['crash', 'stable', 'boom'] as const;
    const rows = scenarioGroups.flatMap((group) => relationships.flatMap((relationship) => customerFactors.flatMap((customerFactor) => economyPhases.map((economyPhase) => {
      const premium = calculateSalesOrderBidPremium({ customerType: 'industrial-enterprise', companyPrestige: group.companyPrestige, relationship: relationship.value, purchasingPower: customerFactor.value, bidMultiplier: customerFactor.value, economyPhase, positiveTail: 0, pressurePenalty: 0 });
      return { group: group.name, prestige: group.companyPrestige, relationship: relationship.name, customerFactors: customerFactor.name, economy: economyPhase, premiumPercent: Number((premium * 100).toFixed(2)), bidBonusPercent: Number(bidBonusPercent(premium).toFixed(2)) };
    }))));
    console.table(rows);

    expect(rows).toHaveLength(81);
    expect(rows.every((row) => Number.isFinite(row.premiumPercent) && Number.isFinite(row.bidBonusPercent))).toBe(true);
    expect(calculateSalesOrderBidPremium({ customerType: 'industrial-enterprise', companyPrestige: 20, relationship: 0, purchasingPower: 1, bidMultiplier: 1, economyPhase: 'stable', positiveTail: 0, pressurePenalty: 0 })).toBeCloseTo(0.0398);
    expect(calculateSalesOrderBidPremium({ customerType: 'industrial-enterprise', companyPrestige: 20, relationship: 1, purchasingPower: 1, bidMultiplier: 1, economyPhase: 'stable', positiveTail: 0, pressurePenalty: 0 })).toBeGreaterThan(4);
  });

  it('gives customer factors symmetric negative-to-positive bid contributions', () => {
    const input = { customerType: 'industrial-enterprise' as const, companyPrestige: 0, relationship: 0, purchasingPower: 1, bidMultiplier: 1, economyPhase: 'stable' as const, positiveTail: 0, pressurePenalty: 0 };
    const lowCustomerFactors = calculateSalesOrderBidPremium({ ...input, purchasingPower: 0.5, bidMultiplier: 0.5 });
    const highCustomerFactors = calculateSalesOrderBidPremium({ ...input, purchasingPower: 1.5, bidMultiplier: 1.5 });

    expect(lowCustomerFactors).toBeCloseTo(-0.75);
    expect(highCustomerFactors).toBeCloseTo(1.25);
  });

  it('applies the shared 0.7-to-1.3 economy bid multiplier', () => {
    const input = { customerType: 'industrial-enterprise' as const, companyPrestige: 0, relationship: 0, purchasingPower: 1, bidMultiplier: 1, positiveTail: 0, pressurePenalty: 0 };

    expect(calculateSalesOrderBidPremium({ ...input, economyPhase: 'crash' })).toBeCloseTo(-0.3);
    expect(calculateSalesOrderBidPremium({ ...input, economyPhase: 'stable' })).toBeCloseTo(0);
    expect(calculateSalesOrderBidPremium({ ...input, economyPhase: 'boom' })).toBeCloseTo(0.3);
  });

  it('samples at most one probabilistic arrival per acquisition check', () => {
    const samples = Array.from({ length: 100 }, (_, index) => sampleSalesOrderArrivalCount(1.5, `arrival-${index}`));

    expect(sampleSalesOrderArrivalCount(1.5, 'repeatable')).toBe(sampleSalesOrderArrivalCount(1.5, 'repeatable'));
    expect(samples).toContain(0);
    expect(samples.every((count) => count === 0 || count === 1)).toBe(true);
  });

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
    expect(result.ordersCreated).toBeGreaterThan(0);
    const order = orders.getOfferedOrders()[0];
    expect(order.lines).toHaveLength(1);
    expect(order.lines[0].resourceType).toBe(ResourceType.Water);
    expect(order.lines[0].quantity % waterStandardLot).toBe(0);
    expect(order.lines[0].globalReferenceUnitPrice).toBe(1);
    expect(order.lines[0].bidUnitPrice).toBeGreaterThan(0);
    expect(order.reward).toBe(order.lines[0].quantity * order.lines[0].bidUnitPrice);
  });

  it('locks inventory quality into the offer reward at generation time', () => {
    const orders = new SalesOrders();
    const result = orders.advanceTime({ currentGameTimeMs: 60_000, maximumOpenOrders: 2, maximumOrderValue: 10_000, companyPrestige: 500, economyPhase: 'boom', inventoryByResource: quantities(ResourceType.Water, 1_000), inventoryQualityByResource: quantities(ResourceType.Water, 1.5), globalPrices: prices(1), globalSupplies: benchmarkSupplies(), candidateResourceTypes: [ResourceType.Water], getResourceWeight: () => 1, bidResearchMultiplier: 1 });
    expect(result.ordersCreated).toBeGreaterThan(0);
    const line = orders.getOfferedOrders()[0].lines[0];
    expect(line.qualityMultiplier).toBe(1.5);
    expect(orders.getOfferedOrders()[0].reward).toBeCloseTo(line.quantity * line.bidUnitPrice * line.qualityMultiplier);
  });

  it('creates an offer for an unstocked resource and may request more than inventory', () => {
    const orders = new SalesOrders();
    const result = orders.advanceTime({ currentGameTimeMs: 60_000, maximumOpenOrders: 1, maximumOrderValue: 10_000, companyPrestige: 500, economyPhase: 'boom', inventoryByResource: quantities(ResourceType.Water, 0), globalPrices: prices(1), globalSupplies: benchmarkSupplies(), candidateResourceTypes: [ResourceType.Water], getResourceWeight: () => 1, bidResearchMultiplier: 1 });

    expect(result.ordersCreated).toBe(1);
    expect(orders.getOfferedOrders()[0].lines[0].quantity).toBeGreaterThan(0);
  });

  it('acquires orders without inventory while lowering the rate for pending orders', () => {
    expect(calculateSalesOrderAcquisitionRate({ openOrderCount: 0, maximumOpenOrders: 3, companyPrestige: 0, economyPhase: 'stable', hasOfferableResources: false })).toBe(0);
    expect(calculateSalesOrderAcquisitionRate({ openOrderCount: 2, maximumOpenOrders: 3, companyPrestige: 0, economyPhase: 'stable', hasOfferableResources: true })).toBeLessThan(calculateSalesOrderAcquisitionRate({ openOrderCount: 0, maximumOpenOrders: 3, companyPrestige: 0, economyPhase: 'stable', hasOfferableResources: true }));
  });

  it('reports zero acquisition chance when every open-order slot is occupied', () => {
    expect(calculateSalesOrderAcquisitionRate({
      openOrderCount: 2,
      maximumOpenOrders: 2,
      companyPrestige: 0,
      economyPhase: 'stable',
      hasOfferableResources: true,
    })).toBe(0);
  });

  it('starts offerable companies at a visible, stable-economy acquisition rate', () => {
    const acquisition = calculateSalesOrderAcquisitionDetails({ openOrderCount: 0, maximumOpenOrders: 2, companyPrestige: 0, economyPhase: 'stable', hasOfferableResources: true });

    expect(acquisition.baseRate).toBe(1);
    expect(acquisition.prestigeDiscoveryMultiplier).toBe(0.01);
    expect(acquisition.pendingMultiplier).toBe(1);
    expect(acquisition.economyMultiplier).toBe(1);
    expect(acquisition.rate).toBeCloseTo(0.01);
  });

  it('does not create a request when a meaningful lot alone exceeds the company-value cap', () => {
    const orders = new SalesOrders();
    const result = orders.advanceTime({ currentGameTimeMs: 60_000, maximumOpenOrders: 2, maximumOrderValue: 100, companyPrestige: 500, economyPhase: 'boom', inventoryByResource: quantities(ResourceType.Water, 1_000), globalPrices: prices(2), globalSupplies: benchmarkSupplies(), candidateResourceTypes: [ResourceType.Water], getResourceWeight: () => 1, bidResearchMultiplier: 1 });

    expect(result.ordersCreated).toBe(0);
    expect(result.acquisitionRate).toBe(0);
  });

  it('keeps over-budget standard lots out of the offerable resource pool', () => {
    expect(getOfferableSalesOrderResourceTypes({
      candidateResourceTypes: [ResourceType.Water],
      globalPrices: prices(2),
      maximumOrderValue: 100,
    })).toEqual([]);
  });

  it('keeps unstocked resources offerable while inventory coverage raises readiness', () => {
    expect(getOfferableSalesOrderResourceTypes({ candidateResourceTypes: [ResourceType.Water], globalPrices: prices(1), maximumOrderValue: 10_000 })).toEqual([ResourceType.Water]);
    expect(calculateSalesOrderInventoryReadiness(0, waterStandardLot)).toBeCloseTo(0.25);
    expect(calculateSalesOrderInventoryReadiness(10, waterStandardLot)).toBeCloseTo(0.381, 4);
    expect(calculateSalesOrderInventoryReadiness(10, waterStandardLot)).toBeGreaterThan(calculateSalesOrderInventoryReadiness(0, waterStandardLot));
  });

  it('scales acquisition readiness from total inventory value relative to order capacity', () => {
    expect(calculateSalesOrderInventoryValueReadiness(0, 100)).toBe(0.01);
    expect(calculateSalesOrderInventoryValueReadiness(25, 100)).toBeCloseTo(0.51);
    expect(calculateSalesOrderInventoryValueReadiness(100, 100)).toBeCloseTo(1.01);
    expect(calculateSalesOrderInventoryValueReadiness(10_000, 100)).toBeCloseTo(10.01);
  });

  it('reduces acquisition chance when inventory is only a fraction of a standard lot', () => {
    const fullLotChance = calculateSalesOrderAcquisitionRate({ openOrderCount: 0, maximumOpenOrders: 2, companyPrestige: 0, economyPhase: 'stable', hasOfferableResources: true, inventoryReadinessMultiplier: 1 });
    const partialLotChance = calculateSalesOrderAcquisitionRate({ openOrderCount: 0, maximumOpenOrders: 2, companyPrestige: 0, economyPhase: 'stable', hasOfferableResources: true, inventoryReadinessMultiplier: Math.sqrt(0.02) });

    expect(partialLotChance).toBeLessThan(fullLotChance);
    expect(partialLotChance).toBeGreaterThan(0);
  });

  it('reports estimated customer-acquisition wait times for combined progression scenarios', () => {
    const scenarioGroups = [
      { name: 'Early game', prestiges: [2.5], openOrders: [0, 2], inventoryCoverages: [0.1, 1, 3] },
      { name: 'Mid game', prestiges: [20], openOrders: [0, 2, 4], inventoryCoverages: [0.1, 1, 3] },
      { name: 'Late game', prestiges: [120], openOrders: [0, 2, 4, 8], inventoryCoverages: [0.1, 1, 3, 10] },
    ] as const;
    const economyPhases = ['crash', 'stable', 'boom'] as const;
    const rows = scenarioGroups.flatMap((group) => group.prestiges.flatMap((companyPrestige) => group.openOrders.flatMap((openOrderCount) => group.inventoryCoverages.flatMap((inventoryCoverage) => economyPhases.map((economyPhase) => {
      const details = calculateSalesOrderAcquisitionDetails({
        openOrderCount,
        maximumOpenOrders: 10,
        companyPrestige,
        economyPhase,
        hasOfferableResources: true,
        inventoryReadinessMultiplier: Math.sqrt(inventoryCoverage),
      });
      return {
        group: group.name,
        prestige: companyPrestige,
        economy: economyPhase,
        openOrders: openOrderCount,
        inventoryCoverage: `${inventoryCoverage * 100}%`,
        ordersPerMinute: Number(details.rate.toFixed(2)),
        estimatedWaitMinutes: Number(calculateSalesOrderEstimatedWaitMinutes(details.rate).toFixed(2)),
      };
    })))));

    console.table(rows);
    expect(rows).toHaveLength(93);
    expect(rows.every((row) => Number.isFinite(row.estimatedWaitMinutes))).toBe(true);
  });

  it('uses inventory and production to select resources, while customer relationships select customers', () => {
    const baselineResource = calculateSalesOrderResourceSelectionWeight({
      inventoryAmount: 100,
      standardOrderLot: 100,
      productionWeight: 1,
    });
    const deeperStock = calculateSalesOrderResourceSelectionWeight({
      inventoryAmount: 1_600,
      standardOrderLot: 100,
      productionWeight: 1,
    });
    const producedResource = calculateSalesOrderResourceSelectionWeight({
      inventoryAmount: 100,
      standardOrderLot: 100,
      productionWeight: 4,
    });
    const baselineCustomer = calculateSalesOrderCustomerSelectionWeight({
      customerMarketShare: 0.1,
      customerTypeFrequency: 1,
      relationship: 0,
    });
    const strongerRelationship = calculateSalesOrderCustomerSelectionWeight({
      customerMarketShare: 0.1,
      customerTypeFrequency: 1,
      relationship: 1,
    });

    expect(deeperStock).toBeGreaterThan(baselineResource);
    expect(producedResource).toBeGreaterThan(baselineResource);
    expect(strongerRelationship).toBeGreaterThan(baselineCustomer);
  });

  it('selects domains from their average resource readiness instead of their resource counts', () => {
    const oneResourceDomain = calculateSalesOrderDomainSelectionWeight(1, [2]);
    const threeResourceDomain = calculateSalesOrderDomainSelectionWeight(1, [2, 2, 2]);
    const deeperInventoryDomain = calculateSalesOrderDomainSelectionWeight(1, [4]);

    expect(threeResourceDomain).toBe(oneResourceDomain);
    expect(deeperInventoryDomain).toBeGreaterThan(oneResourceDomain);
  });

  it('makes large customer types possible but exceptionally unlikely before prestige', () => {
    const earlyGovernmentAccess = calculateSalesCustomerAccessibility('government-procurement', 0);
    const earlyPrivateAccess = calculateSalesCustomerAccessibility('private-customer', 0);
    const lateGovernmentAccess = calculateSalesCustomerAccessibility('government-procurement', 1_000);

    expect(earlyGovernmentAccess).toBeGreaterThan(0);
    expect(earlyGovernmentAccess).toBeLessThan(earlyPrivateAccess * 0.01);
    expect(lateGovernmentAccess).toBeGreaterThan(earlyGovernmentAccess * 20);
  });

  it('favors small customer types for immature companies and large types as the company matures', () => {
    const earlyPrivate = calculateSalesOrderCustomerSizeFitMultiplier({ customerType: 'private-customer', companyAssets: 0, companyPrestige: 0, relationship: 0 });
    const earlyIndustrial = calculateSalesOrderCustomerSizeFitMultiplier({ customerType: 'industrial-enterprise', companyAssets: 0, companyPrestige: 0, relationship: 0 });
    const maturePrivate = calculateSalesOrderCustomerSizeFitMultiplier({ customerType: 'private-customer', companyAssets: 10_000, companyPrestige: 1_000, relationship: 1 });
    const matureIndustrial = calculateSalesOrderCustomerSizeFitMultiplier({ customerType: 'industrial-enterprise', companyAssets: 10_000, companyPrestige: 1_000, relationship: 1 });

    expect(earlyPrivate).toBeGreaterThan(earlyIndustrial);
    expect(matureIndustrial).toBeGreaterThan(maturePrivate);
  });

  it('calibrates major customer access to the project prestige scale', () => {
    expect(calculateSalesCustomerAccessibility('government-procurement', 20)).toBeCloseTo(0.0028, 4);
    expect(calculateSalesCustomerAccessibility('government-procurement', 100)).toBeCloseTo(0.0644, 4);
    expect(calculateSalesCustomerAccessibility('government-procurement', 300)).toBeCloseTo(0.3178, 4);
    expect(calculateSalesCustomerAccessibility('government-procurement', 1_000)).toBeCloseTo(0.6836, 4);
  });

  it('creates at most one generated order per acquisition check and keeps it within the company-value cap', () => {
    const orders = new SalesOrders();
    const result = orders.advanceTime({ currentGameTimeMs: 60_000, elapsedMilliseconds: 60_000 * 100_000, maximumOpenOrders: 2, maximumOrderValue: 1_000, companyPrestige: 0, economyPhase: 'stable', inventoryValue: 1_000, inventoryByResource: quantities(ResourceType.Grain, 1_000), globalPrices: prices(0.01), globalSupplies: benchmarkSupplies(), candidateResourceTypes: [ResourceType.Grain], getResourceWeight: () => 1, bidResearchMultiplier: 1 });

    expect(result.ordersCreated).toBe(1);
    expect(orders.getOfferedOrders()).toHaveLength(1);
    expect(orders.getOfferedOrders()[0].reward).toBeLessThanOrEqual(1_000);
  });

  it('uses a cap-safe fallback after repeated oversized bid candidates', () => {
    const orders = new SalesOrders();
    const result = orders.advanceTime({ currentGameTimeMs: 60_000, elapsedMilliseconds: 60_000 * 1_000, maximumOpenOrders: 2, maximumOrderValue: 100, companyAssets: 1, companyPrestige: 0, economyPhase: 'stable', inventoryValue: 0, inventoryByResource: quantities(ResourceType.Water, 0), globalPrices: prices(0.1), globalSupplies: benchmarkSupplies(), candidateResourceTypes: [ResourceType.Water], getResourceWeight: () => 1, bidResearchMultiplier: 10 });

    expect(result.ordersCreated).toBe(1);
    expect(orders.getOfferedOrders()[0].reward).toBeLessThanOrEqual(100);
    expect(orders.getOfferedOrders()[0].lines[0].quantity).toBe(waterStandardLot);
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

  it('allows private-customer discounts to reduce mature order targets', () => {
    const discountedValue = calculateSalesOrderTargetValue({ baseTargetValue: 154.716157913208, companyPrestige: 10.330655, relationship: 0.04027785574815941, customerType: 'private-customer', customerTypeMultiplier: 0.345517685089726 });
    const undiscountedValue = calculateSalesOrderTargetValue({ baseTargetValue: 154.716157913208, companyPrestige: 10.330655, relationship: 0.04027785574815941 });

    expect(discountedValue).toBeLessThan(undiscountedValue * 0.6);
  });

  it('biases early base rolls low while preserving their high-value tail', () => {
    const lowPrestigeRoll = calculateSalesOrderBaseTargetValue({ baseRange: [20, 240], companyPrestige: 0, randomValue: 0.75 });
    const latePrestigeRoll = calculateSalesOrderBaseTargetValue({ baseRange: [20, 240], companyPrestige: 1_000, randomValue: 0.75 });

    expect(lowPrestigeRoll).toBeLessThan(100);
    expect(latePrestigeRoll).toBeCloseTo(184.293, 3);
    expect(calculateSalesOrderBaseTargetValue({ baseRange: [20, 240], companyPrestige: 0, randomValue: 1 })).toBe(240);
  });

  it('softens target values for companies with smaller asset bases', () => {
    const earlyValue = calculateSalesOrderTargetValue({ baseTargetValue: 180, companyAssets: 1_000, companyPrestige: 0, relationship: 0 });
    const lateValue = calculateSalesOrderTargetValue({ baseTargetValue: 180, companyAssets: 10_000, companyPrestige: 0, relationship: 0 });

    expect(earlyValue).toBeLessThan(120);
    expect(lateValue).toBeGreaterThan(earlyValue);
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
