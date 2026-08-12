import { ResourceType, type ResourceMarketDefinition } from './resourceTypes';

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
  ResourceType.Cake,
] as const;

export type ResourceGroup = 'food' | 'raw-resources' | 'construction' | 'utilities';

/** Player-facing resource groupings shared by Pedia and other catalogues; each group is alphabetized by display name. */
export const RESOURCE_GROUPS: ReadonlyArray<{ id: ResourceGroup; label: string; resources: readonly ResourceType[] }> = [
  { id: 'food', label: 'Food', resources: [ResourceType.Bread, ResourceType.Cake, ResourceType.Grain, ResourceType.Sugar] },
  { id: 'raw-resources', label: 'Raw Resources', resources: [ResourceType.Clay, ResourceType.Coal, ResourceType.Copper, ResourceType.Iron, ResourceType.Sand, ResourceType.Stone] },
  { id: 'construction', label: 'Construction', resources: [ResourceType.Bricks, ResourceType.Cement, ResourceType.ConstructionMaterials, ResourceType.ElectricCircuits, ResourceType.ReinforcedConcrete, ResourceType.Steel] },
  { id: 'utilities', label: 'Utilities', resources: [ResourceType.Electricity, ResourceType.Water] },
];

/** Code-owned resource catalogue. It is never stored in a player save. */
export const RESOURCES: Readonly<Record<ResourceType, { name: string; icon: string; market: ResourceMarketDefinition }>> = {
  [ResourceType.Grain]: {
    name: 'Grain', icon: '🌾',
    market: { localBenchmarkSupply: 800, localInitialSupply: 1_000, regionalBenchmarkSupply: 80_000, regionalInitialSupply: 100_000, globalBenchmarkSupply: 800_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 1, valueDensityMultiplier: 0.9 },
  },
  [ResourceType.Bread]: {
    name: 'Bread', icon: '🍞',
    market: { localBenchmarkSupply: 6_000, localInitialSupply: 2_500, regionalBenchmarkSupply: 120_000, regionalInitialSupply: 50_000, globalBenchmarkSupply: 1_200_000, globalInitialSupply: 500_000, logisticsMultiplier: 0.5, valueDensityMultiplier: 1.1 },
  },
  [ResourceType.Water]: {
    name: 'Water', icon: '💧',
    market: { localBenchmarkSupply: 100, localInitialSupply: 1_000, regionalBenchmarkSupply: 10_000, regionalInitialSupply: 100_000, globalBenchmarkSupply: 100_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 0.6, valueDensityMultiplier: 0.7 },
  },
  [ResourceType.Electricity]: {
    name: 'Electricity', icon: '⚡',
    market: { localBenchmarkSupply: 200, localInitialSupply: 500, regionalBenchmarkSupply: 20_000, regionalInitialSupply: 50_000, globalBenchmarkSupply: 200_000, globalInitialSupply: 500_000, logisticsMultiplier: 1.5, valueDensityMultiplier: 1 },
  },
  [ResourceType.Sugar]: {
    name: 'Sugar', icon: '🍬',
    market: { localBenchmarkSupply: 700, localInitialSupply: 1_000, regionalBenchmarkSupply: 70_000, regionalInitialSupply: 100_000, globalBenchmarkSupply: 700_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 1, valueDensityMultiplier: 0.95 },
  },
  [ResourceType.Coal]: {
    name: 'Coal', icon: '🪨',
    market: { localBenchmarkSupply: 450, localInitialSupply: 250, regionalBenchmarkSupply: 9_000, regionalInitialSupply: 5_000, globalBenchmarkSupply: 90_000, globalInitialSupply: 50_000, logisticsMultiplier: 0.8, valueDensityMultiplier: 0.9 },
  },
  [ResourceType.Iron]: {
    name: 'Iron', icon: '⛓️',
    market: { localBenchmarkSupply: 1_125, localInitialSupply: 250, regionalBenchmarkSupply: 22_500, regionalInitialSupply: 5_000, globalBenchmarkSupply: 225_000, globalInitialSupply: 50_000, logisticsMultiplier: 0.8, valueDensityMultiplier: 1.1 },
  },
  [ResourceType.Copper]: {
    name: 'Copper', icon: '🟠',
    market: { localBenchmarkSupply: 1_250, localInitialSupply: 250, regionalBenchmarkSupply: 25_000, regionalInitialSupply: 5_000, globalBenchmarkSupply: 250_000, globalInitialSupply: 50_000, logisticsMultiplier: 1, valueDensityMultiplier: 1.15 },
  },
  [ResourceType.Steel]: {
    name: 'Steel', icon: '🔩',
    market: { localBenchmarkSupply: 1_400, localInitialSupply: 200, regionalBenchmarkSupply: 14_000, regionalInitialSupply: 2_000, globalBenchmarkSupply: 140_000, globalInitialSupply: 20_000, logisticsMultiplier: 0.75, valueDensityMultiplier: 1.1 },
  },
  [ResourceType.ElectricCircuits]: {
    name: 'Electric Circuits', icon: '🔌',
    market: { localBenchmarkSupply: 800, localInitialSupply: 50, regionalBenchmarkSupply: 8_000, regionalInitialSupply: 500, globalBenchmarkSupply: 80_000, globalInitialSupply: 5_000, logisticsMultiplier: 1.25, valueDensityMultiplier: 1.35 },
  },
  [ResourceType.Bricks]: {
    name: 'Bricks', icon: '🧱',
    market: { localBenchmarkSupply: 225, localInitialSupply: 150, regionalBenchmarkSupply: 22_500, regionalInitialSupply: 15_000, globalBenchmarkSupply: 225_000, globalInitialSupply: 150_000, logisticsMultiplier: 0.4, valueDensityMultiplier: 0.8 },
  },
  [ResourceType.Cement]: {
    name: 'Cement', icon: '🏗️',
    market: { localBenchmarkSupply: 1_125, localInitialSupply: 250, regionalBenchmarkSupply: 22_500, regionalInitialSupply: 5_000, globalBenchmarkSupply: 225_000, globalInitialSupply: 50_000, logisticsMultiplier: 0.45, valueDensityMultiplier: 0.9 },
  },
  [ResourceType.ReinforcedConcrete]: {
    name: 'Reinforced Concrete', icon: '🏢',
    market: { localBenchmarkSupply: 2_200, localInitialSupply: 100, regionalBenchmarkSupply: 22_000, regionalInitialSupply: 1_000, globalBenchmarkSupply: 220_000, globalInitialSupply: 10_000, logisticsMultiplier: 0.4, valueDensityMultiplier: 1.15 },
  },
  [ResourceType.ConstructionMaterials]: {
    name: 'Construction Materials', icon: '🏗️',
    market: { localBenchmarkSupply: 1_125, localInitialSupply: 75, regionalBenchmarkSupply: 3_750, regionalInitialSupply: 250, globalBenchmarkSupply: 37_500, globalInitialSupply: 2_500, logisticsMultiplier: 0.5, valueDensityMultiplier: 1.2 },
  },
  [ResourceType.Sand]: {
    name: 'Sand', icon: '🏜️',
    market: { localBenchmarkSupply: 400, localInitialSupply: 1_000, regionalBenchmarkSupply: 40_000, regionalInitialSupply: 100_000, globalBenchmarkSupply: 400_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 0.35, valueDensityMultiplier: 0.7 },
  },
  [ResourceType.Clay]: {
    name: 'Clay', icon: '🟫',
    market: { localBenchmarkSupply: 800, localInitialSupply: 1_000, regionalBenchmarkSupply: 80_000, regionalInitialSupply: 100_000, globalBenchmarkSupply: 800_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 0.5, valueDensityMultiplier: 0.75 },
  },
  [ResourceType.Stone]: {
    name: 'Stone', icon: '⛰️',
    market: { localBenchmarkSupply: 1_000, localInitialSupply: 500, regionalBenchmarkSupply: 100_000, regionalInitialSupply: 50_000, globalBenchmarkSupply: 1_000_000, globalInitialSupply: 500_000, logisticsMultiplier: 0.35, valueDensityMultiplier: 0.7 },
  },
  [ResourceType.Cake]: {
    name: 'Cake', icon: '🍰',
    market: { localBenchmarkSupply: 1_750, localInitialSupply: 250, regionalBenchmarkSupply: 35_000, regionalInitialSupply: 5_000, globalBenchmarkSupply: 350_000, globalInitialSupply: 50_000, logisticsMultiplier: 0.4, valueDensityMultiplier: 1.15 },
  },
};

export function getResource(resourceType: ResourceType) {
  return RESOURCES[resourceType];
}

export function getResourceIcon(resourceType: ResourceType): string {
  return RESOURCES[resourceType].icon;
}
