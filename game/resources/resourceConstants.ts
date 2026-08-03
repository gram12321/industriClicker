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
  ResourceType.Sand,
  ResourceType.Clay,
  ResourceType.Stone,
  ResourceType.Cake,
] as const;

/** Code-owned resource catalogue. It is never stored in a player save. */
export const RESOURCES: Readonly<Record<ResourceType, { name: string; icon: string; market: ResourceMarketDefinition }>> = {
  [ResourceType.Grain]: {
    name: 'Grain', icon: '🌾',
    market: { localBenchmarkSupply: 60_000, localInitialSupply: 100_000, globalBenchmarkSupply: 600_000, globalInitialSupply: 1_000_000 },
  },
  [ResourceType.Bread]: {
    name: 'Bread', icon: '🍞',
    market: { localBenchmarkSupply: 90_000, localInitialSupply: 50_000, globalBenchmarkSupply: 900_000, globalInitialSupply: 500_000 },
  },
  [ResourceType.Water]: {
    name: 'Water', icon: '💧',
    market: { localBenchmarkSupply: 5_000, localInitialSupply: 100_000, globalBenchmarkSupply: 50_000, globalInitialSupply: 1_000_000 },
  },
  [ResourceType.Electricity]: {
    name: 'Electricity', icon: '⚡',
    market: { localBenchmarkSupply: 12_500, localInitialSupply: 50_000, globalBenchmarkSupply: 125_000, globalInitialSupply: 500_000 },
  },
  [ResourceType.Sugar]: {
    name: 'Sugar', icon: '🍬',
    market: { localBenchmarkSupply: 40_000, localInitialSupply: 100_000, globalBenchmarkSupply: 400_000, globalInitialSupply: 1_000_000 },
  },
  [ResourceType.Coal]: {
    name: 'Coal', icon: '🪨',
    market: { localBenchmarkSupply: 6_000, localInitialSupply: 5_000, globalBenchmarkSupply: 60_000, globalInitialSupply: 50_000 },
  },
  [ResourceType.Iron]: {
    name: 'Iron', icon: '⛓️',
    market: { localBenchmarkSupply: 12_500, localInitialSupply: 5_000, globalBenchmarkSupply: 125_000, globalInitialSupply: 50_000 },
  },
  [ResourceType.Copper]: {
    name: 'Copper', icon: '🟠',
    market: { localBenchmarkSupply: 17_500, localInitialSupply: 5_000, globalBenchmarkSupply: 175_000, globalInitialSupply: 50_000 },
  },
  [ResourceType.Sand]: {
    name: 'Sand', icon: '🏜️',
    market: { localBenchmarkSupply: 15_000, localInitialSupply: 100_000, globalBenchmarkSupply: 150_000, globalInitialSupply: 1_000_000 },
  },
  [ResourceType.Clay]: {
    name: 'Clay', icon: '🟫',
    market: { localBenchmarkSupply: 30_000, localInitialSupply: 100_000, globalBenchmarkSupply: 300_000, globalInitialSupply: 1_000_000 },
  },
  [ResourceType.Stone]: {
    name: 'Stone', icon: '⛰️',
    market: { localBenchmarkSupply: 40_000, localInitialSupply: 50_000, globalBenchmarkSupply: 400_000, globalInitialSupply: 500_000 },
  },
  [ResourceType.Cake]: {
    name: 'Cake', icon: '🍰',
    market: { localBenchmarkSupply: 22_500, localInitialSupply: 5_000, globalBenchmarkSupply: 225_000, globalInitialSupply: 50_000 },
  },
};

export function getResource(resourceType: ResourceType) {
  return RESOURCES[resourceType];
}

export function getResourceIcon(resourceType: ResourceType): string {
  return RESOURCES[resourceType].icon;
}
