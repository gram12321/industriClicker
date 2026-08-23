import {
  QUALITY_INPUT_BONUS,
  QUALITY_LEVEL_CURVE_RATE,
  QUALITY_LEVEL_CURVE_SHAPE,
  QUALITY_NUMERIC_CEILING,
  QUALITY_PRODUCTION_BASE_OUTPUT,
  QUALITY_PRODUCTION_PROGRESS_EXPONENT,
} from './qualityConstants';

export type QualityLimits = {
  inputMaxQ: number;
  researchMaxQ: number;
  upgradeMaxQ: number;
  productionMaxQ: number;
  staffMaxQ: number;
};

export type OutputQualityBreakdown = QualityLimits & { outputQ: number };

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** Converts a progress value into a quality value that approaches, but never reaches, Q100. */
export function calculateQualityFromProgress(progress: number): number {
  const safeProgress = finiteNonNegative(progress);
  if (safeProgress === 0) return 1;
  if (safeProgress === 1) return 2;

  const remainingFraction = Math.exp(-QUALITY_LEVEL_CURVE_RATE * Math.pow(safeProgress, QUALITY_LEVEL_CURVE_SHAPE));
  return Math.min(QUALITY_NUMERIC_CEILING, 1 + (QUALITY_NUMERIC_CEILING - 1) * (1 - remainingFraction));
}

/** Research quality for a completed resource-quality level. Level 0 is the Q1 baseline. */
export function calculateResearchMaxQ(level: number): number {
  return calculateQualityFromProgress(Math.floor(finiteNonNegative(level)));
}

/** Facility quality for an instance. Level 1 is the Q1 baseline; level 2 is Q2. */
export function calculateUpgradeMaxQ(level: number): number {
  return calculateQualityFromProgress(Math.max(0, Math.floor(finiteNonNegative(level)) - 1));
}

/** Company-wide mastery quality from lifetime output of the resource. */
export function calculateProductionMaxQ(lifetimeProduction: number): number {
  const safeProduction = finiteNonNegative(lifetimeProduction);
  const progress = Math.pow(safeProduction / QUALITY_PRODUCTION_BASE_OUTPUT, QUALITY_PRODUCTION_PROGRESS_EXPONENT);
  return calculateQualityFromProgress(progress);
}

/** Weighted average of consumed input qualities. No inputs impose no input ceiling. */
export function calculateWeightedInputQ(inputs: readonly { amount: number; quality: number }[]): number | null {
  let totalAmount = 0;
  let weightedQuality = 0;
  for (const input of inputs) {
    if (!Number.isFinite(input.amount) || input.amount <= 0 || !Number.isFinite(input.quality) || input.quality <= 0) continue;
    totalAmount += input.amount;
    weightedQuality += input.amount * input.quality;
  }
  return totalAmount > 0 ? weightedQuality / totalAmount : null;
}

export function calculateInputMaxQ(weightedInputQ: number | null): number {
  return weightedInputQ === null ? Number.POSITIVE_INFINITY : Math.max(1, weightedInputQ + QUALITY_INPUT_BONUS);
}

/** Applies the applicable quality ceilings to one facility output. */
export function calculateOutputQuality(limits: Partial<QualityLimits> & { weightedInputQ?: number | null }): OutputQualityBreakdown {
  const inputMaxQ = limits.inputMaxQ ?? calculateInputMaxQ(limits.weightedInputQ ?? null);
  const researchCandidate = limits.researchMaxQ ?? QUALITY_NUMERIC_CEILING;
  const upgradeCandidate = limits.upgradeMaxQ ?? QUALITY_NUMERIC_CEILING;
  const productionCandidate = limits.productionMaxQ ?? QUALITY_NUMERIC_CEILING;
  const staffCandidate = limits.staffMaxQ ?? QUALITY_NUMERIC_CEILING;
  const researchMaxQ = Number.isFinite(researchCandidate) && researchCandidate > 0 ? researchCandidate : QUALITY_NUMERIC_CEILING;
  const upgradeMaxQ = Number.isFinite(upgradeCandidate) && upgradeCandidate > 0 ? upgradeCandidate : QUALITY_NUMERIC_CEILING;
  const productionMaxQ = Number.isFinite(productionCandidate) && productionCandidate > 0 ? productionCandidate : QUALITY_NUMERIC_CEILING;
  const staffMaxQ = Number.isFinite(staffCandidate) && staffCandidate > 0 ? staffCandidate : QUALITY_NUMERIC_CEILING;
  const outputQ = Math.min(researchMaxQ, ...(Number.isFinite(inputMaxQ) ? [inputMaxQ] : []), upgradeMaxQ, productionMaxQ, staffMaxQ, QUALITY_NUMERIC_CEILING);
  return { inputMaxQ, researchMaxQ, upgradeMaxQ, productionMaxQ, staffMaxQ, outputQ };
}
