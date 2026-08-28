import { RESOURCE_GROUPS, ResourceType, type ResourceGroup } from '@/game/resources';

export type PopulationConsumptionBasketDefinition = {
  id: ResourceGroup;
  label: string;
  resourceTypes: readonly ResourceType[];
};

/** Current resource domains exposed as virtual household-consumption baskets. */
export const POPULATION_CONSUMPTION_BASKETS: readonly PopulationConsumptionBasketDefinition[] = RESOURCE_GROUPS.map(
  (group) => ({ id: group.id, label: group.label, resourceTypes: group.resources }),
);

/** Provisional total demand for each resource-domain basket per person/minute. */
export const POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE: Readonly<Record<ResourceGroup, number>> = {
  food: 1,
  'raw-resources': 0.25,
  construction: 0.05,
  manufacturing: 0.016,
  utilities: 0.7,
};

/**
 * Base resource demand for one population unit during one game-minute.
 *
 * These are provisional virtual-basket quantities, not shared physical units.
 * Each resource is a relative share of its domain total above. Food is
 * diversified; Water and Electricity cover direct utility use; Wool, Planks,
 * Leather, and Furniture are deliberately small direct manufacturing goods. The current non-zero raw and
 * construction entries are implementation probes and can be rebalanced later.
 */
export const POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE: Readonly<Record<ResourceType, number>> = {
  // [Food]
  [ResourceType.Grain]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.15,
  [ResourceType.Bread]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.4,
  [ResourceType.Sugar]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.03,
  [ResourceType.Cake]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.03,
  [ResourceType.Eggs]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.08,
  [ResourceType.Fruit]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.12,
  [ResourceType.Meat]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.09,
  [ResourceType.MeatPie]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.03,
  [ResourceType.Milk]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.07,

  // [Utility]
  [ResourceType.Water]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.utilities * 0.71,
  [ResourceType.Electricity]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.utilities * 0.29,

  // [Raw Resource]
  [ResourceType.Coal]: 0,
  [ResourceType.Iron]: 0,
  [ResourceType.Copper]: 0,
  [ResourceType.Gold]: 0,
  [ResourceType.Minerals]: 0,
  [ResourceType.Sand]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE['raw-resources'] * 0.4,
  [ResourceType.Clay]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE['raw-resources'] * 0.4,
  [ResourceType.Stone]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE['raw-resources'] * 0.2,
  [ResourceType.Timber]: 0,
  [ResourceType.Leather]: 0,

  // [Construction]
  [ResourceType.Bricks]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.construction * 0.2,
  [ResourceType.Cement]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.construction * 0.2,
  [ResourceType.ReinforcedConcrete]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.construction * 0.2,
  [ResourceType.ConstructionMaterials]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.construction * 0.4,

  // [Manufacturing]
  [ResourceType.Steel]: 0,
  [ResourceType.ElectricCircuits]: 0,
  [ResourceType.Chemicals]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.manufacturing * 0.05,
  [ResourceType.Fertilizer]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.manufacturing * 0.55,
  [ResourceType.Plastic]: 0,
  [ResourceType.Silicon]: 0,
  [ResourceType.AdvancedComponents]: 0,
  [ResourceType.IndustrialMachines]: 0,
  [ResourceType.Planks]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.manufacturing * 0.05,
  [ResourceType.Furniture]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.manufacturing * 0.15,
  [ResourceType.Wool]: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.manufacturing * 0.25,
};
