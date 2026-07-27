import { Resource } from './resource';
import { ResourceType } from './resourceTypes';

/** The code-owned resource catalogue. It is never stored in a player save. */
export const resources: Readonly<Record<ResourceType, Resource>> = {
  [ResourceType.Grain]: new Resource(ResourceType.Grain, 'Grain'),
  [ResourceType.Bread]: new Resource(ResourceType.Bread, 'Bread'),
  [ResourceType.Water]: new Resource(ResourceType.Water, 'Water'),
  [ResourceType.Electricity]: new Resource(ResourceType.Electricity, 'Electricity'),
  [ResourceType.Sugar]: new Resource(ResourceType.Sugar, 'Sugar'),
  [ResourceType.Coal]: new Resource(ResourceType.Coal, 'Coal'),
  [ResourceType.Cake]: new Resource(ResourceType.Cake, 'Cake'),
};

export function getResource(resourceType: ResourceType): Resource {
  return resources[resourceType];
}
