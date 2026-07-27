import { RecipeName } from '../recipes/recipeTypes';
import { FacilityType } from './facilityTypes';

export type FacilityDefinition = {
  type: FacilityType;
  name: string;
  icon: string;
  constructionCost: number;
  recipeNames: readonly RecipeName[];
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
    recipeNames: [RecipeName.GrowGrain],
  },
  [FacilityType.Bakery]: {
    type: FacilityType.Bakery,
    name: 'Bakery',
    icon: 'bread-slice-outline',
    constructionCost: 300,
    recipeNames: [RecipeName.BakeBread],
  },
};

export function getFacilityDefinition(facilityType: FacilityType): FacilityDefinition {
  return facilities[facilityType];
}
