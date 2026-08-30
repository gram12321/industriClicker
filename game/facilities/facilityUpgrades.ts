import { calculateAsymmetricalScaler01, calculateDiminishingBonus, calculateExponentialScaler01, calculatePowerPenalty, scaleExponential } from '../core/math/scaling';
import { calculateQualityFromProgress } from '@/game/quality';
import { FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE, FACILITY_CONDITION_DECAY_MAX_REDUCTION, FACILITY_CONDITION_DECAY_REDUCTION_RATE, FACILITY_FIRE_COST_WAGE_MINUTES, FACILITY_FIRE_DURATION_PER_WORKER_MS, FACILITY_INFRASTRUCTURE_CONSTRUCTION_MATERIAL_COST_RATE, FACILITY_INFRASTRUCTURE_INDUSTRIAL_MACHINE_COST_RATE, FACILITY_INFRASTRUCTURE_WORKER_CAPACITY_GROWTH, FACILITY_INITIAL_STAFF_QUALITY, FACILITY_HIRE_COST_WAGE_MINUTES, FACILITY_HIRE_DURATION_PER_WORKER_MS, FACILITY_MACHINERY_CONSTRUCTION_MATERIAL_COST_RATE, FACILITY_MACHINERY_INDUSTRIAL_MACHINE_COST_RATE, FACILITY_MACHINERY_POINTS_PER_LEVEL, FACILITY_MAX_INFRASTRUCTURE_LEVEL, FACILITY_MINIMUM_STAFFING_EFFICIENCY, FACILITY_OUTPUT_BONUS_RATE, FACILITY_OUTPUT_MAXIMUM_BONUS, FACILITY_OVERSTAFFING_BONUS_RATE, FACILITY_OVERSTAFFING_CONDITION_DECAY_GROWTH, FACILITY_OVERSTAFFING_MAXIMUM_BONUS, FACILITY_REPAIR_MATERIAL_COST_RATE, FACILITY_SPECIALIZATION_RESOURCE_COST_RATE, FACILITY_SPEED_BONUS_RATE, FACILITY_SPEED_MAXIMUM_BONUS, FACILITY_STAFFING_BATCH_EXPONENT, FACILITY_STAFF_QUALITY_WAGE_GAIN_PER_MINUTE, FACILITY_STAFF_QUALITY_WAGE_LOSS_PER_MINUTE, FACILITY_STAFF_TRAINING_COST_WAGE_MINUTES, FACILITY_STAFF_TRAINING_DURATION_PER_WORKER_MS, FACILITY_UNDERSTAFFING_EXPONENT, FACILITY_UPGRADE_COST_GROWTH, FACILITY_UPGRADE_RESOURCE_COST_RATE, FACILITY_WORKER_REQUIREMENT_GROWTH, type FacilityDefinition } from './facilityConstants';
import { ResourceType } from '@/game/resources';

export type FacilityUpgradeKind = 'infrastructure' | 'machinery' | 'speed' | 'output' | 'condition' | 'quality';

const ADDITIONAL_UPGRADE_RESOURCES: Record<FacilityUpgradeKind, readonly ResourceType[]> = {
  infrastructure: [ResourceType.Furniture, ResourceType.Bricks, ResourceType.Cement, ResourceType.Steel, ResourceType.Timber],
  machinery: [ResourceType.AdvancedComponents, ResourceType.Iron, ResourceType.Steel],
  speed: [ResourceType.DisplayPanels, ResourceType.ElectricCircuits, ResourceType.Plastic],
  output: [ResourceType.Coal, ResourceType.AdvancedComponents, ResourceType.Chemicals],
  condition: [ResourceType.ReinforcedConcrete, ResourceType.Steel],
  quality: [ResourceType.Gold, ResourceType.Minerals, ResourceType.AdvancedComponents, ResourceType.ElectricCircuits],
};

export function getFacilityMaximumWorkers(baseWorkers: number, infrastructureLevel: number): number {
  return Math.ceil(Math.max(0, baseWorkers) * Math.pow(FACILITY_INFRASTRUCTURE_WORKER_CAPACITY_GROWTH, Math.min(FACILITY_MAX_INFRASTRUCTURE_LEVEL, Math.max(0, Math.floor(infrastructureLevel)))));
}

export function getFacilityUpgradePoints(machineryLevel: number): number {
  return Math.max(0, Math.floor(machineryLevel)) * FACILITY_MACHINERY_POINTS_PER_LEVEL;
}

/** Cost of the next level; level 0 is the first upgrade. */
export function getFacilityUpgradeCost(constructionCost: number, currentLevel: number, sizeMultiplier = 1): number {
  return Math.ceil(scaleExponential(constructionCost * Math.max(1, sizeMultiplier), currentLevel, FACILITY_UPGRADE_COST_GROWTH));
}

/** Construction Materials or Industrial Machines required for the next upgrade level. */
export function getFacilityUpgradeResourceCost(constructionResourceCost: number, currentLevel: number, sizeMultiplier = 1, resourceCostRate = FACILITY_UPGRADE_RESOURCE_COST_RATE): number {
  return scaleExponential(Math.max(0, constructionResourceCost) * resourceCostRate * Math.max(1, sizeMultiplier), currentLevel, FACILITY_UPGRADE_COST_GROWTH);
}

export function getFacilityUpgradeResourceRequirements(definition: FacilityDefinition, upgradeKind: FacilityUpgradeKind, currentLevel: number, sizeMultiplier = 1) {
  const primaryRate = upgradeKind === 'infrastructure' ? FACILITY_INFRASTRUCTURE_CONSTRUCTION_MATERIAL_COST_RATE : upgradeKind === 'machinery' ? FACILITY_MACHINERY_CONSTRUCTION_MATERIAL_COST_RATE : FACILITY_SPECIALIZATION_RESOURCE_COST_RATE;
  const machineRate = upgradeKind === 'infrastructure' ? FACILITY_INFRASTRUCTURE_INDUSTRIAL_MACHINE_COST_RATE : upgradeKind === 'machinery' ? FACILITY_MACHINERY_INDUSTRIAL_MACHINE_COST_RATE : FACILITY_SPECIALIZATION_RESOURCE_COST_RATE;
  const combinedConstructionBaseline = definition.constructionMaterialsCost + definition.industrialMachinesCost;
  return [
    { resourceType: ResourceType.ConstructionMaterials, requiredUnits: getFacilityUpgradeResourceCost(definition.constructionMaterialsCost, currentLevel, sizeMultiplier, primaryRate) },
    { resourceType: ResourceType.IndustrialMachines, requiredUnits: getFacilityUpgradeResourceCost(definition.industrialMachinesCost, currentLevel, sizeMultiplier, machineRate) },
    ...ADDITIONAL_UPGRADE_RESOURCES[upgradeKind].map((resourceType) => ({ resourceType, requiredUnits: getFacilityUpgradeResourceCost(combinedConstructionBaseline, currentLevel, sizeMultiplier, FACILITY_SPECIALIZATION_RESOURCE_COST_RATE) })),
  ];
}

/** Total paid cost for all completed levels in one facility upgrade track. */
export function getFacilityUpgradeInvestmentCost(constructionCost: number, completedLevels: number, sizeMultiplier = 1): number {
  return Array.from(
    { length: Math.max(0, Math.floor(completedLevels)) },
    (_, currentLevel) => getFacilityUpgradeCost(constructionCost, currentLevel, sizeMultiplier),
  ).reduce((total, cost) => total + cost, 0);
}

/** Total construction resources committed to all completed levels in one upgrade track. */
export function getFacilityUpgradeResourceInvestmentCost(constructionResourceCost: number, completedLevels: number, sizeMultiplier = 1): number {
  return Array.from(
    { length: Math.max(0, Math.floor(completedLevels)) },
    (_, currentLevel) => getFacilityUpgradeResourceCost(constructionResourceCost, currentLevel, sizeMultiplier),
  ).reduce((total, cost) => total + cost, 0);
}

export function getSpeedUpgradeWorkSpeedMultiplier(level: number): number {
  return 1 + calculateDiminishingBonus(level, FACILITY_SPEED_MAXIMUM_BONUS, FACILITY_SPEED_BONUS_RATE);
}

export function getOutputUpgradeMultiplier(level: number): number {
  return 1 + calculateDiminishingBonus(level, FACILITY_OUTPUT_MAXIMUM_BONUS, FACILITY_OUTPUT_BONUS_RATE);
}

/** Returns the remaining wear multiplier after condition-decay upgrades. */
export function getConditionDecayMultiplier(level: number): number {
  return 1 - calculateDiminishingBonus(level, FACILITY_CONDITION_DECAY_MAX_REDUCTION, FACILITY_CONDITION_DECAY_REDUCTION_RATE);
}

/**
 * Each speed or output level adds a guaranteed worker and then increases the
 * requirement exponentially, so successive upgrades need more staff.
 */
export function getRequiredWorkers(baseWorkers: number, speedLevel: number, outputLevel: number): number {
  const base = Math.max(0, Math.floor(baseWorkers));
  const totalUpgradeLevels = Math.max(0, Math.floor(speedLevel)) + Math.max(0, Math.floor(outputLevel));

  return base + totalUpgradeLevels + Math.ceil(
    scaleExponential(base, totalUpgradeLevels, FACILITY_WORKER_REQUIREMENT_GROWTH) - base,
  );
}

/**
 * Staff below the requirement lose efficiency increasingly quickly. Extra
 * staff remain valid and give a bounded, exponentially diminishing bonus.
 */
export function getStaffingEfficiency(assignedWorkers: number, requiredWorkers: number, wagePerWorkerPerMinute = FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE, staffQuality = FACILITY_INITIAL_STAFF_QUALITY, baseWage = FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE): number {
  const assigned = Math.max(0, Math.floor(assignedWorkers));
  const required = Math.max(0, Math.floor(requiredWorkers));

  if (assigned === 0) {
    return 0;
  }

  if (required === 0) {
    return 1;
  }

  const staffingRatio = assigned / required;

  const workerEfficiency = staffingRatio <= 1
    ? FACILITY_MINIMUM_STAFFING_EFFICIENCY
      + (1 - FACILITY_MINIMUM_STAFFING_EFFICIENCY) * calculatePowerPenalty(staffingRatio, FACILITY_UNDERSTAFFING_EXPONENT)
    : 1 + calculateDiminishingBonus(
      staffingRatio - 1,
      FACILITY_OVERSTAFFING_MAXIMUM_BONUS,
      FACILITY_OVERSTAFFING_BONUS_RATE,
    );

  return Math.max(
    FACILITY_MINIMUM_STAFFING_EFFICIENCY,
    workerEfficiency * getWageEfficiency(wagePerWorkerPerMinute, baseWage) * getStaffQualityWorkMultiplier(staffQuality),
  );
}

export function getStaffQualityWorkMultiplier(staffQuality: number): number {
  const normalizedQuality = Number.isFinite(staffQuality) ? Math.min(100, Math.max(1, staffQuality)) : 1;
  return 1 + 9 * calculateAsymmetricalScaler01((normalizedQuality - 1) / 99);
}

/** The same diminishing quality curve used by research and facility upgrades. */
export function getStaffQualityFromProgress(progress: number): number {
  return Math.min(100, Math.max(1, calculateQualityFromProgress(progress)));
}

/** Converts pay into a 0-10x efficiency multiplier around expected wage. */
export function getWageEfficiency(wagePerWorkerPerMinute: number, baseWage = FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE): number {
  const wage = Math.max(0, Number.isFinite(wagePerWorkerPerMinute) ? wagePerWorkerPerMinute : 0);
  const base = Math.max(Number.EPSILON, Number.isFinite(baseWage) ? baseWage : FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE);
  const ratio = Math.min(100, wage / base);

  if (ratio <= 1) {
    return 1 - calculateExponentialScaler01(1 - ratio, 3);
  }

  return 1 + 9 * calculateExponentialScaler01((ratio - 1) / 99, 3);
}

/** Wage that is neutral for the current quality and economy phase. */
export function getFacilityStaffTargetWage(staffQuality: number, economyWageMultiplier = 1, baseWage = FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE): number {
  const quality = Number.isFinite(staffQuality) ? Math.min(100, Math.max(1, staffQuality)) : FACILITY_INITIAL_STAFF_QUALITY;
  const phaseMultiplier = Number.isFinite(economyWageMultiplier) ? Math.max(0.1, economyWageMultiplier) : 1;
  return Math.max(Number.EPSILON, baseWage * phaseMultiplier * quality);
}

/** Wage-driven Staff Quality progress change before the quality curve is applied. */
export function getStaffQualityWageProgressChangePerMinute(wagePerWorkerPerMinute: number, targetWage = FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE): number {
  const wageEfficiency = getWageEfficiency(wagePerWorkerPerMinute, targetWage);
  return wageEfficiency >= 1
    ? (wageEfficiency - 1) * FACILITY_STAFF_QUALITY_WAGE_GAIN_PER_MINUTE
    : -(1 - wageEfficiency) * FACILITY_STAFF_QUALITY_WAGE_LOSS_PER_MINUTE;
}

/** Current wage-only Q change per foreground minute after the quality curve. */
export function getStaffQualityWagePressurePerMinute(staffQualityProgress: number, wagePerWorkerPerMinute: number, targetWage = FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE): number {
  const progress = Number.isFinite(staffQualityProgress) ? Math.max(0, staffQualityProgress) : 0;
  const currentQuality = getStaffQualityFromProgress(progress);
  return getStaffQualityFromProgress(progress + getStaffQualityWageProgressChangePerMinute(wagePerWorkerPerMinute, targetWage)) - currentQuality;
}

/** Excess staff accelerate both passive and production wear without a ceiling. */
export function getOverstaffingConditionDecayMultiplier(assignedWorkers: number, requiredWorkers: number): number {
  const assigned = Math.max(0, Math.floor(assignedWorkers));
  const required = Math.max(0, Math.floor(requiredWorkers));

  if (required === 0 || assigned <= required) {
    return 1;
  }

  return scaleExponential(1, assigned / required - 1, FACILITY_OVERSTAFFING_CONDITION_DECAY_GROWTH);
}

/**
 * Combines the current efficiency factors. Additional factors can be added
 * here as the system grows without changing production callers.
 */
export function getFacilityEfficiency(staffingEfficiency: number, facilityCondition: number): number {
  const staffing = Number.isFinite(staffingEfficiency) ? Math.max(0, staffingEfficiency) : 0;
  return staffing * getFacilityConditionEfficiency(facilityCondition);
}

/** Converts the current condition into the work multiplier for the facility. */
export function getFacilityConditionEfficiency(facilityCondition: number): number {
  const condition = Number.isFinite(facilityCondition) ? Math.min(1, Math.max(0, facilityCondition)) : 0;
  // Inverting the wear curve makes each lost point of condition increasingly costly.
  return 1 - calculateAsymmetricalScaler01(1 - condition);
}

/** Repair cost for one construction input, proportional to the restored condition. */
export function getFacilityRepairCost(constructionInputCost: number, facilityCondition: number, targetCondition = 1): number {
  const current = Number.isFinite(facilityCondition) ? Math.min(1, Math.max(0, facilityCondition)) : 0;
  const target = Number.isFinite(targetCondition) ? Math.min(1, Math.max(current, targetCondition)) : 1;
  return Math.max(0, constructionInputCost) * (target - current) * FACILITY_REPAIR_MATERIAL_COST_RATE;
}

/** Returns the shared batch multiplier used for hiring and severance work. */
export function getStaffingChangeBatchMultiplier(workerDifference: number): number {
  const difference = Math.max(0, Math.floor(workerDifference));
  return difference > 0 ? Math.pow(difference, FACILITY_STAFFING_BATCH_EXPONENT) : 0;
}

/** Cash cost of a staffing change, expressed in wage-minutes. */
export function getStaffingChangeCost(currentWorkers: number, targetWorkers: number, wagePerWorkerPerMinute: number): number {
  const difference = Math.abs(Math.floor(targetWorkers) - Math.floor(currentWorkers));
  if (difference === 0) return 0;
  const isHiring = targetWorkers > currentWorkers;
  const wage = Math.max(FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE, wagePerWorkerPerMinute);
  const wageMinutes = isHiring ? FACILITY_HIRE_COST_WAGE_MINUTES : FACILITY_FIRE_COST_WAGE_MINUTES;
  return wage * wageMinutes * getStaffingChangeBatchMultiplier(difference);
}

/** Foreground duration of a staffing change. */
export function getStaffingChangeDurationMs(currentWorkers: number, targetWorkers: number): number {
  const difference = Math.abs(Math.floor(targetWorkers) - Math.floor(currentWorkers));
  if (difference === 0) return 0;
  const perWorkerDuration = targetWorkers > currentWorkers ? FACILITY_HIRE_DURATION_PER_WORKER_MS : FACILITY_FIRE_DURATION_PER_WORKER_MS;
  return perWorkerDuration * getStaffingChangeBatchMultiplier(difference);
}

/** Cash cost of training a batch of workers. */
export function getStaffTrainingCost(staffQuality: number, workerCount: number): number {
  return FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE
    * FACILITY_STAFF_TRAINING_COST_WAGE_MINUTES
    * getStaffQualityWorkMultiplier(staffQuality)
    * Math.max(0, Math.floor(workerCount));
}

/** Foreground duration of a training batch. */
export function getStaffTrainingDurationMs(workerCount: number): number {
  return workerCount > 0 ? FACILITY_STAFF_TRAINING_DURATION_PER_WORKER_MS : 0;
}
