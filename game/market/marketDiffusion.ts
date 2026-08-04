import type { ResourceMarketDefinition } from '@/game/resources';
import { MARKET_DIFFUSION_CURVATURE, MARKET_DIFFUSION_DIVISOR, MARKET_DIFFUSION_MAX_EQUILIBRIUM_CORRECTION, MARKET_DIFFUSION_MAX_URGENCY_MULTIPLIER, MARKET_DIFFUSION_MIN_URGENCY_MULTIPLIER, MARKET_DIFFUSION_URGENCY_ELASTICITY } from './marketConstants';
import type { MarketDiffusionDetails, MarketDiffusionInfo, MarketPoolEntry } from './marketTypes';

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function calculateMarketPrice(benchmarkSupply: number, entry: MarketPoolEntry): number {
  return benchmarkSupply / Math.max(entry.supply, 1) * entry.quality;
}

function calculateEquilibriumLocalSupply(
  local: MarketPoolEntry,
  global: MarketPoolEntry,
  definition: ResourceMarketDefinition,
): number {
  const localPriceWeight = definition.localBenchmarkSupply * local.quality;
  const globalPriceWeight = definition.globalBenchmarkSupply * global.quality;
  const totalSupply = local.supply + global.supply;
  return totalSupply * localPriceWeight / (localPriceWeight + globalPriceWeight);
}

function calculateUrgencyMultiplier(
  localPrice: number,
  globalPrice: number,
  definition: ResourceMarketDefinition,
): number {
  const initialLocalPrice = definition.localBenchmarkSupply / definition.localInitialSupply;
  const initialGlobalPrice = definition.globalBenchmarkSupply / definition.globalInitialSupply;
  const initialReferencePrice = Math.sqrt(initialLocalPrice * initialGlobalPrice);
  const currentReferencePrice = Math.sqrt(localPrice * globalPrice);
  const urgencyRatio = currentReferencePrice / initialReferencePrice;
  return clamp(
    urgencyRatio ** MARKET_DIFFUSION_URGENCY_ELASTICITY,
    MARKET_DIFFUSION_MIN_URGENCY_MULTIPLIER,
    MARKET_DIFFUSION_MAX_URGENCY_MULTIPLIER,
  );
}

/** Calculates read-only local/global market-flow diagnostics without mutating either pool. */
export function calculateMarketDiffusionDetails(
  local: MarketPoolEntry,
  global: MarketPoolEntry,
  definition: ResourceMarketDefinition,
): MarketDiffusionDetails {
  const localPrice = calculateMarketPrice(definition.localBenchmarkSupply, local);
  const globalPrice = calculateMarketPrice(definition.globalBenchmarkSupply, global);
  const priceRatio = globalPrice > 0 ? localPrice / globalPrice : 1;
  const priceGap = Math.abs(priceRatio - 1);
  const equilibriumLocalSupply = calculateEquilibriumLocalSupply(local, global, definition);
  const equilibriumGlobalSupply = local.supply + global.supply - equilibriumLocalSupply;
  const marketUrgencyMultiplier = calculateUrgencyMultiplier(localPrice, globalPrice, definition);

  if (localPrice === globalPrice || globalPrice <= 0) {
    return {
      direction: 'none',
      amount: 0,
      localPrice,
      globalPrice,
      priceRatio,
      priceGap,
      localTargetSupply: equilibriumLocalSupply,
      globalTargetSupply: equilibriumGlobalSupply,
      logisticsMultiplier: definition.logisticsMultiplier,
      valueDensityMultiplier: definition.valueDensityMultiplier,
      marketUrgencyMultiplier,
      rawAmount: 0,
      equilibriumCappedAmount: 0,
    };
  }

  const nonlinearResponse = priceGap * (1 + priceGap) ** MARKET_DIFFUSION_CURVATURE;
  const rawAmount = definition.localInitialSupply
    / MARKET_DIFFUSION_DIVISOR
    * nonlinearResponse
    * definition.logisticsMultiplier
    * definition.valueDensityMultiplier
    * marketUrgencyMultiplier;

  if (localPrice > globalPrice) {
    const equilibriumDistance = Math.max(0, equilibriumLocalSupply - local.supply);
    const equilibriumCappedAmount = Math.min(
      rawAmount,
      equilibriumDistance * MARKET_DIFFUSION_MAX_EQUILIBRIUM_CORRECTION,
    );
    return {
      direction: 'to-local',
      amount: Math.min(equilibriumCappedAmount, global.supply),
      localPrice,
      globalPrice,
      priceRatio,
      priceGap,
      localTargetSupply: equilibriumLocalSupply,
      globalTargetSupply: equilibriumGlobalSupply,
      logisticsMultiplier: definition.logisticsMultiplier,
      valueDensityMultiplier: definition.valueDensityMultiplier,
      marketUrgencyMultiplier,
      rawAmount,
      equilibriumCappedAmount,
    };
  }

  const equilibriumDistance = Math.max(0, local.supply - equilibriumLocalSupply);
  const equilibriumCappedAmount = Math.min(
    rawAmount,
    equilibriumDistance * MARKET_DIFFUSION_MAX_EQUILIBRIUM_CORRECTION,
  );
  return {
    direction: 'to-global',
    amount: Math.min(equilibriumCappedAmount, local.supply),
    localPrice,
    globalPrice,
    priceRatio,
    priceGap,
    localTargetSupply: equilibriumLocalSupply,
    globalTargetSupply: equilibriumGlobalSupply,
    logisticsMultiplier: definition.logisticsMultiplier,
    valueDensityMultiplier: definition.valueDensityMultiplier,
    marketUrgencyMultiplier,
    rawAmount,
    equilibriumCappedAmount,
  };
}

/** Calculates the effective local/global transfer without mutating either market pool. */
export function calculateMarketDiffusionInfo(
  local: MarketPoolEntry,
  global: MarketPoolEntry,
  definition: ResourceMarketDefinition,
): MarketDiffusionInfo {
  const { direction, amount } = calculateMarketDiffusionDetails(local, global, definition);
  return { direction, amount };
}
