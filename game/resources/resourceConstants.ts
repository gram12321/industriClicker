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
    market: { localBenchmarkSupply: 60_000, localInitialSupply: 100_000, globalBenchmarkSupply: 600_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 1, valueDensityMultiplier: 0.9 },
  },
  [ResourceType.Bread]: {
    name: 'Bread', icon: '🍞',
    market: { localBenchmarkSupply: 90_000, localInitialSupply: 50_000, globalBenchmarkSupply: 900_000, globalInitialSupply: 500_000, logisticsMultiplier: 0.5, valueDensityMultiplier: 1.1 },
  },
  [ResourceType.Water]: {
    name: 'Water', icon: '💧',
    market: { localBenchmarkSupply: 5_000, localInitialSupply: 100_000, globalBenchmarkSupply: 50_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 0.6, valueDensityMultiplier: 0.7 },
  },
  [ResourceType.Electricity]: {
    name: 'Electricity', icon: '⚡',
    market: { localBenchmarkSupply: 12_500, localInitialSupply: 50_000, globalBenchmarkSupply: 125_000, globalInitialSupply: 500_000, logisticsMultiplier: 1.5, valueDensityMultiplier: 1 },
  },
  [ResourceType.Sugar]: {
    name: 'Sugar', icon: '🍬',
    market: { localBenchmarkSupply: 40_000, localInitialSupply: 100_000, globalBenchmarkSupply: 400_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 1, valueDensityMultiplier: 0.95 },
  },
  [ResourceType.Coal]: {
    name: 'Coal', icon: '🪨',
    market: { localBenchmarkSupply: 6_000, localInitialSupply: 5_000, globalBenchmarkSupply: 60_000, globalInitialSupply: 50_000, logisticsMultiplier: 0.8, valueDensityMultiplier: 0.9 },
  },
  [ResourceType.Iron]: {
    name: 'Iron', icon: '⛓️',
    market: { localBenchmarkSupply: 12_500, localInitialSupply: 5_000, globalBenchmarkSupply: 125_000, globalInitialSupply: 50_000, logisticsMultiplier: 0.8, valueDensityMultiplier: 1.1 },
  },
  [ResourceType.Copper]: {
    name: 'Copper', icon: '🟠',
    market: { localBenchmarkSupply: 17_500, localInitialSupply: 5_000, globalBenchmarkSupply: 175_000, globalInitialSupply: 50_000, logisticsMultiplier: 1, valueDensityMultiplier: 1.15 },
  },
  [ResourceType.Steel]: {
    name: 'Steel', icon: '🔩',
    market: { localBenchmarkSupply: 10_000, localInitialSupply: 2_000, globalBenchmarkSupply: 100_000, globalInitialSupply: 20_000, logisticsMultiplier: 0.75, valueDensityMultiplier: 1.1 },
  },
  [ResourceType.ElectricCircuits]: {
    name: 'Electric Circuits', icon: '🔌',
    market: { localBenchmarkSupply: 6_000, localInitialSupply: 500, globalBenchmarkSupply: 60_000, globalInitialSupply: 5_000, logisticsMultiplier: 1.25, valueDensityMultiplier: 1.35 },
  },
  [ResourceType.Bricks]: {
    name: 'Bricks', icon: '🧱',
    market: { localBenchmarkSupply: 15_000, localInitialSupply: 15_000, globalBenchmarkSupply: 150_000, globalInitialSupply: 150_000, logisticsMultiplier: 0.4, valueDensityMultiplier: 0.8 },
  },
  [ResourceType.Cement]: {
    name: 'Cement', icon: '🏗️',
    market: { localBenchmarkSupply: 15_000, localInitialSupply: 5_000, globalBenchmarkSupply: 150_000, globalInitialSupply: 50_000, logisticsMultiplier: 0.45, valueDensityMultiplier: 0.9 },
  },
  [ResourceType.ReinforcedConcrete]: {
    name: 'Reinforced Concrete', icon: '🏢',
    market: { localBenchmarkSupply: 15_000, localInitialSupply: 1_000, globalBenchmarkSupply: 150_000, globalInitialSupply: 10_000, logisticsMultiplier: 0.4, valueDensityMultiplier: 1.15 },
  },
  [ResourceType.ConstructionMaterials]: {
    name: 'Construction Materials', icon: '🏗️',
    market: { localBenchmarkSupply: 12_500, localInitialSupply: 250, globalBenchmarkSupply: 125_000, globalInitialSupply: 2_500, logisticsMultiplier: 0.5, valueDensityMultiplier: 1.2 },
  },
  [ResourceType.Sand]: {
    name: 'Sand', icon: '🏜️',
    market: { localBenchmarkSupply: 15_000, localInitialSupply: 100_000, globalBenchmarkSupply: 150_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 0.35, valueDensityMultiplier: 0.7 },
  },
  [ResourceType.Clay]: {
    name: 'Clay', icon: '🟫',
    market: { localBenchmarkSupply: 30_000, localInitialSupply: 100_000, globalBenchmarkSupply: 300_000, globalInitialSupply: 1_000_000, logisticsMultiplier: 0.5, valueDensityMultiplier: 0.75 },
  },
  [ResourceType.Stone]: {
    name: 'Stone', icon: '⛰️',
    market: { localBenchmarkSupply: 40_000, localInitialSupply: 50_000, globalBenchmarkSupply: 400_000, globalInitialSupply: 500_000, logisticsMultiplier: 0.35, valueDensityMultiplier: 0.7 },
  },
  [ResourceType.Cake]: {
    name: 'Cake', icon: '🍰',
    market: { localBenchmarkSupply: 22_500, localInitialSupply: 5_000, globalBenchmarkSupply: 225_000, globalInitialSupply: 50_000, logisticsMultiplier: 0.4, valueDensityMultiplier: 1.15 },
  },
};

export function getResource(resourceType: ResourceType) {
  return RESOURCES[resourceType];
}

export function getResourceIcon(resourceType: ResourceType): string {
  return RESOURCES[resourceType].icon;
}
