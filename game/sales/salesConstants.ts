import type { NormalizationControlPoint } from '@/game/core/math';

/** The number of unfulfilled contracts treated as the probability curve's theoretical maximum. */
export const SALES_CONTRACT_UNFULFILLED_THEORETICAL_MAXIMUM = 1_000_000;
export const SALES_CONTRACT_UNFULFILLED_CHANCE_CONTROL_POINTS = [
  { input: 0, normalized: 0 },
  { input: 3, normalized: 0.25 },
  { input: 5, normalized: 0.5 },
  { input: 10, normalized: 0.75 },
  { input: SALES_CONTRACT_UNFULFILLED_THEORETICAL_MAXIMUM, normalized: 1 - Number.EPSILON },
] as const satisfies readonly NormalizationControlPoint[];
export const SALES_CONTRACT_MIN_REQUEST_QUANTITY = 1;
export const SALES_CONTRACT_MAX_REQUEST_QUANTITY = 10;
