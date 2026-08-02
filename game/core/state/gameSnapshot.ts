import { type FinanceSnapshot } from '../../finance/finance';
import { type InventorySnapshot } from '../../inventory/inventory';
import { type FacilityCollectionSnapshot } from '../../facilities/facilityCollection';
import { type SalesContractsSnapshot } from '../../sales/salesContracts';
import { type AchievementLedgerSnapshot } from '../../achievements/achievement';
import { type ProductionStatisticsSnapshot } from '../../achievements/productionStatistics';
import { type PrestigeLedgerSnapshot } from '../../prestige/prestige';
import { type MarketSnapshot } from '../../market/marketTypes';
import { isAchievementLedgerSnapshot } from '../../achievements/achievement';
import { isProductionStatisticsSnapshot } from '../../achievements/productionStatistics';
import { isPrestigeLedgerSnapshot } from '../../prestige/prestige';

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
  salesContracts: SalesContractsSnapshot;
  achievements: AchievementLedgerSnapshot;
  productionStatistics: ProductionStatisticsSnapshot;
  prestige: PrestigeLedgerSnapshot;
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

/** Structural guard used by the company-scoped SQLite save adapter. */
export function isGameSnapshot(value: unknown): value is GameSnapshot {
  if (!isRecord(value) || !isRecord(value.finance) || !isRecord(value.inventory)
    || !isRecord(value.market) || !isRecord(value.facilities) || !isRecord(value.salesContracts)
    || !isRecord(value.achievements) || !isRecord(value.productionStatistics)
    || !isRecord(value.prestige) || !isGameTimeSnapshot(value.time)) {
    return false;
  }

  return typeof value.finance.balance === 'number'
    && Array.isArray(value.finance.transactions)
    && isRecord(value.inventory.entries)
    && isRecord(value.market.local)
    && isRecord(value.market.global)
    && isRecord(value.market.automation)
    && Array.isArray(value.facilities.facilities)
    && Array.isArray(value.salesContracts.offered)
    && Array.isArray(value.salesContracts.completed)
    && typeof value.salesContracts.nextCustomerNumber === 'number'
    && isAchievementLedgerSnapshot(value.achievements)
    && isProductionStatisticsSnapshot(value.productionStatistics)
    && isPrestigeLedgerSnapshot(value.prestige);
}
