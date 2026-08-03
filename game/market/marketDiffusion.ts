import type { ResourceMarketDefinition } from '../resources/resourceTypes';
import {
  MARKET_DIFFUSION_CURVATURE,
  MARKET_DIFFUSION_DIVISOR,
  MARKET_DIFFUSION_MAX_EQUILIBRIUM_CORRECTION,
  MARKET_DIFFUSION_MAX_URGENCY_MULTIPLIER,
  MARKET_DIFFUSION_MIN_URGENCY_MULTIPLIER,
  MARKET_DIFFUSION_URGENCY_ELASTICITY,
} from './marketConstants';
import type { MarketDiffusionInfo, MarketPoolEntry } from './marketTypes';

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

/** Calculates the requested local/global transfer without mutating either market pool. */
export function calculateMarketDiffusionInfo(
  local: MarketPoolEntry,
  global: MarketPoolEntry,
  definition: ResourceMarketDefinition,
): MarketDiffusionInfo {
  const localPrice = calculateMarketPrice(definition.localBenchmarkSupply, local);
  const globalPrice = calculateMarketPrice(definition.globalBenchmarkSupply, global);
  if (localPrice === globalPrice || globalPrice <= 0) return { direction: 'none', amount: 0 };

  const priceRatio = localPrice / globalPrice;
  const priceGap = Math.abs(priceRatio - 1);
  const nonlinearResponse = priceGap * (1 + priceGap) ** MARKET_DIFFUSION_CURVATURE;
  const base = definition.localInitialSupply / MARKET_DIFFUSION_DIVISOR;
  const requestedAmount = base
    * nonlinearResponse
    * definition.logisticsMultiplier
    * definition.valueDensityMultiplier
    * calculateUrgencyMultiplier(localPrice, globalPrice, definition);
  const equilibriumLocalSupply = calculateEquilibriumLocalSupply(local, global, definition);

  if (localPrice > globalPrice) {
    const equilibriumDistance = Math.max(0, equilibriumLocalSupply - local.supply);
    return {
      direction: 'to-local',
      amount: Math.min(requestedAmount, equilibriumDistance * MARKET_DIFFUSION_MAX_EQUILIBRIUM_CORRECTION),
    };
  }

  const equilibriumDistance = Math.max(0, local.supply - equilibriumLocalSupply);
  return {
    direction: 'to-global',
    amount: Math.min(requestedAmount, equilibriumDistance * MARKET_DIFFUSION_MAX_EQUILIBRIUM_CORRECTION),
  };
}
