import { describe, expect, it } from 'vitest';
import { createStartingGameSnapshot, useGameStore } from '@/game/core/stores';
import { FACILITIES, FacilityType } from '@/game/facilities';
import { RecipeName } from '@/game/recipes';
import { FIRST_FACILITY_RECIPE_RESEARCH_WORK_SPEED_MULTIPLIER } from '@/game/grants';
import { getRecipeResearchProjectId, getResearchProject } from '@/game/research';
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
    expect(useGameStore.getState().resourceFlow.getSummary(ResourceType.Grain, 5_000, 15_000)).toMatchObject({ market: 360, netChange: 360 });
  });
});

describe('facility production cycles', () => {
  it('does not accept unresearched recipes in a facility cycle', () => {
    const state = useGameStore.getState();
    state.restoreSnapshot(createStartingGameSnapshot(0));
    const farm = FACILITIES[FacilityType.Farm];
    state.setAdminBalance(1_000_000);
    state.setInventoryAmount(ResourceType.ConstructionMaterials, farm.constructionMaterialsCost);
    state.setInventoryAmount(ResourceType.IndustrialMachines, farm.industrialMachinesCost);
    expect(state.buildFacility(FacilityType.Farm)).toBe(true);

    expect(state.setFacilityProductionCycle('farm-1', [RecipeName.GrowGrain])).toBe(false);
  });
});

describe('facility construction inputs', () => {
  it('creates the requested standard starting resources', () => {
    const snapshot = createStartingGameSnapshot(0);

    expect(snapshot.finance.balance).toBe(200);
    expect(snapshot.inventory.entries[ResourceType.ConstructionMaterials]?.quantity).toBe(10);
    expect(snapshot.inventory.entries[ResourceType.IndustrialMachines]?.quantity).toBe(3);
  });

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
    expect(useGameStore.getState().resourceFlow.getSummary(ResourceType.ConstructionMaterials, 0, null).facilitySpending).toBe(-farm.constructionMaterialsCost);
    expect(useGameStore.getState().resourceFlow.getSummary(ResourceType.IndustrialMachines, 0, null).facilitySpending).toBe(-farm.industrialMachinesCost);
  });

  it('requires and consumes Construction Materials and Industrial Machines for facility upgrades', () => {
    const state = useGameStore.getState();
    state.restoreSnapshot(createStartingGameSnapshot(0));
    const farm = FACILITIES[FacilityType.Farm];

    expect(state.buildFacility(FacilityType.Farm)).toBe(true);
    state.setAdminBalance(10_000);
    state.setInventoryAmount(ResourceType.ConstructionMaterials, 0);
    state.setInventoryAmount(ResourceType.IndustrialMachines, 0);
    expect(state.upgradeFacility('farm-1', 'speed')).toBe(true);
    expect(useGameStore.getState().inventory.getAmount(ResourceType.ConstructionMaterials)).toBe(0);
    expect(useGameStore.getState().inventory.getAmount(ResourceType.IndustrialMachines)).toBe(0);
  });

  it('automatically buys and consumes all three repair inputs', () => {
    const state = useGameStore.getState();
    state.restoreSnapshot(createStartingGameSnapshot(0));

    expect(state.buildFacility(FacilityType.Farm)).toBe(true);
    useGameStore.getState().facilities.get('farm-1')!.applyConditionLoss(0.5);
    state.setAdminBalance(10_000);
    state.setInventoryAmount(ResourceType.ConstructionMaterials, 0);
    state.setInventoryAmount(ResourceType.IndustrialMachines, 0);

    expect(state.repairFacility('farm-1')).toBe(true);
    expect(useGameStore.getState().facilities.get('farm-1')!.getView().facilityCondition).toBe(1);
    expect(useGameStore.getState().inventory.getAmount(ResourceType.ConstructionMaterials)).toBe(0);
    expect(useGameStore.getState().inventory.getAmount(ResourceType.IndustrialMachines)).toBe(0);
  });

  it('makes the first facility recipe research free and ten times faster', () => {
    const state = useGameStore.getState();
    state.restoreSnapshot(createStartingGameSnapshot(0));
    const projectId = getRecipeResearchProjectId(RecipeName.GrowGrain);
    const project = getResearchProject(projectId)!;

    expect(state.buildFacility(FacilityType.Farm)).toBe(true);
    expect(state.getResearchAvailability(projectId)).toMatchObject({
      cost: 0,
      durationMs: Math.ceil(project.durationMs / FIRST_FACILITY_RECIPE_RESEARCH_WORK_SPEED_MULTIPLIER),
      startable: true,
      usesFreeGrant: true,
    });

    expect(state.startResearch(projectId)).toBe(true);
    expect(useGameStore.getState().research.getActiveProject()?.durationMs).toBe(Math.ceil(project.durationMs / FIRST_FACILITY_RECIPE_RESEARCH_WORK_SPEED_MULTIPLIER));
  });
});
