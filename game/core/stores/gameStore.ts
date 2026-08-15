import { Finance, LOAN_COLLECTION, buildFinanceStatementData, calculateAssets, calculateFacilityAssetValue, calculateLoanSearchEstimate, generateLoanOffers, LENDER_TYPES, refreshLoanOfferAvailability, type LoanOffer, type LoanSearchCriteria } from '@/game/finance';
import { Inventory } from '@/game/inventory';
import { FACILITIES, FacilityCollection, advanceAllFacilityProduction, calculateFacilityEffectiveWork, FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE, getFacilityDefinition, getFacilityMissingInputs, getFacilityProductionCycleInputs, getFacilityRepairCost, getFacilityUpgradeCost, getFacilityUpgradeResourceCost, type FacilityType, type FacilityUpgradeKind } from '@/game/facilities';
import type { RecipeName } from '@/game/recipes';
import { RESOURCE_TYPES, ResourceType } from '@/game/resources';
import { MARKET_DIFFUSION_INTERVAL_MS, MARKET_SALES_ORDER_BID_MULTIPLIER, Market, canAutoBuyMarketResource, canBuyMarketResource, canSellMarketResource, type MarketAutomation } from '@/game/market';
import type { GameSnapshot } from '@/game/core/state';
import { BASE_WORK_PER_MINUTE, FOREGROUND_SIMULATION_STEP_MS, REALTIME_WORK_MINUTE_MS, calculateRealtimeAdvance } from '@/game/core/time';
import { SalesOrders, calculateSalesOrderAcquisitionChance, getSalesResourceProfile } from '@/game/sales';
import { AchievementLedger, ProductionStatistics, createAchievementEvaluationContext, evaluateAchievementUnlocks, type AchievementCategory } from '@/game/achievements';
import { PrestigeLedger, PRESTIGE_FOREGROUND_HOUR_MS, calculateCompanyAssetsPrestige, calculateCompanyBalancePrestige, calculateCompanyPrestigeSummary, calculateFacilityConditionPrestige } from '@/game/prestige';
import { evaluateGateRequirements, type GateContext, type GateEvaluation } from '@/game/gates';
import { ResearchLedger, getLocalMarketDepthMultiplier, getLocalRegionalDiffusionMultiplier, getMaximumOpenSalesOrders, getMaximumSimultaneousResearchProjects, getRecipeResearchProjectId, getRecipeResearchWorkSpeedMultiplier, getResearchProject, getSalesOrderBidMultiplier, getSalesOfferProducedResourceWeight, getSalesOfferResourceTypes, type ResearchProjectId } from '@/game/research';
import { FIRST_FACILITY_RECIPE_RESEARCH_GRANT_ID, FIRST_FACILITY_RECIPE_RESEARCH_WORK_SPEED_MULTIPLIER, GrantLedger } from '@/game/grants';
import type { StartingConditionId } from '@/game/company/companyTypes';
import { STANDARD_START_CONSTRUCTION_MATERIALS, STANDARD_START_INDUSTRIAL_MACHINES } from '@/game/company/companyConstants';
import { create } from 'zustand';
import { formatNumber } from '@/utils';

export type ResearchAvailability = GateEvaluation & {
  startable: boolean;
  unmetReasons: string[];
  cost: number;
  durationMs: number;
  usesFreeGrant: boolean;
};

type GameState = {
  finance: Finance;
  inventory: Inventory;
  market: Market;
  facilities: FacilityCollection;
  salesOrders: SalesOrders;
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
  buyMissingConstructionInputs: (facilityType: FacilityType) => boolean;
  buildFacility: (facilityType: FacilityType) => boolean;
  sellFacility: (facilityId: string) => boolean;
  setFacilityRecipe: (facilityId: string, recipeName: RecipeName | null) => boolean;
  setFacilityProductionCycle: (facilityId: string, recipeNames: readonly RecipeName[]) => boolean;
  setFacilityProductionActive: (facilityId: string, active: boolean) => boolean;
  setFacilityWorkers: (facilityId: string, workerCount: number) => boolean;
  repairFacility: (facilityId: string) => boolean;
  upgradeFacility: (facilityId: string, upgradeKind: FacilityUpgradeKind) => boolean;
  advanceGameTime: (elapsedMilliseconds: number) => number;
  advanceRealtime: (nowMs: number) => number;
  fastForwardOneMinute: () => boolean;
  createSalesOrderRequest: (resourceType: ResourceType, quantity: number) => boolean;
  fulfillSalesOrder: (orderId: string) => boolean;
  rejectSalesOrder: (orderId: string) => boolean;
  setStartingConditionId: (startingConditionId: StartingConditionId | null) => void;
  getResearchAvailability: (projectId: ResearchProjectId) => ResearchAvailability;
  startResearch: (projectId: ResearchProjectId) => boolean;
  cancelResearch: () => boolean;
  acceptLoanOffer: (offer: LoanOffer) => boolean;
  removeUnavailableLoanOffers: () => number;
  removeLoanOffer: (offerId: string) => boolean;
  startLoanSearch: (criteria: LoanSearchCriteria) => { success: boolean; reason?: string };
  makeExtraLoanPayment: (loanId: string) => { success: boolean; reason?: string };
  repayLoanInFull: (loanId: string) => { success: boolean; reason?: string };
  acknowledgeCollectionNotice: (noticeId: string) => boolean;
  acceptDebtRestructure: () => { success: boolean; reason?: string };
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

function syncCompanyAssetsPrestige(prestige: PrestigeLedger, input: { finance: Finance; inventory: Inventory; market: Market; facilities: FacilityCollection; research: ResearchLedger }, currentGameTimeMs: number): void {
  const assets = calculateAssets(input);
  const liabilities = input.finance.getLoans().filter((loan) => loan.status !== 'repaid').reduce((total, loan) => total + loan.remainingBalance, 0);
  prestige.syncCompanyAssets(calculateCompanyAssetsPrestige({ assetBookValue: assets.totalAssets, liabilities }), currentGameTimeMs);
}

function syncFacilityConditionPrestige(prestige: PrestigeLedger, facilities: FacilityCollection, currentGameTimeMs: number): void {
  prestige.syncFacilityCondition(calculateFacilityConditionPrestige(facilities.getAll().map((facility) => facility.getView().facilityCondition)), currentGameTimeMs);
}

function createStartingPrestige(finance: Finance, currentGameTimeMs: number): PrestigeLedger {
  const prestige = new PrestigeLedger();
  syncCompanyBalancePrestige(prestige, finance, currentGameTimeMs);
  prestige.syncCompanyAssets(calculateCompanyAssetsPrestige({ assetBookValue: finance.getBalance(), liabilities: 0 }), currentGameTimeMs);
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

function getResearchDurationMs(project: NonNullable<ReturnType<typeof getResearchProject>>, usesFreeGrant: boolean): number {
  return usesFreeGrant
    ? Math.ceil(project.durationMs / FIRST_FACILITY_RECIPE_RESEARCH_WORK_SPEED_MULTIPLIER)
    : project.durationMs;
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
  if (!project) return { allowed: false, startable: false, unmetReasons: ['Unknown research project.'], cost: 0, durationMs: 0, usesFreeGrant: false };
  if (input.research.hasCompleted(project.id)) return { allowed: false, startable: false, unmetReasons: ['Research already completed.'], cost: project.cost, durationMs: project.durationMs, usesFreeGrant: false };
  if (input.research.getActiveProjects().length >= getMaximumSimultaneousResearchProjects(input.research.getCompletedProjectIds())) return { allowed: false, startable: false, unmetReasons: ['All research slots are occupied.'], cost: project.cost, durationMs: project.durationMs, usesFreeGrant: false };
  const evaluation = evaluateGateRequirements(project.requirements, createResearchGateContext(input));
  const unmetReasons = [...evaluation.unmetReasons];
  const grantTarget = getRecipeResearchGrantTarget(project);
  const usesFreeGrant = grantTarget !== null && input.grants.hasAvailableFreeActionForTargets('start-research', [grantTarget, project.id]);
  if (usesFreeGrant) return { allowed: evaluation.allowed, startable: unmetReasons.length === 0, unmetReasons, cost: 0, durationMs: getResearchDurationMs(project, true), usesFreeGrant: true };
  if (!input.finance.canAfford(project.cost)) unmetReasons.push(`Requires €${project.cost.toLocaleString()} available.`);
  return { allowed: evaluation.allowed, startable: unmetReasons.length === 0, unmetReasons, cost: project.cost, durationMs: getResearchDurationMs(project, false), usesFreeGrant: false };
}

/** Produces a fresh, current-version company snapshot without touching runtime state. */
export function createStartingGameSnapshot(nowMs = Date.now()): GameSnapshot {
  const finance = new Finance();
  const inventory = new Inventory();
  inventory.setAmount(ResourceType.ConstructionMaterials, STANDARD_START_CONSTRUCTION_MATERIALS);
  inventory.setAmount(ResourceType.IndustrialMachines, STANDARD_START_INDUSTRIAL_MACHINES);
  return {
    finance: finance.toSnapshot(),
    inventory: inventory.toSnapshot(),
    market: new Market().toSnapshot(),
    facilities: new FacilityCollection().toSnapshot(),
    salesOrders: new SalesOrders().toSnapshot(),
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
  salesOrders: SalesOrders;
  prestige: PrestigeLedger;
  companyStartedAtGameTimeMs: number;
  currentGameTimeMs: number;
  categories: readonly AchievementCategory[];
  inventory: Inventory;
}): { achievements: AchievementLedger; prestige: PrestigeLedger; inventory: Inventory } {
  const context = createAchievementEvaluationContext({
    facilities: input.facilities,
    finance: input.finance,
    salesOrders: input.salesOrders,
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
  salesOrders: new SalesOrders(),
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
    if (!finance.applyTransaction({ amount, description: 'Admin balance adjustment', detailLines: [], kind: 'equity', source: 'admin-adjustment', occurredAtGameTimeMs: get().lastProcessedAtMs })) return false;
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
      || !finance.applyTransaction({ amount: -total, description: `Bought ${trade.amount} ${resourceType} from local market`, detailLines: [`Unit price: €${trade.unitPrice.toFixed(2)}`], kind: 'operating', source: 'market-purchase', occurredAtGameTimeMs: get().lastProcessedAtMs })) return false;
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
      || !finance.applyTransaction({ amount: total, description: `Sold ${trade.amount} ${resourceType} to local market`, detailLines: [`Unit price: €${trade.unitPrice.toFixed(2)}`], kind: 'operating', source: 'market-sale', occurredAtGameTimeMs: get().lastProcessedAtMs })) return false;
    set({ market, inventory, finance });
    return true;
  },
  setMarketAutomation: (resourceType, updates) => {
    const market = get().market.clone();
    if (!market.setAutomation(resourceType, updates)) return false;
    set({ market });
    return true;
  },
  buyMissingConstructionInputs: (facilityType) => {
    get().advanceRealtime(Date.now());
    const definition = getFacilityDefinition(facilityType);
    const facilities = get().facilities;
    const inventory = get().inventory.clone();
    const market = get().market.clone();
    const finance = get().finance.clone();
    const missingConstructionMaterials = Math.max(0, definition.constructionMaterialsCost - inventory.getAmount(ResourceType.ConstructionMaterials));
    const missingIndustrialMachines = Math.max(0, definition.industrialMachinesCost - inventory.getAmount(ResourceType.IndustrialMachines));
    const missingInputs = [
      { resourceType: ResourceType.ConstructionMaterials, amount: missingConstructionMaterials },
      { resourceType: ResourceType.IndustrialMachines, amount: missingIndustrialMachines },
    ].filter((input) => input.amount > 0);
    if (missingInputs.length === 0) return false;

    const trades = missingInputs.map((input) => ({ ...input, trade: market.buyFromLocal(input.resourceType, input.amount) }));
    const purchaseCost = trades.reduce((total, { trade }) => total + trade.unitPrice * trade.amount, 0);

    if (trades.some(({ trade }) => !trade.success)
      || !finance.canAfford(definition.landCost + purchaseCost)
      || trades.some(({ resourceType, trade }) => !inventory.add(resourceType, trade.amount, trade.quality))
      || !finance.applyTransaction({ amount: -purchaseCost, description: `Bought missing construction inputs for ${definition.name}`, detailLines: trades.map(({ resourceType, trade }) => `${trade.amount} ${resourceType} at €${trade.unitPrice.toFixed(2)} each`), kind: 'operating', source: 'market-purchase', occurredAtGameTimeMs: get().lastProcessedAtMs })) return false;

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
      || !inventory.has(ResourceType.IndustrialMachines, definition.industrialMachinesCost)
      || !facilities.build(facilityType)) {
      return false;
    }

    if (!finance.applyTransaction({ amount: -definition.landCost, description: `Purchased land for ${facilities.getAllByType(facilityType).at(-1)?.getView().displayName ?? definition.name}`, detailLines: [`Construction materials committed: ${definition.constructionMaterialsCost}`, `Industrial machines installed: ${definition.industrialMachinesCost}`], kind: 'investing', source: 'facility-construction', occurredAtGameTimeMs: get().lastProcessedAtMs }) || !inventory.remove(ResourceType.ConstructionMaterials, definition.constructionMaterialsCost) || !inventory.remove(ResourceType.IndustrialMachines, definition.industrialMachinesCost)) {
      return false;
    }

    const prestige = get().prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, get().lastProcessedAtMs);
    syncCompanyAssetsPrestige(prestige, { finance, inventory, market: get().market, facilities, research: get().research }, get().lastProcessedAtMs);
    syncFacilityConditionPrestige(prestige, facilities, get().lastProcessedAtMs);
    const achievementResult = applyAchievementUnlocks({
      achievements: get().achievements,
      productionStatistics: get().productionStatistics,
      facilities,
      finance,
      salesOrders: get().salesOrders,
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
  sellFacility: (facilityId) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const facility = facilities.get(facilityId);
    if (!facility) return false;
    const finance = get().finance.clone();
    const bookValue = calculateFacilityAssetValue(facility, get().market);
    const proceeds = bookValue * LOAN_COLLECTION.voluntaryFacilitySaleRate;
    if (!finance.applyTransaction({ amount: proceeds, description: `Sold ${facility.getView().displayName}`, detailLines: [`Book value: €${bookValue.toFixed(2)}`, `Sale recovery: ${Math.round(LOAN_COLLECTION.voluntaryFacilitySaleRate * 100)}%`], kind: 'investing', source: 'facility-sale', occurredAtGameTimeMs: get().lastProcessedAtMs }) || !facilities.destroy(facilityId)) return false;
    const prestige = get().prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, get().lastProcessedAtMs);
    syncCompanyAssetsPrestige(prestige, { finance, inventory: get().inventory, market: get().market, facilities, research: get().research }, get().lastProcessedAtMs);
    syncFacilityConditionPrestige(prestige, facilities, get().lastProcessedAtMs);
    set({ facilities, finance, prestige });
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
  setFacilityProductionCycle: (facilityId, recipeNames) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const facility = facilities.get(facilityId);

    if (!facility || (recipeNames.length > 0 && !recipeNames.every((recipeName) => get().research.hasCompleted(getRecipeResearchProjectId(recipeName))))
      || !facility.setProductionCycle(recipeNames)) return false;

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
    const cashRepairCost = getFacilityRepairCost(definition.landCost, facilityView.facilityCondition);
    const constructionMaterialsRepairCost = getFacilityRepairCost(definition.constructionMaterialsCost, facilityView.facilityCondition);
    const industrialMachinesRepairCost = getFacilityRepairCost(definition.industrialMachinesCost, facilityView.facilityCondition);
    const missingConstructionMaterials = Math.max(0, constructionMaterialsRepairCost - inventory.getAmount(ResourceType.ConstructionMaterials));
    const missingIndustrialMachines = Math.max(0, industrialMachinesRepairCost - inventory.getAmount(ResourceType.IndustrialMachines));
    const missingInputs = [
      { resourceType: ResourceType.ConstructionMaterials, amount: missingConstructionMaterials },
      { resourceType: ResourceType.IndustrialMachines, amount: missingIndustrialMachines },
    ].filter((input) => input.amount > 0);
    const trades = missingInputs.map((input) => ({ ...input, trade: market.buyFromLocal(input.resourceType, input.amount) }));
    const missingInputPurchaseCost = trades.reduce((total, { trade }) => total + trade.amount * trade.unitPrice, 0);

    if (cashRepairCost + constructionMaterialsRepairCost + industrialMachinesRepairCost <= 0
      || trades.some(({ trade }) => !trade.success)
      || !finance.canAfford(cashRepairCost + missingInputPurchaseCost)
      || trades.some(({ resourceType, trade }) => !inventory.add(resourceType, trade.amount, trade.quality))
      || !inventory.has(ResourceType.ConstructionMaterials, constructionMaterialsRepairCost)
      || !inventory.has(ResourceType.IndustrialMachines, industrialMachinesRepairCost)
      || !facility.repairCondition()
      || !inventory.remove(ResourceType.ConstructionMaterials, constructionMaterialsRepairCost)
      || !inventory.remove(ResourceType.IndustrialMachines, industrialMachinesRepairCost)
      || (missingInputPurchaseCost > 0 && !finance.applyTransaction({ amount: -missingInputPurchaseCost, description: `Bought missing repair inputs for ${facilityView.displayName}`, detailLines: trades.map(({ resourceType, trade }) => `${trade.amount} ${resourceType} at €${trade.unitPrice.toFixed(2)} each`), kind: 'operating', source: 'market-purchase', occurredAtGameTimeMs: get().lastProcessedAtMs }))
      || !finance.applyTransaction({ amount: -cashRepairCost, description: `Repair for ${facilityView.displayName}`, detailLines: [`Construction Materials used: ${constructionMaterialsRepairCost}`, `Industrial Machines used: ${industrialMachinesRepairCost}`], kind: 'operating', source: 'facility-repair', occurredAtGameTimeMs: get().lastProcessedAtMs })) {
      return false;
    }

    const productionStatistics = get().productionStatistics.clone();
    productionStatistics.recordRepair(1 - facilityView.facilityCondition, cashRepairCost + missingInputPurchaseCost + (constructionMaterialsRepairCost - missingConstructionMaterials) * market.getLocalPrice(ResourceType.ConstructionMaterials) + (industrialMachinesRepairCost - missingIndustrialMachines) * market.getLocalPrice(ResourceType.IndustrialMachines));
    const prestige = get().prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, get().lastProcessedAtMs);
    syncCompanyAssetsPrestige(prestige, { finance, inventory, market, facilities, research: get().research }, get().lastProcessedAtMs);
    syncFacilityConditionPrestige(prestige, facilities, get().lastProcessedAtMs);
    const achievementResult = applyAchievementUnlocks({ achievements: get().achievements, productionStatistics, facilities, finance, salesOrders: get().salesOrders, prestige, companyStartedAtGameTimeMs: get().companyStartedAtGameTimeMs, currentGameTimeMs: get().lastProcessedAtMs, categories: ['facilities', 'finance'], inventory });
    set({ facilities, inventory: achievementResult.inventory, market, finance, productionStatistics, achievements: achievementResult.achievements, prestige: achievementResult.prestige });
    return true;
  },
  upgradeFacility: (facilityId, upgradeKind) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const finance = get().finance.clone();
    const inventory = get().inventory.clone();
    const market = get().market.clone();
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
    const constructionMaterialsCost = getFacilityUpgradeResourceCost(definition.constructionMaterialsCost, currentLevel);
    const industrialMachinesCost = getFacilityUpgradeResourceCost(definition.industrialMachinesCost, currentLevel);
    const missingConstructionMaterials = Math.max(0, constructionMaterialsCost - inventory.getAmount(ResourceType.ConstructionMaterials));
    const missingIndustrialMachines = Math.max(0, industrialMachinesCost - inventory.getAmount(ResourceType.IndustrialMachines));
    const missingInputs = [
      { resourceType: ResourceType.ConstructionMaterials, amount: missingConstructionMaterials },
      { resourceType: ResourceType.IndustrialMachines, amount: missingIndustrialMachines },
    ].filter((input) => input.amount > 0);
    const trades = missingInputs.map((input) => ({ ...input, trade: market.buyFromLocal(input.resourceType, input.amount) }));
    const missingInputPurchaseCost = trades.reduce((total, { trade }) => total + trade.amount * trade.unitPrice, 0);

    if (trades.some(({ trade }) => !trade.success)
      || !finance.canAfford(cost + missingInputPurchaseCost)
      || trades.some(({ resourceType, trade }) => !inventory.add(resourceType, trade.amount, trade.quality))) {
      return false;
    }

    if (upgradeKind === 'speed') {
      facility.upgradeSpeed();
    } else if (upgradeKind === 'output') {
      facility.upgradeOutput();
    } else {
      facility.upgradeConditionDecay();
    }

    if ((missingInputPurchaseCost > 0 && !finance.applyTransaction({ amount: -missingInputPurchaseCost, description: `Bought missing upgrade inputs for ${facilityView.displayName}`, detailLines: trades.map(({ resourceType, trade }) => `${trade.amount} ${resourceType} at €${trade.unitPrice.toFixed(2)} each`), kind: 'operating', source: 'market-purchase', occurredAtGameTimeMs: get().lastProcessedAtMs }))
      || !finance.applyTransaction({ amount: -cost, description: `${upgradeKind === 'speed' ? 'Speed' : upgradeKind === 'output' ? 'Output' : 'Condition decay'} upgrade for ${facilityView.displayName}`, detailLines: [`Level ${currentLevel + 1}`, `Construction materials committed: ${constructionMaterialsCost}`, `Industrial machines installed: ${industrialMachinesCost}`], kind: 'investing', source: 'facility-upgrade', occurredAtGameTimeMs: get().lastProcessedAtMs })
      || !inventory.remove(ResourceType.ConstructionMaterials, constructionMaterialsCost)
      || !inventory.remove(ResourceType.IndustrialMachines, industrialMachinesCost)) {
      return false;
    }

    const prestige = get().prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, get().lastProcessedAtMs);
    syncCompanyAssetsPrestige(prestige, { finance, inventory, market, facilities, research: get().research }, get().lastProcessedAtMs);
    syncFacilityConditionPrestige(prestige, facilities, get().lastProcessedAtMs);
    const achievementResult = applyAchievementUnlocks({
      achievements: get().achievements,
      productionStatistics: get().productionStatistics,
      facilities,
      finance,
      salesOrders: get().salesOrders,
      prestige,
      companyStartedAtGameTimeMs: get().companyStartedAtGameTimeMs,
      currentGameTimeMs: get().lastProcessedAtMs,
      categories: ['facilities', 'finance', 'prestige'],
      inventory,
    });
    set({ facilities, market, finance, ...achievementResult });
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
    let salesOrders: SalesOrders | null = null;
    let market: Market | null = null;
    let marketFinance: Finance | null = null;
    let research = get().research;
    let unprocessedWorkMs = get().unprocessedWorkMs;
    let customerPipelineProgress = get().customerPipelineProgress;
    let elapsedMinutes = 0;
    let remainingMs = elapsedMs;

    while (remainingMs > 0) {
      const stepMs = Math.min(FOREGROUND_SIMULATION_STEP_MS, remainingMs);
      const stepStartGameTimeMs = get().lastProcessedAtMs + elapsedMs - remainingMs;
      const stepEndGameTimeMs = stepStartGameTimeMs + stepMs;

      if (hasConstructedFacility) {
        facilities.applyPassiveConditionLoss((stepMs / REALTIME_WORK_MINUTE_MS) * FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE);
      }

      const automationMarket: Market = market ?? get().market;
      for (const resourceType of RESOURCE_TYPES) {
        const automation = automationMarket.getAutomation(resourceType);
        const completedIntervals = Math.floor(stepEndGameTimeMs / automation.autoTradeIntervalMs) - Math.floor(stepStartGameTimeMs / automation.autoTradeIntervalMs);
        const targetDeficit = automation.autoBuyTargetInventory - inventory.getAmount(resourceType);
        if (!automation.autoBuyEnabled || completedIntervals <= 0 || targetDeficit <= 0 || !canAutoBuyMarketResource(resourceType)) continue;
        const unitPrice = automationMarket.getLocalPrice(resourceType);
        const availableFinance = marketFinance ?? get().finance;
        const purchaseAmount = Math.min(targetDeficit, automationMarket.getMaximumLocalPurchaseAmountAtUnitPrice(resourceType, automation.autoBuyMaxUnitPrice));
        if (unitPrice > automation.autoBuyMaxUnitPrice || purchaseAmount <= 0 || !availableFinance.canAfford(unitPrice * purchaseAmount)) continue;
        const buyingMarket: Market = market ?? automationMarket.clone();
        market = buyingMarket;
        marketFinance ??= get().finance.clone();
        if (inventory === get().inventory) inventory = inventory.clone();
        const trade = buyingMarket.buyFromLocal(resourceType, purchaseAmount);
        if (trade.success && inventory.add(resourceType, trade.amount, trade.quality)) {
          marketFinance.applyTransaction({ amount: -trade.unitPrice * trade.amount, description: `Autobought ${formatNumber(trade.amount, { smartDecimals: true })} ${resourceType}`, detailLines: [`Unit price: €${trade.unitPrice.toFixed(2)}`], kind: 'operating', source: 'market-purchase', occurredAtGameTimeMs: stepEndGameTimeMs });
        }
      }

      if (hasActiveFacility) {
        market ??= get().market.clone();
        marketFinance ??= get().finance.clone();
        for (const facility of facilities.getAll()) {
          for (const input of getFacilityProductionCycleInputs(facility.getView())) {
            const automation = market.getAutomation(input.resourceType);
            const completedIntervals = Math.floor(stepEndGameTimeMs / automation.autoTradeIntervalMs) - Math.floor(stepStartGameTimeMs / automation.autoTradeIntervalMs);
            const unitPrice = market.getLocalPrice(input.resourceType);
            const targetDeficit = automation.autoBuyTargetInventory - inventory.getAmount(input.resourceType);
            const productionCycleDeficit = input.amount - inventory.getAmount(input.resourceType);
            const purchaseAmount = Math.min(
              Math.max(productionCycleDeficit, targetDeficit),
              market.getMaximumLocalPurchaseAmountAtUnitPrice(input.resourceType, automation.autoBuyMaxUnitPrice),
            );
            if (!automation.autoBuyEnabled || completedIntervals <= 0 || !canAutoBuyMarketResource(input.resourceType)
              || unitPrice > automation.autoBuyMaxUnitPrice || !marketFinance.canAfford(unitPrice * purchaseAmount)) continue;
            const trade = market.buyFromLocal(input.resourceType, purchaseAmount);
            if (trade.success && inventory.add(input.resourceType, trade.amount, trade.quality)) {
              marketFinance.applyTransaction({ amount: -trade.unitPrice * trade.amount, description: `Autobought ${formatNumber(trade.amount, { smartDecimals: true })} ${input.resourceType} for production`, detailLines: [`Unit price: €${trade.unitPrice.toFixed(2)}`], kind: 'operating', source: 'market-purchase', occurredAtGameTimeMs: stepEndGameTimeMs });
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

      const currentSalesOrders = salesOrders ?? get().salesOrders;
      const currentPrestige = calculateCompanyPrestigeSummary(get().prestige.getEvents(), stepEndGameTimeMs).totalPrestige;
      const offerChance = calculateSalesOrderAcquisitionChance({
        openOrderCount: currentSalesOrders.getOfferedOrders().length,
        companyPrestige: currentPrestige,
        economyPhase: (marketFinance ?? get().finance).getEconomyPhase(),
        hasEligibleInventory: getSalesOfferResourceTypes(research.getCompletedProjectIds(), productionStatistics.toSnapshot().producedByResource).some((resourceType) => inventory.getAmount(resourceType) >= getSalesResourceProfile(resourceType).standardOrderLot),
      });
      customerPipelineProgress += (stepMs / 1_000) * offerChance / 60;

      for (const resourceType of RESOURCE_TYPES) {
        const activeMarket = market ?? get().market;
        const automation = activeMarket.getAutomation(resourceType);
        const completedIntervals = Math.floor(stepEndGameTimeMs / automation.autoTradeIntervalMs) - Math.floor(stepStartGameTimeMs / automation.autoTradeIntervalMs);
        if (!automation.autoSellEnabled || completedIntervals <= 0) continue;
        const currentPrice = activeMarket.getLocalPrice(resourceType);
        const amount = Math.min(
          automation.autoSellMaxPerMinute * automation.autoTradeIntervalMs * completedIntervals / REALTIME_WORK_MINUTE_MS,
          Math.max(0, inventory.getAmount(resourceType) - automation.autoSellMinKeep),
        );
        if (amount <= 0 || currentPrice < automation.autoSellMinUnitPrice) continue;
        market ??= activeMarket.clone();
        marketFinance ??= get().finance.clone();
        if (inventory === get().inventory) inventory = inventory.clone();
        const trade = market.sellToLocal(resourceType, amount, inventory.getQuality(resourceType));
        if (trade.success && inventory.remove(resourceType, amount)) {
          marketFinance.applyTransaction({ amount: trade.unitPrice * trade.amount, description: `Autosold ${trade.amount} ${resourceType} to local market`, detailLines: [`Unit price: €${trade.unitPrice.toFixed(2)}`], kind: 'operating', source: 'market-sale', occurredAtGameTimeMs: stepEndGameTimeMs });
        }
      }

      const completedDiffusionIntervals = Math.floor(stepEndGameTimeMs / MARKET_DIFFUSION_INTERVAL_MS)
        - Math.floor(stepStartGameTimeMs / MARKET_DIFFUSION_INTERVAL_MS);
      if (completedDiffusionIntervals > 0) {
        market ??= get().market.clone();
        for (let interval = 0; interval < completedDiffusionIntervals; interval += 1) {
          market.diffuse(MARKET_DIFFUSION_INTERVAL_MS);
        }
      }

      const totalSalesMs = unprocessedWorkMs + stepMs;
      const completedSalesMinutes = Math.floor(totalSalesMs / REALTIME_WORK_MINUTE_MS);
      unprocessedWorkMs = totalSalesMs - completedSalesMinutes * REALTIME_WORK_MINUTE_MS;

      if (completedSalesMinutes > 0) {
        salesOrders ??= get().salesOrders.clone();
        const activeMarket = market ?? get().market;
        let ordersCreated = 0;
        for (let minute = 0; minute < completedSalesMinutes; minute += 1) {
          const result = salesOrders.advanceTime({
            currentGameTimeMs: stepEndGameTimeMs - (completedSalesMinutes - minute - 1) * REALTIME_WORK_MINUTE_MS,
            maximumOpenOrders: getMaximumOpenSalesOrders(research.getCompletedProjectIds()),
            companyPrestige: calculateCompanyPrestigeSummary(get().prestige.getEvents(), stepEndGameTimeMs).totalPrestige,
            economyPhase: (marketFinance ?? get().finance).getEconomyPhase(),
            inventoryByResource: Object.fromEntries(RESOURCE_TYPES.map((resourceType) => [resourceType, inventory.getAmount(resourceType)])) as Record<ResourceType, number>,
            globalPrices: Object.fromEntries(RESOURCE_TYPES.map((resourceType) => [resourceType, activeMarket.getGlobalPrice(resourceType)])) as Record<ResourceType, number>,
            candidateResourceTypes: getSalesOfferResourceTypes(research.getCompletedProjectIds(), productionStatistics.toSnapshot().producedByResource),
            getResourceWeight: (resourceType) => productionStatistics.toSnapshot().producedByResource[resourceType] > 0 ? getSalesOfferProducedResourceWeight(research.getCompletedProjectIds()) : 1,
            bidResearchMultiplier: getSalesOrderBidMultiplier(research.getCompletedProjectIds(), MARKET_SALES_ORDER_BID_MULTIPLIER),
          });
          ordersCreated += result.ordersCreated;
        }
        elapsedMinutes += completedSalesMinutes;

        if (ordersCreated > 0) {
          customerPipelineProgress = 0;
        }
      }

      remainingMs -= stepMs;
    }

    const previousGameTimeMs = get().lastProcessedAtMs;
    const nextGameTimeMs = previousGameTimeMs + elapsedMs;
    const financeForLoanProcessing = marketFinance ?? get().finance.clone();
    let financeChanged = financeForLoanProcessing.advanceLoanAndEconomy(nextGameTimeMs);
    const newCollectionNotices = financeForLoanProcessing.getCollectionNotices().filter((notice) => notice.occurredAtGameTimeMs > previousGameTimeMs && notice.occurredAtGameTimeMs <= nextGameTimeMs);
    for (const notice of newCollectionNotices.filter((candidate) => candidate.stage === 'liquidation')) {
      const loan = financeForLoanProcessing.getLoans().find((candidate) => candidate.id === notice.loanId);
      if (!loan) continue;
      const assetsBeforeCollection = calculateAssets({ finance: financeForLoanProcessing, inventory, market: market ?? get().market, facilities, research }).totalAssets;
      const maximumRecovery = Math.min(loan.remainingBalance, assetsBeforeCollection * LOAN_COLLECTION.maximumAssetSeizureRate);
      let recovered = 0;
      if (maximumRecovery > 0) {
        inventory = inventory.clone();
        market ??= get().market.clone();
        for (const resourceType of RESOURCE_TYPES) {
          const available = inventory.getAmount(resourceType);
          const unitRecovery = market.getLocalPrice(resourceType) * LOAN_COLLECTION.forcedInventoryRecoveryRate;
          const amount = unitRecovery > 0 ? Math.min(available, (maximumRecovery - recovered) / unitRecovery) : 0;
          if (amount <= 0) continue;
          const trade = market.sellToLocal(resourceType, amount, inventory.getQuality(resourceType));
          const proceeds = trade.unitPrice * trade.amount * LOAN_COLLECTION.forcedInventoryRecoveryRate;
          if (trade.success && inventory.remove(resourceType, trade.amount) && financeForLoanProcessing.applyTransaction({ amount: proceeds, description: `Forced inventory liquidation: ${resourceType}`, detailLines: [`Recovery rate: ${Math.round(LOAN_COLLECTION.forcedInventoryRecoveryRate * 100)}%`], kind: 'investing', source: 'forced-asset-liquidation', occurredAtGameTimeMs: nextGameTimeMs })) recovered += proceeds;
          if (recovered >= maximumRecovery - 0.01) break;
        }
        for (const facility of facilities.getAll().sort((left, right) => calculateFacilityAssetValue(right, market!) - calculateFacilityAssetValue(left, market!))) {
          const proceeds = calculateFacilityAssetValue(facility, market) * LOAN_COLLECTION.forcedFacilityRecoveryRate;
          if (proceeds <= 0 || recovered + proceeds > maximumRecovery + 0.01) continue;
          if (facilities.destroy(facility.id) && financeForLoanProcessing.applyTransaction({ amount: proceeds, description: `Forced facility liquidation: ${facility.getView().displayName}`, detailLines: [`Recovery rate: ${Math.round(LOAN_COLLECTION.forcedFacilityRecoveryRate * 100)}%`], kind: 'investing', source: 'forced-asset-liquidation', occurredAtGameTimeMs: nextGameTimeMs })) recovered += proceeds;
          if (recovered >= maximumRecovery - 0.01) break;
        }
        financeForLoanProcessing.applyDebtRecovery(loan.id, recovered, nextGameTimeMs);
      }
    }
    const completedSearchCriteria = financeForLoanProcessing.advanceLoanSearch(elapsedMs);
    if (financeForLoanProcessing.getActiveLoanSearch() || completedSearchCriteria) financeChanged = true;
    if (completedSearchCriteria) {
      const report = buildFinanceStatementData({ achievements: get().achievements, companyStartedAtGameTimeMs: get().companyStartedAtGameTimeMs, currentGameTimeMs: nextGameTimeMs, facilities, finance: financeForLoanProcessing, inventory, market: market ?? get().market, period: 'all-time', research });
      financeForLoanProcessing.completeLoanSearch(generateLoanOffers({ lenders: financeForLoanProcessing.getLenders(), limitBreakdown: report.loanLimitBreakdown, creditRating: report.creditRating, economyPhase: financeForLoanProcessing.getEconomyPhase(), criteria: completedSearchCriteria }), completedSearchCriteria.offerCount, nextGameTimeMs);
    }
    if (financeChanged) marketFinance = financeForLoanProcessing;
    let prestige = get().prestige;
    let completedResearchProjectId: ResearchProjectId | null = null;

    prestige = prestige.clone();
    for (const notice of newCollectionNotices) {
      if (notice.stage === 'penalty') prestige.recordFinancePenalty({ sourceId: `loan-delinquency:${notice.loanId}:${notice.missedPayments}`, amount: 0.5, description: 'Loan delinquency', createdAtGameTimeMs: notice.occurredAtGameTimeMs });
      if (notice.stage === 'liquidation') prestige.recordFinancePenalty({ sourceId: `loan-liquidation:${notice.loanId}:${notice.missedPayments}`, amount: 1.5, description: 'Assets liquidated for debt', createdAtGameTimeMs: notice.occurredAtGameTimeMs });
      if (notice.stage === 'default') prestige.recordFinancePenalty({ sourceId: `loan-default:${notice.loanId}`, amount: 3, description: 'Loan default', createdAtGameTimeMs: notice.occurredAtGameTimeMs });
    }
    syncCompanyBalancePrestige(prestige, marketFinance ?? get().finance, nextGameTimeMs);
    syncCompanyAssetsPrestige(prestige, { finance: marketFinance ?? get().finance, inventory, market: market ?? get().market, facilities, research }, nextGameTimeMs);
    if (hasConstructedFacility) {
      syncFacilityConditionPrestige(prestige, facilities, nextGameTimeMs);
    }

    if (research.getActiveProjects().length > 0) {
      research = research.clone();
      const completedResearchProjectIds = research.advanceAll(elapsedMs);
      completedResearchProjectId = completedResearchProjectIds[0] ?? null;
      for (const completedResearchProjectId of completedResearchProjectIds) {
        research.complete(completedResearchProjectId, nextGameTimeMs);
        const completedProject = getResearchProject(completedResearchProjectId);
        if (completedProject?.effect.kind === 'local-market-depth') {
          market ??= get().market.clone();
          market.setLocalMarketDepthMultiplier(getLocalMarketDepthMultiplier(research.getCompletedProjectIds()));
        }
        if (completedProject?.effect.kind === 'local-regional-diffusion') {
          market ??= get().market.clone();
          market.setLocalRegionalDiffusionMultiplier(getLocalRegionalDiffusionMultiplier(research.getCompletedProjectIds()));
        }
        if (completedProject?.effect.kind === 'grant') {
          marketFinance ??= get().finance.clone();
          marketFinance.applyTransaction({ amount: completedProject.effect.amount, description: `Research completed: ${completedProject.name}`, detailLines: [], kind: 'equity', source: 'research-grant', occurredAtGameTimeMs: nextGameTimeMs });
          prestige = prestige.clone();
          syncCompanyBalancePrestige(prestige, marketFinance, nextGameTimeMs);
          syncCompanyAssetsPrestige(prestige, { finance: marketFinance, inventory, market: market ?? get().market, facilities, research }, nextGameTimeMs);
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
        salesOrders: salesOrders ?? get().salesOrders,
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
      ...(salesOrders ? { salesOrders } : {}),
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
  acceptLoanOffer: (offer) => {
    get().advanceRealtime(Date.now());
    const state = get();
    const finance = state.finance.clone();
    const selectedOffer = finance.getLoanSearchOffers().find((candidate) => candidate.id === offer.id);
    if (!selectedOffer) return false;
    const report = buildFinanceStatementData({ achievements: state.achievements, companyStartedAtGameTimeMs: state.companyStartedAtGameTimeMs, currentGameTimeMs: state.lastProcessedAtMs, facilities: state.facilities, finance, inventory: state.inventory, market: state.market, period: 'all-time', research: state.research });
    const lenderLimit = report.loanLimitBreakdown.lenderBreakdowns.find((candidate) => candidate.lenderId === selectedOffer.lenderId);
    if (!lenderLimit?.isAvailable || selectedOffer.principal > lenderLimit.availableLimit) return false;
    if (!finance.acceptLoan(selectedOffer, state.lastProcessedAtMs)) return false;
    const refreshedReport = buildFinanceStatementData({ achievements: state.achievements, companyStartedAtGameTimeMs: state.companyStartedAtGameTimeMs, currentGameTimeMs: state.lastProcessedAtMs, facilities: state.facilities, finance, inventory: state.inventory, market: state.market, period: 'all-time', research: state.research });
    finance.refreshLoanSearchOffers(refreshLoanOfferAvailability(finance.getLoanSearchOffers(), refreshedReport.loanLimitBreakdown));
    const prestige = state.prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, state.lastProcessedAtMs);
    syncCompanyAssetsPrestige(prestige, { finance, inventory: state.inventory, market: state.market, facilities: state.facilities, research: state.research }, state.lastProcessedAtMs);
    const achievementResult = applyAchievementUnlocks({
      achievements: state.achievements,
      productionStatistics: state.productionStatistics,
      facilities: state.facilities,
      finance,
      salesOrders: state.salesOrders,
      prestige,
      companyStartedAtGameTimeMs: state.companyStartedAtGameTimeMs,
      currentGameTimeMs: state.lastProcessedAtMs,
      categories: ['finance', 'prestige'],
      inventory: state.inventory,
    });
    set({ finance, ...achievementResult });
    return true;
  },
  removeUnavailableLoanOffers: () => {
    const finance = get().finance.clone();
    const removed = finance.removeUnavailableLoanSearchOffers();
    if (removed > 0) set({ finance });
    return removed;
  },
  removeLoanOffer: (offerId) => {
    const finance = get().finance.clone();
    if (!finance.removeLoanSearchOffer(offerId)) return false;
    set({ finance });
    return true;
  },
  startLoanSearch: (criteria) => {
    get().advanceRealtime(Date.now());
    const state = get();
    const finance = state.finance.clone();
    const result = finance.startLoanSearch(criteria, calculateLoanSearchEstimate(criteria, LENDER_TYPES.length), state.lastProcessedAtMs);
    if (!result.success) return result;
    set({ finance });
    return result;
  },
  makeExtraLoanPayment: (loanId) => {
    get().advanceRealtime(Date.now());
    const finance = get().finance.clone();
    const result = finance.makeExtraLoanPayment(loanId, get().lastProcessedAtMs);
    if (result.success) set({ finance });
    return result;
  },
  repayLoanInFull: (loanId) => {
    get().advanceRealtime(Date.now());
    const finance = get().finance.clone();
    const result = finance.repayLoanInFull(loanId, get().lastProcessedAtMs);
    if (result.success) set({ finance });
    return result;
  },
  acknowledgeCollectionNotice: (noticeId) => {
    const finance = get().finance.clone();
    if (!finance.acknowledgeCollectionNotice(noticeId)) return false;
    set({ finance });
    return true;
  },
  acceptDebtRestructure: () => {
    const finance = get().finance.clone();
    const result = finance.acceptRestructure(get().lastProcessedAtMs);
    if (!result.success) return result;
    const prestige = get().prestige.clone();
    syncCompanyAssetsPrestige(prestige, { finance, inventory: get().inventory, market: get().market, facilities: get().facilities, research: get().research }, get().lastProcessedAtMs);
    set({ finance, prestige });
    return result;
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
      || !research.start(projectId, availability.cost, availability.durationMs)
      || !finance.applyTransaction({ amount: -availability.cost, description: `Research started: ${project.name}`, detailLines: [`Capitalized cost: €${availability.cost.toFixed(2)}`], kind: 'investing', source: 'research-investment', occurredAtGameTimeMs: state.lastProcessedAtMs })) return false;

    const prestige = state.prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, state.lastProcessedAtMs);
    syncCompanyAssetsPrestige(prestige, { finance, inventory: state.inventory, market: state.market, facilities: state.facilities, research: state.research }, state.lastProcessedAtMs);
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
    if (!finance.applyTransaction({ amount: cancelled.paidCost, description: `Research cancelled: ${project?.name ?? cancelled.projectId}`, detailLines: [], kind: 'investing', source: 'research-refund', occurredAtGameTimeMs: state.lastProcessedAtMs })) return false;

    const prestige = state.prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, state.lastProcessedAtMs);
    syncCompanyAssetsPrestige(prestige, { finance, inventory: state.inventory, market: state.market, facilities: state.facilities, research: state.research }, state.lastProcessedAtMs);
    const achievementResult = applyAchievementUnlocks({
      achievements: state.achievements,
      productionStatistics: state.productionStatistics,
      facilities: state.facilities,
      finance,
      salesOrders: state.salesOrders,
      prestige,
      companyStartedAtGameTimeMs: state.companyStartedAtGameTimeMs,
      currentGameTimeMs: state.lastProcessedAtMs,
      categories: ['finance', 'prestige'],
      inventory: state.inventory,
    });
    set({ research, finance, ...achievementResult });
    return true;
  },
  createSalesOrderRequest: (resourceType, quantity) => {
    const salesOrders = get().salesOrders.clone();
    if (!salesOrders.createDevelopmentOrderForResource(
      resourceType,
      quantity,
      get().market.getGlobalPrice(resourceType) * getSalesOrderBidMultiplier(get().research.getCompletedProjectIds(), MARKET_SALES_ORDER_BID_MULTIPLIER),
      getMaximumOpenSalesOrders(get().research.getCompletedProjectIds()),
      get().lastProcessedAtMs,
      calculateCompanyPrestigeSummary(get().prestige.getEvents(), get().lastProcessedAtMs).totalPrestige,
    )) {
      return false;
    }

    set({ salesOrders, customerPipelineProgress: 0 });
    return true;
  },
  fulfillSalesOrder: (orderId) => {
    get().advanceRealtime(Date.now());
    const salesOrders = get().salesOrders.clone();
    const order = salesOrders.getOfferedOrder(orderId);

    if (!order) {
      return false;
    }

    const inventory = get().inventory.clone();
    const finance = get().finance.clone();
    const market = get().market.clone();

    if (!inventory.has(order.resourceType, order.quantity)) {
      return false;
    }

    const quality = inventory.getQuality(order.resourceType);
    const currentGameTimeMs = get().lastProcessedAtMs;
    if (!inventory.remove(order.resourceType, order.quantity)
      || !finance.applyTransaction({ amount: order.reward, description: `Customer order fulfilled: ${order.customerName}`, detailLines: [`Delivered ${order.quantity} ${order.resourceType}`], kind: 'operating', source: 'order-sale', occurredAtGameTimeMs: currentGameTimeMs })
      || !salesOrders.fulfill(order.id, currentGameTimeMs, calculateCompanyPrestigeSummary(get().prestige.getEvents(), currentGameTimeMs).totalPrestige)
      || !market.addToGlobal(order.resourceType, order.quantity, quality)) {
      return false;
    }

    const prestige = get().prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, currentGameTimeMs);
    syncCompanyAssetsPrestige(prestige, { finance, inventory: get().inventory, market: get().market, facilities: get().facilities, research: get().research }, currentGameTimeMs);
    prestige.recordSalesOrder(order.id, order.reward, order.premiumPercent, currentGameTimeMs);

    const achievementResult = applyAchievementUnlocks({
      achievements: get().achievements,
      productionStatistics: get().productionStatistics,
      facilities: get().facilities,
      finance,
      salesOrders,
      prestige,
      companyStartedAtGameTimeMs: get().companyStartedAtGameTimeMs,
      currentGameTimeMs,
      categories: ['sales', 'finance', 'prestige'],
      inventory,
    });
    set({ market, finance, salesOrders, ...achievementResult });
    return true;
  },
  rejectSalesOrder: (orderId) => {
    const salesOrders = get().salesOrders.clone();
    const rejected = salesOrders.reject(orderId, get().lastProcessedAtMs);

    if (!rejected) {
      return false;
    }

    set({ salesOrders });
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
    salesOrders: get().salesOrders.toSnapshot(),
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
    const salesOrders = SalesOrders.fromSnapshot(snapshot.salesOrders);
    const achievements = AchievementLedger.fromSnapshot(snapshot.achievements);
    const productionStatistics = ProductionStatistics.fromSnapshot(snapshot.productionStatistics);
    const prestige = PrestigeLedger.fromSnapshot(snapshot.prestige);
    const research = ResearchLedger.fromSnapshot(snapshot.research);
    market.restoreLocalMarketDepthMultiplier(getLocalMarketDepthMultiplier(research.getCompletedProjectIds()));
    market.setLocalRegionalDiffusionMultiplier(getLocalRegionalDiffusionMultiplier(research.getCompletedProjectIds()));
    const grants = GrantLedger.fromSnapshot(snapshot.grants);
    const inventory = Inventory.fromSnapshot(snapshot.inventory);
    syncCompanyBalancePrestige(prestige, finance, snapshot.time.lastProcessedAtMs);
    syncCompanyAssetsPrestige(prestige, { finance, inventory, market, facilities, research }, snapshot.time.lastProcessedAtMs);
    syncFacilityConditionPrestige(prestige, facilities, snapshot.time.lastProcessedAtMs);
    const achievementResult = applyAchievementUnlocks({
      achievements,
      productionStatistics,
      facilities,
      finance,
      salesOrders,
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
    salesOrders,
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
