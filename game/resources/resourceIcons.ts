import { RESOURCE_ICONS } from '@/icons';
import { ResourceType } from './resourceTypes';

export { RESOURCE_ICONS };

export function getResourceIcon(resourceType: ResourceType): string {
  return RESOURCE_ICONS[resourceType];
}
