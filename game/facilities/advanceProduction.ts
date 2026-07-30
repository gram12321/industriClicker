import type { FacilityCollection } from './facilityCollection';
import type { ProductionOutput } from './facility';
import type { Inventory } from '../inventory/inventory';
import { FACILITY_PRODUCTION_ORDER } from './facilityConstants';

/** Applies one or more already-approved work units to all active facilities. */
export function advanceProduction(
  facilities: FacilityCollection,
  inventory: Inventory,
  workAmount: number,
): ProductionOutput[] {
  const outputs: ProductionOutput[] = [];
  if (!Number.isFinite(workAmount) || workAmount <= 0) {
    return outputs;
  }

  for (const facilityType of FACILITY_PRODUCTION_ORDER) {
    const facility = facilities.get(facilityType);
    if (facility) {
      outputs.push(...facility.advanceProduction(inventory, workAmount));
    }
  }

  return outputs;
}
