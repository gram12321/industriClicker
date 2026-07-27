import type { ResourceType } from '../resources/resourceTypes';

/** Reserved recipe identifiers for the initial Grain-to-Bread production chain. */
export enum RecipeName {
  GrowGrain = 'grow-grain',
  BakeBread = 'bake-bread',
}

export type RecipeInput = {
  resourceType: ResourceType;
  amount: number;
};

export type RecipeOutput = {
  resourceType: ResourceType;
  amount: number;
};

/**
 * Recipe rules will be registered once their inputs, output amounts, work, and
 * unlock conditions have been approved.
 */
export type Recipe = {
  name: RecipeName;
  inputs: readonly RecipeInput[];
  output: RecipeOutput;
};
