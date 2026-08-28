import { Facility, type FacilitySnapshot } from './facility';
import { FACILITY_TYPES, getFacilityDefaultSize, isValidFacilitySize } from './facilityConstants';
import { FacilityType } from './facilityTypes';
/** Plain collection data used by the game snapshot and Expo SQLite adapter. */
export type FacilityCollectionSnapshot = {   facilities: FacilitySnapshot[]; };

/**
 * Player-owned constructed facilities.
 */
export class FacilityCollection {
  private facilities: Facility[] = [];
  private staffWageBaseMultiplier = 1;

  setStaffWageBaseMultiplier(multiplier: number): void {
    this.staffWageBaseMultiplier = Number.isFinite(multiplier) ? Math.max(0.1, multiplier) : 1;
    for (const facility of this.facilities) facility.setStaffWageBaseMultiplier(this.staffWageBaseMultiplier);
  }

  has(facilityType: FacilityType): boolean {
    return this.facilities.some((facility) => facility.facilityType === facilityType);
  }

  get(facilityId: string): Facility | null {
    return this.facilities.find((facility) => facility.id === facilityId) ?? null;
  }

  getAll(): Facility[] {
    return [...this.facilities].sort((left, right) => (
      FACILITY_TYPES.indexOf(left.facilityType) - FACILITY_TYPES.indexOf(right.facilityType)
      || left.id.localeCompare(right.id, undefined, { numeric: true })
    ));
  }

  getAllByType(facilityType: FacilityType): Facility[] {
    return this.getAll().filter((facility) => facility.facilityType === facilityType);
  }

  build(facilityType: FacilityType, sizeHectares?: number): boolean {
    const selectedSize = sizeHectares ?? getFacilityDefaultSize(facilityType);
    if (!isValidFacilitySize(facilityType, selectedSize)) {
      return false;
    }

    const nextNumber = this.getAllByType(facilityType).reduce((highest, facility) => (
      Math.max(highest, Number(facility.id.split('-').at(-1)) || 0)
    ), 0) + 1;
    const facility = new Facility(`${facilityType}-${nextNumber}`, facilityType, selectedSize);
    facility.setStaffWageBaseMultiplier(this.staffWageBaseMultiplier);
    this.facilities.push(facility);
    return true;
  }

  destroy(facilityId: string): boolean {
    const index = this.facilities.findIndex((facility) => facility.id === facilityId);
    if (index === -1) {
      return false;
    }

    this.facilities.splice(index, 1);
    return true;
  }

  applyPassiveConditionLoss(loss: number): boolean {
    let changed = false;

    for (const facility of this.facilities) {
      changed = facility.applyConditionLoss(loss) || changed;
    }

    return changed;
  }

  clone(): FacilityCollection {
    const clone = FacilityCollection.fromSnapshot(this.toSnapshot());
    clone.setStaffWageBaseMultiplier(this.staffWageBaseMultiplier);
    return clone;
  }

  toSnapshot(): FacilityCollectionSnapshot {
    return {
      facilities: this.facilities.map((facility) => facility.toSnapshot()),
    };
  }

  static fromSnapshot(snapshot: FacilityCollectionSnapshot): FacilityCollection {
    const collection = new FacilityCollection();

    for (const facilitySnapshot of snapshot.facilities) {
      if (!(FACILITY_TYPES as readonly FacilityType[]).includes(facilitySnapshot.facilityType)
        || !isValidFacilitySize(facilitySnapshot.facilityType, facilitySnapshot.sizeHectares)
        || collection.get(facilitySnapshot.id)) {
        continue;
      }

      collection.facilities.push(Facility.fromSnapshot(facilitySnapshot));
    }

    return collection;
  }
}
