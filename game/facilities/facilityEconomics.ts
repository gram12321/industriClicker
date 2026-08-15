import { calculateAsymmetricalScaler01 } from '@/game/core/math';
import { BASE_WORK_PER_MINUTE } from '@/game/core/time';
import type { Finance } from '@/game/finance';
import type { Inventory } from '@/game/inventory';
import type { Market } from '@/game/market';
import type { Recipe } from '@/game/recipes';
import { ResourceType } from '@/game/resources';
import { Facility } from './facility';
import {
  FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE,
  FACILITY_REPAIR_MATERIAL_COST_RATE,
  getFacilityDefinition,
} from './facilityConstants';
import { calculateFacilityEffectiveWork, getRecipeProductionConditionLoss } from './facilityProduction';
import type { FacilityUpgradeKind } from './facilityUpgrades';

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
  const missingInputPurchaseCost =
    missingConstructionMaterials * market.getLocalPrice(ResourceType.ConstructionMaterials)
    + missingIndustrialMachines * market.getLocalPrice(ResourceType.IndustrialMachines);
  const cashCost = cashBaseCost + missingInputPurchaseCost;

  return {
    canAfford:
      market.getLocalEntry(ResourceType.ConstructionMaterials).supply >= missingConstructionMaterials
      && market.getLocalEntry(ResourceType.IndustrialMachines).supply >= missingIndustrialMachines
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
): number {
  if (recipe.requiredWork <= 0) return 0;

  const cyclesPerMinute = workPerMinute / recipe.requiredWork;
  const outputValue = recipe.outputs.reduce(
    (total, output) => total + output.amount * outputMultiplier * market.getLocalPrice(output.resourceType),
    0,
  );
  const inputValue = recipe.inputs.reduce(
    (total, input) => total + input.amount * market.getLocalPrice(input.resourceType),
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
): number {
  return valuePerMinute
    - decayMaterialCostPerMinute * market.getLocalPrice(ResourceType.ConstructionMaterials);
}

/** Projects a single upgrade's recurring net gain without mutating the live facility. */
export function calculateProjectedFacilityUpgradeNetGainPerMinute(
  facility: Facility,
  recipe: Recipe,
  market: Market,
  recipeResearchWorkSpeedMultiplier: number,
  upgradeKind: FacilityUpgradeKind,
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
  );
}
