import type { Inventory } from '@/game/inventory';
import { getRecipe, type RecipeInput, type RecipeName } from '@/game/recipes';
import type { ResourceType } from '@/game/resources';
import { FACILITY_PRODUCTION_ORDER } from './facilityConstants';
import type { Facility } from './facility';
import type { FacilityCollection } from './facilityCollection';

const WORK_COMPLETION_EPSILON = 1e-9;

export type FacilityProductionStatus = 'not-started' | 'paused' | 'missing-inputs' | 'producing';

export type ProductionOutput = {
  facilityType: Facility['facilityType'];
  recipeName: RecipeName;
  resourceType: ResourceType;
  amount: number;
};

/** Returns the speed-adjusted work an individual facility can apply. */
export function calculateFacilityEffectiveWork(
  facility: Facility,
  baseWork: number,
  recipeResearchWorkSpeedMultiplier = 1,
): number {
  if (!Number.isFinite(baseWork) || baseWork <= 0) return 0;

  return baseWork
    * facility.getBuildingEfficiency()
    * facility.getSpeedUpgradeWorkSpeedMultiplier()
    * recipeResearchWorkSpeedMultiplier;
}

/** Inputs still needed before the facility can begin its next recipe cycle. */
export function getFacilityMissingInputs(facility: Facility, inventory: Inventory): RecipeInput[] {
  const recipeName = facility.getActiveRecipeName();
  if (!recipeName) return [];

  return getRecipe(recipeName).inputs.filter((input) => !inventory.has(input.resourceType, input.amount));
}

export function getFacilityProductionStatus(facility: Facility, inventory: Inventory): FacilityProductionStatus {
  const recipeName = facility.getActiveRecipeName();
  if (!recipeName) return 'not-started';
  if (!facility.isActive()) return 'paused';

  return facility.getRecipeProgress(recipeName) === 0 && getFacilityMissingInputs(facility, inventory).length > 0
    ? 'missing-inputs'
    : 'producing';
}

/** Advances every facility in deterministic production order. */
export function advanceAllFacilityProduction(
  facilities: FacilityCollection,
  inventory: Inventory,
  getEffectiveWork: (facility: Facility, recipeName: RecipeName) => number,
): ProductionOutput[] {
  const outputs: ProductionOutput[] = [];

  for (const facilityType of FACILITY_PRODUCTION_ORDER) {
    for (const facility of facilities.getAllByType(facilityType)) {
      const recipeName = facility.getActiveRecipeName();
      if (!facility.isActive() || !recipeName) continue;

      const recipe = getRecipe(recipeName);
      if (recipe.requiredWork <= 0) continue;

      let remainingEffectiveWork = getEffectiveWork(facility, recipeName);
      if (!Number.isFinite(remainingEffectiveWork) || remainingEffectiveWork <= 0) continue;
      let progress = facility.getRecipeProgress(recipe.name);

      while (remainingEffectiveWork > 0) {
        if (progress === 0 && !recipe.inputs.every((input) => inventory.has(input.resourceType, input.amount))) break;

        if (progress === 0) {
          for (const input of recipe.inputs) {
            inventory.remove(input.resourceType, input.amount);
          }
        }

        const appliedWork = Math.min(remainingEffectiveWork, recipe.requiredWork - progress);
        progress += appliedWork;
        remainingEffectiveWork -= appliedWork;

        if (progress + WORK_COMPLETION_EPSILON >= recipe.requiredWork) {
          const amount = recipe.output.amount * facility.getOutputMultiplier();
          inventory.add(recipe.output.resourceType, amount);
          outputs.push({ facilityType: facility.facilityType, recipeName: recipe.name, resourceType: recipe.output.resourceType, amount });
          progress = 0;
        }
      }

      facility.setRecipeProgress(recipe.name, progress);
    }
  }

  return outputs;
}
