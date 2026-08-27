import type { FacilityCollection } from '@/game/facilities';
import { RESOURCE_TYPES, type ResourceType } from '@/game/resources';
import { POPULATION_BASE_CONSUMPTION_PER_PERSON_PER_MINUTE, POPULATION_CONSUMPTION_BASKETS } from './populationConstants';

export type PopulationSnapshot = {
  householdBalance: number;
  currentConsumptionGameMinute: number;
  currentMinuteConsumption: Record<ResourceType, number>;
};

function createEmptyConsumption(): Record<ResourceType, number> {
  return Object.fromEntries(RESOURCE_TYPES.map((resourceType) => [resourceType, 0])) as Record<ResourceType, number>;
}

/** Aggregate household money owned by the current population. */
export class PopulationLedger {
  private householdBalance = 0;
  private currentConsumptionGameMinute = 0;
  private currentMinuteConsumption = createEmptyConsumption();

  constructor(snapshot?: PopulationSnapshot) {
    if (snapshot) this.restore(snapshot);
  }

  getHouseholdBalance(): number {
    return this.householdBalance;
  }

  /** Fulfilled Local Market purchases accumulated in the current foreground game minute. */
  getCurrentMinuteConsumption(): Readonly<Record<ResourceType, number>> {
    return { ...this.currentMinuteConsumption };
  }

  creditWages(amount: number): boolean {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    this.householdBalance += amount;
    return true;
  }

  /** Pays an affordable Local Market purchase from the aggregate household balance. */
  spendHouseholdCash(amount: number): boolean {
    if (!Number.isFinite(amount) || amount <= 0 || amount > this.householdBalance) return false;
    this.householdBalance -= amount;
    return true;
  }

  advanceConsumptionMinute(occurredAtGameTimeMs: number): boolean {
    if (!Number.isFinite(occurredAtGameTimeMs) || occurredAtGameTimeMs < 0) return false;
    // A step ending exactly on a minute boundary belongs to the minute it completed.
    const gameMinute = Math.max(0, Math.floor((occurredAtGameTimeMs - 1) / 60_000));
    if (gameMinute === this.currentConsumptionGameMinute) return false;
    this.currentConsumptionGameMinute = gameMinute;
    this.currentMinuteConsumption = createEmptyConsumption();
    return true;
  }

  recordLocalMarketConsumption(resourceType: ResourceType, amount: number, occurredAtGameTimeMs: number): boolean {
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(occurredAtGameTimeMs) || occurredAtGameTimeMs < 0) return false;
    this.advanceConsumptionMinute(occurredAtGameTimeMs);
    this.currentMinuteConsumption[resourceType] += amount;
    return true;
  }

  clone(): PopulationLedger {
    return new PopulationLedger(this.toSnapshot());
  }

  toSnapshot(): PopulationSnapshot {
    return {
      householdBalance: this.householdBalance,
      currentConsumptionGameMinute: this.currentConsumptionGameMinute,
      currentMinuteConsumption: { ...this.currentMinuteConsumption },
    };
  }

  private restore(snapshot: PopulationSnapshot): void {
    this.householdBalance = Number.isFinite(snapshot.householdBalance) && snapshot.householdBalance >= 0
      ? snapshot.householdBalance
      : 0;
    this.currentConsumptionGameMinute = Number.isInteger(snapshot.currentConsumptionGameMinute) && snapshot.currentConsumptionGameMinute >= 0
      ? snapshot.currentConsumptionGameMinute
      : 0;
    this.currentMinuteConsumption = createEmptyConsumption();
    for (const resourceType of RESOURCE_TYPES) {
      const amount = snapshot.currentMinuteConsumption?.[resourceType];
      this.currentMinuteConsumption[resourceType] = Number.isFinite(amount) && amount >= 0 ? amount : 0;
    }
  }

  static fromSnapshot(snapshot: PopulationSnapshot): PopulationLedger {
    return new PopulationLedger(snapshot);
  }
}

export type PopulationDemand = {
  population: number;
  baseConsumptionPerPerson: Readonly<Record<ResourceType, number>>;
  totalConsumption: Readonly<Record<ResourceType, number>>;
};

export type PopulationPurchaseCost = {
  byResource: Readonly<Record<ResourceType, number>>;
  total: number;
};

export type PopulationIncomeProjection = {
  totalWagePayoutPerMinute: number;
  projectedPurchaseCostPerMinute: number;
  surplusPerMinute: number;
};

export type PopulationDemandBasket = {
  id: (typeof POPULATION_CONSUMPTION_BASKETS)[number]['id'];
  label: string;
  resourceTypes: readonly ResourceType[];
  hasDirectConsumption: boolean;
  baseConsumptionPerPerson: number;
  totalConsumption: number;
};

export type PopulationAffordabilityProjection = {
  householdBalance: number;
  projectedPurchaseCostPerMinute: number;
  affordableMinutes: number | null;
  unfundedPurchaseCost: number;
  canAffordFullBasket: boolean;
};

export type PopulationExpenditureBreakdown = {
  id: (typeof POPULATION_CONSUMPTION_BASKETS)[number]['id'];
  label: string;
  projectedPurchaseCost: number;
  expenditureShare: number;
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

/** Sums the total wage payout facilities currently project for one game-minute. */
export function calculatePopulationTotalWagePayoutPerMinute(facilities: FacilityCollection): number {
  return facilities.getAll().reduce((total, facility) => {
    const view = facility.getView();
    const workers = Number.isFinite(view.assignedWorkers) ? Math.max(0, view.assignedWorkers) : 0;
    const wage = Number.isFinite(view.staffWagePerWorkerPerMinute)
      ? Math.max(0, view.staffWagePerWorkerPerMinute)
      : 0;
    return total + workers * wage;
  }, 0);
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

/** Groups the configured demand by the existing player-facing resource domains. */
export function calculatePopulationDemandBaskets(demand: PopulationDemand): PopulationDemandBasket[] {
  return POPULATION_CONSUMPTION_BASKETS.map((basket) => ({
    ...basket,
    hasDirectConsumption: basket.resourceTypes.some((resourceType) => demand.baseConsumptionPerPerson[resourceType] > 0),
    baseConsumptionPerPerson: basket.resourceTypes.reduce((total, resourceType) => total + demand.baseConsumptionPerPerson[resourceType], 0),
    totalConsumption: basket.resourceTypes.reduce((total, resourceType) => total + demand.totalConsumption[resourceType], 0),
  }));
}

/** Breaks projected local purchase cost into the existing resource domains. */
export function calculatePopulationExpenditureBreakdown(
  demand: PopulationDemand,
  purchaseCost: PopulationPurchaseCost,
): PopulationExpenditureBreakdown[] {
  const safeTotal = Number.isFinite(purchaseCost.total) ? Math.max(0, purchaseCost.total) : 0;
  return POPULATION_CONSUMPTION_BASKETS.map((basket) => {
    const projectedPurchaseCost = basket.resourceTypes.reduce(
      (total, resourceType) => total + (Number.isFinite(purchaseCost.byResource[resourceType])
        ? Math.max(0, purchaseCost.byResource[resourceType])
        : 0),
      0,
    );
    return {
      id: basket.id,
      label: basket.label,
      projectedPurchaseCost,
      expenditureShare: safeTotal > 0 ? projectedPurchaseCost / safeTotal : 0,
    };
  });
}

/** Calculates whether the aggregate household balance can fund one projected basket. */
export function calculatePopulationAffordability(
  householdBalance: number,
  projectedPurchaseCostPerMinute: number,
): PopulationAffordabilityProjection {
  const safeBalance = Number.isFinite(householdBalance) ? Math.max(0, householdBalance) : 0;
  const safeCost = Number.isFinite(projectedPurchaseCostPerMinute)
    ? Math.max(0, projectedPurchaseCostPerMinute)
    : 0;
  return {
    householdBalance: safeBalance,
    projectedPurchaseCostPerMinute: safeCost,
    affordableMinutes: safeCost > 0 ? safeBalance / safeCost : null,
    unfundedPurchaseCost: Math.max(0, safeCost - safeBalance),
    canAffordFullBasket: safeBalance >= safeCost,
  };
}

/** Compares projected facility wages with the population's projected local purchases. */
export function calculatePopulationIncomeProjection(
  facilities: FacilityCollection,
  projectedPurchaseCostPerMinute: number,
): PopulationIncomeProjection {
  const safeCost = Number.isFinite(projectedPurchaseCostPerMinute)
    ? Math.max(0, projectedPurchaseCostPerMinute)
    : 0;
  const totalWagePayoutPerMinute = calculatePopulationTotalWagePayoutPerMinute(facilities);
  return {
    totalWagePayoutPerMinute,
    projectedPurchaseCostPerMinute: safeCost,
    surplusPerMinute: totalWagePayoutPerMinute - safeCost,
  };
}
