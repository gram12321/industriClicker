import { RESOURCES, RESOURCE_TYPES } from '../resources/resourceConstants';
import type { ResourceType } from '../resources/resourceTypes';
import {
  MARKET_AUTOBUY_DEFAULT_MAX_PRICE_MULTIPLIER,
  MARKET_AUTOSELL_DEFAULT_MAX_PER_MINUTE,
  MARKET_AUTOSELL_DEFAULT_MIN_KEEP,
  MARKET_AUTOSELL_DEFAULT_MIN_PRICE,
  MARKET_DEFAULT_QUALITY,
  MARKET_DIFFUSION_DIVISOR,
} from './marketConstants';
import type { MarketAutomation, MarketDiffusionInfo, MarketPoolEntry, MarketSnapshot, MarketTradeResult } from './marketTypes';

function isNonNegativeFinite(value: number): boolean { return Number.isFinite(value) && value >= 0; }
function isPositiveFinite(value: number): boolean { return Number.isFinite(value) && value > 0; }

function mixQuality(existing: MarketPoolEntry, addedAmount: number, addedQuality: number): number {
  if (existing.supply + addedAmount <= 0) return MARKET_DEFAULT_QUALITY;
  return (existing.supply * existing.quality + addedAmount * addedQuality) / (existing.supply + addedAmount);
}

function createPool(kind: 'local' | 'global'): Record<ResourceType, MarketPoolEntry> {
  return RESOURCE_TYPES.reduce((pool, resourceType) => {
    const definition = RESOURCES[resourceType].market;
    pool[resourceType] = {
      supply: kind === 'local' ? definition.localInitialSupply : definition.globalInitialSupply,
      quality: MARKET_DEFAULT_QUALITY,
    };
    return pool;
  }, {} as Record<ResourceType, MarketPoolEntry>);
}

function createAutomation(local: Record<ResourceType, MarketPoolEntry>): Record<ResourceType, MarketAutomation> {
  return RESOURCE_TYPES.reduce((automation, resourceType) => {
    const price = RESOURCES[resourceType].market.localBenchmarkSupply / local[resourceType].supply;
    automation[resourceType] = {
      autoBuyEnabled: false,
      autoBuyMaxUnitPrice: price * MARKET_AUTOBUY_DEFAULT_MAX_PRICE_MULTIPLIER,
      autoSellEnabled: false,
      autoSellMaxPerMinute: MARKET_AUTOSELL_DEFAULT_MAX_PER_MINUTE,
      autoSellMinKeep: MARKET_AUTOSELL_DEFAULT_MIN_KEEP,
      autoSellMinUnitPrice: MARKET_AUTOSELL_DEFAULT_MIN_PRICE,
    };
    return automation;
  }, {} as Record<ResourceType, MarketAutomation>);
}

export class Market {
  private local: Record<ResourceType, MarketPoolEntry>;
  private global: Record<ResourceType, MarketPoolEntry>;
  private automation: Record<ResourceType, MarketAutomation>;

  constructor(snapshot?: MarketSnapshot) {
    this.local = createPool('local');
    this.global = createPool('global');
    this.automation = createAutomation(this.local);
    if (snapshot) this.restore(snapshot);
  }

  getLocalEntry(resourceType: ResourceType): MarketPoolEntry { return { ...this.local[resourceType] }; }
  getGlobalEntry(resourceType: ResourceType): MarketPoolEntry { return { ...this.global[resourceType] }; }
  getAutomation(resourceType: ResourceType): MarketAutomation { return { ...this.automation[resourceType] }; }

  getLocalPrice(resourceType: ResourceType): number {
    const definition = RESOURCES[resourceType].market;
    const entry = this.local[resourceType];
    return definition.localBenchmarkSupply / Math.max(entry.supply, 1) * entry.quality;
  }

  getGlobalPrice(resourceType: ResourceType): number {
    const definition = RESOURCES[resourceType].market;
    const entry = this.global[resourceType];
    return definition.globalBenchmarkSupply / Math.max(entry.supply, 1) * entry.quality;
  }

  getDiffusionInfo(resourceType: ResourceType): MarketDiffusionInfo {
    const localPrice = this.getLocalPrice(resourceType);
    const globalPrice = this.getGlobalPrice(resourceType);
    if (localPrice === globalPrice || globalPrice <= 0) return { direction: 'none', amount: 0 };
    const base = RESOURCES[resourceType].market.localInitialSupply / MARKET_DIFFUSION_DIVISOR;
    if (localPrice > globalPrice) return { direction: 'to-local', amount: (localPrice / globalPrice - 1) * base };
    return { direction: 'to-global', amount: (1 - localPrice / globalPrice) * base };
  }

  buyFromLocal(resourceType: ResourceType, requestedAmount: number): MarketTradeResult {
    const unitPrice = this.getLocalPrice(resourceType);
    if (!isPositiveFinite(requestedAmount) || this.local[resourceType].supply < requestedAmount) return { success: false, amount: 0, unitPrice, quality: this.local[resourceType].quality };
    this.local[resourceType].supply -= requestedAmount;
    return { success: true, amount: requestedAmount, unitPrice, quality: this.local[resourceType].quality };
  }

  sellToLocal(resourceType: ResourceType, amount: number, quality: number): MarketTradeResult {
    const unitPrice = this.getLocalPrice(resourceType);
    if (!isPositiveFinite(amount) || !isPositiveFinite(quality)) return { success: false, amount: 0, unitPrice, quality };
    const entry = this.local[resourceType];
    entry.quality = mixQuality(entry, amount, quality);
    entry.supply += amount;
    return { success: true, amount, unitPrice, quality };
  }

  addToGlobal(resourceType: ResourceType, amount: number, quality: number): boolean {
    if (!isPositiveFinite(amount) || !isPositiveFinite(quality)) return false;
    const entry = this.global[resourceType];
    entry.quality = mixQuality(entry, amount, quality);
    entry.supply += amount;
    return true;
  }

  diffuse(): void {
    for (const resourceType of RESOURCE_TYPES) {
      const info = this.getDiffusionInfo(resourceType);
      if (info.direction === 'none' || info.amount <= 0) continue;
      const source = info.direction === 'to-local' ? this.global[resourceType] : this.local[resourceType];
      const destination = info.direction === 'to-local' ? this.local[resourceType] : this.global[resourceType];
      const transferred = Math.min(info.amount, source.supply);
      if (transferred <= 0) continue;
      destination.quality = mixQuality(destination, transferred, source.quality);
      destination.supply += transferred;
      source.supply -= transferred;
    }
  }

  setAutomation(resourceType: ResourceType, updates: Partial<MarketAutomation>): boolean {
    const current = this.automation[resourceType];
    const next = { ...current, ...updates };
    if (!isNonNegativeFinite(next.autoBuyMaxUnitPrice) || !isNonNegativeFinite(next.autoSellMaxPerMinute) || !isNonNegativeFinite(next.autoSellMinKeep) || !isNonNegativeFinite(next.autoSellMinUnitPrice)) return false;
    this.automation[resourceType] = next;
    return true;
  }

  toSnapshot(): MarketSnapshot {
    return {
      local: Object.fromEntries(RESOURCE_TYPES.map((type) => [type, { ...this.local[type] }])) as Record<ResourceType, MarketPoolEntry>,
      global: Object.fromEntries(RESOURCE_TYPES.map((type) => [type, { ...this.global[type] }])) as Record<ResourceType, MarketPoolEntry>,
      automation: Object.fromEntries(RESOURCE_TYPES.map((type) => [type, { ...this.automation[type] }])) as Record<ResourceType, MarketAutomation>,
    };
  }

  clone(): Market { return new Market(this.toSnapshot()); }
  static fromSnapshot(snapshot: MarketSnapshot): Market { return new Market(snapshot); }

  private restore(snapshot: MarketSnapshot): void {
    for (const resourceType of RESOURCE_TYPES) {
      const local = snapshot.local[resourceType];
      const global = snapshot.global[resourceType];
      const automation = snapshot.automation[resourceType];
      if (local && isNonNegativeFinite(local.supply) && isPositiveFinite(local.quality)) this.local[resourceType] = { ...local };
      if (global && isNonNegativeFinite(global.supply) && isPositiveFinite(global.quality)) this.global[resourceType] = { ...global };
      if (automation && typeof automation.autoBuyEnabled === 'boolean' && typeof automation.autoSellEnabled === 'boolean'
        && isNonNegativeFinite(automation.autoBuyMaxUnitPrice) && isNonNegativeFinite(automation.autoSellMaxPerMinute) && isNonNegativeFinite(automation.autoSellMinKeep) && isNonNegativeFinite(automation.autoSellMinUnitPrice)) this.automation[resourceType] = { ...automation };
    }
  }
}
