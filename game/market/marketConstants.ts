import { ResourceType } from '../resources/resourceTypes';

export type MarketResourceDefinition = {
  localBenchmarkSupply: number;
  localInitialSupply: number;
  globalBenchmarkSupply: number;
  globalInitialSupply: number;
};

const LOW_VALUE_RESOURCE: MarketResourceDefinition = {
  localBenchmarkSupply: 10_000,
  localInitialSupply: 100_000,
  globalBenchmarkSupply: 100_000,
  globalInitialSupply: 1_000_000,
};

const MEDIUM_VALUE_RESOURCE: MarketResourceDefinition = {
  localBenchmarkSupply: 10_000,
  localInitialSupply: 50_000,
  globalBenchmarkSupply: 100_000,
  globalInitialSupply: 500_000,
};

const HIGH_VALUE_RESOURCE: MarketResourceDefinition = {
  localBenchmarkSupply: 10_000,
  localInitialSupply: 5_000,
  globalBenchmarkSupply: 100_000,
  globalInitialSupply: 50_000,
};

export const MARKET_RESOURCE_DEFINITIONS: Readonly<Record<ResourceType, MarketResourceDefinition>> = {
  [ResourceType.Grain]: LOW_VALUE_RESOURCE,
  [ResourceType.Water]: LOW_VALUE_RESOURCE,
  [ResourceType.Sugar]: LOW_VALUE_RESOURCE,
  [ResourceType.Bread]: MEDIUM_VALUE_RESOURCE,
  [ResourceType.Electricity]: MEDIUM_VALUE_RESOURCE,
  [ResourceType.Coal]: HIGH_VALUE_RESOURCE,
  [ResourceType.Cake]: HIGH_VALUE_RESOURCE,
};

export const MARKET_DEFAULT_QUALITY = 1;
export const MARKET_DIFFUSION_DIVISOR = 1_000;
export const MARKET_SALES_CONTRACT_PREMIUM = 1.2;
export const MARKET_TRADE_MULTIPLIERS = [1, 10, 100] as const;
export const MARKET_AUTOSELL_DEFAULT_MAX_PER_MINUTE = 50;
export const MARKET_AUTOSELL_DEFAULT_MIN_KEEP = 0;
export const MARKET_AUTOBUY_DEFAULT_MAX_PRICE_MULTIPLIER = 2;
