import { ResourceType } from '../resources/resourceTypes';
import { Recipe, RecipeName } from './recipeTypes';

export const ALL_RECIPES: Readonly<Record<RecipeName, Recipe>> = {
  [RecipeName.GrowGrain]: {
    name: RecipeName.GrowGrain,
    inputs: [
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 1 },
    ],
    output: { resourceType: ResourceType.Grain, amount: 1 },
    workAmount: 5,
  },
  [RecipeName.BakeBread]: {
    name: RecipeName.BakeBread,
    inputs: [
      { resourceType: ResourceType.Grain, amount: 2 },
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 1 },
    ],
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
  [RecipeName.GrowSugar]: {
    name: RecipeName.GrowSugar,
    inputs: [{ resourceType: ResourceType.Water, amount: 4 }],
    output: { resourceType: ResourceType.Sugar, amount: 1 },
    workAmount: 3,
  },
  [RecipeName.MineIron]: {
    name: RecipeName.MineIron,
    inputs: [
      { resourceType: ResourceType.Water, amount: 2 },
      { resourceType: ResourceType.Electricity, amount: 4 },
    ],
    output: { resourceType: ResourceType.Iron, amount: 1 },
    workAmount: 5,
  },
  [RecipeName.MineCoal]: {
    name: RecipeName.MineCoal,
    inputs: [
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 2 },
    ],
    output: { resourceType: ResourceType.Coal, amount: 2 },
    workAmount: 3,
  },
  [RecipeName.MineCopper]: {
    name: RecipeName.MineCopper,
    inputs: [
      { resourceType: ResourceType.Water, amount: 2 },
      { resourceType: ResourceType.Electricity, amount: 5 },
    ],
    output: { resourceType: ResourceType.Copper, amount: 1 },
    workAmount: 6,
  },
  [RecipeName.QuarrySand]: {
    name: RecipeName.QuarrySand,
    inputs: [
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 1 },
    ],
    output: { resourceType: ResourceType.Sand, amount: 3 },
    workAmount: 2,
  },
  [RecipeName.QuarryClay]: {
    name: RecipeName.QuarryClay,
    inputs: [
      { resourceType: ResourceType.Water, amount: 2 },
      { resourceType: ResourceType.Electricity, amount: 1 },
    ],
    output: { resourceType: ResourceType.Clay, amount: 2 },
    workAmount: 3,
  },
  [RecipeName.QuarryStone]: {
    name: RecipeName.QuarryStone,
    inputs: [
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 4 },
    ],
    output: { resourceType: ResourceType.Stone, amount: 1 },
    workAmount: 5,
  },
  [RecipeName.BakeCake]: {
    name: RecipeName.BakeCake,
    inputs: [
      { resourceType: ResourceType.Grain, amount: 1 },
      { resourceType: ResourceType.Sugar, amount: 0.5 },
      { resourceType: ResourceType.Electricity, amount: 2 },
      { resourceType: ResourceType.Water, amount: 2 },
    ],
    output: { resourceType: ResourceType.Cake, amount: 1 },
    workAmount: 15,
  },
  [RecipeName.ManualPumping]: {
    name: RecipeName.ManualPumping,
    inputs: [],
    output: { resourceType: ResourceType.Water, amount: 1 },
    workAmount: 1,
  },
  [RecipeName.ElectricPumping]: {
    name: RecipeName.ElectricPumping,
    inputs: [{ resourceType: ResourceType.Electricity, amount: 1 }],
    output: { resourceType: ResourceType.Water, amount: 5 },
    workAmount: 0.5,
  },
  [RecipeName.CoalPower]: {
    name: RecipeName.CoalPower,
    inputs: [
      { resourceType: ResourceType.Coal, amount: 1 },
      { resourceType: ResourceType.Water, amount: 2 },
    ],
    output: { resourceType: ResourceType.Electricity, amount: 10 },
    workAmount: 5,
  },
  [RecipeName.SolarPower]: {
    name: RecipeName.SolarPower,
    inputs: [],
    output: { resourceType: ResourceType.Electricity, amount: 1 },
    workAmount: 10,
  },
};

export function getRecipe(recipeName: RecipeName): Recipe {
  return ALL_RECIPES[recipeName];
}
