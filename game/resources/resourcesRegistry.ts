import { Resource } from './resource';
import { ResourceType } from './resourceTypes';

/** The code-owned resource catalogue. It is never stored in a player save. */
export const resources: Readonly<Record<ResourceType, Resource>> = {
  [ResourceType.Grain]: new Resource(ResourceType.Grain, 'Grain'),
  [ResourceType.Bread]: new Resource(ResourceType.Bread, 'Bread'),
};

export function getResource(resourceType: ResourceType): Resource {
  return resources[resourceType];
}
