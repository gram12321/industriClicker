import { ResourceType, type ResourceMarketDefinition } from './resourceTypes';
import { RESOURCE_ICONS } from '@/icons';

export const RESOURCE_TYPES = [
  ResourceType.Grain,
  ResourceType.Bread,
  ResourceType.Water,
  ResourceType.Electricity,
  ResourceType.Sugar,
  ResourceType.Coal,
  ResourceType.Iron,
  ResourceType.Copper,
  ResourceType.Steel,
  ResourceType.ElectricCircuits,
  ResourceType.Bricks,
  ResourceType.Cement,
  ResourceType.ReinforcedConcrete,
  ResourceType.ConstructionMaterials,
  ResourceType.Sand,
  ResourceType.Clay,
  ResourceType.Stone,
  ResourceType.Minerals,
  ResourceType.Chemicals,
  ResourceType.Fertilizer,
  ResourceType.Plastic,
  ResourceType.Silicon,
  ResourceType.Gold,
  ResourceType.AdvancedComponents,
  ResourceType.IndustrialMachines,
  ResourceType.Cake,
  ResourceType.PremiumCake,
  ResourceType.Eggs,
  ResourceType.Fruit,
  ResourceType.Meat,
  ResourceType.MeatPie,
  ResourceType.Milk,
  ResourceType.Wool,
] as const;

export type ResourceGroup = 'food' | 'raw-resources' | 'construction' | 'manufacturing' | 'utilities';

/** Player-facing resource groupings shared by Pedia and other catalogues; each group is alphabetized by display name. */
export const RESOURCE_GROUPS: ReadonlyArray<{ id: ResourceGroup; label: string; resources: readonly ResourceType[] }> = [
  { id: 'food', label: 'Food', resources: [ResourceType.Bread, ResourceType.Cake, ResourceType.Eggs, ResourceType.Fruit, ResourceType.Grain, ResourceType.Meat, ResourceType.MeatPie, ResourceType.Milk, ResourceType.PremiumCake, ResourceType.Sugar] },
  { id: 'raw-resources', label: 'Raw Resources', resources: [ResourceType.Clay, ResourceType.Coal, ResourceType.Copper, ResourceType.Gold, ResourceType.Iron, ResourceType.Minerals, ResourceType.Sand, ResourceType.Stone] },
  { id: 'construction', label: 'Construction', resources: [ResourceType.Bricks, ResourceType.Cement, ResourceType.ConstructionMaterials, ResourceType.ReinforcedConcrete] },
  { id: 'manufacturing', label: 'Manufacturing', resources: [ResourceType.AdvancedComponents, ResourceType.Chemicals, ResourceType.ElectricCircuits, ResourceType.Fertilizer, ResourceType.IndustrialMachines, ResourceType.Plastic, ResourceType.Silicon, ResourceType.Steel, ResourceType.Wool] },
  { id: 'utilities', label: 'Utilities', resources: [ResourceType.Electricity, ResourceType.Water] },
];

/** Code-owned resource catalogue. It is never stored in a player save. */
export const RESOURCES: Readonly<Record<ResourceType, { name: string; market: ResourceMarketDefinition }>> = {
  [ResourceType.Grain]: {
    name: 'Grain',
    market: { localBenchmarkSupply: 800, localInitialSupply: 1_000, regionalBenchmarkSupply: 80_000, regionalInitialSupply: 100_000, globalBenchmarkSupply: 800_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 1, valueDensityMultiplier: 0.9 },
  },
  [ResourceType.Bread]: {
    name: 'Bread',
    market: { localBenchmarkSupply: 6_000, localInitialSupply: 2_500, regionalBenchmarkSupply: 120_000, regionalInitialSupply: 50_000, globalBenchmarkSupply: 1_200_000, globalInitialSupply: 500_000, logisticsMultiplier: 0.5, valueDensityMultiplier: 1.1 },
  },
  [ResourceType.Water]: {
    name: 'Water',
    market: { localBenchmarkSupply: 100, localInitialSupply: 1_000, regionalBenchmarkSupply: 10_000, regionalInitialSupply: 100_000, globalBenchmarkSupply: 100_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 0.6, valueDensityMultiplier: 0.7 },
  },
  [ResourceType.Electricity]: {
    name: 'Electricity',
    market: { localBenchmarkSupply: 200, localInitialSupply: 500, regionalBenchmarkSupply: 20_000, regionalInitialSupply: 50_000, globalBenchmarkSupply: 200_000, globalInitialSupply: 500_000, logisticsMultiplier: 1.5, valueDensityMultiplier: 1 },
  },
  [ResourceType.Sugar]: {
    name: 'Sugar',
    market: { localBenchmarkSupply: 700, localInitialSupply: 1_000, regionalBenchmarkSupply: 70_000, regionalInitialSupply: 100_000, globalBenchmarkSupply: 700_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 1, valueDensityMultiplier: 0.95 },
  },
  [ResourceType.Coal]: {
    name: 'Coal',
    market: { localBenchmarkSupply: 450, localInitialSupply: 250, regionalBenchmarkSupply: 9_000, regionalInitialSupply: 5_000, globalBenchmarkSupply: 90_000, globalInitialSupply: 50_000, logisticsMultiplier: 0.8, valueDensityMultiplier: 0.9 },
  },
  [ResourceType.Iron]: {
    name: 'Iron',
    market: { localBenchmarkSupply: 1_125, localInitialSupply: 250, regionalBenchmarkSupply: 22_500, regionalInitialSupply: 5_000, globalBenchmarkSupply: 225_000, globalInitialSupply: 50_000, logisticsMultiplier: 0.8, valueDensityMultiplier: 1.1 },
  },
  [ResourceType.Copper]: {
    name: 'Copper',
    market: { localBenchmarkSupply: 1_250, localInitialSupply: 250, regionalBenchmarkSupply: 25_000, regionalInitialSupply: 5_000, globalBenchmarkSupply: 250_000, globalInitialSupply: 50_000, logisticsMultiplier: 1, valueDensityMultiplier: 1.15 },
  },
  [ResourceType.Steel]: {
    name: 'Steel',
    market: { localBenchmarkSupply: 1_400, localInitialSupply: 200, regionalBenchmarkSupply: 14_000, regionalInitialSupply: 2_000, globalBenchmarkSupply: 140_000, globalInitialSupply: 20_000, logisticsMultiplier: 0.75, valueDensityMultiplier: 1.1 },
  },
  [ResourceType.ElectricCircuits]: {
    name: 'Electric Circuits',
    market: { localBenchmarkSupply: 12_500, localInitialSupply: 500, regionalBenchmarkSupply: 250_000, regionalInitialSupply: 10_000, globalBenchmarkSupply: 2_500_000, globalInitialSupply: 100_000, logisticsMultiplier: 1.25, valueDensityMultiplier: 1.35 },
  },
  [ResourceType.Bricks]: {
    name: 'Bricks',
    market: { localBenchmarkSupply: 225, localInitialSupply: 150, regionalBenchmarkSupply: 22_500, regionalInitialSupply: 15_000, globalBenchmarkSupply: 225_000, globalInitialSupply: 150_000, logisticsMultiplier: 0.4, valueDensityMultiplier: 0.8 },
  },
  [ResourceType.Cement]: {
    name: 'Cement',
    market: { localBenchmarkSupply: 1_125, localInitialSupply: 250, regionalBenchmarkSupply: 22_500, regionalInitialSupply: 5_000, globalBenchmarkSupply: 225_000, globalInitialSupply: 50_000, logisticsMultiplier: 0.45, valueDensityMultiplier: 0.9 },
  },
  [ResourceType.ReinforcedConcrete]: {
    name: 'Reinforced Concrete',
    market: { localBenchmarkSupply: 2_200, localInitialSupply: 100, regionalBenchmarkSupply: 22_000, regionalInitialSupply: 1_000, globalBenchmarkSupply: 220_000, globalInitialSupply: 10_000, logisticsMultiplier: 0.4, valueDensityMultiplier: 1.15 },
  },
  [ResourceType.ConstructionMaterials]: {
    name: 'Construction Materials',
    market: { localBenchmarkSupply: 1_275, localInitialSupply: 150, regionalBenchmarkSupply: 4_250, regionalInitialSupply: 500, globalBenchmarkSupply: 42_500, globalInitialSupply: 2_500, logisticsMultiplier: 0.5, valueDensityMultiplier: 1.2 },
  },
  [ResourceType.Sand]: {
    name: 'Sand',
    market: { localBenchmarkSupply: 400, localInitialSupply: 1_000, regionalBenchmarkSupply: 40_000, regionalInitialSupply: 100_000, globalBenchmarkSupply: 400_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 0.35, valueDensityMultiplier: 0.7 },
  },
  [ResourceType.Clay]: {
    name: 'Clay',
    market: { localBenchmarkSupply: 800, localInitialSupply: 1_000, regionalBenchmarkSupply: 80_000, regionalInitialSupply: 100_000, globalBenchmarkSupply: 800_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 0.5, valueDensityMultiplier: 0.75 },
  },
  [ResourceType.Stone]: {
    name: 'Stone',
    market: { localBenchmarkSupply: 1_000, localInitialSupply: 500, regionalBenchmarkSupply: 100_000, regionalInitialSupply: 50_000, globalBenchmarkSupply: 1_000_000, globalInitialSupply: 500_000, logisticsMultiplier: 0.35, valueDensityMultiplier: 0.7 },
  },
  [ResourceType.Minerals]: {
    name: 'Minerals',
    market: { localBenchmarkSupply: 500, localInitialSupply: 500, regionalBenchmarkSupply: 50_000, regionalInitialSupply: 50_000, globalBenchmarkSupply: 500_000, globalInitialSupply: 500_000, logisticsMultiplier: 0.55, valueDensityMultiplier: 0.8 },
  },
  [ResourceType.Chemicals]: {
    name: 'Chemicals',
    market: { localBenchmarkSupply: 1_250, localInitialSupply: 125, regionalBenchmarkSupply: 25_000, regionalInitialSupply: 2_500, globalBenchmarkSupply: 250_000, globalInitialSupply: 25_000, logisticsMultiplier: 0.6, valueDensityMultiplier: 1 },
  },
  [ResourceType.Fertilizer]: {
    name: 'Fertilizer',
    market: { localBenchmarkSupply: 1_500, localInitialSupply: 150, regionalBenchmarkSupply: 20_000, regionalInitialSupply: 2_000, globalBenchmarkSupply: 200_000, globalInitialSupply: 20_000, logisticsMultiplier: 0.65, valueDensityMultiplier: 0.9 },
  },
  [ResourceType.Plastic]: {
    name: 'Plastic',
    market: { localBenchmarkSupply: 2_250, localInitialSupply: 150, regionalBenchmarkSupply: 30_000, regionalInitialSupply: 2_000, globalBenchmarkSupply: 300_000, globalInitialSupply: 20_000, logisticsMultiplier: 0.75, valueDensityMultiplier: 1 },
  },
  [ResourceType.Silicon]: {
    name: 'Silicon',
    market: { localBenchmarkSupply: 1_800, localInitialSupply: 75, regionalBenchmarkSupply: 18_000, regionalInitialSupply: 750, globalBenchmarkSupply: 180_000, globalInitialSupply: 7_500, logisticsMultiplier: 0.9, valueDensityMultiplier: 1.25 },
  },
  [ResourceType.Gold]: {
    name: 'Gold',
    market: { localBenchmarkSupply: 1_600, localInitialSupply: 20, regionalBenchmarkSupply: 16_000, regionalInitialSupply: 200, globalBenchmarkSupply: 160_000, globalInitialSupply: 2_000, logisticsMultiplier: 1, valueDensityMultiplier: 1.8 },
  },
  [ResourceType.AdvancedComponents]: {
    name: 'Advanced Components',
    market: { localBenchmarkSupply: 10_000, localInitialSupply: 100, regionalBenchmarkSupply: 200_000, regionalInitialSupply: 2_000, globalBenchmarkSupply: 2_000_000, globalInitialSupply: 20_000, logisticsMultiplier: 1.1, valueDensityMultiplier: 1.6 },
  },
  [ResourceType.IndustrialMachines]: {
    name: 'Industrial Machines',
    market: { localBenchmarkSupply: 15_000, localInitialSupply: 100, regionalBenchmarkSupply: 300_000, regionalInitialSupply: 2_000, globalBenchmarkSupply: 3_000_000, globalInitialSupply: 20_000, logisticsMultiplier: 0.8, valueDensityMultiplier: 1.5 },
  },
  [ResourceType.Cake]: {
    name: 'Cake',
    market: { localBenchmarkSupply: 1_750, localInitialSupply: 250, regionalBenchmarkSupply: 35_000, regionalInitialSupply: 5_000, globalBenchmarkSupply: 350_000, globalInitialSupply: 50_000, logisticsMultiplier: 0.4, valueDensityMultiplier: 1.15 },
  },
  [ResourceType.PremiumCake]: {
    name: 'Premium Cake',
    market: { localBenchmarkSupply: 3_000, localInitialSupply: 250, regionalBenchmarkSupply: 60_000, regionalInitialSupply: 5_000, globalBenchmarkSupply: 600_000, globalInitialSupply: 50_000, logisticsMultiplier: 0.4, valueDensityMultiplier: 1.3 },
  },
  [ResourceType.Eggs]: {
    name: 'Eggs',
    market: { localBenchmarkSupply: 1_000, localInitialSupply: 250, regionalBenchmarkSupply: 20_000, regionalInitialSupply: 5_000, globalBenchmarkSupply: 200_000, globalInitialSupply: 50_000, logisticsMultiplier: 0.6, valueDensityMultiplier: 1 },
  },
  [ResourceType.Fruit]: {
    name: 'Fruit',
    market: { localBenchmarkSupply: 900, localInitialSupply: 1_000, regionalBenchmarkSupply: 90_000, regionalInitialSupply: 100_000, globalBenchmarkSupply: 900_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 0.65, valueDensityMultiplier: 0.9 },
  },
  [ResourceType.Meat]: {
    name: 'Meat',
    market: { localBenchmarkSupply: 1_200, localInitialSupply: 120, regionalBenchmarkSupply: 24_000, regionalInitialSupply: 2_400, globalBenchmarkSupply: 240_000, globalInitialSupply: 24_000, logisticsMultiplier: 0.55, valueDensityMultiplier: 1.2 },
  },
  [ResourceType.MeatPie]: {
    name: 'Meat Pie',
    market: { localBenchmarkSupply: 1_600, localInitialSupply: 200, regionalBenchmarkSupply: 32_000, regionalInitialSupply: 4_000, globalBenchmarkSupply: 320_000, globalInitialSupply: 40_000, logisticsMultiplier: 0.5, valueDensityMultiplier: 1.15 },
  },
  [ResourceType.Milk]: {
    name: 'Milk',
    market: { localBenchmarkSupply: 800, localInitialSupply: 200, regionalBenchmarkSupply: 16_000, regionalInitialSupply: 4_000, globalBenchmarkSupply: 160_000, globalInitialSupply: 40_000, logisticsMultiplier: 0.5, valueDensityMultiplier: 0.9 },
  },
  [ResourceType.Wool]: {
    name: 'Wool',
    market: { localBenchmarkSupply: 1_800, localInitialSupply: 150, regionalBenchmarkSupply: 36_000, regionalInitialSupply: 3_000, globalBenchmarkSupply: 360_000, globalInitialSupply: 30_000, logisticsMultiplier: 0.7, valueDensityMultiplier: 1.1 },
  },
};

export function getResource(resourceType: ResourceType) {
  return { ...RESOURCES[resourceType], icon: RESOURCE_ICONS[resourceType] };
}

export function getResourceIcon(resourceType: ResourceType): string {
  return RESOURCE_ICONS[resourceType];
}
