import { type InventorySnapshot } from '../inventory/inventory';
import { type FacilityCollectionSnapshot } from '../facilities/facilityCollection';

/**
 * Plain game data that can later be written to Expo SQLite at an approved save
 * boundary. Code-owned definitions and class methods are intentionally absent.
 */
export type GameSnapshot = {
  inventory: InventorySnapshot;
  facilities: FacilityCollectionSnapshot;
};
