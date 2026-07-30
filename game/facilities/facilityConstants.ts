import { ALL_RECIPES } from '../recipes/recipeConstants';
import { RecipeName, type Recipe } from '../recipes/recipeTypes';
import { FacilityType } from './facilityTypes';

export const FACILITY_TYPES = [
  FacilityType.Farm,
  FacilityType.Bakery,
  FacilityType.SmallUtilityWorks,
  FacilityType.Mine,
  FacilityType.WaterWell,
  FacilityType.PowerPlant,
] as const;

export const FACILITY_UPGRADE_COST_GROWTH = 1.5;
export const FACILITY_SPEED_MAXIMUM_BONUS = 0.8;
export const FACILITY_SPEED_BONUS_RATE = 0.22;
export const FACILITY_OUTPUT_MAXIMUM_BONUS = 1;
export const FACILITY_OUTPUT_BONUS_RATE = 0.18;
export const FACILITY_WORKER_REQUIREMENT_GROWTH = 1.15;
export const FACILITY_UNDERSTAFFING_EXPONENT = 1.6;
export const FACILITY_OVERSTAFFING_MAXIMUM_BONUS = 0.25;
export const FACILITY_OVERSTAFFING_BONUS_RATE = 0.7;
export const FACILITY_MINIMUM_STAFFING_EFFICIENCY = 0.01;

/** Fixed order keeps production deterministic and runs utility producers first. */
export const FACILITY_PRODUCTION_ORDER = [
  FacilityType.SmallUtilityWorks,
  FacilityType.Farm,
  FacilityType.Bakery,
  FacilityType.Mine,
  FacilityType.WaterWell,
  FacilityType.PowerPlant,
] as const;

export type FacilityDefinition = {
  type: FacilityType;
  name: string;
  icon: string;
  constructionCost: number;
  baseWorkers: number;
  recipes: readonly Recipe[];
};

/** Code-owned facility catalogue. Player-owned state belongs to FacilityCollection. */
export const FACILITIES: Readonly<Record<FacilityType, FacilityDefinition>> = {
  [FacilityType.Farm]: {
    type: FacilityType.Farm,
    name: 'Farm',
    icon: 'tractor',
    constructionCost: 60,
    baseWorkers: 2,
    recipes: [ALL_RECIPES[RecipeName.GrowGrain], ALL_RECIPES[RecipeName.GrowSugar]],
  },
  [FacilityType.Bakery]: {
    type: FacilityType.Bakery,
    name: 'Bakery',
    icon: 'bread-slice-outline',
    constructionCost: 300,
    baseWorkers: 3,
    recipes: [ALL_RECIPES[RecipeName.BakeBread], ALL_RECIPES[RecipeName.BakeCake]],
  },
  [FacilityType.SmallUtilityWorks]: {
    type: FacilityType.SmallUtilityWorks,
    name: 'Small Utility Works',
    icon: 'flash-outline',
    constructionCost: 500,
    baseWorkers: 1,
    recipes: [ALL_RECIPES[RecipeName.ProduceWater], ALL_RECIPES[RecipeName.ProduceElectricity]],
  },
  [FacilityType.Mine]: {
    type: FacilityType.Mine,
    name: 'Mine',
    icon: 'pickaxe',
    constructionCost: 150,
    baseWorkers: 10,
    recipes: [ALL_RECIPES[RecipeName.MineCoal]],
  },
  [FacilityType.WaterWell]: {
    type: FacilityType.WaterWell,
    name: 'Water Well',
    icon: 'water-well',
    constructionCost: 100,
    baseWorkers: 1,
    recipes: [ALL_RECIPES[RecipeName.ManualPumping], ALL_RECIPES[RecipeName.ElectricPumping]],
  },
  [FacilityType.PowerPlant]: {
    type: FacilityType.PowerPlant,
    name: 'Power Plant',
    icon: 'factory',
    constructionCost: 500,
    baseWorkers: 18,
    recipes: [ALL_RECIPES[RecipeName.CoalPower], ALL_RECIPES[RecipeName.SolarPower]],
  },
};

export function getFacilityDefinition(facilityType: FacilityType): FacilityDefinition {
  return FACILITIES[facilityType];
}
