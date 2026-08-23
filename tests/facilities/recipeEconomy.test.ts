import { describe, expect, it } from 'vitest';
import { FacilityCollection } from '@/game/facilities/facilityCollection';
import { FACILITIES, FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE, FACILITY_REPAIR_MATERIAL_COST_RATE } from '@/game/facilities/facilityConstants';
import { calculateFacilityStaffWagePerMinute } from '@/game/facilities/facilityEconomics';
import { calculateFacilityEffectiveWork, getRecipeProductionConditionLoss } from '@/game/facilities/facilityProduction';
import { FacilityType } from '@/game/facilities/facilityTypes';
import { Market } from '@/game/market';
import { getRecipe, RecipeName } from '@/game/recipes';
import { ResourceType } from '@/game/resources';
import {
  RECIPE_ECONOMY_BREAK_EVEN_HORIZON_MINUTES,
  RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
  RECIPE_ECONOMY_LONG_WINDOW_MINUTES,
  RECIPE_ECONOMY_REPAIR_THRESHOLD,
  RECIPE_ECONOMY_SHORT_WINDOW_MINUTES,
  simulateRecipeEconomy,
  simulateRecipeEconomyChain,
} from '../support/recipeEconomy';

const RECIPE_NAMES = Object.values(RecipeName);
const UPGRADE_LEVELS = [0, 1, 3, 5, 10] as const;
const MINIMUM_POSITIVE_SHORT_RUN_RECIPE_SHARE = 0.9;
const MINIMUM_POSITIVE_ASSISTED_LONG_RUN_RECIPE_SHARE = 0.75;
const PREOWNED_NETWORK_III_PROJECT_IDS = [
  ...Array.from({ length: 3 }, (_, index) => `local-market-network-${index + 1}`),
  ...Array.from({ length: 3 }, (_, index) => `market-diffusion-network-${index + 1}`),
];

function hasPositiveMarginInBaseOrPreownedNetworkMarket(recipeName: RecipeName, durationMinutes: number): boolean {
  return [[], PREOWNED_NETWORK_III_PROJECT_IDS].some((completedResearchProjectIds) => (
    simulateRecipeEconomy({ recipeName, durationMinutes, completedResearchProjectIds }).netMarginPerMinute > 0
  ));
}

describe('recipe economy simulation', () => {
  it.each(RECIPE_NAMES)('%s is initially profitable and reports finite 15-minute and 60-minute economics', (recipeName) => {
    const initial = simulateRecipeEconomy({ recipeName, durationMinutes: 1 });
    const shortRun = simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_SHORT_WINDOW_MINUTES });
    const longRun = simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES });
    const extendedRun = simulateRecipeEconomy({ recipeName, durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES });

    expect(Number.isFinite(initial.initialNetMarginPerMinute)).toBe(true);
    expect(Number.isFinite(shortRun.netMarginPerMinute)).toBe(true);
    expect(Number.isFinite(longRun.netMarginPerMinute)).toBe(true);
    expect(Number.isFinite(extendedRun.netMarginPerMinute)).toBe(true);
    expect(initial.initialNetMarginPerMinute).toBeGreaterThan(0);
    expect(longRun.totalMaintenanceCost).toBeGreaterThanOrEqual(0);
    expect(longRun.facilityInvestmentCost).toBeGreaterThan(0);
  });

  it('keeps almost all recipes profitable during the 15-minute isolated-sales window in either base or pre-owned Network III market conditions', () => {
    const profitableRecipeCount = RECIPE_NAMES.filter((recipeName) => (
      hasPositiveMarginInBaseOrPreownedNetworkMarket(recipeName, RECIPE_ECONOMY_SHORT_WINDOW_MINUTES)
    )).length;

    expect(profitableRecipeCount / RECIPE_NAMES.length).toBeGreaterThanOrEqual(MINIMUM_POSITIVE_SHORT_RUN_RECIPE_SHARE);
  });

  it('prices cash, Construction Materials, and Industrial Machines in initial repair liability', () => {
    const recipe = getRecipe(RecipeName.SolarPower);
    const definition = FACILITIES[FacilityType.PowerPlant];
    const facilities = new FacilityCollection();
    facilities.build(FacilityType.PowerPlant);
    const facility = facilities.getAllByType(FacilityType.PowerPlant)[0]!;
    const market = new Market();

    facility.setActiveRecipe(recipe.name);
    facility.setAssignedWorkers(facility.getView().requiredWorkers);
    const view = facility.getView();
    const cyclesPerMinute = calculateFacilityEffectiveWork(view, 1) / recipe.requiredWork;
    const expectedInitialMargin = cyclesPerMinute * recipe.outputs
      .reduce((total, output) => total + output.amount * view.outputMultiplier * market.getLocalPrice(output.resourceType), 0)
      - cyclesPerMinute * recipe.inputs
        .reduce((total, input) => total + input.amount * market.getLocalPrice(input.resourceType), 0)
      - (FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE + cyclesPerMinute * getRecipeProductionConditionLoss(recipe))
        * FACILITY_REPAIR_MATERIAL_COST_RATE
        * (definition.landCost
          + definition.constructionMaterialsCost * market.getLocalPrice(ResourceType.ConstructionMaterials)
          + definition.industrialMachinesCost * market.getLocalPrice(ResourceType.IndustrialMachines))
      - calculateFacilityStaffWagePerMinute(view.assignedWorkers, view.staffWagePerWorkerPerMinute);

    const result = simulateRecipeEconomy({ recipeName: recipe.name, durationMinutes: 1 });

    expect(result.initialNetMarginPerMinute).toBeCloseTo(expectedInitialMargin, 10);
    expect(result.totalStaffWage).toBeCloseTo(calculateFacilityStaffWagePerMinute(view.assignedWorkers, view.staffWagePerWorkerPerMinute), 10);
  });

  it('includes land, Construction Materials, and Industrial Machines in facility investment cost', () => {
    const definition = FACILITIES[FacilityType.PowerPlant];
    const market = new Market();
    const expectedFacilityInvestmentCost = definition.landCost
      + definition.constructionMaterialsCost * market.getLocalPrice(ResourceType.ConstructionMaterials)
      + definition.industrialMachinesCost * market.getLocalPrice(ResourceType.IndustrialMachines);

    const result = simulateRecipeEconomy({ recipeName: RecipeName.SolarPower, durationMinutes: 1 });

    expect(result.facilityInvestmentCost).toBeCloseTo(expectedFacilityInvestmentCost, 10);
  });

  it('captures a profitable initial Grain market and a lower sustained selling margin', () => {
    const initial = simulateRecipeEconomy({ recipeName: RecipeName.GrowGrain, durationMinutes: 1 });
    const longRun = simulateRecipeEconomy({ recipeName: RecipeName.GrowGrain, durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES });

    expect(initial.initialNetMarginPerMinute).toBeGreaterThan(0);
    expect(longRun.netMarginPerMinute).toBeLessThan(initial.initialNetMarginPerMinute);
    expect(longRun.finalOutputUnitPrice).toBeLessThan(initial.initialOutputUnitPrice);
  });

  it('keeps most recipes profitable after 60 minutes in either base or pre-owned Network III market conditions', () => {
    const profitableRecipes = RECIPE_NAMES.filter((recipeName) => (
      hasPositiveMarginInBaseOrPreownedNetworkMarket(recipeName, RECIPE_ECONOMY_LONG_WINDOW_MINUTES)
    ));

    expect(profitableRecipes.length / RECIPE_NAMES.length).toBeGreaterThanOrEqual(MINIMUM_POSITIVE_ASSISTED_LONG_RUN_RECIPE_SHARE);
  });

  it('treats Network III as pre-owned market support rather than an investment charged to the recipe', () => {
    const baseline = simulateRecipeEconomy({ recipeName: RecipeName.ElectricPumping, durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES });
    const assisted = simulateRecipeEconomy({
      recipeName: RecipeName.ElectricPumping,
      durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES,
      completedResearchProjectIds: PREOWNED_NETWORK_III_PROJECT_IDS,
    });

    expect(baseline.netMarginPerMinute).toBeLessThan(0);
    expect(assisted.netMarginPerMinute).toBeGreaterThan(0);
    expect(assisted.facilityInvestmentCost).toBe(baseline.facilityInvestmentCost);
    expect(assisted.upgradeInvestmentCost).toBe(baseline.upgradeInvestmentCost);
  });

  it('applies completed local-depth and local-regional-diffusion research to market scenarios', () => {
    const baseline = simulateRecipeEconomy({ recipeName: RecipeName.GrowGrain, durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES });
    const researched = simulateRecipeEconomy({
      recipeName: RecipeName.GrowGrain,
      durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES,
      completedResearchProjectIds: ['local-market-network-10', 'market-diffusion-network-10'],
    });

    expect(researched.finalOutputUnitPrice).toBeGreaterThan(baseline.finalOutputUnitPrice);
    expect(researched.netMarginPerMinute).toBeGreaterThan(baseline.netMarginPerMinute);
  });

  it('uses upstream chain output before buying a downstream recipe input', () => {
    const result = simulateRecipeEconomyChain({
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.GrowGrain },
      ],
      durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES,
      primaryOutputResourceTypes: [ResourceType.Grain],
    });

    expect(result.totalRevenue).toBeGreaterThan(0);
    expect(result.netMarginPerMinute).toBeGreaterThan(0);
    expect(result.stalledFacilityMinutes).toBe(0);
  });

  it('uses quarter-sized Animal Farm batches without changing their output rate', () => {
    const cattle = getRecipe(RecipeName.RaiseCattle);
    const sheep = getRecipe(RecipeName.RaiseSheep);
    const chicken = getRecipe(RecipeName.RaiseChicken);

    expect(cattle.requiredWork).toBeCloseTo(0.6125);
    expect(sheep.requiredWork).toBeCloseTo(0.4375);
    expect(chicken.requiredWork).toBeCloseTo(0.35);
    expect(cattle.outputs[0]!.amount / cattle.requiredWork).toBeCloseTo(2 / 2.45);
    expect(sheep.outputs[0]!.amount / sheep.requiredWork).toBeCloseTo(1.5 / 1.75);
    expect(chicken.outputs[0]!.amount / chicken.requiredWork).toBeCloseTo(1 / 1.4);
  });

  it('sells excessive chain output while retaining the next minute of downstream inputs', () => {
    const result = simulateRecipeEconomyChain({
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.QuarryMinerals },
        { recipeName: RecipeName.ProduceChemicals },
        { recipeName: RecipeName.SynthesizeFertilizer },
        { recipeName: RecipeName.GrowGrain },
        { recipeName: RecipeName.RaiseChicken },
        { recipeName: RecipeName.BakeCake },
      ],
      durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES,
      primaryOutputResourceTypes: [ResourceType.Cake],
      includeConstructionInputsDemand: true,
    });

    expect(result.totalRevenue).toBeGreaterThan(0);
    expect(result.stalledFacilityMinutes).toBe(0);
    expect(result.constructionMaterialsDemand).toBeGreaterThan(0);
    expect(result.industrialMachinesDemand).toBeGreaterThan(0);
  });

  it('applies participating-facility construction-input demand in connected construction chains', () => {
    const result = simulateRecipeEconomyChain({
      facilities: [
        { recipeName: RecipeName.ProduceWater },
        { recipeName: RecipeName.ProduceElectricity },
        { recipeName: RecipeName.ProduceConstructionMaterials },
      ],
      durationMinutes: RECIPE_ECONOMY_LONG_WINDOW_MINUTES,
      primaryOutputResourceTypes: [ResourceType.ConstructionMaterials],
      includeConstructionInputsDemand: true,
    });

    expect(result.constructionMaterialsDemand).toBeGreaterThan(0);
    expect(result.fulfilledConstructionMaterialsDemand).toBeGreaterThan(0);
    expect(result.fulfilledConstructionMaterialsDemand).toBeLessThanOrEqual(result.constructionMaterialsDemand);
    expect(result.industrialMachinesDemand).toBeGreaterThan(0);
    expect(result.fulfilledIndustrialMachinesDemand).toBeGreaterThan(0);
    expect(result.fulfilledIndustrialMachinesDemand).toBeLessThanOrEqual(result.industrialMachinesDemand);
    expect(result.constructionDemandCost).toBeGreaterThan(0);
    expect(result.fulfilledConstructionDemandCost).toBeGreaterThan(0);
  });

  it('routes a capped share of final output through generated customer orders', () => {
    const result = simulateRecipeEconomyChain({
      facilities: [{ recipeName: RecipeName.ProduceWater }],
      durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES,
      primaryOutputResourceTypes: [ResourceType.Water],
      customerOrderSalesShare: 0.25,
    });

    expect(result.fulfilledCustomerOrderCount).toBeGreaterThan(0);
    expect(result.customerOrderRevenue).toBeGreaterThan(0);
    expect(result.customerOrderDeliveredAmount).toBeGreaterThan(0);
    expect(result.customerOrderDeliveredAmount).toBeLessThanOrEqual(result.customerOrderEligibleOutputAmount * 0.25);
  });

  it.each(UPGRADE_LEVELS)('reports the grain economy at upgrade level %i', (speedUpgradeLevel) => {
    const result = simulateRecipeEconomy({ recipeName: RecipeName.GrowGrain, durationMinutes: RECIPE_ECONOMY_SHORT_WINDOW_MINUTES, speedUpgradeLevel });

    expect(result.totalMaintenanceCost).toBeGreaterThan(0);
    expect(result.averageCondition).toBeGreaterThan(RECIPE_ECONOMY_REPAIR_THRESHOLD);
    expect(result.upgradeInvestmentCost).toBeGreaterThanOrEqual(0);
  });

  it('reports a break-even minute when one occurs within the diagnostic horizon', () => {
    const result = simulateRecipeEconomy({ recipeName: RecipeName.GrowGrain, durationMinutes: RECIPE_ECONOMY_BREAK_EVEN_HORIZON_MINUTES });

    expect(result.breakEvenMinute === null || result.breakEvenMinute <= RECIPE_ECONOMY_BREAK_EVEN_HORIZON_MINUTES).toBe(true);
  });

  it('can cap test-only electricity purchases at 1.5 times their initial local price', () => {
    const uncapped = simulateRecipeEconomy({ recipeName: RecipeName.ProduceConstructionMaterials, durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES });
    const capped = simulateRecipeEconomy({ recipeName: RecipeName.ProduceConstructionMaterials, durationMinutes: RECIPE_ECONOMY_EXTENDED_WINDOW_MINUTES, electricityPriceCapMultiplier: 1.5 });

    expect(capped.totalInputCost).toBeLessThanOrEqual(uncapped.totalInputCost);
    expect(capped.netMarginPerMinute).toBeGreaterThanOrEqual(uncapped.netMarginPerMinute);
  });
});
