import type { FacilityCollection } from '@/game/facilities';
import { RESOURCE_TYPES, type ResourceType } from '@/game/resources';
import { POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE } from './populationConstants';

export type PopulationDemand = {
  population: number;
  baseConsumptionPerPerson: Readonly<Record<ResourceType, number>>;
  totalConsumption: Readonly<Record<ResourceType, number>>;
};

export type PopulationPurchaseCost = {
  byResource: Readonly<Record<ResourceType, number>>;
  total: number;
};

/** Population is currently every assigned facility worker, including staff in training. */
export function getPopulationCount(facilities: FacilityCollection): number {
  return facilities.getAll().reduce((total, facility) => total + facility.getView().assignedWorkers, 0);
}

/** Returns the read-only demand projection for one game-minute. */
export function calculatePopulationDemand(
  population: number,
  baseConsumptionPerPerson: Readonly<Record<ResourceType, number>> = POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE,
): PopulationDemand {
  const safePopulation = Number.isFinite(population) ? Math.max(0, Math.floor(population)) : 0;
  const totalConsumption = Object.fromEntries(
    RESOURCE_TYPES.map((resourceType) => [
      resourceType,
      safePopulation * Math.max(0, baseConsumptionPerPerson[resourceType]),
    ]),
  ) as Record<ResourceType, number>;

  return {
    population: safePopulation,
    baseConsumptionPerPerson,
    totalConsumption,
  };
}

export function getPopulationDemand(facilities: FacilityCollection): PopulationDemand {
  return calculatePopulationDemand(getPopulationCount(facilities));
}

/** Estimates what the projected demand would cost at current local prices. */
export function calculatePopulationLocalPurchaseCost(
  demand: PopulationDemand,
  getLocalPrice: (resourceType: ResourceType) => number,
): PopulationPurchaseCost {
  const byResource = Object.fromEntries(
    RESOURCE_TYPES.map((resourceType) => {
      const price = getLocalPrice(resourceType);
      const amount = demand.totalConsumption[resourceType];
      return [resourceType, Number.isFinite(price) && price > 0 ? amount * price : 0];
    }),
  ) as Record<ResourceType, number>;

  return {
    byResource,
    total: RESOURCE_TYPES.reduce((total, resourceType) => total + byResource[resourceType], 0),
  };
}
