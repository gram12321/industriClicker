import { Inventory } from '@/game/inventory';
import { MARKET_DIFFUSION_INTERVAL_MS, Market } from '@/game/market';
import { getRecipe, type RecipeName } from '@/game/recipes';
import { ResourceType } from '@/game/resources';
import { FACILITIES, FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE } from './facilityConstants';
import { FacilityCollection } from './facilityCollection';
import { advanceAllFacilityProduction, calculateFacilityEffectiveWork, getRecipeProductionConditionLoss } from './facilityProduction';
import type { FacilityType } from './facilityTypes';
import { getFacilityRepairCost, getFacilityUpgradeCost } from './facilityUpgrades';

const BASE_WORK_PER_MINUTE = 1;
const WORK_COMPLETION_EPSILON = 1e-9;

/** Standard windows used by recipe-balance tests and reports. */
export const RECIPE_ECONOMY_SHORT_WINDOW_MINUTES = 15;
export const RECIPE_ECONOMY_LONG_WINDOW_MINUTES = 60;
export const RECIPE_ECONOMY_BREAK_EVEN_HORIZON_MINUTES = 4 * 60;
export const RECIPE_ECONOMY_REPAIR_THRESHOLD = 0.7;

export type RecipeEconomyScenario = {
  recipeName: RecipeName;
  durationMinutes: number;
  speedUpgradeLevel?: number;
  outputUpgradeLevel?: number;
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

/**
 * Simulates one fully staffed facility buying recipe inputs and selling its
 * output on the local market once per foreground minute while applying normal
 * five-second market diffusion. Initial margin uses
 * a full-cycle initial-market rate, so recipes longer than one minute are not
 * penalized for buying their inputs before their first completed cycle.
 * Maintenance is charged as realised repair spend plus the outstanding repair
 * liability.
 */
export function simulateRecipeEconomy({ recipeName, durationMinutes, speedUpgradeLevel = 0, outputUpgradeLevel = 0 }: RecipeEconomyScenario): RecipeEconomyResult {
  const recipe = getRecipe(recipeName);
  const facilityType = getRecipeFacilityType(recipeName);
  const definition = FACILITIES[facilityType];
  const facilities = new FacilityCollection();
  facilities.build(facilityType);
  const facility = facilities.getAllByType(facilityType)[0]!;
  const inventory = new Inventory();
  const market = new Market();
  const minutes = Math.max(1, Math.floor(durationMinutes));
  let totalRevenue = 0;
  let totalInputCost = 0;
  let repairSpend = 0;
  let totalCondition = 0;
  let repairCount = 0;
  let breakEvenMinute: number | null = null;
  let stalledMinutes = 0;
  const initialOutputUnitPrice = market.getLocalPrice(recipe.output.resourceType);
  let outstandingMaintenanceCost = 0;
  const facilityInvestmentCost = definition.landCost + definition.constructionMaterialsCost * market.getLocalPrice(ResourceType.ConstructionMaterials);
  const upgradeInvestmentCost = getUpgradeInvestmentCost(definition.upgradeCost, speedUpgradeLevel)
    + getUpgradeInvestmentCost(definition.upgradeCost, outputUpgradeLevel);
  const totalInvestmentCost = facilityInvestmentCost + upgradeInvestmentCost;
  let cumulativeNetProfit = 0;
  let paybackMinute: number | null = null;

  facility.setActiveRecipe(recipeName);
  for (let level = 0; level < Math.max(0, Math.floor(speedUpgradeLevel)); level += 1) facility.upgradeSpeed();
  for (let level = 0; level < Math.max(0, Math.floor(outputUpgradeLevel)); level += 1) facility.upgradeOutput();
  facility.setAssignedWorkers(facility.getView().requiredWorkers);
  const initialView = facility.getView();
  const initialCyclesPerMinute = calculateFacilityEffectiveWork(initialView, BASE_WORK_PER_MINUTE) / recipe.requiredWork;
  const initialRevenuePerMinute = initialCyclesPerMinute * recipe.output.amount * initialView.outputMultiplier * initialOutputUnitPrice;
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
      const materialAmount = getFacilityRepairCost(definition.constructionMaterialsCost, facility.getView().facilityCondition);
      const repairTrade = market.buyFromLocal(ResourceType.ConstructionMaterials, materialAmount);
      if (repairTrade.success && facility.repairCondition()) {
        repairSpend += repairTrade.amount * repairTrade.unitPrice;
        repairCount += 1;
      }
    }

    outstandingMaintenanceCost = getFacilityRepairCost(definition.constructionMaterialsCost, facility.getView().facilityCondition)
      * market.getLocalPrice(ResourceType.ConstructionMaterials);
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
    finalOutputUnitPrice: market.getLocalPrice(recipe.output.resourceType),
    averageCondition: totalCondition / minutes,
    repairCount,
    breakEvenMinute,
    stalledMinutes,
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
