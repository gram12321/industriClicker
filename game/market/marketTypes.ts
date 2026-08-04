import type { ResourceType } from '../resources/resourceTypes';

export type MarketPoolEntry = { supply: number; quality: number };

export type MarketAutomation = {
  autoBuyEnabled: boolean;
  autoBuyMaxUnitPrice: number;
  autoSellEnabled: boolean;
  autoSellMaxPerMinute: number;
  autoSellMinKeep: number;
  autoSellMinUnitPrice: number;
};

export type MarketSnapshot = {
  local: Record<ResourceType, MarketPoolEntry>;
  global: Record<ResourceType, MarketPoolEntry>;
  automation: Record<ResourceType, MarketAutomation>;
};

export type MarketTradeMultiplier = number | 'all';
export type MarketTradeResult = { success: boolean; amount: number; unitPrice: number; quality: number };
export type MarketDiffusionDirection = 'to-local' | 'to-global' | 'none';
export type MarketDiffusionInfo = { direction: MarketDiffusionDirection; amount: number };
export type MarketDiffusionDetails = MarketDiffusionInfo & {
  localPrice: number;
  globalPrice: number;
  priceRatio: number;
  priceGap: number;
  localTargetSupply: number;
  globalTargetSupply: number;
  logisticsMultiplier: number;
  valueDensityMultiplier: number;
  marketUrgencyMultiplier: number;
  rawAmount: number;
  equilibriumCappedAmount: number;
};
