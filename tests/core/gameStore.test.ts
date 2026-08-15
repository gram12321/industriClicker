import { describe, expect, it } from 'vitest';
import { createStartingGameSnapshot, useGameStore } from '@/game/core/stores';
import { FACILITIES, FacilityType } from '@/game/facilities';
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

describe('facility construction inputs', () => {
  it('requires and consumes Industrial Machines alongside land and Construction Materials', () => {
    const state = useGameStore.getState();
    state.restoreSnapshot(createStartingGameSnapshot(0));
    const farm = FACILITIES[FacilityType.Farm];
    state.setInventoryAmount(ResourceType.IndustrialMachines, 0);

    expect(state.buildFacility(FacilityType.Farm)).toBe(false);

    state.setInventoryAmount(ResourceType.IndustrialMachines, farm.industrialMachinesCost);
    expect(state.buildFacility(FacilityType.Farm)).toBe(true);
    expect(useGameStore.getState().inventory.getAmount(ResourceType.ConstructionMaterials)).toBe(10 - farm.constructionMaterialsCost);
    expect(useGameStore.getState().inventory.getAmount(ResourceType.IndustrialMachines)).toBe(0);
  });
});
