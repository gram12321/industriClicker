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
import { Market, MARKET_SALES_CONTRACT_PREMIUM } from '@/game/market';
import { canAutoBuyMarketResource, canBuyMarketResource, canSellMarketResource } from '@/game/market';
import type { MarketAutomation } from '@/game/market';
import type { GameSnapshot } from '@/game/core/state/gameSnapshot';
import {   calculateRealtimeAdvance, } from '@/game/core/time/timeManager';
import {   FOREGROUND_SIMULATION_STEP_MS,   REALTIME_WORK_MINUTE_MS, } from '@/game/core/time/timeConstants';
import { calculateSalesContractOfferChance, SalesContracts } from '@/game/sales/salesContracts';
import { AchievementLedger } from '@/game/achievements/achievement';
import type { AchievementCategory } from '@/game/achievements/achievementConstants';
import { createAchievementEvaluationContext, evaluateAchievementUnlocks } from '@/game/achievements/achievementEvaluator';
import { ProductionStatistics } from '@/game/achievements/productionStatistics';
import { PrestigeLedger } from '@/game/prestige/prestige';
import {   calculateCompanyBalancePrestige, } from '@/game/prestige/prestigeCalculator';
import { PRESTIGE_FOREGROUND_HOUR_MS } from '@/game/prestige/prestigeConstants';
import { create } from 'zustand';

type GameState = {
  finance: Finance;
  inventory: Inventory;
  market: Market;
  facilities: FacilityCollection;
  salesContracts: SalesContracts;
  achievements: AchievementLedger;
  productionStatistics: ProductionStatistics;
  prestige: PrestigeLedger;
  companyStartedAtGameTimeMs: number;
  /** Logical game time; it advances for realtime and fast-forward time alike. */
  lastProcessedAtMs: number;
  /** Last foreground wall-clock observation; deliberately not persisted. */
  lastObservedAtMs: number;
  /** Foreground time that has not yet formed a whole sales minute. */
  unprocessedWorkMs: number;
  /** Estimated customer-wait intervals elapsed since the last offer. */
  customerPipelineProgress: number;
  setInventoryAmount: (resourceType: ResourceType, amount: number) => boolean;
  buyMarketResource: (resourceType: ResourceType, amount: number) => boolean;
  sellMarketResource: (resourceType: ResourceType, amount: number) => boolean;
  setMarketAutomation: (resourceType: ResourceType, updates: Partial<MarketAutomation>) => boolean;
  buildFacility: (facilityType: FacilityType) => boolean;
  destroyFacility: (facilityType: FacilityType) => boolean;
  setFacilityRecipe: (facilityType: FacilityType, recipeName: RecipeName | null) => boolean;
  setFacilityWorkers: (facilityType: FacilityType, workerCount: number) => boolean;
  upgradeFacility: (facilityType: FacilityType, upgradeKind: FacilityUpgradeKind) => boolean;
  advanceGameTime: (elapsedMilliseconds: number) => number;
  advanceRealtime: (nowMs: number) => number;
  fastForwardOneMinute: () => boolean;
  createSalesContractRequest: (resourceType: ResourceType, quantity: number) => boolean;
  fulfillSalesContract: (contractId: string) => boolean;
  rejectSalesContract: (contractId: string) => boolean;
  resetRealtimeClock: (nowMs: number) => void;
  createSnapshot: () => GameSnapshot;
  restoreSnapshot: (snapshot: GameSnapshot) => void;
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

/** Produces a fresh, current-version company snapshot without touching runtime state. */
export function createStartingGameSnapshot(nowMs = Date.now()): GameSnapshot {
  const finance = new Finance();
  return {
    finance: finance.toSnapshot(),
    inventory: new Inventory().toSnapshot(),
    market: new Market().toSnapshot(),
    facilities: new FacilityCollection().toSnapshot(),
    salesContracts: new SalesContracts().toSnapshot(),
    achievements: new AchievementLedger().toSnapshot(),
    productionStatistics: new ProductionStatistics().toSnapshot(),
    prestige: createStartingPrestige(finance, nowMs).toSnapshot(),
    time: {
      companyStartedAtGameTimeMs: nowMs,
      lastProcessedAtMs: nowMs,
      unprocessedWorkMs: 0,
      customerPipelineProgress: 0,
    },
  };
}

function applyAchievementUnlocks(input: {
  achievements: AchievementLedger;
  productionStatistics: ProductionStatistics;
  facilities: FacilityCollection;
  finance: Finance;
  salesContracts: SalesContracts;
  prestige: PrestigeLedger;
  companyStartedAtGameTimeMs: number;
  currentGameTimeMs: number;
  categories: readonly AchievementCategory[];
}): { achievements: AchievementLedger; prestige: PrestigeLedger } {
  const context = createAchievementEvaluationContext({
    facilities: input.facilities,
    finance: input.finance,
    salesContracts: input.salesContracts,
    prestige: input.prestige,
    productionStatistics: input.productionStatistics,
    companyStartedAtGameTimeMs: input.companyStartedAtGameTimeMs,
    currentGameTimeMs: input.currentGameTimeMs,
  });
  const eligible = evaluateAchievementUnlocks(context, input.achievements, input.categories);

  if (eligible.length === 0) {
    return { achievements: input.achievements, prestige: input.prestige };
  }

  const achievements = input.achievements.clone();
  const prestige = input.prestige.clone();

  for (const definition of eligible) {
    if (achievements.unlock(definition.id, input.currentGameTimeMs)) {
      prestige.recordAchievement({
        achievementId: definition.id,
        name: definition.name,
        prestigeAmount: definition.prestigeAmount,
        decayHalfLifeForegroundHours: definition.prestigeHalfLifeForegroundHours,
        createdAtGameTimeMs: input.currentGameTimeMs,
      });
    }
  }

  return { achievements, prestige };
}

/** Runtime owner of the active company's progress. The company session owns durable saves. */
export const useGameStore = create<GameState>((set, get) => {
  const initialGameTimeMs = Date.now();
  const initialFinance = new Finance();

  return ({
  finance: initialFinance,
  inventory: new Inventory(),
  market: new Market(),
  facilities: new FacilityCollection(),
  salesContracts: new SalesContracts(),
  achievements: new AchievementLedger(),
  productionStatistics: new ProductionStatistics(),
  prestige: createStartingPrestige(initialFinance, initialGameTimeMs),
  companyStartedAtGameTimeMs: initialGameTimeMs,
  lastProcessedAtMs: initialGameTimeMs,
  lastObservedAtMs: initialGameTimeMs,
  unprocessedWorkMs: 0,
  customerPipelineProgress: 0,
  setInventoryAmount: (resourceType, amount) => {
    const inventory = get().inventory.clone();

    if (!inventory.setAmount(resourceType, amount)) {
      return false;
    }

    set({ inventory });
    return true;
  },
  buyMarketResource: (resourceType, amount) => {
    get().advanceRealtime(Date.now());
    if (!canBuyMarketResource(resourceType)) return false;
    const market = get().market.clone();
    const inventory = get().inventory.clone();
    const finance = get().finance.clone();
    const trade = market.buyFromLocal(resourceType, amount);
    const total = trade.unitPrice * trade.amount;
    if (!trade.success || !finance.canAfford(total) || !inventory.add(resourceType, trade.amount, trade.quality)
      || !finance.applyTransaction(-total, `Bought ${trade.amount} ${resourceType} from local market`, new Date().toISOString())) return false;
    set({ market, inventory, finance });
    return true;
  },
  sellMarketResource: (resourceType, amount) => {
    get().advanceRealtime(Date.now());
    if (!canSellMarketResource(resourceType)) return false;
    const market = get().market.clone();
    const inventory = get().inventory.clone();
    const finance = get().finance.clone();
    if (!inventory.has(resourceType, amount)) return false;
    const quality = inventory.getQuality(resourceType);
    const trade = market.sellToLocal(resourceType, amount, quality);
    const total = trade.unitPrice * trade.amount;
    if (!trade.success || !inventory.remove(resourceType, amount)
      || !finance.applyTransaction(total, `Sold ${trade.amount} ${resourceType} to local market`, new Date().toISOString())) return false;
    set({ market, inventory, finance });
    return true;
  },
  setMarketAutomation: (resourceType, updates) => {
    const market = get().market.clone();
    if (!market.setAutomation(resourceType, updates)) return false;
    set({ market });
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
    const achievementResult = applyAchievementUnlocks({
      achievements: get().achievements,
      productionStatistics: get().productionStatistics,
      facilities,
      finance,
      salesContracts: get().salesContracts,
      prestige,
      companyStartedAtGameTimeMs: get().companyStartedAtGameTimeMs,
      currentGameTimeMs: get().lastProcessedAtMs,
      categories: ['facilities', 'finance', 'prestige'],
    });
    set({ facilities, finance, ...achievementResult });
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
    const achievementResult = applyAchievementUnlocks({
      achievements: get().achievements,
      productionStatistics: get().productionStatistics,
      facilities,
      finance,
      salesContracts: get().salesContracts,
      prestige,
      companyStartedAtGameTimeMs: get().companyStartedAtGameTimeMs,
      currentGameTimeMs: get().lastProcessedAtMs,
      categories: ['facilities', 'finance', 'prestige'],
    });
    set({ facilities, finance, ...achievementResult });
    return true;
  },
  advanceGameTime: (elapsedMilliseconds) => {
    if (!Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds <= 0) {
      return 0;
    }

    const elapsedMs = Math.floor(elapsedMilliseconds);
    const hasActiveFacility = get().facilities.getAll().some((facility) => facility.isActive());
    const facilities = hasActiveFacility ? get().facilities.clone() : get().facilities;
    let inventory = hasActiveFacility ? get().inventory.clone() : get().inventory;
    let productionStatistics = get().productionStatistics;
    let salesContracts: SalesContracts | null = null;
    let market: Market | null = null;
    let marketFinance: Finance | null = null;
    let unprocessedWorkMs = get().unprocessedWorkMs;
    let customerPipelineProgress = get().customerPipelineProgress;
    let elapsedMinutes = 0;
    let remainingMs = elapsedMs;

    while (remainingMs > 0) {
      const stepMs = Math.min(FOREGROUND_SIMULATION_STEP_MS, remainingMs);

      if (hasActiveFacility) {
        market ??= get().market.clone();
        marketFinance ??= get().finance.clone();
        for (const facility of facilities.getAll()) {
          for (const input of facility.getMissingInputs(inventory)) {
            const automation = market.getAutomation(input.resourceType);
            const unitPrice = market.getLocalPrice(input.resourceType);
            if (!automation.autoBuyEnabled || !canAutoBuyMarketResource(input.resourceType)
              || unitPrice > automation.autoBuyMaxUnitPrice || !marketFinance.canAfford(unitPrice * input.amount)) continue;
            const trade = market.buyFromLocal(input.resourceType, input.amount);
            if (trade.success && inventory.add(input.resourceType, trade.amount, trade.quality)) {
              marketFinance.applyTransaction(-trade.unitPrice * trade.amount, `Autobought ${trade.amount} ${input.resourceType} for production`, new Date().toISOString());
            }
          }
        }
        const outputs = advanceFacilityProduction(facilities, inventory, stepMs / REALTIME_WORK_MINUTE_MS);
        if (outputs.length > 0) {
          if (productionStatistics === get().productionStatistics) {
            productionStatistics = productionStatistics.clone();
          }

          for (const output of outputs) {
            productionStatistics.record(output.resourceType, output.amount);
          }
        }
      }

      const currentSalesContracts = salesContracts ?? get().salesContracts;
      const offerChance = calculateSalesContractOfferChance(currentSalesContracts.getOfferedContracts().length);
      customerPipelineProgress += (stepMs / 1_000) * offerChance / 60;

      const totalSalesMs = unprocessedWorkMs + stepMs;
      const completedSalesMinutes = Math.floor(totalSalesMs / REALTIME_WORK_MINUTE_MS);
      unprocessedWorkMs = totalSalesMs - completedSalesMinutes * REALTIME_WORK_MINUTE_MS;

      if (completedSalesMinutes > 0) {
        salesContracts ??= get().salesContracts.clone();
        market ??= get().market.clone();
        const activeMarket = market;
        const contractsCreated = salesContracts.advanceTime(
          completedSalesMinutes,
          RESOURCE_TYPES,
          (resourceType) => activeMarket.getGlobalPrice(resourceType) * MARKET_SALES_CONTRACT_PREMIUM,
        );
        marketFinance ??= get().finance.clone();
        if (inventory === get().inventory) inventory = inventory.clone();
        for (const resourceType of RESOURCE_TYPES) {
          const automation = activeMarket.getAutomation(resourceType);
          const currentPrice = activeMarket.getLocalPrice(resourceType);
          const amount = Math.min(
            automation.autoSellMaxPerMinute,
            Math.max(0, inventory.getAmount(resourceType) - automation.autoSellMinKeep),
          );
          if (!automation.autoSellEnabled || amount <= 0 || currentPrice < automation.autoSellMinUnitPrice) continue;
          const trade = activeMarket.sellToLocal(resourceType, amount, inventory.getQuality(resourceType));
          if (trade.success && inventory.remove(resourceType, amount)) {
            marketFinance.applyTransaction(
              trade.unitPrice * trade.amount,
              `Autosold ${trade.amount} ${resourceType} to local market`,
              new Date().toISOString(),
            );
          }
        }
        activeMarket.diffuse();
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

    const achievementCategories: AchievementCategory[] = [];
    if (productionStatistics !== get().productionStatistics) {
      achievementCategories.push('production');
    }
    if (elapsedMinutes > 0) {
      achievementCategories.push('time');
    }
    const achievementResult = achievementCategories.length > 0
      ? applyAchievementUnlocks({
        achievements: get().achievements,
        productionStatistics,
        facilities,
        finance: marketFinance ?? get().finance,
        salesContracts: salesContracts ?? get().salesContracts,
        prestige,
        companyStartedAtGameTimeMs: get().companyStartedAtGameTimeMs,
        currentGameTimeMs: nextGameTimeMs,
        categories: achievementCategories,
      })
      : { achievements: get().achievements, prestige };

    set({
      lastProcessedAtMs: nextGameTimeMs,
      unprocessedWorkMs,
      customerPipelineProgress,
      ...(hasActiveFacility ? { facilities } : {}),
      ...(inventory !== get().inventory ? { inventory } : {}),
      ...(marketFinance ? { finance: marketFinance } : {}),
      ...(productionStatistics !== get().productionStatistics ? { productionStatistics } : {}),
      ...(salesContracts ? { salesContracts } : {}),
      ...(market ? { market } : {}),
      ...(achievementResult.achievements !== get().achievements ? { achievements: achievementResult.achievements } : {}),
      ...(achievementResult.prestige !== get().prestige ? { prestige: achievementResult.prestige } : {}),
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
    if (!salesContracts.createOfferForResource(
      resourceType,
      quantity,
      get().market.getGlobalPrice(resourceType) * MARKET_SALES_CONTRACT_PREMIUM,
    )) {
      return false;
    }

    set({ salesContracts, customerPipelineProgress: 0 });
    return true;
  },
  fulfillSalesContract: (contractId) => {
    get().advanceRealtime(Date.now());
    const salesContracts = get().salesContracts.clone();
    const contract = salesContracts.getOfferedContract(contractId);

    if (!contract) {
      return false;
    }

    const inventory = get().inventory.clone();
    const finance = get().finance.clone();
    const market = get().market.clone();

    if (!inventory.has(contract.resourceType, contract.quantity)) {
      return false;
    }

    const quality = inventory.getQuality(contract.resourceType);
    const occurredAt = new Date().toISOString();
    if (!inventory.remove(contract.resourceType, contract.quantity)
      || !finance.applyTransaction(contract.reward, `Contract fulfilled: ${contract.customerName}`, occurredAt)
      || !salesContracts.fulfill(contract.id, occurredAt)
      || !market.addToGlobal(contract.resourceType, contract.quantity, quality)) {
      return false;
    }

    const prestige = get().prestige.clone();
    const currentGameTimeMs = get().lastProcessedAtMs;
    syncCompanyBalancePrestige(prestige, finance, currentGameTimeMs);
    prestige.recordSalesContract(contract.id, contract.reward, currentGameTimeMs);

    const achievementResult = applyAchievementUnlocks({
      achievements: get().achievements,
      productionStatistics: get().productionStatistics,
      facilities: get().facilities,
      finance,
      salesContracts,
      prestige,
      companyStartedAtGameTimeMs: get().companyStartedAtGameTimeMs,
      currentGameTimeMs,
      categories: ['sales', 'finance', 'prestige'],
    });
    set({ inventory, market, finance, salesContracts, ...achievementResult });
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
    market: get().market.toSnapshot(),
    facilities: get().facilities.toSnapshot(),
    salesContracts: get().salesContracts.toSnapshot(),
    achievements: get().achievements.toSnapshot(),
    productionStatistics: get().productionStatistics.toSnapshot(),
    prestige: get().prestige.toSnapshot(),
    time: {
      companyStartedAtGameTimeMs: get().companyStartedAtGameTimeMs,
      lastProcessedAtMs: get().lastProcessedAtMs,
      unprocessedWorkMs: get().unprocessedWorkMs,
      customerPipelineProgress: get().customerPipelineProgress,
    },
  }),
  restoreSnapshot: (snapshot) => {
    const finance = Finance.fromSnapshot(snapshot.finance);
    const market = Market.fromSnapshot(snapshot.market);
    const facilities = FacilityCollection.fromSnapshot(snapshot.facilities);
    const salesContracts = SalesContracts.fromSnapshot(snapshot.salesContracts);
    const achievements = AchievementLedger.fromSnapshot(snapshot.achievements);
    const productionStatistics = ProductionStatistics.fromSnapshot(snapshot.productionStatistics);
    const prestige = PrestigeLedger.fromSnapshot(snapshot.prestige);
    syncCompanyBalancePrestige(prestige, finance, snapshot.time.lastProcessedAtMs);
    const achievementResult = applyAchievementUnlocks({
      achievements,
      productionStatistics,
      facilities,
      finance,
      salesContracts,
      prestige,
      companyStartedAtGameTimeMs: snapshot.time.companyStartedAtGameTimeMs,
      currentGameTimeMs: snapshot.time.lastProcessedAtMs,
      categories: ['facilities', 'production', 'sales', 'finance', 'time', 'prestige'],
    });

    set({
    finance,
    inventory: Inventory.fromSnapshot(snapshot.inventory),
    market,
    facilities,
    salesContracts,
    achievements: achievementResult.achievements,
    productionStatistics,
    prestige: achievementResult.prestige,
    companyStartedAtGameTimeMs: snapshot.time.companyStartedAtGameTimeMs,
    // Offline progress is planned; observe a restored foreground session from now.
    lastProcessedAtMs: snapshot.time.lastProcessedAtMs,
    lastObservedAtMs: Date.now(),
    unprocessedWorkMs: snapshot.time.unprocessedWorkMs,
    customerPipelineProgress: snapshot.time.customerPipelineProgress,
    });
  },
  });
});
