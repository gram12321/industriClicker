import { describe, expect, it } from 'vitest';
import { Inventory } from '@/game/inventory';
import { FacilityCollection, FacilityType, advanceAllFacilityProduction, getFacilityRecipeInputPlan } from '@/game/facilities';
import { getRecipe, RecipeName } from '@/game/recipes';
import { ResourceType } from '@/game/resources';

function createFarm() {
  const facilities = new FacilityCollection();
  facilities.build(FacilityType.Farm);
  const facility = facilities.getAllByType(FacilityType.Farm)[0]!;
  facility.setActiveRecipe(RecipeName.GrowGrain);
  return { facilities, facility };
}

function addRequiredInputs(inventory: Inventory): void {
  inventory.add(ResourceType.Water, 1);
  inventory.add(ResourceType.Electricity, 1);
}

describe('optional recipe inputs', () => {
  it('uses an enabled optional input only when its full amount is available', () => {
    const { facilities, facility } = createFarm();
    const inventory = new Inventory();
    addRequiredInputs(inventory);
    inventory.add(ResourceType.Fertilizer, 0.025);

    const outputs = advanceAllFacilityProduction(facilities, inventory, () => getRecipe(RecipeName.GrowGrain).requiredWork);

    expect(outputs[0]?.amount).toBeCloseTo(getRecipe(RecipeName.GrowGrain).outputs[0].amount * 1.1);
    expect(outputs[0]?.quality).toBeCloseTo(2);
    expect(inventory.getAmount(ResourceType.Water)).toBeCloseTo(0.05);
    expect(inventory.getAmount(ResourceType.Electricity)).toBeCloseTo(0.05);
    expect(inventory.getAmount(ResourceType.Fertilizer)).toBeCloseTo(0);
    expect(facility.getView().recipeInputEffects).toBeNull();
  });

  it('can disable an optional input without changing required recipe availability', () => {
    const { facilities, facility } = createFarm();
    expect(facility.setOptionalInputEnabled(RecipeName.GrowGrain, ResourceType.Fertilizer, false)).toBe(true);
    const inventory = new Inventory();
    addRequiredInputs(inventory);
    inventory.add(ResourceType.Fertilizer, 0.025);

    const plan = getFacilityRecipeInputPlan(getRecipe(RecipeName.GrowGrain), 1, facility.getView().optionalInputSettings[RecipeName.GrowGrain]);
    expect(plan.optionalInputs).toHaveLength(0);
    expect(plan.requiredInputs.map((input) => input.amount)).toEqual([1, 1]);

    const outputs = advanceAllFacilityProduction(facilities, inventory, () => getRecipe(RecipeName.GrowGrain).requiredWork);
    expect(outputs[0]?.amount).toBeCloseTo(getRecipe(RecipeName.GrowGrain).outputs[0].amount);
    expect(outputs[0]?.quality).toBeCloseTo(1);
    expect(inventory.getAmount(ResourceType.Fertilizer)).toBeCloseTo(0.025);
  });
});
