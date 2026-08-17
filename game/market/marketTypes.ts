import type { ResourceType } from '../resources/resourceTypes';
import type { MarketAutoTradeIntervalMs } from './marketConstants';

export type MarketPoolEntry = { supply: number; quality: number };
export type MarketPoolKind = 'local' | 'regional' | 'global';

export type MarketAutomation = {
  autoBuyEnabled: boolean;
  autoBuyMaxUnitPrice: number;
  autoBuyTargetInventory: number;
  autoSellEnabled: boolean;
  autoTradeIntervalMs: MarketAutoTradeIntervalMs;
  autoSellMaxPerMinute: number;
  autoSellMinKeep: number;
  autoSellMinUnitPrice: number;
};

export type LocalMarketNetworkActivation = {
  projectId: string;
  totalDepthIncrease: number;
  appliedDepthIncrease: number;
};

export type MarketSnapshot = {
  local: Record<ResourceType, MarketPoolEntry>;
  regional: Record<ResourceType, MarketPoolEntry>;
  global: Record<ResourceType, MarketPoolEntry>;
  automation: Record<ResourceType, MarketAutomation>;
  localMarketDepthMultiplier: number;
  localMarketNetworkActivations: LocalMarketNetworkActivation[];
};

export type MarketTradeMultiplier = number | 'all';
/** The execution price is the average of the local price before and after the trade. */
export type MarketTradeResult = { success: boolean; amount: number; unitPrice: number; quality: number };
export type MarketDiffusionDirection = 'to-local' | 'to-regional' | 'to-global' | 'none';
export type MarketDiffusionInfo = { direction: MarketDiffusionDirection; amount: number };
export type MarketDiffusionDetails = MarketDiffusionInfo & {
  lowerMarket: MarketPoolKind;
  higherMarket: MarketPoolKind;
  lowerPrice: number;
  higherPrice: number;
  priceRatio: number;
  priceGap: number;
  lowerTargetSupply: number;
  higherTargetSupply: number;
  logisticsMultiplier: number;
  valueDensityMultiplier: number;
  diffusionMultiplier: number;
  rawAmount: number;
  equilibriumCappedAmount: number;
};
