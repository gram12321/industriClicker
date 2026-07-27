import type { FacilityCollection } from './facilityCollection';
import { FacilityType } from './facilityTypes';
import type { Inventory } from '../inventory/inventory';

/**
 * Fixed order keeps a production minute deterministic. Utilities run before
 * consumers so Water and Electricity can be used by Farm and Bakery work.
 */
const PRODUCTION_ORDER = [
  FacilityType.SmallUtilityWorks,
  FacilityType.Farm,
  FacilityType.Bakery,
] as const;

/** Applies one or more already-approved work units to all active facilities. */
export function advanceProduction(
  facilities: FacilityCollection,
  inventory: Inventory,
  workAmount: number,
): void {
  if (!Number.isFinite(workAmount) || workAmount <= 0) {
    return;
  }

  for (const facilityType of PRODUCTION_ORDER) {
    facilities.get(facilityType)?.advanceProduction(inventory, workAmount);
  }
}
