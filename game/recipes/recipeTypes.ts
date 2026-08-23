import type { ResourceType } from '../resources/resourceTypes';

export enum RecipeName {
  GrowGrain = 'grow-grain',
  BakeBread = 'bake-bread',
  ProduceWater = 'produce-water',
  ProduceElectricity = 'produce-electricity',
  GrowSugar = 'grow-sugar',
  GrowFruit = 'grow-fruit',
  RaiseCattle = 'raise-cattle',
  RaiseSheep = 'raise-sheep',
  RaiseChicken = 'raise-chicken',
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
  SynthesizeFertilizer = 'synthesize-fertilizer',
  ProducePlastic = 'produce-plastic',
  ProduceSilicon = 'produce-silicon',
  ProduceAdvancedComponents = 'produce-advanced-components',
  AssembleIndustrialMachines = 'assemble-industrial-machines',
  ProduceBricks = 'produce-bricks',
  ProduceCement = 'produce-cement',
  ProduceReinforcedConcrete = 'produce-reinforced-concrete',
  ProduceConstructionMaterials = 'produce-construction-materials',
  BakeCake = 'bake-cake',
  BakePremiumCake = 'bake-premium-cake',
  BakeMeatPie = 'bake-meat-pie',
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
  /** Quality added after normal production ceilings are resolved. */
  outputBonusQ?: number;
};

export type Recipe = {
  name: RecipeName;
  inputs: readonly RecipeInput[];
  /** Every resource produced by one completed cycle. */
  outputs: readonly [RecipeOutput, ...RecipeOutput[]];
  /** Deterministic work units required for one production cycle. */
  requiredWork: number;
  /** Static balance multiplier for production wear; it never follows live market prices. */
  conditionWearMultiplier: number;
};
