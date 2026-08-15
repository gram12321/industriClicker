import { describe, expect, it } from 'vitest';
import { ResourceFlowLedger } from '@/game/inventory';
import { ResourceType } from '@/game/resources';

describe('ResourceFlowLedger', () => {
  it('reports categorized foreground resource changes and a net market total', () => {
    const ledger = new ResourceFlowLedger();
    ledger.record('facility-output', ResourceType.Grain, 12, 10_000);
    ledger.record('facility-input', ResourceType.Grain, -4, 10_000);
    ledger.record('market-buy', ResourceType.Grain, 8, 10_000);
    ledger.record('market-sell', ResourceType.Grain, -3, 10_000);
    ledger.record('customer-order', ResourceType.Grain, -5, 10_000);
    ledger.record('facility-spending', ResourceType.Grain, -2, 10_000);
    ledger.record('reward', ResourceType.Grain, 1, 10_000);

    expect(ledger.getSummary(ResourceType.Grain, 20_000, 15_000)).toEqual({
      customerOrders: -5,
      facilityInput: -4,
      facilityOutput: 12,
      facilitySpending: -2,
      market: 5,
      marketVolume: 11,
      netChange: 7,
      rewards: 1,
    });
  });

  it('keeps the latest foreground hour at second precision while retaining all-time totals', () => {
    const ledger = new ResourceFlowLedger();
    ledger.record('market-buy', ResourceType.Water, 2, 0);
    ledger.record('facility-output', ResourceType.Water, 3, 3_601_000);

    expect(ledger.getSummary(ResourceType.Water, 3_601_000, 60_000).netChange).toBe(3);
    expect(ledger.getSummary(ResourceType.Water, 3_601_000, null).netChange).toBe(5);
    expect(ledger.getLifetimeFacilityOutput(ResourceType.Water)).toBe(3);
    expect(ledger.getTotalLifetimeFacilityOutput()).toBe(3);

    const restored = ResourceFlowLedger.fromSnapshot(ledger.toSnapshot());
    expect(restored.getSummary(ResourceType.Water, 3_601_000, null).netChange).toBe(5);
    expect(restored.getLifetimeFacilityOutputByResource()[ResourceType.Water]).toBe(3);
  });
});
