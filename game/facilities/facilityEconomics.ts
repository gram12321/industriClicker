import { calculateAsymmetricalScaler01 } from '@/game/core/math';
import { BASE_WORK_PER_MINUTE } from '@/game/core/time';
import type { Finance } from '@/game/finance';
import type { Inventory } from '@/game/inventory';
import type { Market } from '@/game/market';
import type { Recipe } from '@/game/recipes';
import { ResourceType } from '@/game/resources';
import { calculateOutputQuality, calculateUpgradeMaxQ } from '@/game/quality';
import { Facility, type FacilityView } from './facility';
import {
  FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE,
  FACILITY_REPAIR_MATERIAL_COST_RATE,
  getFacilityDefinition,
} from './facilityConstants';
import { calculateFacilityEffectiveWork, calculateRecipeInputSourceCost, getRecipeProductionConditionLoss } from './facilityProduction';
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
): number {
  if (recipe.requiredWork <= 0) return 0;

  const cyclesPerMinute = workPerMinute / recipe.requiredWork;
  const outputValue = recipe.outputs.reduce(
    (total, output) => total + output.amount * outputMultiplier * (getOutputQuality
      ? market.getLocalSalePrice(output.resourceType, getOutputQuality(output.resourceType))
      : market.getLocalPrice(output.resourceType)),
    0,
  );
  const inputValue = recipe.inputs.reduce(
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
): number {
  const condition = clamp(facilityCondition, 0, 1);
  const productionConditionLossPerMinute = recipe && recipe.requiredWork > 0
    ? Math.max(0, effectiveWorkPerMinute) / recipe.requiredWork * getRecipeProductionConditionLoss(recipe)
    : 0;
  const conditionLossPerMinute = (
    FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE + productionConditionLossPerMinute
  ) * calculateAsymmetricalScaler01(condition) * conditionDecayMultiplier;

  return Math.max(0, constructionMaterialsCost)
    * FACILITY_REPAIR_MATERIAL_COST_RATE
    * conditionLossPerMinute;
}

/** Calculates profit after the material cost of maintaining the facility's condition. */
export function calculateFacilityNetGainPerMinute(
  valuePerMinute: number,
  decayMaterialCostPerMinute: number,
  market: Market,
  staffWagePerMinute = 0,
): number {
  return valuePerMinute
    - decayMaterialCostPerMinute * market.getLocalPrice(ResourceType.ConstructionMaterials)
    - Math.max(0, staffWagePerMinute);
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
): number {
  const condition = clamp(facilityCondition, 0, 1);
  const productionConditionLossPerMinute = recipe && recipe.requiredWork > 0
    ? Math.max(0, effectiveWorkPerMinute) / recipe.requiredWork * getRecipeProductionConditionLoss(recipe)
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
  const productionConditionLoss = getRecipeProductionConditionLoss(recipe)
    * calculateAsymmetricalScaler01(clamp(facility.facilityCondition, 0, 1))
    * getConditionDecayMultiplier(facility.conditionDecayUpgradeLevel)
    * getOverstaffingConditionDecayMultiplier(facility.assignedWorkers, facility.requiredWorkers);

  return Math.max(0, productionConditionLoss) * FACILITY_REPAIR_MATERIAL_COST_RATE * (
    definition.landCost
    + definition.constructionMaterialsCost * market.getLocalPrice(ResourceType.ConstructionMaterials)
    + definition.industrialMachinesCost * market.getLocalPrice(ResourceType.IndustrialMachines)
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
): number {
  return recipe.outputs.reduce(
    (total, output) => total + output.amount * outputMultiplier * (getOutputQuality
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
): number {
  return capturedInputCost ?? calculateRecipeInputSourceCost(recipe, inventory);
}

/** Contribution margin for one completed recipe cycle before facility overhead. */
export function calculateRecipeContributionMargin(
  recipe: Recipe,
  market: Market,
  inventory: Inventory,
  outputMultiplier: number,
  getOutputQuality?: (resourceType: ResourceType) => number,
  capturedInputCost: number | null = null,
): number {
  return calculateRecipeOutputValue(recipe, market, outputMultiplier, getOutputQuality)
    - calculateRecipeDirectInputCost(recipe, inventory, capturedInputCost);
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
  );
  const decayMaterialCostPerMinute = calculateFacilityDecayMaterialCostPerMinute(
    definition.constructionMaterialsCost,
    projectedView.facilityCondition,
    projectedView.conditionDecayMultiplier * projectedView.overstaffingConditionDecayMultiplier,
    effectiveWorkPerMinute,
    recipe,
  );
  const decayCostPerMinute = calculateFacilityDecayCostPerMinute(
    definition.landCost,
    definition.constructionMaterialsCost,
    definition.industrialMachinesCost,
    projectedView.facilityCondition,
    projectedView.conditionDecayMultiplier * projectedView.overstaffingConditionDecayMultiplier,
    effectiveWorkPerMinute,
    recipe,
    market.getLocalPrice(ResourceType.ConstructionMaterials),
    market.getLocalPrice(ResourceType.IndustrialMachines),
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
): number {
  const view = facility.getView();
  const currentLimit = view.upgradeMaxQ;
  const nextLimit = calculateUpgradeMaxQ(view.qualityUpgradeLevel + 1);
  const effectiveWorkPerMinute = calculateFacilityEffectiveWork(view, BASE_WORK_PER_MINUTE, recipeResearchWorkSpeedMultiplier);
  if (recipe.requiredWork <= 0 || effectiveWorkPerMinute <= 0) return 0;

  return recipe.outputs.reduce((total, output) => {
    const productionMaxQ = productionMaxQForResource(output.resourceType);
    const currentQuality = calculateOutputQuality({ researchMaxQ: researchMaxQForResource(output.resourceType), weightedInputQ, upgradeMaxQ: currentLimit, productionMaxQ }).outputQ;
    const nextQuality = calculateOutputQuality({ researchMaxQ: researchMaxQForResource(output.resourceType), weightedInputQ, upgradeMaxQ: nextLimit, productionMaxQ }).outputQ;
    const unitsPerMinute = output.amount * view.outputMultiplier * effectiveWorkPerMinute / recipe.requiredWork;
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
  );
  const projectedDecayCostPerMinute = calculateFacilityDecayMaterialCostPerMinute(
    definition.constructionMaterialsCost,
    projectedView.facilityCondition,
    projectedView.conditionDecayMultiplier * projectedView.overstaffingConditionDecayMultiplier,
    projectedEffectiveWork,
    recipe,
  );

  return calculateFacilityNetGainPerMinute(
    projectedValuePerMinute,
    projectedDecayCostPerMinute,
    market,
    calculateFacilityStaffWagePerMinute(projectedView.assignedWorkers, projectedView.staffWagePerWorkerPerMinute),
  );
}
