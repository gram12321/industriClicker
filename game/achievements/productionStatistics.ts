import { RESOURCE_TYPES, type ResourceType } from '@/game/resources';

export type ProductionStatisticsSnapshot = {
  producedByResource: Record<ResourceType, number>;
  repairedCondition: number;
  largestRepair: number;
  repairValueEuros: number;
};

function createEmptyProducedByResource(): Record<ResourceType, number> {
  return RESOURCE_TYPES.reduce((totals, resourceType) => {
    totals[resourceType] = 0;
    return totals;
  }, {} as Record<ResourceType, number>);
}

export function isProductionStatisticsSnapshot(value: unknown): value is ProductionStatisticsSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const totals = (value as Record<string, unknown>).producedByResource;
  if (typeof totals !== 'object' || totals === null) {
    return false;
  }

  const resourceTotals = totals as Record<ResourceType, unknown>;
  return RESOURCE_TYPES.every((resourceType) => typeof resourceTotals[resourceType] === 'number'
    && Number.isFinite(resourceTotals[resourceType])
    && resourceTotals[resourceType] >= 0);
}

export class ProductionStatistics {
  private producedByResource: Record<ResourceType, number> = createEmptyProducedByResource();
  private repairedCondition = 0;
  private largestRepair = 0;
  private repairValueEuros = 0;

  constructor(snapshot?: ProductionStatisticsSnapshot) {
    if (snapshot) {
      for (const resourceType of RESOURCE_TYPES) {
      this.producedByResource[resourceType] = snapshot.producedByResource[resourceType];
    }
    this.repairedCondition = snapshot.repairedCondition;
    this.largestRepair = snapshot.largestRepair;
    this.repairValueEuros = snapshot.repairValueEuros;
    }
  }

  recordRepair(condition: number, valueEuros: number): boolean {
    if (!Number.isFinite(condition) || condition <= 0 || !Number.isFinite(valueEuros) || valueEuros < 0) return false;
    this.repairedCondition += condition;
    this.largestRepair = Math.max(this.largestRepair, condition);
    this.repairValueEuros += valueEuros;
    return true;
  }

  getRepairedCondition(): number { return this.repairedCondition; }
  getLargestRepair(): number { return this.largestRepair; }
  getRepairValueEuros(): number { return this.repairValueEuros; }

  getTotalProduced(): number {
    return RESOURCE_TYPES.reduce((total, resourceType) => total + this.producedByResource[resourceType], 0);
  }

  record(resourceType: ResourceType, amount: number): boolean {
    if (!Number.isFinite(amount) || amount <= 0) {
      return false;
    }

    this.producedByResource[resourceType] += amount;
    return true;
  }

  clone(): ProductionStatistics {
    return ProductionStatistics.fromSnapshot(this.toSnapshot());
  }

  toSnapshot(): ProductionStatisticsSnapshot {
    return { producedByResource: { ...this.producedByResource }, repairedCondition: this.repairedCondition, largestRepair: this.largestRepair, repairValueEuros: this.repairValueEuros };
  }

  static fromSnapshot(snapshot: ProductionStatisticsSnapshot): ProductionStatistics {
    return new ProductionStatistics(snapshot);
  }
}
