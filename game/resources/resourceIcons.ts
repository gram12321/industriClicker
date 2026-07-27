import { ResourceType } from './resourceTypes';

/** Familiar symbols retained from Baseclicker for the first resource display. */
export const RESOURCE_ICONS: Readonly<Record<ResourceType, string>> = {
  [ResourceType.Grain]: '🌾',
  [ResourceType.Bread]: '🍞',
};

export function getResourceIcon(resourceType: ResourceType): string {
  return RESOURCE_ICONS[resourceType];
}
