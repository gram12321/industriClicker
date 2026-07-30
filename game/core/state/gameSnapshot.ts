import { type FinanceSnapshot } from '../../finance/finance';
import { type InventorySnapshot } from '../../inventory/inventory';
import { type FacilityCollectionSnapshot } from '../../facilities/facilityCollection';
import { type SalesContractsSnapshot } from '../../sales/salesContracts';
import { type PrestigeLedgerSnapshot } from '../../prestige/prestige';

export type GameTimeSnapshot = {
  /** Logical foreground game time. Fast-forward deliberately advances it. */
  lastProcessedAtMs: number;
  /** Foreground milliseconds retained until they form a whole sales minute. */
  unprocessedWorkMs: number;
  /** Estimated customer-wait intervals elapsed since the last customer offer. */
  customerPipelineProgress: number;
};

/**
 * Plain game data written to the single Expo SQLite save record. Code-owned
 * definitions and class methods are intentionally absent.
 */
export type GameSnapshot = {
  finance: FinanceSnapshot;
  inventory: InventorySnapshot;
  facilities: FacilityCollectionSnapshot;
  salesContracts: SalesContractsSnapshot;
  prestige: PrestigeLedgerSnapshot;
  time: GameTimeSnapshot;
};
