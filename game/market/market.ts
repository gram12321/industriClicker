import { RESOURCES, RESOURCE_TYPES, type ResourceType } from '@/game/resources';
import {
  MARKET_AUTOBUY_DEFAULT_MAX_PRICE_MULTIPLIER,
  MARKET_AUTOBUY_DEFAULT_TARGET_INVENTORY,
  MARKET_AUTOTRADE_DEFAULT_INTERVAL_MS,
  MARKET_AUTOSELL_DEFAULT_MAX_PER_MINUTE,
  MARKET_AUTOTRADE_INTERVAL_OPTIONS,
  MARKET_AUTOSELL_DEFAULT_MIN_KEEP,
  MARKET_AUTOSELL_DEFAULT_MIN_PRICE,
  MARKET_DEFAULT_QUALITY,
} from './marketConstants';
import { calculateMarketDiffusionDetails, calculateMarketDiffusionInfo, calculateMarketPrice } from './marketDiffusion';
import type { MarketAutomation, MarketDiffusionDetails, MarketDiffusionInfo, MarketPoolEntry, MarketSnapshot, MarketTradeResult } from './marketTypes';

function isNonNegativeFinite(value: number): boolean { return Number.isFinite(value) && value >= 0; }
function isPositiveFinite(value: number): boolean { return Number.isFinite(value) && value > 0; }
function isAutoTradeInterval(value: number): boolean { return MARKET_AUTOTRADE_INTERVAL_OPTIONS.some((option) => option.milliseconds === value); }

function mixQuality(existing: MarketPoolEntry, addedAmount: number, addedQuality: number): number {
  if (existing.supply + addedAmount <= 0) return MARKET_DEFAULT_QUALITY;
  return (existing.supply * existing.quality + addedAmount * addedQuality) / (existing.supply + addedAmount);
}

function createPool(kind: 'local' | 'regional' | 'global'): Record<ResourceType, MarketPoolEntry> {
  return RESOURCE_TYPES.reduce((pool, resourceType) => {
    const definition = RESOURCES[resourceType].market;
    pool[resourceType] = {
      supply: kind === 'local'
        ? definition.localInitialSupply
        : kind === 'regional' ? definition.regionalInitialSupply : definition.globalInitialSupply,
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
      autoBuyTargetInventory: MARKET_AUTOBUY_DEFAULT_TARGET_INVENTORY,
      autoSellEnabled: false,
      autoTradeIntervalMs: MARKET_AUTOTRADE_DEFAULT_INTERVAL_MS,
      autoSellMaxPerMinute: MARKET_AUTOSELL_DEFAULT_MAX_PER_MINUTE,
      autoSellMinKeep: MARKET_AUTOSELL_DEFAULT_MIN_KEEP,
      autoSellMinUnitPrice: MARKET_AUTOSELL_DEFAULT_MIN_PRICE,
    };
    return automation;
  }, {} as Record<ResourceType, MarketAutomation>);
}

export class Market {
  private local: Record<ResourceType, MarketPoolEntry>;
  private regional: Record<ResourceType, MarketPoolEntry>;
  private global: Record<ResourceType, MarketPoolEntry>;
  private automation: Record<ResourceType, MarketAutomation>;
  private localMarketDepthMultiplier = 1;
  private localRegionalDiffusionMultiplier = 1;

  constructor(snapshot?: MarketSnapshot) {
    this.local = createPool('local');
    this.regional = createPool('regional');
    this.global = createPool('global');
    this.automation = createAutomation(this.local);
    if (snapshot) this.restore(snapshot);
  }

  getLocalEntry(resourceType: ResourceType): MarketPoolEntry { return { ...this.local[resourceType] }; }
  getRegionalEntry(resourceType: ResourceType): MarketPoolEntry { return { ...this.regional[resourceType] }; }
  getGlobalEntry(resourceType: ResourceType): MarketPoolEntry { return { ...this.global[resourceType] }; }
  getAutomation(resourceType: ResourceType): MarketAutomation { return { ...this.automation[resourceType] }; }

  getLocalPrice(resourceType: ResourceType): number {
    const definition = RESOURCES[resourceType].market;
    return calculateMarketPrice(definition.localBenchmarkSupply * this.localMarketDepthMultiplier, this.local[resourceType]);
  }

  /** Quotes a local sale using the quality of the inventory being sold. */
  getLocalSalePrice(resourceType: ResourceType, inventoryQuality: number): number {
    const definition = RESOURCES[resourceType].market;
    return calculateMarketPrice(definition.localBenchmarkSupply * this.localMarketDepthMultiplier, {
      supply: this.local[resourceType].supply,
      quality: inventoryQuality,
    });
  }

  /** Returns the largest local purchase that keeps the resulting unit price within the cap. */
  getMaximumLocalPurchaseAmountAtUnitPrice(resourceType: ResourceType, maxUnitPrice: number): number {
    if (!isPositiveFinite(maxUnitPrice)) return 0;
    const entry = this.local[resourceType];
    const benchmarkSupply = RESOURCES[resourceType].market.localBenchmarkSupply * this.localMarketDepthMultiplier;
    const minimumSupply = benchmarkSupply * entry.quality / maxUnitPrice;
    if (minimumSupply <= 1) return entry.supply;
    return Math.max(0, Math.min(entry.supply, entry.supply - minimumSupply));
  }

  /** Expands every local pool proportionally, retaining current local prices. */
  setLocalMarketDepthMultiplier(multiplier: number): boolean {
    if (!isPositiveFinite(multiplier)) return false;
    const scale = multiplier / this.localMarketDepthMultiplier;
    for (const resourceType of RESOURCE_TYPES) this.local[resourceType].supply *= scale;
    this.localMarketDepthMultiplier = multiplier;
    return true;
  }

  /** Restores a depth multiplier after its already-scaled local pools are loaded. */
  restoreLocalMarketDepthMultiplier(multiplier: number): boolean {
    if (!isPositiveFinite(multiplier)) return false;
    this.localMarketDepthMultiplier = multiplier;
    return true;
  }

  setLocalRegionalDiffusionMultiplier(multiplier: number): boolean {
    if (!isPositiveFinite(multiplier)) return false;
    this.localRegionalDiffusionMultiplier = multiplier;
    return true;
  }

  getGlobalPrice(resourceType: ResourceType): number {
    const definition = RESOURCES[resourceType].market;
    return calculateMarketPrice(definition.globalBenchmarkSupply, this.global[resourceType]);
  }

  getRegionalPrice(resourceType: ResourceType): number {
    const definition = RESOURCES[resourceType].market;
    return calculateMarketPrice(definition.regionalBenchmarkSupply, this.regional[resourceType]);
  }

  getLocalRegionalDiffusionInfo(resourceType: ResourceType): MarketDiffusionInfo {
    return calculateMarketDiffusionInfo(
      this.local[resourceType],
      this.regional[resourceType],
      RESOURCES[resourceType].market,
      this.getLocalRegionalPair(resourceType),
    );
  }

  getRegionalGlobalDiffusionInfo(resourceType: ResourceType): MarketDiffusionInfo {
    return calculateMarketDiffusionInfo(
      this.regional[resourceType],
      this.global[resourceType],
      RESOURCES[resourceType].market,
      this.getRegionalGlobalPair(resourceType),
    );
  }

  getLocalRegionalDiffusionDetails(resourceType: ResourceType, elapsedMilliseconds?: number): MarketDiffusionDetails {
    return calculateMarketDiffusionDetails(
      this.local[resourceType],
      this.regional[resourceType],
      RESOURCES[resourceType].market,
      this.getLocalRegionalPair(resourceType),
      elapsedMilliseconds,
    );
  }

  getRegionalGlobalDiffusionDetails(resourceType: ResourceType, elapsedMilliseconds?: number): MarketDiffusionDetails {
    return calculateMarketDiffusionDetails(
      this.regional[resourceType],
      this.global[resourceType],
      RESOURCES[resourceType].market,
      this.getRegionalGlobalPair(resourceType),
      elapsedMilliseconds,
    );
  }

  buyFromLocal(resourceType: ResourceType, requestedAmount: number): MarketTradeResult {
    const unitPrice = this.getLocalPrice(resourceType);
    if (!isPositiveFinite(requestedAmount) || this.local[resourceType].supply < requestedAmount) return { success: false, amount: 0, unitPrice, quality: this.local[resourceType].quality };
    this.local[resourceType].supply -= requestedAmount;
    return { success: true, amount: requestedAmount, unitPrice, quality: this.local[resourceType].quality };
  }

  sellToLocal(resourceType: ResourceType, amount: number, quality: number): MarketTradeResult {
    const unitPrice = this.getLocalSalePrice(resourceType, quality);
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

  diffuse(elapsedMilliseconds?: number): void {
    for (const resourceType of RESOURCE_TYPES) {
      this.applyDiffusion(this.getLocalRegionalDiffusionDetails(resourceType, elapsedMilliseconds), this.local[resourceType], this.regional[resourceType]);
      this.applyDiffusion(this.getRegionalGlobalDiffusionDetails(resourceType, elapsedMilliseconds), this.regional[resourceType], this.global[resourceType]);
    }
  }

  setAutomation(resourceType: ResourceType, updates: Partial<MarketAutomation>): boolean {
    const current = this.automation[resourceType];
    const next = { ...current, ...updates };
    if (!isNonNegativeFinite(next.autoBuyMaxUnitPrice) || !isNonNegativeFinite(next.autoBuyTargetInventory) || !isAutoTradeInterval(next.autoTradeIntervalMs) || !isNonNegativeFinite(next.autoSellMaxPerMinute) || !isNonNegativeFinite(next.autoSellMinKeep) || !isNonNegativeFinite(next.autoSellMinUnitPrice)) return false;
    this.automation[resourceType] = next;
    return true;
  }

  toSnapshot(): MarketSnapshot {
    return {
      local: Object.fromEntries(RESOURCE_TYPES.map((type) => [type, { ...this.local[type] }])) as Record<ResourceType, MarketPoolEntry>,
      regional: Object.fromEntries(RESOURCE_TYPES.map((type) => [type, { ...this.regional[type] }])) as Record<ResourceType, MarketPoolEntry>,
      global: Object.fromEntries(RESOURCE_TYPES.map((type) => [type, { ...this.global[type] }])) as Record<ResourceType, MarketPoolEntry>,
      automation: Object.fromEntries(RESOURCE_TYPES.map((type) => [type, { ...this.automation[type] }])) as Record<ResourceType, MarketAutomation>,
    };
  }

  clone(): Market {
    const clone = new Market(this.toSnapshot());
    clone.localMarketDepthMultiplier = this.localMarketDepthMultiplier;
    clone.localRegionalDiffusionMultiplier = this.localRegionalDiffusionMultiplier;
    return clone;
  }
  static fromSnapshot(snapshot: MarketSnapshot): Market { return new Market(snapshot); }

  private restore(snapshot: MarketSnapshot): void {
    for (const resourceType of RESOURCE_TYPES) {
      const local = snapshot.local[resourceType];
      const regional = snapshot.regional[resourceType];
      const global = snapshot.global[resourceType];
      const automation = snapshot.automation[resourceType];
      if (local && isNonNegativeFinite(local.supply) && isPositiveFinite(local.quality)) this.local[resourceType] = { ...local };
      if (regional && isNonNegativeFinite(regional.supply) && isPositiveFinite(regional.quality)) this.regional[resourceType] = { ...regional };
      if (global && isNonNegativeFinite(global.supply) && isPositiveFinite(global.quality)) this.global[resourceType] = { ...global };
      if (automation && typeof automation.autoBuyEnabled === 'boolean' && typeof automation.autoSellEnabled === 'boolean'
        && isNonNegativeFinite(automation.autoBuyMaxUnitPrice) && isNonNegativeFinite(automation.autoBuyTargetInventory) && isAutoTradeInterval(automation.autoTradeIntervalMs) && isNonNegativeFinite(automation.autoSellMaxPerMinute) && isNonNegativeFinite(automation.autoSellMinKeep) && isNonNegativeFinite(automation.autoSellMinUnitPrice)) this.automation[resourceType] = { ...automation };
    }
  }

  private getLocalRegionalPair(resourceType: ResourceType) {
    const definition = RESOURCES[resourceType].market;
    return {
      lowerMarket: 'local' as const,
      higherMarket: 'regional' as const,
      lowerBenchmarkSupply: definition.localBenchmarkSupply * this.localMarketDepthMultiplier,
      rateBaseSupply: definition.regionalInitialSupply,
      diffusionMultiplier: this.localRegionalDiffusionMultiplier,
      higherBenchmarkSupply: definition.regionalBenchmarkSupply,
    };
  }

  private getRegionalGlobalPair(resourceType: ResourceType) {
    const definition = RESOURCES[resourceType].market;
    return {
      lowerMarket: 'regional' as const,
      higherMarket: 'global' as const,
      lowerBenchmarkSupply: definition.regionalBenchmarkSupply,
      rateBaseSupply: definition.regionalInitialSupply,
      diffusionMultiplier: 1,
      higherBenchmarkSupply: definition.globalBenchmarkSupply,
    };
  }

  private applyDiffusion(info: MarketDiffusionDetails, lower: MarketPoolEntry, higher: MarketPoolEntry): void {
    if (info.direction === 'none' || info.amount <= 0) return;
    const destination = info.direction === `to-${info.lowerMarket}` ? lower : higher;
    const source = destination === lower ? higher : lower;
    const transferred = Math.min(info.amount, source.supply);
    if (transferred <= 0) return;
    destination.quality = mixQuality(destination, transferred, source.quality);
    destination.supply += transferred;
    source.supply -= transferred;
  }
}
