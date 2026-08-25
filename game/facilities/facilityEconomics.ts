import { calculateAsymmetricalScaler01 } from '@/game/core/math';
import { BASE_WORK_PER_MINUTE } from '@/game/core/time';
import type { Finance } from '@/game/finance';
import type { Inventory } from '@/game/inventory';
import type { Market } from '@/game/market';
import type { Recipe, RecipeInputEffects } from '@/game/recipes';
import { ResourceType } from '@/game/resources';
import { calculateOutputQuality, calculateUpgradeMaxQ } from '@/game/quality';
import { Facility, type FacilityView } from './facility';
import {
  FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE,
  FACILITY_REPAIR_MATERIAL_COST_RATE,
  getFacilityDefinition,
} from './facilityConstants';
import { calculateFacilityEffectiveWork, calculateRecipeInputQ, calculateRecipeInputSourceCost, getFacilityAvailableRecipeInputPlan, getFacilityRecipeInputPlan, type RecipeInputPlan, getRecipeProductionConditionLoss } from './facilityProduction';
import { getConditionDecayMultiplier, getFacilityConditionEfficiency, getOverstaffingConditionDecayMultiplier, type FacilityUpgradeKind } from './facilityUpgrades';

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export type FacilityResourcePayment = {
  canAfford: boolean;
  cashCost: number;
};

/** Calculates the cash needed after buying any missing upgrade or repair materials. */
export function calculateFacilityResourcePayment(
  finance: Finance,
  inventory: Inventory,
  market: Market,
  cashBaseCost: number,
  constructionMaterialsCost: number,
  industrialMachinesCost: number,
): FacilityResourcePayment {
  const missingConstructionMaterials = Math.max(
    0,
    constructionMaterialsCost - inventory.getAmount(ResourceType.ConstructionMaterials),
  );
  const missingIndustrialMachines = Math.max(
    0,
    industrialMachinesCost - inventory.getAmount(ResourceType.IndustrialMachines),
  );
  const missingConstructionMaterialsQuote = missingConstructionMaterials > 0 ? market.getLocalBuyQuote(ResourceType.ConstructionMaterials, missingConstructionMaterials) : null;
  const missingIndustrialMachinesQuote = missingIndustrialMachines > 0 ? market.getLocalBuyQuote(ResourceType.IndustrialMachines, missingIndustrialMachines) : null;
  const missingInputPurchaseCost = (missingConstructionMaterialsQuote === null ? 0 : missingConstructionMaterialsQuote.success ? missingConstructionMaterialsQuote.unitPrice * missingConstructionMaterialsQuote.amount : Number.POSITIVE_INFINITY)
    + (missingIndustrialMachinesQuote === null ? 0 : missingIndustrialMachinesQuote.success ? missingIndustrialMachinesQuote.unitPrice * missingIndustrialMachinesQuote.amount : Number.POSITIVE_INFINITY);
  const cashCost = cashBaseCost + missingInputPurchaseCost;

  return {
    canAfford:
      (missingConstructionMaterialsQuote === null || missingConstructionMaterialsQuote.success)
      && (missingIndustrialMachinesQuote === null || missingIndustrialMachinesQuote.success)
      && finance.canAfford(cashCost),
    cashCost,
  };
}

/** Calculates a recipe's market value after input costs, at its current production speed. */
export function calculateRecipeValuePerMinute(
  recipe: Recipe,
  market: Market,
  outputMultiplier: number,
  workPerMinute: number,
  getInputQuality?: (resourceType: ResourceType) => number,
  getOutputQuality?: (resourceType: ResourceType) => number,
  sizeMultiplier = 1,
  inputPlan?: RecipeInputPlan,
  inputEffects?: Required<RecipeInputEffects>,
): number {
  const multiplier = Math.max(1, sizeMultiplier);
  if (recipe.requiredWork <= 0) return 0;

  const plan = inputPlan ?? getFacilityRecipeInputPlan(recipe, multiplier);
  const effects = inputEffects ?? plan.effects;

  const cyclesPerMinute = workPerMinute / (recipe.requiredWork * multiplier);
  const outputValue = recipe.outputs.reduce(
    (total, output) => total + output.amount * multiplier * outputMultiplier * effects.outputMultiplier * (getOutputQuality
      ? market.getLocalSalePrice(output.resourceType, getOutputQuality(output.resourceType))
      : market.getLocalPrice(output.resourceType)),
    0,
  );
  const inputValue = plan.inputs.reduce(
    (total, input) => total + input.amount * (getInputQuality
      ? market.getLocalSalePrice(input.resourceType, getInputQuality(input.resourceType))
      : market.getLocalPrice(input.resourceType)),
    0,
  );

  return (outputValue - inputValue) * cyclesPerMinute;
}

/** Converts condition wear into the construction-material cost needed to repair it. */
export function calculateFacilityDecayMaterialCostPerMinute(
  constructionMaterialsCost: number,
  facilityCondition: number,
  conditionDecayMultiplier: number,
  effectiveWorkPerMinute: number,
  recipe: Recipe | null,
  sizeMultiplier = 1,
): number {
  const condition = clamp(facilityCondition, 0, 1);
  const productionConditionLossPerMinute = recipe && recipe.requiredWork > 0
    ? Math.max(0, effectiveWorkPerMinute) / (recipe.requiredWork * Math.max(1, sizeMultiplier)) * getRecipeProductionConditionLoss(recipe)
    : 0;
  const conditionLossPerMinute = (
    FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE + productionConditionLossPerMinute
  ) * calculateAsymmetricalScaler01(condition) * conditionDecayMultiplier;

  return Math.max(0, constructionMaterialsCost)
    * FACILITY_REPAIR_MATERIAL_COST_RATE
    * conditionLossPerMinute;
}

/** Calculates profit after euro-denominated condition wear and recurring staff wages. */
export function calculateFacilityNetGainPerMinute(
  valuePerMinute: number,
  decayCostPerMinute: number,
  staffWagePerMinute = 0,
): number {
  return valuePerMinute
    - Math.max(0, decayCostPerMinute)
    - Math.max(0, staffWagePerMinute);
}

/** Combines a recipe's current contribution margin with facility decay and staff wages. */
export function calculateFacilityProductionEconomics(
  recipe: Recipe,
  market: Market,
  outputMultiplier: number,
  effectiveWorkPerMinute: number,
  decayCostPerMinute: number,
  staffWagePerMinute: number,
  getInputQuality?: (resourceType: ResourceType) => number,
  getOutputQuality?: (resourceType: ResourceType) => number,
  sizeMultiplier = 1,
  inputPlan?: RecipeInputPlan,
  inputEffects?: Required<RecipeInputEffects>,
): { netGainPerMinute: number; valuePerMinute: number } {
  const valuePerMinute = calculateRecipeValuePerMinute(
    recipe,
    market,
    outputMultiplier,
    effectiveWorkPerMinute,
    getInputQuality,
    getOutputQuality,
    sizeMultiplier,
    inputPlan,
    inputEffects,
  );

  return {
    valuePerMinute,
    netGainPerMinute: calculateFacilityNetGainPerMinute(valuePerMinute, decayCostPerMinute, staffWagePerMinute),
  };
}

/** Resolves an active facility recipe's current work, quality, upkeep, and economics. */
export function calculateCurrentFacilityProductionEconomics(
  facility: FacilityView,
  recipe: Recipe,
  market: Market,
  inventory: Inventory,
  recipeResearchWorkSpeedMultiplier: number,
  getResearchMaxQ: (resourceType: ResourceType) => number,
  getProductionMaxQ: (resourceType: ResourceType) => number,
): {
  availableInputPlan: RecipeInputPlan;
  decayCostPerMinute: number;
  effectiveWorkPerMinute: number;
  getOutputQuality: (resourceType: ResourceType) => number;
  inputQ: number | null;
  netGainPerMinute: number;
  staffWagePerMinute: number;
  valuePerMinute: number;
} {
  const definition = getFacilityDefinition(facility.facilityType);
  const optionalInputSettings = facility.optionalInputSettings[recipe.name];
  const availableInputPlan = getFacilityAvailableRecipeInputPlan(recipe, inventory, facility.sizeMultiplier, optionalInputSettings);
  const isActiveRecipe = recipe.name === facility.activeRecipeName;
  const inputQ = isActiveRecipe && facility.recipeInputQ !== null
    ? facility.recipeInputQ
    : calculateRecipeInputQ(recipe, inventory, facility.sizeMultiplier, optionalInputSettings);
  const capturedInputEffects = isActiveRecipe ? facility.recipeInputEffects : null;
  const effectiveWorkPerMinute = calculateFacilityEffectiveWork(facility, BASE_WORK_PER_MINUTE, recipeResearchWorkSpeedMultiplier);
  const decayCostPerMinute = calculateFacilityDecayCostPerMinute(
    definition.landCost * facility.sizeMultiplier,
    definition.constructionMaterialsCost * facility.sizeMultiplier,
    definition.industrialMachinesCost * facility.sizeMultiplier,
    facility.facilityCondition,
    facility.conditionDecayMultiplier * facility.overstaffingConditionDecayMultiplier,
    effectiveWorkPerMinute,
    recipe,
    market.getLocalPrice(ResourceType.ConstructionMaterials),
    market.getLocalPrice(ResourceType.IndustrialMachines),
    facility.sizeMultiplier,
  );
  const getOutputQuality = (resourceType: ResourceType): number => {
    const output = recipe.outputs.find((candidate) => candidate.resourceType === resourceType);
    if (!output) return 1;
    return calculateOutputQuality({
      researchMaxQ: getResearchMaxQ(resourceType),
      weightedInputQ: inputQ,
      upgradeMaxQ: facility.upgradeMaxQ,
      productionMaxQ: getProductionMaxQ(resourceType),
      staffMaxQ: facility.staffQuality,
      outputBonusQ: (output.outputBonusQ ?? 0) + (capturedInputEffects?.qualityBoost ?? availableInputPlan.effects.qualityBoost),
    }).outputQ;
  };
  const staffWagePerMinute = calculateFacilityStaffWagePerMinute(facility.assignedWorkers, facility.staffWagePerWorkerPerMinute);
  const economics = calculateFacilityProductionEconomics(recipe, market, facility.outputMultiplier, effectiveWorkPerMinute, decayCostPerMinute, staffWagePerMinute, (resourceType) => inventory.getQuality(resourceType), getOutputQuality, facility.sizeMultiplier, availableInputPlan);

  return {
    ...economics,
    availableInputPlan,
    decayCostPerMinute,
    effectiveWorkPerMinute,
    getOutputQuality,
    inputQ,
    staffWagePerMinute,
  };
}

/** Projects the euro cost of condition wear, including cash and both repair inputs. */
export function calculateFacilityDecayCostPerMinute(
  cashRepairBaseCost: number,
  constructionMaterialsCost: number,
  industrialMachinesCost: number,
  facilityCondition: number,
  conditionDecayMultiplier: number,
  effectiveWorkPerMinute: number,
  recipe: Recipe | null,
  constructionMaterialsPrice: number,
  industrialMachinesPrice: number,
  sizeMultiplier = 1,
): number {
  const condition = clamp(facilityCondition, 0, 1);
  const productionConditionLossPerMinute = recipe && recipe.requiredWork > 0
    ? Math.max(0, effectiveWorkPerMinute) / (recipe.requiredWork * Math.max(1, sizeMultiplier)) * getRecipeProductionConditionLoss(recipe)
    : 0;
  const conditionLossPerMinute = (
    FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE + productionConditionLossPerMinute
  ) * calculateAsymmetricalScaler01(condition) * conditionDecayMultiplier;

  return Math.max(0, conditionLossPerMinute) * FACILITY_REPAIR_MATERIAL_COST_RATE * (
    Math.max(0, cashRepairBaseCost)
    + Math.max(0, constructionMaterialsCost) * Math.max(0, constructionMaterialsPrice)
    + Math.max(0, industrialMachinesCost) * Math.max(0, industrialMachinesPrice)
  );
}

/** Estimates only the maintenance burden caused by completing one production cycle. */
export function calculateFacilityProductionMaintenanceCost(
  facility: FacilityView,
  recipe: Recipe,
  market: Market,
): number {
  const definition = getFacilityDefinition(facility.facilityType);
  const sizeMultiplier = facility.sizeMultiplier;
  const productionConditionLoss = getRecipeProductionConditionLoss(recipe)
    * calculateAsymmetricalScaler01(clamp(facility.facilityCondition, 0, 1))
    * getConditionDecayMultiplier(facility.conditionDecayUpgradeLevel)
    * getOverstaffingConditionDecayMultiplier(facility.assignedWorkers, facility.requiredWorkers);

  return Math.max(0, productionConditionLoss) * FACILITY_REPAIR_MATERIAL_COST_RATE * (
    definition.landCost * sizeMultiplier
    + definition.constructionMaterialsCost * sizeMultiplier * market.getLocalPrice(ResourceType.ConstructionMaterials)
    + definition.industrialMachinesCost * sizeMultiplier * market.getLocalPrice(ResourceType.IndustrialMachines)
  );
}

/** Recurring wage expense for the currently assigned facility staff. */
export function calculateFacilityStaffWagePerMinute(assignedWorkers: number, wagePerWorkerPerMinute: number): number {
  return Math.max(0, assignedWorkers) * Math.max(0, wagePerWorkerPerMinute);
}

/** Current market value of one completed recipe cycle's outputs. */
export function calculateRecipeOutputValue(
  recipe: Recipe,
  market: Market,
  outputMultiplier: number,
  getOutputQuality?: (resourceType: ResourceType) => number,
  sizeMultiplier = 1,
): number {
  const multiplier = Math.max(1, sizeMultiplier);
  return recipe.outputs.reduce(
    (total, output) => total + output.amount * multiplier * outputMultiplier * (getOutputQuality
      ? market.getLocalSalePrice(output.resourceType, getOutputQuality(output.resourceType))
      : market.getLocalPrice(output.resourceType)),
    0,
  );
}

/** Historical direct-material cost of one recipe cycle, captured at input consumption when available. */
export function calculateRecipeDirectInputCost(
  recipe: Recipe,
  inventory: Inventory,
  capturedInputCost: number | null = null,
  sizeMultiplier = 1,
): number {
  return capturedInputCost ?? calculateRecipeInputSourceCost(recipe, inventory, sizeMultiplier);
}

/** Contribution margin for one completed recipe cycle before facility overhead. */
export function calculateRecipeContributionMargin(
  recipe: Recipe,
  market: Market,
  inventory: Inventory,
  outputMultiplier: number,
  getOutputQuality?: (resourceType: ResourceType) => number,
  capturedInputCost: number | null = null,
  sizeMultiplier = 1,
): number {
  return calculateRecipeOutputValue(recipe, market, outputMultiplier, getOutputQuality, sizeMultiplier)
    - calculateRecipeDirectInputCost(recipe, inventory, capturedInputCost, sizeMultiplier);
}

/** Projects the recurring economics at a selected post-repair condition without mutating the live facility. */
export function calculateProjectedFacilityConditionEconomics(
  facility: Facility,
  targetCondition: number,
  recipe: Recipe,
  market: Market,
  recipeResearchWorkSpeedMultiplier: number,
  getInputQuality?: (resourceType: ResourceType) => number,
  getOutputQuality?: (resourceType: ResourceType) => number,
): { decayMaterialCostPerMinute: number; decayCostPerMinute: number; netGainPerMinute: number; valuePerMinute: number } {
  const facilityView = facility.getView();
  const projectedCondition = Math.max(facilityView.facilityCondition, clamp(targetCondition, 0, 1));
  const conditionEfficiency = getFacilityConditionEfficiency(projectedCondition);
  const projectedView = {
    ...facilityView,
    facilityCondition: projectedCondition,
    conditionEfficiency,
    facilityEfficiency: facilityView.staffingEfficiency * conditionEfficiency,
  };
  const definition = getFacilityDefinition(projectedView.facilityType);
  const effectiveWorkPerMinute = calculateFacilityEffectiveWork(
    projectedView,
    BASE_WORK_PER_MINUTE,
    recipeResearchWorkSpeedMultiplier,
  );
  const valuePerMinute = calculateRecipeValuePerMinute(
    recipe,
    market,
    projectedView.outputMultiplier,
    effectiveWorkPerMinute,
    getInputQuality,
    getOutputQuality,
    projectedView.sizeMultiplier,
  );
  const decayMaterialCostPerMinute = calculateFacilityDecayMaterialCostPerMinute(
    definition.constructionMaterialsCost * projectedView.sizeMultiplier,
    projectedView.facilityCondition,
    projectedView.conditionDecayMultiplier * projectedView.overstaffingConditionDecayMultiplier,
    effectiveWorkPerMinute,
    recipe,
    projectedView.sizeMultiplier,
  );
  const decayCostPerMinute = calculateFacilityDecayCostPerMinute(
    definition.landCost * projectedView.sizeMultiplier,
    definition.constructionMaterialsCost * projectedView.sizeMultiplier,
    definition.industrialMachinesCost * projectedView.sizeMultiplier,
    projectedView.facilityCondition,
    projectedView.conditionDecayMultiplier * projectedView.overstaffingConditionDecayMultiplier,
    effectiveWorkPerMinute,
    recipe,
    market.getLocalPrice(ResourceType.ConstructionMaterials),
    market.getLocalPrice(ResourceType.IndustrialMachines),
    projectedView.sizeMultiplier,
  );

  return {
    decayMaterialCostPerMinute,
    decayCostPerMinute,
    netGainPerMinute: valuePerMinute
      - decayCostPerMinute
      - calculateFacilityStaffWagePerMinute(projectedView.assignedWorkers, projectedView.staffWagePerWorkerPerMinute),
    valuePerMinute,
  };
}

/** Projects the incremental market value per minute from one facility quality upgrade. */
export function calculateProjectedFacilityQualityUpgradeNetGainPerMinute(
  facility: Facility,
  recipe: Recipe,
  market: Market,
  recipeResearchWorkSpeedMultiplier: number,
  researchMaxQForResource: (resourceType: ResourceType) => number,
  weightedInputQ: number | null,
  productionMaxQForResource: (resourceType: ResourceType) => number = () => Number.POSITIVE_INFINITY,
  staffMaxQ = Number.POSITIVE_INFINITY,
  inputEffects?: Required<RecipeInputEffects>,
): number {
  const view = facility.getView();
  const currentLimit = view.upgradeMaxQ;
  const nextLimit = calculateUpgradeMaxQ(view.qualityUpgradeLevel + 1);
  const effectiveWorkPerMinute = calculateFacilityEffectiveWork(view, BASE_WORK_PER_MINUTE, recipeResearchWorkSpeedMultiplier);
  if (recipe.requiredWork <= 0 || effectiveWorkPerMinute <= 0) return 0;

  return recipe.outputs.reduce((total, output) => {
    const productionMaxQ = productionMaxQForResource(output.resourceType);
    const currentQuality = calculateOutputQuality({ researchMaxQ: researchMaxQForResource(output.resourceType), weightedInputQ, upgradeMaxQ: currentLimit, productionMaxQ, staffMaxQ, outputBonusQ: (output.outputBonusQ ?? 0) + (inputEffects?.qualityBoost ?? 0) }).outputQ;
    const nextQuality = calculateOutputQuality({ researchMaxQ: researchMaxQForResource(output.resourceType), weightedInputQ, upgradeMaxQ: nextLimit, productionMaxQ, staffMaxQ, outputBonusQ: (output.outputBonusQ ?? 0) + (inputEffects?.qualityBoost ?? 0) }).outputQ;
    const unitsPerMinute = output.amount * view.sizeMultiplier * view.outputMultiplier * (inputEffects?.outputMultiplier ?? 1) * effectiveWorkPerMinute / (recipe.requiredWork * view.sizeMultiplier);
    return total + unitsPerMinute * (market.getLocalSalePrice(output.resourceType, nextQuality) - market.getLocalSalePrice(output.resourceType, currentQuality));
  }, 0);
}

/** Projects a single upgrade's recurring net gain without mutating the live facility. */
export function calculateProjectedFacilityUpgradeNetGainPerMinute(
  facility: Facility,
  recipe: Recipe,
  market: Market,
  recipeResearchWorkSpeedMultiplier: number,
  upgradeKind: FacilityUpgradeKind,
  getInputQuality?: (resourceType: ResourceType) => number,
  getOutputQuality?: (resourceType: ResourceType) => number,
): number {
  const projectedFacility = Facility.fromSnapshot(facility.toSnapshot());
  if (upgradeKind === 'speed') projectedFacility.upgradeSpeed();
  if (upgradeKind === 'output') projectedFacility.upgradeOutput();
  if (upgradeKind === 'condition') projectedFacility.upgradeConditionDecay();

  const projectedView = projectedFacility.getView();
  const definition = getFacilityDefinition(projectedView.facilityType);
  const projectedEffectiveWork = calculateFacilityEffectiveWork(
    projectedView,
    BASE_WORK_PER_MINUTE,
    recipeResearchWorkSpeedMultiplier,
  );
  const projectedValuePerMinute = calculateRecipeValuePerMinute(
    recipe,
    market,
    projectedView.outputMultiplier,
    projectedEffectiveWork,
    getInputQuality,
    getOutputQuality,
    projectedView.sizeMultiplier,
  );
  const projectedDecayCostPerMinute = calculateFacilityDecayCostPerMinute(
    definition.landCost * projectedView.sizeMultiplier,
    definition.constructionMaterialsCost * projectedView.sizeMultiplier,
    definition.industrialMachinesCost * projectedView.sizeMultiplier,
    projectedView.facilityCondition,
    projectedView.conditionDecayMultiplier * projectedView.overstaffingConditionDecayMultiplier,
    projectedEffectiveWork,
    recipe,
    market.getLocalPrice(ResourceType.ConstructionMaterials),
    market.getLocalPrice(ResourceType.IndustrialMachines),
    projectedView.sizeMultiplier,
  );

  return calculateFacilityNetGainPerMinute(
    projectedValuePerMinute,
    projectedDecayCostPerMinute,
    calculateFacilityStaffWagePerMinute(projectedView.assignedWorkers, projectedView.staffWagePerWorkerPerMinute),
  );
}
