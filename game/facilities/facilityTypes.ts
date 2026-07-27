/** The closed catalogue of facilities currently available to the player. */
export enum FacilityType {
  Farm = 'farm',
  Bakery = 'bakery',
  SmallUtilityWorks = 'small-utility-works',
  Mine = 'mine',
  WaterWell = 'water-well',
  PowerPlant = 'power-plant',
}

export const FACILITY_TYPES = [
  FacilityType.Farm,
  FacilityType.Bakery,
  FacilityType.SmallUtilityWorks,
  FacilityType.Mine,
  FacilityType.WaterWell,
  FacilityType.PowerPlant,
] as const;
