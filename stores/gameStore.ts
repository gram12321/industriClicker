import { Finance } from '@/game/finance/finance';
import { Inventory } from '@/game/inventory/inventory';
import { FacilityCollection } from '@/game/facilities/facilityCollection';
import type { FacilityType } from '@/game/facilities/facilityTypes';
import { getFacilityDefinition } from '@/game/facilities/facilityRegistry';
import { advanceProduction as advanceFacilityProduction } from '@/game/facilities/advanceProduction';
import { getFacilityUpgradeCost, type FacilityUpgradeKind } from '@/game/facilities/facilityUpgrades';
import type { RecipeName } from '@/game/recipes/recipeTypes';
import { RESOURCE_TYPES, type ResourceType } from '@/game/resources/resourceTypes';
import type { GameSnapshot } from '@/game/core/state/gameSnapshot';
import { calculateRealtimeAdvance } from '@/game/core/time/timeManager';
import { SalesContracts } from '@/game/sales/salesContracts';
import { create } from 'zustand';

type GameState = {
  finance: Finance;
  inventory: Inventory;
  facilities: FacilityCollection;
  salesContracts: SalesContracts;
  lastProcessedAtMs: number;
  addResource: (resourceType: ResourceType, amount?: number) => boolean;
  removeResource: (resourceType: ResourceType, amount?: number) => boolean;
  buildFacility: (facilityType: FacilityType) => boolean;
  destroyFacility: (facilityType: FacilityType) => boolean;
  setFacilityRecipe: (facilityType: FacilityType, recipeName: RecipeName | null) => boolean;
  setFacilityWorkers: (facilityType: FacilityType, workerCount: number) => boolean;
  upgradeFacility: (facilityType: FacilityType, upgradeKind: FacilityUpgradeKind) => boolean;
  recordTransaction: (amount: number, description: string) => boolean;
  advanceProduction: (workAmount: number) => boolean;
  advanceRealtime: (nowMs: number) => number;
  fastForwardOneMinute: () => boolean;
  advanceSalesContracts: (elapsedMinutes: number) => number;
  fulfillSalesContract: (contractId: string) => boolean;
  resetRealtimeClock: (nowMs: number) => void;
  createSnapshot: () => GameSnapshot;
  restoreSnapshot: (snapshot: GameSnapshot) => void;
  resetInventory: () => void;
};

/** Runtime owner of player progress. Durable SQLite saves are introduced separately. */
export const useGameStore = create<GameState>((set, get) => ({
  finance: new Finance(),
  inventory: new Inventory(),
  facilities: new FacilityCollection(),
  salesContracts: new SalesContracts(),
  lastProcessedAtMs: Date.now(),
  addResource: (resourceType, amount) => {
    const inventory = get().inventory.clone();

    if (!inventory.add(resourceType, amount)) {
      return false;
    }

    set({ inventory });
    return true;
  },
  removeResource: (resourceType, amount) => {
    const inventory = get().inventory.clone();

    if (!inventory.remove(resourceType, amount)) {
      return false;
    }

    set({ inventory });
    return true;
  },
  buildFacility: (facilityType) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const finance = get().finance.clone();
    const definition = getFacilityDefinition(facilityType);

    if (!finance.canAfford(definition.constructionCost) || !facilities.build(facilityType)) {
      return false;
    }

    if (!finance.applyTransaction(
      -definition.constructionCost,
      `Constructed ${definition.name}`,
      new Date().toISOString(),
    )) {
      return false;
    }

    set({ facilities, finance });
    return true;
  },
  destroyFacility: (facilityType) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();

    if (!facilities.destroy(facilityType)) {
      return false;
    }

    set({ facilities });
    return true;
  },
  setFacilityRecipe: (facilityType, recipeName) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const facility = facilities.get(facilityType);

    if (!facility || !facility.setActiveRecipe(recipeName)) {
      return false;
    }

    set({ facilities });
    return true;
  },
  setFacilityWorkers: (facilityType, workerCount) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const facility = facilities.get(facilityType);

    if (!facility || !facility.setAssignedWorkers(workerCount)) {
      return false;
    }

    set({ facilities });
    return true;
  },
  upgradeFacility: (facilityType, upgradeKind) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const finance = get().finance.clone();
    const facility = facilities.get(facilityType);

    if (!facility) {
      return false;
    }

    const currentLevel = upgradeKind === 'speed'
      ? facility.getSpeedUpgradeLevel()
      : facility.getOutputUpgradeLevel();
    const definition = getFacilityDefinition(facilityType);
    const cost = getFacilityUpgradeCost(definition.constructionCost, currentLevel);

    if (!finance.canAfford(cost)) {
      return false;
    }

    if (upgradeKind === 'speed') {
      facility.upgradeSpeed();
    } else {
      facility.upgradeOutput();
    }

    if (!finance.applyTransaction(
      -cost,
      `${upgradeKind === 'speed' ? 'Speed' : 'Output'} upgrade for ${definition.name}`,
      new Date().toISOString(),
    )) {
      return false;
    }

    set({ facilities, finance });
    return true;
  },
  recordTransaction: (amount, description) => {
    const finance = get().finance.clone();

    if (!finance.applyTransaction(amount, description, new Date().toISOString())) {
      return false;
    }

    set({ finance });
    return true;
  },
  advanceProduction: (workAmount) => {
    if (!Number.isInteger(workAmount) || workAmount <= 0) {
      return false;
    }

    const facilities = get().facilities.clone();
    const inventory = get().inventory.clone();
    advanceFacilityProduction(facilities, inventory, workAmount);

    set({ facilities, inventory });
    return true;
  },
  advanceRealtime: (nowMs) => {
    const { elapsedMinutes, nextProcessedAtMs } = calculateRealtimeAdvance(get().lastProcessedAtMs, nowMs);

    if (elapsedMinutes > 0) {
      get().advanceProduction(elapsedMinutes);
      get().advanceSalesContracts(elapsedMinutes);
    }

    if (nextProcessedAtMs !== get().lastProcessedAtMs) {
      set({ lastProcessedAtMs: nextProcessedAtMs });
    }

    return elapsedMinutes;
  },
  fastForwardOneMinute: () => {
    get().advanceRealtime(Date.now());
    const productionAdvanced = get().advanceProduction(1);
    get().advanceSalesContracts(1);
    return productionAdvanced;
  },
  advanceSalesContracts: (elapsedMinutes: number) => {
    const salesContracts = get().salesContracts.clone();
    const contractsCreated = salesContracts.advanceTime(elapsedMinutes, RESOURCE_TYPES);

    if (contractsCreated > 0 || elapsedMinutes > 0) {
      set({ salesContracts });
    }

    return contractsCreated;
  },
  fulfillSalesContract: (contractId) => {
    const salesContracts = get().salesContracts.clone();
    const contract = salesContracts.getOfferedContract(contractId);

    if (!contract) {
      return false;
    }

    const inventory = get().inventory.clone();
    const finance = get().finance.clone();

    if (!inventory.has(contract.resourceType, contract.quantity)) {
      return false;
    }

    const occurredAt = new Date().toISOString();
    if (!inventory.remove(contract.resourceType, contract.quantity)
      || !finance.applyTransaction(contract.reward, `Contract fulfilled: ${contract.customerName}`, occurredAt)
      || !salesContracts.fulfill(contract.id, occurredAt)) {
      return false;
    }

    set({ inventory, finance, salesContracts });
    return true;
  },
  resetRealtimeClock: (nowMs) => {
    if (Number.isFinite(nowMs)) {
      set({ lastProcessedAtMs: nowMs });
    }
  },
  createSnapshot: () => ({
    finance: get().finance.toSnapshot(),
    inventory: get().inventory.toSnapshot(),
    facilities: get().facilities.toSnapshot(),
    salesContracts: get().salesContracts.toSnapshot(),
  }),
  restoreSnapshot: (snapshot) => set({
    finance: Finance.fromSnapshot(snapshot.finance),
    inventory: Inventory.fromSnapshot(snapshot.inventory),
    facilities: FacilityCollection.fromSnapshot(snapshot.facilities),
    salesContracts: SalesContracts.fromSnapshot(snapshot.salesContracts),
    // Offline progress is planned; a restored foreground session starts fresh.
    lastProcessedAtMs: Date.now(),
  }),
  resetInventory: () => set({ inventory: new Inventory() }),
}));
