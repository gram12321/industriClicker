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
    requiredWork: 0.05,
  },
  [RecipeName.BakeBread]: {
    name: RecipeName.BakeBread,
    inputs: [
      { resourceType: ResourceType.Grain, amount: 2 },
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 1 },
    ],
    output: { resourceType: ResourceType.Bread, amount: 1 },
    requiredWork: 10,
  },
  [RecipeName.ProduceWater]: {
    name: RecipeName.ProduceWater,
    inputs: [],
    output: { resourceType: ResourceType.Water, amount: 1 },
    requiredWork: 5,
  },
  [RecipeName.ProduceElectricity]: {
    name: RecipeName.ProduceElectricity,
    inputs: [],
    output: { resourceType: ResourceType.Electricity, amount: 1 },
    requiredWork: 5,
  },
  [RecipeName.GrowSugar]: {
    name: RecipeName.GrowSugar,
    inputs: [{ resourceType: ResourceType.Water, amount: 4 }],
    output: { resourceType: ResourceType.Sugar, amount: 1 },
    requiredWork: 3,
  },
  [RecipeName.MineIron]: {
    name: RecipeName.MineIron,
    inputs: [
      { resourceType: ResourceType.Water, amount: 2 },
      { resourceType: ResourceType.Electricity, amount: 4 },
    ],
    output: { resourceType: ResourceType.Iron, amount: 1 },
    requiredWork: 5,
  },
  [RecipeName.MineCoal]: {
    name: RecipeName.MineCoal,
    inputs: [
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 2 },
    ],
    output: { resourceType: ResourceType.Coal, amount: 2 },
    requiredWork: 3,
  },
  [RecipeName.MineCopper]: {
    name: RecipeName.MineCopper,
    inputs: [
      { resourceType: ResourceType.Water, amount: 2 },
      { resourceType: ResourceType.Electricity, amount: 5 },
    ],
    output: { resourceType: ResourceType.Copper, amount: 1 },
    requiredWork: 6,
  },
  [RecipeName.QuarrySand]: {
    name: RecipeName.QuarrySand,
    inputs: [
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 1 },
    ],
    output: { resourceType: ResourceType.Sand, amount: 3 },
    requiredWork: 2,
  },
  [RecipeName.QuarryClay]: {
    name: RecipeName.QuarryClay,
    inputs: [
      { resourceType: ResourceType.Water, amount: 2 },
      { resourceType: ResourceType.Electricity, amount: 1 },
    ],
    output: { resourceType: ResourceType.Clay, amount: 2 },
    requiredWork: 3,
  },
  [RecipeName.QuarryStone]: {
    name: RecipeName.QuarryStone,
    inputs: [
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 4 },
    ],
    output: { resourceType: ResourceType.Stone, amount: 1 },
    requiredWork: 5,
  },
  [RecipeName.ProduceSteel]: {
    name: RecipeName.ProduceSteel,
    inputs: [
      { resourceType: ResourceType.Iron, amount: 2 },
      { resourceType: ResourceType.Coal, amount: 1 },
      { resourceType: ResourceType.Water, amount: 2 },
      { resourceType: ResourceType.Electricity, amount: 6 },
    ],
    output: { resourceType: ResourceType.Steel, amount: 2 },
    requiredWork: 8,
  },
  [RecipeName.ProduceElectricCircuits]: {
    name: RecipeName.ProduceElectricCircuits,
    inputs: [
      { resourceType: ResourceType.Sand, amount: 2 },
      { resourceType: ResourceType.Copper, amount: 2 },
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 4 },
    ],
    output: { resourceType: ResourceType.ElectricCircuits, amount: 1 },
    requiredWork: 10,
  },
  [RecipeName.ProduceBricks]: {
    name: RecipeName.ProduceBricks,
    inputs: [
      { resourceType: ResourceType.Clay, amount: 2 },
      { resourceType: ResourceType.Sand, amount: 1 },
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 3 },
    ],
    output: { resourceType: ResourceType.Bricks, amount: 4 },
    requiredWork: 4,
  },
  [RecipeName.ProduceCement]: {
    name: RecipeName.ProduceCement,
    inputs: [
      { resourceType: ResourceType.Stone, amount: 3 },
      { resourceType: ResourceType.Clay, amount: 1 },
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 5 },
    ],
    output: { resourceType: ResourceType.Cement, amount: 2 },
    requiredWork: 6,
  },
  [RecipeName.ProduceReinforcedConcrete]: {
    name: RecipeName.ProduceReinforcedConcrete,
    inputs: [
      { resourceType: ResourceType.Cement, amount: 2 },
      { resourceType: ResourceType.Sand, amount: 3 },
      { resourceType: ResourceType.Stone, amount: 2 },
      { resourceType: ResourceType.Steel, amount: 2 },
      { resourceType: ResourceType.Water, amount: 2 },
      { resourceType: ResourceType.Electricity, amount: 2 },
    ],
    output: { resourceType: ResourceType.ReinforcedConcrete, amount: 2 },
    requiredWork: 8,
  },
  [RecipeName.ProduceConstructionMaterials]: {
    name: RecipeName.ProduceConstructionMaterials,
    inputs: [
      { resourceType: ResourceType.Bricks, amount: 4 },
      { resourceType: ResourceType.ReinforcedConcrete, amount: 2 },
      { resourceType: ResourceType.Steel, amount: 2 },
      { resourceType: ResourceType.Sand, amount: 2 },
      { resourceType: ResourceType.Cement, amount: 2 },
      { resourceType: ResourceType.Electricity, amount: 3 },
    ],
    output: { resourceType: ResourceType.ConstructionMaterials, amount: 1 },
    requiredWork: 10,
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
    requiredWork: 15,
  },
  [RecipeName.ManualPumping]: {
    name: RecipeName.ManualPumping,
    inputs: [],
    output: { resourceType: ResourceType.Water, amount: 1 },
    requiredWork: 1,
  },
  [RecipeName.ElectricPumping]: {
    name: RecipeName.ElectricPumping,
    inputs: [{ resourceType: ResourceType.Electricity, amount: 1 }],
    output: { resourceType: ResourceType.Water, amount: 5 },
    requiredWork: 0.5,
  },
  [RecipeName.CoalPower]: {
    name: RecipeName.CoalPower,
    inputs: [
      { resourceType: ResourceType.Coal, amount: 1 },
      { resourceType: ResourceType.Water, amount: 2 },
    ],
    output: { resourceType: ResourceType.Electricity, amount: 10 },
    requiredWork: 5,
  },
  [RecipeName.SolarPower]: {
    name: RecipeName.SolarPower,
    inputs: [],
    output: { resourceType: ResourceType.Electricity, amount: 1 },
    requiredWork: 10,
  },
};

export function getRecipe(recipeName: RecipeName): Recipe {
  return ALL_RECIPES[recipeName];
}
