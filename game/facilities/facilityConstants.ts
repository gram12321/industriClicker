import { ALL_RECIPES, RecipeName, type Recipe } from '@/game/recipes';
import { FacilityType } from './facilityTypes';

export const FACILITY_TYPES = [FacilityType.Farm, FacilityType.AnimalFarm, FacilityType.Bakery, FacilityType.SmallUtilityWorks, FacilityType.Mine, FacilityType.Quarry, FacilityType.IndustrialProcessingFactory, FacilityType.ChemicalPlant, FacilityType.ElectronicsFactory, FacilityType.AssemblyPlant, FacilityType.ConstructionFactory, FacilityType.WaterWell, FacilityType.PowerPlant] as const;
export type FacilityGroup = 'agriculture' | 'extraction' | 'manufacturing' | 'utilities';

/** Player-facing facility groupings shared by Pedia and other catalogues; each group is alphabetized by display name. */
export const FACILITY_GROUPS: ReadonlyArray<{ id: FacilityGroup; label: string; facilities: readonly FacilityType[] }> = [
  { id: 'agriculture', label: 'Agriculture', facilities: [FacilityType.AnimalFarm, FacilityType.Bakery, FacilityType.Farm] },
  { id: 'extraction', label: 'Extraction', facilities: [FacilityType.Mine, FacilityType.Quarry] },
  { id: 'manufacturing', label: 'Manufacturing', facilities: [FacilityType.AssemblyPlant, FacilityType.ChemicalPlant, FacilityType.ConstructionFactory, FacilityType.ElectronicsFactory, FacilityType.IndustrialProcessingFactory] },
  { id: 'utilities', label: 'Utilities', facilities: [FacilityType.PowerPlant, FacilityType.SmallUtilityWorks, FacilityType.WaterWell] },
];
export const FACILITY_UPGRADE_COST_GROWTH = 1.5;
/** Fraction of a facility's construction resource requirement used by its first upgrade level. */
export const FACILITY_UPGRADE_RESOURCE_COST_RATE = 0.2;
export const FACILITY_SPEED_MAXIMUM_BONUS = 0.8;
export const FACILITY_SPEED_BONUS_RATE = 0.22;
export const FACILITY_OUTPUT_MAXIMUM_BONUS = 1.5;
export const FACILITY_OUTPUT_BONUS_RATE = 0.18;
export const FACILITY_CONDITION_DECAY_MAX_REDUCTION = 0.75;
export const FACILITY_CONDITION_DECAY_REDUCTION_RATE = 0.18;
export const FACILITY_WORKER_REQUIREMENT_GROWTH = 1.15;
export const FACILITY_UNDERSTAFFING_EXPONENT = 1.6;
export const FACILITY_OVERSTAFFING_MAXIMUM_BONUS = 0.25;
export const FACILITY_OVERSTAFFING_BONUS_RATE = 0.7;
/** Wear growth applied for each full staffing ratio above the requirement. */
export const FACILITY_OVERSTAFFING_CONDITION_DECAY_GROWTH = 1.5;
/** Lower bound for the combined staffing contribution to facility efficiency. */
export const FACILITY_MINIMUM_STAFFING_EFFICIENCY = 0.1;
/** Reference wage for each assigned facility worker, per foreground minute. */
export const FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE = 1;
/** Maximum wage is always this many times the current base wage. */
export const FACILITY_MAX_STAFF_WAGE_MULTIPLIER = 100;
export function getFacilityMaxStaffWage(baseWage = FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE): number {
  return Math.max(0, baseWage) * FACILITY_MAX_STAFF_WAGE_MULTIPLIER;
}
/** New facilities and newly hired workers begin at the Q1 quality baseline. */
export const FACILITY_INITIAL_STAFF_QUALITY = 1;
export const FACILITY_STAFFING_BATCH_EXPONENT = 0.65;
export const FACILITY_HIRE_DURATION_PER_WORKER_MS = 60_000;
export const FACILITY_FIRE_DURATION_PER_WORKER_MS = 30_000;
export const FACILITY_HIRE_COST_WAGE_MINUTES = 5;
export const FACILITY_FIRE_COST_WAGE_MINUTES = 2;
export const FACILITY_STAFF_QUALITY_WAGE_GAIN_PER_MINUTE = 0.02;
export const FACILITY_STAFF_QUALITY_WAGE_LOSS_PER_MINUTE = 0.04;
export const FACILITY_STAFF_QUALITY_EXPERIENCE_PROGRESS_PER_WORK = 0.002;
export const FACILITY_STAFF_TRAINING_COST_WAGE_MINUTES = 10;
export const FACILITY_STAFF_TRAINING_DURATION_PER_WORKER_MS = 120_000;
/** Foreground repair time for restoring one full condition point. */
export const FACILITY_REPAIR_DURATION_PER_CONDITION_MS = 300_000;
/** Facilities operate at half efficiency while their repair activity is running. */
export const FACILITY_REPAIR_EFFICIENCY_MULTIPLIER = 0.5;
export const FACILITY_STAFF_TRAINING_QUALITY_PROGRESS_PER_WORKER = 0.25;
/** Additional work contributed by each required worker per foreground minute. */
export const FACILITY_STAFF_WORK_PER_WORKER_PER_MINUTE = 0.1;
/** Condition lost by every constructed facility per foreground minute. */
export const FACILITY_PASSIVE_CONDITION_LOSS_PER_MINUTE = 1 / 1_200;
/** Additional condition lost for each completed recipe work unit. */
export const FACILITY_PRODUCTION_CONDITION_LOSS_PER_WORK_UNIT = 1 / 1_200;
/** Fixed work-equivalent condition loss for every completed production cycle. */
export const FACILITY_PRODUCTION_CONDITION_LOSS_PER_CYCLE = 0.05 / 1_200;
/** Fraction of each facility construction input required to restore one point of condition. */
export const FACILITY_REPAIR_MATERIAL_COST_RATE = 0.45;
/** Fixed order keeps production deterministic and runs utility producers first. */
export const FACILITY_PRODUCTION_ORDER = [
  FacilityType.SmallUtilityWorks,
  FacilityType.Farm,
  FacilityType.AnimalFarm,
  FacilityType.Bakery,
  FacilityType.Mine,
  FacilityType.Quarry,
  FacilityType.IndustrialProcessingFactory,
  FacilityType.ChemicalPlant,
  FacilityType.ElectronicsFactory,
  FacilityType.AssemblyPlant,
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
  /** Industrial Machines installed to equip the facility for production. */
  industrialMachinesCost: number;
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
    constructionMaterialsCost: 5,
    industrialMachinesCost: 1,
    upgradeCost: 40,
    baseWorkers: 1,
    recipes: [ALL_RECIPES[RecipeName.GrowGrain], ALL_RECIPES[RecipeName.GrowSugar], ALL_RECIPES[RecipeName.GrowFruit]],
  },
  [FacilityType.AnimalFarm]: {
    type: FacilityType.AnimalFarm,
    name: 'Animal Farm',
    icon: 'cow',
    landCost: 80,
    constructionMaterialsCost: 25,
    industrialMachinesCost: 4,
    upgradeCost: 100,
    baseWorkers: 2,
    recipes: [ALL_RECIPES[RecipeName.RaiseCattle], ALL_RECIPES[RecipeName.RaiseSheep], ALL_RECIPES[RecipeName.RaiseChicken]],
  },
  [FacilityType.Bakery]: {
    type: FacilityType.Bakery,
    name: 'Bakery',
    icon: 'bread-slice-outline',
    landCost: 100,
    constructionMaterialsCost: 80,
    industrialMachinesCost: 8,
    upgradeCost: 150,
    baseWorkers: 2,
    recipes: [ALL_RECIPES[RecipeName.BakeBread], ALL_RECIPES[RecipeName.BakeCake], ALL_RECIPES[RecipeName.BakePremiumCake], ALL_RECIPES[RecipeName.BakeMeatPie]],
  },
  [FacilityType.SmallUtilityWorks]: {
    type: FacilityType.SmallUtilityWorks,
    name: 'Small Utility Works',
    icon: 'flash-outline',
    landCost: 100,
    constructionMaterialsCost: 5,
    industrialMachinesCost: 3,
    upgradeCost: 200,
    baseWorkers: 1,
    recipes: [ALL_RECIPES[RecipeName.ProduceWater], ALL_RECIPES[RecipeName.ProduceElectricity]],
  },
  [FacilityType.Mine]: {
    type: FacilityType.Mine,
    name: 'Mine',
    icon: 'pickaxe',
    landCost: 30,
    constructionMaterialsCost: 5,
    industrialMachinesCost: 4,
    upgradeCost: 80,
    baseWorkers: 5,
    recipes: [ALL_RECIPES[RecipeName.MineIron], ALL_RECIPES[RecipeName.MineCoal], ALL_RECIPES[RecipeName.MineCopper], ALL_RECIPES[RecipeName.MineGold]],
  },
  [FacilityType.Quarry]: {
    type: FacilityType.Quarry,
    name: 'Quarry',
    icon: 'terrain',
    landCost: 25,
    constructionMaterialsCost: 40,
    industrialMachinesCost: 4,
    upgradeCost: 70,
    baseWorkers: 3,
    recipes: [ALL_RECIPES[RecipeName.QuarrySand], ALL_RECIPES[RecipeName.QuarryClay], ALL_RECIPES[RecipeName.QuarryStone], ALL_RECIPES[RecipeName.QuarryMinerals]],
  },
  [FacilityType.IndustrialProcessingFactory]: {
    type: FacilityType.IndustrialProcessingFactory,
    name: 'Industrial Processing Factory',
    icon: 'factory',
    landCost: 80,
    constructionMaterialsCost: 50,
    industrialMachinesCost: 8,
    upgradeCost: 200,
    baseWorkers: 6,
    recipes: [ALL_RECIPES[RecipeName.ProduceSteel], ALL_RECIPES[RecipeName.ProduceElectricCircuits]],
  },
  [FacilityType.ChemicalPlant]: {
    type: FacilityType.ChemicalPlant,
    name: 'Chemical Plant',
    icon: 'flask-outline',
    landCost: 100,
    constructionMaterialsCost: 120,
    industrialMachinesCost: 14,
    upgradeCost: 350,
    baseWorkers: 7,
    recipes: [ALL_RECIPES[RecipeName.ProduceChemicals], ALL_RECIPES[RecipeName.SynthesizeFertilizer], ALL_RECIPES[RecipeName.ProducePlastic]],
  },
  [FacilityType.ElectronicsFactory]: {
    type: FacilityType.ElectronicsFactory,
    name: 'Electronics Factory',
    icon: 'chip',
    landCost: 100,
    constructionMaterialsCost: 150,
    industrialMachinesCost: 18,
    upgradeCost: 400,
    baseWorkers: 6,
    recipes: [ALL_RECIPES[RecipeName.ProduceSilicon], ALL_RECIPES[RecipeName.ProduceAdvancedComponents]],
  },
  [FacilityType.AssemblyPlant]: {
    type: FacilityType.AssemblyPlant,
    name: 'Assembly Plant',
    icon: 'factory',
    landCost: 130,
    constructionMaterialsCost: 200,
    industrialMachinesCost: 30,
    upgradeCost: 600,
    baseWorkers: 12,
    recipes: [ALL_RECIPES[RecipeName.AssembleIndustrialMachines]],
  },
  [FacilityType.ConstructionFactory]: {
    type: FacilityType.ConstructionFactory,
    name: 'Construction Factory',
    icon: 'crane',
    landCost: 80,
    constructionMaterialsCost: 100,
    industrialMachinesCost: 10,
    upgradeCost: 300,
    baseWorkers: 8,
    recipes: [ALL_RECIPES[RecipeName.ProduceBricks], ALL_RECIPES[RecipeName.ProduceCement], ALL_RECIPES[RecipeName.ProduceReinforcedConcrete], ALL_RECIPES[RecipeName.ProduceConstructionMaterials]],
  },
  [FacilityType.WaterWell]: {
    type: FacilityType.WaterWell,
    name: 'Water Well',
    icon: 'water-well',
    landCost: 80,
    constructionMaterialsCost: 10,
    industrialMachinesCost: 2,
    upgradeCost: 60,
    baseWorkers: 1,
    recipes: [ALL_RECIPES[RecipeName.ManualPumping], ALL_RECIPES[RecipeName.ElectricPumping]],
  },
  [FacilityType.PowerPlant]: {
    type: FacilityType.PowerPlant,
    name: 'Power Plant',
    icon: 'factory',
    landCost: 100,
    constructionMaterialsCost: 50,
    industrialMachinesCost: 8,
    upgradeCost: 250,
    baseWorkers: 9,
    recipes: [ALL_RECIPES[RecipeName.CoalPower], ALL_RECIPES[RecipeName.SolarPower]],
  },
};

export function getFacilityDefinition(facilityType: FacilityType): FacilityDefinition {
  return FACILITIES[facilityType];
}
