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
  Sugar = 'sugar',
  Coal = 'coal',
  Cake = 'cake',
}

export const RESOURCE_TYPES = [
  ResourceType.Grain,
  ResourceType.Bread,
  ResourceType.Water,
  ResourceType.Electricity,
  ResourceType.Sugar,
  ResourceType.Coal,
  ResourceType.Cake,
] as const;
