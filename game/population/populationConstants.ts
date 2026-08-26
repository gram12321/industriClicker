import { ResourceType } from '@/game/resources';

/** Interim Food basket size until physical/fulfilment units are designed. */
export const POPULATION_BASE_FOOD_UNITS_PER_PERSON_PER_MINUTE = 1;
export const POPULATION_BASE_FOOD_BREAD_SHARE = 0.8;
export const POPULATION_BASE_FOOD_GRAIN_SHARE = 0.2;

/**
 * Base resource demand for one population unit during one game-minute.
 *
 * These intentionally start at zero: Industri Clicker has not yet established
 * resource units or approved consumer-basket balance values. The population
 * view and demand calculation are ready for those values without consuming
 * stock or changing market state.
 */
export const POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE: Readonly<Record<ResourceType, number>> = {
  [ResourceType.Grain]: POPULATION_BASE_FOOD_UNITS_PER_PERSON_PER_MINUTE * POPULATION_BASE_FOOD_GRAIN_SHARE,
  [ResourceType.Bread]: POPULATION_BASE_FOOD_UNITS_PER_PERSON_PER_MINUTE * POPULATION_BASE_FOOD_BREAD_SHARE,
  [ResourceType.Water]: 0,
  [ResourceType.Electricity]: 0,
  [ResourceType.Sugar]: 0,
  [ResourceType.Coal]: 0,
  [ResourceType.Iron]: 0,
  [ResourceType.Copper]: 0,
  [ResourceType.Steel]: 0,
  [ResourceType.ElectricCircuits]: 0,
  [ResourceType.Bricks]: 0,
  [ResourceType.Cement]: 0,
  [ResourceType.ReinforcedConcrete]: 0,
  [ResourceType.ConstructionMaterials]: 0,
  [ResourceType.Sand]: 0,
  [ResourceType.Clay]: 0,
  [ResourceType.Stone]: 0,
  [ResourceType.Minerals]: 0,
  [ResourceType.Chemicals]: 0,
  [ResourceType.Fertilizer]: 0,
  [ResourceType.Plastic]: 0,
  [ResourceType.Silicon]: 0,
  [ResourceType.Gold]: 0,
  [ResourceType.AdvancedComponents]: 0,
  [ResourceType.IndustrialMachines]: 0,
  [ResourceType.Cake]: 0,
  [ResourceType.Eggs]: 0,
  [ResourceType.Fruit]: 0,
  [ResourceType.Meat]: 0,
  [ResourceType.MeatPie]: 0,
  [ResourceType.Milk]: 0,
  [ResourceType.Wool]: 0,
};
