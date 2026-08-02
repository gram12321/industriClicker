import { ResourceType } from './resourceTypes';

export const RESOURCE_TYPES = [
  ResourceType.Grain,
  ResourceType.Bread,
  ResourceType.Water,
  ResourceType.Electricity,
  ResourceType.Sugar,
  ResourceType.Coal,
  ResourceType.Cake,
] as const;

/** Code-owned resource catalogue. It is never stored in a player save. */
export const RESOURCES: Readonly<Record<ResourceType, { name: string; icon: string }>> = {
  [ResourceType.Grain]: { name: 'Grain', icon: '🌾' },
  [ResourceType.Bread]: { name: 'Bread', icon: '🍞' },
  [ResourceType.Water]: { name: 'Water', icon: '💧' },
  [ResourceType.Electricity]: { name: 'Electricity', icon: '⚡' },
  [ResourceType.Sugar]: { name: 'Sugar', icon: '🍬' },
  [ResourceType.Coal]: { name: 'Coal', icon: '🪨' },
  [ResourceType.Cake]: { name: 'Cake', icon: '🍰' },
};

export function getResource(resourceType: ResourceType) {
  return RESOURCES[resourceType];
}

export function getResourceIcon(resourceType: ResourceType): string {
  return RESOURCES[resourceType].icon;
}
