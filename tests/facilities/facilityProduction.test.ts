import { describe, expect, it } from 'vitest';
import { Inventory } from '@/game/inventory';
import { Finance } from '@/game/finance';
import { getRecipe, RecipeName } from '@/game/recipes';
import { ResourceType } from '@/game/resources';
import { FacilityCollection } from '@/game/facilities/facilityCollection';
import {
  calculateFacilityDecayMaterialCostPerMinute,
  calculateFacilityNetGainPerMinute,
  calculateFacilityResourcePayment,
  calculateRecipeValuePerMinute,
} from '@/game/facilities/facilityEconomics';
import { advanceAllFacilityProduction, calculateFacilityEffectiveWork, calculateRecipeInputQ, getFacilityProductionCycleInputs, getRecipeProductionConditionLoss } from '@/game/facilities/facilityProduction';
import { calculateOutputQuality, calculateProductionMaxQ } from '@/game/quality';
import { Market } from '@/game/market';
import { FacilityType } from '@/game/facilities/facilityTypes';

function createActiveFacility(facilityType: FacilityType, recipeName: RecipeName) {
  const facilities = new FacilityCollection();
  facilities.build(facilityType);
  const facility = facilities.getAllByType(facilityType)[0]!;
  facility.setActiveRecipe(recipeName);

  return { facilities, facility };
}

function addRecipeInputs(inventory: Inventory, recipeName: RecipeName, cycleCount: number): void {
  for (const input of getRecipe(recipeName).inputs) {
    inventory.add(input.resourceType, input.amount * cycleCount);
  }
}

describe('calculateFacilityEffectiveWork', () => {
  it('adds the fully staffed workforce contribution to base work', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);

    expect(calculateFacilityEffectiveWork(facility.getView(), 1)).toBeCloseTo(1.2);
  });

  it('reduces only the workforce contribution when understaffed', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.setAssignedWorkers(1);
    const view = facility.getView();

    expect(calculateFacilityEffectiveWork(view, 1)).toBeCloseTo(1 + 0.2 * view.staffingEfficiency);
  });

  it('applies condition, speed, and research to the combined work', () => {
    const { facility } = createActiveFacility(FacilityType.Farm, RecipeName.GrowGrain);
    facility.upgradeSpeed();
    facility.setAssignedWorkers(facility.getView().requiredWorkers);
    facility.applyConditionLoss(0.4);
    const view = facility.getView();

    const expectedWork = (1 + view.requiredWorkers * 0.1)
      * view.conditionEfficiency
      * view.speedUpgradeWorkSpeedMultiplier
      * 1.5;

    expect(calculateFacilityEffectiveWork(view, 1, 1.5)).toBeCloseTo(expectedWork);
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
  it('keeps displayed net gain aligned with recipe value and repair-material decay', () => {
    const market = new Market();
    const recipe = getRecipe(RecipeName.GrowGrain);
    const valuePerMinute = calculateRecipeValuePerMinute(recipe, market, 1, 1.2);
    const decayMaterialCost = calculateFacilityDecayMaterialCostPerMinute(100, 1, 1, 1.2, recipe);

    expect(valuePerMinute).toBeGreaterThan(0);
    expect(decayMaterialCost).toBeGreaterThan(0);
    expect(calculateFacilityNetGainPerMinute(valuePerMinute, decayMaterialCost, market)).toBeLessThan(valuePerMinute);
  });
});

describe('advanceAllFacilityProduction', () => {
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

    const inputQ = calculateRecipeInputQ(recipe, inventory);
    expect(inputQ).toBeCloseTo((2 + 4 + 0.025 * 100) / 2.025);
    expect(calculateOutputQuality({ researchMaxQ: 20, weightedInputQ: inputQ }).outputQ).toBeCloseTo(5.197531);
    expect(calculateOutputQuality({ researchMaxQ: 3, weightedInputQ: inputQ }).outputQ).toBe(3);
    expect(calculateOutputQuality({ researchMaxQ: 20, weightedInputQ: inputQ, upgradeMaxQ: 2 }).outputQ).toBe(2);
    expect(calculateOutputQuality({ researchMaxQ: 20, weightedInputQ: inputQ, upgradeMaxQ: 20, productionMaxQ: 2 }).outputQ).toBe(2);
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
      (_resourceType, weightedInputQ, upgradeMaxQ) => calculateOutputQuality({
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

    expect(getFacilityProductionCycleInputs(facility.getView())).toEqual([
      { resourceType: ResourceType.Water, amount: 5 },
      { resourceType: ResourceType.Electricity, amount: 2 },
      { resourceType: ResourceType.Fertilizer, amount: 0.09 },
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

    expect(consumed).toEqual(getRecipe(RecipeName.GrowGrain).inputs);
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

});
