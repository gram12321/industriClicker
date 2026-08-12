import type { ResourceMarketDefinition } from '@/game/resources';
import { MARKET_DIFFUSION_CURVATURE, MARKET_DIFFUSION_DIVISOR, MARKET_DIFFUSION_MAX_EQUILIBRIUM_CORRECTION, MARKET_DIFFUSION_REFERENCE_INTERVAL_MS } from './marketConstants';
import type { MarketDiffusionDetails, MarketDiffusionDirection, MarketDiffusionInfo, MarketPoolEntry, MarketPoolKind } from './marketTypes';

export function calculateMarketPrice(benchmarkSupply: number, entry: MarketPoolEntry): number {
  return benchmarkSupply / Math.max(entry.supply, 1) * entry.quality;
}

type MarketDiffusionPair = {
  lowerMarket: MarketPoolKind;
  higherMarket: MarketPoolKind;
  lowerBenchmarkSupply: number;
  rateBaseSupply: number;
  diffusionMultiplier: number;
  higherBenchmarkSupply: number;
};

function calculateEquilibriumLowerSupply(
  lower: MarketPoolEntry,
  higher: MarketPoolEntry,
  pair: MarketDiffusionPair,
): number {
  const lowerPriceWeight = pair.lowerBenchmarkSupply * lower.quality;
  const higherPriceWeight = pair.higherBenchmarkSupply * higher.quality;
  const totalSupply = lower.supply + higher.supply;
  return totalSupply * lowerPriceWeight / (lowerPriceWeight + higherPriceWeight);
}

function getDirection(lowerMarket: MarketPoolKind, higherMarket: MarketPoolKind, isToLower: boolean): MarketDiffusionDirection {
  return isToLower ? `to-${lowerMarket}` as MarketDiffusionDirection : `to-${higherMarket}` as MarketDiffusionDirection;
}

/** Calculates read-only diagnostics for one adjacent market pair without mutating either pool. */
export function calculateMarketDiffusionDetails(
  lower: MarketPoolEntry,
  higher: MarketPoolEntry,
  definition: ResourceMarketDefinition,
  pair: MarketDiffusionPair,
  elapsedMilliseconds = MARKET_DIFFUSION_REFERENCE_INTERVAL_MS,
): MarketDiffusionDetails {
  const lowerPrice = calculateMarketPrice(pair.lowerBenchmarkSupply, lower);
  const higherPrice = calculateMarketPrice(pair.higherBenchmarkSupply, higher);
  const priceRatio = higherPrice > 0 ? lowerPrice / higherPrice : 1;
  const priceGap = Math.max(priceRatio, 1 / priceRatio) - 1;
  const equilibriumLowerSupply = calculateEquilibriumLowerSupply(lower, higher, pair);
  const equilibriumHigherSupply = lower.supply + higher.supply - equilibriumLowerSupply;
  const timeScale = Number.isFinite(elapsedMilliseconds) && elapsedMilliseconds > 0
    ? elapsedMilliseconds / MARKET_DIFFUSION_REFERENCE_INTERVAL_MS
    : 0;

  if (lowerPrice === higherPrice || higherPrice <= 0) {
    return {
      direction: 'none',
      amount: 0,
      lowerMarket: pair.lowerMarket,
      higherMarket: pair.higherMarket,
      lowerPrice,
      higherPrice,
      priceRatio,
      priceGap,
      lowerTargetSupply: equilibriumLowerSupply,
      higherTargetSupply: equilibriumHigherSupply,
      logisticsMultiplier: definition.logisticsMultiplier,
      valueDensityMultiplier: definition.valueDensityMultiplier,
      diffusionMultiplier: pair.diffusionMultiplier,
      rawAmount: 0,
      equilibriumCappedAmount: 0,
    };
  }

  const nonlinearResponse = priceGap * (1 + priceGap) ** MARKET_DIFFUSION_CURVATURE;
  const rawAmount = pair.rateBaseSupply
    / MARKET_DIFFUSION_DIVISOR
    * nonlinearResponse
    * definition.logisticsMultiplier
    * definition.valueDensityMultiplier
    * pair.diffusionMultiplier
    * timeScale;

  if (lowerPrice > higherPrice) {
    const equilibriumDistance = Math.max(0, equilibriumLowerSupply - lower.supply);
    const equilibriumCappedAmount = Math.min(
      rawAmount,
      equilibriumDistance * (1 - (1 - MARKET_DIFFUSION_MAX_EQUILIBRIUM_CORRECTION) ** timeScale),
    );
    return {
      direction: getDirection(pair.lowerMarket, pair.higherMarket, true),
      amount: Math.min(equilibriumCappedAmount, higher.supply),
      lowerMarket: pair.lowerMarket,
      higherMarket: pair.higherMarket,
      lowerPrice,
      higherPrice,
      priceRatio,
      priceGap,
      lowerTargetSupply: equilibriumLowerSupply,
      higherTargetSupply: equilibriumHigherSupply,
      logisticsMultiplier: definition.logisticsMultiplier,
      valueDensityMultiplier: definition.valueDensityMultiplier,
      diffusionMultiplier: pair.diffusionMultiplier,
      rawAmount,
      equilibriumCappedAmount,
    };
  }

  const equilibriumDistance = Math.max(0, lower.supply - equilibriumLowerSupply);
  const equilibriumCappedAmount = Math.min(
    rawAmount,
    equilibriumDistance * (1 - (1 - MARKET_DIFFUSION_MAX_EQUILIBRIUM_CORRECTION) ** timeScale),
  );
  return {
    direction: getDirection(pair.lowerMarket, pair.higherMarket, false),
    amount: Math.min(equilibriumCappedAmount, lower.supply),
    lowerMarket: pair.lowerMarket,
    higherMarket: pair.higherMarket,
    lowerPrice,
    higherPrice,
    priceRatio,
    priceGap,
    lowerTargetSupply: equilibriumLowerSupply,
    higherTargetSupply: equilibriumHigherSupply,
    logisticsMultiplier: definition.logisticsMultiplier,
    valueDensityMultiplier: definition.valueDensityMultiplier,
    diffusionMultiplier: pair.diffusionMultiplier,
    rawAmount,
    equilibriumCappedAmount,
  };
}

/** Calculates the effective transfer for one adjacent market pair without mutating either pool. */
export function calculateMarketDiffusionInfo(
  lower: MarketPoolEntry,
  higher: MarketPoolEntry,
  definition: ResourceMarketDefinition,
  pair: MarketDiffusionPair,
  elapsedMilliseconds = MARKET_DIFFUSION_REFERENCE_INTERVAL_MS,
): MarketDiffusionInfo {
  const { direction, amount } = calculateMarketDiffusionDetails(lower, higher, definition, pair, elapsedMilliseconds);
  return { direction, amount };
}
