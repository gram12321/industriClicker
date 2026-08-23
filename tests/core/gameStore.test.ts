import { describe, expect, it } from 'vitest';
import { createStartingGameSnapshot, useGameStore } from '@/game/core/stores';
import { isGameSnapshot } from '@/game/core/state';
import { FACILITIES, FacilityType } from '@/game/facilities';
import { calculateAssets } from '@/game/finance';
import { RecipeName } from '@/game/recipes';
import { FIRST_FACILITY_RECIPE_RESEARCH_WORK_SPEED_MULTIPLIER } from '@/game/grants';
import { calculateCompanyAssetsPrestige, PRESTIGE_COMPANY_ASSETS_SOURCE_ID } from '@/game/prestige';
import { getRecipeResearchProjectId, getResearchProject } from '@/game/research';
import { ResourceType } from '@/game/resources';

describe('market autobuy', () => {
  it('buys from the configured threshold to the configured inventory target', () => {
    const state = useGameStore.getState();
    state.restoreSnapshot(createStartingGameSnapshot(0));
    state.setAdminBalance(1_000_000);
    state.setInventoryAmount(ResourceType.Grain, 0);
    state.setMarketAutomation(ResourceType.Grain, {
      autoBuyEnabled: true,
      autoBuyMaxUnitPrice: 1.25,
      autoBuyAtInventory: 10,
      autoBuyToInventory: 500,
    });

    state.advanceGameTime(5_000);

    expect(useGameStore.getState().inventory.getAmount(ResourceType.Grain)).toBeCloseTo(360);
    expect(useGameStore.getState().market.getLocalPrice(ResourceType.Grain)).toBeLessThanOrEqual(1.25);
    expect(useGameStore.getState().resourceFlow.getSummary(ResourceType.Grain, 5_000, 15_000)).toMatchObject({ market: 360, netChange: 360 });
  });

  it('does not create an autobuy finance transaction while above the buy-at threshold', () => {
    const state = useGameStore.getState();
    const snapshot = createStartingGameSnapshot(0);
    snapshot.inventory.entries[ResourceType.Grain].quantity = 11;
    state.restoreSnapshot(snapshot);
    state.setAdminBalance(1_000_000);
    state.setMarketAutomation(ResourceType.Grain, {
      autoBuyEnabled: true,
      autoBuyAtInventory: 10,
      autoBuyToInventory: 20,
    });

    state.advanceGameTime(5_000);

    expect(useGameStore.getState().inventory.getAmount(ResourceType.Grain)).toBe(11);
    expect(useGameStore.getState().finance.getTransactions().filter((transaction) => transaction.source === 'market-purchase')).toHaveLength(0);
  });

  it('allows Any as the autobuy threshold', () => {
    const state = useGameStore.getState();
    const snapshot = createStartingGameSnapshot(0);
    snapshot.inventory.entries[ResourceType.Grain].quantity = 11;
    state.restoreSnapshot(snapshot);
    state.setAdminBalance(1_000_000);
    state.setMarketAutomation(ResourceType.Grain, {
      autoBuyEnabled: true,
      autoBuyAtInventory: 'any',
      autoBuyToInventory: 20,
    });

    state.advanceGameTime(5_000);

    expect(useGameStore.getState().inventory.getAmount(ResourceType.Grain)).toBeGreaterThan(11);
  });

  it('buys the largest affordable amount when cash cannot reach the buy-to target', () => {
    const state = useGameStore.getState();
    state.restoreSnapshot(createStartingGameSnapshot(0));
    state.setAdminBalance(100);
    state.setMarketAutomation(ResourceType.Grain, {
      autoBuyEnabled: true,
      autoBuyAtInventory: 0,
      autoBuyToInventory: 500,
    });

    state.advanceGameTime(5_000);

    const currentState = useGameStore.getState();
    expect(currentState.inventory.getAmount(ResourceType.Grain)).toBeGreaterThan(0);
    expect(currentState.inventory.getAmount(ResourceType.Grain)).toBeLessThan(500);
    expect(currentState.finance.getBalance()).toBeGreaterThanOrEqual(0);
    expect(currentState.finance.getTransactions().filter((transaction) => transaction.source === 'market-purchase')).toHaveLength(1);
  });
});

describe('market sales', () => {
  it('records staff wages every foreground second and pauses a facility when its next wage cannot be paid', () => {
    const state = useGameStore.getState();
    const definition = FACILITIES[FacilityType.Farm];
    state.restoreSnapshot(createStartingGameSnapshot(0));
    state.setAdminBalance(1_000);
    state.setInventoryAmount(ResourceType.ConstructionMaterials, definition.constructionMaterialsCost);
    state.setInventoryAmount(ResourceType.IndustrialMachines, definition.industrialMachinesCost);
    expect(state.buildFacility(FacilityType.Farm)).toBe(true);
    expect(state.setFacilityStaffWage('farm-1', 60)).toBe(true);
    const farm = useGameStore.getState().facilities.get('farm-1')!;
    expect(farm.setAssignedWorkers(1)).toBe(true);
    expect(farm.setActiveRecipe(RecipeName.GrowGrain)).toBe(true);
    state.setAdminBalance(1);
    const wageTransactionsBefore = useGameStore.getState().finance.getTransactions().filter((transaction) => transaction.source === 'facility-staff-wage').length;

    state.advanceGameTime(1_000);

    expect(useGameStore.getState().finance.getBalance()).toBeCloseTo(0);
    expect(useGameStore.getState().finance.getTransactions().filter((transaction) => transaction.source === 'facility-staff-wage')).toHaveLength(wageTransactionsBefore + 1);
    expect(useGameStore.getState().facilities.get('farm-1')!.getView().isActive).toBe(true);

    state.advanceGameTime(1_000);

    expect(useGameStore.getState().finance.getTransactions().filter((transaction) => transaction.source === 'facility-staff-wage')).toHaveLength(wageTransactionsBefore + 1);
    expect(useGameStore.getState().facilities.get('farm-1')!.getView().isActive).toBe(false);
  });

  it('rejects snapshots missing current inventory or resource-flow fields', () => {
    const snapshot = createStartingGameSnapshot(0);
    expect(isGameSnapshot(snapshot)).toBe(true);
    const { highestFacilityOutputQuality: _highestFacilityOutputQuality, ...staleResourceFlow } = snapshot.resourceFlow;
    expect(isGameSnapshot({ ...snapshot, resourceFlow: staleResourceFlow })).toBe(false);
    const { sourceCostPerUnit: _sourceCostPerUnit, ...staleInventoryEntry } = snapshot.inventory.entries[ResourceType.Grain];
    expect(isGameSnapshot({
      ...snapshot,
      inventory: { entries: { ...snapshot.inventory.entries, [ResourceType.Grain]: staleInventoryEntry } },
    })).toBe(false);
  });

  it('rejects facility saves without Finance-owned historical accounting', () => {
    const state = useGameStore.getState();
    const definition = FACILITIES[FacilityType.Farm];
    state.restoreSnapshot(createStartingGameSnapshot(0));
    state.setAdminBalance(1_000);
    state.setInventoryAmount(ResourceType.ConstructionMaterials, definition.constructionMaterialsCost);
    state.setInventoryAmount(ResourceType.IndustrialMachines, definition.industrialMachinesCost);
    expect(state.buildFacility(FacilityType.Farm)).toBe(true);

    const snapshot = useGameStore.getState().createSnapshot();
    expect(isGameSnapshot(snapshot)).toBe(true);
    const staleTransactions = snapshot.finance.transactions.map(({ facilityAccounting: _facilityAccounting, ...transaction }) => transaction);

    expect(isGameSnapshot({ ...snapshot, finance: { ...snapshot.finance, transactions: staleTransactions } })).toBe(false);
  });

  it('persists staffing transactions and current staff state as a valid snapshot', () => {
    const state = useGameStore.getState();
    const definition = FACILITIES[FacilityType.Farm];
    state.restoreSnapshot(createStartingGameSnapshot(0));
    state.setAdminBalance(10_000);
    state.setInventoryAmount(ResourceType.ConstructionMaterials, definition.constructionMaterialsCost);
    state.setInventoryAmount(ResourceType.IndustrialMachines, definition.industrialMachinesCost);
    expect(state.buildFacility(FacilityType.Farm)).toBe(true);
    expect(state.setFacilityStaffing('farm-1', 3, 1)).toBe(true);

    const snapshot = useGameStore.getState().createSnapshot();
    expect(isGameSnapshot(snapshot)).toBe(true);
    expect(snapshot.finance.transactions.some((transaction) => transaction.source === 'facility-staffing')).toBe(true);
    expect(snapshot.facilities.facilities[0]?.pendingStaffingChange?.targetWorkers).toBe(3);
  });

  it('keeps staffing and wage unchanged when an atomic staffing command cannot pay', () => {
    const state = useGameStore.getState();
    const definition = FACILITIES[FacilityType.Farm];
    state.restoreSnapshot(createStartingGameSnapshot(0));
    state.setAdminBalance(10_000);
    state.setInventoryAmount(ResourceType.ConstructionMaterials, definition.constructionMaterialsCost);
    state.setInventoryAmount(ResourceType.IndustrialMachines, definition.industrialMachinesCost);
    expect(state.buildFacility(FacilityType.Farm)).toBe(true);
    state.setAdminBalance(0);
    expect(state.setFacilityStaffing('farm-1', 4, 1)).toBe(false);

    const snapshot = useGameStore.getState().createSnapshot();
    const facility = snapshot.facilities.facilities[0]!;
    expect(facility.assignedWorkers).toBe(definition.baseWorkers);
    expect(facility.staffWagePerWorkerPerMinute).toBe(1);
    expect(facility.pendingStaffingChange).toBeNull();
    expect(snapshot.finance.transactions.filter((transaction) => transaction.source === 'facility-staffing')).toHaveLength(0);
  });

  it('rejects impossible staff activity combinations and out-of-range wages', () => {
    const state = useGameStore.getState();
    state.restoreSnapshot(createStartingGameSnapshot(0));
    state.setAdminBalance(10_000);
    const definition = FACILITIES[FacilityType.Farm];
    state.setInventoryAmount(ResourceType.ConstructionMaterials, definition.constructionMaterialsCost);
    state.setInventoryAmount(ResourceType.IndustrialMachines, definition.industrialMachinesCost);
    expect(state.buildFacility(FacilityType.Farm)).toBe(true);
    const current = useGameStore.getState().createSnapshot();
    const savedFacility = current.facilities.facilities[0]!;
    const withInvalidActivities = { ...current, facilities: { ...current.facilities, facilities: [{ ...savedFacility,
      pendingStaffingChange: { targetWorkers: savedFacility.assignedWorkers!, initialWorkers: savedFacility.assignedWorkers!, startedAtGameTimeMs: 1, completesAtGameTimeMs: 2 },
      staffTraining: { workers: 1, startedAtGameTimeMs: 1, completesAtGameTimeMs: 2 },
    }] } };
    expect(isGameSnapshot(withInvalidActivities)).toBe(false);
    const withInvalidWage = { ...current, facilities: { ...current.facilities, facilities: [{ ...savedFacility, staffWagePerWorkerPerMinute: 1_000_000 }] } };
    expect(isGameSnapshot(withInvalidWage)).toBe(false);
  });

  it('pays a higher-quality inventory at its own quality-adjusted, slippage-aware price', () => {
    const state = useGameStore.getState();
    const snapshot = createStartingGameSnapshot(Date.now());
    snapshot.inventory.entries[ResourceType.Grain] = { quantity: 10, quality: 1.5, sourceCostPerUnit: 0 };
    state.restoreSnapshot(snapshot);
    const balanceBefore = useGameStore.getState().finance.getBalance();
    const market = useGameStore.getState().market;
    const initialUnitPrice = market.getLocalSalePrice(ResourceType.Grain, 1.5);
    const initialSupply = market.getLocalEntry(ResourceType.Grain).supply;
    const expectedUnitPrice = (initialUnitPrice + initialUnitPrice * initialSupply / (initialSupply + 10)) / 2;

    expect(state.sellMarketResource(ResourceType.Grain, 10)).toBe(true);
    expect(useGameStore.getState().finance.getBalance()).toBeCloseTo(balanceBefore + 10 * expectedUnitPrice);
  });

  it('allows autosell when its inventory-quality price meets the threshold', () => {
    const state = useGameStore.getState();
    const snapshot = createStartingGameSnapshot(Date.now());
    snapshot.inventory.entries[ResourceType.Grain] = { quantity: 100, quality: 2, sourceCostPerUnit: 0 };
    state.restoreSnapshot(snapshot);
    state.setMarketAutomation(ResourceType.Grain, {
      autoSellEnabled: true,
      autoSellMaxPerMinute: 60,
      autoSellMinUnitPrice: 1.5,
    });

    state.advanceGameTime(5_000);

    expect(useGameStore.getState().inventory.getAmount(ResourceType.Grain)).toBeLessThan(100);
  });

  it('does not autosell when slippage drops the executable quote below the threshold', () => {
    const state = useGameStore.getState();
    const snapshot = createStartingGameSnapshot(Date.now());
    snapshot.inventory.entries[ResourceType.Grain] = { quantity: 100, quality: 2, sourceCostPerUnit: 0 };
    state.restoreSnapshot(snapshot);
    const market = useGameStore.getState().market;
    const spotPrice = market.getLocalSalePrice(ResourceType.Grain, 2);
    const executionPrice = market.getLocalSellQuote(ResourceType.Grain, 5, 2).unitPrice;
    state.setMarketAutomation(ResourceType.Grain, {
      autoSellEnabled: true,
      autoSellMaxPerMinute: 60,
      autoSellMinUnitPrice: (spotPrice + executionPrice) / 2,
    });

    state.advanceGameTime(5_000);

    expect(useGameStore.getState().inventory.getAmount(ResourceType.Grain)).toBe(100);
  });
});

describe('local market network activation', () => {
  it('starts a persisted foreground market expansion when the research completes', () => {
    const state = useGameStore.getState();
    state.restoreSnapshot(createStartingGameSnapshot(0));
    state.setAdminBalance(1_000);

    expect(state.buildFacility(FacilityType.Farm)).toBe(true);
    expect(state.startResearch('local-market-network-1')).toBe(true);
    state.advanceGameTime(90_000);

    expect(useGameStore.getState().market.getLocalMarketNetworkActivations()).toMatchObject([
      { projectId: 'local-market-network-1', totalDepthIncrease: 0.2, appliedDepthIncrease: 0 },
    ]);

    state.advanceGameTime(60_000);
    expect(useGameStore.getState().market.getLocalEntry(ResourceType.Grain).supply).toBeCloseTo(1_050);
  });
});

describe('sales order fulfilment', () => {
  it('recalculates company-assets prestige from the fulfilled order state', () => {
    const state = useGameStore.getState();
    state.restoreSnapshot(createStartingGameSnapshot(0));

    expect(state.createSalesOrderRequest(ResourceType.Gold, 1)).toBe(true);
    const order = useGameStore.getState().salesOrders.getOfferedOrders()[0];
    expect(order).toBeDefined();
    state.setInventoryAmount(ResourceType.Gold, order.lines[0].quantity);

    expect(state.fulfillSalesOrder(order.id)).toBe(true);

    const fulfilledState = useGameStore.getState();
    const assets = calculateAssets({
      finance: fulfilledState.finance,
      inventory: fulfilledState.inventory,
      market: fulfilledState.market,
      facilities: fulfilledState.facilities,
      research: fulfilledState.research,
    });
    const liabilities = fulfilledState.finance.getLoans()
      .filter((loan) => loan.status !== 'repaid')
      .reduce((total, loan) => total + loan.remainingBalance, 0);
    const assetsEvent = fulfilledState.prestige.getEvents()
      .find((event) => event.sourceId === PRESTIGE_COMPANY_ASSETS_SOURCE_ID);

    expect(assetsEvent?.amountBase).toBe(calculateCompanyAssetsPrestige({
      assetBookValue: assets.totalAssets,
      liabilities,
    }));
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
    expect(useGameStore.getState().facilities.get('farm-1')!.getView().pendingRepair).not.toBeNull();
    state.advanceGameTime(301_000);
    expect(useGameStore.getState().facilities.get('farm-1')!.getView().facilityCondition).toBeCloseTo(1, 2);
    expect(useGameStore.getState().facilities.get('farm-1')!.getView().pendingRepair).toBeNull();
    expect(useGameStore.getState().inventory.getAmount(ResourceType.ConstructionMaterials)).toBe(0);
    expect(useGameStore.getState().inventory.getAmount(ResourceType.IndustrialMachines)).toBe(0);
  });

  it('repairs only to the selected target condition', () => {
    const state = useGameStore.getState();
    state.restoreSnapshot(createStartingGameSnapshot(0));

    expect(state.buildFacility(FacilityType.Farm)).toBe(true);
    useGameStore.getState().facilities.get('farm-1')!.applyConditionLoss(0.5);
    state.setAdminBalance(10_000);

    expect(state.repairFacility('farm-1', 0.75)).toBe(true);
    expect(useGameStore.getState().facilities.get('farm-1')!.getView().pendingRepair).not.toBeNull();
    state.advanceGameTime(151_000);
    expect(useGameStore.getState().facilities.get('farm-1')!.getView().facilityCondition).toBeCloseTo(0.75, 2);
    expect(useGameStore.getState().facilities.get('farm-1')!.getView().pendingRepair).toBeNull();
    expect(useGameStore.getState().facilityMaintenance.getRepairedCondition()).toBeCloseTo(0.25);
  });

  it('gates auto-repair behind Repair Technician research and repairs eligible facilities during foreground time', () => {
    const state = useGameStore.getState();
    state.restoreSnapshot(createStartingGameSnapshot(0));
    state.setAdminBalance(10_000);

    expect(state.buildFacility(FacilityType.Farm)).toBe(true);
    const farm = useGameStore.getState().facilities.get('farm-1')!;
    farm.applyConditionLoss(0.5);
    state.setInventoryAmount(ResourceType.ConstructionMaterials, 0);
    state.setInventoryAmount(ResourceType.IndustrialMachines, 0);
    expect(state.setFacilityAutoRepair('farm-1', true, 0.7, 1)).toBe(false);

    const snapshot = state.createSnapshot();
    snapshot.research.completed.push({ projectId: 'repair-technician-1', completedAtGameTimeMs: 0 });
    state.restoreSnapshot(snapshot);
    expect(state.setFacilityAutoRepair('farm-1', true, 0.7, 1)).toBe(true);

    state.advanceGameTime(1_000);
    expect(useGameStore.getState().facilities.get('farm-1')!.getView().pendingRepair).not.toBeNull();
    state.advanceGameTime(301_000);

    expect(useGameStore.getState().facilities.get('farm-1')!.getView().facilityCondition).toBeCloseTo(1, 2);
    expect(useGameStore.getState().facilities.get('farm-1')!.getView().pendingRepair).toBeNull();
    expect(useGameStore.getState().facilityMaintenance.getRepairedCondition()).toBeGreaterThan(0.49);
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
