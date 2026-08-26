import type { ResourceType } from '../resources/resourceTypes';
import type { MarketAutoTradeIntervalMs } from './marketConstants';

export type MarketPoolEntry = { supply: number; quality: number };
export type MarketPoolKind = 'local' | 'regional' | 'global';

export type MarketAutomation = {
  autoBuyEnabled: boolean;
  autoBuyMaxUnitPrice: number;
  autoBuyAtInventory: number | 'any';
  autoBuyToInventory: number;
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
  /** Quality-adjusted trade prices for the two pools. */
  lowerPrice: number;
  higherPrice: number;
  /** Supply divided by benchmark capacity. Diffusion moves from the higher fill ratio to the lower. */
  lowerFillRatio: number;
  higherFillRatio: number;
  saturationRatio: number;
  saturationGap: number;
  lowerTargetSupply: number;
  higherTargetSupply: number;
  logisticsMultiplier: number;
  valueDensityMultiplier: number;
  diffusionMultiplier: number;
  rawAmount: number;
  equilibriumCappedAmount: number;
  /** Conserved quality average once this adjacent pair has fully mixed. */
  equilibriumQuality: number;
  /** Signed quality change per foreground minute in each pool. */
  lowerQualityChangePerMinute: number;
  higherQualityChangePerMinute: number;
};
