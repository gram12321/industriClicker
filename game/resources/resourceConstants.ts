import { Resource } from './resource';
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
export const RESOURCES: Readonly<Record<ResourceType, Resource>> = {
  [ResourceType.Grain]: new Resource(ResourceType.Grain, 'Grain'),
  [ResourceType.Bread]: new Resource(ResourceType.Bread, 'Bread'),
  [ResourceType.Water]: new Resource(ResourceType.Water, 'Water'),
  [ResourceType.Electricity]: new Resource(ResourceType.Electricity, 'Electricity'),
  [ResourceType.Sugar]: new Resource(ResourceType.Sugar, 'Sugar'),
  [ResourceType.Coal]: new Resource(ResourceType.Coal, 'Coal'),
  [ResourceType.Cake]: new Resource(ResourceType.Cake, 'Cake'),
};

/** Familiar symbols retained from Baseclicker for the first resource display. */
export const RESOURCE_ICONS: Readonly<Record<ResourceType, string>> = {
  [ResourceType.Grain]: '🌾',
  [ResourceType.Bread]: '🍞',
  [ResourceType.Water]: '💧',
  [ResourceType.Electricity]: '⚡',
  [ResourceType.Sugar]: '🍬',
  [ResourceType.Coal]: '🪨',
  [ResourceType.Cake]: '🍰',
};

export function getResource(resourceType: ResourceType): Resource {
  return RESOURCES[resourceType];
}

export function getResourceIcon(resourceType: ResourceType): string {
  return RESOURCE_ICONS[resourceType];
}
