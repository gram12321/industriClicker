import { describe, expect, it } from 'vitest';
import { Inventory } from '@/game/inventory';
import { Finance } from '@/game/finance';
import { getRecipe, RecipeName } from '@/game/recipes';
import { ResourceType } from '@/game/resources';
import { Facility } from '@/game/facilities/facility';
import { FacilityCollection } from '@/game/facilities/facilityCollection';
import {
  calculateFacilityProductionMaintenanceCost,
  calculateFacilityProductionEconomics,
  calculateCurrentFacilityProductionEconomics,
  calculateFacilityNetGainPerMinute,
  calculateRecipeContributionMargin,
  calculateFacilityResourcePayment,
  calculateRecipeValuePerMinute,
} from '@/game/facilities/facilityEconomics';
import { advanceAllFacilityProduction, calculateFacilityEffectiveWork, calculateRecipeInputQ, calculateRecipeInputSourceCost, getFacilityProductionCycleInputs, getFacilityRecipeInputPlan, getRecipeProductionConditionLoss } from '@/game/facilities/facilityProduction';
import { calculateOutputQuality, calculateProductionMaxQ } from '@/game/quality';
import { Market } from '@/game/market';
import { FacilityType } from '@/game/facilities/facilityTypes';
import { getFacilityMaximumWorkers, getFacilityUpgradePoints, getStaffTrainingDurationMs } from '@/game/facilities/facilityUpgrades';

function createActiveFacility(facilityType: FacilityType, recipeName: RecipeName) {
  const facilities = new FacilityCollection();
  facilities.build(facilityType);
  const facility = facilities.getAllByType(facilityType)[0]!;
  facility.setActiveRecipe(recipeName);
  for (const input of getRecipe(recipeName).inputs) {
    if (input.optional) facility.setOptionalInputEnabled(recipeName, input.resourceType, false);
  }

  return { facilities, facility };
}

function addRecipeInputs(inventory: Inventory, recipeName: RecipeName, cycleCount: number): void {
  for (const input of getRecipe(recipeName).inputs.filter((candidate) => !candidate.optional)) {
    inventory.add(input.resourceType, input.amount * cycleCount);
  }
}

describe('calculateFacilityEffectiveWork', () => {
  it('grows infrastructure capacity exponentially and machinery grants points', () => {
    expect(getFacilityMaximumWorkers(4, 0)).toBe(4);
    expect(getFacilityMaximumWorkers(4, 2)).toBe(9);
    expect(getFacilityUpgradePoints(3)).toBe(3);
  });

  it('adds the fully staffed workforce contribution to base work', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);

    const view = facility.getView();
    expect(calculateFacilityEffectiveWork(view, 1)).toBeCloseTo(
      (1 + 0.1 * view.assignedWorkers) * view.staffingEfficiency * view.conditionEfficiency,
    );
  });

  it('scales direct work with the available workforce when understaffed', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.setAssignedWorkers(1);
    const view = facility.getView();

    expect(calculateFacilityEffectiveWork(view, 1)).toBeCloseTo(1 + 0.1 * view.assignedWorkers * view.staffingEfficiency);
  });

  it('adds direct work while retaining diminishing overstaffing efficiency', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    const fullyStaffedWork = calculateFacilityEffectiveWork(facility.getView(), 1);

    facility.setAssignedWorkers(3);
    const firstOverstaffedView = facility.getView();
    const firstOverstaffedWork = calculateFacilityEffectiveWork(firstOverstaffedView, 1);
    facility.setAssignedWorkers(4);
    const secondOverstaffedView = facility.getView();
    const secondOverstaffedWork = calculateFacilityEffectiveWork(facility.getView(), 1);

    expect(firstOverstaffedWork).toBeCloseTo((1 + 0.1 * firstOverstaffedView.assignedWorkers) * firstOverstaffedView.staffingEfficiency * firstOverstaffedView.conditionEfficiency);
    expect(firstOverstaffedWork).toBeGreaterThan(fullyStaffedWork);
    expect(secondOverstaffedWork).toBeCloseTo((1 + 0.1 * secondOverstaffedView.assignedWorkers) * secondOverstaffedView.staffingEfficiency * secondOverstaffedView.conditionEfficiency);
    expect(secondOverstaffedView.staffingEfficiency - firstOverstaffedView.staffingEfficiency).toBeLessThan(firstOverstaffedView.staffingEfficiency - 1);
  });

  it('applies condition, speed, and research to the combined work', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.upgradeSpeed();
    facility.setAssignedWorkers(facility.getView().requiredWorkers);
    facility.applyConditionLoss(0.4);
    const view = facility.getView();

    const expectedWork = (1 + view.requiredWorkers * 0.1 * view.staffingEfficiency)
      * view.conditionEfficiency
      * view.speedUpgradeWorkSpeedMultiplier
      * 1.5;

    expect(calculateFacilityEffectiveWork(view, 1, 1.5)).toBeCloseTo(expectedWork);
  });

  it('stops work when no workers are available', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.setAssignedWorkers(0);
    expect(calculateFacilityEffectiveWork(facility.getView(), 1)).toBe(0);
  });

  it('scales base and staff work with staffing efficiency', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.setAssignedWorkers(1);
    const view = facility.getView();

    expect(calculateFacilityEffectiveWork(view, 1)).toBeCloseTo(
      (1 + 0.1 * view.assignedWorkers) * view.staffingEfficiency * view.conditionEfficiency,
    );
  });

  it('does not add inventory output when staffing efficiency is zero', () => {
    const { facilities, facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.setAssignedWorkers(0);
    const inventory = new Inventory();
    addRecipeInputs(inventory, RecipeName.GrowGrain, 1);

    const outputs = advanceAllFacilityProduction(facilities, inventory, (view) => calculateFacilityEffectiveWork(view, 1));

    expect(outputs).toHaveLength(0);
    expect(inventory.getAmount(ResourceType.Grain)).toBe(0);
  });

  it('gains more staff experience from higher-work production cycles', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    const before = facility.getView().staffQualityProgress;
    facility.gainStaffExperience(25);
    const shortCycleGain = facility.getView().staffQualityProgress - before;
    facility.gainStaffExperience(100);
    const longCycleGain = facility.getView().staffQualityProgress - before - shortCycleGain;

    expect(longCycleGain).toBeGreaterThan(shortCycleGain);
  });

  it('reduces staff quality proportionally when workers are fired', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.setAssignedWorkers(2);
    facility.gainStaffExperience(100_000_000);
    const before = facility.getView().staffQuality;
    const now = 1_000;
    expect(facility.scheduleStaffingChange(1, now, now + 1_000)).toBe(true);
    facility.processStaffingChange(now + 1_000);

    expect(facility.getView().staffQuality).toBeCloseTo(before / 2);
    expect(facility.getView().staffQualityTrend).toBe('falling');
  });

  it('keeps a recent staffing change visible while experience continues', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    const now = 1_000;
    facility.setAssignedWorkers(2);
    facility.gainStaffExperience(100_000_000);
    expect(facility.scheduleStaffingChange(1, now, now + 1_000)).toBe(true);
    facility.processStaffingChange(now + 1_000);
    facility.gainStaffExperience(1);

    expect(facility.getView().staffQualityTrend).toBe('falling');
    facility.advanceStaffQuality(5);
    expect(facility.getView().staffQualityTrend).toBe('steady');
  });

  it('exposes wage pressure separately from the net quality trend', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.gainStaffExperience(10_000);
    expect(facility.getView().staffQualityWageTrend).toBe('steady');
    expect(facility.getView().staffQualityWagePressurePerMinute).toBe(0);
    expect(facility.setStaffWagePerWorkerPerMinute(0.5)).toBe(true);
    expect(facility.getView().staffQualityWageTrend).toBe('falling');
    expect(facility.getView().staffQualityWagePressurePerMinute).toBeLessThan(0);
    expect(facility.setStaffWagePerWorkerPerMinute(2)).toBe(true);
    expect(facility.getView().staffQualityWageTrend).toBe('rising');
    expect(facility.getView().staffQualityWagePressurePerMinute).toBeGreaterThan(0);
  });

  it('pauses experience while all assigned workers are training', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    const now = 1_000;
    expect(facility.scheduleStaffTraining(facility.getView().assignedWorkers, now, now + 10_000)).toBe(true);
    const before = facility.getView().staffQualityProgress;
    facility.gainStaffExperience(100_000);
    expect(facility.getView().staffQualityProgress).toBe(before);
  });

  it('trains workers concurrently without extending the batch duration', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.setAssignedWorkers(2);
    const now = 1_000;
    const duration = getStaffTrainingDurationMs(1);

    expect(getStaffTrainingDurationMs(2)).toBe(duration);
    expect(facility.scheduleStaffTraining(1, now, now + duration)).toBe(true);
    expect(facility.scheduleStaffTraining(1, now + 30_000, now + 30_000 + duration)).toBe(true);
    expect(facility.getView().staffTraining?.workers).toBe(2);
    expect(facility.getView().staffTraining?.completesAtGameTimeMs).toBe(now + duration);
    expect(facility.processStaffTraining(now + duration - 1)).toBe(false);
    expect(facility.processStaffTraining(now + duration)).toBe(true);
  });

  it('preserves remaining training time while training is paused', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    const now = 1_000;
    expect(facility.scheduleStaffTraining(1, now, now + 1_000)).toBe(true);
    expect(facility.pauseStaffTraining(2_000)).toBe(true);
    expect(facility.processStaffTraining(now + 1_000)).toBe(false);
    expect(facility.processStaffTraining(now + 3_000)).toBe(true);
  });

  it('allows repairs to overlap staffing and training activities', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.applyConditionLoss(0.2);
    const now = 1_000;
    expect(facility.scheduleRepair(0.9, now, now + 10_000)).toBe(true);
    expect(facility.scheduleStaffTraining(1, now, now + 20_000)).toBe(true);
    expect(facility.processRepair(now + 10_000)).toBe(true);
  });
});

describe('facility resource payment', () => {
  it('uses the slippage-adjusted quote for missing materials', () => {
    const finance = new Finance();
    const inventory = new Inventory();
    const market = new Market();
    const quote = market.getLocalBuyQuote(ResourceType.ConstructionMaterials, 1);

    const payment = calculateFacilityResourcePayment(finance, inventory, market, 0, 1, 0);

    expect(quote.success).toBe(true);
    expect(payment.cashCost).toBeCloseTo(quote.unitPrice);
    expect(payment.canAfford).toBe(finance.getBalance() >= payment.cashCost);
  });
});

describe('facility condition wear', () => {
  it('increases exponentially when a facility is overstaffed', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.setAssignedWorkers(4);

    facility.applyConditionLoss(0.1);

    expect(facility.getView().facilityCondition).toBeCloseTo(0.85);
  });

  it('gives faster recipes more production wear per minute and applies their recipe multiplier', () => {
    const grain = getRecipe(RecipeName.GrowGrain);
    const sugar = getRecipe(RecipeName.GrowSugar);
    const grainWearPerMinute = getRecipeProductionConditionLoss(grain) / grain.requiredWork;
    const sugarWearPerMinute = getRecipeProductionConditionLoss(sugar) / sugar.requiredWork;

    expect(grainWearPerMinute).toBeGreaterThan(sugarWearPerMinute);
    expect(getRecipeProductionConditionLoss(getRecipe(RecipeName.ProduceConstructionMaterials))).toBeGreaterThan(getRecipeProductionConditionLoss(grain));
  });
});

describe('facility economics', () => {
  it('uses the supplied input and output quality for recipe value', () => {
    const market = new Market();
    const recipe = getRecipe(RecipeName.GrowGrain);
    const workPerMinute = 1.2;

    const valuePerMinute = calculateRecipeValuePerMinute(
      recipe,
      market,
      1,
      workPerMinute,
      () => 2,
      () => 5,
      1,
      getFacilityRecipeInputPlan(recipe, 1, []),
      getFacilityRecipeInputPlan(recipe, 1, []).effects,
    );
    const inputPlan = getFacilityRecipeInputPlan(recipe, 1, []);
    const expectedCycleValue = recipe.outputs.reduce(
      (total, output) => total + output.amount * market.getLocalSalePrice(output.resourceType, 5),
      0,
    ) - inputPlan.inputs.reduce(
      (total, input) => total + input.amount * market.getLocalSalePrice(input.resourceType, 2),
      0,
    );

    expect(valuePerMinute).toBeCloseTo(expectedCycleValue * workPerMinute / recipe.requiredWork);
  });

  it('separates current output value from historical direct input cost', () => {
    const market = new Market();
    const inventory = new Inventory();
    const recipe = getRecipe(RecipeName.GrowGrain);
    for (const input of recipe.inputs) inventory.add(input.resourceType, input.amount, 1, 2);

    const inputCost = recipe.inputs.filter((input) => !input.optional).reduce((total, input) => total + input.amount * 2, 0);
    const margin = calculateRecipeContributionMargin(recipe, market, inventory, 1, undefined, inputCost);
    const outputValue = recipe.outputs.reduce((total, output) => total + output.amount * market.getLocalPrice(output.resourceType), 0);
    expect(margin).toBeCloseTo(outputValue - inputCost);
  });

  it('subtracts the full euro cost of condition wear from displayed net gain', () => {
    expect(calculateFacilityNetGainPerMinute(25, 3.5)).toBe(21.5);
  });

  it('subtracts recurring staff wages from displayed net gain', () => {
    const valuePerMinute = 25;
    const decayCost = 0;

    expect(calculateFacilityNetGainPerMinute(valuePerMinute, decayCost, 7)).toBe(18);
  });

  it('returns shared value and net gain for facility production presentation', () => {
    const market = new Market();
    const recipe = getRecipe(RecipeName.GrowGrain);
    const economics = calculateFacilityProductionEconomics(recipe, market, 1, 1.2, 3.5, 7, () => 2, () => 5);

    expect(economics.valuePerMinute).toBeCloseTo(calculateRecipeValuePerMinute(recipe, market, 1, 1.2, () => 2, () => 5));
    expect(economics.netGainPerMinute).toBeCloseTo(calculateFacilityNetGainPerMinute(economics.valuePerMinute, 3.5, 7));
  });

  it('resolves active facility economics once for every production presentation', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    const inventory = new Inventory();
    const recipe = getRecipe(RecipeName.GrowGrain);
    for (const input of recipe.inputs) inventory.add(input.resourceType, input.amount);

    const economics = calculateCurrentFacilityProductionEconomics(facility.getView(), recipe, new Market(), inventory, 1, () => 10, () => 10);

    expect(economics.netGainPerMinute).toBeCloseTo(calculateFacilityNetGainPerMinute(economics.valuePerMinute, economics.decayCostPerMinute, economics.staffWagePerMinute));
    expect(economics.getOutputQuality(recipe.outputs[0]!.resourceType)).toBeGreaterThan(0);
  });

  it('does not reuse captured active-recipe inputs for another recipe preview', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    const snapshot = facility.toSnapshot();
    snapshot.recipeInputQ = 99;
    snapshot.recipeInputEffects = { inputMultiplier: 0.5, outputMultiplier: 2, qualityBoost: 10 };
    const restoredFacility = Facility.fromSnapshot(snapshot);
    const previewRecipe = getRecipe(RecipeName.GrowSugar);
    const inventory = new Inventory();
    for (const input of previewRecipe.inputs) inventory.add(input.resourceType, input.amount);

    const economics = calculateCurrentFacilityProductionEconomics(restoredFacility.getView(), previewRecipe, new Market(), inventory, 1, () => 10, () => 10);

    expect(economics.inputQ).not.toBe(99);
    expect(economics.getOutputQuality(previewRecipe.outputs[0]!.resourceType)).toBeLessThan(10);
  });
});

describe('facility staffing changes', () => {
  it('delays staffing changes and dilutes staff quality when workers are hired', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    const initialQuality = facility.getView().staffQuality;

    expect(facility.scheduleStaffingChange(4, 0, 1_000)).toBe(true);
    expect(facility.processStaffingChange(500)).toBe(true);
    expect(facility.getView().assignedWorkers).toBe(3);
    expect(facility.processStaffingChange(1_000)).toBe(true);
    expect(facility.getView().assignedWorkers).toBe(4);
    expect(facility.getView().staffQuality).toBeLessThanOrEqual(initialQuality);
  });
});

describe('advanceAllFacilityProduction', () => {
  it('consumes at most one mutually exclusive furniture finishing input', () => {
    const facility = new Facility('timber-works-1', FacilityType.TimberWorks);
    const recipe = getRecipe(RecipeName.AssembleFurniture);
    const plan = getFacilityRecipeInputPlan(recipe, 1, [ResourceType.Leather, ResourceType.Wool]);

    expect(plan.optionalInputs.map((input) => input.resourceType)).toEqual([ResourceType.Leather]);
  });

  it('runs no-input forestry outputs independently while retaining land-size scaling', () => {
    const facilities = new FacilityCollection();
    facilities.build(FacilityType.Forestry, 5);
    const facility = facilities.getAllByType(FacilityType.Forestry)[0]!;
    facility.setActiveRecipe(RecipeName.ForestManagement);
    const inventory = new Inventory();

    advanceAllFacilityProduction(facilities, inventory, () => 0.1);
    expect(facility.getView().recipeOutputProgress[RecipeName.ForestManagement]).toEqual({
      [ResourceType.Meat]: 0.1,
      [ResourceType.Timber]: 0.1,
      [ResourceType.Leather]: 0.1,
    });

    const firstOutputs = advanceAllFacilityProduction(facilities, inventory, () => 0.1);
    expect(firstOutputs).toMatchObject([{ resourceType: ResourceType.Meat, amount: 0.25 }]);
    expect(facility.getView().recipeOutputProgress[RecipeName.ForestManagement]).toEqual({
      [ResourceType.Meat]: 0,
      [ResourceType.Timber]: 0.2,
      [ResourceType.Leather]: 0.2,
    });

    advanceAllFacilityProduction(facilities, inventory, () => 0.1);
    const laterOutputs = advanceAllFacilityProduction(facilities, inventory, () => 0.1);
    expect(laterOutputs).toMatchObject([
      { resourceType: ResourceType.Meat, amount: 0.25 },
      { resourceType: ResourceType.Timber, amount: 1 },
    ]);
    expect(inventory.getAmount(ResourceType.Meat)).toBeCloseTo(0.5);
    expect(inventory.getAmount(ResourceType.Timber)).toBeCloseTo(1);

    const snapshot = facility.toSnapshot();
    expect(Facility.fromSnapshot(snapshot).getView().recipeOutputProgress).toEqual(facility.getView().recipeOutputProgress);
  });

  it('scales a large farm footprint across staffing, cycle inputs, work, and output', () => {
    const facilities = new FacilityCollection();
    facilities.build(FacilityType.Farm, 25);
    const facility = facilities.getAllByType(FacilityType.Farm)[0]!;
    facility.setActiveRecipe(RecipeName.GrowGrain);
    facility.setOptionalInputEnabled(RecipeName.GrowGrain, ResourceType.Fertilizer, false);
    const view = facility.getView();
    const recipe = getRecipe(RecipeName.GrowGrain);
    const inventory = new Inventory();
    for (const input of recipe.inputs) inventory.add(input.resourceType, input.amount * view.sizeMultiplier);

    expect(view.sizeHectares).toBe(25);
    expect(view.sizeMultiplier).toBe(5);
    expect(view.requiredWorkers).toBe(5);
    expect(getFacilityProductionCycleInputs(view)).toEqual(getFacilityRecipeInputPlan(recipe, 5, view.optionalInputSettings[recipe.name]).inputs.map(({ resourceType, amount }) => ({ resourceType, amount })));

    const outputs = advanceAllFacilityProduction(facilities, inventory, (facilityView) => calculateFacilityEffectiveWork(facilityView, 1));

    expect(outputs).toHaveLength(1);
    expect(outputs[0]?.amount).toBeCloseTo(recipe.outputs[0].amount * 5);
    expect(inventory.getAmount(ResourceType.Grain)).toBeCloseTo(recipe.outputs[0].amount * 5);
  });

  it('requires escalating lifetime production for each resource quality cap', () => {
    expect(calculateProductionMaxQ(0)).toBe(1);
    expect(calculateProductionMaxQ(99)).toBeLessThan(2);
    expect(calculateProductionMaxQ(100)).toBe(2);
    expect(calculateProductionMaxQ(10_000)).toBeGreaterThan(calculateProductionMaxQ(100));
    expect(calculateProductionMaxQ(207_500)).toBeGreaterThan(40);
    expect(calculateProductionMaxQ(22_000_000)).toBeGreaterThan(98);
    expect(calculateProductionMaxQ(Number.MAX_VALUE)).toBeLessThan(100);
  });

  it('weights input quality by the recipe amounts and limits output quality by that average plus one', () => {
    const inventory = new Inventory();
    inventory.add(ResourceType.Water, 1, 2);
    inventory.add(ResourceType.Electricity, 1, 4);
    inventory.add(ResourceType.Fertilizer, 0.025, 100);
    const recipe = getRecipe(RecipeName.GrowGrain);

    expect(calculateRecipeInputQ(recipe, inventory, 1, [])).toBeCloseTo((2 + 4) / 2);
    const inputQ = calculateRecipeInputQ(recipe, inventory);
    expect(inputQ).not.toBeNull();
    expect(inputQ).toBeCloseTo((0.95 * 2 + 0.95 * 4 + 0.025 * 100) / (0.95 + 0.95 + 0.025));
    const weightedInputQ = inputQ!;
    expect(calculateOutputQuality({ researchMaxQ: 20, weightedInputQ: weightedInputQ }).outputQ).toBeCloseTo(weightedInputQ + 1);
    expect(calculateOutputQuality({ researchMaxQ: 3, weightedInputQ: weightedInputQ }).outputQ).toBe(3);
    expect(calculateOutputQuality({ researchMaxQ: 20, weightedInputQ: weightedInputQ, upgradeMaxQ: 2 }).outputQ).toBe(2);
    expect(calculateOutputQuality({ researchMaxQ: 20, weightedInputQ: weightedInputQ, upgradeMaxQ: 20, productionMaxQ: 2 }).outputQ).toBe(2);
  });

  it('carries direct material source cost into completed output', () => {
    const { facilities } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    const inventory = new Inventory();
    const recipe = getRecipe(RecipeName.GrowGrain);
    for (const input of recipe.inputs) inventory.add(input.resourceType, input.amount, 1, 2);

    const inputSourceCost = 2 * recipe.inputs.filter((input) => !input.optional).reduce((total, input) => total + input.amount, 0);
    expect(calculateRecipeInputSourceCost(recipe, inventory, 1, [])).toBeCloseTo(inputSourceCost);
    advanceAllFacilityProduction(facilities, inventory, () => recipe.requiredWork);

    const totalOutput = recipe.outputs.reduce((total, output) => total + output.amount, 0);
    expect(inventory.getEntry(ResourceType.Grain).sourceCostPerUnit).toBeCloseTo(inputSourceCost / totalOutput);
  });

  it('adds production-caused cash and repair-resource wear to output source cost', () => {
    const { facilities, facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    const inventory = new Inventory();
    const market = new Market();
    const recipe = getRecipe(RecipeName.GrowGrain);
    for (const input of recipe.inputs) inventory.add(input.resourceType, input.amount, 1, 2);

    const inputSourceCost = 2 * recipe.inputs.filter((input) => !input.optional).reduce((total, input) => total + input.amount, 0);
    const maintenanceCost = calculateFacilityProductionMaintenanceCost(facility.getView(), recipe, market);
    const outputs = advanceAllFacilityProduction(facilities, inventory, () => recipe.requiredWork, undefined, undefined, (view, completedRecipe) => calculateFacilityProductionMaintenanceCost(view, completedRecipe, market));

    expect(outputs[0]?.sourceCostPerUnit).toBeCloseTo((inputSourceCost + maintenanceCost) / outputs[0]!.amount);
  });

  it('retains the consumed input quality when inventory changes before completion', () => {
    const { facilities, facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.upgradeQuality();
    const inventory = new Inventory();
    addRecipeInputs(inventory, RecipeName.GrowGrain, 1);

    advanceAllFacilityProduction(facilities, inventory, () => 0.03);
    inventory.add(ResourceType.Water, 1, 100);

    const outputs = advanceAllFacilityProduction(
      facilities,
      inventory,
      () => getRecipe(RecipeName.GrowGrain).requiredWork,
      undefined,
      (_facilityView, _output, weightedInputQ, upgradeMaxQ) => calculateOutputQuality({
        weightedInputQ,
        researchMaxQ: 100,
        upgradeMaxQ,
        productionMaxQ: 100,
      }),
    );

    expect(facility.getView().recipeInputQ).toBeNull();
    expect(outputs[0]?.quality).toBeCloseTo(2);
  });

  it('runs repeated recipes in a configured cycle before returning to the start', () => {
    const { facilities, facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.setProductionCycle([RecipeName.GrowGrain, RecipeName.GrowGrain, RecipeName.GrowSugar]);
    facility.setOptionalInputEnabled(RecipeName.GrowGrain, ResourceType.Fertilizer, false);
    facility.setOptionalInputEnabled(RecipeName.GrowSugar, ResourceType.Fertilizer, false);
    const inventory = new Inventory();
    inventory.add(ResourceType.Water, 5);
    inventory.add(ResourceType.Electricity, 2);
    inventory.add(ResourceType.Fertilizer, 0.09);

    const outputs = advanceAllFacilityProduction(facilities, inventory, () => 0.24);

    expect(outputs.map((output) => output.recipeName)).toEqual([RecipeName.GrowGrain, RecipeName.GrowGrain, RecipeName.GrowSugar]);
    expect(inventory.getAmount(ResourceType.Grain)).toBeCloseTo(2.7);
    expect(inventory.getAmount(ResourceType.Sugar)).toBeCloseTo(1.4);
    expect(inventory.getAmount(ResourceType.Water)).toBe(0);
    expect(inventory.getAmount(ResourceType.Electricity)).toBe(0);
    expect(facility.getView().activeRecipeName).toBe(RecipeName.GrowGrain);
    expect(facility.getView().productionCycleIndex).toBe(0);
  });

  it('aggregates every input across the full configured cycle for autobuy', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.setProductionCycle([RecipeName.GrowGrain, RecipeName.GrowGrain, RecipeName.GrowSugar]);

    facility.setOptionalInputEnabled(RecipeName.GrowGrain, ResourceType.Fertilizer, false);
    facility.setOptionalInputEnabled(RecipeName.GrowSugar, ResourceType.Fertilizer, false);
    expect(getFacilityProductionCycleInputs(facility.getView())).toEqual([
      { resourceType: ResourceType.Water, amount: 5 },
      { resourceType: ResourceType.Electricity, amount: 2 },
    ]);
  });

  it('grants and output-upgrades every configured recipe output', () => {
    const recipe = getRecipe(RecipeName.GrowGrain);
    const originalOutputs = recipe.outputs;
    recipe.outputs = [
      originalOutputs[0],
      { resourceType: ResourceType.Water, amount: 0.25 },
    ];

    try {
      const { facilities, facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
      facility.upgradeOutput();
      const inventory = new Inventory();
      addRecipeInputs(inventory, RecipeName.GrowGrain, 1);

      const outputs = advanceAllFacilityProduction(facilities, inventory, () => recipe.requiredWork);

      expect(outputs).toHaveLength(2);
      expect(inventory.getAmount(ResourceType.Grain)).toBeCloseTo(originalOutputs[0].amount * facility.getView().outputMultiplier);
      expect(inventory.getAmount(ResourceType.Water)).toBeCloseTo(0.25 * facility.getView().outputMultiplier);
    } finally {
      recipe.outputs = originalOutputs;
    }
  });

  it('completes the expected number of fully staffed Grain cycles in one minute', () => {
    const { facilities } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    const inventory = new Inventory();
    addRecipeInputs(inventory, RecipeName.GrowGrain, 20);

    const outputs = advanceAllFacilityProduction(
      facilities,
      inventory,
      (facility) => calculateFacilityEffectiveWork(facility, 1),
    );

    expect(outputs).toHaveLength(20);
    expect(inventory.getAmount(ResourceType.Grain)).toBeCloseTo(getRecipe(RecipeName.GrowGrain).outputs[0].amount * 20);
    expect(inventory.getAmount(ResourceType.Water)).toBe(0);
    expect(inventory.getAmount(ResourceType.Electricity)).toBe(0);
  });

  it('retains partial progress after inputs have been paid', () => {
    const { facilities, facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    const inventory = new Inventory();
    addRecipeInputs(inventory, RecipeName.GrowGrain, 1);

    advanceAllFacilityProduction(facilities, inventory, () => 0.03);

    expect(facility.getView().recipeProgress[RecipeName.GrowGrain]).toBeCloseTo(0.03);
    expect(inventory.getAmount(ResourceType.Water)).toBe(0);
    expect(inventory.getAmount(ResourceType.Electricity)).toBe(0);

    const outputs = advanceAllFacilityProduction(facilities, inventory, () => 0.03);

    expect(outputs).toHaveLength(1);
    expect(inventory.getAmount(ResourceType.Grain)).toBe(getRecipe(RecipeName.GrowGrain).outputs[0].amount);
  });

  it('reports recipe inputs when a production cycle begins', () => {
    const { facilities } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    const inventory = new Inventory();
    addRecipeInputs(inventory, RecipeName.GrowGrain, 1);
    const consumed = [] as Array<{ resourceType: ResourceType; amount: number }>;

    advanceAllFacilityProduction(facilities, inventory, () => 0.03, (input) => consumed.push(input));

    expect(consumed).toEqual(getFacilityRecipeInputPlan(getRecipe(RecipeName.GrowGrain), 1, []).inputs);
  });

  it('applies the output upgrade when a cycle completes', () => {
    const { facilities, facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.upgradeOutput();
    facility.setAssignedWorkers(facility.getView().requiredWorkers);
    const inventory = new Inventory();
    addRecipeInputs(inventory, RecipeName.GrowGrain, 1);

    const outputs = advanceAllFacilityProduction(
      facilities,
      inventory,
      () => getRecipe(RecipeName.GrowGrain).requiredWork,
    );

    expect(outputs).toHaveLength(1);
    expect(outputs[0]!.amount).toBeCloseTo(getRecipe(RecipeName.GrowGrain).outputs[0].amount * facility.getView().outputMultiplier);
    expect(inventory.getAmount(ResourceType.Grain)).toBeCloseTo(getRecipe(RecipeName.GrowGrain).outputs[0].amount * facility.getView().outputMultiplier);
  });

  it('adds completed recipe output at the supplied production quality', () => {
    const { facilities } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    const inventory = new Inventory();
    addRecipeInputs(inventory, RecipeName.GrowGrain, 1);

    const outputs = advanceAllFacilityProduction(
      facilities,
      inventory,
      () => getRecipe(RecipeName.GrowGrain).requiredWork,
      undefined,
      () => calculateOutputQuality({ researchMaxQ: 2, upgradeMaxQ: 2, productionMaxQ: 2 }),
    );

    expect(outputs[0]!.quality).toBe(2);
    expect(inventory.getQuality(ResourceType.Grain)).toBe(2);
  });

  it('turns Premium Cake inputs into Cake with its post-ceiling quality bonus', () => {
    const { facilities } = createActiveFacility(FacilityType.Bakery, RecipeName.BakePremiumCake);
    const inventory = new Inventory();
    addRecipeInputs(inventory, RecipeName.BakePremiumCake, 1);

    const outputs = advanceAllFacilityProduction(
      facilities,
      inventory,
      () => getRecipe(RecipeName.BakePremiumCake).requiredWork,
      undefined,
      (_facilityView, output, weightedInputQ, upgradeMaxQ) => calculateOutputQuality({
        weightedInputQ,
        researchMaxQ: 3,
        upgradeMaxQ,
        productionMaxQ: 3,
        staffMaxQ: 3,
        outputBonusQ: output.outputBonusQ,
      }),
    );

    expect(outputs).toHaveLength(1);
    expect(outputs[0]).toMatchObject({ resourceType: ResourceType.Cake, quality: 2 });
    expect(inventory.getQuality(ResourceType.Cake)).toBe(2);
  });

});
