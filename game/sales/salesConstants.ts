import type { EconomyPhase } from '@/game/finance';
import type { ResourceType } from '@/game/resources';
import type { SalesCustomerDomain, SalesCustomerType } from './salesTypes';

export const SALES_ORDER_DURATION_MS = 20 * 60 * 1_000;
export const SALES_ORDER_MINIMUM_QUANTITY = 1;
export const SALES_ORDER_MAXIMUM_QUANTITY = 1_000_000;
export const SALES_ORDER_BASE_ACQUISITION_RATE_PER_MINUTE = 1;
export const SALES_ORDER_PENDING_PENALTY_PER_OPEN_ORDER = 0.13;
export const SALES_ORDER_SELECTION_STOCK_COVERAGE_CAP = 64;
/** Keeps unstocked resources offerable while making covered inventory more likely. */
export const SALES_ORDER_UNSTOCKED_INVENTORY_READINESS = 0.25;
export const SALES_ORDER_SELECTION_MAX_RELATIONSHIP_MULTIPLIER = 2;
export const SALES_ORDER_PRESTIGE_DISCOVERY_SCALE = 120;
export const SALES_ORDER_PRESTIGE_DISCOVERY_BASE = 0.01;
export const SALES_ORDER_PRESTIGE_DISCOVERY_MAX = 10;
export const SALES_ORDER_BASE_COMPANY_VALUE_FRACTION = 0.5;
export const SALES_ORDER_MINIMUM_COMPANY_VALUE_CAP = 100;
/**
 * Offer value grows with company progression, while repeat customers grant a
 * smaller throughput bonus. Both curves are capped to keep the order economy bounded.
 */
export const SALES_ORDER_VOLUME_SCALING = {
  prestigeScale: 250,
  maximumPrestigeMultiplier: 4,
  baseRollPrestigeScale: 5,
  maximumBaseRollExponent: 4,
  companyValueScale: 1_000,
  minimumCompanyValueMultiplier: 0.25,
  maximumRelationshipMultiplier: 1.2,
} as const;

/**
 * Per-line order volume responds to current global supply versus the resource's
 * global benchmark. It deliberately stays secondary to company progression and
 * the order-value cap: shortages raise requested lots a little, while abundant
 * markets can produce larger clearance-style orders.
 */
export const SALES_ORDER_MARKET_VOLUME_SCALING = {
  maximumOversupplyMultiplier: 1.3,
  maximumShortageMultiplier: 1.12,
  oversupplyRatioAtMaximum: 3,
  shortageRatioAtMaximum: 0.2,
} as const;

export const SALES_ORDER_BUNDLE_PRESTIGE_CONTROL_POINTS = [
  { input: 0, normalized: 0 },
  { input: 1, normalized: 0.05 },
  { input: 5, normalized: 0.18 },
  { input: 20, normalized: 0.45 },
  { input: 60, normalized: 0.7 },
  { input: 150, normalized: 0.9 },
  { input: 300, normalized: 1 },
] as const;

/** Bid-premium prestige curve: company prestige should remain modest early and become decisive later. */
export const SALES_ORDER_BID_PRESTIGE_CONTROL_POINTS = [
  { input: 0, normalized: 0 },
  { input: 1, normalized: 0.005 },
  { input: 5, normalized: 0.015 },
  { input: 20, normalized: 0.05 },
  { input: 60, normalized: 0.15 },
  { input: 150, normalized: 0.4 },
  { input: 300, normalized: 0.7 },
  { input: 600, normalized: 1 },
] as const;

export const SALES_ORDER_PRESSURE_OFFER_CHANCE = 0.025;
export const SALES_ORDER_PRESTIGE_BONUS_MIN = 0.01;
export const SALES_ORDER_PRESTIGE_BONUS_MAX = 4;
export const SALES_ORDER_RELATIONSHIP_BONUS_MIN = 0.01;
export const SALES_ORDER_RELATIONSHIP_BONUS_MAX = 4;
export const SALES_ORDER_CUSTOMER_FACTOR_MIN = -0.5;
export const SALES_ORDER_CUSTOMER_FACTOR_MAX = 0.5;
/** Presentation ranges for percentage-based sales-card colour cues. */
export const SALES_ORDER_BID_BONUS_COLOR_MIN_PERCENT = -100;
export const SALES_ORDER_BID_BONUS_COLOR_MAX_PERCENT = 1_000;
export const SALES_ORDER_QUALITY_BONUS_COLOR_MIN_PERCENT = 0;
export const SALES_ORDER_QUALITY_BONUS_COLOR_MAX_PERCENT = 5_000;
export const SALES_ORDER_LOCAL_COMPARISON_COLOR_MIN_PERCENT = -100;
export const SALES_ORDER_LOCAL_COMPARISON_COLOR_MAX_PERCENT = 100;

/** Fixed catalogue display ranges. Values outside are clamped only for score colouring. */
export const SALES_CUSTOMER_PURCHASING_POWER_RANGE = [0.55, 2] as const;
export const SALES_CUSTOMER_BID_MULTIPLIER_RANGE = [0.55, 1.8] as const;

/** Economy affects both customer frequency and their willingness to pay. */
export const SALES_ECONOMY_MULTIPLIERS: Readonly<Record<EconomyPhase, { acquisition: number; bid: number }>> = {
  crash: { acquisition: 0.33, bid: 0.5 },
  recession: { acquisition: 0.66, bid: 0.75 },
  stable: { acquisition: 1, bid: 1 },
  expansion: { acquisition: 1.8, bid: 1.25 },
  boom: { acquisition: 3, bid: 1.5 },
};

export const SALES_CUSTOMER_DOMAIN_PROFILES: Readonly<Record<SalesCustomerDomain, {
  label: string;
  bidRange: readonly [number, number];
  targetOrderValue: readonly [number, number];
  frequency: number;
  relationshipGainMultiplier: number;
  /** Winemaker-style customer-generation multiplier: higher values yield fewer, larger buyers. */
  marketShareMultiplier: number;
  customerTypeWeights: Readonly<Record<SalesCustomerType, number>>;
}>> = {
  food: { label: 'Food', bidRange: [0.96, 1.12], targetOrderValue: [20, 240], frequency: 1.15, relationshipGainMultiplier: 1, marketShareMultiplier: 0.12, customerTypeWeights: { 'private-customer': 0.55, 'retail-chain': 0.35, 'construction-contractor': 0, 'industrial-enterprise': 0, 'utility-operator': 0, 'government-procurement': 0.1 } },
  'raw-materials': { label: 'Raw materials', bidRange: [0.9, 1.08], targetOrderValue: [30, 360], frequency: 1, relationshipGainMultiplier: 0.95, marketShareMultiplier: 0.2, customerTypeWeights: { 'private-customer': 0.03, 'retail-chain': 0, 'construction-contractor': 0.31, 'industrial-enterprise': 0.5, 'utility-operator': 0, 'government-procurement': 0.16 } },
  'industrial-inputs': { label: 'Industrial inputs', bidRange: [0.98, 1.18], targetOrderValue: [50, 650], frequency: 0.85, relationshipGainMultiplier: 1.05, marketShareMultiplier: 0.35, customerTypeWeights: { 'private-customer': 0.04, 'retail-chain': 0, 'construction-contractor': 0.2, 'industrial-enterprise': 0.48, 'utility-operator': 0.18, 'government-procurement': 0.1 } },
  'construction-materials': { label: 'Construction materials', bidRange: [0.94, 1.16], targetOrderValue: [60, 800], frequency: 0.8, relationshipGainMultiplier: 1.1, marketShareMultiplier: 0.45, customerTypeWeights: { 'private-customer': 0.08, 'retail-chain': 0.2, 'construction-contractor': 0.42, 'industrial-enterprise': 0.18, 'utility-operator': 0, 'government-procurement': 0.12 } },
  electronics: { label: 'Electronics', bidRange: [1.04, 1.28], targetOrderValue: [75, 1_000], frequency: 0.7, relationshipGainMultiplier: 1.2, marketShareMultiplier: 0.28, customerTypeWeights: { 'private-customer': 0.35, 'retail-chain': 0.38, 'construction-contractor': 0, 'industrial-enterprise': 0.18, 'utility-operator': 0, 'government-procurement': 0.09 } },
  utilities: { label: 'Utilities', bidRange: [0.88, 1.04], targetOrderValue: [25, 450], frequency: 1.35, relationshipGainMultiplier: 0.65, marketShareMultiplier: 0.5, customerTypeWeights: { 'private-customer': 0.18, 'retail-chain': 0, 'construction-contractor': 0.1, 'industrial-enterprise': 0.32, 'utility-operator': 0.3, 'government-procurement': 0.1 } },
};

export const SALES_CUSTOMER_TYPE_PROFILES: Readonly<Record<SalesCustomerType, {
  label: string;
  description: string;
  allowedOperatingDomains: readonly SalesCustomerDomain[];
  crossDomainChance: number;
  bundleAppetite: number;
  frequencyMultiplier: number;
  targetValueMultiplier: readonly [number, number];
  prestigeScale: number;
  prestigeExponent: number;
  accessibilityFloor: number;
  globalPremiumBaseline: number;
  marketShareScale: number;
}>> = {
  'private-customer': { label: 'Private Customer', description: 'Small, single-domain consumer demand with a strong preference for one resource.', allowedOperatingDomains: ['food', 'raw-materials', 'industrial-inputs', 'construction-materials', 'electronics', 'utilities'], crossDomainChance: 0, bundleAppetite: 0.08, frequencyMultiplier: 1.25, targetValueMultiplier: [0.25, 0.7], prestigeScale: 1, prestigeExponent: 1, accessibilityFloor: 1, globalPremiumBaseline: 0.13, marketShareScale: 0.22 },
  'retail-chain': { label: 'Retail Chain', description: 'Recurring retail demand; most chains specialise in one retail domain while some span two.', allowedOperatingDomains: ['food', 'electronics', 'construction-materials'], crossDomainChance: 0.28, bundleAppetite: 0.28, frequencyMultiplier: 1.08, targetValueMultiplier: [0.75, 1.45], prestigeScale: 8, prestigeExponent: 2, accessibilityFloor: 0.2, globalPremiumBaseline: 0.08, marketShareScale: 0.65 },
  'construction-contractor': { label: 'Construction Contractor', description: 'Project procurement centred on construction, raw materials, industrial inputs, and utilities.', allowedOperatingDomains: ['raw-materials', 'industrial-inputs', 'construction-materials', 'utilities'], crossDomainChance: 0.62, bundleAppetite: 0.68, frequencyMultiplier: 0.78, targetValueMultiplier: [1.1, 2.5], prestigeScale: 30, prestigeExponent: 2.5, accessibilityFloor: 0.03, globalPremiumBaseline: 0.065, marketShareScale: 1.05 },
  'industrial-enterprise': { label: 'Industrial Enterprise', description: 'Large, varied industrial procurement across compatible operational domains.', allowedOperatingDomains: ['raw-materials', 'industrial-inputs', 'construction-materials', 'electronics', 'utilities'], crossDomainChance: 0.72, bundleAppetite: 0.82, frequencyMultiplier: 0.62, targetValueMultiplier: [1.3, 3.2], prestigeScale: 50, prestigeExponent: 3, accessibilityFloor: 0.01, globalPremiumBaseline: 0.05, marketShareScale: 1.55 },
  'utility-operator': { label: 'Utility Operator', description: 'High-volume utility and industrial-input procurement.', allowedOperatingDomains: ['industrial-inputs', 'utilities'], crossDomainChance: 0.7, bundleAppetite: 0.74, frequencyMultiplier: 0.9, targetValueMultiplier: [1.2, 3], prestigeScale: 20, prestigeExponent: 2.5, accessibilityFloor: 0.05, globalPremiumBaseline: 0.04, marketShareScale: 1.35 },
  'government-procurement': { label: 'Government Procurement', description: 'Rare public procurement that can span otherwise unrelated domains.', allowedOperatingDomains: ['food', 'raw-materials', 'industrial-inputs', 'construction-materials', 'electronics', 'utilities'], crossDomainChance: 0.88, bundleAppetite: 1, frequencyMultiplier: 0.38, targetValueMultiplier: [1.5, 4], prestigeScale: 100, prestigeExponent: 4, accessibilityFloor: 0.002, globalPremiumBaseline: 0.075, marketShareScale: 1.8 },
};

export const SALES_CUSTOMER_GENERATION = {
  minimumMarketShare: 0.001,
  maximumCustomersPerDomain: 120,
} as const;

export const SALES_RESOURCE_PROFILES: Readonly<Record<ResourceType, { domain: SalesCustomerDomain; standardOrderLot: number }>> = {
  grain: { domain: 'food', standardOrderLot: 100 }, bread: { domain: 'food', standardOrderLot: 50 }, sugar: { domain: 'food', standardOrderLot: 75 }, cake: { domain: 'food', standardOrderLot: 10 }, 'premium-cake': { domain: 'food', standardOrderLot: 5 }, eggs: { domain: 'food', standardOrderLot: 25 }, fruit: { domain: 'food', standardOrderLot: 25 }, meat: { domain: 'food', standardOrderLot: 20 }, 'meat-pie': { domain: 'food', standardOrderLot: 10 }, milk: { domain: 'food', standardOrderLot: 25 },
  coal: { domain: 'raw-materials', standardOrderLot: 100 }, iron: { domain: 'raw-materials', standardOrderLot: 100 }, copper: { domain: 'raw-materials', standardOrderLot: 75 }, sand: { domain: 'raw-materials', standardOrderLot: 500 }, clay: { domain: 'raw-materials', standardOrderLot: 250 }, stone: { domain: 'raw-materials', standardOrderLot: 200 }, minerals: { domain: 'raw-materials', standardOrderLot: 150 }, gold: { domain: 'raw-materials', standardOrderLot: 1 },
  steel: { domain: 'industrial-inputs', standardOrderLot: 50 }, chemicals: { domain: 'industrial-inputs', standardOrderLot: 75 }, fertilizer: { domain: 'industrial-inputs', standardOrderLot: 100 }, plastic: { domain: 'industrial-inputs', standardOrderLot: 50 }, wool: { domain: 'industrial-inputs', standardOrderLot: 25 },
  bricks: { domain: 'construction-materials', standardOrderLot: 100 }, cement: { domain: 'construction-materials', standardOrderLot: 100 }, 'reinforced-concrete': { domain: 'construction-materials', standardOrderLot: 25 }, 'construction-materials': { domain: 'construction-materials', standardOrderLot: 10 },
  'electric-circuits': { domain: 'electronics', standardOrderLot: 25 }, silicon: { domain: 'electronics', standardOrderLot: 10 }, 'advanced-components': { domain: 'electronics', standardOrderLot: 5 }, 'industrial-machines': { domain: 'electronics', standardOrderLot: 1 },
  water: { domain: 'utilities', standardOrderLot: 500 }, electricity: { domain: 'utilities', standardOrderLot: 250 },
};
