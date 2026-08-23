/** The player-facing theoretical ceiling; runtime values are clamped below it. */
export const QUALITY_THEORETICAL_MAXIMUM = 100;
export const QUALITY_NUMERIC_CEILING = QUALITY_THEORETICAL_MAXIMUM - 0.000001;

/** Production may improve quality by one absolute point over its weighted inputs. */
export const QUALITY_INPUT_BONUS = 1;

/** Premium Cake adds one Q (the player-facing equivalent of +100% quality) after normal output limits apply. */
export const QUALITY_PREMIUM_CAKE_OUTPUT_BONUS = 1;

/** Shared diminishing-return curve for research and facility quality levels. */
export const QUALITY_LEVEL_CURVE_RATE = Math.log(99 / 98);
export const QUALITY_LEVEL_CURVE_SHAPE = 1.1;

/** Lifetime production is normalized before entering the shared quality curve. */
export const QUALITY_PRODUCTION_BASE_OUTPUT = 100;
export const QUALITY_PRODUCTION_PROGRESS_EXPONENT = 0.5;

/** Quality research balance is independent from the quality-value curve. */
export const RESOURCE_QUALITY_BASE_RESEARCH_COST = 100;
export const RESOURCE_QUALITY_BASE_RESEARCH_DURATION_MS = 30_000;
export const RESOURCE_QUALITY_RESEARCH_COST_GROWTH = 1.12;
export const RESOURCE_QUALITY_RESEARCH_DURATION_GROWTH = 1.08;
