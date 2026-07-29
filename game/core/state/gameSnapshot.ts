import { type FinanceSnapshot } from '../../finance/finance';
import { type InventorySnapshot } from '../../inventory/inventory';
import { type FacilityCollectionSnapshot } from '../../facilities/facilityCollection';
import { type SalesContractsSnapshot } from '../../sales/salesContracts';

/**
 * Plain game data written to the single Expo SQLite save record. Code-owned
 * definitions and class methods are intentionally absent.
 */
export type GameSnapshot = {
  finance: FinanceSnapshot;
  inventory: InventorySnapshot;
  facilities: FacilityCollectionSnapshot;
  salesContracts: SalesContractsSnapshot;
};
