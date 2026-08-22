import { type FinanceSnapshot } from '../../finance/finance';
import { type InventorySnapshot } from '../../inventory/inventory';
import { ResourceFlowLedger } from '../../inventory/resourceFlow';
import { type FacilityCollectionSnapshot } from '../../facilities/facilityCollection';
import { isFacilityMaintenanceStatisticsSnapshot, type FacilityMaintenanceStatisticsSnapshot } from '../../facilities/facilityMaintenanceStatistics';
import { type SalesOrdersSnapshot } from '../../sales/salesOrders';
import { isAchievementLedgerSnapshot, type AchievementLedgerSnapshot } from '../../achievements/achievement';
import { isPrestigeLedgerSnapshot, type PrestigeLedgerSnapshot } from '../../prestige/prestige';
import { type MarketSnapshot } from '../../market/marketTypes';
import { MARKET_AUTOTRADE_INTERVAL_OPTIONS } from '../../market/marketConstants';
import { RESOURCE_TYPES } from '../../resources/resourceConstants';
import { isResearchLedgerSnapshot, type ResearchLedgerSnapshot } from '../../research/research';
import { isGrantLedgerSnapshot, type GrantLedgerSnapshot } from '../../grants/grant';
import { RecipeName } from '../../recipes/recipeTypes';

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
    && typeof value.autoBuyTargetInventory === 'number' && Number.isFinite(value.autoBuyTargetInventory) && value.autoBuyTargetInventory >= 0
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

/** Structural guard used by the company-scoped SQLite save adapter. */
export function isGameSnapshot(value: unknown): value is GameSnapshot {
  if (!isRecord(value) || !isRecord(value.finance) || !isRecord(value.inventory) || !ResourceFlowLedger.isSnapshot(value.resourceFlow)
    || !isRecord(value.market) || !isRecord(value.facilities) || !isRecord(value.salesOrders)
    || !isRecord(value.achievements) || !isFacilityMaintenanceStatisticsSnapshot(value.facilityMaintenance)
    || !isRecord(value.prestige) || !isResearchLedgerSnapshot(value.research) || !isGrantLedgerSnapshot(value.grants) || !isGameTimeSnapshot(value.time)) {
    return false;
  }

  const marketAutomation = value.market.automation;

  return typeof value.finance.balance === 'number'
    && Array.isArray(value.finance.transactions)
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
    && isRecord(value.inventory.entries)
    && isRecord(value.market.local)
    && isRecord(value.market.regional)
    && isRecord(value.market.global)
    && isRecord(marketAutomation)
    && typeof value.market.localMarketDepthMultiplier === 'number' && Number.isFinite(value.market.localMarketDepthMultiplier) && value.market.localMarketDepthMultiplier >= 1
    && Array.isArray(value.market.localMarketNetworkActivations)
    && value.market.localMarketNetworkActivations.every(isLocalMarketNetworkActivationSnapshot)
    && RESOURCE_TYPES.every((resourceType) => isMarketAutomationSnapshot(marketAutomation[resourceType]))
    && Array.isArray(value.facilities.facilities)
    && value.facilities.facilities.every((facility) => isRecord(facility)
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
      && typeof facility.autoRepairEnabled === 'boolean'
      && typeof facility.autoRepairThreshold === 'number' && Number.isFinite(facility.autoRepairThreshold) && facility.autoRepairThreshold >= 0 && facility.autoRepairThreshold < 1
      && typeof facility.autoRepairTarget === 'number' && Number.isFinite(facility.autoRepairTarget) && facility.autoRepairTarget > facility.autoRepairThreshold && facility.autoRepairTarget <= 1
      && (facility.recipeInputQ === null || (typeof facility.recipeInputQ === 'number' && Number.isFinite(facility.recipeInputQ) && facility.recipeInputQ > 0))
      && typeof facility.qualityUpgradeLevel === 'number'
      && Number.isInteger(facility.qualityUpgradeLevel)
      && facility.qualityUpgradeLevel >= 1)
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
