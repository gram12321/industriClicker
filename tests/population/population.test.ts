import { describe, expect, it } from 'vitest';
import { FacilityCollection, FacilityType } from '@/game/facilities';
import { calculatePopulationAffordability, calculatePopulationDemand, calculatePopulationDemandBaskets, calculatePopulationExpenditureBreakdown, calculatePopulationIncomeProjection, calculatePopulationLocalPurchaseCost, calculatePopulationTotalWagePayoutPerMinute, getPopulationCount, PopulationLedger, POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE, POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE, POPULATION_CONSUMPTION_BASKETS } from '@/game/population';
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

    expect(demand.totalConsumption[ResourceType.Bread]).toBe(4);
    expect(demand.totalConsumption[ResourceType.Grain]).toBe(1.5);
    expect(cost.byResource[ResourceType.Bread]).toBe(16);
    expect(cost.byResource[ResourceType.Grain]).toBe(3);
    expect(cost.total).toBe(19);
  });

  it('projects facility wages per game-minute for assigned workers', () => {
    const facilities = new FacilityCollection();
    facilities.build(FacilityType.Farm);
    facilities.build(FacilityType.Bakery);
    const [farm, bakery] = facilities.getAll();

    expect(farm?.setAssignedWorkers(2)).toBe(true);
    expect(bakery?.setAssignedWorkers(3)).toBe(true);
    expect(farm?.setStaffWagePerWorkerPerMinute(2)).toBe(true);
    expect(bakery?.setStaffWagePerWorkerPerMinute(1.5)).toBe(true);

    expect(calculatePopulationTotalWagePayoutPerMinute(facilities)).toBe(8.5);
    expect(calculatePopulationIncomeProjection(facilities, 6)).toEqual({
      totalWagePayoutPerMinute: 8.5,
      projectedPurchaseCostPerMinute: 6,
      surplusPerMinute: 2.5,
    });
  });

  it('keeps credited wages in the aggregate household balance', () => {
    const population = new PopulationLedger();

    expect(population.creditWages(2.5)).toBe(true);
    expect(population.creditWages(0)).toBe(false);
    expect(population.spendHouseholdCash(1)).toBe(true);
    expect(population.spendHouseholdCash(2)).toBe(false);
    expect(population.getHouseholdBalance()).toBe(1.5);
    expect(PopulationLedger.fromSnapshot(population.toSnapshot()).getHouseholdBalance()).toBe(1.5);
  });

  it('tracks fulfilled Local Market consumption for the current game minute', () => {
    const population = new PopulationLedger();

    expect(population.recordLocalMarketConsumption(ResourceType.Bread, 0.5, 1_000)).toBe(true);
    expect(population.recordLocalMarketConsumption(ResourceType.Grain, 0.2, 59_000)).toBe(true);
    expect(population.getCurrentMinuteConsumption()).toMatchObject({ [ResourceType.Bread]: 0.5, [ResourceType.Grain]: 0.2 });
    expect(population.recordLocalMarketConsumption(ResourceType.Water, 0.4, 60_001)).toBe(true);
    expect(population.getCurrentMinuteConsumption()).toMatchObject({ [ResourceType.Bread]: 0, [ResourceType.Grain]: 0, [ResourceType.Water]: 0.4 });
    expect(population.advanceConsumptionMinute(120_001)).toBe(true);
    expect(population.getCurrentMinuteConsumption()[ResourceType.Water]).toBe(0);
    expect(PopulationLedger.fromSnapshot(population.toSnapshot()).getCurrentMinuteConsumption()[ResourceType.Water]).toBe(0);
  });

  it('keeps the current resource domains as baskets while excluding industrial inputs from direct consumption', () => {
    const baskets = calculatePopulationDemandBaskets(calculatePopulationDemand(1));

    expect(baskets.map((basket) => basket.id)).toEqual(POPULATION_CONSUMPTION_BASKETS.map((basket) => basket.id));
    expect(baskets.find((basket) => basket.id === 'food')?.hasDirectConsumption).toBe(true);
    expect(baskets.find((basket) => basket.id === 'utilities')?.hasDirectConsumption).toBe(true);
    expect(baskets.find((basket) => basket.id === 'manufacturing')?.hasDirectConsumption).toBe(true);
    expect(baskets.find((basket) => basket.id === 'raw-resources')?.hasDirectConsumption).toBe(true);
    expect(baskets.find((basket) => basket.id === 'construction')?.hasDirectConsumption).toBe(true);
  });

  it('expresses each domain basket as a total with relative resource shares', () => {
    const baskets = calculatePopulationDemandBaskets(calculatePopulationDemand(1));

    for (const basket of baskets) {
      expect(basket.baseConsumptionPerPerson).toBeCloseTo(POPULATION_BASE_DOMAIN_CONSUMPTION_PER_PERSON_PER_MINUTE[basket.id]);
    }
    expect(baskets.find((basket) => basket.id === 'food')?.baseConsumptionPerPerson).toBe(1);
    expect(baskets.find((basket) => basket.id === 'food')?.totalConsumption).toBe(1);
  });

  it('projects whether household savings can fund the next desired basket', () => {
    expect(calculatePopulationAffordability(30, 12)).toEqual({
      householdBalance: 30,
      projectedPurchaseCostPerMinute: 12,
      affordableMinutes: 2.5,
      unfundedPurchaseCost: 0,
      canAffordFullBasket: true,
    });
    expect(calculatePopulationAffordability(5, 12)).toMatchObject({
      affordableMinutes: 5 / 12,
      unfundedPurchaseCost: 7,
      canAffordFullBasket: false,
    });
  });

  it('breaks projected local purchases into resource-domain expenditure shares', () => {
    const demand = calculatePopulationDemand(1);
    const purchaseCost = calculatePopulationLocalPurchaseCost(demand, (resourceType) => (
      resourceType === ResourceType.Bread ? 4
        : resourceType === ResourceType.Water ? 2
          : resourceType === ResourceType.Sand ? 1
            : resourceType === ResourceType.Bricks ? 2
              : resourceType === ResourceType.Fertilizer ? 3 : 0
    ));
    const breakdown = calculatePopulationExpenditureBreakdown(demand, purchaseCost);

    expect(purchaseCost.total).toBeCloseTo(2.744);
    expect(breakdown.find((entry) => entry.id === 'food')).toMatchObject({ projectedPurchaseCost: 1.6 });
    expect(breakdown.find((entry) => entry.id === 'utilities')?.projectedPurchaseCost).toBeCloseTo(0.994);
    expect(breakdown.reduce((total, entry) => total + entry.expenditureShare, 0)).toBeCloseTo(1);
  });
});
