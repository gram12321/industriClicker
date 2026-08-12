import { ResourceType } from '../resources/resourceTypes';
import { Recipe, RecipeName } from './recipeTypes';

export const ALL_RECIPES: Readonly<Record<RecipeName, Recipe>> = {
  [RecipeName.GrowGrain]: {
    name: RecipeName.GrowGrain,
    inputs: [
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 1 },
    ],
    output: { resourceType: ResourceType.Grain, amount: 1.2 },
    requiredWork: 0.06,
    conditionWearMultiplier: 0.75,
  },
  [RecipeName.BakeBread]: {
    name: RecipeName.BakeBread,
    inputs: [
      { resourceType: ResourceType.Grain, amount: 1.5 },
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 1 },
    ],
    output: { resourceType: ResourceType.Bread, amount: 4.5 },
    requiredWork: 0.26,
    conditionWearMultiplier: 0.9,
  },
  [RecipeName.ProduceWater]: {
    name: RecipeName.ProduceWater,
    inputs: [],
    output: { resourceType: ResourceType.Water, amount: 2 },
    requiredWork: 0.073,
    conditionWearMultiplier: 0.5,
  },
  [RecipeName.ProduceElectricity]: {
    name: RecipeName.ProduceElectricity,
    inputs: [],
    output: { resourceType: ResourceType.Electricity, amount: 2 },
    requiredWork: 0.11,
    conditionWearMultiplier: 0.8,
  },
  [RecipeName.GrowSugar]: {
    name: RecipeName.GrowSugar,
    inputs: [{ resourceType: ResourceType.Water, amount: 3 }],
    output: { resourceType: ResourceType.Sugar, amount: 1.2 },
    requiredWork: 0.12,
    conditionWearMultiplier: 0.8,
  },
  [RecipeName.MineIron]: {
    name: RecipeName.MineIron,
    inputs: [
      { resourceType: ResourceType.Water, amount: 2 },
      { resourceType: ResourceType.Electricity, amount: 4 },
    ],
    output: { resourceType: ResourceType.Iron, amount: 1.25 },
    requiredWork: 0.267,
    conditionWearMultiplier: 1.1,
  },
  [RecipeName.MineCoal]: {
    name: RecipeName.MineCoal,
    inputs: [
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 2 },
    ],
    output: { resourceType: ResourceType.Coal, amount: 2.5 },
    requiredWork: 0.2,
    conditionWearMultiplier: 1,
  },
  [RecipeName.MineCopper]: {
    name: RecipeName.MineCopper,
    inputs: [
      { resourceType: ResourceType.Water, amount: 2 },
      { resourceType: ResourceType.Electricity, amount: 5 },
    ],
    output: { resourceType: ResourceType.Copper, amount: 1.25 },
    requiredWork: 0.333,
    conditionWearMultiplier: 1.2,
  },
  [RecipeName.QuarrySand]: {
    name: RecipeName.QuarrySand,
    inputs: [
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 1 },
    ],
    output: { resourceType: ResourceType.Sand, amount: 3 },
    requiredWork: 0.107,
    conditionWearMultiplier: 0.6,
  },
  [RecipeName.QuarryClay]: {
    name: RecipeName.QuarryClay,
    inputs: [
      { resourceType: ResourceType.Water, amount: 2 },
      { resourceType: ResourceType.Electricity, amount: 1 },
    ],
    output: { resourceType: ResourceType.Clay, amount: 2 },
    requiredWork: 0.16,
    conditionWearMultiplier: 0.7,
  },
  [RecipeName.QuarryStone]: {
    name: RecipeName.QuarryStone,
    inputs: [
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 4 },
    ],
    output: { resourceType: ResourceType.Stone, amount: 3 },
    requiredWork: 0.213,
    conditionWearMultiplier: 0.8,
  },
  [RecipeName.ProduceSteel]: {
    name: RecipeName.ProduceSteel,
    inputs: [
      { resourceType: ResourceType.Iron, amount: 2 },
      { resourceType: ResourceType.Coal, amount: 1 },
      { resourceType: ResourceType.Water, amount: 2 },
      { resourceType: ResourceType.Electricity, amount: 6 },
    ],
    output: { resourceType: ResourceType.Steel, amount: 6 },
    requiredWork: 1.1,
    conditionWearMultiplier: 1.2,
  },
  [RecipeName.ProduceElectricCircuits]: {
    name: RecipeName.ProduceElectricCircuits,
    inputs: [
      { resourceType: ResourceType.Sand, amount: 2 },
      { resourceType: ResourceType.Copper, amount: 2 },
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 4 },
    ],
    output: { resourceType: ResourceType.ElectricCircuits, amount: 5 },
    requiredWork: 1.65,
    conditionWearMultiplier: 1.4,
  },
  [RecipeName.ProduceBricks]: {
    name: RecipeName.ProduceBricks,
    inputs: [
      { resourceType: ResourceType.Clay, amount: 2 },
      { resourceType: ResourceType.Sand, amount: 1 },
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 3 },
    ],
    output: { resourceType: ResourceType.Bricks, amount: 12 },
    requiredWork: 0.65,
    conditionWearMultiplier: 0.75,
  },
  [RecipeName.ProduceCement]: {
    name: RecipeName.ProduceCement,
    inputs: [
      { resourceType: ResourceType.Stone, amount: 3 },
      { resourceType: ResourceType.Clay, amount: 1 },
      { resourceType: ResourceType.Water, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 5 },
    ],
    output: { resourceType: ResourceType.Cement, amount: 7 },
    requiredWork: 1.083,
    conditionWearMultiplier: 1,
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
    output: { resourceType: ResourceType.ReinforcedConcrete, amount: 7 },
    requiredWork: 2.6,
    conditionWearMultiplier: 1.3,
  },
  [RecipeName.ProduceConstructionMaterials]: {
    name: RecipeName.ProduceConstructionMaterials,
    inputs: [
      { resourceType: ResourceType.Bricks, amount: 2 },
      { resourceType: ResourceType.ReinforcedConcrete, amount: 1 },
      { resourceType: ResourceType.Steel, amount: 1 },
      { resourceType: ResourceType.Sand, amount: 1 },
      { resourceType: ResourceType.Cement, amount: 1 },
      { resourceType: ResourceType.Electricity, amount: 2 },
    ],
    output: { resourceType: ResourceType.ConstructionMaterials, amount: 8 },
    requiredWork: 5.2,
    conditionWearMultiplier: 1.5,
  },
  [RecipeName.BakeCake]: {
    name: RecipeName.BakeCake,
    inputs: [
      { resourceType: ResourceType.Grain, amount: 1 },
      { resourceType: ResourceType.Sugar, amount: 0.5 },
      { resourceType: ResourceType.Electricity, amount: 2 },
      { resourceType: ResourceType.Water, amount: 2 },
    ],
    output: { resourceType: ResourceType.Cake, amount: 4 },
    requiredWork: 0.39,
    conditionWearMultiplier: 1.1,
  },
  [RecipeName.ManualPumping]: {
    name: RecipeName.ManualPumping,
    inputs: [],
    output: { resourceType: ResourceType.Water, amount: 2 },
    requiredWork: 0.073,
    conditionWearMultiplier: 0.5,
  },
  [RecipeName.ElectricPumping]: {
    name: RecipeName.ElectricPumping,
    inputs: [{ resourceType: ResourceType.Electricity, amount: 1 }],
    output: { resourceType: ResourceType.Water, amount: 7 },
    requiredWork: 0.12,
    conditionWearMultiplier: 0.75,
  },
  [RecipeName.CoalPower]: {
    name: RecipeName.CoalPower,
    inputs: [
      { resourceType: ResourceType.Coal, amount: 0.5 },
      { resourceType: ResourceType.Water, amount: 1 },
    ],
    output: { resourceType: ResourceType.Electricity, amount: 6 },
    requiredWork: 0.467,
    conditionWearMultiplier: 1.1,
  },
  [RecipeName.SolarPower]: {
    name: RecipeName.SolarPower,
    inputs: [],
    output: { resourceType: ResourceType.Electricity, amount: 3 },
    requiredWork: 0.933,
    conditionWearMultiplier: 0.8,
  },
};

export const RECIPE_DISPLAY_NAMES: Readonly<Record<RecipeName, string>> = {
  [RecipeName.GrowGrain]: 'Grow Grain',
  [RecipeName.BakeBread]: 'Bake Bread',
  [RecipeName.ProduceWater]: 'Produce Water',
  [RecipeName.ProduceElectricity]: 'Produce Electricity',
  [RecipeName.GrowSugar]: 'Grow Sugar',
  [RecipeName.MineIron]: 'Mine Iron',
  [RecipeName.MineCoal]: 'Mine Coal',
  [RecipeName.MineCopper]: 'Mine Copper',
  [RecipeName.QuarrySand]: 'Quarry Sand',
  [RecipeName.QuarryClay]: 'Quarry Clay',
  [RecipeName.QuarryStone]: 'Quarry Stone',
  [RecipeName.ProduceSteel]: 'Produce Steel',
  [RecipeName.ProduceElectricCircuits]: 'Produce Electric Circuits',
  [RecipeName.ProduceBricks]: 'Produce Bricks',
  [RecipeName.ProduceCement]: 'Produce Cement',
  [RecipeName.ProduceReinforcedConcrete]: 'Produce Reinforced Concrete',
  [RecipeName.ProduceConstructionMaterials]: 'Produce Construction Materials',
  [RecipeName.BakeCake]: 'Bake Cake',
  [RecipeName.ManualPumping]: 'Manual Pumping',
  [RecipeName.ElectricPumping]: 'Electric Pumping',
  [RecipeName.CoalPower]: 'Coal Power',
  [RecipeName.SolarPower]: 'Solar Power',
};

export function getRecipeDisplayName(recipeName: RecipeName): string {
  return RECIPE_DISPLAY_NAMES[recipeName];
}

export function getRecipe(recipeName: RecipeName): Recipe {
  return ALL_RECIPES[recipeName];
}
