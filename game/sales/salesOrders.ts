import { calculateAsymmetricalScaler01, normalizeWithControlPoints01 } from '@/game/core/math/scaling';
import type { EconomyPhase } from '@/game/finance';
import { getResource, type ResourceType } from '@/game/resources';
import { SALES_CUSTOMER_DOMAIN_PROFILES, SALES_CUSTOMER_TYPE_PROFILES, SALES_ECONOMY_MULTIPLIERS, SALES_ORDER_BASE_ACQUISITION_RATE_PER_MINUTE, SALES_ORDER_BID_PRESTIGE_CONTROL_POINTS, SALES_ORDER_BUNDLE_PRESTIGE_CONTROL_POINTS, SALES_ORDER_CUSTOMER_FACTOR_MAX, SALES_ORDER_CUSTOMER_FACTOR_MIN, SALES_ORDER_DURATION_MS, SALES_ORDER_MARKET_VOLUME_SCALING, SALES_ORDER_MAXIMUM_QUANTITY, SALES_ORDER_MINIMUM_COMPANY_VALUE_CAP, SALES_ORDER_MINIMUM_QUANTITY, SALES_ORDER_PENDING_PENALTY_PER_OPEN_ORDER, SALES_ORDER_PRESTIGE_BONUS_MAX, SALES_ORDER_PRESTIGE_BONUS_MIN, SALES_ORDER_PRESTIGE_DISCOVERY_BASE, SALES_ORDER_PRESTIGE_DISCOVERY_MAX, SALES_ORDER_PRESTIGE_DISCOVERY_SCALE, SALES_ORDER_PRESSURE_OFFER_CHANCE, SALES_ORDER_RELATIONSHIP_BONUS_MAX, SALES_ORDER_RELATIONSHIP_BONUS_MIN, SALES_ORDER_SELECTION_MAX_RELATIONSHIP_MULTIPLIER, SALES_ORDER_SELECTION_STOCK_COVERAGE_CAP, SALES_ORDER_UNSTOCKED_INVENTORY_READINESS, SALES_ORDER_VOLUME_SCALING } from './salesConstants';
import { SALES_CUSTOMER_CATALOGUE_VERSION, SALES_CUSTOMER_DOMAINS, SALES_CUSTOMER_RELATIONSHIP, SALES_CUSTOMER_WORLD_SEED, advanceSalesCustomerRelationship, calculateSalesCustomerRelationshipBaseline, calculateSalesCustomerRelationshipChange, createSalesCustomerState, getSalesCustomerCatalogue, getSalesResourceProfile, type SalesCustomerDefinition, type SalesCustomerState, type SalesCustomerType } from './salesCustomers';
import { getDeterministicUnitInterval, pickDeterministicWeighted } from './salesRandom';

export type SalesOrderStatus = 'offered' | 'fulfilled' | 'rejected' | 'expired';
export type SalesOrderLine = { resourceType: ResourceType; quantity: number; globalReferenceUnitPrice: number; bidUnitPrice: number; qualityMultiplier: number; premiumPercent: number; marketVolumeMultiplier: number; reward: number };
export type SalesOrder = { id: string; status: SalesOrderStatus; customerId: string; customerName: string; customerDomain: SalesCustomerDefinition['domain']; customerType: SalesCustomerDefinition['customerType']; lines: SalesOrderLine[]; globalReferenceValue: number; premiumPercent: number; reward: number; offeredAtGameTimeMs: number; expiresAtGameTimeMs: number; fulfilledAtGameTimeMs?: number; rejectedAtGameTimeMs?: number; expiredAtGameTimeMs?: number };
export type SalesOrdersSnapshot = { offered: SalesOrder[]; completed: SalesOrder[]; customerStates: SalesCustomerState[]; nextOrderNumber: number; worldSeed: string; catalogueVersion: number };
export type SalesOrderGenerationInput = { currentGameTimeMs: number; elapsedMilliseconds?: number; maximumOpenOrders: number; maximumOrderValue: number; companyAssets?: number; inventoryValue?: number; companyPrestige: number; economyPhase: EconomyPhase; inventoryByResource: Readonly<Record<ResourceType, number>>; inventoryQualityByResource?: Readonly<Record<ResourceType, number>>; globalPrices: Readonly<Record<ResourceType, number>>; globalSupplies: Readonly<Record<ResourceType, number>>; candidateResourceTypes: readonly ResourceType[]; getResourceWeight: (resourceType: ResourceType) => number; bidResearchMultiplier: number; inventoryReadinessMultiplier?: number; relationshipDecayHalfLifeMultiplier?: number; relationshipFulfilmentGainMultiplier?: number; relationshipFailureLossMultiplier?: number; pressureOfferChanceMultiplier?: number; bundleMaturityMultiplier?: number; minimumPremiumBonus?: number };
export type SalesOrderAcquisitionDetails = { baseRate: number; prestigeDiscoveryMultiplier: number; pendingMultiplier: number; economyMultiplier: number; inventoryReadinessMultiplier: number; rate: number };
export type SalesOrderAcquisitionInput = { openOrderCount: number; maximumOpenOrders: number; companyPrestige: number; economyPhase: EconomyPhase; hasOfferableResources: boolean; inventoryReadinessMultiplier?: number };
export type SalesOrderOfferabilityInput = Pick<SalesOrderGenerationInput, 'candidateResourceTypes' | 'globalPrices' | 'maximumOrderValue'>;
export type SalesOrderResourceSelectionWeightInput = {
  inventoryAmount: number;
  standardOrderLot: number;
  productionWeight: number;
};
export type SalesOrderCustomerSelectionWeightInput = {
  customerMarketShare: number;
  customerTypeFrequency: number;
  customerAccessibility?: number;
  relationship: number;
};

const clamp = (value: number, minimum: number, maximum: number): number => Math.max(minimum, Math.min(maximum, value));
const SALES_ORDER_DIAGNOSTICS_FLAG = '__INDUSTRI_SALES_ORDER_DIAGNOSTICS__';
function salesOrderDiagnosticsEnabled(): boolean { return typeof globalThis !== 'undefined' && (globalThis as typeof globalThis & { [SALES_ORDER_DIAGNOSTICS_FLAG]?: boolean })[SALES_ORDER_DIAGNOSTICS_FLAG] === true; }
function salesOrderDiagnostic(label: string, details: unknown): void { if (salesOrderDiagnosticsEnabled() && typeof console !== 'undefined') console.info(`[sales-order] ${label}`, details); }
function cloneOrder(order: SalesOrder): SalesOrder { return { ...order, lines: order.lines.map((line) => ({ ...line })) }; }
function cloneState(state: SalesCustomerState): SalesCustomerState { return { ...state }; }
function cloneCustomer(customer: SalesCustomerDefinition): SalesCustomerDefinition { return { ...customer, operatingDomains: [...customer.operatingDomains] }; }

export function calculateSalesOrderBidPremium(input: { customerType: SalesCustomerType; companyPrestige: number; relationship: number; purchasingPower: number; bidMultiplier: number; economyPhase: EconomyPhase; positiveTail?: number; pressurePenalty?: number; minimumPremiumBonus?: number }): number {
  const typeProfile = SALES_CUSTOMER_TYPE_PROFILES[input.customerType];
  const purchasingPowerFactor = 1 + clamp(input.purchasingPower - 1, SALES_ORDER_CUSTOMER_FACTOR_MIN, SALES_ORDER_CUSTOMER_FACTOR_MAX);
  const bidProfileFactor = 1 + clamp(input.bidMultiplier - 1, SALES_ORDER_CUSTOMER_FACTOR_MIN, SALES_ORDER_CUSTOMER_FACTOR_MAX);
  const relationshipProgress = clamp(input.relationship, 0, 1);
  const prestigeProgress = normalizeWithControlPoints01(Math.max(0, input.companyPrestige), SALES_ORDER_BID_PRESTIGE_CONTROL_POINTS);
  const relationshipBonus = SALES_ORDER_RELATIONSHIP_BONUS_MIN + relationshipProgress * (SALES_ORDER_RELATIONSHIP_BONUS_MAX - SALES_ORDER_RELATIONSHIP_BONUS_MIN);
  const prestigeBonus = SALES_ORDER_PRESTIGE_BONUS_MIN + prestigeProgress * (SALES_ORDER_PRESTIGE_BONUS_MAX - SALES_ORDER_PRESTIGE_BONUS_MIN);
  const baseBidMultiplier = (1 + typeProfile.globalPremiumBaseline + (input.positiveTail ?? 0) + relationshipBonus + prestigeBonus) * purchasingPowerFactor * bidProfileFactor * SALES_ECONOMY_MULTIPLIERS[input.economyPhase].bid;
  const minimumPremiumBonus = Math.max(0, input.minimumPremiumBonus ?? 0);
  const researchedMinimumBidMultiplier = minimumPremiumBonus > 0 ? 1 + minimumPremiumBonus : 0;
  const finalBidMultiplier = Math.max(0.01, baseBidMultiplier + (input.pressurePenalty ?? 0), researchedMinimumBidMultiplier);
  return finalBidMultiplier - 1;
}

export function calculateSalesOrderAcquisitionRate(input: SalesOrderAcquisitionInput): number {
  return calculateSalesOrderAcquisitionDetails(input).rate;
}
export function calculateSalesOrderAcquisitionDetails(input: SalesOrderAcquisitionInput): SalesOrderAcquisitionDetails {
  const discovery = SALES_ORDER_PRESTIGE_DISCOVERY_BASE + Math.max(0, input.companyPrestige) / (Math.max(0, input.companyPrestige) + SALES_ORDER_PRESTIGE_DISCOVERY_SCALE) * (SALES_ORDER_PRESTIGE_DISCOVERY_MAX - SALES_ORDER_PRESTIGE_DISCOVERY_BASE);
  const pending = input.openOrderCount >= input.maximumOpenOrders
    ? 0
    : Math.max(0.08, 1 - input.openOrderCount * SALES_ORDER_PENDING_PENALTY_PER_OPEN_ORDER);
  const economyMultiplier = (SALES_ECONOMY_MULTIPLIERS[input.economyPhase] ?? SALES_ECONOMY_MULTIPLIERS.stable).acquisition;
  const inventoryReadiness = Math.max(0, input.inventoryReadinessMultiplier ?? 1);
  return { baseRate: SALES_ORDER_BASE_ACQUISITION_RATE_PER_MINUTE, prestigeDiscoveryMultiplier: discovery, pendingMultiplier: pending, economyMultiplier, inventoryReadinessMultiplier: inventoryReadiness, rate: input.hasOfferableResources ? SALES_ORDER_BASE_ACQUISITION_RATE_PER_MINUTE * discovery * pending * economyMultiplier * inventoryReadiness : 0 };
}
export function getOfferableSalesOrderResourceTypes(input: SalesOrderOfferabilityInput): ResourceType[] {
  const maximumOrderValue = Math.max(SALES_ORDER_MINIMUM_COMPANY_VALUE_CAP, input.maximumOrderValue);
  return input.candidateResourceTypes.filter((resourceType) => {
    const standardOrderLot = getSalesResourceProfile(resourceType).standardOrderLot;
    const globalPrice = input.globalPrices[resourceType];
    return Number.isFinite(globalPrice)
      && globalPrice > 0
      && standardOrderLot * globalPrice <= maximumOrderValue;
  });
}
export function calculateSalesOrderInventoryReadiness(inventoryAmount: number, standardOrderLot: number): number {
  if (!Number.isFinite(inventoryAmount) || !Number.isFinite(standardOrderLot) || standardOrderLot <= 0) return SALES_ORDER_UNSTOCKED_INVENTORY_READINESS;
  const coverage = Math.max(0, inventoryAmount) / standardOrderLot;
  return SALES_ORDER_UNSTOCKED_INVENTORY_READINESS + Math.sqrt(Math.min(SALES_ORDER_SELECTION_STOCK_COVERAGE_CAP, coverage));
}
export function calculateSalesOrderInventoryValueReadiness(inventoryValue: number, maximumOrderValue: number): number {
  if (!Number.isFinite(inventoryValue) || !Number.isFinite(maximumOrderValue) || maximumOrderValue <= 0) return 0.01;
  const coverage = Math.max(0, inventoryValue) / maximumOrderValue;
  return 0.01 + Math.sqrt(coverage);
}
export function calculateSalesOrderStockCoverageWeight(inventoryAmount: number, standardOrderLot: number): number {
  return calculateSalesOrderInventoryReadiness(inventoryAmount, standardOrderLot);
}
export function calculateSalesOrderResourceSelectionWeight(input: SalesOrderResourceSelectionWeightInput): number {
  return Math.max(0, input.productionWeight) * calculateSalesOrderStockCoverageWeight(input.inventoryAmount, input.standardOrderLot);
}
export function calculateSalesOrderDomainSelectionWeight(domainFrequency: number, resourceWeights: readonly number[]): number {
  if (resourceWeights.length === 0) return 0;
  return Math.max(0, domainFrequency) * resourceWeights.reduce((sum, weight) => sum + Math.max(0, weight), 0) / resourceWeights.length;
}
export function calculateSalesOrderCustomerSelectionWeight(input: SalesOrderCustomerSelectionWeightInput): number {
  const relationshipMultiplier = 1 + clamp(input.relationship, 0, 1)
    * (SALES_ORDER_SELECTION_MAX_RELATIONSHIP_MULTIPLIER - 1);
  return Math.sqrt(Math.max(0, input.customerMarketShare))
    * Math.max(0, input.customerAccessibility ?? 1)
    * Math.max(0, input.customerTypeFrequency)
    * relationshipMultiplier;
}
export function calculateSalesCustomerAccessibility(customerType: SalesCustomerType, companyPrestige: number): number {
  const profile = SALES_CUSTOMER_TYPE_PROFILES[customerType];
  const prestige = Math.max(0, companyPrestige);
  const progress = prestige / (prestige + profile.prestigeScale);
  return profile.accessibilityFloor + (1 - profile.accessibilityFloor) * progress ** profile.prestigeExponent;
}
export function calculateSalesOrderCustomerTypeMaturity(customerType: SalesCustomerType, companyPrestige: number): number {
  const profile = SALES_CUSTOMER_TYPE_PROFILES[customerType];
  const prestige = Math.max(0, companyPrestige);
  return prestige / (prestige + profile.prestigeScale);
}
export function calculateSalesOrderBaseTargetValue(input: { baseRange: readonly [number, number]; companyPrestige: number; randomValue: number }): number {
  const prestige = Math.max(0, input.companyPrestige);
  const roll = clamp(input.randomValue, 0, 1);
  const exponent = 1 + (SALES_ORDER_VOLUME_SCALING.maximumBaseRollExponent - 1) * SALES_ORDER_VOLUME_SCALING.baseRollPrestigeScale / (prestige + SALES_ORDER_VOLUME_SCALING.baseRollPrestigeScale);
  return input.baseRange[0] + (input.baseRange[1] - input.baseRange[0]) * roll ** exponent;
}
export function calculateSalesOrderCompanyValueMultiplier(companyAssets: number | undefined): number {
  if (!Number.isFinite(companyAssets)) return 1;
  const assets = Math.max(0, companyAssets as number);
  return SALES_ORDER_VOLUME_SCALING.minimumCompanyValueMultiplier
    + (1 - SALES_ORDER_VOLUME_SCALING.minimumCompanyValueMultiplier) * assets / (assets + SALES_ORDER_VOLUME_SCALING.companyValueScale);
}
export function calculateSalesOrderTargetValue(input: { baseTargetValue: number; companyAssets?: number; companyPrestige: number; relationship: number; customerType?: SalesCustomerType; customerTypeMultiplier?: number }): number {
  const prestige = Math.max(0, input.companyPrestige);
  const prestigeProgress = prestige / (prestige + SALES_ORDER_VOLUME_SCALING.prestigeScale);
  const prestigeMultiplier = 1 + (SALES_ORDER_VOLUME_SCALING.maximumPrestigeMultiplier - 1) * prestigeProgress;
  const customerTypeMaturity = input.customerType ? calculateSalesOrderCustomerTypeMaturity(input.customerType, prestige) : 1;
  const customerTypeMultiplier = input.customerTypeMultiplier === undefined ? 1 : 1 + (Math.max(0, input.customerTypeMultiplier) - 1) * customerTypeMaturity;
  const relationshipMultiplier = 1 + clamp(input.relationship, 0, 1) * (SALES_ORDER_VOLUME_SCALING.maximumRelationshipMultiplier - 1);
  return Math.max(0, input.baseTargetValue) * calculateSalesOrderCompanyValueMultiplier(input.companyAssets) * prestigeMultiplier * customerTypeMultiplier * relationshipMultiplier;
}
export function calculateSalesOrderMarketVolumeMultiplier(input: { resourceType: ResourceType; globalSupply: number }): number {
  const benchmarkSupply = getResource(input.resourceType).market.globalBenchmarkSupply;
  if (!Number.isFinite(input.globalSupply) || benchmarkSupply <= 0) return 1;
  const supplyRatio = Math.max(0, input.globalSupply) / benchmarkSupply;
  if (supplyRatio < 1) {
    const progress = clamp((1 - supplyRatio) / (1 - SALES_ORDER_MARKET_VOLUME_SCALING.shortageRatioAtMaximum), 0, 1);
    return 1 + (SALES_ORDER_MARKET_VOLUME_SCALING.maximumShortageMultiplier - 1) * calculateAsymmetricalScaler01(progress);
  }
  const progress = clamp((supplyRatio - 1) / (SALES_ORDER_MARKET_VOLUME_SCALING.oversupplyRatioAtMaximum - 1), 0, 1);
  return 1 + (SALES_ORDER_MARKET_VOLUME_SCALING.maximumOversupplyMultiplier - 1) * calculateAsymmetricalScaler01(progress);
}
export function calculateSalesOrderBundleLineCount(input: { candidateCount: number; companyPrestige: number; relationship: number; marketShare: number; bundleAppetite: number; bundleMaturityMultiplier?: number; seed: string }): number {
  if (input.candidateCount <= 1) return Math.max(0, input.candidateCount);
  const prestigeProgress = normalizeWithControlPoints01(Math.max(0, input.companyPrestige), SALES_ORDER_BUNDLE_PRESTIGE_CONTROL_POINTS);
  const relationshipProgress = clamp(input.relationship, 0, 1);
  const shareProgress = calculateAsymmetricalScaler01(clamp(input.marketShare / 0.15, 0, 1));
  const maturity = clamp(prestigeProgress * (0.3 + relationshipProgress * 0.7) * (0.45 + shareProgress * 0.55) * clamp(input.bundleAppetite, 0, 1) * Math.max(0, input.bundleMaturityMultiplier ?? 1), 0, 1);
  const softMaximum = Math.max(1, Math.min(input.candidateCount, 1 + Math.ceil((input.candidateCount - 1) * maturity)));
  const fullRangeChance = 0.025 * Math.pow(maturity, 3);
  const maximum = getDeterministicUnitInterval(`${input.seed}:full-range`) < fullRangeChance ? input.candidateCount : softMaximum;
  return Math.max(1, Math.min(maximum, 1 + Math.floor((maximum - 1) * Math.pow(getDeterministicUnitInterval(`${input.seed}:line-count`), 3))));
}
export function calculateSalesOrderEstimatedWaitMinutes(rate: number): number { return rate > 0 ? 1 / rate : 0; }
/**
 * Samples a Poisson arrival count for elapsed foreground time. This keeps offer
 * acquisition probabilistic at every rate while allowing any number of offers
 * when the average rate is high enough.
 */
export function sampleSalesOrderArrivalCount(expectedOrders: number, seed: string): number {
  if (!Number.isFinite(expectedOrders) || expectedOrders <= 0) return 0;

  let arrivals = 0;
  let remainingExpectedOrders = expectedOrders;
  let segment = 0;
  while (remainingExpectedOrders > 0) {
    const segmentExpectedOrders = Math.min(50, remainingExpectedOrders);
    const threshold = Math.exp(-segmentExpectedOrders);
    let product = 1;
    let count = 0;
    do {
      count += 1;
      product *= Math.max(Number.MIN_VALUE, getDeterministicUnitInterval(`${seed}:${segment}:${count}`));
    } while (product > threshold);
    arrivals += count - 1;
    remainingExpectedOrders -= segmentExpectedOrders;
    segment += 1;
  }
  return arrivals;
}
export function calculateSalesOrderMarketComparison(order: Pick<SalesOrder, 'lines' | 'reward'>, getLocalUnitPrice: (resourceType: ResourceType) => number): { normalSaleValue: number; gain: number; gainPercent: number } { const normalSaleValue = order.lines.reduce((sum, line) => sum + line.quantity * getLocalUnitPrice(line.resourceType), 0); const gain = order.reward - normalSaleValue; return { normalSaleValue, gain, gainPercent: normalSaleValue > 0 ? gain / normalSaleValue * 100 : 0 }; }

function createOrderLine(input: { resourceType: ResourceType; targetValue: number; globalReferenceUnitPrice: number; globalSupply: number; inventoryQuality: number; customer: SalesCustomerDefinition; relationship: number; companyPrestige: number; economyPhase: EconomyPhase; bidResearchMultiplier: number; pressureOfferChanceMultiplier: number; minimumPremiumBonus: number; seed: string; maximumReward?: number }): SalesOrderLine | null {
  const positiveTail = Math.min(0.8, -Math.log(Math.max(0.0001, 1 - getDeterministicUnitInterval(`${input.seed}:positive-tail`))) * 0.08);
  const pressureOfferChance = clamp(SALES_ORDER_PRESSURE_OFFER_CHANCE * Math.max(0, input.pressureOfferChanceMultiplier), 0, 1);
  const pressurePenalty = getDeterministicUnitInterval(`${input.seed}:pressure-offer`) < pressureOfferChance ? -(0.05 + Math.min(0.2, -Math.log(Math.max(0.0001, 1 - getDeterministicUnitInterval(`${input.seed}:pressure-size`))) * 0.04)) : 0;
  const premium = calculateSalesOrderBidPremium({ customerType: input.customer.customerType, companyPrestige: input.companyPrestige, relationship: input.relationship, purchasingPower: input.customer.purchasingPower, bidMultiplier: input.customer.bidMultiplier, economyPhase: input.economyPhase, positiveTail, pressurePenalty, minimumPremiumBonus: input.minimumPremiumBonus });
  const bidUnitPrice = Math.max(0.01, input.globalReferenceUnitPrice * (1 + premium) * Math.max(0, input.bidResearchMultiplier));
  const qualityMultiplier = Number.isFinite(input.inventoryQuality) && input.inventoryQuality > 0 ? input.inventoryQuality : 1;
  const qualityAdjustedUnitPrice = bidUnitPrice * qualityMultiplier;
  const lot = getSalesResourceProfile(input.resourceType).standardOrderLot;
  const marketVolumeMultiplier = calculateSalesOrderMarketVolumeMultiplier({ resourceType: input.resourceType, globalSupply: input.globalSupply });
  const requestedQuantity = clamp(Math.ceil(input.targetValue * marketVolumeMultiplier / qualityAdjustedUnitPrice / lot) * lot, Math.max(lot, SALES_ORDER_MINIMUM_QUANTITY), SALES_ORDER_MAXIMUM_QUANTITY);
  const maximumQuantity = input.maximumReward === undefined ? SALES_ORDER_MAXIMUM_QUANTITY : Math.floor(input.maximumReward / qualityAdjustedUnitPrice / lot) * lot;
  const quantity = Math.min(requestedQuantity, maximumQuantity);
  if (quantity < lot) return null;
  return { resourceType: input.resourceType, quantity, globalReferenceUnitPrice: input.globalReferenceUnitPrice, bidUnitPrice, qualityMultiplier, premiumPercent: bidUnitPrice / input.globalReferenceUnitPrice * 100 - 100, marketVolumeMultiplier, reward: quantity * qualityAdjustedUnitPrice };
}

export class SalesOrders {
  private offered: SalesOrder[] = []; private completed: SalesOrder[] = []; private customerStates: SalesCustomerState[] = []; private nextOrderNumber = 1; private worldSeed = SALES_CUSTOMER_WORLD_SEED; private catalogueVersion = SALES_CUSTOMER_CATALOGUE_VERSION; private customerCatalogue: SalesCustomerDefinition[] | null = null; private customerCatalogueById: Map<string, SalesCustomerDefinition> | null = null;
  constructor(snapshot?: SalesOrdersSnapshot) { if (snapshot) this.restore(snapshot); }
  getCustomerCatalogue(): SalesCustomerDefinition[] { return this.getCustomerCatalogueInternal().map(cloneCustomer); }
  getOfferedOrders(): SalesOrder[] { return this.offered.map(cloneOrder); }
  getCompletedOrders(): SalesOrder[] { return this.completed.map(cloneOrder); }
  getOfferedOrder(id: string): SalesOrder | null { const order = this.offered.find((candidate) => candidate.id === id); return order ? cloneOrder(order) : null; }
  getCustomerStates(): SalesCustomerState[] { return this.customerStates.map(cloneState); }
  getCustomerState(customerId: string, currentGameTimeMs: number, companyPrestige: number, relationshipDecayHalfLifeMultiplier = 1): SalesCustomerState { const customer = this.getCustomerById(customerId); const state = this.customerStates.find((candidate) => candidate.customerId === customerId); if (!customer) return createSalesCustomerState(customerId, 0, currentGameTimeMs); return advanceSalesCustomerRelationship(state ?? createSalesCustomerState(customerId, calculateSalesCustomerRelationshipBaseline(customer, companyPrestige), currentGameTimeMs), customer, companyPrestige, currentGameTimeMs, relationshipDecayHalfLifeMultiplier); }
  createDevelopmentOrderForResource(resourceType: ResourceType, quantity: number, globalReferenceUnitPrice: number, maximumOpenOrders: number, currentGameTimeMs: number, companyPrestige: number): SalesOrder | null {
    if (!Number.isInteger(quantity) || quantity < SALES_ORDER_MINIMUM_QUANTITY || quantity > SALES_ORDER_MAXIMUM_QUANTITY || this.offered.length >= maximumOpenOrders || !Number.isFinite(globalReferenceUnitPrice) || globalReferenceUnitPrice <= 0) return null;
    const profile = getSalesResourceProfile(resourceType); const customer = this.getCustomerCatalogueInternal().find((candidate) => candidate.domain === profile.domain); if (!customer) return null;
    const state = this.getCustomerState(customer.id, currentGameTimeMs, companyPrestige); const line = createOrderLine({ resourceType, targetValue: quantity * globalReferenceUnitPrice, globalReferenceUnitPrice, globalSupply: getResource(resourceType).market.globalBenchmarkSupply, inventoryQuality: 1, customer, relationship: state.relationship, companyPrestige, economyPhase: 'stable', bidResearchMultiplier: 1, pressureOfferChanceMultiplier: 1, minimumPremiumBonus: 0, seed: `development:${this.nextOrderNumber}` });
    if (!line) return null;
    const order = this.createOrder(customer, [line], currentGameTimeMs); this.nextOrderNumber += 1; this.offered.push(order); return cloneOrder(order);
  }
  advanceTime(input: SalesOrderGenerationInput): { ordersCreated: number; ordersExpired: SalesOrder[]; acquisitionRate: number } {
    const relationshipDecayHalfLifeMultiplier = input.relationshipDecayHalfLifeMultiplier ?? 1;
    const relationshipFulfilmentGainMultiplier = input.relationshipFulfilmentGainMultiplier ?? 1;
    const relationshipFailureLossMultiplier = input.relationshipFailureLossMultiplier ?? 1;
    const pressureOfferChanceMultiplier = input.pressureOfferChanceMultiplier ?? 1;
    const bundleMaturityMultiplier = input.bundleMaturityMultiplier ?? 1;
    const minimumPremiumBonus = input.minimumPremiumBonus ?? 0;
    this.advanceRelationships(input.currentGameTimeMs, input.companyPrestige, relationshipDecayHalfLifeMultiplier); const ordersExpired = this.expireOrders(input.currentGameTimeMs, input.companyPrestige, relationshipDecayHalfLifeMultiplier, relationshipFulfilmentGainMultiplier, relationshipFailureLossMultiplier);
    const maximumOrderValue = Math.max(SALES_ORDER_MINIMUM_COMPANY_VALUE_CAP, input.maximumOrderValue);
    const offerableResources = getOfferableSalesOrderResourceTypes({ ...input, maximumOrderValue });
    const acquisitionRate = calculateSalesOrderAcquisitionRate({ openOrderCount: this.offered.length, maximumOpenOrders: input.maximumOpenOrders, companyPrestige: input.companyPrestige, economyPhase: input.economyPhase, hasOfferableResources: offerableResources.length > 0, inventoryReadinessMultiplier: input.inventoryReadinessMultiplier ?? calculateSalesOrderInventoryValueReadiness(input.inventoryValue ?? 0, maximumOrderValue) });
    const elapsedMinutes = Math.max(0, input.elapsedMilliseconds ?? 60_000) / 60_000;
    const expectedArrivals = acquisitionRate * elapsedMinutes;
    const acquisitionAttempts = sampleSalesOrderArrivalCount(expectedArrivals, `acquire:${this.worldSeed}:${this.nextOrderNumber}:${input.currentGameTimeMs}`);
    salesOrderDiagnostic('acquisition check', {
      currentGameTimeMs: input.currentGameTimeMs,
      companyPrestige: input.companyPrestige,
      maximumOrderValue,
      openOrderCount: this.offered.length,
      maximumOpenOrders: input.maximumOpenOrders,
      candidateResources: input.candidateResourceTypes,
      offerableResources,
      resourceChecks: input.candidateResourceTypes.map((resourceType) => ({ resourceType, inventory: input.inventoryByResource[resourceType], standardOrderLot: getSalesResourceProfile(resourceType).standardOrderLot, globalPrice: input.globalPrices[resourceType], lotValue: getSalesResourceProfile(resourceType).standardOrderLot * input.globalPrices[resourceType], offerable: offerableResources.includes(resourceType) })),
      acquisitionRate,
      expectedArrivals,
      acquisitionAttempts,
    });
    if (this.offered.length >= input.maximumOpenOrders || offerableResources.length === 0 || acquisitionAttempts === 0) return { ordersCreated: 0, ordersExpired, acquisitionRate };
    let ordersCreated = 0;
    for (let attempt = 0; attempt < acquisitionAttempts && this.offered.length < input.maximumOpenOrders; attempt += 1) {
      const domainCandidates = SALES_CUSTOMER_DOMAINS.map((domain) => {
        const resources = offerableResources.filter((resourceType) => getSalesResourceProfile(resourceType).domain === domain);
        const resourceWeights = resources.map((resourceType) => calculateSalesOrderResourceSelectionWeight({ inventoryAmount: input.inventoryByResource[resourceType], standardOrderLot: getSalesResourceProfile(resourceType).standardOrderLot, productionWeight: input.getResourceWeight(resourceType) }));
        return { value: { domain, resources }, weight: calculateSalesOrderDomainSelectionWeight(SALES_CUSTOMER_DOMAIN_PROFILES[domain].frequency, resourceWeights) };
      });
      const selectedDomain = pickDeterministicWeighted(domainCandidates, `domain:${this.nextOrderNumber}`);
      if (!selectedDomain) continue;
      salesOrderDiagnostic('domain candidates', domainCandidates.map(({ value, weight }) => ({ domain: value.domain, resourceCount: value.resources.length, weight })));

      const customerCatalogue = this.getCustomerCatalogueInternal();
      const customerCandidates = customerCatalogue.filter((customer) => customer.domain === selectedDomain.domain).map((customer) => {
        const state = this.getCustomerState(customer.id, input.currentGameTimeMs, input.companyPrestige, relationshipDecayHalfLifeMultiplier);
        const customerAccessibility = calculateSalesCustomerAccessibility(customer.customerType, input.companyPrestige);
        const weight = calculateSalesOrderCustomerSelectionWeight({ customerMarketShare: customer.marketShare, customerAccessibility, customerTypeFrequency: SALES_CUSTOMER_TYPE_PROFILES[customer.customerType].frequencyMultiplier, relationship: state.relationship });
        return { value: { customer, state }, weight, diagnostics: { customerId: customer.id, customerName: customer.name, customerType: customer.customerType, customerDomain: customer.domain, marketShare: customer.marketShare, customerAccessibility, relationship: state.relationship } };
      });
      const selectedCustomer = pickDeterministicWeighted(customerCandidates, `customer:${this.nextOrderNumber}`);
      if (!selectedCustomer) continue;
      const { customer, state } = selectedCustomer;
      salesOrderDiagnostic('customer candidates', customerCandidates.map(({ diagnostics, weight }) => ({ ...diagnostics, weight })));

      const primaryResource = pickDeterministicWeighted(selectedDomain.resources.map((resourceType) => ({ value: resourceType, weight: calculateSalesOrderResourceSelectionWeight({ inventoryAmount: input.inventoryByResource[resourceType], standardOrderLot: getSalesResourceProfile(resourceType).standardOrderLot, productionWeight: input.getResourceWeight(resourceType) }) })), `resource:${this.nextOrderNumber}`);
      if (!primaryResource) continue;
      salesOrderDiagnostic('selected domain-customer-resource', { domain: selectedDomain.domain, resourceType: primaryResource, customerId: customer.id, customerName: customer.name, customerType: customer.customerType, relationship: state.relationship });

      const compatibleResources = offerableResources.filter((resourceType) => customer.operatingDomains.includes(getSalesResourceProfile(resourceType).domain));
    const lineCount = calculateSalesOrderBundleLineCount({ candidateCount: compatibleResources.length, companyPrestige: input.companyPrestige, relationship: state.relationship, marketShare: customer.marketShare, bundleAppetite: SALES_CUSTOMER_TYPE_PROFILES[customer.customerType].bundleAppetite, bundleMaturityMultiplier, seed: `bundle:${this.nextOrderNumber}` });
    const selectedResources: ResourceType[] = [primaryResource]; const remaining = compatibleResources.filter((resourceType) => resourceType !== primaryResource);
    while (selectedResources.length < lineCount && remaining.length > 0) {
      const next = pickDeterministicWeighted(remaining.map((value) => ({
        value,
        weight: calculateSalesOrderResourceSelectionWeight({ inventoryAmount: input.inventoryByResource[value], standardOrderLot: getSalesResourceProfile(value).standardOrderLot, productionWeight: input.getResourceWeight(value) }),
      })), `bundle:${this.nextOrderNumber}:${selectedResources.length}`);
      if (!next) break;
      selectedResources.push(next);
      remaining.splice(remaining.indexOf(next), 1);
    }
    const domain = SALES_CUSTOMER_DOMAIN_PROFILES[customer.domain];
    const type = SALES_CUSTOMER_TYPE_PROFILES[customer.customerType];
    const baseTargetValue = calculateSalesOrderBaseTargetValue({ baseRange: domain.targetOrderValue, companyPrestige: input.companyPrestige, randomValue: getDeterministicUnitInterval(`value:${this.nextOrderNumber}`) });
    const customerTypeMultiplier = type.targetValueMultiplier[0] + (type.targetValueMultiplier[1] - type.targetValueMultiplier[0]) * getDeterministicUnitInterval(`type-value:${this.nextOrderNumber}`);
    const customerTypeMaturity = calculateSalesOrderCustomerTypeMaturity(customer.customerType, input.companyPrestige);
    const targetValueBeforeCap = calculateSalesOrderTargetValue({ baseTargetValue, companyAssets: input.companyAssets, companyPrestige: input.companyPrestige, customerType: customer.customerType, customerTypeMultiplier, relationship: state.relationship });
    const targetValue = Math.min(maximumOrderValue, targetValueBeforeCap);
    salesOrderDiagnostic('order target value', { customerType: customer.customerType, domain: customer.domain, baseTargetValue, baseRollExponent: 1 + (SALES_ORDER_VOLUME_SCALING.maximumBaseRollExponent - 1) * SALES_ORDER_VOLUME_SCALING.baseRollPrestigeScale / (input.companyPrestige + SALES_ORDER_VOLUME_SCALING.baseRollPrestigeScale), companyAssets: input.companyAssets, companyValueMultiplier: calculateSalesOrderCompanyValueMultiplier(input.companyAssets), typeMultiplierRoll: customerTypeMultiplier, customerTypeMaturity, relationship: state.relationship, targetValueBeforeCap, maximumOrderValue, targetValue, selectedResources });
    const lines: SalesOrderLine[] = [];
    let remainingOrderValue = maximumOrderValue;
    for (const resourceType of selectedResources) {
      const line = createOrderLine({ resourceType, targetValue: targetValue / selectedResources.length, globalReferenceUnitPrice: input.globalPrices[resourceType], globalSupply: input.globalSupplies[resourceType], inventoryQuality: input.inventoryQualityByResource?.[resourceType] ?? 1, customer, relationship: state.relationship, companyPrestige: input.companyPrestige, economyPhase: input.economyPhase, bidResearchMultiplier: input.bidResearchMultiplier, pressureOfferChanceMultiplier, minimumPremiumBonus, seed: `line:${this.nextOrderNumber}:${resourceType}`, maximumReward: remainingOrderValue });
      if (!line) continue;
      lines.push(line); remainingOrderValue -= line.reward;
    }
    if (lines.length === 0) continue;
    const order = this.createOrder(customer, lines, input.currentGameTimeMs); this.nextOrderNumber += 1; this.offered.push(order);
    salesOrderDiagnostic('order created', { orderId: order.id, customerName: order.customerName, customerType: order.customerType, customerDomain: order.customerDomain, reward: order.reward, lines: order.lines.map((line) => ({ resourceType: line.resourceType, quantity: line.quantity, bidUnitPrice: line.bidUnitPrice, reward: line.reward })) });
    ordersCreated += 1;
    }
    return { ordersCreated, ordersExpired, acquisitionRate };
  }
  fulfill(id: string, fulfilledAtGameTimeMs: number, companyPrestige: number, relationshipDecayHalfLifeMultiplier = 1, relationshipFulfilmentGainMultiplier = 1, relationshipFailureLossMultiplier = 1): SalesOrder | null { const index = this.offered.findIndex((order) => order.id === id); if (index < 0) return null; const [order] = this.offered.splice(index, 1); const fulfilled = { ...order, status: 'fulfilled' as const, fulfilledAtGameTimeMs }; this.completed.unshift(fulfilled); this.applyRelationshipForOrder(fulfilled, companyPrestige, fulfilledAtGameTimeMs, 'fulfilled', relationshipDecayHalfLifeMultiplier, relationshipFulfilmentGainMultiplier, relationshipFailureLossMultiplier); return cloneOrder(fulfilled); }
  reject(id: string, rejectedAtGameTimeMs: number, companyPrestige: number, relationshipDecayHalfLifeMultiplier = 1, relationshipFulfilmentGainMultiplier = 1, relationshipFailureLossMultiplier = 1): SalesOrder | null { const index = this.offered.findIndex((order) => order.id === id); if (index < 0) return null; const [order] = this.offered.splice(index, 1); const rejected = { ...order, status: 'rejected' as const, rejectedAtGameTimeMs }; this.completed.unshift(rejected); this.applyRelationshipForOrder(rejected, companyPrestige, rejectedAtGameTimeMs, 'rejected', relationshipDecayHalfLifeMultiplier, relationshipFulfilmentGainMultiplier, relationshipFailureLossMultiplier); return cloneOrder(rejected); }
  clone(): SalesOrders { return SalesOrders.fromSnapshot(this.toSnapshot()); }
  toSnapshot(): SalesOrdersSnapshot { return { offered: this.getOfferedOrders(), completed: this.getCompletedOrders(), customerStates: this.getCustomerStates(), nextOrderNumber: this.nextOrderNumber, worldSeed: this.worldSeed, catalogueVersion: this.catalogueVersion }; }
  static fromSnapshot(snapshot: SalesOrdersSnapshot): SalesOrders { return new SalesOrders(snapshot); }
  private createOrder(customer: SalesCustomerDefinition, lines: SalesOrderLine[], currentGameTimeMs: number): SalesOrder { const reward = lines.reduce((sum, line) => sum + line.reward, 0); const globalReferenceValue = lines.reduce((sum, line) => sum + line.quantity * line.globalReferenceUnitPrice, 0); const bidValue = lines.reduce((sum, line) => sum + line.quantity * line.bidUnitPrice, 0); return { id: `sales-order-${this.nextOrderNumber}`, status: 'offered', customerId: customer.id, customerName: customer.name, customerDomain: customer.domain, customerType: customer.customerType, lines, globalReferenceValue, premiumPercent: globalReferenceValue > 0 ? bidValue / globalReferenceValue * 100 - 100 : 0, reward, offeredAtGameTimeMs: currentGameTimeMs, expiresAtGameTimeMs: currentGameTimeMs + SALES_ORDER_DURATION_MS }; }
  private advanceRelationships(currentGameTimeMs: number, companyPrestige: number, relationshipDecayHalfLifeMultiplier: number): void { this.getCustomerCatalogueInternal(); const catalogue = this.customerCatalogueById!; this.customerStates = this.customerStates.map((state) => { const customer = catalogue.get(state.customerId); return customer ? advanceSalesCustomerRelationship(state, customer, companyPrestige, currentGameTimeMs, relationshipDecayHalfLifeMultiplier) : state; }); }
  private expireOrders(currentGameTimeMs: number, companyPrestige: number, relationshipDecayHalfLifeMultiplier: number, relationshipFulfilmentGainMultiplier: number, relationshipFailureLossMultiplier: number): SalesOrder[] { const expired: SalesOrder[] = []; const remaining: SalesOrder[] = []; for (const order of this.offered) { if (order.expiresAtGameTimeMs > currentGameTimeMs) { remaining.push(order); continue; } const expiredOrder = { ...order, status: 'expired' as const, expiredAtGameTimeMs: currentGameTimeMs }; this.completed.unshift(expiredOrder); expired.push(cloneOrder(expiredOrder)); this.applyRelationshipForOrder(expiredOrder, companyPrestige, currentGameTimeMs, 'expired', relationshipDecayHalfLifeMultiplier, relationshipFulfilmentGainMultiplier, relationshipFailureLossMultiplier); } this.offered = remaining; return expired; }
  private applyRelationshipForOrder(order: SalesOrder, companyPrestige: number, currentGameTimeMs: number, outcome: 'fulfilled' | 'rejected' | 'expired', relationshipDecayHalfLifeMultiplier: number, relationshipFulfilmentGainMultiplier: number, relationshipFailureLossMultiplier: number): void { const customer = this.getCustomerById(order.customerId); if (!customer) return; const current = this.getCustomerState(order.customerId, currentGameTimeMs, companyPrestige, relationshipDecayHalfLifeMultiplier); const adjustment = calculateSalesCustomerRelationshipChange({ outcome, customer, relationship: current.relationship, orderReferenceValue: order.globalReferenceValue, fulfilmentGainMultiplier: relationshipFulfilmentGainMultiplier, failureLossMultiplier: relationshipFailureLossMultiplier }); const next = { ...current, relationship: clamp(current.relationship + adjustment, 0, SALES_CUSTOMER_RELATIONSHIP.maximum), fulfilledOrderCount: current.fulfilledOrderCount + (outcome === 'fulfilled' ? 1 : 0), expiredOrderCount: current.expiredOrderCount + (outcome === 'expired' ? 1 : 0) }; const index = this.customerStates.findIndex((state) => state.customerId === order.customerId); if (index < 0) this.customerStates.push(next); else this.customerStates[index] = next; }
  private getCustomerCatalogueInternal(): SalesCustomerDefinition[] { if (!this.customerCatalogue) { this.customerCatalogue = getSalesCustomerCatalogue(this.worldSeed, this.catalogueVersion); this.customerCatalogueById = new Map(this.customerCatalogue.map((customer) => [customer.id, customer])); } return this.customerCatalogue; }
  private getCustomerById(customerId: string): SalesCustomerDefinition | undefined { this.getCustomerCatalogueInternal(); return this.customerCatalogueById!.get(customerId); }
  private restore(snapshot: SalesOrdersSnapshot): void { this.offered = Array.isArray(snapshot.offered) ? snapshot.offered.filter((order) => order.status === 'offered' && Array.isArray(order.lines)).map(cloneOrder) : []; this.completed = Array.isArray(snapshot.completed) ? snapshot.completed.filter((order) => order.status !== 'offered' && Array.isArray(order.lines)).map(cloneOrder) : []; this.customerStates = Array.isArray(snapshot.customerStates) ? snapshot.customerStates.map(cloneState) : []; this.nextOrderNumber = Number.isInteger(snapshot.nextOrderNumber) && snapshot.nextOrderNumber > 0 ? snapshot.nextOrderNumber : 1; this.worldSeed = typeof snapshot.worldSeed === 'string' && snapshot.worldSeed.length > 0 ? snapshot.worldSeed : SALES_CUSTOMER_WORLD_SEED; this.catalogueVersion = SALES_CUSTOMER_CATALOGUE_VERSION; this.customerCatalogue = null; this.customerCatalogueById = null; }
}
