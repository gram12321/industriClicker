/**
 * The closed catalogue of resources currently available in Industri Clicker.
 *
 * Enum values are stable machine identifiers so future local-save snapshots do
 * not depend on player-facing display names.
 */
export enum ResourceType {
  Grain = 'grain',
  Bread = 'bread',
  Water = 'water',
  Electricity = 'electricity',
  Sugar = 'sugar',
  Coal = 'coal',
  Iron = 'iron',
  Copper = 'copper',
  Steel = 'steel',
  ElectricCircuits = 'electric-circuits',
  Bricks = 'bricks',
  Cement = 'cement',
  ReinforcedConcrete = 'reinforced-concrete',
  ConstructionMaterials = 'construction-materials',
  Sand = 'sand',
  Clay = 'clay',
  Stone = 'stone',
  Minerals = 'minerals',
  Chemicals = 'chemicals',
  Fertilizer = 'fertilizer',
  Plastic = 'plastic',
  Silicon = 'silicon',
  Gold = 'gold',
  AdvancedComponents = 'advanced-components',
  IndustrialMachines = 'industrial-machines',
  Cake = 'cake',
  Eggs = 'eggs',
  Fruit = 'fruit',
  Meat = 'meat',
  MeatPie = 'meat-pie',
  Milk = 'milk',
  Timber = 'timber',
  Wool = 'wool',
}

/** Market seed values owned by each resource's code catalogue entry. */
export type ResourceMarketDefinition = {
  localBenchmarkSupply: number;
  localInitialSupply: number;
  regionalBenchmarkSupply: number;
  regionalInitialSupply: number;
  globalBenchmarkSupply: number;
  globalInitialSupply: number;
  /** Physical shipping, storage, and market-network constraints. */
  logisticsMultiplier: number;
  /** Economic value density relative to the cost of moving the resource. */
  valueDensityMultiplier: number;
};
