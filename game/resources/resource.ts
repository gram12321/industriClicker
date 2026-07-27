import type { ResourceType } from './resourceTypes';

/**
 * Code-defined information about one resource type.
 *
 * Mutable player quantities and quality belong to Inventory, not here.
 */
export class Resource {
  constructor(
    public readonly type: ResourceType,
    public readonly name: string,
  ) {}
}
