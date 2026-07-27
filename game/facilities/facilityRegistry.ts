import { ALL_RECIPES } from '../recipes/recipes';
import { RecipeName, Recipe } from '../recipes/recipeTypes';
import { FacilityType } from './facilityTypes';

export type FacilityDefinition = {
  type: FacilityType;
  name: string;
  icon: string;
  constructionCost: number;
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
    icon: 'tractor',
    constructionCost: 60,
    recipes: [ALL_RECIPES[RecipeName.GrowGrain]],
  },
  [FacilityType.Bakery]: {
    type: FacilityType.Bakery,
    name: 'Bakery',
    icon: 'bread-slice-outline',
    constructionCost: 300,
    recipes: [ALL_RECIPES[RecipeName.BakeBread]],
  },
  [FacilityType.SmallUtilityWorks]: {
    type: FacilityType.SmallUtilityWorks,
    name: 'Small Utility Works',
    icon: 'flash-outline',
    constructionCost: 500,
    recipes: [ALL_RECIPES[RecipeName.ProduceWater], ALL_RECIPES[RecipeName.ProduceElectricity]],
  },
};

export function getFacilityDefinition(facilityType: FacilityType): FacilityDefinition {
  return facilities[facilityType];
}
