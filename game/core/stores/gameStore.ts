import { Finance, LOAN_COLLECTION, buildFinanceStatementData, calculateAssets, calculateFacilityAssetValue, calculateLoanSearchEstimate, generateLoanOffers, LENDER_TYPES, refreshLoanOfferAvailability, type LoanOffer, type LoanSearchCriteria } from '@/game/finance';
import { Inventory, ResourceFlowLedger } from '@/game/inventory';
import { FACILITIES, FacilityCollection, FacilityMaintenanceStatistics, advanceAllFacilityProduction, calculateFacilityEffectiveWork, calculateFacilityProductionMaintenanceCost, FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE, FACILITY_REPAIR_DURATION_PER_CONDITION_MS, getFacilityDefinition, getFacilityMissingInputs, getMissingFacilityMaterials, getFacilityProductionCycleInputs, getFacilityRepairCost, getFacilityUpgradeCost, getFacilityUpgradeResourceCost, getStaffingChangeCost, getStaffingChangeDurationMs, getStaffTrainingCost, getStaffTrainingDurationMs, type FacilityType, type FacilityUpgradeKind } from '@/game/facilities';
import { calculateOutputQuality, calculateProductionMaxQ } from '@/game/quality';
import { getRecipe, type RecipeName } from '@/game/recipes';
import { RESOURCE_TYPES, ResourceType } from '@/game/resources';
import { MARKET_DIFFUSION_INTERVAL_MS, MARKET_SALES_ORDER_BID_MULTIPLIER, Market, canAutoBuyMarketResource, canBuyMarketResource, canSellMarketResource, type MarketAutomation } from '@/game/market';
import type { GameSnapshot } from '@/game/core/state';
import { BASE_WORK_PER_MINUTE, FOREGROUND_SIMULATION_STEP_MS, REALTIME_WORK_MINUTE_MS, calculateRealtimeAdvance } from '@/game/core/time';
import { SALES_ORDER_MINIMUM_COMPANY_VALUE_CAP, SalesOrders, calculateSalesOrderAcquisitionRate, calculateSalesOrderAcquisitionDetails, calculateSalesOrderInventoryValueReadiness, getOfferableSalesOrderResourceTypes, getSalesOrderAcquisitionStatus as getSalesOrderAcquisitionStatusForState, type SalesOrderAcquisitionStatus } from '@/game/sales';
import { AchievementLedger, createAchievementEvaluationContext, evaluateAchievementUnlocks, type AchievementCategory } from '@/game/achievements';

import { PrestigeLedger, PRESTIGE_FOREGROUND_HOUR_MS, calculateCompanyAssetsPrestige, calculateCompanyBalancePrestige, calculateCompanyPrestigeSummary, calculateFacilityConditionPrestige } from '@/game/prestige';
import { evaluateGateRequirements, type GateContext, type GateEvaluation } from '@/game/gates';
import { ResearchLedger, getFacilityAutoRepairLimit, getLocalMarketDepthMultiplier, getLocalRegionalDiffusionMultiplier, getMaximumOpenSalesOrders, getMaximumSimultaneousResearchProjects, getRecipeResearchProjectId, getRecipeResearchWorkSpeedMultiplier, getResearchProject, getResourceResearchMaxQ, getSalesOfferProducedResourceWeight, getSalesOfferResourceTypes, getSalesOrderBidMultiplier, getSalesOrderBundleMaturityMultiplier, getSalesOrderMaximumCompanyValueFraction, getSalesOrderMinimumPremiumBonus, getSalesPressureOfferChanceMultiplier, getSalesRelationshipDecayHalfLifeMultiplier, getSalesRelationshipFailureLossMultiplier, getSalesRelationshipFulfilmentGainMultiplier, type ResearchProjectId } from '@/game/research';
import { FIRST_FACILITY_RECIPE_RESEARCH_GRANT_ID, FIRST_FACILITY_RECIPE_RESEARCH_MAX_DURATION_MS, FIRST_FACILITY_RECIPE_RESEARCH_WORK_SPEED_MULTIPLIER, GrantLedger } from '@/game/grants';
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

export type { SalesOrderAcquisitionStatus } from '@/game/sales';

type GameState = {
  finance: Finance;
  inventory: Inventory;
  resourceFlow: ResourceFlowLedger;
  market: Market;
  facilities: FacilityCollection;
  salesOrders: SalesOrders;
  achievements: AchievementLedger;
  facilityMaintenance: FacilityMaintenanceStatistics;
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
  setFacilityStaffWage: (facilityId: string, wagePerWorkerPerMinute: number) => boolean;
  setFacilityStaffing: (facilityId: string, workerCount: number, wagePerWorkerPerMinute: number) => boolean;
  trainFacilityStaff: (facilityId: string, workerCount: number) => boolean;
  setFacilityAutoRepair: (facilityId: string, enabled: boolean, threshold: number, target: number) => boolean;
  repairFacility: (facilityId: string, targetCondition?: number) => boolean;
  upgradeFacility: (facilityId: string, upgradeKind: FacilityUpgradeKind) => boolean;
  advanceGameTime: (elapsedMilliseconds: number) => number;
  advanceRealtime: (nowMs: number) => number;
  fastForwardOneMinute: () => boolean;
  createSalesOrderRequest: (resourceType: ResourceType, quantity: number) => boolean;
  getSalesOrderAcquisitionStatus: () => SalesOrderAcquisitionStatus;
  fulfillSalesOrder: (orderId: string) => boolean;
  rejectSalesOrder: (orderId: string) => boolean;
  setStartingConditionId: (startingConditionId: StartingConditionId | null) => void;
  getResearchAvailability: (projectId: ResearchProjectId) => ResearchAvailability;
  startResearch: (projectId: ResearchProjectId) => boolean;
  cancelResearch: (projectId: ResearchProjectId) => boolean;
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
    ? Math.min(FIRST_FACILITY_RECIPE_RESEARCH_MAX_DURATION_MS, Math.ceil(project.durationMs / FIRST_FACILITY_RECIPE_RESEARCH_WORK_SPEED_MULTIPLIER))
    : project.durationMs;
}

function executeFacilityRepair(input: {
  facility: ReturnType<FacilityCollection['get']>;
  inventory: Inventory;
  market: Market;
  finance: Finance;
  facilityMaintenance: FacilityMaintenanceStatistics;
  resourceFlow: ResourceFlowLedger;
  targetCondition: number;
  occurredAtGameTimeMs: number;
  automatic: boolean;
  completeCondition?: boolean;
}): boolean {
  const { facility, inventory, market, finance, facilityMaintenance, resourceFlow, occurredAtGameTimeMs, targetCondition } = input;
  if (!facility) return false;
  const facilityView = facility.getView();
  const definition = getFacilityDefinition(facility.facilityType);
  const repairTargetCondition = Number.isFinite(targetCondition) ? Math.min(1, Math.max(facilityView.facilityCondition, targetCondition)) : 1;
  const cashRepairCost = getFacilityRepairCost(definition.landCost, facilityView.facilityCondition, repairTargetCondition);
  const constructionMaterialsRepairCost = getFacilityRepairCost(definition.constructionMaterialsCost, facilityView.facilityCondition, repairTargetCondition);
  const industrialMachinesRepairCost = getFacilityRepairCost(definition.industrialMachinesCost, facilityView.facilityCondition, repairTargetCondition);
  const constructionMaterialsPrice = market.getLocalPrice(ResourceType.ConstructionMaterials);
  const industrialMachinesPrice = market.getLocalPrice(ResourceType.IndustrialMachines);
  const maintenanceExpense = cashRepairCost
    + constructionMaterialsRepairCost * constructionMaterialsPrice
    + industrialMachinesRepairCost * industrialMachinesPrice;
  const missingInputs = getMissingFacilityMaterials(inventory, { constructionMaterials: constructionMaterialsRepairCost, industrialMachines: industrialMachinesRepairCost });
  const quotes = missingInputs.map((missing) => ({ ...missing, quote: market.getLocalBuyQuote(missing.resourceType, missing.amount) }));
  const missingInputPurchaseCost = quotes.reduce((total, { quote }) => total + (quote.success ? quote.amount * quote.unitPrice : 0), 0);
  if (cashRepairCost + constructionMaterialsRepairCost + industrialMachinesRepairCost <= 0
    || quotes.some(({ quote }) => !quote.success)
    || !finance.canAfford(cashRepairCost + missingInputPurchaseCost)) {
    return false;
  }

  const trades = quotes.map(({ resourceType, amount }) => ({ resourceType, trade: market.buyFromLocal(resourceType, amount) }));
  if (trades.some(({ resourceType, trade }) => !trade.success || !inventory.add(resourceType, trade.amount, trade.quality, trade.unitPrice))) return false;
  if (!inventory.has(ResourceType.ConstructionMaterials, constructionMaterialsRepairCost)
    || !inventory.has(ResourceType.IndustrialMachines, industrialMachinesRepairCost)) return false;
  if (missingInputPurchaseCost > 0 && !finance.applyTransaction({ amount: -missingInputPurchaseCost, description: `Bought missing repair inputs for ${facilityView.displayName}`, detailLines: trades.map(({ resourceType, trade }) => `${trade.amount} ${resourceType} at €${trade.unitPrice.toFixed(2)} each`), kind: 'operating', source: 'market-purchase', occurredAtGameTimeMs })) return false;
  if ((input.completeCondition !== false && !facility.repairCondition(repairTargetCondition))
    || !inventory.remove(ResourceType.ConstructionMaterials, constructionMaterialsRepairCost)
    || !inventory.remove(ResourceType.IndustrialMachines, industrialMachinesRepairCost)) return false;
  if (!finance.applyTransaction({ amount: -cashRepairCost, description: `${input.automatic ? 'Auto-repair' : 'Repair'} for ${facilityView.displayName}`, detailLines: [`Construction Materials used: ${constructionMaterialsRepairCost}`, `Industrial Machines used: ${industrialMachinesRepairCost}`, `Target condition: ${Math.round(repairTargetCondition * 100)}%`], facilityAccounting: { facilityId: facility.id, classification: 'maintenance', historicalValue: maintenanceExpense }, kind: 'operating', source: 'facility-repair', occurredAtGameTimeMs })) return false;

  facilityMaintenance.recordRepair(repairTargetCondition - facilityView.facilityCondition, maintenanceExpense);
  for (const { resourceType, trade } of trades) resourceFlow.record('market-buy', resourceType, trade.amount, occurredAtGameTimeMs);
  resourceFlow.record('facility-spending', ResourceType.ConstructionMaterials, -constructionMaterialsRepairCost, occurredAtGameTimeMs);
  resourceFlow.record('facility-spending', ResourceType.IndustrialMachines, -industrialMachinesRepairCost, occurredAtGameTimeMs);
  return true;
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
  if (input.research.hasActive(project.id)) return { allowed: false, startable: false, unmetReasons: ['Research is already in progress.'], cost: project.cost, durationMs: project.durationMs, usesFreeGrant: false };
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
    resourceFlow: new ResourceFlowLedger().toSnapshot(),
    market: new Market().toSnapshot(),
    facilities: new FacilityCollection().toSnapshot(),
    salesOrders: new SalesOrders().toSnapshot(),
    achievements: new AchievementLedger().toSnapshot(),
    facilityMaintenance: new FacilityMaintenanceStatistics().toSnapshot(),
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
  facilityMaintenance: FacilityMaintenanceStatistics;
  resourceFlow: ResourceFlowLedger;
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
    facilityMaintenance: input.facilityMaintenance,
    resourceFlow: input.resourceFlow,
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
  resourceFlow: new ResourceFlowLedger(),
  market: new Market(),
  facilities: new FacilityCollection(),
  salesOrders: new SalesOrders(),
  achievements: new AchievementLedger(),
  facilityMaintenance: new FacilityMaintenanceStatistics(),
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
    if (!trade.success || !finance.canAfford(total) || !inventory.add(resourceType, trade.amount, trade.quality, trade.unitPrice)
      || !finance.applyTransaction({ amount: -total, description: `Bought ${trade.amount} ${resourceType} from local market`, detailLines: [`Unit price: €${trade.unitPrice.toFixed(2)}`, `Quality: Q${trade.quality.toFixed(2)}`], kind: 'operating', source: 'market-purchase', occurredAtGameTimeMs: get().lastProcessedAtMs })) return false;
    const resourceFlow = get().resourceFlow.clone();
    resourceFlow.record('market-buy', resourceType, trade.amount, get().lastProcessedAtMs);
    set({ market, inventory, finance, resourceFlow });
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
      || !finance.applyTransaction({ amount: total, description: `Sold ${trade.amount} ${resourceType} to local market`, detailLines: [`Unit price: €${trade.unitPrice.toFixed(2)}`, `Quality: Q${quality.toFixed(2)}`], kind: 'operating', source: 'market-sale', occurredAtGameTimeMs: get().lastProcessedAtMs })) return false;
    const resourceFlow = get().resourceFlow.clone();
    resourceFlow.record('market-sell', resourceType, -trade.amount, get().lastProcessedAtMs);
    set({ market, inventory, finance, resourceFlow });
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
    const missingInputs = getMissingFacilityMaterials(inventory, { constructionMaterials: definition.constructionMaterialsCost, industrialMachines: definition.industrialMachinesCost });
    if (missingInputs.length === 0) return false;

    const trades = missingInputs.map((input) => ({ ...input, trade: market.buyFromLocal(input.resourceType, input.amount) }));
    const purchaseCost = trades.reduce((total, { trade }) => total + trade.unitPrice * trade.amount, 0);

    if (trades.some(({ trade }) => !trade.success)
      || !finance.canAfford(definition.landCost + purchaseCost)
      || trades.some(({ resourceType, trade }) => !inventory.add(resourceType, trade.amount, trade.quality, trade.unitPrice))
      || !finance.applyTransaction({ amount: -purchaseCost, description: `Bought missing construction inputs for ${definition.name}`, detailLines: trades.map(({ resourceType, trade }) => `${trade.amount} ${resourceType} at €${trade.unitPrice.toFixed(2)} each`), kind: 'operating', source: 'market-purchase', occurredAtGameTimeMs: get().lastProcessedAtMs })) return false;

    const resourceFlow = get().resourceFlow.clone();
    for (const { resourceType, trade } of trades) resourceFlow.record('market-buy', resourceType, trade.amount, get().lastProcessedAtMs);
    set({ market, inventory, finance, resourceFlow });
    return true;
  },
  buildFacility: (facilityType) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const finance = get().finance.clone();
    const inventory = get().inventory.clone();
    const definition = getFacilityDefinition(facilityType);
    const isFirstFacility = facilities.getAll().length === 0;
    const constructionInvestment = definition.landCost
      + definition.constructionMaterialsCost * get().market.getLocalPrice(ResourceType.ConstructionMaterials)
      + definition.industrialMachinesCost * get().market.getLocalPrice(ResourceType.IndustrialMachines);

    if (!finance.canAfford(definition.landCost)
      || !inventory.has(ResourceType.ConstructionMaterials, definition.constructionMaterialsCost)
      || !inventory.has(ResourceType.IndustrialMachines, definition.industrialMachinesCost)
      || !facilities.build(facilityType)) {
      return false;
    }

    const builtFacility = facilities.getAllByType(facilityType).at(-1);
    if (!builtFacility || !finance.applyTransaction({ amount: -definition.landCost, description: `Purchased land for ${builtFacility.getView().displayName}`, detailLines: [`Construction materials committed: ${definition.constructionMaterialsCost}`, `Industrial machines installed: ${definition.industrialMachinesCost}`], facilityAccounting: { facilityId: builtFacility.id, classification: 'construction', historicalValue: constructionInvestment }, kind: 'investing', source: 'facility-construction', occurredAtGameTimeMs: get().lastProcessedAtMs }) || !inventory.remove(ResourceType.ConstructionMaterials, definition.constructionMaterialsCost) || !inventory.remove(ResourceType.IndustrialMachines, definition.industrialMachinesCost)) {
      return false;
    }

    const prestige = get().prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, get().lastProcessedAtMs);
    syncCompanyAssetsPrestige(prestige, { finance, inventory, market: get().market, facilities, research: get().research }, get().lastProcessedAtMs);
    syncFacilityConditionPrestige(prestige, facilities, get().lastProcessedAtMs);
    const achievementResult = applyAchievementUnlocks({
      achievements: get().achievements,
      facilityMaintenance: get().facilityMaintenance,
      resourceFlow: get().resourceFlow,
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
    const resourceFlow = get().resourceFlow.clone();
    resourceFlow.record('facility-spending', ResourceType.ConstructionMaterials, -definition.constructionMaterialsCost, get().lastProcessedAtMs);
    resourceFlow.record('facility-spending', ResourceType.IndustrialMachines, -definition.industrialMachinesCost, get().lastProcessedAtMs);
    for (const resourceType of RESOURCE_TYPES) {
      const rewardAmount = achievementResult.inventory.getAmount(resourceType) - inventory.getAmount(resourceType);
      if (rewardAmount > 0) resourceFlow.record('reward', resourceType, rewardAmount, get().lastProcessedAtMs);
    }
    set({ facilities, finance, grants, resourceFlow, ...achievementResult });
    return true;
  },
  sellFacility: (facilityId) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const facility = facilities.get(facilityId);
    if (!facility) return false;
    const finance = get().finance.clone();
    const bookValue = calculateFacilityAssetValue(facility, get().market, finance);
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

    if (!facility || facility.getView().pendingStaffingChange) {
      return false;
    }
    const currentWorkers = facility.getView().assignedWorkers;
    const workerDifference = Math.abs(workerCount - currentWorkers);
    if (!Number.isInteger(workerCount) || workerCount < 0 || workerDifference === 0) return false;
    const isHiring = workerCount > currentWorkers;
    const wage = facility.getView().staffWagePerWorkerPerMinute;
    const cost = getStaffingChangeCost(currentWorkers, workerCount, wage);
    const duration = getStaffingChangeDurationMs(currentWorkers, workerCount);
    const finance = get().finance.clone();
    if (!finance.applyTransaction({ amount: -cost, description: `${isHiring ? 'Hiring' : 'Severance'} for ${facility.getView().displayName}`, detailLines: [`Workers: ${workerDifference}`, `Completes in ${(duration / 60_000).toFixed(2)} min`], facilityAccounting: { facilityId, classification: 'staffing', historicalValue: cost }, kind: 'operating', source: 'facility-staffing', occurredAtGameTimeMs: get().lastProcessedAtMs }) || !facility.scheduleStaffingChange(workerCount, get().lastProcessedAtMs, get().lastProcessedAtMs + duration)) return false;
    set({ facilities, finance });
    return true;
  },
  setFacilityStaffWage: (facilityId, wagePerWorkerPerMinute) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const facility = facilities.get(facilityId);

    if (!facility || !facility.setStaffWagePerWorkerPerMinute(wagePerWorkerPerMinute)) {
      return false;
    }

    set({ facilities });
    return true;
  },
  setFacilityStaffing: (facilityId, workerCount, wagePerWorkerPerMinute) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const facility = facilities.get(facilityId);
    if (!facility || !Number.isInteger(workerCount) || workerCount < 0 || !facility.setStaffWagePerWorkerPerMinute(wagePerWorkerPerMinute)) return false;
    const currentWorkers = facility.getView().assignedWorkers;
    if (workerCount === currentWorkers) { set({ facilities }); return true; }
    const cost = getStaffingChangeCost(currentWorkers, workerCount, wagePerWorkerPerMinute);
    const duration = getStaffingChangeDurationMs(currentWorkers, workerCount);
    const finance = get().finance.clone();
    const isHiring = workerCount > currentWorkers;
    if (!finance.applyTransaction({ amount: -cost, description: `${isHiring ? 'Hiring' : 'Severance'} for ${facility.getView().displayName}`, detailLines: [`Workers: ${Math.abs(workerCount - currentWorkers)}`, `Completes in ${(duration / 60_000).toFixed(2)} min`], facilityAccounting: { facilityId, classification: 'staffing', historicalValue: cost }, kind: 'operating', source: 'facility-staffing', occurredAtGameTimeMs: get().lastProcessedAtMs }) || !facility.scheduleStaffingChange(workerCount, get().lastProcessedAtMs, get().lastProcessedAtMs + duration)) return false;
    set({ facilities, finance });
    return true;
  },
  trainFacilityStaff: (facilityId, workerCount) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const facility = facilities.get(facilityId);
    if (!facility || !Number.isInteger(workerCount) || workerCount <= 0) return false;
    const view = facility.getView();
    const duration = getStaffTrainingDurationMs(workerCount);
    const cost = getStaffTrainingCost(view.staffQuality, workerCount);
    const finance = get().finance.clone();
    const startedAt = get().lastProcessedAtMs;
    if (!finance.applyTransaction({ amount: -cost, description: `Staff training for ${view.displayName}`, detailLines: [`Workers: ${workerCount}`, `Completes in ${(duration / 60_000).toFixed(2)} min`], facilityAccounting: { facilityId, classification: 'staffing', historicalValue: cost }, kind: 'operating', source: 'facility-staffing', occurredAtGameTimeMs: startedAt }) || !facility.scheduleStaffTraining(workerCount, startedAt, startedAt + duration)) return false;
    set({ facilities, finance });
    return true;
  },
  setFacilityAutoRepair: (facilityId, enabled, threshold, target) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const facility = facilities.get(facilityId);
    const autoRepairLimit = getFacilityAutoRepairLimit(get().research.getCompletedProjectIds());
    if (!facility || autoRepairLimit <= 0) return false;
    const facilityView = facility.getView();
    const enabledCount = facilities.getAll().filter((candidate) => candidate.getView().autoRepairEnabled).length;
    if (enabled && !facilityView.autoRepairEnabled && enabledCount >= autoRepairLimit) return false;
    if (!facility.setAutoRepair(enabled, threshold, target)) return false;
    set({ facilities });
    return true;
  },
  repairFacility: (facilityId, targetCondition = 1) => {
    get().advanceRealtime(Date.now());
    const facilities = get().facilities.clone();
    const inventory = get().inventory.clone();
    const market = get().market.clone();
    const finance = get().finance.clone();
    const facilityMaintenance = get().facilityMaintenance.clone();
    const resourceFlow = get().resourceFlow.clone();
    if (!executeFacilityRepair({
      facility: facilities.get(facilityId), inventory, market, finance, facilityMaintenance, resourceFlow, targetCondition,
      occurredAtGameTimeMs: get().lastProcessedAtMs, automatic: false, completeCondition: false,
    })) return false;
    const facility = facilities.get(facilityId);
    const currentCondition = facility?.getView().facilityCondition ?? 0;
    if (!facility || !facility.scheduleRepair(targetCondition, get().lastProcessedAtMs, get().lastProcessedAtMs + Math.max(1, Math.ceil((Math.min(1, Math.max(currentCondition, targetCondition)) - currentCondition) * FACILITY_REPAIR_DURATION_PER_CONDITION_MS)))) return false;

    const prestige = get().prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, get().lastProcessedAtMs);
    syncCompanyAssetsPrestige(prestige, { finance, inventory, market, facilities, research: get().research }, get().lastProcessedAtMs);
    syncFacilityConditionPrestige(prestige, facilities, get().lastProcessedAtMs);
    const achievementResult = applyAchievementUnlocks({ achievements: get().achievements, facilityMaintenance, resourceFlow: get().resourceFlow, facilities, finance, salesOrders: get().salesOrders, prestige, companyStartedAtGameTimeMs: get().companyStartedAtGameTimeMs, currentGameTimeMs: get().lastProcessedAtMs, categories: ['facilities', 'finance'], inventory });
    set({ facilities, inventory: achievementResult.inventory, market, finance, facilityMaintenance, achievements: achievementResult.achievements, prestige: achievementResult.prestige, resourceFlow });
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
      : upgradeKind === 'output' ? facilityView.outputUpgradeLevel
        : upgradeKind === 'condition' ? facilityView.conditionDecayUpgradeLevel
          : facilityView.qualityUpgradeLevel;
    const definition = getFacilityDefinition(facility.facilityType);
    const costLevel = upgradeKind === 'quality' ? Math.max(0, currentLevel - 1) : currentLevel;
    const cost = getFacilityUpgradeCost(definition.upgradeCost, costLevel);
    const constructionMaterialsCost = getFacilityUpgradeResourceCost(definition.constructionMaterialsCost, costLevel);
    const industrialMachinesCost = getFacilityUpgradeResourceCost(definition.industrialMachinesCost, costLevel);
    const upgradeInvestment = cost
      + constructionMaterialsCost * market.getLocalPrice(ResourceType.ConstructionMaterials)
      + industrialMachinesCost * market.getLocalPrice(ResourceType.IndustrialMachines);
    const missingConstructionMaterials = Math.max(0, constructionMaterialsCost - inventory.getAmount(ResourceType.ConstructionMaterials));
    const missingIndustrialMachines = Math.max(0, industrialMachinesCost - inventory.getAmount(ResourceType.IndustrialMachines));
    const missingInputs = getMissingFacilityMaterials(inventory, { constructionMaterials: constructionMaterialsCost, industrialMachines: industrialMachinesCost });
    const trades = missingInputs.map((input) => ({ ...input, trade: market.buyFromLocal(input.resourceType, input.amount) }));
    const missingInputPurchaseCost = trades.reduce((total, { trade }) => total + trade.amount * trade.unitPrice, 0);

    if (trades.some(({ trade }) => !trade.success)
      || !finance.canAfford(cost + missingInputPurchaseCost)
      || trades.some(({ resourceType, trade }) => !inventory.add(resourceType, trade.amount, trade.quality, trade.unitPrice))) {
      return false;
    }

    if (upgradeKind === 'speed') {
      facility.upgradeSpeed();
    } else if (upgradeKind === 'output') {
      facility.upgradeOutput();
    } else if (upgradeKind === 'condition') {
      facility.upgradeConditionDecay();
    } else {
      facility.upgradeQuality();
    }

    if ((missingInputPurchaseCost > 0 && !finance.applyTransaction({ amount: -missingInputPurchaseCost, description: `Bought missing upgrade inputs for ${facilityView.displayName}`, detailLines: trades.map(({ resourceType, trade }) => `${trade.amount} ${resourceType} at €${trade.unitPrice.toFixed(2)} each`), kind: 'operating', source: 'market-purchase', occurredAtGameTimeMs: get().lastProcessedAtMs }))
      || !finance.applyTransaction({ amount: -cost, description: `${upgradeKind === 'speed' ? 'Speed' : upgradeKind === 'output' ? 'Output' : upgradeKind === 'condition' ? 'Condition decay' : 'Quality'} upgrade for ${facilityView.displayName}`, detailLines: [`Level ${currentLevel + 1}`, `Construction materials committed: ${constructionMaterialsCost}`, `Industrial machines installed: ${industrialMachinesCost}`], facilityAccounting: { facilityId, classification: 'upgrade', historicalValue: upgradeInvestment }, kind: 'investing', source: 'facility-upgrade', occurredAtGameTimeMs: get().lastProcessedAtMs })
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
      facilityMaintenance: get().facilityMaintenance,
      resourceFlow: get().resourceFlow,
      facilities,
      finance,
      salesOrders: get().salesOrders,
      prestige,
      companyStartedAtGameTimeMs: get().companyStartedAtGameTimeMs,
      currentGameTimeMs: get().lastProcessedAtMs,
      categories: ['facilities', 'finance', 'prestige'],
      inventory,
    });
    const resourceFlow = get().resourceFlow.clone();
    for (const { resourceType, trade } of trades) resourceFlow.record('market-buy', resourceType, trade.amount, get().lastProcessedAtMs);
    resourceFlow.record('facility-spending', ResourceType.ConstructionMaterials, -constructionMaterialsCost, get().lastProcessedAtMs);
    resourceFlow.record('facility-spending', ResourceType.IndustrialMachines, -industrialMachinesCost, get().lastProcessedAtMs);
    set({ facilities, market, finance, resourceFlow, ...achievementResult });
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
    let resourceFlow = get().resourceFlow;
    const recordResourceFlow = (kind: Parameters<ResourceFlowLedger['record']>[0], resourceType: ResourceType, amount: number, occurredAtGameTimeMs: number) => {
      if (resourceFlow === get().resourceFlow) resourceFlow = resourceFlow.clone();
      resourceFlow.record(kind, resourceType, amount, occurredAtGameTimeMs);
    };
    let producedOutput = false;
    let salesOrders: SalesOrders | null = null;
    let market: Market | null = null;
    let marketFinance: Finance | null = null;
    let research = get().research;
    let facilityMaintenance = get().facilityMaintenance;
    let autoRepairOccurred = false;
    const grants = get().grants.clone();
    const firstRecipeInputRewards: Array<{ amount: number; resourceType: ResourceType }> = [];
    let firstRecipeInputRewardClaimed = false;
    let unprocessedWorkMs = get().unprocessedWorkMs;
    let customerPipelineProgress = get().customerPipelineProgress;
    let elapsedMinutes = 0;
    let remainingMs = elapsedMs;

    while (remainingMs > 0) {
      const stepMs = Math.min(FOREGROUND_SIMULATION_STEP_MS, remainingMs);
      const stepStartGameTimeMs = get().lastProcessedAtMs + elapsedMs - remainingMs;
      const stepEndGameTimeMs = stepStartGameTimeMs + stepMs;

      if (hasConstructedFacility) {
        for (const facility of facilities.getAll()) {
          facility.processStaffingChange(stepEndGameTimeMs);
        }
        facilities.applyPassiveConditionLoss((stepMs / REALTIME_WORK_MINUTE_MS) * FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE);
        for (const facility of facilities.getAll()) facility.processRepair(stepEndGameTimeMs);
      }

      if (hasConstructedFacility) {
        for (const facility of facilities.getAll()) {
          const facilityView = facility.getView();
          const staffWageExpense = facilityView.assignedWorkers * facilityView.staffWagePerWorkerPerMinute * stepMs / REALTIME_WORK_MINUTE_MS;
          let wagesPaid = true;
          if (staffWageExpense > 0) {
            marketFinance ??= get().finance.clone();
            wagesPaid = marketFinance.applyTransaction({ amount: -staffWageExpense, description: `Staff wages for ${facilityView.displayName}`, detailLines: [`Workers: ${facilityView.assignedWorkers}`, `Wage: €${facilityView.staffWagePerWorkerPerMinute.toFixed(2)} per worker/min`], facilityAccounting: { facilityId: facility.id, classification: 'staff-wage', historicalValue: staffWageExpense }, kind: 'operating', source: 'facility-staff-wage', occurredAtGameTimeMs: stepEndGameTimeMs });
          }
          if (!wagesPaid) {
            facility.setProductionActive(false);
            facility.pauseStaffTraining(stepMs);
            continue;
          }
          facility.processStaffTraining(stepEndGameTimeMs);
          facility.advanceStaffQuality(stepMs / REALTIME_WORK_MINUTE_MS);
        }
      }

      const networkMarket: Market = market ?? get().market;
      if (networkMarket.getLocalMarketNetworkActivations().length > 0) {
        const activatingMarket: Market = market ?? networkMarket.clone();
        activatingMarket.advanceLocalMarketNetworkActivations(stepMs);
        market = activatingMarket;
      }

      const automationMarket: Market = market ?? get().market;
      for (const resourceType of RESOURCE_TYPES) {
        const automation = automationMarket.getAutomation(resourceType);
        const completedIntervals = Math.floor(stepEndGameTimeMs / automation.autoTradeIntervalMs) - Math.floor(stepStartGameTimeMs / automation.autoTradeIntervalMs);
        const currentInventory = inventory.getAmount(resourceType);
        const targetDeficit = automation.autoBuyToInventory - currentInventory;
        if (!automation.autoBuyEnabled || completedIntervals <= 0 || (automation.autoBuyAtInventory !== 'any' && currentInventory > automation.autoBuyAtInventory) || targetDeficit <= 0 || !canAutoBuyMarketResource(resourceType)) continue;
        const unitPrice = automationMarket.getLocalPrice(resourceType);
        const availableFinance = marketFinance ?? get().finance;
        const purchaseAmount = Math.min(
          targetDeficit,
          automationMarket.getMaximumLocalPurchaseAmountAtUnitPrice(resourceType, automation.autoBuyMaxUnitPrice),
          automationMarket.getMaximumLocalPurchaseAmountAtCash(resourceType, availableFinance.getBalance()),
        );
        const quote = automationMarket.getLocalBuyQuote(resourceType, purchaseAmount);
        if (unitPrice > automation.autoBuyMaxUnitPrice || !quote.success) continue;
        const buyingMarket: Market = market ?? automationMarket.clone();
        market = buyingMarket;
        marketFinance ??= get().finance.clone();
        if (inventory === get().inventory) inventory = inventory.clone();
        const trade = buyingMarket.buyFromLocal(resourceType, purchaseAmount);
        if (trade.success && inventory.add(resourceType, trade.amount, trade.quality, trade.unitPrice)) {
          marketFinance.applyTransaction({ amount: -trade.unitPrice * trade.amount, description: `Autobought ${formatNumber(trade.amount, { smartDecimals: true })} ${resourceType}`, detailLines: [`Unit price: €${trade.unitPrice.toFixed(2)}`, `Quality: Q${trade.quality.toFixed(2)}`], kind: 'operating', source: 'market-purchase', occurredAtGameTimeMs: stepEndGameTimeMs });
          recordResourceFlow('market-buy', resourceType, trade.amount, stepEndGameTimeMs);
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
            const currentInventory = inventory.getAmount(input.resourceType);
            const targetDeficit = automation.autoBuyToInventory - currentInventory;
            const productionCycleDeficit = input.amount - inventory.getAmount(input.resourceType);
            const purchaseAmount = Math.min(
              Math.max(productionCycleDeficit, targetDeficit),
              market.getMaximumLocalPurchaseAmountAtUnitPrice(input.resourceType, automation.autoBuyMaxUnitPrice),
              market.getMaximumLocalPurchaseAmountAtCash(input.resourceType, marketFinance.getBalance()),
            );
            const quote = market.getLocalBuyQuote(input.resourceType, purchaseAmount);
            if (!automation.autoBuyEnabled || completedIntervals <= 0 || (automation.autoBuyAtInventory !== 'any' && currentInventory > automation.autoBuyAtInventory) || !canAutoBuyMarketResource(input.resourceType)
              || unitPrice > automation.autoBuyMaxUnitPrice || !quote.success) continue;
            const trade = market.buyFromLocal(input.resourceType, purchaseAmount);
            if (trade.success && inventory.add(input.resourceType, trade.amount, trade.quality, trade.unitPrice)) {
          marketFinance.applyTransaction({ amount: -trade.unitPrice * trade.amount, description: `Autobought ${formatNumber(trade.amount, { smartDecimals: true })} ${input.resourceType} for production`, detailLines: [`Unit price: €${trade.unitPrice.toFixed(2)}`, `Quality: Q${trade.quality.toFixed(2)}`], kind: 'operating', source: 'market-purchase', occurredAtGameTimeMs: stepEndGameTimeMs });
              recordResourceFlow('market-buy', input.resourceType, trade.amount, stepEndGameTimeMs);
            }
          }
        }
        const baseWork = (stepMs / REALTIME_WORK_MINUTE_MS) * BASE_WORK_PER_MINUTE;
        const outputs = advanceAllFacilityProduction(facilities, inventory, (facility, recipeName) => calculateFacilityEffectiveWork(
          facility,
          baseWork,
          getRecipeResearchWorkSpeedMultiplier(recipeName, research.getCompletedProjectIds()),
        ), (input) => recordResourceFlow('facility-input', input.resourceType, -input.amount, stepEndGameTimeMs), (facilityView, resourceType, weightedInputQ, upgradeMaxQ) => calculateOutputQuality({
          weightedInputQ,
          researchMaxQ: getResourceResearchMaxQ(resourceType, research.getCompletedProjectIds()),
          upgradeMaxQ,
          productionMaxQ: calculateProductionMaxQ(resourceFlow.getLifetimeFacilityOutput(resourceType)),
          staffMaxQ: facilityView.staffQuality,
        }), (facility, recipe) => calculateFacilityProductionMaintenanceCost(facility, recipe, market!));
        if (outputs.length > 0) {
          producedOutput = true;
          const facilityPerformance = new Map<string, { sourceCost: number; outputValue: number }>();
          for (const output of outputs) {
            if (resourceFlow === get().resourceFlow) resourceFlow = resourceFlow.clone();
            resourceFlow.recordFacilityOutput(output.resourceType, output.amount, output.quality, stepEndGameTimeMs);
            const current = facilityPerformance.get(output.facilityId) ?? { sourceCost: 0, outputValue: 0 };
            current.outputValue += output.amount * market.getLocalSalePrice(output.resourceType, output.quality);
            current.sourceCost += output.amount * output.sourceCostPerUnit;
            facilityPerformance.set(output.facilityId, current);
          }
          marketFinance ??= get().finance.clone();
          for (const [facilityId, performance] of facilityPerformance) {
            marketFinance.applyTransaction({
              amount: 0,
              description: `Production completed by ${facilities.get(facilityId)?.getView().displayName ?? facilityId}`,
              detailLines: [`Output market value: €${performance.outputValue.toFixed(2)}`, `Output source cost: €${performance.sourceCost.toFixed(2)}`],
              facilityPerformance: { facilityId, ...performance },
              kind: 'operating',
              source: 'facility-production',
              occurredAtGameTimeMs: stepEndGameTimeMs,
            });
          }
        }
      }

      const autoRepairLimit = getFacilityAutoRepairLimit(research.getCompletedProjectIds());
      if (autoRepairLimit > 0) {
        let consideredAutoRepairs = 0;
        for (const facility of facilities.getAll()) {
          if (consideredAutoRepairs >= autoRepairLimit) break;
          const facilityView = facility.getView();
          if (!facilityView.autoRepairEnabled || facilityView.pendingRepair || facilityView.facilityCondition > facilityView.autoRepairThreshold || facilityView.autoRepairTarget <= facilityView.facilityCondition) continue;
          consideredAutoRepairs += 1;
          market ??= get().market.clone();
          marketFinance ??= get().finance.clone();
          if (inventory === get().inventory) inventory = inventory.clone();
          if (resourceFlow === get().resourceFlow) resourceFlow = resourceFlow.clone();
          if (facilityMaintenance === get().facilityMaintenance) facilityMaintenance = facilityMaintenance.clone();
          if (executeFacilityRepair({ facility, inventory, market, finance: marketFinance, facilityMaintenance, resourceFlow, targetCondition: facilityView.autoRepairTarget, occurredAtGameTimeMs: stepEndGameTimeMs, automatic: true, completeCondition: false }) && facility.scheduleRepair(facilityView.autoRepairTarget, stepEndGameTimeMs, stepEndGameTimeMs + Math.max(1, Math.ceil((facilityView.autoRepairTarget - facilityView.facilityCondition) * FACILITY_REPAIR_DURATION_PER_CONDITION_MS)))) {
            autoRepairOccurred = true;
          }
        }
      }

      const currentSalesOrders = salesOrders ?? get().salesOrders;
      const currentPrestige = calculateCompanyPrestigeSummary(get().prestige.getEvents(), stepEndGameTimeMs).totalPrestige;
      const assetStatement = calculateAssets({ finance: marketFinance ?? get().finance, inventory, market: market ?? get().market, facilities, research });
      const companyAssets = assetStatement.totalAssets;
      const maximumOrderValue = Math.max(
        SALES_ORDER_MINIMUM_COMPANY_VALUE_CAP,
        companyAssets * getSalesOrderMaximumCompanyValueFraction(research.getCompletedProjectIds()),
      );
      const producedByResource = resourceFlow.getLifetimeFacilityOutputByResource();
      const salesCandidateResourceTypes = getSalesOfferResourceTypes(research.getCompletedProjectIds(), producedByResource);
      const offerableSalesResourceTypes = getOfferableSalesOrderResourceTypes({
        candidateResourceTypes: salesCandidateResourceTypes,
        globalPrices: Object.fromEntries(RESOURCE_TYPES.map((resourceType) => [resourceType, (market ?? get().market).getGlobalPrice(resourceType)])) as Record<ResourceType, number>,
        maximumOrderValue,
      });
      const offerRate = calculateSalesOrderAcquisitionRate({
        openOrderCount: currentSalesOrders.getOfferedOrders().length,
        maximumOpenOrders: getMaximumOpenSalesOrders(research.getCompletedProjectIds()),
        companyPrestige: currentPrestige,
        economyPhase: (marketFinance ?? get().finance).getEconomyPhase(),
        hasOfferableResources: offerableSalesResourceTypes.length > 0,
        inventoryReadinessMultiplier: calculateSalesOrderInventoryValueReadiness(assetStatement.inventory, maximumOrderValue),
      });
      customerPipelineProgress += (stepMs / 1_000) * offerRate / 60;

      for (const resourceType of RESOURCE_TYPES) {
        const activeMarket = market ?? get().market;
        const automation = activeMarket.getAutomation(resourceType);
        const completedIntervals = Math.floor(stepEndGameTimeMs / automation.autoTradeIntervalMs) - Math.floor(stepStartGameTimeMs / automation.autoTradeIntervalMs);
        if (!automation.autoSellEnabled || completedIntervals <= 0) continue;
        const inventoryQuality = inventory.getQuality(resourceType);
        const currentPrice = activeMarket.getLocalSalePrice(resourceType, inventoryQuality);
        const amount = Math.min(
          automation.autoSellMaxPerMinute * automation.autoTradeIntervalMs * completedIntervals / REALTIME_WORK_MINUTE_MS,
          Math.max(0, inventory.getAmount(resourceType) - automation.autoSellMinKeep),
        );
        const quote = activeMarket.getLocalSellQuote(resourceType, amount, inventoryQuality);
        if (amount <= 0 || currentPrice < automation.autoSellMinUnitPrice || !quote.success || quote.unitPrice < automation.autoSellMinUnitPrice) continue;
        market ??= activeMarket.clone();
        marketFinance ??= get().finance.clone();
        if (inventory === get().inventory) inventory = inventory.clone();
        const trade = market.sellToLocal(resourceType, amount, inventoryQuality);
        if (trade.success && inventory.remove(resourceType, amount)) {
          marketFinance.applyTransaction({ amount: trade.unitPrice * trade.amount, description: `Autosold ${trade.amount} ${resourceType} to local market`, detailLines: [`Unit price: €${trade.unitPrice.toFixed(2)}`, `Quality: Q${trade.quality.toFixed(2)}`], kind: 'operating', source: 'market-sale', occurredAtGameTimeMs: stepEndGameTimeMs });
          recordResourceFlow('market-sell', resourceType, -trade.amount, stepEndGameTimeMs);
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

      salesOrders ??= get().salesOrders.clone();
      const salesMarket = market ?? get().market;
      const completedResearchProjectIds = research.getCompletedProjectIds();
      const result = salesOrders.advanceTime({
            currentGameTimeMs: stepEndGameTimeMs,
            elapsedMilliseconds: stepMs,
            maximumOpenOrders: getMaximumOpenSalesOrders(completedResearchProjectIds),
            maximumOrderValue,
            companyAssets,
            inventoryValue: assetStatement.inventory,
            companyPrestige: calculateCompanyPrestigeSummary(get().prestige.getEvents(), stepEndGameTimeMs).totalPrestige,
            economyPhase: (marketFinance ?? get().finance).getEconomyPhase(),
            inventoryByResource: Object.fromEntries(RESOURCE_TYPES.map((resourceType) => [resourceType, inventory.getAmount(resourceType)])) as Record<ResourceType, number>,
            inventoryQualityByResource: Object.fromEntries(RESOURCE_TYPES.map((resourceType) => [resourceType, inventory.getQuality(resourceType)])) as Record<ResourceType, number>,
            globalPrices: Object.fromEntries(RESOURCE_TYPES.map((resourceType) => [resourceType, salesMarket.getGlobalPrice(resourceType)])) as Record<ResourceType, number>,
            globalSupplies: Object.fromEntries(RESOURCE_TYPES.map((resourceType) => [resourceType, salesMarket.getGlobalEntry(resourceType).supply])) as Record<ResourceType, number>,
            candidateResourceTypes: salesCandidateResourceTypes,
            getResourceWeight: (resourceType) => producedByResource[resourceType] > 0 ? getSalesOfferProducedResourceWeight(research.getCompletedProjectIds()) : 1,
            bidResearchMultiplier: getSalesOrderBidMultiplier(research.getCompletedProjectIds(), MARKET_SALES_ORDER_BID_MULTIPLIER),
            relationshipDecayHalfLifeMultiplier: getSalesRelationshipDecayHalfLifeMultiplier(completedResearchProjectIds),
            relationshipFulfilmentGainMultiplier: getSalesRelationshipFulfilmentGainMultiplier(completedResearchProjectIds),
            relationshipFailureLossMultiplier: getSalesRelationshipFailureLossMultiplier(completedResearchProjectIds),
            pressureOfferChanceMultiplier: getSalesPressureOfferChanceMultiplier(completedResearchProjectIds),
            bundleMaturityMultiplier: getSalesOrderBundleMaturityMultiplier(completedResearchProjectIds),
            minimumPremiumBonus: getSalesOrderMinimumPremiumBonus(completedResearchProjectIds),
          });
      if (result.ordersCreated > 0) customerPipelineProgress = 0;

      remainingMs -= stepMs;
    }

    elapsedMinutes = Math.floor(elapsedMs / REALTIME_WORK_MINUTE_MS);
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
          const unitRecovery = market.getLocalSalePrice(resourceType, inventory.getQuality(resourceType)) * LOAN_COLLECTION.forcedInventoryRecoveryRate;
          const amount = unitRecovery > 0 ? Math.min(available, (maximumRecovery - recovered) / unitRecovery) : 0;
          if (amount <= 0) continue;
          const trade = market.sellToLocal(resourceType, amount, inventory.getQuality(resourceType));
          const proceeds = trade.unitPrice * trade.amount * LOAN_COLLECTION.forcedInventoryRecoveryRate;
          if (trade.success && inventory.remove(resourceType, trade.amount) && financeForLoanProcessing.applyTransaction({ amount: proceeds, description: `Forced inventory liquidation: ${resourceType}`, detailLines: [`Recovery rate: ${Math.round(LOAN_COLLECTION.forcedInventoryRecoveryRate * 100)}%`], kind: 'investing', source: 'forced-asset-liquidation', occurredAtGameTimeMs: nextGameTimeMs })) {
            recordResourceFlow('market-sell', resourceType, -trade.amount, nextGameTimeMs);
            recovered += proceeds;
          }
          if (recovered >= maximumRecovery - 0.01) break;
        }
        for (const facility of facilities.getAll().sort((left, right) => calculateFacilityAssetValue(right, market!, financeForLoanProcessing) - calculateFacilityAssetValue(left, market!, financeForLoanProcessing))) {
          const proceeds = calculateFacilityAssetValue(facility, market, financeForLoanProcessing) * LOAN_COLLECTION.forcedFacilityRecoveryRate;
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
        const grantTarget = getRecipeResearchGrantTarget(completedProject);
        if (completedProject?.effect.kind === 'recipe-unlock' && grantTarget && grants.claimResourceReward('start-research', grantTarget, nextGameTimeMs)) {
          firstRecipeInputRewardClaimed = true;
          inventory = inventory.clone();
          for (const input of getRecipe(completedProject.effect.recipeName).inputs) {
            const amount = input.amount * 10;
            inventory.add(input.resourceType, amount);
            firstRecipeInputRewards.push({ amount, resourceType: input.resourceType });
          }
        }
        if (completedProject?.effect.kind === 'local-market-depth') {
          market ??= get().market.clone();
          const completedProjectIdsBeforeActivation = research.getCompletedProjectIds().filter((projectId) => projectId !== completedResearchProjectId);
          const previousDepthMultiplier = getLocalMarketDepthMultiplier(completedProjectIdsBeforeActivation);
          const depthIncrease = Number((completedProject.effect.multiplier - previousDepthMultiplier).toFixed(6));
          market.startLocalMarketNetworkActivation(completedResearchProjectId, depthIncrease);
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

    if (autoRepairOccurred) {
      syncCompanyBalancePrestige(prestige, marketFinance ?? get().finance, nextGameTimeMs);
      syncCompanyAssetsPrestige(prestige, { finance: marketFinance ?? get().finance, inventory, market: market ?? get().market, facilities, research }, nextGameTimeMs);
      syncFacilityConditionPrestige(prestige, facilities, nextGameTimeMs);
    }

    if (Math.floor(previousGameTimeMs / PRESTIGE_FOREGROUND_HOUR_MS)
      < Math.floor(nextGameTimeMs / PRESTIGE_FOREGROUND_HOUR_MS)) {
      const nextPrestige = prestige === get().prestige ? prestige.clone() : prestige;
      if (nextPrestige.pruneExpired(nextGameTimeMs)) {
        prestige = nextPrestige;
      }
    }

    const achievementCategories: AchievementCategory[] = [];
    if (producedOutput) {
      achievementCategories.push('production');
    }
    if (elapsedMinutes > 0) {
      achievementCategories.push('time');
    }
    if (autoRepairOccurred) {
      achievementCategories.push('facilities', 'finance');
    }
    if (completedResearchProjectId && getResearchProject(completedResearchProjectId)?.effect.kind === 'grant') {
      achievementCategories.push('finance', 'prestige');
    }
    const achievementResult = achievementCategories.length > 0
      ? applyAchievementUnlocks({
        achievements: get().achievements,
        facilityMaintenance,
        resourceFlow,
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

    for (const resourceType of RESOURCE_TYPES) {
      const rewardAmount = achievementResult.inventory.getAmount(resourceType) - inventory.getAmount(resourceType);
      if (rewardAmount > 0) recordResourceFlow('reward', resourceType, rewardAmount, nextGameTimeMs);
    }
    for (const reward of firstRecipeInputRewards) recordResourceFlow('reward', reward.resourceType, reward.amount, nextGameTimeMs);
    if (resourceFlow === get().resourceFlow && resourceFlow.hasExpiredBuckets(nextGameTimeMs)) {
      resourceFlow = resourceFlow.clone();
      resourceFlow.prune(nextGameTimeMs);
    }

    set({
      lastProcessedAtMs: nextGameTimeMs,
      unprocessedWorkMs,
      customerPipelineProgress,
      ...(hasConstructedFacility ? { facilities } : {}),
      ...(facilityMaintenance !== get().facilityMaintenance ? { facilityMaintenance } : {}),
      ...(inventory !== get().inventory ? { inventory } : {}),
      ...(achievementResult.inventory !== get().inventory ? { inventory: achievementResult.inventory } : {}),
      ...(resourceFlow !== get().resourceFlow ? { resourceFlow } : {}),
      ...(marketFinance ? { finance: marketFinance } : {}),
      ...(salesOrders ? { salesOrders } : {}),
      ...(market ? { market } : {}),
      ...(research !== get().research ? { research } : {}),
      ...(firstRecipeInputRewardClaimed ? { grants } : {}),
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
      facilityMaintenance: state.facilityMaintenance,
      resourceFlow: state.resourceFlow,
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
  cancelResearch: (projectId) => {
    get().advanceRealtime(Date.now());
    const state = get();
    const research = state.research.clone();
    const cancelled = research.cancel(projectId);
    if (!cancelled) return false;

    const project = getResearchProject(cancelled.projectId);
    const finance = state.finance.clone();
    if (!finance.applyTransaction({ amount: cancelled.paidCost, description: `Research cancelled: ${project?.name ?? cancelled.projectId}`, detailLines: [], kind: 'investing', source: 'research-refund', occurredAtGameTimeMs: state.lastProcessedAtMs })) return false;

    const prestige = state.prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, state.lastProcessedAtMs);
    syncCompanyAssetsPrestige(prestige, { finance, inventory: state.inventory, market: state.market, facilities: state.facilities, research: state.research }, state.lastProcessedAtMs);
    const achievementResult = applyAchievementUnlocks({
      achievements: state.achievements,
      facilityMaintenance: state.facilityMaintenance,
      resourceFlow: state.resourceFlow,
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
  getSalesOrderAcquisitionStatus: () => getSalesOrderAcquisitionStatusForState({ facilities: get().facilities, finance: get().finance, inventory: get().inventory, market: get().market, productionStatistics: get().resourceFlow, prestige: get().prestige, research: get().research, salesOrders: get().salesOrders, currentGameTimeMs: get().lastProcessedAtMs }),
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

    if (!order.lines.every((line) => inventory.has(line.resourceType, line.quantity))) {
      return false;
    }

    const currentGameTimeMs = get().lastProcessedAtMs;
    const deliveredQualities = new Map(order.lines.map((line) => [line.resourceType, inventory.getQuality(line.resourceType)]));
    for (const line of order.lines) {
      const quality = inventory.getQuality(line.resourceType);
      if (!inventory.remove(line.resourceType, line.quantity) || !market.addToGlobal(line.resourceType, line.quantity, quality)) return false;
    }
    const completedResearchProjectIds = get().research.getCompletedProjectIds();
    if (!finance.applyTransaction({ amount: order.reward, description: `Customer order fulfilled: ${order.customerName}`, detailLines: order.lines.map((line) => { const quality = deliveredQualities.get(line.resourceType) ?? 1; const qualityAdjustedUnitPrice = line.bidUnitPrice * line.qualityMultiplier; return `Delivered ${line.quantity} ${line.resourceType} at Q${quality.toFixed(2)} · offer quality Q${line.qualityMultiplier.toFixed(2)} · €${line.bidUnitPrice.toFixed(2)} bid × ${line.qualityMultiplier.toFixed(2)} quality = €${qualityAdjustedUnitPrice.toFixed(2)}/unit`; }), kind: 'operating', source: 'order-sale', occurredAtGameTimeMs: currentGameTimeMs })
      || !salesOrders.fulfill(order.id, currentGameTimeMs, calculateCompanyPrestigeSummary(get().prestige.getEvents(), currentGameTimeMs).totalPrestige, getSalesRelationshipDecayHalfLifeMultiplier(completedResearchProjectIds), getSalesRelationshipFulfilmentGainMultiplier(completedResearchProjectIds), getSalesRelationshipFailureLossMultiplier(completedResearchProjectIds))) {
      return false;
    }

    const prestige = get().prestige.clone();
    syncCompanyBalancePrestige(prestige, finance, currentGameTimeMs);
    syncCompanyAssetsPrestige(prestige, { finance, inventory, market, facilities: get().facilities, research: get().research }, currentGameTimeMs);
    prestige.recordSalesOrder(order.id, order.reward, order.premiumPercent, currentGameTimeMs);

    const achievementResult = applyAchievementUnlocks({
      achievements: get().achievements,
      facilityMaintenance: get().facilityMaintenance,
      resourceFlow: get().resourceFlow,
      facilities: get().facilities,
      finance,
      salesOrders,
      prestige,
      companyStartedAtGameTimeMs: get().companyStartedAtGameTimeMs,
      currentGameTimeMs,
      categories: ['sales', 'finance', 'prestige'],
      inventory,
    });
    const resourceFlow = get().resourceFlow.clone();
    for (const line of order.lines) resourceFlow.record('customer-order', line.resourceType, -line.quantity, currentGameTimeMs);
    set({ market, finance, salesOrders, resourceFlow, ...achievementResult });
    return true;
  },
  rejectSalesOrder: (orderId) => {
    const salesOrders = get().salesOrders.clone();
    const completedResearchProjectIds = get().research.getCompletedProjectIds();
    const rejected = salesOrders.reject(orderId, get().lastProcessedAtMs, calculateCompanyPrestigeSummary(get().prestige.getEvents(), get().lastProcessedAtMs).totalPrestige, getSalesRelationshipDecayHalfLifeMultiplier(completedResearchProjectIds), getSalesRelationshipFulfilmentGainMultiplier(completedResearchProjectIds), getSalesRelationshipFailureLossMultiplier(completedResearchProjectIds));

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
    resourceFlow: get().resourceFlow.toSnapshot(),
    market: get().market.toSnapshot(),
    facilities: get().facilities.toSnapshot(),
    salesOrders: get().salesOrders.toSnapshot(),
    achievements: get().achievements.toSnapshot(),
    facilityMaintenance: get().facilityMaintenance.toSnapshot(),
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
    const facilityMaintenance = FacilityMaintenanceStatistics.fromSnapshot(snapshot.facilityMaintenance);
    const prestige = PrestigeLedger.fromSnapshot(snapshot.prestige);
    const research = ResearchLedger.fromSnapshot(snapshot.research);
    market.setLocalRegionalDiffusionMultiplier(getLocalRegionalDiffusionMultiplier(research.getCompletedProjectIds()));
    const grants = GrantLedger.fromSnapshot(snapshot.grants);
    const inventory = Inventory.fromSnapshot(snapshot.inventory);
    const resourceFlow = ResourceFlowLedger.fromSnapshot(snapshot.resourceFlow);
    syncCompanyBalancePrestige(prestige, finance, snapshot.time.lastProcessedAtMs);
    syncCompanyAssetsPrestige(prestige, { finance, inventory, market, facilities, research }, snapshot.time.lastProcessedAtMs);
    syncFacilityConditionPrestige(prestige, facilities, snapshot.time.lastProcessedAtMs);
    const achievementResult = applyAchievementUnlocks({
      achievements,
      facilityMaintenance,
      resourceFlow,
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
    resourceFlow,
    market,
    facilities,
    salesOrders,
    achievements: achievementResult.achievements,
    facilityMaintenance,
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
