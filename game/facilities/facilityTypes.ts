/** The closed catalogue of facilities currently available to the player. */
export enum FacilityType {
  Farm = 'farm',
  Bakery = 'bakery',
}

export const FACILITY_TYPES = [FacilityType.Farm, FacilityType.Bakery] as const;
