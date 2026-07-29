import type { ResourceType } from '../resources/resourceTypes';
import {
  calculateAsymmetricalScaler01,
  normalizeWithControlPoints01,
  type NormalizationControlPoint,
} from '../core/math/scaling';

/** The number of unfulfilled contracts treated as the probability curve's theoretical maximum. */
export const SALES_CONTRACT_UNFULFILLED_THEORETICAL_MAXIMUM = 1_000_000;
export const SALES_CONTRACT_UNFULFILLED_CHANCE_CONTROL_POINTS = [
  { input: 0, normalized: 0 },
  { input: 3, normalized: 0.25 },
  { input: 5, normalized: 0.5 },
  { input: 10, normalized: 0.75 },
  { input: SALES_CONTRACT_UNFULFILLED_THEORETICAL_MAXIMUM, normalized: 1 - Number.EPSILON },
] as const satisfies readonly NormalizationControlPoint[];
export const SALES_CONTRACT_UNIT_PRICE_EUROS = 1;
export const SALES_CONTRACT_MIN_REQUEST_QUANTITY = 1;
export const SALES_CONTRACT_MAX_REQUEST_QUANTITY = 10;

export type SalesContract = {
  id: string;
  customerName: string;
  resourceType: ResourceType;
  quantity: number;
  reward: number;
  offeredAt: string;
  fulfilledAt?: string;
};

/** Plain game data persisted inside the current game snapshot. */
export type SalesContractsSnapshot = {
  offered: SalesContract[];
  completed: SalesContract[];
  nextCustomerNumber: number;
};

function isContract(value: SalesContract): boolean {
  return (
    value.id.length > 0
    && value.customerName.length > 0
    && Number.isInteger(value.quantity)
    && value.quantity >= SALES_CONTRACT_MIN_REQUEST_QUANTITY
    && value.quantity <= SALES_CONTRACT_MAX_REQUEST_QUANTITY
    && Number.isFinite(value.reward)
    && value.reward === value.quantity * SALES_CONTRACT_UNIT_PRICE_EUROS
    && value.offeredAt.length > 0
  );
}

function cloneContract(contract: SalesContract): SalesContract {
  return { ...contract };
}

/**
 * Calculates the direct customer offer chance for one foreground minute.
 * Starts at 1.0 with no unfulfilled contracts, then maps contract count through
 * consumer-defined control points and the inverted asymmetrical curve.
 * The result remains positive and approaches 0 without reaching it.
 *
 * Rough mapping with Sales control points:
 * 0 → 100%, 3 → ~63%, 5 → ~30%, 10 → ~8%, 1,000,000+ → effectively 0%
 */
export function calculateSalesContractOfferChance(unfulfilledContractCount: number): number {
  const normalizedCount = normalizeWithControlPoints01(
    unfulfilledContractCount,
    SALES_CONTRACT_UNFULFILLED_CHANCE_CONTROL_POINTS,
  );

  return 1 - calculateAsymmetricalScaler01(normalizedCount);
}

/**
 * Calculates the expected foreground minutes until the next customer offer.
 * This is the geometric-distribution mean: 1 / current per-minute chance.
 */
export function calculateSalesContractEstimatedWaitMinutes(unfulfilledContractCount: number): number {
  const chance = calculateSalesContractOfferChance(unfulfilledContractCount);
  return chance > 0 ? 1 / chance : 0;
}

/**
 * Player contract state. Offer generation accepts a random source so its rules
 * stay independently testable; generated results become durable snapshot data.
 */
export class SalesContracts {
  private offered: SalesContract[] = [];
  private completed: SalesContract[] = [];
  private nextCustomerNumber = 1;

  constructor(snapshot?: SalesContractsSnapshot) {
    if (snapshot) {
      this.restore(snapshot);
    }
  }

  getOfferedContracts(): SalesContract[] {
    return this.offered.map(cloneContract);
  }

  getCompletedContracts(): SalesContract[] {
    return this.completed.map(cloneContract);
  }

  getOfferedContract(id: string): SalesContract | null {
    const contract = this.offered.find((offer) => offer.id === id);
    return contract ? cloneContract(contract) : null;
  }

  advanceTime(elapsedMinutes: number, resourceTypes: readonly ResourceType[], random = Math.random): number {
    if (!Number.isInteger(elapsedMinutes) || elapsedMinutes <= 0 || resourceTypes.length === 0) {
      return 0;
    }

    let contractsCreated = 0;

    for (let minute = 0; minute < elapsedMinutes; minute += 1) {
      if (clampRandom(random()) < calculateSalesContractOfferChance(this.offered.length)) {
        this.offered.push(this.createOffer(resourceTypes, random));
        contractsCreated += 1;
      }
    }

    return contractsCreated;
  }

  fulfill(id: string, fulfilledAt: string): SalesContract | null {
    if (fulfilledAt.length === 0) {
      return null;
    }

    const offerIndex = this.offered.findIndex((offer) => offer.id === id);
    if (offerIndex < 0) {
      return null;
    }

    const [offer] = this.offered.splice(offerIndex, 1);
    const completedContract = { ...offer, fulfilledAt };
    this.completed.unshift(completedContract);
    return cloneContract(completedContract);
  }

  clone(): SalesContracts {
    return SalesContracts.fromSnapshot(this.toSnapshot());
  }

  toSnapshot(): SalesContractsSnapshot {
    return {
      offered: this.getOfferedContracts(),
      completed: this.getCompletedContracts(),
      nextCustomerNumber: this.nextCustomerNumber,
    };
  }

  static fromSnapshot(snapshot: SalesContractsSnapshot): SalesContracts {
    return new SalesContracts(snapshot);
  }

  private createOffer(resourceTypes: readonly ResourceType[], random: () => number): SalesContract {
    const resourceRoll = clampRandom(random());
    const quantityRoll = clampRandom(random());
    const resourceIndex = Math.floor(resourceRoll * resourceTypes.length);
    const quantity = Math.min(
      SALES_CONTRACT_MAX_REQUEST_QUANTITY,
      SALES_CONTRACT_MIN_REQUEST_QUANTITY + Math.floor(quantityRoll * SALES_CONTRACT_MAX_REQUEST_QUANTITY),
    );
    const customerNumber = this.nextCustomerNumber;
    this.nextCustomerNumber += 1;

    return {
      id: `sales-contract-${customerNumber}`,
      customerName: `Customer #${customerNumber}`,
      resourceType: resourceTypes[resourceIndex],
      quantity,
      reward: quantity * SALES_CONTRACT_UNIT_PRICE_EUROS,
      offeredAt: new Date().toISOString(),
    };
  }

  private restore(snapshot: SalesContractsSnapshot): void {
    this.offered = snapshot.offered.filter(isContract).map(cloneContract);
    this.completed = snapshot.completed
      .filter((contract) => isContract(contract) && typeof contract.fulfilledAt === 'string' && contract.fulfilledAt.length > 0)
      .map(cloneContract);
    this.nextCustomerNumber = Number.isInteger(snapshot.nextCustomerNumber) && snapshot.nextCustomerNumber > 0
      ? snapshot.nextCustomerNumber
      : 1;
  }
}

function clampRandom(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(0.999999999, value));
}
