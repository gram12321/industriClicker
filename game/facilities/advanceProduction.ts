import type { FacilityCollection } from './facilityCollection';
import type { ProductionOutput } from './facility';
import type { Inventory } from '@/game/inventory';
import { FACILITY_PRODUCTION_ORDER } from './facilityConstants';
import type { RecipeName } from '@/game/recipes';

/** Applies one or more already-approved work units to all active facilities. */
export function advanceProduction(
  facilities: FacilityCollection,
  inventory: Inventory,
  workAmount: number,
  recipeTimeMultiplier: (recipeName: RecipeName) => number = () => 1,
): ProductionOutput[] {
  const outputs: ProductionOutput[] = [];
  if (!Number.isFinite(workAmount) || workAmount <= 0) {
    return outputs;
  }

  for (const facilityType of FACILITY_PRODUCTION_ORDER) {
    for (const facility of facilities.getAllByType(facilityType)) {
      const recipeName = facility.getActiveRecipeName();
      outputs.push(...facility.advanceProduction(inventory, workAmount, recipeName ? recipeTimeMultiplier(recipeName) : 1));
    }
  }

  return outputs;
}
