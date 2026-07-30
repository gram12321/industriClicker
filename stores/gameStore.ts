import { Finance } from '@/game/finance/finance';
import { Inventory } from '@/game/inventory/inventory';
import { FacilityCollection } from '@/game/facilities/facilityCollection';
import type { FacilityType } from '@/game/facilities/facilityTypes';
import { getFacilityDefinition } from '@/game/facilities/facilityConstants';
import { advanceProduction as advanceFacilityProduction } from '@/game/facilities/advanceProduction';
import { getFacilityUpgradeCost, type FacilityUpgradeKind } from '@/game/facilities/facilityUpgrades';
import type { RecipeName } from '@/game/recipes/recipeTypes';
import { RESOURCE_TYPES } from '@/game/resources/resourceConstants';
import type { ResourceType } from '@/game/resources/resourceTypes';
import type { GameSnapshot } from '@/game/core/state/gameSnapshot';
import {
  calculateRealtimeAdvance,
} from '@/game/core/time/timeManager';
import {
  FOREGROUND_SIMULATION_STEP_MS,
  REALTIME_WORK_MINUTE_MS,
} from '@/game/core/time/timeConstants';
import { calculateSalesContractOfferChance, SalesContracts } from '@/game/sales/salesContracts';
import { PrestigeLedger } from '@/game/prestige/prestige';
import {
  calculateCompanyBalancePrestige,
} from '@/game/prestige/prestigeCalculator';
import { PRESTIGE_FOREGROUND_HOUR_MS } from '@/game/prestige/prestigeConstants';
import { create } from 'zustand';

type GameState = {
  finance: Finance;
  inventory: Inventory;
  facilities: FacilityCollection;
  salesContracts: SalesContracts;
  prestige: PrestigeLedger;
  /** Logical game time; it advances for realtime and fast-forward time alike. */
  lastProcessedAtMs: number;
  /** Last foreground wall-clock observation; deliberately not persisted. */
  lastObservedAtMs: number;
  /** Foreground time that has not yet formed a whole sales minute. */
  unprocessedWorkMs: number;
  customerPipelineProgress: number;
  addResource: (resourceType: ResourceType, amount?: number) => boolean;
  removeResource: (resourceType: ResourceType, amount?: number) => boolean;
  setInventoryAmount: (resourceType: ResourceType, amount: number) => boolean;
  buildFacility: (facilityType: FacilityType) => boolean;
  destroyFacility: (facilityType: FacilityType) => boolean;
  setFacilityRecipe: (facilityType: FacilityType, recipeName: RecipeName | null) => boolean;
  setFacilityWorkers: (facilityType: FacilityType, workerCount: number) => boolean;
  upgradeFacility: (facilityType: FacilityType, upgradeKind: FacilityUpgradeKind) => boolean;
  recordTransaction: (amount: number, description: string) => boolean;
  advanceGameTime: (elapsedMilliseconds: number) => number;
  advanceRealtime: (nowMs: number) => number;
  fastForwardOneMinute: () => boolean;
  createSalesContractRequest: (resourceType: ResourceType, quantity: number) => boolean;
  fulfillSalesContract: (contractId: string) => boolean;
  rejectSalesContract: (contractId: string) => boolean;
  resetRealtimeClock: (nowMs: number) => void;
  createSnapshot: () => GameSnapshot;
  restoreSnapshot: (snapshot: GameSnapshot) => void;
  resetGame: () => void;
  resetInventory: () => void;
};

function syncCompanyBalancePrestige(
  prestige: PrestigeLedger,
  finance: Finance,
  currentGameTimeMs: number,
): void {
  prestige.syncCompanyBalance(
    calculateCompanyBalancePrestige({ cashBalance: finance.getBalance() }),
    currentGameTimeMs,
  );
}

function createStartingPrestige(finance: Finance, currentGameTimeMs: number): PrestigeLedger {
  const prestige = new PrestigeLedger();
  syncCompanyBalancePrestige(prestige, finance, currentGameTimeMs);
  return prestige;
}

/** Runtime owner of player progress. Durable SQLite saves are introduced separately. */
export const useGameStore = create<GameState>((set, get) => {
  const initialGameTimeMs = Date.now();
  const initialFinance = new Finance();

  return ({
  finance: initialFinance,
  inventory: new Inventory(),
  facilities: new FacilityCollection(),
  salesContracts: new SalesContracts(),
  prestige: createStartingPrestige(initialFinance, initialGameTimeMs),
  lastProcessedAtMs: initialGameTimeMs,
  lastObservedAtMs: initialGameTimeMs,
  unprocessedWorkMs: 0,
  customerPipelineProgress: 0,
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
  setInventoryAmount: (resourceType, amount) => {
    const inventory = get().inventory.clone();

    if (!inventory.setAmount(resourceType, amount)) {
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

    const prestige = get().prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, get().lastProcessedAtMs);
    set({ facilities, finance, prestige });
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

    const prestige = get().prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, get().lastProcessedAtMs);
    set({ facilities, finance, prestige });
    return true;
  },
  recordTransaction: (amount, description) => {
    const finance = get().finance.clone();

    if (!finance.applyTransaction(amount, description, new Date().toISOString())) {
      return false;
    }

    const prestige = get().prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, get().lastProcessedAtMs);
    set({ finance, prestige });
    return true;
  },
  advanceGameTime: (elapsedMilliseconds) => {
    if (!Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds <= 0) {
      return 0;
    }

    const elapsedMs = Math.floor(elapsedMilliseconds);
    const hasProducingFacility = get().facilities.getAll().some((facility) => (
      facility.getProductionStatus(get().inventory) === 'producing'
    ));
    const facilities = hasProducingFacility ? get().facilities.clone() : get().facilities;
    const inventory = hasProducingFacility ? get().inventory.clone() : get().inventory;
    let salesContracts: SalesContracts | null = null;
    let unprocessedWorkMs = get().unprocessedWorkMs;
    let customerPipelineProgress = get().customerPipelineProgress;
    let elapsedMinutes = 0;
    let remainingMs = elapsedMs;

    while (remainingMs > 0) {
      const stepMs = Math.min(FOREGROUND_SIMULATION_STEP_MS, remainingMs);

      if (hasProducingFacility) {
        advanceFacilityProduction(facilities, inventory, stepMs / REALTIME_WORK_MINUTE_MS);
      }

      const currentSalesContracts = salesContracts ?? get().salesContracts;
      const offerChance = calculateSalesContractOfferChance(currentSalesContracts.getOfferedContracts().length);
      customerPipelineProgress = Math.min(
        1,
        customerPipelineProgress + (stepMs / 1_000) * offerChance / 60,
      );

      const totalSalesMs = unprocessedWorkMs + stepMs;
      const completedSalesMinutes = Math.floor(totalSalesMs / REALTIME_WORK_MINUTE_MS);
      unprocessedWorkMs = totalSalesMs - completedSalesMinutes * REALTIME_WORK_MINUTE_MS;

      if (completedSalesMinutes > 0) {
        salesContracts ??= get().salesContracts.clone();
        const contractsCreated = salesContracts.advanceTime(completedSalesMinutes, RESOURCE_TYPES);
        elapsedMinutes += completedSalesMinutes;

        if (contractsCreated > 0) {
          customerPipelineProgress = 0;
        }
      }

      remainingMs -= stepMs;
    }

    const previousGameTimeMs = get().lastProcessedAtMs;
    const nextGameTimeMs = previousGameTimeMs + elapsedMs;
    let prestige = get().prestige;

    if (Math.floor(previousGameTimeMs / PRESTIGE_FOREGROUND_HOUR_MS)
      < Math.floor(nextGameTimeMs / PRESTIGE_FOREGROUND_HOUR_MS)) {
      const nextPrestige = prestige.clone();
      if (nextPrestige.pruneExpired(nextGameTimeMs)) {
        prestige = nextPrestige;
      }
    }

    set({
      lastProcessedAtMs: nextGameTimeMs,
      unprocessedWorkMs,
      customerPipelineProgress,
      ...(hasProducingFacility ? { facilities, inventory } : {}),
      ...(salesContracts ? { salesContracts } : {}),
      ...(prestige !== get().prestige ? { prestige } : {}),
    });
    return elapsedMinutes;
  },
  advanceRealtime: (nowMs) => {
    const { elapsedMilliseconds, nextObservedAtMs } = calculateRealtimeAdvance(get().lastObservedAtMs, nowMs);

    if (nextObservedAtMs !== get().lastObservedAtMs) {
      set({ lastObservedAtMs: nextObservedAtMs });
    }

    return get().advanceGameTime(elapsedMilliseconds);
  },
  fastForwardOneMinute: () => {
    get().advanceRealtime(Date.now());
    return get().advanceGameTime(REALTIME_WORK_MINUTE_MS) > 0;
  },
  createSalesContractRequest: (resourceType, quantity) => {
    const salesContracts = get().salesContracts.clone();
    if (!salesContracts.createOfferForResource(resourceType, quantity)) {
      return false;
    }

    set({ salesContracts, customerPipelineProgress: 0 });
    return true;
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

    const prestige = get().prestige.clone();
    const currentGameTimeMs = get().lastProcessedAtMs;
    syncCompanyBalancePrestige(prestige, finance, currentGameTimeMs);
    prestige.recordSalesContract(contract.id, contract.reward, currentGameTimeMs);

    set({ inventory, finance, salesContracts, prestige });
    return true;
  },
  rejectSalesContract: (contractId) => {
    const salesContracts = get().salesContracts.clone();
    const rejected = salesContracts.reject(contractId, new Date().toISOString());

    if (!rejected) {
      return false;
    }

    set({ salesContracts });
    return true;
  },
  resetRealtimeClock: (nowMs) => {
    if (Number.isFinite(nowMs)) {
      set({ lastObservedAtMs: nowMs });
    }
  },
  createSnapshot: () => ({
    finance: get().finance.toSnapshot(),
    inventory: get().inventory.toSnapshot(),
    facilities: get().facilities.toSnapshot(),
    salesContracts: get().salesContracts.toSnapshot(),
    prestige: get().prestige.toSnapshot(),
    time: {
      lastProcessedAtMs: get().lastProcessedAtMs,
      unprocessedWorkMs: get().unprocessedWorkMs,
      customerPipelineProgress: get().customerPipelineProgress,
    },
  }),
  restoreSnapshot: (snapshot) => {
    const finance = Finance.fromSnapshot(snapshot.finance);
    const prestige = PrestigeLedger.fromSnapshot(snapshot.prestige);
    syncCompanyBalancePrestige(prestige, finance, snapshot.time.lastProcessedAtMs);

    set({
    finance,
    inventory: Inventory.fromSnapshot(snapshot.inventory),
    facilities: FacilityCollection.fromSnapshot(snapshot.facilities),
    salesContracts: SalesContracts.fromSnapshot(snapshot.salesContracts),
    prestige,
    // Offline progress is planned; observe a restored foreground session from now.
    lastProcessedAtMs: snapshot.time.lastProcessedAtMs,
    lastObservedAtMs: Date.now(),
    unprocessedWorkMs: snapshot.time.unprocessedWorkMs,
    customerPipelineProgress: snapshot.time.customerPipelineProgress,
    });
  },
  resetGame: () => {
    const now = Date.now();
    const finance = new Finance();

    set({
      finance,
      inventory: new Inventory(),
      facilities: new FacilityCollection(),
      salesContracts: new SalesContracts(),
      prestige: createStartingPrestige(finance, now),
      lastProcessedAtMs: now,
      lastObservedAtMs: now,
      unprocessedWorkMs: 0,
      customerPipelineProgress: 0,
    });
  },
  resetInventory: () => set({ inventory: new Inventory() }),
  });
});
