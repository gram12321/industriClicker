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
  ForestManagement = 'forest-management',
  MillTimber = 'mill-timber',
  AssembleFurniture = 'assemble-furniture',
  ProduceSyntheticLeather = 'produce-synthetic-leather',
  ProduceHouseholdCleaningProducts = 'produce-household-cleaning-products',
  ProducePaintHomeCoatings = 'produce-paint-home-coatings',
  ProduceGardenSupplies = 'produce-garden-supplies',
  ProduceDisplayPanels = 'produce-display-panels',
  ProducePersonalElectronics = 'produce-personal-electronics',
  AssembleHouseholdAppliances = 'assemble-household-appliances',
}

export type RecipeInput = {
  resourceType: ResourceType;
  amount: number;
  /** Optional inputs never stall a recipe and are consumed only when enabled and available. */
  optional?: boolean;
  /** Optional inputs sharing a group are mutually exclusive; at most one is consumed per cycle. */
  optionalGroup?: string;
  /** Effects applied when this optional input is consumed for a cycle. */
  effects?: RecipeInputEffects;
};

export type RecipeInputEffects = {
  /** Added after the normal output-quality ceiling is resolved. */
  qualityBoost?: number;
  /** Multiplies every recipe output quantity. */
  outputMultiplier?: number;
  /** Multiplies the other required inputs for this cycle. */
  inputMultiplier?: number;
};

export type RecipeOutput = {
  resourceType: ResourceType;
  amount: number;
  /** Optional independent work requirement for this output. Async outputs are supported only by no-input recipes. */
  requiredWork?: number;
  /** Quality added after normal production ceilings are resolved. */
  outputBonusQ?: number;
  /** Multiplies quality after the normal ceiling and additive bonuses are applied. */
  outputQualityMultiplier?: number;
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
