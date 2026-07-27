import { RESOURCE_TYPES, ResourceType } from '../resources/resourceTypes';

/** Quality is intentionally fixed at this value until quality rules are designed. */
export const DEFAULT_RESOURCE_QUALITY = 1;

/** Quantity and quality are owned together for one player-held resource. */
export type InventoryEntry = {
  quantity: number;
  quality: number;
};

/** Plain, JSON-safe representation reserved for the future SQLite save adapter. */
export type InventorySnapshot = {
  entries: Record<ResourceType, InventoryEntry>;
};

function createEmptyEntries(): Record<ResourceType, InventoryEntry> {
  return {
    [ResourceType.Grain]: { quantity: 0, quality: DEFAULT_RESOURCE_QUALITY },
    [ResourceType.Bread]: { quantity: 0, quality: DEFAULT_RESOURCE_QUALITY },
  };
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

  has(resourceType: ResourceType, amount = 1): boolean {
    return isValidQuantity(amount) && this.getAmount(resourceType) >= amount;
  }

  add(resourceType: ResourceType, amount = 1): boolean {
    if (!isValidQuantity(amount)) {
      return false;
    }

    this.entries[resourceType].quantity += amount;
    return true;
  }

  remove(resourceType: ResourceType, amount = 1): boolean {
    if (!this.has(resourceType, amount)) {
      return false;
    }

    this.entries[resourceType].quantity -= amount;
    return true;
  }

  clear(): void {
    this.entries = createEmptyEntries();
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
          : DEFAULT_RESOURCE_QUALITY,
      };
    }
  }
}
