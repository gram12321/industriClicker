/**
 * The closed catalogue of resources currently available in Industri Clicker.
 *
 * Enum values are stable machine identifiers so future local-save snapshots do
 * not depend on player-facing display names.
 */
export enum ResourceType {
  Grain = 'grain',
  Bread = 'bread',
  Water = 'water',
  Electricity = 'electricity',
}

export const RESOURCE_TYPES = [ResourceType.Grain, ResourceType.Bread] as const;
