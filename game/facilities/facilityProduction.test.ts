import { describe, expect, it } from 'vitest';
import { Inventory } from '../inventory';
import { getRecipe, RecipeName } from '../recipes';
import { ResourceType } from '../resources';
import { FacilityCollection } from './facilityCollection';
import { advanceAllFacilityProduction, calculateFacilityEffectiveWork, getRecipeProductionConditionLoss } from './facilityProduction';
import { FacilityType } from './facilityTypes';

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

describe('advanceAllFacilityProduction', () => {
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
    expect(inventory.getAmount(ResourceType.Grain)).toBeCloseTo(getRecipe(RecipeName.GrowGrain).output.amount * 20);
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
    expect(inventory.getAmount(ResourceType.Grain)).toBe(getRecipe(RecipeName.GrowGrain).output.amount);
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
    expect(outputs[0]!.amount).toBeCloseTo(getRecipe(RecipeName.GrowGrain).output.amount * facility.getView().outputMultiplier);
    expect(inventory.getAmount(ResourceType.Grain)).toBeCloseTo(getRecipe(RecipeName.GrowGrain).output.amount * facility.getView().outputMultiplier);
  });
});
