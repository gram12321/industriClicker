import type { ResourceType } from '@/game/resources';
import { calculateAsymmetricalScaler01 } from '@/game/core/math/scaling';
import { SALES_CUSTOMER_BID_MULTIPLIER_RANGE, SALES_CUSTOMER_DOMAIN_PROFILES, SALES_CUSTOMER_GENERATION, SALES_CUSTOMER_PURCHASING_POWER_RANGE, SALES_CUSTOMER_TYPE_PROFILES, SALES_RESOURCE_PROFILES } from './salesConstants';
import { getDeterministicUnitInterval, pickDeterministicWeighted } from './salesRandom';
import {
  SALES_CUSTOMER_DOMAINS,
  SALES_CUSTOMER_TYPES,
  type SalesCustomerDefinition,
  type SalesCustomerDomain,
  type SalesCustomerRelationshipDetails,
  type SalesCustomerState,
  type SalesCustomerType,
  type SalesResourceProfile,
} from './salesTypes';

export const SALES_CUSTOMER_CATALOGUE_VERSION = 2;
export const SALES_CUSTOMER_WORLD_SEED = 'industri-clicker-local-world-v1';
/** Relationship is stored as a normalized 0–1 value; UI displays it as 0–100. */
export { SALES_CUSTOMER_DOMAINS, SALES_CUSTOMER_TYPES } from './salesTypes';
export type {
  SalesCustomerDefinition,
  SalesCustomerDomain,
  SalesCustomerRelationshipDetails,
  SalesCustomerState,
  SalesCustomerType,
  SalesResourceProfile,
} from './salesTypes';

export const SALES_CUSTOMER_RELATIONSHIP = { maximum: 1, foregroundDecayHalfLifeHours: 8, relationshipValueScale: 350, maximumFulfilmentGain: 0.1, minimumFailureLoss: 0.0001, maximumRejectionLoss: 0.1, maximumExpiryLoss: 0.2 } as const;
export const SALES_CUSTOMER_RELATIONSHIP_LEVELS = [
  { minimum: 0, label: 'Cold lead' },
  { minimum: 0.1, label: 'New face' },
  { minimum: 0.2, label: 'Familiar name' },
  { minimum: 0.3, label: 'Known quantity' },
  { minimum: 0.4, label: 'Regular contact' },
  { minimum: 0.5, label: 'Safe pair of hands' },
  { minimum: 0.6, label: 'Go-to supplier' },
  { minimum: 0.7, label: 'Trusted name' },
  { minimum: 0.8, label: 'First-call supplier' },
  { minimum: 0.9, label: 'Strategic partner' },
] as const;
const CUSTOMER_NAME_PREFIXES: Readonly<Record<SalesCustomerType, readonly string[]>> = {
  'private-customer': ['Aster', 'Boreal', 'Civic', 'Ember', 'Harbor', 'Lumen', 'Meadow', 'Pine', 'Quarry', 'River', 'Summit', 'Willow'],
  'retail-chain': ['Beacon', 'Cedar', 'Crown', 'Daystar', 'Evergreen', 'Marketline', 'Oak', 'Plaza', 'Redwood', 'Saffron', 'Townsend', 'Union'],
  'construction-contractor': ['Anchor', 'Atlas', 'Bridgeway', 'Civic', 'Forge', 'Granite', 'Keystone', 'Mason', 'Pillar', 'Rivet', 'Stonegate', 'Terrace'],
  'industrial-enterprise': ['Apex', 'Borealis', 'Catalyst', 'Dynamo', 'Foundry', 'Helix', 'Ironclad', 'Meridian', 'Pioneer', 'Vertex', 'Vector', 'Zenith'],
  'utility-operator': ['Current', 'Delta', 'Gridline', 'Hydra', 'Northstar', 'Powerline', 'Reservoir', 'Spark', 'Turbine', 'Volt', 'Watermark', 'Watt'],
  'government-procurement': ['Civic', 'Commonwealth', 'Federal', 'General', 'National', 'Public', 'Republic', 'Statewide', 'Union', 'United', 'Crown', 'Municipal'],
};
const CUSTOMER_NAME_SUFFIXES: Readonly<Record<SalesCustomerDomain, readonly string[]>> = {
  food: ['Provisions', 'Foods', 'Kitchen Supply', 'Grocers', 'Pantry Group', 'Fresh Market'], 'raw-materials': ['Materials', 'Extractives', 'Resource Group', 'Ore Supply', 'Quarry Goods', 'Raw Resources'], 'industrial-inputs': ['Industrial Supply', 'Works', 'Process Goods', 'Input Systems', 'Manufacturing Supply', 'Process Partners'], 'construction-materials': ['Build Supply', 'Construction Group', 'Infrastructure', 'Project Materials', 'Civil Works', 'Site Supply'], electronics: ['Electronics', 'Systems', 'Components', 'Circuit Works', 'Device Supply', 'Technology Group'], utilities: ['Utility Network', 'Energy Supply', 'Waterworks', 'Power Services', 'Grid Services', 'Resource Utility'],
};

function calculateSkewedMarketShareMultiplier(score: number): number { if (score < 0.4) return score * score * 1.5; if (score < 0.7) return 0.24 + Math.log(1 + (score - 0.4) * 3.33) * 0.3; if (score < 0.9) return 0.56 + (score - 0.7) * 1.5; if (score < 0.95) return 0.86 + (score - 0.9) * 2; if (score < 0.99) return 0.96 + (score - 0.95) * 0.8; return 0.99 + (1 - Math.exp(-(score - 0.99) * 10)) * 0.01; }
function getMarketShareDrawCount(value: number): number { if (value >= 0.9) return 5; if (value >= 0.7) return 4; if (value >= 0.5) return 3; if (value >= 0.1) return 2; return 1; }
function getOperatingDomains(domain: SalesCustomerDomain, customerType: SalesCustomerType, seed: string): SalesCustomerDomain[] { const profile = SALES_CUSTOMER_TYPE_PROFILES[customerType]; const operatingDomains: SalesCustomerDomain[] = [domain]; for (const candidate of profile.allowedOperatingDomains) { if (candidate !== domain && getDeterministicUnitInterval(`${seed}:operating-domain:${candidate}`) < profile.crossDomainChance) operatingDomains.push(candidate); } return operatingDomains; }

/** Deterministic local stand-in for the future server-owned customer catalogue. */
export function getSalesCustomerCatalogue(worldSeed = SALES_CUSTOMER_WORLD_SEED, catalogueVersion = SALES_CUSTOMER_CATALOGUE_VERSION): SalesCustomerDefinition[] {
  return SALES_CUSTOMER_DOMAINS.flatMap((domain) => {
    const customers: SalesCustomerDefinition[] = []; let remainingShare = 1; let customerIndex = 0;
    while (remainingShare > 0 && customerIndex < SALES_CUSTOMER_GENERATION.maximumCustomersPerDomain) {
      const seed = `${worldSeed}:${catalogueVersion}:${domain}:${customerIndex}`;
      const customerType = pickDeterministicWeighted(SALES_CUSTOMER_TYPES.map((value) => ({ value, weight: SALES_CUSTOMER_DOMAIN_PROFILES[domain].customerTypeWeights[value] })), `${seed}:customer-type`) ?? 'private-customer';
      const firstDraw = calculateSkewedMarketShareMultiplier(getDeterministicUnitInterval(`${seed}:share:0`)); let smallestDraw = firstDraw;
      for (let draw = 1; draw < getMarketShareDrawCount(firstDraw); draw += 1) smallestDraw = Math.min(smallestDraw, calculateSkewedMarketShareMultiplier(getDeterministicUnitInterval(`${seed}:share:${draw}`)));
      const isLastAllowedCustomer = customerIndex === SALES_CUSTOMER_GENERATION.maximumCustomersPerDomain - 1;
      const marketShare = isLastAllowedCustomer ? remainingShare : Math.min(remainingShare, Math.max(SALES_CUSTOMER_GENERATION.minimumMarketShare, smallestDraw * SALES_CUSTOMER_DOMAIN_PROFILES[domain].marketShareMultiplier * SALES_CUSTOMER_TYPE_PROFILES[customerType].marketShareScale));
      const prefixes = CUSTOMER_NAME_PREFIXES[customerType]; const prefix = prefixes[Math.floor(getDeterministicUnitInterval(`${seed}:prefix`) * prefixes.length)]; const suffixes = CUSTOMER_NAME_SUFFIXES[domain];
      const [minimumPurchasingPower, maximumPurchasingPower] = SALES_CUSTOMER_PURCHASING_POWER_RANGE;
      const purchasingPower = Math.round((minimumPurchasingPower + (1 - calculateAsymmetricalScaler01(1 - getDeterministicUnitInterval(`${seed}:power`))) * (maximumPurchasingPower - minimumPurchasingPower)) * 1_000) / 1_000;
      const bidRange = SALES_CUSTOMER_DOMAIN_PROFILES[domain].bidRange; const baseBid = bidRange[0] + getDeterministicUnitInterval(`${seed}:bid`) * (bidRange[1] - bidRange[0]);
      const bidTail = 0.65 + calculateAsymmetricalScaler01(getDeterministicUnitInterval(`${seed}:bid-tail`)) * 0.9;
      const bidMultiplier = Math.round(Math.max(SALES_CUSTOMER_BID_MULTIPLIER_RANGE[0], Math.min(SALES_CUSTOMER_BID_MULTIPLIER_RANGE[1], baseBid * bidTail)) * 1_000) / 1_000;
      const baseName = `${prefix} ${suffixes[Math.floor(getDeterministicUnitInterval(`${seed}:suffix`) * suffixes.length)]}`; const name = customers.some((customer) => customer.name === baseName) ? `${baseName} ${customerIndex + 1}` : baseName;
      customers.push({ id: `customer:${catalogueVersion}:${domain}:${customerIndex + 1}`, name, domain, customerType, operatingDomains: getOperatingDomains(domain, customerType, seed), marketShare, purchasingPower, bidMultiplier });
      remainingShare = Math.max(0, remainingShare - marketShare); customerIndex += 1;
    }
    return customers;
  });
}
export function getSalesResourceProfile(resourceType: ResourceType): SalesResourceProfile { return SALES_RESOURCE_PROFILES[resourceType]; }
export function getSalesCustomerRelationshipLabel(relationship: number): string {
  const safeRelationship = Math.max(0, Math.min(SALES_CUSTOMER_RELATIONSHIP.maximum, relationship));
  return [...SALES_CUSTOMER_RELATIONSHIP_LEVELS].reverse().find((level) => safeRelationship >= level.minimum)?.label ?? SALES_CUSTOMER_RELATIONSHIP_LEVELS[0].label;
}
export function calculateSalesCustomerRelationshipDetails(customer: SalesCustomerDefinition, companyPrestige: number): SalesCustomerRelationshipDetails {
  const prestigeRecognition = Math.max(0, companyPrestige) / (Math.max(0, companyPrestige) + 100);
  const prestigeBonus = prestigeRecognition * 0.25;
  const marketSharePenalty = prestigeBonus * customer.marketShare * 0.5;
  const baseline = Math.min(SALES_CUSTOMER_RELATIONSHIP.maximum, Math.max(0, prestigeBonus - marketSharePenalty));
  return { prestigeRecognition, prestigeBonus, marketSharePenalty, baseline, decayHalfLifeHours: SALES_CUSTOMER_RELATIONSHIP.foregroundDecayHalfLifeHours, relationshipValueScale: SALES_CUSTOMER_RELATIONSHIP.relationshipValueScale, maximumFulfilmentGain: SALES_CUSTOMER_RELATIONSHIP.maximumFulfilmentGain, minimumFailureLoss: SALES_CUSTOMER_RELATIONSHIP.minimumFailureLoss, maximumRejectionLoss: SALES_CUSTOMER_RELATIONSHIP.maximumRejectionLoss, maximumExpiryLoss: SALES_CUSTOMER_RELATIONSHIP.maximumExpiryLoss };
}
export function calculateSalesCustomerRelationshipBaseline(customer: SalesCustomerDefinition, companyPrestige: number): number { return calculateSalesCustomerRelationshipDetails(customer, companyPrestige).baseline; }
export function calculateSalesCustomerRelationshipChange(input: { outcome: 'fulfilled' | 'rejected' | 'expired'; customer: SalesCustomerDefinition; relationship: number; orderReferenceValue: number; fulfilmentGainMultiplier?: number; failureLossMultiplier?: number }): number {
  const fulfilmentGainMultiplier = Math.max(0, input.fulfilmentGainMultiplier ?? 1);
  const failureLossMultiplier = Math.max(0, input.failureLossMultiplier ?? 1);
  const relationshipProgress = calculateAsymmetricalScaler01(Math.max(0, Math.min(1, input.relationship / SALES_CUSTOMER_RELATIONSHIP.maximum)));
  if (input.outcome === 'fulfilled') {
    const valueProgress = Math.max(0, input.orderReferenceValue) / (Math.max(0, input.orderReferenceValue) + SALES_CUSTOMER_RELATIONSHIP.relationshipValueScale);
    return SALES_CUSTOMER_RELATIONSHIP.maximumFulfilmentGain * valueProgress * (1 - relationshipProgress) * SALES_CUSTOMER_DOMAIN_PROFILES[input.customer.domain].relationshipGainMultiplier * fulfilmentGainMultiplier;
  }
  const valueProgress = Math.max(0, input.orderReferenceValue) / (Math.max(0, input.orderReferenceValue) + SALES_CUSTOMER_RELATIONSHIP.relationshipValueScale);
  const maximumLoss = input.outcome === 'expired' ? SALES_CUSTOMER_RELATIONSHIP.maximumExpiryLoss : SALES_CUSTOMER_RELATIONSHIP.maximumRejectionLoss;
  return -(SALES_CUSTOMER_RELATIONSHIP.minimumFailureLoss + (maximumLoss - SALES_CUSTOMER_RELATIONSHIP.minimumFailureLoss) * relationshipProgress * valueProgress) * failureLossMultiplier;
}
export function createSalesCustomerState(customerId: string, relationship: number, gameTimeMs: number): SalesCustomerState { return { customerId, relationship: Math.max(0, Math.min(SALES_CUSTOMER_RELATIONSHIP.maximum, relationship)), lastRelationshipUpdatedAtGameTimeMs: Math.max(0, gameTimeMs), fulfilledOrderCount: 0, expiredOrderCount: 0 }; }
export function advanceSalesCustomerRelationship(state: SalesCustomerState, customer: SalesCustomerDefinition, companyPrestige: number, currentGameTimeMs: number, decayHalfLifeMultiplier = 1): SalesCustomerState { const elapsedHours = Math.max(0, currentGameTimeMs - state.lastRelationshipUpdatedAtGameTimeMs) / 3_600_000; const baseline = calculateSalesCustomerRelationshipBaseline(customer, companyPrestige); const halfLife = SALES_CUSTOMER_RELATIONSHIP.foregroundDecayHalfLifeHours * Math.max(0.1, decayHalfLifeMultiplier); const retention = Math.pow(0.5, elapsedHours / halfLife); return { ...state, relationship: baseline + (state.relationship - baseline) * retention, lastRelationshipUpdatedAtGameTimeMs: Math.max(state.lastRelationshipUpdatedAtGameTimeMs, currentGameTimeMs) }; }
