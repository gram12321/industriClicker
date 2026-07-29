/** Reusable deterministic curves for level-based game systems. */
export function scaleExponential(baseValue: number, level: number, growthFactor: number): number {
  if (!Number.isFinite(baseValue) || baseValue < 0 || !Number.isFinite(level) || !Number.isFinite(growthFactor) || growthFactor <= 0) {
    return 0;
  }

  return baseValue * Math.pow(growthFactor, Math.max(0, level));
}

/**
 * Returns a bonus that approaches, but never exceeds, `maximumBonus`.
 * This makes each level useful while giving later levels smaller gains.
 */
export function calculateDiminishingBonus(level: number, maximumBonus: number, rate: number): number {
  if (!Number.isFinite(level) || !Number.isFinite(maximumBonus) || !Number.isFinite(rate) || maximumBonus < 0 || rate <= 0) {
    return 0;
  }

  return maximumBonus * (1 - Math.exp(-rate * Math.max(0, level)));
}

/** Raises a non-negative normalized value to make shortages increasingly costly. */
export function calculatePowerPenalty(value: number, exponent: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(exponent) || exponent <= 0) {
    return 0;
  }

  return Math.pow(Math.max(0, value), exponent);
}
