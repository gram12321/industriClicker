import { calculateAsymmetricalScaler01, calculateDiminishingBonus, calculatePowerPenalty, scaleExponential } from '../core/math/scaling';
import { FACILITY_CONDITION_DECAY_MAX_REDUCTION, FACILITY_CONDITION_DECAY_REDUCTION_RATE, FACILITY_MINIMUM_STAFFING_EFFICIENCY, FACILITY_OUTPUT_BONUS_RATE, FACILITY_OUTPUT_MAXIMUM_BONUS, FACILITY_OVERSTAFFING_BONUS_RATE, FACILITY_OVERSTAFFING_MAXIMUM_BONUS, FACILITY_REPAIR_MATERIAL_COST_RATE, FACILITY_SPEED_BONUS_RATE, FACILITY_SPEED_MAXIMUM_BONUS, FACILITY_UNDERSTAFFING_EXPONENT, FACILITY_UPGRADE_COST_GROWTH, FACILITY_WORKER_REQUIREMENT_GROWTH } from './facilityConstants';

export type FacilityUpgradeKind = 'speed' | 'output' | 'condition';

/** Cost of the next level; level 0 is the first upgrade. */
export function getFacilityUpgradeCost(constructionCost: number, currentLevel: number): number {
  return Math.ceil(scaleExponential(constructionCost, currentLevel, FACILITY_UPGRADE_COST_GROWTH));
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
export function getStaffingEfficiency(assignedWorkers: number, requiredWorkers: number): number {
  const assigned = Math.max(0, Math.floor(assignedWorkers));
  const required = Math.max(0, Math.floor(requiredWorkers));

  if (required === 0) {
    return 1;
  }

  const staffingRatio = assigned / required;

  if (staffingRatio <= 1) {
    return FACILITY_MINIMUM_STAFFING_EFFICIENCY
      + (1 - FACILITY_MINIMUM_STAFFING_EFFICIENCY) * calculatePowerPenalty(staffingRatio, FACILITY_UNDERSTAFFING_EXPONENT);
  }

  return 1 + calculateDiminishingBonus(
    staffingRatio - 1,
    FACILITY_OVERSTAFFING_MAXIMUM_BONUS,
    FACILITY_OVERSTAFFING_BONUS_RATE,
  );
}

/**
 * Combines the current efficiency factors. Additional factors can be added
 * here as the system grows without changing production callers.
 */
export function getFacilityEfficiency(staffingEfficiency: number, facilityCondition: number): number {
  const staffing = Number.isFinite(staffingEfficiency) ? Math.max(0, staffingEfficiency) : 0;
  const condition = Number.isFinite(facilityCondition) ? Math.min(1, Math.max(0, facilityCondition)) : 0;
  // Inverting the wear curve makes each lost point of condition increasingly costly.
  const conditionEfficiency = 1 - calculateAsymmetricalScaler01(1 - condition);

  return staffing * conditionEfficiency;
}

export function getFacilityRepairCost(constructionMaterialsCost: number, facilityCondition: number): number {
  const missingCondition = Number.isFinite(facilityCondition) ? Math.min(1, Math.max(0, 1 - facilityCondition)) : 1;
  return Math.max(0, constructionMaterialsCost) * missingCondition * FACILITY_REPAIR_MATERIAL_COST_RATE;
}
