import { calculateDiminishingBonus, calculatePowerPenalty, scaleExponential } from '../core/math/scaling';

export type FacilityUpgradeKind = 'speed' | 'output';

const UPGRADE_COST_GROWTH = 1.5;
const SPEED_MAXIMUM_BONUS = 0.8;
const SPEED_BONUS_RATE = 0.22;
const OUTPUT_MAXIMUM_BONUS = 1;
const OUTPUT_BONUS_RATE = 0.18;
const WORKER_REQUIREMENT_GROWTH = 1.15;
const UNDERSTAFFING_EXPONENT = 1.6;
const OVERSTAFFING_MAXIMUM_BONUS = 0.25;
const OVERSTAFFING_BONUS_RATE = 0.7;
const MINIMUM_STAFFING_EFFICIENCY = 0.01;

/** Cost of the next level; level 0 is the first upgrade. */
export function getFacilityUpgradeCost(constructionCost: number, currentLevel: number): number {
  return Math.ceil(scaleExponential(constructionCost, currentLevel, UPGRADE_COST_GROWTH));
}

export function getSpeedUpgradeMultiplier(level: number): number {
  return 1 + calculateDiminishingBonus(level, SPEED_MAXIMUM_BONUS, SPEED_BONUS_RATE);
}

export function getOutputUpgradeMultiplier(level: number): number {
  return 1 + calculateDiminishingBonus(level, OUTPUT_MAXIMUM_BONUS, OUTPUT_BONUS_RATE);
}

/**
 * Each speed or output level adds a guaranteed worker and then increases the
 * requirement exponentially, so successive upgrades need more staff.
 */
export function getRequiredWorkers(baseWorkers: number, speedLevel: number, outputLevel: number): number {
  const base = Math.max(0, Math.floor(baseWorkers));
  const totalUpgradeLevels = Math.max(0, Math.floor(speedLevel)) + Math.max(0, Math.floor(outputLevel));

  return base + totalUpgradeLevels + Math.ceil(
    scaleExponential(base, totalUpgradeLevels, WORKER_REQUIREMENT_GROWTH) - base,
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
    return MINIMUM_STAFFING_EFFICIENCY
      + (1 - MINIMUM_STAFFING_EFFICIENCY) * calculatePowerPenalty(staffingRatio, UNDERSTAFFING_EXPONENT);
  }

  return 1 + calculateDiminishingBonus(
    staffingRatio - 1,
    OVERSTAFFING_MAXIMUM_BONUS,
    OVERSTAFFING_BONUS_RATE,
  );
}
