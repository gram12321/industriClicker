import type { FacilityCollection } from './facilityCollection';
import type { Inventory } from '../inventory/inventory';
import { FACILITY_PRODUCTION_ORDER } from './facilityConstants';

/** Applies one or more already-approved work units to all active facilities. */
export function advanceProduction(
  facilities: FacilityCollection,
  inventory: Inventory,
  workAmount: number,
): void {
  if (!Number.isFinite(workAmount) || workAmount <= 0) {
    return;
  }

  for (const facilityType of FACILITY_PRODUCTION_ORDER) {
    facilities.get(facilityType)?.advanceProduction(inventory, workAmount);
  }
}
