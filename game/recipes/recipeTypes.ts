import type { ResourceType } from '../resources/resourceTypes';

/** Recipe identifiers for the initial Grain-to-Bread production chain. */
export enum RecipeName {
  GrowGrain = 'grow-grain',
  BakeBread = 'bake-bread',
  ProduceWater = 'produce-water',
  ProduceElectricity = 'produce-electricity',
  GrowSugar = 'grow-sugar',
  MineCoal = 'mine-coal',
  BakeCake = 'bake-cake',
  ManualPumping = 'manual-pumping',
  ElectricPumping = 'electric-pumping',
  CoalPower = 'coal-power',
  SolarPower = 'solar-power',
}

export type RecipeInput = {
  resourceType: ResourceType;
  amount: number;
};

export type RecipeOutput = {
  resourceType: ResourceType;
  amount: number;
};

export type Recipe = {
  name: RecipeName;
  inputs: readonly RecipeInput[];
  output: RecipeOutput;
  /** Deterministic work units required for one production cycle. */
  workAmount: number;
};
