import { ResourceType } from '../resources/resourceTypes';
import { Recipe, RecipeName } from './recipeTypes';

export const ALL_RECIPES: Readonly<Record<RecipeName, Recipe>> = {
  [RecipeName.GrowGrain]: {
    name: RecipeName.GrowGrain,
    inputs: [],
    output: { resourceType: ResourceType.Grain, amount: 1 },
    workAmount: 5,
  },
  [RecipeName.BakeBread]: {
    name: RecipeName.BakeBread,
    inputs: [{ resourceType: ResourceType.Grain, amount: 2 }],
    output: { resourceType: ResourceType.Bread, amount: 1 },
    workAmount: 10,
  },
  [RecipeName.ProduceWater]: {
    name: RecipeName.ProduceWater,
    inputs: [],
    output: { resourceType: ResourceType.Water, amount: 1 },
    workAmount: 5,
  },
  [RecipeName.ProduceElectricity]: {
    name: RecipeName.ProduceElectricity,
    inputs: [],
    output: { resourceType: ResourceType.Electricity, amount: 1 },
    workAmount: 5,
  },
};
