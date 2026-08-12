import { describe, expect, it } from 'vitest';
import { Market } from '@/game/market';
import { MARKET_AUTOTRADE_DEFAULT_INTERVAL_MS, MARKET_DIFFUSION_INTERVAL_MS } from '@/game/market/marketConstants';
import { RESOURCE_TYPES, ResourceType } from '@/game/resources';

describe('Market regional tier', () => {
  it('starts every tier at the same price while retaining the former local supply regionally', () => {
    const market = new Market();

    for (const resourceType of RESOURCE_TYPES) {
      expect(market.getLocalPrice(resourceType)).toBeCloseTo(market.getRegionalPrice(resourceType));
      expect(market.getRegionalPrice(resourceType)).toBeCloseTo(market.getGlobalPrice(resourceType));
    }

    expect(market.getLocalEntry(ResourceType.Grain).supply).toBe(1_000);
    expect(market.getRegionalEntry(ResourceType.Grain).supply).toBe(100_000);
    expect(market.getAutomation(ResourceType.Grain).autoTradeIntervalMs).toBe(MARKET_AUTOTRADE_DEFAULT_INTERVAL_MS);
  });

  it('diffuses between both adjacent tiers without changing total supply', () => {
    const market = new Market();
    const snapshot = market.toSnapshot();
    snapshot.local[ResourceType.Grain].supply = 250;
    snapshot.regional[ResourceType.Grain].supply = 50_000;
    const perturbed = Market.fromSnapshot(snapshot);
    const totalBefore = perturbed.getLocalEntry(ResourceType.Grain).supply
      + perturbed.getRegionalEntry(ResourceType.Grain).supply
      + perturbed.getGlobalEntry(ResourceType.Grain).supply;

    expect(perturbed.getLocalRegionalDiffusionInfo(ResourceType.Grain).direction).toBe('to-local');
    expect(perturbed.getRegionalGlobalDiffusionInfo(ResourceType.Grain).direction).toBe('to-regional');
    perturbed.diffuse();

    const totalAfter = perturbed.getLocalEntry(ResourceType.Grain).supply
      + perturbed.getRegionalEntry(ResourceType.Grain).supply
      + perturbed.getGlobalEntry(ResourceType.Grain).supply;
    expect(totalAfter).toBeCloseTo(totalBefore);
  });

  it('uses equal diffusion pressure for equal high and low price divergences', () => {
    const highPriceSnapshot = new Market().toSnapshot();
    highPriceSnapshot.local[ResourceType.Grain].supply = 100;
    const lowPriceSnapshot = new Market().toSnapshot();
    lowPriceSnapshot.local[ResourceType.Grain].supply = 10_000;

    const highPriceDetails = Market.fromSnapshot(highPriceSnapshot).getLocalRegionalDiffusionDetails(ResourceType.Grain);
    const lowPriceDetails = Market.fromSnapshot(lowPriceSnapshot).getLocalRegionalDiffusionDetails(ResourceType.Grain);

    expect(highPriceDetails.direction).toBe('to-local');
    expect(lowPriceDetails.direction).toBe('to-regional');
    expect(highPriceDetails.priceGap).toBeCloseTo(9);
    expect(lowPriceDetails.priceGap).toBeCloseTo(9);
    expect(highPriceDetails.rawAmount).toBeCloseTo(lowPriceDetails.rawAmount);
  });

  it('uses regional initial supply as the local-regional diffusion rate base', () => {
    const snapshot = new Market().toSnapshot();
    snapshot.local[ResourceType.Grain].supply = 1_198.47;
    snapshot.regional[ResourceType.Grain].supply = 100_000.59;

    const details = Market.fromSnapshot(snapshot).getLocalRegionalDiffusionDetails(ResourceType.Grain);

    expect(details.direction).toBe('to-regional');
    expect(details.rawAmount).toBeGreaterThan(20);
    expect(details.rawAmount).toBeLessThan(21);
  });

  it('applies market diffusion research only to local-regional raw requests', () => {
    const snapshot = new Market().toSnapshot();
    snapshot.local[ResourceType.Grain].supply = 1_198.47;
    snapshot.regional[ResourceType.Grain].supply = 100_000.59;
    const market = Market.fromSnapshot(snapshot);
    const localRegionalBefore = market.getLocalRegionalDiffusionDetails(ResourceType.Grain);
    const regionalGlobalBefore = market.getRegionalGlobalDiffusionDetails(ResourceType.Grain);

    expect(market.setLocalRegionalDiffusionMultiplier(4)).toBe(true);

    expect(market.getLocalRegionalDiffusionDetails(ResourceType.Grain).rawAmount).toBeCloseTo(localRegionalBefore.rawAmount * 4);
    expect(market.getRegionalGlobalDiffusionDetails(ResourceType.Grain).rawAmount).toBeCloseTo(regionalGlobalBefore.rawAmount);
  });

  it('scales five-second diffusion while preserving the 50% per-minute equilibrium cap', () => {
    const snapshot = new Market().toSnapshot();
    snapshot.local[ResourceType.Grain].supply = 1;
    const market = Market.fromSnapshot(snapshot);
    const perMinute = market.getLocalRegionalDiffusionDetails(ResourceType.Grain);
    const perInterval = market.getLocalRegionalDiffusionDetails(ResourceType.Grain, MARKET_DIFFUSION_INTERVAL_MS);
    const equilibriumDistance = perMinute.lowerTargetSupply - snapshot.local[ResourceType.Grain].supply;

    expect(perInterval.rawAmount).toBeCloseTo(perMinute.rawAmount / 12);
    expect(perMinute.amount).toBeCloseTo(equilibriumDistance * 0.5);
    expect(perInterval.amount).toBeCloseTo(equilibriumDistance * (1 - 0.5 ** (1 / 12)));
  });

  it('expands local market depth without changing its price', () => {
    const market = new Market();
    const priceBefore = market.getLocalPrice(ResourceType.Grain);
    const supplyBefore = market.getLocalEntry(ResourceType.Grain).supply;

    expect(market.setLocalMarketDepthMultiplier(1.5)).toBe(true);
    expect(market.getLocalEntry(ResourceType.Grain).supply).toBeCloseTo(supplyBefore * 1.5);
    expect(market.getLocalPrice(ResourceType.Grain)).toBeCloseTo(priceBefore);
  });
});
