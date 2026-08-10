import { describe, expect, it } from 'vitest';
import { Market } from './market';
import { MARKET_AUTOTRADE_DEFAULT_INTERVAL_MS } from './marketConstants';
import { RESOURCE_TYPES, ResourceType } from '../resources';

describe('Market regional tier', () => {
  it('starts every tier at the same price while retaining the former local supply regionally', () => {
    const market = new Market();

    for (const resourceType of RESOURCE_TYPES) {
      expect(market.getLocalPrice(resourceType)).toBeCloseTo(market.getRegionalPrice(resourceType));
      expect(market.getRegionalPrice(resourceType)).toBeCloseTo(market.getGlobalPrice(resourceType));
    }

    expect(market.getLocalEntry(ResourceType.Grain).supply).toBe(10_000);
    expect(market.getRegionalEntry(ResourceType.Grain).supply).toBe(100_000);
    expect(market.getAutomation(ResourceType.Grain).autoTradeIntervalMs).toBe(MARKET_AUTOTRADE_DEFAULT_INTERVAL_MS);
  });

  it('diffuses between both adjacent tiers without changing total supply', () => {
    const market = new Market();
    const snapshot = market.toSnapshot();
    snapshot.local[ResourceType.Grain].supply = 2_500;
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
});
