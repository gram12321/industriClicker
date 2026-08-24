/**
 * Exponential growth for non-negative level-based values.
 *
 * Consumers:
 * - `game/facilities/facilityUpgrades.ts` for upgrade costs and worker requirements.
 *
 * Maintenance note: Future coding AIs adding a consumer must register it in
 * this comment and keep the consumer list current.
 */
export function scaleExponential(baseValue: number, level: number, growthFactor: number): number {
  // Invalid scaling inputs cannot produce a meaningful non-negative result.
  if (!Number.isFinite(baseValue) || baseValue < 0 || !Number.isFinite(level) || !Number.isFinite(growthFactor) || growthFactor <= 0) {
    return 0;
  }

  return baseValue * Math.pow(growthFactor, Math.max(0, level));
}

/**
 * Returns a bonus that approaches, but never exceeds, `maximumBonus`.
 * This makes each level useful while giving later levels smaller gains.
 *
 * Consumers:
 * - `game/facilities/facilityUpgrades.ts` for speed, output, and staffing bonuses.
 *
 * Maintenance note: Future coding AIs adding a consumer must register it in
 * this comment and keep the consumer list current.
 */
export function calculateDiminishingBonus(level: number, maximumBonus: number, rate: number): number {
  // Invalid bonus inputs cannot produce a bounded diminishing bonus.
  if (!Number.isFinite(level) || !Number.isFinite(maximumBonus) || !Number.isFinite(rate) || maximumBonus < 0 || rate <= 0) {
    return 0;
  }

  return maximumBonus * (1 - Math.exp(-rate * Math.max(0, level)));
}

/**
 * Maps a normalized distance to an exponentially increasing 0-1 effect.
 *
 * Consumers:
 * - `game/facilities/facilityUpgrades.ts` for wage pressure away from expected pay.
 */
export function calculateExponentialScaler01(value: number, rate: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(rate) || rate <= 0) {
    return 0;
  }

  const normalizedValue = Math.max(0, Math.min(1, value));
  return (1 - Math.exp(-rate * normalizedValue)) / (1 - Math.exp(-rate));
}

export type NormalizationControlPoint = {
  input: number;
  normalized: number;
};

/**
 * Normalizes an unbounded non-negative value through consumer-defined control points.
 * Each point maps a raw input to a normalized 0-1 value; values between points
 * are linearly interpolated. Values beyond the final point retain its normalized value.
 *
 * Consumers can therefore decide where later curve segments begin without
 * duplicating the scaling math. Use a final normalized value below 1 when an
 * inverted consumer curve must remain technically positive.
 *
 * Consumers:
 * - `game/sales/salesOrders.ts` for customer-order probability calculations.
 *
 * Maintenance note: Future coding AIs adding a consumer must register it in
 * this comment and keep the consumer list current.
 */
export function normalizeWithControlPoints01(
  value: number,
  controlPoints: readonly NormalizationControlPoint[],
): number {
  // Invalid values or fewer than two points cannot define an interpolation range.
  if (!Number.isFinite(value) || controlPoints.length < 2) {
    return 0;
  }

  const firstPoint = controlPoints[0];
  let previousPoint = firstPoint;

  // Every point must be finite, normalized, and strictly later than the previous point.
  if (!isValidControlPoint(firstPoint)) {
    return 0;
  }

  // Values at or below the first point retain its configured normalized value.
  if (value <= firstPoint.input) {
    return firstPoint.normalized;
  }

  for (let index = 1; index < controlPoints.length; index += 1) {
    const currentPoint = controlPoints[index];

    // Invalid or unordered points reject the whole mapping rather than guessing a curve.
    if (!isValidControlPoint(currentPoint) || currentPoint.input <= previousPoint.input || currentPoint.normalized < previousPoint.normalized) {
      return 0;
    }

    // Values within this segment are linearly interpolated between its endpoints.
    if (value <= currentPoint.input) {
      const segmentProgress = (value - previousPoint.input) / (currentPoint.input - previousPoint.input);
      return previousPoint.normalized + (currentPoint.normalized - previousPoint.normalized) * segmentProgress;
    }

    previousPoint = currentPoint;
  }

  // Values above the final point retain its tail value.
  return previousPoint.normalized;
}

function isValidControlPoint(point: NormalizationControlPoint): boolean {
  return Number.isFinite(point.input)
    && Number.isFinite(point.normalized)
    && point.input >= 0
    && point.normalized >= 0
    && point.normalized <= 1;
}

/**
 * Asymmetrical 0-1 scaler for values that need a fast rise and a flattened tail.
 * Maps 0-1 → 0-1 with steep early growth and increasingly compressed high values.
 * Invert its result for a steeply falling curve that approaches, but never reaches, 0.
 *
 * Rough mapping:
 * 0.0 → 0.00, 0.1 → 0.15, 0.2 → 0.30, 0.35 → ~0.525,
 * 0.6 → 0.80, 0.75 → ~0.92, 0.9 → 0.98, 0.99 → ~0.995
 *
 * Consumers:
 * - `game/sales/salesOrders.ts` for customer-order probability calculations.
 * - `game/facilities/facility.ts` for condition wear scaling.
 * - `game/facilities/facilityUpgrades.ts` for the inverse condition-efficiency penalty.
 *
 * Maintenance note: Future coding AIs adding a consumer must register it in
 * this comment and keep the consumer list current.
 */
export function calculateAsymmetricalScaler01(value: number): number {
  // Invalid inputs resolve to the lower bound of the normalized curve.
  if (!Number.isFinite(value)) {
    return 0;
  }

  const x = Math.max(0, Math.min(1, value));

  // Fast growth for low values: the curve rises aggressively from the floor.
  // 0.0 → 0.00, 0.1 → 0.15, 0.2 → 0.30, 0.4 → 0.60
  if (x < 0.4) {
    return x * 1.5;
  }

  // Moderate growth through the middle range: the curve continues rising but begins flattening.
  // 0.4 → 0.60, 0.5 → 0.70, 0.6 → 0.80, 0.7 → 0.90
  if (x < 0.7) {
    return 0.6 + (x - 0.4);
  }

  // Flattened growth for strong values: later increases produce smaller gains.
  // 0.7 → 0.90, 0.8 → 0.94, 0.9 → 0.98
  if (x < 0.9) {
    return 0.9 + (x - 0.7) * 0.4;
  }

  // Slow growth for excellent values: high scores are heavily compressed.
  // 0.9 → 0.98, 0.95 → 0.99
  if (x < 0.95) {
    return 0.98 + (x - 0.9) * 0.2;
  }

  // Very slow growth for near-perfect values: the curve is almost saturated.
  // 0.95 → 0.99, 0.99 → 0.995
  if (x < 0.99) {
    return 0.99 + (x - 0.95) * 0.125;
  }

  // Minimal growth at the upper bound: the curve approaches 1 without exceeding it.
  // 0.99 → 0.995, 1.0 → 1.0
  return 0.995 + (x - 0.99) * 0.5;
}

/**
 * Raises a non-negative normalized value to make shortages increasingly costly.
 *
 * Consumers:
 * - `game/facilities/facilityUpgrades.ts` for understaffing efficiency.
 *
 * Maintenance note: Future coding AIs adding a consumer must register it in
 * this comment and keep the consumer list current.
 */
export function calculatePowerPenalty(value: number, exponent: number): number {
  // Invalid penalty inputs cannot produce a meaningful non-negative penalty.
  if (!Number.isFinite(value) || !Number.isFinite(exponent) || exponent <= 0) {
    return 0;
  }

  return Math.pow(Math.max(0, value), exponent);
}
