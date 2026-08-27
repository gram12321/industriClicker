import { type FinanceSnapshot } from '../../finance/finance';
import { type InventorySnapshot } from '../../inventory/inventory';
import { ResourceFlowLedger } from '../../inventory/resourceFlow';
import { type FacilityCollectionSnapshot } from '../../facilities/facilityCollection';
import { getFacilityMaxStaffWage, isValidFacilitySize } from '../../facilities/facilityConstants';
import { FacilityType } from '../../facilities/facilityTypes';
import { isFacilityMaintenanceStatisticsSnapshot, type FacilityMaintenanceStatisticsSnapshot } from '../../facilities/facilityMaintenanceStatistics';
import { type SalesOrdersSnapshot } from '../../sales/salesOrders';
import { isAchievementLedgerSnapshot, type AchievementLedgerSnapshot } from '../../achievements/achievement';
import { isPrestigeLedgerSnapshot, type PrestigeLedgerSnapshot } from '../../prestige/prestige';
import { type MarketSnapshot } from '../../market/marketTypes';
import { MARKET_AUTOTRADE_INTERVAL_OPTIONS } from '../../market/marketConstants';
import { RESOURCE_TYPES } from '../../resources/resourceConstants';
import type { ResourceType } from '../../resources/resourceTypes';
import { isResearchLedgerSnapshot, type ResearchLedgerSnapshot } from '../../research/research';
import { isGrantLedgerSnapshot, type GrantLedgerSnapshot } from '../../grants/grant';
import { RecipeName } from '../../recipes/recipeTypes';
import type { PopulationSnapshot } from '../../population/population';

export type GameTimeSnapshot = {
  /** Logical foreground time when the current company began. */
  companyStartedAtGameTimeMs: number;
  /** Logical foreground game time. Fast-forward deliberately advances it. */
  lastProcessedAtMs: number;
  /** Foreground milliseconds retained until they form a whole sales minute. */
  unprocessedWorkMs: number;
  /** Estimated customer-wait intervals elapsed since the last customer offer. */
  customerPipelineProgress: number;
};

/**
 * Plain game data written to the active company's Expo SQLite save record. Code-owned
 * definitions and class methods are intentionally absent.
 */
export type GameSnapshot = {
  population: PopulationSnapshot;
  finance: FinanceSnapshot;
  inventory: InventorySnapshot;
  resourceFlow: ReturnType<ResourceFlowLedger['toSnapshot']>;
  market: MarketSnapshot;
  facilities: FacilityCollectionSnapshot;
  salesOrders: SalesOrdersSnapshot;
  achievements: AchievementLedgerSnapshot;
  facilityMaintenance: FacilityMaintenanceStatisticsSnapshot;
  prestige: PrestigeLedgerSnapshot;
  research: ResearchLedgerSnapshot;
  grants: GrantLedgerSnapshot;
  time: GameTimeSnapshot;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Rejects saves from a resource catalogue with added or removed resource identities. */
function hasCurrentResourceKeys(value: unknown): value is Record<ResourceType, unknown> {
  return isRecord(value)
    && Object.keys(value).length === RESOURCE_TYPES.length
    && RESOURCE_TYPES.every((resourceType) => Object.hasOwn(value, resourceType));
}

function isFinanceTransactionSnapshot(value: unknown): boolean {
  if (!isRecord(value) || typeof value.source !== 'string'
    || typeof value.occurrenceCount !== 'number' || !Number.isInteger(value.occurrenceCount) || value.occurrenceCount <= 0
    || (value.aggregationKey !== undefined && (typeof value.aggregationKey !== 'string' || value.aggregationKey.length === 0))) return false;
  if (value.marketTrade !== undefined && (!isRecord(value.marketTrade)
    || !RESOURCE_TYPES.includes(value.marketTrade.resourceType as ResourceType)
    || typeof value.marketTrade.quantity !== 'number' || !Number.isFinite(value.marketTrade.quantity) || value.marketTrade.quantity <= 0
    || typeof value.marketTrade.qualityQuantity !== 'number' || !Number.isFinite(value.marketTrade.qualityQuantity) || value.marketTrade.qualityQuantity < 0
    || typeof value.marketTrade.qualityAmount !== 'number' || !Number.isFinite(value.marketTrade.qualityAmount) || value.marketTrade.qualityAmount < 0)) return false;
  const facilitySource = value.source === 'facility-construction' || value.source === 'facility-upgrade' || value.source === 'facility-repair' || value.source === 'facility-staff-wage' || value.source === 'facility-staffing';
  if (value.source === 'facility-production') {
    return value.facilityAccounting === undefined
      && isRecord(value.facilityPerformance)
      && typeof value.facilityPerformance.facilityId === 'string'
      && value.facilityPerformance.facilityId.length > 0
      && typeof value.facilityPerformance.outputValue === 'number'
      && Number.isFinite(value.facilityPerformance.outputValue)
      && value.facilityPerformance.outputValue >= 0
      && typeof value.facilityPerformance.sourceCost === 'number'
      && Number.isFinite(value.facilityPerformance.sourceCost)
      && value.facilityPerformance.sourceCost >= 0;
  }
  if (!facilitySource) return value.facilityAccounting === undefined && value.facilityPerformance === undefined;
  if (!isRecord(value.facilityAccounting) || value.facilityPerformance !== undefined) return false;
  const expectedClassification = value.source === 'facility-construction' ? 'construction' : value.source === 'facility-upgrade' ? 'upgrade' : value.source === 'facility-repair' ? 'maintenance' : value.source === 'facility-staffing' ? 'staffing' : 'staff-wage';
  return typeof value.facilityAccounting.facilityId === 'string'
    && value.facilityAccounting.facilityId.length > 0
    && value.facilityAccounting.classification === expectedClassification
    && typeof value.facilityAccounting.historicalValue === 'number'
    && Number.isFinite(value.facilityAccounting.historicalValue)
    && value.facilityAccounting.historicalValue > 0;
}

function isGameTimeSnapshot(value: unknown): value is GameTimeSnapshot {
  return isRecord(value)
    && typeof value.companyStartedAtGameTimeMs === 'number'
    && Number.isFinite(value.companyStartedAtGameTimeMs)
    && typeof value.lastProcessedAtMs === 'number'
    && Number.isFinite(value.lastProcessedAtMs)
    && typeof value.unprocessedWorkMs === 'number'
    && Number.isFinite(value.unprocessedWorkMs)
    && value.unprocessedWorkMs >= 0
    && value.unprocessedWorkMs < 60_000
    && typeof value.customerPipelineProgress === 'number'
    && Number.isFinite(value.customerPipelineProgress)
    && value.customerPipelineProgress >= 0;
}

function isMarketAutomationSnapshot(value: unknown): boolean {
  return isRecord(value)
    && typeof value.autoBuyEnabled === 'boolean'
    && typeof value.autoSellEnabled === 'boolean'
    && typeof value.autoBuyMaxUnitPrice === 'number' && Number.isFinite(value.autoBuyMaxUnitPrice) && value.autoBuyMaxUnitPrice >= 0
    && ((typeof value.autoBuyAtInventory === 'number' && Number.isFinite(value.autoBuyAtInventory) && value.autoBuyAtInventory >= 0) || value.autoBuyAtInventory === 'any')
    && typeof value.autoBuyToInventory === 'number' && Number.isFinite(value.autoBuyToInventory)
    && (value.autoBuyAtInventory === 'any' || value.autoBuyToInventory >= value.autoBuyAtInventory)
    && typeof value.autoTradeIntervalMs === 'number' && MARKET_AUTOTRADE_INTERVAL_OPTIONS.some((option) => option.milliseconds === value.autoTradeIntervalMs)
    && typeof value.autoSellMaxPerMinute === 'number' && Number.isFinite(value.autoSellMaxPerMinute) && value.autoSellMaxPerMinute >= 0
    && typeof value.autoSellMinKeep === 'number' && Number.isFinite(value.autoSellMinKeep) && value.autoSellMinKeep >= 0
    && typeof value.autoSellMinUnitPrice === 'number' && Number.isFinite(value.autoSellMinUnitPrice) && value.autoSellMinUnitPrice >= 0;
}

function isLocalMarketNetworkActivationSnapshot(value: unknown): boolean {
  return isRecord(value)
    && typeof value.projectId === 'string' && value.projectId.length > 0
    && typeof value.totalDepthIncrease === 'number' && Number.isFinite(value.totalDepthIncrease) && value.totalDepthIncrease > 0
    && typeof value.appliedDepthIncrease === 'number' && Number.isFinite(value.appliedDepthIncrease) && value.appliedDepthIncrease >= 0 && value.appliedDepthIncrease < value.totalDepthIncrease;
}

function isInventoryEntrySnapshot(value: unknown): boolean {
  return isRecord(value)
    && typeof value.quantity === 'number' && Number.isFinite(value.quantity) && value.quantity >= 0
    && typeof value.quality === 'number' && Number.isFinite(value.quality) && value.quality > 0
    && typeof value.sourceCostPerUnit === 'number' && Number.isFinite(value.sourceCostPerUnit) && value.sourceCostPerUnit >= 0;
}

function isPopulationSnapshot(value: unknown): value is PopulationSnapshot {
  if (!isRecord(value)) return false;
  const currentMinuteConsumption = value.currentMinuteConsumption;
  return typeof value.householdBalance === 'number' && Number.isFinite(value.householdBalance) && value.householdBalance >= 0
    && typeof value.currentConsumptionGameMinute === 'number' && Number.isInteger(value.currentConsumptionGameMinute) && value.currentConsumptionGameMinute >= 0
    && hasCurrentResourceKeys(currentMinuteConsumption)
    && RESOURCE_TYPES.every((resourceType) => typeof currentMinuteConsumption[resourceType] === 'number'
      && Number.isFinite(currentMinuteConsumption[resourceType]) && currentMinuteConsumption[resourceType] >= 0);
}

function isPendingStaffingChangeSnapshot(value: unknown): boolean {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  return typeof value.targetWorkers === 'number' && Number.isInteger(value.targetWorkers) && value.targetWorkers >= 0
    && typeof value.initialWorkers === 'number' && Number.isInteger(value.initialWorkers) && value.initialWorkers >= 0
    && typeof value.startedAtGameTimeMs === 'number' && Number.isFinite(value.startedAtGameTimeMs) && value.startedAtGameTimeMs >= 0
    && typeof value.completesAtGameTimeMs === 'number' && Number.isFinite(value.completesAtGameTimeMs) && value.completesAtGameTimeMs > value.startedAtGameTimeMs;
}

function isStaffTrainingSnapshot(value: unknown): boolean {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  return typeof value.workers === 'number' && Number.isInteger(value.workers) && value.workers > 0
    && typeof value.startedAtGameTimeMs === 'number' && Number.isFinite(value.startedAtGameTimeMs) && value.startedAtGameTimeMs >= 0
    && typeof value.completesAtGameTimeMs === 'number' && Number.isFinite(value.completesAtGameTimeMs) && value.completesAtGameTimeMs > value.startedAtGameTimeMs;
}

function isFacilityStaffSnapshot(value: Record<string, unknown>): boolean {
  const assignedWorkers = value.assignedWorkers;
  const training = value.staffTraining;
  const pendingStaffingChange = value.pendingStaffingChange;
  return typeof assignedWorkers === 'number' && Number.isInteger(assignedWorkers) && assignedWorkers >= 0
    && typeof value.staffQualityProgress === 'number' && Number.isFinite(value.staffQualityProgress) && value.staffQualityProgress >= 0
    && (value.staffQualityTrend === 'rising' || value.staffQualityTrend === 'falling' || value.staffQualityTrend === 'steady')
    && isPendingStaffingChangeSnapshot(pendingStaffingChange)
    && isStaffTrainingSnapshot(training)
    && !(pendingStaffingChange !== null && training !== null)
    && (training === null || (isRecord(training) && typeof training.workers === 'number' && training.workers <= assignedWorkers));
}

function isOptionalInputSettingsSnapshot(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return Object.entries(value).every(([recipeName, resources]) => Object.values(RecipeName).includes(recipeName as RecipeName)
    && Array.isArray(resources)
    && resources.every((resourceType) => Object.values(RESOURCE_TYPES).includes(resourceType as ResourceType)));
}

function isRecipeInputEffectsSnapshot(value: unknown): boolean {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  return typeof value.qualityBoost === 'number' && Number.isFinite(value.qualityBoost) && value.qualityBoost >= 0
    && typeof value.outputMultiplier === 'number' && Number.isFinite(value.outputMultiplier) && value.outputMultiplier >= 0
    && typeof value.inputMultiplier === 'number' && Number.isFinite(value.inputMultiplier) && value.inputMultiplier > 0 && value.inputMultiplier <= 1;
}

/** Structural guard used by the company-scoped SQLite save adapter. */
export function isGameSnapshot(value: unknown): value is GameSnapshot {
  if (!isRecord(value) || !isPopulationSnapshot(value.population)
    || !isRecord(value.finance) || !isRecord(value.inventory) || !ResourceFlowLedger.isSnapshot(value.resourceFlow)
    || !isRecord(value.market) || !isRecord(value.facilities) || !isRecord(value.salesOrders)
    || !isRecord(value.achievements) || !isFacilityMaintenanceStatisticsSnapshot(value.facilityMaintenance)
    || !isRecord(value.prestige) || !isResearchLedgerSnapshot(value.research) || !isGrantLedgerSnapshot(value.grants) || !isGameTimeSnapshot(value.time)) {
    return false;
  }

  const marketAutomation = value.market.automation;
  const inventoryEntries = isRecord(value.inventory) ? value.inventory.entries : null;
  const financeTransactions: unknown[] = Array.isArray(value.finance.transactions) ? value.finance.transactions : [];
  const facilitySnapshots: unknown[] = Array.isArray(value.facilities.facilities) ? value.facilities.facilities : [];

  return typeof value.finance.balance === 'number'
    && Array.isArray(value.finance.transactions)
    && financeTransactions.every(isFinanceTransactionSnapshot)
    && Array.isArray(value.finance.loans)
    && Array.isArray(value.finance.lenders)
    && (value.finance.activeLoanSearch === null || isRecord(value.finance.activeLoanSearch))
    && Array.isArray(value.finance.loanSearchOffers)
    && (value.finance.lastLoanSearchResult === null || isRecord(value.finance.lastLoanSearchResult))
    && typeof value.finance.economyPhase === 'string'
    && typeof value.finance.lastEconomyPhasePeriod === 'number'
    && typeof value.finance.onTimeLoanPayments === 'number'
    && typeof value.finance.missedLoanPayments === 'number'
    && typeof value.finance.paidOffLoans === 'number'
    && typeof value.finance.loanDefaults === 'number'
    && typeof value.finance.consecutiveNegativePeriods === 'number'
    && typeof value.finance.nextTransactionNumber === 'number'
    && typeof value.finance.nextLoanNumber === 'number'
    && Array.isArray(value.finance.collectionNotices)
    && (value.finance.pendingRestructureOffer === null || isRecord(value.finance.pendingRestructureOffer))
    && typeof value.finance.nextCollectionNoticeNumber === 'number'
    && hasCurrentResourceKeys(inventoryEntries)
    && RESOURCE_TYPES.every((resourceType) => isInventoryEntrySnapshot(inventoryEntries[resourceType]))
    && hasCurrentResourceKeys(value.market.local)
    && hasCurrentResourceKeys(value.market.regional)
    && hasCurrentResourceKeys(value.market.global)
    && hasCurrentResourceKeys(marketAutomation)
    && typeof value.market.localMarketDepthMultiplier === 'number' && Number.isFinite(value.market.localMarketDepthMultiplier) && value.market.localMarketDepthMultiplier >= 1
    && Array.isArray(value.market.localMarketNetworkActivations)
    && value.market.localMarketNetworkActivations.every(isLocalMarketNetworkActivationSnapshot)
    && RESOURCE_TYPES.every((resourceType) => isMarketAutomationSnapshot(marketAutomation[resourceType]))
    && Array.isArray(value.facilities.facilities)
    && facilitySnapshots.every((facility) => isRecord(facility)
      && Object.values(FacilityType).includes(facility.facilityType as FacilityType)
      && isValidFacilitySize(facility.facilityType as FacilityType, facility.sizeHectares)
      && Array.isArray(facility.productionCycle)
      && facility.productionCycle.every((recipeName) => Object.values(RecipeName).includes(recipeName as RecipeName))
      && typeof facility.productionCycleIndex === 'number'
      && Number.isInteger(facility.productionCycleIndex)
      && facility.productionCycleIndex >= 0
      && (facility.productionCycle.length === 0 ? facility.productionCycleIndex === 0 : facility.productionCycleIndex < facility.productionCycle.length)
      && typeof facility.facilityCondition === 'number'
      && Number.isFinite(facility.facilityCondition)
      && facility.facilityCondition >= 0
      && facility.facilityCondition <= 1
      && typeof facility.staffWagePerWorkerPerMinute === 'number'
      && Number.isFinite(facility.staffWagePerWorkerPerMinute)
      && facility.staffWagePerWorkerPerMinute >= 0
      && facility.staffWagePerWorkerPerMinute <= getFacilityMaxStaffWage()
      && typeof facility.autoRepairEnabled === 'boolean'
      && typeof facility.autoRepairThreshold === 'number' && Number.isFinite(facility.autoRepairThreshold) && facility.autoRepairThreshold >= 0 && facility.autoRepairThreshold < 1
      && typeof facility.autoRepairTarget === 'number' && Number.isFinite(facility.autoRepairTarget) && facility.autoRepairTarget > facility.autoRepairThreshold && facility.autoRepairTarget <= 1
      && (facility.recipeInputQ === null || (typeof facility.recipeInputQ === 'number' && Number.isFinite(facility.recipeInputQ) && facility.recipeInputQ > 0))
      && (typeof facility.recipeInputSourceCost === 'number' && Number.isFinite(facility.recipeInputSourceCost) && facility.recipeInputSourceCost >= 0 || facility.recipeInputSourceCost === null)
      && isRecipeInputEffectsSnapshot(facility.recipeInputEffects)
      && isOptionalInputSettingsSnapshot(facility.optionalInputSettings)
       && typeof facility.qualityUpgradeLevel === 'number'
       && Number.isInteger(facility.qualityUpgradeLevel)
       && facility.qualityUpgradeLevel >= 1
       && isFacilityStaffSnapshot(facility))
    && facilitySnapshots.every((facility) => isRecord(facility) && financeTransactions.some((transaction) => isRecord(transaction)
      && isRecord(transaction.facilityAccounting)
      && transaction.facilityAccounting.classification === 'construction'
      && transaction.facilityAccounting.facilityId === facility.id))
    && Array.isArray(value.salesOrders.offered)
    && Array.isArray(value.salesOrders.completed)
    && value.salesOrders.offered.every((order) => isRecord(order) && Array.isArray(order.lines)
      && order.lines.every((line) => isRecord(line) && typeof line.marketVolumeMultiplier === 'number' && Number.isFinite(line.marketVolumeMultiplier)))
    && value.salesOrders.completed.every((order) => isRecord(order) && Array.isArray(order.lines)
      && order.lines.every((line) => isRecord(line) && typeof line.marketVolumeMultiplier === 'number' && Number.isFinite(line.marketVolumeMultiplier)))
    && Array.isArray(value.salesOrders.customerStates)
    && value.salesOrders.customerStates.every((state) => isRecord(state)
      && typeof state.customerId === 'string'
      && typeof state.relationship === 'number'
      && Number.isFinite(state.relationship)
      && state.relationship >= 0
      && state.relationship <= 1)
    && typeof value.salesOrders.nextOrderNumber === 'number'
    && typeof value.salesOrders.worldSeed === 'string'
    && typeof value.salesOrders.catalogueVersion === 'number'
    && isAchievementLedgerSnapshot(value.achievements)
    && isPrestigeLedgerSnapshot(value.prestige);
}
