import { Finance } from '@/game/finance';
import { Inventory } from '@/game/inventory';
import { FACILITIES, FacilityCollection, advanceAllFacilityProduction, calculateFacilityEffectiveWork, FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE, getFacilityDefinition, getFacilityMissingInputs, getFacilityRepairCost, getFacilityUpgradeCost, type FacilityType, type FacilityUpgradeKind } from '@/game/facilities';
import type { RecipeName } from '@/game/recipes';
import { RESOURCE_TYPES, ResourceType } from '@/game/resources';
import { MARKET_SALES_CONTRACT_PREMIUM, Market, canAutoBuyMarketResource, canBuyMarketResource, canSellMarketResource, type MarketAutomation } from '@/game/market';
import type { GameSnapshot } from '@/game/core/state';
import { BASE_WORK_PER_MINUTE, FOREGROUND_SIMULATION_STEP_MS, REALTIME_WORK_MINUTE_MS, calculateRealtimeAdvance } from '@/game/core/time';
import { SalesContracts, calculateSalesContractOfferChance } from '@/game/sales';
import { AchievementLedger, ProductionStatistics, createAchievementEvaluationContext, evaluateAchievementUnlocks, type AchievementCategory } from '@/game/achievements';
import { PrestigeLedger, PRESTIGE_FOREGROUND_HOUR_MS, calculateCompanyBalancePrestige, calculateCompanyPrestigeSummary, calculateFacilityConditionPrestige } from '@/game/prestige';
import { evaluateGateRequirements, type GateContext, type GateEvaluation } from '@/game/gates';
import { ResearchLedger, getMaximumOpenSalesContracts, getRecipeResearchProjectId, getRecipeResearchWorkSpeedMultiplier, getResearchProject, type ResearchProjectId } from '@/game/research';
import { FIRST_FACILITY_RECIPE_RESEARCH_GRANT_ID, GrantLedger } from '@/game/grants';
import type { StartingConditionId } from '@/game/company/companyTypes';
import { STANDARD_START_CONSTRUCTION_MATERIALS } from '@/game/company/companyConstants';
import { create } from 'zustand';

export type ResearchAvailability = GateEvaluation & {
  startable: boolean;
  unmetReasons: string[];
  cost: number;
  usesFreeGrant: boolean;
};

type GameState = {
  finance: Finance;
  inventory: Inventory;
  market: Market;
  facilities: FacilityCollection;
  salesContracts: SalesContracts;
  achievements: AchievementLedger;
  productionStatistics: ProductionStatistics;
  prestige: PrestigeLedger;
  research: ResearchLedger;
  grants: GrantLedger;
  /** Company metadata injected by the session store, never persisted in GameSnapshot. */
  startingConditionId: StartingConditionId | null;
  companyStartedAtGameTimeMs: number;
  /** Logical game time; it advances for realtime and fast-forward time alike. */
  lastProcessedAtMs: number;
  /** Last foreground wall-clock observation; deliberately not persisted. */
  lastObservedAtMs: number;
  /** Foreground time that has not yet formed a whole sales minute. */
  unprocessedWorkMs: number;
  /** Estimated customer-wait intervals elapsed since the last offer. */
  customerPipelineProgress: number;
  addAdminFunds: (amount: number) => boolean;
  setAdminBalance: (amount: number) => boolean;
  setInventoryAmount: (resourceType: ResourceType, amount: number) => boolean;
  buyMarketResource: (resourceType: ResourceType, amount: number) => boolean;
  sellMarketResource: (resourceType: ResourceType, amount: number) => boolean;
  setMarketAutomation: (resourceType: ResourceType, updates: Partial<MarketAutomation>) => boolean;
  buyMissingConstructionMaterials: (facilityType: FacilityType) => boolean;
  buildFacility: (facilityType: FacilityType) => boolean;
  destroyFacility: (facilityId: string) => boolean;
  setFacilityRecipe: (facilityId: string, recipeName: RecipeName | null) => boolean;
  setFacilityProductionActive: (facilityId: string, active: boolean) => boolean;
  setFacilityWorkers: (facilityId: string, workerCount: number) => boolean;
  repairFacility: (facilityId: string) => boolean;
  upgradeFacility: (facilityId: string, upgradeKind: FacilityUpgradeKind) => boolean;
  advanceGameTime: (elapsedMilliseconds: number) => number;
  advanceRealtime: (nowMs: number) => number;
  fastForwardOneMinute: () => boolean;
  createSalesContractRequest: (resourceType: ResourceType, quantity: number) => boolean;
  fulfillSalesContract: (contractId: string) => boolean;
  rejectSalesContract: (contractId: string) => boolean;
  setStartingConditionId: (startingConditionId: StartingConditionId | null) => void;
  getResearchAvailability: (projectId: ResearchProjectId) => ResearchAvailability;
  startResearch: (projectId: ResearchProjectId) => boolean;
  cancelResearch: () => boolean;
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

function syncFacilityConditionPrestige(prestige: PrestigeLedger, facilities: FacilityCollection, currentGameTimeMs: number): void {
  prestige.syncFacilityCondition(calculateFacilityConditionPrestige(facilities.getAll().map((facility) => facility.getView().facilityCondition)), currentGameTimeMs);
}

function createStartingPrestige(finance: Finance, currentGameTimeMs: number): PrestigeLedger {
  const prestige = new PrestigeLedger();
  syncCompanyBalancePrestige(prestige, finance, currentGameTimeMs);
  return prestige;
}

function createResearchGateContext(input: {
  achievements: AchievementLedger;
  research: ResearchLedger;
  prestige: PrestigeLedger;
  currentGameTimeMs: number;
  startingConditionId: StartingConditionId | null;
}): GateContext {
  return {
    completedAchievementIds: input.achievements.getUnlocks().map((unlock) => unlock.achievementId),
    completedResearchProjectIds: input.research.getCompletedProjectIds(),
    currentPrestige: calculateCompanyPrestigeSummary(input.prestige.getEvents(), input.currentGameTimeMs).totalPrestige,
    startingConditionId: input.startingConditionId,
  };
}

function getRecipeResearchGrantTarget(project: ReturnType<typeof getResearchProject>): string | null {
  if (!project || project.effect.kind !== 'recipe-unlock') return null;
  const recipeName = project.effect.recipeName;
  return Object.values(FACILITIES).find((facility) => facility.recipes.some((recipe) => recipe.name === recipeName))?.type ?? null;
}

function getResearchAvailabilityForState(input: {
  projectId: ResearchProjectId;
  achievements: AchievementLedger;
  research: ResearchLedger;
  grants: GrantLedger;
  prestige: PrestigeLedger;
  finance: Finance;
  currentGameTimeMs: number;
  startingConditionId: StartingConditionId | null;
}): ResearchAvailability {
  const project = getResearchProject(input.projectId);
  if (!project) return { allowed: false, startable: false, unmetReasons: ['Unknown research project.'], cost: 0, usesFreeGrant: false };
  if (input.research.hasCompleted(project.id)) return { allowed: false, startable: false, unmetReasons: ['Research already completed.'], cost: project.cost, usesFreeGrant: false };
  if (input.research.getActiveProject()) return { allowed: false, startable: false, unmetReasons: ['Research in progress.'], cost: project.cost, usesFreeGrant: false };
  const evaluation = evaluateGateRequirements(project.requirements, createResearchGateContext(input));
  const unmetReasons = [...evaluation.unmetReasons];
  const grantTarget = getRecipeResearchGrantTarget(project);
  const usesFreeGrant = grantTarget !== null && input.grants.hasAvailableFreeActionForTargets('start-research', [grantTarget, project.id]);
  if (usesFreeGrant) return { allowed: evaluation.allowed, startable: unmetReasons.length === 0, unmetReasons, cost: 0, usesFreeGrant: true };
  if (!input.finance.canAfford(project.cost)) unmetReasons.push(`Requires €${project.cost.toLocaleString()} available.`);
  return { allowed: evaluation.allowed, startable: unmetReasons.length === 0, unmetReasons, cost: project.cost, usesFreeGrant: false };
}

/** Produces a fresh, current-version company snapshot without touching runtime state. */
export function createStartingGameSnapshot(nowMs = Date.now()): GameSnapshot {
  const finance = new Finance();
  const inventory = new Inventory();
  inventory.setAmount(ResourceType.ConstructionMaterials, STANDARD_START_CONSTRUCTION_MATERIALS);
  return {
    finance: finance.toSnapshot(),
    inventory: inventory.toSnapshot(),
    market: new Market().toSnapshot(),
    facilities: new FacilityCollection().toSnapshot(),
    salesContracts: new SalesContracts().toSnapshot(),
    achievements: new AchievementLedger().toSnapshot(),
    productionStatistics: new ProductionStatistics().toSnapshot(),
    prestige: createStartingPrestige(finance, nowMs).toSnapshot(),
    research: new ResearchLedger().toSnapshot(),
    grants: new GrantLedger().toSnapshot(),
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
  inventory: Inventory;
}): { achievements: AchievementLedger; prestige: PrestigeLedger; inventory: Inventory } {
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
    return { achievements: input.achievements, prestige: input.prestige, inventory: input.inventory };
  }

  const achievements = input.achievements.clone();
  const prestige = input.prestige.clone();
  const inventory = input.inventory.clone();

  for (const definition of eligible) {
    if (achievements.unlock(definition.id, input.currentGameTimeMs)) {
      prestige.recordAchievement({
        achievementId: definition.id,
        name: definition.name,
        prestigeAmount: definition.prestigeAmount,
        decayHalfLifeForegroundHours: definition.prestigeHalfLifeForegroundHours,
        createdAtGameTimeMs: input.currentGameTimeMs,
      });
      for (const reward of definition.rewards ?? []) inventory.add(reward.resourceType, reward.amount);
    }
  }

  return { achievements, prestige, inventory };
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
  research: new ResearchLedger(),
  grants: new GrantLedger(),
  startingConditionId: null,
  companyStartedAtGameTimeMs: initialGameTimeMs,
  lastProcessedAtMs: initialGameTimeMs,
  lastObservedAtMs: initialGameTimeMs,
  unprocessedWorkMs: 0,
  customerPipelineProgress: 0,
  addAdminFunds: (amount) => {
    if (!Number.isFinite(amount) || amount === 0) return false;
    const finance = get().finance.clone();
    if (!finance.applyTransaction(amount, 'Admin balance adjustment', new Date().toISOString())) return false;
    set({ finance });
    return true;
  },
  setAdminBalance: (amount) => {
    if (!Number.isFinite(amount) || amount < 0) return false;
    const currentBalance = get().finance.getBalance();
    return get().addAdminFunds(amount - currentBalance);
  },
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
  buyMissingConstructionMaterials: (facilityType) => {
    get().advanceRealtime(Date.now());
    const definition = getFacilityDefinition(facilityType);
    const facilities = get().facilities;
    const inventory = get().inventory.clone();
    const market = get().market.clone();
    const finance = get().finance.clone();
    const missingAmount = Math.max(
      0,
      definition.constructionMaterialsCost - inventory.getAmount(ResourceType.ConstructionMaterials),
    );
    const trade = market.buyFromLocal(ResourceType.ConstructionMaterials, missingAmount);
    const materialsTotal = trade.unitPrice * trade.amount;

    if (missingAmount === 0 || !trade.success
      || !finance.canAfford(definition.landCost + materialsTotal)
      || !inventory.add(ResourceType.ConstructionMaterials, trade.amount, trade.quality)
      || !finance.applyTransaction(
        -materialsTotal,
        `Bought ${trade.amount} Construction Materials for ${definition.name}`,
        new Date().toISOString(),
      )) return false;

    set({ market, inventory, finance });
    return true;
  },
  buildFacility: (facilityType) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const finance = get().finance.clone();
    const inventory = get().inventory.clone();
    const definition = getFacilityDefinition(facilityType);
    const isFirstFacility = facilities.getAll().length === 0;

    if (!finance.canAfford(definition.landCost)
      || !inventory.has(ResourceType.ConstructionMaterials, definition.constructionMaterialsCost)
      || !facilities.build(facilityType)) {
      return false;
    }

    if (!finance.applyTransaction(
      -definition.landCost,
      `Purchased land for ${facilities.getAllByType(facilityType).at(-1)?.getView().displayName ?? definition.name}`,
      new Date().toISOString(),
    ) || !inventory.remove(ResourceType.ConstructionMaterials, definition.constructionMaterialsCost)) {
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
      inventory,
    });
    const grants = get().grants.clone();
    if (isFirstFacility) {
      grants.grant({
        id: FIRST_FACILITY_RECIPE_RESEARCH_GRANT_ID,
        action: 'start-research',
        targetId: facilityType,
        grantedAtGameTimeMs: get().lastProcessedAtMs,
      });
    }
    set({ facilities, finance, grants, ...achievementResult });
    return true;
  },
  destroyFacility: (facilityId) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();

    if (!facilities.destroy(facilityId)) {
      return false;
    }

    set({ facilities });
    return true;
  },
  setFacilityRecipe: (facilityId, recipeName) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const facility = facilities.get(facilityId);

    if (!facility || (recipeName !== null && !get().research.hasCompleted(getRecipeResearchProjectId(recipeName))) || !facility.setActiveRecipe(recipeName)) {
      return false;
    }

    set({ facilities });
    return true;
  },
  setFacilityProductionActive: (facilityId, active) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const facility = facilities.get(facilityId);

    if (!facility || !facility.setProductionActive(active)) {
      return false;
    }

    set({ facilities });
    return true;
  },
  setFacilityWorkers: (facilityId, workerCount) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const facility = facilities.get(facilityId);

    if (!facility || !facility.setAssignedWorkers(workerCount)) {
      return false;
    }

    set({ facilities });
    return true;
  },
  repairFacility: (facilityId) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const inventory = get().inventory.clone();
    const market = get().market.clone();
    const finance = get().finance.clone();
    const facility = facilities.get(facilityId);

    if (!facility) return false;

    const facilityView = facility.getView();
    const definition = getFacilityDefinition(facility.facilityType);
    const repairCost = getFacilityRepairCost(definition.constructionMaterialsCost, facilityView.facilityCondition);
    const missingMaterials = Math.max(0, repairCost - inventory.getAmount(ResourceType.ConstructionMaterials));
    let purchasedMaterialsCost = 0;

    if (missingMaterials > 0) {
      const trade = market.buyFromLocal(ResourceType.ConstructionMaterials, missingMaterials);
      purchasedMaterialsCost = trade.unitPrice * trade.amount;

      if (!trade.success
        || !finance.canAfford(purchasedMaterialsCost)
        || !inventory.add(ResourceType.ConstructionMaterials, trade.amount, trade.quality)
        || !finance.applyTransaction(
          -purchasedMaterialsCost,
          `Bought ${trade.amount} Construction Materials to repair ${facilityView.displayName}`,
          new Date().toISOString(),
        )) {
        return false;
      }
    }

    if (repairCost <= 0 || !inventory.has(ResourceType.ConstructionMaterials, repairCost)
      || !facility.repairCondition() || !inventory.remove(ResourceType.ConstructionMaterials, repairCost)) {
      return false;
    }

    const productionStatistics = get().productionStatistics.clone();
    productionStatistics.recordRepair(1 - facilityView.facilityCondition, purchasedMaterialsCost + Math.max(0, repairCost - missingMaterials) * market.getLocalPrice(ResourceType.ConstructionMaterials));
    const prestige = get().prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, get().lastProcessedAtMs);
    syncFacilityConditionPrestige(prestige, facilities, get().lastProcessedAtMs);
    const achievementResult = applyAchievementUnlocks({ achievements: get().achievements, productionStatistics, facilities, finance, salesContracts: get().salesContracts, prestige, companyStartedAtGameTimeMs: get().companyStartedAtGameTimeMs, currentGameTimeMs: get().lastProcessedAtMs, categories: ['facilities'], inventory });
    set({ facilities, inventory: achievementResult.inventory, market, finance, productionStatistics, achievements: achievementResult.achievements, prestige: achievementResult.prestige });
    return true;
  },
  upgradeFacility: (facilityId, upgradeKind) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const finance = get().finance.clone();
    const facility = facilities.get(facilityId);

    if (!facility) {
      return false;
    }

    const facilityView = facility.getView();
    const currentLevel = upgradeKind === 'speed'
      ? facilityView.speedUpgradeLevel
      : upgradeKind === 'output' ? facilityView.outputUpgradeLevel : facilityView.conditionDecayUpgradeLevel;
    const definition = getFacilityDefinition(facility.facilityType);
    const cost = getFacilityUpgradeCost(definition.upgradeCost, currentLevel);

    if (!finance.canAfford(cost)) {
      return false;
    }

    if (upgradeKind === 'speed') {
      facility.upgradeSpeed();
    } else if (upgradeKind === 'output') {
      facility.upgradeOutput();
    } else {
      facility.upgradeConditionDecay();
    }

    if (!finance.applyTransaction(
      -cost,
      `${upgradeKind === 'speed' ? 'Speed' : upgradeKind === 'output' ? 'Output' : 'Condition decay'} upgrade for ${facilityView.displayName}`,
      new Date().toISOString(),
    )) {
      return false;
    }

    const prestige = get().prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, get().lastProcessedAtMs);
    syncFacilityConditionPrestige(prestige, facilities, get().lastProcessedAtMs);
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
      inventory: get().inventory,
    });
    set({ facilities, finance, ...achievementResult });
    return true;
  },
  advanceGameTime: (elapsedMilliseconds) => {
    if (!Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds <= 0) {
      return 0;
    }

    const elapsedMs = Math.floor(elapsedMilliseconds);
    const hasConstructedFacility = get().facilities.getAll().length > 0;
    const hasActiveFacility = hasConstructedFacility && get().facilities.getAll().some((facility) => facility.getView().isActive);
    const facilities = hasConstructedFacility ? get().facilities.clone() : get().facilities;
    let inventory = hasActiveFacility ? get().inventory.clone() : get().inventory;
    let productionStatistics = get().productionStatistics;
    let salesContracts: SalesContracts | null = null;
    let market: Market | null = null;
    let marketFinance: Finance | null = null;
    let research = get().research;
    let unprocessedWorkMs = get().unprocessedWorkMs;
    let customerPipelineProgress = get().customerPipelineProgress;
    let elapsedMinutes = 0;
    let remainingMs = elapsedMs;

    while (remainingMs > 0) {
      const stepMs = Math.min(FOREGROUND_SIMULATION_STEP_MS, remainingMs);

      if (hasConstructedFacility) {
        facilities.applyPassiveConditionLoss((stepMs / REALTIME_WORK_MINUTE_MS) * FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE);
      }

      if (hasActiveFacility) {
        market ??= get().market.clone();
        marketFinance ??= get().finance.clone();
        for (const facility of facilities.getAll()) {
          for (const input of getFacilityMissingInputs(facility.getView().activeRecipeName, inventory)) {
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
        const baseWork = (stepMs / REALTIME_WORK_MINUTE_MS) * BASE_WORK_PER_MINUTE;
        const outputs = advanceAllFacilityProduction(facilities, inventory, (facility, recipeName) => calculateFacilityEffectiveWork(
          facility,
          baseWork,
          getRecipeResearchWorkSpeedMultiplier(recipeName, research.getCompletedProjectIds()),
        ));
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

      const stepStartGameTimeMs = get().lastProcessedAtMs + elapsedMs - remainingMs;
      const stepEndGameTimeMs = stepStartGameTimeMs + stepMs;
      for (const resourceType of RESOURCE_TYPES) {
        const activeMarket = market ?? get().market;
        const automation = activeMarket.getAutomation(resourceType);
        const completedIntervals = Math.floor(stepEndGameTimeMs / automation.autoSellIntervalMs) - Math.floor(stepStartGameTimeMs / automation.autoSellIntervalMs);
        if (!automation.autoSellEnabled || completedIntervals <= 0) continue;
        const currentPrice = activeMarket.getLocalPrice(resourceType);
        const amount = Math.min(
          automation.autoSellMaxPerMinute * automation.autoSellIntervalMs * completedIntervals / REALTIME_WORK_MINUTE_MS,
          Math.max(0, inventory.getAmount(resourceType) - automation.autoSellMinKeep),
        );
        if (amount <= 0 || currentPrice < automation.autoSellMinUnitPrice) continue;
        market ??= activeMarket.clone();
        marketFinance ??= get().finance.clone();
        if (inventory === get().inventory) inventory = inventory.clone();
        const trade = market.sellToLocal(resourceType, amount, inventory.getQuality(resourceType));
        if (trade.success && inventory.remove(resourceType, amount)) {
          marketFinance.applyTransaction(
            trade.unitPrice * trade.amount,
            `Autosold ${trade.amount} ${resourceType} to local market`,
            new Date().toISOString(),
          );
        }
      }

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
          getMaximumOpenSalesContracts(research.getCompletedProjectIds()),
        );
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
    let completedResearchProjectId: ResearchProjectId | null = null;

    if (research.getActiveProject()) {
      research = research.clone();
      completedResearchProjectId = research.advance(elapsedMs);
      if (completedResearchProjectId) {
        research.complete(completedResearchProjectId, nextGameTimeMs);
        const completedProject = getResearchProject(completedResearchProjectId);
        if (completedProject?.effect.kind === 'grant') {
          marketFinance ??= get().finance.clone();
          marketFinance.applyTransaction(
            completedProject.effect.amount,
            `Research completed: ${completedProject.name}`,
            new Date().toISOString(),
          );
          prestige = prestige.clone();
          syncCompanyBalancePrestige(prestige, marketFinance, nextGameTimeMs);
        }
      }
    }

    if (Math.floor(previousGameTimeMs / PRESTIGE_FOREGROUND_HOUR_MS)
      < Math.floor(nextGameTimeMs / PRESTIGE_FOREGROUND_HOUR_MS)) {
      const nextPrestige = prestige === get().prestige ? prestige.clone() : prestige;
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
    if (completedResearchProjectId && getResearchProject(completedResearchProjectId)?.effect.kind === 'grant') {
      achievementCategories.push('finance', 'prestige');
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
        inventory,
      })
      : { achievements: get().achievements, prestige, inventory };

    set({
      lastProcessedAtMs: nextGameTimeMs,
      unprocessedWorkMs,
      customerPipelineProgress,
      ...(hasConstructedFacility ? { facilities } : {}),
      ...(inventory !== get().inventory ? { inventory } : {}),
      ...(achievementResult.inventory !== get().inventory ? { inventory: achievementResult.inventory } : {}),
      ...(marketFinance ? { finance: marketFinance } : {}),
      ...(productionStatistics !== get().productionStatistics ? { productionStatistics } : {}),
      ...(salesContracts ? { salesContracts } : {}),
      ...(market ? { market } : {}),
      ...(research !== get().research ? { research } : {}),
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
  setStartingConditionId: (startingConditionId) => {
    set({ startingConditionId });
  },
  getResearchAvailability: (projectId) => getResearchAvailabilityForState({
    projectId,
    achievements: get().achievements,
    research: get().research,
    grants: get().grants,
    prestige: get().prestige,
    finance: get().finance,
    currentGameTimeMs: get().lastProcessedAtMs,
    startingConditionId: get().startingConditionId,
  }),
  startResearch: (projectId) => {
    get().advanceRealtime(Date.now());
    const state = get();
    const project = getResearchProject(projectId);
    const availability = !project ? null : getResearchAvailabilityForState({
      projectId,
      achievements: state.achievements,
      research: state.research,
      grants: state.grants,
      prestige: state.prestige,
      finance: state.finance,
      currentGameTimeMs: state.lastProcessedAtMs,
      startingConditionId: state.startingConditionId,
    });
    if (!project || !availability?.startable) return false;

    const research = state.research.clone();
    const grants = state.grants.clone();
    const finance = state.finance.clone();
    const grantTarget = getRecipeResearchGrantTarget(project);
    if ((availability.usesFreeGrant && (!grantTarget || !grants.useFreeActionForTargets('start-research', [grantTarget, project.id], state.lastProcessedAtMs)))
      || !research.start(projectId, availability.cost)
      || !finance.applyTransaction(-availability.cost, `Research started: ${project.name}`, new Date().toISOString())) return false;

    const prestige = state.prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, state.lastProcessedAtMs);
    set({ research, grants, finance, prestige });
    return true;
  },
  cancelResearch: () => {
    get().advanceRealtime(Date.now());
    const state = get();
    const research = state.research.clone();
    const cancelled = research.cancel();
    if (!cancelled) return false;

    const project = getResearchProject(cancelled.projectId);
    const finance = state.finance.clone();
    if (!finance.applyTransaction(
      cancelled.paidCost,
      `Research cancelled: ${project?.name ?? cancelled.projectId}`,
      new Date().toISOString(),
    )) return false;

    const prestige = state.prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, state.lastProcessedAtMs);
    const achievementResult = applyAchievementUnlocks({
      achievements: state.achievements,
      productionStatistics: state.productionStatistics,
      facilities: state.facilities,
      finance,
      salesContracts: state.salesContracts,
      prestige,
      companyStartedAtGameTimeMs: state.companyStartedAtGameTimeMs,
      currentGameTimeMs: state.lastProcessedAtMs,
      categories: ['finance', 'prestige'],
      inventory: state.inventory,
    });
    set({ research, finance, ...achievementResult });
    return true;
  },
  createSalesContractRequest: (resourceType, quantity) => {
    const salesContracts = get().salesContracts.clone();
    if (!salesContracts.createOfferForResource(
      resourceType,
      quantity,
      get().market.getGlobalPrice(resourceType) * MARKET_SALES_CONTRACT_PREMIUM,
      getMaximumOpenSalesContracts(get().research.getCompletedProjectIds()),
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
      inventory,
    });
    set({ market, finance, salesContracts, ...achievementResult });
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
    research: get().research.toSnapshot(),
    grants: get().grants.toSnapshot(),
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
    const research = ResearchLedger.fromSnapshot(snapshot.research);
    const grants = GrantLedger.fromSnapshot(snapshot.grants);
    const inventory = Inventory.fromSnapshot(snapshot.inventory);
    syncCompanyBalancePrestige(prestige, finance, snapshot.time.lastProcessedAtMs);
    syncFacilityConditionPrestige(prestige, facilities, snapshot.time.lastProcessedAtMs);
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
      inventory,
    });

    set({
    finance,
    inventory: achievementResult.inventory,
    market,
    facilities,
    salesContracts,
    achievements: achievementResult.achievements,
    productionStatistics,
    prestige: achievementResult.prestige,
    research,
    grants,
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
