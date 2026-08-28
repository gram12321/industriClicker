import type { Inventory } from '@/game/inventory';
import { calculateOutputQuality, calculateWeightedInputQ, type OutputQualityBreakdown } from '@/game/quality';
import { getRecipe, type Recipe, type RecipeInput, type RecipeInputEffects, type RecipeName, type RecipeOutput } from '@/game/recipes';
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

export type RecipeInputPlan = {
  requiredInputs: RecipeInput[];
  optionalInputs: RecipeInput[];
  inputs: RecipeInput[];
  effects: Required<RecipeInputEffects>;
};

const DEFAULT_INPUT_EFFECTS: Required<RecipeInputEffects> = {
  qualityBoost: 0,
  outputMultiplier: 1,
  inputMultiplier: 1,
};

function scaleAmount(amount: number, sizeMultiplier: number): number {
  return amount * Math.max(1, sizeMultiplier);
}

export function getFacilityRecipeRequiredWork(recipe: Recipe, sizeMultiplier = 1): number {
  return scaleAmount(recipe.requiredWork, sizeMultiplier);
}

export function getFacilityRecipeInputs(recipe: Recipe, sizeMultiplier = 1): RecipeInput[] {
  return recipe.inputs.map((input) => ({ ...input, amount: scaleAmount(input.amount, sizeMultiplier) }));
}

function getOptionalResourceSet(recipe: Recipe, enabledOptionalInputs?: readonly ResourceType[]): Set<ResourceType> {
  const enabled = enabledOptionalInputs ? new Set(enabledOptionalInputs) : null;
  return new Set(recipe.inputs.filter((input) => input.optional && (!enabled || enabled.has(input.resourceType))).map((input) => input.resourceType));
}

export function getRecipeInputEffects(recipe: Recipe, enabledOptionalInputs?: readonly ResourceType[]): Required<RecipeInputEffects> {
  const effects = { ...DEFAULT_INPUT_EFFECTS };
  const enabled = getOptionalResourceSet(recipe, enabledOptionalInputs);
  for (const input of recipe.inputs) {
    if (!input.optional || !enabled.has(input.resourceType)) continue;
    effects.qualityBoost += Math.max(0, input.effects?.qualityBoost ?? 0);
    effects.outputMultiplier *= Math.max(Number.EPSILON, input.effects?.outputMultiplier ?? 1);
    effects.inputMultiplier *= Math.max(Number.EPSILON, Math.min(1, input.effects?.inputMultiplier ?? 1));
  }
  return effects;
}

/** Builds a deterministic plan assuming every enabled optional input is available. */
export function getFacilityRecipeInputPlan(recipe: Recipe, sizeMultiplier = 1, enabledOptionalInputs?: readonly ResourceType[]): RecipeInputPlan {
  const effects = getRecipeInputEffects(recipe, enabledOptionalInputs);
  const enabled = getOptionalResourceSet(recipe, enabledOptionalInputs);
  const requiredInputs = recipe.inputs
    .filter((input) => !input.optional)
    .map((input) => ({ ...input, amount: scaleAmount(input.amount * effects.inputMultiplier, sizeMultiplier) }));
  const optionalInputs = recipe.inputs
    .filter((input) => input.optional && enabled.has(input.resourceType))
    .map((input) => ({ ...input, amount: scaleAmount(input.amount, sizeMultiplier) }));
  return { requiredInputs, optionalInputs, inputs: [...requiredInputs, ...optionalInputs], effects };
}

/** Builds the plan for the optional inputs that are both enabled and currently available. */
export function getFacilityAvailableRecipeInputPlan(recipe: Recipe, inventory: Inventory, sizeMultiplier = 1, enabledOptionalInputs?: readonly ResourceType[]): RecipeInputPlan {
  const enabled = getOptionalResourceSet(recipe, enabledOptionalInputs);
  const available = recipe.inputs
    .filter((input) => input.optional && enabled.has(input.resourceType) && inventory.has(input.resourceType, scaleAmount(input.amount, sizeMultiplier)))
    .map((input) => input.resourceType);
  return getFacilityRecipeInputPlan(recipe, sizeMultiplier, available);
}

export function getFacilityRecipeOutputs(recipe: Recipe, sizeMultiplier = 1): RecipeOutput[] {
  return recipe.outputs.map((output) => ({ ...output, amount: scaleAmount(output.amount, sizeMultiplier) }));
}

export function getFacilityRecipeOutputRequiredWork(recipe: Recipe, output: RecipeOutput, sizeMultiplier = 1): number {
  return scaleAmount(output.requiredWork ?? recipe.requiredWork, sizeMultiplier);
}

export function hasIndependentOutputProgress(recipe: Recipe): boolean {
  return recipe.inputs.length === 0 && recipe.outputs.some((output) => output.requiredWork !== undefined);
}

/** Calculates the amount-weighted quality of a recipe's consumed inputs. */
export function calculateRecipeInputQ(recipe: Recipe, inventory: Inventory, sizeMultiplier = 1, enabledOptionalInputs?: readonly ResourceType[]): number | null {
  return calculateWeightedInputQ(getFacilityAvailableRecipeInputPlan(recipe, inventory, sizeMultiplier, enabledOptionalInputs).inputs.map((input) => ({
    amount: input.amount,
    quality: inventory.getQuality(input.resourceType),
  })));
}

/** Direct material cost captured when a recipe cycle consumes its inputs. */
export function calculateRecipeInputSourceCost(recipe: Recipe, inventory: Inventory, sizeMultiplier = 1, enabledOptionalInputs?: readonly ResourceType[]): number {
  return getFacilityAvailableRecipeInputPlan(recipe, inventory, sizeMultiplier, enabledOptionalInputs).inputs.reduce(
    (total, input) => total + input.amount * inventory.getEntry(input.resourceType).sourceCostPerUnit,
    0,
  );
}

/** Deterministic production wear for one completed recipe cycle. */
export function getRecipeProductionConditionLoss(recipe: Recipe): number {
  return (recipe.requiredWork * FACILITY_PRODUCTION_CONDITION_LOSS_PER_WORK_UNIT + FACILITY_PRODUCTION_CONDITION_LOSS_PER_CYCLE)
    * recipe.conditionWearMultiplier;
}

/** Condition loss per minute for ordinary cycles or simultaneously progressing no-input outputs. */
export function getRecipeProductionConditionLossPerMinute(recipe: Recipe, effectiveWorkPerMinute: number, sizeMultiplier = 1): number {
  if (recipe.requiredWork <= 0 || effectiveWorkPerMinute <= 0) return 0;
  const scaledRecipeWork = getFacilityRecipeRequiredWork(recipe, sizeMultiplier);
  if (!hasIndependentOutputProgress(recipe)) return effectiveWorkPerMinute / scaledRecipeWork * getRecipeProductionConditionLoss(recipe);
  return recipe.outputs.reduce((total, output) => {
    const outputWork = getFacilityRecipeOutputRequiredWork(recipe, output, sizeMultiplier);
    if (outputWork <= 0) return total;
    const conditionLoss = getRecipeProductionConditionLoss(recipe) * outputWork / scaledRecipeWork;
    return total + effectiveWorkPerMinute / outputWork * conditionLoss;
  }, 0);
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

  return (baseWork * Math.max(1, facility.sizeMultiplier) + staffWork)
    * facility.conditionEfficiency
    * facility.speedUpgradeWorkSpeedMultiplier
    * recipeResearchWorkSpeedMultiplier;
}

/** Inputs still needed before the facility can begin its next recipe cycle. */
export function getFacilityMissingInputs(recipeName: RecipeName | null, inventory: Inventory, sizeMultiplier = 1, enabledOptionalInputs?: readonly ResourceType[]): RecipeInput[] {
  if (!recipeName) return [];

  return getFacilityAvailableRecipeInputPlan(getRecipe(recipeName), inventory, sizeMultiplier, enabledOptionalInputs).requiredInputs.filter((input) => !inventory.has(input.resourceType, input.amount));
}

/** Total inputs needed to complete each recipe in a facility's configured production cycle once. */
export function getFacilityProductionCycleInputs(facility: FacilityView): RecipeInput[] {
  const amounts = new Map<ResourceType, number>();
  for (const recipeName of facility.productionCycle) {
    const enabledOptionalInputs = facility.optionalInputSettings[recipeName] ?? undefined;
    for (const input of getFacilityRecipeInputPlan(getRecipe(recipeName), facility.sizeMultiplier, enabledOptionalInputs).inputs) {
      amounts.set(input.resourceType, (amounts.get(input.resourceType) ?? 0) + input.amount);
    }
  }
  return [...amounts].map(([resourceType, amount]) => ({ resourceType, amount }));
}

export function getFacilityProductionStatus(facility: FacilityView, inventory: Inventory): FacilityProductionStatus {
  const recipeName = facility.activeRecipeName;
  if (!recipeName) return 'not-started';
  if (!facility.isActive) return 'paused';

  return (facility.recipeProgress[recipeName] ?? 0) === 0 && getFacilityMissingInputs(recipeName, inventory, facility.sizeMultiplier, facility.optionalInputSettings[recipeName]).length > 0
    ? 'missing-inputs'
    : 'producing';
}

/** Advances every facility in deterministic production order. */
export function advanceAllFacilityProduction(
  facilities: FacilityCollection,
  inventory: Inventory,
  getEffectiveWork: (facility: FacilityView, recipeName: RecipeName) => number,
  onInputConsumed?: (input: RecipeInput) => void,
  resolveOutputQuality?: (facility: FacilityView, output: RecipeOutput, weightedInputQ: number | null, upgradeMaxQ: number, inputEffects: Required<RecipeInputEffects>) => OutputQualityBreakdown,
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

      const activeRecipe = getRecipe(currentRecipeName);
      if (hasIndependentOutputProgress(activeRecipe)) {
        const effectiveWork = getEffectiveWork(facilityView, currentRecipeName);
        if (!Number.isFinite(effectiveWork) || effectiveWork <= 0) continue;

        for (const output of getFacilityRecipeOutputs(activeRecipe, facilityView.sizeMultiplier)) {
          const requiredWork = getFacilityRecipeOutputRequiredWork(activeRecipe, output, facilityView.sizeMultiplier);
          if (requiredWork <= 0) continue;
          let outputProgress = facilityView.recipeOutputProgress[currentRecipeName]?.[output.resourceType] ?? 0;
          let remainingWork = effectiveWork;

          while (remainingWork > 0) {
            const appliedWork = Math.min(remainingWork, requiredWork - outputProgress);
            outputProgress += appliedWork;
            remainingWork -= appliedWork;
            if (outputProgress + WORK_COMPLETION_EPSILON < requiredWork) break;

            const inputEffects = DEFAULT_INPUT_EFFECTS;
            const amount = output.amount * facilityView.outputMultiplier;
            const maintenanceFraction = requiredWork / getFacilityRecipeRequiredWork(activeRecipe, facilityView.sizeMultiplier);
            const productionMaintenanceCost = Math.max(0, getProductionMaintenanceCost?.(facility.getView(), activeRecipe) ?? 0) * maintenanceFraction;
            const outputSourceCostPerUnit = amount > 0 ? productionMaintenanceCost / amount : 0;
            const qualityBreakdown = resolveOutputQuality?.(facilityView, output, null, facilityView.upgradeMaxQ, inputEffects)
              ?? calculateOutputQuality({ weightedInputQ: null, researchMaxQ: 1, upgradeMaxQ: facilityView.upgradeMaxQ, outputBonusQ: output.outputBonusQ ?? 0 });
            inventory.add(output.resourceType, amount, qualityBreakdown.outputQ, outputSourceCostPerUnit);
            outputs.push({ facilityId: facilityView.id, facilityType: facilityView.facilityType, recipeName: activeRecipe.name, resourceType: output.resourceType, amount, quality: qualityBreakdown.outputQ, sourceCostPerUnit: outputSourceCostPerUnit });
            facility.applyConditionLoss(getRecipeProductionConditionLoss(activeRecipe) * maintenanceFraction);
            facility.gainStaffExperience(output.requiredWork ?? activeRecipe.requiredWork);
            outputProgress = 0;
          }

          facility.setRecipeOutputProgress(currentRecipeName, output.resourceType, outputProgress);
        }
        continue;
      }

      while (remainingStepFraction > 0) {
        const recipe = getRecipe(currentRecipeName);
        const requiredWork = getFacilityRecipeRequiredWork(recipe, facilityView.sizeMultiplier);
        const enabledOptionalInputs = facilityView.optionalInputSettings[currentRecipeName] ?? undefined;
        const inputPlan = getFacilityAvailableRecipeInputPlan(recipe, inventory, facilityView.sizeMultiplier, enabledOptionalInputs);
        const inputs = inputPlan.inputs;
        const scaledOutputs = getFacilityRecipeOutputs(recipe, facilityView.sizeMultiplier);
        if (requiredWork <= 0) break;
        const effectiveWork = getEffectiveWork(facilityView, currentRecipeName);
        if (!Number.isFinite(effectiveWork) || effectiveWork <= 0) break;
        if (progress === 0 && !inputPlan.requiredInputs.every((input) => inventory.has(input.resourceType, input.amount))) break;

        if (progress === 0) {
          facility.setRecipeInputQ(calculateRecipeInputQ(recipe, inventory, facilityView.sizeMultiplier, enabledOptionalInputs));
          facility.setRecipeInputSourceCost(calculateRecipeInputSourceCost(recipe, inventory, facilityView.sizeMultiplier, enabledOptionalInputs));
          facility.setRecipeInputEffects(inputPlan.effects);
          for (const input of inputs) {
            if (inventory.remove(input.resourceType, input.amount)) onInputConsumed?.(input);
          }
        }

        const appliedWork = Math.min(remainingStepFraction * effectiveWork, requiredWork - progress);
        progress += appliedWork;
        remainingStepFraction = Math.max(0, remainingStepFraction - appliedWork / effectiveWork);

        if (progress + WORK_COMPLETION_EPSILON >= requiredWork) {
          const totalOutputAmount = scaledOutputs.reduce(
            (total, output) => total + output.amount * facilityView.outputMultiplier * (facility.getView().recipeInputEffects?.outputMultiplier ?? 1),
            0,
          );
          const productionMaintenanceCost = getProductionMaintenanceCost?.(facility.getView(), recipe) ?? 0;
          const outputSourceCostPerUnit = totalOutputAmount > 0
            ? ((facility.getView().recipeInputSourceCost ?? 0) + Math.max(0, productionMaintenanceCost)) / totalOutputAmount
            : 0;
          for (const output of scaledOutputs) {
            const amount = output.amount * facilityView.outputMultiplier * (facility.getView().recipeInputEffects?.outputMultiplier ?? 1);
            const inputEffects = facility.getView().recipeInputEffects ?? DEFAULT_INPUT_EFFECTS;
            const qualityBreakdown = resolveOutputQuality?.(facilityView, output, facility.getView().recipeInputQ, facilityView.upgradeMaxQ, inputEffects)
              ?? calculateOutputQuality({ weightedInputQ: facility.getView().recipeInputQ, researchMaxQ: 1, upgradeMaxQ: facilityView.upgradeMaxQ, outputBonusQ: (output.outputBonusQ ?? 0) + inputEffects.qualityBoost });
            inventory.add(output.resourceType, amount, qualityBreakdown.outputQ, outputSourceCostPerUnit);
            outputs.push({ facilityId: facilityView.id, facilityType: facilityView.facilityType, recipeName: recipe.name, resourceType: output.resourceType, amount, quality: qualityBreakdown.outputQ, sourceCostPerUnit: outputSourceCostPerUnit });
          }
          facility.applyConditionLoss(getRecipeProductionConditionLoss(recipe));
          facility.gainStaffExperience(recipe.requiredWork);
          facility.setRecipeInputQ(null);
          facility.setRecipeInputSourceCost(null);
          facility.setRecipeInputEffects(null);
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
