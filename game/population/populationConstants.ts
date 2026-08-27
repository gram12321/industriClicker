import { ResourceType, type ResourceGroup } from '@/game/resources';

export type PopulationConsumptionDefinition = {
  amountPerPersonPerMinute: number;
  baselinePreference: number;
  luxury: number;
  priceElasticity: number;
};

export const POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE: Readonly<Record<ResourceGroup, number>> = {
  food: 1,
  'raw-resources': 0.25,
  construction: 0.05,
  manufacturing: 0.016,
  utilities: 0.7,
};

/** Matches Simulus's pairwise relative-price response. */
export const POPULATION_PRICE_ELASTICITY_FACTOR = 0.8;
export const POPULATION_MAX_SUBSTITUTION_PER_PAIR = 1;

/** The single consumer catalogue: base quantity plus 0–1 selection values. */
export const POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE: Readonly<Record<ResourceType, PopulationConsumptionDefinition>> = {
  // Food
  [ResourceType.Grain]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.15, baselinePreference: 0.65, luxury: 0.02, priceElasticity: 0.85 },
  [ResourceType.Bread]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.4, baselinePreference: 0.95, luxury: 0.22, priceElasticity: 0.7 },
  [ResourceType.Sugar]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.03, baselinePreference: 0.15, luxury: 0.7, priceElasticity: 0.9 },
  [ResourceType.Cake]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.03, baselinePreference: 0.25, luxury: 0.9, priceElasticity: 0.9 },
  [ResourceType.Eggs]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.08, baselinePreference: 0.45, luxury: 0.3, priceElasticity: 0.7 },
  [ResourceType.Fruit]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.12, baselinePreference: 0.55, luxury: 0.25, priceElasticity: 0.65 },
  [ResourceType.Meat]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.09, baselinePreference: 0.5, luxury: 0.45, priceElasticity: 0.8 },
  [ResourceType.MeatPie]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.03, baselinePreference: 0.3, luxury: 0.65, priceElasticity: 0.85 },
  [ResourceType.Milk]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.food * 0.07, baselinePreference: 0.45, luxury: 0.25, priceElasticity: 0.6 },

  // Utilities
  [ResourceType.Water]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.utilities * 0.71, baselinePreference: 1, luxury: 0.01, priceElasticity: 0.1 },
  [ResourceType.Electricity]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.utilities * 0.29, baselinePreference: 0.9, luxury: 0.1, priceElasticity: 0.1 },

  // Raw resources
  [ResourceType.Coal]: { amountPerPersonPerMinute: 0, baselinePreference: 0, luxury: 1, priceElasticity: 0 },
  [ResourceType.Iron]: { amountPerPersonPerMinute: 0, baselinePreference: 0, luxury: 1, priceElasticity: 0 },
  [ResourceType.Copper]: { amountPerPersonPerMinute: 0, baselinePreference: 0, luxury: 1, priceElasticity: 0 },
  [ResourceType.Gold]: { amountPerPersonPerMinute: 0, baselinePreference: 0, luxury: 1, priceElasticity: 0 },
  [ResourceType.Minerals]: { amountPerPersonPerMinute: 0, baselinePreference: 0, luxury: 1, priceElasticity: 0 },
  [ResourceType.Sand]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE['raw-resources'] * 0.4, baselinePreference: 0.5, luxury: 0.65, priceElasticity: 0.6 },
  [ResourceType.Clay]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE['raw-resources'] * 0.4, baselinePreference: 0.5, luxury: 0.65, priceElasticity: 0.6 },
  [ResourceType.Stone]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE['raw-resources'] * 0.2, baselinePreference: 0.4, luxury: 0.7, priceElasticity: 0.65 },

  // Construction
  [ResourceType.Bricks]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.construction * 0.2, baselinePreference: 0.5, luxury: 0.7, priceElasticity: 0.65 },
  [ResourceType.Cement]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.construction * 0.2, baselinePreference: 0.45, luxury: 0.75, priceElasticity: 0.65 },
  [ResourceType.ReinforcedConcrete]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.construction * 0.2, baselinePreference: 0.3, luxury: 0.85, priceElasticity: 0.8 },
  [ResourceType.ConstructionMaterials]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.construction * 0.4, baselinePreference: 0.6, luxury: 0.65, priceElasticity: 0.6 },

  // Manufacturing
  [ResourceType.Steel]: { amountPerPersonPerMinute: 0, baselinePreference: 0, luxury: 1, priceElasticity: 0 },
  [ResourceType.ElectricCircuits]: { amountPerPersonPerMinute: 0, baselinePreference: 0, luxury: 1, priceElasticity: 0 },
  [ResourceType.Chemicals]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.manufacturing * 0.0625, baselinePreference: 0.25, luxury: 0.9, priceElasticity: 0.8 },
  [ResourceType.Fertilizer]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.manufacturing * 0.625, baselinePreference: 0.5, luxury: 0.75, priceElasticity: 0.7 },
  [ResourceType.Plastic]: { amountPerPersonPerMinute: 0, baselinePreference: 0, luxury: 1, priceElasticity: 0 },
  [ResourceType.Silicon]: { amountPerPersonPerMinute: 0, baselinePreference: 0, luxury: 1, priceElasticity: 0 },
  [ResourceType.AdvancedComponents]: { amountPerPersonPerMinute: 0, baselinePreference: 0, luxury: 1, priceElasticity: 0 },
  [ResourceType.IndustrialMachines]: { amountPerPersonPerMinute: 0, baselinePreference: 0, luxury: 1, priceElasticity: 0 },
  [ResourceType.Wool]: { amountPerPersonPerMinute: POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE.manufacturing * 0.3125, baselinePreference: 0.4, luxury: 0.8, priceElasticity: 0.7 },
};
