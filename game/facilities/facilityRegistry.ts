import { ALL_RECIPES } from '../recipes/recipes';
import { RecipeName, Recipe } from '../recipes/recipeTypes';
import { FacilityType } from './facilityTypes';
import { APP_ICONS } from '@/icons';

export type FacilityDefinition = {
  type: FacilityType;
  name: string;
  icon: string;
  constructionCost: number;
  baseWorkers: number;
  recipes: readonly Recipe[];
};

/**
 * Code-owned facility definitions. Player-owned construction and configuration
 * state belongs to FacilityCollection, not this registry.
 */
export const facilities: Readonly<Record<FacilityType, FacilityDefinition>> = {
  [FacilityType.Farm]: {
    type: FacilityType.Farm,
    name: 'Farm',
    icon: APP_ICONS.facilityFarm,
    constructionCost: 60,
    baseWorkers: 2,
    recipes: [ALL_RECIPES[RecipeName.GrowGrain], ALL_RECIPES[RecipeName.GrowSugar]],
  },
  [FacilityType.Bakery]: {
    type: FacilityType.Bakery,
    name: 'Bakery',
    icon: APP_ICONS.facilityBakery,
    constructionCost: 300,
    baseWorkers: 3,
    recipes: [ALL_RECIPES[RecipeName.BakeBread], ALL_RECIPES[RecipeName.BakeCake]],
  },
  [FacilityType.SmallUtilityWorks]: {
    type: FacilityType.SmallUtilityWorks,
    name: 'Small Utility Works',
    icon: APP_ICONS.facilityUtilityWorks,
    constructionCost: 500,
    baseWorkers: 1,
    recipes: [ALL_RECIPES[RecipeName.ProduceWater], ALL_RECIPES[RecipeName.ProduceElectricity]],
  },
  [FacilityType.Mine]: {
    type: FacilityType.Mine,
    name: 'Mine',
    icon: APP_ICONS.facilityMine,
    constructionCost: 150,
    baseWorkers: 10,
    recipes: [ALL_RECIPES[RecipeName.MineCoal]],
  },
  [FacilityType.WaterWell]: {
    type: FacilityType.WaterWell,
    name: 'Water Well',
    icon: APP_ICONS.facilityWaterWell,
    constructionCost: 100,
    baseWorkers: 1,
    recipes: [ALL_RECIPES[RecipeName.ManualPumping], ALL_RECIPES[RecipeName.ElectricPumping]],
  },
  [FacilityType.PowerPlant]: {
    type: FacilityType.PowerPlant,
    name: 'Power Plant',
    icon: APP_ICONS.facilityPowerPlant,
    constructionCost: 500,
    baseWorkers: 18,
    recipes: [ALL_RECIPES[RecipeName.CoalPower], ALL_RECIPES[RecipeName.SolarPower]],
  },
};

export function getFacilityDefinition(facilityType: FacilityType): FacilityDefinition {
  return facilities[facilityType];
}
