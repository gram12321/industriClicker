import { RESOURCE_TYPES, type ResourceType } from '@/game/resources';

const RESOURCE_FLOW_HISTORY_MS = 60 * 60 * 1_000;

type ResourceFlowKind = 'facility-output' | 'facility-input' | 'market-buy' | 'market-sell' | 'customer-order' | 'facility-spending' | 'reward';

type ResourceFlowValues = Partial<Record<ResourceFlowKind, Partial<Record<ResourceType, number>>>>;

type ResourceFlowBucket = {
  occurredAtGameTimeMs: number;
  values: ResourceFlowValues;
};

type ResourceFlowSnapshot = {
  allTime: ResourceFlowValues;
  recentBuckets: ResourceFlowBucket[];
  highestFacilityOutputQuality?: Partial<Record<ResourceType, number>>;
};

function createEmptyValues(): ResourceFlowValues {
  return {};
}

function cloneValues(values: ResourceFlowValues): ResourceFlowValues {
  return Object.fromEntries(Object.entries(values).map(([kind, amounts]) => [kind, { ...amounts }])) as ResourceFlowValues;
}

function cloneBucket(bucket: ResourceFlowBucket): ResourceFlowBucket {
  return { occurredAtGameTimeMs: bucket.occurredAtGameTimeMs, values: cloneValues(bucket.values) };
}

function isFlowKind(value: unknown): value is ResourceFlowKind {
  return value === 'facility-output' || value === 'facility-input' || value === 'market-buy'
    || value === 'market-sell' || value === 'customer-order' || value === 'facility-spending' || value === 'reward';
}

function isValues(value: unknown): value is ResourceFlowValues {
  if (typeof value !== 'object' || value === null) return false;

  return Object.entries(value).every(([kind, amounts]) => isFlowKind(kind)
    && typeof amounts === 'object' && amounts !== null
    && Object.entries(amounts).every(([resourceType, amount]) => RESOURCE_TYPES.includes(resourceType as ResourceType)
      && typeof amount === 'number' && Number.isFinite(amount)));
}

function addAmount(values: ResourceFlowValues, kind: ResourceFlowKind, resourceType: ResourceType, amount: number): void {
  const amounts = values[kind] ?? {};
  amounts[resourceType] = (amounts[resourceType] ?? 0) + amount;
  values[kind] = amounts;
}

/**
 * Company-owned resource movement history. The most recent foreground hour is kept
 * at second precision; all-time category totals make lifetime reporting bounded.
 */
export class ResourceFlowLedger {
  private allTime: ResourceFlowValues = createEmptyValues();
  private recentBuckets: ResourceFlowBucket[] = [];
  private highestFacilityOutputQuality: Partial<Record<ResourceType, number>> = {};

  constructor(snapshot?: ResourceFlowSnapshot) {
    if (snapshot) {
      this.allTime = cloneValues(snapshot.allTime);
      this.recentBuckets = snapshot.recentBuckets.map(cloneBucket);
      this.highestFacilityOutputQuality = { ...(snapshot.highestFacilityOutputQuality ?? {}) };
    }
  }

  record(kind: ResourceFlowKind, resourceType: ResourceType, amount: number, occurredAtGameTimeMs: number): boolean {
    if (!Number.isFinite(amount) || amount === 0 || !Number.isFinite(occurredAtGameTimeMs)) return false;

    const bucketTimeMs = Math.floor(occurredAtGameTimeMs / 1_000) * 1_000;
    const latestBucket = this.recentBuckets.at(-1);
    const bucket = latestBucket?.occurredAtGameTimeMs === bucketTimeMs
      ? latestBucket
      : { occurredAtGameTimeMs: bucketTimeMs, values: createEmptyValues() };

    if (bucket !== latestBucket) this.recentBuckets.push(bucket);
    addAmount(this.allTime, kind, resourceType, amount);
    addAmount(bucket.values, kind, resourceType, amount);
    this.prune(occurredAtGameTimeMs);
    return true;
  }

  recordFacilityOutput(resourceType: ResourceType, amount: number, quality: number, occurredAtGameTimeMs: number): boolean {
    if (!Number.isFinite(quality) || quality <= 0 || !this.record('facility-output', resourceType, amount, occurredAtGameTimeMs)) return false;
    this.highestFacilityOutputQuality[resourceType] = Math.max(this.highestFacilityOutputQuality[resourceType] ?? 0, quality);
    return true;
  }

  getHighestFacilityOutputQuality(): number {
    return Math.max(1, ...Object.values(this.highestFacilityOutputQuality).filter((quality): quality is number => Number.isFinite(quality)));
  }

  hasExpiredBuckets(currentGameTimeMs: number): boolean {
    return this.recentBuckets.some((bucket) => bucket.occurredAtGameTimeMs < currentGameTimeMs - RESOURCE_FLOW_HISTORY_MS);
  }

  prune(currentGameTimeMs: number): boolean {
    const firstCurrentIndex = this.recentBuckets.findIndex((bucket) => bucket.occurredAtGameTimeMs >= currentGameTimeMs - RESOURCE_FLOW_HISTORY_MS);
    if (firstCurrentIndex <= 0) return false;
    this.recentBuckets.splice(0, firstCurrentIndex);
    return true;
  }

  getSummary(resourceType: ResourceType, currentGameTimeMs: number, periodMs: number | null) {
    const values = createEmptyValues();
    if (periodMs === null) {
      for (const [kind, amounts] of Object.entries(this.allTime)) {
        if (isFlowKind(kind) && amounts?.[resourceType]) addAmount(values, kind, resourceType, amounts[resourceType]);
      }
    } else {
      const earliestGameTimeMs = currentGameTimeMs - periodMs;
      for (const bucket of this.recentBuckets) {
        if (bucket.occurredAtGameTimeMs < earliestGameTimeMs) continue;
        for (const [kind, amounts] of Object.entries(bucket.values)) {
          if (isFlowKind(kind) && amounts?.[resourceType]) addAmount(values, kind, resourceType, amounts[resourceType]);
        }
      }
    }

    const facilityOutput = values['facility-output']?.[resourceType] ?? 0;
    const facilityInput = values['facility-input']?.[resourceType] ?? 0;
    const marketBought = values['market-buy']?.[resourceType] ?? 0;
    const marketSold = values['market-sell']?.[resourceType] ?? 0;
    const customerOrders = values['customer-order']?.[resourceType] ?? 0;
    const facilitySpending = values['facility-spending']?.[resourceType] ?? 0;
    const rewards = values.reward?.[resourceType] ?? 0;
    const market = marketBought + marketSold;

    return {
      customerOrders,
      facilityInput,
      facilityOutput,
      facilitySpending,
      market,
      marketVolume: Math.abs(marketBought) + Math.abs(marketSold),
      netChange: facilityOutput + facilityInput + market + customerOrders + facilitySpending + rewards,
      rewards,
    };
  }

  getLifetimeFacilityOutputByResource(): Record<ResourceType, number> {
    return Object.fromEntries(RESOURCE_TYPES.map((resourceType) => [resourceType, this.getLifetimeFacilityOutput(resourceType)])) as Record<ResourceType, number>;
  }

  getLifetimeFacilityOutput(resourceType: ResourceType): number {
    return this.allTime['facility-output']?.[resourceType] ?? 0;
  }

  getTotalLifetimeFacilityOutput(): number {
    return RESOURCE_TYPES.reduce((total, resourceType) => total + this.getLifetimeFacilityOutput(resourceType), 0);
  }

  clone(): ResourceFlowLedger {
    return new ResourceFlowLedger(this.toSnapshot());
  }

  toSnapshot(): ResourceFlowSnapshot {
    return { allTime: cloneValues(this.allTime), recentBuckets: this.recentBuckets.map(cloneBucket), highestFacilityOutputQuality: { ...this.highestFacilityOutputQuality } };
  }

  static isSnapshot(value: unknown): value is ResourceFlowSnapshot {
    if (typeof value !== 'object' || value === null) return false;
    const snapshot = value as Record<string, unknown>;
    return isValues(snapshot.allTime)
      && Array.isArray(snapshot.recentBuckets)
      && snapshot.recentBuckets.every((bucket) => typeof bucket === 'object' && bucket !== null
        && typeof (bucket as Record<string, unknown>).occurredAtGameTimeMs === 'number'
        && Number.isFinite((bucket as Record<string, unknown>).occurredAtGameTimeMs)
        && isValues((bucket as Record<string, unknown>).values));
  }

  static fromSnapshot(snapshot: ResourceFlowSnapshot): ResourceFlowLedger {
    return new ResourceFlowLedger(snapshot);
  }
}
