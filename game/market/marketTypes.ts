import type { ResourceType } from '../resources/resourceTypes';

export type MarketPoolEntry = { supply: number; quality: number };

export type MarketAutomation = {
  autoBuyEnabled: boolean;
  autoBuyMaxUnitPrice: number;
  autoSellEnabled: boolean;
  autoSellMaxPerMinute: number;
  autoSellMinKeep: number;
};

export type MarketSnapshot = {
  local: Record<ResourceType, MarketPoolEntry>;
  global: Record<ResourceType, MarketPoolEntry>;
  automation: Record<ResourceType, MarketAutomation>;
};

export type MarketTradeMultiplier = 1 | 10 | 100 | 'all';
export type MarketTradeResult = { success: boolean; amount: number; unitPrice: number; quality: number };
export type MarketDiffusionDirection = 'to-local' | 'to-global' | 'none';
export type MarketDiffusionInfo = { direction: MarketDiffusionDirection; amount: number; localPrice: number; globalPrice: number };
