import type { EconomyPhase } from '@/game/finance';
import type { ResourceType } from '@/game/resources';
import type { SalesCustomerDomain } from './salesCustomers';

export const SALES_ORDER_DURATION_MS = 20 * 60 * 1_000;
export const SALES_ORDER_MINIMUM_QUANTITY = 1;
export const SALES_ORDER_MAXIMUM_QUANTITY = 1_000_000;
export const SALES_ORDER_BASE_ACQUISITION_CHANCE_PER_MINUTE = 0.28;
export const SALES_ORDER_PENDING_PENALTY_PER_OPEN_ORDER = 0.13;
export const SALES_ORDER_PRESTIGE_DISCOVERY_SCALE = 120;

/** Economy affects both customer frequency and their willingness to pay. */
export const SALES_ECONOMY_MULTIPLIERS: Readonly<Record<EconomyPhase, { acquisition: number; bid: number }>> = {
  crash: { acquisition: 0.45, bid: 0.78 },
  recession: { acquisition: 0.7, bid: 0.9 },
  stable: { acquisition: 1, bid: 1 },
  expansion: { acquisition: 1.2, bid: 1.08 },
  boom: { acquisition: 1.4, bid: 1.18 },
};

export const SALES_CUSTOMER_DOMAIN_PROFILES: Readonly<Record<SalesCustomerDomain, {
  label: string;
  bidRange: readonly [number, number];
  targetOrderValue: readonly [number, number];
  frequency: number;
  relationshipGainMultiplier: number;
  /** Winemaker-style customer-generation multiplier: higher values yield fewer, larger buyers. */
  marketShareMultiplier: number;
}>> = {
  food: { label: 'Food', bidRange: [0.96, 1.12], targetOrderValue: [40, 180], frequency: 1.15, relationshipGainMultiplier: 1, marketShareMultiplier: 0.12 },
  'raw-materials': { label: 'Raw materials', bidRange: [0.9, 1.08], targetOrderValue: [60, 260], frequency: 1, relationshipGainMultiplier: 0.95, marketShareMultiplier: 0.2 },
  'industrial-inputs': { label: 'Industrial inputs', bidRange: [0.98, 1.18], targetOrderValue: [100, 480], frequency: 0.85, relationshipGainMultiplier: 1.05, marketShareMultiplier: 0.35 },
  'construction-materials': { label: 'Construction materials', bidRange: [0.94, 1.16], targetOrderValue: [120, 600], frequency: 0.8, relationshipGainMultiplier: 1.1, marketShareMultiplier: 0.45 },
  electronics: { label: 'Electronics', bidRange: [1.04, 1.28], targetOrderValue: [160, 750], frequency: 0.7, relationshipGainMultiplier: 1.2, marketShareMultiplier: 0.28 },
  utilities: { label: 'Utilities', bidRange: [0.88, 1.04], targetOrderValue: [80, 360], frequency: 1.35, relationshipGainMultiplier: 0.65, marketShareMultiplier: 0.5 },
};

export const SALES_CUSTOMER_GENERATION = {
  minimumMarketShare: 0.001,
  maximumCustomersPerDomain: 120,
} as const;

export const SALES_RESOURCE_PROFILES: Readonly<Record<ResourceType, { domain: SalesCustomerDomain; standardOrderLot: number }>> = {
  grain: { domain: 'food', standardOrderLot: 10 }, bread: { domain: 'food', standardOrderLot: 10 }, sugar: { domain: 'food', standardOrderLot: 10 }, cake: { domain: 'food', standardOrderLot: 10 }, 'premium-cake': { domain: 'food', standardOrderLot: 10 }, eggs: { domain: 'food', standardOrderLot: 10 }, fruit: { domain: 'food', standardOrderLot: 10 }, meat: { domain: 'food', standardOrderLot: 10 }, 'meat-pie': { domain: 'food', standardOrderLot: 10 }, milk: { domain: 'food', standardOrderLot: 10 },
  coal: { domain: 'raw-materials', standardOrderLot: 25 }, iron: { domain: 'raw-materials', standardOrderLot: 25 }, copper: { domain: 'raw-materials', standardOrderLot: 25 }, sand: { domain: 'raw-materials', standardOrderLot: 25 }, clay: { domain: 'raw-materials', standardOrderLot: 25 }, stone: { domain: 'raw-materials', standardOrderLot: 25 }, minerals: { domain: 'raw-materials', standardOrderLot: 25 }, gold: { domain: 'raw-materials', standardOrderLot: 1 },
  steel: { domain: 'industrial-inputs', standardOrderLot: 10 }, chemicals: { domain: 'industrial-inputs', standardOrderLot: 10 }, fertilizer: { domain: 'industrial-inputs', standardOrderLot: 10 }, plastic: { domain: 'industrial-inputs', standardOrderLot: 10 }, wool: { domain: 'industrial-inputs', standardOrderLot: 10 },
  bricks: { domain: 'construction-materials', standardOrderLot: 25 }, cement: { domain: 'construction-materials', standardOrderLot: 10 }, 'reinforced-concrete': { domain: 'construction-materials', standardOrderLot: 5 }, 'construction-materials': { domain: 'construction-materials', standardOrderLot: 5 },
  'electric-circuits': { domain: 'electronics', standardOrderLot: 5 }, silicon: { domain: 'electronics', standardOrderLot: 5 }, 'advanced-components': { domain: 'electronics', standardOrderLot: 2 }, 'industrial-machines': { domain: 'electronics', standardOrderLot: 1 },
  water: { domain: 'utilities', standardOrderLot: 500 }, electricity: { domain: 'utilities', standardOrderLot: 250 },
};
