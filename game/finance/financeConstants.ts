/** Rolling foreground-time windows available in finance reports. */
export const FINANCE_REPORT_PERIODS = [
  { id: 'minute', label: '1 min', durationMs: 60_000 },
  { id: 'fifteen-minutes', label: '15 min', durationMs: 15 * 60_000 },
  { id: 'hour', label: '1 hour', durationMs: 60 * 60_000 },
  { id: 'ten-hours', label: '10 hours', durationMs: 10 * 60 * 60_000 },
  { id: 'day', label: '24 hours', durationMs: 24 * 60 * 60_000 },
  { id: 'all-time', label: 'All time', durationMs: null },
] as const;
export type FinanceReportPeriod = (typeof FINANCE_REPORT_PERIODS)[number]['id'];

export const FINANCE_TRANSACTION_SOURCES = [
  'admin-adjustment', 'market-purchase', 'market-sale', 'facility-construction', 'facility-upgrade', 'facility-repair',
  'research-investment', 'research-refund', 'research-grant', 'contract-sale', 'loan-proceeds', 'loan-payment',
  'loan-origination-fee', 'loan-search-fee', 'loan-extra-payment-fee', 'loan-prepayment-penalty', 'loan-late-fee',
  'facility-sale', 'forced-asset-liquidation', 'loan-restructure',
] as const;
export type FinanceTransactionSource = (typeof FINANCE_TRANSACTION_SOURCES)[number];
export type FinanceTransactionKind = 'operating' | 'investing' | 'financing' | 'equity';

export const LENDER_TYPES = ['bank', 'investment-fund', 'private-lender', 'quickloan'] as const;
export type LenderType = (typeof LENDER_TYPES)[number];
export const LENDER_TYPE_LABELS: Readonly<Record<LenderType, string>> = {
  bank: 'Bank', 'investment-fund': 'Investment fund', 'private-lender': 'Private lender', quickloan: 'Quickloan',
};

/** One foreground minute is one finance payment cycle. */
export const LOAN_PAYMENT_INTERVAL_MS = 60_000;
/** Standard comparison span for fee-inclusive loan costs; it is not a calendar year. */
export const LOAN_COST_COMPARISON_CYCLES = 52;
export const LOAN_TERM_OPTIONS = [
  { durationMs: 5 * 60_000, label: '5 min' }, { durationMs: 15 * 60_000, label: '15 min' },
  { durationMs: 60 * 60_000, label: '1 hour' }, { durationMs: 10 * 60 * 60_000, label: '10 hours' },
  { durationMs: 24 * 60 * 60_000, label: '24 hours' },
] as const;

export const LOAN_TERMS = {
  minimumAmount: 10, maximumAmount: 1_000_000, minimumDurationPeriods: 5, maximumDurationPeriods: 1_440,
  baseAnnualRate: 0.06, minAnnualRate: 0.03, maxAnnualRate: 0.24, defaultThresholdMissedPayments: 10,
} as const;

/** Foreground-minute debt collection stages, modelled after the Winemaker escalation. */
export const LOAN_COLLECTION = {
  warningMisses: 1,
  penaltyMisses: 3,
  liquidationMisses: 6,
  defaultMisses: 10,
  lateFeeRate: 0.05,
  lateFeeMinimum: 10,
  penaltyInterestRateIncrease: 0.01,
  balanceSurchargeRate: 0.05,
  forcedInventoryRecoveryRate: 0.55,
  forcedFacilityRecoveryRate: 0.55,
  maximumAssetSeizureRate: 0.5,
  voluntaryFacilitySaleRate: 0.7,
  restructureAnnualRate: 0.24,
  restructureTermMultiplier: 2,
  restructureMinimumPeriods: 20,
} as const;

export const CREDIT_RATING_CONFIG = {
  base: 0.55, min: 0.1, max: 0.98, weightAssetHealth: 0.35, weightPaymentHistory: 0.35,
  weightCompanyStability: 0.2, maxNegativePenalty: 0.2, paymentHistoryMissPenalty: 0.08,
  paymentHistoryDefaultPenalty: 0.3,
} as const;
/** Tunable inputs for the company-stability component of a credit rating. */
export const COMPANY_STABILITY_CONFIG = {
  ageTargetHours: 240,
  recentPeriodMs: 15 * 60_000,
  recentPeriodCount: 16,
  starterConsistency: 0.6,
  positiveProfitabilityMultiplier: 1,
  breakEvenProfitabilityMultiplier: 0.75,
  negativeProfitabilityMultiplier: 0.5,
  healthyOperatingMargin: 0.25,
  ageWeight: 0.35,
  consistencyWeight: 0.4,
  efficiencyWeight: 0.25,
} as const;
export const CREDIT_GRADE_THRESHOLDS = [
  { minimumScore: 0.9, grade: 'AAA' }, { minimumScore: 0.84, grade: 'AA' }, { minimumScore: 0.78, grade: 'A' },
  { minimumScore: 0.72, grade: 'BBB+' }, { minimumScore: 0.66, grade: 'BBB' }, { minimumScore: 0.6, grade: 'BBB-' },
  { minimumScore: 0.52, grade: 'BB' }, { minimumScore: 0.44, grade: 'B' }, { minimumScore: 0.36, grade: 'CCC' }, { minimumScore: 0, grade: 'CC' },
] as const;

export const LENDER_TYPE_CONFIG: Readonly<Record<LenderType, {
  count: number; baseAnnualRateRange: readonly [number, number]; riskToleranceRange: readonly [number, number]; flexibilityRange: readonly [number, number];
  loanAmountRange: readonly [number, number]; durationRange: readonly [number, number]; originationFeeBaseRange: readonly [number, number];
  marketCapitalizationRange: readonly [number, number]; maxSingleBorrowerExposureRange: readonly [number, number];
  loanLimitAssetFactorBase: number; loanLimitAssetFactorScore: number; loanLimitRatingFactorBase: number; loanLimitRatingFactorScore: number;
}>> = {
  bank: { count: 4, baseAnnualRateRange: [0.045, 0.08], riskToleranceRange: [0.45, 0.65], flexibilityRange: [0.3, 0.55], loanAmountRange: [300, 1_000_000], durationRange: [20, 1_440], originationFeeBaseRange: [0.008, 0.018], marketCapitalizationRange: [10_000_000, 40_000_000], maxSingleBorrowerExposureRange: [0.03, 0.08], loanLimitAssetFactorBase: 0.28, loanLimitAssetFactorScore: 0.5, loanLimitRatingFactorBase: 0.32, loanLimitRatingFactorScore: 0.55 },
  'investment-fund': { count: 3, baseAnnualRateRange: [0.055, 0.1], riskToleranceRange: [0.35, 0.6], flexibilityRange: [0.4, 0.75], loanAmountRange: [1_000, 1_000_000], durationRange: [16, 1_080], originationFeeBaseRange: [0.01, 0.022], marketCapitalizationRange: [25_000_000, 80_000_000], maxSingleBorrowerExposureRange: [0.04, 0.12], loanLimitAssetFactorBase: 0.33, loanLimitAssetFactorScore: 0.58, loanLimitRatingFactorBase: 0.38, loanLimitRatingFactorScore: 0.62 },
  'private-lender': { count: 4, baseAnnualRateRange: [0.07, 0.14], riskToleranceRange: [0.55, 0.85], flexibilityRange: [0.55, 0.9], loanAmountRange: [50, 250_000], durationRange: [8, 720], originationFeeBaseRange: [0.015, 0.04], marketCapitalizationRange: [500_000, 3_000_000], maxSingleBorrowerExposureRange: [0.05, 0.12], loanLimitAssetFactorBase: 0.22, loanLimitAssetFactorScore: 0.45, loanLimitRatingFactorBase: 0.24, loanLimitRatingFactorScore: 0.5 },
  quickloan: { count: 2, baseAnnualRateRange: [0.12, 0.24], riskToleranceRange: [0.08, 0.26], flexibilityRange: [0.75, 0.98], loanAmountRange: [10, 10_000], durationRange: [5, 360], originationFeeBaseRange: [0.025, 0.08], marketCapitalizationRange: [6_000, 22_000], maxSingleBorrowerExposureRange: [0.08, 0.2], loanLimitAssetFactorBase: 0.1, loanLimitAssetFactorScore: 0.24, loanLimitRatingFactorBase: 0.11, loanLimitRatingFactorScore: 0.28 },
};

export const LENDER_NAME_POOLS: Readonly<Record<LenderType, readonly string[]>> = {
  bank: ['Nordic Industrial Bank', 'Meridian Commercial', 'Foundry National', 'Civic Works Bank', 'Horizon Trust'],
  'investment-fund': ['Northern Growth Fund', 'Foundry Partners', 'Frontier Capital', 'Progress Ventures'],
  'private-lender': ['Forge Private Credit', 'Rivet Lending', 'Ironwood Finance', 'Harbor Merchant Credit'],
  quickloan: ['Rapid Works Cash', 'Instant Forge Credit', 'FastTrack Funds'],
};

export const ADVANCED_LOAN_CONFIG = { minExtraPayment: 25, extraPaymentAdminFeeRate: 0.05, extraPaymentAdminFeeMin: 10, prepaymentPenaltyRate: 0.02, prepaymentPenaltyMin: 15, prepaymentPenaltyMaxRate: 0.08, missedPaymentRateBump: 0.0025 } as const;
export const LENDER_OFFER_CONFIG = { defaultOfferCount: 3, maximumOfferCount: 10, minCreditGapTolerance: 0.35 } as const;
/** Foreground work required to complete a lender search. Selective searches take longer. */
export const LENDER_SEARCH_CONFIG = {
  baseCost: 10,
  costPerActiveParameter: 25,
  costSelectivityExponent: 1.25,
  baseWorkMs: 60_000,
  maximumTypeFilterWorkBonus: 0.5,
  quickloanOnlyWorkMultiplier: 0.35,
} as const;
export const ECONOMY_PHASES = ['crash', 'recession', 'stable', 'expansion', 'boom'] as const;
export type EconomyPhase = (typeof ECONOMY_PHASES)[number];
export const ECONOMY_INTEREST_MULTIPLIERS: Readonly<Record<EconomyPhase, number>> = { crash: 1.35, recession: 1.16, stable: 1, expansion: 0.93, boom: 0.86 };
/** Ten-minute deterministic economy transitions favour returning to Stable. */
export const ECONOMY_TRANSITION = {
  periodMs: 10 * 60_000,
  edgeReturnProbability: 0.35,
  middleReturnProbability: 0.35,
  middleWorsenProbability: 0.1,
  stableShiftProbability: 0.15,
} as const;
