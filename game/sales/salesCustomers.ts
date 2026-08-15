import type { ResourceType } from '@/game/resources';
import { calculateAsymmetricalScaler01 } from '@/game/core/math/scaling';
import { SALES_CUSTOMER_DOMAIN_PROFILES, SALES_CUSTOMER_GENERATION, SALES_CUSTOMER_TYPE_PROFILES, SALES_RESOURCE_PROFILES } from './salesConstants';

export const SALES_CUSTOMER_CATALOGUE_VERSION = 2;
export const SALES_CUSTOMER_WORLD_SEED = 'industri-clicker-local-world-v1';
export const SALES_CUSTOMER_DOMAINS = ['food', 'raw-materials', 'industrial-inputs', 'construction-materials', 'electronics', 'utilities'] as const;
export type SalesCustomerDomain = typeof SALES_CUSTOMER_DOMAINS[number];
export const SALES_CUSTOMER_TYPES = ['private-customer', 'retail-chain', 'construction-contractor', 'industrial-enterprise', 'utility-operator', 'government-procurement'] as const;
export type SalesCustomerType = typeof SALES_CUSTOMER_TYPES[number];

export type SalesCustomerDefinition = { id: string; name: string; domain: SalesCustomerDomain; customerType: SalesCustomerType; operatingDomains: SalesCustomerDomain[]; marketShare: number; purchasingPower: number; bidMultiplier: number };
export type SalesResourceProfile = { domain: SalesCustomerDomain; standardOrderLot: number };
export type SalesCustomerState = { customerId: string; relationship: number; lastRelationshipUpdatedAtGameTimeMs: number; fulfilledOrderCount: number; expiredOrderCount: number };
export type SalesCustomerRelationshipDetails = { prestigeRecognition: number; prestigeBonus: number; marketSharePenalty: number; baseline: number; decayHalfLifeHours: number; relationshipValueScale: number; maximumFulfilmentGain: number; minimumFailureLoss: number; maximumRejectionLoss: number; maximumExpiryLoss: number };

export const SALES_CUSTOMER_RELATIONSHIP = { maximum: 100, foregroundDecayHalfLifeHours: 8, relationshipValueScale: 350, maximumFulfilmentGain: 10, minimumFailureLoss: 0.01, maximumRejectionLoss: 10, maximumExpiryLoss: 20 } as const;
const CUSTOMER_NAME_PREFIXES = ['Aster', 'Boreal', 'Civic', 'Dynamo', 'Ember', 'Forge', 'Harbor', 'Northstar', 'Pioneer', 'Vertex'] as const;
const CUSTOMER_NAME_SUFFIXES: Readonly<Record<SalesCustomerDomain, readonly string[]>> = {
  food: ['Provisions', 'Foods', 'Kitchen Supply'], 'raw-materials': ['Materials', 'Extractives', 'Resource Group'], 'industrial-inputs': ['Industrial Supply', 'Works', 'Process Goods'], 'construction-materials': ['Build Supply', 'Construction Group', 'Infrastructure'], electronics: ['Electronics', 'Systems', 'Components'], utilities: ['Utility Network', 'Energy Supply', 'Waterworks'],
};

function hashSeed(value: string): number { let hash = 2_166_136_261; for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16_777_619); } return hash >>> 0; }
function unitInterval(value: string): number { return hashSeed(value) / 4_294_967_296; }
function pickWeighted<T>(entries: readonly { value: T; weight: number }[], seed: string): T | null { const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0); if (total <= 0) return null; let remaining = unitInterval(seed) * total; for (const entry of entries) { remaining -= Math.max(0, entry.weight); if (remaining <= 0) return entry.value; } return entries[entries.length - 1]?.value ?? null; }
function calculateSkewedMarketShareMultiplier(score: number): number { if (score < 0.4) return score * score * 1.5; if (score < 0.7) return 0.24 + Math.log(1 + (score - 0.4) * 3.33) * 0.3; if (score < 0.9) return 0.56 + (score - 0.7) * 1.5; if (score < 0.95) return 0.86 + (score - 0.9) * 2; if (score < 0.99) return 0.96 + (score - 0.95) * 0.8; return 0.99 + (1 - Math.exp(-(score - 0.99) * 10)) * 0.01; }
function getMarketShareDrawCount(value: number): number { if (value >= 0.9) return 5; if (value >= 0.7) return 4; if (value >= 0.5) return 3; if (value >= 0.1) return 2; return 1; }
function getOperatingDomains(domain: SalesCustomerDomain, customerType: SalesCustomerType, seed: string): SalesCustomerDomain[] { const profile = SALES_CUSTOMER_TYPE_PROFILES[customerType]; const operatingDomains: SalesCustomerDomain[] = [domain]; for (const candidate of profile.allowedOperatingDomains) { if (candidate !== domain && unitInterval(`${seed}:operating-domain:${candidate}`) < profile.crossDomainChance) operatingDomains.push(candidate); } return operatingDomains; }

/** Deterministic local stand-in for the future server-owned customer catalogue. */
export function getSalesCustomerCatalogue(worldSeed = SALES_CUSTOMER_WORLD_SEED, catalogueVersion = SALES_CUSTOMER_CATALOGUE_VERSION): SalesCustomerDefinition[] {
  return SALES_CUSTOMER_DOMAINS.flatMap((domain) => {
    const customers: SalesCustomerDefinition[] = []; let remainingShare = 1; let customerIndex = 0;
    while (remainingShare > 0 && customerIndex < SALES_CUSTOMER_GENERATION.maximumCustomersPerDomain) {
      const seed = `${worldSeed}:${catalogueVersion}:${domain}:${customerIndex}`; const firstDraw = calculateSkewedMarketShareMultiplier(unitInterval(`${seed}:share:0`)); let smallestDraw = firstDraw;
      for (let draw = 1; draw < getMarketShareDrawCount(firstDraw); draw += 1) smallestDraw = Math.min(smallestDraw, calculateSkewedMarketShareMultiplier(unitInterval(`${seed}:share:${draw}`)));
      const isLastAllowedCustomer = customerIndex === SALES_CUSTOMER_GENERATION.maximumCustomersPerDomain - 1;
      const marketShare = isLastAllowedCustomer ? remainingShare : Math.min(remainingShare, Math.max(SALES_CUSTOMER_GENERATION.minimumMarketShare, smallestDraw * SALES_CUSTOMER_DOMAIN_PROFILES[domain].marketShareMultiplier));
      const customerType = pickWeighted(SALES_CUSTOMER_TYPES.map((value) => ({ value, weight: SALES_CUSTOMER_DOMAIN_PROFILES[domain].customerTypeWeights[value] })), `${seed}:customer-type`) ?? 'private-customer';
      const prefix = CUSTOMER_NAME_PREFIXES[Math.floor(unitInterval(`${seed}:prefix`) * CUSTOMER_NAME_PREFIXES.length)]; const suffixes = CUSTOMER_NAME_SUFFIXES[domain];
      const purchasingPower = Math.round((0.55 + (1 - calculateAsymmetricalScaler01(1 - unitInterval(`${seed}:power`))) * 1.45) * 1_000) / 1_000;
      const bidRange = SALES_CUSTOMER_DOMAIN_PROFILES[domain].bidRange; const baseBid = bidRange[0] + unitInterval(`${seed}:bid`) * (bidRange[1] - bidRange[0]);
      const bidTail = 0.65 + calculateAsymmetricalScaler01(unitInterval(`${seed}:bid-tail`)) * 0.9;
      const bidMultiplier = Math.round(Math.max(0.55, Math.min(1.8, baseBid * bidTail)) * 1_000) / 1_000;
      customers.push({ id: `customer:${catalogueVersion}:${domain}:${customerIndex + 1}`, name: `${prefix} ${suffixes[Math.floor(unitInterval(`${seed}:suffix`) * suffixes.length)]}`, domain, customerType, operatingDomains: getOperatingDomains(domain, customerType, seed), marketShare, purchasingPower, bidMultiplier });
      remainingShare = Math.max(0, remainingShare - marketShare); customerIndex += 1;
    }
    return customers;
  });
}
export function getSalesResourceProfile(resourceType: ResourceType): SalesResourceProfile { return SALES_RESOURCE_PROFILES[resourceType]; }
export function calculateSalesCustomerRelationshipDetails(customer: SalesCustomerDefinition, companyPrestige: number): SalesCustomerRelationshipDetails {
  const prestigeRecognition = Math.max(0, companyPrestige) / (Math.max(0, companyPrestige) + 100);
  const prestigeBonus = prestigeRecognition * 25;
  const marketSharePenalty = prestigeBonus * customer.marketShare * 0.5;
  const baseline = Math.min(SALES_CUSTOMER_RELATIONSHIP.maximum, Math.max(0, prestigeBonus - marketSharePenalty));
  return { prestigeRecognition, prestigeBonus, marketSharePenalty, baseline, decayHalfLifeHours: SALES_CUSTOMER_RELATIONSHIP.foregroundDecayHalfLifeHours, relationshipValueScale: SALES_CUSTOMER_RELATIONSHIP.relationshipValueScale, maximumFulfilmentGain: SALES_CUSTOMER_RELATIONSHIP.maximumFulfilmentGain, minimumFailureLoss: SALES_CUSTOMER_RELATIONSHIP.minimumFailureLoss, maximumRejectionLoss: SALES_CUSTOMER_RELATIONSHIP.maximumRejectionLoss, maximumExpiryLoss: SALES_CUSTOMER_RELATIONSHIP.maximumExpiryLoss };
}
export function calculateSalesCustomerRelationshipBaseline(customer: SalesCustomerDefinition, companyPrestige: number): number { return calculateSalesCustomerRelationshipDetails(customer, companyPrestige).baseline; }
export function calculateSalesCustomerRelationshipChange(input: { outcome: 'fulfilled' | 'rejected' | 'expired'; customer: SalesCustomerDefinition; relationship: number; orderReferenceValue: number }): number {
  const relationshipProgress = calculateAsymmetricalScaler01(Math.max(0, Math.min(1, input.relationship / SALES_CUSTOMER_RELATIONSHIP.maximum)));
  if (input.outcome === 'fulfilled') {
    const valueProgress = Math.max(0, input.orderReferenceValue) / (Math.max(0, input.orderReferenceValue) + SALES_CUSTOMER_RELATIONSHIP.relationshipValueScale);
    return SALES_CUSTOMER_RELATIONSHIP.maximumFulfilmentGain * valueProgress * (1 - relationshipProgress) * SALES_CUSTOMER_DOMAIN_PROFILES[input.customer.domain].relationshipGainMultiplier;
  }
  const valueProgress = Math.max(0, input.orderReferenceValue) / (Math.max(0, input.orderReferenceValue) + SALES_CUSTOMER_RELATIONSHIP.relationshipValueScale);
  const maximumLoss = input.outcome === 'expired' ? SALES_CUSTOMER_RELATIONSHIP.maximumExpiryLoss : SALES_CUSTOMER_RELATIONSHIP.maximumRejectionLoss;
  return -(SALES_CUSTOMER_RELATIONSHIP.minimumFailureLoss + (maximumLoss - SALES_CUSTOMER_RELATIONSHIP.minimumFailureLoss) * relationshipProgress * valueProgress);
}
export function createSalesCustomerState(customerId: string, relationship: number, gameTimeMs: number): SalesCustomerState { return { customerId, relationship: Math.max(0, Math.min(SALES_CUSTOMER_RELATIONSHIP.maximum, relationship)), lastRelationshipUpdatedAtGameTimeMs: Math.max(0, gameTimeMs), fulfilledOrderCount: 0, expiredOrderCount: 0 }; }
export function advanceSalesCustomerRelationship(state: SalesCustomerState, customer: SalesCustomerDefinition, companyPrestige: number, currentGameTimeMs: number): SalesCustomerState { const elapsedHours = Math.max(0, currentGameTimeMs - state.lastRelationshipUpdatedAtGameTimeMs) / 3_600_000; const baseline = calculateSalesCustomerRelationshipBaseline(customer, companyPrestige); const retention = Math.pow(0.5, elapsedHours / SALES_CUSTOMER_RELATIONSHIP.foregroundDecayHalfLifeHours); return { ...state, relationship: baseline + (state.relationship - baseline) * retention, lastRelationshipUpdatedAtGameTimeMs: Math.max(state.lastRelationshipUpdatedAtGameTimeMs, currentGameTimeMs) }; }
