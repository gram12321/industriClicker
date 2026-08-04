import type { ResourceType } from '@/game/resources';

/** Command-facing seam for future achievement, research, and facility trade gates. */
export function canBuyMarketResource(_resourceType: ResourceType): boolean { return true; }
export function canSellMarketResource(_resourceType: ResourceType): boolean { return true; }
export function canAutoBuyMarketResource(_resourceType: ResourceType): boolean { return true; }
export function canAutoSellMarketResource(_resourceType: ResourceType): boolean { return true; }
export function canOfferSalesContractForResource(_resourceType: ResourceType): boolean { return true; }
