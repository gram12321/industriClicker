import { type FinanceSnapshot } from '../../finance/finance';
import { type InventorySnapshot } from '../../inventory/inventory';
import { type FacilityCollectionSnapshot } from '../../facilities/facilityCollection';
import { type SalesOrdersSnapshot } from '../../sales/salesOrders';
import { isAchievementLedgerSnapshot, type AchievementLedgerSnapshot } from '../../achievements/achievement';
import { isProductionStatisticsSnapshot, type ProductionStatisticsSnapshot } from '../../achievements/productionStatistics';
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
  market: MarketSnapshot;
  facilities: FacilityCollectionSnapshot;
  salesOrders: SalesOrdersSnapshot;
  achievements: AchievementLedgerSnapshot;
  productionStatistics: ProductionStatisticsSnapshot;
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

/** Structural guard used by the company-scoped SQLite save adapter. */
export function isGameSnapshot(value: unknown): value is GameSnapshot {
  if (!isRecord(value) || !isRecord(value.finance) || !isRecord(value.inventory)
    || !isRecord(value.market) || !isRecord(value.facilities) || !isRecord(value.salesOrders)
    || !isRecord(value.achievements) || !isRecord(value.productionStatistics)
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
      && facility.facilityCondition <= 1)
    && Array.isArray(value.salesOrders.offered)
    && Array.isArray(value.salesOrders.completed)
    && value.salesOrders.offered.every((order) => isRecord(order) && Array.isArray(order.lines))
    && value.salesOrders.completed.every((order) => isRecord(order) && Array.isArray(order.lines))
    && Array.isArray(value.salesOrders.customerStates)
    && typeof value.salesOrders.nextOrderNumber === 'number'
    && typeof value.salesOrders.worldSeed === 'string'
    && typeof value.salesOrders.catalogueVersion === 'number'
    && isAchievementLedgerSnapshot(value.achievements)
    && isProductionStatisticsSnapshot(value.productionStatistics)
    && isPrestigeLedgerSnapshot(value.prestige);
}
