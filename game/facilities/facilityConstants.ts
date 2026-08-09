import { ALL_RECIPES, RecipeName, type Recipe } from '@/game/recipes';
import { FacilityType } from './facilityTypes';

export const FACILITY_TYPES = [FacilityType.Farm, FacilityType.Bakery, FacilityType.SmallUtilityWorks, FacilityType.Mine, FacilityType.Quarry, FacilityType.IndustrialProcessingFactory, FacilityType.ConstructionFactory, FacilityType.WaterWell, FacilityType.PowerPlant] as const;
export type FacilityGroup = 'agriculture' | 'extraction' | 'manufacturing' | 'utilities';

/** Player-facing facility groupings shared by Pedia and other catalogues; each group is alphabetized by display name. */
export const FACILITY_GROUPS: ReadonlyArray<{ id: FacilityGroup; label: string; facilities: readonly FacilityType[] }> = [
  { id: 'agriculture', label: 'Agriculture', facilities: [FacilityType.Bakery, FacilityType.Farm] },
  { id: 'extraction', label: 'Extraction', facilities: [FacilityType.Mine, FacilityType.Quarry] },
  { id: 'manufacturing', label: 'Manufacturing', facilities: [FacilityType.ConstructionFactory, FacilityType.IndustrialProcessingFactory] },
  { id: 'utilities', label: 'Utilities', facilities: [FacilityType.PowerPlant, FacilityType.SmallUtilityWorks, FacilityType.WaterWell] },
];
export const FACILITY_UPGRADE_COST_GROWTH = 1.5;
export const FACILITY_SPEED_MAXIMUM_BONUS = 0.8;
export const FACILITY_SPEED_BONUS_RATE = 0.22;
export const FACILITY_OUTPUT_MAXIMUM_BONUS = 1;
export const FACILITY_OUTPUT_BONUS_RATE = 0.18;
export const FACILITY_CONDITION_DECAY_MAX_REDUCTION = 0.75;
export const FACILITY_CONDITION_DECAY_REDUCTION_RATE = 0.18;
export const FACILITY_WORKER_REQUIREMENT_GROWTH = 1.15;
export const FACILITY_UNDERSTAFFING_EXPONENT = 1.6;
export const FACILITY_OVERSTAFFING_MAXIMUM_BONUS = 0.25;
export const FACILITY_OVERSTAFFING_BONUS_RATE = 0.7;
/** Wear growth applied for each full staffing ratio above the requirement. */
export const FACILITY_OVERSTAFFING_CONDITION_DECAY_GROWTH = 1.5;
export const FACILITY_MINIMUM_STAFFING_EFFICIENCY = 0.01;
/** Additional work contributed by each required worker per foreground minute. */
export const FACILITY_STAFF_WORK_PER_WORKER_PER_MINUTE = 0.1;
/** Condition lost by every constructed facility per foreground minute. */
export const FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE = 1 / 600;
/** Additional condition lost for each completed recipe work unit. */
export const FACILITY_PRODUCTION_CONDITION_LOSS_PER_WORK_UNIT = 1 / 600;
/** Construction Materials required to restore one point of condition. */
export const FACILITY_REPAIR_MATERIAL_COST_RATE = 0.9;

/** Fixed order keeps production deterministic and runs utility producers first. */
export const FACILITY_PRODUCTION_ORDER = [
  FacilityType.SmallUtilityWorks,
  FacilityType.Farm,
  FacilityType.Bakery,
  FacilityType.Mine,
  FacilityType.Quarry,
  FacilityType.IndustrialProcessingFactory,
  FacilityType.ConstructionFactory,
  FacilityType.WaterWell,
  FacilityType.PowerPlant,
] as const;

export type FacilityDefinition = {
  type: FacilityType;
  name: string;
  icon: string;
  /** Euro price of the plot needed for this facility. */
  landCost: number;
  /** Construction Materials consumed when the facility is built. */
  constructionMaterialsCost: number;
  /** Euro base used only to scale the facility's separate upgrades. */
  upgradeCost: number;
  baseWorkers: number;
  recipes: readonly Recipe[];
};

/** Code-owned facility catalogue. Player-owned state belongs to FacilityCollection. */
export const FACILITIES: Readonly<Record<FacilityType, FacilityDefinition>> = {
  [FacilityType.Farm]: {
    type: FacilityType.Farm,
    name: 'Farm',
    icon: 'tractor',
    landCost: 60,
    constructionMaterialsCost: 10,
    upgradeCost: 60,
    baseWorkers: 2,
    recipes: [ALL_RECIPES[RecipeName.GrowGrain], ALL_RECIPES[RecipeName.GrowSugar]],
  },
  [FacilityType.Bakery]: {
    type: FacilityType.Bakery,
    name: 'Bakery',
    icon: 'bread-slice-outline',
    landCost: 100,
    constructionMaterialsCost: 200,
    upgradeCost: 300,
    baseWorkers: 3,
    recipes: [ALL_RECIPES[RecipeName.BakeBread], ALL_RECIPES[RecipeName.BakeCake]],
  },
  [FacilityType.SmallUtilityWorks]: {
    type: FacilityType.SmallUtilityWorks,
    name: 'Small Utility Works',
    icon: 'flash-outline',
    landCost: 100,
    constructionMaterialsCost: 10,
    upgradeCost: 500,
    baseWorkers: 1,
    recipes: [ALL_RECIPES[RecipeName.ProduceWater], ALL_RECIPES[RecipeName.ProduceElectricity]],
  },
  [FacilityType.Mine]: {
    type: FacilityType.Mine,
    name: 'Mine',
    icon: 'pickaxe',
    landCost: 30,
    constructionMaterialsCost: 10,
    upgradeCost: 150,
    baseWorkers: 10,
    recipes: [ALL_RECIPES[RecipeName.MineIron], ALL_RECIPES[RecipeName.MineCoal], ALL_RECIPES[RecipeName.MineCopper]],
  },
  [FacilityType.Quarry]: {
    type: FacilityType.Quarry,
    name: 'Quarry',
    icon: 'terrain',
    landCost: 25,
    constructionMaterialsCost: 95,
    upgradeCost: 120,
    baseWorkers: 6,
    recipes: [ALL_RECIPES[RecipeName.QuarrySand], ALL_RECIPES[RecipeName.QuarryClay], ALL_RECIPES[RecipeName.QuarryStone]],
  },
  [FacilityType.IndustrialProcessingFactory]: {
    type: FacilityType.IndustrialProcessingFactory,
    name: 'Industrial Processing Factory',
    icon: 'factory',
    landCost: 80,
    constructionMaterialsCost: 320,
    upgradeCost: 400,
    baseWorkers: 12,
    recipes: [ALL_RECIPES[RecipeName.ProduceSteel], ALL_RECIPES[RecipeName.ProduceElectricCircuits]],
  },
  [FacilityType.ConstructionFactory]: {
    type: FacilityType.ConstructionFactory,
    name: 'Construction Factory',
    icon: 'crane',
    landCost: 80,
    constructionMaterialsCost: 500,
    upgradeCost: 650,
    baseWorkers: 16,
    recipes: [ALL_RECIPES[RecipeName.ProduceBricks], ALL_RECIPES[RecipeName.ProduceCement], ALL_RECIPES[RecipeName.ProduceReinforcedConcrete], ALL_RECIPES[RecipeName.ProduceConstructionMaterials]],
  },
  [FacilityType.WaterWell]: {
    type: FacilityType.WaterWell,
    name: 'Water Well',
    icon: 'water-well',
    landCost: 80,
    constructionMaterialsCost: 20,
    upgradeCost: 100,
    baseWorkers: 1,
    recipes: [ALL_RECIPES[RecipeName.ManualPumping], ALL_RECIPES[RecipeName.ElectricPumping]],
  },
  [FacilityType.PowerPlant]: {
    type: FacilityType.PowerPlant,
    name: 'Power Plant',
    icon: 'factory',
    landCost: 100,
    constructionMaterialsCost: 400,
    upgradeCost: 500,
    baseWorkers: 18,
    recipes: [ALL_RECIPES[RecipeName.CoalPower], ALL_RECIPES[RecipeName.SolarPower]],
  },
};

export function getFacilityDefinition(facilityType: FacilityType): FacilityDefinition {
  return FACILITIES[facilityType];
}
