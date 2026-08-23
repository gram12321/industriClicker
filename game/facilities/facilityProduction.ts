import type { Inventory } from '@/game/inventory';
import { calculateOutputQuality, calculateWeightedInputQ, type OutputQualityBreakdown } from '@/game/quality';
import { getRecipe, type Recipe, type RecipeInput, type RecipeName } from '@/game/recipes';
import type { ResourceType } from '@/game/resources';
import { FACILITY_PRODUCTION_CONDITION_LOSS_PER_CYCLE, FACILITY_PRODUCTION_CONDITION_LOSS_PER_WORK_UNIT, FACILITY_PRODUCTION_ORDER, FACILITY_STAFF_WORK_PER_WORKER_PER_MINUTE } from './facilityConstants';
import type { FacilityView } from './facility';
import type { FacilityCollection } from './facilityCollection';

const WORK_COMPLETION_EPSILON = 1e-9;

export type FacilityProductionStatus = 'not-started' | 'paused' | 'missing-inputs' | 'producing';

export type ProductionOutput = {
  facilityId: string;
  facilityType: FacilityView['facilityType'];
  recipeName: RecipeName;
  resourceType: ResourceType;
  amount: number;
  quality: number;
  sourceCostPerUnit: number;
};

/** Calculates the amount-weighted quality of a recipe's consumed inputs. */
export function calculateRecipeInputQ(recipe: Recipe, inventory: Inventory): number | null {
  return calculateWeightedInputQ(recipe.inputs.map((input) => ({
    amount: input.amount,
    quality: inventory.getQuality(input.resourceType),
  })));
}

/** Direct material cost captured when a recipe cycle consumes its inputs. */
export function calculateRecipeInputSourceCost(recipe: Recipe, inventory: Inventory): number {
  return recipe.inputs.reduce(
    (total, input) => total + input.amount * inventory.getEntry(input.resourceType).sourceCostPerUnit,
    0,
  );
}

/** Deterministic production wear for one completed recipe cycle. */
export function getRecipeProductionConditionLoss(recipe: Recipe): number {
  return (recipe.requiredWork * FACILITY_PRODUCTION_CONDITION_LOSS_PER_WORK_UNIT + FACILITY_PRODUCTION_CONDITION_LOSS_PER_CYCLE)
    * recipe.conditionWearMultiplier;
}

/** Returns the speed-adjusted work an individual facility can apply. */
export function calculateFacilityEffectiveWork(
  facility: FacilityView,
  baseWork: number,
  recipeResearchWorkSpeedMultiplier = 1,
): number {
  if (!Number.isFinite(baseWork) || baseWork <= 0) return 0;

  const availableWorkers = Math.max(0, facility.assignedWorkers - (facility.staffTraining?.workers ?? 0));
  const staffWork = baseWork
    * availableWorkers
    * FACILITY_STAFF_WORK_PER_WORKER_PER_MINUTE
    * facility.staffingEfficiency;

  return (baseWork + staffWork)
    * facility.conditionEfficiency
    * facility.speedUpgradeWorkSpeedMultiplier
    * recipeResearchWorkSpeedMultiplier;
}

/** Inputs still needed before the facility can begin its next recipe cycle. */
export function getFacilityMissingInputs(recipeName: RecipeName | null, inventory: Inventory): RecipeInput[] {
  if (!recipeName) return [];

  return getRecipe(recipeName).inputs.filter((input) => !inventory.has(input.resourceType, input.amount));
}

/** Total inputs needed to complete each recipe in a facility's configured production cycle once. */
export function getFacilityProductionCycleInputs(facility: FacilityView): RecipeInput[] {
  const amounts = new Map<ResourceType, number>();
  for (const recipeName of facility.productionCycle) {
    for (const input of getRecipe(recipeName).inputs) {
      amounts.set(input.resourceType, (amounts.get(input.resourceType) ?? 0) + input.amount);
    }
  }
  return [...amounts].map(([resourceType, amount]) => ({ resourceType, amount }));
}

export function getFacilityProductionStatus(facility: FacilityView, inventory: Inventory): FacilityProductionStatus {
  const recipeName = facility.activeRecipeName;
  if (!recipeName) return 'not-started';
  if (!facility.isActive) return 'paused';

  return (facility.recipeProgress[recipeName] ?? 0) === 0 && getFacilityMissingInputs(recipeName, inventory).length > 0
    ? 'missing-inputs'
    : 'producing';
}

/** Advances every facility in deterministic production order. */
export function advanceAllFacilityProduction(
  facilities: FacilityCollection,
  inventory: Inventory,
  getEffectiveWork: (facility: FacilityView, recipeName: RecipeName) => number,
  onInputConsumed?: (input: RecipeInput) => void,
  resolveOutputQuality?: (facility: FacilityView, resourceType: ResourceType, weightedInputQ: number | null, upgradeMaxQ: number) => OutputQualityBreakdown,
  getProductionMaintenanceCost?: (facility: FacilityView, recipe: Recipe) => number,
): ProductionOutput[] {
  const outputs: ProductionOutput[] = [];

  for (const facilityType of FACILITY_PRODUCTION_ORDER) {
    for (const facility of facilities.getAllByType(facilityType)) {
      const facilityView = facility.getView();
      const recipeName = facilityView.activeRecipeName;
      if (!facilityView.isActive || !recipeName) continue;

      let currentRecipeName = recipeName;
      let progress = facilityView.recipeProgress[currentRecipeName] ?? 0;
      let remainingStepFraction = 1;

      while (remainingStepFraction > 0) {
        const recipe = getRecipe(currentRecipeName);
        if (recipe.requiredWork <= 0) break;
        const effectiveWork = getEffectiveWork(facilityView, currentRecipeName);
        if (!Number.isFinite(effectiveWork) || effectiveWork <= 0) break;
        if (progress === 0 && !recipe.inputs.every((input) => inventory.has(input.resourceType, input.amount))) break;

        if (progress === 0) {
          facility.setRecipeInputQ(calculateRecipeInputQ(recipe, inventory));
          facility.setRecipeInputSourceCost(calculateRecipeInputSourceCost(recipe, inventory));
          for (const input of recipe.inputs) {
            if (inventory.remove(input.resourceType, input.amount)) onInputConsumed?.(input);
          }
        }

        const appliedWork = Math.min(remainingStepFraction * effectiveWork, recipe.requiredWork - progress);
        progress += appliedWork;
        remainingStepFraction = Math.max(0, remainingStepFraction - appliedWork / effectiveWork);

        if (progress + WORK_COMPLETION_EPSILON >= recipe.requiredWork) {
          const totalOutputAmount = recipe.outputs.reduce(
            (total, output) => total + output.amount * facilityView.outputMultiplier,
            0,
          );
          const productionMaintenanceCost = getProductionMaintenanceCost?.(facility.getView(), recipe) ?? 0;
          const outputSourceCostPerUnit = totalOutputAmount > 0
            ? ((facility.getView().recipeInputSourceCost ?? 0) + Math.max(0, productionMaintenanceCost)) / totalOutputAmount
            : 0;
          for (const output of recipe.outputs) {
            const amount = output.amount * facilityView.outputMultiplier;
            const qualityBreakdown = resolveOutputQuality?.(facilityView, output.resourceType, facility.getView().recipeInputQ, facilityView.upgradeMaxQ)
              ?? calculateOutputQuality({ weightedInputQ: facility.getView().recipeInputQ, researchMaxQ: 1, upgradeMaxQ: facilityView.upgradeMaxQ });
            inventory.add(output.resourceType, amount, qualityBreakdown.outputQ, outputSourceCostPerUnit);
            outputs.push({ facilityId: facilityView.id, facilityType: facilityView.facilityType, recipeName: recipe.name, resourceType: output.resourceType, amount, quality: qualityBreakdown.outputQ, sourceCostPerUnit: outputSourceCostPerUnit });
          }
          facility.applyConditionLoss(getRecipeProductionConditionLoss(recipe));
          facility.gainStaffExperience(recipe.requiredWork);
          facility.setRecipeInputQ(null);
          facility.setRecipeInputSourceCost(null);
          progress = 0;
          if (!facility.advanceProductionCycle()) break;
          currentRecipeName = facility.getView().activeRecipeName ?? currentRecipeName;
        }
      }

      facility.setRecipeProgress(currentRecipeName, progress);
    }
  }

  return outputs;
}
