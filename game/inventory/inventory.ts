import { RESOURCE_TYPES, type ResourceType } from '@/game/resources';
import { INVENTORY_DEFAULT_RESOURCE_QUALITY } from './inventoryConstants';

const INVENTORY_QUANTITY_TOLERANCE = 1e-9;

/** Quantity and quality are owned together for one player-held resource. */
export type InventoryEntry = {
  quantity: number;
  quality: number;
};

/** Plain, JSON-safe representation stored by the company-scoped SQLite save adapter. */
export type InventorySnapshot = {
  entries: Record<ResourceType, InventoryEntry>;
};

function createEmptyEntries(): Record<ResourceType, InventoryEntry> {
  return RESOURCE_TYPES.reduce((entries, resourceType) => {
    entries[resourceType] = { quantity: 0, quality: INVENTORY_DEFAULT_RESOURCE_QUALITY };
    return entries;
  }, {} as Record<ResourceType, InventoryEntry>);
}

function isValidQuantity(quantity: number): boolean {
  return Number.isFinite(quantity) && quantity > 0;
}

/**
 * Player-owned resources and their associated quality.
 *
 * This class owns inventory invariants; callers use its commands rather than
 * mutating entries directly.
 */
export class Inventory {
  private entries: Record<ResourceType, InventoryEntry>;

  constructor(snapshot?: InventorySnapshot) {
    this.entries = createEmptyEntries();

    if (snapshot) {
      this.restore(snapshot);
    }
  }

  getAmount(resourceType: ResourceType): number {
    return this.entries[resourceType].quantity;
  }

  getQuality(resourceType: ResourceType): number {
    return this.entries[resourceType].quality;
  }

  getEntry(resourceType: ResourceType): InventoryEntry {
    return { ...this.entries[resourceType] };
  }

  has(resourceType: ResourceType, amount: number): boolean {
    return isValidQuantity(amount) && this.getAmount(resourceType) + INVENTORY_QUANTITY_TOLERANCE >= amount;
  }

  add(resourceType: ResourceType, amount: number, quality = INVENTORY_DEFAULT_RESOURCE_QUALITY): boolean {
    if (!isValidQuantity(amount)) {
      return false;
    }

    if (!Number.isFinite(quality) || quality <= 0) {
      return false;
    }

    const entry = this.entries[resourceType];
    entry.quality = (entry.quantity * entry.quality + amount * quality) / (entry.quantity + amount);
    entry.quantity += amount;
    return true;
  }

  remove(resourceType: ResourceType, amount: number): boolean {
    if (!this.has(resourceType, amount)) {
      return false;
    }

    this.entries[resourceType].quantity = Math.max(0, this.entries[resourceType].quantity - amount);
    return true;
  }

  setAmount(resourceType: ResourceType, amount: number): boolean {
    if (!Number.isFinite(amount) || amount < 0) {
      return false;
    }

    this.entries[resourceType].quantity = amount;
    return true;
  }

  clone(): Inventory {
    return new Inventory(this.toSnapshot());
  }

  toSnapshot(): InventorySnapshot {
    const entries = createEmptyEntries();

    for (const resourceType of RESOURCE_TYPES) {
      entries[resourceType] = { ...this.entries[resourceType] };
    }

    return { entries };
  }

  static fromSnapshot(snapshot: InventorySnapshot): Inventory {
    return new Inventory(snapshot);
  }

  private restore(snapshot: InventorySnapshot): void {
    for (const resourceType of RESOURCE_TYPES) {
      const entry = snapshot.entries[resourceType];

      if (!entry) {
        continue;
      }

      this.entries[resourceType] = {
        quantity: Number.isFinite(entry.quantity) && entry.quantity >= 0 ? entry.quantity : 0,
        quality: Number.isFinite(entry.quality) && entry.quality > 0
          ? entry.quality
          : INVENTORY_DEFAULT_RESOURCE_QUALITY,
      };
    }
  }
}
