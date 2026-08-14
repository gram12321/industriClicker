import type { ResourceType } from '../resources/resourceTypes';

export enum RecipeName {
  GrowGrain = 'grow-grain',
  BakeBread = 'bake-bread',
  ProduceWater = 'produce-water',
  ProduceElectricity = 'produce-electricity',
  GrowSugar = 'grow-sugar',
  MineIron = 'mine-iron',
  MineCoal = 'mine-coal',
  MineCopper = 'mine-copper',
  QuarrySand = 'quarry-sand',
  QuarryClay = 'quarry-clay',
  QuarryStone = 'quarry-stone',
  QuarryMinerals = 'quarry-minerals',
  MineGold = 'mine-gold',
  ProduceSteel = 'produce-steel',
  ProduceElectricCircuits = 'produce-electric-circuits',
  ProduceChemicals = 'produce-chemicals',
  ProducePlastic = 'produce-plastic',
  ProduceSilicon = 'produce-silicon',
  ProduceAdvancedComponents = 'produce-advanced-components',
  AssembleIndustrialMachines = 'assemble-industrial-machines',
  ProduceBricks = 'produce-bricks',
  ProduceCement = 'produce-cement',
  ProduceReinforcedConcrete = 'produce-reinforced-concrete',
  ProduceConstructionMaterials = 'produce-construction-materials',
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
  requiredWork: number;
  /** Static balance multiplier for production wear; it never follows live market prices. */
  conditionWearMultiplier: number;
};
