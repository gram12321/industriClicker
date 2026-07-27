/** The closed catalogue of facilities currently available to the player. */
export enum FacilityType {
  Farm = 'farm',
  Bakery = 'bakery',
  SmallUtilityWorks = 'small-utility-works',
}

export const FACILITY_TYPES = [FacilityType.Farm, FacilityType.Bakery, FacilityType.SmallUtilityWorks] as const;
