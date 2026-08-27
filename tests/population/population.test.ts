import { describe, expect, it } from 'vitest';
import { FacilityCollection, FacilityType } from '@/game/facilities';
import { Market } from '@/game/market';
import { calculatePopulationConsumption, calculatePopulationTotalWagePayoutPerMinute, getPopulationCount, getPopulationReferenceUnitPrice, PopulationLedger, POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE, POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE, settlePopulationLocalMarketDemand } from '@/game/population';
import { ResourceType } from '@/game/resources';

describe('population consumption', () => {
  it('derives population from assigned workers, including workers in training', () => {
    const facilities = new FacilityCollection();
    facilities.build(FacilityType.Farm);
    const farm = facilities.getAll()[0];
    expect(farm?.setAssignedWorkers(4)).toBe(true);
    expect(farm?.scheduleStaffTraining(2, 0, 1_000)).toBe(true);
    expect(getPopulationCount(facilities)).toBe(4);
  });

  it('uses the existing domain totals and one per-resource base catalogue', () => {
    expect(POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE).toEqual({ food: 1, 'raw-resources': 0.25, construction: 0.05, manufacturing: 0.016, utilities: 0.7 });
    expect(POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE[ResourceType.Grain].amountPerPersonPerMinute).toBe(0.15);
    expect(POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE[ResourceType.Sand].amountPerPersonPerMinute).toBe(0.1);
    expect(POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE[ResourceType.ConstructionMaterials].amountPerPersonPerMinute).toBeCloseTo(0.02);
    expect(POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE[ResourceType.Grain]).toMatchObject({ baselinePreference: 0.65, luxury: 0.02, priceElasticity: 0.85 });
  });

  it('uses initial local prices as the simple price-elasticity reference', () => {
    expect(getPopulationReferenceUnitPrice(ResourceType.Grain)).toBeCloseTo(0.8);
    expect(getPopulationReferenceUnitPrice(ResourceType.Bread)).toBeCloseTo(2.4);
  });

  it('switches within the Food domain when Bread becomes expensive', () => {
    const normalMarket = new Market();
    const expensiveBreadSnapshot = normalMarket.toSnapshot();
    expensiveBreadSnapshot.local[ResourceType.Bread].supply = 100;
    const expensiveMarket = new Market(expensiveBreadSnapshot);
    const normal = calculatePopulationConsumption(10, normalMarket);
    const expensive = calculatePopulationConsumption(10, expensiveMarket);
    expect(expensive.adjustedAmounts[ResourceType.Bread]).toBeLessThan(normal.adjustedAmounts[ResourceType.Bread]);
    expect(expensive.adjustedAmounts[ResourceType.Grain]).toBeGreaterThan(normal.adjustedAmounts[ResourceType.Grain]);
  });

  it('keeps the base basket at reference prices and preserves each group total after substitution', () => {
    const market = new Market();
    const consumption = calculatePopulationConsumption(1, market);
    expect(consumption.adjustedAmounts).toEqual(consumption.baseAmounts);

    const snapshot = market.toSnapshot();
    snapshot.local[ResourceType.Bread].supply = 100;
    const adjusted = calculatePopulationConsumption(1, new Market(snapshot));
    const foodBase = [ResourceType.Bread, ResourceType.Cake, ResourceType.Eggs, ResourceType.Fruit, ResourceType.Grain, ResourceType.Meat, ResourceType.MeatPie, ResourceType.Milk, ResourceType.Sugar].reduce((total, resource) => total + adjusted.baseAmounts[resource], 0);
    const foodAdjusted = [ResourceType.Bread, ResourceType.Cake, ResourceType.Eggs, ResourceType.Fruit, ResourceType.Grain, ResourceType.Meat, ResourceType.MeatPie, ResourceType.Milk, ResourceType.Sugar].reduce((total, resource) => total + adjusted.adjustedAmounts[resource], 0);
    expect(foodAdjusted).toBeCloseTo(foodBase);
  });

  it('calculates actual spending from the available household budget without tracking purchases', () => {
    const consumption = calculatePopulationConsumption(1, new Market(), 1);
    expect(consumption.actualSpendingPerMinute).toBeCloseTo(1);
    expect(Object.values(consumption.actualSpendingByGroup).reduce((total, amount) => total + amount, 0)).toBeCloseTo(1);
    expect(consumption.actualAmounts[ResourceType.Bread]).toBeLessThan(consumption.adjustedAmounts[ResourceType.Bread]);
  });

  it('spends the selected €5/min basket continuously over a full minute', () => {
    const facilities = new FacilityCollection();
    facilities.build(FacilityType.Farm);
    const farm = facilities.getAll()[0];
    expect(farm?.setAssignedWorkers(1)).toBe(true);
    expect(farm?.setStaffWagePerWorkerPerMinute(5)).toBe(true);
    let population = new PopulationLedger();
    let market = new Market();
    const initialWaterSupply = market.getLocalEntry(ResourceType.Water).supply;
    const initialElectricitySupply = market.getLocalEntry(ResourceType.Electricity).supply;
    for (let second = 0; second < 60; second += 1) {
      population.creditWages(5 / 60);
      const settlement = settlePopulationLocalMarketDemand({ facilities, market, population, stepMs: 1_000 });
      population = settlement.population;
      market = settlement.market;
    }
    expect(population.getHouseholdBalance()).toBeCloseTo(0);
    expect(market.getLocalEntry(ResourceType.Water).supply).toBeLessThan(initialWaterSupply);
    expect(market.getLocalEntry(ResourceType.Electricity).supply).toBeLessThan(initialElectricitySupply);
  });

  it('projects facility wages per minute', () => {
    const facilities = new FacilityCollection();
    facilities.build(FacilityType.Farm);
    const farm = facilities.getAll()[0];
    expect(farm?.setAssignedWorkers(2)).toBe(true);
    expect(farm?.setStaffWagePerWorkerPerMinute(2.5)).toBe(true);
    expect(calculatePopulationTotalWagePayoutPerMinute(facilities)).toBe(5);
  });
});
