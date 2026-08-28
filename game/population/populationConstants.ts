import { ResourceType, type ResourceGroup } from '@/game/resources';

export type PopulationConsumptionDefinition = {
  amountPerPersonPerMinute: number;
  /** Higher values describe goods preferred only once the household can afford the full basket. */
  baselinePreference: number;
  luxury: number;
  resourceElasticity: number;
};

export const POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE: Readonly<Record<ResourceGroup, number>> = {
  food: 1,
  'raw-resources': 0.25,
  construction: 0.05,
  manufacturing: 0.016,
  utilities: 10.7,
};

/** Matches Simulus's pairwise relative-price response. */
export const POPULATION_MAX_SUBSTITUTION_PER_PAIR = 1;

/** Domain-level substitution is intentionally much weaker than resource-level substitution. */
export const POPULATION_DOMAIN_MAX_SUBSTITUTION_PER_PAIR = 0.2;
export const POPULATION_DOMAIN_PRICE_ELASTICITY = 0.2;

/** Higher values make a domain more resistant to losing purchasing power to other domains. */
export const POPULATION_DOMAIN_ESSENTIALS: Readonly<Record<ResourceGroup, number>> = {
  food: 0.9,
  'raw-resources': 0.15,
  construction: 0.1,
  manufacturing: 0.3,
  utilities: 0.9,
};

/** The single consumer catalogue: base quantity plus 0–1 selection values. */
export const POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE: Readonly<Record<ResourceType, PopulationConsumptionDefinition>> = {
  // Food
  [ResourceType.Grain]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.15,
    baselinePreference: 0.25,
    luxury: 0.01,
    resourceElasticity: 0.85,
  },
  [ResourceType.Bread]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.4,
    baselinePreference: 0.95,
    luxury: 0.22,
    resourceElasticity: 0.7,
  },
  [ResourceType.Sugar]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.03,
    baselinePreference: 0.35,
    luxury: 0.7,
    resourceElasticity: 0.9,
  },
  [ResourceType.Cake]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.03,
    baselinePreference: 0.95,
    luxury: 0.95,
    resourceElasticity: 0.9,
  },
  [ResourceType.Eggs]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.08,
    baselinePreference: 0.5,
    luxury: 0.5,
    resourceElasticity: 0.7,
  },
  [ResourceType.Fruit]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.12,
    baselinePreference: 0.5,
    luxury: 0.6,
    resourceElasticity: 0.65,
  },
  [ResourceType.Meat]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.09,
    baselinePreference: 0.8,
    luxury: 0.3,
    resourceElasticity: 0.8,
  },
  [ResourceType.MeatPie]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.03,
    baselinePreference: 0.95,
    luxury: 0.85,
    resourceElasticity: 0.85,
  },
  [ResourceType.Milk]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.07,
    baselinePreference: 0.5,
    luxury: 0.25,
    resourceElasticity: 0.6,
  },

  // Utilities
  [ResourceType.Water]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.utilities * 0.71,
    baselinePreference: 0,
    luxury: 0.01,
    resourceElasticity: 0.1,
  },
  [ResourceType.Electricity]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.utilities * 0.29,
    baselinePreference: 0.1,
    luxury: 0.1,
    resourceElasticity: 0.1,
  },

  // Raw resources
  [ResourceType.Coal]: {
    amountPerPersonPerMinute: 0.1,
    baselinePreference: 0.01,
    luxury: 0.1,
    resourceElasticity: 0.5,
  },
  [ResourceType.Iron]: {
    amountPerPersonPerMinute: 0.1,
    baselinePreference: 0.01,
    luxury: 0.1,
    resourceElasticity: 0.5,
  },
  [ResourceType.Copper]: {
    amountPerPersonPerMinute: 0.1,
    baselinePreference: 0.01,
    luxury: 0.1,
    resourceElasticity: 0.5,
  },
  [ResourceType.Gold]: {
    amountPerPersonPerMinute: 0.01,
    baselinePreference: 0.2,
    luxury: 1,
    resourceElasticity: 0.01,
  },
  [ResourceType.Minerals]: {
    amountPerPersonPerMinute: 0.1,
    baselinePreference: 0.01,
    luxury: 0.1,
    resourceElasticity: 0.5,
  },
  [ResourceType.Sand]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE['raw-resources'] * 0.4,
    baselinePreference: 0.2,
    luxury: 0.01,
    resourceElasticity: 0.6,
  },
  [ResourceType.Clay]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE['raw-resources'] * 0.4,
    baselinePreference: 0.2,
    luxury: 0.01,
    resourceElasticity: 0.6,
  },
  [ResourceType.Stone]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE['raw-resources'] * 0.2,
    baselinePreference: 0.3,
    luxury: 0.2,
    resourceElasticity: 0.65,
  },
  [ResourceType.Timber]: {
    amountPerPersonPerMinute: 0,
    baselinePreference: 0.05,
    luxury: 0.15,
    resourceElasticity: 0.5,
  },
  [ResourceType.Leather]: {
    amountPerPersonPerMinute: 0,
    baselinePreference: 0.1,
    luxury: 0.25,
    resourceElasticity: 0.45,
  },

  // Construction
  [ResourceType.Bricks]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.construction * 0.2,
    baselinePreference: 0.5,
    luxury: 0.7,
    resourceElasticity: 0.65,
  },
  [ResourceType.Cement]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.construction * 0.2,
    baselinePreference: 0.45,
    luxury: 0.3,
    resourceElasticity: 0.65,
  },
  [ResourceType.ReinforcedConcrete]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.construction * 0.2,
    baselinePreference: 0.3,
    luxury: 0.85,
    resourceElasticity: 0.8,
  },
  [ResourceType.ConstructionMaterials]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.construction * 0.4,
    baselinePreference: 0.9,
    luxury: 0.4,
    resourceElasticity: 0.9,
  },

  // Manufacturing
  [ResourceType.Steel]: {
    amountPerPersonPerMinute: 0.001,
    baselinePreference: 0.1,
    luxury: 0.9,
    resourceElasticity: 0.1,
  },
  [ResourceType.ElectricCircuits]: {
    amountPerPersonPerMinute: 0.01,
    baselinePreference: 0.3,
    luxury: 0.5,
    resourceElasticity: 0.2,
  },
  [ResourceType.Chemicals]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.manufacturing * 0.00625,
    baselinePreference: 0.25,
    luxury: 0.3,
    resourceElasticity: 0.3,
  },
  [ResourceType.Fertilizer]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.manufacturing * 0.00625,
    baselinePreference: 0.5,
    luxury: 0.95,
    resourceElasticity: 0.3,
  },
  [ResourceType.Plastic]: {
    amountPerPersonPerMinute: 0,
    baselinePreference: 0.01,
    luxury: 0.1,
    resourceElasticity: 0.1,
  },
  [ResourceType.Silicon]: {
    amountPerPersonPerMinute: 0,
    baselinePreference: 0,
    luxury: 1,
    resourceElasticity: 0,
  },
  [ResourceType.AdvancedComponents]: {
    amountPerPersonPerMinute: 0.01,
    baselinePreference: 0.8,
    luxury: 1,
    resourceElasticity: 0.2,
  },
  [ResourceType.IndustrialMachines]: {
    amountPerPersonPerMinute: 0,
    baselinePreference: 0,
    luxury: 1,
    resourceElasticity: 0,
  },
  [ResourceType.Planks]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.manufacturing * 0.05,
    baselinePreference: 0.2,
    luxury: 0.3,
    resourceElasticity: 0.45,
  },
  [ResourceType.Furniture]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.manufacturing * 0.15,
    baselinePreference: 0.4,
    luxury: 0.5,
    resourceElasticity: 0.35,
  },
  [ResourceType.Wool]: {
    amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.manufacturing * 0.3125,
    baselinePreference: 0.4,
    luxury: 0.2,
    resourceElasticity: 0.3,
  },
};
