import { Inventory } from '@/game/inventory';
import { MARKET_DIFFUSION_INTERVAL_MS, Market } from '@/game/market';
import { getRecipe, type RecipeName } from '@/game/recipes';
import { getLocalMarketDepthMultiplier, getLocalRegionalDiffusionMultiplier, getRecipeResearchProjectId, getResearchProject } from '@/game/research';
import { ResourceType } from '@/game/resources';
import { FACILITIES, FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE, FACILITY_PRODUCTION_ORDER } from '@/game/facilities/facilityConstants';
import type { Facility } from '@/game/facilities/facility';
import { FacilityCollection } from '@/game/facilities/facilityCollection';
import { advanceAllFacilityProduction, calculateFacilityEffectiveWork, getRecipeProductionConditionLoss, type ProductionOutput } from '@/game/facilities/facilityProduction';
import type { FacilityType } from '@/game/facilities/facilityTypes';
import { getFacilityRepairCost, getFacilityUpgradeCost, getFacilityUpgradeResourceInvestmentCost } from '@/game/facilities/facilityUpgrades';

const BASE_WORK_PER_MINUTE = 1;
const WORK_COMPLETION_EPSILON = 1e-9;

/** Standard windows used by recipe-balance tests and reports. */
export const RECIPE_ECONOMY_SHORT_WINDOW_MINUTES = 15;
export const RECIPE_ECONOMY_LONG_WINDOW_MINUTES = 60;
export const RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES = 180;
export const RECIPE_ECONOMY_BREAK_EVEN_HORIZON_MINUTES = 4 * 60;
export const RECIPE_ECONOMY_REPAIR_THRESHOLD = 0.7;

export type RecipeEconomyScenario = {
  recipeName: RecipeName;
  durationMinutes: number;
  speedUpgradeLevel?: number;
  outputUpgradeLevel?: number;
  /** Completed market research applied before the facility begins production. */
  completedResearchProjectIds?: readonly string[];
};

export type RecipeEconomyResult = {
  recipeName: RecipeName;
  durationMinutes: number;
  initialNetMarginPerMinute: number;
  netMarginPerMinute: number;
  totalRevenue: number;
  totalInputCost: number;
  totalMaintenanceCost: number;
  facilityInvestmentCost: number;
  upgradeInvestmentCost: number;
  paybackMinute: number | null;
  initialOutputUnitPrice: number;
  finalOutputUnitPrice: number;
  averageCondition: number;
  repairCount: number;
  breakEvenMinute: number | null;
  stalledMinutes: number;
};

/** One or more identical fully staffed facilities running the selected recipe. */
export type RecipeEconomyChainFacility = {
  recipeName: RecipeName;
  count?: number;
};

export type RecipeEconomyChainScenario = {
  facilities: readonly RecipeEconomyChainFacility[];
  durationMinutes: number;
  /** Resources sold after all same-minute chain production has consumed its inputs. */
  sellResourceTypes: readonly ResourceType[];
  completedResearchProjectIds?: readonly string[];
  /**
   * Consumes the construction inputs needed to build all participating
   * facilities evenly across the scenario. This is an external construction
   * demand floor, not a player expense.
   */
  includeConstructionInputsDemand?: boolean;
};

export type RecipeEconomyChainResult = {
  durationMinutes: number;
  totalRevenue: number;
  totalInputCost: number;
  totalMaintenanceCost: number;
  facilityInvestmentCost: number;
  recipeResearchInvestmentCost: number;
  netMarginPerMinute: number;
  paybackMinute: number | null;
  constructionMaterialsDemand: number;
  fulfilledConstructionMaterialsDemand: number;
  industrialMachinesDemand: number;
  fulfilledIndustrialMachinesDemand: number;
  finalSoldUnitPrices: Partial<Record<ResourceType, number>>;
  stalledFacilityMinutes: number;
};

/** Test-only single-facility advance used to interleave chain market purchases. */
function advanceFacilityProduction(
  facility: Facility,
  inventory: Inventory,
): ProductionOutput[] {
  const facilityView = facility.getView();
  const recipeName = facilityView.activeRecipeName;
  if (!facilityView.isActive || !recipeName) return [];

  const recipe = getRecipe(recipeName);
  let remainingEffectiveWork = calculateFacilityEffectiveWork(facilityView, BASE_WORK_PER_MINUTE);
  if (!Number.isFinite(remainingEffectiveWork) || remainingEffectiveWork <= 0) return [];
  let progress = facilityView.recipeProgress[recipe.name] ?? 0;
  const outputs: ProductionOutput[] = [];

  while (remainingEffectiveWork > 0) {
    if (progress === 0 && !recipe.inputs.every((input) => inventory.has(input.resourceType, input.amount))) break;
    if (progress === 0) {
      for (const input of recipe.inputs) inventory.remove(input.resourceType, input.amount);
    }

    const appliedWork = Math.min(remainingEffectiveWork, recipe.requiredWork - progress);
    progress += appliedWork;
    remainingEffectiveWork -= appliedWork;
    if (progress + WORK_COMPLETION_EPSILON >= recipe.requiredWork) {
      for (const output of recipe.outputs) {
        const amount = output.amount * facilityView.outputMultiplier;
        inventory.add(output.resourceType, amount);
        outputs.push({ facilityType: facilityView.facilityType, recipeName: recipe.name, resourceType: output.resourceType, amount });
      }
      facility.applyConditionLoss(getRecipeProductionConditionLoss(recipe));
      progress = 0;
    }
  }

  facility.setRecipeProgress(recipe.name, progress);
  return outputs;
}

/**
 * Simulates one fully staffed facility buying recipe inputs and selling its
 * output on the local market once per foreground minute while applying normal
 * five-second market diffusion. Initial margin uses
 * a full-cycle initial-market rate, so recipes longer than one minute are not
 * penalized for buying their inputs before their first completed cycle.
 * Maintenance is charged as realised repair spend plus the outstanding repair
 * liability.
 */
export function simulateRecipeEconomy({ recipeName, durationMinutes, speedUpgradeLevel = 0, outputUpgradeLevel = 0, completedResearchProjectIds = [] }: RecipeEconomyScenario): RecipeEconomyResult {
  const recipe = getRecipe(recipeName);
  const facilityType = getRecipeFacilityType(recipeName);
  const definition = FACILITIES[facilityType];
  const facilities = new FacilityCollection();
  facilities.build(facilityType);
  const facility = facilities.getAllByType(facilityType)[0]!;
  const inventory = new Inventory();
  const market = new Market();
  market.setLocalMarketDepthMultiplier(getLocalMarketDepthMultiplier(completedResearchProjectIds));
  market.setLocalRegionalDiffusionMultiplier(getLocalRegionalDiffusionMultiplier(completedResearchProjectIds));
  const minutes = Math.max(1, Math.floor(durationMinutes));
  let totalRevenue = 0;
  let totalInputCost = 0;
  let repairSpend = 0;
  let totalCondition = 0;
  let repairCount = 0;
  let breakEvenMinute: number | null = null;
  let stalledMinutes = 0;
  const initialOutputUnitPrice = market.getLocalPrice(recipe.outputs[0].resourceType);
  let outstandingMaintenanceCost = 0;
  const facilityInvestmentCost = definition.landCost
    + definition.constructionMaterialsCost * market.getLocalPrice(ResourceType.ConstructionMaterials)
    + definition.industrialMachinesCost * market.getLocalPrice(ResourceType.IndustrialMachines);
  const upgradeInvestmentCost = getUpgradeInvestmentCost(definition.upgradeCost, speedUpgradeLevel)
    + getUpgradeInvestmentCost(definition.upgradeCost, outputUpgradeLevel)
    + (getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, speedUpgradeLevel)
      + getFacilityUpgradeResourceInvestmentCost(definition.constructionMaterialsCost, outputUpgradeLevel)) * market.getLocalPrice(ResourceType.ConstructionMaterials)
    + (getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, speedUpgradeLevel)
      + getFacilityUpgradeResourceInvestmentCost(definition.industrialMachinesCost, outputUpgradeLevel)) * market.getLocalPrice(ResourceType.IndustrialMachines);
  const totalInvestmentCost = facilityInvestmentCost + upgradeInvestmentCost;
  let cumulativeNetProfit = 0;
  let paybackMinute: number | null = null;

  facility.setActiveRecipe(recipeName);
  for (let level = 0; level < Math.max(0, Math.floor(speedUpgradeLevel)); level += 1) facility.upgradeSpeed();
  for (let level = 0; level < Math.max(0, Math.floor(outputUpgradeLevel)); level += 1) facility.upgradeOutput();
  facility.setAssignedWorkers(facility.getView().requiredWorkers);
  const initialView = facility.getView();
  const initialCyclesPerMinute = calculateFacilityEffectiveWork(initialView, BASE_WORK_PER_MINUTE) / recipe.requiredWork;
  const initialRevenuePerMinute = initialCyclesPerMinute * recipe.outputs
    .reduce((total, output) => total + output.amount * initialView.outputMultiplier * market.getLocalPrice(output.resourceType), 0);
  const initialInputCostPerMinute = initialCyclesPerMinute * recipe.inputs
    .reduce((total, input) => total + input.amount * market.getLocalPrice(input.resourceType), 0);
  const initialMaintenancePerMinute = (
    FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE + initialCyclesPerMinute * getRecipeProductionConditionLoss(recipe)
  ) * definition.constructionMaterialsCost * 0.9 * market.getLocalPrice(ResourceType.ConstructionMaterials);
  const initialNetMarginPerMinute = initialRevenuePerMinute - initialInputCostPerMinute - initialMaintenancePerMinute;
  let cycleOperatingMargin = 0;

  for (let minute = 1; minute <= minutes; minute += 1) {
    const revenueBefore = totalRevenue;
    const inputCostBefore = totalInputCost;
    const repairSpendBefore = repairSpend;
    const maintenanceBefore = outstandingMaintenanceCost;

    facilities.applyPassiveConditionLoss(FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE);
    const view = facility.getView();
    const work = calculateFacilityEffectiveWork(view, BASE_WORK_PER_MINUTE);
    const progress = view.recipeProgress[recipeName] ?? 0;
    const cyclesToStart = Math.max(0, Math.ceil((progress + work - WORK_COMPLETION_EPSILON) / recipe.requiredWork) - (progress > 0 ? 1 : 0));
    let canProduce = true;

    for (const input of recipe.inputs) {
      const amount = Math.max(0, input.amount * cyclesToStart - inventory.getAmount(input.resourceType));
      if (amount <= 0) continue;
      const trade = market.buyFromLocal(input.resourceType, amount);
      if (!trade.success) {
        canProduce = false;
        break;
      }
      totalInputCost += trade.amount * trade.unitPrice;
      inventory.add(input.resourceType, trade.amount, trade.quality);
    }

    let completedOutput = false;
    if (canProduce) {
      const outputs = advanceAllFacilityProduction(
        facilities,
        inventory,
        (facilityView) => calculateFacilityEffectiveWork(facilityView, BASE_WORK_PER_MINUTE),
      );
      for (const output of outputs) {
        const trade = market.sellToLocal(output.resourceType, output.amount, inventory.getQuality(output.resourceType));
        if (!trade.success) continue;
        inventory.remove(output.resourceType, output.amount);
        totalRevenue += trade.amount * trade.unitPrice;
        completedOutput = true;
      }
    } else {
      stalledMinutes += 1;
    }

    if (facility.getView().facilityCondition <= RECIPE_ECONOMY_REPAIR_THRESHOLD) {
      const repairCashCost = getFacilityRepairCost(definition.landCost, facility.getView().facilityCondition);
      const materialAmount = getFacilityRepairCost(definition.constructionMaterialsCost, facility.getView().facilityCondition);
      const industrialMachinesAmount = getFacilityRepairCost(definition.industrialMachinesCost, facility.getView().facilityCondition);
      const materialTrade = market.buyFromLocal(ResourceType.ConstructionMaterials, materialAmount);
      const industrialMachinesTrade = market.buyFromLocal(ResourceType.IndustrialMachines, industrialMachinesAmount);
      if (materialTrade.success && industrialMachinesTrade.success && facility.repairCondition()) {
        repairSpend += repairCashCost + materialTrade.amount * materialTrade.unitPrice + industrialMachinesTrade.amount * industrialMachinesTrade.unitPrice;
        repairCount += 1;
      }
    }

    outstandingMaintenanceCost = getFacilityRepairCost(definition.landCost, facility.getView().facilityCondition)
      + getFacilityRepairCost(definition.constructionMaterialsCost, facility.getView().facilityCondition) * market.getLocalPrice(ResourceType.ConstructionMaterials)
      + getFacilityRepairCost(definition.industrialMachinesCost, facility.getView().facilityCondition) * market.getLocalPrice(ResourceType.IndustrialMachines);
    const minuteMaintenanceCost = repairSpend - repairSpendBefore + outstandingMaintenanceCost - maintenanceBefore;
    const minuteNetMargin = totalRevenue - revenueBefore - (totalInputCost - inputCostBefore) - minuteMaintenanceCost;
    cycleOperatingMargin += minuteNetMargin;
    if (completedOutput) {
      if (breakEvenMinute === null && cycleOperatingMargin <= 0) breakEvenMinute = minute;
      cycleOperatingMargin = 0;
    }
    cumulativeNetProfit += minuteNetMargin;
    if (paybackMinute === null && cumulativeNetProfit >= totalInvestmentCost) paybackMinute = minute;
    totalCondition += facility.getView().facilityCondition;
    for (let interval = 0; interval < 60_000 / MARKET_DIFFUSION_INTERVAL_MS; interval += 1) {
      market.diffuse(MARKET_DIFFUSION_INTERVAL_MS);
    }
  }

  const totalMaintenanceCost = repairSpend + outstandingMaintenanceCost;
  return {
    recipeName,
    durationMinutes: minutes,
    initialNetMarginPerMinute,
    netMarginPerMinute: (totalRevenue - totalInputCost - totalMaintenanceCost) / minutes,
    totalRevenue,
    totalInputCost,
    totalMaintenanceCost,
    facilityInvestmentCost,
    upgradeInvestmentCost,
    paybackMinute,
    initialOutputUnitPrice,
    finalOutputUnitPrice: market.getLocalPrice(recipe.outputs[0].resourceType),
    averageCondition: totalCondition / minutes,
    repairCount,
    breakEvenMinute,
    stalledMinutes,
  };
}

/**
 * Simulates a connected production chain in one shared local market. Facilities
 * run in normal production order, so an upstream output can supply a downstream
 * facility during the same minute before only designated final goods are sold.
 */
export function simulateRecipeEconomyChain({
  facilities: chainFacilities,
  durationMinutes,
  sellResourceTypes,
  completedResearchProjectIds = [],
  includeConstructionInputsDemand = false,
}: RecipeEconomyChainScenario): RecipeEconomyChainResult {
  const minutes = Math.max(1, Math.floor(durationMinutes));
  const facilities = new FacilityCollection();
  const inventory = new Inventory();
  const market = new Market();
  market.setLocalMarketDepthMultiplier(getLocalMarketDepthMultiplier(completedResearchProjectIds));
  market.setLocalRegionalDiffusionMultiplier(getLocalRegionalDiffusionMultiplier(completedResearchProjectIds));
  const sellableResources = new Set(sellResourceTypes);
  const activeFacilities: Facility[] = [];
  let facilityInvestmentCost = 0;
  const researchedRecipes = new Set<RecipeName>();
  let recipeResearchInvestmentCost = 0;
  let constructionMaterialsDemand = 0;
  let industrialMachinesDemand = 0;

  for (const chainFacility of chainFacilities) {
    const count = Math.max(0, Math.floor(chainFacility.count ?? 1));
    const facilityType = getRecipeFacilityType(chainFacility.recipeName);
    const definition = FACILITIES[facilityType];
    if (!researchedRecipes.has(chainFacility.recipeName)) {
      researchedRecipes.add(chainFacility.recipeName);
      recipeResearchInvestmentCost += getResearchProject(getRecipeResearchProjectId(chainFacility.recipeName))?.cost ?? 0;
    }
    for (let index = 0; index < count; index += 1) {
      facilities.build(facilityType);
      const facility = facilities.getAllByType(facilityType).at(-1)!;
      facility.setActiveRecipe(chainFacility.recipeName);
      facility.setAssignedWorkers(facility.getView().requiredWorkers);
      activeFacilities.push(facility);
      facilityInvestmentCost += definition.landCost
        + definition.constructionMaterialsCost * market.getLocalPrice(ResourceType.ConstructionMaterials)
        + definition.industrialMachinesCost * market.getLocalPrice(ResourceType.IndustrialMachines);
      constructionMaterialsDemand += definition.constructionMaterialsCost;
      industrialMachinesDemand += definition.industrialMachinesCost;
    }
  }

  let totalRevenue = 0;
  let totalInputCost = 0;
  let repairSpend = 0;
  let outstandingMaintenanceCost = 0;
  let fulfilledConstructionMaterialsDemand = 0;
  let fulfilledIndustrialMachinesDemand = 0;
  let cumulativeNetProfit = 0;
  let paybackMinute: number | null = null;
  let stalledFacilityMinutes = 0;
  const finalSoldUnitPrices: Partial<Record<ResourceType, number>> = {};

  for (let minute = 1; minute <= minutes; minute += 1) {
    const revenueBefore = totalRevenue;
    const inputCostBefore = totalInputCost;
    const repairSpendBefore = repairSpend;
    const maintenanceBefore = outstandingMaintenanceCost;
    facilities.applyPassiveConditionLoss(FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE);
    const outputs: ProductionOutput[] = [];

    for (const facilityType of FACILITY_PRODUCTION_ORDER) {
      for (const facility of facilities.getAllByType(facilityType)) {
        const recipeName = facility.getView().activeRecipeName;
        if (!recipeName) continue;
        const recipe = getRecipe(recipeName);
        const work = calculateFacilityEffectiveWork(facility.getView(), BASE_WORK_PER_MINUTE);
        const progress = facility.getView().recipeProgress[recipeName] ?? 0;
        const cyclesToStart = Math.max(0, Math.ceil((progress + work - WORK_COMPLETION_EPSILON) / recipe.requiredWork) - (progress > 0 ? 1 : 0));
        let canProduce = true;

        for (const input of recipe.inputs) {
          const amount = Math.max(0, input.amount * cyclesToStart - inventory.getAmount(input.resourceType));
          if (amount <= 0) continue;
          const trade = market.buyFromLocal(input.resourceType, amount);
          if (!trade.success) {
            canProduce = false;
            break;
          }
          totalInputCost += trade.amount * trade.unitPrice;
          inventory.add(input.resourceType, trade.amount, trade.quality);
        }

        if (!canProduce) {
          stalledFacilityMinutes += 1;
          continue;
        }
        outputs.push(...advanceFacilityProduction(facility, inventory));
      }
    }

    for (const output of outputs) {
      if (!sellableResources.has(output.resourceType)) continue;
      const trade = market.sellToLocal(output.resourceType, output.amount, inventory.getQuality(output.resourceType));
      if (!trade.success) continue;
      inventory.remove(output.resourceType, output.amount);
      totalRevenue += trade.amount * trade.unitPrice;
      finalSoldUnitPrices[output.resourceType] = trade.unitPrice;
    }

    if (includeConstructionInputsDemand && constructionMaterialsDemand > 0) {
      const targetDemand = constructionMaterialsDemand * minute / minutes;
      const requestedAmount = targetDemand - fulfilledConstructionMaterialsDemand;
      const trade = market.buyFromLocal(ResourceType.ConstructionMaterials, requestedAmount);
      if (trade.success) fulfilledConstructionMaterialsDemand += trade.amount;
    }
    if (includeConstructionInputsDemand && industrialMachinesDemand > 0) {
      const targetDemand = industrialMachinesDemand * minute / minutes;
      const requestedAmount = targetDemand - fulfilledIndustrialMachinesDemand;
      const trade = market.buyFromLocal(ResourceType.IndustrialMachines, requestedAmount);
      if (trade.success) fulfilledIndustrialMachinesDemand += trade.amount;
    }

    for (const facility of activeFacilities) {
      const definition = FACILITIES[facility.facilityType];
      if (facility.getView().facilityCondition > RECIPE_ECONOMY_REPAIR_THRESHOLD) continue;
      const repairCashCost = getFacilityRepairCost(definition.landCost, facility.getView().facilityCondition);
      const materialAmount = getFacilityRepairCost(definition.constructionMaterialsCost, facility.getView().facilityCondition);
      const industrialMachinesAmount = getFacilityRepairCost(definition.industrialMachinesCost, facility.getView().facilityCondition);
      const materialTrade = market.buyFromLocal(ResourceType.ConstructionMaterials, materialAmount);
      const industrialMachinesTrade = market.buyFromLocal(ResourceType.IndustrialMachines, industrialMachinesAmount);
      if (materialTrade.success && industrialMachinesTrade.success && facility.repairCondition()) repairSpend += repairCashCost + materialTrade.amount * materialTrade.unitPrice + industrialMachinesTrade.amount * industrialMachinesTrade.unitPrice;
    }

    outstandingMaintenanceCost = activeFacilities.reduce((total, facility) => (
      total + getFacilityRepairCost(FACILITIES[facility.facilityType].landCost, facility.getView().facilityCondition)
        + getFacilityRepairCost(FACILITIES[facility.facilityType].constructionMaterialsCost, facility.getView().facilityCondition) * market.getLocalPrice(ResourceType.ConstructionMaterials)
        + getFacilityRepairCost(FACILITIES[facility.facilityType].industrialMachinesCost, facility.getView().facilityCondition) * market.getLocalPrice(ResourceType.IndustrialMachines)
    ), 0);
    const minuteMaintenanceCost = repairSpend - repairSpendBefore + outstandingMaintenanceCost - maintenanceBefore;
    const minuteNetMargin = totalRevenue - revenueBefore - (totalInputCost - inputCostBefore) - minuteMaintenanceCost;
    cumulativeNetProfit += minuteNetMargin;
    if (paybackMinute === null && cumulativeNetProfit >= facilityInvestmentCost + recipeResearchInvestmentCost) paybackMinute = minute;

    for (let interval = 0; interval < 60_000 / MARKET_DIFFUSION_INTERVAL_MS; interval += 1) {
      market.diffuse(MARKET_DIFFUSION_INTERVAL_MS);
    }
  }

  const totalMaintenanceCost = repairSpend + outstandingMaintenanceCost;
  return {
    durationMinutes: minutes,
    totalRevenue,
    totalInputCost,
    totalMaintenanceCost,
    facilityInvestmentCost,
    recipeResearchInvestmentCost,
    netMarginPerMinute: (totalRevenue - totalInputCost - totalMaintenanceCost) / minutes,
    paybackMinute,
    constructionMaterialsDemand: includeConstructionInputsDemand ? constructionMaterialsDemand : 0,
    fulfilledConstructionMaterialsDemand,
    industrialMachinesDemand: includeConstructionInputsDemand ? industrialMachinesDemand : 0,
    fulfilledIndustrialMachinesDemand,
    finalSoldUnitPrices,
    stalledFacilityMinutes,
  };
}

function getRecipeFacilityType(recipeName: RecipeName): FacilityType {
  const matchingFacility = Object.values(FACILITIES).find((facility) => facility.recipes.some((recipe) => recipe.name === recipeName));
  if (!matchingFacility) throw new Error(`No facility produces recipe ${recipeName}.`);
  return matchingFacility.type;
}

function getUpgradeInvestmentCost(upgradeCost: number, targetLevel: number): number {
  return Array.from({ length: Math.max(0, Math.floor(targetLevel)) }, (_, currentLevel) => getFacilityUpgradeCost(upgradeCost, currentLevel))
    .reduce((total, cost) => total + cost, 0);
}
