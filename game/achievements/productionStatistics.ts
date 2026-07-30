import { RESOURCE_TYPES } from '../resources/resourceConstants';
import type { ResourceType } from '../resources/resourceTypes';

export type ProductionStatisticsSnapshot = {
  producedByResource: Record<ResourceType, number>;
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

  constructor(snapshot?: ProductionStatisticsSnapshot) {
    if (snapshot) {
      for (const resourceType of RESOURCE_TYPES) {
        this.producedByResource[resourceType] = snapshot.producedByResource[resourceType];
      }
    }
  }

  getProduced(resourceType: ResourceType): number {
    return this.producedByResource[resourceType];
  }

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
    return { producedByResource: { ...this.producedByResource } };
  }

  static fromSnapshot(snapshot: ProductionStatisticsSnapshot): ProductionStatistics {
    return new ProductionStatistics(snapshot);
  }
}
