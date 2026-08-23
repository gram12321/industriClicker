import { calculateAsymmetricalScaler01, calculateDiminishingBonus, calculatePowerPenalty, scaleExponential } from '../core/math/scaling';
import { FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE, FACILITY_CONDITION_DECAY_MAX_REDUCTION, FACILITY_CONDITION_DECAY_REDUCTION_RATE, FACILITY_MINIMUM_STAFFING_EFFICIENCY, FACILITY_OUTPUT_BONUS_RATE, FACILITY_OUTPUT_MAXIMUM_BONUS, FACILITY_OVERSTAFFING_BONUS_RATE, FACILITY_OVERSTAFFING_CONDITION_DECAY_GROWTH, FACILITY_OVERSTAFFING_MAXIMUM_BONUS, FACILITY_REPAIR_MATERIAL_COST_RATE, FACILITY_SPEED_BONUS_RATE, FACILITY_SPEED_MAXIMUM_BONUS, FACILITY_UNDERSTAFFING_EXPONENT, FACILITY_UPGRADE_COST_GROWTH, FACILITY_UPGRADE_RESOURCE_COST_RATE, FACILITY_WORKER_REQUIREMENT_GROWTH } from './facilityConstants';

export type FacilityUpgradeKind = 'speed' | 'output' | 'condition' | 'quality';

/** Cost of the next level; level 0 is the first upgrade. */
export function getFacilityUpgradeCost(constructionCost: number, currentLevel: number): number {
  return Math.ceil(scaleExponential(constructionCost, currentLevel, FACILITY_UPGRADE_COST_GROWTH));
}

/** Construction Materials or Industrial Machines required for the next upgrade level. */
export function getFacilityUpgradeResourceCost(constructionResourceCost: number, currentLevel: number): number {
  return scaleExponential(Math.max(0, constructionResourceCost) * FACILITY_UPGRADE_RESOURCE_COST_RATE, currentLevel, FACILITY_UPGRADE_COST_GROWTH);
}

/** Total paid cost for all completed levels in one facility upgrade track. */
export function getFacilityUpgradeInvestmentCost(constructionCost: number, completedLevels: number): number {
  return Array.from(
    { length: Math.max(0, Math.floor(completedLevels)) },
    (_, currentLevel) => getFacilityUpgradeCost(constructionCost, currentLevel),
  ).reduce((total, cost) => total + cost, 0);
}

/** Total construction resources committed to all completed levels in one upgrade track. */
export function getFacilityUpgradeResourceInvestmentCost(constructionResourceCost: number, completedLevels: number): number {
  return Array.from(
    { length: Math.max(0, Math.floor(completedLevels)) },
    (_, currentLevel) => getFacilityUpgradeResourceCost(constructionResourceCost, currentLevel),
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
export function getStaffingEfficiency(assignedWorkers: number, requiredWorkers: number, wagePerWorkerPerMinute = FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE): number {
  const assigned = Math.max(0, Math.floor(assignedWorkers));
  const required = Math.max(0, Math.floor(requiredWorkers));

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

  return workerEfficiency * getWageEfficiency(wagePerWorkerPerMinute);
}

/** Converts pay into a 0-10x efficiency multiplier around the base wage. */
export function getWageEfficiency(wagePerWorkerPerMinute: number, baseWage = FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE): number {
  const wage = Math.max(0, Number.isFinite(wagePerWorkerPerMinute) ? wagePerWorkerPerMinute : 0);
  const base = Math.max(Number.EPSILON, Number.isFinite(baseWage) ? baseWage : FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE);
  const ratio = Math.min(100, wage / base);

  if (ratio <= 1) {
    return (Math.exp(3 * ratio) - 1) / (Math.exp(3) - 1);
  }

  return 1 + 9 * calculateAsymmetricalScaler01((ratio - 1) / 99);
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
