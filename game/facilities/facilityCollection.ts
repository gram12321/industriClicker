import { Facility, type FacilitySnapshot } from './facility';
import { FACILITY_TYPES, FacilityType } from './facilityTypes';

/** Plain collection data used by the game snapshot and Expo SQLite adapter. */
export type FacilityCollectionSnapshot = {
  facilities: FacilitySnapshot[];
};

/**
 * Player-owned constructed facilities. A facility type can be constructed once.
 */
export class FacilityCollection {
  private facilities: Partial<Record<FacilityType, Facility>> = {};

  has(facilityType: FacilityType): boolean {
    return this.facilities[facilityType] !== undefined;
  }

  get(facilityType: FacilityType): Facility | null {
    return this.facilities[facilityType] ?? null;
  }

  getAll(): Facility[] {
    return FACILITY_TYPES.flatMap((facilityType) => {
      const facility = this.facilities[facilityType];
      return facility ? [facility] : [];
    });
  }

  build(facilityType: FacilityType): boolean {
    if (this.has(facilityType)) {
      return false;
    }

    this.facilities[facilityType] = new Facility(facilityType);
    return true;
  }

  destroy(facilityType: FacilityType): boolean {
    if (!this.has(facilityType)) {
      return false;
    }

    delete this.facilities[facilityType];
    return true;
  }

  clear(): void {
    this.facilities = {};
  }

  clone(): FacilityCollection {
    return FacilityCollection.fromSnapshot(this.toSnapshot());
  }

  toSnapshot(): FacilityCollectionSnapshot {
    return {
      facilities: this.getAll().map((facility) => facility.toSnapshot()),
    };
  }

  static fromSnapshot(snapshot: FacilityCollectionSnapshot): FacilityCollection {
    const collection = new FacilityCollection();

    for (const facilitySnapshot of snapshot.facilities) {
      if (!(FACILITY_TYPES as readonly FacilityType[]).includes(facilitySnapshot.facilityType) || collection.has(facilitySnapshot.facilityType)) {
        continue;
      }

      collection.facilities[facilitySnapshot.facilityType] = Facility.fromSnapshot(facilitySnapshot);
    }

    return collection;
  }
}
