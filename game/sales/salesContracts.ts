import type { ResourceType } from '../resources/resourceTypes';

/** Chance to receive a customer contract during one foreground game minute. */
export const SALES_CONTRACT_OFFER_CHANCE_PER_MINUTE = 0.2;
export const SALES_CONTRACT_ESTIMATED_WAIT_MINUTES = 1 / SALES_CONTRACT_OFFER_CHANCE_PER_MINUTE;
export const SALES_CONTRACT_UNIT_PRICE_EUROS = 1;
export const SALES_CONTRACT_MIN_QUANTITY = 1;
export const SALES_CONTRACT_MAX_QUANTITY = 10;

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
    && value.quantity >= SALES_CONTRACT_MIN_QUANTITY
    && value.quantity <= SALES_CONTRACT_MAX_QUANTITY
    && Number.isFinite(value.reward)
    && value.reward === value.quantity * SALES_CONTRACT_UNIT_PRICE_EUROS
    && value.offeredAt.length > 0
  );
}

function cloneContract(contract: SalesContract): SalesContract {
  return { ...contract };
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
      if (clampRandom(random()) < SALES_CONTRACT_OFFER_CHANCE_PER_MINUTE) {
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
      SALES_CONTRACT_MAX_QUANTITY,
      SALES_CONTRACT_MIN_QUANTITY + Math.floor(quantityRoll * SALES_CONTRACT_MAX_QUANTITY),
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
