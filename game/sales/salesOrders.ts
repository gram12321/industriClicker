import { calculateAsymmetricalScaler01, normalizeWithControlPoints01 } from '@/game/core/math/scaling';
import type { EconomyPhase } from '@/game/finance';
import { getResource, type ResourceType } from '@/game/resources';
import { SALES_CUSTOMER_DOMAIN_PROFILES, SALES_CUSTOMER_TYPE_PROFILES, SALES_ECONOMY_MULTIPLIERS, SALES_ORDER_BASE_ACQUISITION_CHANCE_PER_MINUTE, SALES_ORDER_BUNDLE_PRESTIGE_CONTROL_POINTS, SALES_ORDER_DURATION_MS, SALES_ORDER_MARKET_VOLUME_SCALING, SALES_ORDER_MAXIMUM_QUANTITY, SALES_ORDER_MAXIMUM_GLOBAL_PREMIUM, SALES_ORDER_MINIMUM_COMPANY_VALUE_CAP, SALES_ORDER_MINIMUM_GLOBAL_PREMIUM, SALES_ORDER_MINIMUM_QUANTITY, SALES_ORDER_PENDING_PENALTY_PER_OPEN_ORDER, SALES_ORDER_PRESTIGE_DISCOVERY_BASE, SALES_ORDER_PRESTIGE_DISCOVERY_SCALE, SALES_ORDER_PRESSURE_OFFER_CHANCE, SALES_ORDER_SELECTION_MAX_RELATIONSHIP_MULTIPLIER, SALES_ORDER_SELECTION_STOCK_COVERAGE_CAP, SALES_ORDER_VOLUME_SCALING } from './salesConstants';
import { SALES_CUSTOMER_CATALOGUE_VERSION, SALES_CUSTOMER_RELATIONSHIP, SALES_CUSTOMER_WORLD_SEED, advanceSalesCustomerRelationship, calculateSalesCustomerRelationshipBaseline, calculateSalesCustomerRelationshipChange, createSalesCustomerState, getSalesCustomerCatalogue, getSalesResourceProfile, type SalesCustomerDefinition, type SalesCustomerState } from './salesCustomers';
import { getDeterministicUnitInterval, pickDeterministicWeighted } from './salesRandom';

export type SalesOrderStatus = 'offered' | 'fulfilled' | 'rejected' | 'expired';
export type SalesOrderLine = { resourceType: ResourceType; quantity: number; globalReferenceUnitPrice: number; bidUnitPrice: number; premiumPercent: number; marketVolumeMultiplier: number; reward: number };
export type SalesOrder = { id: string; status: SalesOrderStatus; customerId: string; customerName: string; customerDomain: SalesCustomerDefinition['domain']; customerType: SalesCustomerDefinition['customerType']; lines: SalesOrderLine[]; globalReferenceValue: number; premiumPercent: number; reward: number; offeredAtGameTimeMs: number; expiresAtGameTimeMs: number; fulfilledAtGameTimeMs?: number; rejectedAtGameTimeMs?: number; expiredAtGameTimeMs?: number };
export type SalesOrdersSnapshot = { offered: SalesOrder[]; completed: SalesOrder[]; customerStates: SalesCustomerState[]; nextOrderNumber: number; worldSeed: string; catalogueVersion: number };
export type SalesOrderGenerationInput = { currentGameTimeMs: number; maximumOpenOrders: number; maximumOrderValue: number; companyPrestige: number; economyPhase: EconomyPhase; inventoryByResource: Readonly<Record<ResourceType, number>>; globalPrices: Readonly<Record<ResourceType, number>>; globalSupplies: Readonly<Record<ResourceType, number>>; candidateResourceTypes: readonly ResourceType[]; getResourceWeight: (resourceType: ResourceType) => number; bidResearchMultiplier: number; relationshipDecayHalfLifeMultiplier?: number; relationshipFulfilmentGainMultiplier?: number; relationshipFailureLossMultiplier?: number; pressureOfferChanceMultiplier?: number; bundleMaturityMultiplier?: number; minimumPremiumBonus?: number };
export type SalesOrderAcquisitionDetails = { baseChance: number; prestigeDiscoveryMultiplier: number; pendingMultiplier: number; economyMultiplier: number; chance: number };
export type SalesOrderAcquisitionInput = { openOrderCount: number; maximumOpenOrders: number; companyPrestige: number; economyPhase: EconomyPhase; hasEligibleInventory: boolean };
export type SalesOrderEligibilityInput = Pick<SalesOrderGenerationInput, 'candidateResourceTypes' | 'inventoryByResource' | 'globalPrices' | 'maximumOrderValue'>;
export type SalesOrderSelectionWeightInput = {
  inventoryAmount: number;
  standardOrderLot: number;
  productionWeight: number;
  customerMarketShare: number;
  domainFrequency: number;
  customerTypeFrequency: number;
  relationship: number;
};

const clamp = (value: number, minimum: number, maximum: number): number => Math.max(minimum, Math.min(maximum, value));
function cloneOrder(order: SalesOrder): SalesOrder { return { ...order, lines: order.lines.map((line) => ({ ...line })) }; }
function cloneState(state: SalesCustomerState): SalesCustomerState { return { ...state }; }
function cloneCustomer(customer: SalesCustomerDefinition): SalesCustomerDefinition { return { ...customer, operatingDomains: [...customer.operatingDomains] }; }

export function calculateSalesOrderAcquisitionChance(input: SalesOrderAcquisitionInput): number {
  return calculateSalesOrderAcquisitionDetails(input).chance;
}
export function calculateSalesOrderAcquisitionDetails(input: SalesOrderAcquisitionInput): SalesOrderAcquisitionDetails {
  const discovery = SALES_ORDER_PRESTIGE_DISCOVERY_BASE + Math.max(0, input.companyPrestige) / (Math.max(0, input.companyPrestige) + SALES_ORDER_PRESTIGE_DISCOVERY_SCALE) * (1 - SALES_ORDER_PRESTIGE_DISCOVERY_BASE);
  const pending = input.openOrderCount >= input.maximumOpenOrders
    ? 0
    : Math.max(0.08, 1 - input.openOrderCount * SALES_ORDER_PENDING_PENALTY_PER_OPEN_ORDER);
  const economyMultiplier = SALES_ECONOMY_MULTIPLIERS[input.economyPhase].acquisition;
  return { baseChance: SALES_ORDER_BASE_ACQUISITION_CHANCE_PER_MINUTE, prestigeDiscoveryMultiplier: discovery, pendingMultiplier: pending, economyMultiplier, chance: input.hasEligibleInventory ? clamp(SALES_ORDER_BASE_ACQUISITION_CHANCE_PER_MINUTE * discovery * pending * economyMultiplier, 0, 0.95) : 0 };
}
export function getEligibleSalesOrderResourceTypes(input: SalesOrderEligibilityInput): ResourceType[] {
  const maximumOrderValue = Math.max(SALES_ORDER_MINIMUM_COMPANY_VALUE_CAP, input.maximumOrderValue);
  return input.candidateResourceTypes.filter((resourceType) => {
    const standardOrderLot = getSalesResourceProfile(resourceType).standardOrderLot;
    const globalPrice = input.globalPrices[resourceType];
    return input.inventoryByResource[resourceType] >= standardOrderLot
      && Number.isFinite(globalPrice)
      && globalPrice > 0
      && standardOrderLot * globalPrice <= maximumOrderValue;
  });
}
export function calculateSalesOrderStockCoverageWeight(inventoryAmount: number, standardOrderLot: number): number {
  if (!Number.isFinite(inventoryAmount) || !Number.isFinite(standardOrderLot) || standardOrderLot <= 0) return 0;
  const lotCoverage = Math.max(0, inventoryAmount) / standardOrderLot;
  return Math.sqrt(Math.min(SALES_ORDER_SELECTION_STOCK_COVERAGE_CAP, lotCoverage));
}
export function calculateSalesOrderSelectionWeight(input: SalesOrderSelectionWeightInput): number {
  const stockCoverageWeight = calculateSalesOrderStockCoverageWeight(input.inventoryAmount, input.standardOrderLot);
  const relationshipMultiplier = 1 + clamp(input.relationship, 0, 1)
    * (SALES_ORDER_SELECTION_MAX_RELATIONSHIP_MULTIPLIER - 1);
  return Math.max(0, input.productionWeight)
    * stockCoverageWeight
    * Math.max(0, input.customerMarketShare)
    * Math.max(0, input.domainFrequency)
    * Math.max(0, input.customerTypeFrequency)
    * relationshipMultiplier;
}
export function calculateSalesOrderTargetValue(input: { baseTargetValue: number; companyPrestige: number; relationship: number }): number {
  const prestige = Math.max(0, input.companyPrestige); const prestigeProgress = prestige / (prestige + SALES_ORDER_VOLUME_SCALING.prestigeScale);
  const prestigeMultiplier = 1 + (SALES_ORDER_VOLUME_SCALING.maximumPrestigeMultiplier - 1) * prestigeProgress;
  const relationshipMultiplier = 1 + clamp(input.relationship, 0, 1) * (SALES_ORDER_VOLUME_SCALING.maximumRelationshipMultiplier - 1);
  return Math.max(0, input.baseTargetValue) * prestigeMultiplier * relationshipMultiplier;
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
export function calculateSalesOrderEstimatedWaitMinutes(chance: number): number { return chance > 0 ? 1 / chance : 0; }
export function calculateSalesOrderMarketComparison(order: Pick<SalesOrder, 'lines' | 'reward'>, getLocalUnitPrice: (resourceType: ResourceType) => number): { normalSaleValue: number; gain: number; gainPercent: number } { const normalSaleValue = order.lines.reduce((sum, line) => sum + line.quantity * getLocalUnitPrice(line.resourceType), 0); const gain = order.reward - normalSaleValue; return { normalSaleValue, gain, gainPercent: normalSaleValue > 0 ? gain / normalSaleValue * 100 : 0 }; }

function createOrderLine(input: { resourceType: ResourceType; targetValue: number; globalReferenceUnitPrice: number; globalSupply: number; customer: SalesCustomerDefinition; relationship: number; companyPrestige: number; economyPhase: EconomyPhase; bidResearchMultiplier: number; pressureOfferChanceMultiplier: number; minimumPremiumBonus: number; seed: string; maximumReward?: number }): SalesOrderLine | null {
  const typeProfile = SALES_CUSTOMER_TYPE_PROFILES[input.customer.customerType];
  const positiveTail = Math.min(0.8, -Math.log(Math.max(0.0001, 1 - getDeterministicUnitInterval(`${input.seed}:positive-tail`))) * 0.08);
  const pressureOfferChance = clamp(SALES_ORDER_PRESSURE_OFFER_CHANCE * Math.max(0, input.pressureOfferChanceMultiplier), 0, 1);
  const pressurePenalty = getDeterministicUnitInterval(`${input.seed}:pressure-offer`) < pressureOfferChance ? -(0.05 + Math.min(0.2, -Math.log(Math.max(0.0001, 1 - getDeterministicUnitInterval(`${input.seed}:pressure-size`))) * 0.04)) : 0;
  const relationshipBonus = clamp(input.relationship, 0, 1) * 0.12;
  const prestigeBonus = normalizeWithControlPoints01(Math.max(0, input.companyPrestige), SALES_ORDER_BUNDLE_PRESTIGE_CONTROL_POINTS) * 0.08;
  const purchasingPowerBonus = (input.customer.purchasingPower - 1) * 0.12 + (input.customer.bidMultiplier - 1) * 0.2;
  const minimumPremium = Math.min(SALES_ORDER_MAXIMUM_GLOBAL_PREMIUM, SALES_ORDER_MINIMUM_GLOBAL_PREMIUM + Math.max(0, input.minimumPremiumBonus));
  const premium = clamp((typeProfile.globalPremiumBaseline + positiveTail + relationshipBonus + prestigeBonus + purchasingPowerBonus) * SALES_ECONOMY_MULTIPLIERS[input.economyPhase].bid + pressurePenalty, minimumPremium, SALES_ORDER_MAXIMUM_GLOBAL_PREMIUM);
  const bidUnitPrice = Math.max(0.01, input.globalReferenceUnitPrice * (1 + premium) * Math.max(0, input.bidResearchMultiplier));
  const lot = getSalesResourceProfile(input.resourceType).standardOrderLot;
  const marketVolumeMultiplier = calculateSalesOrderMarketVolumeMultiplier({ resourceType: input.resourceType, globalSupply: input.globalSupply });
  const requestedQuantity = clamp(Math.ceil(input.targetValue * marketVolumeMultiplier / bidUnitPrice / lot) * lot, Math.max(lot, SALES_ORDER_MINIMUM_QUANTITY), SALES_ORDER_MAXIMUM_QUANTITY);
  const maximumQuantity = input.maximumReward === undefined ? SALES_ORDER_MAXIMUM_QUANTITY : Math.floor(input.maximumReward / bidUnitPrice / lot) * lot;
  const quantity = Math.min(requestedQuantity, maximumQuantity);
  if (quantity < lot) return null;
  return { resourceType: input.resourceType, quantity, globalReferenceUnitPrice: input.globalReferenceUnitPrice, bidUnitPrice, premiumPercent: bidUnitPrice / input.globalReferenceUnitPrice * 100 - 100, marketVolumeMultiplier, reward: quantity * bidUnitPrice };
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
    const state = this.getCustomerState(customer.id, currentGameTimeMs, companyPrestige); const line = createOrderLine({ resourceType, targetValue: quantity * globalReferenceUnitPrice, globalReferenceUnitPrice, globalSupply: getResource(resourceType).market.globalBenchmarkSupply, customer, relationship: state.relationship, companyPrestige, economyPhase: 'stable', bidResearchMultiplier: 1, pressureOfferChanceMultiplier: 1, minimumPremiumBonus: 0, seed: `development:${this.nextOrderNumber}` });
    if (!line) return null;
    const order = this.createOrder(customer, [line], currentGameTimeMs); this.nextOrderNumber += 1; this.offered.push(order); return cloneOrder(order);
  }
  advanceTime(input: SalesOrderGenerationInput): { ordersCreated: number; ordersExpired: SalesOrder[]; acquisitionChance: number } {
    const relationshipDecayHalfLifeMultiplier = input.relationshipDecayHalfLifeMultiplier ?? 1;
    const relationshipFulfilmentGainMultiplier = input.relationshipFulfilmentGainMultiplier ?? 1;
    const relationshipFailureLossMultiplier = input.relationshipFailureLossMultiplier ?? 1;
    const pressureOfferChanceMultiplier = input.pressureOfferChanceMultiplier ?? 1;
    const bundleMaturityMultiplier = input.bundleMaturityMultiplier ?? 1;
    const minimumPremiumBonus = input.minimumPremiumBonus ?? 0;
    this.advanceRelationships(input.currentGameTimeMs, input.companyPrestige, relationshipDecayHalfLifeMultiplier); const ordersExpired = this.expireOrders(input.currentGameTimeMs, input.companyPrestige, relationshipDecayHalfLifeMultiplier, relationshipFulfilmentGainMultiplier, relationshipFailureLossMultiplier);
    const maximumOrderValue = Math.max(SALES_ORDER_MINIMUM_COMPANY_VALUE_CAP, input.maximumOrderValue);
    const eligibleResources = getEligibleSalesOrderResourceTypes({ ...input, maximumOrderValue });
    const acquisitionChance = calculateSalesOrderAcquisitionChance({ openOrderCount: this.offered.length, maximumOpenOrders: input.maximumOpenOrders, companyPrestige: input.companyPrestige, economyPhase: input.economyPhase, hasEligibleInventory: eligibleResources.length > 0 });
    if (this.offered.length >= input.maximumOpenOrders || eligibleResources.length === 0 || getDeterministicUnitInterval(`acquire:${this.worldSeed}:${this.nextOrderNumber}:${input.currentGameTimeMs}`) >= acquisitionChance) return { ordersCreated: 0, ordersExpired, acquisitionChance };
    const customerCatalogue = this.getCustomerCatalogueInternal();
    const customerResourcePair = pickDeterministicWeighted(eligibleResources.flatMap((resourceType) => {
      const resourceProfile = getSalesResourceProfile(resourceType);
      return customerCatalogue
        .filter((customer) => customer.domain === resourceProfile.domain)
        .map((customer) => {
          const state = this.getCustomerState(customer.id, input.currentGameTimeMs, input.companyPrestige, relationshipDecayHalfLifeMultiplier);
          return {
            value: { customer, resourceType, state },
            weight: calculateSalesOrderSelectionWeight({
              inventoryAmount: input.inventoryByResource[resourceType],
              standardOrderLot: resourceProfile.standardOrderLot,
              productionWeight: input.getResourceWeight(resourceType),
              customerMarketShare: customer.marketShare,
              domainFrequency: SALES_CUSTOMER_DOMAIN_PROFILES[customer.domain].frequency,
              customerTypeFrequency: SALES_CUSTOMER_TYPE_PROFILES[customer.customerType].frequencyMultiplier,
              relationship: state.relationship,
            }),
          };
        });
    }), `customer-resource:${this.nextOrderNumber}`);
    if (!customerResourcePair) return { ordersCreated: 0, ordersExpired, acquisitionChance };
    const { customer, resourceType: primaryResource, state } = customerResourcePair;
    const compatibleResources = eligibleResources.filter((resourceType) => customer.operatingDomains.includes(getSalesResourceProfile(resourceType).domain));
    const lineCount = calculateSalesOrderBundleLineCount({ candidateCount: compatibleResources.length, companyPrestige: input.companyPrestige, relationship: state.relationship, marketShare: customer.marketShare, bundleAppetite: SALES_CUSTOMER_TYPE_PROFILES[customer.customerType].bundleAppetite, bundleMaturityMultiplier, seed: `bundle:${this.nextOrderNumber}` });
    const selectedResources: ResourceType[] = [primaryResource]; const remaining = compatibleResources.filter((resourceType) => resourceType !== primaryResource);
    while (selectedResources.length < lineCount && remaining.length > 0) {
      const next = pickDeterministicWeighted(remaining.map((value) => ({
        value,
        weight: Math.max(0.01, input.getResourceWeight(value))
          * calculateSalesOrderStockCoverageWeight(
            input.inventoryByResource[value],
            getSalesResourceProfile(value).standardOrderLot,
          ),
      })), `bundle:${this.nextOrderNumber}:${selectedResources.length}`);
      if (!next) break;
      selectedResources.push(next);
      remaining.splice(remaining.indexOf(next), 1);
    }
    const domain = SALES_CUSTOMER_DOMAIN_PROFILES[customer.domain]; const type = SALES_CUSTOMER_TYPE_PROFILES[customer.customerType]; const baseTargetValue = (domain.targetOrderValue[0] + (domain.targetOrderValue[1] - domain.targetOrderValue[0]) * getDeterministicUnitInterval(`value:${this.nextOrderNumber}`)) * (type.targetValueMultiplier[0] + (type.targetValueMultiplier[1] - type.targetValueMultiplier[0]) * getDeterministicUnitInterval(`type-value:${this.nextOrderNumber}`));
    const targetValue = Math.min(maximumOrderValue, calculateSalesOrderTargetValue({ baseTargetValue, companyPrestige: input.companyPrestige, relationship: state.relationship })); const lines: SalesOrderLine[] = []; let remainingOrderValue = maximumOrderValue;
    for (const resourceType of selectedResources) {
      const line = createOrderLine({ resourceType, targetValue: targetValue / selectedResources.length, globalReferenceUnitPrice: input.globalPrices[resourceType], globalSupply: input.globalSupplies[resourceType], customer, relationship: state.relationship, companyPrestige: input.companyPrestige, economyPhase: input.economyPhase, bidResearchMultiplier: input.bidResearchMultiplier, pressureOfferChanceMultiplier, minimumPremiumBonus, seed: `line:${this.nextOrderNumber}:${resourceType}`, maximumReward: remainingOrderValue });
      if (!line) continue;
      lines.push(line); remainingOrderValue -= line.reward;
    }
    if (lines.length === 0) return { ordersCreated: 0, ordersExpired, acquisitionChance };
    const order = this.createOrder(customer, lines, input.currentGameTimeMs); this.nextOrderNumber += 1; this.offered.push(order); return { ordersCreated: 1, ordersExpired, acquisitionChance };
  }
  fulfill(id: string, fulfilledAtGameTimeMs: number, companyPrestige: number, relationshipDecayHalfLifeMultiplier = 1, relationshipFulfilmentGainMultiplier = 1, relationshipFailureLossMultiplier = 1): SalesOrder | null { const index = this.offered.findIndex((order) => order.id === id); if (index < 0) return null; const [order] = this.offered.splice(index, 1); const fulfilled = { ...order, status: 'fulfilled' as const, fulfilledAtGameTimeMs }; this.completed.unshift(fulfilled); this.applyRelationshipForOrder(fulfilled, companyPrestige, fulfilledAtGameTimeMs, 'fulfilled', relationshipDecayHalfLifeMultiplier, relationshipFulfilmentGainMultiplier, relationshipFailureLossMultiplier); return cloneOrder(fulfilled); }
  reject(id: string, rejectedAtGameTimeMs: number, companyPrestige: number, relationshipDecayHalfLifeMultiplier = 1, relationshipFulfilmentGainMultiplier = 1, relationshipFailureLossMultiplier = 1): SalesOrder | null { const index = this.offered.findIndex((order) => order.id === id); if (index < 0) return null; const [order] = this.offered.splice(index, 1); const rejected = { ...order, status: 'rejected' as const, rejectedAtGameTimeMs }; this.completed.unshift(rejected); this.applyRelationshipForOrder(rejected, companyPrestige, rejectedAtGameTimeMs, 'rejected', relationshipDecayHalfLifeMultiplier, relationshipFulfilmentGainMultiplier, relationshipFailureLossMultiplier); return cloneOrder(rejected); }
  clone(): SalesOrders { return SalesOrders.fromSnapshot(this.toSnapshot()); }
  toSnapshot(): SalesOrdersSnapshot { return { offered: this.getOfferedOrders(), completed: this.getCompletedOrders(), customerStates: this.getCustomerStates(), nextOrderNumber: this.nextOrderNumber, worldSeed: this.worldSeed, catalogueVersion: this.catalogueVersion }; }
  static fromSnapshot(snapshot: SalesOrdersSnapshot): SalesOrders { return new SalesOrders(snapshot); }
  private createOrder(customer: SalesCustomerDefinition, lines: SalesOrderLine[], currentGameTimeMs: number): SalesOrder { const reward = lines.reduce((sum, line) => sum + line.reward, 0); const globalReferenceValue = lines.reduce((sum, line) => sum + line.quantity * line.globalReferenceUnitPrice, 0); return { id: `sales-order-${this.nextOrderNumber}`, status: 'offered', customerId: customer.id, customerName: customer.name, customerDomain: customer.domain, customerType: customer.customerType, lines, globalReferenceValue, premiumPercent: globalReferenceValue > 0 ? reward / globalReferenceValue * 100 - 100 : 0, reward, offeredAtGameTimeMs: currentGameTimeMs, expiresAtGameTimeMs: currentGameTimeMs + SALES_ORDER_DURATION_MS }; }
  private advanceRelationships(currentGameTimeMs: number, companyPrestige: number, relationshipDecayHalfLifeMultiplier: number): void { this.getCustomerCatalogueInternal(); const catalogue = this.customerCatalogueById!; this.customerStates = this.customerStates.map((state) => { const customer = catalogue.get(state.customerId); return customer ? advanceSalesCustomerRelationship(state, customer, companyPrestige, currentGameTimeMs, relationshipDecayHalfLifeMultiplier) : state; }); }
  private expireOrders(currentGameTimeMs: number, companyPrestige: number, relationshipDecayHalfLifeMultiplier: number, relationshipFulfilmentGainMultiplier: number, relationshipFailureLossMultiplier: number): SalesOrder[] { const expired: SalesOrder[] = []; const remaining: SalesOrder[] = []; for (const order of this.offered) { if (order.expiresAtGameTimeMs > currentGameTimeMs) { remaining.push(order); continue; } const expiredOrder = { ...order, status: 'expired' as const, expiredAtGameTimeMs: currentGameTimeMs }; this.completed.unshift(expiredOrder); expired.push(cloneOrder(expiredOrder)); this.applyRelationshipForOrder(expiredOrder, companyPrestige, currentGameTimeMs, 'expired', relationshipDecayHalfLifeMultiplier, relationshipFulfilmentGainMultiplier, relationshipFailureLossMultiplier); } this.offered = remaining; return expired; }
  private applyRelationshipForOrder(order: SalesOrder, companyPrestige: number, currentGameTimeMs: number, outcome: 'fulfilled' | 'rejected' | 'expired', relationshipDecayHalfLifeMultiplier: number, relationshipFulfilmentGainMultiplier: number, relationshipFailureLossMultiplier: number): void { const customer = this.getCustomerById(order.customerId); if (!customer) return; const current = this.getCustomerState(order.customerId, currentGameTimeMs, companyPrestige, relationshipDecayHalfLifeMultiplier); const adjustment = calculateSalesCustomerRelationshipChange({ outcome, customer, relationship: current.relationship, orderReferenceValue: order.globalReferenceValue, fulfilmentGainMultiplier: relationshipFulfilmentGainMultiplier, failureLossMultiplier: relationshipFailureLossMultiplier }); const next = { ...current, relationship: clamp(current.relationship + adjustment, 0, SALES_CUSTOMER_RELATIONSHIP.maximum), fulfilledOrderCount: current.fulfilledOrderCount + (outcome === 'fulfilled' ? 1 : 0), expiredOrderCount: current.expiredOrderCount + (outcome === 'expired' ? 1 : 0) }; const index = this.customerStates.findIndex((state) => state.customerId === order.customerId); if (index < 0) this.customerStates.push(next); else this.customerStates[index] = next; }
  private getCustomerCatalogueInternal(): SalesCustomerDefinition[] { if (!this.customerCatalogue) { this.customerCatalogue = getSalesCustomerCatalogue(this.worldSeed, this.catalogueVersion); this.customerCatalogueById = new Map(this.customerCatalogue.map((customer) => [customer.id, customer])); } return this.customerCatalogue; }
  private getCustomerById(customerId: string): SalesCustomerDefinition | undefined { this.getCustomerCatalogueInternal(); return this.customerCatalogueById!.get(customerId); }
  private restore(snapshot: SalesOrdersSnapshot): void { this.offered = Array.isArray(snapshot.offered) ? snapshot.offered.filter((order) => order.status === 'offered' && Array.isArray(order.lines)).map(cloneOrder) : []; this.completed = Array.isArray(snapshot.completed) ? snapshot.completed.filter((order) => order.status !== 'offered' && Array.isArray(order.lines)).map(cloneOrder) : []; this.customerStates = Array.isArray(snapshot.customerStates) ? snapshot.customerStates.map(cloneState) : []; this.nextOrderNumber = Number.isInteger(snapshot.nextOrderNumber) && snapshot.nextOrderNumber > 0 ? snapshot.nextOrderNumber : 1; this.worldSeed = typeof snapshot.worldSeed === 'string' && snapshot.worldSeed.length > 0 ? snapshot.worldSeed : SALES_CUSTOMER_WORLD_SEED; this.catalogueVersion = SALES_CUSTOMER_CATALOGUE_VERSION; this.customerCatalogue = null; this.customerCatalogueById = null; }
}
