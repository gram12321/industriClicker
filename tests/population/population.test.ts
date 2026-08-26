import { describe, expect, it } from 'vitest';
import { FacilityCollection, FacilityType } from '@/game/facilities';
import { calculatePopulationDemand, calculatePopulationLocalPurchaseCost, getPopulationCount, POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE } from '@/game/population';
import { ResourceType } from '@/game/resources';

describe('population demand', () => {
  it('derives population from assigned workers, not available production workers', () => {
    const facilities = new FacilityCollection();
    facilities.build(FacilityType.Farm);
    facilities.build(FacilityType.Bakery);

    const [farm, bakery] = facilities.getAll();
    expect(farm?.setAssignedWorkers(4)).toBe(true);
    expect(bakery?.setAssignedWorkers(7)).toBe(true);
    expect(farm?.scheduleStaffTraining(3, 0, 1_000)).toBe(true);

    expect(getPopulationCount(facilities)).toBe(11);
  });

  it('scales each resource base rate by the derived population', () => {
    const baseConsumption = {
      ...POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE,
      [ResourceType.Grain]: 0.25,
      [ResourceType.Bread]: 0.5,
    };

    const demand = calculatePopulationDemand(4, baseConsumption);

    expect(demand.population).toBe(4);
    expect(demand.totalConsumption[ResourceType.Grain]).toBe(1);
    expect(demand.totalConsumption[ResourceType.Bread]).toBe(2);
    expect(demand.totalConsumption[ResourceType.Gold]).toBe(0);
  });

  it('projects local purchase cost without mutating market or population state', () => {
    const demand = calculatePopulationDemand(10);
    const cost = calculatePopulationLocalPurchaseCost(demand, (resourceType) => (
      resourceType === ResourceType.Bread ? 4 : resourceType === ResourceType.Grain ? 2 : 0
    ));

    expect(demand.totalConsumption[ResourceType.Bread]).toBe(8);
    expect(demand.totalConsumption[ResourceType.Grain]).toBe(2);
    expect(cost.byResource[ResourceType.Bread]).toBe(32);
    expect(cost.byResource[ResourceType.Grain]).toBe(4);
    expect(cost.total).toBe(36);
  });
});
