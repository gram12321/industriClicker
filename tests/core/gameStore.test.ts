import { describe, expect, it } from 'vitest';
import { createStartingGameSnapshot, useGameStore } from '@/game/core/stores';
import { ResourceType } from '@/game/resources';

describe('market autobuy', () => {
  it('partially buys toward its target without exceeding the configured post-purchase price cap', () => {
    const state = useGameStore.getState();
    state.restoreSnapshot(createStartingGameSnapshot(0));
    state.setAdminBalance(1_000_000);
    state.setInventoryAmount(ResourceType.Grain, 0);
    state.setMarketAutomation(ResourceType.Grain, {
      autoBuyEnabled: true,
      autoBuyMaxUnitPrice: 1.25,
      autoBuyTargetInventory: 500,
    });

    state.advanceGameTime(5_000);

    expect(useGameStore.getState().inventory.getAmount(ResourceType.Grain)).toBeCloseTo(360);
    expect(useGameStore.getState().market.getLocalPrice(ResourceType.Grain)).toBeLessThanOrEqual(1.25);
  });
});
