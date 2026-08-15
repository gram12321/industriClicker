import type { ResourceType } from '@/game/resources';
import { SALES_CUSTOMER_DOMAIN_PROFILES, SALES_CUSTOMER_GENERATION, SALES_RESOURCE_PROFILES } from './salesConstants';

export const SALES_CUSTOMER_CATALOGUE_VERSION = 1;
export const SALES_CUSTOMER_WORLD_SEED = 'industri-clicker-local-world-v1';
export const SALES_CUSTOMER_DOMAINS = ['food', 'raw-materials', 'industrial-inputs', 'construction-materials', 'electronics', 'utilities'] as const;
export type SalesCustomerDomain = typeof SALES_CUSTOMER_DOMAINS[number];

export type SalesCustomerDefinition = { id: string; name: string; domain: SalesCustomerDomain; marketShare: number; purchasingPower: number; bidMultiplier: number };
export type SalesResourceProfile = { domain: SalesCustomerDomain; standardOrderLot: number };
export type SalesCustomerState = { customerId: string; relationship: number; lastRelationshipUpdatedAtGameTimeMs: number; fulfilledOrderCount: number; expiredOrderCount: number };

export const SALES_CUSTOMER_RELATIONSHIP = { maximum: 100, foregroundDecayHalfLifeHours: 8, fulfilmentBaseGain: 4, expiryLoss: 8 } as const;
const CUSTOMER_NAME_PREFIXES = ['Aster', 'Boreal', 'Civic', 'Dynamo', 'Ember', 'Forge', 'Harbor', 'Northstar', 'Pioneer', 'Vertex'] as const;
const CUSTOMER_NAME_SUFFIXES: Readonly<Record<SalesCustomerDomain, readonly string[]>> = {
  food: ['Provisions', 'Foods', 'Kitchen Supply'], 'raw-materials': ['Materials', 'Extractives', 'Resource Group'], 'industrial-inputs': ['Industrial Supply', 'Works', 'Process Goods'], 'construction-materials': ['Build Supply', 'Construction Group', 'Infrastructure'], electronics: ['Electronics', 'Systems', 'Components'], utilities: ['Utility Network', 'Energy Supply', 'Waterworks'],
};

function hashSeed(value: string): number { let hash = 2_166_136_261; for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16_777_619); } return hash >>> 0; }
function unitInterval(value: string): number { return hashSeed(value) / 4_294_967_296; }
function calculateSkewedMarketShareMultiplier(score: number): number { if (score < 0.4) return score * score * 1.5; if (score < 0.7) return 0.24 + Math.log(1 + (score - 0.4) * 3.33) * 0.3; if (score < 0.9) return 0.56 + (score - 0.7) * 1.5; if (score < 0.95) return 0.86 + (score - 0.9) * 2; if (score < 0.99) return 0.96 + (score - 0.95) * 0.8; return 0.99 + (1 - Math.exp(-(score - 0.99) * 10)) * 0.01; }
function getMarketShareDrawCount(value: number): number { if (value >= 0.9) return 5; if (value >= 0.7) return 4; if (value >= 0.5) return 3; if (value >= 0.1) return 2; return 1; }

/** Deterministic local stand-in for the future server-owned customer catalogue. */
export function getSalesCustomerCatalogue(worldSeed = SALES_CUSTOMER_WORLD_SEED, catalogueVersion = SALES_CUSTOMER_CATALOGUE_VERSION): SalesCustomerDefinition[] {
  return SALES_CUSTOMER_DOMAINS.flatMap((domain) => {
    const customers: SalesCustomerDefinition[] = []; let remainingShare = 1; let customerIndex = 0;
    while (remainingShare > 0 && customerIndex < SALES_CUSTOMER_GENERATION.maximumCustomersPerDomain) {
      const seed = `${worldSeed}:${catalogueVersion}:${domain}:${customerIndex}`; const firstDraw = calculateSkewedMarketShareMultiplier(unitInterval(`${seed}:share:0`)); let smallestDraw = firstDraw;
      for (let draw = 1; draw < getMarketShareDrawCount(firstDraw); draw += 1) smallestDraw = Math.min(smallestDraw, calculateSkewedMarketShareMultiplier(unitInterval(`${seed}:share:${draw}`)));
      const isLastAllowedCustomer = customerIndex === SALES_CUSTOMER_GENERATION.maximumCustomersPerDomain - 1;
      const marketShare = isLastAllowedCustomer ? remainingShare : Math.min(remainingShare, Math.max(SALES_CUSTOMER_GENERATION.minimumMarketShare, smallestDraw * SALES_CUSTOMER_DOMAIN_PROFILES[domain].marketShareMultiplier));
      const prefix = CUSTOMER_NAME_PREFIXES[Math.floor(unitInterval(`${seed}:prefix`) * CUSTOMER_NAME_PREFIXES.length)]; const suffixes = CUSTOMER_NAME_SUFFIXES[domain]; const purchasingPower = Math.round((0.8 + unitInterval(`${seed}:power`) * 0.4) * 1_000) / 1_000; const bidRange = SALES_CUSTOMER_DOMAIN_PROFILES[domain].bidRange; const baseBid = bidRange[0] + unitInterval(`${seed}:bid`) * (bidRange[1] - bidRange[0]);
      customers.push({ id: `customer:${catalogueVersion}:${domain}:${customerIndex + 1}`, name: `${prefix} ${suffixes[Math.floor(unitInterval(`${seed}:suffix`) * suffixes.length)]}`, domain, marketShare, purchasingPower, bidMultiplier: Math.round(Math.max(0.1, Math.min(2, baseBid * purchasingPower * (1 - marketShare))) * 1_000) / 1_000 });
      remainingShare = Math.max(0, remainingShare - marketShare); customerIndex += 1;
    }
    return customers;
  });
}
export function getSalesResourceProfile(resourceType: ResourceType): SalesResourceProfile { return SALES_RESOURCE_PROFILES[resourceType]; }
export function calculateSalesCustomerRelationshipBaseline(customer: SalesCustomerDefinition, companyPrestige: number): number { const recognition = Math.max(0, companyPrestige) / (Math.max(0, companyPrestige) + 100); return Math.min(SALES_CUSTOMER_RELATIONSHIP.maximum, 5 + recognition * 25 * (1 - customer.marketShare * 0.5)); }
export function createSalesCustomerState(customerId: string, relationship: number, gameTimeMs: number): SalesCustomerState { return { customerId, relationship: Math.max(0, Math.min(SALES_CUSTOMER_RELATIONSHIP.maximum, relationship)), lastRelationshipUpdatedAtGameTimeMs: Math.max(0, gameTimeMs), fulfilledOrderCount: 0, expiredOrderCount: 0 }; }
export function advanceSalesCustomerRelationship(state: SalesCustomerState, customer: SalesCustomerDefinition, companyPrestige: number, currentGameTimeMs: number): SalesCustomerState { const elapsedHours = Math.max(0, currentGameTimeMs - state.lastRelationshipUpdatedAtGameTimeMs) / 3_600_000; const baseline = calculateSalesCustomerRelationshipBaseline(customer, companyPrestige); const retention = Math.pow(0.5, elapsedHours / SALES_CUSTOMER_RELATIONSHIP.foregroundDecayHalfLifeHours); return { ...state, relationship: baseline + (state.relationship - baseline) * retention, lastRelationshipUpdatedAtGameTimeMs: Math.max(state.lastRelationshipUpdatedAtGameTimeMs, currentGameTimeMs) }; }
